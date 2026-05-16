/**
 * seed.mjs — Seed script for QA test environment.
 *
 * What it does (in order):
 *   1. Connect to MongoDB and drop all relevant collections
 *   2. Register 7 users (alice … grace) via POST /auth/register
 *   3. Create Hospital A (alice) and Hospital B (grace)
 *   4. Alice invites bob, carol, dave, eve, frank to Hospital A
 *   5. Each invited user accepts their invitation
 *   6. Register 3 patients in Hospital A (as alice)
 *   7. Fetch each member's memberId from the staff list
 *   8. Write .state.json with all tokens, IDs, memberIds, patientIds
 *
 * Usage: node seed.mjs
 */

import { writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

import { connect, disconnect } from './db.mjs';
import { post, get } from './api.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_FILE = join(__dirname, '.state.json');

// ── Fixtures ─────────────────────────────────────────────────────────────────

const USERS = [
  { handle: 'alice', email: 'alice@medcord.test', name: 'Alice Mensah', password: 'Medcord123!' },
  { handle: 'bob',   email: 'bob@medcord.test',   name: 'Bob Asante',   password: 'Medcord123!' },
  { handle: 'carol', email: 'carol@medcord.test', name: 'Carol Osei',   password: 'Medcord123!' },
  { handle: 'dave',  email: 'dave@medcord.test',  name: 'Dave Mensah',  password: 'Medcord123!' },
  { handle: 'eve',   email: 'eve@medcord.test',   name: 'Eve Darko',    password: 'Medcord123!' },
  { handle: 'frank', email: 'frank@medcord.test', name: 'Frank Adu',    password: 'Medcord123!' },
  { handle: 'grace', email: 'grace@medcord.test', name: 'Grace Owusu',  password: 'Medcord123!' },
];

const PATIENTS = [
  { firstName: 'John', lastName: 'Doe',    dateOfBirth: '1990-03-15', sex: 'male' },
  { firstName: 'Jane', lastName: 'Smith',  dateOfBirth: '1985-07-22', sex: 'female' },
  { firstName: 'John', lastName: 'Marcus', dateOfBirth: '1978-11-05', sex: 'male' },
];

// role each non-owner user is invited as
const INVITE_ROLES = {
  bob:   'hospital_admin',
  carol: 'doctor',
  dave:  'nurse',
  eve:   'reception',
  frank: 'lab_tech',
};

// All collections to drop before seeding
const COLLECTIONS = [
  'users',
  'hospitals',
  'hospital_members',
  'hospital_patients',
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

console.log('=== Medcord QA Seed ===\n');

// Step 1: Connect and drop collections
console.log('Step 1: Connecting to MongoDB and dropping collections...');
const mongoose = await connect();
const db = mongoose.connection.db;

for (const name of COLLECTIONS) {
  try {
    await db.collection(name).drop();
    process.stdout.write('  dropped: ' + name + '\n');
  } catch (err) {
    // Collection might not exist yet; that's fine
    if (err.codeName !== 'NamespaceNotFound' && err.message?.includes('ns not found') === false) {
      // Only suppress "namespace not found" errors
      if (!err.message?.toLowerCase().includes('ns not found')) {
        console.warn(`  warn: could not drop "${name}": ${err.message}`);
      }
    }
  }
}
console.log('  Collections cleared.\n');

// Step 2: Register users
console.log('Step 2: Registering users...');
const users = {};

for (const u of USERS) {
  const res = await post('/auth/register', {
    email: u.email,
    name: u.name,
    password: u.password,
  });

  if (res.status !== 201) fail(`Register ${u.handle}`, res);

  const d = res.data.data;
  users[u.handle] = {
    id: d.user.id,
    accessToken: d.tokens.accessToken,
    refreshToken: d.tokens.refreshToken,
  };
  console.log(`  Registered ${u.handle} (id=${users[u.handle].id})`);
}
console.log();

// Step 3a: Create Hospital A (alice)
console.log('Step 3: Creating hospitals...');
const resHospA = await post(
  '/hospitals',
  {
    name: 'Hospital A',
    type: 'general',
    location: 'Accra, Ghana',
    subdomain: 'hospital-a',
  },
  users.alice.accessToken,
);
if (resHospA.status !== 201) fail('Create Hospital A', resHospA);
const hospitalAId = resHospA.data.data.hospital.id;
console.log(`  Hospital A created (id=${hospitalAId})`);

// Step 3b: Create Hospital B (grace)
const resHospB = await post(
  '/hospitals',
  {
    name: 'Hospital B',
    type: 'general',
    location: 'Kumasi, Ghana',
    subdomain: 'hospital-b',
  },
  users.grace.accessToken,
);
if (resHospB.status !== 201) fail('Create Hospital B', resHospB);
const hospitalBId = resHospB.data.data.hospital.id;
console.log(`  Hospital B created (id=${hospitalBId})\n`);

// Step 4: Alice invites bob, carol, dave, eve, frank to Hospital A
console.log('Step 4: Sending invitations...');
const invitationTokens = {}; // handle -> raw invitation token string

for (const [handle, role] of Object.entries(INVITE_ROLES)) {
  const email = USERS.find((u) => u.handle === handle).email;
  const res = await post(
    `/hospitals/${hospitalAId}/invitations`,
    { email, role },
    users.alice.accessToken,
  );
  if (res.status !== 201) fail(`Invite ${handle}`, res);
  invitationTokens[handle] = res.data.data.invitation.token;
  console.log(`  Invited ${handle} as ${role} (token=${invitationTokens[handle]})`);
}
console.log();

// Step 5: Each invited user accepts their invitation
// Endpoint: POST /api/v1/invitations/:token/accept  (token is a URL param, not body)
console.log('Step 5: Accepting invitations...');
for (const handle of Object.keys(INVITE_ROLES)) {
  const invToken = invitationTokens[handle];
  const res = await post(
    `/invitations/${invToken}/accept`,
    undefined,
    users[handle].accessToken,
  );
  if (res.status !== 200) fail(`Accept invitation for ${handle}`, res);
  console.log(`  ${handle} accepted invitation`);
}
console.log();

// Step 6: Register 3 patients in Hospital A (as alice)
console.log('Step 6: Registering patients...');
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

// Step 7: Fetch memberId for each invited staff member
console.log('Step 7: Fetching staff member IDs...');
const staffRes = await get(`/hospitals/${hospitalAId}/staff`, users.alice.accessToken);
if (staffRes.status !== 200) fail('List staff', staffRes);

const staffItems = staffRes.data.data?.items ?? [];
const members = {};

for (const handle of Object.keys(INVITE_ROLES)) {
  const userId = users[handle].id;
  const entry = staffItems.find((m) => m.userId === userId);
  if (!entry) {
    console.error(`  Could not find memberId for ${handle} (userId=${userId})`);
    console.error('  Staff list:', JSON.stringify(staffItems, null, 2));
    process.exit(1);
  }
  members[handle] = entry.id;
  console.log(`  ${handle} → memberId=${entry.id}`);
}
console.log();

// Step 8: Write state file
console.log('Step 8: Writing state file...');
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
console.log(`  Users:    ${Object.keys(users).length}`);
console.log(`  Hospitals: 2 (A=${hospitalAId}, B=${hospitalBId})`);
console.log(`  Members:  ${Object.keys(members).length}`);
console.log(`  Patients: ${patientIds.length}`);
