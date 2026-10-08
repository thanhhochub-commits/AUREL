/* AUREL CafeF overview only. Isolated: no changes to existing dashboard data or charts. */
(function(){
  'use strict';
  if(window.__AUREL_CAFEF_OVERVIEW_V1__)return;
  window.__AUREL_CAFEF_OVERVIEW_V1__=true;

  var style=document.createElement('style');
  style.id='aurel-cafef-overview-style';
  style.textContent=`
    body.aurel-page-overview #aurel-cafef-overview {
      --cf-border:#d7e4ed;--cf-ink:#17384a;--cf-muted:#667e90;--cf-surface:#fff;
      --cf-soft:#f4f8fb;--cf-link:#135c86;
      margin:24px 0 18px;padding:20px 22px;border:1px solid var(--cf-border);
      border-radius:16px;background:var(--cf-surface);color:var(--cf-ink);
      box-shadow:0 6px 22px rgba(12,40,62,.055);font-family:inherit;
    }
    body.aurel-page-overview #aurel-cafef-overview *{box-sizing:border-box}
    #aurel-cafef-overview .cf-heading{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:8px}
    #aurel-cafef-overview .cf-heading h2{margin:0;font-size:17px;font-weight:800;color:inherit;letter-spacing:0}
    #aurel-cafef-overview .cf-caption{font-size:12px;color:var(--cf-muted);line-height:1.65;margin:0 0 14px}
    #aurel-cafef-overview .cf-source{font-size:10px;border:1px solid var(--cf-border);color:var(--cf-muted);border-radius:30px;padding:5px 9px;font-weight:700}
    #aurel-cafef-overview .cf-toolbar{display:flex;align-items:flex-end;gap:9px;flex-wrap:wrap}
    #aurel-cafef-overview .cf-field{min-width:145px;max-width:240px;flex:1 1 145px;display:flex;flex-direction:column;gap:5px;font-size:11px;font-weight:750;color:var(--cf-muted)}
    #aurel-cafef-overview .cf-field input{width:100%;height:40px;padding:8px 12px;border:1px solid var(--cf-border);border-radius:9px;background:var(--cf-soft);color:var(--cf-ink);font:inherit;font-size:13px;text-transform:uppercase;outline-offset:2px}
    #aurel-cafef-overview .cf-btn,#aurel-cafef-overview .cf-outlink{display:inline-flex;align-items:center;justify-content:center;min-height:40px;border:1px solid var(--cf-border);border-radius:9px;padding:9px 13px;background:var(--cf-soft);color:var(--cf-ink);font-size:12px;font-weight:750;text-decoration:none;cursor:pointer}
    #aurel-cafef-overview .cf-btn.primary{background:#154e70;color:#fff;border-color:#154e70}
    #aurel-cafef-overview .cf-btn:disabled{opacity:.6;cursor:wait}
    #aurel-cafef-overview .cf-btn:focus-visible,#aurel-cafef-overview .cf-outlink:focus-visible{outline:2px solid #1685b6;outline-offset:3px}
    #aurel-cafef-overview .cf-status{min-height:20px;margin:11px 0;font-size:11.5px;color:var(--cf-muted);line-height:1.6}
    #aurel-cafef-overview .cf-status.warn{color:#a05420}
    #aurel-cafef-overview .cf-columns{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:13px}
    #aurel-cafef-overview .cf-subcard{min-width:0;border:1px solid var(--cf-border);border-radius:12px;padding:13px 14px;background:var(--cf-soft)}
    #aurel-cafef-overview .cf-subcard h3{margin:0 0 9px;font-size:13px;font-weight:800;color:var(--cf-ink)}
    #aurel-cafef-overview .cf-subcard p{margin:7px 0;font-size:11.5px;color:var(--cf-muted);line-height:1.55}
    #aurel-cafef-overview .cf-links{display:flex;flex-wrap:wrap;gap:7px}
    #aurel-cafef-overview .cf-outlink{min-height:32px;padding:6px 9px;font-size:11px;line-height:1.3;background:var(--cf-surface);color:var(--cf-link)}
    #aurel-cafef-overview .cf-list{list-style:none;padding:0;margin:10px 0 0;display:grid;gap:7px}
    #aurel-cafef-overview .cf-list li{padding:8px 0 0;border-top:1px solid var(--cf-border);line-height:1.4}
    #aurel-cafef-overview .cf-list a{display:block;color:var(--cf-link);text-decoration:none;font-size:12px;font-weight:650;overflow-wrap:anywhere}
    #aurel-cafef-overview .cf-list a:hover{text-decoration:underline}
    #aurel-cafef-overview .cf-meta{display:block;font-size:10px;margin-top:3px;color:var(--cf-muted)}
    #aurel-cafef-overview .cf-notice{font-size:10.5px;color:var(--cf-muted);line-height:1.65;margin:12px 0 0}
    body.aurel-dark-theme.aurel-page-overview #aurel-cafef-overview{
      --cf-border:#30495d;--cf-ink:#e2eef7;--cf-muted:#a8bfd0;
      --cf-surface:#101e2b;--cf-soft:#152839;--cf-link:#8ecdf6;
      box-shadow:0 9px 24px rgba(0,0,0,.12)
    }
    body.aurel-dark-theme.aurel-page-overview #aurel-cafef-overview .cf-btn.primary{background:#24759c;border-color:#24759c;color:#fff}
    body.aurel-dark-theme.aurel-page-overview #aurel-cafef-overview .cf-status.warn{color:#ffbd84}
    @media(max-width:760px){
      body.aurel-page-overview #aurel-cafef-overview{padding:14px;margin:14px 0 16px;border-radius:14px}
      #aurel-cafef-overview .cf-columns{grid-template-columns:1fr}
      #aurel-cafef-overview .cf-heading h2{font-size:15px}
      #aurel-cafef-overview .cf-toolbar .cf-btn{flex:1 1 auto}
    }
  `;
  document.head.appendChild(style);

  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function safeLink(u){
    try{var x=new URL(String(u));return x.protocol==='https:'&&/^(?:[a-z0-9-]+\.)?cafef\.vn$/i.test(x.hostname)?x.href:''}
    catch(e){return ''}
  }
  function externalLink(url,title){
    var href=safeLink(url);
    return href?'<a class="cf-outlink" target="_blank" rel="noopener noreferrer" href="'+esc(href)+'">'+esc(title)+' ↗</a>':'';
  }
  function firstSymbol(){
    var e=document.getElementById('bank-select');
    if(!e)return '';
    var raw=String(e.value||'').trim().toUpperCase();
    return /^[A-Z0-9]{2,6}$/.test(raw)?raw:'';
  }
  function currentLinks(symbol){
    var x=/^[A-Z0-9]{2,6}$/.test(symbol)?symbol.toLowerCase():'';
    return x?{
      financial:'https://cafef.vn/du-lieu/'+x+'/bao-cao-tai-chinh.chn',
      disclosures:'https://cafef.vn/du-lieu/tin-doanh-nghiep/'+x+'/event.chn',
      company:'https://cafef.vn/du-lieu/'+x+'/thong-tin-chung.chn',
      documents:'https://cafef.vn/du-lieu/cong-bo-thong-tin.chn'
    }:{};
  }
  function listHtml(items,limit){
    if(!Array.isArray(items)||!items.length)return '<p>Chưa nhận được danh sách từ CafeF. Có thể tra cứu trực tiếp qua các liên kết nguồn bên trên.</p>';
    return '<ul class="cf-list">'+items.slice(0,limit).map(function(item){
      var url=safeLink(item&&item.url);
      if(!url)return '';
      var date='';
      if(item.date){var d=new Date(item.date);if(!isNaN(d.getTime()))date=d.toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'})}
      return '<li><a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+esc(item.title||'Xem tin gốc')+'</a><small class="cf-meta">'+esc(date?date+' · '+(item.source||'CafeF'):(item.source||'CafeF'))+'</small></li>';
    }).join('')+'</ul>';
  }
  function showLinks(symbol,result){
    var links=currentLinks(symbol);
    var reports=(result&&Array.isArray(result.reports))?result.reports:[];
    var disclosures=(result&&Array.isArray(result.disclosures))?result.disclosures:[];
    var market=(result&&Array.isArray(result.market_news))?result.market_news:[];
    var target=document.getElementById('aurel-cafef-content');
    if(!target)return;
    target.innerHTML=
      '<div class="cf-columns">'+
        '<section class="cf-subcard"><h3>Báo cáo tài chính · '+esc(symbol)+'</h3>'+
          '<div class="cf-links">'+externalLink(links.financial,'Xem BCTC')+externalLink(links.documents,'Công bố BCTC')+'</div>'+
          '<p>Các báo cáo công bố được dẫn về nguồn gốc, không tự nhập số liệu chưa xác minh vào AUREL.</p>'+
          listHtml(reports,6)+'</section>'+
        '<section class="cf-subcard"><h3>Tin tức và công bố · '+esc(symbol)+'</h3>'+
          '<div class="cf-links">'+externalLink(links.disclosures,'Tin doanh nghiệp')+externalLink(links.company,'Hồ sơ công ty')+'</div>'+
          (disclosures.length?'<p>Thông tin công bố theo mã cổ phiếu.</p>'+listHtml(disclosures,6):'<p>Tin tức thị trường từ kênh RSS chính thức của CafeF. Không đồng nghĩa với tin riêng của '+esc(symbol)+'.</p>'+listHtml(market,6))+
          '</section>'+
      '</div>'+
      '<p class="cf-notice">Nguồn: CafeF. Kết quả có thể trễ và phụ thuộc khả năng truy cập của nhà cung cấp. Đây không phải API chính thức của CafeF; cần đối chiếu tài liệu BCTC gốc trước khi sử dụng số liệu.</p>';
  }
  function apiBase(){
    var query='';
    try{query=new URLSearchParams(location.search).get('api')||''}catch(e){}
    var saved='';
    try{saved=localStorage.getItem('aurel_api_base')||''}catch(e){}
    var base=query||saved||'https://aurel-thanhhochub-backend.onrender.com/';
    try{var url=new URL(base);return (url.protocol==='https:'||url.protocol==='http:')?url.href.replace(/\/?$/,'/'):''}catch(e){return ''}
  }
  var inflight=null;
  async function load(){
    var input=document.getElementById('aurel-cafef-symbol');
    var button=document.getElementById('aurel-cafef-load');
    var status=document.getElementById('aurel-cafef-status');
    if(!input||!status||!button)return;
    var symbol=input.value.trim().toUpperCase();
    if(!/^[A-Z0-9]{2,6}$/.test(symbol)){
      status.textContent='Vui lòng nhập mã cổ phiếu hợp lệ, ví dụ ACB hoặc VCB.';
      status.className='cf-status warn';return;
    }
    input.value=symbol;showLinks(symbol,null);
    if(inflight)inflight.abort();
    var controller=new AbortController();inflight=controller;
    var timer=setTimeout(function(){controller.abort()},23000);
    button.disabled=true;
    status.className='cf-status';status.textContent='Đang lấy danh sách công bố và tin RSS từ CafeF qua backend AUREL…';
    try{
      var endpoint=new URL('api/cafef',apiBase());
      endpoint.searchParams.set('symbol',symbol);
      var res=await fetch(endpoint.toString(),{method:'GET',cache:'no-store',signal:controller.signal});
      if(!res.ok)throw new Error('HTTP '+res.status);
      var data=await res.json();
      if(!data||data.symbol!==symbol)throw new Error('Dữ liệu trả về không đúng mã.');
      if(!document.getElementById('aurel-cafef-content'))return;
      showLinks(symbol,data);
      var parts=[];
      if(data.reports&&data.reports.length)parts.push(data.reports.length+' công bố BCTC');
      if(data.disclosures&&data.disclosures.length)parts.push(data.disclosures.length+' tin doanh nghiệp');
      if(data.market_news&&data.market_news.length)parts.push(data.market_news.length+' tin RSS');
      status.textContent=parts.length?'Đã nhận '+parts.join(', ')+' từ nguồn CafeF.':'CafeF chưa trả về danh sách đọc được. Các liên kết tra cứu gốc vẫn hoạt động.';
      status.className=parts.length?'cf-status':'cf-status warn';
    }catch(e){
      if(controller.signal.aborted&&inflight!==controller)return;
      status.textContent='Chưa lấy được nội dung tự động từ CafeF ('+(controller.signal.aborted?'hết thời gian chờ':'backend hoặc nguồn không phản hồi')+'). Bạn vẫn có thể mở BCTC và tin tức tại nguồn.';
      status.className='cf-status warn';
    }finally{
      clearTimeout(timer);
      if(inflight===controller){inflight=null;var btn=document.getElementById('aurel-cafef-load');if(btn)btn.disabled=false}
    }
  }
  function inject(){
    var root=document.getElementById('root');
    var nav=document.querySelector('#nav button[data-page="overview"]');
    if(!root||!document.body.classList.contains('aurel-page-overview')||(nav&&!nav.classList.contains('active')))return;
    if(document.getElementById('aurel-cafef-overview'))return;
    var symbol=firstSymbol();
    var div=document.createElement('section');
    div.id='aurel-cafef-overview';
    div.setAttribute('aria-label','Kết nối nguồn CafeF');
    div.innerHTML=
      '<div class="cf-heading"><h2>Kết nối CafeF · BCTC &amp; tin tức</h2><span class="cf-source">NGUỒN BÊN NGOÀI</span></div>'+
      '<p class="cf-caption">Tra cứu công bố báo cáo tài chính và thông tin chứng khoán theo mã doanh nghiệp, độc lập với dữ liệu phân tích đang lưu tại AUREL.</p>'+
      '<div class="cf-toolbar">'+
        '<label class="cf-field" for="aurel-cafef-symbol">Mã chứng khoán<input id="aurel-cafef-symbol" maxlength="6" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Ví dụ: ACB, VCB" value="'+esc(symbol)+'"></label>'+
        '<button class="cf-btn primary" id="aurel-cafef-load" type="button">Lấy thông tin CafeF</button>'+
        externalLink('https://cafef.vn/du-lieu/cong-bo-thong-tin.chn','Tra cứu BCTC')+
      '</div>'+
      '<p class="cf-status" id="aurel-cafef-status" role="status" aria-live="polite">Chưa tải dữ liệu từ CafeF. Chọn mã và bấm “Lấy thông tin CafeF”.</p>'+
      '<div id="aurel-cafef-content"></div>';
    root.appendChild(div);
    if(symbol)showLinks(symbol,null);
  }
  var scheduled=false;
  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(function(){scheduled=false;inject()});
  }
  document.addEventListener('click',function(e){
    if(e.target&&e.target.closest&&e.target.closest('#aurel-cafef-load')){e.preventDefault();load()}
  });
  document.addEventListener('keydown',function(e){
    if(e.key==='Enter'&&e.target&&e.target.id==='aurel-cafef-symbol'){e.preventDefault();load()}
  });
  document.addEventListener('change',function(e){
    if(e.target&&(e.target.id==='bank-select'||e.target.id==='year-select')){
      var input=document.getElementById('aurel-cafef-symbol');
      if(input&&e.target.id==='bank-select'){
        var symbol=firstSymbol();if(symbol){input.value=symbol;showLinks(symbol,null)}
      }
      var status=document.getElementById('aurel-cafef-status');
      if(status){status.textContent='Mã đã thay đổi. Bấm “Lấy thông tin CafeF” để tải lại.';status.className='cf-status'}
      schedule();
    }
  },true);
  function boot(){
    var root=document.getElementById('root');
    if(root)new MutationObserver(schedule).observe(root,{childList:true});
    document.addEventListener('aurel:dom-render',schedule);
    window.addEventListener('pageshow',schedule,{passive:true});
    schedule();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
