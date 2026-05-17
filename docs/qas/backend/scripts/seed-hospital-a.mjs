/**
 * seed-hospital-a.mjs
 * Seeds Hospital A (HSP-0fe2c032...) with rich demo data:
 *   - 25 new patients with realistic names
 *   - Active visits spread across all 5 stages
 *   - Some visits with departments, notes, assigned staff
 *   - Some checked-out visits (historical)
 *   - discharged patients
 *
 * Usage: node seed-hospital-a.mjs
 */

import { api, get, post, patch, BASE } from './api.mjs';

const HSP = 'HSP-0fe2c032-7d09-45a0-9259-4e9fc75ddf80';
const PW  = 'Medcord123!';

const hapi  = (path, opts = {}) => api(`/hospitals/${HSP}${path}`, opts);
const hget  = (path, token)       => hapi(path, { token });
const hpost = (path, body, token) => hapi(path, { method: 'POST', body, token });
const hpatch= (path, body, token) => hapi(path, { method: 'PATCH', body, token });

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Auth ──────────────────────────────────────────────────────────────────────

const rLogin = await post('/auth/login', { email: 'alice@medcord.test', password: PW });
if (rLogin.status !== 200) { console.error('Login failed', rLogin.status); process.exit(1); }
const TOKEN = rLogin.data.data.tokens.accessToken;
console.log('Logged in as alice (super_admin)');

// Login as doctor (Carol) for check-in operations — needs patient.admit
const rDocLogin = await post('/auth/login', { email: 'carol@medcord.test', password: PW });
if (rDocLogin.status !== 200) { console.error('Doctor login failed', rDocLogin.status, JSON.stringify(rDocLogin.data)); process.exit(1); }
const DOC_TOKEN = rDocLogin.data.data.tokens.accessToken;
console.log('Logged in as carol (doctor)');

// Staff IDs
const NURSE_ID  = 'MBR-d0988ab5-ae31-4b62-ad22-cc3bf5f55f90'; // Dave Mensah (nurse) — wait, let's use correct ones
const DOCTOR_ID = 'MBR-75daeba6-30c5-47c1-9f53-8d16726eddd7'; // Carol Osei (doctor)
const NURSE_IDS = [
  'MBR-d0988ab5-ae31-4b62-ad22-cc3bf5f55f90', // may not exist — check below
  'MBR-f573db05-64e7-488c-8a7b-e05c12390fa1', // QA Nurse
];
const DOCTOR_IDS = [
  'MBR-75daeba6-30c5-47c1-9f53-8d16726eddd7', // Carol Osei
  'MBR-e23acb7b-eb37-4477-887e-586271c55f46', // Phero
  'MBR-20b5ea8d-4425-4d80-977a-1a023ae7d08f', // QA Doctor
];

// Verify staff IDs by fetching staff list
const rStaff = await hget('/staff', TOKEN);
const staffMap = {};
for (const m of (rStaff.data?.data?.items ?? [])) {
  staffMap[m.id] = m;
}
const validNurses  = NURSE_IDS.filter(id => staffMap[id]?.role === 'nurse');
const validDoctors = DOCTOR_IDS.filter(id => ['doctor'].includes(staffMap[id]?.role));
console.log('Valid nurses:', validNurses.map(id => staffMap[id]?.name ?? id));
console.log('Valid doctors:', validDoctors.map(id => staffMap[id]?.name ?? id));

// Dave Mensah is nurse role?
const dave = Object.values(staffMap).find(m => m.email === 'dave@medcord.test');
if (dave) validNurses.push(dave.id);
const allNurses  = [...new Set(validNurses)];
const allDoctors = [...new Set(validDoctors)];
console.log('Nurses available:', allNurses.length);
console.log('Doctors available:', allDoctors.length);

function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ── Patient data ──────────────────────────────────────────────────────────────

const PATIENTS = [
  // name, dob, sex, bloodType
  ['Kofi', 'Mensah',    '1985-03-12', 'male'],
  ['Ama', 'Asante',     '1992-07-04', 'female'],
  ['Kwame', 'Boateng',  '1978-11-20', 'male'],
  ['Abena', 'Owusu',    '2001-01-15', 'female'],
  ['Yaw', 'Darko',      '1965-09-08', 'male'],
  ['Akosua', 'Frimpong','1988-05-30', 'female'],
  ['Kweku', 'Adu',      '1995-12-03', 'male'],
  ['Adwoa', 'Ofori',    '1972-08-17', 'female'],
  ['Fiifi', 'Quaye',    '2003-02-28', 'male'],
  ['Esi', 'Amoah',      '1990-06-11', 'female'],
  ['Kojo', 'Tetteh',    '1983-04-25', 'male'],
  ['Afia', 'Benson',    '1998-10-07', 'female'],
  ['Nana', 'Ankomah',   '1960-01-30', 'male'],
  ['Efua', 'Kumi',      '2005-03-19', 'female'],
  ['Kwesi', 'Larbi',    '1975-07-22', 'male'],
  ['Maame', 'Sarpong',  '1987-11-14', 'female'],
  ['Appiah', 'Nyarko',  '1993-09-01', 'male'],
  ['Adjoa', 'Asiedu',   '2000-04-16', 'female'],
  ['Kofi', 'Opoku',     '1969-12-08', 'male'],
  ['Akua', 'Yeboah',    '1996-06-27', 'female'],
  ['Kwabena', 'Poku',   '1980-08-03', 'male'],
  ['Afua', 'Bonsu',     '1991-02-09', 'female'],
  ['Yaa', 'Kyei',       '2002-10-31', 'female'],
  ['Kwadwo', 'Ansah',   '1974-05-05', 'male'],
  ['Aba', 'Baidoo',     '1989-03-23', 'female'],
];

const DEPARTMENTS = ['General OPD', 'Cardiology', 'Emergency', 'Pediatrics', 'Neurology', 'Orthopedics', 'Gynecology', 'Dermatology'];
const NOTES = [
  'Patient complains of chest pain and shortness of breath',
  'Routine follow-up visit for hypertension management',
  'High fever (39.5°C), headache, and fatigue for 3 days',
  'Post-operative check — appendectomy 2 weeks ago',
  'Diabetic review — blood sugar consistently elevated',
  'Knee pain and limited mobility after sports injury',
  'Rash and itching on arms, possible allergic reaction',
  'Abdominal pain — upper right quadrant, nausea',
  'Pediatric patient — ear infection, irritability',
  'Migraine with visual aura, recurrent for 6 months',
  'Blood pressure 160/100 — dizziness, referred by GP',
  'Prenatal check — 28 weeks gestation, all normal',
  'Dental pain referred to general surgery for evaluation',
  'Wound care follow-up — laceration healing well',
  'Anxiety and insomnia — referral from mental health',
];

// ── Register patients ─────────────────────────────────────────────────────────

console.log('\n── Registering patients ──────────────────────────────────────');
const patientIds = [];
for (const [firstName, lastName, dateOfBirth, sex] of PATIENTS) {
  const r = await hpost('/patients', {
    demographics: { firstName, lastName, dateOfBirth, sex },
  }, TOKEN);
  if (r.status === 201) {
    patientIds.push(r.data.data.patient.id);
    process.stdout.write('.');
  } else {
    console.error(`\nFailed to create patient ${firstName} ${lastName}:`, r.status, JSON.stringify(r.data)?.slice(0,100));
  }
}
console.log(`\nCreated ${patientIds.length} patients`);

// ── Helper: check in a patient and return visit ───────────────────────────────

async function checkin(patientId, opts = {}) {
  const r = await hpost(`/patients/${patientId}/checkin`, {
    assignedNurseId: opts.nurseId,
    assignedDoctorId: opts.doctorId,
    department: opts.department,
    notes: opts.notes,
  }, DOC_TOKEN);
  if (r.status !== 200) {
    console.error(`  checkin failed for ${patientId}:`, r.status);
    return null;
  }
  // GET /visits to find the new visit
  const rV = await hget('/visits', DOC_TOKEN);
  const visits = rV.data?.data?.visits ?? [];
  return visits.find(v => v.patientId === patientId) ?? null;
}

async function advanceStage(visitId, stage) {
  const r = await hpatch(`/visits/${visitId}`, { stage }, DOC_TOKEN);
  return r.status === 200;
}

async function checkout(visitId) {
  const r = await hpost(`/visits/${visitId}/checkout`, {}, DOC_TOKEN);
  return r.status === 200;
}

// ── Seed active visits at various stages ─────────────────────────────────────

console.log('\n── Creating active visits across all stages ──────────────────');

let idx = 0;

// Stage: waiting_nurse (5 patients) — checked in with a nurse assigned
console.log('\n  [waiting_nurse] — 5 patients waiting for nurse triage');
const waitingNursePats = patientIds.slice(idx, idx + 5); idx += 5;
for (const pid of waitingNursePats) {
  const v = await checkin(pid, {
    nurseId: pickRandom(allNurses),
    department: pickRandom(DEPARTMENTS),
    notes: pickRandom(NOTES),
  });
  if (v) console.log(`    visit ${v.id} | q:${v.queueNumber} | ${v.stage}`);
}

// Stage: with_nurse (4 patients) — advance past waiting_nurse
console.log('\n  [with_nurse] — 4 patients currently with nurse');
const withNursePats = patientIds.slice(idx, idx + 4); idx += 4;
for (const pid of withNursePats) {
  const v = await checkin(pid, {
    nurseId: pickRandom(allNurses),
    doctorId: pickRandom(allDoctors),
    department: pickRandom(DEPARTMENTS),
    notes: pickRandom(NOTES),
  });
  if (v) {
    await advanceStage(v.id, 'with_nurse');
    console.log(`    visit ${v.id} | q:${v.queueNumber} | with_nurse`);
  }
}

// Stage: waiting_doctor (4 patients) — went through nurse, now waiting for doctor
console.log('\n  [waiting_doctor] — 4 patients waiting for doctor');
const waitingDoctorPats = patientIds.slice(idx, idx + 4); idx += 4;
for (const pid of waitingDoctorPats) {
  const v = await checkin(pid, {
    nurseId: pickRandom(allNurses),
    doctorId: pickRandom(allDoctors),
    department: pickRandom(DEPARTMENTS),
    notes: pickRandom(NOTES),
  });
  if (v) {
    await advanceStage(v.id, 'with_nurse');
    await advanceStage(v.id, 'waiting_doctor');
    console.log(`    visit ${v.id} | q:${v.queueNumber} | waiting_doctor`);
  }
}

// Stage: waiting_doctor directly (no nurse) — 3 patients
console.log('\n  [waiting_doctor direct] — 3 patients (doctor-only, no nurse)');
const waitingDoctorDirectPats = patientIds.slice(idx, idx + 3); idx += 3;
for (const pid of waitingDoctorDirectPats) {
  const v = await checkin(pid, {
    doctorId: pickRandom(allDoctors),
    department: pickRandom(DEPARTMENTS),
    notes: pickRandom(NOTES),
  });
  if (v) console.log(`    visit ${v.id} | q:${v.queueNumber} | ${v.stage}`);
}

// Stage: with_doctor (3 patients)
console.log('\n  [with_doctor] — 3 patients currently with doctor');
const withDoctorPats = patientIds.slice(idx, idx + 3); idx += 3;
for (const pid of withDoctorPats) {
  const v = await checkin(pid, {
    nurseId: pickRandom(allNurses),
    doctorId: pickRandom(allDoctors),
    department: pickRandom(DEPARTMENTS),
    notes: pickRandom(NOTES),
  });
  if (v) {
    await advanceStage(v.id, 'with_nurse');
    await advanceStage(v.id, 'waiting_doctor');
    await advanceStage(v.id, 'with_doctor');
    console.log(`    visit ${v.id} | q:${v.queueNumber} | with_doctor`);
  }
}

// Stage: done but NOT checked out (stage=done, still active) — 2 patients
console.log('\n  [done, not checked out] — 2 patients done but still active');
const donePats = patientIds.slice(idx, idx + 2); idx += 2;
for (const pid of donePats) {
  const v = await checkin(pid, {
    doctorId: pickRandom(allDoctors),
    department: pickRandom(DEPARTMENTS),
    notes: pickRandom(NOTES),
  });
  if (v) {
    await advanceStage(v.id, 'with_nurse');
    await advanceStage(v.id, 'waiting_doctor');
    await advanceStage(v.id, 'with_doctor');
    await advanceStage(v.id, 'done');
    console.log(`    visit ${v.id} | q:${v.queueNumber} | done`);
  }
}

// Checked-out visits (historical) — 4 patients: checkin → checkout
console.log('\n  [checked out] — 4 historical completed visits');
const checkedOutPats = patientIds.slice(idx, idx + 4); idx += 4;
for (const pid of checkedOutPats) {
  const v = await checkin(pid, {
    doctorId: pickRandom(allDoctors),
    department: pickRandom(DEPARTMENTS),
    notes: pickRandom(NOTES),
  });
  if (v) {
    await advanceStage(v.id, 'with_doctor');
    await advanceStage(v.id, 'done');
    const ok = await checkout(v.id);
    console.log(`    visit ${v.id} | q:${v.queueNumber} | checked out: ${ok}`);
  }
}

// ── Final tally ───────────────────────────────────────────────────────────────

console.log('\n── Final state ──────────────────────────────────────────────');
const rFinal = await hget('/visits', DOC_TOKEN);
const active = rFinal.data?.data?.visits ?? [];
console.log(`Active visits in queue: ${active.length}`);

const byStageName = {};
for (const v of active) {
  byStageName[v.stage] = (byStageName[v.stage] ?? 0) + 1;
}
for (const [stage, count] of Object.entries(byStageName)) {
  console.log(`  ${stage}: ${count}`);
}

const rPats = await hget('/patients', TOKEN);
const allPats = rPats.data?.data?.items ?? [];
console.log(`\nTotal patients in Hospital A: ${allPats.length}`);
const byStatus = {};
for (const p of allPats) {
  byStatus[p.admissionStatus ?? 'none'] = (byStatus[p.admissionStatus ?? 'none'] ?? 0) + 1;
}
for (const [s, c] of Object.entries(byStatus)) {
  console.log(`  admissionStatus=${s}: ${c}`);
}

console.log('\nDone. Refresh the UI — Hospital A should now have a full queue.');
