/**
 * seed.mjs — LEGACY full-wipe seed. DO NOT RUN in a shared or live environment.
 *
 * ⚠️  WARNING: THIS SCRIPT DROPS EVERY COLLECTION IN THE DATABASE. ⚠️
 *     Running it will permanently delete all users, hospitals, staff,
 *     patients, visits, roles, and all other data.
 *
 *     Use restore-seed.mjs instead — it is idempotent and safe to run
 *     at any time without losing existing data.
 *
 *     node docs/qas/backend/scripts/restore-seed.mjs
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * What this legacy script does (in order):
 *   1. Connect to MongoDB and DROP ALL relevant collections (DESTRUCTIVE)
 *   2. Register alice and grace via POST /auth/register
 *   3. Alice creates Hospital A; grace creates Hospital B
 *   4. Re-login alice and grace to get hospital-scoped tokens
 *   5. Alice invites bob, carol, dave, eve, frank to Hospital A
 *   6. Each invited user accepts their invitation (creates account + joins hospital)
 *   7. Register 3 patients in Hospital A (as alice)
 *   8. Fetch each member's memberId from the staff list
 *   9. Write .state.json with all tokens, IDs, memberIds, patientIds
 *
 * Usage: node seed.mjs   ← DO NOT RUN unless you intend to wipe the DB
 */

import { writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

import { connect, disconnect } from './db.mjs';
import { post, get } from './api.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_FILE = join(__dirname, '.state.json');

// ── Fixtures ─────────────────────────────────────────────────────────────────

// Hospital owners — registered directly
const OWNERS = [
  { handle: 'alice', email: 'alice@medcord.test', name: 'Alice Mensah', password: 'Medcord123!' },
  { handle: 'grace', email: 'grace@medcord.test', name: 'Grace Owusu',  password: 'Medcord123!' },
];

// Staff — created via invitation accept flow (NOT pre-registered)
const INVITED_STAFF = [
  { handle: 'bob',   email: 'bob@medcord.test',   name: 'Bob Asante',  password: 'Medcord123!', role: 'hospital_admin' },
  { handle: 'carol', email: 'carol@medcord.test', name: 'Carol Osei',  password: 'Medcord123!', role: 'doctor' },
  { handle: 'dave',  email: 'dave@medcord.test',  name: 'Dave Mensah', password: 'Medcord123!', role: 'nurse' },
  { handle: 'eve',   email: 'eve@medcord.test',   name: 'Eve Darko',   password: 'Medcord123!', role: 'reception' },
  { handle: 'frank', email: 'frank@medcord.test', name: 'Frank Adu',   password: 'Medcord123!', role: 'lab_tech' },
];

const PATIENTS = [
  { firstName: 'John', lastName: 'Doe',    dateOfBirth: '1990-03-15', sex: 'male' },
  { firstName: 'Jane', lastName: 'Smith',  dateOfBirth: '1985-07-22', sex: 'female' },
  { firstName: 'John', lastName: 'Marcus', dateOfBirth: '1978-11-05', sex: 'male' },
];

// All collections to drop before seeding
const COLLECTIONS = [
  'users',
  'hospitals',
  'hospital_members',
  'hospital_patients',
  'hospital_units',
  'patients',
  'invitations',
  'custom_roles',
  'assets',
  'lab_orders',
  'emr_charts',
  'vitals',
  'medications',
  'medical_histories',
  'procedures',
  'immunizations',
  'chart_documents',
  'chart_access_logs',
  'transfers',
  'checkin_visits',
  'daily_queue_counters',
  'reviewitems',
  'audit_logs',
  'notifications',
  'patient_recent_access',
  'patient_favorites',
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function fail(step, res) {
  console.error(`\n[SEED FAILED] ${step}`);
  console.error(`  HTTP ${res.status}`);
  console.error('  Body:', JSON.stringify(res.data, null, 2));
  process.exit(1);
}

// ── Main ─────────────────────────────────────────────────────────────────────

// ── Safety guard — must pass --wipe flag to run ───────────────────────────────
if (!process.argv.includes('--wipe')) {
  console.error('\n⚠️  ABORTED: seed.mjs is a DESTRUCTIVE full-wipe script.');
  console.error('   It drops all collections before re-seeding.');
  console.error('');
  console.error('   If you want to restore missing data safely, run instead:');
  console.error('     node restore-seed.mjs');
  console.error('');
  console.error('   If you REALLY want to wipe everything and start fresh:');
  console.error('     node seed.mjs --wipe');
  console.error('');
  process.exit(1);
}

console.log('=== Medcord QA Seed (FULL WIPE MODE) ===\n');
console.log('WARNING: All collections will be dropped. Starting in 3 seconds...\n');
await new Promise(r => setTimeout(r, 3000));

// Step 1: Connect and drop collections
console.log('Step 1: Connecting to MongoDB and dropping collections...');
const mongoose = await connect();
const db = mongoose.connection.db;

for (const name of COLLECTIONS) {
  try {
    await db.collection(name).drop();
    process.stdout.write('  dropped: ' + name + '\n');
  } catch (err) {
    if (!err.message?.toLowerCase().includes('ns not found')) {
      console.warn(`  warn: could not drop "${name}": ${err.message}`);
    }
  }
}
console.log('  Collections cleared.\n');

// Step 2: Register hospital owners (alice, grace)
console.log('Step 2: Registering hospital owners...');
const users = {};

for (const u of OWNERS) {
  const res = await post('/auth/register', {
    email: u.email,
    name: u.name,
    password: u.password,
  });

  if (res.status !== 201) fail(`Register ${u.handle}`, res);

  const d = res.data.data;
  users[u.handle] = {
    id: d.user.id,
    email: u.email,
    accessToken: d.tokens.accessToken,
    refreshToken: d.tokens.refreshToken,
  };
  console.log(`  Registered ${u.handle} (id=${users[u.handle].id})`);
}
console.log();

// Step 3: Create hospitals
console.log('Step 3: Creating hospitals...');
const resHospA = await post(
  '/hospitals',
  { name: 'Hospital A', type: 'general', location: 'Accra, Ghana', subdomain: 'hospital-a' },
  users.alice.accessToken,
);
if (resHospA.status !== 201) fail('Create Hospital A', resHospA);
const hospitalAId = resHospA.data.data.hospital.id;
console.log(`  Hospital A created (id=${hospitalAId})`);

const resHospB = await post(
  '/hospitals',
  { name: 'Hospital B', type: 'general', location: 'Kumasi, Ghana', subdomain: 'hospital-b' },
  users.grace.accessToken,
);
if (resHospB.status !== 201) fail('Create Hospital B', resHospB);
const hospitalBId = resHospB.data.data.hospital.id;
console.log(`  Hospital B created (id=${hospitalBId})\n`);

// Step 4: Re-login alice and grace to get hospital-scoped tokens
console.log('Step 4: Re-logging in alice and grace to get hospital-scoped tokens...');
const aliceLogin = await post('/auth/login', { email: 'alice@medcord.test', password: 'Medcord123!' });
if (aliceLogin.status !== 200) fail('Re-login alice', aliceLogin);
users.alice.accessToken = aliceLogin.data.data.tokens.accessToken;
users.alice.refreshToken = aliceLogin.data.data.tokens.refreshToken;
console.log('  alice re-logged in');

const graceLogin = await post('/auth/login', { email: 'grace@medcord.test', password: 'Medcord123!' });
if (graceLogin.status !== 200) fail('Re-login grace', graceLogin);
users.grace.accessToken = graceLogin.data.data.tokens.accessToken;
users.grace.refreshToken = graceLogin.data.data.tokens.refreshToken;
console.log('  grace re-logged in\n');

// Step 5: Alice invites staff to Hospital A
console.log('Step 5: Sending invitations...');
const invitationTokens = {};

for (const staff of INVITED_STAFF) {
  const res = await post(
    `/hospitals/${hospitalAId}/invitations`,
    { email: staff.email, role: staff.role },
    users.alice.accessToken,
  );
  if (res.status !== 201) fail(`Invite ${staff.handle}`, res);
  invitationTokens[staff.handle] = res.data.data.invitation.token;
  console.log(`  Invited ${staff.handle} as ${staff.role} (token=${invitationTokens[staff.handle]})`);
}
console.log();

// Step 6: Each invited user accepts their invitation (creates account)
console.log('Step 6: Accepting invitations...');
for (const staff of INVITED_STAFF) {
  const invToken = invitationTokens[staff.handle];
  const res = await post(
    `/invitations/${invToken}/accept`,
    { name: staff.name, password: staff.password },
  );
  if (res.status !== 200) fail(`Accept invitation for ${staff.handle}`, res);
  const d = res.data.data;
  users[staff.handle] = {
    email: staff.email,
    accessToken: d.accessToken,
    refreshToken: d.refreshToken,
  };
  console.log(`  ${staff.handle} accepted invitation (hospitalId=${d.hospitalId})`);
}
console.log();

// Step 7: Register 3 patients in Hospital A (as alice)
console.log('Step 7: Registering patients...');
const patientIds = [];

for (const p of PATIENTS) {
  const res = await post(
    `/hospitals/${hospitalAId}/patients`,
    {
      demographics: {
        firstName: p.firstName,
        lastName: p.lastName,
        dateOfBirth: p.dateOfBirth,
        sex: p.sex,
      },
    },
    users.alice.accessToken,
  );
  if (res.status !== 201) fail(`Register patient ${p.firstName} ${p.lastName}`, res);
  const patientId = res.data.data.patient.id;
  patientIds.push(patientId);
  console.log(`  Registered patient ${p.firstName} ${p.lastName} (id=${patientId})`);
}
console.log();

// Step 8: Fetch memberId for each invited staff member
console.log('Step 8: Fetching staff member IDs...');
const staffRes = await get(`/hospitals/${hospitalAId}/staff`, users.alice.accessToken);
if (staffRes.status !== 200) fail('List staff', staffRes);

const staffItems = staffRes.data.data?.items ?? [];
const members = {};

// Also get alice's memberId
for (const handle of ['alice', ...INVITED_STAFF.map(s => s.handle)]) {
  // alice's userId is known; invited staff userId comes from token payload
  // Use email to match
  const email = handle === 'alice' ? 'alice@medcord.test' : INVITED_STAFF.find(s => s.handle === handle).email;
  const entry = staffItems.find((m) => m.email === email || m.user?.email === email || m.userId === users[handle]?.id);
  if (!entry) {
    // Try by role if email not on record
    console.warn(`  Could not find memberId for ${handle} by email, trying by index`);
    console.error('  Staff list:', JSON.stringify(staffItems.slice(0, 3), null, 2));
  } else {
    members[handle] = entry.id;
    console.log(`  ${handle} → memberId=${entry.id}`);
  }
}
console.log();

// Step 9: Write state file
console.log('Step 9: Writing state file...');
const state = {
  users,
  hospitalA: { id: hospitalAId },
  hospitalB: { id: hospitalBId },
  members,
  patients: patientIds,
};

await writeFile(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
console.log(`  State written to ${STATE_FILE}\n`);

await disconnect();

console.log('=== Seed complete ===');
console.log(`  Users:     ${Object.keys(users).length}`);
console.log(`  Hospitals: 2 (A=${hospitalAId}, B=${hospitalBId})`);
console.log(`  Members:   ${Object.keys(members).length}`);
console.log(`  Patients:  ${patientIds.length}`);
