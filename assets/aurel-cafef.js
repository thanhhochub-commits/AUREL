(function(){
'use strict';
if(window.__AUREL_CAFEF_OVERVIEW_V2__)return;
window.__AUREL_CAFEF_OVERVIEW_V2__=true;
var style=document.createElement('style');
style.id='aurel-cafef-overview-v2-style';
style.textContent="\n/* Chỉ áp dụng cho trang Tổng quan; không đụng đến trang khác. */\nbody.aurel-page-overview #root > .aurel-cafef-hero-row {\n  --cfh:clamp(430px,37.5vw,605px);\n  display:grid!important;grid-template-columns:minmax(0,2fr) minmax(0,1fr)!important;\n  align-items:stretch!important;gap:14px!important;margin:0 0 14px!important;\n  min-width:0!important;max-width:100%!important;\n}\nbody.aurel-page-overview #root > .aurel-cafef-hero-row > .ref-hero {\n  margin:0!important;min-width:0!important;width:100%!important;\n  height:var(--cfh)!important;min-height:var(--cfh)!important;max-height:var(--cfh)!important;\n  border-radius:14px!important;overflow:hidden!important;\n  box-shadow:0 0 0 1px rgba(37,149,255,.22),0 12px 28px rgba(0,29,65,.14);\n}\nbody.aurel-page-overview #root > .aurel-cafef-hero-row .ref-hero > .aurel-r78-slider-wrap{\n  height:100%!important;width:100%!important;\n}\nbody.aurel-page-overview #root > .aurel-cafef-hero-row .ref-hero-live-copy{\n  max-width:100%!important;\n}\nbody.aurel-page-overview #aurel-cafef-overview {\n  --cf-bg:#07192e;--cf-layer:#0b223c;--cf-line:#173e60;\n  --cf-line-soft:#1a344e;--cf-fg:#eaf5ff;--cf-muted:#a2b5cb;--cf-link:#36b7ff;\n  box-sizing:border-box;min-width:0;min-height:0;max-width:100%;\n  height:var(--cfh);margin:0!important;padding:13px 12px 10px!important;\n  display:flex;flex-direction:column;gap:9px;overflow:hidden;\n  border:1px solid #e13f72;border-radius:15px;\n  background:radial-gradient(ellipse 105% 52% at 9% 0%,rgba(117,26,75,.36),transparent 63%),\n             linear-gradient(165deg,#0c1529,#071a30 45%,#071b31);\n  color:var(--cf-fg);box-shadow:inset 0 0 22px rgba(17,73,134,.13),0 10px 28px rgba(6,17,43,.20);\n  font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif;\n  line-height:1.4;\n}\nbody.aurel-page-overview #aurel-cafef-overview * {box-sizing:border-box}\n#aurel-cafef-overview .cf-top{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;min-height:51px}\n#aurel-cafef-overview .cf-logo{font-size:27px;line-height:1;letter-spacing:-1.3px;font-weight:950;color:#ff3c50}\n#aurel-cafef-overview .cf-logo span{color:#197ff7}\n#aurel-cafef-overview .cf-subtitle{font-size:9px;font-weight:720;letter-spacing:.55px;color:#c9d8ec;margin:6px 0 0}\n#aurel-cafef-overview .cf-connection{align-self:flex-start;display:inline-flex;gap:6px;align-items:center;\n  font-size:9px;font-weight:750;max-width:130px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;\n  padding:7px 9px;background:#163144;border:1px solid #265368;border-radius:12px;color:#b3d5e0}\n#aurel-cafef-overview .cf-connection:before{content:\"\";width:7px;height:7px;flex-shrink:0;background:#f0ad4e;border-radius:50%}\n#aurel-cafef-overview .cf-connection.ok{color:#73efb8;border-color:#1d775c;background:#10382f}\n#aurel-cafef-overview .cf-connection.ok:before{background:#1bed97}\n#aurel-cafef-overview .cf-connection.busy:before{background:#4ac2ff;box-shadow:0 0 0 3px rgba(74,194,255,.14)}\n#aurel-cafef-overview .cf-search{display:grid;grid-template-columns:minmax(0,1fr) 108px;gap:8px}\n#aurel-cafef-overview .cf-search-field{display:flex;align-items:center;gap:7px;min-width:0;min-height:43px;\n  padding:0 11px;background:#0e2846;border:1px solid #36597e;border-radius:9px}\n#aurel-cafef-overview .cf-search-field svg{width:18px;height:18px;flex:0 0 auto;color:#79b9ff}\n#aurel-cafef-overview .cf-search-field input{border:0!important;box-shadow:none!important;background:transparent!important;\n  outline:0!important;color:#f8fbff!important;flex:1;min-width:0;width:100%;font-size:14px;\n  font-weight:750;text-transform:uppercase;padding:0!important;height:39px;letter-spacing:.35px}\n#aurel-cafef-overview .cf-search-field input::placeholder{color:#7994ab}\n#aurel-cafef-overview .cf-load{border:1px solid #2288ff;border-radius:9px;min-height:43px;padding:6px 5px;\n  background:linear-gradient(100deg,#159df7,#1261eb);color:#fff;cursor:pointer;font-size:11px;font-weight:850;\n  box-shadow:0 0 14px rgba(5,118,255,.24)}\n#aurel-cafef-overview .cf-load:disabled{opacity:.68;cursor:wait}\n#aurel-cafef-overview .cf-tabs{display:grid;grid-template-columns:1fr 1fr;gap:6px;min-height:41px}\n#aurel-cafef-overview .cf-tab{min-width:0;cursor:pointer;background:#0b1a30;color:#bdd0e7;\n  border:1px solid #2f628e;border-radius:9px;font-size:11px;font-weight:750;padding:7px 4px;white-space:nowrap}\n#aurel-cafef-overview .cf-tab[aria-selected=\"true\"]{background:linear-gradient(110deg,#008fe7,#135fef);color:white;\n  border-color:#00b8ff;box-shadow:0 0 0 1px rgba(0,190,255,.38),0 0 11px rgba(0,137,255,.26)}\n#aurel-cafef-overview button:focus-visible,#aurel-cafef-overview a:focus-visible,\n#aurel-cafef-overview input:focus-visible{outline:2px solid #57cbff!important;outline-offset:2px!important}\n#aurel-cafef-overview .cf-feed{flex:1;display:grid;grid-template-rows:minmax(0,1fr) minmax(0,1fr);\n  gap:8px;min-height:0;overflow:hidden}\n#aurel-cafef-overview .cf-feed[data-active=\"reports\"]{grid-template-rows:minmax(0,1.1fr) minmax(0,.9fr)}\n#aurel-cafef-overview .cf-feed[data-active=\"news\"]{grid-template-rows:minmax(0,.82fr) minmax(0,1.18fr)}\n#aurel-cafef-overview .cf-group{display:flex;flex-direction:column;min-height:0;min-width:0;overflow:hidden;\n  border:1px solid var(--cf-line);border-radius:10px;background:rgba(14,36,62,.80)}\n#aurel-cafef-overview .cf-group-head{flex:0 0 auto;min-height:32px;display:flex;justify-content:space-between;align-items:center;gap:4px;\n  padding:7px 9px;border-bottom:1px solid rgba(64,107,142,.25)}\n#aurel-cafef-overview .cf-group-head strong{font-size:10px;font-weight:850;color:#f0f7ff;line-height:1.2}\n#aurel-cafef-overview .cf-group-head a{font-size:10px;text-decoration:none;color:#24baff;white-space:nowrap;font-weight:750}\n#aurel-cafef-overview .cf-group-items{flex:1;min-height:0;overflow:auto;scrollbar-width:thin;scrollbar-color:#285477 transparent}\n#aurel-cafef-overview .cf-item{padding:7px 9px;display:grid;grid-template-columns:31px minmax(0,1fr) auto;\n  align-items:center;gap:7px;min-height:47px}\n#aurel-cafef-overview .cf-item + .cf-item{border-top:1px solid rgba(57,104,145,.26)}\n#aurel-cafef-overview .cf-icon{display:flex;align-items:center;justify-content:center;\n  width:29px;height:29px;border-radius:7px;background:#102f4e;color:#2adaff}\n#aurel-cafef-overview .cf-icon svg{width:19px;height:19px}\n#aurel-cafef-overview .cf-item a.cf-title{display:block;font-size:10.5px;font-weight:700;color:#f1f7ff;\n  text-decoration:none;line-height:1.35;max-width:100%;overflow:hidden;text-overflow:ellipsis;\n  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow-wrap:anywhere}\n#aurel-cafef-overview .cf-item a.cf-title:hover{color:#53caff}\n#aurel-cafef-overview .cf-item small{display:block;font-size:9px;color:#93a9c3;margin-top:3px}\n#aurel-cafef-overview .cf-item .cf-action{font-size:9px;font-weight:850;border:1px solid #277db5;\n  text-decoration:none;color:#48c4fb;padding:5px 6px;border-radius:6px;white-space:nowrap}\n#aurel-cafef-overview .cf-empty{padding:15px 10px;display:flex;flex-direction:column;gap:8px;\n  font-size:10.5px;line-height:1.5;color:#b2c5dc}\n#aurel-cafef-overview .cf-empty a{color:#52c7fd;text-decoration:none;font-weight:700}\n#aurel-cafef-overview .cf-footer{flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;\n  border-top:1px solid rgba(66,118,154,.22);padding:5px 2px 0;gap:8px;min-height:16px}\n#aurel-cafef-overview .cf-foot-copy{font-size:9px;color:#95a9c1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n#aurel-cafef-overview .cf-time{font-size:9px;color:#9fc4dd;white-space:nowrap}\n#aurel-cafef-overview .cf-error{font-size:9.5px;line-height:1.35;color:#ffc4a4;min-height:0;\n  max-height:24px;overflow:hidden}\n#aurel-cafef-overview .cf-error:empty{display:none}\n@media(min-width:1271px) and (max-width:1410px) {\n  body.aurel-page-overview #root > .aurel-cafef-hero-row{\n    grid-template-columns:minmax(0,2fr) minmax(0,1fr)!important\n  }\n  #aurel-cafef-overview .cf-logo{font-size:24px}\n}\n@media(max-width:1270px){\n  body.aurel-page-overview #root > .aurel-cafef-hero-row{display:flex!important;flex-direction:column;--cfh:clamp(340px,46vw,490px)}\n  body.aurel-page-overview #root > .aurel-cafef-hero-row > .ref-hero{flex:0 0 auto}\n  body.aurel-page-overview #aurel-cafef-overview{width:100%;height:auto;min-height:350px;max-height:none;padding:14px!important}\n  #aurel-cafef-overview .cf-feed{min-height:270px}\n}\n@media(max-width:760px){\n  body.aurel-page-overview #root > .aurel-cafef-hero-row{gap:11px!important;--cfh:clamp(260px,63vw,410px)}\n  body.aurel-page-overview #aurel-cafef-overview{padding:12px!important;gap:8px;min-height:360px}\n  #aurel-cafef-overview .cf-feed{min-height:290px}\n  #aurel-cafef-overview .cf-top{min-height:43px}\n  #aurel-cafef-overview .cf-search{grid-template-columns:minmax(0,1fr) 100px}\n}\n@media(prefers-reduced-motion:reduce) {\n  #aurel-cafef-overview *,#aurel-cafef-overview *:before{transition:none!important;animation:none!important}\n}\n/* Light mode chỉ thay màu của khối CafeF, không đổi các khối khác. */\nbody:not(.aurel-dark-theme).aurel-page-overview #aurel-cafef-overview{\n  --cf-layer:#f7fbff;--cf-line:#d5e4f1;--cf-fg:#18354d;--cf-muted:#587086;--cf-link:#006dae;\n  border-color:#6a9cbc;background:linear-gradient(165deg,#fff,#eef7ff);color:#18354d\n}\nbody:not(.aurel-dark-theme).aurel-page-overview #aurel-cafef-overview .cf-subtitle{color:#5b768e}\nbody:not(.aurel-dark-theme).aurel-page-overview #aurel-cafef-overview .cf-search-field{background:#f5faff;border-color:#a6c2da}\nbody:not(.aurel-dark-theme).aurel-page-overview #aurel-cafef-overview .cf-search-field input{color:#18354d!important}\nbody:not(.aurel-dark-theme).aurel-page-overview #aurel-cafef-overview .cf-group{background:#f5faff;border-color:#cfdfeb}\nbody:not(.aurel-dark-theme).aurel-page-overview #aurel-cafef-overview .cf-group-head strong,\nbody:not(.aurel-dark-theme).aurel-page-overview #aurel-cafef-overview .cf-item a.cf-title{color:#24465d}\nbody:not(.aurel-dark-theme).aurel-page-overview #aurel-cafef-overview .cf-tab{background:#f1f8ff;color:#32516c}\nbody:not(.aurel-dark-theme).aurel-page-overview #aurel-cafef-overview .cf-tab[aria-selected=true]{background:linear-gradient(110deg,#089ad9,#1374ea);color:#fff}\nbody:not(.aurel-dark-theme).aurel-page-overview #aurel-cafef-overview .cf-icon{background:#e2f3ff;color:#118acc}\nbody:not(.aurel-dark-theme).aurel-page-overview #aurel-cafef-overview .cf-item small,\nbody:not(.aurel-dark-theme).aurel-page-overview #aurel-cafef-overview .cf-footer,\nbody:not(.aurel-dark-theme).aurel-page-overview #aurel-cafef-overview .cf-foot-copy{color:#617b92}\nbody:not(.aurel-dark-theme).aurel-page-overview #aurel-cafef-overview .cf-empty{color:#587086}\nbody:not(.aurel-dark-theme).aurel-page-overview #aurel-cafef-overview .cf-error{color:#a04323}\n\n\n/* CafeF v7: independent tabs, wider single-pane list, drag the actual hero image. */\n#aurel-cafef-overview .cf-feed{\n  grid-template-rows:minmax(0,1fr)!important;\n  gap:0!important;\n  overflow:hidden!important;\n}\n#aurel-cafef-overview .cf-feed .cf-group{\n  height:100%!important;\n  min-height:0!important;\n  border-radius:11px!important;\n}\n#aurel-cafef-overview .cf-feed .cf-group[hidden]{display:none!important}\n#aurel-cafef-overview .cf-feed .cf-group-items{\n  overflow-x:hidden!important;\n  overflow-y:auto!important;\n  scrollbar-gutter:stable;\n  overscroll-behavior:contain;\n}\n#aurel-cafef-overview .cf-feed .cf-item{\n  padding:10px 10px!important;\n  min-height:59px!important;\n  grid-template-columns:32px minmax(0,1fr) auto!important;\n  gap:10px!important;\n}\n#aurel-cafef-overview .cf-feed .cf-item a.cf-title{\n  font-size:12px!important;\n  -webkit-line-clamp:2!important;\n  line-height:1.5!important;\n}\n#aurel-cafef-overview .cf-feed .cf-item .cf-icon{width:32px!important;height:32px!important}\n#aurel-cafef-overview .cf-feed .cf-item .cf-action{padding:6px 9px!important}\n#aurel-cafef-overview .cf-feed .cf-item small{font-size:10px!important}\n#aurel-cafef-overview .cf-feed .cf-group-head{padding:11px 12px!important}\n#aurel-cafef-overview .cf-feed .cf-group-head strong{font-size:11px!important}\n#aurel-cafef-overview .cf-tabs{margin-bottom:1px}\n#aurel-cafef-overview .cf-empty{\n  padding:19px!important;min-height:145px;justify-content:center;\n  background:radial-gradient(circle at top right,rgba(33,149,240,.08),transparent 58%);\n}\n@media(min-width:1271px){\n  body.aurel-page-overview #root > .aurel-cafef-hero-row{\n    --cf-panel-default:calc((100% - 14px) * .39);\n    --cf-panel-width:var(--cf-panel-default);\n    position:relative!important;\n    grid-template-columns:minmax(0,1fr) minmax(0,var(--cf-panel-width))!important;\n    transition:grid-template-columns .36s cubic-bezier(.22,.65,.3,1),gap .36s ease;\n  }\n  body.aurel-page-overview #root > .aurel-cafef-hero-row[data-cf-closed=\"true\"]{\n    --cf-panel-width:0px;\n    grid-template-columns:minmax(0,1fr) 0px!important;\n    gap:0!important;\n  }\n  body.aurel-page-overview #root > .aurel-cafef-hero-row[data-cf-closed=\"true\"] > #aurel-cafef-overview{\n    width:0!important;min-width:0!important;max-width:0!important;\n    padding:0!important;border:0!important;\n    opacity:0!important;visibility:hidden!important;pointer-events:none!important;\n  }\n  body.aurel-page-overview #root > .aurel-cafef-hero-row > #aurel-cafef-overview{\n    opacity:1;min-width:0!important;transition:opacity .22s ease;\n  }\n  body.aurel-page-overview #root > .aurel-cafef-hero-row.cf-dragging{\n    transition:none!important;user-select:none!important;\n  }\n  body.aurel-page-overview #root > .aurel-cafef-hero-row.cf-dragging > #aurel-cafef-overview{\n    transition:none!important;\n  }\n  body.aurel-page-overview #root > .aurel-cafef-hero-row > .ref-hero{\n    cursor:grab!important;\n    touch-action:pan-y;\n  }\n  body.aurel-page-overview #root > .aurel-cafef-hero-row.cf-dragging > .ref-hero{\n    cursor:grabbing!important;\n  }\n  /* The existing slideshow remains a real image, resized proportionally.\n     No scaleX or forced image aspect ratio; crop neatly rather than stretch. */\n  body.aurel-page-overview #root > .aurel-cafef-hero-row > .ref-hero > .aurel-r78-slider-wrap {\n    inset:0!important;\n    width:100%!important;\n    height:100%!important;\n    overflow:hidden!important;\n  }\n  /* Proportional full-bleed: fill the frame while keeping intrinsic image ratio.\n     Retain existing slideshow translate3d; do not scaleX or stretch pixels. */\n  body.aurel-page-overview #root > .aurel-cafef-hero-row > .ref-hero {\n    background-color:#0a2946!important;\n  }\n  body.aurel-page-overview #root > .aurel-cafef-hero-row > .ref-hero > .aurel-r78-slider-wrap {\n    isolation:isolate!important;\n    background:#102c4e!important;\n  }\n  /* Duplicate the active real slideshow frame as a soft backdrop for any\n     unused letterbox space. The original frame remains fully visible and unwarped. */\n  body.aurel-page-overview #root > .aurel-cafef-hero-row > .ref-hero > .aurel-r78-slider-wrap::before {\n    content:\"\"!important;\n    position:absolute!important;\n    inset:-22px!important;\n    display:block!important;\n    background-image:var(--cf-slide-background, linear-gradient(115deg,#225b86,#082743))!important;\n    background-size:cover!important;\n    background-position:center center!important;\n    background-repeat:no-repeat!important;\n    filter:blur(18px) brightness(.83) saturate(.95)!important;\n    transform:scale(1.05)!important;\n    opacity:.92!important;\n    pointer-events:none!important;\n    z-index:0!important;\n  }\n  body.aurel-page-overview #root > .aurel-cafef-hero-row > .ref-hero > .aurel-r78-slider-wrap > .aurel-r78-slider-img {\n    display:block!important;\n    width:100%!important;\n    height:100%!important;\n    min-width:0!important;\n    min-height:0!important;\n    max-width:none!important;\n    max-height:none!important;\n    /* Cover every pixel in both open/closed CafeF sizes without nonuniform scaling.\n       Cropping at frame edges is deliberate; original image pixels stay proportional. */\n    object-fit:cover!important;\n    object-position:center center!important;\n    aspect-ratio:auto!important;\n    /* Override legacy R121-R124 per-image scales (e.g. 0.96 x 1.10)\n       which made four hero slides visibly squeezed and leaked the next image. */\n    scale:1 1!important;\n    left:0!important;\n    top:0!important;\n    right:auto!important;\n    bottom:auto!important;\n    transform-origin:center center!important;\n    position:absolute!important;\n    z-index:1!important;\n    /* Do not override transform: the original slider uses translate3d. */\n  }\n  body.aurel-page-overview #root > .aurel-cafef-hero-row {\n    margin-bottom:3px!important;\n  }\n  /* The caption lives OUTSIDE the slider and outside the grid row.\n     This avoids clipping, stacking contexts and missing text at the bottom. */\n  /* Compact right-aligned caption, OUTSIDE the image frame. */\n  body.aurel-page-overview #root > .aurel-cafef-hero-row + .cf-swipe-hint {\n    position:relative!important;\n    display:flex!important;\n    align-items:center!important;\n    justify-content:flex-end!important;\n    min-height:27px!important;\n    width:calc(100% - ((100% - 14px) * .39) - 14px)!important;\n    max-width:100%!important;\n    margin:5px 0 10px!important;\n    padding:4px 12px 4px 13px!important;\n    z-index:2!important;\n    visibility:visible!important;\n    opacity:1!important;\n    color:#3f6789!important;\n    background:linear-gradient(90deg,rgba(21,153,235,.105),rgba(21,153,235,0) 85%)!important;\n    border:0!important;\n    border-left:3px solid #168edd!important;\n    border-radius:7px!important;\n    box-shadow:none!important;\n    font-family:Inter,ui-sans-serif,Arial,sans-serif!important;\n    font-size:11px!important;\n    line-height:1.4!important;\n    font-weight:650!important;\n    letter-spacing:.08px!important;\n    text-align:right!important;\n    white-space:normal!important;\n    pointer-events:none!important;\n    user-select:none!important;\n  }\n  body.aurel-page-overview #root > .aurel-cafef-hero-row[data-cf-closed=\"true\"] + .cf-swipe-hint {\n    width:100%!important;\n  }\n  body.aurel-dark-theme.aurel-page-overview #root > .aurel-cafef-hero-row + .cf-swipe-hint {\n    color:#bddaf0!important;\n    background:linear-gradient(90deg,rgba(25,166,255,.17),rgba(25,166,255,0) 85%)!important;\n    border-left-color:#32c0f9!important;\n  }\n  body.aurel-page-overview #root > .aurel-cafef-hero-row > .ref-hero:focus-visible{\n    outline:3px solid #23baff!important;outline-offset:2px!important;\n  }\n}\n@media(max-width:1270px){\n  body.aurel-page-overview #root > .aurel-cafef-hero-row + .cf-swipe-hint{display:none!important}\n}\n@media(max-width:760px){\n  #aurel-cafef-overview .cf-feed .cf-item{padding:8px 9px!important;min-height:52px!important}\n  #aurel-cafef-overview .cf-feed .cf-item a.cf-title{font-size:11px!important}\n}\n@media(prefers-reduced-motion:reduce){\n  body.aurel-page-overview #root > .aurel-cafef-hero-row,\n  body.aurel-page-overview #root > .aurel-cafef-hero-row > #aurel-cafef-overview{\n    transition:none!important\n  }\n}\n";
document.head.appendChild(style);

var cache=new Map(),active='reports',running=null,queued=false;
var docIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><path d="M6 2.8h7l5 5V21H6z"/><path d="M13 2.8v5h5"/><path d="M9 13h6M9 16h6"/></svg>';
var newsIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h4M13 12h4M7 16h10"/></svg>';
var searchIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg>';
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]})}
function symbolOk(t){return /^[A-Z0-9]{2,6}$/.test(t)}
function bankSymbol(){var sel=document.getElementById('bank-select');var b=sel?String(sel.value||'').toUpperCase().trim():'';return symbolOk(b)?b:''}
function safeUrl(u){
  try{var a=new URL(String(u));return a.protocol==='https:'&&/(^|\.)cafef\.vn$/i.test(a.hostname)?a.href:''}
  catch(e){return ''}
}
function links(symbol){
 var x=encodeURIComponent(symbol.toLowerCase());
 return {financial:'https://cafef.vn/du-lieu/'+x+'/bao-cao-tai-chinh.chn',
         company:'https://cafef.vn/du-lieu/'+x+'/thong-tin-chung.chn',
         disclosures:'https://cafef.vn/du-lieu/tin-doanh-nghiep/'+x+'/event.chn'};
}
function shortDate(d){
 if(!d)return '';var x=new Date(d);return Number.isNaN(x.getTime())?'':x.toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'});
}
function srcLink(href,label,cls){href=safeUrl(href);return href?'<a class="'+(cls||'cf-action')+'" href="'+esc(href)+'" target="_blank" rel="noopener noreferrer">'+esc(label)+'</a>':''}
function getData(symbol){var got=cache.get(symbol);return got&&Date.now()-got.at<600000?got.data:null}
function status(kind,msg){
 var bar=document.querySelector('#aurel-cafef-overview .cf-connection');
 if(!bar)return;
 bar.className='cf-connection'+(kind?' '+kind:'');bar.textContent=msg;
}
function dateOfLoad(data){return data&&data.retrieved_at?shortDate(data.retrieved_at):''}
function updateFooter(data){
 var e=document.querySelector('#aurel-cafef-overview .cf-time');
 if(e)e.textContent=data&&data.retrieved_at?'Tải: '+dateOfLoad(data):'Chưa cập nhật';
}
function getItems(data,key){
 var rows=data&&Array.isArray(data[key])?data[key].filter(function(x){return !!safeUrl(x.url)&&!!x.title}):[];
 if(key==='reports'){
  rows=rows.slice().sort(function(a,b){
   function period(x){
    var d=Date.parse(x.period_end||x.date||'');
    return Number.isFinite(d)?d:0;
   }
   var gap=period(b)-period(a);
   if(gap)return gap;
   /* Same period: show annual BCTC before that year's Q4 data. */
   return Number(b.type==='bctc_data'&&/BCTC năm/.test(b.title))-Number(a.type==='bctc_data'&&/BCTC năm/.test(a.title));
  });
 }
 return rows.slice(0,25);
}
function drawItems(items,limit,type,symbol){
 if(!items.length){
  return '<div class="cf-empty">'+
   (type==='reports'?'Chưa nhận được danh sách BCTC có liên kết xác thực từ CAFEF.':'Chưa nhận được tin doanh nghiệp trực tiếp từ CAFEF.')+
   srcLink(type==='reports'?links(symbol).financial:links(symbol).disclosures,'Mở trang nguồn CAFEF ↗','cf-title')+
   '</div>';
 }
 var shown=items.slice(0,limit);
 return shown.map(function(item){
  var date=shortDate(item.date||'');
  var isPdf=/\.pdf(?:$|[?#])/i.test(item.url);
  return '<div class="cf-item"><span class="cf-icon">'+(type==='reports'?docIcon:newsIcon)+'</span>'+
  '<span style="min-width:0">'+srcLink(item.url,item.title,'cf-title')+
   '<small>'+esc(date||item.source||'Theo CAFEF')+'</small></span>'+
  srcLink(item.url,isPdf?'PDF ↗':'Xem ↗','cf-action')+'</div>';
 }).join('');
}
function updateLists(data){
 var pane=document.getElementById('aurel-cafef-overview');
 if(!pane)return;
 var sym=String(pane.dataset.symbol||'').toUpperCase(),p=links(sym);
 var reports=getItems(data,'reports');
 var news=getItems(data,'disclosures').filter(function(x){return x.type!=='bctc'});
 var market=getItems(data,'market_news');
 /* Public market RSS is NOT symbol-specific. Clearly label it if used. */
 var mainNews=news.length?news:market;
 var isGeneral=!news.length&&market.length>0;
 var reportTitle=document.getElementById('cf-report-head');
 var newsTitle=document.getElementById('cf-news-head');
 var rlinks=document.getElementById('cf-reports-link');
 var nlinks=document.getElementById('cf-news-link');
 if(reportTitle)reportTitle.textContent='BCTC MỚI NHẤT → CŨ NHẤT'+(reports.length?' ('+reports.length+')':'');
 if(newsTitle)newsTitle.textContent=isGeneral?'TIN THỊ TRƯỜNG CAFEF':'TIN TỨC & CÔNG BỐ';
 if(rlinks)rlinks.href=p.financial;
 if(nlinks)nlinks.href=isGeneral?'https://cafef.vn/thi-truong-chung-khoan.chn':p.disclosures;
 var left=document.getElementById('cf-report-items'),right=document.getElementById('cf-news-items');
 if(left)left.innerHTML=drawItems(reports,25,'reports',sym);
 if(right)right.innerHTML=drawItems(mainNews,25,'news',sym);
 updateFooter(data);
 var msg=document.getElementById('cf-errors');
 if(msg)msg.textContent=data&&Array.isArray(data.messages)&&data.messages.length?data.messages.join(' · '):'';
 var feed=pane.querySelector('.cf-feed');
 if(feed)feed.setAttribute('data-active',active);
 pane.querySelectorAll('.cf-group[data-view]').forEach(function(group){
   var visible=group.dataset.view===active;
   group.hidden=!visible;
   group.setAttribute('aria-hidden',visible?'false':'true');
   if(visible)group.removeAttribute('inert');
   else group.setAttribute('inert','');
 });
 pane.querySelectorAll('.cf-tab').forEach(function(tab){
   var selected=tab.dataset.tab===active;
   tab.setAttribute('aria-selected',selected?'true':'false');
   tab.tabIndex=selected?0:-1;
 });
}
function apiBase(){
 var q='';try{q=new URLSearchParams(location.search).get('api')||''}catch(e){}
 var v='';try{v=localStorage.getItem('aurel_api_base')||''}catch(e){}
 try{
  var u=new URL(q||v||'https://aurel-thanhhochub-backend.onrender.com/');
  if(!/^https?:$/.test(u.protocol))return '';
  u.search='';u.hash='';u.pathname=u.pathname.replace(/\/+$/,'')+'/';return u.toString();
 }catch(e){return ''}
}
function prepare(symbol,data){
 var card=document.getElementById('aurel-cafef-overview');
 if(!card||card.dataset.symbol!==symbol)return;
 updateLists(data);
 if(data){
  var news=getItems(data,'disclosures'),rep=getItems(data,'reports'),market=getItems(data,'market_news');
  if(rep.length||news.length||market.length)status('ok','Đã tải dữ liệu');
  else status('','Nguồn tạm thiếu');
 }else status('','Chưa kết nối');
}

var sharedSnapshot=null,sharedSnapshotPromise=null;
async function readStaticSnapshot(){
 if(sharedSnapshot)return sharedSnapshot;
 if(sharedSnapshotPromise)return sharedSnapshotPromise;
 sharedSnapshotPromise=(async function(){
   var url='https://raw.githubusercontent.com/thanhhochub-commits/AUREL/main/assets/cafef-cache.json';
   var ctrl=new AbortController();
   var timer=setTimeout(function(){ctrl.abort()},13000);
   try{
     var res=await fetch(url+'?t='+Math.floor(Date.now()/300000),{method:'GET',cache:'no-store',signal:ctrl.signal});
     if(!res.ok)throw new Error('GitHub cache HTTP '+res.status);
     var obj=await res.json();
     if(!obj||obj.source!=='CafeF'||!obj.symbols||typeof obj.symbols!=='object')throw new Error('Invalid cache schema');
     sharedSnapshot=obj;
     return obj;
   }finally{clearTimeout(timer)}
 })();
 try{return await sharedSnapshotPromise}
 finally{sharedSnapshotPromise=null}
}
async function loadFromStatic(symbol){
 var obj=await readStaticSnapshot();
 var data=obj.symbols[symbol];
 if(!data||data.symbol!==symbol||!['ok','source_unavailable'].includes(data.status))throw new Error('Không có nguồn dự phòng cho '+symbol);
 if(!getItems(data,'reports').length&&!getItems(data,'disclosures').length&&!getItems(data,'market_news').length)throw new Error('Nguồn lưu chưa có tin đã xác minh');
 return data;
}
async function load(symbol,auto){
 if(!symbolOk(symbol))return;
 var card=document.getElementById('aurel-cafef-overview');if(!card)return;
 var same=getData(symbol);
 if(same&&auto){prepare(symbol,same);return}
 if(running){running.abort();running=null}
 var ctrl=new AbortController();running=ctrl;
 var button=document.getElementById('aurel-cafef-load');
 if(button)button.disabled=true;
 status('busy','Đang lấy nguồn');
 var timer=setTimeout(function(){ctrl.abort()},6500);
 var failure='';
 try{
   var base=apiBase();if(!base)throw new Error('Đường dẫn backend không hợp lệ');
   var url=new URL('api/cafef',base);url.searchParams.set('symbol',symbol);
   var res=await fetch(url.toString(),{method:'GET',cache:'no-store',signal:ctrl.signal});
   if(!res.ok)throw new Error('Render trả HTTP '+res.status);
   var data=await res.json();
   if(!data||data.symbol!==symbol)throw new Error('Dữ liệu nguồn không khớp');
   if(!getItems(data,'reports').length&&!getItems(data,'disclosures').length&&!getItems(data,'market_news').length)throw new Error('Render chưa trả danh sách CAFEF hợp lệ');
   if(running===ctrl){
     cache.set(symbol,{at:Date.now(),data:data});prepare(symbol,data);
     running=null;var successButton=document.getElementById('aurel-cafef-load');if(successButton)successButton.disabled=false;
   }
   return;
 }catch(e){failure=ctrl.signal.aborted?'Render quá thời gian phản hồi':(e&&e.message?e.message:'Render không phản hồi')}
 finally{clearTimeout(timer)}
 try{
   if(running!==ctrl)return;
   status('busy','Đang tải dự phòng');
   var fallback=await loadFromStatic(symbol);
   if(running!==ctrl)return;
   cache.set(symbol,{at:Date.now(),data:fallback});
   prepare(symbol,fallback);
   status('ok','Nguồn dự phòng');
   var info=document.getElementById('cf-errors');
   if(info)info.textContent='Đang hiển thị dữ liệu công khai CAFEF được lưu trên GitHub. '+failure+'.';
 }catch(err){
   if(running!==ctrl)return;
   prepare(symbol,null);status('','Chưa có dữ liệu');
   var hint=document.getElementById('cf-errors');
   if(hint)hint.textContent='Không lấy được dữ liệu tự động ('+failure+'). Nguồn dự phòng: '+(err&&err.message||'chưa cập nhật')+'. Mở trực tiếp CAFEF bằng các nút “Xem tất cả”.';
 }finally{
   if(running===ctrl){
     running=null;var btn=document.getElementById('aurel-cafef-load');if(btn)btn.disabled=false;
   }
 }
}
function refreshSymbol(symbol,fetchNow){
 var card=document.getElementById('aurel-cafef-overview');
 if(!card||!symbolOk(symbol))return;
 card.dataset.symbol=symbol;
 var input=document.getElementById('aurel-cafef-symbol');if(input)input.value=symbol;
 prepare(symbol,getData(symbol));
 if(fetchNow)load(symbol,true);
}
function makeCard(symbol){
 var card=document.createElement('aside');
 card.id='aurel-cafef-overview';
 card.setAttribute('aria-label','Tra cứu CAFEF BCTC và tin tức');
 card.dataset.symbol=symbol;
 card.innerHTML=
 '<div class="cf-top"><div><div class="cf-logo">CAFE<span>F</span></div>'+
 '<div class="cf-subtitle">KẾT NỐI DỮ LIỆU BCTC &amp; TIN TỨC</div></div>'+
 '<span class="cf-connection" role="status" aria-live="polite">Chưa kết nối</span></div>'+
 '<div class="cf-search"><label class="cf-search-field" title="Mã chứng khoán">'+searchIcon+
 '<input id="aurel-cafef-symbol" type="text" aria-label="Nhập mã cổ phiếu CAFEF" maxlength="6" autocomplete="off" spellcheck="false" value="'+esc(symbol)+'" placeholder="Mã cổ phiếu"></label>'+
 '<button id="aurel-cafef-load" class="cf-load" type="button">Lấy dữ liệu</button></div>'+
 '<div class="cf-tabs" role="tablist" aria-label="Loại dữ liệu CAFEF">'+
 '<button type="button" class="cf-tab" role="tab" data-tab="reports" aria-controls="cf-report-panel" aria-selected="true">Báo cáo tài chính</button>'+
 '<button type="button" class="cf-tab" role="tab" data-tab="news" aria-controls="cf-news-panel" aria-selected="false" tabindex="-1">Tin doanh nghiệp</button></div>'+
 '<div class="cf-feed" data-active="reports">'+
 '<section class="cf-group" data-view="reports" aria-label="Báo cáo tài chính" id="cf-report-panel" role="tabpanel">'+
 '<div class="cf-group-head"><strong id="cf-report-head">BÁO CÁO TÀI CHÍNH MỚI NHẤT</strong>'+
 '<a id="cf-reports-link" href="'+esc(links(symbol).financial)+'" target="_blank" rel="noopener noreferrer">Xem tất cả →</a></div>'+
 '<div class="cf-group-items" id="cf-report-items"></div></section>'+
 '<section class="cf-group" data-view="news" aria-label="Tin tức doanh nghiệp" id="cf-news-panel" role="tabpanel" hidden>'+
 '<div class="cf-group-head"><strong id="cf-news-head">TIN TỨC &amp; CÔNG BỐ</strong>'+
 '<a id="cf-news-link" href="'+esc(links(symbol).disclosures)+'" target="_blank" rel="noopener noreferrer">Xem tất cả →</a></div>'+
 '<div class="cf-group-items" id="cf-news-items"></div></section></div>'+
 '<div id="cf-errors" class="cf-error" aria-live="polite"></div>'+
 '<div class="cf-footer"><span class="cf-foot-copy">Nguồn công khai · CAFEF · Không tự ghi đè số liệu AUREL</span>'+
 '<span id="cf-time" class="cf-time">Chưa cập nhật</span></div>';
 return card;
}

/* Drag directly on the Overview hero. No overlay button or grab handle. */
var CF_PANEL_KEY='aurel-cafef-panel-hidden-v1';
var cfPanelHidden=false;
try{cfPanelHidden=localStorage.getItem(CF_PANEL_KEY)==='1'}catch(e){}
function cfDesktop(){return window.matchMedia&&window.matchMedia('(min-width:1271px)').matches}
function cfSetPanel(row,hidden,persist){
 if(!row)return;
 cfPanelHidden=!!hidden;
 row.dataset.cfClosed=hidden?'true':'false';
 row.style.removeProperty('--cf-panel-width');
 var card=row.querySelector('#aurel-cafef-overview');
 if(card){
   if(cfDesktop()&&hidden)card.setAttribute('inert','');
   else card.removeAttribute('inert');
   card.setAttribute('aria-hidden',cfDesktop()&&hidden?'true':'false');
 }
 var hint=row.nextElementSibling;
 if(hint&&hint.classList.contains('cf-swipe-hint')){
   var brand='<span style="color:#ff3c50">CAFE</span><span style="color:#197ff7">F</span>';
   hint.innerHTML=hidden?'<span>← Kéo sang trái để mở '+brand+'</span>':'<span>Kéo sang phải để ẩn '+brand+' →</span>';
 }
 var hero=row.querySelector('.ref-hero');
 if(hero){
   hero.setAttribute('aria-label',hidden?'Tổng quan tài chính. Kéo sang trái hoặc nhấn mũi tên trái để mở CAFEF.':'Tổng quan tài chính. Kéo sang phải hoặc nhấn mũi tên phải để ẩn CAFEF.');
 }
 if(persist)try{localStorage.setItem(CF_PANEL_KEY,hidden?'1':'0')}catch(e){}
}
/* Keep the blurred backdrop synchronized with the *active* R78 slideshow image.
   The actual two-image slideshow stays untouched, including transition timing. */
function cfBindSlideBackdrop(hero){
 if(!hero)return;
 var wrap=hero.querySelector(':scope > .aurel-r78-slider-wrap');
 if(!wrap||wrap.dataset.cfBackdropBound==='1')return;
 var slides=Array.prototype.slice.call(wrap.querySelectorAll(':scope > .aurel-r78-slider-img'));
 if(!slides.length)return;
 wrap.dataset.cfBackdropBound='1';
 var last='';
 function sync(){
  if(!wrap.isConnected)return;
  var current=slides.find(function(img){
    return (img.style.transform||'').replace(/\s/g,'').indexOf('translate3d(0,0,0)')>=0;
  })||slides[0];
  var url=current&&current.src;
  if(!url||url===last)return;
  try{
   var u=new URL(url,location.href);
   if(u.protocol!=='https:'&&u.protocol!=='http:')return;
   last=url;
   wrap.style.setProperty('--cf-slide-background','url('+JSON.stringify(u.href)+')');
  }catch(e){}
 }
 var observer=new MutationObserver(sync);
 slides.forEach(function(img){observer.observe(img,{attributes:true,attributeFilter:['src','style']})});
 sync();
}
function cfInstallHeroSwipe(row){
 if(!row)return;
 var hero=row.querySelector('.ref-hero');
 if(!hero)return;
 cfBindSlideBackdrop(hero);
 if(hero.dataset.cfHeroSwipeReady==='1')return;
 hero.dataset.cfHeroSwipeReady='1';
 hero.tabIndex=0;
 var hint=row.nextElementSibling;
 if(!hint||!hint.classList.contains('cf-swipe-hint')){
   hint=document.createElement('p');
   hint.className='cf-swipe-hint';
   hint.setAttribute('aria-hidden','true');
   row.insertAdjacentElement('afterend',hint);
 }
 cfSetPanel(row,cfPanelHidden,false);
 hero.addEventListener('dragstart',function(e){if(cfDesktop())e.preventDefault()});
 hero.addEventListener('keydown',function(e){
   if(!cfDesktop()||e.target!==hero)return;
   if(e.key==='ArrowLeft'||e.key==='Home'){e.preventDefault();cfSetPanel(row,false,true)}
   else if(e.key==='ArrowRight'||e.key==='End'){e.preventDefault();cfSetPanel(row,true,true)}
 });
 var gesture=null;
 hero.addEventListener('pointerdown',function(e){
   if(!cfDesktop()||e.button!==0||!e.isPrimary)return;
   if(e.target.closest&&e.target.closest('a,button,input,select,textarea,[role="button"]'))return;
   var maxWidth=Math.max(0,(row.getBoundingClientRect().width-14)*.39);
   if(!maxWidth)return;
   var oldHidden=cfPanelHidden;
   var startWidth=oldHidden?0:Math.max(0,row.querySelector('#aurel-cafef-overview').getBoundingClientRect().width);
   gesture={id:e.pointerId,x:e.clientX,y:e.clientY,startWidth:startWidth,maxWidth:maxWidth,wasHidden:oldHidden,moving:false};
   try{hero.setPointerCapture(e.pointerId)}catch(err){}
 });
 hero.addEventListener('pointermove',function(e){
   if(!gesture||gesture.id!==e.pointerId)return;
   var dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;
   if(!gesture.moving){
     if(Math.abs(dx)<9||Math.abs(dx)<Math.abs(dy)*1.1)return;
     gesture.moving=true;
     row.classList.add('cf-dragging');
     row.dataset.cfClosed='false';
     var card=row.querySelector('#aurel-cafef-overview');
     if(card){card.removeAttribute('inert');card.setAttribute('aria-hidden','false')}
   }
   if(e.cancelable)e.preventDefault();
   var newWidth=Math.max(0,Math.min(gesture.maxWidth,gesture.startWidth-dx));
   row.style.setProperty('--cf-panel-width',newWidth+'px');
 });
 function endDrag(e,cancelled){
   if(!gesture||gesture.id!==e.pointerId)return;
   var g=gesture;
   gesture=null;
   row.classList.remove('cf-dragging');
   try{if(hero.hasPointerCapture(e.pointerId))hero.releasePointerCapture(e.pointerId)}catch(err){}
   if(cancelled||!g.moving){cfSetPanel(row,g.wasHidden,false);return}
   var dx=e.clientX-g.x;
   var intended=g.wasHidden?dx<=-65:dx>=65;
   cfSetPanel(row,intended?!g.wasHidden:g.wasHidden,intended);
 }
 hero.addEventListener('pointerup',function(e){endDrag(e,false)});
 hero.addEventListener('pointercancel',function(e){endDrag(e,true)});
 hero.addEventListener('lostpointercapture',function(e){if(gesture)endDrag(e,true)});
}
window.addEventListener('resize',function(){
 var row=document.querySelector('#root > .aurel-cafef-hero-row');
 if(row)cfSetPanel(row,cfPanelHidden,false);
},{passive:true});
function inject(){
 var root=document.getElementById('root');
 if(!root||!document.body.classList.contains('aurel-page-overview'))return;
 var nav=document.querySelector('#nav button[data-page="overview"]');
 if(nav&&!nav.classList.contains('active'))return;
 var hero=root.querySelector(':scope > .ref-hero');
 var previous=root.querySelector(':scope > .aurel-cafef-hero-row');
 if(previous){
  cfInstallHeroSwipe(previous);
  var card=previous.querySelector('#aurel-cafef-overview');
  var symbol=bankSymbol();
  if(card&&symbol&&card.dataset.symbol!==symbol)refreshSymbol(symbol,true);
  return;
 }
 if(!hero)return;
 var symbol=bankSymbol()||'VPB';
 var row=document.createElement('div');row.className='aurel-cafef-hero-row';
 var card=makeCard(symbol);
 root.insertBefore(row,hero);
 row.appendChild(hero);
 row.appendChild(card);
 cfInstallHeroSwipe(row);
 prepare(symbol,getData(symbol));
 load(symbol,true);
}
function schedule(){
 if(queued)return;queued=true;
 requestAnimationFrame(function(){queued=false;inject()});
}
document.addEventListener('click',function(e){
 var b=e.target&&e.target.closest?e.target.closest('#aurel-cafef-load'):null;
 if(b){
  var i=document.getElementById('aurel-cafef-symbol');
  var sym=i?String(i.value||'').trim().toUpperCase():'';
  var hint=document.getElementById('cf-errors');
  if(!symbolOk(sym)){if(hint)hint.textContent='Mã chứng khoán cần gồm 2–6 ký tự chữ hoặc số.';return}
  if(hint)hint.textContent='';
  refreshSymbol(sym,false);load(sym,false);return;
 }
 var tab=e.target&&e.target.closest?e.target.closest('#aurel-cafef-overview .cf-tab'):null;
 if(tab){
  active=tab.dataset.tab==='news'?'news':'reports';
  var pane=document.getElementById('aurel-cafef-overview');
  if(pane)updateLists(getData(pane.dataset.symbol));
 }
});
document.addEventListener('keydown',function(e){
 var tab=e.target&&e.target.closest?e.target.closest('#aurel-cafef-overview .cf-tab'):null;
 if(tab&&(e.key==='ArrowLeft'||e.key==='ArrowRight')){
   e.preventDefault();
   var next=tab.dataset.tab==='reports'?'news':'reports';
   var dest=document.querySelector('#aurel-cafef-overview .cf-tab[data-tab="'+next+'"]');
   if(dest){dest.click();dest.focus()}
   return;
 }
 if(e.key==='Enter'&&e.target&&e.target.id==='aurel-cafef-symbol'){
  e.preventDefault();var btn=document.getElementById('aurel-cafef-load');if(btn)btn.click()
 }
});
document.addEventListener('change',function(e){
 if(e.target&&e.target.id==='bank-select'){
  var sym=bankSymbol();if(sym)refreshSymbol(sym,true);
 }
},true);
function boot(){
 var root=document.getElementById('root');
 if(root)new MutationObserver(schedule).observe(root,{childList:true});
 document.addEventListener('aurel:dom-render',schedule);
 document.addEventListener('click',function(e){
  if(e.target&&e.target.closest&&e.target.closest('#nav button[data-page]'))schedule();
 },true);
 window.addEventListener('pageshow',schedule,{passive:true});
 schedule();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();