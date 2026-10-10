"""Persist independent AUREL browser vaults through a Supabase Edge Function.

The only authority is a 256-bit random credential held in that browser profile.
It is sent exclusively via HTTPS headers, never in URLs/logs. Fail closed.
"""
import json
import os
import re
from urllib.request import Request,urlopen
from urllib.error import HTTPError,URLError
from urllib.parse import quote

ENDPOINT='https://hqdeawwnviizihqsmovn.supabase.co/functions/v1/aurel-device-vault'
CREDENTIAL_RE=re.compile(r'[A-Za-z0-9_-]{43}\Z')

def valid_key(device_key):
    return isinstance(device_key,str) and CREDENTIAL_RE.fullmatch(device_key) is not None

def _call(key,action,body=b'',params='',content_type='application/json',limit=45*1024*1024):
    if not valid_key(key):raise PermissionError('Khóa trình duyệt không hợp lệ.')
    endpoint=ENDPOINT+'?action='+action+(('&'+params) if params else '')
    req=Request(endpoint,data=body,method='POST',headers={
       'X-Aurel-Device-Key':key,'Content-Type':content_type,'Accept':'application/json'})
    try:
        with urlopen(req,timeout=75) as r:
            data=r.read(limit+1)
            if len(data)>limit:raise ValueError('Tệp vượt giới hạn bộ nhớ.')
            if action=='file_get':return data
            return json.loads(data)
    except HTTPError as e:
        if e.code in (401,403):raise PermissionError('Từ chối truy cập dữ liệu của trình duyệt khác.') from e
        if e.code==409:raise ValueError('Dữ liệu thay đổi tại phiên khác. Hãy tải lại trang trước khi sửa.') from e
        if e.code==404:raise ValueError('Tài liệu không tồn tại hoặc không thuộc kho này.') from e
        raise RuntimeError('Kho dữ liệu AUREL không khả dụng (HTTP %d).'%e.code) from e
    except (URLError,TimeoutError) as e:
        raise RuntimeError('Không kết nối được kho dữ liệu riêng của AUREL.') from e

def load(key):
    d=_call(key,'load')
    payload=d.get('payload',{})
    if not isinstance(payload,dict) or not isinstance(payload.get('rows',[]),list) or not isinstance(payload.get('documents',[]),list):
        raise RuntimeError('Cấu trúc dữ liệu không hợp lệ.')
    return payload,int(d.get('revision',-1))

def save(key,payload,revision):
    data=json.dumps({'payload':payload,'revision':revision},ensure_ascii=False,allow_nan=False).encode('utf-8')
    result=_call(key,'save',data,limit=1024*1024)
    return int(result['revision'])

def put_pdf(key,name,data):
    if not isinstance(data,bytes) or not 5<=len(data)<=40*1024*1024:raise ValueError('PDF không hợp lệ hoặc quá 40 MB.')
    safe=re.sub(r'[^A-Za-z0-9._-]','_',name)[:90]
    result=_call(key,'file_put',data,'name='+quote(safe),'application/pdf',limit=1024*1024)
    return result['path']

def get_pdf(key,path):
    return _call(key,'file_get',b'','path='+quote(path,safe=''),limit=40*1024*1024+1024)

def delete_pdf(key,path):
    return _call(key,'file_delete',b'','path='+quote(path,safe=''),limit=1024*1024)
