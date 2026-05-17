/**
 * role-view.test.mjs — Role View + Member Counts QA Test Suite
 *
 * Scope:
 *   1 — GET /roles memberCount field (presence, shape)
 *   2 — memberCount accuracy (invite, suspend, reactivate, hospital isolation)
 *   3 — BUG-RE-01: system role permission edit reflected at next login
 *   4 — super_admin bypass unaffected by resolvePermissions() change
 *
 * Plan: docs/qas/backend/plans/role-view-test-plan.md
 * Handoff: docs/qas/backend/role-view-handoff.md
 *
 * Usage: node role-view.test.mjs
 */

import { api, get, post, patch, BASE } from './api.mjs';

// ── Runner ────────────────────────────────────────────────────────────────────

let passed = 0, failed = 0, blocked = 0;
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

function section(name) {
  console.log(`\n══ ${name} ${'═'.repeat(Math.max(0, 60 - name.length))}`);
}

function expect(id, label, condition, detail = '') {
  if (condition) pass(id, label);
  else fail(id, label, detail);
  return condition;
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

const hapi  = (hid, path, opts = {}) => api(`/hospitals/${hid}${path}`, opts);
const hget  = (hid, path, token)       => hapi(hid, path, { token });
const hpost = (hid, path, body, token) => hapi(hid, path, { method: 'POST', body, token });
const hpatch= (hid, path, body, token) => hapi(hid, path, { method: 'PATCH', body, token });

function login(email, password) { return post('/auth/login', { email, password }); }
function register(name, email, password) { return post('/auth/register', { name, email, password }); }

function decodeJwt(token) {
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

const TS = Date.now();
const PW = 'RoleView123!';

async function bootstrap() {
  console.log('\n── Bootstrap ────────────────────────────────────────────────');

  // Owner + hospital 1
  const ownerEmail = `rv-owner-${TS}@test.com`;
  const rOwner = await register('RV Owner', ownerEmail, PW);
  if (rOwner.status !== 201) { console.error('FATAL: register', rOwner.status, rOwner.data); process.exit(1); }
  const ownerToken0 = rOwner.data.data.tokens.accessToken;

  const rHosp = await post('/hospitals', {
    name: `RV Hospital ${TS}`, type: 'general',
    location: 'Test City', subdomain: `rv-h-${TS}`,
  }, ownerToken0);
  if (rHosp.status !== 201) { console.error('FATAL: hospital', rHosp.status, rHosp.data); process.exit(1); }
  const hospitalId = rHosp.data.data.hospital.id;
  console.log(`  Hospital 1: ${hospitalId}`);

  await get(`/hospitals/${hospitalId}`, ownerToken0);
  const rOwnerLogin = await login(ownerEmail, PW);
  const ownerToken = rOwnerLogin.data.data.tokens.accessToken;

  // Invite + accept: hospital_admin, doctor (x2), nurse
  const toInvite = ['hospital_admin', 'doctor', 'doctor', 'nurse'];
  const actors = {};
  let doctorCount = 0;

  for (const role of toInvite) {
    const suffix = role === 'doctor' ? `-${++doctorCount}` : '';
    const email = `rv-${role.replace(/_/g, '-')}${suffix}-${TS}@test.com`;
    const rInv = await hpost(hospitalId, '/invitations', { email, role }, ownerToken);
    if (rInv.status !== 201) { console.error(`FATAL: invite ${role}`, rInv.status, rInv.data); process.exit(1); }
    const invToken = rInv.data.data.invitation.token;
    const rAccept = await post(`/invitations/${invToken}/accept`, { name: `RV ${role}${suffix}`, password: PW });
    if (rAccept.status !== 200) { console.error(`FATAL: accept ${role}`, rAccept.status, rAccept.data); process.exit(1); }
    const rLogin = await login(email, PW);
    if (rLogin.status !== 200) { console.error(`FATAL: login ${role}`, rLogin.status, rLogin.data); process.exit(1); }
    const token = rLogin.data.data.tokens.accessToken;
    const rStaff = await hget(hospitalId, '/staff', ownerToken);
    const member = rStaff.data?.data?.items?.find(m => m.email === email);
    const key = role === 'doctor' ? `doctor${doctorCount}` : role;
    actors[key] = { email, token, memberId: member?.id ?? null };
    console.log(`  ${key}: memberId=${actors[key].memberId}`);
  }

  // Fetch system doctor role ID
  const rRoles = await hget(hospitalId, '/roles', ownerToken);
  const allRoles = rRoles.data?.data?.roles ?? [];
  const doctorRole = allRoles.find(r => r.slug === 'doctor');
  if (!doctorRole) { console.error('FATAL: doctor role not found'); process.exit(1); }

  // Create a custom role with no members
  const customSlug = `custom-rv-${TS}`;
  const rCustom = await hpost(hospitalId, '/roles', {
    name: 'RV Custom', slug: customSlug, permissions: ['staff.view'],
  }, ownerToken);
  const customRoleId = rCustom.status === 201 ? rCustom.data.data.role.id : null;

  // Hospital 2 (isolation)
  const owner2Email = `rv-owner2-${TS}@test.com`;
  const rOwner2 = await register('RV Owner2', owner2Email, PW);
  const owner2Token0 = rOwner2.data.data.tokens.accessToken;
  const rHosp2 = await post('/hospitals', {
    name: `RV Hospital2 ${TS}`, type: 'clinic',
    location: 'Kumasi', subdomain: `rv-h2-${TS}`,
  }, owner2Token0);
  if (rHosp2.status !== 201) { console.error('FATAL: hospital2', rHosp2.status, rHosp2.data); process.exit(1); }
  const hospitalId2 = rHosp2.data.data.hospital.id;
  await get(`/hospitals/${hospitalId2}`, owner2Token0);
  const rOwner2Login = await login(owner2Email, PW);
  const owner2Token = rOwner2Login.data.data.tokens.accessToken;

  // Invite one doctor to hospital 2
  const h2DocEmail = `rv-h2-doc-${TS}@test.com`;
  const rH2Inv = await hpost(hospitalId2, '/invitations', { email: h2DocEmail, role: 'doctor' }, owner2Token);
  if (rH2Inv.status === 201) {
    const h2InvToken = rH2Inv.data.data.invitation.token;
    await post(`/invitations/${h2InvToken}/accept`, { name: 'RV H2 Doc', password: PW });
  }

  // Patient for EMR test (ROLE-V-04f)
  let patientId = null;
  const rPat = await hpost(hospitalId, '/patients', {
    demographics: { firstName: 'Test', lastName: 'Patient', dateOfBirth: '1990-01-01', sex: 'male' },
  }, ownerToken);
  if (rPat.status === 201) patientId = rPat.data.data.patient.id;

  console.log(`\n  doctorRole: ${doctorRole.id} (${doctorRole.permissions.length} perms)`);
  console.log(`  customRole: ${customRoleId}`);
  console.log(`  Hospital 2: ${hospitalId2}`);
  console.log(`  Patient: ${patientId}`);
  console.log('\n  Bootstrap complete.\n');

  return { hospitalId, hospitalId2, ownerToken, owner2Token, actors, doctorRole, customRoleId, patientId };
}

// ── Section 1 — memberCount field presence & shape ───────────────────────────

async function testMemberCountField(hospitalId, ownerToken, customRoleId) {
  section('Section 1 — memberCount field presence & shape');

  const r = await hget(hospitalId, '/roles', ownerToken);
  if (!expect('ROLE-V-01-status', 'GET /roles → 200', r.status === 200, `status=${r.status}`)) {
    ['ROLE-V-01a','ROLE-V-01b','ROLE-V-01c','ROLE-V-01d'].forEach(id =>
      block(id, 'Depends on GET /roles', 'request failed'));
    return;
  }

  const roles = r.data?.data?.roles ?? [];

  expect('ROLE-V-01a', 'Every role has memberCount field',
    roles.length > 0 && roles.every(role => 'memberCount' in role),
    `roles missing memberCount: ${roles.filter(r => !('memberCount' in r)).map(r => r.slug).join(', ')}`);

  expect('ROLE-V-01b', 'memberCount is always a non-negative integer',
    roles.every(role => Number.isInteger(role.memberCount) && role.memberCount >= 0),
    `bad values: ${roles.filter(r => !Number.isInteger(r.memberCount) || r.memberCount < 0).map(r => `${r.slug}=${r.memberCount}`).join(', ')}`);

  const saRole = roles.find(r => r.slug === 'super_admin');
  expect('ROLE-V-01c', 'super_admin role has memberCount (≥ 1 for founder)',
    saRole && Number.isInteger(saRole.memberCount) && saRole.memberCount >= 1,
    `super_admin.memberCount=${saRole?.memberCount}`);

  if (customRoleId) {
    const customRole = roles.find(r => r.id === customRoleId);
    expect('ROLE-V-01d', 'Custom role with no members has memberCount: 0',
      customRole?.memberCount === 0,
      `memberCount=${customRole?.memberCount}`);
  } else {
    block('ROLE-V-01d', 'Custom role zero-count check', 'no custom role from bootstrap');
  }
}

// ── Section 2 — memberCount accuracy ─────────────────────────────────────────

async function testMemberCountAccuracy(hospitalId, hospitalId2, ownerToken, owner2Token, actors, doctorRole) {
  section('Section 2 — memberCount accuracy');

  // Baseline doctor count (we invited 2 doctors)
  const rBase = await hget(hospitalId, '/roles', ownerToken);
  const rolesBase = rBase.data?.data?.roles ?? [];
  const docBase = rolesBase.find(r => r.slug === 'doctor');
  const baseCount = docBase?.memberCount ?? null;

  expect('ROLE-V-02-baseline', 'Doctor memberCount = 2 (2 doctors invited in bootstrap)',
    baseCount === 2,
    `memberCount=${baseCount}`);

  // Invite + accept a 3rd doctor
  const newDocEmail = `rv-doc3-${TS}@test.com`;
  const rInv = await hpost(hospitalId, '/invitations', { email: newDocEmail, role: 'doctor' }, ownerToken);
  let newDocMemberId = null;
  if (rInv.status === 201) {
    const invToken = rInv.data.data.invitation.token;
    await post(`/invitations/${invToken}/accept`, { name: 'RV Doc3', password: PW });
    const rStaff = await hget(hospitalId, '/staff', ownerToken);
    const m = rStaff.data?.data?.items?.find(m => m.email === newDocEmail);
    newDocMemberId = m?.id ?? null;
  }

  // ROLE-V-02a: count increments after invite
  const rAfterInvite = await hget(hospitalId, '/roles', ownerToken);
  const docAfterInvite = (rAfterInvite.data?.data?.roles ?? []).find(r => r.slug === 'doctor');
  expect('ROLE-V-02a', 'doctor memberCount increments after new member joins',
    docAfterInvite?.memberCount === (baseCount ?? 0) + 1,
    `before=${baseCount}, after=${docAfterInvite?.memberCount}`);

  // ROLE-V-02b: suspend → count decrements
  if (newDocMemberId) {
    const rSusp = await hpost(hospitalId, `/staff/${newDocMemberId}/suspend`, {}, ownerToken);
    expect('ROLE-V-02b-setup', 'Suspend new doctor succeeds',
      rSusp.status === 204, `status=${rSusp.status}`);

    const rAfterSusp = await hget(hospitalId, '/roles', ownerToken);
    const docAfterSusp = (rAfterSusp.data?.data?.roles ?? []).find(r => r.slug === 'doctor');
    expect('ROLE-V-02b', 'Suspended member not counted in memberCount',
      docAfterSusp?.memberCount === baseCount,
      `expected=${baseCount}, got=${docAfterSusp?.memberCount}`);

    // ROLE-V-02c: reactivate → count back up
    const rAct = await hpost(hospitalId, `/staff/${newDocMemberId}/activate`, {}, ownerToken);
    expect('ROLE-V-02c-setup', 'Reactivate succeeds', rAct.status === 204, `status=${rAct.status}`);

    const rAfterAct = await hget(hospitalId, '/roles', ownerToken);
    const docAfterAct = (rAfterAct.data?.data?.roles ?? []).find(r => r.slug === 'doctor');
    expect('ROLE-V-02c', 'Reactivated member counted again',
      docAfterAct?.memberCount === (baseCount ?? 0) + 1,
      `expected=${(baseCount ?? 0) + 1}, got=${docAfterAct?.memberCount}`);
  } else {
    block('ROLE-V-02b', 'Suspend reduces count', 'could not get new doctor memberId');
    block('ROLE-V-02c', 'Reactivate restores count', 'could not get new doctor memberId');
  }

  // ROLE-V-02d: hospital isolation — H2 doctor count doesn't bleed into H1
  const rH2 = await hget(hospitalId2, '/roles', owner2Token);
  const h2Doctor = (rH2.data?.data?.roles ?? []).find(r => r.slug === 'doctor');
  const rH1 = await hget(hospitalId, '/roles', ownerToken);
  const h1Doctor = (rH1.data?.data?.roles ?? []).find(r => r.slug === 'doctor');

  expect('ROLE-V-02d', 'memberCount is per-hospital (H2 doctor count does not appear in H1)',
    h2Doctor !== undefined && h1Doctor !== undefined && h2Doctor.memberCount !== h1Doctor.memberCount,
    `H1 doctor=${h1Doctor?.memberCount}, H2 doctor=${h2Doctor?.memberCount} (should differ — H2 has 1 doctor, H1 has ${h1Doctor?.memberCount})`);
}

// ── Section 3 — BUG-RE-01: system role permission edit reflected at next login ─

async function testBugRe01(hospitalId, ownerToken, actors, doctorRole, patientId) {
  section('Section 3 — BUG-RE-01: System role permission edit reflected at next login');

  const doctorRoleId = doctorRole.id;
  const originalPerms = doctorRole.permissions;
  const doctorEmail = actors['doctor1'].email;

  // Login as doctor1 fresh
  const rDocLogin = await login(doctorEmail, PW);
  if (rDocLogin.status !== 200) {
    ['ROLE-V-04a','ROLE-V-04b','ROLE-V-04c','ROLE-V-04d','ROLE-V-04e','ROLE-V-04f','ROLE-V-04g'].forEach(id =>
      block(id, 'Need doctor login', `login status=${rDocLogin.status}`));
    return;
  }
  const oldDocToken = rDocLogin.data.data.tokens.accessToken;

  // ROLE-V-04a: fresh token has full permission set
  const rMe0 = await hget(hospitalId, '/staff/me', oldDocToken);
  const ok04a = expect('ROLE-V-04a', 'Fresh doctor token has full default permission set',
    rMe0.status === 200 && (rMe0.data?.data?.member?.permissions?.length ?? 0) >= 10,
    `status=${rMe0.status}, perms=${rMe0.data?.data?.member?.permissions?.length}`);

  // ROLE-V-04b: patch permissions
  const patchedPerms = ['patient.view', 'staff.view'];
  const rPatch = await hpatch(hospitalId, `/roles/${doctorRoleId}`, { permissions: patchedPerms }, ownerToken);
  const ok04b = expect('ROLE-V-04b', 'PATCH doctor role permissions → 200',
    rPatch.status === 200,
    `status=${rPatch.status} body=${JSON.stringify(rPatch.data)?.slice(0,200)}`);

  if (ok04b) {
    const patchedRole = rPatch.data?.data?.role;
    expect('ROLE-V-04b-perms', 'Patched permissions in response match sent array',
      JSON.stringify(patchedRole?.permissions?.slice().sort()) === JSON.stringify(patchedPerms.slice().sort()),
      `got=${JSON.stringify(patchedRole?.permissions)}`);
  }

  // ROLE-V-04c: GET /roles reflects the patch
  const rRoles = await hget(hospitalId, '/roles', ownerToken);
  const docInList = (rRoles.data?.data?.roles ?? []).find(r => r.slug === 'doctor');
  expect('ROLE-V-04c', 'GET /roles shows patched permissions on doctor role',
    JSON.stringify(docInList?.permissions?.slice().sort()) === JSON.stringify(patchedPerms.slice().sort()),
    `got=${JSON.stringify(docInList?.permissions)}`);

  // ROLE-V-04d: old token → 401
  const rOldToken = await hget(hospitalId, '/staff/me', oldDocToken);
  expect('ROLE-V-04d', 'Old doctor token → 401 after permission change',
    rOldToken.status === 401,
    `status=${rOldToken.status}`);

  // ROLE-V-04e: fresh login → new token has patched permissions
  const rDocLogin2 = await login(doctorEmail, PW);
  if (rDocLogin2.status !== 200) {
    ['ROLE-V-04e','ROLE-V-04f'].forEach(id =>
      block(id, 'Re-login needed', `status=${rDocLogin2.status}`));
  } else {
    const newDocToken = rDocLogin2.data.data.tokens.accessToken;
    const rMe2 = await hget(hospitalId, '/staff/me', newDocToken);
    const ok04e = expect('ROLE-V-04e', 'Fresh login → /staff/me returns patched permissions only',
      rMe2.status === 200, `status=${rMe2.status}`);

    if (ok04e) {
      const perms = rMe2.data?.data?.member?.permissions ?? [];
      expect('ROLE-V-04e-perms', 'Permissions = ["patient.view","staff.view"] — not original 23',
        perms.length === 2 &&
        perms.includes('patient.view') &&
        perms.includes('staff.view') &&
        !perms.includes('emr.view'),
        `permissions=${JSON.stringify(perms)}`);
    }

    // ROLE-V-04f: emr.view-gated endpoint now returns 403
    if (patientId) {
      const rChart = await hget(hospitalId, `/patients/${patientId}/chart`, newDocToken);
      expect('ROLE-V-04f', 'New token blocked from emr.view endpoint (GET /chart → 403)',
        rChart.status === 403,
        `status=${rChart.status}`);
    } else {
      block('ROLE-V-04f', 'emr.view enforcement check', 'no patient created in bootstrap');
    }
  }

  // ROLE-V-04g: restore original permissions; re-login; full perm set back
  await hpatch(hospitalId, `/roles/${doctorRoleId}`, { permissions: originalPerms }, ownerToken);
  const rDocLogin3 = await login(doctorEmail, PW);
  if (rDocLogin3.status === 200) {
    const restoredToken = rDocLogin3.data.data.tokens.accessToken;
    const rMe3 = await hget(hospitalId, '/staff/me', restoredToken);
    expect('ROLE-V-04g', 'After restore + re-login, full default permission set returned',
      rMe3.status === 200 && (rMe3.data?.data?.member?.permissions?.length ?? 0) >= 10,
      `perms=${rMe3.data?.data?.member?.permissions?.length}`);
  } else {
    block('ROLE-V-04g', 'Restore + re-login', `login status=${rDocLogin3.status}`);
  }
  console.log('  (doctor permissions restored)');
}

// ── Section 4 — super_admin bypass unaffected ─────────────────────────────────

async function testSuperAdminBypass(hospitalId, ownerToken) {
  section('Section 4 — super_admin bypass unaffected');

  // ROLE-V-06a: GET /staff/me → permissions: null
  const rMe = await hget(hospitalId, '/staff/me', ownerToken);
  expect('ROLE-V-06a', 'super_admin GET /staff/me → permissions: null',
    rMe.status === 200 && rMe.data?.data?.member?.permissions === null,
    `status=${rMe.status}, permissions=${JSON.stringify(rMe.data?.data?.member?.permissions)}`);

  // ROLE-V-06b: JWT contains __super_admin__ sentinel
  const payload = decodeJwt(ownerToken);
  const perms = payload.hospitalPermissions?.[hospitalId] ?? [];
  expect('ROLE-V-06b', 'JWT hospitalPermissions contains __super_admin__ sentinel',
    Array.isArray(perms) && perms.includes('__super_admin__'),
    `hospitalPermissions[${hospitalId}]=${JSON.stringify(perms)}`);

  // ROLE-V-06c: settings.update-gated endpoint still works
  const rPatch = await patch(`/hospitals/${hospitalId}`, { name: `RV Hosp Updated ${Date.now()}` }, ownerToken);
  expect('ROLE-V-06c', 'super_admin can call settings.update-gated endpoint → 2xx',
    rPatch.status >= 200 && rPatch.status < 300,
    `status=${rPatch.status}`);
}

// ── Summary ───────────────────────────────────────────────────────────────────

function printSummary() {
  console.log('\n' + '═'.repeat(60));
  console.log(`  ${passed} PASS / ${failed} FAIL / ${blocked} BLOCKED`);
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
console.log('║    Medcord Role View + Member Counts — QA Test Suite     ║');
console.log('╚══════════════════════════════════════════════════════════╝');
console.log(`Server : ${BASE}`);
console.log(`Date   : ${new Date().toISOString()}`);
console.log(`Run ID : ${TS}`);

let ctx;
try {
  ctx = await bootstrap();
} catch (e) {
  console.error('FATAL: bootstrap threw:', e);
  process.exit(1);
}

const { hospitalId, hospitalId2, ownerToken, owner2Token, actors, doctorRole, customRoleId, patientId } = ctx;

await testMemberCountField(hospitalId, ownerToken, customRoleId);
await testMemberCountAccuracy(hospitalId, hospitalId2, ownerToken, owner2Token, actors, doctorRole);
await testBugRe01(hospitalId, ownerToken, actors, doctorRole, patientId);
await testSuperAdminBypass(hospitalId, ownerToken);

printSummary();
