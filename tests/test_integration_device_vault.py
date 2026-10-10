"""Live synthetic Supabase Edge storage tests. No user data; no credentials printed."""
import json,secrets,unittest
from urllib.request import Request,urlopen
from urllib.error import HTTPError
from aurel_device_storage import load,save

class LiveDeviceVault(unittest.TestCase):
 def test_device_separation_persistence_and_replay_protection(self):
    alice=secrets.token_urlsafe(32)
    bob=secrets.token_urlsafe(32)
    self.assertNotEqual(alice,bob)
    a,rev=load(alice)
    b,other=load(bob)
    self.assertEqual(rev,-1)
    self.assertEqual(other,-1)
    self.assertEqual(a.get('rows'),[])
    row={'bank':'DEMO','year':2025,'metric_id':'assets','value':111.0,'unit':'billion_vnd'}
    payload={'rows':[row],'documents':[]}
    saved=save(alice,payload,rev)
    self.assertEqual(saved,0)
    fresh,next_rev=load(alice)
    self.assertEqual(next_rev,0)
    self.assertEqual(fresh['rows'][0]['value'],111.0)
    other_state,other_rev=load(bob)
    self.assertEqual(other_rev,-1)
    self.assertEqual(other_state['rows'],[])
    with self.assertRaises(ValueError):
     save(alice,{'rows':[],'documents':[]},-1)
    updated=save(alice,{'rows':[],'documents':[]},next_rev)
    self.assertEqual(updated,1)
    self.assertEqual(load(alice)[0]['rows'],[])

 def test_missing_credentials_rejected(self):
    from aurel_device_storage import ENDPOINT
    request=Request(ENDPOINT+'?action=load',data=b'',headers={'Content-Type':'application/json'},method='POST')
    try:
     with urlopen(request,timeout=20) as response:
      status=response.status
    except HTTPError as error:
     status=error.code
    self.assertEqual(status,401)

if __name__=='__main__':unittest.main()
