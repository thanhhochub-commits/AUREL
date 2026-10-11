(function(){
'use strict';
/* AUREL V5 local sign-in, registration and lock screen. No network authentication. */
const TIMEOUT=15*60*1000;
let unlockPromise=null,lastSeen=Date.now();
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n}
function css(){
 if(document.getElementById('aurel-auth-v5-css'))return;
 const style=el('style');style.id='aurel-auth-v5-css';
 style.textContent="\n#aurel-auth-wall{position:fixed;inset:0;z-index:2147483646;isolation:isolate;display:grid;place-items:center;padding:26px 16px;overflow-y:auto;overscroll-behavior:contain;background:radial-gradient(ellipse 64% 72% at 80% 20%,#23566a 0%,transparent 75%),linear-gradient(135deg,#071c2b 0%,#0b2b3e 55%,#102c40 100%);font-family:Inter,system-ui,-apple-system,\"Segoe UI\",sans-serif;color:#1c3545;-webkit-font-smoothing:antialiased}\n#aurel-auth-wall:before{content:\"\";position:fixed;inset:0;pointer-events:none;z-index:-1;opacity:.24;background-image:linear-gradient(#9db8c412 1px,transparent 1px),linear-gradient(90deg,#9db8c412 1px,transparent 1px);background-size:55px 55px;mask-image:linear-gradient(90deg,transparent,black)}\n#aurel-auth-wall *{box-sizing:border-box}\n#aurel-auth-wall [hidden]{display:none!important}\n#aurel-auth-wall button,#aurel-auth-wall input{font:inherit}\n#aurel-auth-wall .auth-card{width:min(100%,454px);background:#fff;border:1px solid #ebf0f3;border-radius:20px;padding:34px 38px 28px;box-shadow:0 28px 85px #031a2b52,0 3px 14px #06283b22;position:relative;animation:aurel-auth-appear .2s ease-out both}\n@keyframes aurel-auth-appear{from{opacity:.85;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}\n#aurel-auth-wall .auth-brandbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-bottom:22px;border-bottom:1px solid #eef2f5}\n#aurel-auth-wall .auth-brand{font-size:29px;font-weight:850;line-height:1.05;letter-spacing:.16em;color:#10364d}\n#aurel-auth-wall .auth-subbrand{font-size:9px;letter-spacing:.15em;color:#708da0;font-weight:760;margin-top:6px}\n#aurel-auth-wall .auth-secure-tag{display:flex;align-items:center;gap:6px;color:#52748a;font-size:10px;font-weight:680;letter-spacing:.025em;border:1px solid #dce8ec;background:#f5f9fa;padding:8px 10px;border-radius:24px;white-space:nowrap}\n#aurel-auth-wall .auth-secure-tag svg{width:14px;height:14px;fill:none;stroke:#23828a;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}\n#aurel-auth-wall .auth-title{margin:26px 0 8px;font-size:22px;line-height:1.26;font-weight:760;letter-spacing:-.035em;color:#142f42}\n#aurel-auth-wall .auth-description{font-size:12.6px;line-height:1.65;color:#667f8f;margin:0 0 23px;max-width:355px}\n#aurel-auth-wall .auth-field{margin:0 0 16px}\n#aurel-auth-wall .auth-label{display:block;font-size:12px;font-weight:720;color:#2c4b60;margin:0 0 8px}\n#aurel-auth-wall .auth-field input{display:block;width:100%;min-width:0;height:46px;padding:11px 13px;background:#fcfdfd;color:#15384d;border:1px solid #d7e2e9;border-radius:10px;outline:0;font-size:13px;line-height:1.4;transition:border-color .15s,box-shadow .15s,background-color .15s}\n#aurel-auth-wall .auth-field input::placeholder{color:#96a9b5}\n#aurel-auth-wall .auth-field input:focus{background:#fff;border-color:#3e849b;box-shadow:0 0 0 3px #3189a81b}\n#aurel-auth-wall .auth-name-guide{font-size:11px;line-height:1.5;margin:7px 2px 0;color:#698493}\n#aurel-auth-wall .auth-password-field{position:relative;width:100%}\n#aurel-auth-wall .auth-password-field input{padding-right:49px!important}\n#aurel-auth-wall .auth-password-toggle{position:absolute;top:50%;right:6px;transform:translateY(-50%);display:grid;place-items:center;width:35px;height:35px;padding:0;background:transparent;border:0;border-radius:8px;color:#668496;cursor:pointer;touch-action:manipulation}\n#aurel-auth-wall .auth-password-toggle:hover{color:#17627c;background:#edf5f7}\n#aurel-auth-wall .auth-password-toggle:focus-visible{outline:2px solid #398ba6;outline-offset:1px}\n#aurel-auth-wall .auth-password-toggle svg{height:18px;width:18px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}\n#aurel-auth-wall .auth-submit{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:47px;margin:23px 0 0;padding:12px 16px;background:#164c67;color:#fff;font-size:13.5px;font-weight:740;letter-spacing:.005em;border:1px solid #164c67;border-radius:10px;cursor:pointer;box-shadow:0 5px 14px #0e4a6518;transition:background .18s,box-shadow .18s,transform .18s}\n#aurel-auth-wall .auth-submit:hover:not(:disabled){background:#0d3d55;box-shadow:0 8px 20px #0e4a652d}\n#aurel-auth-wall .auth-submit:active:not(:disabled){transform:translateY(1px)}\n#aurel-auth-wall .auth-submit:disabled{opacity:.62;cursor:wait}\n#aurel-auth-wall .auth-switch{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:5px;margin:18px 0 0;font-size:12px}\n#aurel-auth-wall .auth-switch-label{color:#738b9a}\n#aurel-auth-wall .auth-alternate{display:inline-flex;align-items:center;padding:3px 2px;border:0;background:transparent;font-weight:760;color:#176787;cursor:pointer;font-size:12px}\n#aurel-auth-wall .auth-alternate:hover{text-decoration:underline;text-underline-offset:3px}\n#aurel-auth-wall .auth-error{display:none;background:#fff5f4;border:1px solid #f0cdca;border-radius:9px;color:#9c3339;font-size:11.5px;line-height:1.55;padding:10px 12px;margin:13px 0 0}\n#aurel-auth-wall .auth-foot{display:flex;gap:9px;align-items:flex-start;margin:22px 0 0;padding-top:15px;border-top:1px solid #ebf1f4;color:#7c93a0;font-size:10.5px;line-height:1.55}\n#aurel-auth-wall .auth-foot svg{flex:none;width:16px;height:16px;margin-top:1px;stroke:#54869a;fill:none;stroke-width:1.7}\n#aurel-auth-wall .auth-migration{font-size:10.5px;line-height:1.55;color:#6b8597;margin:9px 0 0}\n.aurel-v5-account{font-size:12px!important;font-weight:700!important;border:1px solid #b5cad8!important;background:transparent!important;border-radius:12px!important;padding:7px 10px!important;cursor:pointer!important;white-space:nowrap!important;display:inline-flex!important;align-items:center!important;gap:6px!important;color:inherit!important}\n.aurel-v5-menu{position:absolute;top:calc(100% + 8px);right:0;z-index:30000;padding:7px;background:#fff;border:1px solid #d9e6ed;border-radius:12px;box-shadow:0 12px 35px #0002;color:#264355;min-width:158px}\n.aurel-v5-menu button{display:block;width:100%;padding:10px 12px;background:transparent;border:0;border-radius:8px;color:inherit;text-align:left;font-size:12px;cursor:pointer}\n.aurel-v5-menu button:hover{background:#eff5f8}\n@media(max-width:650px){#aurel-auth-wall{padding:18px 12px}#aurel-auth-wall .auth-card{padding:27px 24px 23px;border-radius:17px}#aurel-auth-wall .auth-brand{font-size:26px}#aurel-auth-wall .auth-title{margin-top:24px}#aurel-auth-wall .auth-secure-tag{font-size:9px;padding:7px 8px}.aurel-v5-account{font-size:11px!important;padding:5px!important}}\n@media(max-width:375px){#aurel-auth-wall .auth-card{padding:24px 18px 20px}#aurel-auth-wall .auth-brandbar{gap:8px}#aurel-auth-wall .auth-secure-tag{font-size:8px;padding:7px}}\n@media(prefers-reduced-motion:reduce){#aurel-auth-wall .auth-card{animation:none}#aurel-auth-wall .auth-submit{transition:none}}\n";
 style.textContent+="\n/* AUREL auth visual refresh. Scoped exclusively to the sign-in overlay. */\n#aurel-auth-wall{padding:24px 18px;background:radial-gradient(ellipse 58% 67% at 12% 14%,rgba(45,113,147,.23),transparent 73%),radial-gradient(ellipse 58% 78% at 87% 83%,rgba(17,67,93,.32),transparent 75%),linear-gradient(135deg,#071d2c 0%,#0b2b40 55%,#102e42 100%)}\n#aurel-auth-wall .auth-card{width:min(100%,948px);display:grid;grid-template-columns:minmax(0,.92fr) minmax(0,1.08fr);padding:0;border:1px solid #e2eaf0;border-radius:23px;overflow:hidden;box-shadow:0 30px 95px rgba(0,18,32,.34),0 3px 14px rgba(0,18,32,.13)}\n#aurel-auth-wall .auth-showcase{position:relative;min-width:0;min-height:583px;display:flex;flex-direction:column;overflow:hidden;padding:39px 36px 24px;color:#f0f8fc;background:radial-gradient(ellipse 75% 60% at 78% 62%,rgba(75,164,204,.25),transparent 73%),linear-gradient(155deg,#103b54 0%,#0c3048 55%,#082638 100%)}\n#aurel-auth-wall .auth-showcase:before{content:\"\";position:absolute;inset:0;pointer-events:none;opacity:.14;background-image:linear-gradient(rgba(214,234,245,.17) 1px,transparent 1px),linear-gradient(90deg,rgba(214,234,245,.17) 1px,transparent 1px);background-size:46px 46px;mask-image:linear-gradient(180deg,transparent 10%,#000 100%)}\n#aurel-auth-wall .auth-showcase-head{position:relative;z-index:2}\n#aurel-auth-wall .auth-showcase-kicker{display:flex;align-items:center;gap:9px;color:#b7dcec;font-size:10px;font-weight:750;letter-spacing:.15em}\n#aurel-auth-wall .auth-showcase-kicker:before{content:\"\";height:7px;width:7px;flex:none;border-radius:50%;background:#82d8e5;box-shadow:0 0 0 4px rgba(130,216,229,.10)}\n#aurel-auth-wall .auth-showcase h3{margin:22px 0 9px;max-width:300px;font-size:27px;line-height:1.22;font-weight:780;letter-spacing:-.04em;color:#fff}\n#aurel-auth-wall .auth-showcase-copy{max-width:290px;margin:0;font-size:12px;line-height:1.65;color:#b9d1dd}\n#aurel-auth-wall .auth-report-visual{position:relative;flex:1;min-height:305px;z-index:1;pointer-events:none}\n#aurel-auth-wall .auth-report-orbit{position:absolute;width:330px;height:170px;top:50%;left:50%;border:1px solid rgba(141,207,234,.23);border-radius:50%;transform:translate(-50%,-50%) rotate(-11deg)}\n#aurel-auth-wall .auth-report-orbit.second{width:266px;height:125px;border-style:dashed;border-color:rgba(141,207,234,.13);transform:translate(-50%,-50%) rotate(11deg)}\n#aurel-auth-wall .auth-report-back{position:absolute;width:225px;height:280px;top:50%;left:50%;border-radius:13px;background:#cbdfea;border:1px solid rgba(246,252,255,.78);box-shadow:0 19px 42px rgba(1,18,31,.24);transform:translate(-45%,-47%) rotate(6deg)}\n#aurel-auth-wall .auth-report-paper{position:absolute;width:225px;height:280px;top:50%;left:50%;padding:18px 17px 15px;border:1px solid #d9e6ed;border-radius:13px;background:linear-gradient(180deg,#fff,#f8fbfd);box-shadow:0 22px 52px rgba(0,18,32,.27);transform:translate(-55%,-53%) rotate(-4deg);color:#17384a}\n#aurel-auth-wall .auth-report-paper-top{display:flex;align-items:center;justify-content:space-between;gap:8px}\n#aurel-auth-wall .auth-report-paper-top strong{font-size:10px;letter-spacing:.19em;font-weight:850;color:#176183}\n#aurel-auth-wall .auth-report-paper-top span{padding:5px 7px;border-radius:6px;background:#eaf2f8;color:#5d8096;font-size:8px;font-weight:800;letter-spacing:.06em}\n#aurel-auth-wall .auth-report-paper h4{margin:18px 0 3px;font-size:12px;line-height:1.25;letter-spacing:.01em;font-weight:820;color:#16384c}\n#aurel-auth-wall .auth-report-paper-sub{font-size:7px;font-weight:740;letter-spacing:.09em;color:#8a9eaf}\n#aurel-auth-wall .auth-report-rule{height:3px;width:100%;border-radius:5px;background:linear-gradient(90deg,#287eac,#93cacc,#e0edf4);margin:12px 0 13px}\n#aurel-auth-wall .auth-report-bars{display:grid;grid-template-columns:1.1fr .96fr .73fr;gap:8px;margin-bottom:13px}\n#aurel-auth-wall .auth-report-bars span{height:27px;border-radius:5px;background:#e4effa}\n#aurel-auth-wall .auth-report-bars span:nth-child(2){background:#e2f2ed}\n#aurel-auth-wall .auth-report-bars span:nth-child(3){background:#f7edda}\n#aurel-auth-wall .auth-report-chart{height:91px;border:1px solid #e7eef4;border-radius:7px;overflow:hidden;background:linear-gradient(180deg,#fff,#f8fbff)}\n#aurel-auth-wall .auth-report-chart svg{width:100%;height:100%;display:block}\n#aurel-auth-wall .auth-report-lines{display:grid;gap:7px;margin-top:12px}\n#aurel-auth-wall .auth-report-lines span{display:block;height:5px;width:100%;border-radius:9px;background:#dce7ef}\n#aurel-auth-wall .auth-report-lines span:nth-child(2){width:78%}\n#aurel-auth-wall .auth-report-lines span:nth-child(3){width:91%}\n#aurel-auth-wall .auth-report-floating{position:absolute;right:2px;bottom:22px;display:flex;align-items:center;gap:7px;padding:9px 11px;border:1px solid #dce8ef;border-radius:9px;background:#fff;box-shadow:0 12px 30px rgba(0,16,27,.20);color:#31556d;font-size:9px;font-weight:780;letter-spacing:.02em;transform:rotate(4deg)}\n#aurel-auth-wall .auth-report-floating svg{height:15px;width:15px;fill:none;stroke:#218f9a;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}\n#aurel-auth-wall .auth-showcase-caption{position:relative;z-index:1;display:flex;align-items:center;gap:8px;color:#a7cadb;font-size:10px}\n#aurel-auth-wall .auth-showcase-caption:before{content:\"\";height:1px;width:20px;background:#81c5dd}\n#aurel-auth-wall .auth-form-panel{min-width:0;padding:34px 42px 27px;display:flex;flex-direction:column;justify-content:center}\n#aurel-auth-wall .auth-brandbar{padding-bottom:19px}\n#aurel-auth-wall .auth-title{font-size:25px;font-weight:790;margin-top:25px}\n#aurel-auth-wall .auth-description{margin-bottom:22px;font-size:12.7px}\n#aurel-auth-wall .auth-field{margin-bottom:15px}\n#aurel-auth-wall .auth-field input{height:47px;background:#fbfdfe}\n#aurel-auth-wall .auth-field input:focus{border-color:#3485a3;box-shadow:0 0 0 3px rgba(49,137,168,.13)}\n#aurel-auth-wall .auth-submit{margin-top:21px}\n@media(max-width:830px){#aurel-auth-wall .auth-card{width:min(100%,520px);grid-template-columns:1fr}#aurel-auth-wall .auth-showcase{height:156px;min-height:156px;padding:23px 28px}#aurel-auth-wall .auth-showcase h3{font-size:21px;max-width:235px;margin:14px 0 7px}#aurel-auth-wall .auth-showcase-copy{font-size:11px;max-width:235px}#aurel-auth-wall .auth-report-visual{position:absolute;right:14px;top:-5px;bottom:auto;left:auto;width:230px;height:240px;min-height:0;transform:scale(.58);transform-origin:top right;opacity:.93}#aurel-auth-wall .auth-showcase-caption{display:none}#aurel-auth-wall .auth-form-panel{padding:28px 36px 27px}}\n@media(max-width:530px){#aurel-auth-wall{padding:15px 12px}#aurel-auth-wall .auth-card{border-radius:18px}#aurel-auth-wall .auth-showcase{height:140px;min-height:140px;padding:21px 23px}#aurel-auth-wall .auth-showcase-kicker{font-size:8px}#aurel-auth-wall .auth-showcase h3{font-size:19px;max-width:185px;margin:12px 0 6px}#aurel-auth-wall .auth-showcase-copy{font-size:10px;max-width:172px;line-height:1.55}#aurel-auth-wall .auth-report-visual{right:-34px;top:-6px;transform:scale(.52)}#aurel-auth-wall .auth-form-panel{padding:26px 25px 24px}#aurel-auth-wall .auth-title{font-size:23px;margin-top:23px}#aurel-auth-wall .auth-secure-tag{font-size:8px;padding:7px 8px}}\n@media(max-width:365px){#aurel-auth-wall .auth-report-visual{right:-52px;opacity:.78}#aurel-auth-wall .auth-form-panel{padding:23px 19px 22px}#aurel-auth-wall .auth-brandbar{gap:7px}#aurel-auth-wall .auth-secure-tag{font-size:7px;padding:7px 6px}}\n@media(prefers-reduced-motion:reduce){#aurel-auth-wall .auth-card{animation:none}}\n";
 document.head.appendChild(style);
}

function makeLogin(first){
 css();
 const wall=el('div');wall.id='aurel-auth-wall';wall.setAttribute('role','dialog');
 wall.setAttribute('aria-modal','true');wall.setAttribute('aria-label','AUREL - Tài khoản');
 const card=el('section','auth-card');
 const brandBar=el('div','auth-brandbar');
 const brandBlock=el('div'),brand=el('div','auth-brand','AUREL');
 const sub=el('div','auth-subbrand','FINANCIAL INTELLIGENCE');
 brandBlock.append(brand,sub);
 const secureTag=el('div','auth-secure-tag');
 const tagSvg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 tagSvg.setAttribute('viewBox','0 0 24 24');tagSvg.setAttribute('aria-hidden','true');
 tagSvg.innerHTML='<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>';
 secureTag.append(tagSvg,el('span',null,'TÀI KHOẢN ONLINE'));
 brandBar.append(brandBlock,secureTag);
 const showcase=el('aside','auth-showcase');
 showcase.setAttribute('aria-label','Minh họa báo cáo tài chính AUREL');
 showcase.innerHTML="<div class=\"auth-showcase-head\"><div class=\"auth-showcase-kicker\">KHÔNG GIAN PHÂN TÍCH AUREL</div><h3>Báo cáo tài chính.<br>Rõ ràng hơn.</h3><p class=\"auth-showcase-copy\">Theo dõi dữ liệu và phân tích chuyên sâu trong một không gian thống nhất.</p></div><div class=\"auth-report-visual\" aria-hidden=\"true\"><div class=\"auth-report-orbit\"></div><div class=\"auth-report-orbit second\"></div><div class=\"auth-report-back\"></div><div class=\"auth-report-paper\"><div class=\"auth-report-paper-top\"><strong>AUREL</strong><span>BCTC</span></div><h4>BÁO CÁO TÀI CHÍNH</h4><div class=\"auth-report-paper-sub\">TỔNG QUAN VÀ PHÂN TÍCH</div><div class=\"auth-report-rule\"></div><div class=\"auth-report-bars\"><span></span><span></span><span></span></div><div class=\"auth-report-chart\"><svg viewBox=\"0 0 190 93\" preserveAspectRatio=\"none\" xmlns=\"http://www.w3.org/2000/svg\" aria-label=\"Biểu đồ nến tăng giảm minh họa\" role=\"img\"><title>Biểu đồ nến tài chính minh họa, không sử dụng dữ liệu thị trường thực tế</title><rect width=\"190\" height=\"93\" fill=\"#fbfdff\"/><g stroke=\"#e6edf4\" stroke-width=\".8\" stroke-dasharray=\"2.5 3\"><path d=\"M7 15H181M7 32H181M7 49H181M7 66H181\"/></g><path d=\"M8 72H181\" stroke=\"#cfdee9\" stroke-width=\".7\"/><path d=\"M14 51V74\" stroke=\"#139b85\" stroke-width=\"1.25\" stroke-linecap=\"round\"/><rect x=\"11\" y=\"57\" width=\"6\" height=\"12\" rx=\".8\" fill=\"#139b85\" stroke=\"#139b85\" stroke-width=\"1.15\"/><rect x=\"11.4\" y=\"84.625\" width=\"5.2\" height=\"4.375\" rx=\".55\" fill=\"#a3dfd3\" opacity=\".9\"/><path d=\"M25 52V71\" stroke=\"#dc6267\" stroke-width=\"1.25\" stroke-linecap=\"round\"/><rect x=\"22\" y=\"58\" width=\"6\" height=\"5\" rx=\".8\" fill=\"#fff1f0\" stroke=\"#dc6267\" stroke-width=\"1.15\"/><rect x=\"22.4\" y=\"85.25\" width=\"5.2\" height=\"3.75\" rx=\".55\" fill=\"#f0bfc1\" opacity=\".9\"/><path d=\"M36 44V69\" stroke=\"#139b85\" stroke-width=\"1.25\" stroke-linecap=\"round\"/><rect x=\"33\" y=\"48\" width=\"6\" height=\"17\" rx=\".8\" fill=\"#139b85\" stroke=\"#139b85\" stroke-width=\"1.15\"/><rect x=\"33.4\" y=\"84\" width=\"5.2\" height=\"5\" rx=\".55\" fill=\"#a3dfd3\" opacity=\".9\"/><path d=\"M47 33V52\" stroke=\"#139b85\" stroke-width=\"1.25\" stroke-linecap=\"round\"/><rect x=\"44\" y=\"39\" width=\"6\" height=\"8\" rx=\".8\" fill=\"#139b85\" stroke=\"#139b85\" stroke-width=\"1.15\"/><rect x=\"44.4\" y=\"82.75\" width=\"5.2\" height=\"6.25\" rx=\".55\" fill=\"#a3dfd3\" opacity=\".9\"/><path d=\"M58 36V51\" stroke=\"#dc6267\" stroke-width=\"1.25\" stroke-linecap=\"round\"/><rect x=\"55\" y=\"40\" width=\"6\" height=\"5\" rx=\".8\" fill=\"#fff1f0\" stroke=\"#dc6267\" stroke-width=\"1.15\"/><rect x=\"55.4\" y=\"84.625\" width=\"5.2\" height=\"4.375\" rx=\".55\" fill=\"#f0bfc1\" opacity=\".9\"/><path d=\"M69 30V49\" stroke=\"#139b85\" stroke-width=\"1.25\" stroke-linecap=\"round\"/><rect x=\"66\" y=\"35\" width=\"6\" height=\"10\" rx=\".8\" fill=\"#139b85\" stroke=\"#139b85\" stroke-width=\"1.15\"/><rect x=\"66.4\" y=\"81.5\" width=\"5.2\" height=\"7.5\" rx=\".55\" fill=\"#a3dfd3\" opacity=\".9\"/><path d=\"M80 24V41\" stroke=\"#139b85\" stroke-width=\"1.25\" stroke-linecap=\"round\"/><rect x=\"77\" y=\"30\" width=\"6\" height=\"6\" rx=\".8\" fill=\"#139b85\" stroke=\"#139b85\" stroke-width=\"1.15\"/><rect x=\"77.4\" y=\"82.75\" width=\"5.2\" height=\"6.25\" rx=\".55\" fill=\"#a3dfd3\" opacity=\".9\"/><path d=\"M91 27V48\" stroke=\"#dc6267\" stroke-width=\"1.25\" stroke-linecap=\"round\"/><rect x=\"88\" y=\"31\" width=\"6\" height=\"10\" rx=\".8\" fill=\"#fff1f0\" stroke=\"#dc6267\" stroke-width=\"1.15\"/><rect x=\"88.4\" y=\"84\" width=\"5.2\" height=\"5\" rx=\".55\" fill=\"#f0bfc1\" opacity=\".9\"/><path d=\"M102 23V44\" stroke=\"#139b85\" stroke-width=\"1.25\" stroke-linecap=\"round\"/><rect x=\"99\" y=\"28\" width=\"6\" height=\"13\" rx=\".8\" fill=\"#139b85\" stroke=\"#139b85\" stroke-width=\"1.15\"/><rect x=\"99.4\" y=\"82.75\" width=\"5.2\" height=\"6.25\" rx=\".55\" fill=\"#a3dfd3\" opacity=\".9\"/><path d=\"M113 17V34\" stroke=\"#139b85\" stroke-width=\"1.25\" stroke-linecap=\"round\"/><rect x=\"110\" y=\"21\" width=\"6\" height=\"7\" rx=\".8\" fill=\"#139b85\" stroke=\"#139b85\" stroke-width=\"1.15\"/><rect x=\"110.4\" y=\"81.5\" width=\"5.2\" height=\"7.5\" rx=\".55\" fill=\"#a3dfd3\" opacity=\".9\"/><path d=\"M124 18V33\" stroke=\"#dc6267\" stroke-width=\"1.25\" stroke-linecap=\"round\"/><rect x=\"121\" y=\"22\" width=\"6\" height=\"5\" rx=\".8\" fill=\"#fff1f0\" stroke=\"#dc6267\" stroke-width=\"1.15\"/><rect x=\"121.4\" y=\"84\" width=\"5.2\" height=\"5\" rx=\".55\" fill=\"#f0bfc1\" opacity=\".9\"/><path d=\"M135 13V31\" stroke=\"#139b85\" stroke-width=\"1.25\" stroke-linecap=\"round\"/><rect x=\"132\" y=\"17\" width=\"6\" height=\"11\" rx=\".8\" fill=\"#139b85\" stroke=\"#139b85\" stroke-width=\"1.15\"/><rect x=\"132.4\" y=\"81.5\" width=\"5.2\" height=\"7.5\" rx=\".55\" fill=\"#a3dfd3\" opacity=\".9\"/><path d=\"M146 9V22\" stroke=\"#139b85\" stroke-width=\"1.25\" stroke-linecap=\"round\"/><rect x=\"143\" y=\"13\" width=\"6\" height=\"5\" rx=\".8\" fill=\"#139b85\" stroke=\"#139b85\" stroke-width=\"1.15\"/><rect x=\"143.4\" y=\"80.25\" width=\"5.2\" height=\"8.75\" rx=\".55\" fill=\"#a3dfd3\" opacity=\".9\"/><path d=\"M157 10V24\" stroke=\"#dc6267\" stroke-width=\"1.25\" stroke-linecap=\"round\"/><rect x=\"154\" y=\"14\" width=\"6\" height=\"4\" rx=\".8\" fill=\"#fff1f0\" stroke=\"#dc6267\" stroke-width=\"1.15\"/><rect x=\"154.4\" y=\"84\" width=\"5.2\" height=\"5\" rx=\".55\" fill=\"#f0bfc1\" opacity=\".9\"/><path d=\"M168 6V20\" stroke=\"#139b85\" stroke-width=\"1.25\" stroke-linecap=\"round\"/><rect x=\"165\" y=\"10\" width=\"6\" height=\"8\" rx=\".8\" fill=\"#139b85\" stroke=\"#139b85\" stroke-width=\"1.15\"/><rect x=\"165.4\" y=\"79\" width=\"5.2\" height=\"10\" rx=\".55\" fill=\"#a3dfd3\" opacity=\".9\"/><g fill=\"#98aebd\" font-size=\"5.3\" font-family=\"Arial,sans-serif\"><text x=\"177\" y=\"16\">H</text><text x=\"177\" y=\"68\">L</text></g></svg></div><div class=\"auth-report-lines\"><span></span><span></span><span></span></div></div><div class=\"auth-report-floating\"><svg viewBox=\"0 0 24 24\"><path d=\"M4 19V5m0 14h16M8 15l4-4 3 2 5-6\"/></svg> PHÂN TÍCH BCTC</div></div><div class=\"auth-showcase-caption\">Minh họa báo cáo tài chính</div>";
 const formPanel=el('div','auth-form-panel');
 const heading=el('h2','auth-title');
 const description=el('p','auth-description');
 const form=el('form');form.setAttribute('autocomplete','off');form.setAttribute('data-form-type','other');
 const uid='aurel-auth-'+Date.now().toString(36);
 function field(label,type,key){
  const outer=el('div','auth-field'),l=el('label','auth-label',label),input=el('input');
  input.id=uid+'-'+key;l.htmlFor=input.id;
  input.name=key;input.type=type;input.autocomplete=type==='password'?'new-password':'off';
  input.required=true;input.setAttribute('autocapitalize','off');input.setAttribute('spellcheck','false');
  if(type==='password'){
   input.minLength=12;
   input.setAttribute('data-lpignore','true');input.setAttribute('data-1p-ignore','true');input.setAttribute('data-bwignore','true');
   input.readOnly=true;
   const activate=()=>{if(!input.readOnly)return;input.value='';input.readOnly=false};
   input.addEventListener('focus',activate,{once:true});
   input.addEventListener('pointerdown',activate,{once:true});
   input.addEventListener('keydown',activate,{once:true});
  }
  outer.append(l,input);form.append(outer);
  return {outer,input};
 }
 const usernameField=field('Tên đăng nhập','text','username'),user=usernameField.input;
 user.minLength=3;user.maxLength=32;user.placeholder='Nhập tên đăng nhập';
 const usernameGuide=el('div','auth-name-guide','3–32 ký tự. Chỉ dùng chữ, số, dấu chấm, gạch nối hoặc gạch dưới.');
 usernameField.outer.append(usernameGuide);
 const passwordField=field('Mật khẩu','password','password'),pass=passwordField.input;
 pass.placeholder='Nhập mật khẩu';
 const passwordGuide=el('div','auth-name-guide','Tối thiểu 12 ký tự. Không chia sẻ mật khẩu với người khác.');
 passwordField.outer.append(passwordGuide);
 const confirmField=field('Xác nhận mật khẩu','password','confirm-password'),confirm=confirmField.input;
 confirm.placeholder='Nhập lại mật khẩu';
 function addPasswordEye(input){
  const wrap=el('div','auth-password-field');input.parentElement.insertBefore(wrap,input);wrap.append(input);
  const button=el('button','auth-password-toggle');button.type='button';
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
  button.append(svg);wrap.append(button);
  function render(){
   const shown=input.type==='text';
   button.setAttribute('aria-label',shown?'Ẩn mật khẩu':'Hiện mật khẩu');
   button.setAttribute('title',shown?'Ẩn mật khẩu':'Hiện mật khẩu');
   button.setAttribute('aria-pressed',String(shown));
   svg.innerHTML=shown
    ? '<path d="M3 3l18 18"/><path d="M10.58 10.59a2 2 0 0 0 2.83 2.82"/><path d="M9.88 5.09A10.9 10.9 0 0 1 12 4.9c5 0 9.4 4.1 10 7.1a11.3 11.3 0 0 1-3.2 4.7"/><path d="M6.5 6.5C3.9 8.1 2.3 10.2 2 12c.6 3 5 7.1 10 7.1 1.2 0 2.3-.2 3.4-.6"/>'
    : '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>';
  }
  button.addEventListener('click',()=>{
   if(input.readOnly){input.readOnly=false;input.value=''}
   input.type=input.type==='password'?'text':'password';
   render();input.focus({preventScroll:true});
  });
  render();return render;
 }
 const renderPasswordEye=addPasswordEye(pass),renderConfirmEye=addPasswordEye(confirm);
 const submit=el('button','auth-submit');submit.type='submit';
 const error=el('p','auth-error');error.setAttribute('aria-live','polite');
 const switchBox=el('div','auth-switch'),switchText=el('span','auth-switch-label');
 const alternate=el('button','auth-alternate');alternate.type='button';
 switchBox.append(switchText,alternate);
 const footer=el('div','auth-foot'),footerSvg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 footerSvg.setAttribute('viewBox','0 0 24 24');footerSvg.setAttribute('aria-hidden','true');
 footerSvg.innerHTML='<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>';
 const footerMessage=el('span',null,'Dữ liệu tài chính được quản lý theo tài khoản. Bạn có thể truy cập bằng cùng tài khoản trên nhiều thiết bị.');
 footer.append(footerSvg,footerMessage);
 const migration=el('p','auth-migration','Nếu đang sử dụng tài khoản V5 cũ, hãy đăng ký tài khoản online bằng tên và mật khẩu trước đây để chuyển dữ liệu khi tài khoản mới còn trống.');
 form.append(submit,error,switchBox);
 formPanel.append(brandBar,heading,description,form,footer,migration);
 card.append(showcase,formPanel);
 wall.append(card);document.body.append(wall);
 let registering=!!first;
 function setMode(){
  heading.textContent=registering?'Tạo tài khoản AUREL':'Đăng nhập hệ thống';
  description.textContent=registering
   ?'Đăng ký một lần để quản lý và truy cập dữ liệu tài chính trên mọi thiết bị.'
   :'Truy cập không gian dữ liệu và công cụ phân tích tài chính của bạn.';
  usernameGuide.hidden=!registering;
  passwordGuide.hidden=!registering;
  confirmField.outer.hidden=!registering;
  confirm.disabled=!registering;confirm.required=registering;
  pass.autocomplete='new-password';confirm.autocomplete='new-password';
  pass.type='password';confirm.type='password';renderPasswordEye();renderConfirmEye();
  submit.textContent=registering?'Tạo tài khoản':'Đăng nhập';
  switchText.textContent=registering?'Đã có tài khoản?':'Chưa có tài khoản?';
  alternate.textContent=registering?'Đăng nhập':'Đăng ký ngay';
  migration.hidden=!registering;
  error.style.display='none';
 }
 alternate.addEventListener('click',()=>{
  registering=!registering;pass.value='';confirm.value='';setMode();user.focus();
 });
 setMode();pass.value='';confirm.value='';user.focus();
 const wipeRestoredPasswords=()=>{
  if(!document.contains(wall))return;
  pass.value='';confirm.value='';
  pass.type='password';confirm.type='password';renderPasswordEye();renderConfirmEye();
 };
 window.addEventListener('pageshow',wipeRestoredPasswords);
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