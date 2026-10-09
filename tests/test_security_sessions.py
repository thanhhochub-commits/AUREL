"""Security regression tests: protect distinct AUREL browser sessions.

Run: python -m unittest discover -s tests -p 'test_security*.py' -v
These tests use only standard-library networking and synthetic financial values.
"""
import base64
import json
import threading
import unittest
from urllib.request import Request, urlopen
from urllib.error import HTTPError

import server


class SessionIsolationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.httpd = server.build_server('127.0.0.1', 0)
        cls.base = 'http://127.0.0.1:%s' % cls.httpd.server_port
        cls.worker = threading.Thread(target=cls.httpd.serve_forever, daemon=True)
        cls.worker.start()

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()
        cls.httpd.server_close()
        cls.worker.join(timeout=4)

    def api(self, route, token=None, body=None):
        headers = {}
        if token:
            headers['X-Aurel-Token'] = token
        if body is not None:
            headers['Content-Type'] = 'application/json'
            body = json.dumps(body).encode('utf-8')
        request = Request(self.base + route, data=body, headers=headers)
        try:
            with urlopen(request, timeout=15) as response:
                data = response.read()
                try:
                    payload = json.loads(data)
                except (ValueError, UnicodeDecodeError):
                    payload = data.decode('utf-8-sig', 'replace')
                return response.status, payload
        except HTTPError as exc:
            return exc.code, json.loads(exc.read())

    def new_token(self):
        status, result = self.api('/api/session')
        self.assertEqual(status, 200)
        return result['token']

    def test_sessions_isolate_upload_export_clear(self):
        a, b = self.new_token(), self.new_token()
        self.assertNotEqual(a, b)
        status, _ = self.api('/api/state')
        self.assertEqual(status, 403)
        status, _ = self.api('/api/export')
        self.assertEqual(status, 403)

        csv = b'bank,year,metric_id,value,unit\nACB,2025,assets,123456,billion_vnd\n'
        status, data = self.api('/api/upload', a, {
            'name': 'test_aurel_a.csv', 'base64': base64.b64encode(csv).decode('ascii')
        })
        self.assertEqual(status, 200, data)

        sa, state_a = self.api('/api/state', a)
        sb, state_b = self.api('/api/state', b)
        self.assertEqual((sa, sb), (200, 200))
        self.assertTrue(state_a['has_data'])
        self.assertFalse(state_b['has_data'])
        self.assertEqual(state_a['bank'], 'ACB')

        sa, csv_out = self.api('/api/export', a)
        sb, err_b = self.api('/api/export', b)
        self.assertEqual(sa, 200)
        self.assertIn('ACB', csv_out)
        self.assertEqual(sb, 400)
        self.assertNotIn('ACB', json.dumps(err_b))

        status, _ = self.api('/api/clear', b, {'confirm': 'XOA_DU_LIEU'})
        self.assertEqual(status, 200)
        sa, a_after = self.api('/api/state', a)
        self.assertEqual(sa, 200)
        self.assertTrue(a_after['has_data'])

        status, restored = self.api('/api/session', a)
        self.assertEqual(status, 200)
        self.assertEqual(restored['token'], a)

    def test_staged_upload_belongs_to_its_session(self):
        a, b = self.new_token(), self.new_token()
        content = b'abc'
        import hashlib
        digest = hashlib.sha256(content).hexdigest()
        status, init = self.api('/api/upload/start', a, {
            'name': 'stage.pdf', 'size': 3, 'sha256': digest
        })
        self.assertEqual(status, 200, init)
        status, reply = self.api('/api/upload/chunk', b, {
            'upload_id': init['upload_id'], 'offset': 0,
            'base64': base64.b64encode(content).decode('ascii')
        })
        self.assertEqual(status, 400)
        self.assertNotIn('abc', json.dumps(reply))


if __name__ == '__main__':
    unittest.main()
