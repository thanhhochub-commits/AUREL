"""Refresh independently verifiable CafeF public-source cache for AUREL Pages.

No invented reports, no unauthorized/private API. When a source fails, retain
prior successfully obtained records from the earlier cache (marked with its time).
"""
from __future__ import annotations
import concurrent.futures
import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from aurel_cafef import lookup_cafef

DEST = ROOT / "assets" / "cafef-cache.json"
BANKS = (
    "ACB", "BID", "CTG", "VCB", "VPB", "TCB", "MBB", "HDB", "VIB", "STB",
    "TPB", "LPB", "SHB", "SSB", "MSB", "OCB", "EIB", "BAB", "BVB", "NAB",
    "KLB", "PGB", "NVB", "SGB", "ABB", "VBB", "BVB", "BID", "AGR", "BSI"
)
SYMBOLS = tuple(dict.fromkeys(BANKS))
def existing():
    try:
        obj = json.loads(DEST.read_text("utf-8"))
        return obj.get("symbols") or {}
    except (OSError, ValueError):
        return {}

def one(symbol):
    try:
        result = lookup_cafef(symbol)
        actual = sum(len(result.get(k, [])) for k in ("reports", "disclosures", "market_news"))
        print(f"CAFEF {symbol}: {actual} records, {result.get('status')} | errors={result.get('messages')}", flush=True)
        return symbol, result
    except Exception as exc:
        print(f"CAFEF {symbol}: FETCH ERROR {type(exc).__name__}: {str(exc)[:150]}", flush=True)
        return symbol, None

def probe_render():
    url = "https://aurel-thanhhochub-backend.onrender.com/api/cafef?symbol=VPB"
    try:
        start = time.monotonic()
        req = Request(url, headers={"User-Agent": "AUREL-cache-healthcheck/1.0"})
        with urlopen(req, timeout=24) as response:
            data = response.read(512)
            print("RENDER PROBE", response.status, "seconds", round(time.monotonic()-start,1), data[:160], flush=True)
    except Exception as exc:
        print("RENDER PROBE ERROR", type(exc).__name__, str(exc)[:160], flush=True)

def main():
    previous = existing()
    symbols = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        futures = [pool.submit(one, s) for s in SYMBOLS]
        for future in concurrent.futures.as_completed(futures):
            symbol, result = future.result()
            if result and any(result.get(k) for k in ("reports", "disclosures", "market_news")):
                symbols[symbol] = result
            elif symbol in previous:
                symbols[symbol] = previous[symbol]
    obj = {
        "source": "CafeF",
        "mode": "public-source-cache",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "notice": "Links to CafeF disclosures and public RSS only; not an official licensed API; data never automatically overrides AUREL financial records.",
        "symbols": {k:symbols[k] for k in sorted(symbols)}
    }
    if not symbols:
        print("CAFEF CACHE: ALL SOURCES EMPTY; retaining old nonempty cache.", flush=True)
        if previous:
            return 0
        return 1
    DEST.parent.mkdir(parents=True, exist_ok=True)
    DEST.write_text(json.dumps(obj, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print("CAFEF CACHE COMPLETE:", len(symbols), "symbols", DEST.stat().st_size, "bytes", flush=True)
    probe_render()
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
