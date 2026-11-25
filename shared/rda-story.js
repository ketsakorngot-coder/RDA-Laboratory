/* RDA — Connected Story Layer ("The Missing Source")
   Self-injecting widget: adds an 📡 INTEL button + modal to every mission page.
   Does NOT touch existing mission HTML/CSS/scoring logic — purely additive. */
(function(){
  var STORY = {
    r01:{
      code:'CASE FILE #01', title:'THE MYSTERY BOX',
      briefing:'เจ้าหน้าที่ขนส่งพบกล่องโลหะปริศนาตกหล่นอยู่ริมถนนใกล้เชียงราย ไม่มีป้ายกำกับ ไม่มีเอกสารรับรองใดๆ ทั้งสิ้น หน่วย RDA ถูกเรียกตัวมาตรวจสอบทันที — นี่อาจเป็นเรื่องเล็กๆ ของหน่วยงานหนึ่ง หรืออาจเป็นจุดเริ่มต้นของบางสิ่งที่ใหญ่กว่านั้นมาก',
      clueTitle:'เบาะแสลับ: รอยสัญลักษณ์บนกล่อง',
      clue:'ใต้คราบสนิมของกล่องโลหะ มีรอยสัญลักษณ์เลือนราง — ตัวอักษร "NRH-" ตามด้วยตัวเลขที่อ่านไม่ออก คล้ายรหัสของสถานพยาบาลบางแห่ง... จำสัญลักษณ์นี้ไว้ให้ดี'
    },
    r02:{
      code:'CASE FILE #02', title:'PROTECT THE MEDICAL TEAM',
      briefing:'Korat Cancer Hospital แจ้งว่าแหล่งกำเนิดรังสีทางการแพทย์ตัวหนึ่ง "หายไปจากบันทึก" เมื่อหลายสัปดาห์ก่อน ทีมของคุณถูกส่งไปช่วยจัดการความปลอดภัยของบุคลากร แต่สิ่งที่น่าตกใจคือ รหัสอุปกรณ์ที่หายไปนั้น ขึ้นต้นด้วย "NRH-" เหมือนกับรอยที่เจอบนกล่องโลหะใน R-01 เป๊ะ',
      clueTitle:'เบาะแสลับ: บันทึกการเบิกจ่าย',
      clue:'บันทึกของโรงพยาบาลระบุว่าอุปกรณ์ถูก "เบิกเพื่อซ่อมบำรุงนอกสถานที่" โดยบริษัทภายนอกที่ไม่มีใครในแผนกจำได้ว่าเคยติดต่อมาก่อน'
    },
    r03:{
      code:'CASE FILE #03', title:'VERIFY THE SUSPICIOUS LUGGAGE',
      briefing:'ระบบตรวจจับที่สนามบินดอนเมืองส่งสัญญาณเตือนจากสัมภาระต้องสงสัยที่กำลังจะถูกลำเลียงออกนอกประเทศ เจ้าของพัสดุอ้างว่าเป็น "อุปกรณ์การแพทย์เก่าที่ทิ้งแล้ว" — แต่ทำไมของที่ถูกทิ้งแล้วถึงต้องแอบขนออกนอกประเทศอย่างเงียบๆ',
      clueTitle:'เบาะแสลับ: ใบขนส่งปลอม',
      clue:'ใบขนส่งสินค้าระบุชื่อบริษัทปลายทางว่า "Somchai Trading Co." ซึ่งเมื่อตรวจสอบแล้วพบว่าจดทะเบียนเมื่อ 3 สัปดาห์ก่อนเท่านั้น — เป็นบริษัทตั้งขึ้นมาใหม่เอี่ยม อาจจะตั้งขึ้นมาเพื่อเรื่องนี้โดยเฉพาะ'
    },
    r04:{
      code:'CASE FILE #04', title:'EXPORT BATCH F-04 ON HOLD',
      briefing:'โรงงานส่งออกอาหารในสมุทรสาครตรวจพบความผิดปกติของแหล่งกำเนิดรังสีที่ใช้ในกระบวนการฉายรังสีอาหาร ข้อมูลอายุของแหล่งกำเนิดไม่ตรงกับบันทึก ยิ่งไปกว่านั้น ผู้จัดหาอุปกรณ์ให้โรงงานนี้ คือบริษัทเดียวกับที่ปรากฏในใบขนส่งปลอมจาก R-03',
      clueTitle:'เบาะแสลับ: อีเมลภายใน',
      clue:'อีเมลที่หลุดออกมาระบุชื่อผู้ติดต่อว่า "K." เพียงตัวอักษรเดียว พร้อมข้อความสั้นๆ ว่า "ของถึงมือแล้ว เตรียมแผนต่อไปได้เลย" — "K." คือใคร?'
    },
    r05:{
      code:'CASE FILE #05', title:'THE CITY RADIATION EVENT',
      briefing:'สัญญาณรังสีผิดปกติแพร่กระจายไปทั่วเมือง ประชาชนหลายพันคนตกอยู่ในความเสี่ยง Inspector Atom เผชิญหน้ากับผู้ต้องสงสัยหลักเป็นครั้งแรก — อดีตพนักงานโรงพยาบาลที่ถูกไล่ออกเมื่อหลายเดือนก่อน ผู้ที่รู้รหัส "NRH-" ดีที่สุดในบรรดาทุกคน',
      clueTitle:'เบาะแสลับ: คำสารภาพบางส่วน',
      clue:'"ผมแค่อยากพิสูจน์ว่าระบบความปลอดภัยของพวกเขามันหละหลวมแค่ไหน... ผมไม่คิดว่ามันจะบานปลายขนาดนี้" — คำพูดที่ถูกดักฟังได้บางส่วน ก่อนสัญญาณจะขาดหาย'
    },
    r06:{
      code:'CASE FILE #06 — FINAL', title:'NATIONAL RADIATION CRISIS',
      briefing:'ทุกเบาะแสจาก R-01 ถึง R-05 ถูกนำมารวมกันในห้องบัญชาการระดับประเทศ ถึงเวลาตัดสินใจครั้งสุดท้ายที่จะกำหนดชะตากรรมของประเทศ — และเปิดเผยความจริงทั้งหมดเบื้องหลังเหตุการณ์ทั้งหมดนี้',
      clueTitle:'🎬 THE FULL REVEAL',
      clue:'ผลการสืบสวนสรุปว่า: อดีตพนักงานที่ถูกไล่ออกไม่ได้ทำเรื่องนี้เพียงลำพัง — "K." ในอีเมลคือหัวหน้าแผนกจัดซื้อของโรงพยาบาลเอง ผู้ที่ช่วยปกปิดการหายไปของแหล่งกำเนิดรังสีเพื่อผลประโยชน์ส่วนตัว แผนทั้งหมดถูกเปิดโปงได้ก็เพราะทีม RDA ต่อเบาะแสเล็กๆ จากทุกที่เข้าด้วยกัน — งานสืบสวนที่ยิ่งใหญ่ที่สุด มักเริ่มจากรายละเอียดเล็กๆ ที่คนอื่นมองข้าม'
    }
  };

  function currentMissionId(){
    var m = location.pathname.match(/\/missions\/(r0[1-6])\//i);
    return m ? m[1].toLowerCase() : null;
  }

  function cluesKey(){ return 'RDA_STORY_CLUES'; }
  function getCollected(){
    try{ return JSON.parse(localStorage.getItem(cluesKey())||'[]'); }catch(e){ return []; }
  }
  function markCollected(id){
    var c = getCollected();
    if(c.indexOf(id)===-1){ c.push(id); localStorage.setItem(cluesKey(), JSON.stringify(c)); }
  }

  function injectStyles(){
    if(document.getElementById('rdaStoryStyles')) return;
    var css = '\
      .rda-intel-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 13px;border-radius:999px;\
        background:linear-gradient(135deg,#0b1d2a,#10293a);border:1px solid #2de2e6;\
        color:#fff;font-family:inherit;font-weight:700;font-size:11px;letter-spacing:.04em;\
        cursor:pointer;white-space:nowrap;flex-shrink:0;\
        box-shadow:0 4px 14px rgba(0,0,0,.35);animation:rdaIntelPulse 2.4s ease-in-out infinite;}\
      @keyframes rdaIntelPulse{0%,100%{box-shadow:0 8px 24px rgba(0,0,0,.4),0 0 0 0 rgba(45,226,230,.35)}\
        50%{box-shadow:0 8px 24px rgba(0,0,0,.4),0 0 0 8px rgba(45,226,230,0)}}\
      .rda-intel-btn .dot{width:7px;height:7px;border-radius:50%;background:#ff4d5a;\
        box-shadow:0 0 8px 2px rgba(255,77,90,.7);display:inline-block;\
        animation:rdaBlinkDot 1.4s ease-in-out infinite;}\
      @keyframes rdaBlinkDot{0%,100%{opacity:1}50%{opacity:.2}}\
      .rda-intel-overlay{position:fixed;inset:0;z-index:9999;background:rgba(2,8,14,.82);\
        backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;\
        padding:20px;opacity:0;pointer-events:none;transition:opacity .25s ease;}\
      .rda-intel-overlay.open{opacity:1;pointer-events:auto}\
      .rda-intel-card{max-width:560px;width:100%;max-height:86vh;overflow:auto;\
        background:linear-gradient(180deg,#0b1d2a,#081620);border:1px solid #2de2e6;\
        border-radius:16px;padding:26px 28px;color:#f5fbff;font-family:inherit;\
        box-shadow:0 30px 80px rgba(0,0,0,.6);transform:translateY(16px);transition:transform .25s ease;}\
      .rda-intel-overlay.open .rda-intel-card{transform:translateY(0)}\
      .rda-intel-code{font-size:11px;letter-spacing:.14em;color:#ffd23f;font-weight:800}\
      .rda-intel-title{font-size:20px;font-weight:900;margin:4px 0 14px;color:#fff}\
      .rda-intel-brief{font-size:13.5px;line-height:1.7;color:#cfe6ea;margin:0 0 18px}\
      .rda-intel-clue-box{border:1px dashed #2de2e6;border-radius:12px;padding:14px 16px;background:rgba(45,226,230,.05)}\
      .rda-intel-clue-title{font-size:12px;font-weight:800;color:#2de2e6;margin:0 0 8px}\
      .rda-intel-clue-text{font-size:13px;line-height:1.65;color:#e7f3f6;margin:0}\
      .rda-intel-locked{display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;\
        padding:22px 10px;color:#9bb4c4;font-size:12px}\
      .rda-intel-reveal-btn{margin-top:4px;padding:9px 18px;border-radius:999px;border:1px solid #ffd23f;\
        background:rgba(255,210,63,.08);color:#ffd23f;font-weight:800;font-size:12px;cursor:pointer;}\
      .rda-intel-reveal-btn:hover{background:rgba(255,210,63,.18)}\
      .rda-intel-close{position:absolute;top:14px;right:16px;background:none;border:none;color:#9bb4c4;\
        font-size:20px;cursor:pointer;line-height:1}\
      .rda-intel-progress{margin-top:18px;padding-top:14px;border-top:1px solid #1c3a49;\
        font-size:11px;color:#7fa0b0;display:flex;justify-content:space-between;align-items:center}\
      .rda-intel-dots{display:flex;gap:5px}\
      .rda-intel-dots i{width:7px;height:7px;border-radius:50%;background:#1c3a49;display:block}\
      .rda-intel-dots i.on{background:#2de2e6;box-shadow:0 0 6px 1px rgba(45,226,230,.6)}\
      @media(max-width:480px){.rda-intel-btn{padding:7px 10px;font-size:10px}\
        .rda-intel-card{padding:20px 18px}}\
    ';
    var style = document.createElement('style');
    style.id = 'rdaStoryStyles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function buildOverlay(id, data){
    var overlay = document.createElement('div');
    overlay.className = 'rda-intel-overlay';
    overlay.id = 'rdaIntelOverlay';

    var collected = getCollected();
    var already = collected.indexOf(id) !== -1;
    var order = ['r01','r02','r03','r04','r05','r06'];

    var dotsHtml = order.map(function(mid){
      return '<i class="'+(collected.indexOf(mid)!==-1 ? 'on':'')+'"></i>';
    }).join('');

    overlay.innerHTML =
      '<div class="rda-intel-card">' +
        '<button class="rda-intel-close" id="rdaIntelClose">✕</button>' +
        '<div class="rda-intel-code">' + data.code + '</div>' +
        '<h3 class="rda-intel-title">' + data.title + '</h3>' +
        '<p class="rda-intel-brief">' + data.briefing + '</p>' +
        '<div class="rda-intel-clue-box" id="rdaIntelClueBox"></div>' +
        '<div class="rda-intel-progress"><span>เบาะแสที่เก็บได้: ' + collected.length + '/6</span><div class="rda-intel-dots">' + dotsHtml + '</div></div>' +
      '</div>';

    document.body.appendChild(overlay);

    var clueBox = overlay.querySelector('#rdaIntelClueBox');
    function renderClue(revealed){
      if(revealed){
        clueBox.innerHTML = '<div class="rda-intel-clue-title">🔍 ' + data.clueTitle + '</div><p class="rda-intel-clue-text">' + data.clue + '</p>';
      }else{
        clueBox.innerHTML = '<div class="rda-intel-locked">🔒 มีเบาะแสลับซ่อนอยู่ในคดีนี้<button class="rda-intel-reveal-btn" id="rdaIntelReveal">ค้นหาเบาะแส</button></div>';
        var btn = clueBox.querySelector('#rdaIntelReveal');
        if(btn) btn.onclick = function(){
          markCollected(id);
          renderClue(true);
          var progressEl = overlay.querySelector('.rda-intel-progress span');
          var newCollected = getCollected();
          if(progressEl) progressEl.textContent = 'เบาะแสที่เก็บได้: ' + newCollected.length + '/6';
          var dots = overlay.querySelectorAll('.rda-intel-dots i');
          order.forEach(function(mid,i){ if(newCollected.indexOf(mid)!==-1) dots[i].classList.add('on'); });
        };
      }
    }
    renderClue(already);

    overlay.querySelector('#rdaIntelClose').onclick = function(){ overlay.classList.remove('open'); };
    overlay.addEventListener('click', function(e){ if(e.target===overlay) overlay.classList.remove('open'); });

    return overlay;
  }

  function init(){
    var id = currentMissionId();
    if(!id || !STORY[id]) return;
    injectStyles();

    var btn = document.createElement('button');
    btn.className = 'rda-intel-btn';
    btn.type = 'button';
    btn.innerHTML = '<span class="dot"></span> 📡 INTEL';

    var topbar = document.querySelector('.topbar');
    if(topbar){
      topbar.appendChild(btn);
    } else {
      // fallback: no .topbar found on this page — pin a small tab to the top-right corner
      btn.style.position='fixed'; btn.style.top='10px'; btn.style.right='10px'; btn.style.zIndex='9997';
      document.body.appendChild(btn);
    }

    var overlay = null;
    btn.onclick = function(){
      if(!overlay) overlay = buildOverlay(id, STORY[id]);
      requestAnimationFrame(function(){ overlay.classList.add('open'); });
    };
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.RDAStory = { getCollected: getCollected, STORY: STORY };
})();
