/**
 * restore-seed.mjs
 * ─────────────────────────────────────────────────────────────
 * Fully restores + seeds Hospital A and Hospital B from scratch.
 *
 * What it sets up:
 *   Hospital A  (subdomain: hospital-a)
 *     Staff   : alice (super_admin/owner), bob (hospital_admin),
 *               carol (doctor ×3 total), dave (nurse ×2 total),
 *               eve (reception), frank (lab_tech),
 *               qa-doctor, qa-nurse, qa-lab-tech, qa-reception
 *     Custom roles: "Cleaner Updated" (3 perms), "QA Test Role" (2 perms)
 *     Units   : Cardiology dept, Emergency dept, Pediatrics dept,
 *               Ward A (unit), Ward B (unit), ICU (ward),
 *               Cardiology Clinic (unit, child of Cardiology)
 *     Patients: 30 realistic Ghanaian patients
 *     Visits  : active visits spread across all 5 stages + historical checkouts
 *
 *   Hospital B  (subdomain: hospital-b)
 *     Staff   : grace (super_admin/owner)
 *     Patients: 5 patients, no active visits (used for isolation tests)
 *
 * Usage: node restore-seed.mjs
 * ─────────────────────────────────────────────────────────────
 */

import { api, get, post, patch, BASE } from './api.mjs';

// ── Helpers ───────────────────────────────────────────────────────────────────

const PW = 'Medcord123!';

const hapi  = (hid, path, opts = {}) => api(`/hospitals/${hid}${path}`, opts);
const hget  = (hid, path, tok)        => hapi(hid, path, { token: tok });
const hpost = (hid, path, body, tok)  => hapi(hid, path, { method: 'POST', body, token: tok });
const hpatch= (hid, path, body, tok)  => hapi(hid, path, { method: 'PATCH', body, token: tok });

function ok(r, label) {
  if (r.status >= 200 && r.status < 300) {
    console.log(`  ✓ ${label}`);
    return true;
  }
  console.error(`  ✗ ${label} → ${r.status} ${JSON.stringify(r.data)?.slice(0, 200)}`);
  return false;
}

function fatal(r, label) {
  if (!ok(r, label)) process.exit(1);
}

function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ── Step 1: Login all existing accounts ───────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║       Medcord — Full Restore & Seed Script               ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

console.log('── Step 1: Login existing accounts ─────────────────────────');

async function loginUser(email) {
  const r = await post('/auth/login', { email, password: PW });
  if (r.status !== 200) {
    console.error(`  ✗ Login failed for ${email}: ${r.status} ${JSON.stringify(r.data)?.slice(0, 100)}`);
    return null;
  }
  console.log(`  ✓ ${email}`);
  return r.data.data.tokens.accessToken;
}

async function registerIfMissing(name, email) {
  const rLogin = await post('/auth/login', { email, password: PW });
  if (rLogin.status === 200) {
    console.log(`  ✓ ${email} (already exists)`);
    return rLogin.data.data.tokens.accessToken;
  }
  const rReg = await post('/auth/register', { name, email, password: PW });
  if (rReg.status !== 201) {
    console.error(`  ✗ Register ${email}: ${rReg.status} ${JSON.stringify(rReg.data)?.slice(0, 100)}`);
    return null;
  }
  const rLogin2 = await post('/auth/login', { email, password: PW });
  console.log(`  ✓ ${email} (registered)`);
  return rLogin2.data.data.tokens.accessToken;
}

const aliceTok0  = await loginUser('alice@medcord.test');
const bobTok0    = await loginUser('bob@medcord.test');
const carolTok0  = await loginUser('carol@medcord.test');
const daveTok0   = await loginUser('dave@medcord.test');
const eveTok0    = await loginUser('eve@medcord.test');
const frankTok0  = await registerIfMissing('Frank Adu',   'frank@medcord.test');
const graceTok0  = await registerIfMissing('Grace Owusu', 'grace@medcord.test');

if (!aliceTok0) { console.error('FATAL: alice login failed'); process.exit(1); }

// ── Step 2: Find / create hospitals ───────────────────────────────────────────

console.log('\n── Step 2: Locate hospitals ─────────────────────────────────');

const rHospList = await get('/hospitals', aliceTok0);
const allHospitals = rHospList.data?.data?.hospitals ?? [];
let hospA = allHospitals.find(h => h.subdomain === 'hospital-a');
let hospB = allHospitals.find(h => h.subdomain === 'hospital-b');

if (hospA) {
  console.log(`  ✓ Hospital A found: ${hospA.id}`);
} else {
  const r = await post('/hospitals', {
    name: 'Hospital A', type: 'general',
    location: 'Accra, Ghana', subdomain: 'hospital-a',
  }, aliceTok0);
  fatal(r, 'Create Hospital A');
  hospA = r.data.data.hospital;
}

// Hospital B may be owned by grace — check grace's hospital list too
if (!hospB) {
  const rGH = await get('/hospitals', graceTok0);
  hospB = (rGH.data?.data?.hospitals ?? []).find(h => h.subdomain === 'hospital-b');
}
if (hospB) {
  console.log(`  ✓ Hospital B found: ${hospB.id}`);
} else {
  const r = await post('/hospitals', {
    name: 'Hospital B', type: 'clinic',
    location: 'Kumasi, Ghana', subdomain: 'hospital-b',
  }, graceTok0);
  fatal(r, 'Create Hospital B');
  hospB = r.data.data.hospital;
}

const HSP_A = hospA.id;
const HSP_B = hospB.id;
console.log(`  Hospital A: ${HSP_A}`);
console.log(`  Hospital B: ${HSP_B}`);

// Re-login alice to get hospital-scoped JWT
await get(`/hospitals/${HSP_A}`, aliceTok0);
const rAliceLogin = await post('/auth/login', { email: 'alice@medcord.test', password: PW });
const aliceTok = rAliceLogin.data.data.tokens.accessToken;

// Grace gets hospital B scoped token
await get(`/hospitals/${HSP_B}`, graceTok0);
const rGraceLogin = await post('/auth/login', { email: 'grace@medcord.test', password: PW });
const graceTok = rGraceLogin.data.data.tokens.accessToken;

// ── Step 3: Invite + onboard Hospital A staff ─────────────────────────────────

console.log('\n── Step 3: Staff for Hospital A ─────────────────────────────');

const staffA = {};

// Check existing members first
const rExistingStaff = await hget(HSP_A, '/staff', aliceTok);
const existingMembers = rExistingStaff.data?.data?.items ?? [];
console.log(`  Existing members: ${existingMembers.length}`);
for (const m of existingMembers) {
  console.log(`    ${m.email} → ${m.role} (${m.id})`);
  staffA[m.email] = { id: m.id, role: m.role, token: null };
}

// NOTE: acceptInvitation API endpoint only works for brand-new users (throws 409 if user exists).
// For existing users we write the hospital_members record directly to MongoDB via a temp JS file.
const { execSync } = await import('child_process');
const { writeFileSync } = await import('fs');

async function insertMemberViaDB(email, role, hospitalId) {
  const rL = await post('/auth/login', { email, password: PW });
  if (rL.status !== 200) { console.error(`  ✗ Cannot login ${email}`); return null; }
  const userId = rL.data.data.user.id;
  const memberId = `MBR-${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const jsFile = '/tmp/insert_member_seed.js';
  writeFileSync(jsFile, `
const existing = db.hospital_members.findOne({ hospitalId: '${hospitalId}', userId: '${userId}' });
if (existing) { print('already:' + existing.id); }
else {
  db.hospital_members.insertOne({
    id: '${memberId}', hospitalId: '${hospitalId}', userId: '${userId}',
    role: '${role}', status: 'active',
    joinedAt: new Date('${now}'), createdAt: new Date('${now}'), updatedAt: new Date('${now}'), __v: 0
  });
  print('inserted:${memberId}');
}
`);
  try {
    const out = execSync('mongosh medcord --quiet /tmp/insert_member_seed.js', { encoding: 'utf8' }).trim();
    return out.startsWith('already:') ? out.replace('already:', '') : memberId;
  } catch (e) { console.error(`  ✗ DB insert ${email}:`, e.stderr); return null; }
}

async function ensureMember(email, role, name) {
  if (staffA[email]) {
    const rL = await post('/auth/login', { email, password: PW });
    if (rL.status === 200) staffA[email].token = rL.data.data.tokens.accessToken;
    console.log(`  ✓ ${email} already member (${role})`);
    return;
  }

  // Register user if they don't have an account yet
  const rLoginCheck = await post('/auth/login', { email, password: PW });
  if (rLoginCheck.status !== 200) {
    const rReg = await post('/auth/register', { name, email, password: PW });
    if (rReg.status !== 201) { console.error(`  ✗ Register ${email}: ${rReg.status}`); return; }
  }

  // Insert member record directly — bypasses acceptInvitation's existing-user block
  const memberId = await insertMemberViaDB(email, role, HSP_A);
  const rL = await post('/auth/login', { email, password: PW });
  staffA[email] = { id: memberId, role, token: rL.status === 200 ? rL.data.data.tokens.accessToken : null };
  console.log(`  ✓ ${email} (${role}) → ${memberId}`);
}

// Core staff
await ensureMember('bob@medcord.test',          'hospital_admin', 'Bob Asante');
await ensureMember('carol@medcord.test',         'doctor',         'Carol Osei');
await ensureMember('dave@medcord.test',           'nurse',          'Dave Mensah');
await ensureMember('eve@medcord.test',            'reception',      'Eve Darko');
await ensureMember('frank@medcord.test',          'lab_tech',       'Frank Adu');

// QA accounts (re-register if gone)
await ensureMember('qa-doctor@medcord.test',     'doctor',         'QA Doctor');
await ensureMember('qa-nurse@medcord.test',      'nurse',          'QA Nurse');
await ensureMember('qa-lab-tech@medcord.test',   'lab_tech',       'QA Lab Tech');
await ensureMember('qa-reception@medcord.test',  'reception',      'QA Reception');

// Extra doctor and nurse for member count tests (3 doctors, 2 nurses total for role-view tests)
await ensureMember('phero@medcord.test',         'doctor',         'Phero Asante');
await ensureMember('qa-nurse2@medcord.test',     'nurse',          'QA Nurse 2');

// Refresh alice token (may have been bumped)
const rAliceFresh = await post('/auth/login', { email: 'alice@medcord.test', password: PW });
const aliceFinal = rAliceFresh.data.data.tokens.accessToken;

// Re-read staff to get all current member IDs + tokens
const rAllStaff = await hget(HSP_A, '/staff', aliceFinal);
const allMembers = rAllStaff.data?.data?.items ?? [];
console.log(`\n  Total staff in Hospital A: ${allMembers.length}`);

const memberByEmail = {};
for (const m of allMembers) memberByEmail[m.email] = m;

// Build token map for key roles
async function getToken(email) {
  const r = await post('/auth/login', { email, password: PW });
  return r.status === 200 ? r.data.data.tokens.accessToken : null;
}

const carolTok   = await getToken('carol@medcord.test');
const bobTok     = await getToken('bob@medcord.test');
const daveTok    = await getToken('dave@medcord.test');
const frankTok   = await getToken('frank@medcord.test');
const qaDocTok   = await getToken('qa-doctor@medcord.test');

const carolId    = memberByEmail['carol@medcord.test']?.id;
const daveId     = memberByEmail['dave@medcord.test']?.id;
const qaDocId    = memberByEmail['qa-doctor@medcord.test']?.id;
const qaNurseId  = memberByEmail['qa-nurse@medcord.test']?.id;
const pheroId    = memberByEmail['phero@medcord.test']?.id;

console.log(`  carolId=${carolId}, daveId=${daveId}, qaDocId=${qaDocId}, qaNurseId=${qaNurseId}`);

// ── Step 4: Custom roles ───────────────────────────────────────────────────────

console.log('\n── Step 4: Custom roles ─────────────────────────────────────');

// Check existing custom roles
const rRoles = await hget(HSP_A, '/roles', aliceFinal);
const existingRoles = (rRoles.data?.data?.roles ?? []).filter(r => !r.isSystem);
const existingRoleSlugs = existingRoles.map(r => r.slug);
console.log(`  Existing custom roles: ${existingRoleSlugs.join(', ') || 'none'}`);

async function ensureCustomRole(name, permissions) {
  const slug = name.toLowerCase().replace(/[\s-]+/g, '_');
  const existing = existingRoles.find(r => r.name === name || r.slug === slug);
  if (existing) {
    console.log(`  ✓ Custom role "${name}" already exists`);
    return existing.id;
  }
  const r = await hpost(HSP_A, '/roles', { name, slug, permissions }, bobTok);
  if (r.status === 201) {
    console.log(`  ✓ Created custom role "${name}"`);
    return r.data.data.role?.id;
  }
  console.error(`  ✗ Create role "${name}": ${r.status} ${JSON.stringify(r.data)?.slice(0,100)}`);
  return null;
}

await ensureCustomRole('Cleaner Updated', ['patient.view', 'staff.view', 'assets.view']);
await ensureCustomRole('QA Test Role',    ['staff.view', 'staff.invite']);
await ensureCustomRole('Phlebotomist',    ['patient.view', 'labs.view', 'labs.create']);

// ── Step 5: Hospital units ─────────────────────────────────────────────────────

console.log('\n── Step 5: Hospital units ───────────────────────────────────');

const rUnits = await hget(HSP_A, '/units', aliceFinal);
const existingUnits = rUnits.data?.data?.units ?? [];
console.log(`  Existing units: ${existingUnits.length}`);

const unitMap = {};
for (const u of existingUnits) unitMap[u.name] = u.id;

async function ensureUnit(name, type, parentId = undefined) {
  if (unitMap[name]) {
    console.log(`  ✓ Unit "${name}" exists`);
    return unitMap[name];
  }
  const body = { name, type };
  if (parentId) body.parentId = parentId;
  const r = await hpost(HSP_A, '/units', body, bobTok);
  if (r.status === 201) {
    const id = r.data.data.unit?.id;
    unitMap[name] = id;
    console.log(`  ✓ Created unit "${name}" (${type})`);
    return id;
  }
  console.error(`  ✗ Create unit "${name}": ${r.status} ${JSON.stringify(r.data)?.slice(0,100)}`);
  return null;
}

// Top-level departments
const cardiologyId  = await ensureUnit('Cardiology',  'department');
const emergencyId   = await ensureUnit('Emergency',   'department');
const pediatricsId  = await ensureUnit('Pediatrics',  'department');
const gynecologyId  = await ensureUnit('Gynecology',  'department');
const neurologyId   = await ensureUnit('Neurology',   'department');

// Wards
const wardAId = await ensureUnit('Ward A', 'ward');
const wardBId = await ensureUnit('Ward B', 'ward');
const icuId   = await ensureUnit('ICU',    'ward');
const nicuId  = await ensureUnit('NICU',   'ward');

// Sub-units (children)
if (cardiologyId) await ensureUnit('Cardiology Clinic', 'unit', cardiologyId);
if (emergencyId)  await ensureUnit('Trauma Bay',        'unit', emergencyId);
if (pediatricsId) await ensureUnit('Paediatric OPD',    'unit', pediatricsId);

console.log(`  Units created: ${Object.keys(unitMap).length}`);

// ── Step 6: Patients for Hospital A ───────────────────────────────────────────

console.log('\n── Step 6: Patients ─────────────────────────────────────────');

const PATIENT_DATA = [
  ['Kofi',     'Mensah',    '1985-03-12', 'male'],
  ['Ama',      'Asante',    '1992-07-04', 'female'],
  ['Kwame',    'Boateng',   '1978-11-20', 'male'],
  ['Abena',    'Owusu',     '2001-01-15', 'female'],
  ['Yaw',      'Darko',     '1965-09-08', 'male'],
  ['Akosua',   'Frimpong',  '1988-05-30', 'female'],
  ['Kweku',    'Adu',       '1995-12-03', 'male'],
  ['Adwoa',    'Ofori',     '1972-08-17', 'female'],
  ['Fiifi',    'Quaye',     '2003-02-28', 'male'],
  ['Esi',      'Amoah',     '1990-06-11', 'female'],
  ['Kojo',     'Tetteh',    '1983-04-25', 'male'],
  ['Afia',     'Benson',    '1998-10-07', 'female'],
  ['Nana',     'Ankomah',   '1960-01-30', 'male'],
  ['Efua',     'Kumi',      '2005-03-19', 'female'],
  ['Kwesi',    'Larbi',     '1975-07-22', 'male'],
  ['Maame',    'Sarpong',   '1987-11-14', 'female'],
  ['Appiah',   'Nyarko',    '1993-09-01', 'male'],
  ['Adjoa',    'Asiedu',    '2000-04-16', 'female'],
  ['Kofi',     'Opoku',     '1969-12-08', 'male'],
  ['Akua',     'Yeboah',    '1996-06-27', 'female'],
  ['Kwabena',  'Poku',      '1980-08-03', 'male'],
  ['Afua',     'Bonsu',     '1991-02-09', 'female'],
  ['Yaa',      'Kyei',      '2002-10-31', 'female'],
  ['Kwadwo',   'Ansah',     '1974-05-05', 'male'],
  ['Aba',      'Baidoo',    '1989-03-23', 'female'],
  ['Ekow',     'Mensah',    '1967-08-14', 'male'],
  ['Mabel',    'Osei',      '1994-01-09', 'female'],
  ['Nii',      'Laryea',    '1958-12-25', 'male'],
  ['Adzo',     'Kpodo',     '1997-07-16', 'female'],
  ['Dela',     'Dzakpasu',  '1982-04-03', 'male'],
];

const DEPARTMENTS_LIST = ['General OPD', 'Cardiology', 'Emergency', 'Pediatrics', 'Neurology', 'Orthopedics', 'Gynecology'];
const NOTES_LIST = [
  'Chest pain and shortness of breath on exertion',
  'Routine follow-up for hypertension management',
  'High fever (39.5°C), headache, fatigue for 3 days',
  'Post-operative check — appendectomy 2 weeks ago',
  'Diabetic review — blood sugar consistently elevated',
  'Knee pain and limited mobility after sports injury',
  'Rash and itching on both arms, possible allergic reaction',
  'Abdominal pain upper right quadrant, nausea, loss of appetite',
  'Ear infection, irritability, referred by community clinic',
  'Migraine with visual aura, recurrent for 6 months',
  'BP 160/100, dizziness, referred by GP for evaluation',
  'Prenatal check — 28 weeks gestation, routine scan',
  'Wound care follow-up — laceration on left forearm healing well',
  'Severe lower back pain following lifting injury at work',
  'Cough persisting 3 weeks, weight loss, night sweats',
];

// Fetch existing patients to avoid duplicates
const rExistingPats = await hget(HSP_A, '/patients', aliceFinal);
const existingPats = rExistingPats.data?.data?.items ?? [];
console.log(`  Existing patients: ${existingPats.length}`);

const patientIds = existingPats.map(p => p.id);

// Register only as many as needed to reach 30 total
const needed = Math.max(0, 30 - patientIds.length);
console.log(`  Need to create: ${needed} more patients`);

for (let i = 0; i < needed && i < PATIENT_DATA.length; i++) {
  const [firstName, lastName, dateOfBirth, sex] = PATIENT_DATA[i];
  const r = await hpost(HSP_A, '/patients', {
    demographics: { firstName, lastName, dateOfBirth, sex },
  }, aliceFinal);
  if (r.status === 201) {
    patientIds.push(r.data.data.patient.id);
    process.stdout.write('.');
  } else {
    console.error(`\n  ✗ Create patient ${firstName} ${lastName}: ${r.status}`);
  }
}
console.log(`\n  Total patients: ${patientIds.length}`);

// ── Step 7: Active visits across all stages ────────────────────────────────────

console.log('\n── Step 7: Visit queue (active visits) ──────────────────────');

// Use carol (doctor) as the check-in actor — has PATIENT_ADMIT
const CHECK_IN_TOK = carolTok ?? qaDocTok ?? aliceFinal;

// Helper: fetch the visit for a patient from GET /visits
async function getVisitForPatient(patientId) {
  const r = await hget(HSP_A, '/visits', CHECK_IN_TOK);
  return (r.data?.data?.visits ?? []).find(v => v.patientId === patientId) ?? null;
}

async function checkin(patientId, opts = {}) {
  const body = {};
  if (opts.nurseId)     body.assignedNurseId  = opts.nurseId;
  if (opts.doctorId)    body.assignedDoctorId = opts.doctorId;
  if (opts.department)  body.department       = opts.department;
  if (opts.notes)       body.notes            = opts.notes;
  const r = await hpost(HSP_A, `/patients/${patientId}/checkin`, body, CHECK_IN_TOK);
  if (r.status !== 200) { console.error(`  checkin failed ${patientId}: ${r.status}`); return null; }
  return getVisitForPatient(patientId);
}

async function advance(visitId, stage) {
  const r = await hpatch(HSP_A, `/visits/${visitId}`, { stage }, CHECK_IN_TOK);
  return r.status === 200;
}

async function checkoutVisit(visitId) {
  const r = await hpost(HSP_A, `/visits/${visitId}/checkout`, {}, CHECK_IN_TOK);
  return r.status === 200;
}

// Check how many active visits already exist
const rActiveNow = await hget(HSP_A, '/visits', CHECK_IN_TOK);
const activeNow = rActiveNow.data?.data?.visits ?? [];
console.log(`  Active visits already in queue: ${activeNow.length}`);

// Only seed visits if queue is sparse
if (activeNow.length < 10 && patientIds.length >= 25) {
  // Identify patients not already in the queue
  const activePatientIds = new Set(activeNow.map(v => v.patientId));
  const freePats = patientIds.filter(id => !activePatientIds.has(id));

  let idx = 0;
  const nurseIds  = [daveId, qaNurseId].filter(Boolean);
  const doctorIds = [carolId, qaDocId, pheroId].filter(Boolean);

  // waiting_nurse — 5 patients
  console.log('  Creating waiting_nurse visits...');
  for (let i = 0; i < 5 && idx < freePats.length; i++, idx++) {
    const v = await checkin(freePats[idx], {
      nurseId: pickRandom(nurseIds) ?? undefined,
      department: pickRandom(DEPARTMENTS_LIST),
      notes: pickRandom(NOTES_LIST),
    });
    if (v) console.log(`    q:${v.queueNumber} waiting_nurse`);
  }

  // with_nurse — 4 patients
  console.log('  Creating with_nurse visits...');
  for (let i = 0; i < 4 && idx < freePats.length; i++, idx++) {
    const v = await checkin(freePats[idx], {
      nurseId: pickRandom(nurseIds) ?? undefined,
      doctorId: pickRandom(doctorIds) ?? undefined,
      department: pickRandom(DEPARTMENTS_LIST),
      notes: pickRandom(NOTES_LIST),
    });
    if (v) { await advance(v.id, 'with_nurse'); console.log(`    q:${v.queueNumber} with_nurse`); }
  }

  // waiting_doctor (via nurse) — 4 patients
  console.log('  Creating waiting_doctor visits (via nurse)...');
  for (let i = 0; i < 4 && idx < freePats.length; i++, idx++) {
    const v = await checkin(freePats[idx], {
      nurseId: pickRandom(nurseIds) ?? undefined,
      doctorId: pickRandom(doctorIds) ?? undefined,
      department: pickRandom(DEPARTMENTS_LIST),
      notes: pickRandom(NOTES_LIST),
    });
    if (v) {
      await advance(v.id, 'with_nurse');
      await advance(v.id, 'waiting_doctor');
      console.log(`    q:${v.queueNumber} waiting_doctor`);
    }
  }

  // waiting_doctor (direct — no nurse) — 3 patients
  console.log('  Creating waiting_doctor visits (direct)...');
  for (let i = 0; i < 3 && idx < freePats.length; i++, idx++) {
    const v = await checkin(freePats[idx], {
      doctorId: pickRandom(doctorIds) ?? undefined,
      department: pickRandom(DEPARTMENTS_LIST),
      notes: pickRandom(NOTES_LIST),
    });
    if (v) console.log(`    q:${v.queueNumber} waiting_doctor (direct)`);
  }

  // with_doctor — 3 patients
  console.log('  Creating with_doctor visits...');
  for (let i = 0; i < 3 && idx < freePats.length; i++, idx++) {
    const v = await checkin(freePats[idx], {
      nurseId: pickRandom(nurseIds) ?? undefined,
      doctorId: pickRandom(doctorIds) ?? undefined,
      department: pickRandom(DEPARTMENTS_LIST),
      notes: pickRandom(NOTES_LIST),
    });
    if (v) {
      await advance(v.id, 'with_nurse');
      await advance(v.id, 'waiting_doctor');
      await advance(v.id, 'with_doctor');
      console.log(`    q:${v.queueNumber} with_doctor`);
    }
  }

  // done (not checked out) — 2 patients
  console.log('  Creating done visits (not checked out)...');
  for (let i = 0; i < 2 && idx < freePats.length; i++, idx++) {
    const v = await checkin(freePats[idx], {
      doctorId: pickRandom(doctorIds) ?? undefined,
      department: pickRandom(DEPARTMENTS_LIST),
      notes: pickRandom(NOTES_LIST),
    });
    if (v) {
      await advance(v.id, 'with_doctor');
      await advance(v.id, 'done');
      console.log(`    q:${v.queueNumber} done`);
    }
  }

  // Historical checkouts — 5 patients
  console.log('  Creating historical checked-out visits...');
  for (let i = 0; i < 5 && idx < freePats.length; i++, idx++) {
    const v = await checkin(freePats[idx], {
      doctorId: pickRandom(doctorIds) ?? undefined,
      department: pickRandom(DEPARTMENTS_LIST),
      notes: pickRandom(NOTES_LIST),
    });
    if (v) {
      await advance(v.id, 'with_doctor');
      await advance(v.id, 'done');
      const co = await checkoutVisit(v.id);
      console.log(`    q:${v.queueNumber} checked-out: ${co}`);
    }
  }
} else {
  console.log('  Queue already has enough visits — skipping visit creation.');
}

// ── Step 8: Hospital B — grace + staff + patients ──────────────────────────────

console.log('\n── Step 8: Hospital B setup ─────────────────────────────────');

// Check grace's membership
const rGraceStaff = await hget(HSP_B, '/staff', graceTok);
const graceStaff  = rGraceStaff.data?.data?.items ?? [];
console.log(`  Hospital B staff: ${graceStaff.length}`);

// Add frank to Hospital B as lab_tech (for cross-hospital tests)
const frankInB = graceStaff.find(m => m.email === 'frank@medcord.test');
if (!frankInB) {
  const frankMid = await insertMemberViaDB('frank@medcord.test', 'lab_tech', HSP_B);
  console.log(`  ✓ Frank added to Hospital B → ${frankMid}`);
} else {
  console.log('  ✓ Frank already in Hospital B');
}

// Patients for Hospital B
const rHBPats = await hget(HSP_B, '/patients', graceTok);
const hbPats  = rHBPats.data?.data?.items ?? [];
console.log(`  Hospital B existing patients: ${hbPats.length}`);

const HB_PATIENTS = [
  ['John',   'Doe',    '1990-01-01', 'male'],
  ['Jane',   'Smith',  '1985-06-15', 'female'],
  ['Kwame',  'Oti',    '1972-03-22', 'male'],
  ['Ama',    'Saka',   '1998-09-10', 'female'],
  ['Yaw',    'Ankrah', '1965-12-05', 'male'],
];

const neededHB = Math.max(0, 5 - hbPats.length);
for (let i = 0; i < neededHB && i < HB_PATIENTS.length; i++) {
  const [firstName, lastName, dateOfBirth, sex] = HB_PATIENTS[i];
  const r = await hpost(HSP_B, '/patients', {
    demographics: { firstName, lastName, dateOfBirth, sex },
  }, graceTok);
  if (r.status === 201) process.stdout.write('.');
}
if (neededHB > 0) console.log(`\n  Hospital B patients created: ${neededHB}`);

// ── Final summary ─────────────────────────────────────────────────────────────

console.log('\n── Final state ──────────────────────────────────────────────');

const rFinalVisits = await hget(HSP_A, '/visits', CHECK_IN_TOK);
const finalActive  = rFinalVisits.data?.data?.visits ?? [];
const byStage = {};
for (const v of finalActive) byStage[v.stage] = (byStage[v.stage] ?? 0) + 1;

const rFinalPats   = await hget(HSP_A, '/patients', aliceFinal);
const rFinalStaff  = await hget(HSP_A, '/staff',    aliceFinal);
const rFinalRoles  = await hget(HSP_A, '/roles',    aliceFinal);
const rFinalUnits  = await hget(HSP_A, '/units',    aliceFinal);

console.log(`\n  Hospital A: ${HSP_A}`);
console.log(`  Hospital B: ${HSP_B}`);
console.log(`\n  Staff:      ${rFinalStaff.data?.data?.items?.length ?? '?'}`);
console.log(`  Patients:   ${rFinalPats.data?.data?.items?.length ?? '?'}`);
console.log(`  Roles:      ${rFinalRoles.data?.data?.roles?.length ?? '?'} (system + custom)`);
console.log(`  Units:      ${rFinalUnits.data?.data?.units?.length ?? '?'}`);
console.log(`  Active visits: ${finalActive.length}`);
for (const [stage, count] of Object.entries(byStage)) {
  console.log(`    ${stage}: ${count}`);
}

console.log('\n  Key accounts:');
console.log(`    alice@medcord.test    → super_admin  (Hospital A owner)`);
console.log(`    bob@medcord.test      → hospital_admin`);
console.log(`    carol@medcord.test    → doctor`);
console.log(`    dave@medcord.test     → nurse`);
console.log(`    eve@medcord.test      → reception`);
console.log(`    frank@medcord.test    → lab_tech`);
console.log(`    qa-doctor@medcord.test  → doctor`);
console.log(`    qa-nurse@medcord.test   → nurse`);
console.log(`    qa-lab-tech@medcord.test → lab_tech`);
console.log(`    qa-reception@medcord.test → reception`);
console.log(`    phero@medcord.test      → doctor`);
console.log(`    grace@medcord.test    → super_admin  (Hospital B owner)`);
console.log(`    All passwords: ${PW}`);

console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║              Seed complete. Refresh the UI.              ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');
