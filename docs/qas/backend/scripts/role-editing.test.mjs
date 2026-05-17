/**
 * role-editing.test.mjs — Role Editing QA Test Suite
 *
 * Scope: PATCH /hospitals/:hospitalId/roles/:roleId — system role permission editing
 *
 * Sections:
 *   1 — System Role Permission Update
 *   2 — Custom Role Update (regression)
 *   3 — Permission Guard
 *   4 — Delete Regression
 *   5 — Session Revocation on System Role Permission Change
 *   6 — Error Envelope
 *
 * Plan: docs/qas/backend/plans/role-editing-test-plan.md
 * Handoff: docs/qas/backend/role-editing-handoff.md
 *
 * Usage: node role-editing.test.mjs
 */

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

function section(name) {
  console.log(`\n══ ${name} ${'═'.repeat(Math.max(0, 60 - name.length))}`);
}

function expect(id, label, condition, detail = '') {
  if (condition) pass(id, label);
  else fail(id, label, detail);
  return condition;
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

const hapi = (hid, path, opts = {}) => api(`/hospitals/${hid}${path}`, opts);
const hget  = (hid, path, token)       => hapi(hid, path, { token });
const hpost = (hid, path, body, token) => hapi(hid, path, { method: 'POST', body, token });
const hpatch= (hid, path, body, token) => hapi(hid, path, { method: 'PATCH', body, token });
const hdel  = (hid, path, token)       => hapi(hid, path, { method: 'DELETE', token });

function login(email, password) {
  return post('/auth/login', { email, password });
}

function register(name, email, password) {
  return post('/auth/register', { name, email, password });
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

const TS = Date.now();
const PW = 'RoleEdit123!';

async function bootstrap() {
  console.log('\n── Bootstrap ────────────────────────────────────────────────');

  // Register owner + create hospital
  const ownerEmail = `re-owner-${TS}@test.com`;
  const rOwner = await register('RE Owner', ownerEmail, PW);
  if (rOwner.status !== 201) {
    console.error('FATAL: owner register failed', rOwner.status, JSON.stringify(rOwner.data));
    process.exit(1);
  }
  const ownerToken0 = rOwner.data.data.tokens.accessToken;

  const rHosp = await post('/hospitals', {
    name: `RE Hospital ${TS}`,
    type: 'general',
    location: 'Test City, Ghana',
    subdomain: `re-h-${TS}`,
  }, ownerToken0);
  if (rHosp.status !== 201) {
    console.error('FATAL: create hospital failed', rHosp.status, JSON.stringify(rHosp.data));
    process.exit(1);
  }
  const hospitalId = rHosp.data.data.hospital.id;
  console.log(`  Hospital: ${hospitalId}`);

  // Trigger seeding
  await get(`/hospitals/${hospitalId}`, ownerToken0);

  // Re-login owner (super_admin)
  const rOwnerLogin = await login(ownerEmail, PW);
  const ownerToken = rOwnerLogin.data.data.tokens.accessToken;
  console.log('  Owner logged in (super_admin)');

  // Invite + accept hospital_admin, doctor, nurse
  const roles = ['hospital_admin', 'doctor', 'nurse'];
  const actors = {};

  for (const role of roles) {
    const email = `re-${role.replace(/_/g, '-')}-${TS}@test.com`;
    const rInv = await hpost(hospitalId, '/invitations', { email, role }, ownerToken);
    if (rInv.status !== 201) {
      console.error(`FATAL: invite ${role} failed`, rInv.status, JSON.stringify(rInv.data));
      process.exit(1);
    }
    const invToken = rInv.data.data.invitation.token;
    const rAccept = await post(`/invitations/${invToken}/accept`, { name: `RE ${role}`, password: PW });
    if (rAccept.status !== 200) {
      console.error(`FATAL: accept ${role} failed`, rAccept.status, JSON.stringify(rAccept.data));
      process.exit(1);
    }
    const rLogin = await login(email, PW);
    if (rLogin.status !== 200) {
      console.error(`FATAL: login ${role} failed`, rLogin.status, JSON.stringify(rLogin.data));
      process.exit(1);
    }
    const token = rLogin.data.data.tokens.accessToken;
    const rStaff = await hget(hospitalId, '/staff', ownerToken);
    const member = rStaff.data?.data?.items?.find(m => m.email === email);
    actors[role] = { email, token, memberId: member?.id ?? null };
    console.log(`  ${role}: memberId=${actors[role].memberId}`);
  }

  // Fetch all roles and find system doctor role ID
  const rRoles = await hget(hospitalId, '/roles', ownerToken);
  const allRoles = rRoles.data?.data?.roles ?? [];
  const doctorRole = allRoles.find(r => r.slug === 'doctor');
  if (!doctorRole) {
    console.error('FATAL: could not find system doctor role');
    process.exit(1);
  }
  console.log(`  System doctor role: ${doctorRole.id} (permissions: ${doctorRole.permissions.length})`);

  // Create a custom role for regression tests
  const customSlug = `cleaner-re-${TS}`;
  const rCustom = await hpost(hospitalId, '/roles', {
    name: 'Cleaner RE',
    slug: customSlug,
    permissions: ['staff.view', 'notifications.view'],
  }, ownerToken);
  let customRoleId = null;
  let customRoleName = 'Cleaner RE';
  if (rCustom.status === 201) {
    customRoleId = rCustom.data.data.role.id;
    console.log(`  Custom role (cleaner): ${customRoleId}`);
  } else {
    console.warn(`  WARN: custom role creation failed (${rCustom.status}) — Section 2 tests will be blocked`);
  }

  console.log('\n  Bootstrap complete.\n');
  return { hospitalId, ownerToken, actors, doctorRole, customRoleId, customSlug, customRoleName };
}

// ── Section 1 — System Role Permission Update ─────────────────────────────────

async function testSystemRoleUpdate(hospitalId, ownerToken, actors, doctorRole) {
  section('Section 1 — System Role Permission Update');

  const ha = actors['hospital_admin'].token;
  const doctorRoleId = doctorRole.id;
  const originalName = doctorRole.name;
  const originalPerms = doctorRole.permissions;

  // ROLE-E-01: Update permissions on a system role
  const newPerms = ['staff.view', 'patient.view'];
  const r01 = await hpatch(hospitalId, `/roles/${doctorRoleId}`, { permissions: newPerms }, ha);
  const ok01 = expect('ROLE-E-01', 'PATCH system role permissions → 200',
    r01.status === 200,
    `status=${r01.status} body=${JSON.stringify(r01.data)?.slice(0,200)}`);

  if (ok01) {
    const role = r01.data?.data?.role;
    expect('ROLE-E-01b', 'Returned permissions match sent array',
      JSON.stringify(role?.permissions?.slice().sort()) === JSON.stringify(newPerms.slice().sort()),
      `got=${JSON.stringify(role?.permissions)}`);
    expect('ROLE-E-01c', 'isSystem remains true',
      role?.isSystem === true,
      `isSystem=${role?.isSystem}`);
    expect('ROLE-E-01d', 'name unchanged in response',
      role?.name === originalName,
      `name=${role?.name}, expected=${originalName}`);
  } else {
    ['ROLE-E-01b','ROLE-E-01c','ROLE-E-01d'].forEach(id => block(id, 'Depends on ROLE-E-01', 'ROLE-E-01 failed'));
  }

  // ROLE-E-01e: Persisted — GET /roles shows updated permissions
  const rList = await hget(hospitalId, '/roles', ownerToken);
  const doctorInList = (rList.data?.data?.roles ?? []).find(r => r.slug === 'doctor');
  expect('ROLE-E-01e', 'GET /roles shows updated permissions after PATCH',
    JSON.stringify(doctorInList?.permissions?.slice().sort()) === JSON.stringify(newPerms.slice().sort()),
    `got=${JSON.stringify(doctorInList?.permissions)}`);

  // ROLE-E-02: Name + permissions sent — name is ignored for system roles
  const r02 = await hpatch(hospitalId, `/roles/${doctorRoleId}`, {
    name: 'Changed Name',
    permissions: ['staff.view'],
  }, ha);
  const ok02 = expect('ROLE-E-02', 'PATCH system role with name+permissions → 200',
    r02.status === 200,
    `status=${r02.status}`);
  if (ok02) {
    const role = r02.data?.data?.role;
    expect('ROLE-E-02b', 'name is unchanged (ignored for system roles)',
      role?.name === originalName,
      `name=${role?.name}, expected=${originalName}`);
    expect('ROLE-E-02c', 'permissions updated to sent array',
      JSON.stringify(role?.permissions?.slice().sort()) === JSON.stringify(['staff.view']),
      `got=${JSON.stringify(role?.permissions)}`);
  }

  // ROLE-E-03: Only name sent — no-op for system role
  const rBefore03 = await hget(hospitalId, '/roles', ownerToken);
  const doctorBefore = (rBefore03.data?.data?.roles ?? []).find(r => r.slug === 'doctor');
  const r03 = await hpatch(hospitalId, `/roles/${doctorRoleId}`, { name: 'Changed Name' }, ha);
  const ok03 = expect('ROLE-E-03', 'PATCH system role with name only → 200',
    r03.status === 200,
    `status=${r03.status}`);
  if (ok03) {
    const role = r03.data?.data?.role;
    expect('ROLE-E-03b', 'name still unchanged after name-only PATCH',
      role?.name === originalName,
      `name=${role?.name}, expected=${originalName}`);
    expect('ROLE-E-03c', 'permissions unchanged after name-only PATCH',
      JSON.stringify(role?.permissions?.slice().sort()) === JSON.stringify((doctorBefore?.permissions ?? []).slice().sort()),
      `got=${JSON.stringify(role?.permissions)}, before=${JSON.stringify(doctorBefore?.permissions)}`);
  }

  // ROLE-E-03d: Empty object — no-op
  const r03d = await hpatch(hospitalId, `/roles/${doctorRoleId}`, {}, ha);
  expect('ROLE-E-03d', 'PATCH system role with empty body → 200',
    r03d.status === 200,
    `status=${r03d.status}`);

  // Restore doctor to original permissions for later revocation tests
  await hpatch(hospitalId, `/roles/${doctorRoleId}`, { permissions: originalPerms }, ownerToken);
  console.log(`  (restored doctor permissions to original ${originalPerms.length} perms)`);
}

// ── Section 2 — Custom Role Update (Regression) ───────────────────────────────

async function testCustomRoleRegression(hospitalId, ownerToken, actors, customRoleId) {
  section('Section 2 — Custom Role Update (Regression)');

  if (!customRoleId) {
    ['ROLE-E-06a','ROLE-E-06b','ROLE-E-06c'].forEach(id =>
      block(id, 'Custom role needed', 'bootstrap: custom role creation failed'));
    return;
  }

  const ha = actors['hospital_admin'].token;

  // ROLE-E-06a: Update permissions only
  const r06a = await hpatch(hospitalId, `/roles/${customRoleId}`, { permissions: ['asset.view'] }, ha);
  const ok06a = expect('ROLE-E-06a', 'Custom role: update permissions → 200',
    r06a.status === 200, `status=${r06a.status}`);
  if (ok06a) {
    expect('ROLE-E-06a-perms', 'Permissions updated',
      JSON.stringify(r06a.data?.data?.role?.permissions?.slice().sort()) === JSON.stringify(['asset.view']),
      `got=${JSON.stringify(r06a.data?.data?.role?.permissions)}`);
  }

  // ROLE-E-06b: Update name only
  const r06b = await hpatch(hospitalId, `/roles/${customRoleId}`, { name: 'Senior Cleaner' }, ha);
  const ok06b = expect('ROLE-E-06b', 'Custom role: update name → 200',
    r06b.status === 200, `status=${r06b.status}`);
  if (ok06b) {
    expect('ROLE-E-06b-name', 'Name updated',
      r06b.data?.data?.role?.name === 'Senior Cleaner',
      `got=${r06b.data?.data?.role?.name}`);
  }

  // ROLE-E-06c: Update both name and permissions
  const r06c = await hpatch(hospitalId, `/roles/${customRoleId}`, {
    name: 'Cleaner Final',
    permissions: ['staff.view', 'notifications.view'],
  }, ha);
  const ok06c = expect('ROLE-E-06c', 'Custom role: update name+permissions → 200',
    r06c.status === 200, `status=${r06c.status}`);
  if (ok06c) {
    const role = r06c.data?.data?.role;
    expect('ROLE-E-06c-name', 'Name updated',
      role?.name === 'Cleaner Final', `got=${role?.name}`);
    expect('ROLE-E-06c-perms', 'Permissions updated',
      JSON.stringify(role?.permissions?.slice().sort()) === JSON.stringify(['notifications.view','staff.view']),
      `got=${JSON.stringify(role?.permissions)}`);
    expect('ROLE-E-06c-isSystem', 'isSystem remains false',
      role?.isSystem === false, `isSystem=${role?.isSystem}`);
  }
}

// ── Section 3 — Permission Guard ─────────────────────────────────────────────

async function testPermissionGuard(hospitalId, ownerToken, actors, doctorRole) {
  section('Section 3 — Permission Guard');

  const doctorRoleId = doctorRole.id;
  const ha = actors['hospital_admin'].token;
  const nurse = actors['nurse'].token;

  // Doctor token was revoked by section 1 patches — re-login to get a fresh valid token
  const rDocRelogin = await login(actors['doctor'].email, PW);
  const doc = rDocRelogin.status === 200
    ? rDocRelogin.data.data.tokens.accessToken
    : actors['doctor'].token; // fallback (will likely 401 but we'll catch it in the assertion)

  // ROLE-E-07a: Doctor (no settings.update) → 403
  const r07a = await hpatch(hospitalId, `/roles/${doctorRoleId}`, { permissions: ['staff.view'] }, doc);
  expect('ROLE-E-07a', 'Doctor (no settings.update) → 403',
    r07a.status === 403, `status=${r07a.status}`);

  // ROLE-E-07b: Nurse → 403
  const r07b = await hpatch(hospitalId, `/roles/${doctorRoleId}`, { permissions: ['staff.view'] }, nurse);
  expect('ROLE-E-07b', 'Nurse → 403',
    r07b.status === 403, `status=${r07b.status}`);

  // ROLE-E-07c: No token → 401
  const r07c = await hpatch(hospitalId, `/roles/${doctorRoleId}`, { permissions: ['staff.view'] }, null);
  expect('ROLE-E-07c', 'No token → 401',
    r07c.status === 401, `status=${r07c.status}`);

  // ROLE-E-07d: hospital_admin (has settings.update) → 200
  const r07d = await hpatch(hospitalId, `/roles/${doctorRoleId}`, { permissions: ['staff.view'] }, ha);
  expect('ROLE-E-07d', 'hospital_admin (settings.update) → 200',
    r07d.status === 200, `status=${r07d.status}`);

  // Restore
  await hpatch(hospitalId, `/roles/${doctorRoleId}`, { permissions: doctorRole.permissions }, ownerToken);
}

// ── Section 4 — Delete Regression ────────────────────────────────────────────

async function testDeleteRegression(hospitalId, ownerToken, actors, doctorRole, customRoleId) {
  section('Section 4 — Delete Regression');

  const ha = actors['hospital_admin'].token;

  // ROLE-E-04: DELETE system role still 403
  const r04 = await hdel(hospitalId, `/roles/${doctorRole.id}`, ha);
  expect('ROLE-E-04', 'DELETE system role → 403',
    r04.status === 403, `status=${r04.status}`);
  expect('ROLE-E-04b', 'DELETE system role error message',
    r04.data?.error?.message?.toLowerCase().includes('cannot be deleted'),
    `message="${r04.data?.error?.message}"`);

  // ROLE-E-04c: DELETE custom role still works
  if (customRoleId) {
    // Create a disposable custom role to delete (don't delete the one used in section 2)
    const rDisp = await hpost(hospitalId, '/roles', {
      name: 'Disposable',
      slug: `disposable-${TS}`,
      permissions: [],
    }, ownerToken);
    if (rDisp.status === 201) {
      const dispId = rDisp.data.data.role.id;
      const r04c = await hdel(hospitalId, `/roles/${dispId}`, ha);
      expect('ROLE-E-04c', 'DELETE custom role → 204',
        r04c.status === 204, `status=${r04c.status}`);
    } else {
      block('ROLE-E-04c', 'DELETE custom role regression', 'could not create disposable role');
    }
  } else {
    block('ROLE-E-04c', 'DELETE custom role regression', 'no custom role from bootstrap');
  }
}

// ── Section 5 — Session Revocation ───────────────────────────────────────────

async function testRevocation(hospitalId, ownerToken, actors, doctorRole) {
  section('Section 5 — Session Revocation on System Role Permission Change');

  const doctorRoleId = doctorRole.id;
  const doctorEmail = actors['doctor'].email;
  const nurseToken = actors['nurse'].token;

  // Login as doctor to get a fresh token
  const rDocLogin = await login(doctorEmail, PW);
  if (rDocLogin.status !== 200) {
    ['ROLE-E-05a','ROLE-E-05b','ROLE-E-05c','ROLE-E-05d'].forEach(id =>
      block(id, 'Need fresh doctor token', 'login failed'));
    return;
  }
  const oldDocToken = rDocLogin.data.data.tokens.accessToken;

  // Verify old token works before the patch
  const rPre = await hget(hospitalId, '/staff/me', oldDocToken);
  if (!expect('ROLE-E-05-pre', 'Doctor old token works before permission change',
    rPre.status === 200, `status=${rPre.status}`)) {
    ['ROLE-E-05a','ROLE-E-05b','ROLE-E-05c'].forEach(id =>
      block(id, 'Pre-check failed', 'old token was already invalid'));
    return;
  }

  // Change doctor role permissions (owner does the PATCH)
  const rPatch = await hpatch(hospitalId, `/roles/${doctorRoleId}`, {
    permissions: ['staff.view', 'patient.view'],
  }, ownerToken);
  if (!expect('ROLE-E-05-setup', 'PATCH doctor permissions succeeds',
    rPatch.status === 200, `status=${rPatch.status}`)) {
    ['ROLE-E-05a','ROLE-E-05b','ROLE-E-05c'].forEach(id =>
      block(id, 'Depends on setup', 'PATCH failed'));
    return;
  }

  // ROLE-E-05a: Old token → 401
  const r05a = await hget(hospitalId, '/staff/me', oldDocToken);
  expect('ROLE-E-05a', 'Old doctor token → 401 after system role permission change',
    r05a.status === 401, `status=${r05a.status}`);

  // ROLE-E-05c: Nurse token unaffected
  const r05c = await hget(hospitalId, '/staff/me', nurseToken);
  expect('ROLE-E-05c', 'Nurse token unaffected (different role)',
    r05c.status === 200, `status=${r05c.status}`);

  // ROLE-E-05b: Fresh login → new permissions
  const rDocLogin2 = await login(doctorEmail, PW);
  if (rDocLogin2.status === 200) {
    const newDocToken = rDocLogin2.data.data.tokens.accessToken;
    const rMe = await hget(hospitalId, '/staff/me', newDocToken);
    const ok05b = expect('ROLE-E-05b', 'Fresh login succeeds after revocation',
      rMe.status === 200, `status=${rMe.status}`);
    if (ok05b) {
      const perms = rMe.data?.data?.member?.permissions ?? [];
      expect('ROLE-E-05b-perms', 'New token has updated permissions (staff.view, patient.view)',
        perms.includes('staff.view') && perms.includes('patient.view') && !perms.includes('emr.view'),
        `permissions=${JSON.stringify(perms)}`);
    }
    // Also test that old EMR endpoint is now blocked
    if (ok05b) {
      const newDocToken2 = rDocLogin2.data.data.tokens.accessToken;
      // Create a patient to test chart access
      const rPatList = await hget(hospitalId, '/patients', newDocToken2);
      const patId = rPatList.data?.data?.items?.[0]?.id ?? null;
      if (patId) {
        const rChart = await hget(hospitalId, `/patients/${patId}/chart`, newDocToken2);
        expect('ROLE-E-05b-enforced', 'New permissions enforced — emr.view blocked for updated doctor',
          rChart.status === 403, `status=${rChart.status}`);
      }
    }
  } else {
    block('ROLE-E-05b', 'Fresh login after revocation', `login status=${rDocLogin2.status}`);
  }

  // ROLE-E-05d: Name-only PATCH does NOT revoke session
  // Re-login doctor to get a fresh valid token
  const rDocLogin3 = await login(doctorEmail, PW);
  const docToken3 = rDocLogin3.data?.data?.tokens?.accessToken;
  if (docToken3) {
    // Patch with name only (body.permissions === undefined)
    await hpatch(hospitalId, `/roles/${doctorRoleId}`, { name: 'Doctor Name Try' }, ownerToken);
    const r05d = await hget(hospitalId, '/staff/me', docToken3);
    expect('ROLE-E-05d', 'Name-only PATCH does NOT revoke doctor session',
      r05d.status === 200,
      `status=${r05d.status} (expected 200 — no tokenVersion bump for name-only patch)`);
  } else {
    block('ROLE-E-05d', 'Name-only no-revoke', 'could not re-login doctor');
  }

  // Restore doctor permissions
  await hpatch(hospitalId, `/roles/${doctorRoleId}`, { permissions: doctorRole.permissions }, ownerToken);
  console.log('  (restored doctor permissions)');
}

// ── Section 6 — Error Envelope ────────────────────────────────────────────────

async function testErrorEnvelope(hospitalId, actors, doctorRole) {
  section('Section 6 — Error Envelope');

  function checkEnvelope(id, label, r) {
    const ok = r.data &&
      typeof r.data.error === 'object' &&
      typeof r.data.error?.code === 'string' &&
      typeof r.data.error?.message === 'string';
    expect(id, label, ok, `body=${JSON.stringify(r.data)?.slice(0,200)}`);
  }

  // ENV-01: no token → 401
  const r01 = await hpatch(hospitalId, `/roles/${doctorRole.id}`, { permissions: [] }, null);
  checkEnvelope('ENV-01', '401 (no token) has correct error envelope', r01);

  // ENV-02: 403 (no permission)
  const r02 = await hpatch(hospitalId, `/roles/${doctorRole.id}`, { permissions: [] }, actors['doctor'].token);
  checkEnvelope('ENV-02', '403 (no permission) has correct error envelope', r02);

  // ENV-03: 404 (non-existent role)
  const r03 = await hpatch(hospitalId, '/roles/ROLE-nonexistent-xxx', { permissions: [] }, actors['hospital_admin'].token);
  checkEnvelope('ENV-03', '404 (non-existent roleId) has correct error envelope', r03);
  expect('ENV-03b', '404 status code correct', r03.status === 404, `status=${r03.status}`);
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
console.log('║       Medcord Role Editing — QA Test Suite               ║');
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

const { hospitalId, ownerToken, actors, doctorRole, customRoleId } = ctx;

await testSystemRoleUpdate(hospitalId, ownerToken, actors, doctorRole);
await testCustomRoleRegression(hospitalId, ownerToken, actors, customRoleId);
await testPermissionGuard(hospitalId, ownerToken, actors, doctorRole);
await testDeleteRegression(hospitalId, ownerToken, actors, doctorRole, customRoleId);
await testRevocation(hospitalId, ownerToken, actors, doctorRole);
await testErrorEnvelope(hospitalId, actors, doctorRole);

printSummary();
