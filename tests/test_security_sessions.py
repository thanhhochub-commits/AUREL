"""Synthetic account auth and cross-user isolation regressions (no real user data)."""
import base64
import copy
import json
import threading
import unittest
from unittest.mock import patch
from urllib.request import Request, urlopen
from urllib.error import HTTPError
import server

ALICE='11111111-1111-1111-1111-111111111111'
BOB='22222222-2222-2222-2222-222222222222'

class SessionIsolationTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
    cls.db={}
    def verify(header):
        if header=='Bearer alice': return {'id':ALICE,'email':'alice@gmail.com'}
        if header=='Bearer bob': return {'id':BOB,'email':'bob@gmail.com'}
        raise PermissionError('Đăng nhập không hợp lệ.')
    def load(jwt,user):
        if user not in cls.db:return {'rows':[],'documents':[]},-1
        payload,revision=cls.db[user]
        return copy.deepcopy(payload),revision
    def save(jwt,user,payload,rev):
        # Test layer simulates authenticated RLS and optimistic-lock checks.
        identity=verify('Bearer '+jwt)
        if identity['id']!=user:raise PermissionError('Sai chủ sở hữu.')
        old=cls.db.get(user)
        if (old is None and rev!=-1) or (old is not None and old[1]!=rev):
            raise ValueError('Xung đột phiên.')
        new_rev=rev+1
        cls.db[user]=(copy.deepcopy(payload),new_rev)
        return new_rev
    cls.patchers=[
       patch.object(server,'verify_access_token',side_effect=verify),
       patch.object(server,'load_account',side_effect=load),
       patch.object(server,'save_account',side_effect=save),
       patch.object(server,'upload_document',side_effect=lambda jwt,user,name,data:user+'/file.pdf'),
       patch.object(server,'delete_document',return_value=None)
    ]
    for p in cls.patchers:p.start()
    cls.httpd=server.build_server('127.0.0.1',0)
    cls.base='http://127.0.0.1:%s'%cls.httpd.server_port
    cls.worker=threading.Thread(target=cls.httpd.serve_forever,daemon=True)
    cls.worker.start()
 @classmethod
 def tearDownClass(cls):
    cls.httpd.shutdown();cls.httpd.server_close();cls.worker.join(timeout=4)
    for p in reversed(cls.patchers):p.stop()
 def api(self,route,account=None,session=None,body=None):
    headers={}
    if account:headers['Authorization']='Bearer '+account
    if session:headers['X-Aurel-Token']=session
    if body is not None:headers['Content-Type']='application/json';body=json.dumps(body).encode('utf-8')
    req=Request(self.base+route,data=body,headers=headers)
    try:
        with urlopen(req,timeout=15) as r:
            raw=r.read()
            try:data=json.loads(raw)
            except (ValueError,UnicodeDecodeError):data=raw.decode('utf-8-sig','replace')
            return r.status,data
    except HTTPError as exc:
        return exc.code,json.loads(exc.read())
 def login(self,account):
    status,result=self.api('/api/session',account)
    self.assertEqual(status,200,result)
    return result['token']
 def test_account_isolation_upload_export_and_clear(self):
    a,b=self.login('alice'),self.login('bob')
    self.assertNotEqual(a,b)
    self.assertEqual(self.api('/api/state')[0],403)
    self.assertEqual(self.api('/api/state','bob',a)[0],403)
    content=b'bank,year,metric_id,value,unit\nACB,2025,assets,123456,billion_vnd\n'
    status,_=self.api('/api/upload','alice',a,{'name':'alice.csv','base64':base64.b64encode(content).decode()})
    self.assertEqual(status,200)
    sa,alice=self.api('/api/state','alice',a)
    sb,bob=self.api('/api/state','bob',b)
    self.assertEqual((sa,sb),(200,200))
    self.assertTrue(alice['has_data']);self.assertFalse(bob['has_data'])
    self.assertEqual(self.api('/api/export','bob',b)[0],400)
    status,result=self.api('/api/export','alice',a)
    self.assertEqual(status,200);self.assertIn('ACB',result)
    self.assertEqual(self.api('/api/clear','bob',b,{'confirm':'XOA_DU_LIEU'})[0],200)
    self.assertTrue(self.api('/api/state','alice',a)[1]['has_data'])
    # A separate browser session of the same verified account restores cloud state.
    another=self.login('alice')
    self.assertNotEqual(another,a)
    self.assertTrue(self.api('/api/state','alice',another)[1]['has_data'])
 def test_upload_session_not_shared(self):
    a,b=self.login('alice'),self.login('bob')
    import hashlib
    content=b'abc'
    status,init=self.api('/api/upload/start','alice',a,{'name':'doc.pdf','size':3,'sha256':hashlib.sha256(content).hexdigest()})
    self.assertEqual(status,200,init)
    status,_=self.api('/api/upload/chunk','bob',b,{'upload_id':init['upload_id'],'offset':0,'base64':base64.b64encode(content).decode()})
    self.assertEqual(status,400)
 def test_pdf_files_are_owner_scoped_in_cloud(self):
    a,b=self.login('alice'),self.login('bob')
    pdf=b'%PDF-1.4\n%%EOF'
    mock_pages=[{'page':1,'text':'ACB confidential synthetic report','ocr':False}]
    with patch.object(server,'read_pdf',return_value=mock_pages),patch.object(server,'read_document',return_value=pdf):
        result,body=self.api('/api/upload','alice',a,{
            'name':'alice_confidential.pdf','base64':base64.b64encode(pdf).decode()
        })
        self.assertEqual(result,200,body)
        # Other verified account cannot request Alice's uploaded file by name.
        self.assertEqual(self.api('/api/document?name=alice_confidential.pdf&page=1','bob',b)[0],400)
        again=self.login('alice')
        state=self.api('/api/state','alice',again)[1]
        self.assertTrue(any(doc['name']=='alice_confidential.pdf' for doc in state['documents']))
        status,doc=self.api('/api/document?name=alice_confidential.pdf&page=1','alice',again)
        self.assertEqual(status,200,doc)
        self.assertIn('confidential synthetic',doc['text'])

 def test_account_requires_verified_authorization(self):
    self.assertEqual(self.api('/api/session')[0],403)
    self.assertEqual(self.api('/api/session','invalid')[0],403)

if __name__=='__main__':unittest.main()
