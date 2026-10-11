(function(){
'use strict';
/* AUREL V5: private browser accounts, PBKDF2 + AES-256-GCM. Credentials never leave browser. */
const DB='aurel-private-encrypted-v5',OLD='aurel-browser-data-only-v4',ITER=600000;
const encoder=new TextEncoder(),decoder=new TextDecoder();
let dbPromise=null,active=null;
function name(s){return String(s||'').trim().normalize('NFC').toLowerCase()}
function valid(s){return /^[\p{L}\p{N}_.-]{3,32}$/u.test(s)}
function enc(s){return encoder.encode(s)}
function unlocked(){if(!active?.key)throw Error('Vui lòng đăng nhập để mở dữ liệu của máy này.')}
function open(){
 if(!dbPromise)dbPromise=new Promise((ok,no)=>{
  if(!indexedDB||!crypto?.subtle)throw Error('Trình duyệt chưa hỗ trợ lưu trữ mã hóa.');
  const q=indexedDB.open(DB,1);
  q.onupgradeneeded=()=>{for(const item of ['accounts','rows','pdfs','meta'])if(!q.result.objectStoreNames.contains(item))q.result.createObjectStore(item)};
  q.onsuccess=()=>{q.result.onversionchange=()=>q.result.close();ok(q.result)};
  q.onerror=()=>no(q.error||Error('Không mở được dữ liệu trên máy.'));
  q.onblocked=()=>no(Error('Dữ liệu đang bị khóa bởi tab khác.'));
 }).catch(e=>{dbPromise=null;throw e});
 return dbPromise;
}
async function trans(stores,mode,cb){
 const db=await open();
 return new Promise((ok,no)=>{
  const t=db.transaction(stores,mode);let val;
  t.oncomplete=()=>ok(val);t.onerror=()=>no(t.error||Error('Lỗi lưu dữ liệu trên máy.'));
  t.onabort=()=>no(t.error||Error('Không thể hoàn tất ghi dữ liệu trên máy.'));
  try{const r=cb(t);if(r){r.onsuccess=()=>val=r.result;r.onerror=()=>{try{t.abort()}catch(e){}}}}catch(e){try{t.abort()}catch(_){}no(e)}
 });
}
const get=(s,k)=>trans([s],'readonly',t=>t.objectStore(s).get(k));
const put=(s,k,v)=>trans([s],'readwrite',t=>t.objectStore(s).put(v,k));
const keys=s=>trans([s],'readonly',t=>t.objectStore(s).getAllKeys());
function random(n){const a=new Uint8Array(n);crypto.getRandomValues(a);return a}
async function derive(password,salt){
 const base=await crypto.subtle.importKey('raw',enc(password),'PBKDF2',false,['deriveKey']);
 return crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt:new Uint8Array(salt),iterations:ITER},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
async function seal(key,field,bytes){
 const iv=random(12);return {iv:Array.from(iv),bytes:await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:enc(field)},key,bytes)};
}
async function openSeal(key,field,item){
 if(!item?.iv||!item?.bytes)throw Error('Dữ liệu mã hóa không hợp lệ.');
 return crypto.subtle.decrypt({name:'AES-GCM',iv:new Uint8Array(item.iv),additionalData:enc(field)},key,item.bytes);
}
async function accounts(){return (await keys('accounts')).map(String).sort()}
async function register(username,password){
 const id=name(username);
 if(!valid(id))throw Error('Tên đăng nhập cần 3–32 ký tự: chữ, số, dấu chấm, gạch ngang hoặc gạch dưới.');
 if(typeof password!=='string'||password.length<12)throw Error('Mật khẩu phải có ít nhất 12 ký tự.');
 if(await get('accounts',id))throw Error('Tên đăng nhập đã tồn tại trên máy này.');
 const salt=random(16),key=await derive(password,salt);
 const verifier=await seal(key,'aurel/v5/auth/'+id,enc('AUREL_LOCAL_ACCOUNT_V5'));
 await put('accounts',id,{id,salt:Array.from(salt),verifier,created:Date.now()});
 active={id,key};
 try{await migrate()}catch(e){active=null;throw Error('Đã tạo tài khoản nhưng chuyển dữ liệu V4 chưa thành công. Đăng nhập lại để thử: '+e.message)}
 return id;
}
async function login(username,password){
 const id=name(username),record=await get('accounts',id);
 if(!record)throw Error('Tên đăng nhập hoặc mật khẩu không đúng.');
 try{
  const key=await derive(password,record.salt);
  const proof=decoder.decode(await openSeal(key,'aurel/v5/auth/'+id,record.verifier));
  if(proof!=='AUREL_LOCAL_ACCOUNT_V5')throw Error('Incorrect');
  active={id,key};
 }catch(e){active=null;throw Error('Tên đăng nhập hoặc mật khẩu không đúng.')}
 try{await migrate()}catch(e){active=null;throw Error('Không thể chuyển dữ liệu V4 sang bản mã hóa: '+e.message)}
 return id;
}
function logout(){active=null}
async function rows(){
 unlocked();
 const r=await get('rows',active.id);if(!r)return [];
 let data;
 try{data=JSON.parse(decoder.decode(await openSeal(active.key,'aurel/v5/rows/'+active.id,r)))}
 catch(e){throw Error('Không thể giải mã dữ liệu tài chính.')}
 if(!Array.isArray(data))throw Error('Cấu trúc dữ liệu tài chính không hợp lệ.');
 return data;
}
async function saveRows(data){
 unlocked();if(!Array.isArray(data))throw Error('Dữ liệu tải lên không hợp lệ.');
 const id=active.id,key=active.key;
 await put('rows',id,await seal(key,'aurel/v5/rows/'+id,enc(JSON.stringify(data))));
}
async function savePdf(file){
 unlocked();if(!file||!String(file.name||'').toLowerCase().endsWith('.pdf'))return;
 if(file.size>40*1024*1024)throw Error('PDF không được vượt quá 40 MB.');
 const id=active.id,n=file.name,key=id+'\u0000'+n;
 const encrypted=await seal(active.key,'aurel/v5/pdf/'+id+'/'+n,await file.arrayBuffer());
 await put('pdfs',key,{owner:id,name:n,modified:file.lastModified||Date.now(),encrypted});
}
async function pdfs(){
 unlocked();const id=active.id,list=await keys('pdfs'),files=[];
 for(const k of list){
  if(!String(k).startsWith(id+'\u0000'))continue;
  const record=await get('pdfs',k);
  if(record?.owner!==id||typeof record.name!=='string')continue;
  const buffer=await openSeal(active.key,'aurel/v5/pdf/'+id+'/'+record.name,record.encrypted);
  files.push({name:record.name,blob:new Blob([buffer],{type:'application/pdf'}),lastModified:record.modified});
 }
 return files;
}
async function clear(){
 unlocked();const id=active.id;
 const toRemove=(await keys('pdfs')).filter(k=>String(k).startsWith(id+'\u0000'));
 await trans(['rows','pdfs'],'readwrite',t=>{
  t.objectStore('rows').delete(id);
  for(const k of toRemove)t.objectStore('pdfs').delete(k);
 });
}
async function restore(upload,request){
 unlocked();
 const saved=await pdfs();
 for(let i=0;i<saved.length;i++){
  const p=saved[i];
  const f=new File([p.blob],p.name,{type:'application/pdf',lastModified:p.lastModified||Date.now()});
  await upload(f,true,null,i+1,saved.length);
 }
 return request('api/local/restore',{rows:await rows()},120000);
}
async function legacy(){
 if(typeof indexedDB.databases==='function'){
  const dbs=await indexedDB.databases();if(!dbs.some(d=>d.name===OLD))return null;
 }
 return new Promise((ok,no)=>{
  const r=indexedDB.open(OLD);
  r.onupgradeneeded=()=>{r.transaction.abort()};
  r.onerror=()=>{if(r.error?.name==='AbortError')ok(null);else no(r.error)};
  r.onsuccess=()=>{
   const db=r.result;
   if(!db.objectStoreNames.contains('records')||!db.objectStoreNames.contains('pdfs')){db.close();ok(null);return}
   const t=db.transaction(['records','pdfs'],'readonly');
   const rs=t.objectStore('records').get('rows'),ps=t.objectStore('pdfs').getAll();
   t.oncomplete=()=>{db.close();ok({rows:rs.result||[],pdfs:ps.result||[]})};
   t.onerror=()=>{db.close();no(t.error)};
  };
 });
}
async function clearLegacy(){
 const db=await new Promise((ok,no)=>{const r=indexedDB.open(OLD);r.onerror=()=>no(r.error);r.onsuccess=()=>ok(r.result)});
 if(!db.objectStoreNames.contains('records')||!db.objectStoreNames.contains('pdfs')){db.close();return}
 await new Promise((ok,no)=>{
  const t=db.transaction(['records','pdfs'],'readwrite');
  t.objectStore('records').clear();t.objectStore('pdfs').clear();
  t.oncomplete=ok;t.onerror=()=>no(t.error);t.onabort=()=>no(t.error);
 });db.close();
}
async function migrate(){
 unlocked();
 if(await get('meta','v4-migrated'))return;
 const data=await legacy();
 if(data){
  if(data.rows.length && !(await rows()).length)await saveRows(data.rows);
  for(const p of data.pdfs){
   if(p?.blob&&p?.name)await savePdf(new File([p.blob],p.name,{type:'application/pdf',lastModified:p.lastModified||Date.now()}));
  }
  await clearLegacy();
 }
 await put('meta','v4-migrated',true);
}
window.AURELLocal={open,rows,saveRows,savePdf,pdfs,clear,restore};
window.AURELAuthCore={accounts,register,login,logout,username:()=>active?.id||'',isUnlocked:()=>!!active?.key};
})();