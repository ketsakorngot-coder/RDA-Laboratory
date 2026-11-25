
const phases=[{name:'รับแจ้งเหตุ',steps:[0,1]},{name:'เรียนรู้',steps:[2]},{name:'บัญชาการ',steps:[3,4]},{name:'ให้เหตุผล',steps:[5,6]},{name:'รายงาน',steps:[7,8]}];
const stepNames=['Emergency Alert','Evidence Locker','Radiation Emergency Animation','Emergency Command Simulation','Final Evidence','Polya Notebook','AI Commander','Emergency Action Report','Complete'];
const def={step:0,opened:[],selectedEvidence:-1,scene:0,windDirection:'EAST',resource:'Rescue Team',assignments:{},sim:null,polya:{a:'',p:'',s:'',v:''},polyaStep:0,chat:[],report:{},completed:false,correct:false,score:0,breakdown:{situation:0,response:0,evidence:0,resources:0,communication:0},feedback:[],timer:3600};
let state=Object.assign({},def,JSON.parse(localStorage.getItem('rdkR05Standalone')||'{}'));
let timerInterval=null;
let judgeTimer=null;
document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>showPage(b.dataset.page));
function showPage(id){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));document.getElementById(id).classList.add('active');document.querySelectorAll('[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===id));pageTitle.textContent=id==='mission'?'Case R-05 Mission':id==='passport'?'Research Passport':id==='teacher'?'Teacher Center':'National Emergency Command Center';if(id==='mission')renderMission();if(id==='passport')renderPassport();if(id==='teacher')renderTeacher()}
function save(){localStorage.setItem('rdkR05Standalone',JSON.stringify(state));renderGlobal()}
function toastMsg(t){toast.textContent=t;toast.classList.remove('hidden');setTimeout(()=>toast.classList.add('hidden'),2200)}
function acceptMission(){showPage('mission');state.step=0;save();renderMission();startTimer()}
function startTimer(){if(timerInterval)return;timerInterval=setInterval(()=>{if(state.timer>0&&!state.completed){state.timer--;save()}},1000)}
function fmt(s){const m=String(Math.floor(s/60)).padStart(2,'0'),sec=String(s%60).padStart(2,'0');return `${m}:${sec}`}
function phaseIndex(){return phases.findIndex(p=>p.steps.includes(state.step))}
function next(){if(state.step<8){state.step++;save();renderMission()}}function back(){if(state.step>0){state.step--;save();renderMission()}}
function foot(nextBtn,backBtn=true){return `<div class="stage-footer"><button class="btn btn-ghost" ${backBtn?'':'disabled'} onclick="back()">← ย้อนกลับ</button><div>${nextBtn}</div></div>`}
function renderGlobal(){hudTimer.textContent=fmt(state.timer);let safety=state.sim?.safety??92;hudSafety.textContent=safety+'%';sideXpBar.style.width=(state.completed&&state.correct?'100':'71')+'%';sideXp.textContent=(state.completed&&state.correct?'1050 / 1050':'750 / 1050')+' XP';totalXp.textContent=state.completed&&state.correct?'1050 / 1050':'750 / 1050';let done=[state.opened.length>=4,state.scene>=4,!!state.sim,Object.values(state.polya).filter(Boolean).length===4,state.completed].filter(Boolean).length;let pct=Math.round(done/5*100);dashPct.textContent=pct+'%';radial.style.background=`conic-gradient(var(--red) 0 ${pct}%,#12303a ${pct}% 100%)`}
function renderMission(){const pi=phaseIndex();phaseRoadmap.innerHTML=phases.map((p,i)=>`<div class="phase-node ${i<pi?'done':i===pi?'active':''}">${i<pi?'✓ ':''}${i+1}. ${p.name}</div>`).join('');let pct=Math.round(state.step/8*100);missionPct.textContent=pct+'%';missionBar.style.width=pct+'%';currentTask.textContent=stepNames[state.step];missionChecklist.innerHTML=phases.map((p,i)=>`<div><span>${i<pi?'✓':i===pi?'▶':'🔒'} ${p.name}</span><span>${i<pi?'ผ่านแล้ว':i===pi?'กำลังทำ':'ล็อก'}</span></div>`).join('');stage.innerHTML=stageHTML(state.step);restore()}
function stageHTML(i){return [missionBrief,evidenceStage,animationStage,simulationStage,finalEvidence,polyaStage,aiStage,reportStage,completeStage][i]()}
function missionBrief(){return `<div class="stage-head"><div><span class="pill danger-pill">TOP SECRET</span><h3>🚨 Emergency Alert</h3></div><span class="pill danger-pill">08:42 • LEVEL 5</span></div><p>ระบบหล่อเย็นของห้องทดลองเสียหาย ทำให้แหล่งกำเนิดรังสีเกิดการรั่วไหล ยังไม่ทราบรัศมีการแพร่กระจาย เจ้าหน้าที่ที่ได้รับผลกระทบ และความจำเป็นในการอพยพประชาชน</p><div class="notice danger"><b>ภารกิจภายใน 60 นาที:</b> ค้นหาแหล่งรั่วไหล ประเมินความเสี่ยง วางแผนอพยพ ป้องกันเจ้าหน้าที่ และรายงานผู้บัญชาการ</div>${foot('<button class="btn btn-primary" onclick="next()">รับคำสั่งและเปิดหลักฐาน →</button>',false)}`}
function evidenceStage(){
 const files=[
  {code:'A',icon:'☎️',title:'Emergency Call',thai:'สายแจ้งเหตุฉุกเฉิน',summary:'08:42 • Radiation Alarm LEVEL 5 Activated',detail:'ระบบแจ้งเตือนระดับ 5 ทำงานจากห้องทดลองหลัก พร้อมระบุตำแหน่งต้นทางของสัญญาณเตือน',type:'AUDIO LOG'},
  {code:'B',icon:'🗺️',title:'Radiation Map',thai:'แผนที่การแพร่กระจาย',summary:'LAB สูงมาก • Corridor สูง • Parking ปานกลาง',detail:'แผนที่ Heat Map แสดงการกระจายตัวของรังสี โดยค่ารังสีสูงสุดอยู่ที่ห้องทดลองและลดลงตามระยะทาง',type:'LIVE MAP'},
  {code:'C',icon:'👥',title:'Victim Report',thai:'รายงานผู้ประสบเหตุ',summary:'เจ้าหน้าที่ 4 คน • ระดับความเสี่ยงต่างกัน',detail:'ผู้ประสบเหตุอยู่คนละตำแหน่ง ต้องจัดลำดับช่วยเหลือตาม Dose Rate ระยะเวลา และอาการ',type:'MEDICAL DATA'},
  {code:'D',icon:'🌬️',title:'Weather Report',thai:'ข้อมูลอุตุนิยมวิทยา',summary:'ลมตะวันออก 15 km/h',detail:'ทิศทางลมมีผลต่อแนวการแพร่กระจาย จึงต้องวางเส้นทางอพยพออกจากแนวลม',type:'WEATHER FEED'}
 ];
 const selected=state.selectedEvidence??(state.opened.length?state.opened.length-1:-1);
 const current=selected>=0?files[selected]:null;
 return `<div class="stage-head">
   <div><span class="pill danger-pill">TOP SECRET EVIDENCE VAULT</span><h3>🗄️ ศูนย์วิเคราะห์หลักฐานฉุกเฉิน</h3></div>
   <div class="evidence-counter"><b>${state.opened.length}/4</b><small>FILES VERIFIED</small></div>
 </div>

 <div class="evidence-center">
   <aside class="evidence-folder-list">
     <div class="folder-list-head"><span>EVIDENCE FILES</span><b>CLASSIFIED</b></div>
     ${files.map((f,n)=>`
       <button class="evidence-folder ${state.opened.includes(n)?'open':''} ${n>state.opened.length?'locked':''} ${selected===n?'selected':''}" onclick="openEvidence(${n})">
         <span class="folder-code">E-${f.code}</span>
         <span class="folder-icon">${n>state.opened.length?'🔒':f.icon}</span>
         <span class="folder-copy"><b>${f.title}</b><small>${f.thai}</small></span>
         <span class="folder-state">${state.opened.includes(n)?'VERIFIED':n===state.opened.length?'READY':'LOCKED'}</span>
       </button>`).join('')}
   </aside>

   <section class="evidence-monitor">
     ${current?`
       <div class="monitor-topbar"><span>${current.type}</span><b>● LIVE ANALYSIS</b></div>
       <div class="monitor-body">
         <div class="monitor-visual">
           ${current.code==='A'?`
             <div class="emergency-call-panel">
               <div class="call-icon">☎</div>
               <div class="waveform-clean">${Array.from({length:30},(_,i)=>`<i style="height:${24+(i*19)%62}%"></i>`).join('')}</div>
               <div class="call-meta"><span>INCOMING EMERGENCY CALL</span><b>08:42:17</b></div>
             </div>`:''}
           ${current.code==='B'?`
             <div class="heatmap-clean">
               <div class="heat-ring r1"></div><div class="heat-ring r2"></div><div class="heat-ring r3"></div>
               <span class="heat-label lab">LAB</span><span class="heat-label corridor">CORRIDOR</span><span class="heat-label parking">PARKING</span>
               <div class="heat-legend"><i></i><span>0.01</span><span>0.1</span><span>1</span><span>10+</span></div>
             </div>`:''}
           ${current.code==='C'?`
             <div class="victim-grid-clean">
               ${[['A','48','CRITICAL','red'],['B','26','URGENT','orange'],['C','12','OBSERVE','yellow'],['D','4','SAFE','green']].map(v=>`
                 <div class="victim-card-clean ${v[3]}">
                   <div class="victim-head"><span>👤 ${v[0]}</span><b>${v[2]}</b></div>
                   <div class="victim-dose">${v[1]}<small>mSv</small></div>
                   <div class="victim-bar"><i></i></div>
                 </div>`).join('')}
             </div>`:''}
           ${current.code==='D'?`
             <div class="weather-clean">
               <div class="wind-compass"><span>N</span><span>E</span><span>S</span><span>W</span><i>➜</i></div>
               <div class="wind-lines"><b>➜</b><b>➜</b><b>➜</b><b>➜</b></div>
               <div class="weather-stats"><div><span>DIRECTION</span><b>EAST</b></div><div><span>SPEED</span><b>15 km/h</b></div><div><span>CONDITION</span><b>CLOUDY</b></div></div>
             </div>`:''}
         </div>

         <div class="monitor-analysis">
           <div class="analysis-class">CLASSIFIED // ${current.type}</div>
           <h2>${current.title}</h2>
           <p>${current.detail}</p>
           <div class="analysis-summary"><span>KEY DATA</span><b>${current.summary}</b></div>
           <div class="analysis-status-grid">
             <div><span>Containment</span><b>${state.sim?.containment??12}%</b></div>
             <div><span>Public Safety</span><b>${state.sim?.safety??64}%</b></div>
             <div><span>Team Exposure</span><b>${state.sim?.exposure??82}%</b></div>
           </div>
         </div>
       </div>
     `:`
       <div class="monitor-empty">
         <div class="empty-radar"><i></i><i></i><i></i><span>☢</span></div>
         <h2>เลือกแฟ้ม E-A เพื่อเริ่มวิเคราะห์</h2>
         <p>ระบบจะปลดล็อกแฟ้มตามลำดับและแสดงข้อมูลบนจอวิเคราะห์กลาง</p>
       </div>`}
   </section>
 </div>

 <div class="evidence-link-panel">
   <div class="link-title">EVIDENCE LINKING</div>
   <div class="link-chain">
     ${files.map((f,n)=>`<div class="link-node ${n<=selected?'active':''}"><span>${f.icon}</span><b>E-${f.code}</b></div>${n<files.length-1?'<i></i>':''}`).join('')}
   </div>
 </div>

 <div class="field evidence-answer">
   <label>หลักฐานใดแสดงว่าควรพิจารณาอพยพประชาชน และเพราะเหตุใด</label>
   <textarea id="evidenceText" rows="5"></textarea>
 </div>

 ${foot(`<button class="btn btn-primary" ${state.opened.length<4?'disabled':''} onclick="submitEvidence()">เข้าสู่ Operation Timeline →</button>`)}`;
}
const scenes=[
 {time:'08:42',title:'Leak Detected',icon:'☢️',desc:'เซนเซอร์ตรวจพบการรั่วไหลจากห้องทดลองหลัก',level:92,wind:0,status:'ALARM'},
 {time:'08:43',title:'Alarm Activated',icon:'🚨',desc:'ระบบเตือนภัยระดับ 5 ทำงานและปิดประตูนิรภัย',level:88,wind:15,status:'LOCKDOWN'},
 {time:'08:45',title:'Radiation Spread',icon:'🌫️',desc:'กลุ่มรังสีแพร่จาก LAB ไปยังทางเดินและลานจอดรถ',level:76,wind:15,status:'SPREADING'},
 {time:'08:48',title:'T-D-S Protocol',icon:'🛡️',desc:'ใช้ Time • Distance • Shielding ลดการรับรังสีของทีม',level:48,wind:15,status:'RESPONDING'},
 {time:'08:52',title:'Emergency Response',icon:'🚒',desc:'ปิดพื้นที่ ส่งทีมกู้ภัย และอพยพชุมชนออกจากแนวลม',level:22,wind:15,status:'CONTAINMENT'}
];
function animationStage(){
 let s=scenes[state.scene];
 return `<div class="stage-head"><div><span class="pill danger-pill">LIVE OPERATION TIMELINE</span><h3>🎬 Radiation Emergency Timeline</h3></div><span class="pill">${state.scene+1}/5 • ${s.time}</span></div>
 <div class="timeline-console">
   <div class="timeline-nav">${scenes.map((x,i)=>`<button class="timeline-node ${i<state.scene?'done':i===state.scene?'active':''}" onclick="jumpScene(${i})"><span>${x.time}</span><b>${x.icon}</b><small>${x.title}</small></button>`).join('')}</div>
   <div class="operation-visual scene-${state.scene}">
     <div class="reactor-core"><div class="core-symbol">☢</div><i></i><i></i><i></i></div>
     <div class="radiation-cloud" style="--spread:${s.level}%"></div>
     <div class="wind-stream">${s.wind?'<span>➜</span><span>➜</span><span>➜</span><span>➜</span>':''}</div>
     <div class="scene-data">
       <span class="scene-status">${s.status}</span><h2>${s.title}</h2><p>${s.desc}</p>
       <div class="live-meter"><label>Radiation Intensity <b>${s.level}%</b></label><div><i style="width:${s.level}%"></i></div></div>
       <div class="live-grid"><span>WIND <b>${s.wind||'-'} km/h</b></span><span>ZONE <b>${state.scene<3?'RED':'CONTROLLED'}</b></span><span>TIME <b>${s.time}</b></span></div>
     </div>
   </div>
 </div>
 <div class="training-controls"><button class="btn btn-secondary" onclick="moveScene(-1)">← เหตุการณ์ก่อนหน้า</button><button class="btn btn-secondary" onclick="moveScene(1)">เหตุการณ์ถัดไป →</button></div>
 ${foot(state.scene===4?'<button class="btn btn-primary" onclick="next()">เข้าสู่ Emergency Command Simulation →</button>':'<button class="btn btn-primary" disabled>ติดตาม Timeline ให้ครบ 5 เหตุการณ์</button>')}`;
}
function jumpScene(i){state.scene=Math.max(0,Math.min(4,i));save();renderMission()}
function simulationStage(){
 const zones=[
  {id:'lab',name:'ห้องทดลอง',level:'สูงมาก',dose:'2.31 mSv/h',icon:'☢️'},
  {id:'corridor',name:'ทางเดิน',level:'สูง',dose:'1.22 mSv/h',icon:'🚪'},
  {id:'parking',name:'ลานจอดรถ',level:'ปานกลาง',dose:'0.58 mSv/h',icon:'🅿️'},
  {id:'community',name:'ชุมชนตะวันออก',level:'แนวลม',dose:'0.24 mSv/h',icon:'🏘️'},
  {id:'control',name:'ห้องควบคุม',level:'ปลอดภัย',dose:'0.08 mSv/h',icon:'🖥️'}
 ];
 const victims=[
  ['A','🔴','48 mSv','วิกฤต'],['B','🟠','26 mSv','เร่งด่วน'],
  ['C','🟡','12 mSv','เฝ้าระวัง'],['D','🟢','4 mSv','ปลอดภัย']
 ];
 return `<div class="stage-head"><div><span class="pill danger-pill">LIVE EMERGENCY SIMULATION</span><h3>🧪 ศูนย์บัญชาการจำลองเหตุรังสีรั่วไหล</h3></div><span class="pill">${Object.keys(state.assignments).length}/5 ZONES</span></div>
 <div class="sim-command-layout">
  <aside class="sim-resource-console">
   <div class="sim-console-title">ทรัพยากรที่มีจำกัด</div>
   ${['Shield','Rescue Team','Ambulance','Police','Road Block'].map(x=>`
    <div class="sim-resource ${state.resource===x?'active':''}" draggable="true"
      ondragstart="dragResource(event,'${x}')" onclick="chooseResource('${x}')">
      <span>${iconFor(x)}</span><div><b>${resourceThai(x)}</b><small>${x}</small></div>
    </div>`).join('')}
   <div class="sim-instruction">ลากทรัพยากรไปวางบนแผนที่ หรือคลิกเลือกแล้วคลิกพื้นที่</div>
   <div class="wind-control"><span>ทิศทางลม</span><b>${state.windDirection||'EAST'}</b><button class="btn btn-ghost" onclick="changeWind()">เปลี่ยนทิศลม</button></div>
  </aside>
  <section class="sim-world">
   <div class="sim-alert-banner">⚠ RADIATION PLUME MOVING ${state.windDirection||'EAST'} • 15 km/h</div>
   <div class="sim-heat-layer ${state.sim?.good?'controlled':'danger'}"></div>
   <div class="sim-wind-arrows wind-${(state.windDirection||'EAST').toLowerCase()}"><i>➜</i><i>➜</i><i>➜</i><i>➜</i><i>➜</i></div>
   ${zones.map(z=>`<div class="sim-zone sim-zone-${z.id} ${state.assignments[z.id]?'assigned':''}"
    ondragover="event.preventDefault()" ondrop="dropResource(event,'${z.id}')" onclick="assign('${z.id}')">
    <div class="zone-icon">${z.icon}</div><b>${z.name}</b><small>${z.level}</small><span class="zone-dose">${z.dose}</span>
    ${state.assignments[z.id]?`<div class="assigned-unit">${iconFor(state.assignments[z.id])} ${resourceThai(state.assignments[z.id])}</div>`:'<div class="drop-hint">วางกำลังที่นี่</div>'}
   </div>`).join('')}
   <div class="victim-strip">${victims.map(v=>`<div class="victim-chip"><span>${v[1]}</span><b>เจ้าหน้าที่ ${v[0]}</b><small>${v[2]} • ${v[3]}</small></div>`).join('')}</div>
   <div class="sim-live-panel">
    <div><span>PUBLIC SAFETY</span><b>${state.sim?.safety??55}%</b><div class="track"><i class="fill safety-fill" style="width:${state.sim?.safety??55}%"></i></div></div>
    <div><span>TEAM EXPOSURE</span><b>${state.sim?.exposure??82}%</b><div class="track"><i class="fill exposure-fill" style="width:${state.sim?.exposure??82}%"></i></div></div>
    <div><span>CONTAINMENT</span><b>${state.sim?.containment??12}%</b><div class="track"><i class="fill containment-fill" style="width:${state.sim?.containment??12}%"></i></div></div>
   </div>
  </section>
 </div>
 <div class="sim-actions"><button class="btn btn-primary" onclick="runSimulation()">▶ EXECUTE EMERGENCY PLAN</button><button class="btn btn-secondary" onclick="clearAssignments()">↺ ล้างแผน</button></div>
 <div class="notice ${state.sim?.good?'success':state.sim?'danger':''}" style="margin-top:12px">${state.sim?state.sim.message:'วางทรัพยากรอย่างน้อย 4 พื้นที่ แล้วกด Execute Emergency Plan'}</div>
 ${foot(`<button class="btn btn-primary" ${state.sim?'':'disabled'} onclick="next()">เปิด Final Evidence →</button>`)}`;
}
function finalEvidence(){return `<div class="stage-head"><div><span class="pill">FINAL EVIDENCE</span><h3>🧾 Laboratory Analysis</h3></div></div><div class="notice success"><b>ผลวิเคราะห์:</b> การรั่วไหลสามารถควบคุมได้ภายใน 20 นาที หากใช้ฉากกำบัง ปิดพื้นที่เสี่ยง จัดลำดับช่วยเหลือ และอพยพตามทิศทางลมอย่างเหมาะสม</div><p>ข้อมูลนี้ยืนยันว่าการวางแผนเชิงระบบและการใช้ทรัพยากรอย่างเหมาะสมลดการรับรังสีของประชาชนและเจ้าหน้าที่ได้อย่างมาก</p>${foot('<button class="btn btn-primary" onclick="next()">เข้าสู่ Polya Notebook →</button>')}`}
const qs=[['Analyze','หลักฐานใดแสดงว่าควรอพยพประชาชน'],['Plan','คุณจะแบ่งทีมกู้ภัยอย่างไร'],['Solve','เสนอ Emergency Plan พร้อมเหตุผล'],['Verify','หากลมเปลี่ยนทิศ คุณจะปรับแผนอย่างไร']];
function polyaStage(){let q=qs[state.polyaStep];return `<div class="stage-head"><div><span class="pill">POLYA THINKING</span><h3>${q[0]}</h3></div><span class="pill">${state.polyaStep+1}/4</span></div><p>${q[1]}</p><div class="polya-track">${qs.map((_,i)=>`<i class="${i<state.polyaStep?'done':i===state.polyaStep?'active':''}"></i>`).join('')}</div><div class="field"><label>คำตอบของผู้บัญชาการ</label><textarea id="singlePolya" rows="8"></textarea></div>${foot(`<button class="btn btn-primary" onclick="submitPolya()">${state.polyaStep<3?'บันทึกและทำขั้นถัดไป →':'ส่ง Notebook →'}</button>`)}`}
function aiStage(){let chat=state.chat.length?state.chat:[{role:'ai',text:'AI Commander: คุณเลือกอพยพประชาชนก่อนหรือช่วยเจ้าหน้าที่ก่อน เพราะเหตุใด?'}];return `<div class="stage-head"><div><span class="pill">AI COMMANDER</span><h3>🤖 Crisis Decision Support</h3></div></div><div class="ai-chat"><div class="ai-avatar">🧠</div><div><div style="height:280px;overflow:auto;display:grid;gap:8px">${chat.map(m=>`<div class="notice ${m.role==='user'?'success':''}">${m.text}</div>`).join('')}</div><div class="field"><input id="chatText" placeholder="ตอบ AI Commander"></div><button class="btn btn-secondary" style="margin-top:8px" onclick="sendChat()">ส่งคำตอบ</button></div></div>${foot('<button class="btn btn-primary" onclick="next()">เข้าสู่ Emergency Action Report →</button>')}`}
function reportStage(){return `<div class="stage-head"><div><span class="pill">EMERGENCY ACTION REPORT</span><h3>📝 รายงานผู้บัญชาการ</h3></div></div><div class="final-grid"><div><div class="field"><label>วิเคราะห์สถานการณ์</label><textarea id="r1" rows="5"></textarea></div><div class="field"><label>แผนอพยพ</label><textarea id="r2" rows="5"></textarea></div></div><div><div class="field"><label>มาตรการป้องกันเจ้าหน้าที่</label><textarea id="r3" rows="5"></textarea></div><h3>ลำดับการตอบโต้หลัก</h3><div class="choice-grid"><button class="choice" onclick="chooseFinal(this,'BALANCED')">ควบคุมแหล่งรั่วไหล + ช่วยผู้เสี่ยงสูง + อพยพตามลม</button><button class="choice" onclick="chooseFinal(this,'EVAC_ONLY')">อพยพประชาชนทั้งหมดก่อน</button><button class="choice" onclick="chooseFinal(this,'RESCUE_ONLY')">ส่งทีมกู้ภัยเข้าไปทันทีโดยไม่รอ Shield</button></div><div class="field"><label>เหตุผลและข้อสรุป</label><textarea id="r4" rows="6"></textarea></div><button class="btn btn-primary" style="margin-top:12px" onclick="submitReport()">ยืนยันและส่งรายงาน</button></div></div>${foot('')}`}
function completeStage(){
  let b=state.breakdown;
  let grade=state.score>=95?'S':state.score>=90?'A+':state.score>=80?'A':state.score>=70?'B':'C';
  return `<div class="complete debrief-launch">
    <div class="mission-seal">🚨</div>
    <span class="pill danger-pill">R-05 MISSION DEBRIEF</span>
    <h1>${state.correct?'MISSION SUCCESS':'MISSION REVIEW'}</h1>
    <p class="muted">ระบบประเมินหลักฐาน แผนฉุกเฉิน การใช้ทรัพยากร และการสื่อสารเรียบร้อยแล้ว</p>
    <div class="final-score">${state.score}/100</div>
    <div class="grade-chip">GRADE ${grade}</div>
    <button class="btn btn-primary" onclick="openMissionDebrief()">📊 เปิด Mission Performance Dashboard</button>
    <button class="btn btn-secondary" onclick="openEmergencyReport()">📄 Emergency Action Report</button>
  </div>`;
}


function openEvidence(n){
 if(n>state.opened.length)return toastMsg('ต้องเปิดแฟ้มหลักฐานก่อนหน้าตามลำดับ');
 state.selectedEvidence=n;
 if(!state.opened.includes(n))state.opened.push(n);
 save();renderMission();
}
function submitEvidence(){
 const el=document.getElementById('evidenceText');
 const v=(el?.value||'').trim();
 if(v.length<20)return toastMsg('กรุณาอธิบายอย่างน้อย 20 ตัวอักษร');
 state.evidenceSummary=v;next();
}
function moveScene(d){state.scene=Math.max(0,Math.min(4,state.scene+d));save();renderMission()}
function iconFor(x){return {'Rescue Team':'🚒','Ambulance':'🚑','Police':'🚓','Shield':'🛡️','Road Block':'🚧'}[x]||'📦'}
function resourceThai(x){return {'Rescue Team':'ทีมกู้ภัย','Ambulance':'รถพยาบาล','Police':'ตำรวจควบคุมพื้นที่','Shield':'ฉากกำบังตะกั่ว','Road Block':'จุดปิดกั้น'}[x]||x}
function chooseResource(x){state.resource=x;save();renderMission()}
function dragResource(e,x){state.resource=x;e.dataTransfer.setData('text/plain',x)}
function dropResource(e,zone){e.preventDefault();const x=e.dataTransfer.getData('text/plain')||state.resource;state.resource=x;state.assignments[zone]=x;state.sim=null;save();renderMission()}
function assign(zone){state.assignments[zone]=state.resource;state.sim=null;save();renderMission()}
function clearAssignments(){state.assignments={};state.sim=null;save();renderMission()}
function changeWind(){const d=['EAST','SOUTH','WEST','NORTH'];const c=state.windDirection||'EAST';state.windDirection=d[(d.indexOf(c)+1)%d.length];state.sim=null;save();renderMission()}
function runSimulation(){
 if(Object.keys(state.assignments).length<4)return toastMsg('วางทรัพยากรอย่างน้อย 4 พื้นที่');
 const a=state.assignments;let score=0;const notes=[];
 if(a.lab==='Shield'){score+=25;notes.push('ควบคุมแหล่งรั่วไหลด้วย Shield')}else notes.push('ควรใช้ Shield ที่ห้องทดลอง');
 if(a.corridor==='Rescue Team'){score+=20;notes.push('ช่วยผู้เสี่ยงสูงด้วยทีมกู้ภัย')}else notes.push('ควรส่งทีมกู้ภัยไปทางเดิน');
 if(a.parking==='Ambulance'){score+=15;notes.push('วางรถพยาบาลในพื้นที่เข้าถึงง่าย')}else notes.push('ควรวางรถพยาบาลที่ลานจอดรถ');
 if(a.community==='Police'||a.community==='Road Block'){score+=20;notes.push('ควบคุมชุมชนในแนวลม')}else notes.push('ต้องควบคุมพื้นที่ชุมชน');
 if(a.control==='Police'||a.control==='Road Block')score+=10;
 score+=Math.min(10,Object.keys(a).length*2);
 if((state.windDirection||'EAST')==='EAST'&&(a.community==='Police'||a.community==='Road Block'))score+=5;
 const safety=Math.min(100,42+Math.round(score*.58));
 const exposure=Math.max(6,92-Math.round(score*.72));
 const containment=Math.min(100,18+Math.round(score*.82));
 const good=score>=70;
 state.sim={score,safety,exposure,containment,good,message:(good?'MISSION SUCCESS — ':'MISSION REVIEW — ')+notes.slice(0,3).join(' • ')};
 save();renderMission();
}
function submitPolya(){
 const el=document.getElementById('singlePolya');const v=(el?.value||'').trim();
 if(v.length<20)return toastMsg('กรุณาอธิบายอย่างน้อย 20 ตัวอักษร');
 const k=['a','p','s','v'][state.polyaStep];state.polya[k]=v;
 if(state.polyaStep<3){state.polyaStep++;save();renderMission()}else next();
}
function sendChat(){
 const el=document.getElementById('chatText');const t=(el?.value||'').trim();if(!t)return;
 state.chat.push({role:'user',text:t});
 state.chat.push({role:'ai',text:'AI Commander: หากมีเพียง 2 ทีม คุณจะจัดลำดับช่วยเหลือโดยอ้าง Dose Rate ตำแหน่ง และทิศทางลมอย่างไร?'});
 save();renderMission();
}
function chooseFinal(el,x){document.querySelectorAll('.choice').forEach(b=>b.classList.remove('active'));el.classList.add('active');state.report.final=x;save()}
function submitReport(){
 const a=(document.getElementById('r1')?.value||'').trim();
 const b=(document.getElementById('r2')?.value||'').trim();
 const c=(document.getElementById('r3')?.value||'').trim();
 const d=(document.getElementById('r4')?.value||'').trim();
 const f=state.report.final;
 if([a,b,c,d].some(x=>x.length<20)||!f)return toastMsg('กรุณากรอกรายงานให้ครบ');
 state.report={analysis:a,evac:b,protect:c,reason:d,final:f};state.correct=f==='BALANCED';
 const situation=Math.min(20,8+(a.length>=60?6:3)+(/ลม|ทิศ|dose|รังสี/i.test(a)?6:2));
 const response=Math.min(20,(state.sim?.good?12:5)+(/อพยพ|ปิดพื้นที่|ช่วย/i.test(b+' '+d)?8:3));
 const evidence=Math.min(20,(state.opened.length===4?10:5)+((state.evidenceSummary||'').length>=35?5:2)+(/แผนที่|ลม|ผู้ประสบเหตุ|dose/i.test(d)?5:2));
 const resources=Math.min(20,(Object.keys(state.assignments).length>=5?8:5)+(state.sim?.good?8:3)+(/shield|ฉากกำบัง|เวลา|ระยะ/i.test(c)?4:1));
 const communication=Math.min(20,(d.length>=70?10:5)+(/เหตุผล|เพราะ|ดังนั้น|จึง/i.test(d)?5:2)+(state.chat.length>=2?5:2));
 state.breakdown={situation,response,evidence,resources,communication};
 state.score=situation+response+evidence+resources+communication;
 state.feedback=[
  {ok:state.sim?.good,text:'แผน Simulation ลดความเสี่ยงได้เหมาะสม'},
  {ok:f==='BALANCED',text:'ลำดับตอบโต้สมดุลระหว่างควบคุมแหล่ง ช่วยผู้เสี่ยง และอพยพ'},
  {ok:/shield|ฉากกำบัง|เวลา|ระยะ/i.test(c),text:'ใช้หลัก Time Distance Shielding ในการป้องกันทีม'},
  {ok:state.correct,text:'ข้อสรุปสอดคล้องกับหลักฐานและสถานการณ์'}
 ];
 state.completed=true;state.step=8;save();renderMission();
 if(typeof openMissionDebrief==='function')setTimeout(openMissionDebrief,900);
}
function restore(){
 const ev=document.getElementById('evidenceText');if(ev)ev.value=state.evidenceSummary||'';
 const po=document.getElementById('singlePolya');if(po)po.value=state.polya[['a','p','s','v'][state.polyaStep]]||'';
 const r1=document.getElementById('r1');if(r1){r1.value=state.report.analysis||'';document.getElementById('r2').value=state.report.evac||'';document.getElementById('r3').value=state.report.protect||'';document.getElementById('r4').value=state.report.reason||''}
}
function renderPassport(){passportContent.innerHTML=state.completed&&state.correct?`<div class="complete"><div style="font-size:110px">🚨</div><h1>Radiation Emergency Stamp</h1><p>+300 XP • Radiation Emergency Specialist</p><div class="final-score">${state.score}/100</div></div>`:`<div class="notice">ยังไม่ได้รับ Radiation Emergency Stamp</div>`}
function renderTeacher(){teacherContent.innerHTML=`<h1>Teacher Center — R-05</h1><div class="score-grid"><div class="score"><span>Situation</span><strong>${state.breakdown.situation||0}/20</strong></div><div class="score"><span>Response</span><strong>${state.breakdown.response||0}/20</strong></div><div class="score"><span>Evidence</span><strong>${state.breakdown.evidence||0}/20</strong></div><div class="score"><span>Resources</span><strong>${state.breakdown.resources||0}/20</strong></div><div class="score"><span>Communication</span><strong>${state.breakdown.communication||0}/20</strong></div></div>`}
function resetGame(){if(confirm('รีเซ็ต R-05 หรือไม่?')){localStorage.removeItem('rdkR05Standalone');location.reload()}}

function submitJudgeReport(){
  state.correct=true;
  state.breakdown={situation:19,response:19,evidence:18,resources:20,communication:18};
  state.score=94;
  state.feedback=[
    {ok:true,text:'วิเคราะห์ทิศทางลมและระดับรังสีได้ถูกต้อง'},
    {ok:true,text:'แผนตอบโต้สมดุลระหว่างควบคุมแหล่ง ช่วยผู้ประสบเหตุ และอพยพ'},
    {ok:true,text:'ใช้ทรัพยากรจำกัดได้มีประสิทธิภาพ'},
    {ok:true,text:'สื่อสารเหตุผลเชิงวิทยาศาสตร์ชัดเจน'}
  ];
  state.completed=true;state.step=8;save();renderMission();
  setTimeout(()=>openEmergencyReport(),1200);
}

function renderAchievements(){
  const grid=document.getElementById('achievementGrid');
  if(!grid)return;
  const list=[
    ['☢️','Radiation Rookie','ผ่าน R-01',true],
    ['🏥','Medical Specialist','ผ่าน R-02',true],
    ['✈️','Airport Inspector','ผ่าน R-03',true],
    ['🍎','Food Safety Investigator','ผ่าน R-04',true],
    ['🚨','Emergency Commander','ผ่าน R-05',state.completed&&state.correct]
  ];
  grid.innerHTML=list.map(x=>`<div class="achievement ${x[3]?'unlocked':''}"><div class="ach-icon">${x[0]}</div><b>${x[1]}</b><small>${x[2]}</small></div>`).join('');
}

const originalRenderPassport=renderPassport;
renderPassport=function(){
  originalRenderPassport();
  renderAchievements();
  if(state.completed){
    passportContent.innerHTML+=`<div style="margin-top:16px"><button class="btn btn-primary" onclick="openEmergencyReport()">📄 เปิด Emergency Action Report</button></div>`;
  }
}

function openEmergencyReport(){
  const report=document.getElementById('printableReport');
  const b=state.breakdown||{};
  const r=state.report||{};
  report.innerHTML=`<div class="print-report">
    <div class="report-header"><div><h1>Emergency Action Report</h1><p>Radiation Detective Agency • Case R-05</p></div><img src="../../assets/logo.png"></div>
    <div class="report-grid">
      <div class="report-box"><b>Mission</b><p>The Nuclear Laboratory Accident</p></div>
      <div class="report-box"><b>Commander</b><p>นักสืบเกศกร</p></div>
      <div class="report-box"><b>Final Score</b><div class="report-score">${state.score||0}/100</div></div>
      <div class="report-box"><b>Result</b><p>${state.correct?'MISSION SUCCESS':'MISSION REVIEW'}</p></div>
    </div>
    <h2 style="margin-top:20px">Score Breakdown</h2>
    <div class="report-grid">
      <div class="report-box">Situation Analysis: <b>${b.situation||0}/20</b></div>
      <div class="report-box">Emergency Response: <b>${b.response||0}/20</b></div>
      <div class="report-box">Evidence Use: <b>${b.evidence||0}/20</b></div>
      <div class="report-box">Resource Management: <b>${b.resources||0}/20</b></div>
      <div class="report-box">Communication: <b>${b.communication||0}/20</b></div>
    </div>
    <h2 style="margin-top:20px">Emergency Plan</h2>
    <div class="report-box"><b>Situation Analysis</b><p>${r.analysis||'-'}</p></div>
    <div class="report-box"><b>Evacuation Plan</b><p>${r.evac||'-'}</p></div>
    <div class="report-box"><b>Officer Protection</b><p>${r.protect||'-'}</p></div>
    <div class="report-box"><b>Conclusion</b><p>${r.reason||'-'}</p></div>
    <h2 style="margin-top:20px">AI Feedback</h2>
    <div class="report-box">${(state.feedback||[]).map(x=>`<p>${x.ok?'✓':'✕'} ${x.text}</p>`).join('')}</div>
  </div>`;
  document.getElementById('reportModal').classList.remove('hidden');
}
function closeReport(){document.getElementById('reportModal').classList.add('hidden')}
