(function(){
 'use strict';
 if(window.AURELWelcome)return;
 const VIDEO_URL='https://aurel-assets-20260929.floot.app/_cdn/static/ed8194a5-c0d2-4a25-98df-66a811253c8c-aurel_welcome_20261017_web_v1.mp4';
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
  style.textContent='#aurel-welcome-intro video{display:block;width:100%;height:100%;object-fit:contain;background:#071523}#aurel-welcome-intro .aw-actions{position:absolute;bottom:max(22px,env(safe-area-inset-bottom));right:max(22px,env(safe-area-inset-right));display:flex;align-items:center;gap:10px;z-index:1}#aurel-welcome-intro button{appearance:none;border:1px solid rgba(220,236,252,.33);background:rgba(7,23,42,.78);color:#fff;padding:10px 15px;border-radius:10px;font:600 13px/1.4 Inter,system-ui,sans-serif;cursor:pointer;backdrop-filter:blur(9px);-webkit-backdrop-filter:blur(9px)}#aurel-welcome-intro button:hover,#aurel-welcome-intro button:focus-visible{background:rgba(30,64,100,.94);outline:2px solid transparent}#aurel-welcome-intro .aw-loading{position:absolute;left:24px;bottom:27px;color:rgba(232,241,251,.86);font:500 12px Inter,system-ui,sans-serif;letter-spacing:.015em}';
  const video=document.createElement('video');
  video.src=VIDEO_URL;
  video.preload='auto';
  video.playsInline=true;
  video.setAttribute('playsinline','');
  video.setAttribute('webkit-playsinline','');
  video.disablePictureInPicture=true;
  video.controls=false;
  video.muted=false;
  video.volume=0.8;
  const actions=document.createElement('div');actions.className='aw-actions';
  const sound=document.createElement('button');sound.type='button';sound.textContent='Bật âm thanh';sound.setAttribute('aria-label','Bật hoặc tắt âm thanh video');
  const skip=document.createElement('button');skip.type='button';skip.textContent='Bỏ qua';skip.setAttribute('aria-label','Bỏ qua video chào mừng');
  const loading=document.createElement('div');loading.className='aw-loading';loading.textContent='Đang chuẩn bị không gian AUREL…';
  actions.append(sound,skip);layer.append(style,video,loading,actions);
  intro=layer;
  document.body.appendChild(layer);
  let started=false;
  function finish(){
   if(closing)return;closing=true;
   clearTimeout(watchdog);clearTimeout(playbackTimer);
   video.pause();video.removeAttribute('src');video.load();
   layer.remove();intro=null;
  }
  function updateSound(){sound.textContent=video.muted?'Bật âm thanh':'Tắt âm thanh'}
  skip.addEventListener('click',finish);
  sound.addEventListener('click',()=>{
   video.muted=!video.muted;
   updateSound();
   if(video.paused)video.play().catch(()=>{video.muted=true;updateSound()});
  });
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
   if(result&&typeof result.catch==='function')result.catch(()=>{
    if(closing)return;
    video.muted=true;updateSound();
    video.play().catch(finish);
   });
   updateSound();
  }
  startPlayback();
 }
 window.AURELWelcome={show};
})();