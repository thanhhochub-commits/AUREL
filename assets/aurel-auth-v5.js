(function(){
'use strict';
/* AUREL V5 local sign-in, registration and lock screen. No network authentication. */
const TIMEOUT=15*60*1000;
let unlockPromise=null,lastSeen=Date.now();
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n}
function css(){
 if(document.getElementById('aurel-auth-v5-css'))return;
 const style=el('style');style.id='aurel-auth-v5-css';
 style.textContent=[
 '#aurel-auth-wall{position:fixed;inset:0;z-index:2147483646;display:grid;place-items:center;padding:24px 12px;overflow-y:auto;background:linear-gradient(135deg,#071b2c 0%,#0c3247 50%,#19475a 100%);font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;color:#21394a}',
 '#aurel-auth-wall *{box-sizing:border-box}',
 '#aurel-auth-wall .auth-card{width:min(100%,430px);border-radius:22px;padding:33px;background:#fff;box-shadow:0 24px 95px #0005}',
 '#aurel-auth-wall .auth-brand{font-size:32px;font-weight:850;letter-spacing:.13em;color:#0f3d56}',
 '#aurel-auth-wall .auth-subbrand{font-weight:740;letter-spacing:.15em;font-size:10px;color:#68889c}',
 '#aurel-auth-wall .auth-title{font-weight:760;font-size:23px;color:#17384d;margin:29px 0 6px}',
 '#aurel-auth-wall .auth-description{color:#688095;font-size:13px;line-height:1.6;margin:0 0 18px}',
 '#aurel-auth-wall .auth-label{display:block;font-weight:720;font-size:12px;color:#395b6f;margin:12px 0 7px}',
 '#aurel-auth-wall input{width:100%;background:#fff;color:#16394e;padding:13px 14px;border:1px solid #d5e0e8;border-radius:11px;outline:none;font-size:14px}',
 '#aurel-auth-wall input:focus{border-color:#287f9c;box-shadow:0 0 0 3px #287f9c18}',
 '#aurel-auth-wall .auth-submit{display:block;width:100%;margin-top:23px;padding:14px;border:0;border-radius:11px;background:#14536d;color:#fff;font-size:14px;font-weight:730;cursor:pointer}',
 '#aurel-auth-wall .auth-submit:disabled{opacity:.55;cursor:wait}',
 '#aurel-auth-wall .auth-alternate{display:block;width:100%;border:0;background:transparent;padding:17px 5px 6px;color:#126186;font-size:12px;font-weight:680;cursor:pointer}',
 '#aurel-auth-wall .auth-error{color:#a72b35;font-size:12px;line-height:1.5;margin:13px 0;display:none}',
 '#aurel-auth-wall .auth-foot{border-top:1px solid #e9f0f5;padding-top:13px;margin:16px 0 0;text-align:center;color:#8499a8;font-size:11px;line-height:1.6}',
 '.aurel-v5-account{font-size:12px!important;font-weight:700!important;border:1px solid #b5cad8!important;background:transparent!important;border-radius:12px!important;padding:7px 10px!important;cursor:pointer!important;white-space:nowrap!important;display:inline-flex!important;align-items:center!important;gap:6px!important;color:inherit!important}',
 '.aurel-v5-menu{position:absolute;top:calc(100% + 8px);right:0;z-index:30000;padding:7px;background:#fff;border:1px solid #d9e6ed;border-radius:12px;box-shadow:0 12px 35px #0002;color:#264355;min-width:158px}',
 '.aurel-v5-menu button{display:block;width:100%;padding:10px 12px;background:transparent;border:0;border-radius:8px;color:inherit;text-align:left;font-size:12px;cursor:pointer}',
 '.aurel-v5-menu button:hover{background:#eff5f8}',
 '@media(max-width:650px){#aurel-auth-wall .auth-card{padding:25px 19px}.aurel-v5-account{font-size:11px!important;padding:5px!important}}'
 ].join('\n');
 document.head.appendChild(style);
}
function makeLogin(first){
 css();
 const wall=el('div');wall.id='aurel-auth-wall';wall.setAttribute('role','dialog');wall.setAttribute('aria-modal','true');
 wall.setAttribute('aria-label','Đăng nhập AUREL');
 const card=el('section','auth-card'),brand=el('div','auth-brand','AUREL'),
 sub=el('div','auth-subbrand','FINANCIAL INTELLIGENCE'),
 heading=el('h2','auth-title'),description=el('p','auth-description'),form=el('form');
 function field(label,type,autocomplete){
  const outer=el('div'),l=el('label','auth-label',label),input=el('input');
  input.type=type;input.autocomplete=autocomplete;input.required=true;
  if(type==='password')input.minLength=12;
  l.appendChild(input);outer.appendChild(l);outer.appendChild(input);form.appendChild(outer);return input;
 }
 const user=field('Tên người dùng','text','username');
 user.minLength=3;user.maxLength=32;user.placeholder='Ví dụ: thanh.aurel';
 const pass=field('Mật khẩu','password','current-password');pass.placeholder='Nhập mật khẩu';
 const confirm=field('Xác nhận mật khẩu','password','new-password');confirm.placeholder='Nhập lại mật khẩu';
 const submit=el('button','auth-submit'),error=el('p','auth-error'),alternate=el('button','auth-alternate');
 submit.type='submit';alternate.type='button';error.setAttribute('aria-live','polite');
 const foot=el('p','auth-foot','Mỗi máy có tài khoản và dữ liệu riêng. Mật khẩu không gửi lên máy chủ. Nếu quên mật khẩu, dữ liệu đã mã hóa có thể không khôi phục được.');
 form.appendChild(submit);form.appendChild(error);form.appendChild(alternate);
 card.appendChild(brand);card.appendChild(sub);card.appendChild(heading);card.appendChild(description);card.appendChild(form);card.appendChild(foot);
 wall.appendChild(card);document.body.appendChild(wall);
 let registering=first;
 function setMode(){
  heading.textContent=registering?'Tạo tài khoản riêng':'Chào mừng trở lại';
  description.textContent=registering?'Thiết lập không gian dữ liệu được mã hóa trên trình duyệt này.':'Đăng nhập để mở dữ liệu tài chính đã lưu trên máy này.';
  confirm.parentElement.style.display=registering?'':'none';confirm.required=registering;
  pass.autocomplete=registering?'new-password':'current-password';
  submit.textContent=registering?'Tạo tài khoản':'Đăng nhập';
  alternate.textContent=registering?'Đã có tài khoản? Đăng nhập':'Chưa có tài khoản? Đăng ký';
  error.style.display='none';
 }
 alternate.addEventListener('click',()=>{registering=!registering;pass.value='';confirm.value='';setMode();user.focus()});
 setMode();user.focus();
 return {wall,form,user,pass,confirm,submit,error,isRegister:()=>registering};
}
function attachMenu(){
 const user=window.AURELAuthCore.username();
 const host=document.querySelector('.topbar .ref-tools')||document.querySelector('.topbar .controls');
 if(!host)return;
 document.getElementById('aurel-v5-profile')?.remove();
 const wrap=el('span');wrap.id='aurel-v5-profile';wrap.style.position='relative';wrap.style.display='inline-flex';
 const toggle=el('button','aurel-v5-account','◉ '+user),menu=el('div','aurel-v5-menu');
 toggle.type='button';toggle.title='Tài khoản riêng trên máy này';menu.hidden=true;menu.style.display='none';
 const logout=el('button',null,'Đăng xuất');logout.type='button';
 logout.addEventListener('click',async()=>{
  logout.disabled=true;
  try{if(window.AURELLogoutCurrentSession)await window.AURELLogoutCurrentSession()}
  catch(e){console.warn('Session revocation failed',e)}
  window.AURELAuthCore.logout();
  try{sessionStorage.removeItem('aurel_secure_session_token');sessionStorage.removeItem('aurel_secure_session_username_v5')}catch(_){}
  window.location.reload();
 });
 menu.appendChild(logout);wrap.append(toggle);wrap.append(menu);host.prepend(wrap);
 toggle.addEventListener('click',()=>{menu.hidden=!menu.hidden;menu.style.display=menu.hidden?'none':'block'});
 document.addEventListener('click',event=>{if(!wrap.contains(event.target)){menu.hidden=true;menu.style.display='none'}});
}
async function requireUnlock(){
 if(window.AURELAuthCore.isUnlocked())return window.AURELAuthCore.username();
 if(unlockPromise)return unlockPromise;
 unlockPromise=(async()=>{
  const first=!(await window.AURELAuthCore.accounts()).length,ui=makeLogin(first);
  return new Promise(resolve=>{
   let busy=false;
   ui.form.addEventListener('submit',async event=>{
    event.preventDefault();if(busy)return;
    if(ui.isRegister()&&ui.pass.value!==ui.confirm.value){
     ui.error.style.display='block';ui.error.textContent='Hai mật khẩu không trùng nhau.';return;
    }
    busy=true;ui.submit.disabled=true;ui.error.style.display='none';
    try{
     const name=await (ui.isRegister()?window.AURELAuthCore.register(ui.user.value,ui.pass.value):window.AURELAuthCore.login(ui.user.value,ui.pass.value));
     ui.wall.remove();attachMenu();lastSeen=Date.now();resolve(name);
    }catch(e){ui.error.style.display='block';ui.error.textContent=e.message||'Không thể mở khóa dữ liệu.'}
    finally{ui.submit.disabled=false;busy=false;ui.pass.value='';ui.confirm.value=''}
   });
  });
 })().catch(err=>{unlockPromise=null;throw err});
 return unlockPromise;
}
for(const kind of ['pointerdown','keydown','touchstart'])document.addEventListener(kind,()=>{if(window.AURELAuthCore?.isUnlocked())lastSeen=Date.now()},{passive:true});
setInterval(()=>{if(window.AURELAuthCore?.isUnlocked()&&Date.now()-lastSeen>TIMEOUT){window.AURELAuthCore.logout();location.reload()}},60000);
document.addEventListener('visibilitychange',()=>{
 if(!document.hidden&&window.AURELAuthCore?.isUnlocked()&&Date.now()-lastSeen>TIMEOUT){window.AURELAuthCore.logout();location.reload()}
});
window.AURELLocalAuth={requireUnlock,isUnlocked:()=>window.AURELAuthCore.isUnlocked(),username:()=>window.AURELAuthCore.username()};
})();