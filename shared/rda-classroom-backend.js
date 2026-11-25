
/* ===== RDA STUDENT CLASSROOM BACKEND BRIDGE =====
   Student System -> Google Apps Script -> Google Sheets
   localStorage remains the offline-first backup.
*/
window.RDAClassroomConfig = Object.assign({
  apiUrl: 'PASTE_APPS_SCRIPT_WEB_APP_URL_HERE',
  classroomId: 'M6-1',
  enabled: true
}, window.RDAClassroomConfig || {});

window.RDABackend = (() => {
  const QUEUE_KEY     = 'RDA_SYNC_QUEUE_V1';
  const RID_KEY       = 'RDA_RESEARCH_ID';
  const LAST_SYNC_KEY = 'RDA_LAST_SYNC_AT';
  const AUTH_KEY      = 'RDA_AUTH_V1'; // stores verified auth from Sheets

  const configured = () => /^https:\/\/script\.google\.com\/macros\/s\//.test(String(window.RDAClassroomConfig.apiUrl || ''));

  function safe(k) {
    try { return JSON.parse(localStorage.getItem(k) || '{}'); }
    catch(e) { return {}; }
  }

  function researchId() {
    let id = localStorage.getItem(RID_KEY);
    if (!id) {
      const entry = safe('rdaEntry');
      const seed  = (entry.username || 'student').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 18);
      id = 'RDA-' + seed + '-' + Date.now().toString(36).toUpperCase();
      localStorage.setItem(RID_KEY, id);
    }
    return id;
  }

  function profile() {
    const e = safe('rdaEntry');
    return {
      researchId:  researchId(),
      username:    e.username    || '',
      name:        e.name        || '',
      school:      e.school      || '',
      grade:       e.grade       || '',
      specialty:   e.specialty   || '',
      classroomId: window.RDAClassroomConfig.classroomId || ''
    };
  }

  function queue() {
    try { const q = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); return Array.isArray(q) ? q : []; }
    catch(e) { return []; }
  }
  function saveQueue(q) { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); }

  function status(text, state = 'pending') {
    let el = document.getElementById('rdaCloudSyncStatus');
    if (!el) {
      el = document.createElement('button');
      el.id        = 'rdaCloudSyncStatus';
      el.type      = 'button';
      el.className = 'rda-cloud-sync ' + state;
      el.onclick   = () => flush(true);
      document.body.appendChild(el);
    }
    el.className   = 'rda-cloud-sync ' + state;
    el.textContent = text;
  }

  function enqueue(type, data = {}) {
    const q = queue();
    q.push({
      eventId:    'EV-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8),
      type,
      clientTime: new Date().toISOString(),
      profile:    profile(),
      data
    });
    saveQueue(q);
    status(`☁ SYNC PENDING ${q.length}`, 'pending');
    flush();
  }

  async function flush(force = false) {
    const q = queue();
    if (!q.length) {
      status(configured() ? '☁ SYNCED' : '☁ OFFLINE BACKUP', 'synced');
      return true;
    }
    if (!configured()) {
      status(`☁ OFFLINE BACKUP ${q.length}`, 'offline');
      return false;
    }
    if (!navigator.onLine && !force) {
      status(`☁ OFFLINE • ${q.length} PENDING`, 'offline');
      return false;
    }
    const remaining = [...q];
    while (remaining.length) {
      const event = remaining[0];
      try {
        await fetch(window.RDAClassroomConfig.apiUrl, {
          method:  'POST',
          mode:    'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body:    JSON.stringify(event),
          cache:   'no-store'
        });
        remaining.shift();
        saveQueue(remaining);
        localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
      } catch(err) {
        saveQueue(remaining);
        status(`☁ SYNC PENDING ${remaining.length}`, 'pending');
        return false;
      }
    }
    status('☁ SYNCED', 'synced');
    return true;
  }

  // ============================================================
  // AUTH: REGISTER — sends to GAS action=register
  // Returns: { ok, created, researchId, name, ... } | { ok:false, error }
  // ============================================================
  async function registerUser(data) {
    if (!configured()) {
      return { ok: true, created: true, offline: true };
    }
    try {
      const payload = {
        action:      'register',
        username:    (data.username || '').trim().toLowerCase(),
        password:    data.password  || '',
        name:        data.name      || '',
        school:      data.school    || '',
        grade:       data.grade     || '',
        classroomId: window.RDAClassroomConfig.classroomId || ''
      };
      const res  = await fetch(window.RDAClassroomConfig.apiUrl, {
        method:  'POST',
        mode:    'cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body:    JSON.stringify(payload),
        cache:   'no-store'
      });
      const json = await res.json();
      if (json.ok && json.researchId) {
        localStorage.setItem(RID_KEY, json.researchId);
        localStorage.setItem(AUTH_KEY, JSON.stringify({
          username:   payload.username,
          researchId: json.researchId,
          name:       json.name,
          school:     json.school,
          grade:      json.grade,
          verifiedAt: new Date().toISOString()
        }));
      }
      return json;
    } catch(err) {
      // Network error — fallback to offline
      return { ok: true, created: true, offline: true, error: String(err) };
    }
  }

  // ============================================================
  // AUTH: LOGIN — sends to GAS action=login
  // Returns: { ok, found, researchId, name, ... } | { ok:false, error }
  // ============================================================
  async function loginUser(username, password) {
    const user = (username || '').trim().toLowerCase();
    if (!configured()) {
      return checkOfflineAuth_(user, password);
    }
    try {
      const payload = { action: 'login', username: user, password: password || '' };
      const res  = await fetch(window.RDAClassroomConfig.apiUrl, {
        method:  'POST',
        mode:    'cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body:    JSON.stringify(payload),
        cache:   'no-store'
      });
      const json = await res.json();
      if (json.ok && json.found) {
        localStorage.setItem(RID_KEY, json.researchId);
        localStorage.setItem(AUTH_KEY, JSON.stringify({
          username:   user,
          researchId: json.researchId,
          name:       json.name,
          school:     json.school,
          grade:      json.grade,
          specialty:  json.specialty,
          verifiedAt: new Date().toISOString()
        }));
      }
      return json;
    } catch(err) {
      return checkOfflineAuth_(user, password);
    }
  }

  // Offline auth: check cached session or old localStorage entry
  function checkOfflineAuth_(user, password) {
    const cached = safe(AUTH_KEY);
    if (cached.username && cached.username.toLowerCase() === user) {
      // Return cached session (password not re-verifiable offline)
      return {
        ok: true, found: true, offline: true,
        researchId: cached.researchId || '',
        username:   cached.username   || user,
        name:       cached.name       || user,
        school:     cached.school     || '',
        grade:      cached.grade      || '',
        specialty:  cached.specialty  || ''
      };
    }
    // Backward-compat: check old rdaEntry
    const entry = safe('rdaEntry');
    if (entry.registered && entry.username &&
        entry.username.toLowerCase() === user && entry.password === password) {
      return {
        ok: true, found: true, offline: true,
        name:     entry.name,
        username: entry.username,
        researchId: researchId()
      };
    }
    return { ok: false, found: false, error: 'OFFLINE_NO_CACHE' };
  }

  // ============================================================
  // SYNC FUNCTIONS (existing)
  // ============================================================
  function syncProfile() { enqueue('student_profile', {}); }

  function syncAssessment(mode, record) {
    enqueue('assessment', {
      assessmentType: String(mode || '').toUpperCase(),
      score:          Number(record?.score || 0),
      areas:          Array.isArray(record?.areas)   ? record.areas   : [],
      answers:        Array.isArray(record?.answers) ? record.answers : [],
      submittedAt:    record?.submittedAt || new Date().toISOString()
    });
  }

  function syncSatisfaction(record) {
    enqueue('satisfaction', {
      answers:     Array.isArray(record?.answers) ? record.answers : [],
      comment:     record?.comment || '',
      submittedAt: record?.submittedAt || new Date().toISOString()
    });
  }

  function casePayload(id) {
    const caseId   = String(id || '').toLowerCase();
    const dec      = safe('RDA_DECISION_' + caseId.toUpperCase());
    const caseKeys = [
      caseId === 'r01' ? 'RDA_R01_CASE_V2' : `RDA_${caseId.toUpperCase()}_CASE_V3`,
      `RDA_${caseId.toUpperCase()}_CASE_V2`
    ];
    let cr = {};
    for (const k of caseKeys) { const v = safe(k); if (Object.keys(v).length) { cr = v; break; } }
    const receipts = safe('RDA_CASE_RECEIPTS');
    return {
      caseId:           caseId.toUpperCase(),
      initialScore:     Number(cr.initialScore  || dec.initialScore  || 0),
      revisionScore:    Number(cr.revisedScore   || dec.revisedScore  || 0),
      claim:            dec.claim            || '',
      evidence:         dec.evidence         || '',
      evidenceIds:      Array.isArray(dec.evidenceIds) ? dec.evidenceIds : [],
      reasoning:        dec.reasoning        || '',
      risk:             dec.risk             || '',
      decision:         dec.decision         || '',
      confidence:       dec.confidence       || cr.confidenceAfter || '',
      confidenceBefore: Number(cr.confidenceBefore || dec.confidenceBefore || 0),
      prediction:       cr.prediction        || '',
      predictionReason: cr.predictionReason  || '',
      feedback:         Array.isArray(cr.feedback) ? cr.feedback.concat([{__rdaMeta:{rubricMaxScore:100,engine:'RDA_RULE_BASED_V2_100'}}]) : [{__rdaMeta:{rubricMaxScore:100,engine:'RDA_RULE_BASED_V2_100'}}],
      closedAt:         receipts?.[caseId]?.closedAt || new Date().toISOString()
    };
  }

  function syncCase(id) { enqueue('case_closed', casePayload(id)); }

  function syncSnapshot() {
    const pre    = safe('RDA_PRETEST');
    const post   = safe('RDA_POSTTEST');
    const master = safe('RDA_MASTER');
    enqueue('snapshot', {
      preScore:       Number(pre.score    || 0),
      postScore:      Number(post.score   || 0),
      completedCases: Number(master.completed || 0)
    });
  }

  function teacherUrl() {
    if (!configured()) return '';
    return window.RDAClassroomConfig.apiUrl + '?view=teacher';
  }

  function openTeacherSystem() {
    const url = teacherUrl();
    if (!url) return false;
    window.open(url, '_blank', 'noopener');
    return true;
  }

  window.addEventListener('online', () => flush(true));
  document.addEventListener('DOMContentLoaded', () => setTimeout(() => flush(), 350));

  return {
    configured, researchId, profile,
    enqueue, flush,
    registerUser, loginUser,
    syncProfile, syncAssessment, syncSatisfaction, syncCase, syncSnapshot,
    teacherUrl, openTeacherSystem
  };
})();
