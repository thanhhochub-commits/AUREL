"""Regression tests for the restored AUREL upload screen.

Do not add account login, the old PRIVATE/SERVER switch, or vault password UI.
The original financial application and its backend are intentionally preserved.
"""
import pathlib
import re
import unittest
import base64

ROOT=pathlib.Path(__file__).resolve().parents[1]
class RestoredUploadScreenTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html=(ROOT/'financial-intelligence.html').read_text(encoding='utf-8')
        m=re.search(r'const b="([A-Za-z0-9+/=]+)"',cls.html)
        assert m,'Financial application bundle must remain available.'
        cls.app=base64.b64decode(m.group(1),validate=True).decode('utf-8')

    def test_old_mode_switch_and_password_panel_are_absent(self):
        for marker in ('AUREL_PRIVATE_VAULT_V1_CSS','AUREL_PRIVATE_UPLOAD_FAIL_CLOSED',
                       'aurel-private-vault.js','aurel-private-analytics.js',
                       'aurel-private-switch','aurel-private-pass',
                       'aurel-account-auth.js'):
            self.assertNotIn(marker,self.html)

    def test_original_file_upload_function_still_operates(self):
        self.assertIn("request('api/upload'",self.app)
        self.assertIn("request('api/upload/start'",self.app)
        self.assertIn("request('api/upload/complete'",self.app)
        self.assertIn("if(e.target.closest('#upload-button'))return upload()",self.app)

    def test_unrelated_financial_modules_still_loaded(self):
        self.assertIn('assets/aurel-cafef.js',self.html)
        self.assertIn("function refresh()",self.app)
        self.assertIn("function renderReport()",self.app)
        self.assertIn("function renderData()",self.app)

if __name__=='__main__':
    unittest.main()
