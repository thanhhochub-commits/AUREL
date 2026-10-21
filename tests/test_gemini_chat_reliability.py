"""Gemini AUREL chat: isolated reliability tests; no real API keys or outbound requests."""
import base64
import io
import json
import re
import threading
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
from urllib.error import HTTPError, URLError

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

    def test_upstream_503_is_not_reported_as_a_generic_network_failure(self):
        payload={'contents':[{'role':'user','parts':[{'text':'Phân tích ROE'}]}]}
        with patch.object(server,'urlopen',
                          side_effect=[self.error(503),self.error(503)]), \
             patch.object(server.time,'sleep',return_value=None):
            with self.assertRaisesRegex(ValueError,'HTTP 5xx'):
                server._aurel_chat_generate('key',payload,['gemini-2.5-flash'],max_seconds=20)

    def test_network_disconnection_is_not_called_gemini_overload(self):
        payload={'contents':[{'role':'user','parts':[{'text':'Phân tích NIM'}]}]}
        with patch.object(server,'urlopen',side_effect=URLError('network down')), \
             patch.object(server.time,'sleep',return_value=None):
            with self.assertRaisesRegex(ValueError,'Kết nối từ máy chủ AUREL tới Gemini'):
                server._aurel_chat_generate('key',payload,['gemini-2.5-flash'],max_seconds=20)

    def test_403_clearly_identifies_gemini_permission_issue(self):
        payload={'contents':[{'role':'user','parts':[{'text':'ROA là gì?'}]}]}
        with patch.object(server,'urlopen',side_effect=self.error(403)):
            with self.assertRaisesRegex(ValueError,'xác thực hoặc quyền truy cập'):
                server._aurel_chat_generate('key',payload,['gemini-2.5-flash'],max_seconds=20)

    def test_frontend_greeting_and_diagnostics_are_scoped_to_chat(self):
        page=(Path(__file__).resolve().parents[1]/'financial-intelligence.html').read_text('utf-8')
        encoded=re.search(r'const b="([A-Za-z0-9+/=]+)",s=atob',page)
        self.assertIsNotNone(encoded)
        script=base64.b64decode(encoded.group(1)).decode('utf-8')
        self.assertIn('function aurelChatLocalWelcome(question)',script)
        self.assertIn('const localWelcome=aurelChatLocalWelcome(q);',script)
        self.assertIn('if(localWelcome){',script)
        self.assertIn('Website AUREL chưa liên lạc được với backend',script)
        self.assertIn('Đầu cuối Gemini đang phản hồi lỗi máy chủ',script)
        self.assertIn("await request('api/ai/chat',{question:q,history:before}",script)
        self.assertIn('aurel-chat-answer-tail',script)

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


    def test_simple_greeting_is_finance_contextual_and_does_not_request_gemini(self):
        with patch.object(server,'gemini_credentials',return_value=
                          ('mock-key','gemini-3.8-flash',['gemini-3.8-flash'])), \
             patch.object(server,'_aurel_chat_generate',
                          side_effect=AssertionError('No Gemini request on greeting')):
            for greeting in ('hi','Chào bạn! Rất vui được gặp lại bạn.'):
                result=server.ai_chat(greeting)
                self.assertTrue(result.get('local'))
                self.assertIn('trợ lý AI AUREL',result['reply'])
                self.assertIn('tài chính',result['reply'])
                self.assertNotIn('học tập',result['reply'])
                self.assertNotIn('đời sống',result['reply'])

    def test_generic_introduction_only_recommends_aurel(self):
        with patch.object(server,'gemini_credentials',return_value=
                          ('mock-key','gemini-2.5-flash',['gemini-2.5-flash'])), \
             patch.object(server,'_aurel_chat_generate',
                          side_effect=AssertionError('Generic onboarding must not call Gemini')):
            for question in ('Xin chào', 'Bạn là ai?', 'Bạn có thể làm gì?',
                             'AUREL là gì?', 'Web này làm gì?'):
                result=server.ai_chat(question)
                self.assertTrue(result.get('local'),question)
                self.assertIn('trợ lý AI AUREL',result['reply'])
                self.assertIn('báo cáo tài chính',result['reply'])
                self.assertNotIn('đời sống',result['reply'])
                self.assertNotIn('du lịch',result['reply'])
                self.assertNotIn('tiếng Anh',result['reply'])

    def test_explicit_nonfinancial_question_is_not_replaced_by_generic_welcome(self):
        captured={}
        def generate(_token,payload,_models,**_kwargs):
            captured['question']=payload['contents'][-1]['parts'][0]['text']
            return {'text':'Cách luyện tiếng Anh hiệu quả là luyện nói mỗi ngày.',
                    'model':'gemini-2.5-flash'}
        with patch.object(server,'gemini_credentials',return_value=
                          ('mock-key','gemini-2.5-flash',['gemini-2.5-flash'])), \
             patch.object(server,'_aurel_chat_model_choices',
                          return_value=['gemini-2.5-flash']), \
             patch.object(server,'_aurel_chat_generate',side_effect=generate):
            question='Chào bạn, giúp tôi luyện nói tiếng Anh.'
            result=server.ai_chat(question)
        self.assertEqual(captured['question'],question)
        self.assertNotIn('local',result)
        self.assertIn('tiếng Anh',result['reply'])


    def test_chat_prompt_is_finance_first_but_can_answer_explicit_other_topic(self):
        captured={}
        def generate(_token,payload,_models,**_kwargs):
            captured['instructions']=payload['system_instruction']['parts'][0]['text']
            captured['question']=payload['contents'][-1]['parts'][0]['text']
            return {'text':'Đây là câu trả lời cho yêu cầu của bạn.','model':'gemini-3.8-flash'}
        with patch.object(server,'gemini_credentials',return_value=
                          ('mock-key','gemini-3.8-flash',['gemini-3.8-flash'])), \
             patch.object(server,'_aurel_chat_model_choices',return_value=['gemini-3.8-flash']), \
             patch.object(server,'_aurel_chat_generate',side_effect=generate):
            result=server.ai_chat('Giúp mình luyện tiếng Anh')
        self.assertIn('MẶC ĐỊNH ngữ cảnh',captured['instructions'])
        self.assertIn('Khi khách chủ động hỏi cụ thể về một chủ đề ngoài website',
                      captured['instructions'])
        self.assertEqual(captured['question'],'Giúp mình luyện tiếng Anh')
        self.assertFalse(result['refused'])


if __name__=='__main__':
    unittest.main()
