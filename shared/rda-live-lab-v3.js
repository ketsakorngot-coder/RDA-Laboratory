/* RDA LIVE SCIENTIFIC LAB V3 — Student experience only. Does not edit backend/dashboard schemas. */
(()=>{
  const path=location.pathname.replace(/\\/g,'/');
  const m=path.match(/\/missions\/(r0[1-6])\//i); if(!m)return;
  const mid=m[1].toLowerCase();
  const num=mid.slice(1);
  const $=id=>document.getElementById(id);
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let trials=[];
  const config={
    r01:{question:'รังสีปริศนานี้คือชนิดใด?',objective:'ใช้การทะลุผ่านและค่าจากเครื่องตรวจวัดเพื่อจำแนก α, β หรือ γ',mode:'shield'},
    r02:{question:'แผนใดให้ผลต่อเป้าหมายสูง แต่ลดผลต่อเนื้อเยื่อปกติ?',objective:'เปรียบเทียบชนิดรังสี ตำแหน่งเป้าหมาย และการกำบังจากข้อมูลเชิงปริมาณ',mode:'therapy'},
    r03:{question:'ระยะทางและเวลาทำให้การได้รับรังสีเปลี่ยนอย่างไร?',objective:'สร้างหลักฐานจากความสัมพันธ์ระยะทาง–ความเข้มและเวลารับรังสี',mode:'exposure'},
    r04:{question:'หลังเวลาผ่านไป สารกัมมันตรังสีเหลือเท่าใด?',objective:'ค้นพบความหมายของครึ่งชีวิตจากแบบจำลองและกราฟการสลาย',mode:'decay'},
    r05:{question:'เมื่อหลักฐานหลายแหล่งไม่ตรงกัน ควรเชื่ออะไรและตัดสินใจอย่างไร?',objective:'ชั่งน้ำหนักความสอดคล้อง ความน่าเชื่อถือ และข้อจำกัดของหลักฐานหลายชนิด',mode:'multisource'},
    r06:{question:'คุณจะควบคุมวิกฤตรังสีโดยใช้หลักฐานจากเครื่องมือใดบ้าง?',objective:'ประยุกต์ความรู้ R-01–R-05 เพื่อระบุแหล่ง ประเมินความเสี่ยง และเลือกมาตรการ',mode:'final'}
  }[mid];

  function evidence(test,observation,value){
    const t=$(mid+'EvidenceTest'),o=$(mid+'EvidenceObservation'),v=$(mid+'EvidenceValue'),save=$(mid+'SaveEvidence');
    if(!t||!o||!v||!save)return false;
    t.value=test;o.value=observation;v.value=value;save.click();
    return true;
  }
  function addTrial(test,observation,value){
    const key=test+'|'+value;
    if(trials.some(x=>x.key===key))return;
    trials.push({key,test,observation,value}); evidence(test,observation,value); renderTrials();
    localStorage.setItem('RDA_LIVE_LAB_'+mid.toUpperCase(),JSON.stringify({trials,updatedAt:new Date().toISOString()}));
  }
  function renderTrials(){
    const host=q('.rda-trials'); if(!host)return;
    host.innerHTML=trials.map((x,i)=>`<div class="rda-trial"><b>T${i+1}</b><span>${esc(x.test)}</span><em>${esc(x.value)}</em></div>`).join('')||'<small>ยังไม่มี Trial — ลงมือทดลองเพื่อสร้าง Evidence</small>';
    const p=q('.rda-lab-proceed'); if(p)p.disabled=trials.length<2;
  }
  function intro(){return `<div class="rda-live-intro"><div><small>MISSION QUESTION • LIVE LAB</small><b>${config.question}</b><p>ไม่ต้องกรอกผลทดลอง ระบบจะบันทึกตัวแปร การวัด และ Trial ให้อัตโนมัติ</p></div><div class="rda-live-objective"><small>MISSION OBJECTIVE</small><b>${config.objective}</b></div></div>`}
  function shell(stage,panel){return `${intro()}<div class="rda-live-lab"><div class="rda-lab-stage">${stage}</div><aside class="rda-lab-panel">${panel}<div class="rda-trials"></div><div class="rda-evidence-auto">✓ ทุก Trial จะถูกส่งเป็น Evidence อัตโนมัติ — นักเรียนมีหน้าที่ “ทดลองและเลือกหลักฐาน” ไม่ใช่คัดลอกตัวเลข</div><button class="rda-primary rda-lab-proceed" disabled>เปิด EVIDENCE BOARD →</button></aside></div>`}

  function shieldLab(sec){
    sec.insertAdjacentHTML('afterbegin',shell(`<div class="rda-source-orb">☢</div><div class="rda-beam-line"></div><div class="rda-shield-visual" id="liveShield"></div><div class="rda-detector"><small>GEIGER COUNTER</small><strong id="liveCount">— CPM</strong><i id="liveMeter"></i><small id="liveDelta">เลือกวัสดุแล้ว RUN TEST</small></div>`,`<h4>SHIELD INVESTIGATION</h4><small>ทดสอบวัสดุทีละชนิด แล้วเปรียบเทียบ Count Rate</small><div class="rda-control-label"><span>วัสดุกั้น</span><b id="shieldName">NONE</b></div><div class="rda-live-options" id="shieldOpts"><button data-s="None">No shield</button><button data-s="Paper">Paper</button><button data-s="Aluminium">Aluminium</button><button data-s="Lead">Thick lead</button></div><button class="rda-run-button" id="runShield">▶ RUN DETECTOR TEST</button>`));
    const vals={None:4520,Paper:4300,Aluminium:3950,Lead:620};let s='None';
    qa('#shieldOpts button').forEach(b=>b.onclick=()=>{s=b.dataset.s;qa('#shieldOpts button').forEach(x=>x.classList.toggle('active',x===b));$('shieldName').textContent=s;$('liveShield').style.opacity=s==='None'?'.08':'1';$('liveShield').style.width=s==='Paper'?'9px':s==='Aluminium'?'18px':s==='Lead'?'42px':'4px'});q('#shieldOpts button').click();
    $('runShield').onclick=()=>{let c=vals[s],drop=((4520-c)/4520*100).toFixed(1);$('liveCount').textContent=c.toLocaleString()+' CPM';$('liveMeter').style.setProperty('--meter',Math.min(100,c/4520*100)+'%');$('liveDelta').textContent=s==='None'?'Baseline measurement':'ลดลง '+drop+'% จาก baseline';addTrial('Shield test: '+s,`ตรวจวัดหลังใช้ ${s} ได้ ${c.toLocaleString()} CPM`,`${c.toLocaleString()} CPM • ↓${drop}%`)};
  }
  function therapyLab(sec){
    sec.insertAdjacentHTML('afterbegin',shell(`<div class="rda-source-orb" style="left:10%">☢</div><div class="rda-beam-line"></div><div class="rda-shield-visual" style="left:58%"></div><div class="rda-detector"><small>TREATMENT MONITOR</small><strong id="tumorDoseLive">—</strong><small>TUMOR DOSE</small><strong id="healthyDoseLive" style="font-size:20px">—</strong><small>HEALTHY TISSUE</small></div>`,`<h4>TREATMENT / SHIELD DESIGN</h4><small>สร้างแผนอย่างน้อย 2 แบบ แล้วเปรียบเทียบผล</small><div class="rda-control-label"><span>Radiation</span></div><div class="rda-live-options" id="srcOpts"><button>Alpha</button><button>Beta</button><button>Gamma</button></div><div class="rda-control-label"><span>Target depth</span></div><div class="rda-live-options" id="depthOpts"><button>ตื้น</button><button>ปานกลาง</button><button>ลึก</button></div><div class="rda-control-label"><span>Shield</span></div><div class="rda-live-options" id="therShield"><button>ไม่มี</button><button>Aluminium</button><button>Lead</button></div><button class="rda-run-button" id="runTherapy">▶ RUN TREATMENT MODEL</button>`));
    let src='Gamma',depth='ลึก',shield='Lead'; const bind=(id,set)=>qa('#'+id+' button').forEach(b=>b.onclick=()=>{qa('#'+id+' button').forEach(x=>x.classList.remove('active'));b.classList.add('active');set(b.textContent.trim())});bind('srcOpts',v=>src=v);bind('depthOpts',v=>depth=v);bind('therShield',v=>shield=v);q('#srcOpts button:nth-child(3)').click();q('#depthOpts button:nth-child(3)').click();q('#therShield button:nth-child(3)').click();
    $('runTherapy').onclick=()=>{let tumor=55,healthy=45;if(src==='Gamma'&&depth==='ลึก')tumor=96;else if(src==='Beta'&&depth==='ปานกลาง')tumor=82;else if(src==='Alpha'&&depth==='ตื้น')tumor=75;if(shield==='Lead')healthy=Math.max(15,healthy-18);if(shield==='ไม่มี')healthy+=15;if(src==='Gamma'&&shield==='Lead')healthy=18;$('tumorDoseLive').textContent=tumor+'%';$('healthyDoseLive').textContent=healthy+'%';let good=tumor>=90&&healthy<=25;addTrial(`${src} • ${depth} • ${shield}`,`Tumor ${tumor}% / Healthy ${healthy}% ${good?'— เป้าหมายดีและเนื้อเยื่อปกติต่ำ':'— ยังต้องปรับแผน'}`,`T ${tumor}% • H ${healthy}%`)};
  }
  function exposureLab(sec){
    sec.insertAdjacentHTML('afterbegin',shell(`<div class="rda-source-orb">☢</div><div class="rda-dose-core"><div class="rda-dose-ring" id="doseRing"><div class="rda-dose-value"><strong id="doseLive">—</strong><small>RELATIVE DOSE</small></div></div></div>`,`<h4>DISTANCE × TIME LAB</h4><small>เปลี่ยนทีละตัวแปรและวัดผล เพื่อเห็นความสัมพันธ์จริง</small><div class="rda-control-label"><span>Distance</span><b id="distOut">1.0 m</b></div><input class="rda-live-range" id="distRange" type="range" min="0.5" max="5" step="0.5" value="1"><div class="rda-control-label"><span>Exposure time</span><b id="timeOut">10 min</b></div><input class="rda-live-range" id="timeRange" type="range" min="1" max="60" step="1" value="10"><button class="rda-run-button" id="runExposure">▶ MEASURE EXPOSURE</button>`));
    const d=$('distRange'),t=$('timeRange'); const out=()=>{$('distOut').textContent=(+d.value).toFixed(1)+' m';$('timeOut').textContent=t.value+' min'};d.oninput=t.oninput=out;out();
    $('runExposure').onclick=()=>{let r=+d.value,min=+t.value,rate=400/(r*r),dose=rate*min/60;$('doseLive').textContent=dose.toFixed(1);$('doseRing').style.setProperty('--dosep',Math.min(100,dose/80*100)+'%');addTrial(`Distance ${r.toFixed(1)} m • Time ${min} min`,`อัตราสัมพัทธ์ ${rate.toFixed(1)} units/h และ dose สะสม ${dose.toFixed(1)} units`,`Rate ${rate.toFixed(1)} • Dose ${dose.toFixed(1)}`)};
  }
  function decayLab(sec){
    const nuclei=Array.from({length:50},(_,i)=>`<i class="rda-nucleus" data-n="${i}"></i>`).join('');
    sec.insertAdjacentHTML('afterbegin',shell(`<div class="rda-nuclei-field">${nuclei}</div><div class="rda-detector"><small>NUCLEI REMAINING</small><strong id="remainLive">1000</strong><small id="fractionLive">100%</small></div>`,`<h4>HALF-LIFE MODEL</h4><small>ทำนาย → Run Model → อ่านกราฟและจำนวนที่เหลือ</small><div class="rda-control-label"><span>Half-life</span><b id="halfOut">10 min</b></div><input class="rda-live-range" id="halfRange" type="range" min="5" max="30" step="5" value="10"><div class="rda-control-label"><span>Elapsed time</span><b id="elapsedOut">10 min</b></div><input class="rda-live-range" id="elapsedRange" type="range" min="0" max="120" step="5" value="10"><svg viewBox="0 0 300 120" class="rda-chart"><line x1="15" y1="105" x2="290" y2="105"/><line x1="15" y1="10" x2="15" y2="105"/><polyline id="decayLine" points="15,10 290,105"/></svg><button class="rda-run-button" id="runDecay">▶ RUN DECAY MODEL</button>`));
    const h=$('halfRange'),e=$('elapsedRange');const out=()=>{$('halfOut').textContent=h.value+' min';$('elapsedOut').textContent=e.value+' min'};h.oninput=e.oninput=out;out();
    $('runDecay').onclick=()=>{let hl=+h.value,time=+e.value,n=1000*Math.pow(.5,time/hl),pct=n/10;$('remainLive').textContent=Math.round(n);$('fractionLive').textContent=pct.toFixed(1)+'% remaining';let active=Math.round(50*pct/100);qa('.rda-nucleus').forEach((x,i)=>x.classList.toggle('decayed',i>=active));let pts=[];for(let i=0;i<=10;i++){let tt=120*i/10,nn=Math.pow(.5,tt/hl);pts.push(`${15+275*i/10},${105-95*nn}`)}$('decayLine').setAttribute('points',pts.join(' '));addTrial(`Half-life ${hl} min • t=${time} min`,`จาก N₀=1000 แบบจำลองเหลือประมาณ ${Math.round(n)} นิวเคลียส (${pct.toFixed(1)}%)`,`N=${Math.round(n)} • ${pct.toFixed(1)}%`)};
  }
  function multiLab(sec){
    const cards=`<div class="rda-signal-list" id="signalList"><div class="rda-signal-card"><small>DETECTOR A</small><strong>ยังไม่ตรวจ</strong><i>—</i></div><div class="rda-signal-card"><small>CCTV</small><strong>ยังไม่ตรวจ</strong><i>—</i></div><div class="rda-signal-card"><small>SHIELD TEST</small><strong>ยังไม่ตรวจ</strong><i>—</i></div><div class="rda-signal-card"><small>DISTANCE READING</small><strong>ยังไม่ตรวจ</strong><i>—</i></div></div>`;
    sec.insertAdjacentHTML('afterbegin',shell(cards,`<h4>MULTI-SOURCE EVIDENCE CONSOLE</h4><small>อย่าตัดสินจากหลักฐานชิ้นเดียว เปิดอย่างน้อย 3 แหล่งแล้วเทียบความสอดคล้อง</small><div class="rda-tool-grid" id="multiTools"><button data-k="det"><span>📟</span>Detector A</button><button data-k="cctv"><span>🎥</span>CCTV</button><button data-k="shield"><span>🛡️</span>Shield Test</button><button data-k="dist"><span>↔️</span>Distance Reading</button></div>`));
    const data={det:['Detector A','วัดค่ารังสีสูงกว่าพื้นหลัง 8.6 เท่า','8.6× background'],cctv:['CCTV','ภาพยืนยันว่าภาชนะถูกย้ายก่อนสัญญาณเตือน 6 นาที','T−6 min'],shield:['Shield test','ค่าลดลงมากเมื่อใช้ตะกั่ว แต่ลดน้อยด้วยอะลูมิเนียม','Lead response strong'],dist:['Distance reading','ที่ 2 m ค่าลดลงเหลือประมาณ 1/4 ของที่ 1 m','1 m → 2 m ≈ ¼']};
    qa('#multiTools button').forEach((b,i)=>b.onclick=()=>{let d=data[b.dataset.k];b.classList.add('done');let c=qa('#signalList .rda-signal-card')[i];c.innerHTML=`<small>${d[0].toUpperCase()}</small><strong>${d[1]}</strong><i>${d[2]}</i>`;addTrial(d[0],d[1],d[2])});
  }
  function finalLab(sec){
    let scenario;try{scenario=JSON.parse(localStorage.getItem('RDA_FINAL_SCENARIO_V3')||'null')}catch(e){}
    if(!scenario){const bank=[{src:'Gamma',base:5200,half:18},{src:'Beta',base:3600,half:12},{src:'Gamma',base:4400,half:25}];scenario=bank[Math.floor(Math.random()*bank.length)];localStorage.setItem('RDA_FINAL_SCENARIO_V3',JSON.stringify(scenario))}
    sec.insertAdjacentHTML('afterbegin',shell(`<div class="rda-final-alert">⚠ RDA EMERGENCY TRANSMISSION</div><div class="rda-source-orb" style="left:46%;top:48%">☢</div><div class="rda-detector" style="right:6%;top:47%"><small>CRISIS DATA</small><strong id="finalData">NO DATA</strong><small id="finalHint">เลือกเครื่องมือเพื่อเก็บหลักฐาน</small></div>`,`<h4>FINAL INVESTIGATION TOOLKIT</h4><small>ไม่มี Tutorial — เลือกเครื่องมือและสร้างชุดหลักฐานที่เพียงพอด้วยตัวเอง</small><div class="rda-tool-grid" id="finalTools"><button data-k="det"><span>📟</span>Detector</button><button data-k="shield"><span>🛡️</span>Shield Test</button><button data-k="dist"><span>↔️</span>Distance Tool</button><button data-k="decay"><span>📉</span>Decay Analyzer</button></div><div class="rda-control-label"><span>INVESTIGATION STATUS</span><b id="finalStatus">0 / 4 tools</b></div>`));
    const used=new Set();const tools={det:()=>['Detector scan',`ตรวจพบ ${scenario.base.toLocaleString()} CPM ใกล้แหล่งกำเนิด`,`Near source ${scenario.base} CPM`],shield:()=>{let val=scenario.src==='Gamma'?Math.round(scenario.base*.16):Math.round(scenario.base*.08);return ['Shield comparison',`หลังใช้ตะกั่ว ค่าลดเหลือ ${val.toLocaleString()} CPM`,`${scenario.base} → ${val} CPM`]},dist:()=>['Distance test',`เพิ่มระยะ 1 m → 2 m ค่าลดประมาณ 4 เท่า`,`${scenario.base} → ${Math.round(scenario.base/4)} CPM`],decay:()=>['Decay analysis',`แบบจำลองครึ่งชีวิตประมาณ ${scenario.half} นาที หลัง 2 T½ เหลือ 25%`,`T½≈${scenario.half} min • 25% @2T½`]};
    qa('#finalTools button').forEach(b=>b.onclick=()=>{let d=tools[b.dataset.k]();used.add(b.dataset.k);b.classList.add('done');$('finalData').textContent=d[2];$('finalHint').textContent=d[1];$('finalStatus').textContent=used.size+' / 4 tools';addTrial(d[0],d[1],d[2])});
  }
  function install(){
    const sec=q(`[data-rda-case="${mid}"][data-case-step="2"]`); if(!sec||sec.dataset.liveInstalled)return;sec.dataset.liveInstalled='1';
    // Hide the old form-based capture controls but keep their elements alive for the existing data logic.
    [...sec.children].forEach(el=>el.classList.add('rda-old-capture-ui'));
    ({shield:shieldLab,therapy:therapyLab,exposure:exposureLab,decay:decayLab,multisource:multiLab,final:finalLab}[config.mode])(sec);
    const proceed=q('.rda-lab-proceed',sec);const oldProceed=$(mid+'ToEvidence');if(proceed)proceed.onclick=()=>{if(trials.length<2)return;oldProceed?.click()};
    try{const saved=JSON.parse(localStorage.getItem('RDA_LIVE_LAB_'+mid.toUpperCase())||'{}');trials=Array.isArray(saved.trials)?saved.trials:[]}catch(e){};renderTrials();
  }
  document.addEventListener('DOMContentLoaded',()=>setTimeout(install,80));
})();
