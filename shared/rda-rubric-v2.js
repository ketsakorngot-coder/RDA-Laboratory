/* RDA RULE-BASED RUBRIC ENGINE V2 — relationship scoring, not text length */
window.RDARubricV2=(()=>{
const cfg={
r01:{c:['alpha','beta','gamma','แอลฟา','บีตา','แกมมา','ทะลุ','ลดทอน'],e:['paper','aluminium','lead','กระดาษ','อะลูมิเนียม','ตะกั่ว','count','อัตราการนับ'],a:['ระบุ','จำแนก','ตรวจสอบ','identify']},
r02:{c:['shield','กำบัง','ลดทอน','ทะลุผ่าน','วัสดุ','ความหนา'],e:['aluminium','lead','paper','อะลูมิเนียม','ตะกั่ว','กระดาษ','ก่อน','หลัง','ลดลง'],a:['เลือก','ใช้','กำบัง','ป้องกัน','shield']},
r03:{c:['distance','time','inverse','square','ระยะ','เวลา','ความเข้ม','exposure','dose'],e:['meter','min','เมตร','นาที','distance','time','ระยะ','เวลา','rate','อัตรา'],a:['เพิ่มระยะ','ลดเวลา','จำกัดเวลา','ถอยห่าง']},
r04:{c:['half-life','ครึ่งชีวิต','decay','สลาย','exponential','50%','25%','12.5%'],e:['half-life','ครึ่งชีวิต','50','25','12.5','เวลา','วัน','ชั่วโมง','activity','กัมมันตภาพ'],a:['ติดตาม','จัดเก็บ','รอ','ควบคุม','ประเมินเวลา']},
r05:{c:['หลักฐานหลาย','ความน่าเชื่อถือ','สอดคล้อง','ไม่แน่นอน','detector','cctv'],e:['detector','cctv','shield','distance','เครื่องตรวจ','กล้อง','กำบัง','ระยะ'],a:['จำกัดพื้นที่','ตรวจเพิ่ม','ยืนยัน','ควบคุม','เฝ้าระวัง']},
r06:{c:['source','shield','distance','time','half-life','security','ชนิดรังสี','กำบัง','ระยะ','เวลา','ครึ่งชีวิต'],e:['r01','r02','r03','r04','r05','source','shield','distance','decay','security'],a:['อพยพ','จำกัดพื้นที่','กำบัง','เพิ่มระยะ','ลดเวลา','ตรวจสอบ','ตอบสนอง']}}
const n=s=>String(s||'').toLowerCase().replace(/\s+/g,' ').trim(), any=(s,a)=>a.some(x=>n(s).includes(n(x))), nums=s=>(String(s||'').match(/-?\d+(?:\.\d+)?/g)||[]);
function evaluate(x){let r=cfg[x.caseId]||cfg.r01,C=n(x.claim),E=n(x.evidenceText),P=n(x.reasoning),R=n(x.risk),D=n(x.decision),sel=x.selectedEvidence||[];
let trace=sel.length>=2||/evidence\s*#|e\d+:/i.test(E), rel=any(E,r.e), diverse=sel.length>=3||r.e.filter(v=>E.includes(n(v))).length>=2, quant=nums(E).length>=2;
let es=+trace + +rel + +diverse + +quant;
let cs=+(!!C)+ +(any(C,r.c)||any(C,r.e)||any(C,['ลด','เพิ่ม','สูง','ต่ำ','เหลือ','ผ่าน'])) + +(rel&&(any(C,r.c)||any(C,r.e))) + +(trace&&rel&&!!C);
let pc=any(P,r.c), pe=any(P,r.e)||any(P,['หลักฐาน','evidence','ข้อมูล','ค่า','ผลทดลอง']), causal=any(P,['เพราะ','เนื่องจาก','จึง','ดังนั้น','ทำให้','สัมพันธ์','because','therefore','ลดลง','เพิ่มขึ้น']);
let ps=+pc + +pe + +causal + +(pc&&pe&&!!C);
let rs=+(!!R)+ +(!!R&&rel)+ +(!!R&&pe)+ +(!!R&&pc);
let act=any(D,r.a), de=any(D,r.e)||any(D,['หลักฐาน','ข้อมูล','evidence','ความเสี่ยง','risk']), coherent=act&&rel&&pc&&!!R;
let ds=+(!!D)+ +act + +de + +coherent;
let f=[];
if(cs<4)f.push(cs<2?'CLAIM ALERT — Claim ยังไม่ระบุข้อสรุปทางฟิสิกส์ที่ตรวจสอบได้':'CLAIM ALERT — เชื่อม Claim กับผลการทดลองที่เลือกให้ชัดขึ้น');
if(es<4)f.push(!trace?'EVIDENCE ALERT — เลือก Evidence จากการทดลองจริงอย่างน้อย 2 รายการ':!rel?'EVIDENCE ALERT — Evidence ยังไม่สัมพันธ์กับตัวแปรสำคัญของคดี':!quant?'EVIDENCE ALERT — เพิ่มค่าที่วัดได้หรือข้อมูลเชิงปริมาณจาก Simulation':'EVIDENCE ALERT — ใช้หลักฐานหลายเงื่อนไขเพื่อเพิ่มความเพียงพอ');
if(ps<4)f.push(!pc?'REASONING ALERT — ระบุหลักฟิสิกส์ที่ใช้อธิบาย Evidence':!pe?'REASONING ALERT — มีหลักฟิสิกส์แล้ว แต่ยังไม่ได้เชื่อมกับ Evidence ที่วัดได้':!causal?'REASONING ALERT — อธิบายว่า Evidence สนับสนุน Claim เพราะเหตุใด':'REASONING ALERT — เชื่อม Evidence → Physics → Claim ให้ชัดขึ้น');
if(rs<4)f.push(!R?'RISK ALERT — เลือกระดับ Risk ก่อนตัดสินใจ':!rel?'RISK ALERT — Risk ยังไม่มี Evidence ที่เกี่ยวข้องรองรับ':'RISK ALERT — อธิบาย Risk ด้วย Evidence และหลักฟิสิกส์');
if(ds<4)f.push(!act?'DECISION ALERT — ระบุการกระทำที่ชัดเจนตามสถานการณ์':!de?'DECISION ALERT — เชื่อม Decision กับ Evidence หรือ Risk':'DECISION ALERT — ทำให้ Decision ต่อเนื่องจาก Claim → Evidence → Risk');
if(!f.length)f.push('DECISION VERIFIED — Claim, Evidence, Physics Reasoning, Risk และ Decision สอดคล้องกัน');
const rawTotal=cs+es+ps+rs+ds;
return {claim:cs*5,evidence:es*5,physics:ps*5,risk:rs*5,decision:ds*5,total:rawTotal*5,raw:{claim:cs,evidence:es,physics:ps,risk:rs,decision:ds,total:rawTotal},maxScore:100,engine:'RDA_RULE_BASED_V2_100'};}
return {evaluate};})();