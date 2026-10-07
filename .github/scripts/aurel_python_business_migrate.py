from pathlib import Path
import base64
import re

TARGET=Path("financial-intelligence.html")
html=TARGET.read_text("utf-8")

m=re.search(r'(<script>\(\(\)=>\{const b=")([A-Za-z0-9+/=]+)(",s=atob\(b\),a=new Uint8Array\(s.length\);)',html)
if not m:
    raise SystemExit("Không tìm thấy payload Base64 chính")
js=base64.b64decode(m.group(2)).decode("utf-8")

old_cmp="""function compareOption(){return compareOptions.find(x=>x.id===app.compareMetric)||compareOptions[0]}
function readCompareMetric(bucket,opt){if(!bucket)return null; if(opt.type==='value') return bucket.values?.[opt.key]??null; const hit=(bucket.ratios||[]).find(x=>x.id===opt.key); return hit?hit.value:null}
function formatCompareValue(value,opt){return opt.fmt==='money'?money(value):percent(value)}
function compareInsight(aVal,bVal,opt,bankA,bankB){
  if(aVal===null||aVal===undefined||bVal===null||bVal===undefined||!Number.isFinite(Number(aVal))||!Number.isFinite(Number(bVal)))return 'Chỉ tiêu được chọn chưa có đủ dữ liệu ở cả hai ngân hàng để đối chiếu.';
  const winner=Number(aVal)>Number(bVal)?bankA:Number(aVal)<Number(bVal)?bankB:null;
  const diff=Math.abs(Number(aVal)-Number(bVal));
  const diffText=opt.fmt==='money'?money(diff)+' tỷ VND':percent(diff)+' điểm phần trăm';
  return winner?winner+' có giá trị cao hơn ở chỉ tiêu “'+opt.label+'” với chênh lệch '+diffText+'.':'Hai ngân hàng có cùng giá trị ở chỉ tiêu “'+opt.label+'”.';
}
// Hai chế độ so sánh dùng chung một thang đo, có mốc 0 cho tỷ lệ tăng trưởng âm.
function compareChartRows(banks,all,opt,mode){
  const valid=v=>v!==null&&v!==undefined&&Number.isFinite(Number(v));
  const rows=banks.map(bank=>({bank,value:readCompareMetric(all[bank],opt)}));
  if(mode==='all')rows.sort((a,b)=>valid(a.value)&&valid(b.value)?Number(b.value)-Number(a.value):valid(a.value)?-1:valid(b.value)?1:a.bank.localeCompare(b.bank,'vi'));
  return rows;
}"""
new_cmp="""function compareOption(){return compareOptions.find(x=>x.id===app.compareMetric)||compareOptions[0]}
function comparisonServerMetric(opt){return app.state?.comparison_python?.[opt.id]||null}
function readCompareMetric(bucket,opt,bank=null){const server=comparisonServerMetric(opt);return bank&&server?.by_bank?server.by_bank[bank]??null:null}
function formatCompareValue(value,opt){return opt.fmt==='money'?money(value):percent(value)}
function compareInsight(aVal,bVal,opt,bankA,bankB){
  const pair=comparisonServerMetric(opt)?.pairs?.[bankA]?.[bankB]||null;
  if(!pair||pair.diff===null||pair.diff===undefined)return 'Chỉ tiêu được chọn chưa có đủ dữ liệu ở cả hai ngân hàng để đối chiếu.';
  const winner=pair.winner||null,diff=Number(pair.diff);
  const diffText=opt.fmt==='money'?money(diff)+' tỷ VND':percent(diff)+' điểm phần trăm';
  return winner?winner+' có giá trị cao hơn ở chỉ tiêu “'+opt.label+'” với chênh lệch '+diffText+'.':'Hai ngân hàng có cùng giá trị ở chỉ tiêu “'+opt.label+'”.';
}
// Python backend quyết định giá trị, chênh lệch và thứ tự; frontend chỉ dựng biểu đồ.
function compareChartRows(banks,all,opt,mode){
  const server=comparisonServerMetric(opt);
  if(!server)return banks.map(bank=>({bank,value:null}));
  if(mode==='all'&&Array.isArray(server.rows))return server.rows.map(x=>({bank:x.bank,value:x.value}));
  return banks.map(bank=>({bank,value:server.by_bank?.[bank]??null}));
}"""
if js.count(old_cmp)!=1:
    raise SystemExit("Khối đối chiếu không đúng phiên bản dự kiến")
js=js.replace(old_cmp,new_cmp,1)

old_pair="""  const aVal=readCompareMetric(a,opt),bVal=readCompareMetric(b,opt);
  const valid=v=>v!==null&&v!==undefined&&Number.isFinite(Number(v));
  const diff=valid(aVal)&&valid(bVal)?Math.abs(Number(aVal)-Number(bVal)):null;"""
new_pair="""  const pair=comparisonServerMetric(opt)?.pairs?.[bankA]?.[bankB]||{};
  const aVal=pair.a_value??null,bVal=pair.b_value??null;
  const diff=pair.diff??null;"""
if js.count(old_pair)!=1:
    raise SystemExit("Khối so sánh cặp không đúng phiên bản dự kiến")
js=js.replace(old_pair,new_pair,1)

s=js.index("function safeRatioClient")
e=js.index("function renderEvaluation",s)
server_eval="""async function hydrateEvaluation(){
  if(!has()){app.evaluationResult=null;return null}
  const result=await request('api/evaluation',{bank:app.bank,year:app.year,manual:loadManualTruth()},20000);
  app.evaluationResult=result;return result;
}
function evaluationFormulaChecks(){return evaluationSnapshot().formula||[]}
function manualVerificationStats(){return evaluationSnapshot().manual||{truth:loadManualTruth(),details:[],checked:0,passed:0,accuracy:null}}
function projectChecklist(){return evaluationSnapshot().checklist||[]}
function evaluationSnapshot(){return app.evaluationResult||{formula:[],manual:{truth:loadManualTruth(),details:[],checked:0,passed:0,accuracy:null},checklist:[],formulaAccuracy:null,trace:null,completeness:null}}
"""
js=js[:s]+server_eval+js[e:]
js=js.replace("Máy chủ so với phép tính kiểm chứng độc lập trên giao diện.","Python backend đối chiếu kết quả với phép tính kiểm chứng độc lập.",1)

s=js.index("function saveManualVerification")
e=js.index("async function runSystemEvaluation",s)
js=js[:s]+"""async function saveManualVerification(){
  const truth=loadManualTruth();
  document.querySelectorAll('[data-manual-metric]').forEach(el=>{
    const key=el.dataset.manualMetric,val=String(el.value||'').trim().replace(',','.');
    if(!val){delete truth[key];return}
    const num=Number(val);if(Number.isFinite(num))truth[key]=num;
  });
  localStorage.setItem(manualTruthKey(),JSON.stringify(truth));
  try{await hydrateEvaluation();toast('Đã lưu bộ giá trị kiểm chứng thủ công trên trình duyệt này.');draw()}catch(e){toast(e.message,true)}
}
"""+js[e:]

s=js.index("async function runSystemEvaluation")
e=js.index("function exportEvaluationCsv",s)
js=js[:s]+"""async function runSystemEvaluation(){
  const btn=$('#run-evaluation');if(btn)btn.disabled=true;const t0=performance.now();
  try{
    const state=await request('api/state?bank='+encodeURIComponent(app.bank||'')+'&year='+encodeURIComponent(app.year||''),null,20000);
    app.evaluationLatency=performance.now()-t0;app.state=state;
    if(state.has_data){app.bank=state.bank;app.year=state.year}
    await hydrateEvaluation();controls();draw();toast('Đã chạy lại kiểm tra hệ thống.');
  }catch(e){toast(e.message,true);if(btn)btn.disabled=false}
}
"""+js[e:]

s=js.index("function exportEvaluationCsv")
e=js.index("function renderReport",s)
js=js[:s]+"""async function exportEvaluationCsv(){
  try{
    const result=await request('api/evaluation/export',{bank:app.bank,year:app.year,manual:loadManualTruth()},20000);
    const blob=new Blob([String(result.csv||'')],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=result.filename||('AUREL_Danh_gia_'+String(app.bank||'du_lieu')+'_'+String(app.year||'')+'.csv');
    document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);toast('Đã xuất kết quả đánh giá CSV.');
  }catch(e){toast(e.message,true)}
}
"""+js[e:]

old_refresh="""async function refresh(){try{const s=await request(`api/state?bank=${encodeURIComponent(app.bank||'')}&year=${encodeURIComponent(app.year||'')}`,null,18000);app.state=s;if(s.has_data){app.bank=s.bank;app.year=s.year}controls();draw()}catch(e){$('#root').innerHTML=title('Chưa thể kết nối','Không lấy được thông tin từ backend AUREL.')+backendSetupHtml(e.message)}}
function navigate(p){app.page=p;draw();window.scrollTo({top:0,behavior:'smooth'})}"""
new_refresh="""async function refresh(){try{const s=await request(`api/state?bank=${encodeURIComponent(app.bank||'')}&year=${encodeURIComponent(app.year||'')}`,null,18000);app.state=s;if(s.has_data){app.bank=s.bank;app.year=s.year}if(app.page==='evaluation'&&s.has_data)await hydrateEvaluation();controls();draw()}catch(e){$('#root').innerHTML=title('Chưa thể kết nối','Không lấy được thông tin từ backend AUREL.')+backendSetupHtml(e.message)}}
async function navigate(p){app.page=p;if(p==='evaluation'&&has()){try{await hydrateEvaluation()}catch(e){toast(e.message,true)}}draw();window.scrollTo({top:0,behavior:'smooth'})}"""
if js.count(old_refresh)!=1:
    raise SystemExit("Khối refresh/navigate không đúng phiên bản dự kiến")
js=js.replace(old_refresh,new_refresh,1)

new_b64=base64.b64encode(js.encode("utf-8")).decode("ascii")
html=html[:m.start(2)]+new_b64+html[m.end(2):]

table1=r"""
(function(){
  'use strict';
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function pct(v){return v==null||!Number.isFinite(Number(v))?'—':new Intl.NumberFormat('vi-VN',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(v))+'%'}
  function money(v){return v==null||!Number.isFinite(Number(v))?'—':new Intl.NumberFormat('vi-VN',{maximumFractionDigits:2}).format(Number(v))}
  function tag(kind){if(kind==='critical')return '<span class="tag danger">Cảnh báo</span>';if(kind==='watch')return '<span class="tag warn">Theo dõi</span>';if(kind==='normal')return '<span class="tag good">Bình thường</span>';return '<span class="tag">Thiếu dữ liệu</span>'}
  function apiBase(){var q='';try{q=new URLSearchParams(location.search).get('api')||''}catch(_){}var v=q||localStorage.getItem('aurel_api_base')||'https://aurel-thanhhochub-backend.onrender.com/';v=String(v||'').trim();if(v&&!/\/$/.test(v))v+='/';return v}
  async function fetchState(bank,year){if(window.AURELPerfFetchState)return window.AURELPerfFetchState(bank,year);var u=new URL('api/state',apiBase());u.searchParams.set('bank',bank||'');u.searchParams.set('year',String(year||''));var r=await fetch(u.toString(),{method:'GET',cache:'no-store',redirect:'follow'});if(!r.ok)throw new Error('HTTP '+r.status);return await r.json()}
  function rowHtml(r){var raw=r.raw_value==null?'—':money(r.raw_value)+' tỷ VND';var indicator=r.value==null?'—':pct(r.value);var formula=(r.label?r.label+' · ':'')+(r.formula||'');return '<tr data-aurel-r124-status="'+esc(r.status)+'"><td><span class="monitor-domain">'+esc(r.group)+'</span></td><td class="num"><div><strong>'+esc(r.i)+'. '+esc(r.name)+'</strong><span class="aurel-r124-id">'+esc(r.id)+'</span></div></td><td class="num"><span class="monitor-value aurel-r124-raw">'+esc(raw)+'</span></td><td class="num"><strong>'+esc(indicator)+'</strong><div class="aurel-r124-formula">'+esc(formula)+'</div></td><td class="num"><div class="monitor-reference">'+esc(r.threshold)+'</div></td><td class="num">'+tag(r.status)+'</td><td class="num"><div class="monitor-action">'+esc(r.meaning)+'</div></td></tr>'}
  function updateSummary(rows){var counts={critical:0,watch:0,normal:0,insufficient:0};rows.forEach(function(r){counts[r.status]=(counts[r.status]||0)+1});var cards=document.querySelectorAll('.monitor-overview .monitor-card'),vals=[counts.critical,counts.watch,counts.normal,counts.insufficient],hints=['Trong 16 tiêu chí','Trong 16 tiêu chí','Trong 16 tiêu chí','Thiếu kỳ trước hoặc giá trị nguồn'];cards.forEach(function(card,i){var strong=card.querySelector('strong'),hint=card.querySelector('.monitor-hint');if(strong)strong.textContent=String(vals[i]||0);if(hint)hint.textContent=hints[i]});var overall=document.querySelector('.monitor-overall');if(overall){var st=overall.querySelector('strong'),sp=overall.querySelector('span');if(st)st.textContent=counts.critical?'Có '+counts.critical+' tiêu chí cảnh báo':counts.watch?'Có '+counts.watch+' tiêu chí cần theo dõi':'Chưa có tiêu chí cảnh báo';if(sp)sp.textContent='Đánh giá đúng 16 tiêu chí, không thêm hoặc bớt tiêu chí.'}}
  async function apply(){if(!document.querySelector('#nav button[data-page="monitor"].active'))return;var table=document.querySelector('.monitor-rules table');if(!table||table.dataset.aurelR124Busy==='1')return;var bankSel=document.getElementById('bank-select'),yearSel=document.getElementById('year-select');var bank=bankSel?bankSel.value:'',year=yearSel?Number(yearSel.value):NaN;if(!bank||!Number.isFinite(year))return;var key=bank+'|'+year;if(table.dataset.aurelR124===key)return;table.dataset.aurelR124Busy='1';try{var state=await fetchState(bank,year),rows=Array.isArray(state&&state.risk_source16)?state.risk_source16:[];if(rows.length!==16)throw new Error('Backend Python chưa trả đủ 16 tiêu chí.');document.querySelectorAll('.monitor-rules .aurel-r124-source-note').forEach(function(n){n.remove()});table.querySelector('thead').innerHTML='<tr><th>Nhóm</th><th class="num">Tiêu chí</th><th class="num">Giá trị gốc</th><th class="num">Chỉ báo giám sát</th><th class="num">Ngưỡng sàng lọc</th><th class="num">Mức độ</th><th class="num">Ý nghĩa rủi ro</th></tr>';table.querySelector('tbody').innerHTML=rows.map(rowHtml).join('');table.dataset.aurelR124=key;var panel=table.closest('.panel');if(panel){var h2=panel.querySelector('.section-top h2'),small=panel.querySelector('.section-top small');if(h2)h2.textContent='Bảng giám sát rủi ro từ 16 tiêu chí';if(small)small.textContent='16/16 tiêu chí'}var limitation=document.querySelector('.monitor-rules + .note');if(limitation)limitation.innerHTML='<strong>Phạm vi dữ liệu:</strong> Bảng chỉ dùng đúng 16 tiêu chí nguồn, không thêm hoặc bớt. Đây là lớp sàng lọc rủi ro từ dữ liệu BCTC hiện có, không phải bộ kiểm tra đầy đủ các tỷ lệ an toàn ngân hàng.';updateSummary(rows);document.dispatchEvent(new CustomEvent('aurel:risk-rendered',{detail:{key:key}}))}catch(e){}finally{table.dataset.aurelR124Busy='0'}}
  var timer=null;function expectedKey(){var b=document.getElementById('bank-select'),y=document.getElementById('year-select');return b&&b.value&&y&&y.value?String(b.value)+'|'+String(y.value):''}function schedule(delay){clearTimeout(timer);timer=setTimeout(apply,delay==null?40:delay)}function needsRun(){if(!document.body.classList.contains('aurel-page-monitor'))return false;var table=document.querySelector('.monitor-rules table');return !!(table&&table.dataset.aurelR124!==expectedKey()&&table.dataset.aurelR124Busy!=='1')}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){if(needsRun())schedule(50)},{once:true});else if(needsRun())schedule(50);document.addEventListener('aurel:dom-render',function(){if(needsRun())schedule(30)});document.addEventListener('pointerdown',function(e){var b=e.target&&e.target.closest?e.target.closest('#nav button[data-page="monitor"]'):null;if(b)schedule(60)},{capture:true,passive:true});document.addEventListener('change',function(e){var t=e.target;if(t&&(t.id==='bank-select'||t.id==='year-select'))schedule(50)},true);
})();
"""
n=re.subn(r'(?s)(<script id="AUREL_R124_DATA16_RISK_TABLE_JS">).*?(</script>)',lambda x:x.group(1)+table1+x.group(2),html,count=1)
html,count1=n

table2=r"""
(function(){
  'use strict';var lastKey='',timer=null;
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function pct(v){return v==null||!Number.isFinite(Number(v))?'—':new Intl.NumberFormat('vi-VN',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(v))+'%'}
  function pp(v){if(v==null||!Number.isFinite(Number(v)))return '—';return (Number(v)>0?'+':'')+new Intl.NumberFormat('vi-VN',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(v))+' điểm %'}
  function money(v){return v==null||!Number.isFinite(Number(v))?'—':new Intl.NumberFormat('vi-VN',{maximumFractionDigits:1}).format(Number(v))+' tỷ VND'}
  function statusTag(s){if(s==='critical')return '<span class="tag danger">Cảnh báo</span>';if(s==='watch')return '<span class="tag warn">Theo dõi</span>';if(s==='normal')return '<span class="tag good">Bình thường</span>';return '<span class="tag">Thiếu dữ liệu</span>'}
  function apiBase(){var q='';try{q=new URLSearchParams(location.search).get('api')||''}catch(_){}var v=q||localStorage.getItem('aurel_api_base')||'https://aurel-thanhhochub-backend.onrender.com/';v=String(v||'').trim();if(v&&!/\/$/.test(v))v+='/';return v}
  async function fetchState(bank,year){if(window.AURELPerfFetchState)return window.AURELPerfFetchState(bank,year);var u=new URL('api/state',apiBase());u.searchParams.set('bank',bank);u.searchParams.set('year',String(year));var r=await fetch(u.toString(),{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);var j=await r.json();return j&&j.has_data===false?null:j}
  function rawItemHtml(x){var value=x&&x.format==='percent'?pct(x.value):money(x&&x.value);return '<div><b>'+esc(x&&x.label)+':</b> '+esc(value)+'</div>'}
  function indicatorHtml(x){if(!x)return '—';if(x.kind==='pp')return esc(pp(x.value));if(x.kind==='dual')return 'ROA '+esc(pct(x.roa))+' · ROE '+esc(pct(x.roe));if(x.kind==='income')return 'NII/TOI '+esc(pct(x.niiShare))+' · Fee/TOI '+esc(pct(x.feeShare));return esc(pct(x.value))}
  function row(r){return '<tr data-aurel-r124-status="'+esc(r.status)+'"><td><span class="aurel-risk-group">'+esc(r.group)+'</span></td><td class="aurel-risk-criterion"><strong>'+esc(r.i)+'. '+esc(r.name)+'</strong><span class="aurel-risk-key">'+esc(r.id)+'</span></td><td><div class="aurel-risk-raw">'+(Array.isArray(r.raw_items)?r.raw_items.map(rawItemHtml).join(''):'')+'</div></td><td class="aurel-risk-indicator"><strong>'+indicatorHtml(r.indicator)+'</strong><div class="aurel-risk-formula">'+esc(r.formula)+'</div></td><td><div class="aurel-risk-threshold">'+String(r.threshold||'')+'</div></td><td>'+statusTag(r.status)+'</td><td><div class="aurel-risk-meaning">'+esc(r.meaning)+'</div></td></tr>'}
  function setup(){if(!document.querySelector('#nav button[data-page="monitor"].active'))return null;var panel=document.querySelector('.monitor-rules');if(!panel)return null;var originalWrap=panel.querySelector('.table-wrap');if(!originalWrap)return null;var switcher=panel.querySelector('.aurel-risk-table-switch');if(!switcher){originalWrap.classList.add('aurel-risk-table-pane','aurel-risk-original');switcher=document.createElement('div');switcher.className='aurel-risk-table-switch';switcher.setAttribute('role','tablist');switcher.innerHTML='<button type="button" class="active" data-risk-pane="original" role="tab" aria-selected="true">Bảng 1 · Chỉ tiêu gốc</button><button type="button" data-risk-pane="derived" role="tab" aria-selected="false">Bảng 2 · Chỉ số rủi ro dẫn xuất</button>';var top=panel.querySelector('.section-top');if(top)top.appendChild(switcher);var derived=document.createElement('div');derived.className='aurel-risk-table-pane aurel-risk-derived';derived.hidden=true;derived.innerHTML='<div class="aurel-risk-derived-head"><strong>Bảng 2 · Giám sát rủi ro từ 16 chỉ số dẫn xuất</strong><span>Tính trực tiếp từ 16 chỉ tiêu BCTC hiện có</span></div><div class="table-wrap"><table><thead><tr><th>Nhóm</th><th>Tiêu chí</th><th>Giá trị gốc</th><th>Chỉ báo giám sát</th><th>Ngưỡng sàng lọc</th><th>Mức độ</th><th>Ý nghĩa rủi ro</th></tr></thead><tbody><tr><td colspan="7"><div class="aurel-risk-loading">Đang tính các chỉ số rủi ro…</div></td></tr></tbody></table></div>';originalWrap.insertAdjacentElement('afterend',derived);document.dispatchEvent(new CustomEvent('aurel:risk-derived-ready'));switcher.addEventListener('click',function(e){var b=e.target.closest('button[data-risk-pane]');if(!b)return;var pane=b.getAttribute('data-risk-pane');switcher.querySelectorAll('button').forEach(function(x){var on=x===b;x.classList.toggle('active',on);x.setAttribute('aria-selected',on?'true':'false')});originalWrap.hidden=pane!=='original';derived.hidden=pane!=='derived';if(pane==='derived')schedule(true)})}return panel}
  async function apply(force){var panel=setup();if(!panel)return;var derivedPane=panel.querySelector('.aurel-risk-derived');if(derivedPane&&derivedPane.hidden)return;var bankSel=document.getElementById('bank-select'),yearSel=document.getElementById('year-select');var bank=bankSel&&bankSel.value,year=yearSel?Number(yearSel.value):NaN;if(!bank||!Number.isFinite(year))return;var key=bank+'|'+year;if(!force&&lastKey===key)return;lastKey=key;var tbody=panel.querySelector('.aurel-risk-derived tbody');if(!tbody)return;tbody.innerHTML='<tr><td colspan="7"><div class="aurel-risk-loading">Đang tính các chỉ số rủi ro…</div></td></tr>';try{var state=await fetchState(bank,year),rows=Array.isArray(state&&state.risk_derived16)?state.risk_derived16:[];if(rows.length!==16)throw new Error('Backend Python chưa trả đủ 16 chỉ số dẫn xuất.');tbody.innerHTML=rows.map(row).join('')}catch(e){tbody.innerHTML='<tr><td colspan="7"><div class="aurel-risk-loading">Chưa đủ dữ liệu để tính Bảng 2.</div></td></tr>'}}
  function schedule(force,delay){clearTimeout(timer);timer=setTimeout(function(){setup();apply(!!force)},delay==null?50:delay)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setup()},{once:true});else setup();document.addEventListener('aurel:dom-render',function(){if(document.body.classList.contains('aurel-page-monitor'))setup()});document.addEventListener('change',function(e){var t=e.target;if(!t||(t.id!=='bank-select'&&t.id!=='year-select'))return;lastKey='';var panel=document.querySelector('.monitor-rules'),pane=panel&&panel.querySelector('.aurel-risk-derived');if(pane&&!pane.hidden)schedule(true,70)},true);
})();
"""
html,count2=re.subn(r'(?s)(<script id="AUREL_RISK_DERIVED_TABLE_V1_SCRIPT">).*?(</script>)',lambda x:x.group(1)+table2+x.group(2),html,count=1)

if count1!=1 or count2!=1:
    raise SystemExit("Không thay được đúng 2 script rủi ro")
for banned in ("DATA_XLSX_PROVISION_MILLION","'VCB|2023':-4564876","'BIDV|2025':-22998662","_aurelSource:'Data.xlsx'"):
    if banned in html:
        raise SystemExit("Còn hard-code: "+banned)

TARGET.write_text(html,"utf-8")
print("AUREL frontend migrated to Python business logic")
