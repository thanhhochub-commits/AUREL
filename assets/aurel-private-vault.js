/* AUREL Private Vault v1
 * Browser-side encryption only; this module never sends file bytes, keys, or passwords to a server.
 * Private uploads deliberately do not enter the existing server-based analysis pipeline.
 */
(function(){
'use strict';
var DB_NAME='aurel-private-vault-v1', VERSION=1, ITERATIONS=600000, MAX_BYTES=40*1024*1024;
var dbPromise=null, masterKey=null, mode='private', currentList=[], busy=false, idleTimer=null;
var enc=new TextEncoder(),dec=new TextDecoder();
function el(id){return document.getElementById(id)}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function salt(){return crypto.getRandomValues(new Uint8Array(16))}
function nonce(){return crypto.getRandomValues(new Uint8Array(12))}
function asBytes(x){return new Uint8Array(x)}
function db(){
 if(dbPromise)return dbPromise;
 dbPromise=new Promise(function(resolve,reject){
  var req=indexedDB.open(DB_NAME,VERSION);
  req.onupgradeneeded=function(){
   var d=req.result;
   if(!d.objectStoreNames.contains('vault'))d.createObjectStore('vault');
   if(!d.objectStoreNames.contains('catalog'))d.createObjectStore('catalog',{keyPath:'id'});
   if(!d.objectStoreNames.contains('files'))d.createObjectStore('files',{keyPath:'id'});
  };
  req.onsuccess=function(){resolve(req.result)};
  req.onerror=function(){reject(req.error||Error('Không mở được kho mã hóa.'))};
 });
 return dbPromise.catch(function(e){dbPromise=null;throw e});
}
async function get(store,key){
 var d=await db();
 return new Promise(function(resolve,reject){
  var r=d.transaction(store,'readonly').objectStore(store).get(key);
  r.onsuccess=function(){resolve(r.result)};
  r.onerror=function(){reject(r.error)};
 });
}
async function all(store){
 var d=await db();
 return new Promise(function(resolve,reject){
  var r=d.transaction(store,'readonly').objectStore(store).getAll();
  r.onsuccess=function(){resolve(r.result||[])};
  r.onerror=function(){reject(r.error)};
 });
}
async function putBoth(id,info,file){
 var d=await db();
 return new Promise(function(resolve,reject){
  var t=d.transaction(['catalog','files'],'readwrite');
  t.oncomplete=function(){resolve()};
  t.onerror=function(){reject(t.error||Error('Không lưu được tệp.'))};
  t.onabort=function(){reject(t.error||Error('Hết dung lượng lưu trên thiết bị.'))};
  t.objectStore('catalog').put(Object.assign({id:id},info));
  t.objectStore('files').put(Object.assign({id:id},file));
 });
}
async function deleteBoth(id){
 var d=await db();
 return new Promise(function(resolve,reject){
  var t=d.transaction(['catalog','files'],'readwrite');
  t.oncomplete=resolve;
  t.onerror=function(){reject(t.error||Error('Không xóa được.'))};
  t.objectStore('catalog').delete(id);
  t.objectStore('files').delete(id);
 });
}
async function derive(password,bytes,rounds){
 var base=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveKey']);
 return crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt:asBytes(bytes),iterations:rounds},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
async function seal(key,bytes,context){
 var iv=nonce();
 var ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv:iv,additionalData:enc.encode(context),tagLength:128},key,bytes);
 return {iv:Array.from(iv),ciphertext:ciphertext};
}
async function open(key,record,context){
 return crypto.subtle.decrypt({name:'AES-GCM',iv:asBytes(record.iv),additionalData:enc.encode(context),tagLength:128},key,record.ciphertext);
}
function makeId(){
 if(crypto.randomUUID)return crypto.randomUUID();
 return Array.from(crypto.getRandomValues(new Uint8Array(16))).map(function(x){return x.toString(16).padStart(2,'0')}).join('');
}
function say(s,isError){
 var node=el('aurel-private-status');
 if(node){node.textContent=s;node.style.color=isError?'#b91c1c':''}
}
function touchUnlock(){
 if(idleTimer)clearTimeout(idleTimer);
 if(masterKey)idleTimer=setTimeout(function(){lock();say('Két đã tự khóa sau 15 phút.');},15*60*1000);
}
function lock(){
 masterKey=null;currentList=[];
 if(idleTimer){clearTimeout(idleTimer);idleTimer=null}
 var p=el('aurel-private-pass');if(p)p.value='';
 var preview=el('aurel-private-preview');if(preview)preview.textContent='';
 renderVault();
}
async function createVault(password){
 if((await get('vault','master')))throw Error('Két đã tồn tại. Hãy mở khóa.');
 if(password.length<12)throw Error('Mật khẩu cần ít nhất 12 ký tự.');
 var raw=crypto.getRandomValues(new Uint8Array(32)),s=salt(),k=await derive(password,s,ITERATIONS),wrapped=await seal(k,raw,'aurel-private-master-v1');
 var original=await crypto.subtle.importKey('raw',raw,'AES-GCM',false,['encrypt','decrypt']);
 raw.fill(0);
 var record={v:1,kdf:'PBKDF2-SHA256',iterations:ITERATIONS,salt:Array.from(s),iv:wrapped.iv,ciphertext:wrapped.ciphertext};
 var d=await db();
 await new Promise(function(resolve,reject){
  var t=d.transaction('vault','readwrite');
  t.oncomplete=resolve;t.onerror=function(){reject(t.error)};
  t.objectStore('vault').put(record,'master');
 });
 masterKey=original;touchUnlock();
}
async function unlock(password){
 var r=await get('vault','master');
 if(!r)throw Error('Chưa tạo két riêng tư.');
 if(r.v!==1||r.kdf!=='PBKDF2-SHA256'||r.iterations!==ITERATIONS)throw Error('Định dạng khóa không được hỗ trợ.');
 var k=await derive(password,r.salt,r.iterations),raw;
 try{raw=asBytes(await open(k,r,'aurel-private-master-v1'))}
 catch(e){throw Error('Mật khẩu không đúng hoặc khóa đã hỏng.')}
 masterKey=await crypto.subtle.importKey('raw',raw,'AES-GCM',false,['encrypt','decrypt']);
 raw.fill(0);touchUnlock();
}
async function storeFile(file){
 if(!masterKey)throw Error('Hãy tạo hoặc mở khóa két trước khi lưu.');
 if(!file||file.size>MAX_BYTES||file.size<1)throw Error('Mỗi tệp phải có dung lượng từ 1 byte đến 40 MB.');
 if(!/\.(pdf|xlsx|csv)$/i.test(file.name))throw Error('Chỉ nhận PDF, Excel hoặc CSV.');
 var id=makeId(),meta={name:file.name,size:file.size,type:file.type||'application/octet-stream',savedAt:new Date().toISOString()};
 var metaSeal=await seal(masterKey,enc.encode(JSON.stringify(meta)),'aurel-private-meta:'+id);
 var dataSeal=await seal(masterKey,await file.arrayBuffer(),'aurel-private-file:'+id);
 await putBoth(id,{iv:metaSeal.iv,ciphertext:metaSeal.ciphertext},{iv:dataSeal.iv,ciphertext:dataSeal.ciphertext});
 touchUnlock();
}
async function listFiles(){
 if(!masterKey){currentList=[];return}
 var rows=await all('catalog'),out=[];
 for(var i=0;i<rows.length;i++){
  var r=rows[i];
  try{
   var obj=JSON.parse(dec.decode(await open(masterKey,r,'aurel-private-meta:'+r.id)));
   out.push({id:r.id,name:obj.name,size:obj.size,type:obj.type,savedAt:obj.savedAt});
  }catch(e){out.push({id:r.id,name:'Tệp không giải mã được',size:0,savedAt:'',corrupt:true})}
 }
 out.sort(function(a,b){return String(b.savedAt).localeCompare(String(a.savedAt))});
 currentList=out;
 touchUnlock();
}
async function filePlain(id){
 if(!masterKey)throw Error('Két đã khóa.');
 var item=currentList.find(function(x){return x.id===id});
 if(!item||item.corrupt)throw Error('Không tìm thấy tệp hợp lệ.');
 var row=await get('files',id);if(!row)throw Error('Tệp không tồn tại.');
 var data=await open(masterKey,row,'aurel-private-file:'+id);
 touchUnlock();
 return {data:data,meta:item};
}
function download(blob,name){
 var url=URL.createObjectURL(blob);
 var a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
 setTimeout(function(){URL.revokeObjectURL(url)},60000);
}
async function renderVault(){
 var area=el('aurel-private-vault');if(!area)return;
 var record;
 try{record=await get('vault','master')}
 catch(e){area.textContent='Không mở được bộ nhớ riêng tư: '+e.message;return}
 if(!area.isConnected)return;
 if(!record){
  area.innerHTML='<label class="aurel-private-field">Tạo mật khẩu két (tối thiểu 12 ký tự)<input id="aurel-private-pass" type="password" autocomplete="new-password" minlength="12" placeholder="Mật khẩu chỉ bạn biết"></label><button type="button" class="button primary" id="aurel-private-create">Tạo két mã hóa</button><p class="tiny">Mật khẩu không gửi lên AUREL. Nếu quên mật khẩu và không có bản sao lưu, không thể khôi phục.</p><label class="aurel-private-restore-label">Khôi phục két từ bản sao lưu mã hóa<input id="aurel-private-restore" type="file" accept=".json,application/json"></label>';
 }else if(!masterKey){
  area.innerHTML='<label class="aurel-private-field">Mật khẩu mở két<input id="aurel-private-pass" type="password" autocomplete="current-password" placeholder="Nhập mật khẩu riêng"></label><button type="button" class="button primary" id="aurel-private-unlock">Mở khóa</button><p class="tiny">Két lưu trên trình duyệt này. Để chuyển máy, xuất bản sao lưu đã mã hóa.</p>';
 }else{
  var rows=currentList.map(function(x){
   return '<div class="aurel-private-row"><span><strong>'+esc(x.name)+'</strong><small>'+esc((Number(x.size)/1048576).toFixed(2))+' MB · '+esc(x.savedAt.slice(0,10))+'</small></span><span class="aurel-private-actions">'+(x.corrupt?'':'<button type="button" class="button" data-private-preview="'+esc(x.id)+'">Xem</button><button type="button" class="button" data-private-get="'+esc(x.id)+'">Tải</button>')+'<button type="button" class="button" data-private-delete="'+esc(x.id)+'">Xóa</button></span></div>';
  }).join('');
  area.innerHTML='<div class="aurel-private-head"><strong><span class="aurel-private-ok">●</span> Két đang mở · '+currentList.length+' tệp</strong><button type="button" class="button" id="aurel-private-lock">Khóa ngay</button></div><div class="aurel-private-items">'+(rows||'<span class="tiny">Chưa có tệp mã hóa.</span>')+'</div><div class="aurel-private-actions"><button type="button" class="button" id="aurel-private-backup">Xuất bản sao lưu mã hóa</button></div><div id="aurel-private-preview" class="aurel-private-preview"></div>';
 }
}
function updateUploadMode(){
 var panel=document.querySelector('#root .upload-panel'),area=el('aurel-private-vault'),up=el('upload-button');
 if(!panel||!area||!up)return;
 panel.classList.toggle('aurel-private-mode',mode==='private');
 var hint=el('aurel-private-notice');
 if(hint)hint.textContent=mode==='private'?
  'PRIVATE: chỉ mã hóa và lưu trên thiết bị này. Không gửi tệp lên Render, AI hoặc GitHub. PDF/Excel/CSV chưa được đưa vào biểu đồ phân tích máy chủ.':
  'MÁY CHỦ: tệp gốc sẽ gửi đến backend AUREL để trích xuất và phân tích. Chủ máy chủ có khả năng truy cập dữ liệu trong lúc xử lý.';
 up.textContent=mode==='private'?'Lưu tệp đã mã hóa':'Nạp tệp lên máy chủ';
 area.hidden=mode!=='private';
 var replace=el('replace-check');if(replace&&replace.closest('label'))replace.closest('label').hidden=mode==='private';
}
var mountToken=0;
async function mount(){
 var panel=document.querySelector('#root .upload-panel');
 if(!panel)return;
 if(!el('aurel-private-switch')){
  var wrap=document.createElement('div');wrap.id='aurel-private-switch';
  wrap.innerHTML='<div class="aurel-private-choices"><label><input type="radio" name="aurel-privacy" value="private" checked> PRIVATE · Mã hóa trên thiết bị</label><label><input type="radio" name="aurel-privacy" value="server"> MÁY CHỦ · Phân tích online</label></div><p id="aurel-private-notice" class="tiny"></p><div id="aurel-private-vault"></div><p id="aurel-private-status" role="status" aria-live="polite"></p>';
  var header=panel.querySelector('.section-top');
  if(header)header.insertAdjacentElement('afterend',wrap);else panel.prepend(wrap);
 }
 var radio=panel.querySelector('input[name="aurel-privacy"][value="'+mode+'"]');if(radio)radio.checked=true;
 updateUploadMode();
 if(mode==='private'){
  var token=++mountToken;
  if(masterKey)await listFiles();
  if(token===mountToken&&el('aurel-private-vault'))await renderVault();
 }
}
var queued=false;
function schedule(){
 if(queued)return;queued=true;
 requestAnimationFrame(function(){queued=false;mount().catch(function(e){say(e.message,true)})});
}
async function guarded(fn){
 if(busy)return;busy=true;
 try{await fn()}catch(e){say(e&&e.message||'Lỗi xử lý riêng tư.',true)}
 finally{busy=false;var pass=el('aurel-private-pass');if(pass)pass.value='';}
}
async function saveChosen(){
 if(!masterKey){say('Hãy mở khóa két trước khi thêm tệp.',true);return}
 var input=el('upload-file'),files=Array.from(input&&input.files||[]);
 if(!files.length){say('Hãy chọn tệp PDF, Excel hoặc CSV.',true);return}
 if(files.length>20){say('Chỉ lưu tối đa 20 tệp mỗi lượt.',true);return}
 var button=el('upload-button');if(button)button.disabled=true;
 try{
  for(var i=0;i<files.length;i++){
   say('Đang mã hóa '+(i+1)+'/'+files.length+' tệp (không gửi lên máy chủ)...');
   await storeFile(files[i]);
  }
  if(input){input.value='';input.dispatchEvent(new Event('change',{bubbles:true}))}
  await listFiles();await renderVault();
  say('Đã mã hóa và lưu '+files.length+' tệp trên thiết bị. Không có tệp nào được tải lên máy chủ.');
 }finally{if(button)button.disabled=false}
}
function base64(arr){
 var b='',bytes=asBytes(arr);
 for(var i=0;i<bytes.length;i+=16384)b+=String.fromCharCode.apply(null,bytes.subarray(i,i+16384));
 return btoa(b);
}
function unbase64(v){
 var b=atob(v),out=new Uint8Array(b.length);
 for(var i=0;i<b.length;i++)out[i]=b.charCodeAt(i);
 return out.buffer;
}
async function backup(){
 if(!masterKey)throw Error('Hãy mở khóa trước khi sao lưu.');
 var key=await get('vault','master'),catalog=await all('catalog'),files=await all('files');
 var pack={
  format:'aurel-private-vault-backup-v1',
  vault:{v:key.v,kdf:key.kdf,iterations:key.iterations,salt:key.salt,iv:key.iv,ciphertext:base64(key.ciphertext)},
  catalog:catalog.map(function(x){return {id:x.id,iv:x.iv,ciphertext:base64(x.ciphertext)}}),
  files:files.map(function(x){return {id:x.id,iv:x.iv,ciphertext:base64(x.ciphertext)}})
 };
 download(new Blob([JSON.stringify(pack)],{type:'application/json'}),'AUREL_PRIVATE_BACKUP_'+new Date().toISOString().slice(0,10)+'.json');
 say('Đã xuất bản sao lưu mã hóa. Cất giữ bản sao lưu và mật khẩu riêng.');
 touchUnlock();
}
async function restore(file){
 if(await get('vault','master'))throw Error('Chỉ khôi phục khi trình duyệt chưa có két. Không ghi đè két hiện tại.');
 if(!file||file.size>260*1024*1024)throw Error('Bản sao lưu không hợp lệ hoặc quá lớn.');
 var obj=JSON.parse(await file.text());
 if(obj.format!=='aurel-private-vault-backup-v1'||!obj.vault||!Array.isArray(obj.catalog)||!Array.isArray(obj.files))throw Error('Không đúng định dạng bản sao lưu AUREL.');
 if(obj.catalog.length!==obj.files.length||obj.files.length>300)throw Error('Bản sao lưu có cấu trúc không hợp lệ.');
 var k=obj.vault;
 if(k.v!==1||k.kdf!=='PBKDF2-SHA256'||k.iterations!==ITERATIONS||k.salt.length!==16||k.iv.length!==12)throw Error('Định dạng khóa không được hỗ trợ.');
 var idSet=new Set();
 for(var i=0;i<obj.catalog.length;i++){
  var item=obj.catalog[i];if(!/^[a-z0-9-]{16,64}$/i.test(item.id)||item.iv.length!==12)throw Error('Danh mục sao lưu lỗi.');
  if(idSet.has(item.id))throw Error('Bản sao lưu có tệp trùng lặp.');idSet.add(item.id);
 }
 for(var j=0;j<obj.files.length;j++){if(!idSet.has(obj.files[j].id)||obj.files[j].iv.length!==12)throw Error('Tệp sao lưu thiếu hoặc lỗi.')}
 if(!confirm('Khôi phục két mã hóa vào trình duyệt này? Mật khẩu gốc sẽ cần để mở két.'))return;
 var d=await db();
 await new Promise(function(resolve,reject){
  var t=d.transaction(['vault','catalog','files'],'readwrite');
  t.oncomplete=resolve;
  t.onerror=function(){reject(t.error||Error('Không khôi phục được.'))};
  t.objectStore('vault').put({v:k.v,kdf:k.kdf,iterations:k.iterations,salt:k.salt,iv:k.iv,ciphertext:unbase64(k.ciphertext)},'master');
  obj.catalog.forEach(function(x){t.objectStore('catalog').put({id:x.id,iv:x.iv,ciphertext:unbase64(x.ciphertext)})});
  obj.files.forEach(function(x){t.objectStore('files').put({id:x.id,iv:x.iv,ciphertext:unbase64(x.ciphertext)})});
 });
 say('Đã khôi phục bản mã. Nhập mật khẩu gốc để mở két.');
 await renderVault();
}
document.addEventListener('click',function(event){
 var t=event.target.closest&&event.target.closest('#upload-button,#aurel-private-switch button,[data-private-get],[data-private-preview],[data-private-delete]');
 if(!t)return;
 if(t.id==='upload-button'){
  if(mode!=='private')return;
  event.preventDefault();event.stopImmediatePropagation();
  guarded(saveChosen);return;
 }
 event.preventDefault();event.stopImmediatePropagation();
 if(t.id==='aurel-private-create'){
  guarded(async function(){var pass=el('aurel-private-pass');await createVault(pass&&pass.value||'');await renderVault();say('Đã tạo két. Khóa được sinh trên thiết bị, chủ web không giữ khóa.')});
 }else if(t.id==='aurel-private-unlock'){
  guarded(async function(){var pass=el('aurel-private-pass');await unlock(pass&&pass.value||'');await listFiles();await renderVault();say('Đã mở khóa trên thiết bị.')});
 }else if(t.id==='aurel-private-lock'){lock();say('Đã khóa két.')}
 else if(t.id==='aurel-private-backup'){guarded(backup)}
 else if(t.hasAttribute('data-private-delete')){
  guarded(async function(){if(confirm('Xóa vĩnh viễn tệp mã hóa này khỏi trình duyệt?')){await deleteBoth(t.dataset.privateDelete);await listFiles();await renderVault();say('Đã xóa tệp mã hóa.')}});
 }else if(t.hasAttribute('data-private-get')||t.hasAttribute('data-private-preview')){
  guarded(async function(){
   var id=t.dataset.privateGet||t.dataset.privatePreview,resource=await filePlain(id);
   var blob=new Blob([resource.data],{type:resource.meta.type});
   if(t.hasAttribute('data-private-get'))download(blob,resource.meta.name);
   else if(/\.pdf$/i.test(resource.meta.name)){
    var url=URL.createObjectURL(blob),w=window.open(url,'_blank','noopener');
    if(!w)download(blob,resource.meta.name);
    setTimeout(function(){URL.revokeObjectURL(url)},120000);
   }else if(/\.csv$/i.test(resource.meta.name)){
    var preview=el('aurel-private-preview');
    if(preview){preview.textContent=dec.decode(resource.data.slice(0,45000));preview.scrollIntoView({block:'nearest'})}
   }else{download(blob,resource.meta.name);say('Excel được giải mã để tải về. Chưa có tính toán BCTC riêng tư trực tiếp trong trình duyệt.')}
  });
 }
},true);
document.addEventListener('change',function(event){
 if(event.target.name==='aurel-privacy'){
  mode=event.target.value==='server'?'server':'private';updateUploadMode();
 }else if(event.target.id==='aurel-private-restore'){
  var f=event.target.files&&event.target.files[0];
  if(f)guarded(async function(){await restore(f)});
 }
},true);
document.addEventListener('keydown',function(event){
 if(event.key==='Enter'&&event.target.id==='aurel-private-pass'){
  event.preventDefault();
  var button=el('aurel-private-unlock')||el('aurel-private-create');if(button)button.click();
 }
});
document.addEventListener('aurel:dom-render',schedule);
window.addEventListener('pagehide',lock,{passive:true});
var root=document.getElementById('root');
if(root)new MutationObserver(schedule).observe(root,{childList:true});
window.AURELPrivateVaultReady=true;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
})();