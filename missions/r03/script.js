
const phases=[
{name:'DISCOVER',icon:'🔎',steps:[0,1]},
{name:'PREDICT',icon:'🎯',steps:[1]},
{name:'TEST',icon:'📡',steps:[2,3]},
{name:'BUILD EVIDENCE',icon:'🧾',steps:[4]},
{name:'EXPLAIN',icon:'🧠',steps:[5,6]},
{name:'DECIDE',icon:'⚖️',steps:[7]},
{name:'COMPLETE',icon:'🏅',steps:[8]}
];
const stepNames=['MISSION BRIEF','DISCOVER + PREDICT','TEST • ANIMATION','TEST • SCANNER','BUILD EVIDENCE','EXPLAIN • REASONING','EXPLAIN • INSPECTOR ATOM','DECIDE • SECURITY BOARD','COMPLETE'];
const qs=[
 ['CLAIM','คุณสรุปอย่างไรเกี่ยวกับกระเป๋าที่ควรตรวจต่อ?'],
 ['EVIDENCE','ข้อมูลจาก Portal / Scanner / Laboratory Report ใดสนับสนุน Claim ของคุณ?'],
 ['PHYSICS REASONING','เหตุใดการเปรียบเทียบกับ Background และค่าที่วัดได้จึงสำคัญต่อการตัดสินใจ?'],
 ['RISK & VERIFY','ก่อนตัดสินใจสุดท้าย ยังมีความเสี่ยงหรือข้อมูลใดที่ต้องตรวจสอบอีก?']
];
const def={step:0,opened:[],scene:0,detector:'Geiger Counter',distance:100,scans:[],selectedBag:'',evidenceSummary:'',prediction:{decision:'',reason:''},polya:{a:'',p:'',s:'',v:''},polyaStep:0,chat:[],hints:0,report:{},decisionEvidence:[],secondaryAlarm:false,completed:false,score:0,correct:false,breakdown:{evidence:0,simulation:0,notebook:0,decision:0},feedback:[]};
let state=Object.assign({},def,JSON.parse(localStorage.getItem('rdkR03Standalone')||'{}')); state.prediction=state.prediction||{decision:'',reason:''}; state.decisionEvidence=Array.isArray(state.decisionEvidence)?state.decisionEvidence:[];
document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>showPage(b.dataset.page));
function showPage(id){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));document.getElementById(id).classList.add('active');document.querySelectorAll('[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===id));pageTitle.textContent=id==='mission'?'R-03 • VERIFY — Airport Security':id==='passport'?'Research Passport':id==='teacher'?'Teacher Center':'Airport Headquarters';if(id==='mission')renderMission();if(id==='passport')renderPassport();if(id==='teacher')renderTeacher()}
function save(){localStorage.setItem('rdkR03Standalone',JSON.stringify(state));renderGlobal()}
function toastMsg(t){toast.textContent=t;toast.classList.remove('hidden');setTimeout(()=>toast.classList.add('hidden'),2200)}
function acceptMission(){state.step=0;save();showPage('mission');renderMission()}
function phaseIndex(){return phases.findIndex(p=>p.steps.includes(state.step))}
function next(){if(state.step<8){state.step++;save();renderMission()}}function back(){if(state.step>0){state.step--;save();renderMission()}}
function foot(nextBtn,backBtn=true){return `<div class="stage-footer"><button class="btn btn-ghost" ${backBtn?'':'disabled'} onclick="back()">← ย้อนกลับ</button><div>${nextBtn}</div></div>`}
function renderGlobal(){sideXpBar.style.width=(state.completed&&state.correct?'100':'0')+'%';sideXp.textContent=(state.completed&&state.correct?'200':'0')+' / 200 XP';liveStatus.textContent=stepNames[state.step].toUpperCase()}
function renderMission(){
 const pi=phaseIndex();
 
 
 let pct=Math.round(state.step/8*100);missionPct.textContent=pct+'%';missionBar.style.width=pct+'%';currentTask.textContent=stepNames[state.step];
 missionChecklist.innerHTML=phases.map((p,i)=>`<div><span>${i<pi?'✓':i===pi?'▶':'🔒'} ${p.name}</span><span>${i<pi?'ผ่านแล้ว':i===pi?'กำลังทำ':'ล็อก'}</span></div>`).join('');
 const taskText=[
'🚨 PORTAL ALERT • Gate B3 ตรวจพบสัญญาณผิดปกติ รับ Mission และตรวจบริบทก่อนตัดสิน',
'เปิด Evidence A–D แล้ว LOCK INITIAL PREDICTION ก่อนใช้เครื่องตรวจ',
'เรียนรู้ Background Radiation • Count Rate • Detector Response ผ่าน Animation',
'ใช้ Real-time Scanner ตรวจสัมภาระ A–E และเปรียบเทียบกับ Background 18 CPM',
'ระบบสร้าง Airport Evidence Wall จากค่าที่คุณวัดจริง + Laboratory Report',
'Inspector Atom Debrief • สร้าง CLAIM → EVIDENCE → PHYSICS REASONING → RISK',
'ทบทวนความสมเหตุสมผลของ Evidence โดยไม่เฉลย Final Decision',
'🚨 SECONDARY PORTAL ALARM • เลือกหลักฐานอย่างน้อย 2 ชิ้น แล้วตัดสิน CLEAR • HOLD • DENY',
'GATE B3 SECURED • เปรียบเทียบ BEFORE → EVIDENCE → FINAL DECISION'
];
 const icons=['🚨','📩','🎬','📡','🧾','🧠','🤖','📝','🏅'];
 stage.innerHTML=`<div class="mission-callout"><div class="call-icon">${icons[state.step]}</div><div><h4>Objective ปัจจุบัน: ${stepNames[state.step]}</h4><p>${taskText[state.step]}</p></div><div class="call-step">${state.step+1}/9</div></div>${stageHTML(state.step)}`;
 restore();
}
function stageHTML(i){if(i===0)return missionBrief();if(i===1)return evidenceStage();if(i===2)return animationStage();if(i===3)return scannerStage();if(i===4)return finalEvidence();if(i===5)return polyaStage();if(i===6)return aiStage();if(i===7)return reportStage();return completeStage()}
function missionBrief(){return `
<div class="r03-alert-hero">
 <div class="r03-alert-pulse">!</div>
 <div>
   <span class="pill">PORTAL ZERO • RADIATION ALERT</span>
   <h2>GATE B3 • FLIGHT TG421</h2>
   <p>Radiation Portal Monitor ตรวจพบสัญญาณผิดปกติจากสัมภาระ 5 ใบ ขณะที่เที่ยวบินกำลัง Boarding</p>
 </div>
 <div class="r03-board-time"><small>BOARDING STATUS</small><b>08:00</b><span>SECURITY HOLD WINDOW</span></div>
</div>
<div class="r03-mission-question">
 <small>MISSION QUESTION</small>
 <h3>“ตรวจพบรังสี” เพียงพอให้สรุปว่าอันตรายหรือไม่?</h3>
 <p>คุณต้องใช้ <b>Background • Measurement • Evidence • Context</b> ก่อนตัดสินใจ</p>
</div>
${foot('<button class="btn btn-primary" onclick="next()">ENTER SECURITY ZONE → DISCOVER</button>',false)}`;} 
function evidenceStage(){
 const e=[
  ['A','🩻','X-RAY IMAGE','พบภาชนะโลหะทรงกระบอกภายในสัมภาระ'],
  ['B','📟','PORTAL MONITOR','Gate B3 Alarm • 0.85 μSv/h • Background reference ยังต้องตรวจ'],
  ['C','📄','PASSENGER DECLARATION','ระบุว่าเกี่ยวข้องกับอุปกรณ์การแพทย์ แต่เอกสารขนส่งไม่สมบูรณ์'],
  ['D','🎥','CCTV + MANIFEST','สัมภาระ 5 ใบ A–E ถูกส่งเข้าสู่ Secondary Inspection Bay']
 ];
 const all=state.opened.length>=4;
 return `<div class="stage-head"><div><span class="pill">DISCOVER • AIRPORT CONTROL ROOM</span><h3>🔎 Security Evidence Station</h3></div><span class="pill">${state.opened.length}/4 SECURED</span></div>
 <p class="muted">เปิดข้อมูลทุกแหล่งก่อนตั้งสมมติฐาน ระบบจะยังไม่เฉลยว่ากระเป๋าใดควรถูกกัก</p>
 <div class="evidence-grid r03-discover-grid">${e.map((x,n)=>`<div class="evidence-card ${state.opened.includes(n)?'opened':''}">
   <div class="evidence-icon">${x[1]}</div><small>EVIDENCE ${x[0]}</small><h4>${x[2]}</h4>
   <p>${state.opened.includes(n)?x[3]:'CLASSIFIED • เปิด Evidence ตามลำดับ'}</p>
   <button class="btn btn-secondary" ${n>state.opened.length?'disabled':''} onclick="openEvidence(${n})">${state.opened.includes(n)?'✓ EVIDENCE SECURED':'OPEN EVIDENCE'}</button>
 </div>`).join('')}</div>
 ${all?`<div class="r03-predict-card">
  <span class="pill">PREDICT • BEFORE MEASUREMENT</span>
  <h3>คุณจะสั่งการเบื้องต้นอย่างไร?</h3>
  <p>เลือกการตัดสินใจก่อนใช้ Scanner เพื่อให้ระบบเปรียบเทียบ BEFORE → AFTER ตอนจบ</p>
  <div class="r03-predict-options">
   <button class="${state.prediction?.decision==='CLEAR'?'active':''}" onclick="setPrediction('CLEAR',this)">🟢 CLEAR</button>
   <button class="${state.prediction?.decision==='HOLD'?'active':''}" onclick="setPrediction('HOLD',this)">🟡 HOLD</button>
   <button class="${state.prediction?.decision==='DENY'?'active':''}" onclick="setPrediction('DENY',this)">🔴 DENY</button>
  </div>
  <textarea id="predictionReason" placeholder="เหตุผลเบื้องต้นจาก Evidence A–D...">${state.prediction?.reason||''}</textarea>
 </div>`:''}
 ${foot(all?'<button class="btn btn-primary" onclick="lockR03Prediction()">LOCK PREDICTION → TEST</button>':'<button class="btn btn-primary" disabled>SECURE EVIDENCE A–D FIRST</button>')}`;
}
function setPrediction(v,el){state.prediction=state.prediction||{decision:'',reason:''};state.prediction.decision=v;save();document.querySelectorAll('.r03-predict-options button').forEach(x=>x.classList.remove('active'));if(el)el.classList.add('active')}
function lockR03Prediction(){const r=document.getElementById('predictionReason')?.value.trim()||'';if(!state.prediction?.decision)return toastMsg('เลือก CLEAR / HOLD / DENY ก่อน');if(r.length<10)return toastMsg('อธิบายเหตุผลเบื้องต้นอย่างน้อย 10 ตัวอักษร');state.prediction.reason=r;save();next()}
function animationStage(){
 let s=scenes[state.scene];
 const lessons=[
  ['BACKGROUND FIRST','🌌','ค่าที่ตรวจได้ต้องเปรียบเทียบกับ Background Radiation ไม่ใช่ดูตัวเลขเดี่ยว ๆ'],
  ['COUNT RATE','📈','CPM คือจำนวน Count ต่อเวลา ค่าเพิ่มเหนือ Background บอกว่ามีสัญญาณที่ควรตรวจต่อ'],
  ['DISTANCE RESPONSE','📡','Detector ที่อยู่ใกล้แหล่งกำเนิดจะตอบสนองมากขึ้น จึงต้องควบคุมระยะขณะเปรียบเทียบ'],
  ['DETECTOR ≠ DECISION','⚠️','การตรวจพบสัญญาณไม่เท่ากับคำตัดสิน ต้องพิจารณาเอกสารและบริบทด้วย'],
  ['EVIDENCE CHAIN','🔗','PORTAL → SCANNER → LAB REPORT → CONTEXT จึงนำไปสู่การตัดสินใจที่มีเหตุผล']
 ];
 const L=lessons[state.scene]||lessons[0];
 return `<div class="stage-head"><div><span class="pill">TEST • RADIATION DETECTION TRAINING</span><h3>🎬 ${L[0]}</h3></div><span class="pill">${state.scene+1}/5</span></div>
 <div class="animation-stage r03-training-stage"><div><div class="anim-icon">${L[1]}</div><h2>${L[0]}</h2><p>${L[2]}</p>
 <div class="r03-animation-equation">${state.scene===0?'MEASURED SIGNAL = BACKGROUND + SOURCE RESPONSE':state.scene===1?'COMPARE: CPM − BACKGROUND':state.scene===2?'CONTROL DISTANCE → COMPARE FAIRLY':state.scene===3?'DETECTION ≠ DANGER': 'MEASUREMENT + CONTEXT → DECISION'}</div></div></div>
 <div class="training-controls"><button class="btn btn-secondary" onclick="moveScene(-1)">← BACK</button><button class="btn btn-secondary" onclick="moveScene(1)">NEXT →</button></div>
 ${foot(state.scene===4?'<button class="btn btn-primary" onclick="next()">OPEN LIVE RADIATION SCANNER →</button>':'<button class="btn btn-primary" disabled>VIEW ALL 5 TRAINING SCENES</button>')}`;
}
function scannerStage(){
 const bg=18;
 const latest={};state.scans.forEach(x=>latest[x.bag]=x);
 return `<div class="stage-head"><div><span class="pill">TEST • LIVE RADIATION SCANNER</span><h3>📡 Secondary Inspection Bay</h3></div><span class="pill">BACKGROUND ${bg} CPM</span></div>
 <div class="r03-physics-note"><b>Physics Lens:</b> เปรียบเทียบค่าของแต่ละกระเป๋ากับ Background ที่ระยะตรวจเดียวกัน • อย่าสรุปจาก “ค่ามาก” เพียงอย่างเดียว</div>
 <div class="scanner-game r03-scanner-wow">
  <div class="toolbox">
   <div class="card"><h4>DETECTOR</h4>${['Geiger Counter','Scintillation Detector','Dosimeter'].map(x=>`<button class="detector ${state.detector===x?'active':''}" onclick="chooseDetector('${x}')">${x}</button>`).join('')}</div>
   <div class="distance-control"><label>DISTANCE <b id="distanceLabel">${state.distance} cm</b></label><input id="distanceRange" type="range" min="20" max="150" value="${state.distance}" oninput="changeDistance(this.value)"></div>
   <div class="r03-bg-card"><small>BACKGROUND REFERENCE</small><strong>18 CPM</strong><span>ใช้เป็นฐานเปรียบเทียบ</span></div>
  </div>
  <div>
   <div class="conveyor">
    <div id="scannerProbe" class="scanner-probe" title="ลาก Detector ไปใกล้สัมภาระ">📡</div>
    <div class="scan-target-line"></div><div id="liveAlert" class="live-alert">SIGNAL ABOVE BACKGROUND</div>
    <div class="meter">
     <div class="meter-row"><span>LIVE COUNT RATE</span><b id="cpmValue">18</b></div>
     <div class="meter-track"><div id="meterFill" class="meter-fill"></div></div>
     <div class="meter-row"><span>DOSE RATE</span><b id="doseValue">0.02 μSv/h</b></div>
     <div class="meter-row"><span>ABOVE BG</span><b id="aboveBgValue">0 CPM</b></div>
     <div id="beepText" class="beep">ติ๊ก...</div>
    </div>
    <div class="bags">${['A','B','C','D','E'].map(x=>`<div class="bag ${state.selectedBag===x?'selected':''}" onclick="selectBag('${x}')">🧳<span>${x}</span></div>`).join('')}</div><div class="belt"></div>
   </div>
   <button class="btn btn-primary" style="margin-top:12px" onclick="scanBag()">▶ CAPTURE MEASUREMENT</button>
   <div id="scanFeedback" class="notice" style="margin-top:12px">${new Set(state.scans.map(x=>x.bag)).size?`บันทึกแล้ว ${new Set(state.scans.map(x=>x.bag)).size}/5 ใบ`:'ยังไม่มี Measurement'}</div>
   <div class="r03-mini-scan-table"><div class="head"><span>BAG</span><span>CPM</span><span>ABOVE BG</span><span>SIGNAL</span></div>
   ${['A','B','C','D','E'].map(x=>{const q=latest[x];return `<div><b>${x}</b><span>${q?q.cpm:'—'}</span><span>${q?(q.cpm-bg>0?'+':'')+(q.cpm-bg):'—'}</span><span>${q?(q.cpm>=bg*3?'HIGH':q.cpm>=bg*1.5?'ELEVATED':'BACKGROUND'):'WAIT'}</span></div>`}).join('')}</div>
  </div>
 </div>
 ${foot(`<button class="btn btn-primary" ${new Set(state.scans.map(x=>x.bag)).size<5?'disabled':''} onclick="next()">BUILD EVIDENCE WALL →</button>`)}`;
}
function finalEvidence(){
 const bg=18,latest={};state.scans.forEach(x=>latest[x.bag]=x);
 const contexts={A:'Personal item • no alert',B:'Elevated reading • declaration available',C:'Near background • normal context',D:'Nuclear medicine item • documents incomplete',E:'Elevated reading • context requires review'};
 return `<div class="stage-head"><div><span class="pill">BUILD EVIDENCE</span><h3>🧾 AIRPORT EVIDENCE WALL</h3></div><span class="pill">BACKGROUND ${bg} CPM</span></div>
 <p class="muted">ระบบสร้างตารางจาก Measurement ของคุณโดยอัตโนมัติ ไม่ต้องกรอกค่าซ้ำ</p>
 <div class="r03-evidence-table">
  <div class="thead"><span>BAG</span><span>CPM</span><span>ABOVE BG</span><span>SIGNAL</span><span>CONTEXT / DOCUMENT</span></div>
  ${['A','B','C','D','E'].map(x=>{const q=latest[x]||{};const sig=q.cpm>=bg*3?'HIGH':q.cpm>=bg*1.5?'ELEVATED':'BACKGROUND';return `<div class="${sig==='HIGH'?'hot':''}"><b>${x}</b><span>${q.cpm??'—'}</span><span>${q.cpm!=null?((q.cpm-bg>=0?'+':'')+(q.cpm-bg)):'—'}</span><span>${sig}</span><span>${contexts[x]}</span></div>`}).join('')}
 </div>
 <div class="r03-evidence-insight"><b>KEY IDEA</b><span>ค่าที่สูงกว่า Background เป็นเหตุผลให้ “ตรวจต่อ” แต่ยังไม่ใช่คำตัดสินว่าอันตราย ต้องเชื่อม Measurement + Context + เอกสาร</span></div>
 <div class="r03-synthesis-panel">
   <div class="r03-synthesis-head"><div><small>YOUR EVIDENCE SYNTHESIS</small><h4>สรุปหลักฐานสำคัญก่อนเข้าสู่ Inspector Atom</h4></div><span>CLAIM → EVIDENCE → WHY IT MATTERS</span></div>
   <textarea id="evidenceSummary" rows="4" placeholder="ตัวอย่าง: Bag D มีค่า CPM สูงกว่า Background อย่างชัดเจน และเอกสารขนส่งยังไม่ครบ จึงควรกักเพื่อตรวจสอบเพิ่มเติม...">${state.evidenceSummary||''}</textarea>
 </div>
 ${foot('<button class="btn btn-primary" onclick="saveEvidenceSummary()">SUBMIT EVIDENCE → INSPECTOR ATOM</button>')}`;
}
function saveEvidenceSummary(){const v=document.getElementById('evidenceSummary')?.value.trim()||'';if(v.length<20)return toastMsg('สรุป Evidence อย่างน้อย 20 ตัวอักษร');state.evidenceSummary=v;save();next()}
function polyaStage(){
 const q=qs[state.polyaStep];
 const d=state.scans.find(x=>x.bag==='D')||{};
 return `<div class="r03-debrief-console">
   <div class="r03-debrief-top">
     <div class="r03-atom-profile"><div class="ai-avatar">👨‍🔬</div><div><small>INSPECTOR ATOM • SECURITY DEBRIEF</small><h3>${q[0]}</h3><p>${q[1]}</p></div></div>
     <div class="r03-live-evidence">
       <small>LIVE EVIDENCE</small>
       <b>BAG D • ${d.cpm??'—'} CPM</b>
       <span>Background 18 CPM ${d.cpm!=null?'• '+(d.cpm/18).toFixed(1)+'× BG':''}</span>
     </div>
   </div>
   <div class="polya-track">${qs.map((_,i)=>`<i class="${i<state.polyaStep?'done':i===state.polyaStep?'active':''}"></i>`).join('')}</div>
   <div class="r03-debrief-body">
     <div class="r03-user-evidence"><small>YOUR EVIDENCE SYNTHESIS</small><p>${state.evidenceSummary||'ยังไม่มี Evidence Synthesis'}</p></div>
     <label class="r03-dark-field r03-debrief-answer">${q[0]}<textarea id="singlePolya" rows="5" placeholder="ตอบจากข้อมูล Measurement และ Evidence ของคุณ..."></textarea></label>
   </div>
   ${foot(`<button class="btn btn-primary" onclick="submitSinglePolya()">${state.polyaStep<3?'SAVE → NEXT DEBRIEF':'COMPLETE DEBRIEF → EVIDENCE CHECK'}</button>`)}
 </div>`;
}
function aiStage(){
 const d=state.scans.find(x=>x.bag==='D')||{};
 const chat=state.chat.length?state.chat:[{role:'ai',text:'ถ้า Detector ให้ค่ารังสีสูง แต่สิ่งของเป็นอุปกรณ์ Nuclear Medicine ที่ถูกกฎหมาย คุณยังต้องตรวจข้อมูลอะไรอีกก่อนตัดสินใจ?'}];
 return `<div class="r03-atom-console">
  <div class="r03-atom-console-head">
    <div class="r03-atom-profile"><div class="ai-avatar">👨‍🔬</div><div><small>INSPECTOR ATOM • FINAL EVIDENCE CHECK</small><h3>อย่าให้ “Detector Reading” กลายเป็นคำตัดสินอัตโนมัติ</h3></div></div>
    <div class="r03-live-evidence"><small>MEASUREMENT</small><b>${d.cpm??'—'} CPM</b><span>Background 18 CPM ${d.cpm!=null?'• '+(d.cpm/18).toFixed(1)+'× BG':''}</span></div>
  </div>
  <div class="r03-atom-console-grid">
    <div class="r03-atom-thread">
      ${chat.map(m=>`<div class="r03-message ${m.role==='user'?'user':'atom'}"><b>${m.role==='user'?'YOU':'INSPECTOR ATOM'}</b><p>${m.text}</p></div>`).join('')}
    </div>
    <div class="r03-atom-evidence-panel">
      <small>YOUR EVIDENCE SYNTHESIS</small>
      <p>${state.evidenceSummary||'—'}</p>
      <div class="r03-atom-rule"><b>VERIFY RULE</b><span>Measurement + Background + Context + Documentation</span></div>
    </div>
  </div>
  <div class="r03-chat-compose"><input id="chatText" placeholder="ตอบ Inspector Atom แบบสั้นและมีเหตุผล"><button class="btn btn-secondary" onclick="sendChat()">SEND</button><button class="btn btn-ghost" onclick="hint()">HINT ${state.hints}/3</button></div>
  ${foot('<button class="btn btn-primary" onclick="next()">SECONDARY ALARM → SECURITY BOARD</button>')}
 </div>`;
}
function reportStage(){
 const bg=18,latest={};state.scans.forEach(x=>latest[x.bag]=x);const d=latest.D||{};
 const ev=[
  ['measurement',`Bag D • ${d.cpm??'—'} CPM • ${d.cpm!=null?(d.cpm/bg).toFixed(1):'—'}× Background`],
  ['document','Nuclear Medicine context • Transport documents incomplete'],
  ['comparison','ตรวจครบ A–E • Background reference = 18 CPM'],
  ['portal','Gate B3 Portal Alarm • 0.85 μSv/h']
 ];
 return `<div class="r03-emergency-intercept">
   <div class="r03-emergency-left"><span class="alarm-light"></span><div><small>SECONDARY PORTAL ALERT</small><h2>EMERGENCY INTERCEPT</h2><p>Bag D is moving toward TG421 boarding route</p></div></div>
   <div class="r03-route-visual"><div class="route-node bag">🧳<b>BAG D</b></div><i>→</i><div class="route-node gate">🚪<b>GATE B3</b></div><i>→</i><div class="route-node plane">✈️<b>TG421</b></div></div>
   <div class="r03-countdown"><small>BOARDING CLOSES IN</small><b>02:00</b><span>CODE RED</span></div>
 </div>
 <div class="r03-before-after">
  <div><small>BEFORE</small><b>${state.prediction?.decision||'—'}</b><span>Initial Prediction</span></div>
  <i>→</i><div><small>MEASUREMENT</small><b>${d.cpm??'—'} CPM</b><span>Background 18 CPM ${d.cpm!=null?'• '+(d.cpm/bg).toFixed(1)+'× BG':''}</span></div>
  <i>→</i><div><small>FINAL</small><b>${state.report?.decision||'?'}</b><span>Security Board Decision</span></div>
 </div>
 <div class="r03-board-grid">
  <div>
   <h3>1 • SELECT EVIDENCE</h3><p class="muted">เลือกอย่างน้อย 2 ชิ้นก่อนออกคำสั่ง Intercept</p>
   <div class="r03-decision-evidence">${ev.map(x=>`<button class="${state.decisionEvidence.includes(x[0])?'active':''}" onclick="toggleDecisionEvidence('${x[0]}',this)"><span>${state.decisionEvidence.includes(x[0])?'✓':'○'}</span>${x[1]}</button>`).join('')}</div>
   <label class="r03-dark-field">CLAIM / ANALYSIS<textarea id="r1" rows="4" placeholder="คุณตีความ Evidence อย่างไร?"></textarea></label>
   <label class="r03-dark-field">SAFETY ACTION<textarea id="r2" rows="4" placeholder="ควรกัก ตรวจเอกสาร แยกพื้นที่ หรือดำเนินการอย่างไร?"></textarea></label>
  </div>
  <div>
   <h3>2 • AIRPORT SECURITY BOARD</h3>
   <div class="choice-grid r03-security-choices">
    <button class="choice ${state.report?.decision==='CLEAR'?'active':''}" onclick="chooseFinal(this,'CLEAR')">🟢 CLEAR<br><small>อนุญาตผ่าน</small></button>
    <button class="choice ${state.report?.decision==='HOLD'?'active':''}" onclick="chooseFinal(this,'HOLD')">🟡 HOLD<br><small>กักไว้ตรวจสอบ</small></button>
    <button class="choice ${state.report?.decision==='DENY'?'active':''}" onclick="chooseFinal(this,'DENY')">🔴 DENY<br><small>ไม่อนุญาต</small></button>
   </div>
   <label class="r03-dark-field">PHYSICS REASONING<textarea id="r3" rows="5" placeholder="เหตุใด Measurement + Background + Context จึงสนับสนุนคำตัดสิน?"></textarea></label>
   <button class="btn btn-primary r03-intercept-btn" onclick="submitReport()">⚠ CONFIRM DECISION & INTERCEPT BAG</button>
  </div>
 </div>${foot('',true)}`;
}
function toggleDecisionEvidence(k,el){state.decisionEvidence=state.decisionEvidence||[];if(state.decisionEvidence.includes(k))state.decisionEvidence=state.decisionEvidence.filter(x=>x!==k);else state.decisionEvidence.push(k);save();if(el)el.classList.toggle('active')}
function completeStage(){
 const b=state.breakdown,d=state.scans.find(x=>x.bag==='D')||{};
 return `<div class="complete reward-stage r03-secured-complete">
  <div class="r03-secured-banner"><small>${state.correct?'SECONDARY ALARM CLEARED':'SECURITY REVIEW REQUIRED'}</small><h1>${state.correct?'GATE B3 SECURED':'MISSION REVIEW'}</h1><p>${state.correct?'BAG D INTERCEPTED • FLIGHT TG421 CLEARED':'ตรวจ Evidence และ Final Decision อีกครั้ง'}</p></div>
  <div class="r03-before-after final">
   <div><small>BEFORE</small><b>${state.prediction?.decision||'—'}</b><span>Initial Prediction</span></div><i>→</i>
   <div><small>MEASUREMENT</small><b>${d.cpm??'—'} CPM</b><span>${d.cpm!=null?(d.cpm/18).toFixed(1)+'× Background':'Scanner Evidence'}</span></div><i>→</i>
   <div><small>FINAL</small><b>${state.report?.decision||'—'}</b><span>Evidence-based Decision</span></div>
  </div>
  <div class="final-score">${state.score}/100</div>
  <div class="score-grid"><div class="score"><span>Evidence</span><strong>${b.evidence}/25</strong></div><div class="score"><span>Measurement</span><strong>${b.simulation}/25</strong></div><div class="score"><span>Reasoning</span><strong>${b.notebook}/25</strong></div><div class="score"><span>Decision</span><strong>${b.decision}/25</strong></div></div>
  <div class="feedback">${state.feedback.map(x=>`<div class="${x.ok?'ok':'no'}">${x.ok?'✓':'•'} ${x.text}</div>`).join('')}</div>
  <div class="r03-verify-stamp">R-03 • VERIFY<br><b>RADIATION SECURITY OFFICER</b></div>
  ${state.correct?'<button class="btn btn-primary" onclick="finishR03AndUnlock()">RETURN TO HEADQUARTERS → R-04 UNLOCKED</button>':'<button class="btn btn-primary" onclick="resetGame()">REVISE & REPLAY R-03</button>'}
 </div>`;
}
function finishR03AndUnlock(){
  try{
    state.completed=true;
    save();
    if(window.RDAMaster && typeof window.RDAMaster.completeCaseAndReturn==='function'){
      window.RDAMaster.completeCaseAndReturn('r03',Number(state.score||0));
      return;
    }
    /* fallback uses the same handoff contract if master script has not loaded */
    const key='RDA_COMPLETION_HANDOFF';
    let list=[];try{list=JSON.parse(localStorage.getItem(key)||'[]')}catch(e){}
    if(!Array.isArray(list))list=[];
    if(!list.includes('r03'))list.push('r03');
    localStorage.setItem(key,JSON.stringify(list));
    localStorage.setItem('RDA_LAST_COMPLETED_CASE','r03');
    const chain=list.join(',');
    location.href='../../index.html?rda_case_complete=r03&rda_score='+encodeURIComponent(Number(state.score||0))+'&rda_chain='+encodeURIComponent(chain)+'#portal';
  }catch(e){
    console.error(e);
    location.href='../../index.html#portal';
  }
}
function openEvidence(n){if(n>state.opened.length)return toastMsg('ต้องเปิดหลักฐานก่อนหน้าตามลำดับ');if(!state.opened.includes(n)){state.opened.push(n);save();renderMission()}}
function submitEvidence(){let v=evidenceText.value.trim();if(v.length<20)return toastMsg('กรุณาอธิบายอย่างน้อย 20 ตัวอักษร');state.evidenceSummary=v;next()}
function moveScene(d){state.scene=Math.max(0,Math.min(4,state.scene+d));save();renderMission()}
function chooseDetector(x){state.detector=x;save();renderMission()}
function changeDistance(v){state.distance=Number(v);distanceLabel.textContent=v+' cm'}
function selectBag(x){state.selectedBag=x;save();renderMission()}
function scanBag(){
 if(!state.selectedBag)return toastMsg('เลือกกระเป๋าก่อน');
 const bg=18;
 const base={A:20,B:34,C:22,D:880,E:56}[state.selectedBag]||bg;
 const factor=Math.max(.20,100/state.distance);
 let cpm=Math.round(bg+(base-bg)*factor);
 if(state.detector==='Scintillation Detector')cpm=Math.round(bg+(cpm-bg)*1.15);
 if(state.detector==='Dosimeter')cpm=Math.round(bg+(cpm-bg)*.55);
 const dose=(cpm/1000).toFixed(2),above=cpm-bg,ratio=(cpm/bg).toFixed(1);
 if(window.cpmValue)cpmValue.textContent=cpm;
 if(window.doseValue)doseValue.textContent=dose+' μSv/h';
 if(window.aboveBgValue)aboveBgValue.textContent=(above>=0?'+':'')+above+' CPM';
 if(window.meterFill)meterFill.style.width=Math.min(100,cpm/9)+'%';
 const hot=cpm>=bg*3;
 if(window.scannerProbe)scannerProbe.classList.toggle('hot',hot);
 if(window.beepText)beepText.textContent=hot?'ติ๊กติ๊กติ๊กติ๊กติ๊ก!':cpm>=bg*1.5?'ติ๊ก... ติ๊ก... ติ๊กติ๊ก...':'ติ๊ก...';
 state.scans=state.scans.filter(x=>x.bag!==state.selectedBag);
 state.scans.push({bag:state.selectedBag,cpm,dose,aboveBg:above,ratio,detector:state.detector,distance:state.distance});
 save();
 if(window.scanFeedback){
   scanFeedback.className='notice '+(hot?'danger':cpm>=bg*1.5?'warning':'success');
   scanFeedback.innerHTML=`<b>BAG ${state.selectedBag}</b> • ${cpm} CPM • ${above>=0?'+':''}${above} above background • ${ratio}× BG<br><small>${hot?'สัญญาณสูงกว่าพื้นหลังอย่างชัดเจน ต้องใช้ Evidence อื่นประกอบการตัดสินใจ':cpm>=bg*1.5?'สูงกว่าพื้นหลัง แต่ยังไม่ใช่คำตัดสินอัตโนมัติ':'ใกล้ Background'}</small>`;
 }
 renderMission();
}
function sendChat(){let t=chatText.value.trim();if(!t)return;state.chat.push({role:'user',text:t});state.chat.push({role:'ai',text:'Medical Physicist: หลักฐานที่มั่นใจที่สุดควรเชื่อม Detector Reading, Laboratory Report และสถานะเอกสารเข้าด้วยกัน'});save();renderMission()}
function hint(){if(state.hints>=3)return toastMsg('ใช้ Hint ครบแล้ว');state.hints++;let hs=['Portal Monitor ยืนยันว่ามีรังสี แต่ยังไม่ระบุชนิด','Scanner Simulation ช่วยหาตำแหน่งแหล่งกำเนิด','อุปกรณ์การแพทย์อาจถูกต้อง แต่เอกสารการขนส่งยังจำเป็น'];state.chat.push({role:'ai',text:hs[state.hints-1]});save();renderMission()}
function chooseFinal(el,val){document.querySelectorAll('.choice').forEach(x=>x.classList.remove('active'));el.classList.add('active');state.report.decision=val;save()}
function submitReport(){
 const a=document.getElementById('r1')?.value.trim()||'',m=document.getElementById('r2')?.value.trim()||'',r=document.getElementById('r3')?.value.trim()||'',d=state.report?.decision;
 if((state.decisionEvidence||[]).length<2)return toastMsg('เลือก Evidence อย่างน้อย 2 ชิ้นก่อน');
 if(a.length<20||m.length<20||r.length<20||!d)return toastMsg('กรอก Security Board Decision ให้ครบ');
 state.report={analysis:a,measure:m,reason:r,decision:d};state.correct=d==='HOLD';
 const foundD=state.scans.some(x=>x.bag==='D'&&Number(x.cpm)>54);
 const uniqueBags=new Set(state.scans.map(x=>x.bag)).size;
 const evidence=Math.min(25,(state.opened.length===4?8:4)+(state.evidenceSummary.length>=35?6:3)+(foundD?6:0)+Math.min(5,(state.decisionEvidence||[]).length*2));
 const usedGoodDetector=state.scans.some(x=>x.detector==='Scintillation Detector'||x.detector==='Geiger Counter');
 const simulation=Math.min(25,(uniqueBags>=5?12:uniqueBags*2)+(foundD?8:0)+(usedGoodDetector?5:2));
 const notebookLens=Object.values(state.polya).filter(x=>x&&x.length>=20).length;
 const notebook=Math.min(25,notebookLens*6+(state.polya.v.length>=30?1:0));
 const hasSafety=/เอกสาร|ตรวจสอบ|กัก|ความปลอดภัย|แยกพื้นที่|เจ้าหน้าที่|hold/i.test(m+' '+r);
 const decision=Math.min(25,(state.correct?15:5)+(hasSafety?6:2)+(r.length>=45?4:2));
 state.breakdown={evidence,simulation,notebook,decision};state.score=evidence+simulation+notebook+decision;
 state.feedback=[
  {ok:state.correct,text:state.correct?'HOLD เหมาะสม: สัญญาณสูง + Nuclear Medicine context + เอกสารไม่ครบ จึงควรกักตรวจสอบ':'ควรแยก “ตรวจพบรังสี” ออกจาก “อันตรายแน่นอน” และเลือก HOLD เมื่อยังต้องตรวจเอกสาร/ความปลอดภัย'},
  {ok:foundD,text:foundD?'ยืนยัน Bag D ว่าสูงกว่า Background อย่างชัดเจน':'ควรใช้ Scanner เปรียบเทียบ Bag D กับ Background'},
  {ok:uniqueBags>=5,text:uniqueBags>=5?'ตรวจครบ A–E ทำให้การเปรียบเทียบมีความหมาย':'ควรตรวจครบ 5 ใบก่อนสรุป'},
  {ok:(state.decisionEvidence||[]).length>=2,text:'ใช้ Evidence หลายแหล่งประกอบ Final Decision'},
  {ok:notebookLens===4,text:notebookLens===4?'อธิบาย CLAIM → EVIDENCE → PHYSICS REASONING → RISK ครบ':'ควรทำ Debrief ให้ครบ 4 ขั้น'}
 ];
 state.completed=true;state.step=8;save();renderMission();
}
function restore(){if(document.getElementById('evidenceText'))evidenceText.value=state.evidenceSummary||'';if(document.getElementById('singlePolya')){const k=['a','p','s','v'][state.polyaStep];singlePolya.value=state.polya[k]||''}if(document.getElementById('r1')){r1.value=state.report.analysis||'';r2.value=state.report.measure||'';r3.value=state.report.reason||''}setTimeout(initScannerDrag,30)}
function renderPassport(){passportContent.innerHTML=state.completed&&state.correct?`<div class="complete"><div class="badge">✈️</div><h1>R-03 VERIFY Stamp</h1><p>+200 XP • Radiation Security Officer</p><div class="final-score">${state.score}/100</div></div>`:`<div class="notice">ยังไม่ได้รับ R-03 VERIFY Stamp ต้องส่งรายงานและตัดสินใจถูกต้องก่อน</div>`}
function renderTeacher(){teacherContent.innerHTML=`<h1>Teacher Center — R-03</h1><div class="score-grid"><div class="score"><span>Evidence</span><strong>${state.breakdown.evidence||0}/25</strong></div><div class="score"><span>Simulation</span><strong>${state.breakdown.simulation||0}/25</strong></div><div class="score"><span>Notebook</span><strong>${state.breakdown.notebook||0}/25</strong></div><div class="score"><span>Decision</span><strong>${state.breakdown.decision||0}/25</strong></div></div><div class="notice success" style="margin-top:14px"><b>Answer Key:</b> กระเป๋า D เป็นแหล่งกำเนิด Radioisotope สำหรับ Nuclear Medicine แต่ไม่มีเอกสารรับรองครบถ้วน จึงควร HOLD ไว้ตรวจสอบ ไม่ควรอนุญาตขึ้นเครื่องทันที</div>`}

function submitSinglePolya(){
 const v=document.getElementById('singlePolya').value.trim();
 if(v.length<20)return toastMsg('กรุณาอธิบายอย่างน้อย 20 ตัวอักษร');
 const keys=['a','p','s','v'];state.polya[keys[state.polyaStep]]=v;
 if(state.polyaStep<3){state.polyaStep++;save();renderMission()}else{state.polyaStep=3;save();next()}
}
function initScannerDrag(){
 const probe=document.getElementById('scannerProbe'),arena=document.querySelector('.conveyor');
 if(!probe||!arena)return;
 let dragging=false,offX=0,offY=0;
 const move=(clientX,clientY)=>{
  if(!dragging)return;
  const r=arena.getBoundingClientRect();
  let x=Math.max(0,Math.min(r.width-probe.offsetWidth,clientX-r.left-offX));
  let y=Math.max(0,Math.min(r.height-probe.offsetHeight,clientY-r.top-offY));
  probe.style.left=x+'px';probe.style.top=y+'px';
  updateLiveScanner(x+probe.offsetWidth/2,y+probe.offsetHeight/2);
 };
 probe.onpointerdown=e=>{dragging=true;probe.classList.add('dragging');probe.setPointerCapture(e.pointerId);offX=e.offsetX;offY=e.offsetY};
 probe.onpointermove=e=>move(e.clientX,e.clientY);
 probe.onpointerup=e=>{dragging=false;probe.classList.remove('dragging');try{probe.releasePointerCapture(e.pointerId)}catch(_){}};
}
function updateLiveScanner(px,py){
 const bags=[...document.querySelectorAll('.bag')];if(!bags.length)return;
 let nearest=null,min=Infinity;
 bags.forEach((b,i)=>{const ar=document.querySelector('.conveyor').getBoundingClientRect(),br=b.getBoundingClientRect();const bx=br.left-ar.left+br.width/2,by=br.top-ar.top+br.height/2;const d=Math.hypot(px-bx,py-by);if(d<min){min=d;nearest={bag:['A','B','C','D','E'][i],d}}});
 const hot=nearest&&nearest.bag==='D';let cpm=hot?Math.max(75,Math.round(95000/Math.max(45,nearest.d))):Math.max(18,Math.round(1700/Math.max(55,nearest.d)));
 cpmValue.textContent=cpm;doseValue.textContent=(cpm/1000).toFixed(2)+' μSv/h';if(window.aboveBgValue)aboveBgValue.textContent=((cpm-18)>=0?'+':'')+(cpm-18)+' CPM';meterFill.style.width=Math.min(100,cpm/8)+'%';
 const near=nearest&&nearest.d<125;scannerProbe.classList.toggle('hot',hot&&near);liveAlert.classList.toggle('show',hot&&near);
 if(hot&&nearest.d<65){beepText.textContent='ติ๊กติ๊กติ๊กติ๊กติ๊ก!';playTick(8)}
 else if(hot&&nearest.d<130){beepText.textContent='ติ๊ก... ติ๊ก... ติ๊กติ๊ก...';playTick(4)}
 else{beepText.textContent='ติ๊ก...'}
}
let audioCtx=null,lastTick=0;
function playTick(rate){
 const now=performance.now();if(now-lastTick<1000/rate)return;lastTick=now;
 try{
  audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();
  const o=audioCtx.createOscillator(),g=audioCtx.createGain();
  o.type='square';o.frequency.value=rate>6?1100:780;g.gain.setValueAtTime(.035,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+.045);
  o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+.05);
 }catch(_){}
}


const R03_FLOW=['discover','predict','test','evidence','explain','decide'];
function r03FlowKey(){
 if(state.step===0)return'discover';
 if(state.step===1)return state.prediction?.decision?'predict':'discover';
 if(state.step===2||state.step===3)return'test';
 if(state.step===4)return'evidence';
 if(state.step===5||state.step===6)return'explain';
 return'decide';
}
function updateR03IntegratedFlow(){
 const key=r03FlowKey(),idx=R03_FLOW.indexOf(key);
 document.querySelectorAll('#r03IntegratedFlow span').forEach((el,i)=>{el.classList.toggle('active',i===idx);el.classList.toggle('done',i<idx)});
}
const _r03RenderMissionIntegrated=renderMission;
renderMission=function(){_r03RenderMissionIntegrated();updateR03IntegratedFlow();};

function resetGame(){if(confirm('รีเซ็ต R-03 หรือไม่?')){localStorage.removeItem('rdkR03Standalone');location.reload()}}
document.addEventListener('mousemove',e=>{worldPhoto.style.transform=`scale(1.08) translate(${(e.clientX/innerWidth-.5)*10}px,${(e.clientY/innerHeight-.5)*8}px)`});setInterval(()=>{liveDose.textContent=(.10+Math.random()*.06).toFixed(2)+' μSv/h'},1500);renderGlobal();

/* ===== Living Airport environment only; mission logic unchanged ===== */
const cctvLabels=['CAM 03 • GATE B3','CAM 07 • CONVEYOR','CAM 11 • PORTAL','CAM 14 • CONTROL ROOM'];
let cctvIndex=0;
setInterval(()=>{
  cctvIndex=(cctvIndex+1)%cctvLabels.length;
  const el=document.getElementById('cctvCam');
  if(el)el.textContent=cctvLabels[cctvIndex];
},8000);

let ambientOn=false,ambientCtx=null,ambientNodes=[];
function toggleAmbient(){
  ambientOn=!ambientOn;
  const btn=document.getElementById('ambientToggle');
  btn.textContent=ambientOn?'🔇 ปิดเสียงสนามบิน':'🔊 Airport Ambience';
  if(ambientOn)startAirportAmbient();else stopAirportAmbient();
}
function startAirportAmbient(){
  try{
    ambientCtx=ambientCtx||new (window.AudioContext||window.webkitAudioContext)();
    stopAirportAmbient();
    const gain=ambientCtx.createGain();gain.gain.value=.018;gain.connect(ambientCtx.destination);
    const osc1=ambientCtx.createOscillator();osc1.type='sine';osc1.frequency.value=78;
    const osc2=ambientCtx.createOscillator();osc2.type='triangle';osc2.frequency.value=121;
    osc1.connect(gain);osc2.connect(gain);osc1.start();osc2.start();
    ambientNodes=[osc1,osc2,gain];
  }catch(_){}
}
function stopAirportAmbient(){
  ambientNodes.forEach(n=>{try{if(n.stop)n.stop();if(n.disconnect)n.disconnect()}catch(_){}});
  ambientNodes=[];
}
const _v3ShowPage=showPage;
showPage=function(id){
  _v3ShowPage(id);
  document.body.classList.toggle('airport-clear',id==='mission'&&state.completed&&state.correct);
  document.body.classList.toggle('airport-alert',id==='mission'&&!state.completed&&state.step<=4);
}
const _v3RenderMission=renderMission;
renderMission=function(){
  _v3RenderMission();
  document.body.classList.toggle('airport-clear',state.completed&&state.correct);
  document.body.classList.toggle('airport-alert',!state.completed&&state.step<=4);
}


function updateR03LowerDashboard(){const done=[state.opened.length>=4,state.scene>=4,new Set(state.scans.map(x=>x.bag)).size>=5,Object.values(state.polya).filter(Boolean).length>=4,state.completed].filter(Boolean).length;const pct=Math.round(done/5*100);const b=document.getElementById('r03CardProgress'),p=document.getElementById('r03DashPct'),r=document.getElementById('r03Radial'),x=document.getElementById('r03TotalXp');if(b)b.style.width=pct+'%';if(p)p.textContent=pct+'%';if(r)r.style.background=`conic-gradient(var(--green) 0 ${pct}%,#123043 ${pct}% 100%)`;if(x)x.textContent=state.completed&&state.correct?'500 / 500':'300 / 500'}const _saveR03=save;save=function(){_saveR03();updateR03LowerDashboard()};const _showR03=showPage;showPage=function(id){_showR03(id);updateR03LowerDashboard()};document.addEventListener('DOMContentLoaded',updateR03LowerDashboard);