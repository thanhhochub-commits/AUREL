"""Unit tests for security boundaries of external Supabase user verification."""
import json
import unittest
from unittest.mock import patch
from io import BytesIO
import aurel_auth

USER='11111111-1111-1111-1111-111111111111'
class FakeReply:
    def __init__(self,obj):self.obj=obj
    def __enter__(self):return self
    def __exit__(self,*args):return False
    def read(self,*_):return json.dumps(self.obj).encode()

class AuthVerificationTests(unittest.TestCase):
    def test_rejects_missing_passwordless_authorization(self):
        with self.assertRaises(PermissionError):aurel_auth.verify_access_token('')
        with self.assertRaises(PermissionError):aurel_auth.verify_access_token('Bearer x')

    def test_rejects_unverified_or_non_gmail_account(self):
        base={'id':USER,'email':'person@gmail.com','email_confirmed_at':'2026-10-10T00:00:00Z'}
        with patch.object(aurel_auth,'_configuration',return_value=('https://test-ref.supabase.co','sb_publishable_example')):
            for changed in [{'email_confirmed_at':None},{'email':'someone@yahoo.com'},{'id':'not-uuid'}]:
                with patch.object(aurel_auth,'urlopen',return_value=FakeReply({**base,**changed})):
                    with self.assertRaises(PermissionError):
                        aurel_auth.verify_access_token('Bearer '+('a'*120))

    def test_only_supabase_identity_service_can_verify(self):
        payload={'id':USER,'email':'person@gmail.com','email_confirmed_at':'2026-10-10T00:00:00Z'}
        with patch.object(aurel_auth,'_configuration',return_value=('https://project-ref.supabase.co','sb_publishable_example')):
            with patch.object(aurel_auth,'urlopen',return_value=FakeReply(payload)) as call:
                result=aurel_auth.verify_access_token('Bearer '+('a'*120))
        self.assertEqual(result['id'],USER)
        request=call.call_args.args[0]
        self.assertEqual(request.full_url,'https://project-ref.supabase.co/auth/v1/user')
        self.assertIn('Authorization',request.headers)
        self.assertNotIn('password',str(request.data))

    def test_supabase_config_restricts_hosts(self):
        cases=['https://attacker.example','http://myproject.supabase.co','https://myproject.supabase.co.evil.test','https://u:p@myproject.supabase.co']
        for url in cases:
            with patch.dict('os.environ',{'AUREL_SUPABASE_URL':url,'AUREL_SUPABASE_PUBLISHABLE_KEY':'example'}):
                with self.assertRaises(RuntimeError):aurel_auth.public_configuration()

if __name__=='__main__':unittest.main()
