"""Supabase Auth verification for AUREL; server never receives user passwords.

Configuration is mandatory in account-auth mode. No service-role key is used.
"""
from __future__ import annotations
import json
import os
import re
from urllib.parse import urlsplit
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError


def _configuration():
    url = os.getenv('AUREL_SUPABASE_URL', '').strip().rstrip('/')
    public_key = os.getenv('AUREL_SUPABASE_PUBLISHABLE_KEY', '').strip()
    parsed = urlsplit(url)
    if (parsed.scheme != 'https'
            or not re.fullmatch(r'[a-z0-9-]+\.supabase\.co', parsed.hostname or '')
            or parsed.username or parsed.password or parsed.query or parsed.fragment
            or parsed.path or not public_key):
        raise RuntimeError('Supabase Auth chưa được cấu hình hợp lệ.')
    if any(c.isspace() for c in public_key) or len(public_key) > 2048:
        raise RuntimeError('Supabase publishable key không hợp lệ.')
    return url, public_key


def public_configuration():
    url, public_key = _configuration()
    return {'enabled': True, 'supabase_url': url, 'publishable_key': public_key}


def verify_access_token(authorization):
    if not isinstance(authorization, str) or not authorization.startswith('Bearer '):
        raise PermissionError('Yêu cầu đăng nhập vào AUREL.')
    token = authorization[7:].strip()
    if len(token) < 40 or len(token) > 4096 or not re.fullmatch(r'[A-Za-z0-9_.-]+', token):
        raise PermissionError('Phiên đăng nhập không hợp lệ.')
    url, public_key = _configuration()
    req = Request(
        url + '/auth/v1/user',
        headers={'apikey': public_key, 'Authorization': 'Bearer ' + token,
                 'Accept': 'application/json'},
        method='GET')
    try:
        with urlopen(req, timeout=12) as response:
            identity = json.loads(response.read(32768).decode('utf-8'))
    except HTTPError as error:
        if error.code in (400, 401, 403):
            raise PermissionError('Phiên đăng nhập đã hết hạn hoặc không hợp lệ.') from error
        raise RuntimeError('Không thể xác minh quyền truy cập AUREL.') from error
    except (URLError, TimeoutError, ValueError, UnicodeDecodeError) as error:
        raise RuntimeError('Không thể xác minh quyền truy cập AUREL.') from error
    if not isinstance(identity, dict):
        raise PermissionError('Phiên xác thực không hợp lệ.')
    uid = identity.get('id')
    email = identity.get('email')
    if (not isinstance(uid, str)
            or not re.fullmatch(r'[0-9a-fA-F-]{36}', uid)
            or not isinstance(email, str)
            or not email.lower().endswith('@gmail.com')
            or not identity.get('email_confirmed_at')):
        raise PermissionError('Tài khoản Gmail chưa được xác minh.')
    return {'id': uid, 'email': email.lower()}
