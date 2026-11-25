/**
 * RDA CLASSROOM BACKEND — V6.9.4 Stable Integrity Fix
 * Bound to one Google Sheet.
 * Security model: login/register -> short-lived session token -> authenticated, idempotent sync.
 */

const RDA_SHEETS = {
  STUDENTS: 'STUDENTS', ASSESSMENTS: 'ASSESSMENTS', CASES: 'CASES',
  EVENTS: 'EVENTS', SATISFACTION: 'SATISFACTION', SESSIONS: 'SESSIONS'
};
const SESSION_HOURS = 24;
const PASSWORD_ITERATIONS = 3000;


/**
 * ONE-CLICK INSTALLER — run this once after pasting this file.
 * It initializes the database and generates a strong Teacher PIN automatically.
 * No PIN needs to be written into source code.
 */
function setupV694() {
  const setupMessage = setupRDA();
  setTeacherPin("25692569");
  const result =
    'RDA V6.9.4 READY\n' +
    'Teacher PIN installed successfully.\n' +
    'Deploy a NEW VERSION of the Web App.\n' +
    'Backend initialized successfully.';
  console.log(result);
  return result;
}


function setupRDA() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Open this Apps Script from the target Google Sheet, then run setupRDA().');
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', ss.getId());
  ensureSheet_(ss, RDA_SHEETS.STUDENTS, [
    'ResearchID','Username','PasswordHash','Name','School','Grade','ClassroomID','Specialty','RegisteredAt','UpdatedAt','PasswordSalt','PasswordVersion'
  ]);
  ensureSheet_(ss, RDA_SHEETS.ASSESSMENTS, [
    'Timestamp','ResearchID','Username','Name','ClassroomID','Type','Score','Domain1','Domain2','Domain3','Domain4','Domain5','AnswersJSON'
  ]);
  ensureSheet_(ss, RDA_SHEETS.CASES, [
    'Timestamp','ResearchID','Username','Name','ClassroomID','CaseID','InitialScore','RevisionScore','Prediction','Claim','Evidence','Reasoning',
    'Risk','Decision','Confidence','FeedbackJSON','ClosedAt','ConfidenceBefore'
  ]);
  ensureSheet_(ss, RDA_SHEETS.SATISFACTION, [
    'Timestamp','ResearchID','Username','Name','ClassroomID','Q1','Q2','Q3','Q4','Q5','Q6','Q7','MeanScore','Comment'
  ]);
  ensureSheet_(ss, RDA_SHEETS.EVENTS, ['Timestamp','EventID','ResearchID','Username','ClassroomID','EventType','PayloadJSON']);
  ensureSheet_(ss, RDA_SHEETS.SESSIONS, ['TokenHash','ResearchID','Username','ExpiresAt','CreatedAt']);
  return 'RDA V6.9.4 backend initialized. IMPORTANT: run setTeacherPin("a-strong-pin") before teacher use.';
}

function doGet(e) {
  if (e && e.parameter && e.parameter.view === 'teacher') {
    const tpl = HtmlService.createTemplateFromFile('TeacherDashboard');
    return tpl.evaluate().setTitle('RDA Teacher Command Center').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  return json_({ok:true, service:'RDA Classroom API', version:'6.9.4', time:new Date().toISOString()});
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (body.action === 'register') return handleRegister_(body);
    if (body.action === 'login') return handleLogin_(body);
    if (!body.eventId) return json_({ok:false,error:'EVENT_ID_REQUIRED'});
    const identity = validateSession_(body.authToken);
    const result = storeEvent_(body, identity);
    return json_({ok:true, eventId:body.eventId, duplicate:!!result.duplicate, savedAt:new Date().toISOString()});
  } catch (err) {
    return json_({ok:false, eventId:'', error:String(err && err.message || err)});
  }
}

function handleRegister_(body) {
  const username = String(body.username||'').trim().toLowerCase();
  const password = String(body.password||'');
  const name = String(body.name||'').trim(), school=String(body.school||'').trim(), grade=String(body.grade||'').trim();
  const classroomId=String(body.classroomId||'').trim();
  if (!/^[a-z0-9._-]{3,40}$/.test(username)) return json_({ok:false,error:'USERNAME_INVALID'});
  if (password.length < 8) return json_({ok:false,error:'PASSWORD_TOO_SHORT'});
  const ss=db_(), sh=ss.getSheetByName(RDA_SHEETS.STUDENTS), values=sh.getDataRange().getValues();
  for(let i=1;i<values.length;i++) if(String(values[i][1]).trim().toLowerCase()===username) return json_({ok:false,error:'USERNAME_TAKEN'});
  const now=new Date(), researchId='RDA-'+username.replace(/[^a-z0-9]/gi,'').slice(0,12).toUpperCase()+'-'+now.getTime().toString(36).toUpperCase();
  const salt=Utilities.getUuid().replace(/-/g,'');
  const hash=hashPasswordV2_(password,salt);
  sh.appendRow([researchId,username,hash,safeCell_(name),safeCell_(school),safeCell_(grade),safeCell_(classroomId),'',now,now,salt,'V2']);
  const sess=issueSession_(researchId,username);
  return json_({ok:true,created:true,researchId,username,name,school,grade,sessionToken:sess.token,sessionExpiresAt:sess.expiresAt});
}

function handleLogin_(body) {
  const username=String(body.username||'').trim().toLowerCase(), password=String(body.password||'');
  if(!username||!password) return json_({ok:false,found:false,error:'MISSING_CREDENTIALS'});
  const ss=db_(), sh=ss.getSheetByName(RDA_SHEETS.STUDENTS), values=sh.getDataRange().getValues();
  for(let i=1;i<values.length;i++){
    const row=values[i]; if(String(row[1]).trim().toLowerCase()!==username) continue;
    const stored=String(row[2]||''), salt=String(row[10]||''), ver=String(row[11]||'');
    let ok=false;
    if(ver==='V2' && salt) ok=constantTimeEq_(stored,hashPasswordV2_(password,salt));
    else ok=constantTimeEq_(stored,hashPasswordLegacy_(password));
    if(!ok) return json_({ok:false,found:false,error:'INVALID_CREDENTIALS'});
    if(ver!=='V2' || !salt){
      const newSalt=Utilities.getUuid().replace(/-/g,'');
      sh.getRange(i+1,3).setValue(hashPasswordV2_(password,newSalt));
      sh.getRange(i+1,11).setValue(newSalt); sh.getRange(i+1,12).setValue('V2');
    }
    sh.getRange(i+1,10).setValue(new Date());
    const sess=issueSession_(String(row[0]),String(row[1]));
    return json_({ok:true,found:true,researchId:String(row[0]),username:String(row[1]),name:String(row[3]),school:String(row[4]),grade:String(row[5]),classroomId:String(row[6]),specialty:String(row[7]),sessionToken:sess.token,sessionExpiresAt:sess.expiresAt});
  }
  return json_({ok:false,found:false,error:'USER_NOT_FOUND'});
}

function hashPasswordLegacy_(password){
  const bytes=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(password),Utilities.Charset.UTF_8);
  return bytes.map(b=>('0'+(b&255).toString(16)).slice(-2)).join('');
}
function hashPasswordV2_(password,salt){
  let value=String(salt)+':'+String(password);
  for(let i=0;i<PASSWORD_ITERATIONS;i++) value=hashPasswordLegacy_(value+':'+salt+':'+i);
  return value;
}
function constantTimeEq_(a,b){ a=String(a);b=String(b);let d=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)d|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return d===0; }
function tokenHash_(token){return hashPasswordLegacy_('RDA_SESSION:'+String(token||''));}
function issueSession_(researchId,username){
  const ss=db_(), sh=ss.getSheetByName(RDA_SHEETS.SESSIONS); cleanExpiredSessions_(sh);
  const token=Utilities.getUuid()+Utilities.getUuid(), now=new Date(), exp=new Date(now.getTime()+SESSION_HOURS*3600000);
  sh.appendRow([tokenHash_(token),researchId,username,exp,now]);
  return {token,expiresAt:exp.toISOString()};
}
function validateSession_(token){
  if(!token) throw new Error('AUTH_REQUIRED');
  const ss=db_(), sh=ss.getSheetByName(RDA_SHEETS.SESSIONS), rows=sh.getDataRange().getValues(), hash=tokenHash_(token), now=Date.now();
  for(let i=1;i<rows.length;i++){
    if(!constantTimeEq_(String(rows[i][0]||''),hash)) continue;
    const exp=new Date(rows[i][3]).getTime(); if(!Number.isFinite(exp)||exp<now) throw new Error('SESSION_EXPIRED');
    return studentIdentity_(ss,String(rows[i][1]||''));
  }
  throw new Error('AUTH_REQUIRED');
}
function cleanExpiredSessions_(sh){
  const rows=sh.getDataRange().getValues(), now=Date.now();
  for(let i=rows.length-1;i>=1;i--){const t=new Date(rows[i][3]).getTime();if(!Number.isFinite(t)||t<now)sh.deleteRow(i+1);}
}
function studentIdentity_(ss,researchId){
  const sh=ss.getSheetByName(RDA_SHEETS.STUDENTS), rows=sh.getDataRange().getValues();
  for(let i=1;i<rows.length;i++) if(String(rows[i][0])===researchId) return {researchId:String(rows[i][0]),username:String(rows[i][1]),name:String(rows[i][3]),school:String(rows[i][4]),grade:String(rows[i][5]),classroomId:String(rows[i][6]),specialty:String(rows[i][7]),row:i+1};
  throw new Error('STUDENT_NOT_FOUND');
}

function storeEvent_(evt,p){
  const lock=LockService.getScriptLock(); if(!lock.tryLock(5000)) throw new Error('SERVER_BUSY_RETRY');
  try{
    const ss=db_(), events=ss.getSheetByName(RDA_SHEETS.EVENTS), eventId=String(evt.eventId||'');
    if(events.getLastRow()>1){
      const hit=events.getRange(2,2,events.getLastRow()-1,1).createTextFinder(eventId).matchEntireCell(true).findNext();
      if(hit) return {duplicate:true};
    }
    const d=evt.data||{}, type=String(evt.type||'');
    if(!['student_profile','assessment','satisfaction','case_closed','snapshot'].includes(type)) throw new Error('INVALID_EVENT_TYPE');

    let caseRow=null;
    if(type==='case_closed'){
      const caseId=String(d.caseId||'').toUpperCase().replace(/[^R0-9]/g,'');
      if(!/^R0[1-6]$/.test(caseId)) throw new Error('INVALID_CASE_ID');
      const required=[d.claim,d.evidence,d.reasoning,d.risk,d.decision];
      if(required.some(v=>String(v||'').trim().length===0)) throw new Error('CASE_RECORD_INCOMPLETE');
      const initial=clamp_(d.initialScore,0,100);
      let revision=clamp_(d.revisionScore,0,100);
      if(/^R0[1-4]$/.test(caseId)) revision=serverRubricScore_(caseId,d);
      if(revision<60) throw new Error('CASE_SCORE_BELOW_PASS');
      caseRow=[new Date(),p.researchId,p.username,safeCell_(p.name),safeCell_(p.classroomId),caseId,initial,revision,
        safeCell_(d.prediction||''),safeCell_(d.claim||''),safeCell_(d.evidence||''),safeCell_(d.reasoning||''),safeCell_(d.risk||''),
        safeCell_(d.decision||''),safeCell_(d.confidence||''),JSON.stringify((d.feedback||[]).concat([{__rdaServer:{version:'6.9.4',score:revision}}])),
        safeCell_(d.closedAt||''),clamp_(d.confidenceBefore,0,5)];
    }

    upsertStudent_(ss,p);
    if(type==='assessment'){
      const areas=Array.isArray(d.areas)?d.areas:[];
      ss.getSheetByName(RDA_SHEETS.ASSESSMENTS).appendRow([new Date(),p.researchId,p.username,safeCell_(p.name),safeCell_(p.classroomId),safeCell_(d.assessmentType||''),clamp_(d.score,0,20),...([0,1,2,3,4].map(i=>clamp_(areas[i],0,20))),JSON.stringify(d.answers||[])]);
    }
    if(type==='satisfaction'){
      const ans=Array.isArray(d.answers)?d.answers.slice(0,7).map(v=>clamp_(v,0,5)):[];
      const mean=ans.length?ans.reduce((a,b)=>a+b,0)/ans.length:0;
      ss.getSheetByName(RDA_SHEETS.SATISFACTION).appendRow([new Date(),p.researchId,p.username,safeCell_(p.name),safeCell_(p.classroomId),...([0,1,2,3,4,5,6].map(i=>Number(ans[i]||0))),Number(mean.toFixed(2)),safeCell_(d.comment||'')]);
    }
    if(caseRow) ss.getSheetByName(RDA_SHEETS.CASES).appendRow(caseRow);
    events.appendRow([new Date(),eventId,p.researchId,p.username,safeCell_(p.classroomId),type,JSON.stringify(d)]);
    return {duplicate:false};
  } finally { lock.releaseLock(); }
}

function serverRubricScore_(caseId,d){
  const cfg={
    R01:{c:['alpha','beta','gamma','แอลฟา','บีตา','แกมมา','ทะลุ','ลดทอน'],e:['paper','aluminium','lead','กระดาษ','อะลูมิเนียม','ตะกั่ว','count','อัตราการนับ'],a:['ระบุ','จำแนก','ตรวจสอบ','identify']},
    R02:{c:['shield','กำบัง','ลดทอน','ทะลุผ่าน','วัสดุ','ความหนา'],e:['aluminium','lead','paper','อะลูมิเนียม','ตะกั่ว','กระดาษ','ก่อน','หลัง','ลดลง'],a:['เลือก','ใช้','กำบัง','ป้องกัน','shield']},
    R03:{c:['distance','time','inverse','square','ระยะ','เวลา','ความเข้ม','exposure','dose'],e:['meter','min','เมตร','นาที','distance','time','ระยะ','เวลา','rate','อัตรา'],a:['เพิ่มระยะ','ลดเวลา','จำกัดเวลา','ถอยห่าง']},
    R04:{c:['half-life','ครึ่งชีวิต','decay','สลาย','exponential','50%','25%','12.5%'],e:['half-life','ครึ่งชีวิต','50','25','12.5','เวลา','วัน','ชั่วโมง','activity','กัมมันตภาพ'],a:['ติดตาม','จัดเก็บ','รอ','ควบคุม','ประเมินเวลา']}
  }[caseId];
  const n=v=>String(v||'').toLowerCase().replace(/\s+/g,' ').trim();
  const any=(v,a)=>a.some(x=>n(v).indexOf(n(x))>=0);
  const nums=v=>(String(v||'').match(/-?\d+(?:\.\d+)?/g)||[]);
  const C=n(d.claim),E=n(d.evidence),P=n(d.reasoning),R=n(d.risk),D=n(d.decision);
  const trace=/evidence\s*#|e\d+:/i.test(E), rel=any(E,cfg.e), diverse=cfg.e.filter(v=>E.indexOf(n(v))>=0).length>=2, quant=nums(E).length>=2;
  const es=+trace + +rel + +diverse + +quant;
  const cs=+(!!C)+ +(any(C,cfg.c)||any(C,cfg.e)||any(C,['ลด','เพิ่ม','สูง','ต่ำ','เหลือ','ผ่าน'])) + +(rel&&(any(C,cfg.c)||any(C,cfg.e))) + +(trace&&rel&&!!C);
  const pc=any(P,cfg.c), pe=any(P,cfg.e)||any(P,['หลักฐาน','evidence','ข้อมูล','ค่า','ผลทดลอง']), causal=any(P,['เพราะ','เนื่องจาก','จึง','ดังนั้น','ทำให้','สัมพันธ์','because','therefore','ลดลง','เพิ่มขึ้น']);
  const ps=+pc + +pe + +causal + +(pc&&pe&&!!C);
  const riskLevel=any(R,['low','moderate','medium','high','critical','ต่ำ','ปานกลาง','สูง','วิกฤต']);
  const riskMechanism=any(R,cfg.c)||any(R,cfg.e)||any(P,cfg.c)||any(P,cfg.e)||any(P,['dose','exposure','ปริมาณรังสี','การรับรังสี','ปนเปื้อน','ทะลุผ่าน','สลาย','ประชาชน','บุคลากร']);
  const riskCausal=any(P,['เพราะ','เนื่องจาก','จากหลักฐาน','จึง','ทำให้','because','therefore']);
  const rs=+(!!R)+ +riskLevel + +riskMechanism + +(riskCausal&&rel&&pe);
  const act=any(D,cfg.a), de=any(D,cfg.e)||any(D,['หลักฐาน','ข้อมูล','evidence','ความเสี่ยง','risk']), coherent=act&&rel&&pc&&!!R;
  const ds=+(!!D)+ +act + +de + +coherent;
  return (cs+es+ps+rs+ds)*5;
}

function upsertStudent_(ss,p){
  if(!p||!p.researchId)return; const sh=ss.getSheetByName(RDA_SHEETS.STUDENTS), row=p.row||0; if(!row)return;
  if(p.name)sh.getRange(row,4).setValue(safeCell_(p.name)); if(p.school)sh.getRange(row,5).setValue(safeCell_(p.school)); if(p.grade)sh.getRange(row,6).setValue(safeCell_(p.grade)); if(p.classroomId)sh.getRange(row,7).setValue(safeCell_(p.classroomId)); if(p.specialty)sh.getRange(row,8).setValue(safeCell_(p.specialty)); sh.getRange(row,10).setValue(new Date());
}
function clamp_(v,min,max){const n=Number(v);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):min;}
function safeCell_(v){const s=String(v==null?'':v);return /^[=+\-@]/.test(s)?("'"+s):s;}

function getClassDashboard(pin) {
  verifyTeacher_(pin);
  const ss = db_();
  const students = sheetObjects_(ss.getSheetByName(RDA_SHEETS.STUDENTS));
  const assessments = sheetObjects_(ss.getSheetByName(RDA_SHEETS.ASSESSMENTS));
  const cases = sheetObjects_(ss.getSheetByName(RDA_SHEETS.CASES));
  const satSheet = ss.getSheetByName(RDA_SHEETS.SATISFACTION);
  const satisfaction = satSheet ? sheetObjects_(satSheet) : [];

  const normId = v => String(v == null ? '' : v).trim();
  const normCase = v => String(v == null ? '' : v).trim().toUpperCase().replace(/\s+/g,'').replace(/^R-/, 'R');
  const num = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
  const time = v => { const t = v ? new Date(v).getTime() : 0; return Number.isFinite(t) ? t : 0; };

  const byId = {};
  students.forEach(s => {
    const id = normId(s.ResearchID);
    if (!id) return;
    byId[id] = {
      researchId:id, username:s.Username, name:s.Name, school:s.School,
      grade:s.Grade, classroomId:s.ClassroomID, specialty:s.Specialty || '',
      pre:null, post:null, cases:{}, satisfaction:null
    };
  });

  // Keep the latest PRE/POST record per student.
  const latestAssess = {};
  assessments.forEach(a => {
    const id = normId(a.ResearchID), type = String(a.Type || '').trim().toUpperCase();
    if (!byId[id] || !['PRE','POST'].includes(type)) return;
    const key = id + '|' + type, t = time(a.Timestamp);
    if (!latestAssess[key] || t >= latestAssess[key]._t) {
      latestAssess[key] = {
        score:num(a.Score),
        domains:[1,2,3,4,5].map(i => num(a['Domain'+i])),
        timestamp:a.Timestamp || '', _t:t
      };
    }
  });
  Object.keys(latestAssess).forEach(key => {
    const [id,type] = key.split('|');
    const rec = latestAssess[key]; delete rec._t;
    byId[id][type.toLowerCase()] = rec;
  });

  // Keep the latest record per student + normalized mission ID.
  const latestCase = {};
  cases.forEach(c => {
    const id = normId(c.ResearchID), caseId = normCase(c.CaseID);
    if (!byId[id] || !/^R0[1-6]$/.test(caseId)) return;
    const key = id + '|' + caseId, t = time(c.Timestamp);
    const rawInitial = num(c.InitialScore), rawRevision = num(c.RevisionScore);
    let initial = rawInitial, revision = rawRevision;
    let rubricMaxScore = 100;
    // Existing R01-R04 CASES rows were written by the legacy rubric as /20.
    // New rows carry a metadata marker inside the existing FeedbackJSON column, so no sheet schema change is required.
    if (/^R0[1-4]$/.test(caseId)) {
      let isUnified100 = false;
      try {
        const fb = JSON.parse(String(c.FeedbackJSON || '[]'));
        isUnified100 = Array.isArray(fb) && fb.some(x => x && x.__rdaMeta && Number(x.__rdaMeta.rubricMaxScore) === 100);
      } catch(e) {}
      if (!isUnified100) {
        initial = rawInitial > 0 ? Math.min(100, rawInitial * 5) : 0;
        revision = rawRevision > 0 ? Math.min(100, rawRevision * 5) : 0;
        rubricMaxScore = 100;
      }
    }
    if (!latestCase[key] || t >= latestCase[key]._t) {
      latestCase[key] = {
        caseId, initial, revision,
        // Research dashboard: InitialScore is the independent decision-quality measure.
        // Keep score for backward compatibility with any older consumers.
        score: initial,
        revisionGain: revision > 0 ? revision - initial : null,
        rubricMaxScore,
        risk:c.Risk || '', closedAt:c.ClosedAt || c.Timestamp || '',
        confidenceBefore:num(c.ConfidenceBefore), confidenceAfter:num(c.Confidence || c.ConfidenceAfter),
        _t:t
      };
    }
  });
  Object.keys(latestCase).forEach(key => {
    const [id,caseId] = key.split('|');
    const rec = latestCase[key]; delete rec._t;
    byId[id].cases[caseId] = rec;
  });

  satisfaction.forEach(row => {
    const id = normId(row.ResearchID);
    if (!byId[id]) return;
    byId[id].satisfaction = {
      q:[1,2,3,4,5,6,7].map(i => num(row['Q'+i])),
      mean:num(row.MeanScore), comment:row.Comment || '', timestamp:row.Timestamp || ''
    };
  });

  const list = Object.values(byId);
  const avg = a => a.length ? a.reduce((x,y)=>x+y,0)/a.length : 0;
  const preScores = list.filter(s=>s.pre).map(s=>num(s.pre.score));
  const postScores = list.filter(s=>s.post).map(s=>num(s.post.score));
  const caseAverages = {};
  const revisionAverages = {};
  const revisionGainAverages = {};
  ['R01','R02','R03','R04','R05','R06'].forEach(id => {
    const initialVals = list.map(s => s.cases[id]?.initial)
      .filter(v => Number.isFinite(v) && v > 0);
    const revisedVals = list.map(s => s.cases[id]?.revision)
      .filter(v => Number.isFinite(v) && v > 0);
    const gainVals = list.map(s => s.cases[id])
      .filter(c => c && Number.isFinite(c.initial) && c.initial > 0 &&
                   Number.isFinite(c.revision) && c.revision > 0)
      .map(c => c.revision - c.initial);
    caseAverages[id] = avg(initialVals);
    revisionAverages[id] = avg(revisedVals);
    revisionGainAverages[id] = avg(gainVals);
  });

  return {
    ok:true, generatedAt:new Date().toISOString(),
    summary:{
      students:list.length,
      preAverage:avg(preScores), postAverage:avg(postScores),
      conceptualGain:avg(postScores)-avg(preScores),
      postCompleted:list.filter(s=>s.post).length,
      caseAverages,
      revisionAverages,
      revisionGainAverages
    },
    students:list
  };
}


/**
 * Dashboard transport wrapper.
 * google.script.run can be sensitive to nested spreadsheet values such as Date objects.
 * Returning one JSON string guarantees a stable client/server payload.
 */
function getClassDashboardJson(pin) {
  const data = getClassDashboard(pin);
  return JSON.stringify(data, function(key, value) {
    if (value instanceof Date) return value.toISOString();
    return value;
  });
}

function setTeacherPin(newPin) {
  if (!newPin || String(newPin).length < 8) throw new Error('PIN must contain at least 8 characters.');
  PropertiesService.getScriptProperties().setProperty('TEACHER_PIN', String(newPin));
  return 'Teacher PIN updated.';
}

function getDebugInfo(pin) {
  verifyTeacher_(pin);
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || '(ยังไม่ได้ตั้งค่า / ยังไม่ได้รัน setupRDA)';
  let ssName = '(เปิดไม่ได้)', studentsRows = -1, casesRows = -1, assessRows = -1, ssUrl = '';
  let studentsHeader = [], byIdCount = -1, sampleKeys = [];
  try {
    const ss = SpreadsheetApp.openById(id);
    ssName = ss.getName();
    ssUrl = ss.getUrl();
    const stSheet = ss.getSheetByName(RDA_SHEETS.STUDENTS);
    const caSheet = ss.getSheetByName(RDA_SHEETS.CASES);
    const asSheet = ss.getSheetByName(RDA_SHEETS.ASSESSMENTS);
    studentsRows = stSheet ? Math.max(0, stSheet.getLastRow() - 1) : -1;
    casesRows = caSheet ? Math.max(0, caSheet.getLastRow() - 1) : -1;
    assessRows = asSheet ? Math.max(0, asSheet.getLastRow() - 1) : -1;

    if (stSheet) {
      const objs = sheetObjects_(stSheet);
      const raw = stSheet.getDataRange().getValues();
      studentsHeader = raw[0] || [];
      const byId = {};
      objs.forEach(s => { byId[s.ResearchID] = true; });
      sampleKeys = Object.keys(byId).slice(0, 5);
      byIdCount = Object.keys(byId).length;
    }
  } catch (e) {
    ssName = 'ERROR: ' + e.message;
  }
  return {
    ok: true,
    boundSpreadsheetId: id,
    boundSpreadsheetName: ssName,
    boundSpreadsheetUrl: ssUrl,
    studentsRowCount: studentsRows,
    casesRowCount: casesRows,
    assessmentsRowCount: assessRows,
    studentsHeader: studentsHeader,
    byIdCount: byIdCount,
    sampleKeys: sampleKeys
  };
}

function verifyTeacher_(pin) {
  const expected=PropertiesService.getScriptProperties().getProperty('TEACHER_PIN');
  if (!expected) throw new Error('Teacher PIN is not configured. Run setupRDA() and setTeacherPin().');
  if (String(pin || '') !== String(expected)) throw new Error('Teacher PIN incorrect.');
}
function db_() {
  const id=PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('Run setupRDA() once from the bound spreadsheet.');
  return SpreadsheetApp.openById(id);
}
function ensureSheet_(ss,name,headers) {
  let sh=ss.getSheetByName(name);
  if(!sh) sh=ss.insertSheet(name);
  if(sh.getLastRow()===0) sh.appendRow(headers);
  else sh.getRange(1,1,1,headers.length).setValues([headers]);
  sh.setFrozenRows(1);
  return sh;
}
function sheetObjects_(sh) {
  const rows=sh.getDataRange().getValues();
  if(rows.length<2)return [];
  const h=rows[0].map(String);
  return rows.slice(1).map(r=>Object.fromEntries(h.map((k,i)=>[k,r[i]])));
}
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
