"""Smoke test: live AUREL GitHub Pages and Render backend using only synthetic sessions."""
import base64,json,re,secrets,time,unittest
from urllib.request import Request,urlopen
from urllib.error import HTTPError
FRONT='https://thanhhochub-commits.github.io/AUREL/financial-intelligence.html'
BACK='https://aurel-thanhhochub-backend.onrender.com'
class RealSiteSmoke(unittest.TestCase):
 def test_published_frontend_and_two_private_backend_sessions(self):
  last=None
  for attempt in range(12):
   try:
    with urlopen(Request(FRONT,headers={'Cache-Control':'no-cache'}),timeout=35) as reply:html=reply.read().decode()
    m=re.search(r'const b="([A-Za-z0-9+/=]+)"',html)
    self.assertTrue(m,"Published HTML must include AUREL financial app")
    script=base64.b64decode(m.group(1),validate=True)
    self.assertIn(b'aurel_private_device_key_v1',script)
    self.assertIn(b'AUREL-DEVICE-PERSIST-20261010',script)
    self.assertNotIn('aurel-private-vault.js',html)
    device_a=secrets.token_urlsafe(32);device_b=secrets.token_urlsafe(32)
    def request(path,device=None,token=None):
     headers={}
     if device:headers['X-Aurel-Device-Key']=device
     if token:headers['X-Aurel-Token']=token
     try:
      with urlopen(Request(BACK+path,headers=headers),timeout=60) as r:return r.status,json.loads(r.read())
     except HTTPError as e:return e.code,json.loads(e.read())
    status,a=request('/api/session',device_a)
    self.assertEqual(status,200,a)
    self.assertEqual(a['version'],'AUREL-DEVICE-PERSIST-20261010')
    status,b=request('/api/session',device_b)
    self.assertEqual(status,200,b)
    self.assertNotEqual(a['token'],b['token'])
    self.assertEqual(request('/api/state')[0],403)
    self.assertEqual(request('/api/state',device_b,a['token'])[0],403)
    status,state_a=request('/api/state',device_a,a['token'])
    status_b,state_b=request('/api/state',device_b,b['token'])
    self.assertEqual((status,status_b),(200,200))
    self.assertFalse(state_a['has_data'])
    self.assertFalse(state_b['has_data'])
    print('PASS: live AUREL pages and two isolated backend sessions')
    return
   except Exception as e:
    last=e
    print('Live verification attempt',attempt+1,repr(e),flush=True)
    if attempt<11:time.sleep(12)
  raise AssertionError('Live deployment has not passed: '+repr(last))
if __name__=='__main__':unittest.main()
