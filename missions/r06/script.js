
const $=id=>document.getElementById(id);
const STATE_KEY='rdkR06FinalCommandV6';

const zones={
 LAB:{name:'Research Lab',risk:91},
 HOSPITAL:{name:'Hospital',risk:68},
 AIRPORT:{name:'Airport',risk:57},
 FACTORY:{name:'Food Factory',risk:39},
 TRUCK:{name:'Unknown Truck',risk:84}
};

const state=Object.assign({
 step:0,energy:100,score:0,prediction:'',predictionReason:'',confBefore:3,
 evidenceOpened:[],analysisChoice:'',resource:'',deployments:{},forecastTime:0,forecastRun:false,
 order:'',decisionReason:'',confAfter:4,revision:'',revisionReason:'',completed:false,
 points:{analysis:0,protect:0,forecast:0,decision:0,revision:0,efficiency:0}
},JSON.parse(localStorage.getItem(STATE_KEY)||'{}'));

function save(){localStorage.setItem(STATE_KEY,JSON.stringify(state));renderGlobal()}

function learningFx(kind,title,text,equation='',counter='',duration=1150){
 const fx=$('learningFx'); if(!fx)return Promise.resolve();
 fx.className='learning-fx show '+kind;
 $('fxKicker').textContent=kind==='collision'?'EVIDENCE UPDATE • T+15':'RDA COMMAND NETWORK';
 $('fxTitle').textContent=title;$('fxText').textContent=text||'';
 $('fxEquation').textContent=equation||'';$('fxCounter').textContent=counter||'';
 return new Promise(resolve=>setTimeout(()=>{fx.className='learning-fx';resolve()},duration));
}
function animateNumber(el,from,to,duration=700,suffix=''){
 const node=typeof el==='string'?$(el):el;if(!node)return;
 const start=performance.now();
 function frame(now){const p=Math.min(1,(now-start)/duration),v=from+(to-from)*p;node.textContent=(Number.isInteger(to)?Math.round(v):v.toFixed(1))+suffix;if(p<1)requestAnimationFrame(frame)}
 requestAnimationFrame(frame);
}

function toast(msg){const t=$('toast');t.textContent=msg;t.classList.remove('hidden');setTimeout(()=>t.classList.add('hidden'),1800)}
function renderGlobal(){
 $('energySide').textContent=state.energy;
 $('energyBar').style.width=state.energy+'%';
 $('sideScore').textContent=state.score;
 $('timelinePill').textContent=['T+00','T+03','T+06','T+10','T+12','T+15','FINAL'][state.step]||'FINAL';
 document.querySelectorAll('.mission-spine button').forEach((b,i)=>{b.classList.toggle('active',i===state.step);b.classList.toggle('done',i<state.step)});
}
function go(n){
 state.step=n;save();try{window.RDAMaster&&window.RDAMaster.pulse('r06',n,6)}catch(e){}
 document.querySelectorAll('.page').forEach((p,i)=>p.classList.toggle('active',i===n));
 window.scrollTo({top:0,behavior:'smooth'});
 if(n===6)runVerdictSequence();
}
function spend(cost){if(state.energy<cost){toast('พลังงานบัญชาการไม่เพียงพอ');return false}state.energy-=cost;return true}

$('startMissionBtn').onclick=()=>{$('opening').classList.add('hidden');document.querySelector('.map-stage')?.classList.add('command-scan');learningFx('alert','NATIONAL RADIATION EMERGENCY','5 INCIDENTS DETECTED • PRIORITY UNKNOWN','','LEVEL OMEGA',1250).then(()=>go(state.step||0))};
$('resetBtn').onclick=()=>{if(confirm('รีเซ็ต R-06 ทั้งหมดหรือไม่?')){localStorage.removeItem(STATE_KEY);location.reload()}};

document.querySelectorAll('#predictionChoices button').forEach(b=>b.onclick=()=>{document.querySelectorAll('#predictionChoices button').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');state.prediction=b.dataset.value;save()});
$('confBefore').oninput=e=>{$('confBeforeOut').textContent=e.target.value+'/5';state.confBefore=+e.target.value;save()};
$('confAfter').oninput=e=>{$('confAfterOut').textContent=e.target.value+'/5';state.confAfter=+e.target.value;save()};
$('lockPrediction').onclick=()=>{
 const r=$('predictionReason').value.trim();if(!state.prediction||r.length<10)return toast('เลือกพื้นที่และอธิบายเหตุผลอย่างน้อย 10 ตัวอักษร');
 state.predictionReason=r;go(1);renderEvidence();
};

const evidence=[
 {id:'A',title:'Detector Pattern',desc:'สัญญาณทะลุผ่านวัสดุบางได้ดี',tag:'PENETRATION'},
 {id:'B',title:'Portal Spectrum',desc:'พบ photon energy สูงกว่าพื้นหลัง',tag:'SPECTRUM'},
 {id:'C',title:'Surface Wipe',desc:'ไม่พบการปนเปื้อนเฉพาะผิวเด่นชัด',tag:'WIPE TEST'},
 {id:'D',title:'Distance Check',desc:'Dose rate ลดลงเมื่อเพิ่มระยะ',tag:'DISTANCE'},
 {id:'E',title:'Shield Test',desc:'Lead ลด detector count อย่างชัดเจน',tag:'SHIELD'}
];
function renderEvidence(){
 $('evidenceList').innerHTML=evidence.map(e=>`<div class="evidence-item"><button data-e="${e.id}">${e.id}</button><div><b>${e.title}</b><small>${e.desc}</small></div><em>${state.evidenceOpened.includes(e.id)?'VERIFIED':e.tag}</em></div>`).join('');
 document.querySelectorAll('[data-e]').forEach(b=>b.onclick=()=>{const id=b.dataset.e;if(!state.evidenceOpened.includes(id)){state.evidenceOpened.push(id);spend(4)}const e=evidence.find(x=>x.id===id);const dv=$('detectorVisual');dv?.classList.remove('scanning');void dv?.offsetWidth;dv?.classList.add('scanning');$('analysisReadout').innerHTML=`<b>EVIDENCE ${id}</b><br>${e.title} — ${e.desc}`;save();renderEvidence()});
}
document.querySelectorAll('[data-analyze]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-analyze]').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');state.analysisChoice=b.dataset.analyze;save()});
$('submitAnalyze').onclick=()=>{
 if(state.evidenceOpened.length<3)return toast('เปิดหลักฐานอย่างน้อย 3 รายการ');
 if(!state.analysisChoice)return toast('เลือกประเภทภัยคุกคามก่อน');
 state.points.analysis=(state.analysisChoice==='GAMMA_SOURCE'?14:5)+Math.min(6,state.evidenceOpened.length);
 state.score=calcScore();learningFx('lock','ระบุแหล่งกำเนิดสำเร็จ ✓','รูปแบบหลักฐานสอดคล้องกับรังสีแกมมาที่มีอำนาจทะลุทะลวงสูง','E1 + E3 + E5 → SOURCE PROFILE','+ '+state.points.analysis+' pts',1200).then(()=>go(2));
};

document.querySelectorAll('[data-resource]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-resource]').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');state.resource=b.dataset.resource;save()});
document.querySelectorAll('[data-zone]').forEach(b=>b.onclick=()=>{
 if(!state.resource)return toast('เลือกทรัพยากรก่อน');
 const zone=b.dataset.zone;
 state.deployments[zone]=state.resource;
 b.classList.add('assigned');
 let dose=2.6;
 if(zone==='LAB'&&state.resource==='SHIELD')dose=1.3;
 if(zone==='HOSPITAL'&&state.resource==='DETECTOR')dose=1.5;
 if(zone==='TRUCK'&&state.resource==='POLICE')dose=1.8;
 const oldDose=parseFloat($('teamDose').textContent)||2.6;animateNumber('teamDose',oldDose,dose,650);if(state.resource==='SHIELD'){$('shieldVisual')?.classList.add('active');document.querySelector('.deploy-status')?.classList.add('protected')}
 $('doseFill').style.height=Math.max(15,dose/2.6*80)+'%';
 $('deployFeedback').textContent=`ส่ง ${state.resource} ไปยัง ${zones[zone].name} • Team Dose ≈ ${dose.toFixed(1)} μSv`;
 spend(5);save()
});
$('submitDeploy').onclick=()=>{
 const d=state.deployments;
 let p=3;
 if(d.LAB==='SHIELD')p+=5;
 if(d.HOSPITAL==='DETECTOR')p+=4;
 if(d.TRUCK==='POLICE')p+=3;
 state.points.protect=Math.min(15,p);
 state.score=calcScore();learningFx('lock','ป้องกันทีมสำเร็จ ✓','การจัดการ เวลา • ระยะทาง • กำบัง ช่วยลดการรับรังสีของทีม','DOSE 2.6 → 1.4 μSv','PROTECTION LOCKED',1100).then(()=>go(3));
};

document.querySelectorAll('[data-time]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-time]').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');state.forecastTime=+b.dataset.time});
$('runForecast').onclick=()=>{
 if(!state.forecastTime)return toast('เลือกช่วงเวลา 6 / 12 / 24 ชั่วโมง');
 spend(8);document.querySelector('.forecast-visual')?.classList.add('forecasting');
 const vals={6:80,12:40,24:10};
 $('val6').textContent='80';$('val12').textContent='40';$('val24').textContent='10';
 $('bar6').style.setProperty('--h','50%');$('bar12').style.setProperty('--h','25%');$('bar24').style.setProperty('--h','6.25%');
 $('bar6').style.height='50%';$('bar12').style.height='25%';$('bar24').style.height='6.25%';
 $('activityValue').textContent=vals[state.forecastTime];
 $('forecastInsight').innerHTML=`<b>T+${state.forecastTime}h:</b> Activity ≈ ${vals[state.forecastTime]} units จาก Half-life 6 h`;
 state.forecastRun=true;state.points.forecast=15;state.score=calcScore();save();
 setTimeout(()=>learningFx('lock','ยืนยันการพยากรณ์การสลาย ✓','กัมมันตภาพลดลงครึ่งหนึ่งทุก 6 ชั่วโมง','160 → 80 → 40 → 10','T½ = 6 h',1250).then(()=>go(4)),700);
};

document.querySelectorAll('[data-order]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-order]').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');state.order=b.dataset.order;save()});
$('submitDecision').onclick=()=>{
 const r=$('decisionReason').value.trim();if(!state.order||r.length<20)return toast('เลือกมาตรการระดับประเทศและอธิบายหลักฐานอย่างน้อย 20 ตัวอักษร');
 state.decisionReason=r;
 let pts={RESTRICT:12,SHELTER:9,MONITOR:6,EVACUATE:3}[state.order]||0;
 if(/dose|exposure|population|context|ประชาชน|เวลา|พื้นที่/i.test(r))pts+=3;
 state.points.decision=Math.min(15,pts);state.score=calcScore();save();
 $('collisionOrder').textContent=state.order;$('collisionReason').textContent=r;learningFx('collision','ตรวจพบหลักฐานใหม่','ประชาชน 420 → 620 คน • กัมมันตภาพ 100% → 25%','HIGH HAZARD ≠ HIGHEST RISK','หลักฐานท้าทายคำตัดสิน',1450).then(()=>{go(5);setTimeout(()=>document.querySelector('.collision-stage')?.classList.add('collision-hit'),180)});
};

document.querySelectorAll('[data-revision]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-revision]').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');state.revision=b.dataset.revision;save()});
$('authorizeFinal').onclick=()=>{
 const r=$('revisionReason').value.trim();if(!state.revision||r.length<20)return toast('เลือก คงคำตัดสิน / ปรับคำตัดสิน และอธิบายอย่างน้อย 20 ตัวอักษร');
 state.revisionReason=r;if(state.revision==='REVISE'){$('riskShiftBar')?.parentElement?.parentElement?.classList.add('revised');animateNumber('riskShiftValue',78,43,900)}
 state.points.revision=(state.revision==='REVISE'?10:5)+(r.length>=60?5:2);
 state.points.efficiency=Math.max(5,20-Math.max(0,100-state.energy)/10);
 state.score=calcScore();save();go(6);
};

function calcScore(){
 return Math.round(
  (state.points.analysis||0)+(state.points.protect||0)+(state.points.forecast||0)+
  (state.points.decision||0)+(state.points.revision||0)+(state.points.efficiency||0)+
  Math.min(15,(state.evidenceOpened.length||0)*3)
 );
}
function runVerdictSequence(){
 learningFx('lock','กำลังจำลองผลกระทบจากคำสั่ง...','ระบบกำลังคำนวณผลของคำสั่งสุดท้ายต่อความเสี่ยงระดับประเทศ','','ความเสี่ยง 78 → 43',1500);
 document.querySelectorAll('.verdict-line').forEach(x=>x.classList.remove('on'));
 document.querySelectorAll('.verdict-line').forEach((x,i)=>setTimeout(()=>x.classList.add('on'),350+i*420));
 setTimeout(()=>{renderFinal();$('finalResult').classList.remove('hidden');$('finalResult').scrollIntoView({behavior:'smooth'})},2600);
}
function renderFinal(){
 const score=Math.min(100,state.score);
 $('finalScore').textContent=score;
 $('finalRank').textContent=score>=90?'ผู้บัญชาการระดับสูงสุด':score>=75?'ผู้บัญชาการระดับก้าวหน้า':score>=60?'ผู้บัญชาการภาคสนาม':'ผู้บัญชาการฝึกหัด';
 const rows=[
  ['ความถูกต้องของหลักฐาน',Math.min(20,(state.points.analysis||0)+(state.evidenceOpened.length>=4?3:0)),20],
  ['กลยุทธ์การป้องกัน',state.points.protect||0,15],
  ['การพยากรณ์การสลาย',state.points.forecast||0,15],
  ['การตัดสินใจระดับประเทศ',state.points.decision||0,15],
  ['คุณภาพการทบทวน',state.points.revision||0,15],
  ['ประสิทธิภาพการบัญชาการ',Math.round(state.points.efficiency||0),20],
 ];
 $('scoreBreakdown').innerHTML=rows.map(r=>`<div class="metric"><span>${r[0]}</span><b>${r[1]} / ${r[2]}</b><i style="--w:${Math.round(r[1]/r[2]*100)}%"></i></div>`).join('');
 $('finalStrength').textContent=score>=80?'คุณสามารถรวม Evidence จากหลาย Mission และเปลี่ยนเป็นคำสั่งระดับประเทศได้ดี':'คุณทำขั้นตอนครบ แต่การเชื่อม Evidence กับคำสั่งยังพัฒนาได้อีก';
 $('finalImprove').textContent=state.points.decision<12?'เพิ่มการใช้ Dose • Exposure • Population • Context ในคำตัดสิน':'ลดการใช้ทรัพยากรที่ไม่จำเป็นและอ้างหลักฐานให้เฉพาะเจาะจงขึ้น';
 $('finalConfidence').textContent=`${state.confBefore} → ${state.confAfter} ${state.confAfter>state.confBefore?'• Evidence increased confidence':''}`;
 $('finalEfficiency').textContent=`Energy remaining ${state.energy}/100 • ${Math.max(0,Math.round(state.points.efficiency||0))}/20 pts`;
 $('finalSummary').textContent=`Prediction: ${state.prediction||'-'} → Final Order: ${state.order||'-'} → ${state.revision||'-'}`;
}

$('saveReportBtn').onclick=()=>{
 const report=[
 'R-06 COMMAND — FINAL RADIATION CRISIS',
 `Final Score: ${state.score}/100`,
 `Prediction: ${state.prediction}`,
 `Prediction Reason: ${state.predictionReason}`,
 `Evidence: ${state.evidenceOpened.join(', ')}`,
 `Analysis: ${state.analysisChoice}`,
 `Deployments: ${JSON.stringify(state.deployments)}`,
 `Forecast Time: ${state.forecastTime} h`,
 `National Order: ${state.order}`,
 `Decision Reason: ${state.decisionReason}`,
 `Revision: ${state.revision}`,
 `Revision Reason: ${state.revisionReason}`,
 `Confidence: ${state.confBefore} → ${state.confAfter}`,
 `Energy Remaining: ${state.energy}/100`
 ].join('\n');
 const blob=new Blob([report],{type:'text/plain;charset=utf-8'}),a=document.createElement('a');
 a.href=URL.createObjectURL(blob);a.download='R06_Command_Evidence_Report.txt';a.click();URL.revokeObjectURL(a.href);
};
$('completeR06Btn').onclick=()=>{
 state.completed=true;save();
 const rec={
  completed:true,evaluated:true,score:Math.min(100,state.score),decision:state.order,
  reason:state.decisionReason,revision:state.revision,revisionReason:state.revisionReason,
  completedAt:new Date().toISOString()
 };
 try{
  localStorage.setItem('rdkR06',JSON.stringify(rec));
  localStorage.setItem('RDA_DECISION_R06',JSON.stringify({
   claim:'National radiation response must integrate evidence from R-01–R-05',
   evidence:'Source ID + Protection + Exposure + Decay + Risk',
   reasoning:state.revisionReason||state.decisionReason,
   risk:'NATIONAL RADIATION EMERGENCY',
   decision:state.order,
   confidence:state.confAfter,
   confidenceBefore:state.confBefore,
   initialScore:Math.min(100,state.score),
   revisedScore:Math.min(100,state.score),
   revisionSubmitted:true,
   updatedAt:new Date().toISOString()
  }));
  localStorage.setItem('RDA_LAST_COMPLETED_CASE','r06');
 }catch(e){}
 if(window.RDAMaster?.completeCaseAndReturn)window.RDAMaster.completeCaseAndReturn('r06',Math.min(100,state.score));
 else location.href='../../index.html#portal';
};

(function init(){
 $('predictionReason').value=state.predictionReason||'';
 $('confBefore').value=state.confBefore;$('confBeforeOut').textContent=state.confBefore+'/5';
 $('confAfter').value=state.confAfter;$('confAfterOut').textContent=state.confAfter+'/5';
 if(state.prediction)document.querySelector(`[data-value="${state.prediction}"]`)?.classList.add('selected');
 renderGlobal();renderEvidence();
 if(state.step>0){$('opening').classList.add('hidden');go(state.step)}
})();
