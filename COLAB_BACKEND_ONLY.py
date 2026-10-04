# AUREL COLAB BACKEND ONLY - FAST LAUNCHER
# Chay 1 o tren Google Colab. Khong nhung HTML/CSS, khong Streamlit/WebSocket.
# Backend va cong thuc luon duoc tai tu server.py moi nhat tren GitHub.

import base64, hashlib, importlib.util, json, os, pathlib, socket, subprocess, sys, time, urllib.error, urllib.request

REPO_RAW = "https://raw.githubusercontent.com/thanhhochub-commits/AUREL/main/server.py"
ROOT = pathlib.Path("/content/aurel_backend_only") if pathlib.Path("/content").exists() else pathlib.Path("/mnt/data/aurel_backend_only")
ROOT.mkdir(parents=True, exist_ok=True)
SERVER = ROOT / "server.py"
LOG = ROOT / "server.log"

# 1) Chi cai dependency bi thieu. Tranh pip lai moi lan re-run runtime.
deps = {
    "openpyxl": "openpyxl>=3.1,<4",
    "pypdf": "pypdf>=5,<7",
    "reportlab": "reportlab>=4,<5",
    "fitz": "PyMuPDF>=1.24,<2",
    "pytesseract": "pytesseract>=0.3.13,<0.4",
    "PIL": "Pillow>=10,<13",
    "pdf2image": "pdf2image>=1.17,<2",
}
missing = [pkg for mod,pkg in deps.items() if importlib.util.find_spec(mod) is None]
if missing:
    print("Cai Python dependency con thieu:", ", ".join(missing))
    subprocess.run([sys.executable, "-m", "pip", "install", "-q", *missing], check=True)

# 2) OCR system package. Chi cai phan that su thieu.
if pathlib.Path("/content").exists():
    import shutil
    apt = []
    if not shutil.which("tesseract"):
        apt += ["tesseract-ocr", "tesseract-ocr-vie"]
    else:
        try:
            langs = subprocess.check_output(["tesseract","--list-langs"], stderr=subprocess.STDOUT, text=True, timeout=10)
        except Exception:
            langs = ""
        if "vie" not in {x.strip() for x in langs.splitlines()}:
            apt.append("tesseract-ocr-vie")
    if not shutil.which("pdftoppm"):
        apt.append("poppler-utils")
    if apt:
        print("Cai OCR system package con thieu:", ", ".join(apt))
        subprocess.run(["apt-get","update","-qq"], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        subprocess.run(["apt-get","install","-y","-qq",*sorted(set(apt))], check=True,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

# 3) Doc secrets tu Colab neu co. Khong in gia tri secret.
if pathlib.Path("/content").exists():
    try:
        from google.colab import userdata
        for key in ("GEMINI_API_KEY","AUREL_BREVO_API_KEY","AUREL_BREVO_SENDER",
                    "AUREL_GMAIL_USER","AUREL_GMAIL_APP_PASSWORD","AUREL_GEMINI_MODEL"):
            try:
                value = userdata.get(key)
            except Exception:
                value = None
            if value:
                os.environ[key] = value
    except Exception:
        pass

# 4) Tai backend moi nhat. Khong mang theo web 1.2MB trong notebook.
req = urllib.request.Request(REPO_RAW, headers={"User-Agent":"AUREL-Colab/1.0","Cache-Control":"no-cache"})
with urllib.request.urlopen(req, timeout=30) as r:
    source = r.read()
if len(source) < 50000 or b"def build_server" not in source:
    raise RuntimeError("server.py tai ve khong hop le.")
SERVER.write_bytes(source)
print(f"Backend: {len(source)/1024:.1f} KB -> {SERVER}")

# 5) Dung server cu neu re-run cung notebook.
try:
    if "aurel_proc" in globals() and aurel_proc is not None and aurel_proc.poll() is None:
        aurel_proc.terminate()
        try:
            aurel_proc.wait(timeout=3)
        except Exception:
            aurel_proc.kill()
except Exception:
    pass

def _free_port():
    for port in range(8501, 8561):
        with socket.socket() as s:
            try:
                s.bind(("127.0.0.1", port))
                return port
            except OSError:
                pass
    raise RuntimeError("Khong con cong trong 8501-8560. Hay Restart runtime.")

AUREL_PORT = _free_port()
AUREL_LOCAL = f"http://127.0.0.1:{AUREL_PORT}"

# Log HTTP mac dinh tat de polling PDF khong lam cham Colab.
env = {
    **os.environ,
    "PYTHONUNBUFFERED":"1",
    "AUREL_HOST":"127.0.0.1",
    "AUREL_PORT":str(AUREL_PORT),
    "PORT":str(AUREL_PORT),
    "AUREL_HTTP_LOG":"0",
}
aurel_log_handle = open(LOG, "w", encoding="utf-8", buffering=1)
aurel_proc = subprocess.Popen(
    [sys.executable, "-u", str(SERVER)],
    stdout=aurel_log_handle,
    stderr=subprocess.STDOUT,
    env=env,
    start_new_session=True,
)

ready = False
for _ in range(60):
    if aurel_proc.poll() is not None:
        break
    try:
        with urllib.request.urlopen(AUREL_LOCAL + "/health", timeout=1.0) as r:
            ready = json.loads(r.read().decode("utf-8")).get("status") == "ok"
        if ready:
            break
    except Exception:
        time.sleep(0.35)

if not ready:
    aurel_log_handle.flush()
    tail = LOG.read_text("utf-8", errors="replace")[-8000:] if LOG.exists() else ""
    raise RuntimeError("AUREL backend khong khoi dong duoc. Log:\n" + tail)

with urllib.request.urlopen(AUREL_LOCAL + "/api/session", timeout=5) as r:
    _session = json.loads(r.read().decode("utf-8"))
AUREL_TOKEN = _session["token"]

def aurel_api(route, data=None, timeout=120):
    """Goi API AUREL truc tiep tu Colab."""
    route = str(route).lstrip("/")
    url = AUREL_LOCAL + "/" + route
    headers = {"X-Aurel-Token":AUREL_TOKEN}
    body = None
    if data is not None:
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=body, headers=headers, method="POST" if data is not None else "GET")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            raw = r.read()
            ct = r.headers.get("Content-Type","")
            return json.loads(raw.decode("utf-8")) if "json" in ct else raw
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace")
        try:
            msg = json.loads(raw).get("error", raw)
        except Exception:
            msg = raw
        raise RuntimeError(f"HTTP {e.code}: {msg}") from e

def aurel_state(bank="", year=None):
    from urllib.parse import urlencode
    q = urlencode({"bank":bank or "", "year":"" if year is None else int(year)})
    return aurel_api("api/state?" + q)

def aurel_upload(path, replace=False):
    """Upload CSV/XLSX/PDF theo chunk, khong nap ca file vao RAM."""
    path = pathlib.Path(path)
    if not path.is_file():
        raise FileNotFoundError(path)
    size = path.stat().st_size
    if size <= 0 or size > 40*1024*1024:
        raise ValueError("File rong hoac lon hon 40 MB.")
    h = hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda:f.read(1024*1024), b""):
            h.update(block)
    start = aurel_api("api/upload/start", {
        "name":path.name, "size":size, "sha256":h.hexdigest(), "replace":bool(replace)
    }, timeout=30)
    upload_id = start["upload_id"]
    chunk_bytes = int(start.get("chunk_bytes") or 131072)
    offset = 0
    with path.open("rb") as f:
        while True:
            part = f.read(chunk_bytes)
            if not part:
                break
            aurel_api("api/upload/chunk", {
                "upload_id":upload_id,
                "offset":offset,
                "base64":base64.b64encode(part).decode("ascii"),
            }, timeout=30)
            offset += len(part)
    result = aurel_api("api/upload/complete", {"upload_id":upload_id}, timeout=180)
    print("✓", result.get("message","Upload xong"))
    return result

def aurel_pdf_analyze(name, bank="", year=None, unit="auto", poll_seconds=1.2):
    """Chay OCR nen; chi in khi progress thay doi de notebook khong bi spam."""
    started = aurel_api("api/pdf/analyze/start", {
        "name":str(name), "bank":str(bank or ""), "year":year, "unit":unit
    }, timeout=30)
    jid = started["job_id"]
    last = None
    deadline = time.monotonic() + 20*60
    while time.monotonic() < deadline:
        st = aurel_api("api/pdf/job?id=" + urllib.parse.quote(jid), timeout=30)
        marker = (st.get("status"), st.get("progress"), st.get("message"))
        if marker != last:
            print(f"[{st.get('progress',0):>3}%] {st.get('message','')}")
            last = marker
        if st.get("status") == "done":
            return st["result"]
        if st.get("status") == "error":
            raise RuntimeError(st.get("error") or st.get("message") or "OCR loi")
        time.sleep(max(0.5, float(poll_seconds)))
    raise TimeoutError("OCR qua 20 phut.")

def aurel_pdf_commit(preview, metrics=None, replace=True):
    token = preview["preview_token"] if isinstance(preview, dict) else str(preview)
    if metrics is None and isinstance(preview, dict):
        metrics = [x.get("metric_id") for x in preview.get("items",[]) if x.get("metric_id")]
    return aurel_api("api/pdf/commit", {
        "preview_token":token, "metrics":metrics or [], "replace":bool(replace)
    }, timeout=120)

print("\nAUREL BACKEND READY")
print("Local API:", AUREL_LOCAL)
print("Helper san sang: aurel_upload(), aurel_state(), aurel_pdf_analyze(), aurel_pdf_commit(), aurel_api()")
print("Log:", LOG)
