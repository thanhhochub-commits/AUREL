"""Synthetic per-device ownership and cloud persistence regression tests."""
import base64,copy,hashlib,json,threading,unittest
from unittest.mock import patch
from urllib.request import Request,urlopen
from urllib.error import HTTPError
import server

class DeviceIsolation(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
    cls.cloud={}
    def load(key):
        data=cls.cloud.get(key)
        return (copy.deepcopy(data[0]),data[1]) if data else ({'rows':[],'documents':[]},-1)
    def save(key,payload,rev):
        previous=cls.cloud.get(key)
        if (not previous and rev!=-1) or (previous and previous[1]!=rev):raise ValueError('Concurrent update conflict')
        cls.cloud[key]=(copy.deepcopy(payload),rev+1)
        return rev+1
    cls.mocks=[
      patch.object(server,'device_load',side_effect=load),
      patch.object(server,'device_save',side_effect=save),
      patch.object(server,'device_put_pdf',side_effect=lambda key,name,data:hashlib.sha256(key.encode()).hexdigest()+'/file.pdf'),
      patch.object(server,'device_get_pdf',side_effect=lambda key,path:b'%PDF-1.4\n%%EOF'),
      patch.object(server,'device_delete_pdf',return_value={})]
    for m in cls.mocks:m.start()
    cls.httpd=server.build_server('127.0.0.1',0)
    cls.base='http://127.0.0.1:'+str(cls.httpd.server_port)
    cls.worker=threading.Thread(target=cls.httpd.serve_forever,daemon=True)
    cls.worker.start()
 @classmethod
 def tearDownClass(cls):
    cls.httpd.shutdown();cls.httpd.server_close();cls.worker.join(timeout=4)
    for m in reversed(cls.mocks):m.stop()
 def api(self,path,device=None,session=None,body=None):
    headers={}
    if device:headers['X-Aurel-Device-Key']=device
    if session:headers['X-Aurel-Token']=session
    if body is not None:headers['Content-Type']='application/json';body=json.dumps(body).encode()
    req=Request(self.base+path,headers=headers,data=body)
    try:
        with urlopen(req,timeout=15) as r:
            result=r.read()
            try:result=json.loads(result)
            except Exception:result=result.decode('utf-8','replace')
            return r.status,result
    except HTTPError as e:
        return e.code,json.loads(e.read())
 def token(self,key):
    status,response=self.api('/api/session',key)
    self.assertEqual(status,200,response)
    return response['token']
 def test_separation_and_reload(self):
    a='A'*43;b='B'*43
    ta,tb=self.token(a),self.token(b)
    self.assertNotEqual(ta,tb)
    self.assertEqual(self.api('/api/state')[0],403)
    self.assertEqual(self.api('/api/state',b,ta)[0],403)
    rows=b'bank,year,metric_id,value,unit\nACB,2025,assets,123456,billion_vnd\n'
    status,result=self.api('/api/upload',a,ta,{'name':'sample.csv','base64':base64.b64encode(rows).decode()})
    self.assertEqual(status,200,result)
    self.assertTrue(self.api('/api/state',a,ta)[1]['has_data'])
    self.assertFalse(self.api('/api/state',b,tb)[1]['has_data'])
    self.assertEqual(self.api('/api/export',b,tb)[0],400)
    self.assertEqual(self.api('/api/clear',b,tb,{'confirm':'XOA_DU_LIEU'})[0],200)
    self.assertTrue(self.api('/api/state',a,ta)[1]['has_data'])
    # Backend process restart simulation: dispose of only A's in-memory session.
    with server._SESSION_LOCK:server._SESSIONS.pop(ta,None)
    new=self.token(a)
    self.assertNotEqual(new,ta)
    self.assertTrue(self.api('/api/state',a,new)[1]['has_data'])
 def test_file_staging_isolation(self):
    a,b='C'*43,'D'*43
    ta,tb=self.token(a),self.token(b)
    content=b'test file';sha=hashlib.sha256(content).hexdigest()
    status,init=self.api('/api/upload/start',a,ta,{'name':'x.pdf','size':len(content),'sha256':sha})
    self.assertEqual(status,200,init)
    status,_=self.api('/api/upload/chunk',b,tb,{'upload_id':init['upload_id'],'offset':0,'base64':base64.b64encode(content).decode()})
    self.assertEqual(status,400)
if __name__=='__main__':unittest.main()
