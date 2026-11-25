/* RDA — Achievement / Badge System
   Self-injecting widget: adds a 🏅 ACHIEVEMENTS button + modal.
   Reads existing localStorage data only — does not modify any scoring/game logic. */
(function(){
  var CASE_MAX = {r01:100,r02:100,r03:100,r04:100,r05:100,r06:100};
  var MISSION_ORDER = ['r01','r02','r03','r04','r05','r06'];

  var BADGES = [
    {id:'r01', icon:'🎯', title:'นักสืบมือใหม่', desc:'ผ่านภารกิจ R-01: THE MYSTERY BOX'},
    {id:'r02', icon:'🛡️', title:'ผู้พิทักษ์', desc:'ผ่านภารกิจ R-02: PROTECT THE MEDICAL TEAM'},
    {id:'r03', icon:'✈️', title:'ผู้ตรวจสอบ', desc:'ผ่านภารกิจ R-03: VERIFY THE SUSPICIOUS LUGGAGE'},
    {id:'r04', icon:'🔮', title:'นักทำนาย', desc:'ผ่านภารกิจ R-04: PREDICT EXPORT BATCH F-04'},
    {id:'r05', icon:'🏙️', title:'ผู้บัญชาการเมือง', desc:'ผ่านภารกิจ R-05: THE CITY RADIATION EVENT'},
    {id:'r06', icon:'🎖️', title:'วีรบุรุษแห่งชาติ', desc:'ผ่านภารกิจครบทั้ง 6 — ปิดคดี NATIONAL RADIATION CRISIS'},
    {id:'improver', icon:'📈', title:'นักพัฒนาตัวเอง', desc:'ปรับปรุงคำตอบจาก Initial → Revision ได้ดีขึ้นอย่างน้อย 30% ในคดีใดคดีหนึ่ง'},
    {id:'cluehunter', icon:'🕵️', title:'นักสืบเบาะแส', desc:'ค้นพบเบาะแสลับครบทั้ง 6 คดี'},
    {id:'voice', icon:'💬', title:'เสียงที่มีค่า', desc:'ทำแบบสอบถามความพึงพอใจเสร็จสมบูรณ์'}
  ];

  function readJSON(key, fallback){
    try{ var v = JSON.parse(localStorage.getItem(key)||'null'); return v===null ? fallback : v; }
    catch(e){ return fallback; }
  }

  function computeEarned(){
    var earned = {};

    // r01-r06 completion — prefer RDAMaster snapshot if available, fallback to raw decision records
    var snap = null;
    try{ snap = window.RDAMaster && window.RDAMaster.snapshot ? window.RDAMaster.snapshot() : null; }catch(e){}
    MISSION_ORDER.forEach(function(id){
      var done = false;
      if(snap && snap.missions && snap.missions[id]) done = !!snap.missions[id].completed;
      if(!done){
        var dec = readJSON('RDA_DECISION_'+id.toUpperCase(), null);
        if(dec && (dec.revisionSubmitted || dec.revisedScore>0)) done = true;
      }
      earned[id] = done;
    });
    earned.r06 = earned.r06 && MISSION_ORDER.slice(0,6).every(function(id){return earned[id];});

    // improver badge
    var improver = false;
    MISSION_ORDER.forEach(function(id){
      var dec = readJSON('RDA_DECISION_'+id.toUpperCase(), null);
      if(!dec) return;
      var max = CASE_MAX[id];
      var gainPct = ((Number(dec.revisedScore||0) - Number(dec.initialScore||0)) / max) * 100;
      if(gainPct >= 30) improver = true;
    });
    earned.improver = improver;

    // clue hunter badge
    var clues = readJSON('RDA_STORY_CLUES', []);
    earned.cluehunter = Array.isArray(clues) && clues.length >= 6;

    // satisfaction badge
    var sat = readJSON('RDA_SATISFACTION_V1', null);
    earned.voice = !!(sat && sat.completed);

    return earned;
  }

  function injectStyles(){
    if(document.getElementById('rdaAchStyles')) return;
    var css = '\
      .rda-ach-btn{position:fixed;left:14px;bottom:14px;z-index:9998;\
        display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:999px;\
        background:linear-gradient(135deg,#1a1206,#2a1c08);border:1px solid #ffd23f;\
        color:#fff;font-family:inherit;font-weight:700;font-size:12px;letter-spacing:.05em;\
        cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.4);}\
      .rda-ach-btn .badge-count{background:#ffd23f;color:#241a03;border-radius:999px;\
        font-size:10px;font-weight:900;padding:1px 7px;}\
      .rda-ach-overlay{position:fixed;inset:0;z-index:9999;background:rgba(2,8,14,.82);\
        backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;\
        padding:20px;opacity:0;pointer-events:none;transition:opacity .25s ease;}\
      .rda-ach-overlay.open{opacity:1;pointer-events:auto}\
      .rda-ach-card{max-width:640px;width:100%;max-height:86vh;overflow:auto;\
        background:linear-gradient(180deg,#0b1d2a,#081620);border:1px solid #ffd23f;\
        border-radius:16px;padding:26px 28px;color:#f5fbff;font-family:inherit;\
        box-shadow:0 30px 80px rgba(0,0,0,.6);position:relative;transform:translateY(16px);transition:transform .25s ease;}\
      .rda-ach-overlay.open .rda-ach-card{transform:translateY(0)}\
      .rda-ach-title{font-size:20px;font-weight:900;margin:0 0 4px;color:#fff}\
      .rda-ach-sub{font-size:12px;color:#9bb4c4;margin:0 0 18px}\
      .rda-ach-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}\
      .rda-ach-item{display:flex;gap:12px;align-items:flex-start;padding:12px 14px;\
        border-radius:12px;border:1px solid #1c3a49;background:rgba(255,255,255,.02);}\
      .rda-ach-item.earned{border-color:#ffd23f;background:rgba(255,210,63,.06)}\
      .rda-ach-icon{font-size:26px;line-height:1;filter:grayscale(1) opacity(.35)}\
      .rda-ach-item.earned .rda-ach-icon{filter:none}\
      .rda-ach-name{font-size:12.5px;font-weight:800;margin:0 0 3px;color:#cfe0e6}\
      .rda-ach-item.earned .rda-ach-name{color:#fff}\
      .rda-ach-desc{font-size:10.5px;line-height:1.5;color:#7fa0b0;margin:0}\
      .rda-ach-close{position:absolute;top:14px;right:16px;background:none;border:none;color:#9bb4c4;\
        font-size:20px;cursor:pointer;line-height:1}\
      @media(max-width:560px){.rda-ach-grid{grid-template-columns:1fr}.rda-ach-card{padding:20px 18px}}\
    ';
    var style = document.createElement('style');
    style.id = 'rdaAchStyles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function render(){
    var earned = computeEarned();
    var count = BADGES.filter(function(b){return earned[b.id];}).length;

    var btn = document.getElementById('rdaAchBtn');
    if(btn) btn.innerHTML = '🏅 ACHIEVEMENTS <span class="badge-count">'+count+'/'+BADGES.length+'</span>';

    var grid = document.getElementById('rdaAchGrid');
    if(grid){
      grid.innerHTML = BADGES.map(function(b){
        var isEarned = !!earned[b.id];
        return '<div class="rda-ach-item'+(isEarned?' earned':'')+'">' +
          '<div class="rda-ach-icon">'+b.icon+'</div>' +
          '<div><p class="rda-ach-name">'+b.title+'</p><p class="rda-ach-desc">'+b.desc+'</p></div>' +
        '</div>';
      }).join('');
    }
    return {earned:earned, count:count};
  }

  function init(){
    injectStyles();

    var btn = document.createElement('button');
    btn.className = 'rda-ach-btn';
    btn.id = 'rdaAchBtn';
    document.body.appendChild(btn);

    var overlay = document.createElement('div');
    overlay.className = 'rda-ach-overlay';
    overlay.id = 'rdaAchOverlay';
    overlay.innerHTML =
      '<div class="rda-ach-card">' +
        '<button class="rda-ach-close" id="rdaAchClose">✕</button>' +
        '<h3 class="rda-ach-title">🏅 ACHIEVEMENTS</h3>' +
        '<p class="rda-ach-sub" id="rdaAchSub"></p>' +
        '<div class="rda-ach-grid" id="rdaAchGrid"></div>' +
      '</div>';
    document.body.appendChild(overlay);

    var r = render();
    var sub = document.getElementById('rdaAchSub');
    if(sub) sub.textContent = 'ปลดล็อกแล้ว ' + r.count + ' จาก ' + BADGES.length + ' รางวัล';

    btn.onclick = function(){
      var rr = render();
      var subEl = document.getElementById('rdaAchSub');
      if(subEl) subEl.textContent = 'ปลดล็อกแล้ว ' + rr.count + ' จาก ' + BADGES.length + ' รางวัล';
      requestAnimationFrame(function(){ overlay.classList.add('open'); });
    };
    document.getElementById('rdaAchClose').onclick = function(){ overlay.classList.remove('open'); };
    overlay.addEventListener('click', function(e){ if(e.target===overlay) overlay.classList.remove('open'); });
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.RDAAchievements = { compute: computeEarned, BADGES: BADGES };
})();
