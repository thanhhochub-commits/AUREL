(function(){
'use strict';
/* AUREL V6. Supabase Auth-backed account, browser-independent identity. */
const ENDPOINT="https://hqdeawwnviizihqsmovn.supabase.co/functions/v1/aurel-account-vault";
const legacyCore=window.AURELAuthCore,legacyStorage=window.AURELLocal;
let current=null,migration=null,refreshPending=null;
function normalize(s){return String(s||'').trim().normalize('NFC').toLowerCase()}
function clearSession(){current=null;try{sessionStorage.removeItem('aurel_online_v6')}catch(_){}}
function saveSession(){
 if(!current)return;
 try{sessionStorage.setItem('aurel_online_v6',JSON.stringify({username:current.username,id:current.id,access:current.access,refresh:current.refresh,expiry:current.expiry}))}catch(_){}
}
async function post(action,payload,token=''){
 const r=await fetch(ENDPOINT+"?action="+encodeURIComponent(action),{
  method:'POST',headers:{'Content-Type':'application/json',...(token?{'Authorization':'Bearer '+token}:{})},
  body:JSON.stringify(payload),cache:'no-store',redirect:'follow'});
 let response;
 try{response=await r.json()}catch(e){throw Error('Máy chủ đăng nhập không trả về dữ liệu hợp lệ.')}
 if(!r.ok)throw Error(response.error||'Không thể xác thực tài khoản.');
 return response;
}
async function tryLegacy(username,password){
 migration=null;
 if(!legacyCore||!legacyStorage)return;
 try{
  const list=await legacyCore.accounts();
  if(!list.includes(username))return;
  await legacyCore.login(username,password);
  const rows=await legacyStorage.rows(),pdfs=await legacyStorage.pdfs();
  if(rows.length||pdfs.length)migration={username,rows,pdfs};
 }catch(e){console.info('AUREL older browser data needs a separate migration step.')}
 finally{try{legacyCore.logout()}catch(_){}}
}
async function enter(action,username,password){
 const name=normalize(username);
 const data=await post(action,{username:name,password});
 if(!data.access_token||!data.refresh_token||!data.user_id)throw Error('Phiên tài khoản online không hợp lệ.');
 current={username:name,id:data.user_id,access:data.access_token,refresh:data.refresh_token,expiry:Date.now()+(data.expires_in||3600)*1000};
 saveSession();
 await tryLegacy(name,password);
 return name;
}
async function access(){
 if(!current)throw Error('Hãy đăng nhập tài khoản AUREL.');
 if(Date.now()<current.expiry-90_000)return current.access;
 if(!refreshPending)refreshPending=(async()=>{
  try{
   const r=await post('refresh',{refresh_token:current.refresh});
   if(!r.access_token||!r.refresh_token||r.user_id!==current.id)throw Error('Tài khoản cần đăng nhập lại.');
   current.access=r.access_token;current.refresh=r.refresh_token;
   current.expiry=Date.now()+(r.expires_in||3600)*1000;saveSession();
   return current.access;
  }catch(e){clearSession();throw Error('Phiên tài khoản đã hết hạn. Hãy tải lại trang và đăng nhập lại.')}
  finally{refreshPending=null}
 })();
 return refreshPending;
}
async function migrateIfEmpty(request,upload){
 if(!migration||!current)return {migrated:false};
 const old=migration;
 if(old.username!==current.username)return {migrated:false};
 const state=await request('api/state');
 const onlineRows=await request('api/local/rows');
 if((onlineRows.rows||[]).length||state.documents?.length){
  console.warn('AUREL local migration skipped: online account already contains data.');
  return {migrated:false,reason:'account_not_empty'};
 }
 for(let i=0;i<old.pdfs.length;i++){
  const item=old.pdfs[i],f=new File([item.blob],item.name,{type:'application/pdf',lastModified:item.lastModified||Date.now()});
  await upload(f,true,null,i+1,old.pdfs.length);
 }
 if(old.rows.length)await request('api/local/restore',{rows:old.rows},120000);
 migration=null;
 return {migrated:true,count:old.rows.length,pdfs:old.pdfs.length};
}
window.AURELCloudAuth={access,migrateIfEmpty,clearSession};
window.AURELAuthCore={
 accounts:async()=>['online-existing'],
 register:(username,password)=>enter('register',username,password),
 login:(username,password)=>enter('login',username,password),
 logout(){clearSession();migration=null},
 isUnlocked:()=>!!current,
 username:()=>current?.username||''
};
})();