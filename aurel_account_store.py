"""Account-owned AUREL datasets via Supabase RLS, never a service-role key.

The caller's verified Supabase JWT is forwarded to PostgREST and private Storage.
RLS is enforced a second time at the database/storage layer.
"""
from __future__ import annotations
import json
import os
import re
import secrets
from urllib.parse import quote
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from aurel_auth import _configuration

DATASET_URL='/rest/v1/aurel_account_state'
BUCKET='aurel-documents'

def _http(url, method, jwt, content=None, mime=None, prefer=None, limit=48*1024*1024):
    base, public_key = _configuration()
    headers={'apikey':public_key,'Authorization':'Bearer '+jwt,'Accept':'application/json'}
    if mime: headers['Content-Type']=mime
    if prefer: headers['Prefer']=prefer
    req=Request(base+url, data=content, headers=headers, method=method)
    try:
        with urlopen(req,timeout=60) as r:
            data=r.read(limit+1)
            if len(data)>limit: raise RuntimeError('Tệp AUREL vượt quá giới hạn đọc.')
            return data
    except HTTPError as e:
        # Avoid leaking full external error messages, tokens, SQL or user content.
        if e.code in (401,403): raise PermissionError('Không có quyền truy cập kho dữ liệu AUREL.') from e
        if e.code in (404,409,412): raise ValueError('Kho dữ liệu riêng chưa được thiết lập hoặc có xung đột phiên. Hãy tải lại trang.') from e
        raise RuntimeError('Kho dữ liệu AUREL tạm thời không khả dụng (HTTP %s).' % e.code) from e
    except (URLError,TimeoutError) as e:
        raise RuntimeError('Không thể kết nối kho dữ liệu tài khoản AUREL.') from e

def _path(user_id):
    if not re.fullmatch(r'[a-fA-F0-9-]{36}',user_id):raise PermissionError('Danh tính AUREL không hợp lệ.')
    return DATASET_URL+'?owner_id=eq.'+quote(user_id,safe='')+'&select=payload,revision'

def load_account(jwt,user_id):
    response=_http(_path(user_id),'GET',jwt,limit=15*1024*1024)
    rows=json.loads(response or b'[]')
    if not isinstance(rows,list) or len(rows)>1:raise RuntimeError('Kho dữ liệu tài khoản không hợp lệ.')
    if not rows:return {'rows':[],'documents':[]},-1
    record=rows[0]
    payload=record.get('payload')
    if not isinstance(payload,dict) or not isinstance(payload.get('rows',[]),list) or not isinstance(payload.get('documents',[]),list):
        raise RuntimeError('Dữ liệu tài khoản có cấu trúc không hợp lệ.')
    return payload,int(record['revision'])

def save_account(jwt,user_id,payload,revision):
    if not isinstance(payload,dict) or not isinstance(payload.get('rows'),list) or not isinstance(payload.get('documents'),list):
        raise ValueError('Dữ liệu AUREL chưa hợp lệ.')
    if len(payload['rows'])>50000 or len(payload['documents'])>20:
        raise ValueError('Dữ liệu vượt giới hạn tài khoản.')
    if revision == -1:
        data={'owner_id':user_id,'payload':payload,'revision':0}
        response=_http(DATASET_URL,json_method('POST'),jwt,json.dumps(data,ensure_ascii=False).encode('utf-8'),
                       'application/json','return=representation',limit=1024*1024)
        return 0
    # Optimistic update: detect edits made in other browser sessions, fail closed.
    patch={'payload':payload,'revision':revision+1}
    path=DATASET_URL+'?owner_id=eq.'+quote(user_id,safe='')+'&revision=eq.'+str(revision)+'&select=revision'
    data=_http(path,'PATCH',jwt,json.dumps(patch,ensure_ascii=False).encode('utf-8'),
               'application/json','return=representation',limit=1024*1024)
    returned=json.loads(data or b'[]')
    if not isinstance(returned,list) or len(returned)!=1 or returned[0].get('revision')!=revision+1:
        raise ValueError('Dữ liệu đã thay đổi từ một phiên khác. Hãy tải lại trước khi sửa.')
    return revision+1

def json_method(method):
    return method

def upload_document(jwt,user_id,name,data):
    if not isinstance(data,bytes) or len(data)<1 or len(data)>40*1024*1024:
        raise ValueError('Tệp không hợp lệ hoặc quá 40 MB.')
    safe_name=re.sub(r'[^A-Za-z0-9._-]+','_',name).strip('._')[:90] or 'document.pdf'
    path=user_id+'/'+secrets.token_hex(16)+'/'+safe_name
    _http('/storage/v1/object/'+BUCKET+'/'+quote(path,safe='/'),'POST',jwt,data,
          'application/pdf','return=minimal',limit=1024*1024)
    return path

def read_document(jwt,path):
    if not isinstance(path,str) or len(path)>300 or '..' in path:
        raise PermissionError('Đường dẫn tài liệu không hợp lệ.')
    return _http('/storage/v1/object/authenticated/'+BUCKET+'/'+quote(path,safe='/'),
                 'GET',jwt,limit=40*1024*1024)

def delete_document(jwt,path):
    if not isinstance(path,str) or '..' in path:raise PermissionError('Đường dẫn tài liệu không hợp lệ.')
    _http('/storage/v1/object/'+BUCKET+'/'+quote(path,safe='/'),'DELETE',jwt,limit=1024*1024)
