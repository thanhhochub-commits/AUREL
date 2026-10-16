(function(){
'use strict';
/* AUREL_DATA_MODE_V3 — data-source page only, sequential bank aliases, values unchanged. */
if(window.AURELDataMode)return;
var mode='protected',scheduled=false, panelRef=null, originals=new WeakMap(), attributeOriginals=new WeakMap();
var aliases=new Map(),concealCache=new Map();
var BANKS=[
['ABB','ABBANK'],['ACB','ACB'],['BAB','BAC A BANK'],['BID','BIDV'],
['BVB','BAOVIETBANK'],['CTG','VIETINBANK'],['EIB','EXIMBANK'],
['HDB','HDBANK'],['KLB','KIENLONGBANK'],['LPB','LPBANK'],
['MBB','MBBANK'],['MSB','MSB'],['NAB','NAM A BANK'],['NVB','NCB'],
['OCB','OCB'],['PGB','PGBANK'],['SGB','SAIGONBANK'],['SHB','SHB'],
['SSB','SEABANK'],['STB','SACOMBANK'],['TCB','TECHCOMBANK'],
['TPB','TPBANK'],['VAB','VIETABANK'],['VBB','VIETBANK'],
['VCB','VIETCOMBANK'],['VIB','VIB'],['VPB','VPBANK'],['SCB','SCB'],
['AGRIBANK','AGRIBANK']];
var codeForBank=new Map(),otherBankCodes=new Map(),nextBankCode=BANKS.length+1;
function normalize(s){return String(s||'').normalize('NFC').replace(/\s+/g,' ').trim().toLocaleLowerCase('vi')}
function stableHash(s){
  var h=2166136261,s1=normalize(s);
  for(var i=0;i<s1.length;i++){h^=s1.charCodeAt(i);h=Math.imul(h,16777619)}
  return String(((h>>>0)%900000)+100000)
}
BANKS.forEach(function(pair,i){
  var code='BANK_'+String(i+1).padStart(3,'0');
  codeForBank.set(pair[0],code);
  if(!codeForBank.has(pair[1]))codeForBank.set(pair[1],code);
});
function pseudonym(type,key){
  var k=String(key||'').trim();
  if(type==='bank'){
    var known=codeForBank.get(k.toUpperCase().replace(/[^A-Z]/g,''));
    if(known)return known;
    var id=normalize(k);
    if(!otherBankCodes.has(id))otherBankCodes.set(id,'BANK_'+String(nextBankCode++).padStart(3,'0'));
    return otherBankCodes.get(id);
  }
  return 'DN_'+stableHash(k)
}
function remember(name,code){
  var k=normalize(name);
  if(k.length<2||/^(chọn|select|tất cả|all\b)/i.test(k))return;
  if(aliases.get(k)!==code){aliases.set(k,code);concealCache.clear()}
}
BANKS.forEach(function(pair){var code=pseudonym('bank',pair[0]);remember(pair[0],code);remember(pair[1],code)});
[
['Ngân hàng TMCP Ngoại thương Việt Nam','VCB'],
['Ngân hàng TMCP Công thương Việt Nam','CTG'],
['Ngân hàng TMCP Đầu tư và Phát triển Việt Nam','BID'],
['Ngân hàng TMCP Kỹ thương Việt Nam','TCB'],
['Ngân hàng TMCP Quân đội','MBB'],
['Ngân hàng TMCP Việt Nam Thịnh Vượng','VPB'],
['Ngân hàng TMCP Á Châu','ACB'],
['Ngân hàng TMCP Sài Gòn Thương Tín','STB'],
['Ngân hàng TMCP Phát triển Thành phố Hồ Chí Minh','HDB'],
['Ngân hàng TMCP Tiên Phong','TPB'],
['Ngân hàng TMCP Sài Gòn Hà Nội','SHB'],
['Ngân hàng TMCP Quốc tế Việt Nam','VIB'],
['Ngân hàng TMCP Phương Đông','OCB'],
['Ngân hàng TMCP Hàng Hải Việt Nam','MSB']
].forEach(function(x){remember(x[0],pseudonym('bank',x[1]))});
function registerSelects(){
  document.querySelectorAll('#bank-select option').forEach(function(o){
    var name=originals.get(o.firstChild)||o.textContent||'',v=o.value||'';
    if(!v||/^(chọn|tất cả|all)/i.test(name))return;
    var code=aliases.get(normalize(name))||pseudonym('bank',v);
    remember(name,code);remember(v,code);
  });
  document.querySelectorAll('select[id*="company" i],select[name*="company" i],select[id*="enterprise" i],select[name*="enterprise" i],select[id*="doanh" i]').forEach(function(sel){
    sel.querySelectorAll('option').forEach(function(o){
      var name=originals.get(o.firstChild)||o.textContent||'';
      if(!name||/^(chọn|tất cả|all)/i.test(name))return;
      remember(name,pseudonym('enterprise',o.value||name));
    });
  });
}
function escapeRegExp(x){return x.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&')}
function conceal(value){
  if(!value||!String(value).trim())return value;
  var input=String(value),s=input.trim(),direct=aliases.get(normalize(s));
  if(concealCache.has(input))return concealCache.get(input);
  if(direct){var out=input.replace(s,direct);concealCache.set(input,out);return out}
  var output=input;
  Array.from(aliases.entries()).filter(function(e){return e[0].length>=4})
  .sort(function(a,b){return b[0].length-a[0].length}).forEach(function(pair){
    var re=new RegExp('(^|[^\\p{L}\\p{N}_])('+escapeRegExp(pair[0])+')(?=$|[^\\p{L}\\p{N}_])','giu');
    output=output.replace(re,function(m,prefix){return prefix+pair[1]});
  });
  if(output===input&&/^(?:Công ty(?:\s+(?:TNHH|cổ phần|CP|trách nhiệm hữu hạn))?|CTCP|Tập đoàn|Doanh nghiệp)\s+.{3,110}$/iu.test(s)
   && !/[.!?]\s+\S/.test(s))output=input.replace(s,pseudonym('enterprise',s));
  if(concealCache.size>3500)concealCache.clear();
  concealCache.set(input,output);
  return output;
}
function skip(n){return !n.parentElement||!!n.parentElement.closest('#aurel-data-mode-panel,#aurel-auth-wall,script,style,noscript,textarea,code,pre,[contenteditable],svg')}
function fixText(node){
  if(skip(node))return;
  var now=node.nodeValue||'',old=originals.get(node);
  if(mode==='public'){
    if(old!==undefined){
      if(now===conceal(old))node.nodeValue=old;
      originals.delete(node);
    }
    return;
  }
  var raw=old!==undefined&&now===conceal(old)?old:now,replacement=conceal(raw);
  if(replacement!==raw){
    originals.set(node,raw);
    if(now!==replacement)node.nodeValue=replacement;
  }else if(old!==undefined&&now!==conceal(old))originals.delete(node);
}
function fixAttributes(el){
  if(el.closest('#aurel-data-mode-panel,#aurel-auth-wall'))return;
  ['title','aria-label'].forEach(function(name){
    if(!el.hasAttribute(name))return;
    var now=el.getAttribute(name),saved=attributeOriginals.get(el)||{},was=saved[name];
    if(mode==='public'){
      if(was!==undefined&&now===conceal(was))el.setAttribute(name,was);
      delete saved[name];
      attributeOriginals.set(el,saved);
    }else{
      var raw=was!==undefined&&now===conceal(was)?was:now,masked=conceal(raw);
      if(masked!==raw){
        saved[name]=raw;attributeOriginals.set(el,saved);
        if(now!==masked)el.setAttribute(name,masked);
      }
    }
  });
}
function isDataPage(){
  var btn=document.querySelector('#nav button[data-page="data"].active');
  return !!btn;
}
function mountPanel(){
  var root=document.getElementById('root'),panel=panelRef;
  if(!root||!panel)return;
  if(!isDataPage()){
    if(panel.parentNode)panel.remove();
    return;
  }
  var head=root.querySelector(':scope > .page-head');
  if(head){
    if(panel.parentNode!==root || panel.previousElementSibling!==head)
      head.insertAdjacentElement('afterend',panel);
  }else if(panel.parentNode!==root||panel!==root.firstElementChild){
    root.insertBefore(panel,root.firstChild);
  }
}
function refresh(){
  mountPanel();
  registerSelects();
  [document.querySelector('.main'),document.querySelector('.sidebar'),document.getElementById('modal')].filter(Boolean).forEach(function(root){
    var walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),node;
    while((node=walk.nextNode()))fixText(node);
    root.querySelectorAll('[title],[aria-label]').forEach(fixAttributes);
  });
}
function schedule(){
  if(scheduled)return;scheduled=true;
  requestAnimationFrame(function(){scheduled=false;refresh()});
}
function init(){
  var main=document.querySelector('.main'),root=document.getElementById('root');
  if(!main||!root||panelRef)return;
  var panel=document.createElement('section');panel.id='aurel-data-mode-panel';
  panel.setAttribute('aria-label','Chế độ dữ liệu');
  panel.innerHTML='<div class="aurel-data-mode-title"><strong>Chế độ dữ liệu</strong>'+
    '<svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="5" rx="7.5" ry="3"/><path d="M4.5 5v7c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3V5M4.5 12v7c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-7"/></svg></div>'+
    '<label><input type="radio" name="aurel-data-mode" value="public"><span>Công khai (Public)</span></label>'+
    '<label><input type="radio" name="aurel-data-mode" value="protected" checked><span>Bảo vệ dữ liệu (Protected)</span></label>';
  panelRef=panel;
  mountPanel();
  panel.addEventListener('change',function(event){
    var item=event.target;
    if(item&&item.name==='aurel-data-mode'&&/^(public|protected)$/.test(item.value)){
      mode=item.value;refresh();
      document.dispatchEvent(new CustomEvent('aurel:data-mode-changed',{detail:{mode:mode}}));
    }
  });
  var observer=new MutationObserver(schedule);
  observer.observe(document.querySelector('.shell')||main,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class']});
  document.addEventListener('aurel:dom-render',schedule);
  document.addEventListener('change',schedule,true);
  window.AURELDataMode=Object.freeze({getMode:function(){return mode}});
  refresh();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();