
/**
 * RDA CLASSROOM BACKEND — Google Apps Script
 * Bound to one Google Sheet.
 * Student System -> doPost -> Google Sheets
 * Teacher System -> HtmlService + google.script.run
 */

const RDA_SHEETS = {
  STUDENTS: 'STUDENTS',
  ASSESSMENTS: 'ASSESSMENTS',
  CASES: 'CASES',
  EVENTS: 'EVENTS',
  SATISFACTION: 'SATISFACTION'
};
const DEFAULT_TEACHER_PIN = '2569';

function setupRDA() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Open this Apps Script from the target Google Sheet, then run setupRDA().');
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', ss.getId());
  if (!PropertiesService.getScriptProperties().getProperty('TEACHER_PIN')) {
    PropertiesService.getScriptProperties().setProperty('TEACHER_PIN', DEFAULT_TEACHER_PIN);
  }
  ensureSheet_(ss, RDA_SHEETS.STUDENTS, [
    'ResearchID','Username','PasswordHash','Name','School','Grade','ClassroomID','Specialty','RegisteredAt','UpdatedAt'
  ]);
  ensureSheet_(ss, RDA_SHEETS.ASSESSMENTS, [
    'Timestamp','ResearchID','Username','Name','ClassroomID','Type','Score',
    'Domain1','Domain2','Domain3','Domain4','Domain5','AnswersJSON'
  ]);
  ensureSheet_(ss, RDA_SHEETS.CASES, [
    'Timestamp','ResearchID','Username','Name','ClassroomID','CaseID',
    'InitialScore','RevisionScore','Prediction','Claim','Evidence','Reasoning',
    'Risk','Decision','Confidence','FeedbackJSON','ClosedAt','ConfidenceBefore'
  ]);
  ensureSheet_(ss, RDA_SHEETS.SATISFACTION, [
    'Timestamp','ResearchID','Username','Name','ClassroomID',
    'Q1','Q2','Q3','Q4','Q5','Q6','Q7','MeanScore','Comment'
  ]);
  ensureSheet_(ss, RDA_SHEETS.EVENTS, [
    'Timestamp','EventID','ResearchID','Username','ClassroomID','EventType','PayloadJSON'
  ]);
  return 'RDA Classroom backend initialized.';
}

function doGet(e) {
  if (e && e.parameter && e.parameter.view === 'teacher') {
    const tpl = HtmlService.createTemplateFromFile('TeacherDashboard');
    tpl.scriptUrl = ScriptApp.getService().getUrl(); // the real .../exec URL, immune to the googleusercontent.com redirect
    return tpl.evaluate()
      .setTitle('RDA Teacher Command Center')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  // Plain-fetch JSON API (bypasses google.script.run, which some browsers block via
  // third-party cookie / iframe-messaging restrictions). Used by TeacherDashboard.html.
  if (e && e.parameter && e.parameter.api) {
    const pin = e.parameter.pin || '';
    try {
      let data;
      if (e.parameter.api === 'dashboard') data = getClassDashboard(pin);
      else if (e.parameter.api === 'debug') data = getDebugInfo(pin);
      else return json_({ok:false, error:'Unknown api: ' + e.parameter.api});
      return json_(data);
    } catch (err) {
      return json_({ok:false, error: err.message});
    }
  }
  return json_({ok:true, service:'RDA Classroom API', time:new Date().toISOString()});
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    // ---- AUTH ACTIONS (register / login) ----
    if (body.action === 'register') {
      return handleRegister_(body);
    }
    if (body.action === 'login') {
      return handleLogin_(body);
    }

    // ---- SYNC EVENTS (existing flow) ----
    storeEvent_(body);
    return json_({ok:true, eventId:body.eventId || '', savedAt:new Date().toISOString()});
  } catch (err) {
    return json_({ok:false, error:String(err && err.message || err)});
  }
}

// ===================== AUTH HANDLERS =====================

function handleRegister_(body) {
  const username    = String(body.username    || '').trim().toLowerCase();
  const password    = String(body.password    || '');
  const name        = String(body.name        || '').trim();
  const school      = String(body.school      || '').trim();
  const grade       = String(body.grade       || '').trim();
  const classroomId = String(body.classroomId || '');

  if (!username)          return json_({ok:false, error:'USERNAME_REQUIRED'});
  if (!password)          return json_({ok:false, error:'PASSWORD_REQUIRED'});
  if (password.length < 4) return json_({ok:false, error:'PASSWORD_TOO_SHORT'});

  const ss = db_();
  const sh = ss.getSheetByName(RDA_SHEETS.STUDENTS);
  const values = sh.getDataRange().getValues();

  // Check duplicate username (col index 1 = Username)
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][1]).trim().toLowerCase() === username) {
      return json_({ok:false, error:'USERNAME_TAKEN'});
    }
  }

  const now = new Date();
  const researchId    = 'RDA-' + username.replace(/[^a-zA-Z0-9]/g,'').slice(0,12).toUpperCase() + '-' + now.getTime().toString(36).toUpperCase();
  const passwordHash  = hashPassword_(password);

  sh.appendRow([
    researchId, username, passwordHash, name, school, grade,
    classroomId, '', now, now
  ]);

  return json_({ok:true, created:true, researchId, username, name, school, grade});
}

function handleLogin_(body) {
  const username = String(body.username || '').trim().toLowerCase();
  const password = String(body.password || '');

  if (!username || !password) {
    return json_({ok:false, found:false, error:'MISSING_CREDENTIALS'});
  }

  const ss = db_();
  const sh = ss.getSheetByName(RDA_SHEETS.STUDENTS);
  const values = sh.getDataRange().getValues();
  // Header: ResearchID(0) Username(1) PasswordHash(2) Name(3) School(4) Grade(5) ClassroomID(6) Specialty(7) RegisteredAt(8) UpdatedAt(9)

  const passwordHash = hashPassword_(password);

  for (let i = 1; i < values.length; i++) {
    const row     = values[i];
    const rowUser = String(row[1]).trim().toLowerCase();
    if (rowUser === username) {
      const storedHash = String(row[2]);
      if (storedHash === passwordHash) {
        // Update UpdatedAt timestamp
        sh.getRange(i + 1, 10).setValue(new Date());
        return json_({
          ok:          true,
          found:       true,
          researchId:  String(row[0]),
          username:    String(row[1]),
          name:        String(row[3]),
          school:      String(row[4]),
          grade:       String(row[5]),
          classroomId: String(row[6]),
          specialty:   String(row[7])
        });
      } else {
        return json_({ok:false, found:false, error:'INVALID_CREDENTIALS'});
      }
    }
  }

  return json_({ok:false, found:false, error:'USER_NOT_FOUND'});
}

// SHA-256 hash using GAS built-in Utilities
function hashPassword_(password) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    password,
    Utilities.Charset.UTF_8
  );
  return bytes.map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');
}

// ===================== EXISTING SYNC =====================

function storeEvent_(evt) {
  const ss = db_();
  const p = evt.profile || {};
  const d = evt.data || {};
  ss.getSheetByName(RDA_SHEETS.EVENTS).appendRow([
    new Date(), evt.eventId || '', p.researchId || '', p.username || '',
    p.classroomId || '', evt.type || '', JSON.stringify(d)
  ]);
  upsertStudent_(ss, p);

  if (evt.type === 'assessment') {
    const areas = Array.isArray(d.areas) ? d.areas : [];
    ss.getSheetByName(RDA_SHEETS.ASSESSMENTS).appendRow([
      new Date(), p.researchId || '', p.username || '', p.name || '', p.classroomId || '',
      d.assessmentType || '', Number(d.score || 0),
      Number(areas[0] || 0),Number(areas[1] || 0),Number(areas[2] || 0),Number(areas[3] || 0),Number(areas[4] || 0),
      JSON.stringify(d.answers || [])
    ]);
  }

  if (evt.type === 'satisfaction') {
    ensureSheet_(ss, RDA_SHEETS.SATISFACTION, [
      'Timestamp','ResearchID','Username','Name','ClassroomID',
      'Q1','Q2','Q3','Q4','Q5','Q6','Q7','MeanScore','Comment'
    ]); // self-heals header row even on sheets created before this update
    const ans = Array.isArray(d.answers) ? d.answers : [];
    const mean = ans.length ? ans.reduce((a,b)=>a+Number(b||0),0) / ans.length : 0;
    ss.getSheetByName(RDA_SHEETS.SATISFACTION).appendRow([
      new Date(), p.researchId || '', p.username || '', p.name || '', p.classroomId || '',
      Number(ans[0]||0),Number(ans[1]||0),Number(ans[2]||0),Number(ans[3]||0),Number(ans[4]||0),Number(ans[5]||0),Number(ans[6]||0),
      Number(mean.toFixed(2)), d.comment || ''
    ]);
  }

  if (evt.type === 'case_closed') {
    ensureSheet_(ss, RDA_SHEETS.CASES, [
      'Timestamp','ResearchID','Username','Name','ClassroomID','CaseID',
      'InitialScore','RevisionScore','Prediction','Claim','Evidence','Reasoning',
      'Risk','Decision','Confidence','FeedbackJSON','ClosedAt','ConfidenceBefore'
    ]); // self-heals header row (adds ConfidenceBefore column) even on sheets created before this update
    ss.getSheetByName(RDA_SHEETS.CASES).appendRow([
      new Date(), p.researchId || '', p.username || '', p.name || '', p.classroomId || '',
      d.caseId || '', Number(d.initialScore || 0), Number(d.revisionScore || 0),
      d.prediction || '', d.claim || '', d.evidence || '', d.reasoning || '',
      d.risk || '', d.decision || '', d.confidence || '', JSON.stringify(d.feedback || []), d.closedAt || '',
      d.confidenceBefore || ''
    ]);
  }
}

function upsertStudent_(ss, p) {
  if (!p || !p.researchId) return;
  const sh = ss.getSheetByName(RDA_SHEETS.STUDENTS);
  const values = sh.getDataRange().getValues();
  let row = 0;
  for (let i=1;i<values.length;i++) if (String(values[i][0]) === String(p.researchId)) { row=i+1; break; }
  if (!row) return; // Don't auto-create from sync events — use register action instead
  const now = new Date();
  // Only update non-auth profile fields (Name, School, Grade, ClassroomID, Specialty, UpdatedAt)
  if (p.name)        sh.getRange(row, 4).setValue(p.name);
  if (p.school)      sh.getRange(row, 5).setValue(p.school);
  if (p.grade)       sh.getRange(row, 6).setValue(p.grade);
  if (p.classroomId) sh.getRange(row, 7).setValue(p.classroomId);
  if (p.specialty)   sh.getRange(row, 8).setValue(p.specialty);
  sh.getRange(row, 10).setValue(now);
}

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
        initial = rawInitial > 0 ? rawInitial * 5 : 0;
        revision = rawRevision > 0 ? rawRevision * 5 : 0;
        rubricMaxScore = 100;
      }
    }
    if (!latestCase[key] || t >= latestCase[key]._t) {
      latestCase[key] = {
        caseId, initial, revision,
        score: revision > 0 ? revision : initial,
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
  ['R01','R02','R03','R04','R05','R06'].forEach(id => {
    const vals = list.map(s => s.cases[id]?.score).filter(v => Number.isFinite(v) && v > 0);
    caseAverages[id] = avg(vals);
  });

  return {
    ok:true, generatedAt:new Date().toISOString(),
    summary:{
      students:list.length,
      preAverage:avg(preScores), postAverage:avg(postScores),
      conceptualGain:avg(postScores)-avg(preScores),
      postCompleted:list.filter(s=>s.post).length,
      caseAverages
    },
    students:list
  };
}

function setTeacherPin(newPin) {
  if (!newPin || String(newPin).length < 4) throw new Error('PIN must contain at least 4 characters.');
  PropertiesService.getScriptProperties().setProperty('TEACHER_PIN', String(newPin));
  return 'Teacher PIN updated.';
}

function getDebugInfo(pin) {
  verifyTeacher_(pin);
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || '(ยังไม่ได้ตั้งค่า / ยังไม่ได้รัน setupRDA)';
  let ssName = '(เปิดไม่ได้)', studentsRows = -1, casesRows = -1, assessRows = -1, ssUrl = '';
  let studentsHeader = [], studentsFirstRow = [], byIdCount = -1, sampleKeys = [];
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
      studentsFirstRow = raw[1] || [];
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
    studentsFirstRow: studentsFirstRow,
    byIdCount: byIdCount,
    sampleKeys: sampleKeys
  };
}

function verifyTeacher_(pin) {
  const expected=PropertiesService.getScriptProperties().getProperty('TEACHER_PIN') || DEFAULT_TEACHER_PIN;
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
