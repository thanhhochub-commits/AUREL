"""Gemini AUREL chat: isolated reliability tests; no real API keys or outbound requests."""
import io
import json
import threading
import unittest
from types import SimpleNamespace
from unittest.mock import patch
from urllib.error import HTTPError

import server


class GeminiChatReliability(unittest.TestCase):
    def setUp(self):
        self.store=SimpleNamespace(
            lock=threading.RLock(),
            gemini_session_key='fake-test-key',
            gemini_chat_recent_model='',
            gemini_chat_model_cooldown={},
            gemini_model_discovery=None,
        )
        self.store_patch=patch.object(server,'STORE',self.store)
        self.store_patch.start()
        self.addCleanup(self.store_patch.stop)

    def response(self, body):
        return io.BytesIO(json.dumps(body).encode('utf-8'))

    def error(self, code):
        return HTTPError('https://generativelanguage.googleapis.com',code,
                         'simulated',{},io.BytesIO(b'{"error":{"message":"simulated"}}'))

    def test_listmodels_accepts_generatecontent_only(self):
        payload={'models':[
            {'name':'models/gemini-3.8-flash','supportedGenerationMethods':['generateContent']},
            {'name':'models/gemini-3.5-flash-lite','supportedGenerationMethods':['generateContent']},
            {'name':'models/gemini-embedding-001','supportedGenerationMethods':['embedContent']},
            {'name':'models/gemini-3-pro-image','supportedGenerationMethods':['generateContent']},
        ]}
        with patch.object(server,'urlopen',return_value=self.response(payload)) as mocked:
            actual=server._aurel_chat_list_models('key-A')
            self.assertEqual(actual,['gemini-3.8-flash','gemini-3.5-flash-lite'])
            self.assertEqual(server._aurel_chat_list_models('key-A'),actual)
            self.assertEqual(mocked.call_count,1)

    def test_model_discovery_isolated_by_key(self):
        results=[self.response({'models':[{'name':'models/gemini-3.8-flash',
                               'supportedGenerationMethods':['generateContent']}] }),
                 self.response({'models':[{'name':'models/gemini-3.5-flash-lite',
                               'supportedGenerationMethods':['generateContent']}] })]
        with patch.object(server,'urlopen',side_effect=results) as mocked:
            self.assertEqual(server._aurel_chat_list_models('user-one'),['gemini-3.8-flash'])
            self.assertEqual(server._aurel_chat_list_models('user-two'),['gemini-3.5-flash-lite'])
            self.assertEqual(mocked.call_count,2)

    def test_generation_after_transient_503(self):
        payload={'contents':[{'role':'user','parts':[{'text':'Xin chào'}]}]}
        with patch.object(server,'urlopen',side_effect=[
            self.error(503),self.response({'candidates':[{'content':{'parts':[{'text':'Xin chào bạn!'}]}}]})
        ]),patch.object(server.time,'sleep',return_value=None):
            result=server._aurel_chat_generate('key',payload,['gemini-3.8-flash'],max_seconds=20)
        self.assertEqual(result['text'],'Xin chào bạn!')

    def test_fallback_after_model_not_available(self):
        payload={'contents':[{'role':'user','parts':[{'text':'Giải thích ROE'}]}]}
        with patch.object(server,'urlopen',side_effect=[
            self.error(404),self.response({'candidates':[{'content':{'parts':[{'text':'ROE là...'}]}}]})
        ]):
            result=server._aurel_chat_generate('key',payload,
                 ['gemini-3.8-flash','gemini-3.5-flash-lite'],max_seconds=20)
        self.assertEqual(result['model'],'gemini-3.5-flash-lite')

    def test_quota_limit_does_not_forge_an_answer(self):
        payload={'contents':[{'role':'user','parts':[{'text':'Lợi nhuận 2025'}]}]}
        with patch.object(server,'urlopen',side_effect=[self.error(429),self.error(429)]):
            with self.assertRaisesRegex(ValueError,'429'):
                server._aurel_chat_generate('key',payload,
                    ['gemini-3.5-flash-lite','gemini-3.8-flash'],max_seconds=20)

    def test_metadata_check_is_not_claimed_ready(self):
        with patch.object(server,'gemini_credentials',return_value=
                          ('key','gemini-3.8-flash',['gemini-3.8-flash'])), \
             patch.object(server,'_aurel_chat_list_models',
                          return_value=['gemini-3.8-flash']):
            result=server.gemini_connection_check()
        self.assertTrue(result['connected'])
        self.assertFalse(result['generation_ready'])

    def test_real_generation_probe_failure_reports_not_ready(self):
        with patch.object(server,'gemini_connection_check',
                          return_value={'connected':True,'model':'gemini-3.8-flash'}), \
             patch.object(server,'gemini_credentials',
                          return_value=('key','gemini-3.8-flash',['gemini-3.8-flash'])), \
             patch.object(server,'_aurel_chat_model_choices',
                          return_value=['gemini-3.8-flash']), \
             patch.object(server,'_aurel_chat_generate',
                          side_effect=ValueError('Gemini hiện tạm quá tải (503)')):
            result=server.gemini_generation_check()
        self.assertTrue(result['connected'])
        self.assertFalse(result['generation_ready'])


if __name__=='__main__':
    unittest.main()
