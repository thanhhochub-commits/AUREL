(function(){
 'use strict';
 if(window.AURELWelcome)return;
 const VIDEO_URL='https://aurel-media-resources.floot.app/_cdn/static/cc42e22a-1938-4b3e-bc03-b09f3b1c8607-aurel_welcome_final_no_gemini.mp4';
 let intro=null;
 function show(){
  // A welcome belongs to a newly completed login, not a reload restoring an active session.
  if(intro||document.getElementById('aurel-welcome-intro'))return;
  let closing=false,watchdog=null,playbackTimer=null;
  const layer=document.createElement('div');
  layer.id='aurel-welcome-intro';
  layer.setAttribute('role','dialog');
  layer.setAttribute('aria-label','Video chào mừng AUREL');
  layer.style.cssText='position:fixed;inset:0;z-index:2147483645;display:flex;align-items:center;justify-content:center;background:#071523;isolation:isolate;overflow:hidden;';
  const style=document.createElement('style');
  style.textContent='#aurel-welcome-intro video{position:absolute;inset:0;display:block;width:100%;height:100%;object-fit:cover;object-position:center center;background:#071523}#aurel-welcome-intro .aw-actions{position:absolute;bottom:max(22px,env(safe-area-inset-bottom));right:max(22px,env(safe-area-inset-right));display:flex;align-items:center;gap:10px;z-index:1}#aurel-welcome-intro button{appearance:none;border:1px solid rgba(220,236,252,.33);background:rgba(7,23,42,.78);color:#fff;padding:10px 15px;border-radius:10px;font:600 13px/1.4 Inter,system-ui,sans-serif;cursor:pointer;backdrop-filter:blur(9px);-webkit-backdrop-filter:blur(9px)}#aurel-welcome-intro button:hover,#aurel-welcome-intro button:focus-visible{background:rgba(30,64,100,.94);outline:2px solid transparent}#aurel-welcome-intro .aw-loading{position:absolute;left:24px;bottom:27px;color:rgba(232,241,251,.86);font:500 12px Inter,system-ui,sans-serif;letter-spacing:.015em}';
  const video=document.createElement('video');
  video.src=VIDEO_URL;
  video.preload='auto';
  video.playsInline=true;
  video.setAttribute('playsinline','');
  video.setAttribute('webkit-playsinline','');
  video.disablePictureInPicture=true;
  video.controls=false;
  video.muted=true;
  video.volume=0;
  const actions=document.createElement('div');actions.className='aw-actions';
  const skip=document.createElement('button');skip.type='button';skip.textContent='Bỏ qua';skip.setAttribute('aria-label','Bỏ qua video chào mừng');
  const loading=document.createElement('div');loading.className='aw-loading';loading.textContent='Đang chuẩn bị không gian AUREL…';
  actions.append(skip);layer.append(style,video,loading,actions);
  intro=layer;
  document.body.appendChild(layer);
  let started=false;
  function finish(){
   if(closing)return;closing=true;
   clearTimeout(watchdog);clearTimeout(playbackTimer);
   video.pause();video.removeAttribute('src');video.load();
   layer.remove();intro=null;
  }
  skip.addEventListener('click',finish);
  video.addEventListener('playing',()=>{
   if(started)return;started=true;
   loading.textContent='';
   playbackTimer=setTimeout(finish,11000);
  },{once:true});
  video.addEventListener('ended',finish,{once:true});
  video.addEventListener('error',finish,{once:true});
  // On a failed or very slow media load, do not leave the app behind a blocking cover.
  watchdog=setTimeout(finish,15000);
  function startPlayback(){
   if(closing)return;
   const result=video.play();
   if(result&&typeof result.catch==='function')result.catch(finish);
  }
  startPlayback();
 }
 window.AURELWelcome={show};
})();