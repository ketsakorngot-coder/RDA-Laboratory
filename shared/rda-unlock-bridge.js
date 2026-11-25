/* RDA Golden Unlock Safety Bridge
   Only provides a fallback when a mission's own final function is missing.
   It does NOT replace working mission logic or scoring.
*/
(function(){
 'use strict';
 const path=(location.pathname||'').replace(/\\/g,'/');
 const current=(path.match(/\/missions\/(r0[1-6])\//i)||[])[1]?.toLowerCase()||null;

 function scoreFor(id){
  try{
   const dk='RDA_DECISION_'+id.toUpperCase();
   const d=JSON.parse(localStorage.getItem(dk)||'{}');
   const vals=[d.revisedScore,d.initialScore];
   const keys={r01:'rdkR01Complete',r02:'rdkR02Ultimate',r03:'rdkR03Standalone',r04:'rdkR04Complete',r05:'rdkR05Standalone',r06:'rdkR06'};
   const n=JSON.parse(localStorage.getItem(keys[id])||'{}');
   vals.push(n.score,n.finalEvaluation&&n.finalEvaluation.total,n.caseWorkflowScore);
   return Math.max(0,...vals.map(Number).filter(Number.isFinite));
  }catch(e){return 0}
 }
 function finish(id){
  if(window.RDAMaster&&typeof window.RDAMaster.completeCaseAndReturn==='function'){
   return window.RDAMaster.completeCaseAndReturn(id,scoreFor(id));
  }
  try{
   let list=JSON.parse(localStorage.getItem('RDA_COMPLETION_HANDOFF')||'[]');
   if(!Array.isArray(list))list=[];
   const n=Number(id.slice(-1));
   for(let i=1;i<=n;i++){const x='r0'+i;if(!list.includes(x))list.push(x)}
   localStorage.setItem('RDA_COMPLETION_HANDOFF',JSON.stringify(list));
   localStorage.setItem('RDA_LAST_COMPLETED_CASE',id);
   const chain=list.join(',');
   location.href='../../index.html?rda_case_complete='+encodeURIComponent(id)+'&rda_chain='+encodeURIComponent(chain)+'#portal';
   return true;
  }catch(e){return false}
 }
 window.RDAUnlockBridge={finish,scoreFor};

 // Fallbacks ONLY when the original page failed to define its function.
 if(current==='r01' && typeof window.finishR01AndUnlock!=='function') window.finishR01AndUnlock=()=>finish('r01');
 if(current==='r02' && typeof window.finishR02!=='function') window.finishR02=()=>finish('r02');
 if(current==='r03' && typeof window.finishR03AndUnlock!=='function') window.finishR03AndUnlock=()=>finish('r03');
 if(current==='r04' && typeof window.finishR04!=='function') window.finishR04=()=>finish('r04');
})();
