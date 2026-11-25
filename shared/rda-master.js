/* RDA V6.9.1 Unlock Chain Fix */

/* RDA V6.9.1 Unlock Chain Fix */
(function(){
  function normalizeMissionId(id){
    return String(id || '').toLowerCase().replace(/[^a-z0-9]/g,'');
  }
  function normalizeMissionCompletion(state, id){
    var key = normalizeMissionId(id);
    var raw = state || {};
    var candidates = [
      raw.completedMissions && raw.completedMissions[key],
      raw.completedMissions && raw.completedMissions[id],
      raw.missions && raw.missions[key] && raw.missions[key].completed,
      raw.missions && raw.missions[id] && raw.missions[id].completed,
      raw[key + 'Complete'],
      raw[id + 'Complete'],
      raw['RDA_' + key.toUpperCase() + '_COMPLETE'],
      raw['rda' + key + 'Complete']
    ];
    return candidates.some(function(v){ return v === true || v === 1 || v === '1' || v === 'true'; });
  }
  window.RDAUnlockChainFix = {
    isComplete: normalizeMissionCompletion,
    normalizeMissionId: normalizeMissionId
  };
})();

/* RDA MASTER BRIDGE v2 — Final Integration */
(function(){
 const currentMission=location.pathname.match(/\/missions\/(r0[1-6])\//i)?.[1]?.toLowerCase()||null;
 const entryKey='rdaEntry', masterKey='RDA_MASTER';
 const missionKeys={r01:'rdkR01Complete',r02:'rdkR02Ultimate',r03:'rdkR03Standalone',r04:'rdkR04Complete',r05:'rdkR05Standalone',r06:'rdkR06'};
 const meta={
  r01:{code:'R-01',icon:'☢️',title:'UNKNOWN SOURCE',focus:'Identify an unknown radiation source from detector and penetration evidence.',physics:'Alpha • Beta • Gamma • Penetration • Attenuation',decision:'ระบุชนิดรังสี ประเมินความเสี่ยง และกำหนดแนวทางจัดการแหล่งกำเนิด'},
  r02:{code:'R-02',icon:'🏥',title:'SHIELDING PROTOCOL',focus:'Use medical-radiation evidence to choose protection and response measures.',physics:'Radiation use • Shielding • Exposure reduction • Safety',decision:'เลือกมาตรการป้องกันและจัดการแหล่งรังสีในบริบททางการแพทย์โดยใช้หลักฐาน'},
  r03:{code:'R-03',icon:'✈️',title:'EXPOSURE ZONE',focus:'Interpret screening evidence and make a defensible security decision.',physics:'Detection • Penetration • Measurement • False-positive risk',decision:'ตัดสินใจอนุญาต กักกัน หรือตรวจสอบเพิ่มเติมจากหลักฐานการตรวจจับ'},
  r04:{code:'R-04',icon:'🏭',title:'DECAY FILE',focus:'Evaluate claims, evidence and public risk in a food-radiation case.',physics:'Radiation applications • Dose context • Evidence evaluation • Risk communication',decision:'ประเมินข้อกล่าวอ้างเกี่ยวกับอาหารและสื่อสารความเสี่ยงอย่างมีหลักฐาน'},
  r05:{code:'R-05',icon:'🚨',title:'SECURITY RISK',focus:'Integrate evidence to manage an emergency radiation incident.',physics:'Time • Distance • Shielding • Exposure • Emergency response',decision:'จัดลำดับการช่วยเหลือ อพยพ และควบคุมพื้นที่ภายใต้ข้อจำกัด'},
  r06:{code:'R-06',icon:'⚠',title:'FINAL RADIATION CRISIS',focus:'Integrate all prior cases in a national-level transfer challenge.',physics:'Integrated nuclear/radiation physics • Multi-source evidence • Resource allocation',decision:'สร้างและปกป้องแผนตอบโต้ระดับประเทศด้วยหลักฐานและเหตุผลทางฟิสิกส์'}
 };
 const safe=k=>{try{return JSON.parse(localStorage.getItem(k)||'{}')}catch(e){return {}}};
 const handoffKey='RDA_COMPLETION_HANDOFF';
 const receiptKey='RDA_CASE_RECEIPTS';
 function receipts(){try{return JSON.parse(localStorage.getItem(receiptKey)||'{}')}catch(e){return {}}}
 function saveReceipt(id,score){
  try{
   const r=receipts();
   r[id]={caseId:id,status:'CASE_CLOSED',score:Number(score||0),closedAt:new Date().toISOString(),next:id==='r06'?null:`r0${Number(id.slice(-1))+1}`};
   localStorage.setItem(receiptKey,JSON.stringify(r));
  }catch(e){}
 }

 function handoffState(){
  try{
   const raw=localStorage.getItem(handoffKey);
   const list=raw?JSON.parse(raw):[];
   return Array.isArray(list)?list:[];
  }catch(e){return []}
 }
 function saveHandoff(list){
  try{
   const expanded=new Set();
   (list||[]).forEach(id=>{
    const m=String(id).match(/^r0([1-6])$/);
    if(m){
     for(let i=1;i<=Number(m[1]);i++) expanded.add(`r0${i}`);
    }
   });
   localStorage.setItem(handoffKey,JSON.stringify([...expanded]));
  }catch(e){}
 }
 function consumeUrlHandoff(){
  try{
   const p=new URLSearchParams(location.search||'');
   const completed=p.get('rda_case_complete');
   if(completed){
    const list=handoffState();
    if(!list.includes(completed))list.push(completed);
    saveHandoff(list);
   }
   const chain=p.get('rda_chain');
   if(chain){
    const list=chain.split(',').filter(x=>/^r0[1-6]$/.test(x));
    if(list.length)saveHandoff([...handoffState(),...list]);
   }
  }catch(e){}
 }
 consumeUrlHandoff();
 try{
  const last=localStorage.getItem('RDA_LAST_COMPLETED_CASE');
  if(/^r0[1-6]$/.test(last||'')){
   const list=handoffState();
   if(!list.includes(last))list.push(last);
   saveHandoff(list);
  }
 }catch(e){}


 function decisionRecord(id){
  const rec=safe('RDA_DECISION_'+id.toUpperCase());
  // Risk is a categorical value (LOW/MODERATE/HIGH/CRITICAL), so it must NOT be tested with >=15 chars.
  const checks={
   claim:(rec.claim||'').trim().length>=8,
   evidence:(rec.evidence||'').trim().length>=5 || (Array.isArray(rec.evidenceIds)&&rec.evidenceIds.length>=2),
   reasoning:(rec.reasoning||'').trim().length>=15,
   risk:(rec.risk||'').trim().length>0,
   decision:(rec.decision||'').trim().length>=10
  };
  const completedFields=Object.values(checks).filter(Boolean).length;
  const rawRubricScore=Number(rec.revisedScore||rec.initialScore||0);
  const rubricIs100=Number(rec.rubricMaxScore)===100 || String(rec.rubricEngine||'').endsWith('_100');
  const rubricScore=rawRubricScore>0 && !rubricIs100 ? rawRubricScore*5 : rawRubricScore;
  const rubricMaxScore=100;
  const revisionSubmitted = rec.revisionSubmitted===true || Number(rec.revisedScore||0)>0;
  return {
   record:rec,
   completedFields,
   rubricScore,
   rubricMaxScore,
   revisionSubmitted,
   ready:completedFields===5 && revisionSubmitted
  };
 }
 function snapshot(){
  const e=safe(entryKey),old=safe(masterKey),missions={};
  let prerequisitePassed=true,completed=0,totalScore=0;

  Object.entries(missionKeys).forEach(([id,key])=>{
   const raw=safe(key);
   const handedOff=handoffState().includes(id);
   const nativeDone=!!(raw.completed||raw.evaluated);
   const record=decisionRecord(id);
   const unlocked=prerequisitePassed;
   const effectiveDone=unlocked && (handedOff || (nativeDone && record.ready));
   const score=effectiveDone ? (record.rubricScore || (Number(raw.score??raw.finalEvaluation?.total??0)||0)) : 0;

   missions[id]={
    completed:effectiveDone,
    nativeCompleted:nativeDone,
    decisionReady:record.ready,
    decisionFields:record.completedFields,
    score,
    unlocked
   };

   if(effectiveDone){completed++;totalScore+=score}
   prerequisitePassed=effectiveDone;
  });

  const data={
   version:4,
   agent:{
    name:e.name||old.agent?.name||'RDA Agent',
    avatar:e.avatar||old.agent?.avatar||'',
    specialty:e.specialty||old.agent?.specialty||'Radiation Investigation'
   },
   missions,completed,totalScore,updatedAt:new Date().toISOString()
  };
  localStorage.setItem(masterKey,JSON.stringify(data));
  return data;
 }
 const statusFor=(id,d)=>!d.missions[id].unlocked?'locked':d.missions[id].completed?'completed':'current';
 const statusText=s=>s==='completed'?'COMPLETED':s==='current'?'CURRENT MISSION':'LOCKED';
 function missionHref(id){
  const chain=handoffState().join(',');
  const base=currentMission?`../${id}/index.html`:`missions/${id}/index.html`;
  return base+`?rda_chain=${encodeURIComponent(chain)}`;
 }
 function home(){location.href=currentMission?'../../index.html#portal':'index.html#portal'}
 function completeCaseAndReturn(id,score){
  id=String(id||'').toLowerCase();
  if(!/^r0[1-6]$/.test(id))return false;

  // One completion contract for R-01 ... R-06.
  // Preserve the known-good Golden handoff model.
  const numericScore=Number(score||0);
  const list=handoffState();
  if(!list.includes(id))list.push(id);
  saveHandoff(list);
  try{localStorage.setItem('RDA_LAST_COMPLETED_CASE',id)}catch(e){}

  try{
   const key=missionKeys[id];
   if(key){
    const raw=safe(key);
    raw.completed=true;
    raw.evaluated=true;
    raw.caseWorkflowCompleted=true;
    raw.caseWorkflowScore=numericScore;
    raw.updatedAt=new Date().toISOString();
    localStorage.setItem(key,JSON.stringify(raw));
   }
  }catch(e){}

  saveReceipt(id,numericScore);
  try{window.RDABackend?.syncCase?.(id)}catch(e){}
  try{snapshot()}catch(e){}

  const chain=handoffState().join(',');
  const base=currentMission?'../../index.html':'index.html';
  const q=`?rda_case_complete=${encodeURIComponent(id)}&rda_score=${encodeURIComponent(numericScore)}&rda_chain=${encodeURIComponent(chain)}`;
  location.href=base+q+'#portal';
  return true;
 }

 function gotoMission(id){
  const d=snapshot();
  if(!d.missions[id]?.unlocked){alert(`${meta[id].code} ยังล็อกอยู่\nกรุณาทำภารกิจก่อนหน้าให้สำเร็จก่อน`);return false}
  location.href=missionHref(id);return true;
 }
 function styles(){
  if(document.getElementById('rdaMasterStyles'))return;
  const s=document.createElement('style');s.id='rdaMasterStyles';s.textContent=`
  .rda-master-op-nav{display:grid;gap:5px;margin:6px 0 10px}.rda-master-op-nav button{width:100%;display:grid;grid-template-columns:24px 1fr auto;align-items:center;gap:7px;padding:8px 9px;border-radius:9px;border:1px solid rgba(80,180,210,.18);background:rgba(5,25,37,.72);color:#dbeef4;text-align:left;font:inherit;cursor:pointer}.rda-master-op-nav button small{font-size:8px;color:#91aab5}.rda-master-op-nav button.completed{border-color:rgba(69,212,131,.4)}.rda-master-op-nav button.completed small{color:#69e49b}.rda-master-op-nav button.current{border-color:#f4c430;box-shadow:0 0 14px rgba(244,196,48,.12)}.rda-master-op-nav button.current small{color:#ffe17d}.rda-master-op-nav button.locked{opacity:.48;filter:grayscale(.7);cursor:not-allowed}
  [data-rda-status=completed]{border-color:rgba(69,212,131,.58)!important;opacity:1!important;filter:none!important}[data-rda-status=current]{border-color:#f4c430!important;opacity:1!important;filter:none!important;cursor:pointer!important}[data-rda-status=locked]{opacity:.5!important;filter:grayscale(.72)!important;cursor:not-allowed!important}
  
  .rda-lab-identity{margin:10px 0 12px;padding:10px 12px;border:1px solid rgba(45,226,230,.28);border-radius:12px;background:linear-gradient(90deg,rgba(45,226,230,.08),rgba(244,196,48,.04))}
  .rda-lab-identity small{display:block;color:#6fdce6;font:700 9px system-ui;letter-spacing:1.5px}.rda-lab-identity b{display:block;margin-top:3px;color:#fff;font:800 12px system-ui}.rda-lab-identity em{display:block;margin-top:3px;color:#9cb3bc;font:normal 9px system-ui}
  .rda-protocol-strip{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:10px 0}.rda-protocol-strip span{padding:8px 5px;border-radius:8px;text-align:center;background:rgba(6,32,45,.82);border:1px solid rgba(45,226,230,.18);font:800 9px system-ui;color:#c9edf0}.rda-protocol-strip span:nth-child(2){border-color:rgba(244,196,48,.3);color:#ffe17d}.rda-protocol-strip span:nth-child(3){border-color:rgba(255,86,105,.3);color:#ff9aa7}
  #rdaDecisionBtn{display:none!important;position:fixed;left:14px;bottom:14px;z-index:99999;border:1px solid #f4c430;border-radius:999px;padding:9px 14px;background:rgba(2,16,24,.96);color:#ffe17d;font:800 11px system-ui;cursor:pointer;box-shadow:0 0 20px rgba(244,196,48,.18)}
  #rdaDecisionModal{position:fixed;inset:0;z-index:100000;background:rgba(0,7,12,.88);backdrop-filter:blur(8px);display:none;align-items:center;justify-content:center;padding:18px}#rdaDecisionModal.open{display:flex}
  .rda-decision-card{width:min(920px,96vw);max-height:92vh;overflow:auto;border:1px solid rgba(45,226,230,.42);border-radius:18px;background:#061722;padding:20px;box-shadow:0 0 55px rgba(45,226,230,.12)}
  .rda-decision-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.rda-decision-head h2{margin:4px 0;color:#fff}.rda-decision-head p{margin:0;color:#93aab5;font-size:12px}.rda-close{border:0;background:transparent;color:#fff;font-size:24px;cursor:pointer}
  .rda-decision-flow{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin:15px 0}.rda-decision-flow b{padding:8px 4px;border-radius:8px;text-align:center;background:#0b2837;color:#dff;font-size:9px}.rda-decision-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.rda-decision-field{padding:12px;border:1px solid rgba(255,255,255,.09);border-radius:12px;background:rgba(255,255,255,.025)}.rda-decision-field:last-child{grid-column:1/-1}.rda-decision-field label{display:block;color:#fff;font:800 10px system-ui;margin-bottom:6px}.rda-decision-field textarea{width:100%;box-sizing:border-box;min-height:78px;resize:vertical;border:1px solid rgba(45,226,230,.2);border-radius:8px;background:#04111a;color:#eafcff;padding:9px;font:12px system-ui}
  .rda-decision-actions{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-top:14px}.rda-decision-score{color:#8faab5;font:700 11px system-ui}.rda-decision-save{border:1px solid #2de2e6;border-radius:9px;padding:9px 14px;background:#0b3442;color:#dfffff;font:800 11px system-ui;cursor:pointer}
  @media(max-width:700px){.rda-decision-grid{grid-template-columns:1fr}.rda-decision-field:last-child{grid-column:auto}.rda-decision-flow{grid-template-columns:1fr}.rda-protocol-strip{grid-template-columns:1fr}}


  .rda-case-physics{margin-top:6px;padding:6px 7px;border-radius:7px;background:rgba(45,226,230,.06);color:#bfeef1;font:700 8px system-ui;line-height:1.35}
  .rda-case-decision{display:grid;gap:3px;margin-top:7px;padding:7px;border-radius:8px;border-left:3px solid #f4c430;background:rgba(244,196,48,.06)}
  .rda-case-decision strong{color:#ffe17d;font:800 8px system-ui}.rda-case-decision span{color:#d8e6eb;font:9px/1.35 system-ui}
  .rda-decision-requirement{margin:7px 0;padding:7px;border-radius:8px;background:rgba(255,86,105,.06);border:1px solid rgba(255,86,105,.15);color:#ffb1ba;font:800 8px system-ui;text-align:center}
  .rda-master-op-nav button b{display:grid;gap:1px}.rda-master-op-nav button b em{font:normal 7px system-ui;color:#8da7b1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:108px}
  .rda-rubric-box{margin-top:12px;padding:12px;border-radius:12px;border:1px solid rgba(244,196,48,.2);background:rgba(244,196,48,.035)}
  .rda-rubric-title{display:flex;justify-content:space-between;gap:8px;color:#ffe17d;font:10px system-ui}.rda-rubric-title span{color:#91a7b1}
  .rda-rubric-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px}.rda-rubric-grid span{padding:7px;border-radius:8px;background:#071923;color:#c9dce2;font:9px/1.35 system-ui}.rda-rubric-grid b{color:#2de2e6;margin-right:4px}
  @media(max-width:700px){.rda-rubric-grid{grid-template-columns:1fr}}



  /* ===== V2.7 FINAL QA / UNLOCK RECEIPT ===== */
  .rda-unlock-receipt{
    display:none;
    margin:9px 0 12px;
    padding:10px 13px;
    border:1px solid rgba(45,226,230,.30);
    border-radius:12px;
    background:linear-gradient(90deg,rgba(45,226,230,.09),rgba(7,24,35,.88));
    box-shadow:0 0 20px rgba(45,226,230,.08);
  }
  .rda-unlock-receipt.show{display:flex;align-items:center;justify-content:space-between;gap:10px}
  .rda-unlock-receipt b{font-size:10px;color:#78fff0;letter-spacing:.8px}
  .rda-unlock-receipt span{font-size:9px;color:#d8eef2}
  @media(max-width:700px){.rda-unlock-receipt.show{align-items:flex-start;flex-direction:column}}

  /* ===== MENU ORGANIZED EDITION ===== */
  .rda-master-op-nav{
    display:grid!important;
    grid-template-columns:repeat(2,minmax(0,1fr))!important;
    gap:6px!important;
    margin:7px 0 8px!important;
  }
  .rda-master-op-nav button{
    min-height:44px!important;
    display:grid!important;
    grid-template-columns:22px 1fr auto!important;
    gap:5px!important;
    padding:7px 8px!important;
    border-radius:11px!important;
  }
  .rda-master-op-nav button .rda-op-icon{font-size:15px;text-align:center}
  .rda-master-op-nav button b{
    display:block!important;
    font-size:11px!important;
    line-height:1!important;
    letter-spacing:.02em;
  }
  .rda-master-op-nav button b em{display:none!important}
  .rda-master-op-nav button small{
    font-size:7px!important;
    font-weight:800!important;
    white-space:nowrap;
  }
  .rda-compact-tools{
    display:grid;
    grid-template-columns:repeat(3,1fr);
    gap:6px;
    margin:7px 0 10px;
    padding-top:8px;
    border-top:1px solid rgba(45,226,230,.12);
  }
  .rda-compact-tools button{
    min-width:0;
    display:grid;
    place-items:center;
    gap:2px;
    padding:7px 3px;
    border-radius:10px;
    border:1px solid rgba(45,226,230,.18);
    background:rgba(6,28,39,.82);
    color:#d7edf3;
    cursor:pointer;
    font:inherit;
  }
  .rda-compact-tools button span{font-size:15px}
  .rda-compact-tools button b{font-size:7px;font-weight:700}
  .rda-compact-tools button:hover{border-color:#2de2e6;background:rgba(45,226,230,.08)}

  /* Current case identity becomes a slim status strip instead of a tall block. */
  .rda-lab-identity{
    margin:7px 0 7px!important;
    padding:7px 8px!important;
    border-radius:10px!important;
  }
  .rda-lab-identity small{font-size:7px!important;letter-spacing:.8px!important}
  .rda-lab-identity b{font-size:10px!important;margin-top:2px!important}
  .rda-lab-identity>em,
  .rda-lab-identity>.rda-case-physics,
  .rda-lab-identity>.rda-case-decision,
  .rda-lab-identity>.rda-decision-requirement{display:none!important}
  .rda-lab-identity .rda-protocol-strip{
    grid-template-columns:repeat(3,1fr)!important;
    gap:4px!important;
    margin:5px 0 0!important;
  }
  .rda-lab-identity .rda-protocol-strip span{
    padding:4px 2px!important;
    font-size:7px!important;
    border-radius:6px!important;
  }

  /* Keep case actions off the sidebar and align them as one bottom-right action dock. */
  #rdaDecisionBtn{
    left:auto!important;
    right:16px!important;
    bottom:16px!important;
    min-width:142px;
    text-align:center;
    z-index:100003!important;
  }
  .rda-case-button,.r01-case-button{
    left:auto!important;
    right:168px!important;
    bottom:16px!important;
    min-width:142px;
    text-align:center;
    z-index:100002!important;
  }
  #rdaMasterHome{
    right:16px!important;
    bottom:auto!important;
    top:14px!important;
    padding:7px 11px!important;
  }
  @media(max-width:760px){
    .rda-master-op-nav{grid-template-columns:repeat(3,minmax(0,1fr))!important}
    .rda-master-op-nav button{grid-template-columns:1fr!important;text-align:center!important;place-items:center;padding:6px 3px!important}
    .rda-master-op-nav button small{font-size:6px!important}
    .rda-compact-tools{grid-template-columns:repeat(3,1fr)}
    #rdaDecisionBtn,.rda-case-button,.r01-case-button{
      position:fixed!important;
      bottom:10px!important;
      min-width:0!important;
      width:calc(50vw - 16px)!important;
      padding:8px 6px!important;
      font-size:9px!important;
    }
    .rda-case-button,.r01-case-button{left:8px!important;right:auto!important}
    #rdaDecisionBtn{right:8px!important}
  }

  #rdaMasterHome{position:fixed;right:14px;bottom:14px;z-index:99999;border:1px solid #2de2e6;border-radius:999px;padding:8px 13px;background:rgba(2,16,24,.94);color:#bfffff;font:700 12px system-ui;cursor:pointer;box-shadow:0 0 20px rgba(45,226,230,.25)}`;
  document.head.appendChild(s);
 }
 function sidebarOps(d){
  const title=[...document.querySelectorAll('.rda-section-title,.section-title')].find(x=>/Operations/i.test(x.textContent||''));if(!title||document.getElementById('rdaMasterOpNav'))return;
  let n=title.nextElementSibling;while(n&&(n.matches('.rda-mission-item,.current-mission')||/R-0[1-6]\s*Mission/i.test(n.textContent||''))){n.style.display='none';n=n.nextElementSibling}
  const nav=document.createElement('div');nav.id='rdaMasterOpNav';nav.className='rda-master-op-nav';
  nav.innerHTML=Object.keys(meta).map(id=>{const st=statusFor(id,d);return `<button class="${st}" data-mid="${id}" title="${meta[id].code} — ${meta[id].title}"><span class="rda-op-icon">${meta[id].icon}</span><b>${meta[id].code}</b><small>${st==='completed'?'✓':st==='current'?'OPEN':'🔒'}</small></button>`}).join('');
  title.insertAdjacentElement('afterend',nav);nav.querySelectorAll('button').forEach(b=>b.onclick=()=>gotoMission(b.dataset.mid));
 }

 function compactSidebarTools(){
  if(document.getElementById('rdaCompactTools'))return;
  const candidates=[...document.querySelectorAll('a,button,.nav-item,.menu-item,.rda-nav-item')];
  const passport=candidates.find(x=>/Research Passport/i.test((x.textContent||'').trim()));
  const teacher=candidates.find(x=>/Teacher Center/i.test((x.textContent||'').trim()));
  if(passport)passport.style.display='none';
  if(teacher)teacher.style.display='none';
  const anchor=document.getElementById('rdaMasterOpNav');
  if(!anchor)return;
  const tools=document.createElement('div');
  tools.id='rdaCompactTools';tools.className='rda-compact-tools';
  const make=(icon,label,src)=>{const b=document.createElement('button');b.innerHTML=`<span>${icon}</span><b>${label}</b>`;if(src)b.onclick=()=>src.click();return b};
  // Mission pages: keep only the HQ return control.
  // Agent Passport remains available from the entry / Mission Command Center only.
  const homeBtn=make('⌂','HQ',null);homeBtn.onclick=home;tools.appendChild(homeBtn);
  anchor.insertAdjacentElement('afterend',tools);
 }


 function qaUnlockBanner(d){
  let box=document.getElementById('rdaUnlockReceipt');
  if(!box){
   box=document.createElement('div');box.id='rdaUnlockReceipt';box.className='rda-unlock-receipt';
   const host=document.querySelector('.master-hq-summary')||document.querySelector('.portal-shell')||document.body;
   host.insertAdjacentElement('afterend',box);
  }
  const ids=Object.keys(meta);
  const done=ids.filter(id=>d.missions[id]?.completed);
  const current=ids.find(id=>d.missions[id]?.unlocked&&!d.missions[id]?.completed);
  if(done.length){
   const last=done[done.length-1];
   box.innerHTML=`<b>CASE CLOSED ✓ ${meta[last].code}</b><span>${current?`NEXT CASE UNLOCKED → ${meta[current].code}`:'ALL CASES COMPLETED → POST-TEST READY'}</span>`;
   box.classList.add('show');
  }else{
   box.innerHTML='<b>MISSION SEQUENCE ACTIVE</b><span>Complete R-01 Revision to unlock the next case.</span>';
   box.classList.add('show');
  }
 }

 function cards(d){
  document.querySelectorAll('.operation-card,.r03-operation-card,.op,.hq-mission-card,.master-mission').forEach(card=>{
   const m=(card.textContent||'').match(/R-0([1-6])/i);if(!m)return;const id='r0'+m[1],st=statusFor(id,d);card.dataset.rdaStatus=st;
   const badge=card.querySelector('.status-chip,.r03-status,.tag,.hq-status');if(badge)badge.textContent=statusText(st);
   const h3=card.querySelector('h3');if(h3)h3.textContent=meta[id].title;
   const desc=card.querySelector('p');if(desc)desc.textContent=meta[id].focus;
   card.title=st==='locked'?meta[id].code+' LOCKED — complete previous case + Decision Record':meta[id].decision;
   card.addEventListener('click',ev=>{if(id===currentMission&&st==='current')return;ev.preventDefault();ev.stopPropagation();gotoMission(id)},true);
  });
  document.querySelectorAll('.mission-stats,.ops-stats,.r03-stats,.hq-stats').forEach(box=>{const b=[...box.querySelectorAll('b')].find(x=>/\/\s*6/.test(x.textContent||''));if(b)b.textContent=`${d.completed} / 6`});
 }
 function agent(d){document.querySelectorAll('.side-card').forEach(c=>{const b=c.querySelector(':scope > b');if(b&&/นักสืบ|Agent/i.test(b.textContent||''))b.textContent=d.agent.name})}
 function guard(d){
  const pre=safe('RDA_PRETEST');
  if(currentMission && !pre.completed){
   alert('PRE-INVESTIGATION TEST ยังไม่เสร็จ\nกรุณาทำ Pre-test ก่อนเข้าสู่คดี R-01');
   location.replace('../../index.html#pretest');return false;
  }
  if(!currentMission||d.missions[currentMission]?.unlocked)return true;
  const need=Number(currentMission.slice(1))-1;alert(`${meta[currentMission].code} ยังไม่ปลดล็อก\nกรุณาทำ R-0${need} ให้สำเร็จก่อน`);location.replace('../../index.html#portal');return false;
 }

 function decisionLab(d){
  if(!currentMission)return;
  const title=meta[currentMission];
  const sideTitle=[...document.querySelectorAll('.rda-section-title,.section-title')].find(x=>/Operations/i.test(x.textContent||''));
  if(sideTitle&&!document.getElementById('rdaLabIdentity')){
   const box=document.createElement('div');box.id='rdaLabIdentity';box.className='rda-lab-identity';
   box.innerHTML=`<small>RADIATION INVESTIGATION & DECISION LABORATORY</small><b>${title.code} — ${title.title}</b><em>${title.focus}</em><div class="rda-case-physics">PHYSICS CORE • ${title.physics}</div><div class="rda-protocol-strip"><span>① EVIDENCE</span><span>② RISK</span><span>③ DECISION</span></div><div class="rda-case-decision"><strong>DECISION TARGET</strong><span>${title.decision}</span></div><div class="rda-decision-requirement">COMPLETION = ภารกิจหลักสำเร็จ + Decision Record ครบ 5 ส่วน</div>`;
   sideTitle.parentNode.insertBefore(box,sideTitle);
  }
  if(document.getElementById('rdaDecisionModal'))return;
  const key='RDA_DECISION_'+currentMission.toUpperCase(), saved=safe(key);
  const fields=[
   ['claim','CLAIM','ข้อสรุปเบื้องต้นของคุณคืออะไร?'],
   ['evidence','EVIDENCE','หลักฐานหรือผลจาก Simulation ใดสนับสนุนข้อสรุป?'],
   ['reasoning','PHYSICS REASONING','อธิบายหลักฟิสิกส์ที่เชื่อมหลักฐานกับข้อสรุป'],
   ['risk','RISK','จากหลักฐานนี้ ความเสี่ยงคืออะไรและอยู่ในระดับใด?'],
   ['decision','DECISION','คุณจะตัดสินใจหรือดำเนินการอย่างไร เพราะเหตุใด?']
  ];
  const modal=document.createElement('div');modal.id='rdaDecisionModal';
  modal.innerHTML=`<div class="rda-decision-card"><div class="rda-decision-head"><div><small style="color:#2de2e6;font-weight:800;letter-spacing:1.5px">FINAL DECISION RECORD • REQUIRED FOR CASE COMPLETION</small><h2>${title.code} — ${title.title}</h2><p>สร้างข้อสรุปที่ตรวจสอบย้อนกลับได้จากหลักฐาน → หลักฟิสิกส์ → ความเสี่ยง → การตัดสินใจ</p></div><button class="rda-close" aria-label="close">×</button></div><div class="rda-decision-flow"><b>CLAIM</b><b>EVIDENCE</b><b>PHYSICS REASONING</b><b>RISK</b><b>DECISION</b></div><div class="rda-decision-grid">${fields.map(([id,label,ph])=>`<div class="rda-decision-field"><label>${label}</label><textarea data-rda-decision="${id}" placeholder="${ph}">${saved[id]||''}</textarea></div>`).join('')}</div><div class="rda-rubric-box"><div class="rda-rubric-title"><b>DECISION QUALITY RUBRIC</b><span>100 คะแนน • ครูประเมิน</span></div><div class="rda-rubric-grid"><span><b>20</b> Claim ชัดและตอบโจทย์</span><span><b>20</b> Evidence เฉพาะเจาะจงและเพียงพอ</span><span><b>20</b> Physics Reasoning ถูกต้องและเชื่อมโยง</span><span><b>20</b> Risk Assessment สมเหตุผล</span><span><b>20</b> Decision ปฏิบัติได้และปกป้องได้ด้วยหลักฐาน</span></div></div><div class="rda-decision-actions"><span class="rda-decision-score" id="rdaDecisionScore">Decision Record: 0/5 sections</span><button class="rda-decision-save">SAVE & VERIFY DECISION</button></div></div>`;
  document.body.appendChild(modal);
  // Unified workflow: FINAL DECISION is now Step 6 inside the single Case Workflow.
  modal.querySelector('.rda-close').onclick=()=>modal.classList.remove('open');
  modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.remove('open')});
  const areas=[...modal.querySelectorAll('textarea')];
  const update=()=>{const n=areas.filter(a=>a.value.trim().length>=15).length;modal.querySelector('#rdaDecisionScore').textContent=`Decision Record: ${n}/5 sections${n===5?' • READY TO DEFEND':''}`};
  areas.forEach(a=>a.addEventListener('input',update));update();
  modal.querySelector('.rda-decision-save').onclick=()=>{
   const out={};areas.forEach(a=>out[a.dataset.rdaDecision]=a.value.trim());out.updatedAt=new Date().toISOString();
   localStorage.setItem(key,JSON.stringify(out));update();
   const record=decisionRecord(currentMission);
   const native=safe(missionKeys[currentMission]);
   const nativeDone=!!(native.completed||native.evaluated);
   patch();
   if(record.ready && nativeDone){
    const number=Number(currentMission.slice(1));
    if(number<6) alert('Decision Record สมบูรณ์แล้ว ✓\\n'+meta[currentMission].code+' ปิดคดีแล้ว และ R-0'+(number+1)+' ถูกปลดล็อก');
    else alert('Decision Record สมบูรณ์แล้ว ✓\\nFinal Mission พร้อมปิดการประเมิน');
   }else if(record.ready){
    alert('Decision Record ครบ 5 ส่วนแล้ว ✓\\nกรุณาทำภารกิจหลักให้สำเร็จเพื่อปิดคดี');
   }else{
    alert('บันทึกแล้ว '+record.completedFields+'/5 ส่วน\\nทุกส่วนต้องมีคำอธิบายที่มีสาระก่อนปิดคดี');
   }
  };
 }


 /* ===== RDA MISSION PULSE — centralized 25/50/75/100% progress feedback ===== *
  * Missions call window.RDAMaster.pulse(missionId, currentStep, totalSteps)   *
  * from inside their own show()/go() step-navigation function. One shared    *
  * implementation for visuals + sound + vibration, so every mission behaves  *
  * identically and there is a single place to tune the feel later.          */
 const PULSE_CONTENT={
  r01:{
   25:{icon:'🟢',label:'SOFT PULSE',title:'25% — เริ่มสำรวจหลักฐาน',text:'คุณเริ่มเก็บข้อมูลกัมมันตรังสีแล้ว ลองสังเกตรูปแบบการทะลุผ่านวัสดุแต่ละชนิดให้ดี'},
   50:{icon:'⚡',label:'MISSION PULSE',title:'50% — RADIATION TYPE ANALYSIS',text:'คุณกำลังเข้าใกล้คำตอบแล้ว… หลักฐานต่อไปอาจเปลี่ยนการตัดสินใจของคุณ'},
   75:{icon:'🟠',label:'CRITICAL PULSE',title:'75% — เตรียมสรุปผล',text:'ข้อมูลเกือบครบแล้ว ตรวจสอบว่าหลักฐานทุกชิ้นสนับสนุนข้อสรุปของคุณหรือไม่'},
   100:{icon:'🔴',label:'MISSION COMPLETE',title:'ปิดคดี R-01',text:'คุณวิเคราะห์ชนิดรังสีจากกล่องปริศนาได้สำเร็จแล้ว'}
  },
  r02:{
   25:{icon:'🟢',label:'SOFT PULSE',title:'25% — เริ่มประเมินสถานการณ์',text:'ทีมแพทย์กำลังรอมาตรการป้องกัน เริ่มสำรวจข้อมูล Time-Distance-Shielding'},
   50:{icon:'⚡',label:'MISSION PULSE',title:'50% — PROTECTION STATUS',text:'คุณมีข้อมูลเพียงพอที่จะเริ่มประเมินความปลอดภัย แต่ยังต้องตรวจสอบอีกหนึ่งปัจจัยสำคัญ'},
   75:{icon:'🟠',label:'CRITICAL PULSE',title:'75% — เตรียมมาตรการสุดท้าย',text:'ใกล้ได้แผนป้องกันที่สมบูรณ์แล้ว ทบทวนว่าครบทั้ง Time, Distance และ Shielding หรือยัง'},
   100:{icon:'🔴',label:'MISSION COMPLETE',title:'ปิดคดี R-02',text:'ทีมแพทย์ปลอดภัยแล้วจากมาตรการป้องกันของคุณ'}
  },
  r03:{
   25:{icon:'🟢',label:'SOFT PULSE',title:'25% — เริ่มตรวจสอบสัญญาณ',text:'เครื่องตรวจจับที่สนามบินเริ่มส่งข้อมูล ให้ความสนใจกับค่าที่ผิดปกติ'},
   50:{icon:'⚡',label:'MISSION PULSE',title:'50% — EXPOSURE ZONE ANALYSIS',text:'มีข้อมูลพอจะประเมินความเสี่ยงเบื้องต้นแล้ว แต่ยังต้องยืนยันแหล่งที่มาอีกครั้ง'},
   75:{icon:'🟠',label:'CRITICAL PULSE',title:'75% — เตรียมตัดสินใจ',text:'ใกล้ถึงจุดตัดสินใจอนุญาตหรือปฏิเสธสัมภาระแล้ว ตรวจทานหลักฐานอีกครั้ง'},
   100:{icon:'🔴',label:'MISSION COMPLETE',title:'ปิดคดี R-03',text:'คุณตรวจสอบสัมภาระต้องสงสัยเสร็จสมบูรณ์แล้ว'}
  },
  r04:{
   25:{icon:'🟢',label:'SOFT PULSE',title:'25% — เริ่มตรวจสอบแหล่งกำเนิด',text:'ข้อมูลอายุแหล่งกำเนิดรังสีเริ่มเข้ามา สังเกตรูปแบบการสลายตัวไว้ให้ดี'},
   50:{icon:'☢️',label:'MISSION PULSE',title:'50% — DECAY SIGNAL DETECTED',text:'รูปแบบการสลายเริ่มชัดเจน ใช้ครึ่งชีวิตเพื่อคาดการณ์สิ่งที่จะเกิดขึ้นต่อไป'},
   75:{icon:'🟠',label:'CRITICAL PULSE',title:'75% — เตรียมตัดสินใจ',text:'ใกล้ถึงจุดตัดสินใจ PROCESS • ADJUST • HOLD แล้ว ทบทวนโมเดลครึ่งชีวิตอีกครั้ง'},
   100:{icon:'🔴',label:'MISSION COMPLETE',title:'ปิดคดี R-04',text:'คุณตัดสินใจเรื่องการส่งออก Batch F-04 สำเร็จแล้ว'}
  },
  r05:{
   25:{icon:'🟢',label:'SOFT PULSE',title:'25% — เริ่มประเมินสถานการณ์เมือง',text:'สัญญาณรังสีเริ่มแพร่กระจาย เริ่มสำรวจข้อมูลความเสี่ยงของประชาชนในพื้นที่'},
   50:{icon:'🚨',label:'MISSION PULSE',title:'50% — CITY RISK ANALYSIS',text:'ข้อมูลเริ่มเพียงพอสำหรับการประเมิน แต่การตัดสินใจครั้งต่อไปมีผลต่อพื้นที่โดยรอบ'},
   75:{icon:'🟠',label:'CRITICAL PULSE',title:'75% — เตรียมสั่งการ',text:'ใกล้ถึงคำสั่งปฏิบัติการระดับเมืองแล้ว ตรวจสอบผลกระทบรอบด้านอีกครั้ง'},
   100:{icon:'🔴',label:'MISSION COMPLETE',title:'ปิดคดี R-05',text:'คุณจัดการสถานการณ์ฉุกเฉินระดับเมืองสำเร็จแล้ว'}
  },
  r06:{
   25:{icon:'🟢',label:'SOFT PULSE',title:'25% — เริ่มรวบรวมเบาะแส',text:'เบาะแสจาก R-01 ถึง R-05 เริ่มถูกนำมารวมกัน สังเกตความเชื่อมโยงระหว่างคดี'},
   50:{icon:'⚡',label:'MISSION PULSE',title:'50% — NATIONAL INTEGRATION',text:'ข้อมูลจากทุกภารกิจเริ่มเชื่อมโยงกัน แต่การตัดสินใจครั้งนี้จะกำหนดชะตากรรมของประเทศ'},
   75:{icon:'🟠',label:'CRITICAL PULSE',title:'75% — เตรียมตัดสินใจครั้งสุดท้าย',text:'ใกล้ถึงการตัดสินใจระดับชาติแล้ว ทบทวนเบาะแสทั้งหมดอีกครั้งก่อนส่ง'},
   100:{icon:'🔴',label:'MISSION COMPLETE',title:'ปิดคดี R-06 — NATIONAL RADIATION CRISIS',text:'คุณปิดคดีระดับชาติได้สำเร็จ ภารกิจ RDA ทั้งหมดเสร็จสมบูรณ์'}
  }
 };
 const firedPulses=new Set();

 function pulseStyles(){
  if(document.getElementById('rdaPulseStyles'))return;
  const css='\
   .rda-pulse-wrap{position:fixed;top:16px;left:50%;transform:translateX(-50%) translateY(-12px);z-index:99999;\
     opacity:0;pointer-events:none;transition:opacity .25s ease, transform .25s ease;max-width:92vw;width:420px}\
   .rda-pulse-wrap.show{opacity:1;transform:translateX(-50%) translateY(0)}\
   .rda-pulse-card{display:flex;gap:12px;align-items:flex-start;padding:14px 16px;border-radius:14px;\
     background:linear-gradient(135deg,rgba(6,20,30,.96),rgba(10,28,40,.96));border:1px solid rgba(45,226,230,.5);\
     box-shadow:0 16px 40px rgba(0,0,0,.5),0 0 30px rgba(45,226,230,.18);color:#f5fbff;font-family:inherit;\
     animation:rdaPulseGlow 1.6s ease-in-out infinite}\
   @keyframes rdaPulseGlow{0%,100%{box-shadow:0 16px 40px rgba(0,0,0,.5),0 0 20px rgba(45,226,230,.12)}\
     50%{box-shadow:0 16px 40px rgba(0,0,0,.5),0 0 34px rgba(45,226,230,.32)}}\
   .rda-pulse-icon{font-size:26px;line-height:1;flex-shrink:0}\
   .rda-pulse-label{font-size:10px;font-weight:900;letter-spacing:.1em;color:#ffd23f;margin:0 0 3px}\
   .rda-pulse-title{font-size:13px;font-weight:800;margin:0 0 4px;color:#fff}\
   .rda-pulse-text{font-size:11.5px;line-height:1.5;color:#cfe6ea;margin:0}\
   @media(max-width:480px){.rda-pulse-wrap{width:92vw;top:10px}.rda-pulse-card{padding:11px 13px}}\
  ';
  const s=document.createElement('style');s.id='rdaPulseStyles';s.textContent=css;document.head.appendChild(s);
 }

 function playPulseSound(){
  try{
   const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;
   const ctx=new Ctx();
   const now=ctx.currentTime;
   [[880,0,0.09],[1320,0.10,0.16]].forEach(([freq,start,dur])=>{
    const osc=ctx.createOscillator();const gain=ctx.createGain();
    osc.type='sine';osc.frequency.value=freq;
    gain.gain.setValueAtTime(0.0001,now+start);
    gain.gain.linearRampToValueAtTime(0.16,now+start+0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001,now+start+dur);
    osc.connect(gain);gain.connect(ctx.destination);
    osc.start(now+start);osc.stop(now+start+dur+0.02);
   });
   setTimeout(()=>{try{ctx.close()}catch(e){}},400);
  }catch(e){}
 }

 function vibratePulse(){
  try{ if(navigator.vibrate) navigator.vibrate([80,40,40]); }catch(e){}
 }

 function showPulseCard(content){
  pulseStyles();
  let wrap=document.getElementById('rdaPulseWrap');
  if(!wrap){
   wrap=document.createElement('div');wrap.id='rdaPulseWrap';wrap.className='rda-pulse-wrap';
   document.body.appendChild(wrap);
  }
  wrap.innerHTML=`<div class="rda-pulse-card">\
    <div class="rda-pulse-icon">${content.icon}</div>\
    <div><p class="rda-pulse-label">${content.label}</p><p class="rda-pulse-title">${content.title}</p><p class="rda-pulse-text">${content.text}</p></div>\
   </div>`;
  requestAnimationFrame(()=>wrap.classList.add('show'));
  clearTimeout(wrap._hideTimer);
  wrap._hideTimer=setTimeout(()=>wrap.classList.remove('show'), content.icon==='🔴' ? 2600 : 1800);
 }

 function pulse(missionId,currentStep,totalSteps){
  try{
   if(!missionId||!totalSteps) return;
   const id=String(missionId).toLowerCase();
   const content=PULSE_CONTENT[id];if(!content)return;
   const pct=Math.round((currentStep/totalSteps)*100);
   const milestones=[25,50,75,100];
   let toFire=null;
   for(const m of milestones){
    const key=id+':'+m;
    if(pct>=m && !firedPulses.has(key)) toFire=m;
   }
   if(toFire!==null){
    milestones.filter(m=>m<=toFire).forEach(m=>firedPulses.add(id+':'+m));
    showPulseCard(content[toFire]);
    playPulseSound();
    vibratePulse();
   }
  }catch(e){}
 }

 function patch(){
  styles();const d=snapshot();if(!guard(d))return;sidebarOps(d);compactSidebarTools();qaUnlockBanner(d);cards(d);agent(d);decisionLab(d);
  if(currentMission&&!document.getElementById('rdaMasterHome')){const b=document.createElement('button');b.id='rdaMasterHome';b.textContent='⌂ RDA';b.title='กลับ Investigation Room';b.onclick=home;document.body.appendChild(b)}
 }
 window.RDAMaster={snapshot,gotoMission,home,patch,completeCaseAndReturn,handoffState,receipts,pulse};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',patch);else patch();
 window.addEventListener('storage',patch);window.addEventListener('focus',()=>setTimeout(patch,50));
})();