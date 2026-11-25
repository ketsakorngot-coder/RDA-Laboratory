
const defaults = {
  name: 'Agent Ethan',
  avatar: 'assets/candidate_ethan.jpg',
  specialty: 'Field Investigation',
  color: 'gold',
  badge: '☢',
  division: 'radiation',
  registered: false,
  username: '',
  password: '',
  passwordHash: '',
  school: '',
  grade: 'ม.4'
};

const state = Object.assign({}, defaults, JSON.parse(localStorage.getItem('rdaEntry') || '{}'));

const divisions = {
  radiation: { name: 'Radiation Investigation Division', mark: '☢', color: 'gold' },
  science: { name: 'Scientific Analysis Division', mark: '🔬', color: 'cyan' },
  emergency: { name: 'Emergency Response Division', mark: '🛡', color: 'red' },
  security: { name: 'Detection & Security Division', mark: '📡', color: 'cyan' }
};

function byId(id) {
  return document.getElementById(id);
}

function save() {
  // Never persist the plaintext password in localStorage.
  const safeState = Object.assign({}, state);
  delete safeState.password;
  localStorage.setItem('rdaEntry', JSON.stringify(safeState));
}

function go(id) {
  if(id==='passport')setTimeout(()=>{try{renderTrueAgentPassport()}catch(e){}},0);
  if(id==='portal' && typeof assessmentComplete==='function' && !assessmentComplete('pre')){
    id='pretest';setTimeout(()=>loadAssessment('pre'),0);
  }
  const target = byId(id);
  if (!target) return;
  document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
  target.classList.add('active');
  if (id === 'character' || id === 'transmission' || id === 'portal') renderAgent();
  if (id === 'portal' && typeof renderMasterPortal === 'function') setTimeout(()=>{
    renderMasterPortal();
    const d=getMasterProgress();
    if(d.done===6 && !assessmentComplete('post')){loadAssessment('post');go('posttest')}
  },0);
  if(id==='pretest')setTimeout(()=>loadAssessment('pre'),0);
  if(id==='posttest')setTimeout(()=>loadAssessment('post'),0);
  if(id==='result')setTimeout(()=>renderResultProfile(),0);
  if(id==='dashboard')setTimeout(()=>renderTeacherDashboard(),0);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toastMsg(message) {
  const el = byId('toast');
  if (!el) return;
  el.textContent = message;
  el.classList.remove('hidden');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => el.classList.add('hidden'), 2200);
}

function clearOldProgress() {
  const exactKeys = [
    'RDA_MASTER', 'RDA_PRETEST', 'RDA_POSTTEST', 'RDA_COMPLETION_HANDOFF',
    'RDA_CASE_RECEIPTS', 'RDA_LAST_COMPLETED_CASE',
    'rdkR01Complete', 'rdkR02Ultimate', 'rdkR03Standalone', 'rdkR04Complete', 'rdkR05Standalone', 'rdkR06'
  ];
  Object.keys(localStorage).forEach(key => {
    if (exactKeys.includes(key) || key.startsWith('RDA_DECISION_') || key.match(/^RDA_R0[1-6]_CASE/)) {
      localStorage.removeItem(key);
    }
  });
}

function logout() {
  if (confirm('คุณต้องการออกจากระบบและลบข้อมูลความคืบหน้าในเครื่องนี้หรือไม่?')) {
    clearOldProgress();
    localStorage.removeItem('RDA_AUTH_V1');
    localStorage.removeItem('RDA_RESEARCH_ID');
    state.registered = false;
    state.username = '';
    state.password = '';
    save();
    go('login');
    toastMsg('LOGGED OUT SUCCESSFULLY');
  }
}

async function login(event) {
  event.preventDefault();
  const user  = byId('loginUser').value.trim();
  const pass  = byId('loginPass').value;
  const errEl = byId('loginError');
  const btn   = event.submitter || event.target.querySelector('button[type="submit"]');

  if (errEl) errEl.textContent = '';
  if (!user || !pass) {
    if (errEl) errEl.textContent = 'กรุณากรอก Username และ Password';
    return;
  }

  // Loading state
  if (btn) { btn.disabled = true; btn.textContent = 'VERIFYING...'; }

  try {
    const result = await (window.RDABackend?.loginUser?.(user, pass) ||
      Promise.resolve(localLoginFallback_(user, pass)));

    if (result.ok && result.found) {
      // If logging in as a DIFFERENT user than what was in state, clear old progress
      if (state.username && state.username.toLowerCase() !== user.toLowerCase()) {
        clearOldProgress();
      }

      // Sync profile data into state
      state.studentName = result.name      || user;
      state.name       = result.name      || user;
      state.school     = result.school    || state.school;
      state.grade      = result.grade     || state.grade;
      state.username   = user;
      state.registered = true;
      if (result.researchId) localStorage.setItem('RDA_RESEARCH_ID', result.researchId);
      save();
      window.RDABackend?.syncProfile?.();
      toastMsg(result.offline ? 'IDENTITY VERIFIED (OFFLINE)' : 'IDENTITY VERIFIED ✓');
      setTimeout(() => go('character'), 700);
    } else {
      const msgMap = {
        'INVALID_CREDENTIALS': 'รหัสผ่านไม่ถูกต้อง',
        'USER_NOT_FOUND':      'ไม่พบ Username นี้ในระบบ กรุณา Register ก่อน',
        'OFFLINE_NO_CACHE':   'ไม่มีการเชื่อมต่อ และไม่พบข้อมูล offline'
      };
      const msg = msgMap[result.error] || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
      if (errEl) errEl.textContent = msg;
      toastMsg(msg);
    }
  } catch(e) {
    if (errEl) errEl.textContent = 'เกิดข้อผิดพลาด กรุณาลองใหม่';
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'LOGIN'; }
  }
}

async function sha256Hex_(text) {
  if (window.crypto?.subtle) {
    const data = new TextEncoder().encode(String(text));
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2,'0')).join('');
  }
  return '';
}

async function localLoginFallback_(user, pass) {
  if (state.registered && state.username && state.username.toLowerCase() === user.toLowerCase() && state.passwordHash) {
    const hash = await sha256Hex_(pass);
    if (hash && hash === state.passwordHash) {
      return { ok: true, found: true, offline: true, name: state.name, username: state.username };
    }
    return { ok: false, found: false, error: 'INVALID_CREDENTIALS' };
  }
  return { ok: false, found: false, error: 'OFFLINE_NO_CACHE' };
}

function guestMode() {
  Object.assign(state, {
    name: 'Guest Agent',
    avatar: 'assets/candidate_ethan.jpg',
    specialty: 'Field Investigation'
  });
  save();
  go('character');
}

async function register(event) {
  event.preventDefault();
  const name     = byId('regName').value.trim();
  const school   = byId('regSchool').value.trim();
  const grade    = byId('regGrade').value;
  const username = byId('regUser').value.trim();
  const password = byId('regPass').value;
  const errEl    = byId('registerError');
  const btn      = event.submitter || event.target.querySelector('button[type="submit"]');

  if (errEl) errEl.textContent = '';

  if (!name || !username || !password) {
    if (errEl) errEl.textContent = 'กรุณากรอกข้อมูลให้ครบทุกช่อง';
    return;
  }
  if (password.length < 4) {
    if (errEl) errEl.textContent = 'Password ต้องมีอย่างน้อย 4 ตัวอักษร';
    return;
  }

  // Loading state
  if (btn) { btn.disabled = true; btn.textContent = 'SUBMITTING...'; }

  try {
    const result = await (window.RDABackend?.registerUser?.({ name, school, grade, username, password }) ||
      Promise.resolve({ ok: true, created: true, offline: true }));

    if (result.ok) {
      // Always clear progress on new registration
      clearOldProgress();

      // Save to state
      state.studentName = name;
      state.name       = name;
      state.school     = school;
      state.grade      = grade;
      state.username   = username;
      state.password   = '';
      state.passwordHash = await sha256Hex_(password);
      state.registered = true;
      if (result.researchId) localStorage.setItem('RDA_RESEARCH_ID', result.researchId);
      save();
      window.RDABackend?.syncProfile?.();

      byId('loginUser').value = username;
      byId('loginPass').value = password;
      toastMsg(result.offline ? 'APPLICATION ACCEPTED (OFFLINE)' : 'APPLICATION ACCEPTED ✓');
      setTimeout(() => go('character'), 700);
    } else {
      const msgMap = {
        'USERNAME_TAKEN':    'Username นี้มีคนใช้แล้ว กรุณาเลือกชื่อใหม่',
        'PASSWORD_TOO_SHORT':'Password ต้องมีอย่างน้อย 4 ตัวอักษร',
        'USERNAME_REQUIRED': 'กรุณากรอก Username'
      };
      const msg = msgMap[result.error] || 'สมัครไม่สำเร็จ กรุณาลองใหม่';
      if (errEl) errEl.textContent = msg;
      toastMsg(msg);
    }
  } catch(e) {
    if (errEl) errEl.textContent = 'เกิดข้อผิดพลาด กรุณาลองใหม่';
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'SUBMIT APPLICATION'; }
  }
}

function pickAvatar(path, candidateName, specialty, button) {
  state.avatar = path;
  state.name = candidateName;
  state.specialty = specialty;
  document.querySelectorAll('#avatarOptions .avatar-option').forEach(item => item.classList.remove('active'));
  button.classList.add('active');

  const nameInput = byId('agentName');
  if (nameInput) nameInput.value = candidateName;
  updateAgentPreview();
  save();
}

function pickDivision(id, button) {
  if (!divisions[id]) return;
  state.division = id;
  state.color = divisions[id].color;
  document.querySelectorAll('#divisionOptions button').forEach(item => item.classList.remove('active'));
  button.classList.add('active');
  updateAgentPreview();
  save();
}

function pickBadge(value, button) {
  state.badge = value;
  document.querySelectorAll('#badgeOptions button').forEach(item => item.classList.remove('active'));
  button.classList.add('active');
  updateAgentPreview();
  save();
}

function updateAgentPreview() {
  const nameInput = byId('agentName');
  if (nameInput && nameInput.value.trim()) state.name = nameInput.value.trim();

  const division = divisions[state.division] || divisions.radiation;
  const portrait = byId('agentPortrait');
  const previewName = byId('previewAgentName');
  const previewDivision = byId('previewDivision');
  const divisionMark = byId('divisionMark');

  if (portrait) portrait.src = state.avatar;
  if (previewName) previewName.textContent = state.name;
  if (previewDivision) previewDivision.textContent = division.name;
  if (divisionMark) divisionMark.textContent = state.badge || division.mark;
}

function startIdentityScan() {
  updateAgentPreview();
  save();

  const modal = byId('identityModal');
  const bar = byId('identityProgressBar');
  const log = byId('identityScanLog');
  const title = byId('identityScanTitle');
  if (!modal || !bar || !log || !title) return;

  modal.classList.remove('hidden');
  bar.style.width = '0%';
  log.innerHTML = '';
  title.textContent = 'SCANNING PROFILE...';

  const scanSteps = [
    ['20%', 'PROFILE DETECTED'],
    ['45%', 'DIVISION VERIFIED'],
    ['70%', 'BADGE ASSIGNED'],
    ['100%', 'RDA ID GENERATED']
  ];

  scanSteps.forEach((step, index) => {
    setTimeout(() => {
      bar.style.width = step[0];
      log.insertAdjacentHTML('beforeend', `<div>✓ ${step[1]}</div>`);
      if (index === scanSteps.length - 1) {
        title.textContent = 'IDENTITY CONFIRMED';
        setTimeout(() => {
          modal.classList.add('hidden');
          showGeneratedId();
        }, 500);
      }
    }, 350 + index * 550);
  });
}

function showGeneratedId() {
  const division = divisions[state.division] || divisions.radiation;
  byId('generatedIdAvatar').src = state.avatar;
  byId('generatedIdName').textContent = state.name;
  byId('generatedIdDivision').textContent = division.name;
  byId('generatedIdBadge').textContent = state.badge;
  byId('idCardModal').classList.remove('hidden');
}

function closeIdCard() {
  byId('idCardModal')?.classList.add('hidden');
}

function confirmIdentityAndLogin() {
  save();
  closeIdCard();
  if (state.registered) {
    byId('loginUser').value = state.username;
    byId('loginPass').value = '';
  }
  go('login');
}

function renderAgent() {
  const division = divisions[state.division] || divisions.radiation;
  const mappings = {
    agentName: ['value', state.name],
    agentPortrait: ['src', state.avatar],
    previewAgentName: ['textContent', state.name],
    previewDivision: ['textContent', division.name],
    divisionMark: ['textContent', state.badge || division.mark],
    welcomeAgent: ['textContent', state.name.toUpperCase()],
    portalAvatar: ['src', state.avatar],
    portalName: ['textContent', state.name]
  };

  Object.entries(mappings).forEach(([id, [property, value]]) => {
    const element = byId(id);
    if (element) element[property] = value;
  });

  document.querySelectorAll('#avatarOptions .avatar-option').forEach(button => {
    button.classList.toggle('active', button.dataset.avatar === state.avatar);
  });
}

function openMissionPlaceholder() {
  location.href='missions/r01/index.html';
}

document.addEventListener('keydown', event => {
  if (event.key === 'Enter' && byId('intro')?.classList.contains('active')) go('login');
});

document.addEventListener('DOMContentLoaded', () => {
  renderAgent();
  if (state.registered) {
    byId('loginUser').value = state.username;
  }
});


/* ===== WELCOME IMAGE SAFETY ===== */
document.addEventListener('DOMContentLoaded', () => {
  const img = document.getElementById('welcomeCommanderImage');
  if (img && !img.getAttribute('src')) {
    img.src = state.avatar || 'assets/candidate_luna.jpg';
  }
});


/* ===== GAME AGENT SELECTION FLOW ===== */
const agentDivisionBadges = {
  radiation: '☢',
  science: '🔬',
  security: '🛡',
  emergency: '🚨'
};

function playScanSound() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContextClass();
    const frequencies = [420, 620, 840];
    frequencies.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, context.currentTime + index * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.13, context.currentTime + index * 0.16 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + index * 0.16 + 0.14);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(context.currentTime + index * 0.16);
      oscillator.stop(context.currentTime + index * 0.16 + 0.16);
    });
  } catch (error) {
    console.warn('Scan audio is unavailable:', error);
  }
}

function selectGameAgent(path, name, specialty, division, sourceElement) {
  if(!state.studentName && state.name && !/^Agent\s/i.test(state.name)) state.studentName = state.name;
  state.avatar = path;
  state.name = name;
  state.specialty = specialty;
  state.division = division;
  state.color = divisions[division]?.color || 'cyan';
  save();

  const selectedCard = sourceElement?.classList?.contains('game-agent-card')
    ? sourceElement
    : sourceElement?.closest?.('.game-agent-card');

  document.querySelectorAll('.game-agent-card').forEach(card => card.classList.remove('selected'));
  selectedCard?.classList.add('selected');

  const overlay = byId('agentScanOverlay');
  const image = byId('hologramAgentImage');
  const scanName = byId('agentScanName');
  const scanStatus = byId('agentScanStatus');
  const progress = byId('agentScanProgress');
  const particles = byId('holoParticles');
  const verifiedText = byId('identityVerifiedText');

  if (!overlay || !image || !scanName || !scanStatus || !progress) {
    if(!assessmentComplete('pre')){loadAssessment('pre');go('pretest')}
    else go('portal');
    return;
  }

  image.src = path;
  scanName.textContent = name.toUpperCase();
  scanStatus.textContent = 'SCANNING IDENTITY...';
  progress.style.width = '0%';
  if (particles) particles.innerHTML = '';
  verifiedText?.classList.remove('show');
  overlay.classList.remove('hidden');
  document.body.classList.add('identity-shake');
  playScanSound();

  setTimeout(() => document.body.classList.remove('identity-shake'), 460);

  const stages = [
    [22, 'FACIAL PROFILE DETECTED'],
    [52, 'SPECIALIZATION VERIFIED'],
    [78, 'RDA CLEARANCE APPROVED'],
    [100, 'IDENTITY VERIFIED']
  ];

  stages.forEach((stage, index) => {
    setTimeout(() => {
      progress.style.width = stage[0] + '%';
      scanStatus.textContent = stage[1];

      if (index === 2) createHologramParticles();
      if (index === stages.length - 1) {
        verifiedText?.classList.add('show');
        playVerifiedSound();
        setTimeout(() => {
          overlay.classList.add('hidden');
          verifiedText?.classList.remove('show');
          renderAgent();
          if(!assessmentComplete('pre')){loadAssessment('pre');go('pretest')}
          else go('portal');
        }, 1050);
      }
    }, 320 + index * 520);
  });
}

const originalRenderAgent = renderAgent;
renderAgent = function() {
  originalRenderAgent();
  const selectedImage = byId('welcomeCommanderImage');
  const specialty = byId('welcomeSpecialty');
  const badge = byId('welcomeDivisionBadge');
  if (selectedImage) selectedImage.src = state.avatar;
  if (specialty) specialty.textContent = (state.specialty || 'FIELD INVESTIGATION').toUpperCase();
  if (badge) badge.textContent = agentDivisionBadges[state.division] || state.badge || '☢';
};


function createHologramParticles() {
  const container = byId('holoParticles');
  if (!container) return;
  container.innerHTML = '';
  for (let index = 0; index < 72; index += 1) {
    const particle = document.createElement('i');
    particle.className = 'holo-particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    particle.style.setProperty('--dx', (Math.random() * 420 - 210) + 'px');
    particle.style.setProperty('--dy', (Math.random() * 420 - 210) + 'px');
    particle.style.animationDelay = Math.random() * .22 + 's';
    container.appendChild(particle);
  }
}

function playVerifiedSound() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContextClass();
    [523.25, 659.25, 783.99].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = index === 2 ? 'triangle' : 'sine';
      oscillator.frequency.value = frequency;
      const start = context.currentTime + index * .11;
      gain.gain.setValueAtTime(.0001, start);
      gain.gain.exponentialRampToValueAtTime(.12, start + .02);
      gain.gain.exponentialRampToValueAtTime(.0001, start + .32);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + .34);
    });
  } catch (error) {
    console.warn('Verified sound is unavailable:', error);
  }
}

/* Prevent accidental double activation while the scan overlay is open. */
document.addEventListener('click', event => {
  if (!byId('agentScanOverlay')?.classList.contains('hidden') &&
      event.target.closest('.game-agent-card')) {
    event.preventDefault();
  }
}, true);

window.addEventListener('load',()=>{if(location.hash==='#portal'){try{renderAgent()}catch(e){};go('portal');}});

function getMasterProgress(){
 const master=(window.RDAMaster&&typeof window.RDAMaster.snapshot==='function')?window.RDAMaster.snapshot():null;
 if(master){
  return {missions:master.missions,done:master.completed,total:master.totalScore};
 }
 // Safe fallback uses the same strict sequence + Decision Record rule.
 const keys={r01:'rdkR01Complete',r02:'rdkR02Ultimate',r03:'rdkR03Standalone',r04:'rdkR04Complete',r05:'rdkR05Standalone',r06:'rdkR06'};
 const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'{}')}catch(e){return {}}};
 const decisionReady=id=>{
  const r=read('RDA_DECISION_'+id.toUpperCase());
  const fields=(r.claim||'').trim().length>=8 &&
   ((r.evidence||'').trim().length>=5 || (Array.isArray(r.evidenceIds)&&r.evidenceIds.length>=2)) &&
   (r.reasoning||'').trim().length>=15 &&
   (r.risk||'').trim().length>0 &&
   (r.decision||'').trim().length>=10;
  const revisionSubmitted=r.revisionSubmitted===true || Number(r.revisedScore||0)>0;
  return fields && revisionSubmitted;
 };
 let previous=true,total=0,done=0;const missions={};
 Object.entries(keys).forEach(([id,k])=>{
  const raw=read(k),nativeDone=!!(raw.completed||raw.evaluated),handedOff=(()=>{try{const h=JSON.parse(localStorage.getItem('RDA_COMPLETION_HANDOFF')||'[]');return Array.isArray(h)&&h.includes(id)}catch(e){return false}})(),completed=previous&&(handedOff||(nativeDone&&decisionReady(id)));
  const score=completed?(Number(raw.score??raw.finalEvaluation?.total??0)||0):0;
  missions[id]={completed,score,unlocked:previous};
  if(completed){done++;total+=score}
  previous=completed;
 });
 return {missions,done,total};
}
function openMasterMission(id){
 const d=getMasterProgress();
 if(!d.missions[id].unlocked)return toastMsg('LOCKED — ต้องทำภารกิจก่อนหน้าและ SUBMIT REVISION ให้เสร็จ ระบบจะกลับ Headquarters และปลดล็อกอัตโนมัติ');
 if(window.RDAMaster&&typeof window.RDAMaster.gotoMission==='function')return window.RDAMaster.gotoMission(id);
 location.href='missions/'+id+'/index.html';
}
function renderMasterPortal(){
 const host=document.getElementById('masterMissionGrid');if(!host)return;
 const d=getMasterProgress();
 const meta=[
  ['r01','☢️','UNKNOWN SOURCE','นี่คือรังสีอะไร?'],
  ['r02','🛡️','SHIELDING PROTOCOL','ควรใช้อะไรป้องกัน?'],
  ['r03','📍','EXPOSURE ZONE','ระยะและเวลาส่งผลต่อความเสี่ยงอย่างไร?'],
  ['r04','🍎','THE DECAYING CARGO','ใช้ Half-life Model ทำนาย Activity ของแหล่งกำเนิดรังสี และตัดสิน PROCESS • ADJUST • HOLD'],
  ['r05','🚨','THE CITY RADIATION EVENT','ประเมิน Dose Rate • Exposure Time • Population • Context เพื่อค้นหา Risk จริงและตัดสินใจด้าน Public Safety'],
  ['r06','⚠️','FINAL RADIATION CRISIS','บูรณาการทุกหลักฐานเพื่อรับมือสถานการณ์สุดท้าย']
 ];
 host.innerHTML=meta.map(([id,ic,t,sub],i)=>{
  const m=d.missions[id],status=m.completed?'COMPLETED':m.unlocked?'CURRENT MISSION':'LOCKED';
  const requirement=m.unlocked&&!m.completed?(id==='r06'?'Final challenge ready':'ทำภารกิจและสรุปหลักฐานให้ครบ'):'';
  return `<button class="master-mission ${m.completed?'done':m.unlocked?'current':'locked'}" onclick="openMasterMission('${id}')">
   <small>${status}</small><b>R-0${i+1}</b><span class="master-icon">${ic}</span><strong>${t}</strong><em>${sub}</em>
   ${requirement?`<u>${requirement}</u>`:''}${m.completed?`<i>${m.score}/100</i>`:''}
  </button>`;
 }).join('');
 const a=document.getElementById('masterDone');if(a)a.textContent=d.done+' / 6';
 const b=document.getElementById('masterScore');if(b)b.textContent=d.total+' pts';
}

document.addEventListener('click',e=>{if(e.target.closest('[onclick*="go(\'portal\')"]'))setTimeout(renderMasterPortal,80)});


/* ===== RPCUT: Radiation Physics Conceptual Understanding Test ===== */
const RPCUT = [
 {area:0,q:'นักเรียนตรวจสอบแหล่งกำเนิดรังสีไม่ทราบชนิด พบว่าเมื่อวางกระดาษบางระหว่างแหล่งกำเนิดกับเครื่องตรวจวัด อัตราการนับลดลงเกือบถึงระดับพื้นหลังทันที หลักฐานนี้สนับสนุนข้อสรุปใดมากที่สุด',a:['เป็นรังสีแอลฟา เพราะมีอำนาจทะลุผ่านต่ำ','เป็นรังสีบีตา เพราะไม่มีประจุ','เป็นรังสีแกมมา เพราะถูกกระดาษดูดกลืนได้ดี','ยังสรุปไม่ได้ เพราะรังสีทุกชนิดถูกกระดาษหยุดได้เหมือนกัน'],k:0},
 {area:0,q:'แหล่งกำเนิดชนิดหนึ่งปล่อยรังสีที่ผ่านกระดาษได้ แต่เมื่อเพิ่มแผ่นอะลูมิเนียม อัตราการนับลดลงอย่างมาก รังสีดังกล่าวมีแนวโน้มเป็นชนิดใด',a:['แอลฟา','บีตา','แกมมา','ทุกชนิดมีโอกาสเท่ากัน'],k:1},
 {area:0,q:'รังสีจากแหล่งหนึ่งผ่านกระดาษและอะลูมิเนียมบางได้ดี แต่ความเข้มลดลงเมื่อเพิ่มวัสดุที่มีความหนาแน่นสูง หลักฐานสนับสนุนว่าเป็น',a:['รังสีแอลฟา','รังสีบีตา','รังสีแกมมา','อิเล็กตรอนพลังงานต่ำ'],k:2},
 {area:0,q:'นักเรียนกล่าวว่า “รังสีแกมมาอันตรายกว่ารังสีแอลฟาเสมอ เพราะทะลุผ่านได้มากกว่า” ข้อใดเหมาะสมที่สุด',a:['ถูก เพราะอำนาจทะลุผ่านเป็นปัจจัยเดียวที่กำหนดอันตราย','ถูก เพราะรังสีแอลฟาไม่มีผลต่อเนื้อเยื่อ','ไม่ถูก เพราะความเสี่ยงขึ้นกับชนิดรังสี ปริมาณ การรับเข้าสู่ร่างกาย และสถานการณ์การได้รับรังสี','ไม่ถูก เพราะรังสีแกมมาไม่มีพลังงาน'],k:2},
 {area:1,q:'ในการเลือกวัสดุป้องกันรังสี สิ่งใดควรพิจารณาเป็นอันดับแรก',a:['สีของวัสดุ','ชนิดและพลังงานของรังสี','ราคาของวัสดุเพียงอย่างเดียว','เลือกวัสดุที่หนาที่สุดเสมอ'],k:1},
 {area:1,q:'การทดลองได้ผลดังตาราง ข้อสรุปใดได้รับการสนับสนุนจากข้อมูลมากที่สุด',table:[['วัสดุ','อัตราการนับ (counts/min)'],['ไม่มีวัสดุกั้น','820'],['กระดาษ','815'],['อะลูมิเนียม','110'],['ตะกั่ว','95']],a:['กระดาษมีประสิทธิภาพสูงสุด','อะลูมิเนียมทำให้อัตราการนับลดลงอย่างมาก','ตะกั่วทำให้รังสีหายไปทั้งหมด','วัสดุไม่มีผลต่อรังสี'],k:1},
 {area:1,q:'นักเรียนเลือกตะกั่วเป็นวัสดุกำบังโดยให้เหตุผลว่า “เพราะตะกั่วแข็งแรงที่สุด” ข้อบกพร่องสำคัญของเหตุผลนี้คืออะไร',a:['ไม่ได้ระบุราคาตะกั่ว','ไม่ได้เชื่อมโยงการเลือกกับสมบัติของรังสีและหลักฐานการลดทอน','ตะกั่วไม่สามารถใช้ป้องกันรังสีได้','วัสดุแข็งแรงไม่สามารถป้องกันรังสีได้ทุกกรณี'],k:1},
 {area:1,q:'ข้อใดสะท้อนความเข้าใจเรื่องการกำบังรังสีได้ดีที่สุด',a:['วัสดุที่หนาที่สุดดีที่สุดสำหรับรังสีทุกชนิด','โลหะทุกชนิดป้องกันรังสีได้สมบูรณ์','การเลือกวัสดุควรสัมพันธ์กับชนิดรังสี สมบัติวัสดุ และระดับการลดทอนที่ต้องการ','ถ้ามีวัสดุกั้นแล้วไม่จำเป็นต้องคำนึงถึงระยะทาง'],k:2},
 {area:2,q:'หากบุคคลอยู่ใกล้แหล่งกำเนิดรังสีนานขึ้น โดยปัจจัยอื่นคงเดิม โดยทั่วไปสิ่งใดเกิดขึ้น',a:['ปริมาณรังสีสะสมที่ได้รับมีแนวโน้มเพิ่มขึ้น','ปริมาณรังสีลดลงเสมอ','ไม่มีการเปลี่ยนแปลง','รังสีเปลี่ยนชนิด'],k:0},
 {area:2,q:'สำหรับแหล่งกำเนิดที่สามารถประมาณเป็นแหล่งจุด เมื่อเพิ่มระยะห่างจากแหล่งกำเนิดจาก r เป็น 2r ความเข้มของรังสีโดยประมาณจะเป็นเท่าใด',a:['เท่าเดิม','1/2','1/4','1/8'],k:2},
 {area:2,q:'เจ้าหน้าที่สองคนทำงานกับแหล่งกำเนิดเดียวกัน คน A อยู่ใกล้กว่าแต่ใช้เวลาสั้นมาก ส่วนคน B อยู่ไกลกว่าแต่ใช้เวลานาน ข้อมูลใดเหมาะสมที่สุดสำหรับเปรียบเทียบความเสี่ยง',a:['ดูระยะทางเพียงอย่างเดียว','ดูเวลาเพียงอย่างเดียว','พิจารณาทั้งอัตราปริมาณรังสี ระยะทาง เวลา และการกำบัง','คนที่อยู่ใกล้กว่าต้องเสี่ยงกว่าเสมอ'],k:2},
 {area:2,q:'หากจำเป็นต้องปฏิบัติงานใกล้แหล่งกำเนิดรังสี แนวทางใดสอดคล้องกับหลักการลดการได้รับรังสีมากที่สุด',a:['เพิ่มเวลา ลดระยะทาง และไม่ใช้วัสดุกำบัง','ลดเวลา เพิ่มระยะทาง และใช้การกำบังที่เหมาะสม','ลดเวลาอย่างเดียวก็เพียงพอทุกกรณี','ใช้วัสดุกำบังอย่างเดียวโดยไม่ต้องพิจารณาปัจจัยอื่น'],k:1},
 {area:3,q:'คำว่า “ครึ่งชีวิต 8 วัน” หมายถึงข้อใด',a:['อะตอมทุกอะตอมจะสลายเมื่อครบ 8 วันพอดี','หลัง 8 วัน นิวเคลียสกัมมันตรังสีในตัวอย่างจำนวนมากโดยเฉลี่ยจะเหลือประมาณครึ่งหนึ่ง','หลัง 8 วันสารจะปลอดภัยเสมอ','รังสีจะมีพลังงานเหลือครึ่งหนึ่ง'],k:1},
 {area:3,q:'สารกัมมันตรังสีชนิดหนึ่งมีครึ่งชีวิต 5 วัน เริ่มต้นมีนิวเคลียสกัมมันตรังสีจำนวน N₀ หลัง 15 วันจะเหลือประมาณเท่าใด',a:['N₀/2','N₀/4','N₀/6','N₀/8'],k:3},
 {area:3,q:'หลังผ่านไปหนึ่งครึ่งชีวิต ตัวอย่างหนึ่งยังคงมีกัมมันตภาพอยู่ นักเรียนคนใดอธิบายถูกต้องที่สุด',a:['ผิดปกติ เพราะหลังหนึ่งครึ่งชีวิตรังสีต้องหมด','เป็นไปตามหลักการ เพราะยังมีนิวเคลียสกัมมันตรังสีเหลือประมาณครึ่งหนึ่ง','แสดงว่าค่าครึ่งชีวิตเปลี่ยนไป','แสดงว่านิวเคลียสหยุดสลาย'],k:1},
 {area:3,q:'สาร A มีครึ่งชีวิต 2 ชั่วโมง และสาร B มีครึ่งชีวิต 20 ปี ข้อใดถูกต้องที่สุด',a:['B อันตรายกว่า A เสมอ','A อันตรายกว่า B เสมอ','ครึ่งชีวิตเพียงข้อมูลเดียวไม่เพียงพอสำหรับตัดสินความเสี่ยงทั้งหมด','สารที่มีครึ่งชีวิตยาวไม่มีการสลายตัว'],k:2},
 {area:4,q:'พบวัตถุต้องสงสัยที่มีสัญลักษณ์รังสี เครื่องตรวจวัดให้ค่ามากกว่าระดับพื้นหลังอย่างชัดเจน การดำเนินการใดเหมาะสมที่สุดในขั้นต้น',a:['เข้าไปจับเพื่อดูว่าเป็นวัสดุอะไร','อยู่ห่างจากวัตถุ จำกัดการเข้าถึง และให้ผู้มีหน้าที่ตรวจสอบด้วยเครื่องมือที่เหมาะสม','ใช้กระดาษคลุมแล้วถือว่าปลอดภัย','ทิ้งวัตถุลงถังขยะทั่วไป'],k:1},
 {area:4,q:'มีข้อมูลว่า ตรวจพบรังสีเหนือระดับพื้นหลัง ระดับลดลงเมื่อเพิ่มระยะทาง วัสดุกำบังบางชนิดช่วยลดค่าที่ตรวจได้ และยังไม่ทราบชนิดของสารแน่นอน ข้อสรุปใดเหมาะสมที่สุด',a:['ปลอดภัยแน่นอน เพราะค่าลดลงเมื่อเพิ่มระยะทาง','อันตรายร้ายแรงแน่นอนโดยไม่ต้องตรวจเพิ่ม','มีหลักฐานว่ามีแหล่งกำเนิดที่ต้องควบคุม แต่ควรใช้ข้อมูลเพิ่มเติมเพื่อประเมินความเสี่ยงและเลือกมาตรการ','ไม่จำเป็นต้องสนใจเพราะยังไม่ทราบชื่อสาร'],k:2},
 {area:4,q:'กลุ่ม A เสนอ “ปิดพื้นที่ เพราะเราคิดว่าน่าจะอันตราย” กลุ่ม B เสนอ “จำกัดการเข้าถึงชั่วคราว เพราะค่าที่ตรวจวัดสูงกว่าพื้นหลัง และควรตรวจข้อมูลเพิ่มเติมก่อนกำหนดมาตรการถาวร” ข้อใดถูกต้องที่สุด',a:['A ดีกว่า เพราะตัดสินใจเร็ว','B ดีกว่า เพราะการตัดสินใจเชื่อมโยงกับหลักฐานและระบุข้อมูลที่ยังจำเป็น','ทั้งสองเท่ากัน เพราะผลการตัดสินใจคล้ายกัน','A ดีกว่า เพราะไม่จำเป็นต้องใช้ข้อมูลเชิงปริมาณ'],k:1},
 {area:4,q:'ข้อมูลใดควรใช้ร่วมกันมากที่สุดเมื่อต้องประเมินความเสี่ยงจากเหตุการณ์ทางรังสี',a:['ชนิดรังสีเพียงอย่างเดียว','ครึ่งชีวิตเพียงอย่างเดียว','ระยะทางเพียงอย่างเดียว','ชนิด/พลังงานของรังสี ระดับหรืออัตราการได้รับ ระยะทาง เวลา การกำบัง และลักษณะการสัมผัส'],k:3}
];
const RPCUT_AREAS=['ชนิดและสมบัติของรังสี','การทะลุผ่านและการกำบัง','ระยะทาง เวลา และการรับรังสี','การสลายและครึ่งชีวิต','การประยุกต์และประเมินสถานการณ์'];
const assess={pre:{index:0,answers:Array(20).fill(null)},post:{index:0,answers:Array(20).fill(null)}};
function testKey(mode){return mode==='pre'?'RDA_PRETEST':'RDA_POSTTEST'}
function loadAssessment(mode){
 try{
  const saved=JSON.parse(localStorage.getItem(testKey(mode))||'{}');
  if(Array.isArray(saved.answers)&&saved.answers.length===20)assess[mode].answers=saved.answers;
 }catch(e){}
 renderAssessment(mode);
}
function renderAssessment(mode){
 const a=assess[mode],item=RPCUT[a.index],host=byId(mode+'QuestionHost'),letters=['ก','ข','ค','ง'];
 if(!host)return;
 let table='';
 if(item.table)table='<table>'+item.table.map((r,i)=>'<tr>'+r.map(c=>`<${i?'td':'th'}>${c}</${i?'td':'th'}>`).join('')+'</tr>').join('')+'</table>';
 host.innerHTML=`<article class="question-card"><div class="qmeta"><span>CONCEPT ${item.area+1} • ${RPCUT_AREAS[item.area]}</span><span>QUESTION ${a.index+1}</span></div><h2>${item.q}</h2>${table}<div class="answer-list">${item.a.map((x,i)=>`<button type="button" class="answer-option ${a.answers[a.index]===i?'selected':''}" data-answer="${i}"><b>${letters[i]}</b><span>${x}</span></button>`).join('')}</div></article>`;
 host.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{a.answers[a.index]=Number(b.dataset.answer);saveAssessmentDraft(mode);renderAssessment(mode)});
 const pg=byId(mode+'QuestionProgress');pg.innerHTML=RPCUT.map((_,i)=>`<button type="button" class="${a.answers[i]!==null?'answered':''} ${i===a.index?'current':''}" data-q="${i}"></button>`).join('');
 pg.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{a.index=Number(b.dataset.q);renderAssessment(mode)});
 byId(mode+'Count').textContent=`${a.index+1} / 20`;
 byId(mode+'Answered').textContent=`ตอบแล้ว ${a.answers.filter(x=>x!==null).length}/20`;
 byId(mode+'Prev').disabled=a.index===0;
 byId(mode+'Next').textContent=a.index===19?(mode==='pre'?'SUBMIT PRE-TEST':'SUBMIT POST-TEST'):'NEXT →';
}
function saveAssessmentDraft(mode){
 const old=assessmentRecord(mode);
 localStorage.setItem(testKey(mode),JSON.stringify({...old,answers:assess[mode].answers,completed:old.completed||false,updatedAt:new Date().toISOString()}));
}
function assessmentRecord(mode){try{return JSON.parse(localStorage.getItem(testKey(mode))||'{}')}catch(e){return {}}}
function scoreAssessment(answers){
 let score=0,areas=[0,0,0,0,0];
 RPCUT.forEach((q,i)=>{if(answers[i]===q.k){score++;areas[q.area]++}});
 return {score,areas};
}
function assessmentComplete(mode){return !!assessmentRecord(mode).completed}
function submitAssessment(mode){
 const a=assess[mode];
 if(a.answers.some(x=>x===null))return toastMsg(`ยังตอบไม่ครบ ${20-a.answers.filter(x=>x!==null).length} ข้อ`);
 const result=scoreAssessment(a.answers);
 const assessmentRecordToSave={answers:a.answers,score:result.score,areas:result.areas,completed:true,submittedAt:new Date().toISOString()};
 localStorage.setItem(testKey(mode),JSON.stringify(assessmentRecordToSave));
 window.RDABackend?.syncAssessment?.(mode,assessmentRecordToSave);
 if(mode==='pre'){
  toastMsg('PRE-TEST RECORDED • Headquarters Unlocked');
  setTimeout(()=>go('portal'),650);
 }else{
  toastMsg('POST-TEST RECORDED • One more step');
  setTimeout(()=>{renderSatisfaction();go('satisfaction')},650);
 }
}
const SATISFACTION_ITEMS=[
 'ระบบ RDA ช่วยให้ฉันเข้าใจเนื้อหาเรื่องกัมมันตภาพรังสีมากขึ้น',
 'กิจกรรมและสถานการณ์ในระบบมีความท้าทายและน่าสนใจ',
 'ข้อเสนอแนะ (Feedback) ที่ได้รับช่วยให้ฉันปรับปรุงการตัดสินใจให้ดีขึ้น',
 'ระบบใช้งานง่าย ไม่ซับซ้อน',
 'ฉันรู้สึกมั่นใจในการตัดสินใจโดยใช้หลักฐานมากขึ้นหลังใช้ระบบนี้',
 'ฉันอยากแนะนำให้เพื่อนหรือรุ่นน้องได้ลองใช้ระบบนี้',
 'โดยรวมแล้วฉันพึงพอใจกับการเรียนรู้ผ่านระบบ RDA'
];
const SATISFACTION_SCALE=[
 {v:1,label:'ไม่เห็นด้วยอย่างยิ่ง'},
 {v:2,label:'ไม่เห็นด้วย'},
 {v:3,label:'เฉยๆ'},
 {v:4,label:'เห็นด้วย'},
 {v:5,label:'เห็นด้วยอย่างยิ่ง'}
];
function satisfactionKey(){return 'RDA_SATISFACTION_V1'}
function renderSatisfaction(){
 const host=byId('satisfactionHost');if(!host)return;
 const saved=(()=>{try{return JSON.parse(localStorage.getItem(satisfactionKey())||'{}')}catch(e){return {}}})();
 const answers=saved.answers||new Array(SATISFACTION_ITEMS.length).fill(null);
 host.innerHTML=SATISFACTION_ITEMS.map((q,qi)=>`
  <div class="likert-row" data-qi="${qi}">
   <p class="likert-q">${qi+1}. ${q}</p>
   <div class="likert-scale">
    ${SATISFACTION_SCALE.map(s=>`
     <button type="button" class="likert-opt ${answers[qi]===s.v?'selected':''}" data-v="${s.v}">
      <span class="likert-num">${s.v}</span><span class="likert-label">${s.label}</span>
     </button>`).join('')}
   </div>
  </div>`).join('')+
  `<div class="likert-comment">
    <label for="satisfactionComment">ข้อเสนอแนะเพิ่มเติม (ถ้ามี — ไม่บังคับ)</label>
    <textarea id="satisfactionComment" rows="3" placeholder="เช่น อยากให้เพิ่มอะไร หรือติดปัญหาอะไรระหว่างเล่น...">${saved.comment||''}</textarea>
   </div>`;
 host.querySelectorAll('.likert-row').forEach(row=>{
  const qi=Number(row.dataset.qi);
  row.querySelectorAll('.likert-opt').forEach(btn=>{
   btn.onclick=()=>{
    answers[qi]=Number(btn.dataset.v);
    row.querySelectorAll('.likert-opt').forEach(b=>b.classList.toggle('selected',b===btn));
    localStorage.setItem(satisfactionKey(),JSON.stringify({answers,comment:byId('satisfactionComment')?.value||''}));
   };
  });
 });
 byId('satisfactionComment')?.addEventListener('input',()=>{
  localStorage.setItem(satisfactionKey(),JSON.stringify({answers,comment:byId('satisfactionComment').value}));
 });
}
function submitSatisfaction(){
 const saved=(()=>{try{return JSON.parse(localStorage.getItem(satisfactionKey())||'{}')}catch(e){return {}}})();
 const answers=saved.answers||[];
 if(answers.some(x=>x===null||x===undefined))return toastMsg(`กรุณาตอบให้ครบทุกข้อ (เหลือ ${answers.filter(x=>x===null||x===undefined).length} ข้อ)`);
 const comment=byId('satisfactionComment')?.value||'';
 const record={answers,comment,submittedAt:new Date().toISOString()};
 localStorage.setItem(satisfactionKey(),JSON.stringify({...record,completed:true}));
 window.RDABackend?.syncSatisfaction?.(record);
 toastMsg('ขอบคุณสำหรับความคิดเห็น! 🙏');
 setTimeout(()=>{renderResultProfile();go('result')},650);
}
function bindAssessment(mode){
 byId(mode+'Prev').onclick=()=>{if(assess[mode].index>0){assess[mode].index--;renderAssessment(mode)}};
 byId(mode+'Next').onclick=()=>{if(assess[mode].index<19){assess[mode].index++;renderAssessment(mode)}else submitAssessment(mode)};
}
function decisionScores(){
 return ['r01','r02','r03','r04','r05','r06'].map(id=>{
  const keys=[`RDA_${id.toUpperCase()}_CASE_V3`,id==='r01'?'RDA_R01_CASE_V2':''];
  let rec={};
  for(const k of keys){if(!k)continue;try{const x=JSON.parse(localStorage.getItem(k)||'{}');if(Object.keys(x).length){rec=x;break}}catch(e){}}
  const rawInitial=Number(rec.initialScore||0), rawRevised=Number(rec.revisedScore||0);
  const is100=Number(rec.rubricMaxScore)===100 || String(rec.rubricEngine||'').endsWith('_100');
  return {id,initial:(rawInitial>0&&!is100?rawInitial*5:rawInitial),revised:(rawRevised>0&&!is100?rawRevised*5:rawRevised)};
 });
}
function renderResultProfile(){
 const pre=assessmentRecord('pre'),post=assessmentRecord('post'),delta=(post.score||0)-(pre.score||0);
 byId('resultAgentName').textContent=(state.name||'RDA Agent')+' • '+(state.specialty||'Agent');
 byId('resultPre').textContent=(pre.score||0)+'/20';byId('resultPost').textContent=(post.score||0)+'/20';
 byId('resultDelta').textContent=(delta>=0?'+':'')+delta;
 byId('conceptProfile').innerHTML=RPCUT_AREAS.map((name,i)=>{
  const before=Number(pre.areas?.[i]||0),after=Number(post.areas?.[i]||0),pct=Math.round(after/4*100);
  return `<div class="metric-row"><label>${name}</label><div class="metric-bar"><i style="width:${pct}%"></i></div><b>${before}→${after}/4</b></div>`;
 }).join('');
 const ds=decisionScores();
 byId('decisionProgression').innerHTML=ds.map((x,i)=>{
  const val=x.revised||x.initial||0,pct=Math.round(val/100*100);
  return `<div class="decision-row"><span>R-0${i+1}</span><div class="scores"><i style="width:${pct}%"></i></div><b>${x.initial}→${x.revised||x.initial}/100</b></div>`;
 }).join('');
 const avg=ds.reduce((s,x)=>s+(x.revised||x.initial||0),0)/6;
 byId('resultSummary').innerHTML=`<b>LEARNING SUMMARY</b><br>Conceptual Understanding: ${pre.score||0}/20 → ${post.score||0}/20 (${delta>=0?'+':''}${delta})<br>Average Decision Quality: ${avg.toFixed(1)}/100<br>ระบบเก็บผล Pre/Post แยกจาก XP และ Mission Score เพื่อใช้เป็นข้อมูลการประเมินการเรียนรู้`;
}
function exportResearchData(){
 const pre=assessmentRecord('pre'),post=assessmentRecord('post'),ds=decisionScores();
 const header=['Student','Username','School','Grade','Pre','Post','Delta',...ds.flatMap((x,i)=>[`R0${i+1}_Initial`,`R0${i+1}_Revision`])];
 const row=[state.name,state.username,state.school,state.grade,pre.score||0,post.score||0,(post.score||0)-(pre.score||0),...ds.flatMap(x=>[x.initial,x.revised])];
 const csv='\uFEFF'+header.join(',')+'\n'+row.map(x=>`"${String(x??'').replaceAll('"','""')}"`).join(',');
 const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='RDA_Research_'+(state.username||'agent')+'.csv';a.click();URL.revokeObjectURL(url);
}

document.addEventListener('DOMContentLoaded',()=>{
  bindAssessment('pre');bindAssessment('post');
  if(assessmentComplete('pre'))loadAssessment('pre');
  if(assessmentComplete('post'))loadAssessment('post');
  byId('satisfactionSubmit')?.addEventListener('click',submitSatisfaction);
});


/* ===== TEACHER DASHBOARD / RESEARCH MODE ===== */
function getCaseLearningRecord(id){
 const keys=[
  id==='r01'?'RDA_R01_CASE_V2':`RDA_${id.toUpperCase()}_CASE_V3`,
  `RDA_${id.toUpperCase()}_CASE_V2`
 ];
 for(const k of keys){
  try{
   const v=JSON.parse(localStorage.getItem(k)||'{}');
   if(v&&Object.keys(v).length)return v;
  }catch(e){}
 }
 return {};
}
function getDecisionRecord(id){
 try{return JSON.parse(localStorage.getItem('RDA_DECISION_'+id.toUpperCase())||'{}')}catch(e){return {}}
}
function rubricDimensions(id){
 const rec=getDecisionRecord(id),caseRec=getCaseLearningRecord(id);
 const claim=(rec.claim||'').trim().length>=15?4:(rec.claim||'').trim().length>=8?2:(rec.claim||'').trim()?1:0;
 const evidenceIds=Array.isArray(rec.evidenceIds)?rec.evidenceIds:[];
 const evidence=evidenceIds.length>=3?4:evidenceIds.length===2?3:evidenceIds.length===1?1:0;
 const rlen=(rec.reasoning||'').trim().length;
 const reasoning=rlen>=80?4:rlen>=45?3:rlen>=20?2:rlen?1:0;
 const risk=rec.risk?4:0;
 const dlen=(rec.decision||'').trim().length;
 const decision=dlen>=70?4:dlen>=35?3:dlen>=15?2:dlen?1:0;
 return {claim,evidence,reasoning,risk,decision,total:claim+evidence+reasoning+risk+decision,initial:Number(caseRec.initialScore||rec.initialScore||0),revision:Number(caseRec.revisedScore||rec.revisedScore||0)};
}
function teacherDataset(){
 const pre=assessmentRecord('pre'),post=assessmentRecord('post');
 const cases=['r01','r02','r03','r04','r05','r06'].map(id=>({id,...rubricDimensions(id),caseRec:getCaseLearningRecord(id),decisionRec:getDecisionRecord(id)}));
 return {agent:{name:state.name,username:state.username,school:state.school,grade:state.grade,specialty:state.specialty},pre,post,cases,generatedAt:new Date().toISOString()};
}
function renderTeacherDashboard(){
 const d=teacherDataset(),pre=Number(d.pre.score||0),post=Number(d.post.score||0),gain=post-pre;
 byId('dashPre').textContent=pre+'/20';byId('dashPost').textContent=post+'/20';byId('dashGain').textContent=(gain>=0?'+':'')+gain;
 const master=typeof getMasterProgress==='function'?getMasterProgress():{done:0};byId('dashCases').textContent=(master.done||0)+'/6';
 byId('dashConceptDomains').innerHTML=RPCUT_AREAS.map((name,i)=>{
  const a=Number(d.pre.areas?.[i]||0),b=Number(d.post.areas?.[i]||0);
  return `<div class="domain-row"><label>${name}</label><div class="dual-bar"><i style="width:${a/4*100}%"></i><em style="width:${b/4*100}%"></em></div><b>${a}→${b}/4</b></div>`;
 }).join('');
 byId('dashDecisionCases').innerHTML=d.cases.map((x,i)=>{
  const val=x.revision||x.initial||x.total||0;
  return `<div class="case-analytics-row"><span>R-0${i+1}</span><div class="case-bar"><i style="width:${val/100*100}%"></i></div><b>${x.initial}→${x.revision||x.initial}/100</b></div>`;
 }).join('');
 const totalInitial=d.cases.reduce((s,x)=>s+x.initial,0),totalRevision=d.cases.reduce((s,x)=>s+(x.revision||x.initial),0);
 byId('dashRevisionGain').textContent=(totalRevision-totalInitial>=0?'+':'')+(totalRevision-totalInitial)+' pts';
 byId('dashRevisionChart').innerHTML=d.cases.map((x,i)=>{
  const ini=x.initial,rev=x.revision||x.initial;
  return `<div class="revision-col"><div class="revision-bars"><i title="Initial ${ini}/100" style="height:${ini/100*100}%"></i><em title="Revision ${rev}/100" style="height:${rev/100*100}%"></em></div><b>R-0${i+1}</b><small>${ini} → ${rev}</small></div>`;
 }).join('');
 const dims=['claim','evidence','reasoning','risk','decision'],labels=['Claim','Evidence Use','Physics Reasoning','Risk Assessment','Decision Quality'];
 const sums=dims.map(k=>d.cases.reduce((s,x)=>s+x[k],0)/(d.cases.length*4)*100);
 byId('dashReasoningProfile').innerHTML=labels.map((label,i)=>`<div class="profile-row"><label>${label}</label><div class="single-bar"><i style="width:${Math.round(sums[i])}%"></i></div><b>${Math.round(sums[i])}%</b></div>`).join('');
 const preOk=d.pre.completed?100:0,postOk=d.post.completed?100:0;
 const decisionCount=d.cases.filter(x=>Object.keys(x.decisionRec).length).length;
 const revisionCount=d.cases.filter(x=>x.revision>0).length;
 const comp=[
  ['Pre-test',preOk],['Post-test',postOk],['Decision Records',decisionCount/6*100],['Revisions',revisionCount/6*100],['Case Data',(master.done||0)/6*100]
 ];
 byId('dashResearchCompleteness').innerHTML=comp.map(([l,p])=>`<div class="completeness-row"><label>${l}</label><div class="single-bar"><i style="width:${p}%"></i></div><b>${Math.round(p)}%</b></div>`).join('');
 byId('researchTableBody').innerHTML=d.cases.map((x,i)=>{
  const has=Object.keys(x.decisionRec).length>0,status=x.revision>0?'READY':x.initial>0?'REVISION NEEDED':has?'IN PROGRESS':'NO DATA';
  return `<tr><td>R-0${i+1}</td><td>${x.initial}</td><td>${x.revision}</td><td>${x.evidence}/4</td><td>${x.reasoning}/4</td><td>${x.risk}/4</td><td>${x.decision}/4</td><td class="${status==='READY'?'status-good':has?'status-warn':'status-lock'}">${status}</td></tr>`;
 }).join('');
}
function exportResearchDataset(){
 const d=teacherDataset();
 const headers=[
  'StudentName','Username','School','Grade','Specialty','PreScore','PostScore','Gain',
  ...RPCUT_AREAS.flatMap((_,i)=>[`PreDomain${i+1}`,`PostDomain${i+1}`]),
  ...d.cases.flatMap((x,i)=>[
   `R0${i+1}_Initial`,`R0${i+1}_Revision`,`R0${i+1}_Claim`,`R0${i+1}_Evidence`,
   `R0${i+1}_Reasoning`,`R0${i+1}_Risk`,`R0${i+1}_Decision`,`R0${i+1}_Confidence`
  ])
 ];
 const values=[
  d.agent.name,d.agent.username,d.agent.school,d.agent.grade,d.agent.specialty,
  d.pre.score||0,d.post.score||0,(d.post.score||0)-(d.pre.score||0),
  ...RPCUT_AREAS.flatMap((_,i)=>[d.pre.areas?.[i]||0,d.post.areas?.[i]||0]),
  ...d.cases.flatMap(x=>[
   x.initial,x.revision,x.claim,x.evidence,x.reasoning,x.risk,x.decision,x.decisionRec.confidence||''
  ])
 ];
 const escCsv=v=>`"${String(v??'').replaceAll('"','""')}"`;
 const csv='\uFEFF'+headers.map(escCsv).join(',')+'\n'+values.map(escCsv).join(',');
 const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='RDA_Research_Dataset_'+(state.username||'agent')+'.csv';a.click();URL.revokeObjectURL(url);
}

/* Cross-file completion handoff refresh */
window.addEventListener('load',()=>{
 try{
  const p=new URLSearchParams(location.search||'');
  if(p.get('rda_case_complete') && window.RDAMaster){
   setTimeout(()=>{renderMasterPortal();go('portal')},120);
  }
 }catch(e){}
});


/* ===== TEACHER ACCESS CONTROL ===== */
const RDA_TEACHER_SESSION_KEY = 'rdaTeacherSession';

function teacherSessionActive(){
  try{return sessionStorage.getItem(RDA_TEACHER_SESSION_KEY)==='1'}catch(e){return false}
}
function openTeacherCenter(){
  if(window.RDABackend?.configured?.()){
    window.RDABackend.openTeacherSystem();
    return;
  }
  if(teacherSessionActive()){
    renderTeacherDashboard();
    go('dashboard');
    return;
  }
  const modal=byId('teacherPinModal');
  if(!modal)return;
  byId('teacherPinInput').value='';
  byId('teacherPinMessage').textContent='';
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden','false');
  setTimeout(()=>byId('teacherPinInput')?.focus(),50);
}
function closeTeacherPin(){
  const modal=byId('teacherPinModal');
  modal?.classList.add('hidden');
  modal?.setAttribute('aria-hidden','true');
}
function verifyTeacherPin(){
  const pin=(byId('teacherPinInput')?.value||'').trim();
  const msg=byId('teacherPinMessage');
  // Teacher PIN is verified only by the Apps Script backend.
  if(!window.RDABackend?.configured?.()){
    if(msg)msg.textContent='ยังไม่ได้เชื่อมต่อระบบครู';
    return;
  }
  const url=window.RDABackend.teacherUrl?.();
  if(!url){
    if(msg)msg.textContent='ไม่พบ URL ของระบบครู';
    return;
  }
  closeTeacherPin();
  window.open(url, '_blank', 'noopener');
}
function lockTeacherCenter(){
  try{sessionStorage.removeItem(RDA_TEACHER_SESSION_KEY)}catch(e){}
  go('portal');
  toastMsg('Teacher Center locked');
}

const __rdaOriginalGo = go;
go = function(id){
  if(id==='dashboard' && !teacherSessionActive()){
    openTeacherCenter();
    return;
  }
  return __rdaOriginalGo(id);
};

/* Student Research Passport = own result profile only */
function renderStudentPassport(){
  const post=assessmentRecord('post');
  if(post.completed){
    renderResultProfile();
    go('result');
  }else{
    const pre=assessmentRecord('pre');
    const progress=typeof getMasterProgress==='function'?getMasterProgress():{done:0};
    toastMsg(`Research Passport • PRE ${pre.score||0}/20 • Missions ${progress.done||0}/6 • POST pending`);
  }
}


function rdaReadCaseScore_(id){
  const ids=[id,id.toUpperCase(),id.replace('r','R-')];
  const candidateKeys=[
    'RDA_CASE_'+id.toUpperCase(),
    'RDA_'+id.toUpperCase(),
    'RDA_DECISION_'+id.toUpperCase(),
    'rdk'+id.toUpperCase(),
    'rdk'+id.charAt(0).toUpperCase()+id.slice(1)
  ];
  for(const k of candidateKeys){
    try{
      const raw=localStorage.getItem(k); if(!raw)continue;
      const o=JSON.parse(raw);
      const score=Number(o.score ?? o.finalScore ?? o.revisedScore ?? o.totalScore ?? 0);
      const completed=!!(o.completed || o.evaluated || o.revisionSubmitted || score>0);
      if(completed || score>0)return {score:Math.max(0,Math.min(100,Math.round(score))),completed:true};
    }catch(e){}
  }
  try{
    const master=window.RDAMaster?.getCaseState?.(id);
    if(master){
      const score=Number(master.score ?? master.finalScore ?? 0);
      return {score:Math.max(0,Math.min(100,Math.round(score))),completed:!!master.completed || score>0};
    }
  }catch(e){}
  return {score:0,completed:false};
}

function renderAgentPassport(){
  const caseIds=['r01','r02','r03','r04','r05','r06'];
  const results=caseIds.map(rdaReadCaseScore_);
  const completed=results.filter(x=>x.completed).length;
  const total=results.reduce((s,x)=>s+(x.completed?x.score:0),0);
  const avg=completed?Math.round(total/completed):0;
  const xp=results.reduce((s,x)=>s+(x.completed?Math.max(100,x.score*10):0),0);

  let rank='Junior Detective';
  if(completed>=6 && avg>=85)rank='Master Detective';
  else if(completed>=5)rank='Senior Detective';
  else if(completed>=3)rank='Field Detective';

  const name=(window.state?.name || window.state?.username || localStorage.getItem('RDA_RESEARCH_ID') || 'Agent');
  const username=(window.state?.username || 'RDA');
  const grade=(window.state?.grade || window.state?.classroom || '—');
  const agentId='RDA-'+String(username).replace(/[^A-Za-z0-9]/g,'').toUpperCase().slice(-8).padStart(3,'0');

  const set=(id,val)=>{const e=document.getElementById(id);if(e)e.textContent=val};
  set('passportAgentName',name);
  set('passportAgentId',agentId);
  set('passportAgentClass',grade);
  set('passportRank',rank);
  set('passportRankTop',rank);
  set('passportRankLarge',rank);
  set('passportMissionCount',completed+'/6');
  set('passportTotalXP',xp);
  set('passportXpText',xp+' XP');
  set('passportProgressText',completed+' / 6 missions completed');
  set('passportAverageText','Average '+avg+'%');
  set('passportStampSummary',completed+' stamps');
  set('recordMissions',completed+' / 6');
  set('recordTotalScore',total+' / 600');
  set('recordAverage',avg+'%');
  set('recordXP',xp+' XP');
  set('recordRank',rank);
  set('recordStatus',completed===6?'RDA CERTIFIED':'IN TRAINING');

  const fill=document.getElementById('passportProgressFill');
  if(fill)fill.style.width=((completed/6)*100)+'%';

  document.querySelectorAll('.mission-stamp').forEach((card,i)=>{
    const r=results[i];
    const score=card.querySelector('.stamp-score');
    const status=card.querySelector('.stamp-status');
    card.classList.toggle('completed',r.completed);
    if(score)score.textContent=r.completed?(r.score+'/100'):'—';
    if(status)status.textContent=r.completed?'STAMPED':'LOCKED';
  });

  const master=document.getElementById('masterSeal');
  if(master){
    master.classList.toggle('unlocked',completed===6);
    set('masterSealText',completed===6?'RDA CERTIFIED AGENT':'LOCKED');
  }
}

document.addEventListener('DOMContentLoaded',()=>{
  const p=document.getElementById('passport');
  if(p)renderAgentPassport();
});


/* ===== RDA V6.4.8 TRUE AGENT PASSPORT ===== */
function readStudentIdentityForPassport_(){
  let auth={};
  try{auth=JSON.parse(localStorage.getItem('RDA_AUTH_V1')||'{}')}catch(e){}
  const e=(typeof state==='object'&&state)?state:{};
  const classroom=(window.RDAClassroomConfig&&window.RDAClassroomConfig.classroomId)||'';
  const grade=auth.grade||e.grade||'—';
  const classText=classroom ? (grade+' / '+classroom) : grade;
  return {
    name:auth.name||e.studentName||((e.name&&!/^Agent\s/i.test(e.name))?e.name:'—'),
    id:auth.researchId||localStorage.getItem('RDA_RESEARCH_ID')||e.username||'—',
    username:e.username||auth.username||'—',
    school:auth.school||e.school||'—',
    classText
  };
}
function renderTrueAgentPassport(){
  const d=typeof getMasterProgress==='function'
    ? getMasterProgress()
    : {missions:{},done:0,total:0};

  const ids=['r01','r02','r03','r04','r05','r06'];
  const records=ids.map(id=>{
    const m=(d.missions&&d.missions[id])||{};
    return {id,completed:!!m.completed,score:Number(m.score||0)};
  });

  const completed=Number(d.done ?? records.filter(r=>r.completed).length) || 0;
  const total=Number(d.total ?? records.reduce((s,r)=>s+(r.completed?r.score:0),0)) || 0;
  const avg=completed?Math.round(total/completed):0;

  /* XP derives only from actual mission score; it is not another achievement score. */
  const xp=Math.round(total*10);

  let rank='Junior Detective';
  if(completed===6 && avg>=85)rank='Master Detective';
  else if(completed>=5)rank='Senior Detective';
  else if(completed>=3)rank='Field Detective';

  const e=(typeof state==='object'&&state)?state:{};
  let snap=null;
  try{snap=window.RDAMaster?.snapshot?.()}catch(err){}
  const agent=(snap&&snap.agent)||{
    name:e.name||'RDA Agent',
    avatar:e.avatar||'assets/candidate_ethan.jpg',
    specialty:e.specialty||'Radiation Investigation'
  };
  const student=readStudentIdentityForPassport_();

  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v};
  const img=document.getElementById('lr2AgentAvatar');
  if(img)img.src=agent.avatar||e.avatar||'assets/candidate_ethan.jpg';

  set('lr2AgentName',agent.name||e.name||'RDA Agent');
  set('lr2AgentSpecialty',agent.specialty||e.specialty||'Radiation Investigation');
  set('lr2StudentName',student.name);
  set('lr2StudentId',(student.username!=='—'?student.username+' • ':'')+student.id);
  set('lr2StudentClass',student.classText);
  set('lr2StudentSchool',student.school);

  set('lr2Rank',rank);
  set('lr2XP',xp+' XP');
  set('lr2ProgressTitle',completed+' / 6 ภารกิจสำเร็จ');
  set('lr2ProgressPercent',Math.round(completed/6*100)+'%');
  set('lr2MissionCount',completed+' / 6');
  set('lr2TotalScore',Math.round(total)+' / 600');
  set('lr2Average',avg+'%');
  set('lr2TotalXP',xp+' XP');
  set('lr2StampCount',completed+' / 6 STAMPED');

  const fill=document.getElementById('lr2ProgressFill');
  if(fill)fill.style.width=(completed/6*100)+'%';

  let strongest=null;
  records.forEach(r=>{
    const card=document.querySelector('[data-passport-case="'+r.id+'"]');
    if(!card)return;
    card.classList.toggle('completed',r.completed);
    const sb=card.querySelector('.lr2-mission-score b');
    const ss=card.querySelector('.lr2-mission-score span');
    if(sb)sb.textContent=r.completed?Math.round(r.score)+'/100':'—';
    if(ss)ss.textContent=r.completed?'STAMPED':'LOCKED';
    if(r.completed && (!strongest || r.score>strongest.score))strongest=r;
  });

  set('lr2SummaryAgent',agent.name||'RDA Agent');
  set('lr2SummaryRank',rank);
  set('lr2SummaryProgress',completed+' / 6');
  set('lr2SummaryAverage',avg+'%');
  set('lr2Strongest',strongest?strongest.id.toUpperCase()+' • '+Math.round(strongest.score)+'/100':'—');
  set('lr2Status',completed===6?'RDA CERTIFIED':completed>0?'IN PROGRESS':'NOT STARTED');

  const seal=document.getElementById('lr2Seal');
  if(seal){
    seal.classList.toggle('unlocked',completed===6);
    set('lr2SealText',completed===6?'RDA CERTIFIED AGENT':'LOCKED');
  }
}


/* RDA V6.5.1 — Passport dashboard visual status hook */
(function(){
  const _origPassportRender = typeof renderTrueAgentPassport==='function' ? renderTrueAgentPassport : null;
  if(_origPassportRender){
    window.renderTrueAgentPassport = function(){
      _origPassportRender();
      try{
        const d = typeof getMasterProgress==='function' ? getMasterProgress() : {done:0};
        const el = document.getElementById('apxAllMissionsStatus');
        if(el) el.classList.toggle('incomplete', Number(d.done||0) < 6);
      }catch(e){}
    };
  }
})();
