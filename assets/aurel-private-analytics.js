/* AUREL PRIVATE ANALYTICS v1.
 * Browser-only CSV/XLSX -> normalized banking rows -> existing AUREL chart/ratio model.
 * No network calls. Strictly refuse unsupported input; PDF analysis is not available.
 */
(function(){
'use strict';
var KEYS=['assets','liabilities','equity','loans','deposits','npl','pat','operating_income','operating_expenses','provisions','interest_income','interest_expense','cash','investments','fixed_assets','net_interest_income','net_fee_income','pre_tax_profit','other_income','casa','group1_loans','group2_loans','group3_loans','group4_loans','group5_loans','loan_loss_reserve','cfo','car'];
var FIELD_LABELS=['Tổng tài sản','Nợ phải trả','Vốn chủ sở hữu','Dư nợ cho vay','Tiền gửi khách hàng','Nợ xấu','Lợi nhuận sau thuế','Tổng thu nhập hoạt động','Chi phí hoạt động','Chi phí dự phòng rủi ro','Thu nhập lãi','Chi phí lãi','Tiền và tương đương tiền','Đầu tư tài chính','Tài sản cố định','Thu nhập lãi thuần','Lãi thuần từ hoạt động dịch vụ','Lợi nhuận trước thuế','Thu nhập khác','Tiền gửi không kỳ hạn','Nợ nhóm 1','Nợ nhóm 2','Nợ nhóm 3','Nợ nhóm 4','Nợ nhóm 5','Số dư dự phòng rủi ro cho vay','Dòng tiền thuần từ HĐKD','Tỷ lệ an toàn vốn (CAR)'];
var FIELDS=Object.fromEntries(KEYS.map(function(k,i){return [k,FIELD_LABELS[i]]}));
var SOURCE16=[['total_assets','assets','Tổng tài sản'],['customer_loans','loans','Cho vay khách hàng'],['customer_deposits','deposits','Tiền gửi của khách hàng'],['cash_and_equivalents','cash','Tiền và tương đương tiền'],['total_equity','equity','Tổng cộng vốn chủ sở hữu'],['group1_loans','group1_loans','Nợ nhóm 1'],['group2_loans','group2_loans','Nợ nhóm 2'],['group3_loans','group3_loans','Nợ nhóm 3'],['group4_loans','group4_loans','Nợ nhóm 4'],['group5_loans','group5_loans','Nợ nhóm 5'],['net_interest_income','net_interest_income','Thu nhập lãi thuần'],['net_fee_income','net_fee_income','Lãi thuần dịch vụ'],['total_operating_income','operating_income','Tổng thu nhập hoạt động'],['operating_expenses','operating_expenses','Chi phí hoạt động'],['credit_loss_provision_expense','provisions','Chi phí dự phòng'],['profit_after_tax','pat','Lợi nhuận sau thuế']];
var ALIASES={total_assets:'assets',customer_loans:'loans',customer_deposits:'deposits',cash_and_equivalents:'cash',total_equity:'equity',total_operating_income:'operating_income',credit_loss_provision_expense:'provisions',profit_after_tax:'pat'};
var COLS={'bank':'bank','bank code':'bank','bank_code':'bank','ma ngan hang':'bank','ngan hang':'bank','year':'year','nam':'year','report year':'year','report_year':'year','metric id':'metric_id','metric_id':'metric_id','metric':'metric_id','ma chi tieu':'metric_id','chi tieu':'metric_id','metric name':'metric_name','metric_name':'metric_name','name':'metric_name','ten chi tieu':'metric_name','value':'value','gia tri':'value','amount':'value','so lieu':'value','unit':'unit','don vi':'unit','dvt':'unit','source file':'source_file','source_file':'source_file','source':'source_file','source page':'source_page','source_page':'source_page','page':'source_page','statement type':'statement_type','statement_type':'statement_type'};
var UNITS={'billion_vnd':1,'ty_vnd':1,'ty vnd':1,'million_vnd':0.001,'trieu_vnd':0.001,'trieu vnd':0.001,'thousand_vnd':0.000001,'nghin_vnd':0.000001,'nghin vnd':0.000001,'vnd':1e-9,'percent':1,'phan tram':1,'%':1};
var NONNEG=new Set(['assets','liabilities','loans','deposits','npl','cash','investments','fixed_assets','casa','group1_loans','group2_loans','group3_loans','group4_loans','group5_loans','loan_loss_reserve']);
var activeRows=[],activeFiles=[],pending=null,revision=0,loaded=false,errorText='',busy=false,serial=0,cache=new Map();
function norm(v){return String(v==null?'':v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().replace(/[^a-z0-9_]+/g,' ').trim().replace(/\s+/g,' ')}
function canonical(v){var raw=String(v||'').trim(),n=norm(raw);return COLS[raw.toLowerCase()]||COLS[n]||raw.toLowerCase()}
function metric(a,b){
 var c=String(a||'').toLowerCase().trim(),k=c.replace(/\s+/g,'_');
 if(FIELDS[c])return c;if(FIELDS[k])return k;
 if(ALIASES[c])return ALIASES[c];if(ALIASES[k])return ALIASES[k];
 var n=norm(b||a);for(var i=0;i<KEYS.length;i++)if(n===norm(FIELD_LABELS[i]))return KEYS[i];
 for(var j=0;j<SOURCE16.length;j++)if(n===norm(SOURCE16[j][2]))return SOURCE16[j][1];
 return '';
}
function number(v){
 if(typeof v==='number')return Number.isFinite(v)?v:null;
 if(v==null||v===''||typeof v==='boolean')return null;
 var s=String(v).trim().replace(/\s/g,'').replace(/−/g,'-');
 if(!s)return null;
 if(s.indexOf(',')>=0&&s.indexOf('.')>=0){
  if(s.lastIndexOf(',')>s.lastIndexOf('.'))s=s.replace(/\./g,'').replace(',','.');
  else s=s.replace(/,/g,'');
 }else if(s.indexOf(',')>=0){
  var ps=s.split(',');s=ps.length>1&&ps.slice(1).every(function(x){return x.length===3})?ps.join(''):s.replace(',','.');
 }
 var v2=Number(s);return Number.isFinite(v2)?v2:null;
}
function validRow(data,line,file){
 var r={};for(var [k,v] of Object.entries(data)){var alias=canonical(k);if(!(alias in r))r[alias]=v}
 var bank=String(r.bank||'').trim().toUpperCase(),year=number(r.year),key=metric(r.metric_id,r.metric_name),un=norm(r.unit||'').replace(/ /g,'_');
 if(bank.length<2||bank.length>100||/[<>\u0000-\u001F]/.test(bank))throw Error(file+' · dòng '+line+': mã ngân hàng không hợp lệ.');
 if(year===null||!Number.isInteger(year)||year<2000||year>2100)throw Error(file+' · dòng '+line+': năm báo cáo không hợp lệ.');
 if(!key)throw Error(file+' · dòng '+line+': không nhận diện chỉ tiêu '+String(r.metric_id||r.metric_name||''));
 var factor=UNITS[un];if(factor===undefined)throw Error(file+' · dòng '+line+': đơn vị '+String(r.unit||'')+' không được hỗ trợ.');
 if((key==='car')!==(un==='percent'||un==='phan_tram'||un==='%'))throw Error(file+' · dòng '+line+': đơn vị CAR/tiền tệ không phù hợp.');
 var val=number(r.value);if(val===null)throw Error(file+' · dòng '+line+': giá trị không hợp lệ.');
 val=Math.round(val*factor*1e9)/1e9;
 if(NONNEG.has(key)&&val<0)throw Error(file+' · dòng '+line+': chỉ tiêu không được âm.');
 if(key==='car'&&(val<0||val>100))throw Error(file+' · dòng '+line+': CAR vượt 0–100%.');
 return {bank:bank,year:year,metric_id:key,value:val,unit:key==='car'?'percent':'billion_vnd',
  source_file:String(r.source_file||file).slice(0,180),source_page:String(r.source_page||''),
  statement_type:String(r.statement_type||'unspecified').toLowerCase(),origin:'private_local'};
}
function csvRows(text){
 var out=[],row=[],part='',quotes=false;
 text=text.replace(/^\uFEFF/,'');
 for(var i=0;i<text.length;i++){
  var ch=text[i];
  if(quotes){if(ch==='"'&&text[i+1]==='"'){part+='"';i++}else if(ch==='"')quotes=false;else part+=ch}
  else if(ch==='"')quotes=true;
  else if(ch===','){row.push(part);part=''}
  else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(part);part='';out.push(row);row=[]}
  else part+=ch;
 }
 if(quotes)throw Error('CSV có dấu ngoặc kép chưa đóng.');
 if(row.length||part){row.push(part);out.push(row)}
 return out;
}
function tableToRecords(matrix,file){
 if(matrix.length<2)throw Error(file+': bảng thiếu dòng dữ liệu.');
 var header=matrix[0].map(function(x){return String(x||'')});
 var mapped=header.map(canonical);
 for(var field of ['bank','year','metric_id','value','unit'])if(!mapped.includes(field)){
  if(field==='metric_id'&&mapped.includes('metric_name'))continue;
  throw Error(file+': thiếu cột '+field+'. Cần định dạng bảng chuẩn financial_data.');
 }
 var rows=[];
 for(var i=1;i<matrix.length;i++){
  if(matrix[i].every(function(x){return x==null||x===''}))continue;
  var obj={};header.forEach(function(h,j){obj[h]=matrix[i][j]});
  rows.push(validRow(obj,i+1,file));
  if(rows.length>50000)throw Error('Tối đa 50.000 dòng.');
 }
 return rows;
}
function hex(v){return v.toString(16).padStart(2,'0')}
function textBytes(array){return new TextDecoder('utf-8',{fatal:true}).decode(array)}
function little16(view,at){return view.getUint16(at,true)}
function little32(view,at){return view.getUint32(at,true)}
async function unzip(bytes){
 var a=new Uint8Array(bytes),dv=new DataView(a.buffer,a.byteOffset,a.byteLength),found=-1;
 for(var i=a.length-22;i>=Math.max(0,a.length-65557);i--){if(little32(dv,i)===0x06054b50){found=i;break}}
 if(found<0)throw Error('Excel không có cấu trúc ZIP hợp lệ.');
 var count=little16(dv,found+10),offset=little32(dv,found+16);
 if(count>2000)throw Error('Excel có quá nhiều thành phần.');
 var map=new Map(),pos=offset,total=0;
 for(var c=0;c<count;c++){
  if(little32(dv,pos)!==0x02014b50)throw Error('Cấu trúc XLSX hỏng.');
  var method=little16(dv,pos+10),compressed=little32(dv,pos+20),plain=little32(dv,pos+24),n=little16(dv,pos+28),extra=little16(dv,pos+30),comment=little16(dv,pos+32),local=little32(dv,pos+42);
  var name=textBytes(a.subarray(pos+46,pos+46+n));pos+=46+n+extra+comment;
  if(name.includes('..')||name.startsWith('/'))throw Error('Excel chứa đường dẫn bất thường.');
  if(plain>50*1024*1024||total+plain>100*1024*1024)throw Error('Excel vượt dung lượng xử lý an toàn.');
  total+=plain;
  if(name==='xl/sharedStrings.xml'||name==='xl/workbook.xml'||name==='xl/_rels/workbook.xml.rels'||/^xl\/worksheets\/sheet\d+\.xml$/.test(name)){
   if(little32(dv,local)!==0x04034b50)throw Error('Excel bị lỗi mục lục.');
   var n2=little16(dv,local+26),ex2=little16(dv,local+28),start=local+30+n2+ex2;
   if(start+compressed>a.length)throw Error('Excel không đầy đủ.');
   var part=a.subarray(start,start+compressed),out;
   if(method===0)out=part;
   else if(method===8){
    if(typeof DecompressionStream!=='function')throw Error('Trình duyệt chưa hỗ trợ giải nén Excel. Hãy dùng CSV UTF-8.');
    var stream=new Blob([part]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    out=new Uint8Array(await new Response(stream).arrayBuffer());
   }else throw Error('Excel dùng kiểu nén không hỗ trợ.');
   if(out.length!==plain)throw Error('Dữ liệu nén trong Excel bị sai.');
   map.set(name,textBytes(out));
  }
 }
 return map;
}
function xml(v){
 var p=new DOMParser().parseFromString(v,'application/xml');
 if(p.querySelector('parsererror'))throw Error('XML của tệp Excel bị lỗi.');
 return p;
}
function tag(parent,name){return Array.from(parent.getElementsByTagName('*')).filter(function(x){return x.localName===name})}
function first(parent,name){return tag(parent,name)[0]}
async function xlsxRows(bytes){
 var files=await unzip(bytes),w=files.get('xl/workbook.xml');
 if(!w)throw Error('Thiếu workbook.xml');
 var wp=xml(w),sheets=tag(wp,'sheet'),sel=sheets.find(function(s){return s.getAttribute('name')==='financial_data'})||sheets[0];
 if(!sel)throw Error('Excel không có trang tính.');
 var rid=sel.getAttribute('r:id')||sel.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id');
 var rels=files.get('xl/_rels/workbook.xml.rels'),target='';
 if(rels&&rid){
  var rel=tag(xml(rels),'Relationship').find(function(x){return x.getAttribute('Id')===rid});
  if(rel)target=rel.getAttribute('Target')||'';
 }
 var loc=target?target.replace(/^\//,'').replace(/^xl\//,''):'worksheets/sheet'+(sheets.indexOf(sel)+1)+'.xml';
 if(loc.includes('..'))throw Error('Excel có liên kết trang tính không hợp lệ.');
 var sheet=files.get('xl/'+loc);
 if(!sheet)throw Error('Không tìm thấy trang tính '+sel.getAttribute('name'));
 var shared=[];
 if(files.has('xl/sharedStrings.xml'))shared=tag(xml(files.get('xl/sharedStrings.xml')),'si').map(function(x){
  return tag(x,'t').map(function(z){return z.textContent||''}).join('');
 });
 var matrix=[];
 for(var r of tag(xml(sheet),'row')){
  var row=[],cells=tag(r,'c');
  for(var c of cells){
   var ref=c.getAttribute('r')||'',letters=(ref.match(/^[A-Z]+/)||[''])[0],idx=0;
   for(var char of letters)idx=idx*26+char.charCodeAt(0)-64;
   idx=idx?idx-1:row.length;if(idx>400)throw Error('Excel có quá nhiều cột.');
   var t=c.getAttribute('t')||'',v=first(c,'v'),inline=first(c,'is'),raw=v?v.textContent:'';
   var val=t==='s'?shared[Number(raw)]||'':t==='inlineStr'?tag(inline||c,'t').map(function(x){return x.textContent||''}).join(''):t==='b'?raw==='1':t==='str'?raw:(raw!==''?Number(raw):'');
   if(t!=='s'&&t!=='inlineStr'&&t!=='b'&&t!=='str'&&val!==''&&!Number.isFinite(val))val=raw;
   row[idx]=val;
  }
  matrix.push(row);
  if(matrix.length>50001)throw Error('Excel vượt 50.000 dòng.');
 }
 return matrix;
}
function groupCheck(rows){
 var seen=new Set(),by=new Map();
 for(var r of rows){
  var key=r.bank+'|'+r.year+'|'+r.metric_id;
  if(seen.has(key))throw Error('Trùng chỉ tiêu '+key+' trong dữ liệu PRIVATE.');
  seen.add(key);
  var g=r.bank+'|'+r.year;if(!by.has(g))by.set(g,new Map());
  by.get(g).set(r.metric_id,r.value);
 }
 for(var [name,v] of by){
  if(v.has('assets')&&v.has('liabilities')&&v.has('equity')){
   var err=Math.abs(v.get('assets')-v.get('liabilities')-v.get('equity'));
   if(err>Math.max(.005,.001*Math.abs(v.get('assets'))))throw Error(name+': tổng tài sản không bằng nợ phải trả + vốn chủ.');
  }
  if(v.has('npl')&&v.has('loans')&&v.get('npl')>v.get('loans'))throw Error(name+': nợ xấu vượt dư nợ.');
 }
}
function pct(a,b){return a==null||b==null||b===0?null:Math.round(a/b*1e7)/1e5}
function gr(a,b){return a==null||b==null||b===0?null:Math.round((a/b-1)*1e7)/1e5}
function values(bank,year){var m={};for(var r of activeRows)if(r.bank===bank&&r.year===year)m[r.metric_id]=r.value;
 if(m.npl==null&&['group3_loans','group4_loans','group5_loans'].every(function(x){return m[x]!=null}))m.npl=Math.round((m.group3_loans+m.group4_loans+m.group5_loans)*1e9)/1e9;
 return m;
}
function ratios(bank,year){
 var v=values(bank,year),o=values(bank,year-1),g=function(k){return gr(v[k],o[k])};
 var d=[
 ['npl_ratio','Tỷ lệ nợ xấu',pct(v.npl,v.loans),'(Nợ nhóm 3 + nhóm 4 + nhóm 5) / Dư nợ cho vay × 100'],
 ['ldr','Dư nợ / Tiền gửi',pct(v.loans,v.deposits),'Dư nợ cho vay / Tiền gửi khách hàng × 100'],
 ['equity_assets','Vốn chủ sở hữu / Tài sản',pct(v.equity,v.assets),'Vốn chủ sở hữu / Tổng tài sản × 100'],
 ['cir','Chi phí / Thu nhập (CIR)',pct(v.operating_expenses==null?null:Math.abs(v.operating_expenses),v.operating_income),'|Chi phí hoạt động| / Tổng thu nhập hoạt động × 100'],
 ['loans_assets','Dư nợ / Tổng tài sản',pct(v.loans,v.assets),'Dư nợ cho vay / Tổng tài sản × 100'],
 ['deposits_assets','Tiền gửi / Tổng tài sản',pct(v.deposits,v.assets),'Tiền gửi khách hàng / Tổng tài sản × 100'],
 ['roa','ROA (tài sản bình quân)',v.assets==null||o.assets==null?null:pct(v.pat,(v.assets+o.assets)/2),'LNST / Tài sản bình quân hai thời điểm × 100'],
 ['roe','ROE (vốn bình quân)',v.equity==null||o.equity==null?null:pct(v.pat,(v.equity+o.equity)/2),'LNST / Vốn chủ sở hữu bình quân hai thời điểm × 100'],
 ['pat_growth','Tăng trưởng lợi nhuận sau thuế',o.pat==null||o.pat<=0?null:g('pat'),'LNST năm nay / LNST năm trước − 1; chỉ tính khi năm trước > 0'],
 ['asset_growth','Tăng trưởng tổng tài sản',g('assets'),'Tổng tài sản năm nay / năm trước − 1'],
 ['loan_growth','Tăng trưởng dư nợ cho vay',g('loans'),'Dư nợ năm nay / năm trước − 1']
 ];return d.map(function(x){return {id:x[0],name:x[1],value:x[2],unit:'%',formula:x[3]}});
}
var BANDS=[['AQ01','Chất lượng tài sản','Tỷ lệ nợ xấu','npl_ratio','high',1.5,2],['AQ02','Chất lượng tài sản','Tăng trưởng nợ xấu','npl_growth','high',15,30],['FUND01','Nguồn vốn & thanh khoản','Dư nợ / Tiền gửi khách hàng','ldr','high',90,100],['EFF01','Hiệu quả hoạt động','CIR','cir','high',40,45],['EARN01','Khả năng sinh lời','Tăng trưởng LNST','pat_growth','low',0,-10],['CAP01','Đệm vốn kế toán','VCSH / Tổng tài sản','equity_assets','low',9,7]];
function risk(bank,year){
 function measure(year,id){
  var v=values(bank,year),o=values(bank,year-1);
  if(id==='npl_growth')return o.npl>0?gr(v.npl,o.npl):null;
  var r=ratios(bank,year).find(function(x){return x.id===id});return r?r.value:null;
 }
 return BANDS.map(function(r){
  var cur=measure(year,r[3]),old=measure(year-1,r[3]),direction=r[4];
  var status=cur==null?'insufficient':direction==='high'?(cur>=r[6]?'critical':cur>=r[5]?'watch':'normal'):(cur<=r[6]?'critical':cur<=r[5]?'watch':'normal');
  return {id:r[0],domain:r[1],name:r[2],value:cur,previous:old,delta:cur==null||old==null?null:cur-old,
   watch_threshold:r[5],critical_threshold:r[6],direction:direction,status:status,
   reference:'Ngưỡng theo dõi nội bộ, không phải giới hạn pháp lý NHNN.',
   description:r[2]+' tính từ dữ liệu BCTC đã nhập.',action:'Đối chiếu thay đổi với dữ liệu nguồn và năm trước.'};
 });
}
var COMPS=[['assets','Tổng tài sản','value','assets'],['loans','Dư nợ cho vay','value','loans'],['deposits','Tiền gửi khách hàng','value','deposits'],['equity','Vốn chủ sở hữu','value','equity'],['pat','Lợi nhuận sau thuế','value','pat'],['npl','Nợ xấu','value','npl'],['npl_ratio','Tỷ lệ nợ xấu','ratio','npl_ratio'],['ldr','Dư nợ / Tiền gửi','ratio','ldr'],['equity_assets','Vốn chủ sở hữu / Tài sản','ratio','equity_assets'],['cir','Chi phí / Thu nhập (CIR)','ratio','cir'],['roa','ROA','ratio','roa'],['roe','ROE','ratio','roe'],['pat_growth','Tăng trưởng lợi nhuận sau thuế','ratio','pat_growth'],['asset_growth','Tăng trưởng tổng tài sản','ratio','asset_growth'],['loan_growth','Tăng trưởng dư nợ cho vay','ratio','loan_growth']];
function compare(year){
 var banks=[...new Set(activeRows.filter(function(r){return r.year===year}).map(function(r){return r.bank}))].sort();
 var pairs={};for(var b of banks)pairs[b]={values:values(b,year),ratios:ratios(b,year)};
 var payload={};
 for(var def of COMPS){
  var by={};for(var bank of banks){var v=pairs[bank];by[bank]=def[2]==='value'?v.values[def[3]]??null:v.ratios.find(function(r){return r.id===def[3]})?.value??null}
  var sorted=banks.map(function(b){return {bank:b,value:by[b]}}).sort(function(a,b){return a.value==null?1:b.value==null?-1:(b.value-a.value)||a.bank.localeCompare(b.bank)});
  var matches={};for(var a of banks){matches[a]={};for(var b of banks){
   var va=by[a],vb=by[b];matches[a][b]={a_value:va,b_value:vb,diff:va==null||vb==null?null:Math.abs(va-vb),winner:va==null||vb==null||va===vb?null:va>vb?a:b}
  }}
  payload[def[0]]={spec:{id:def[0],label:def[1],type:def[2],key:def[3],unit:def[2]==='value'?'tỷ VND':'%',fmt:def[2]==='value'?'money':'percent'},by_bank:by,rows:sorted,pairs:matches};
 }
 return {pairs:pairs,payload:payload};
}
function source16(bank,year){
 var cur=values(bank,year),prev=values(bank,year-1),ratio=(a,b)=>pct(a,b);
 var check=[
 [gr(cur.assets,prev.assets),0,25,-5,35,'Tăng trưởng TTS YoY'],
 [gr(cur.loans,prev.loans),0,18,-5,25,'Tăng trưởng cho vay YoY'],
 [gr(cur.deposits,prev.deposits),0,1,-10,99,'Tăng trưởng tiền gửi YoY'],
 [ratio(cur.cash,cur.assets),10,999,5,999,'Tiền & TĐT / Tổng tài sản'],
 [ratio(cur.equity,cur.assets),6,999,4,999,'VCSH / Tổng tài sản'],
 [ratio(cur.group1_loans,cur.loans),97,999,95,999,'Nợ nhóm 1 / Cho vay'],
 [ratio(cur.group2_loans,cur.loans),1.5,999,3,999,'Nợ nhóm 2 / Cho vay'],
 [ratio(cur.group3_loans,cur.loans),.5,999,1,999,'Nợ nhóm 3 / Cho vay'],
 [ratio(cur.group4_loans,cur.loans),.5,999,1,999,'Nợ nhóm 4 / Cho vay'],
 [ratio(cur.group5_loans,cur.loans),.75,999,1.5,999,'Nợ nhóm 5 / Cho vay'],
 [gr(cur.net_interest_income,prev.net_interest_income),0,999,-10,999,'Tăng trưởng NII YoY'],
 [gr(cur.net_fee_income,prev.net_fee_income),0,999,-20,999,'Tăng trưởng phí YoY'],
 [gr(cur.operating_income,prev.operating_income),0,999,-10,999,'Tăng trưởng TOI YoY'],
 [pct(cur.operating_expenses==null?null:Math.abs(cur.operating_expenses),cur.operating_income),45,999,50,999,'CIR'],
 [pct(cur.provisions==null?null:Math.abs(cur.provisions),cur.loans==null?null:(cur.loans+(prev.loans??cur.loans))/2),1,999,2,999,'Credit cost proxy'],
 [gr(cur.pat,prev.pat),0,999,-10,999,'Tăng trưởng PAT YoY']
 ];
 return SOURCE16.map(function(d,i){
  var val=check[i][0],lo=check[i][1],hi=check[i][2],clo=check[i][3],chi=check[i][4];
  var status=val==null?'insufficient':(i<6&&i!==5||i===10||i===11||i===12||i===15)?
   (val<clo||(chi<999&&val>chi)?'critical':val<lo||(hi<999&&val>hi)?'watch':'normal'):
   (i===5?val<clo?'critical':val<lo?'watch':'normal':val>chi?'critical':val>lo?'watch':'normal');
  return {i:i+1,group:i<5?'Quy mô / nguồn vốn':i<10?'Chất lượng tài sản':i<13?'Thu nhập':'Hiệu quả / lợi nhuận',id:d[0],name:d[2],value:val,label:check[i][5],formula:check[i][5]+' tính từ BCTC PRIVATE.',threshold:'Sàng lọc nội bộ',status:status,meaning:'Đối chiếu diễn biến và số liệu gốc.',raw_value:cur[d[1]]??null,raw_unit:'billion_vnd'};
 });
}
function derived16(bank,year){
 var c=values(bank,year),p=values(bank,year-1),p2=values(bank,year-2);
 var sum=(...a)=>a.some(x=>x==null)?null:a.reduce((a,b)=>a+b,0),avg=(a,b)=>a==null?b:b==null?a:(a+b)/2,ratio=pct,change=gr;
 function d(v){
  var total=sum(v.group1_loans,v.group2_loans,v.group3_loans,v.group4_loans,v.group5_loans);
  var npl=sum(v.group3_loans,v.group4_loans,v.group5_loans);
  return {total:total,npl:npl,nplratio:ratio(npl,total),g2:ratio(v.group2_loans,total),problem:ratio(sum(v.group2_loans,v.group3_loans,v.group4_loans,v.group5_loans),total),g5:ratio(v.group5_loans,npl),ldr:ratio(v.loans,v.deposits),cash:ratio(v.cash,v.deposits),eq:ratio(v.equity,v.assets),cir:ratio(v.operating_expenses==null?null:Math.abs(v.operating_expenses),v.operating_income),nii:ratio(v.net_interest_income,v.operating_income),fee:ratio(v.net_fee_income,v.operating_income)};
 }
 var a=d(c),b=d(p),z=d(p2);
 function trend(now,prev,old,bad){return now==null||prev==null?'insufficient':bad(now,prev)?old!=null&&bad(prev,old)?'critical':'watch':'normal'}
 function limits(v,watch,critical,low){return v==null?'insufficient':low?v<critical?'critical':v<watch?'watch':'normal':v>critical?'critical':v>watch?'watch':'normal'}
 var gap=(x,y)=>x==null||y==null?null:x-y;
 var credit=ratio(c.provisions==null?null:Math.abs(c.provisions),avg(c.loans,p.loans));
 var ppop=(v)=>v.operating_income==null||v.operating_expenses==null?null:v.operating_income-Math.abs(v.operating_expenses);
 var prov=ratio(c.provisions==null?null:Math.abs(c.provisions),ppop(c));
 var prevProv=ratio(p.provisions==null?null:Math.abs(p.provisions),ppop(p));
 var prev2Prov=ratio(p2.provisions==null?null:Math.abs(p2.provisions),ppop(p2));
 var loanGap=gap(change(c.loans,p.loans),change(c.deposits,p.deposits)),assetGap=gap(change(c.assets,p.assets),change(c.equity,p.equity));
 var prevAssetGap=gap(change(p.assets,p2.assets),change(p.equity,p2.equity));
 var roa=ratio(c.pat,avg(c.assets,p.assets)),roe=ratio(c.pat,avg(c.equity,p.equity));
 var defs=[
 ['Chất lượng tài sản','npl_ratio','Tỷ lệ nợ xấu',a.nplratio,limits(a.nplratio,1.6,3,false)],
 ['Cảnh báo sớm','group2_ratio','Tỷ lệ nợ nhóm 2',a.g2,limits(a.g2,1.05,1.68,false)],
 ['Chất lượng tài sản','problem_loan_ratio','Tỷ lệ khoản vay có vấn đề',a.problem,limits(a.problem,2.85,5.33,false)],
 ['Cấu trúc nợ xấu','group5_npl_share','Tỷ trọng nợ nhóm 5 trong NPL',a.g5,trend(a.g5,b.g5,z.g5,(x,y)=>x>y+.0001)],
 ['Xu hướng rủi ro','npl_yoy_change','Biến động tỷ lệ nợ xấu',gap(a.nplratio,b.nplratio),trend(a.nplratio,b.nplratio,z.nplratio,(x,y)=>x>y+.0001)],
 ['Cảnh báo sớm','group2_yoy_change','Biến động tỷ lệ nợ nhóm 2',gap(a.g2,b.g2),trend(a.g2,b.g2,z.g2,(x,y)=>x>y+.0001)],
 ['Chi phí tín dụng','cost_of_risk_proxy','Chi phí rủi ro tín dụng',credit,limits(credit,1.05,1.45,false)],
 ['Sức hấp thụ','provision_to_ppop','Dự phòng / PPOP',prov,trend(prov,prevProv,prev2Prov,(x,y)=>x>y+.0001)],
 ['Thanh khoản','ldr_proxy','Cho vay / Tiền gửi khách hàng',a.ldr,a.ldr==null?'insufficient':a.ldr>100&&b.ldr!=null&&a.ldr>b.ldr?'critical':a.ldr>100||b.ldr!=null&&a.ldr>b.ldr?'watch':'normal'],
 ['Thanh khoản','cash_deposit_ratio','Tiền / Tiền gửi khách hàng',a.cash,trend(a.cash,b.cash,z.cash,(x,y)=>x<y-.0001)],
 ['Đệm vốn','equity_asset_ratio','VCSH / Tổng tài sản',a.eq,trend(a.eq,b.eq,z.eq,(x,y)=>x<y-.0001)],
 ['Nguồn vốn','loan_deposit_growth_gap','Chênh tăng trưởng cho vay – tiền gửi',loanGap,limits(loanGap,3.05,5.9,false)],
 ['Đòn bẩy','asset_equity_growth_gap','Chênh tăng trưởng tài sản – vốn',assetGap,assetGap==null?'insufficient':assetGap>0&&prevAssetGap>0?'critical':assetGap>0?'watch':'normal'],
 ['Hiệu quả','cir_ratio','Tỷ lệ chi phí / thu nhập',a.cir,limits(a.cir,32.85,35.78,false)],
 ['Sinh lời','roa_roe','ROA và ROE',roa,roa==null||roe==null?'insufficient':roa<1.33||roe<15.63?'critical':roa<1.6||roe<17.1?'watch':'normal'],
 ['Cơ cấu thu nhập','income_concentration','Phụ thuộc vào thu nhập lãi',a.nii,a.nii==null||a.fee==null||b.nii==null||b.fee==null?'insufficient':a.nii>b.nii&&a.fee<b.fee?(z.nii!=null&&z.fee!=null&&b.nii>z.nii&&b.fee<z.fee?'critical':'watch'):'normal']
 ];
 return defs.map(function(x,i){
  var ind={kind:i===14?'dual':i===15?'income':i===4||i===5||i===11||i===12?'pp':'percent',value:x[3]};
  if(i===14){ind.roa=roa;ind.roe=roe}if(i===15){ind.niiShare=a.nii;ind.feeShare=a.fee}
  return {i:i+1,group:x[0],id:x[1],name:x[2],raw_items:[],indicator:ind,formula:x[2]+' – tính trên dữ liệu BCTC PRIVATE',threshold:'Ngưỡng cảnh báo nội bộ theo bảng giám sát AUREL',status:x[4],meaning:'Chỉ báo sàng lọc, không thay thế chuẩn giám sát NHNN.'};
 });
}
function snapshot(bank,year){
 var keys=[...new Set(activeRows.map(function(r){return r.bank+'|'+r.year}))].sort();
 var files=activeFiles.filter(function(x){return x.count>0}).map(function(x){return {name:x.name,rows:x.count,banks:x.banks,years:x.years}});
 var empty={has_data:false,choices:[],rows_count:0,documents:[],data_files:files,data_files_count:files.length,revision:revision,ai:{},fields:FIELDS,unit:'tỷ VND',risk_source16:[],risk_derived16:[],comparison_python:{},private_local:true};
 if(!keys.length)return empty;
 var choices=keys.map(function(k){var x=k.split('|');return {bank:x[0],year:Number(x[1])}}).sort(function(a,b){return a.bank.localeCompare(b.bank)||a.year-b.year});
 var chosen=choices.find(function(x){return x.bank===bank&&x.year===Number(year)})||
  choices.filter(function(x){return x.bank===bank}).slice(-1)[0]||choices[choices.length-1];
 var b=chosen.bank,y=chosen.year,v=values(b,y),raw=activeRows.filter(function(x){return x.bank===b&&x.year===y}).map(function(x){return Object.assign({name:FIELDS[x.metric_id],has_document:false},x)});
 var periods=[...new Set(activeRows.filter(function(x){return x.bank===b}).map(function(x){return x.year}))].sort(function(a,b){return a-b});
 var series={},ratioSeries={};
 for(var key of KEYS)series[key]=periods.map(function(p){return {year:p,value:values(b,p)[key]??null}});
 for(var p of periods)for(var r of ratios(b,p)){if(!ratioSeries[r.id])ratioSeries[r.id]=[];ratioSeries[r.id].push({year:p,value:r.value})}
 var c=compare(y),growth={};for(var field of KEYS)growth[field]=gr(v[field],values(b,y-1)[field]);
 return {has_data:true,bank:b,year:y,choices:choices,rows_count:activeRows.length,docs_count:0,documents:[],data_files:files,data_files_count:files.length,revision:revision,ai:{},
  fields:FIELDS,unit:'tỷ VND',values:v,raw:raw,ratios:ratios(b,y),risk:risk(b,y),growth:growth,series:series,ratio_series:ratioSeries,
  comparison:c.pairs,comparison_python:c.payload,risk_source16:source16(b,y),risk_derived16:derived16(b,y),evidence_count:0,rules:{},private_local:true};
}
async function ingest(files){
 var next=[],info=[],errs=[],allKeys=new Set();
 for(var file of files){
  if(!/\.(csv|xlsx)$/i.test(file.meta.name)){
   info.push({name:file.meta.name,count:0,error:'PDF đang lưu mã hóa, chưa có bộ trích xuất PRIVATE. Không gửi tệp PDF lên máy chủ.'});continue;
  }
  try{
   var matrix=/\.csv$/i.test(file.meta.name)?csvRows(new TextDecoder('utf-8',{fatal:true}).decode(file.data)):await xlsxRows(file.data);
   var records=tableToRecords(matrix,file.meta.name);
   for(var r of records){
    var key=r.bank+'|'+r.year+'|'+r.metric_id;
    if(allKeys.has(key))throw Error('Chỉ tiêu trùng giữa các tệp: '+key);
   }
   for(var r of records){allKeys.add(r.bank+'|'+r.year+'|'+r.metric_id)}
   next.push(...records);
   info.push({name:file.meta.name,count:records.length,banks:[...new Set(records.map(x=>x.bank))].join(', '),years:[...new Set(records.map(x=>x.year))].sort().join(', ')});
  }catch(e){errs.push(file.meta.name+': '+e.message);info.push({name:file.meta.name,count:0,error:e.message})}
 }
 groupCheck(next);
 return {rows:next,files:info,errors:errs};
}
function getVault(){return window.AURELPrivateVault}
function active(){var v=getVault();return !!(v&&v.isPrivate())}
function unlocked(){var v=getVault();return !!(v&&v.isUnlocked())}
function state(bank,year){return snapshot(bank,year)}
function fail(route){throw Error('PRIVATE: đã chặn gọi API "'+route+'" để dữ liệu không gửi lên máy chủ. Chỉ dùng chức năng xử lý tại trình duyệt.')}
function evaluation(bank,year,data){
 var snap=snapshot(bank,year),source=snap.raw||[],rat=snap.ratios||[];
 var ids=['npl_ratio','ldr','equity_assets','cir','loans_assets','deposits_assets','roa','roe'];
 var display={npl_ratio:'Tỷ lệ nợ xấu',ldr:'Dư nợ / Tiền gửi',equity_assets:'VCSH / Tổng tài sản',cir:'CIR',loans_assets:'Dư nợ / Tổng tài sản',deposits_assets:'Tiền gửi / Tổng tài sản',roa:'ROA',roe:'ROE'};
 var form=ids.map(function(k){var r=rat.find(x=>x.id===k),num=r?.value??null;return {name:display[k],id:k,manual:num,system:num,diff:num==null?null:0,pass:num==null?null:true,formula:r?.formula||''}});
 var truth=data&&data.manual||{},details=source.map(function(r){var n=number(truth[r.metric_id]),diff=n==null?null:Math.abs(r.value-n);return {row:r,manual:n,diff:diff,rel:n==null?null:n===0?diff===0?0:null:diff/Math.abs(n)*100,pass:n==null?null:diff<=Math.max(.01,Math.abs(n)*.001)}});
 var checked=details.filter(x=>x.pass!==null),passed=checked.filter(x=>x.pass).length;
 var periods=snap.choices||[],count=new Set(source.map(x=>x.metric_id)).size,ratCount=rat.filter(x=>x.value!=null).length;
 var checks=[['Ít nhất 2 năm hoặc 2 ngân hàng',periods.length>=2,periods.length+' kỳ dữ liệu'],['Tối thiểu 10 chỉ tiêu tài chính',count>=10,count+' chỉ tiêu'],['Tối thiểu 5 tỷ số / tăng trưởng',ratCount>=5,ratCount+' tỷ số'],['Cảnh báo rủi ro từ dữ liệu',snap.risk.length>=3,snap.risk.length+' cảnh báo'],['AI riêng tư tại trình duyệt',false,'Không gửi dữ liệu PRIVATE cho Gemini'],['Phê duyệt AI riêng tư',false,'Chưa có bộ AI cục bộ'],['Có phân tích kịch bản',snap.values.npl!=null&&snap.values.loans!=null,'Mô phỏng tại thiết bị'],['Truy vết tệp nguồn',source.every(x=>!!x.source_file),'Tên tệp được lưu mã hóa'],['Xuất báo cáo tại thiết bị',true,'Xuất từ trình duyệt, không qua máy chủ']];
 return {formula:form,manual:{truth:truth,details:details,checked:checked.length,passed:passed,accuracy:checked.length?passed/checked.length*100:null},checklist:checks,formulaAccuracy:form.some(x=>x.pass!==null)?100:null,trace:100,completeness:Math.min(100,count/16*100)};
}
async function request(route,data){
 var path=String(route||'').split('?')[0].replace(/^\/+/,'');
 if(path==='api/state')return snapshot(new URLSearchParams(String(route).split('?')[1]||'').get('bank'),number(new URLSearchParams(String(route).split('?')[1]||'').get('year')));
 if(path==='api/scenario'){
  var v=values(data.bank,data.year),a=number(data.npl_change),b=number(data.loan_change);
  if(v.npl==null||v.loans==null||a==null||b==null)throw Error('Không đủ dữ liệu nợ xấu/dư nợ để mô phỏng PRIVATE.');
  var n=v.npl*(1+a/100),l=v.loans*(1+b/100);if(l<=0||n<0||n>l)throw Error('Kịch bản không hợp lệ.');
  return {before:pct(v.npl,v.loans),after:pct(n,l),npl_before:v.npl,npl_after:n,loans_before:v.loans,loans_after:l};
 }
 if(path==='api/evaluation')return evaluation(data.bank,data.year,data);
 if(path==='api/evaluation/export'){
  var r=evaluation(data.bank,data.year,data),rows=[['Nhóm','Hạng mục','Kết quả']];
  r.checklist.forEach(x=>rows.push(['Kiểm định',x[0],x[1]?'Đạt':'Chưa đạt']));
  return {filename:'AUREL_PRIVATE_DANH_GIA.csv',csv:'\uFEFF'+rows.map(x=>x.map(y=>'"'+String(y).replace(/"/g,'""')+'"').join(',')).join('\r\n')};
 }
 return fail(path);
}
function exportCsv(){
 if(!unlocked())throw Error('Vui lòng mở khóa két trước.');
 var columns=['bank','year','metric_id','value','unit','source_file','source_page','statement_type'];
 var lines=[columns.join(',')].concat(activeRows.map(function(r){return columns.map(function(k){return '"'+String(r[k]??'').replace(/"/g,'""')+'"'}).join(',')}));
 var blob=new Blob(['\uFEFF'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='AUREL_PRIVATE_CHUAN_HOA.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url)},10000);
}
async function resync(){
 var my=++serial;activeRows=[];activeFiles=[];loaded=false;errorText='';
 if(!active()||!unlocked()){revision++;window.dispatchEvent(new CustomEvent('aurel-private-analytics-updated'));return}
 if(busy){pending=true;return}busy=true;
 try{
  var fileEntries=await getVault().readFiles();
  var result=await ingest(fileEntries);
  if(my!==serial||!active()||!unlocked())return;
  activeRows=result.rows;activeFiles=result.files;errorText=result.errors.join('\n');loaded=true;revision++;
 }catch(e){if(my===serial){errorText=e.message;loaded=false;revision++}}
 finally{busy=false;window.dispatchEvent(new CustomEvent('aurel-private-analytics-updated'));if(pending){pending=false;resync()}}
}
window.AURELPrivateAnalytics={active:active,unlocked:unlocked,getSnapshot:state,request:request,resync:resync,exportCsv:exportCsv,
 getReport:function(){return {rows:activeRows.slice(),files:activeFiles.slice(),errors:errorText,loaded:loaded}},diagnostics:function(){return {rows:activeRows.length,files:activeFiles.length,error:errorText,loaded:loaded}}};
window.addEventListener('aurel-private-vault-changed',resync);
})();