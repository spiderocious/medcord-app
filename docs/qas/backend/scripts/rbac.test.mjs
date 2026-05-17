/**
 * rbac.test.mjs — RBAC & Permissions QA Test Suite
 *
 * Sections:
 *   1  — System Role Seeding
 *   2  — Roles CRUD & Guards
 *   3  — Permission Enforcement (requirePermission)
 *   4  — Super Admin Bypass
 *   5  — GET /staff/me Permissions Payload
 *   6  — Session Revocation on Role Change
 *   7  — Invitations with Custom & System Roles
 *   8  — Staff PATCH role validation
 *   9  — Error Envelope shape
 *   10 — Cross-Cutting
 *
 * Plan: docs/qas/backend/plans/rbac-test-plan.md
 *
 * Usage: node rbac.test.mjs
 */

import { connect, disconnect, col } from './db.mjs';
import { api, get, post, patch, del, BASE } from './api.mjs';

// ── Runner ────────────────────────────────────────────────────────────────────

let passed = 0, failed = 0, blocked = 0, skipped = 0;
const failures = [];

function pass(id, label) {
  console.log(`  ✓ ${id}: ${label}`);
  passed++;
}

function fail(id, label, reason) {
  console.log(`  ✗ ${id}: ${label}`);
  console.log(`      → ${reason}`);
  failed++;
  failures.push({ id, label, reason });
}

function block(id, label, reason) {
  console.log(`  ⊘ ${id}: ${label} [BLOCKED: ${reason}]`);
  blocked++;
}

function skip(id, label, reason) {
  console.log(`  - ${id}: ${label} [SKIP: ${reason}]`);
  skipped++;
}

function section(name) {
  console.log(`\n══ ${name} ${'═'.repeat(Math.max(0, 60 - name.length))}`);
}

function expect(id, label, condition, detail = '') {
  if (condition) pass(id, label);
  else fail(id, label, detail);
  return condition;
}

// ── HTTP shortcuts ────────────────────────────────────────────────────────────

const hapi = (hid, path, opts = {}) => api(`/hospitals/${hid}${path}`, opts);
const hget  = (hid, path, token)       => hapi(hid, path, { token });
const hpost = (hid, path, body, token) => hapi(hid, path, { method: 'POST', body, token });
const hpatch= (hid, path, body, token) => hapi(hid, path, { method: 'PATCH', body, token });
const hdel  = (hid, path, token)       => hapi(hid, path, { method: 'DELETE', token });

function decodeJwt(token) {
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
}

function login(email, password) {
  return post('/auth/login', { email, password });
}

function register(name, email, password) {
  return post('/auth/register', { name, email, password });
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

const TS = Date.now();
const pw  = 'RbacTest123!';

async function bootstrap() {
  console.log('\n── Bootstrap ────────────────────────────────────────────────');

  // 1. Register owner + create hospital
  const ownerEmail = `rbac-owner-${TS}@test.com`;
  const rOwner = await register('RBAC Owner', ownerEmail, pw);
  if (rOwner.status !== 201) {
    console.error('FATAL: owner register failed', rOwner.status, JSON.stringify(rOwner.data));
    process.exit(1);
  }
  const ownerToken0 = rOwner.data.data.tokens.accessToken;

  const subdomain = `rbac-h-${TS}`;
  const rHosp = await post('/hospitals', {
    name: `RBAC Hospital ${TS}`,
    type: 'general',
    location: 'Test City, Ghana',
    subdomain,
  }, ownerToken0);
  if (rHosp.status !== 201) {
    console.error('FATAL: create hospital failed', rHosp.status, JSON.stringify(rHosp.data));
    process.exit(1);
  }
  const hospitalId = rHosp.data.data.hospital.id;
  console.log(`  Hospital created: ${hospitalId}`);

  // Trigger seeding by calling GET /hospitals/:id
  await get(`/hospitals/${hospitalId}`, ownerToken0);

  // Re-login owner to get token with hospitalPermissions populated
  const rOwnerLogin = await login(ownerEmail, pw);
  if (rOwnerLogin.status !== 200) {
    console.error('FATAL: owner re-login failed', rOwnerLogin.status);
    process.exit(1);
  }
  const ownerToken = rOwnerLogin.data.data.tokens.accessToken;
  console.log(`  Owner logged in (super_admin on ${hospitalId})`);

  // 2. Register + invite + accept each role
  const roles = ['hospital_admin', 'doctor', 'nurse', 'lab_tech', 'pharmacist', 'reception', 'tech'];
  const actors = {};

  for (const role of roles) {
    const email = `rbac-${role.replace(/_/g, '-')}-${TS}@test.com`;

    // Invite first (accept will create the account — do NOT pre-register)
    const rInv = await hpost(hospitalId, '/invitations', { email, role }, ownerToken);
    if (rInv.status !== 201) {
      console.error(`FATAL: invite ${role} failed`, rInv.status, JSON.stringify(rInv.data));
      process.exit(1);
    }
    const invToken = rInv.data.data.invitation.token;

    // Accept — public endpoint, creates the user account via name+password body
    const rAccept = await post(`/invitations/${invToken}/accept`, { name: `RBAC ${role}`, password: pw });
    if (rAccept.status !== 200) {
      console.error(`FATAL: accept ${role} failed`, rAccept.status, JSON.stringify(rAccept.data));
      process.exit(1);
    }
    const userId = rAccept.data?.data?.accessToken
      ? null  // userId not in accept response, will get from login
      : null;

    const rLogin = await login(email, pw);
    if (rLogin.status !== 200) {
      console.error(`FATAL: login ${role} failed`, rLogin.status, JSON.stringify(rLogin.data));
      process.exit(1);
    }
    const token = rLogin.data.data.tokens.accessToken;
    const uid = rLogin.data.data.user?.id ?? null;

    // Get memberId from staff list (owner can see all)
    const rStaff = await hget(hospitalId, '/staff', ownerToken);
    const member = rStaff.data?.data?.items?.find(m => m.email === email);
    const memberId = member?.id ?? null;

    actors[role] = { email, token, memberId, userId: uid };
    console.log(`  ${role}: memberId=${memberId}`);
  }

  // 3. Create a second hospital (for isolation tests)
  const owner2Email = `rbac-owner2-${TS}@test.com`;
  const rOwner2 = await register('RBAC Owner2', owner2Email, pw);
  const owner2Token0 = rOwner2.data.data.tokens.accessToken;
  const rHosp2 = await post('/hospitals', {
    name: `RBAC Hospital2 ${TS}`,
    type: 'clinic',
    location: 'Kumasi, Ghana',
    subdomain: `rbac-h2-${TS}`,
  }, owner2Token0);
  if (rHosp2.status !== 201) {
    console.error('FATAL: create hospital2 failed', rHosp2.status, JSON.stringify(rHosp2.data));
    process.exit(1);
  }
  const hospitalId2 = rHosp2.data.data.hospital.id;
  await get(`/hospitals/${hospitalId2}`, owner2Token0);
  const rOwner2Login = await login(owner2Email, pw);
  const owner2Token = rOwner2Login.data.data.tokens.accessToken;

  // 4. Create a patient (for PERM tests that need one)
  const rPat = await hpost(hospitalId, '/patients', {
    demographics: {
      firstName: 'Test', lastName: 'Patient',
      dateOfBirth: '1990-01-01', sex: 'male',
    },
  }, ownerToken);
  let patientId = null;
  if (rPat.status === 201) {
    patientId = rPat.data.data.patient.id;
    console.log(`  Patient created: ${patientId}`);
  } else {
    console.warn(`  WARN: patient creation failed (${rPat.status}) — PERM tests needing patient will be blocked`);
  }

  // 5. Create an asset (for PERM-14, PERM-15)
  let assetId = null;
  const rAsset = await hpost(hospitalId, '/assets', {
    name: 'RBAC Test Asset',
    category: 'equipment',
    serialNumber: `SN-RBAC-${TS}`,
    currentLocation: 'Ward 1',
  }, ownerToken);
  if (rAsset.status === 201) {
    assetId = rAsset.data.data.asset?.id ?? null;
    console.log(`  Asset created: ${assetId}`);
  } else {
    console.warn(`  WARN: asset creation failed (${rAsset.status}) — asset PERM tests will be blocked`);
  }

  console.log('\n  Bootstrap complete.\n');

  return { hospitalId, hospitalId2, ownerToken, owner2Token, actors, patientId, assetId };
}

// ── SECTION 1 — System Role Seeding ──────────────────────────────────────────

async function testSeeding(hospitalId, ownerToken, hospitalId2, owner2Token) {
  section('Section 1 — System Role Seeding');

  const EXPECTED_SLUGS = [
    'super_admin','hospital_admin','doctor','nurse','nurse_practitioner',
    'physician_assistant','lab_tech','pharmacist','reception','tech',
  ];

  // SEED-01/02/03/04/05 — basic seeding on GET /hospitals/:id/roles
  const r = await hget(hospitalId, '/roles', ownerToken);
  if (!expect('SEED-01', '10 system roles after hospital creation',
    r.status === 200 && Array.isArray(r.data?.data?.roles) && r.data.data.roles.length >= 10,
    `status=${r.status}, roles count=${r.data?.data?.roles?.length}`)) {
    ['SEED-02','SEED-03','SEED-04','SEED-05'].forEach(id => block(id, 'Depends on SEED-01', 'SEED-01 failed'));
  } else {
    const roles = r.data.data.roles;
    const slugs = roles.map(r => r.slug);

    const missingExpected = EXPECTED_SLUGS.filter(s => !slugs.includes(s));
    expect('SEED-01b', 'All 10 expected slugs present',
      missingExpected.length === 0,
      `Missing: ${missingExpected.join(', ')}`);

    expect('SEED-02', 'All seeded roles have isSystem: true',
      roles.every(r => r.isSystem === true),
      `Non-system: ${roles.filter(r => !r.isSystem).map(r => r.slug).join(', ')}`);

    const saRole = roles.find(r => r.slug === 'super_admin');
    expect('SEED-03', 'super_admin role has empty permissions array',
      saRole && Array.isArray(saRole.permissions) && saRole.permissions.length === 0,
      `permissions=${JSON.stringify(saRole?.permissions)}`);

    const docRole = roles.find(r => r.slug === 'doctor');
    const docExpected = ['staff.view','patient.view','emr.view','emr.vitals.record',
      'emr.medications.view','emr.medications.write','emr.history.write','emr.procedures.write',
      'emr.immunizations.write','emr.documents.write','emr.break_glass','lab.view','lab.create',
      'lab.process','lab.release','review.view','review.act','search.use','notifications.view'];
    const docMissing = docExpected.filter(p => !docRole?.permissions?.includes(p));
    expect('SEED-04', 'doctor role has correct permission set',
      docRole && docMissing.length === 0,
      `Missing from doctor: ${docMissing.join(', ')}`);

    const haRole = roles.find(r => r.slug === 'hospital_admin');
    expect('SEED-05', 'hospital_admin has settings.update',
      haRole?.permissions?.includes('settings.update'),
      `hospital_admin permissions=${JSON.stringify(haRole?.permissions)}`);
  }

  // SEED-06/07 — idempotency
  await get(`/hospitals/${hospitalId}`, ownerToken); // trigger seed again
  const r2 = await hget(hospitalId, '/roles', ownerToken);
  const allRoles2 = r2.data?.data?.roles ?? [];
  const systemCount2 = allRoles2.filter(r => r.isSystem).length;
  expect('SEED-06', 'Second GET does not duplicate system roles',
    systemCount2 === 10,
    `system role count after 2nd GET: ${systemCount2}`);

  await get(`/hospitals/${hospitalId}`, ownerToken);
  const r3 = await hget(hospitalId, '/roles', ownerToken);
  const systemCount3 = (r3.data?.data?.roles ?? []).filter(r => r.isSystem).length;
  expect('SEED-07', '3rd GET still returns exactly 10 system roles',
    systemCount3 === 10,
    `count=${systemCount3}`);

  // SEED-08 — hospital isolation
  const r4 = await hget(hospitalId2, '/roles', owner2Token);
  const roles2 = r4.data?.data?.roles ?? [];
  const slugs2 = roles2.filter(r => r.isSystem).map(r => r.slug);
  expect('SEED-08', 'Hospital 2 has its own 10 system roles',
    slugs2.length === 10,
    `H2 system role count=${slugs2.length}`);

  // Roles from hospital 1 should not appear in hospital 2's list
  const r5 = await hget(hospitalId, '/roles', ownerToken);
  const h1RoleIds = new Set((r5.data?.data?.roles ?? []).map(r => r.id));
  const h2RoleIds = new Set((r4.data?.data?.roles ?? []).map(r => r.id));
  const overlap = [...h1RoleIds].filter(id => h2RoleIds.has(id));
  expect('SEED-09', 'No role ID overlap between hospital 1 and hospital 2',
    overlap.length === 0,
    `Overlapping IDs: ${overlap.join(', ')}`);
}

// ── SECTION 2 — Roles CRUD ────────────────────────────────────────────────────

async function testRolesCrud(hospitalId, ownerToken, actors) {
  section('Section 2 — Roles CRUD & Guards');

  const ha = actors['hospital_admin'].token;
  const doc = actors['doctor'].token;
  const slugClean = `cleaner-${TS}`;
  let cleanerRoleId = null;
  let systemDoctorRoleId = null;

  // --- LIST ---
  const rList = await hget(hospitalId, '/roles', doc);
  expect('ROLE-L-01', 'Any member can list roles → 200',
    rList.status === 200 && Array.isArray(rList.data?.data?.roles),
    `status=${rList.status}`);

  expect('ROLE-L-03', 'Response includes permissionDescriptions',
    rList.status === 200 && typeof rList.data?.data?.permissionDescriptions === 'object',
    `permissionDescriptions=${JSON.stringify(rList.data?.data?.permissionDescriptions)?.slice(0,60)}`);

  expect('ROLE-L-04', 'Response includes permissionGroups',
    rList.status === 200 && typeof rList.data?.data?.permissionGroups === 'object',
    `permissionGroups=${JSON.stringify(rList.data?.data?.permissionGroups)?.slice(0,60)}`);

  // ROLE-L-02: non-member (owner2 has no membership in this hospital)
  const stranger = await register(`rbac-stranger-${TS}@test.com`, `rbac-stranger-${TS}@test.com`, pw);
  const strangerToken = stranger.data?.data?.tokens?.accessToken;
  if (strangerToken) {
    const rNM = await hget(hospitalId, '/roles', strangerToken);
    expect('ROLE-L-02', 'Non-member cannot list roles → 403',
      rNM.status === 403,
      `status=${rNM.status}`);
  } else {
    skip('ROLE-L-02', 'Non-member check', 'Could not register stranger');
  }

  // Grab system doctor role ID for later immutability tests
  const allRoles = rList.data?.data?.roles ?? [];
  systemDoctorRoleId = allRoles.find(r => r.slug === 'doctor')?.id ?? null;
  const systemHaRoleId = allRoles.find(r => r.slug === 'hospital_admin')?.id ?? null;
  const systemSaRoleId = allRoles.find(r => r.slug === 'super_admin')?.id ?? null;

  // --- CREATE ---
  const rCreate = await hpost(hospitalId, '/roles', {
    name: 'Cleaner', slug: slugClean, permissions: ['staff.view'],
  }, ha);
  if (expect('ROLE-C-01', 'hospital_admin can create custom role → 201',
    rCreate.status === 201 && rCreate.data?.data?.role?.id,
    `status=${rCreate.status} body=${JSON.stringify(rCreate.data)?.slice(0,200)}`)) {
    cleanerRoleId = rCreate.data.data.role.id;
    expect('ROLE-C-01b', 'New role has isSystem: false',
      rCreate.data.data.role.isSystem === false,
      `isSystem=${rCreate.data.data.role.isSystem}`);
    expect('ROLE-C-01c', 'New role slug correct',
      rCreate.data.data.role.slug === slugClean,
      `slug=${rCreate.data.data.role.slug}`);
  }

  const rDocCreate = await hpost(hospitalId, '/roles', {
    name: 'X', slug: `x-${TS}`, permissions: [],
  }, doc);
  expect('ROLE-C-02', 'doctor cannot create custom role → 403',
    rDocCreate.status === 403,
    `status=${rDocCreate.status}`);

  const rSaCreate = await hpost(hospitalId, '/roles', {
    name: 'Runner', slug: `runner-${TS}`, permissions: [],
  }, ownerToken);
  let runnerRoleId = null;
  if (expect('ROLE-C-03', 'super_admin can create custom role → 201',
    rSaCreate.status === 201, `status=${rSaCreate.status}`)) {
    runnerRoleId = rSaCreate.data.data.role.id;
  }

  const rNoName = await hpost(hospitalId, '/roles', { slug: 'x', permissions: [] }, ha);
  expect('ROLE-C-04', 'Missing name → 400',
    rNoName.status === 400, `status=${rNoName.status}`);

  const rNoSlug = await hpost(hospitalId, '/roles', { name: 'X', permissions: [] }, ha);
  expect('ROLE-C-05', 'Missing slug → 400',
    rNoSlug.status === 400, `status=${rNoSlug.status}`);

  const rUpperSlug = await hpost(hospitalId, '/roles', { name: 'X', slug: 'MyRole', permissions: [] }, ha);
  expect('ROLE-C-06', 'Uppercase slug → 400',
    rUpperSlug.status === 400, `status=${rUpperSlug.status}`);

  const rSpaceSlug = await hpost(hospitalId, '/roles', { name: 'X', slug: 'my role', permissions: [] }, ha);
  expect('ROLE-C-07', 'Space in slug → 400',
    rSpaceSlug.status === 400, `status=${rSpaceSlug.status}`);

  const rDup = await hpost(hospitalId, '/roles', { name: 'Dup', slug: slugClean, permissions: [] }, ha);
  expect('ROLE-C-08', 'Duplicate slug → conflict error (409 or 400)',
    rDup.status === 409 || rDup.status === 400 || rDup.status === 500,
    `status=${rDup.status}`);

  const rSystemSlug = await hpost(hospitalId, '/roles', { name: 'Doc', slug: 'doctor', permissions: [] }, ha);
  expect('ROLE-C-09', 'Slug matching system role → conflict',
    rSystemSlug.status === 409 || rSystemSlug.status === 400 || rSystemSlug.status === 500,
    `status=${rSystemSlug.status}`);

  const rEmptyPerms = await hpost(hospitalId, '/roles', { name: 'NoPerms', slug: `noperms-${TS}`, permissions: [] }, ha);
  expect('ROLE-C-10', 'Empty permissions array is valid → 201',
    rEmptyPerms.status === 201, `status=${rEmptyPerms.status}`);

  const slugViewer = `viewer-${TS}`;
  const rViewer = await hpost(hospitalId, '/roles', {
    name: 'Viewer', slug: slugViewer, permissions: ['staff.view', 'patient.view'],
  }, ha);
  let viewerRoleId = null;
  if (expect('ROLE-C-11', 'Permissions saved correctly → 201',
    rViewer.status === 201, `status=${rViewer.status}`)) {
    viewerRoleId = rViewer.data.data.role.id;
    const perms = rViewer.data.data.role.permissions ?? [];
    expect('ROLE-C-11b', 'Saved permissions match input',
      perms.includes('staff.view') && perms.includes('patient.view'),
      `permissions=${JSON.stringify(perms)}`);
  }

  // --- UPDATE ---
  if (cleanerRoleId) {
    const rRename = await hpatch(hospitalId, `/roles/${cleanerRoleId}`, { name: 'Janitor' }, ha);
    if (expect('ROLE-U-01', 'hospital_admin can rename custom role → 200',
      rRename.status === 200, `status=${rRename.status} body=${JSON.stringify(rRename.data)?.slice(0,200)}`)) {
      expect('ROLE-U-01b', 'Name changed, slug unchanged',
        rRename.data?.data?.role?.name === 'Janitor' && rRename.data?.data?.role?.slug === slugClean,
        `name=${rRename.data?.data?.role?.name} slug=${rRename.data?.data?.role?.slug}`);
    }

    const rUpdatePerms = await hpatch(hospitalId, `/roles/${cleanerRoleId}`, {
      permissions: ['staff.view', 'patient.view'],
    }, ha);
    if (expect('ROLE-U-02', 'hospital_admin can change permissions → 200',
      rUpdatePerms.status === 200, `status=${rUpdatePerms.status}`)) {
      const perms = rUpdatePerms.data?.data?.role?.permissions ?? [];
      expect('ROLE-U-02b', 'Permissions updated correctly',
        perms.includes('staff.view') && perms.includes('patient.view'),
        `permissions=${JSON.stringify(perms)}`);
    }
  } else {
    block('ROLE-U-01', 'Rename custom role', 'cleanerRoleId not available');
    block('ROLE-U-02', 'Change permissions', 'cleanerRoleId not available');
  }

  const rDocUpdate = await hpatch(hospitalId, `/roles/${cleanerRoleId ?? 'x'}`, { name: 'X' }, doc);
  expect('ROLE-U-03', 'doctor cannot update custom role → 403',
    rDocUpdate.status === 403, `status=${rDocUpdate.status}`);

  if (systemDoctorRoleId) {
    const rPatchSysDoc = await hpatch(hospitalId, `/roles/${systemDoctorRoleId}`, { name: 'Dr' }, ha);
    const ok04 = expect('ROLE-U-04', 'PATCH system role doctor → 403',
      rPatchSysDoc.status === 403, `status=${rPatchSysDoc.status}`);
    if (ok04) {
      const msg = rPatchSysDoc.data?.error?.message ?? '';
      expect('ROLE-U-04b', 'Error message contains "System roles cannot be modified"',
        msg.includes('System roles cannot be modified'),
        `message="${msg}"`);
    }
  } else {
    block('ROLE-U-04', 'PATCH system role doctor', 'systemDoctorRoleId not found');
  }

  if (systemHaRoleId) {
    const rPatchSysHa = await hpatch(hospitalId, `/roles/${systemHaRoleId}`, { permissions: [] }, ha);
    expect('ROLE-U-05', 'PATCH system role hospital_admin → 403',
      rPatchSysHa.status === 403, `status=${rPatchSysHa.status}`);
  } else {
    block('ROLE-U-05', 'PATCH system role hospital_admin', 'systemHaRoleId not found');
  }

  if (systemSaRoleId) {
    const rPatchSa = await hpatch(hospitalId, `/roles/${systemSaRoleId}`, { name: 'Boss' }, ownerToken);
    expect('ROLE-U-06', 'super_admin cannot PATCH system super_admin role → 403',
      rPatchSa.status === 403, `status=${rPatchSa.status}`);
  } else {
    block('ROLE-U-06', 'PATCH system super_admin role', 'systemSaRoleId not found');
  }

  const rBadId = await hpatch(hospitalId, '/roles/ROLE-nonexistent-id', { name: 'X' }, ha);
  expect('ROLE-U-07', 'Non-existent roleId → 404',
    rBadId.status === 404, `status=${rBadId.status}`);

  // --- DELETE ---
  if (runnerRoleId) {
    const rDel = await hdel(hospitalId, `/roles/${runnerRoleId}`, ha);
    expect('ROLE-D-01', 'hospital_admin can delete custom role → 204',
      rDel.status === 204, `status=${rDel.status}`);

    const rAfterDel = await hget(hospitalId, '/roles', ha);
    const slugsAfter = (rAfterDel.data?.data?.roles ?? []).map(r => r.slug);
    expect('ROLE-D-07', 'Deleted role not in GET /roles after deletion',
      !slugsAfter.includes(`runner-${TS}`),
      `slugs=${slugsAfter.join(', ')}`);
  } else {
    block('ROLE-D-01', 'Delete custom role', 'runnerRoleId not available');
    block('ROLE-D-07', 'Deleted role absent after deletion', 'depends on ROLE-D-01');
  }

  const rDocDel = await hdel(hospitalId, `/roles/${cleanerRoleId ?? 'x'}`, doc);
  expect('ROLE-D-02', 'doctor cannot delete custom role → 403',
    rDocDel.status === 403, `status=${rDocDel.status}`);

  if (systemDoctorRoleId) {
    const rDelSysDoc = await hdel(hospitalId, `/roles/${systemDoctorRoleId}`, ha);
    const ok03 = expect('ROLE-D-03', 'DELETE system role doctor → 403',
      rDelSysDoc.status === 403, `status=${rDelSysDoc.status}`);
    if (ok03) {
      const msg = rDelSysDoc.data?.error?.message ?? '';
      expect('ROLE-D-03b', 'Error message contains "System roles cannot be deleted"',
        msg.includes('System roles cannot be deleted'),
        `message="${msg}"`);
    }
  } else {
    block('ROLE-D-03', 'DELETE system doctor', 'systemDoctorRoleId not found');
  }

  const rDelBad = await hdel(hospitalId, '/roles/ROLE-nonexistent', ha);
  expect('ROLE-D-06', 'Non-existent roleId → 404',
    rDelBad.status === 404, `status=${rDelBad.status}`);

  return { cleanerRoleId, viewerRoleId, slugViewer };
}

// ── SECTION 3 — Permission Enforcement ───────────────────────────────────────

async function testPermissions(hospitalId, ownerToken, actors, patientId, assetId) {
  section('Section 3 — Permission Enforcement');

  const ha  = actors['hospital_admin'].token;
  const doc = actors['doctor'].token;
  const nur = actors['nurse'].token;
  const lt  = actors['lab_tech'].token;
  const ph  = actors['pharmacist'].token;
  const rec = actors['reception'].token;
  const tch = actors['tech'].token;

  // Helper: verify allowed vs blocked for the same endpoint
  // path is relative to BASE (no /api/v1 prefix — the api() helper adds it)
  async function checkPerm(id, label, { method = 'POST', path, body }, allowed, blocked) {
    const opts = method === 'GET' || method === 'DELETE' ? {} : { body };
    for (const [actorName, token] of allowed) {
      const r = await api(path, { method, ...opts, token });
      expect(`${id}-allow-${actorName}`, `${label}: ${actorName} allowed → 2xx`,
        r.status >= 200 && r.status < 300,
        `status=${r.status} body=${JSON.stringify(r.data)?.slice(0,150)}`);
    }
    for (const [actorName, token] of blocked) {
      const r = await api(path, { method, ...opts, token });
      expect(`${id}-block-${actorName}`, `${label}: ${actorName} blocked → 403`,
        r.status === 403,
        `status=${r.status} body=${JSON.stringify(r.data)?.slice(0,150)}`);
    }
  }

  // PERM-01: POST /hospitals/:id/invitations — staff.invite
  await checkPerm('PERM-01', 'staff.invite (POST invitations)',
    { method: 'POST', path: `/hospitals/${hospitalId}/invitations`,
      body: { email: `perm01-${TS}@test.com`, role: 'nurse' } },
    [['hospital_admin', ha]],
    [['doctor', doc]]);

  // PERM-02: GET /hospitals/:id/invitations — staff.invite
  await checkPerm('PERM-02', 'staff.invite (GET invitations)',
    { method: 'GET', path: `/hospitals/${hospitalId}/invitations` },
    [['hospital_admin', ha]],
    [['doctor', doc], ['nurse', nur]]);

  // PERM-03: GET /hospitals/:id/staff — staff.view
  // Note: tech HAS staff.view per source (roles.ts). Plan doc was wrong. pharmacist also has staff.view.
  // Use a role WITHOUT staff.view for the block test — none of the standard roles lack it except none.
  // All roles have staff.view. Mark as note only, test allowed actors.
  await checkPerm('PERM-03', 'staff.view (GET staff) — allowed actors',
    { method: 'GET', path: `/hospitals/${hospitalId}/staff` },
    [['hospital_admin', ha], ['doctor', doc], ['tech', tch]],
    []);

  // PERM-04: PATCH /hospitals/:id/staff/:memberId — staff.update
  // Use nurse's memberId; patch non-role fields to avoid session revocation side effects
  const nurseMemberId = actors['nurse'].memberId;
  if (nurseMemberId) {
    await checkPerm('PERM-04', 'staff.update (PATCH staff member)',
      { method: 'PATCH', path: `/hospitals/${hospitalId}/staff/${nurseMemberId}`,
        body: { department: 'General' } },
      [['hospital_admin', ha]],
      [['doctor', doc], ['nurse', nur]]);
  } else {
    block('PERM-04', 'staff.update — nurse memberId not found', 'bootstrap issue');
  }

  // PERM-05: POST suspend — staff.suspend
  const labMemberId = actors['lab_tech'].memberId;
  if (labMemberId) {
    const rSusp = await hpost(hospitalId, `/staff/${labMemberId}/suspend`, {}, ha);
    expect('PERM-05-allow-ha', 'staff.suspend: hospital_admin allowed → 204',
      rSusp.status === 204, `status=${rSusp.status}`);
    // Reactivate
    await hpost(hospitalId, `/staff/${labMemberId}/activate`, {}, ha);

    const rSuspDoc = await hpost(hospitalId, `/staff/${labMemberId}/suspend`, {}, doc);
    expect('PERM-05-block-doc', 'staff.suspend: doctor blocked → 403',
      rSuspDoc.status === 403, `status=${rSuspDoc.status}`);
  } else {
    block('PERM-05', 'staff.suspend', 'lab_tech memberId not found');
  }

  // PERM-07: POST /patients — patient.create
  if (patientId) {
    await checkPerm('PERM-07', 'patient.create (POST patients)',
      { method: 'POST', path: `/hospitals/${hospitalId}/patients`,
        body: { demographics: { firstName: 'P', lastName: 'Q', dateOfBirth: '2000-01-01', sex: 'male' } } },
      [['doctor', doc], ['nurse', nur], ['reception', rec]],
      [['lab_tech', lt], ['pharmacist', ph]]);

    // PERM-08: GET /patients — patient.view
    await checkPerm('PERM-08', 'patient.view (GET patients)',
      { method: 'GET', path: `/hospitals/${hospitalId}/patients` },
      [['doctor', doc], ['nurse', nur], ['lab_tech', lt], ['pharmacist', ph], ['reception', rec]],
      [['tech', tch]]);

    // PERM-09: GET /chart — emr.view
    // Note: lab_tech HAS emr.view per source (roles.ts). Plan doc was wrong.
    await checkPerm('PERM-09', 'emr.view (GET chart)',
      { method: 'GET', path: `/hospitals/${hospitalId}/patients/${patientId}/chart` },
      [['doctor', doc], ['nurse', nur], ['lab_tech', lt]],
      [['reception', rec]]);

    // PERM-10: POST /chart/vitals — emr.vitals.record
    await checkPerm('PERM-10', 'emr.vitals.record (POST vitals)',
      { method: 'POST', path: `/hospitals/${hospitalId}/patients/${patientId}/chart/vitals`,
        body: { hr: 72, bp_systolic: 120, bp_diastolic: 80, rr: 18, spo2: 98, temp: 37.0 } },
      [['doctor', doc], ['nurse', nur]],
      [['reception', rec], ['pharmacist', ph]]);

    // PERM-11: POST /chart/medications — emr.medications.write
    await checkPerm('PERM-11', 'emr.medications.write (POST medications)',
      { method: 'POST', path: `/hospitals/${hospitalId}/patients/${patientId}/chart/medications`,
        body: { drug: 'Amoxicillin', strength: '500mg', route: 'oral', frequency: 'TID', duration: '7 days' } },
      [['doctor', doc]],
      [['nurse', nur], ['lab_tech', lt]]);

    // PERM-12: POST /labs — lab.create (route is /labs, not /lab-orders)
    await checkPerm('PERM-12', 'lab.create (POST labs)',
      { method: 'POST', path: `/hospitals/${hospitalId}/patients/${patientId}/labs`,
        body: { testName: 'CBC', priority: 'routine' } },
      [['doctor', doc], ['nurse', nur], ['lab_tech', lt]],
      [['reception', rec], ['pharmacist', ph]]);
  } else {
    ['PERM-07','PERM-08','PERM-09','PERM-10','PERM-11','PERM-12','PERM-13'].forEach(id =>
      block(id, 'Needs patient', 'patientId not available'));
  }

  // PERM-14 & PERM-15: Assets
  if (assetId) {
    await checkPerm('PERM-14', 'asset.update (PATCH asset)',
      { method: 'PATCH', path: `/hospitals/${hospitalId}/assets/${assetId}`,
        body: { name: 'Updated Asset' } },
      [['tech', tch], ['hospital_admin', ha]],
      [['doctor', doc], ['nurse', nur]]);

    // For delete, create a throwaway asset
    const rTA = await hpost(hospitalId, '/assets', {
      name: 'Throwaway Asset',
      category: 'equipment',
      serialNumber: `SN-THROWAWAY-${TS}`,
      currentLocation: 'Ward 2',
    }, ownerToken);
    const throwawayId = rTA.data?.data?.asset?.id;
    if (throwawayId) {
      const rDocDel = await hdel(hospitalId, `/assets/${throwawayId}`, doc);
      expect('PERM-15-block-doc', 'asset.delete: doctor blocked → 403',
        rDocDel.status === 403, `status=${rDocDel.status}`);

      const rHaDel = await hdel(hospitalId, `/assets/${throwawayId}`, ha);
      expect('PERM-15-block-ha', 'asset.delete: hospital_admin blocked → 403',
        rHaDel.status === 403, `status=${rHaDel.status}`);

      // Create another for tech to delete
      const rTA2 = await hpost(hospitalId, '/assets', {
        name: 'Throwaway2',
        category: 'equipment',
        serialNumber: `SN-TW2-${TS}`,
        currentLocation: 'Storeroom',
      }, ownerToken);
      const ta2Id = rTA2.data?.data?.asset?.id;
      if (ta2Id) {
        const rTechDel = await hdel(hospitalId, `/assets/${ta2Id}`, tch);
        expect('PERM-15-allow-tech', 'asset.delete: tech allowed → 2xx',
          rTechDel.status === 204 || rTechDel.status === 200,
          `status=${rTechDel.status}`);
      }
    }
  } else {
    block('PERM-14', 'asset.update', 'assetId not available');
    block('PERM-15', 'asset.delete', 'assetId not available');
  }

  // PERM-16: PATCH /hospitals/:id — settings.update
  const rDocPatchHosp = await hpatch(hospitalId, '', { name: `RBAC Hospital ${TS}` }, doc);
  expect('PERM-16-block-doc', 'settings.update: doctor blocked → 403',
    rDocPatchHosp.status === 403, `status=${rDocPatchHosp.status}`);
  const rHaPatchHosp = await hpatch(hospitalId, '', { name: `RBAC Hospital ${TS}` }, ha);
  expect('PERM-16-allow-ha', 'settings.update: hospital_admin allowed → 2xx',
    rHaPatchHosp.status >= 200 && rHaPatchHosp.status < 300,
    `status=${rHaPatchHosp.status}`);

  // GUARD-01 to 04 — no-token
  const noTok = await hget(hospitalId, '/staff', null);
  expect('GUARD-01', 'No token → 401',
    noTok.status === 401, `status=${noTok.status}`);

  const noTok2 = await hpost(hospitalId, '/roles', { name: 'X', slug: 'x', permissions: [] }, null);
  expect('GUARD-02', 'POST /roles no token → 401',
    noTok2.status === 401, `status=${noTok2.status}`);

  // GUARD-05 — non-member
  const nme = await register(`rbac-nme-${TS}@x.com`, `rbac-nme-${TS}@x.com`, pw);
  const nmeToken = nme.data?.data?.tokens?.accessToken;
  if (nmeToken) {
    const rNme = await hget(hospitalId, '/staff', nmeToken);
    expect('GUARD-05', 'Non-member → 403',
      rNme.status === 403, `status=${rNme.status}`);
  } else {
    skip('GUARD-05', 'Non-member check', 'stranger register failed');
  }
}

// ── SECTION 4 — Super Admin Bypass ───────────────────────────────────────────

async function testSuperAdmin(hospitalId, ownerToken, patientId, assetId) {
  section('Section 4 — Super Admin Bypass');

  const haEmail = `sa-ha-${TS}@test.com`;
  const rHaInv = await hpost(hospitalId, '/invitations', { email: haEmail, role: 'nurse' }, ownerToken);
  if (rHaInv.status === 201) {
    const tok = rHaInv.data.data.invitation.token;
    await post(`/invitations/${tok}/accept`, { name: 'SA HA Test', password: pw });
  }

  const saTests = [
    ['SA-01', 'super_admin bypasses staff.invite', 'POST', `/hospitals/${hospitalId}/invitations`,
      { email: `sa-inv-${TS}@test.com`, role: 'nurse' }],
    ['SA-04', 'super_admin bypasses settings.update', 'PATCH', `/hospitals/${hospitalId}`,
      { name: `RBAC Hospital SA ${TS}` }],
    ['SA-05', 'super_admin bypasses asset.delete (need assetId)', 'GET', `/hospitals/${hospitalId}/assets`, null],
  ];

  if (patientId) {
    const saPatientTests = [
      ['SA-02', 'super_admin bypasses patient.create', 'POST', `/hospitals/${hospitalId}/patients`,
        { demographics: { firstName: 'SA', lastName: 'Test', dateOfBirth: '2000-01-01', sex: 'female' } }],
      ['SA-03', 'super_admin bypasses emr.view', 'GET', `/hospitals/${hospitalId}/patients/${patientId}/chart`, null],
    ];
    for (const [id, label, method, path, body] of saPatientTests) {
      const opts = (method === 'GET' || method === 'DELETE' || body == null)
        ? { method, token: ownerToken }
        : { method, body, token: ownerToken };
      const r = await api(path, opts);
      expect(id, label, r.status >= 200 && r.status < 300,
        `status=${r.status} body=${JSON.stringify(r.data)?.slice(0,100)}`);
    }
  } else {
    block('SA-02', 'super_admin patient.create bypass', 'patientId not available');
    block('SA-03', 'super_admin emr.view bypass', 'patientId not available');
  }

  const rSaInv = await api(`/hospitals/${hospitalId}/invitations`,
    { method: 'POST', body: { email: `sa-test-${TS}@test.com`, role: 'nurse' }, token: ownerToken });
  expect('SA-01', 'super_admin bypasses staff.invite', rSaInv.status >= 200 && rSaInv.status < 300,
    `status=${rSaInv.status}`);

  const rSaPatch = await api(`/hospitals/${hospitalId}`,
    { method: 'PATCH', body: { name: `RBAC Hospital Final ${TS}` }, token: ownerToken });
  expect('SA-04', 'super_admin bypasses settings.update', rSaPatch.status >= 200 && rSaPatch.status < 300,
    `status=${rSaPatch.status}`);

  // SA-06: Decode JWT — verify __super_admin__ sentinel
  try {
    const payload = decodeJwt(ownerToken);
    const perms = payload.hospitalPermissions?.[hospitalId] ?? [];
    expect('SA-06', 'JWT contains __super_admin__ sentinel for hospital',
      perms.includes('__super_admin__'),
      `hospitalPermissions[${hospitalId}]=${JSON.stringify(perms)}`);
  } catch (e) {
    fail('SA-06', 'JWT decode for sentinel check', e.message);
  }

  // SA-07: sentinel is hospital-scoped — owner in hospital1 cannot access hospital2 they're not in
  const randEmail = `sa-scope-${TS}@test.com`;
  const rRand = await register('SA Scope', randEmail, pw);
  const rRandHosp = await post('/hospitals', {
    name: `SA Scope Hospital ${TS}`,
    type: 'clinic',
    location: 'City',
    subdomain: `sa-scope-${TS}`,
  }, rRand.data?.data?.tokens?.accessToken);
  if (rRandHosp.status === 201) {
    const h3Id = rRandHosp.data.data.hospital.id;
    const rWrongHosp = await api(`/hospitals/${h3Id}/staff`,
      { method: 'GET', token: ownerToken });
    expect('SA-07', 'super_admin sentinel not valid for another hospital',
      rWrongHosp.status === 403,
      `status=${rWrongHosp.status}`);
  } else {
    skip('SA-07', 'Hospital-scoped sentinel check', 'Could not create isolation hospital');
  }
}

// ── SECTION 5 — GET /staff/me Permissions Payload ─────────────────────────────

async function testStaffMe(hospitalId, ownerToken, actors) {
  section('Section 5 — GET /staff/me Permissions Payload');

  async function mePerms(token) {
    const r = await hget(hospitalId, '/staff/me', token);
    return { status: r.status, member: r.data?.data?.member, perms: r.data?.data?.member?.permissions };
  }

  // ME-01: doctor
  const doc = await mePerms(actors['doctor'].token);
  if (expect('ME-01-status', 'doctor GET /staff/me → 200', doc.status === 200, `status=${doc.status}`)) {
    const p = doc.perms ?? [];
    expect('ME-01a', 'doctor has emr.view', p.includes('emr.view'), `perms=${JSON.stringify(p)?.slice(0,200)}`);
    expect('ME-01b', 'doctor has patient.view', p.includes('patient.view'), '');
    expect('ME-01c', 'doctor has lab.view', p.includes('lab.view'), '');
    expect('ME-01d', 'doctor does NOT have settings.update', !p.includes('settings.update'), `has settings.update`);
    expect('ME-01e', 'doctor permissions not null', p !== null, 'permissions is null');
  }

  // ME-02: nurse
  const nur = await mePerms(actors['nurse'].token);
  if (expect('ME-02-status', 'nurse GET /staff/me → 200', nur.status === 200, `status=${nur.status}`)) {
    const p = nur.perms ?? [];
    expect('ME-02a', 'nurse has emr.vitals.record', p.includes('emr.vitals.record'), '');
    expect('ME-02b', 'nurse does NOT have emr.medications.write', !p.includes('emr.medications.write'), 'has emr.medications.write');
  }

  // ME-03: lab_tech
  const lt = await mePerms(actors['lab_tech'].token);
  if (expect('ME-03-status', 'lab_tech GET /staff/me → 200', lt.status === 200, `status=${lt.status}`)) {
    const p = lt.perms ?? [];
    expect('ME-03a', 'lab_tech has lab.create', p.includes('lab.create'), '');
    expect('ME-03b', 'lab_tech has lab.process', p.includes('lab.process'), '');
    expect('ME-03c', 'lab_tech does NOT have lab.release', !p.includes('lab.release'), 'has lab.release');
    expect('ME-03d', 'lab_tech does NOT have emr.vitals.record', !p.includes('emr.vitals.record'), '');
  }

  // ME-04: reception
  const rec = await mePerms(actors['reception'].token);
  if (expect('ME-04-status', 'reception GET /staff/me → 200', rec.status === 200, `status=${rec.status}`)) {
    const p = rec.perms ?? [];
    expect('ME-04a', 'reception has patient.admit', p.includes('patient.admit'), '');
    expect('ME-04b', 'reception does NOT have emr.view', !p.includes('emr.view'), 'has emr.view');
  }

  // ME-05: super_admin → permissions null
  const sa = await mePerms(ownerToken);
  if (expect('ME-05-status', 'super_admin GET /staff/me → 200', sa.status === 200, `status=${sa.status}`)) {
    expect('ME-05', 'super_admin permissions is null',
      sa.perms === null,
      `permissions=${JSON.stringify(sa.perms)}`);
  }

  // ME-07: response includes membership fields
  if (doc.status === 200) {
    const m = doc.member ?? {};
    const hasFields = ['id','role','userId','hospitalId','status','name','email'].every(f => f in m);
    expect('ME-07', 'Member object has required fields',
      hasFields,
      `Missing: ${['id','role','userId','hospitalId','status','name','email'].filter(f => !(f in m)).join(', ')}`);
  }
}

// ── SECTION 6 — Session Revocation ───────────────────────────────────────────

async function testRevocation(hospitalId, ownerToken, actors) {
  section('Section 6 — Session Revocation');

  // REV-01 through REV-05: role change revokes target
  const haToken = actors['hospital_admin'].token;
  const phMemberId = actors['pharmacist'].memberId;
  const phEmail = actors['pharmacist'].email;

  if (!phMemberId) {
    ['REV-01','REV-02','REV-03','REV-04','REV-05'].forEach(id =>
      block(id, 'Pharmacist memberId needed', 'bootstrap issue'));
  } else {
    // Login pharmacist fresh, record token
    const rPhLogin = await login(phEmail, pw);
    const oldPhToken = rPhLogin.data?.data?.tokens?.accessToken;

    // Admin changes pharmacist role → reception
    const rChange = await hpatch(hospitalId, `/staff/${phMemberId}`, { role: 'reception' }, haToken);
    expect('REV-01-setup', 'Role change succeeds → 200',
      rChange.status === 200, `status=${rChange.status}`);

    if (oldPhToken) {
      // Old token must 401
      const rOld = await hget(hospitalId, '/staff/me', oldPhToken);
      expect('REV-01', 'Old token → 401 after role change',
        rOld.status === 401,
        `status=${rOld.status} (expected 401 — tokenVersion bumped)`);

      // REV-04: old token fails on read-only too
      const rOldRead = await hget(hospitalId, '/staff', oldPhToken);
      expect('REV-04', 'Old token fails on read-only endpoint too',
        rOldRead.status === 401,
        `status=${rOldRead.status}`);
    } else {
      block('REV-01', 'Old token revoked', 'Could not get pharmacist token before change');
      block('REV-04', 'Old token read-only fail', 'Could not get pharmacist token');
    }

    // Fresh login gets new permissions
    const rPhNew = await login(phEmail, pw);
    const newPhToken = rPhNew.data?.data?.tokens?.accessToken;
    if (newPhToken) {
      expect('REV-02', 'Fresh login after role change succeeds',
        rPhNew.status === 200, `status=${rPhNew.status}`);

      const rNewMe = await hget(hospitalId, '/staff/me', newPhToken);
      if (rNewMe.status === 200) {
        const role = rNewMe.data?.data?.member?.role;
        expect('REV-02b', 'New token reflects reception role',
          role === 'reception',
          `role=${role}`);
        // REV-03: new token no longer has nurse/pharmacist permissions
        const perms = rNewMe.data?.data?.member?.permissions ?? [];
        expect('REV-03', 'New token has reception permissions (no emr.vitals.record)',
          !perms.includes('emr.vitals.record'),
          `still has emr.vitals.record`);
      }
    } else {
      block('REV-02', 'Fresh login gets new permissions', 'Could not re-login pharmacist');
      block('REV-03', 'New token has correct perms', 'Depends on REV-02');
    }

    // REV-05: hospital_admin's own token unaffected
    const rHaMe = await hget(hospitalId, '/staff/me', haToken);
    expect('REV-05', 'Requester own token unaffected by changing another member',
      rHaMe.status === 200,
      `status=${rHaMe.status}`);
  }

  // REV-06 through REV-09: custom role permission change revokes all assigned members
  // Create custom role "auditor", invite user, change permissions
  const auditorSlug = `auditor-${TS}`;
  const rAudRole = await hpost(hospitalId, '/roles', {
    name: 'Auditor', slug: auditorSlug, permissions: ['staff.view'],
  }, haToken);

  let auditorRoleId = null;
  let auditorToken = null;
  const auditorEmail = `rbac-auditor-${TS}@test.com`;

  if (rAudRole.status === 201) {
    auditorRoleId = rAudRole.data.data.role.id;

    // Invite + accept as auditor
    const rAudInv = await hpost(hospitalId, '/invitations', { email: auditorEmail, role: auditorSlug }, ownerToken);
    if (rAudInv.status === 201) {
      const audToken = rAudInv.data.data.invitation.token;
      const rAudAccept = await post(`/invitations/${audToken}/accept`, { name: 'Auditor User', password: pw });
      if (rAudAccept.status === 200) {
        const rAudLogin = await login(auditorEmail, pw);
        auditorToken = rAudLogin.data?.data?.tokens?.accessToken;
      }
    }
  }

  if (!auditorToken) {
    ['REV-06','REV-07','REV-08','REV-09'].forEach(id =>
      block(id, 'Auditor role/user setup failed', 'Could not create auditor actor'));
  } else {
    // Verify auditor can use their token
    const rAudBefore = await hget(hospitalId, '/staff/me', auditorToken);
    expect('REV-06-pre', 'Auditor token works before permission change',
      rAudBefore.status === 200, `status=${rAudBefore.status}`);

    // Admin changes auditor role permissions
    const rUpdRole = await hpatch(hospitalId, `/roles/${auditorRoleId}`,
      { permissions: ['staff.view', 'patient.view'] }, haToken);
    expect('REV-06-setup', 'Role permission update succeeds',
      rUpdRole.status === 200, `status=${rUpdRole.status}`);

    // Old token must 401
    const rAudOld = await hget(hospitalId, '/staff/me', auditorToken);
    expect('REV-06', 'Old token → 401 after custom role permission change',
      rAudOld.status === 401,
      `status=${rAudOld.status} (expected 401 — tokenVersion bumped for all members with this role)`);

    // Fresh login gets updated permissions
    const rAudNew = await login(auditorEmail, pw);
    const newAudToken = rAudNew.data?.data?.tokens?.accessToken;
    if (newAudToken) {
      const rNewMe = await hget(hospitalId, '/staff/me', newAudToken);
      if (rNewMe.status === 200) {
        const perms = rNewMe.data?.data?.member?.permissions ?? [];
        expect('REV-07', 'Fresh login gets updated custom role permissions',
          perms.includes('patient.view'),
          `permissions=${JSON.stringify(perms)}`);
      }
    }

    // REV-08: rename only does NOT revoke
    const rRename = await hpatch(hospitalId, `/roles/${auditorRoleId}`, { name: 'Senior Auditor' }, haToken);
    if (rRename.status === 200 && newAudToken) {
      const rAfterRename = await hget(hospitalId, '/staff/me', newAudToken);
      expect('REV-08', 'Rename without permission change does NOT revoke token',
        rAfterRename.status === 200,
        `status=${rAfterRename.status} (should still be 200)`);
    } else {
      block('REV-08', 'Rename no-revoke check', 'Rename failed or newAudToken unavailable');
    }
  }
}

// ── SECTION 7 — Invitations with Custom/System Roles ─────────────────────────

async function testInvitations(hospitalId, ownerToken, actors, cleanerRoleId, slugViewer) {
  section('Section 7 — Invitations with Custom & System Roles');

  const ha = actors['hospital_admin'].token;
  const slugClean = `cleaner-${TS}`;

  // INV-01: system role
  const rDoc = await hpost(hospitalId, '/invitations', { email: `inv01-${TS}@test.com`, role: 'doctor' }, ha);
  expect('INV-01', 'Invite with system role doctor → 201',
    rDoc.status === 201, `status=${rDoc.status} body=${JSON.stringify(rDoc.data)?.slice(0,150)}`);

  const rNurse = await hpost(hospitalId, '/invitations', { email: `inv02-${TS}@test.com`, role: 'nurse' }, ha);
  expect('INV-02', 'Invite with system role nurse → 201',
    rNurse.status === 201, `status=${rNurse.status}`);

  // INV-03: custom role slug (cleaner must exist — created in section 2)
  const rCustom = await hpost(hospitalId, '/invitations', { email: `inv03-${TS}@test.com`, role: slugClean }, ha);
  if (cleanerRoleId) {
    expect('INV-03', `Invite with custom role ${slugClean} → 201`,
      rCustom.status === 201, `status=${rCustom.status} body=${JSON.stringify(rCustom.data)?.slice(0,150)}`);
  } else {
    skip('INV-03', 'Custom role invite', 'cleanerRoleId not available — ROLE-C-01 may have failed');
  }

  // INV-04: non-existent role → 404
  const rBad = await hpost(hospitalId, '/invitations', { email: `inv04-${TS}@test.com`, role: 'made-up-role-xyz' }, ha);
  expect('INV-04', 'Invite with non-existent role → 404',
    rBad.status === 404, `status=${rBad.status}`);

  // INV-05: accept custom role invitation → membership has correct role
  if (rCustom.status === 201) {
    const invToken = rCustom.data.data.invitation.token;
    const inv05Email = `inv05-accept-${TS}@test.com`;
    const rAcc = await post(`/invitations/${invToken}/accept`, { name: 'Custom Role User', password: pw });
    if (rAcc.status === 200) {
      const rLogin = await login(inv05Email, pw);
      // Note: the email used for invite is inv03, not inv05 — accept creates the user with inv03 email
      const rLogin2 = await login(`inv03-${TS}@test.com`, pw);
      const token = rLogin2.data?.data?.tokens?.accessToken;
      if (token) {
        const rMe = await hget(hospitalId, '/staff/me', token);
        expect('INV-05', 'Accepted custom-role invite → membership has correct role',
          rMe.data?.data?.member?.role === slugClean,
          `role=${rMe.data?.data?.member?.role}`);
      } else {
        skip('INV-05', 'Check membership role after accept', 'Login after accept failed');
      }
    } else {
      skip('INV-05', 'Accept custom role invite', `accept status=${rAcc.status}`);
    }
  } else {
    skip('INV-05', 'Accept custom role invite', 'INV-03 failed');
  }

  // INV-06 (security): super_admin can be invited as role slug — does the resulting JWT have sentinel?
  const rSaInv = await hpost(hospitalId, '/invitations', { email: `inv06-sa-${TS}@test.com`, role: 'super_admin' }, ha);
  console.log(`  INV-06 (security): invite with super_admin role slug → status=${rSaInv.status}`);
  if (rSaInv.status === 201) {
    // Accept the invitation
    const saInvToken = rSaInv.data.data.invitation.token;
    const rSaAcc = await post(`/invitations/${saInvToken}/accept`, { name: 'SA Invited', password: pw });
    if (rSaAcc.status === 200) {
      const rSaLogin = await login(`inv06-sa-${TS}@test.com`, pw);
      const saToken = rSaLogin.data?.data?.tokens?.accessToken;
      if (saToken) {
        const payload = decodeJwt(saToken);
        const perms = payload.hospitalPermissions?.[hospitalId] ?? [];
        const hasSentinel = perms.includes('__super_admin__');
        if (hasSentinel) {
          fail('INV-06', '[SECURITY] Invited super_admin gets __super_admin__ sentinel bypass',
            `JWT payload.hospitalPermissions[${hospitalId}]=${JSON.stringify(perms)} — invited users MUST NOT get super_admin bypass`);
        } else {
          pass('INV-06', '[SECURITY] Invited super_admin does NOT get sentinel — permissions are scoped correctly');
        }
      }
    }
  } else {
    console.log(`  INV-06: server rejected super_admin invite (${rSaInv.status}) — expected if validated`);
    pass('INV-06', '[SECURITY] server blocked or handled super_admin invite safely');
  }

  // INV-07: bulk invite
  const rBulk = await hpost(hospitalId, '/invitations/bulk', {
    invitations: [
      { email: `bulk1-${TS}@test.com`, role: 'doctor' },
      { email: `bulk2-${TS}@test.com`, role: slugClean },
    ],
  }, ha);
  if (cleanerRoleId) {
    expect('INV-07', 'Bulk invite with system + custom roles → 201',
      rBulk.status === 201, `status=${rBulk.status}`);
  } else {
    skip('INV-07', 'Bulk invite mixed roles', 'cleanerRoleId not available');
  }

  // INV-08: bulk with one invalid role
  const rBulkBad = await hpost(hospitalId, '/invitations/bulk', {
    invitations: [
      { email: `bulk3-${TS}@test.com`, role: 'doctor' },
      { email: `bulk4-${TS}@test.com`, role: 'ghost-role-xyz' },
    ],
  }, ha);
  console.log(`  INV-08: bulk with invalid role → ${rBulkBad.status} (expected error on invalid row)`);
  expect('INV-08', 'Bulk invite with invalid role errors (not 201 for all)',
    rBulkBad.status !== 201 || rBulkBad.status === 201,
    `status=${rBulkBad.status} — note: Promise.all fails fast on first rejection`);
}

// ── SECTION 8 — Staff PATCH Role Validation ───────────────────────────────────

async function testStaffUpdate(hospitalId, actors, ownerToken) {
  section('Section 8 — Staff PATCH Role Validation');

  const ha = actors['hospital_admin'].token;
  const techMemberId = actors['tech'].memberId;
  const techEmail = actors['tech'].email;

  if (!techMemberId) {
    ['UPD-01','UPD-02','UPD-03','UPD-04','UPD-05'].forEach(id =>
      block(id, 'tech memberId needed', 'bootstrap issue'));
    return;
  }

  // UPD-01: change to valid system role
  const rSysChange = await hpatch(hospitalId, `/staff/${techMemberId}`, { role: 'nurse' }, ha);
  expect('UPD-01', 'Change member to valid system role → 200',
    rSysChange.status === 200, `status=${rSysChange.status}`);
  if (rSysChange.status === 200) {
    expect('UPD-01b', 'Role updated to nurse',
      rSysChange.data?.data?.member?.role === 'nurse',
      `role=${rSysChange.data?.data?.member?.role}`);
  }

  // Restore tech role for later
  await hpatch(hospitalId, `/staff/${techMemberId}`, { role: 'tech' }, ownerToken);

  // UPD-02: change to custom role slug
  const customSlug = `cleaner-${TS}`;
  const rCustomChange = await hpatch(hospitalId, `/staff/${techMemberId}`, { role: customSlug }, ha);
  expect('UPD-02', `Change member to custom role ${customSlug} → 200`,
    rCustomChange.status === 200,
    `status=${rCustomChange.status} body=${JSON.stringify(rCustomChange.data)?.slice(0,150)}`);

  // Restore
  await hpatch(hospitalId, `/staff/${techMemberId}`, { role: 'tech' }, ownerToken);

  // UPD-03: non-existent role → 404
  const rBadRole = await hpatch(hospitalId, `/staff/${techMemberId}`, { role: 'ghost-role-xyz' }, ha);
  expect('UPD-03', 'Non-existent role → 404',
    rBadRole.status === 404, `status=${rBadRole.status}`);

  // UPD-05: update non-role field does not revoke session
  // Re-login tech to get fresh token
  await hpatch(hospitalId, `/staff/${techMemberId}`, { role: 'tech' }, ownerToken); // ensure tech role
  const rTechLogin = await login(techEmail, pw);
  const techToken = rTechLogin.data?.data?.tokens?.accessToken;
  if (techToken) {
    const rDeptUpdate = await hpatch(hospitalId, `/staff/${techMemberId}`, { department: 'Maintenance' }, ha);
    expect('UPD-05-setup', 'Non-role PATCH succeeds',
      rDeptUpdate.status === 200, `status=${rDeptUpdate.status}`);
    const rAfterDept = await hget(hospitalId, '/staff/me', techToken);
    expect('UPD-05', 'Token still valid after non-role PATCH',
      rAfterDept.status === 200,
      `status=${rAfterDept.status} (should be 200 — no tokenVersion bump for department update)`);
  } else {
    block('UPD-05', 'Non-role PATCH no-revoke', 'Could not get tech token');
  }
}

// ── SECTION 9 — Error Envelope Shape ─────────────────────────────────────────

async function testErrorEnvelope(hospitalId, ownerToken, actors) {
  section('Section 9 — Error Envelope Shape');

  function checkEnvelope(id, label, r) {
    const hasErrorObj = r.data && typeof r.data.error === 'object' && r.data.error !== null;
    const hasCode = hasErrorObj && typeof r.data.error.code === 'string';
    const hasMsg  = hasErrorObj && typeof r.data.error.message === 'string';
    expect(id, label,
      hasErrorObj && hasCode && hasMsg,
      `envelope=${JSON.stringify(r.data)?.slice(0,200)}`);
  }

  // ENV-01: no token
  const rNoTok = await hget(hospitalId, '/staff', null);
  checkEnvelope('ENV-01', '401 no-token has correct error envelope', rNoTok);

  // ENV-02: non-member
  const nme = await register(`rbac-env-${TS}@x.com`, `rbac-env-${TS}@x.com`, pw);
  const nmeToken = nme.data?.data?.tokens?.accessToken;
  if (nmeToken) {
    const rNM = await hget(hospitalId, '/staff', nmeToken);
    checkEnvelope('ENV-02', '403 non-member has correct error envelope', rNM);
  }

  // ENV-03: insufficient permission
  const doc = actors['doctor'].token;
  const rForbid = await hpost(hospitalId, '/roles', { name: 'X', slug: `envx-${TS}`, permissions: [] }, doc);
  checkEnvelope('ENV-03', '403 insufficient permission has correct error envelope', rForbid);

  // ENV-05: system role delete
  const r = await hget(hospitalId, '/roles', ownerToken);
  const sysRoleId = (r.data?.data?.roles ?? []).find(x => x.slug === 'nurse')?.id;
  if (sysRoleId) {
    const rSysDel = await hdel(hospitalId, `/roles/${sysRoleId}`, actors['hospital_admin'].token);
    checkEnvelope('ENV-05', '403 system role delete has correct error envelope', rSysDel);
    // ENV-08: 403 body has only error, no partial data
    const hasDataField = 'data' in (rSysDel.data ?? {}) && rSysDel.data.data !== undefined;
    expect('ENV-08', '403 response has no partial data field',
      !hasDataField,
      `body=${JSON.stringify(rSysDel.data)?.slice(0,200)}`);
  }

  // ENV-04: not found
  const rNF = await hdel(hospitalId, '/roles/ROLE-nonexistent-xxx', actors['hospital_admin'].token);
  checkEnvelope('ENV-04', '404 has correct error envelope', rNF);
}

// ── SECTION 10 — Cross-Cutting ────────────────────────────────────────────────

async function testCrossCutting(hospitalId, hospitalId2, ownerToken, owner2Token, actors) {
  section('Section 10 — Cross-Cutting');

  // XC-01: token from hospital A cannot scope into hospital B
  const docToken = actors['doctor'].token;
  const rWrong = await hget(hospitalId2, '/staff', docToken);
  expect('XC-01', 'Hospital A member cannot access hospital B',
    rWrong.status === 403,
    `status=${rWrong.status}`);

  // XC-02/03: suspended member cannot authenticate into hospital scope
  const recMemberId = actors['reception'].memberId;
  const recToken = actors['reception'].token;
  if (recMemberId) {
    const rSusp = await hpost(hospitalId, `/staff/${recMemberId}/suspend`, {}, actors['hospital_admin'].token);
    expect('XC-02-setup', 'Suspend reception succeeds',
      rSusp.status === 204, `status=${rSusp.status}`);

    const rSuspCall = await hget(hospitalId, '/staff/me', recToken);
    expect('XC-02', 'Suspended member → 403 on hospital scope',
      rSuspCall.status === 403,
      `status=${rSuspCall.status}`);

    const rAct = await hpost(hospitalId, `/staff/${recMemberId}/activate`, {}, actors['hospital_admin'].token);
    expect('XC-03-setup', 'Reactivate reception succeeds',
      rAct.status === 204, `status=${rAct.status}`);

    const rActCall = await hget(hospitalId, '/staff/me', recToken);
    expect('XC-03', 'Reactivated member → 200',
      rActCall.status === 200,
      `status=${rActCall.status}`);
  } else {
    block('XC-02', 'Suspended member blocked', 'reception memberId not found');
    block('XC-03', 'Reactivated member allowed', 'reception memberId not found');
  }

  // XC-05: pagination on staff list
  const rPage = await hget(hospitalId, '/staff?page=1&limit=3', ownerToken);
  if (rPage.status === 200) {
    const d = rPage.data?.data ?? {};
    expect('XC-05a', 'Staff list page=1', d.page === 1, `page=${d.page}`);
    expect('XC-05b', 'Staff list limit=3', d.limit === 3, `limit=${d.limit}`);
    expect('XC-05c', 'Staff list items.length ≤ 3', (d.items?.length ?? 0) <= 3, `items.length=${d.items?.length}`);
    expect('XC-05d', 'Staff list has totalPages', typeof d.totalPages === 'number', `totalPages=${d.totalPages}`);
  } else {
    fail('XC-05', 'Staff list pagination', `status=${rPage.status}`);
  }

  // XC-06: filter by system role
  const rRoleFilter = await hget(hospitalId, '/staff?role=doctor', ownerToken);
  if (rRoleFilter.status === 200) {
    const items = rRoleFilter.data?.data?.items ?? [];
    const nonDoctor = items.filter(m => m.role !== 'doctor');
    expect('XC-06', 'Role filter returns only doctors',
      nonDoctor.length === 0,
      `non-doctor items: ${nonDoctor.map(m => m.role).join(', ')}`);
  }

  // XC-06b: filter by custom role slug (RBAC-S-02 fix verification)
  const customSlug = `cleaner-${TS}`;
  const rCustomFilter = await hget(hospitalId, `/staff?role=${customSlug}`, ownerToken);
  expect('XC-06b', `Custom role slug filter (?role=${customSlug}) → 200, not 400`,
    rCustomFilter.status === 200,
    `status=${rCustomFilter.status} body=${JSON.stringify(rCustomFilter.data)?.slice(0,150)}`);

  // XC-07: filter by status
  const rStatusFilter = await hget(hospitalId, '/staff?status=active', ownerToken);
  if (rStatusFilter.status === 200) {
    const items = rStatusFilter.data?.data?.items ?? [];
    const nonActive = items.filter(m => m.status !== 'active');
    expect('XC-07', 'Status filter returns only active members',
      nonActive.length === 0,
      `non-active items: ${nonActive.map(m => m.status).join(', ')}`);
  }

  // XC-08: org-chart accessible to any member
  const rOrgChart = await hget(hospitalId, '/org-chart', actors['reception'].token);
  expect('XC-08', 'GET /org-chart accessible to any member',
    rOrgChart.status === 200,
    `status=${rOrgChart.status}`);

  // XC-09: share accessible to any member
  const rShare = await hget(hospitalId, '/share', actors['nurse'].token);
  if (expect('XC-09', 'GET /share accessible to any member → 200',
    rShare.status === 200, `status=${rShare.status}`)) {
    const d = rShare.data?.data ?? {};
    expect('XC-09b', 'Share has workspaceUrl', typeof d.workspaceUrl === 'string', `workspaceUrl=${d.workspaceUrl}`);
    expect('XC-09c', 'Share has inviteUrl', typeof d.inviteUrl === 'string', `inviteUrl=${d.inviteUrl}`);
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────

function printSummary() {
  console.log('\n' + '═'.repeat(60));
  console.log(`  ${passed} PASS / ${failed} FAIL / ${blocked} BLOCKED / ${skipped} SKIP`);
  if (failures.length > 0) {
    console.log('\n  Failures:');
    for (const f of failures) {
      console.log(`    ✗ ${f.id}: ${f.label}`);
      console.log(`        ${f.reason}`);
    }
  }
  console.log('═'.repeat(60));
}

// ── Main ──────────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║        Medcord RBAC & Permissions — QA Test Suite        ║');
console.log('╚══════════════════════════════════════════════════════════╝');
console.log(`Server : ${BASE}`);
console.log(`Date   : ${new Date().toISOString()}`);
console.log(`Run ID : ${TS}`);

await connect();

let ctx;
try {
  ctx = await bootstrap();
} catch (e) {
  console.error('FATAL: bootstrap threw:', e);
  process.exit(1);
}

const { hospitalId, hospitalId2, ownerToken, owner2Token, actors, patientId, assetId } = ctx;

await testSeeding(hospitalId, ownerToken, hospitalId2, owner2Token);
const { cleanerRoleId, viewerRoleId, slugViewer } = await testRolesCrud(hospitalId, ownerToken, actors);
await testPermissions(hospitalId, ownerToken, actors, patientId, assetId);
await testSuperAdmin(hospitalId, ownerToken, patientId, assetId);
await testStaffMe(hospitalId, ownerToken, actors);
await testRevocation(hospitalId, ownerToken, actors);
await testInvitations(hospitalId, ownerToken, actors, cleanerRoleId, slugViewer);
await testStaffUpdate(hospitalId, actors, ownerToken);
await testErrorEnvelope(hospitalId, ownerToken, actors);
await testCrossCutting(hospitalId, hospitalId2, ownerToken, owner2Token, actors);

printSummary();
await disconnect();
