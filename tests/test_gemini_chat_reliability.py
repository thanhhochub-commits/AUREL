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

    def test_frontend_sends_chat_to_gemini_without_changing_aurel_labels(self):
        page=(Path(__file__).resolve().parents[1]/'financial-intelligence.html').read_text('utf-8')
        encoded=re.search(r'const b="([A-Za-z0-9+/=]+)",s=atob',page)
        self.assertIsNotNone(encoded)
        script=base64.b64decode(encoded.group(1)).decode('utf-8')
        self.assertNotIn('function aurelChatLocalWelcome(question)',script)
        self.assertNotIn('const localWelcome=aurelChatLocalWelcome(q);',script)
        self.assertIn("await request('api/ai/chat',{question:q,history:before}",script)
        self.assertNotIn('AUREL · Gemini',script)
        self.assertIn('aurel-chat-agent-label',script)
        self.assertIn('>AUREL</span>',script)
        self.assertIn('aurel-chat-answer-tail',script)
        self.assertIn('circle cx="12" cy="12" r="9"',script)
        self.assertIn('Show only the warm smile in the interface',script)
        self.assertIn('const completeHistory=[];',script)
        self.assertIn("if(entry?.error){pendingChatQuestion=null;continue}",script)
        self.assertIn('const before=completeHistory.slice(-24);',script)
        self.assertNotIn('function aurelChatLocalWelcome(question)',script)
        self.assertIn('Website AUREL chưa liên lạc được với backend',script)
        self.assertIn('Đầu cuối Gemini đang phản hồi lỗi máy chủ',script)

    def test_chat_question_sent_verbatim_without_dashboard_bank_or_file(self):
        captured={}
        def generate(token,payload,models,**kwargs):
            captured['payload']=payload
            return {'text':'Gemini giải thích theo câu hỏi của bạn.','model':'gemini-2.5-flash'}
        with patch.object(server,'gemini_credentials',return_value=
                          ('user-key','gemini-2.5-flash',['gemini-2.5-flash'])), \
             patch.object(server,'_aurel_chat_model_choices',return_value=['gemini-2.5-flash']), \
             patch.object(server,'_aurel_chat_generate',side_effect=generate):
            question='Giá vàng có biến động thế nào?'
            result=server.ai_chat(question)
        payload=captured['payload']
        self.assertEqual(payload['contents'][-1]['parts'][0]['text'],question)
        self.assertNotIn('BANK_001',repr(payload['contents']))
        self.assertNotIn('dashboard',repr(payload['contents']).lower())
        self.assertEqual(result['reply'],'Gemini giải thích theo câu hỏi của bạn.')

    def test_unanswered_previous_question_must_not_contaminate_hi(self):
        captured=[]
        def fake_generate(token,payload,models,**kwargs):
            captured.append(payload['contents'])
            return {'text':'Chào bạn! Mình có thể hỗ trợ gì?','model':'gemini-2.5-flash'}
        histories=[
            [{'role':'user','text':'ls vcb hôm nay'}],
            [{'role':'user','text':'ls vcb hôm nay'},
             {'role':'assistant','text':'Gemini HTTP 429', 'error':True}],
            [{'role':'user','text':'ls vcb hôm nay'},
             {'role':'user','text':'một tin chưa trả lời'}],
        ]
        with patch.object(server,'gemini_credentials',return_value=
                          ('test-key','gemini-2.5-flash',['gemini-2.5-flash'])), \
             patch.object(server,'_aurel_chat_model_choices',return_value=['gemini-2.5-flash']), \
             patch.object(server,'_aurel_chat_generate',side_effect=fake_generate):
            for history in histories:
                result=server.ai_chat('hi',history=history)
                self.assertIn('Chào bạn!',result['reply'])
        for history in captured:
            self.assertEqual(history,[{'role':'user','parts':[{'text':'hi'}]}])

    def test_completed_chat_pair_still_preserved(self):
        captured={}
        def fake_generate(token,payload,models,**kwargs):
            captured['history']=payload['contents']
            return {'text':'Chào bạn!','model':'gemini-2.5-flash'}
        with patch.object(server,'gemini_credentials',return_value=
                          ('test-key','gemini-2.5-flash',['gemini-2.5-flash'])), \
             patch.object(server,'_aurel_chat_model_choices',return_value=['gemini-2.5-flash']), \
             patch.object(server,'_aurel_chat_generate',side_effect=fake_generate):
            server.ai_chat('giải thích thêm',history=[
                {'role':'user','text':'ROE là gì?'},
                {'role':'assistant','text':'ROE đo tỷ suất sinh lời trên vốn chủ sở hữu.'},
                {'role':'user','text':'ls vcb hôm nay'},
            ])
        self.assertEqual([x['role'] for x in captured['history']],['user','model','user'])
        self.assertEqual(captured['history'][-1]['parts'][0]['text'],'giải thích thêm')
        self.assertNotIn('ls vcb hôm nay',repr(captured['history']))

    def test_standalone_greeting_ignores_even_completed_old_bank_topic(self):
        captured={}
        def fake_generate(token,payload,models,**kwargs):
            captured['messages']=payload['contents']
            return {'text':'Chào bạn, mình có thể giúp gì?','model':'gemini-2.5-flash'}
        with patch.object(server,'gemini_credentials',return_value=
                          ('test-key','gemini-2.5-flash',['gemini-2.5-flash'])), \
             patch.object(server,'_aurel_chat_model_choices',return_value=['gemini-2.5-flash']), \
             patch.object(server,'_aurel_chat_generate',side_effect=fake_generate):
            server.ai_chat('hi',history=[
                {'role':'user','text':'Lãi suất VCB hôm nay'},
                {'role':'assistant','text':'Lãi suất tham khảo của VCB là...'}
            ])
        self.assertEqual(captured['messages'],[{'role':'user','parts':[{'text':'hi'}]}])

    def test_prevents_fabricated_bank_identifier_and_fake_bank_domain(self):
        with patch.object(server,'gemini_credentials',return_value=
                          ('test-key','gemini-2.5-flash',['gemini-2.5-flash'])), \
             patch.object(server,'_aurel_chat_model_choices',return_value=['gemini-2.5-flash']), \
             patch.object(server,'_aurel_chat_generate',return_value={
                 'text':'Lãi suất BANK_001 (VCB) được nêu trên BANK_001.com.vn.',
                 'model':'gemini-2.5-flash'}):
            result=server.ai_chat('Giải thích lãi suất tiết kiệm VCB.')
        self.assertNotIn('BANK_001',result['reply'])
        self.assertIn('VCB',result['reply'])
        self.assertIn('tên miền chưa được xác minh',result['reply'])

    def test_public_web_search_only_when_information_is_dynamic(self):
        self.assertTrue(server._aurel_chat_needs_web('Lãi suất hôm nay của VCB là bao nhiêu?'))
        self.assertTrue(server._aurel_chat_needs_web('Tỷ giá mới nhất Vietcombank'))
        self.assertTrue(server._aurel_chat_needs_web('Latest technology news'))
        self.assertFalse(server._aurel_chat_needs_web('Giải thích khái niệm tỷ giá'))
        self.assertFalse(server._aurel_chat_needs_web('Hãy giúp tôi học tiếng Anh'))

    def test_chat_uses_google_search_for_current_external_bank_question(self):
        captured={}
        def generate(token,payload,models,**kwargs):
            captured['payload']=payload
            return {'text':'VCB hiện có các bảng lãi suất theo từng kỳ hạn.',
                    'model':'gemini-2.5-flash','grounded':True,
                    'sources':[{'title':'Vietcombank','url':'https://www.vietcombank.com.vn'}]}
        with patch.object(server,'gemini_credentials',return_value=
                          ('test-key','gemini-2.5-flash',['gemini-2.5-flash'])), \
             patch.object(server,'_aurel_chat_model_choices',return_value=['gemini-2.5-flash']), \
             patch.object(server,'_aurel_chat_generate',side_effect=generate):
            result=server.ai_chat('Lãi suất hôm nay của VCB là bao nhiêu?')
        self.assertEqual(captured['payload']['tools'],[{'google_search':{}}])
        self.assertIn('Gemini',captured['payload']['system_instruction']['parts'][0]['text'])
        self.assertEqual(result['sources'][0]['title'],'Vietcombank')
        self.assertTrue(result['grounded'])

    def test_general_question_uses_gemini_without_web_or_bank_file(self):
        captured={}
        def generate(token,payload,models,**kwargs):
            captured['payload']=payload
            return {'text':'Câu trả lời khoa học.','model':'gemini-2.5-flash'}
        with patch.object(server,'gemini_credentials',return_value=
                          ('test-key','gemini-2.5-flash',['gemini-2.5-flash'])), \
             patch.object(server,'_aurel_chat_model_choices',return_value=['gemini-2.5-flash']), \
             patch.object(server,'_aurel_chat_generate',side_effect=generate):
            result=server.ai_chat('Hãy giải thích thuyết tương đối')
        self.assertNotIn('tools',captured['payload'])
        self.assertEqual(result['reply'],'Câu trả lời khoa học.')

    def test_grounding_sources_only_https_and_no_duplicates(self):
        payload={'candidates':[{'content':{'parts':[{'text':'Đã tìm thấy'}]},
          'groundingMetadata':{'groundingChunks':[
            {'web':{'uri':'https://vcb.com.vn/rates','title':'Lãi suất VCB'}},
            {'web':{'uri':'javascript:alert(1)','title':'Bad source'}},
            {'web':{'uri':'https://vcb.com.vn/rates','title':'Duplicated source'}},
            {'web':{'uri':'http://example.com','title':'Not https'}},
          ]}}]}
        sources=server._aurel_chat_grounding_sources(payload)
        self.assertEqual(sources,[{'title':'Lãi suất VCB','url':'https://vcb.com.vn/rates'}])

    def test_model_search_tool_rejected_falls_back_without_faking_fresh_data(self):
        err=HTTPError('https://generativelanguage.googleapis.com',400,
                      'bad request',{},io.BytesIO(
                          b'{"error":{"message":"google_search tool is not supported"}}'))
        captured=[]
        def generate(token,payload,models,**kwargs):
            captured.append(payload)
            if payload.get('tools'):
                raise ValueError('AUREL_SEARCH_GROUNDING_UNAVAILABLE')
            return {'text':'Không có dữ liệu lãi suất xác minh hôm nay.',
                    'model':'gemini-2.5-flash'}
        with patch.object(server,'gemini_credentials',return_value=
                          ('test-key','gemini-2.5-flash',['gemini-2.5-flash'])), \
             patch.object(server,'_aurel_chat_model_choices',return_value=['gemini-2.5-flash']), \
             patch.object(server,'_aurel_chat_generate',side_effect=generate):
            result=server.ai_chat('Lãi suất VCB hôm nay')
        self.assertIn('tools',captured[0])
        self.assertNotIn('tools',captured[1])
        self.assertIn('AI AUREL chưa có nguồn trực tuyến',result['reply'])
        self.assertFalse(result['grounded'])

    def test_actual_http_search_tool_rejection_is_identified(self):
        payload={'contents':[{'role':'user','parts':[{'text':'Lãi suất hôm nay'}]}],
                 'tools':[{'google_search':{}}]}
        error=HTTPError('https://generativelanguage.googleapis.com',400,
                        'bad request',{},io.BytesIO(b'{"error":{"message":"google_search unavailable"}}'))
        with patch.object(server,'urlopen',side_effect=error):
            with self.assertRaisesRegex(ValueError,'AUREL_SEARCH_GROUNDING_UNAVAILABLE'):
                server._aurel_chat_generate('key',payload,['gemini-2.5-flash'],max_seconds=15)

    def test_metadata_check_is_not_claimed_ready(self):
        with patch.object(server,'gemini_credentials',return_value=
                          ('key','gemini-3-flash-preview',['gemini-3-flash-preview'])), \
             patch.object(server,'_aurel_chat_list_models',
                          return_value=['gemini-3-flash-preview']):
            result=server.gemini_connection_check()
        self.assertTrue(result['connected'])
        self.assertFalse(result['generation_ready'])
        self.assertEqual(result['model'],'gemini-3-flash-preview')

    def test_chat_pins_gemini_3_flash_without_fallbacks(self):
        with patch.object(server,'_gemini_env_key',return_value=''):
            token,model,models=server.gemini_credentials()
        self.assertEqual(model,'gemini-3-flash-preview')
        self.assertEqual(models,['gemini-3-flash-preview'])
        self.assertEqual(token,'fake-test-key')
        self.assertEqual(server._aurel_chat_model_choices('hi',models,token),
                         ['gemini-3-flash-preview'])
        self.assertEqual(server._aurel_chat_model_choices('a'*1000,models,token),
                         ['gemini-3-flash-preview'])

    def test_gemini_3_flash_access_must_be_explicit(self):
        with patch.object(server,'_aurel_chat_list_models',
                          return_value=['gemini-3.8-flash']):
            with self.assertRaisesRegex(ValueError,'Gemini 3 Flash'):
                server.gemini_connection_check()

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


    def test_greeting_and_onboarding_are_really_generated_by_gemini(self):
        captured=[]
        def generate(token,payload,models,**kwargs):
            captured.append(payload['contents'][-1]['parts'][0]['text'])
            return {'text':'🌷 Chào bạn! Mình là trợ lý AUREL dùng Gemini. Rất vui được giúp bạn.',
                    'model':'gemini-2.5-flash'}
        with patch.object(server,'gemini_credentials',
                          return_value=('test-key','gemini-2.5-flash',['gemini-2.5-flash'])), \
             patch.object(server,'_aurel_chat_model_choices',
                          return_value=['gemini-2.5-flash']), \
             patch.object(server,'_aurel_chat_generate',side_effect=generate):
            for prompt in ('hi','Chào bạn!','Bạn là ai?', 'AUREL là gì?'):
                reply=server.ai_chat(prompt)
                self.assertNotIn('local',reply)
                self.assertEqual(reply['model'],'gemini-2.5-flash')
                self.assertIn('🌷',reply['reply'])
        self.assertEqual(captured,['hi','Chào bạn!','Bạn là ai?', 'AUREL là gì?'])

    def test_chat_does_not_import_bank_context_or_fabricated_alias_from_history(self):
        captured={}
        def generate(token,payload,models,**kwargs):
            captured['payload']=payload
            return {'text':'💡 Vietcombank có các mức lãi suất khác nhau theo kỳ hạn.',
                    'model':'gemini-2.5-flash'}
        chat_history=[
            {'role':'user','text':'Giải thích lãi suất tiết kiệm'},
            {'role':'assistant','text':'BANK_001 (VCB) có trang BANK_001.com.vn'},
        ]
        with patch.object(server,'gemini_credentials',
                          return_value=('test-key','gemini-2.5-flash',['gemini-2.5-flash'])), \
             patch.object(server,'_aurel_chat_model_choices',
                          return_value=['gemini-2.5-flash']), \
             patch.object(server,'_aurel_chat_generate',side_effect=generate):
            result=server.ai_chat('VCB có những kỳ hạn gửi tiết kiệm nào?',history=chat_history)
        self.assertEqual(result['model'],'gemini-2.5-flash')
        payload=captured['payload']
        context=json.dumps(payload,ensure_ascii=False)
        self.assertNotIn('BANK_001',context)
        self.assertNotIn('BANK_001.com.vn',context)
        self.assertEqual(payload['contents'][-1]['parts'][0]['text'],
                         'VCB có những kỳ hạn gửi tiết kiệm nào?')
        self.assertNotIn('tools',payload)

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


    def test_aurel_chat_ui_is_branded_and_suggestions_stay_on_website(self):
        page=(Path(__file__).resolve().parents[1]/'financial-intelligence.html').read_text('utf-8')
        encoded=re.search(r'const b="([A-Za-z0-9+/=]+)",s=atob',page)
        self.assertIsNotNone(encoded)
        script=base64.b64decode(encoded.group(1)).decode('utf-8')
        self.assertIn('Chào bạn! 😊 Mình là AI AUREL.',script)
        self.assertIn('Hỏi AI AUREL về chỉ số tài chính hoặc cách sử dụng website',script)
        self.assertIn('Đặt câu hỏi để AI AUREL hỗ trợ bạn.',script)
        self.assertNotIn('Hỏi Gemini về tài chính, tin tức, khoa học',script)
        self.assertNotIn('Phụ thuộc hạn mức Gemini.',script)
        self.assertIn('Giải thích ý nghĩa các chỉ số ROA, ROE và NIM',script)
        self.assertIn('Đối chiếu ngân hàng',page+script)
        self.assertIn('AUREL_CHAT_GROWTH_WARM_SMILE_SCOPED_20261022',page)
        self.assertIn('var changed=false;',page)

    def test_generic_welcome_and_question_suggestions_focus_on_aurel_website(self):
        prompts=[]
        def generate(_token,payload,_models,**_kwargs):
            prompts.append((payload['contents'][-1]['parts'][0]['text'],
                            payload['system_instruction']['parts'][0]['text']))
            return {'text':'Xin chào! Mình hỗ trợ tìm hiểu các chức năng AUREL.',
                    'model':'gemini-3-flash-preview'}
        with patch.object(server,'gemini_credentials',return_value=
                          ('mock-key','gemini-3-flash-preview',['gemini-3-flash-preview'])), \
             patch.object(server,'_aurel_chat_model_choices',
                          return_value=['gemini-3-flash-preview']), \
             patch.object(server,'_aurel_chat_generate',side_effect=generate):
            for q in ('hi','Bạn giúp được gì?','Gợi ý câu hỏi','AUREL là gì?'):
                server.ai_chat(q)
        self.assertEqual(len(prompts),4)
        for _,instructions in prompts:
            self.assertIn('CHẾ ĐỘ CHÀO HỎI/GỢI Ý TRỢ GIÚP AUREL',instructions)
            self.assertIn('Đối chiếu ngân hàng',instructions)
            self.assertIn('Nguồn dữ liệu',instructions)
            self.assertIn('KHÔNG đề xuất học tiếng Anh',instructions)
            self.assertIn('KHÔNG nhắc Gemini',instructions)
            self.assertIn('khoảng 45–85 từ',instructions)

    def test_explicit_other_topic_does_not_trigger_web_first_onboarding(self):
        prompts=[]
        def generate(_token,payload,_models,**_kwargs):
            prompts.append((payload['contents'][-1]['parts'][0]['text'],
                            payload['system_instruction']['parts'][0]['text']))
            return {'text':'Trả lời theo chủ đề người dùng yêu cầu.',
                    'model':'gemini-3-flash-preview'}
        with patch.object(server,'gemini_credentials',return_value=
                          ('mock-key','gemini-3-flash-preview',['gemini-3-flash-preview'])), \
             patch.object(server,'_aurel_chat_model_choices',
                          return_value=['gemini-3-flash-preview']), \
             patch.object(server,'_aurel_chat_generate',side_effect=generate):
            for q in ('Hi, giúp mình học tiếng Anh','Giải thích thuyết tương đối',
                      'Gợi ý câu hỏi về tình yêu','Làm sao làm bánh mì?'):
                server.ai_chat(q)
        for _,instructions in prompts:
            self.assertNotIn('CHẾ ĐỘ CHÀO HỎI/GỢI Ý TRỢ GIÚP AUREL',instructions)
        self.assertEqual([q for q,_ in prompts],
                         ['Hi, giúp mình học tiếng Anh','Giải thích thuyết tương đối',
                          'Gợi ý câu hỏi về tình yêu','Làm sao làm bánh mì?'])

    def test_chat_prompt_allows_any_topic_not_just_aurel_data(self):
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
        self.assertIn('Mọi câu hỏi thông thường phải được Gemini trả lời',captured['instructions'])
        self.assertIn('KHÔNG có dữ liệu',captured['instructions'])
        self.assertIn('Đừng quá cụt lủn',captured['instructions'])
        self.assertIn('Chỉ dùng tối đa một mặt cười nhẹ nhàng',captured['instructions'])
        self.assertEqual(captured['question'],'Giúp mình luyện tiếng Anh')
        self.assertFalse(result['refused'])


if __name__=='__main__':
    unittest.main()
