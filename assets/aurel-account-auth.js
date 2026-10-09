/* AUREL account access: Supabase verified Gmail/password, never Google password. */
(function(){
'use strict';
const BACKEND='https://aurel-thanhhochub-backend.onrender.com';
const SITE='https://thanhhochub-commits.github.io/AUREL/financial-intelligence.html';
const CACHE='aurel_supabase_auth_v1';
let settings=null,creds=null,refreshing=null,mode='login';
const nativeFetch=window.fetch.bind(window);
document.documentElement.classList.add('aurel-auth-locked');
const el=id=>document.getElementById(id);
function message(s,ok=false){const p=el('aurel-auth-message');if(p){p.textContent=s;p.style.color=ok?'#117c60':'#ae2837';}}
function restore(){try{const x=JSON.parse(sessionStorage.getItem(CACHE)||'null');if(x&&x.access_token&&x.refresh_token)creds=x;}catch(_){}}
function clear(){creds=null;try{sessionStorage.removeItem(CACHE);sessionStorage.removeItem('aurel_secure_session_token');}catch(_){}}
function setSession(x){
 if(!x?.access_token||!x?.refresh_token)throw Error('Phiên xác thực không hợp lệ.');
 creds={access_token:x.access_token,refresh_token:x.refresh_token,expires_at:Date.now()+Math.max(60,Number(x.expires_in||3600)-90)*1000};
 try{sessionStorage.setItem(CACHE,JSON.stringify(creds));}catch(_){}
}
async function getConfig(){
 if(settings)return settings;
 const r=await nativeFetch(BACKEND+'/api/auth/config',{cache:'no-store'});
 if(!r.ok)throw Error('Máy chủ AUREL chưa được kết nối với Supabase.');
 const data=await r.json();
 if(data.enabled!==true||!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(data.supabase_url)
 ||!data.publishable_key||data.publishable_key.length>2048)throw Error('Cấu hình xác thực không hợp lệ.');
 return settings=data;
}
async function authCall(path,body,token,method='POST'){
 const c=await getConfig();
 const r=await nativeFetch(c.supabase_url+'/auth/v1/'+path,{
  method,cache:'no-store',redirect:'error',headers:{'Content-Type':'application/json','apikey':c.publishable_key,...(token?{'Authorization':'Bearer '+token}:{})},
  body:body?JSON.stringify(body):undefined
 });
 let data={};try{data=await r.json()}catch(_){}
 if(!r.ok)throw Error(data.msg||data.error_description||data.message||data.error||'Không thể xác thực.');
 return data;
}
async function token(){
 if(!creds?.refresh_token)return '';
 if(Date.now()<Number(creds.expires_at||0))return creds.access_token;
 if(!refreshing)refreshing=(async()=>{
  try{const r=await authCall('token?grant_type=refresh_token',{refresh_token:creds.refresh_token});setSession(r);return creds.access_token;}
  catch(_){clear();return '';}finally{refreshing=null;}
 })();
 return refreshing;
}
window.fetch=async function(input,opts){
 let url;try{url=new URL(typeof input==='string'?input:input.url,location.href);}catch(_){return nativeFetch(input,opts);}
 if(url.origin!==BACKEND)return nativeFetch(input,opts);
 if(['/health','/api/cafef','/api/auth/config'].includes(url.pathname))return nativeFetch(input,opts);
 const jwt=await token();
 if(!jwt)throw Error('Hãy đăng nhập AUREL.');
 const headers=new Headers(opts?.headers||(typeof input==='string'?undefined:input.headers));
 headers.set('Authorization','Bearer '+jwt);
 return nativeFetch(input,{...opts,headers});
};
function stylesheet(){
 if(el('aurel-account-style'))return;
 const style=document.createElement('style');style.id='aurel-account-style';
 style.textContent=[
 'html.aurel-auth-locked body #root,html.aurel-auth-locked body .main,html.aurel-auth-locked body .sidebar{visibility:hidden!important}',
 '#aurel-private-switch{display:none!important}',
 '#aurel-auth-shield{position:fixed;z-index:2147483640;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(9,27,45,.93);overflow:auto;padding:16px;font-family:Arial,sans-serif}',
 '#aurel-auth-shield[hidden]{display:none!important}',
 '#aurel-auth-card{width:100%;max-width:415px;border-radius:18px;padding:26px 24px;background:#fff;color:#193448;box-shadow:0 24px 80px rgba(0,0,0,.35);box-sizing:border-box}',
 '#aurel-auth-card h2{font-size:25px;margin:0 0 5px}',
 '#aurel-auth-card p{font-size:12.5px;line-height:1.6;color:#567189}',
 '#aurel-auth-card label{display:block;font-size:12.5px;margin-top:14px;font-weight:700}',
 '#aurel-auth-card input{box-sizing:border-box;width:100%;border:1px solid #b2cbd9;border-radius:9px;padding:11px 12px;margin-top:6px;color:#173449;background:white;font-size:14px}',
 '#aurel-auth-card button{border:1px solid #adc6d5;border-radius:8px;background:#f2f8fa;color:#1e4254;padding:9px;font-size:12px;cursor:pointer}',
 '#aurel-auth-card button[disabled]{opacity:.6;cursor:wait}',
 '#aurel-auth-card .primary{margin-top:18px;width:100%;background:#117990;color:#fff;font-weight:750;padding:12px;font-size:14px}',
 '#aurel-auth-links{display:flex;justify-content:center;flex-wrap:wrap;gap:8px;margin-top:12px}',
 '#aurel-auth-message{min-height:24px;margin:12px 0 0!important}',
 '#aurel-account-logout{background:transparent;color:inherit;border:1px solid #9bbaca;border-radius:8px;padding:7px 9px;margin:7px;font:inherit;cursor:pointer}',
 '@media(max-width:480px){#aurel-auth-card{padding:20px 16px}}'
 ].join('\n');document.head.appendChild(style);
}
function createScreen(){
 if(el('aurel-auth-shield'))return;
 const box=document.createElement('div');box.id='aurel-auth-shield';
 box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label','Tài khoản AUREL');
 box.innerHTML=[
 '<div id="aurel-auth-card"><h2>AUREL</h2><p>Đăng nhập để quản lý dữ liệu tài chính theo tài khoản riêng.</p>',
 '<form id="aurel-auth-form" novalidate>',
 '<label for="aurel-auth-email">Địa chỉ Gmail</label><input id="aurel-auth-email" type="email" autocomplete="email" placeholder="example@gmail.com" maxlength="254" required>',
 '<label for="aurel-auth-password">Mật khẩu AUREL</label><input id="aurel-auth-password" type="password" autocomplete="current-password" minlength="12" maxlength="128" required>',
 '<button id="aurel-auth-submit" class="primary" type="submit">Đăng nhập</button></form>',
 '<div id="aurel-auth-links"><button type="button" data-auth-mode="login">Đăng nhập</button>',
 '<button type="button" data-auth-mode="signup">Đăng ký</button><button type="button" data-auth-mode="forgot">Quên mật khẩu</button></div>',
 '<p id="aurel-auth-message" role="status" aria-live="polite"></p>',
 '<p style="font-size:11px">Tạo mật khẩu riêng cho AUREL, không nhập mật khẩu Gmail thực.</p></div>'
 ].join('');
 document.body.appendChild(box);
 box.addEventListener('click',e=>{const b=e.target.closest('[data-auth-mode]');if(b)setMode(b.dataset.authMode);});
 el('aurel-auth-form').addEventListener('submit',submit);
 setMode(mode);
}
function setMode(v){
 mode=v;
 const pw=el('aurel-auth-password'),email=el('aurel-auth-email'),b=el('aurel-auth-submit');
 if(!pw||!email||!b)return;
 pw.hidden=v==='forgot';pw.previousElementSibling.hidden=v==='forgot';pw.required=v!=='forgot';
 email.hidden=v==='reset';email.previousElementSibling.hidden=v==='reset';
 pw.autocomplete=v==='signup'?'new-password':'current-password';
 b.textContent=({login:'Đăng nhập',signup:'Đăng ký',forgot:'Gửi email khôi phục',reset:'Đổi mật khẩu'})[v]||'Đăng nhập';
 message('');
}
async function identity(){
 const jwt=await token();if(!jwt)throw Error('Phiên đăng nhập hết hạn.');
 const u=await authCall('user',null,jwt,'GET');
 if(!u?.id||!u.email?.toLowerCase().endsWith('@gmail.com')||!u.email_confirmed_at)throw Error('Gmail chưa được xác minh.');
 return u;
}
async function submit(e){
 e.preventDefault();
 const b=el('aurel-auth-submit');if(!b||b.disabled)return;
 const mail=el('aurel-auth-email').value.trim().toLowerCase(),password=el('aurel-auth-password').value;
 if(mode!=='reset'&&!/^[^\s@]+@gmail\.com$/.test(mail)){message('Vui lòng nhập địa chỉ Gmail hợp lệ.');return;}
 if(mode!=='forgot'&&password.length<12){message('Mật khẩu AUREL cần ít nhất 12 ký tự.');return;}
 b.disabled=true;
 try{
  if(mode==='signup'){
   await authCall('signup',{email:mail,password,options:{email_redirect_to:SITE}});
   el('aurel-auth-password').value='';
   message('Vui lòng kiểm tra Gmail và bấm liên kết xác minh trước khi đăng nhập.',true);
  }else if(mode==='forgot'){
   await authCall('recover?redirect_to='+encodeURIComponent(SITE),{email:mail});
   message('Nếu tài khoản tồn tại, email khôi phục sẽ được gửi.',true);
  }else if(mode==='reset'){
   const jwt=await token();if(!jwt)throw Error('Liên kết khôi phục đã hết hạn.');
   await authCall('user',{password},jwt,'PUT');
   message('Đổi mật khẩu thành công. Đang tải lại...',true);
   setTimeout(()=>location.reload(),1000);
  }else{
   const d=await authCall('token?grant_type=password',{email:mail,password});
   if(!d.user?.email_confirmed_at){message('Gmail chưa được xác minh.');return;}
   setSession(d);await identity();location.reload();
  }
 }catch(err){message(err?.message||'Không thể xác thực.');}
 finally{b.disabled=false;}
}
function logoutButton(){
 if(el('aurel-account-logout'))return;
 const b=document.createElement('button');b.id='aurel-account-logout';b.textContent='Đăng xuất';b.type='button';
 b.addEventListener('click',async()=>{
  const jwt=await token();if(jwt)try{await authCall('logout',{},jwt)}catch(_){}
  clear();location.reload();
 });
 (document.querySelector('.topbar .controls')||document.querySelector('.topbar')||document.body).appendChild(b);
}
async function start(){
 stylesheet();restore();
 const hash=new URLSearchParams(location.hash.slice(1));
 if(hash.get('type')==='recovery'&&hash.get('access_token')&&hash.get('refresh_token')){
  setSession({access_token:hash.get('access_token'),refresh_token:hash.get('refresh_token'),expires_in:hash.get('expires_in')||3600});
  history.replaceState(null,'',location.pathname+location.search);mode='reset';
 }
 createScreen();
 try{
  await getConfig();
  if(mode==='reset'){message('Nhập mật khẩu AUREL mới để hoàn tất khôi phục.',true);return;}
  if(creds){
   await identity();
   document.documentElement.classList.remove('aurel-auth-locked');
   el('aurel-auth-shield').hidden=true;
   logoutButton();
  }
 }catch(e){clear();message(e?.message||'Chưa thể kết nối hệ thống tài khoản.');}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.AURELAccountAuth={authorized:()=>!!creds};
})();