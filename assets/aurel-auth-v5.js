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
 '#aurel-auth-wall .auth-name-guide{font-size:11px;color:#648094;line-height:1.55;padding-top:6px}',
 '#aurel-auth-wall .auth-password-field{position:relative;width:100%}',
 '#aurel-auth-wall .auth-password-field input{padding-right:52px!important}',
 '#aurel-auth-wall .auth-password-toggle{position:absolute;top:50%;right:7px;transform:translateY(-50%);display:grid;place-items:center;width:38px;height:38px;padding:0;border:0;border-radius:9px;background:transparent;color:#56778c;cursor:pointer;touch-action:manipulation}',
 '#aurel-auth-wall .auth-password-toggle:hover{background:#eef5f8;color:#17475e}',
 '#aurel-auth-wall .auth-password-toggle:focus-visible{outline:2px solid #287f9c;outline-offset:1px}',
 '#aurel-auth-wall .auth-password-toggle svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}',
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
 form.setAttribute('autocomplete','off');
 form.setAttribute('data-form-type','other');
 function field(label,type,autocomplete){
  const outer=el('div'),l=el('label','auth-label',label),input=el('input');
  input.type=type;input.autocomplete=type==='password'?'new-password':'off';input.required=true;
  input.setAttribute('autocapitalize','off');input.setAttribute('spellcheck','false');
  if(type==='password'){
   input.minLength=12;input.setAttribute('data-lpignore','true');input.setAttribute('data-1p-ignore','true');
   input.setAttribute('data-bwignore','true');input.readOnly=true;
   const activate=()=>{if(!input.readOnly)return;input.value='';input.readOnly=false};
   input.addEventListener('focus',activate,{once:true});
   input.addEventListener('pointerdown',activate,{once:true});
   input.addEventListener('keydown',activate,{once:true});
  }
  l.appendChild(input);outer.appendChild(l);outer.appendChild(input);form.appendChild(outer);return input;
 }
 const user=field('Tên người dùng','text','username');
 user.minLength=3;user.maxLength=32;user.placeholder='Ví dụ: thanh.aurel';
 const usernameGuide=el('div','auth-name-guide','Tên đăng nhập phải duy nhất trên AUREL (không phân biệt chữ hoa/chữ thường). Dùng 3–32 ký tự, không có khoảng trắng.');
 user.parentElement.appendChild(usernameGuide);
 const pass=field('Mật khẩu (tối thiểu 12 ký tự)','password','off');pass.placeholder='Ít nhất 12 ký tự';pass.title='Mật khẩu cần tối thiểu 12 ký tự';
 const confirm=field('Xác nhận mật khẩu','password','off');confirm.placeholder='Nhập lại mật khẩu';confirm.title='Vui lòng nhập lại cùng mật khẩu';
 function addPasswordEye(input){
  const outer=el('div','auth-password-field');
  input.parentElement.insertBefore(outer,input);outer.appendChild(input);
  const toggle=el('button','auth-password-toggle');toggle.type='button';
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
  toggle.appendChild(svg);outer.appendChild(toggle);
  function render(){
   const visible=input.type==='text';
   toggle.setAttribute('aria-label',visible?'Ẩn mật khẩu':'Hiện mật khẩu');
   toggle.setAttribute('title',visible?'Ẩn mật khẩu':'Hiện mật khẩu');
   toggle.setAttribute('aria-pressed',String(visible));
   svg.innerHTML=visible
    ? '<path d="M3 3l18 18"/><path d="M10.58 10.59a2 2 0 0 0 2.83 2.82"/><path d="M9.88 5.09A10.9 10.9 0 0 1 12 4.9c5 0 9.4 4.1 10 7.1a11.3 11.3 0 0 1-3.2 4.7"/><path d="M6.5 6.5C3.9 8.1 2.3 10.2 2 12c.6 3 5 7.1 10 7.1 1.2 0 2.3-.2 3.4-.6"/>'
    : '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>';
  }
  toggle.addEventListener('click',()=>{
   if(input.readOnly){input.readOnly=false;input.value=''}
   input.type=input.type==='password'?'text':'password';
   render();input.focus({preventScroll:true});
  });
  render();return render;
 }
 const renderPasswordEye=addPasswordEye(pass);
 const renderConfirmEye=addPasswordEye(confirm);
 const submit=el('button','auth-submit'),error=el('p','auth-error'),alternate=el('button','auth-alternate');
 submit.type='submit';alternate.type='button';error.setAttribute('aria-live','polite');
 const foot=el('p','auth-foot','Đã đăng ký trên V5 cũ ở máy này? Nhấn Đăng ký để tạo tài khoản ONLINE bằng đúng tên và mật khẩu cũ, sau đó đăng nhập ở máy khác. Dữ liệu cũ sẽ được chuyển khi tài khoản online còn trống. Không có khôi phục mật khẩu bằng email.');
 form.appendChild(submit);form.appendChild(error);form.appendChild(alternate);
 card.appendChild(brand);card.appendChild(sub);card.appendChild(heading);card.appendChild(description);card.appendChild(form);card.appendChild(foot);
 wall.appendChild(card);document.body.appendChild(wall);
 let registering=first;
 function setMode(){
  heading.textContent=registering?'Đăng ký tài khoản AUREL':'Chào mừng trở lại';
  description.textContent=registering?'Tạo tài khoản online một lần, đăng nhập bằng tên và mật khẩu trên mọi thiết bị.':'Đăng nhập để mở dữ liệu tài chính của tài khoản trên mọi thiết bị.';
  usernameGuide.style.display=registering?'block':'none';
  confirm.parentElement.style.display=registering?'':'none';confirm.required=registering;
  pass.autocomplete='new-password';confirm.autocomplete='new-password';
  pass.type='password';confirm.type='password';renderPasswordEye();renderConfirmEye();
  submit.textContent=registering?'Tạo tài khoản':'Đăng nhập';
  alternate.textContent=registering?'Đã có tài khoản? Đăng nhập':'Chưa có tài khoản? Đăng ký';
  error.style.display='none';
 }
 alternate.addEventListener('click',()=>{registering=!registering;pass.value='';confirm.value='';setMode();user.focus()});
 setMode();pass.value='';confirm.value='';user.focus();
 const wipeRestoredPasswords=()=>{if(!document.contains(wall))return;pass.value='';confirm.value='';pass.type='password';confirm.type='password';renderPasswordEye();renderConfirmEye()};
 window.addEventListener('pageshow',wipeRestoredPasswords);
 // Clear any credential value inserted during the initial browser autofill pass.
 queueMicrotask(wipeRestoredPasswords);
 requestAnimationFrame(wipeRestoredPasswords);
 return {wall,form,user,pass,confirm,submit,error,isRegister:()=>registering};
}
function attachMenu(){
 const user=window.AURELAuthCore.username();
 const host=document.querySelector('.topbar .ref-tools')||document.querySelector('.topbar .controls');
 if(!host)return;
 document.getElementById('aurel-v5-profile')?.remove();
 const wrap=el('span');wrap.id='aurel-v5-profile';wrap.style.position='relative';wrap.style.display='inline-flex';
 const toggle=el('button','aurel-v5-account','◉ '+user),menu=el('div','aurel-v5-menu');
 toggle.type='button';toggle.title='Tài khoản AUREL online';menu.hidden=true;menu.style.display='none';
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
    if(ui.isRegister()&&!/^[\p{L}\p{N}_.-]{3,32}$/u.test(ui.user.value.trim().normalize('NFC').toLowerCase())){
      ui.error.style.display='block';ui.error.textContent='Tên đăng nhập cần 3–32 ký tự, không có khoảng trắng; chỉ gồm chữ, số, dấu chấm, gạch nối hoặc gạch dưới.';ui.user.focus();return;
    }
    busy=true;ui.submit.disabled=true;ui.submit.textContent=ui.isRegister()?'Đang tạo tài khoản...':'Đang đăng nhập...';ui.error.style.display='none';
    try{
     const name=await (ui.isRegister()?window.AURELAuthCore.register(ui.user.value,ui.pass.value):window.AURELAuthCore.login(ui.user.value,ui.pass.value));
     ui.wall.remove();attachMenu();lastSeen=Date.now();resolve(name);
    }catch(e){ui.error.style.display='block';ui.error.textContent=e.message||'Không thể kết nối hệ thống tài khoản.';if((e.message||'').includes('đã có người sử dụng'))ui.user.focus()}
    finally{ui.submit.disabled=false;ui.submit.textContent=ui.isRegister()?'Tạo tài khoản':'Đăng nhập';busy=false;ui.pass.value='';ui.confirm.value=''}
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