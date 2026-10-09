"""CafeF read-only public-source adapter for the AUREL overview.

This is NOT an official CafeF API or an automatic import of audited statements.
We only expose source links and recent public titles; no financial values are fabricated.
"""
from __future__ import annotations

import re
import threading
import time
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from html.parser import HTMLParser
from urllib.parse import urljoin, urlsplit
from urllib.request import Request, urlopen

_CACHE = {}
_LOCK = threading.Lock()
_TTL = 1200
_USER_AGENT = "AUREL-Financial-Intelligence/1.0 (read-only public RSS and disclosures)"


def _source_url(path):
    return "https://cafef.vn/" + path.lstrip("/")


def _fetch_public(url, max_bytes=1_000_000):
    host = (urlsplit(url).hostname or "").lower()
    if host != "cafef.vn" and not host.endswith(".cafef.vn"):
        raise ValueError("Nguồn ngoài CafeF không được hỗ trợ.")
    req = Request(url, headers={
        "User-Agent": _USER_AGENT,
        "Accept": "text/html,application/rss+xml,application/xml;q=0.9,*/*;q=0.5",
        "Accept-Language": "vi-VN,vi;q=0.9",
    })
    with urlopen(req, timeout=9) as response:
        final_host = (urlsplit(response.geturl()).hostname or "").lower()
        if final_host != "cafef.vn" and not final_host.endswith(".cafef.vn"):
            raise ValueError("CafeF chuyển hướng tới nguồn không được hỗ trợ.")
        data = response.read(max_bytes + 1)
        if len(data) > max_bytes:
            raise ValueError("Phản hồi từ CafeF vượt giới hạn.")
        content_type = response.headers.get_content_charset()
    for charset in (content_type, "utf-8-sig", "utf-8", "cp1258"):
        if not charset:
            continue
        try:
            return data.decode(charset)
        except (LookupError, UnicodeError):
            pass
    return data.decode("utf-8", errors="replace")


class _Links(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.links = []
        self._href = None
        self._parts = []

    def handle_starttag(self, tag, attrs):
        if tag == "a" and self._href is None:
            self._href = dict(attrs).get("href") or ""
            self._parts = []

    def handle_data(self, data):
        if self._href is not None:
            self._parts.append(data)

    def handle_endtag(self, tag):
        if tag == "a" and self._href is not None:
            title = re.sub(r"\s+", " ", " ".join(self._parts)).strip()
            if title:
                self.links.append((title, self._href))
            self._href = None
            self._parts = []


def _company_disclosures(symbol, url):
    parser = _Links()
    parser.feed(_fetch_public(url))
    results, seen = [], set()
    for title, href in parser.links:
        href = urljoin(url, href)
        parsed = urlsplit(href)
        host = (parsed.hostname or "").lower()
        if (host != "cafef.vn" and not host.endswith(".cafef.vn")) or parsed.scheme != "https":
            continue
        if len(title) < 16 or len(title) > 240 or not parsed.path.lower().endswith(".chn"):
            continue
        # Only the requested company's own disclosures are eligible.
        # Generic cross-company headlines appear around the event table and
        # must not be mistaken for statements of this selected company.
        if not re.match(r"^\s*" + re.escape(symbol) + r"\s*:", title, re.I):
            continue
        low = title.lower()
        if (title, href) in seen:
            continue
        seen.add((title, href))
        # A commentary ABOUT a BCTC is not the financial statement itself.
        # Keep these reports separate so the UI never advertises a fake PDF.
        headline = re.sub(r"^\s*" + re.escape(symbol) + r"\s*:\s*", "", title, flags=re.I)
        is_report = bool(re.match(
            r"^(?:báo cáo tài chính|bctc)(?:\s|$)|^báo cáo bán niên.*tài chính",
            headline, re.I,
        ))
        # The dedicated symbol disclosures page is the source context.
        results.append({"title": title[:220], "url": href, "type": "bctc" if is_report else "cong_bo", "source": "CafeF - công bố doanh nghiệp"})
        if len(results) >= 45:
            break
    reports = [item for item in results if item["type"] == "bctc"][:8]
    other = [item for item in results if item["type"] != "bctc"][:10]
    return reports, other



class _FinancialTablePeriods(HTMLParser):
    """Capture report-period labels in actual CafeF financial table cells."""
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.cells = []
        self._depth = 0
        self._parts = []

    def handle_starttag(self, tag, attrs):
        if tag in ("th", "td"):
            if not self._depth:
                self._parts = []
            self._depth += 1

    def handle_data(self, data):
        if self._depth:
            self._parts.append(data)

    def handle_endtag(self, tag):
        if tag in ("th", "td") and self._depth:
            self._depth -= 1
            if not self._depth:
                txt = re.sub(r"\s+", " ", " ".join(self._parts)).strip()
                if len(txt) <= 90 and txt:
                    self.cells.append(txt)
                self._parts = []


def _financial_period_reports(symbol, financial_url):
    """Only list periods explicitly visible in CafeF tables, never fabricated PDFs."""
    import calendar
    html = _fetch_public(financial_url, max_bytes=3_000_000)
    parser = _FinancialTablePeriods()
    parser.feed(html)

    periods = {}
    current = datetime.now(timezone.utc).date()
    for cell in parser.cells:
        quarter = re.fullmatch(
            r"Quý\s*([1-4])\s*[-/]\s*(20\d{2})(?:\s*\([^)]*\))?",
            cell, flags=re.I,
        )
        annual = re.fullmatch(
            r"Năm\s*(20\d{2})(?:\s*\([^)]*\))?",
            cell, flags=re.I,
        )
        if quarter:
            q, year = int(quarter.group(1)), int(quarter.group(2))
            month = q * 3
            end_day = calendar.monthrange(year, month)[1]
            end_date = f"{year:04d}-{month:02d}-{end_day:02d}"
            label = f"Quý {q}/{year}"
            key = ("quarter", year, q)
        elif annual:
            year = int(annual.group(1))
            end_date = f"{year:04d}-12-31"
            label = f"năm {year}"
            key = ("annual", year, 0)
        else:
            continue
        if not 2017 <= year <= current.year or end_date > current.isoformat():
            continue
        periods[key] = {
            "title": f"{symbol}: Dữ liệu BCTC {label} (CAFEF)",
            "url": financial_url,
            "period_end": end_date,
            "source": "CAFEF - bảng số liệu, không phải PDF gốc",
            "type": "bctc_data",
        }

    return sorted(periods.values(), key=lambda item: item["period_end"], reverse=True)[:16]


def _market_rss():
    root = ET.fromstring(_fetch_public("https://cafef.vn/thi-truong-chung-khoan.rss"))
    out = []
    for item in root.findall(".//item")[:12]:
        title = re.sub(r"\s+", " ", item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        p = urlsplit(link)
        host = (p.hostname or "").lower()
        if not title or p.scheme != "https" or (host != "cafef.vn" and not host.endswith(".cafef.vn")):
            continue
        raw_date = (item.findtext("pubDate") or "").strip()
        date = None
        if raw_date:
            try:
                date = parsedate_to_datetime(raw_date).astimezone(timezone.utc).isoformat()
            except (TypeError, ValueError, OverflowError):
                pass
        out.append({"title": title[:220], "url": link, "date": date, "source": "CafeF - RSS thị trường"})
        if len(out) >= 8:
            break
    return out


def lookup_cafef(symbol):
    symbol = str(symbol or "").strip().upper()
    if not re.fullmatch(r"[A-Z0-9]{2,6}", symbol):
        raise ValueError("Mã chứng khoán phải gồm 2–6 ký tự chữ hoặc số.")
    now = time.time()
    with _LOCK:
        found = _CACHE.get(symbol)
        if found and now - found[0] < _TTL:
            return found[1]

    company_url = _source_url(f"du-lieu/{symbol.lower()}/thong-tin-chung.chn")
    financial_url = _source_url(f"du-lieu/{symbol.lower()}/bao-cao-tai-chinh.chn")
    disclosures_url = _source_url(f"du-lieu/tin-doanh-nghiep/{symbol.lower()}/event.chn")
    document_url = _source_url("du-lieu/cong-bo-thong-tin.chn")
    reports, disclosures, market_news = [], [], []
    errors = []
    try:
        reports, disclosures = _company_disclosures(symbol, disclosures_url)
    except Exception:
        errors.append("Chưa tải được danh sách công bố của doanh nghiệp từ CafeF.")
    try:
        period_reports = _financial_period_reports(symbol, financial_url)
        if not period_reports:
            period_reports = _financial_period_reports(symbol, company_url)
        reports = reports + period_reports
    except Exception:
        try:
            reports = reports + _financial_period_reports(symbol, company_url)
        except Exception:
            errors.append("Chưa tải được các kỳ số liệu BCTC từ trang tài chính CafeF.")
    try:
        market_news = _market_rss()
    except Exception:
        errors.append("Chưa tải được nguồn RSS thị trường CafeF.")

    out = {
        "symbol": symbol,
        "provider": "CafeF",
        "official_api": False,
        "data_mode": "nguon_cong_khai",
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
        "links": {"company": company_url, "financial": financial_url,
                  "disclosures": disclosures_url, "documents": document_url},
        "reports": reports,
        "disclosures": disclosures,
        "market_news": market_news,
        "messages": errors,
        "status": "ok" if reports or disclosures or market_news else "source_unavailable",
        "note": "Nguồn dữ liệu công khai; chưa có API chính thức hoặc đồng bộ tự động số liệu BCTC vào AUREL. Đối chiếu BCTC gốc trước khi phân tích.",
    }
    with _LOCK:
        if len(_CACHE) > 70:
            _CACHE.clear()
        _CACHE[symbol] = (now, out)
    return out
