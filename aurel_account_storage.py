"""Authenticated AUREL account vault client.

The JWT is issued by Supabase Auth and checked by the Edge Function on every
vault operation. Data is stored by auth.uid(), never by device or browser.
"""
import json
import re
from urllib.parse import quote
from urllib.request import Request,urlopen
from urllib.error import HTTPError,URLError

ENDPOINT="https://hqdeawwnviizihqsmovn.supabase.co/functions/v1/aurel-account-vault"
UUID_PATTERN=re.compile(r"[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\Z",re.I)

def valid_owner(owner):
    return isinstance(owner,str) and UUID_PATTERN.fullmatch(owner) is not None

def _call(token,action,body=b"",params="",content_type="application/json",max_bytes=45*1024*1024):
    if not isinstance(token,str) or not 40<=len(token)<=7000 or "\n" in token or "\r" in token:
        raise PermissionError("Thiếu phiên tài khoản hợp lệ. Hãy đăng nhập lại.")
    address=ENDPOINT+"?action="+action+(("&"+params) if params else "")
    req=Request(address,data=body,method="POST",headers={
        "Authorization":"Bearer "+token,"Content-Type":content_type,"Accept":"application/json"
    })
    try:
        with urlopen(req,timeout=80) as f:
            value=f.read(max_bytes+1)
            if len(value)>max_bytes:raise ValueError("Dung lượng dữ liệu vượt giới hạn.")
            if action=="file_get":return value
            return json.loads(value)
    except HTTPError as exc:
        if exc.code in (401,403):raise PermissionError("Tài khoản hết phiên hoặc không sở hữu dữ liệu này.") from exc
        if exc.code==409:raise ValueError("Dữ liệu đã được sửa trên thiết bị khác. Hãy tải lại trang trước khi lưu.") from exc
        if exc.code==404:raise ValueError("Tệp PDF không tồn tại hoặc không thuộc tài khoản.") from exc
        raise RuntimeError("Không truy cập được dữ liệu tài khoản (HTTP %s)."%exc.code) from exc
    except (URLError,TimeoutError) as exc:
        raise RuntimeError("Không thể kết nối hệ thống lưu trữ tài khoản.") from exc

def verify(token):
    data=_call(token,"verify",max_bytes=100_000)
    owner=data.get("user_id")
    if not valid_owner(owner):raise PermissionError("Danh tính tài khoản không hợp lệ.")
    return owner

def load(token):
    data=_call(token,"load",max_bytes=15_000_000)
    owner=data.get("user_id")
    if not valid_owner(owner):raise PermissionError("Danh tính tài khoản không hợp lệ.")
    value=data.get("payload")
    if not isinstance(value,dict) or not isinstance(value.get("rows",[]),list) or not isinstance(value.get("documents",[]),list):
        raise RuntimeError("Dữ liệu tài khoản trả về không hợp lệ.")
    return owner,value,int(data.get("revision",-1))

def save(token,payload,revision):
    body=json.dumps({"payload":payload,"revision":revision},ensure_ascii=False,allow_nan=False,separators=(",",":")).encode("utf-8")
    data=_call(token,"save",body,max_bytes=200_000)
    return int(data["revision"])

def put_pdf(token,name,content):
    if not isinstance(content,bytes) or not 5<=len(content)<=40*1024*1024:
        raise ValueError("Tệp PDF không hợp lệ hoặc vượt quá 40 MB.")
    safe=re.sub(r"[^A-Za-z0-9._-]","_",name)[:90]
    data=_call(token,"file_put",content,"name="+quote(safe),content_type="application/pdf",max_bytes=250_000)
    path=data.get("path")
    if not isinstance(path,str) or len(path)>270:raise RuntimeError("Không nhận được đường dẫn tệp PDF.")
    return path

def get_pdf(token,path):
    return _call(token,"file_get",params="path="+quote(path,safe=""),max_bytes=40*1024*1024+1024)

def delete_pdf(token,path):
    return _call(token,"file_delete",params="path="+quote(path,safe=""),max_bytes=100_000)
