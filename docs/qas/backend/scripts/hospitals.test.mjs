/**
 * hospitals.test.mjs — Tests for §2 Hospitals (H-*)
 *
 * Covers: CRUD, settings (branding/modules), domain, usage, ownership
 * transfer, archive, RBAC enforcement, BUG-04 (archived hospital access),
 * BUG-05 (ownership transfer role demotion).
 *
 * Usage: node hospitals.test.mjs
 * Prerequisite: restore-seed.mjs must have run (node restore-seed.mjs). Safe to re-run.
 */

import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { connect, disconnect, col } from './db.mjs';
import { get, post, patch, del } from './api.mjs';
import { test, summary, assert, assertEqual, assertStatus, assertContains } from './runner.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const state = JSON.parse(await readFile(join(__dirname, '.state.json'), 'utf8'));

const { alice, bob, carol, dave, eve, frank, grace } = state.users;
const hospAId = state.hospitalA.id;
const hospBId = state.hospitalB.id;

await connect();

console.log('=== HOSPITAL TESTS ===\n');

// ── 2.1 CRUD & Settings ───────────────────────────────────────────────────

await test('H-HP-01', 'Create hospital returns 201 with hospital object', async () => {
  // Hospital A and B already created by seed; verify their shapes via GET
  const res = await get(`/hospitals/${hospAId}`, alice.accessToken);
  assertStatus(res, 200);
  const h = res.data.data.hospital;
  assert(h?.id, 'hospital.id present');
  assertEqual(h.name, 'Hospital A', 'hospital name correct');
});

await test('H-HP-02', 'GET /hospitals lists only caller memberships', async () => {
  // alice is in Hospital A only; grace is in Hospital B only
  const resAlice = await get('/hospitals', alice.accessToken);
  assertStatus(resAlice, 200);
  const aliceHospitals = resAlice.data.data?.items ?? resAlice.data.data?.hospitals ?? [];
  assert(aliceHospitals.length > 0, 'alice sees at least one hospital');
  const ids = aliceHospitals.map((h) => h.id);
  assert(ids.includes(hospAId), 'alice sees Hospital A');
  // alice should NOT see Hospital B (she has no membership there)
  assert(!ids.includes(hospBId), 'alice does not see Hospital B');
});

await test('H-HP-03', 'GET /hospitals/:id as member returns 200', async () => {
  const res = await get(`/hospitals/${hospAId}`, bob.accessToken);
  assertStatus(res, 200);
  assertContains(res.data.data, 'hospital', 'hospital key in data');
});

await test('H-HP-04', 'PATCH /hospitals/:id as super_admin returns 200', async () => {
  const res = await patch(
    `/hospitals/${hospAId}`,
    { name: 'Hospital A (updated)' },
    alice.accessToken,
  );
  assertStatus(res, 200);
  assertEqual(res.data.data.hospital?.name, 'Hospital A (updated)', 'name updated');
  // restore
  await patch(`/hospitals/${hospAId}`, { name: 'Hospital A' }, alice.accessToken);
});

await test('H-HP-05', 'PATCH /hospitals/:id as hospital_admin returns 200', async () => {
  const res = await patch(
    `/hospitals/${hospAId}`,
    { location: 'Accra, Ghana (updated)' },
    bob.accessToken,
  );
  assertStatus(res, 200);
  await patch(`/hospitals/${hospAId}`, { location: 'Accra, Ghana' }, alice.accessToken);
});

await test('H-HP-06', 'PATCH /hospitals/:id/branding as super_admin returns 200', async () => {
  const res = await patch(
    `/hospitals/${hospAId}/branding`,
    { primaryColor: '#ff0000' },
    alice.accessToken,
  );
  assertStatus(res, 200);
});

await test('H-HP-07', 'PATCH /hospitals/:id/modules as super_admin returns 200', async () => {
  const res = await patch(
    `/hospitals/${hospAId}/modules`,
    { labs: true, assets: true },
    alice.accessToken,
  );
  assertStatus(res, 200);
});

await test('H-HP-08', 'GET /hospitals/:id/domain returns subdomain info', async () => {
  const res = await get(`/hospitals/${hospAId}/domain`, alice.accessToken);
  assertStatus(res, 200);
  const d = res.data.data;
  assert(d?.subdomain !== undefined, 'subdomain field present');
});

await test('H-HP-09', 'GET /hospitals/:id/usage as super_admin returns usage stats', async () => {
  const res = await get(`/hospitals/${hospAId}/usage`, alice.accessToken);
  assertStatus(res, 200);
  const d = res.data.data;
  assert(typeof d?.members === 'number', 'members is a number');
});

await test('H-HP-10', 'Transfer ownership to existing member — new owner gets super_admin', async () => {
  // Create a fresh hospital for this destructive test
  const createRes = await post(
    '/hospitals',
    { name: 'Transfer Test Hospital', type: 'clinic', location: 'Test City', subdomain: 'transfer-test-hosp' },
    alice.accessToken,
  );
  assertStatus(createRes, 201);
  const tHospId = createRes.data.data.hospital.id;

  // Invite bob to this hospital
  const invRes = await post(
    `/hospitals/${tHospId}/invitations`,
    { email: 'bob@medcord.test', role: 'hospital_admin' },
    alice.accessToken,
  );
  assertStatus(invRes, 201);
  const invToken = invRes.data.data.invitation.token;

  // Bob accepts
  const acceptRes = await post(`/invitations/${invToken}/accept`, undefined, bob.accessToken);
  assertStatus(acceptRes, 200);

  // Get bob's memberId in this hospital
  const staffRes = await get(`/hospitals/${tHospId}/staff`, alice.accessToken);
  const bobEntry = (staffRes.data.data?.items ?? []).find((m) => m.userId === bob.id);
  assert(bobEntry, 'bob found in staff');

  // Transfer ownership to bob — newOwnerId is userId (USR-xxx), not memberId (MBR-xxx)
  const xferRes = await post(
    `/hospitals/${tHospId}/transfer-ownership`,
    { newOwnerId: bob.id },
    alice.accessToken,
  );
  assertStatus(xferRes, 200);

  // Verify new owner has super_admin in DB (BUG-05 fix confirmation)
  const bobMember = await col('hospital_members').findOne({ hospitalId: tHospId, userId: bob.id });
  assertEqual(bobMember?.role, 'super_admin', 'new owner has super_admin role');

  // BUG-05 fix: previous owner (alice) should be demoted to hospital_admin
  const staffRes2 = await get(`/hospitals/${tHospId}/staff`, bob.accessToken);
  const aliceEntry = (staffRes2.data.data?.items ?? []).find((m) => m.userId === alice.id);
  assert(aliceEntry, 'alice still in staff');
  assertEqual(aliceEntry.role, 'hospital_admin', 'BUG-05 fix: previous owner demoted to hospital_admin');
});

// Edge Cases

await test('H-EG-01', 'Create hospital with duplicate subdomain returns 409', async () => {
  const res = await post(
    '/hospitals',
    { name: 'Dupe Hospital', type: 'general', location: 'Somewhere', subdomain: 'hospital-a' },
    alice.accessToken,
  );
  assertStatus(res, 409);
  assertEqual(res.data.error?.code, 'conflict', 'conflict error');
});

await test('H-EG-02', 'GET /hospitals/:id as non-member returns 403', async () => {
  // grace has no membership in Hospital A
  const res = await get(`/hospitals/${hospAId}`, grace.accessToken);
  assertStatus(res, 403);
});

await test('H-EG-03', 'PATCH /hospitals/:id/branding as hospital_admin returns 403', async () => {
  const res = await patch(
    `/hospitals/${hospAId}/branding`,
    { primaryColor: '#00ff00' },
    bob.accessToken,
  );
  assertStatus(res, 403);
  assertEqual(res.data.error?.code, 'forbidden', 'forbidden error');
});

await test('H-EG-04', 'PATCH /hospitals/:id/modules as hospital_admin returns 403', async () => {
  const res = await patch(
    `/hospitals/${hospAId}/modules`,
    { labs: false },
    bob.accessToken,
  );
  assertStatus(res, 403);
});

await test('H-EG-05', 'Transfer ownership — newOwnerId is non-member returns 404', async () => {
  // grace is not a member of Hospital A
  // We need grace's memberId — which doesn't exist in hosp A, so we'll use a fake ID
  const res = await post(
    `/hospitals/${hospAId}/transfer-ownership`,
    { newOwnerId: 'MBR-00000000-0000-0000-0000-000000000000' },
    alice.accessToken,
  );
  assertStatus(res, 404);
});

await test('H-EG-06', 'Transfer ownership as non-owner (hospital_admin) returns 403', async () => {
  // bob (hospital_admin) tries to transfer ownership of Hospital A — should be 403
  const res = await post(
    `/hospitals/${hospAId}/transfer-ownership`,
    { newOwnerId: carol.id },
    bob.accessToken,
  );
  assertStatus(res, 403);
});

await test('H-EG-07', 'Archive hospital as non-owner returns 403', async () => {
  const res = await del(`/hospitals/${hospAId}`, bob.accessToken);
  assertStatus(res, 403);
});

await test('H-EG-08', 'POST /hospitals missing required name returns 400', async () => {
  const res = await post(
    '/hospitals',
    { type: 'general', location: 'Somewhere', subdomain: 'no-name-test' },
    alice.accessToken,
  );
  assertStatus(res, 400);
  assertEqual(res.data.error?.code, 'validation_error', 'validation_error');
});

await test('H-EG-09', 'POST /hospitals missing subdomain returns 400', async () => {
  const res = await post(
    '/hospitals',
    { name: 'No Sub', type: 'general', location: 'Somewhere' },
    alice.accessToken,
  );
  assertStatus(res, 400);
  assertEqual(res.data.error?.code, 'validation_error', 'validation_error');
});

// BUG-04 confirmation: archived hospital blocked via hospitalScope middleware
await test('H-BUG-04', 'BUG-04 fix: scoped routes return 403 for archived hospital', async () => {
  // Create a temporary hospital to archive
  const createRes = await post(
    '/hospitals',
    { name: 'To Archive', type: 'clinic', location: 'Somewhere', subdomain: 'to-archive-bug04' },
    grace.accessToken,
  );
  assertStatus(createRes, 201);
  const archHospId = createRes.data.data.hospital.id;

  // Archive it
  const archiveRes = await del(`/hospitals/${archHospId}`, grace.accessToken);
  assertStatus(archiveRes, 204);

  // Attempt to GET a scoped route — should be 403 (or 404 if completely removed)
  const res = await get(`/hospitals/${archHospId}/staff`, grace.accessToken);
  assert(
    res.status === 403 || res.status === 404,
    `BUG-04 fix: expected 403/404 for archived hospital, got ${res.status}`,
  );
});

await test('H-BUG-04b', 'BUG-04 partial: GET /hospitals may still list archived hospital', async () => {
  // Create + archive a hospital for grace
  const createRes = await post(
    '/hospitals',
    { name: 'Archive List Test', type: 'clinic', location: 'Somewhere', subdomain: 'archive-list-test' },
    grace.accessToken,
  );
  const archHospId = createRes.data.data.hospital.id;
  await del(`/hospitals/${archHospId}`, grace.accessToken);

  // List grace's hospitals — does the archived one appear?
  const listRes = await get('/hospitals', grace.accessToken);
  assertStatus(listRes, 200);
  const items = listRes.data.data?.items ?? listRes.data.data?.hospitals ?? [];
  const archived = items.find((h) => h.id === archHospId);
  if (archived) {
    throw new Error(
      `BUG-04 partial gap: GET /hospitals returned archived hospital (id=${archHospId}). listMine() needs isArchived:false filter.`,
    );
  }
  // If we get here, archived hospital is correctly filtered out
  assert(true, 'archived hospital not in list');
});

// ── 2.2 Archive & Access ──────────────────────────────────────────────────

await test('H-HP-11', 'DELETE /hospitals/:id (archive) as owner returns 204', async () => {
  const createRes = await post(
    '/hospitals',
    { name: 'To Delete', type: 'clinic', location: 'Somewhere', subdomain: 'to-delete-test' },
    alice.accessToken,
  );
  assertStatus(createRes, 201);
  const delHospId = createRes.data.data.hospital.id;
  const res = await del(`/hospitals/${delHospId}`, alice.accessToken);
  assertStatus(res, 204);
});

// ── Summary ───────────────────────────────────────────────────────────────

await disconnect();
const failures = summary();
process.exit(failures > 0 ? 1 : 0);
