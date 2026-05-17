/**
 * admin.test.mjs — Tests for Platform Admin API (/admin/*)
 *
 * Routes: /admin/stats, /admin/hospitals, /admin/users
 *
 * Usage:
 *   1. node restore-seed.mjs
 *   2. Bootstrap alice as platform admin:
 *      mongo medcord --eval 'db.users.updateOne({email:"alice@medcord.test"},{$set:{isAdmin:true}})'
 *   3. node admin.test.mjs
 */

import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { connect, disconnect, col } from './db.mjs';
import { api, get as regularGet } from './api.mjs';
import { test, summary, assert, assertEqual, assertStatus } from './runner.mjs';

// Admin routes mount at /admin (no /api/v1 prefix)
const ADMIN_BASE_URL = 'http://localhost:8085/admin';

async function adminApi(path, opts = {}) {
  const { method = 'GET', body, token, headers: extraHeaders = {} } = opts;
  const headers = { 'Content-Type': 'application/json', ...extraHeaders };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const init = { method, headers };
  if (body !== undefined) init.body = JSON.stringify(body);
  const raw = await fetch(`${ADMIN_BASE_URL}${path}`, init);
  const ct = raw.headers.get('content-type') ?? '';
  const data = ct.includes('application/json') ? await raw.json() : await raw.text();
  return { status: raw.status, data, headers: raw.headers };
}

// Admin-scoped helpers (hit /admin/*)
const get = (path, token) => adminApi(path, { method: 'GET', token });
const patch = (path, body, token) => adminApi(path, { method: 'PATCH', body, token });
const del = (path, token) => adminApi(path, { method: 'DELETE', token });
const apost = (path, body, token) => adminApi(path, { method: 'POST', body, token });

// Regular API helpers (hit /api/v1/*)
const post = (path, body, token) => api(path, { method: 'POST', body, token });
const rget = (path, token) => regularGet(path, token);

const __dirname = dirname(fileURLToPath(import.meta.url));
const state = JSON.parse(await readFile(join(__dirname, '.state.json'), 'utf8'));

await connect();

// ── Bootstrap: ensure alice is platform admin ─────────────────────────────────

await col('users').updateOne(
  { email: 'alice@medcord.test' },
  { $set: { isAdmin: true } },
);

// Re-login alice to get a fresh token (isAdmin is checked live from DB, not JWT,
// but a fresh login ensures we have a non-expired access token)
const loginRes = await post('/auth/login', {
  email: 'alice@medcord.test',
  password: 'Medcord123!',
});
const adminToken = loginRes.data?.data?.tokens?.accessToken;
assert(adminToken, 'Admin token obtained after bootstrap');

// Re-login bob to get a fresh non-admin token (seed token may be expired)
const bobLoginRes = await post('/auth/login', { email: 'bob@medcord.test', password: 'Medcord123!' });
const bobToken = bobLoginRes.data?.data?.tokens?.accessToken;
assert(bobToken, 'Bob fresh token obtained');
const aliceId = state.users.alice.id;
const hospAId = state.hospitalA.id;
const hospBId = state.hospitalB.id;

const BASE = '';

console.log('=== ADMIN API TESTS ===\n');

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Platform Admin Guard
// ─────────────────────────────────────────────────────────────────────────────

console.log('── Section 1: Guard ──');

await test('G-01', 'No token → 401', async () => {
  const res = await get(`${BASE}/stats`, null);
  assertStatus(res, 401);
  assert(res.data?.error?.code, 'error.code present');
  assertEqual(res.data?.error?.code, 'unauthorized', 'code is unauthorized');
});

await test('G-02', 'Malformed token → 401', async () => {
  const res = await get(`${BASE}/stats`, 'garbage_token_xyz');
  assertStatus(res, 401);
  assertEqual(res.data?.error?.code, 'unauthorized', 'code is unauthorized');
});

await test('G-03', 'Valid token, non-admin user → 403', async () => {
  const res = await get(`${BASE}/stats`, bobToken);
  assertStatus(res, 403);
  assertEqual(res.data?.error?.code, 'forbidden', 'code is forbidden');
});

await test('G-04', 'Valid admin token → 200 (route proceeds)', async () => {
  const res = await get(`${BASE}/stats`, adminToken);
  assertStatus(res, 200);
  assert(res.data?.data?.stats, 'stats present');
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — Stats
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── Section 2: Stats ──');

let statsBaseline;

await test('S-01', 'GET /admin/stats returns all expected keys', async () => {
  const res = await get(`${BASE}/stats`, adminToken);
  assertStatus(res, 200);
  const s = res.data?.data?.stats;
  assert(s, 'stats object present');

  // hospitals
  assert(typeof s.hospitals?.total === 'number', 'hospitals.total is number');
  assert(typeof s.hospitals?.active === 'number', 'hospitals.active is number');
  assert(typeof s.hospitals?.archived === 'number', 'hospitals.archived is number');

  // users
  assert(typeof s.users?.total === 'number', 'users.total is number');
  assert(typeof s.users?.admins === 'number', 'users.admins is number');
  assert(typeof s.users?.twoFactorEnabled === 'number', 'users.twoFactorEnabled is number');

  // recentSignups
  assert(typeof s.recentSignups?.last7d === 'number', 'recentSignups.last7d is number');
  assert(typeof s.recentSignups?.last30d === 'number', 'recentSignups.last30d is number');

  // recentHospitals
  assert(typeof s.recentHospitals?.last7d === 'number', 'recentHospitals.last7d is number');
  assert(typeof s.recentHospitals?.last30d === 'number', 'recentHospitals.last30d is number');

  statsBaseline = s;
});

await test('S-02 [BUG-A-05 verify]', 'hospitals.active + hospitals.archived === hospitals.total', async () => {
  const s = statsBaseline;
  const sum = s.hospitals.active + s.hospitals.archived;
  assertEqual(sum, s.hospitals.total, `active(${s.hospitals.active}) + archived(${s.hospitals.archived}) = ${sum}, total = ${s.hospitals.total}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — Hospitals
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── Section 3: Hospitals ──');

// 3.1 List

await test('H-L-01', 'GET /admin/hospitals returns paginated result', async () => {
  const res = await get(`${BASE}/hospitals`, adminToken);
  assertStatus(res, 200);
  const d = res.data?.data;
  assert(Array.isArray(d?.items), 'items is array');
  assert(typeof d?.total === 'number', 'total is number');
  assert(typeof d?.page === 'number', 'page is number');
  assert(typeof d?.limit === 'number', 'limit is number');
  assert(typeof d?.totalPages === 'number', 'totalPages is number');
  assert(d.items.length > 0, 'at least one hospital (seed created 2)');
});

await test('H-L-02', 'Pagination: ?page=1&limit=1 returns 1 item', async () => {
  const res = await get(`${BASE}/hospitals?page=1&limit=1`, adminToken);
  assertStatus(res, 200);
  const d = res.data?.data;
  assertEqual(d?.items?.length, 1, 'exactly 1 item');
  assertEqual(d?.page, 1, 'page is 1');
  assertEqual(d?.limit, 1, 'limit is 1');
});

await test('H-L-03', 'limit=101 → 400 validation_error', async () => {
  const res = await get(`${BASE}/hospitals?limit=101`, adminToken);
  assertStatus(res, 400);
  assertEqual(res.data?.error?.code, 'validation_error', 'validation_error');
});

await test('H-L-04', '?isArchived=false returns only non-archived hospitals', async () => {
  const res = await get(`${BASE}/hospitals?isArchived=false`, adminToken);
  assertStatus(res, 200);
  for (const h of res.data?.data?.items ?? []) {
    assertEqual(h.isArchived, false, `hospital ${h.id} should not be archived`);
  }
});

await test('H-L-05', '?isArchived=true returns only archived hospitals', async () => {
  // Archive hospital B first to guarantee at least one archived
  await patch(`${BASE}/hospitals/${hospBId}`, { isArchived: true }, adminToken);
  const res = await get(`${BASE}/hospitals?isArchived=true`, adminToken);
  assertStatus(res, 200);
  assert(res.data?.data?.items?.length > 0, 'at least one archived hospital');
  for (const h of res.data?.data?.items ?? []) {
    assertEqual(h.isArchived, true, `hospital ${h.id} should be archived`);
  }
  // Restore
  await patch(`${BASE}/hospitals/${hospBId}`, { isArchived: false }, adminToken);
});

await test('H-L-06', '?q=<name substring> — case-insensitive name search', async () => {
  // Hospital A is named something containing "Hospital" or the seed name
  const listRes = await get(`${BASE}/hospitals`, adminToken);
  const firstName = listRes.data?.data?.items?.[0]?.name;
  assert(firstName, 'have a hospital name to search');
  const fragment = firstName.substring(0, 4);
  const res = await get(`${BASE}/hospitals?q=${encodeURIComponent(fragment.toLowerCase())}`, adminToken);
  assertStatus(res, 200);
  assert(res.data?.data?.items?.length > 0, 'search returned results');
});

await test('H-L-07', '?q=zzznomatch → empty results', async () => {
  const res = await get(`${BASE}/hospitals?q=zzznomatch`, adminToken);
  assertStatus(res, 200);
  assertEqual(res.data?.data?.items?.length, 0, 'no items');
  assertEqual(res.data?.data?.total, 0, 'total is 0');
});

await test('H-L-08', '?isArchived=banana → treated as false, no 400', async () => {
  const res = await get(`${BASE}/hospitals?isArchived=banana`, adminToken);
  assertStatus(res, 200);
  // All returned items should have isArchived: false (banana !== "true")
  for (const h of res.data?.data?.items ?? []) {
    assertEqual(h.isArchived, false, `hospital ${h.id} should not be archived`);
  }
});

// 3.2 Get single

await test('H-G-01', 'GET /admin/hospitals/:id returns hospital + memberCount', async () => {
  const res = await get(`${BASE}/hospitals/${hospAId}`, adminToken);
  assertStatus(res, 200);
  const d = res.data?.data;
  assert(d?.hospital?.id, 'hospital.id present');
  assertEqual(d?.hospital?.id, hospAId, 'correct hospital returned');
  assert(typeof d?.memberCount === 'number', 'memberCount is number');
  assert(d.memberCount >= 0, 'memberCount >= 0');
});

await test('H-G-02', 'memberCount reflects actual member count', async () => {
  const res = await get(`${BASE}/hospitals/${hospAId}`, adminToken);
  assertStatus(res, 200);
  const memberCount = res.data?.data?.memberCount;
  // Seed adds alice + 5 invitees = 6 members in Hospital A
  assert(memberCount >= 1, `memberCount is ${memberCount}, expected ≥1`);
});

await test('H-G-03', 'Non-existent hospitalId → 404', async () => {
  const res = await get(`${BASE}/hospitals/HSP-doesnotexist`, adminToken);
  assertStatus(res, 404);
  assertEqual(res.data?.error?.code, 'not_found', 'not_found');
});

await test('H-G-04', 'Malformed ID → 404', async () => {
  const res = await get(`${BASE}/hospitals/notanid`, adminToken);
  assertStatus(res, 404);
  assertEqual(res.data?.error?.code, 'not_found', 'not_found');
});

// 3.3 Patch

await test('H-P-01', 'Archive hospital → isArchived: true', async () => {
  const res = await patch(`${BASE}/hospitals/${hospBId}`, { isArchived: true }, adminToken);
  assertStatus(res, 200);
  assertEqual(res.data?.data?.hospital?.isArchived, true, 'isArchived is true');
});

await test('H-P-02', 'Restore hospital → isArchived: false', async () => {
  const res = await patch(`${BASE}/hospitals/${hospBId}`, { isArchived: false }, adminToken);
  assertStatus(res, 200);
  assertEqual(res.data?.data?.hospital?.isArchived, false, 'isArchived is false');
});

await test('H-P-03', 'Disable module → only that module changes', async () => {
  // First get current modules
  const before = await get(`${BASE}/hospitals/${hospAId}`, adminToken);
  const modulesBefore = before.data?.data?.hospital?.modules;

  const res = await patch(`${BASE}/hospitals/${hospAId}`, { modules: { labs: false } }, adminToken);
  assertStatus(res, 200);
  const h = res.data?.data?.hospital;
  assertEqual(h?.modules?.labs, false, 'labs is false');
  // Other modules unchanged
  if (modulesBefore?.emr !== undefined) assertEqual(h?.modules?.emr, modulesBefore.emr, 'emr unchanged');
  if (modulesBefore?.assets !== undefined) assertEqual(h?.modules?.assets, modulesBefore.assets, 'assets unchanged');
});

await test('H-P-04', 'Enable module → only that module changes', async () => {
  const res = await patch(`${BASE}/hospitals/${hospAId}`, { modules: { labs: true } }, adminToken);
  assertStatus(res, 200);
  assertEqual(res.data?.data?.hospital?.modules?.labs, true, 'labs restored to true');
});

await test('H-P-05 [BUG-A-03 verify]', 'PATCH non-existent hospitalId → 404, not null', async () => {
  const res = await patch(`${BASE}/hospitals/HSP-doesnotexist`, { isArchived: false }, adminToken);
  assertStatus(res, 404);
  assertEqual(res.data?.error?.code, 'not_found', 'not_found — BUG-A-03 fix confirmed');
  assert(res.data?.data?.hospital !== null || res.status !== 200, 'must not return {hospital: null} 200');
});

await test('H-P-06', 'Empty body → 200, hospital unchanged', async () => {
  const before = await get(`${BASE}/hospitals/${hospAId}`, adminToken);
  const nameBefore = before.data?.data?.hospital?.name;

  const res = await patch(`${BASE}/hospitals/${hospAId}`, {}, adminToken);
  assertStatus(res, 200);
  assertEqual(res.data?.data?.hospital?.name, nameBefore, 'name unchanged after empty patch');
});

await test('H-P-07', 'Unknown field in body silently stripped', async () => {
  const before = await get(`${BASE}/hospitals/${hospAId}`, adminToken);
  const nameBefore = before.data?.data?.hospital?.name;

  const res = await patch(`${BASE}/hospitals/${hospAId}`, { name: 'Hacked Name' }, adminToken);
  assertStatus(res, 200);
  // Zod strips unknown fields — name should be unchanged
  assertEqual(res.data?.data?.hospital?.name, nameBefore, 'name not changed by unknown field');
});

await test('H-P-08', 'Invalid isArchived type → 400', async () => {
  const res = await patch(`${BASE}/hospitals/${hospAId}`, { isArchived: 'yes' }, adminToken);
  assertStatus(res, 400);
  assertEqual(res.data?.error?.code, 'validation_error', 'validation_error');
});

// 3.4 Delete — use a throwaway hospital created via the main API

let throwawayHospId;

await test('H-D-01', 'Delete hospital → 204', async () => {
  // Create a throwaway hospital as alice
  const createRes = await post('/hospitals', {
    name: 'Throwaway Hospital',
    type: 'clinic',
    location: 'Test Location, Accra',
    subdomain: `throwaway-${Date.now()}`,
    timezone: 'Africa/Accra',
    locale: 'en',
  }, adminToken);
  throwawayHospId = createRes.data?.data?.hospital?.id;
  assert(throwawayHospId, 'throwaway hospital created');

  const res = await del(`${BASE}/hospitals/${throwawayHospId}`, adminToken);
  assertStatus(res, 204);
});

await test('H-D-02', 'After delete, GET returns 404', async () => {
  const res = await get(`${BASE}/hospitals/${throwawayHospId}`, adminToken);
  assertStatus(res, 404);
  assertEqual(res.data?.error?.code, 'not_found', 'not_found');
});

await test('H-D-03', 'Stats total decrements after delete', async () => {
  const statsBefore = (await get(`${BASE}/stats`, adminToken)).data?.data?.stats;
  // Create another throwaway
  const createRes = await post('/hospitals', {
    name: 'Throwaway 2',
    type: 'clinic',
    location: 'Test Location, Accra',
    subdomain: `throwaway2-${Date.now()}`,
    timezone: 'Africa/Accra',
    locale: 'en',
  }, adminToken);
  const id2 = createRes.data?.data?.hospital?.id;

  const statsAfterCreate = (await get(`${BASE}/stats`, adminToken)).data?.data?.stats;
  assertEqual(statsAfterCreate.hospitals.total, statsBefore.hospitals.total + 1, 'total +1 after create');

  await del(`${BASE}/hospitals/${id2}`, adminToken);

  const statsAfterDelete = (await get(`${BASE}/stats`, adminToken)).data?.data?.stats;
  assertEqual(statsAfterDelete.hospitals.total, statsBefore.hospitals.total, 'total back to original after delete');
});

await test('H-D-04', 'Delete non-existent → 404', async () => {
  const res = await del(`${BASE}/hospitals/HSP-doesnotexist`, adminToken);
  assertStatus(res, 404);
  assertEqual(res.data?.error?.code, 'not_found', 'not_found');
});

await test('H-D-05', 'Double delete: first 204, second 404', async () => {
  // Create yet another throwaway
  const createRes = await post('/hospitals', {
    name: 'Throwaway 3',
    type: 'clinic',
    location: 'Test Location, Accra',
    subdomain: `throwaway3-${Date.now()}`,
    timezone: 'Africa/Accra',
    locale: 'en',
  }, adminToken);
  const id3 = createRes.data?.data?.hospital?.id;

  const res1 = await del(`${BASE}/hospitals/${id3}`, adminToken);
  assertStatus(res1, 204);

  const res2 = await del(`${BASE}/hospitals/${id3}`, adminToken);
  assertStatus(res2, 404);
});

// Stats increment tests (S-03, S-04, S-05)

await test('S-03', 'New user increments users.total + recentSignups', async () => {
  const before = (await get(`${BASE}/stats`, adminToken)).data?.data?.stats;

  await post('/auth/register', {
    email: `newuser_${Date.now()}@medcord.test`,
    password: 'Medcord123!',
    name: 'New Test User',
  });

  const after = (await get(`${BASE}/stats`, adminToken)).data?.data?.stats;
  assertEqual(after.users.total, before.users.total + 1, 'users.total +1');
  assertEqual(after.recentSignups.last7d, before.recentSignups.last7d + 1, 'recentSignups.last7d +1');
  assertEqual(after.recentSignups.last30d, before.recentSignups.last30d + 1, 'recentSignups.last30d +1');
});

await test('S-04', 'New hospital increments hospitals.total + active', async () => {
  const before = (await get(`${BASE}/stats`, adminToken)).data?.data?.stats;

  const createRes = await post('/hospitals', {
    name: 'Stats Test Hospital',
    type: 'clinic',
    location: 'Test Location, Accra',
    subdomain: `statstest-${Date.now()}`,
    timezone: 'Africa/Accra',
    locale: 'en',
  }, adminToken);
  const newId = createRes.data?.data?.hospital?.id;

  const after = (await get(`${BASE}/stats`, adminToken)).data?.data?.stats;
  assertEqual(after.hospitals.total, before.hospitals.total + 1, 'hospitals.total +1');
  assertEqual(after.hospitals.active, before.hospitals.active + 1, 'hospitals.active +1');

  // Cleanup
  await del(`${BASE}/hospitals/${newId}`, adminToken);
});

await test('S-05', 'Archive hospital shifts active→archived counts, total unchanged', async () => {
  const before = (await get(`${BASE}/stats`, adminToken)).data?.data?.stats;

  await patch(`${BASE}/hospitals/${hospBId}`, { isArchived: true }, adminToken);

  const after = (await get(`${BASE}/stats`, adminToken)).data?.data?.stats;
  assertEqual(after.hospitals.total, before.hospitals.total, 'total unchanged');
  assertEqual(after.hospitals.active, before.hospitals.active - 1, 'active -1');
  assertEqual(after.hospitals.archived, before.hospitals.archived + 1, 'archived +1');

  // Restore
  await patch(`${BASE}/hospitals/${hospBId}`, { isArchived: false }, adminToken);
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — Users
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── Section 4: Users ──');

const SENSITIVE_FIELDS = ['passwordHash', 'twoFactorSecret', 'pendingTwoFactorSecret', 'tokenVersion'];

function assertNoSecrets(obj, label) {
  for (const field of SENSITIVE_FIELDS) {
    assert(!(field in obj), `${label} must NOT contain '${field}'`);
  }
}

// 4.1 List

await test('U-L-01', 'GET /admin/users returns paginated result', async () => {
  const res = await get(`${BASE}/users`, adminToken);
  assertStatus(res, 200);
  const d = res.data?.data;
  assert(Array.isArray(d?.items), 'items is array');
  assert(typeof d?.total === 'number', 'total is number');
  assert(d.items.length > 0, 'at least one user (seed created 7)');
});

await test('U-L-02', '?q=alice — name search returns matching users', async () => {
  const res = await get(`${BASE}/users?q=alice`, adminToken);
  assertStatus(res, 200);
  const items = res.data?.data?.items ?? [];
  assert(items.length > 0, 'alice found');
  assert(items.some(u => u.name.toLowerCase().includes('alice')), 'result contains alice');
});

await test('U-L-03', '?q=@medcord — email search returns matching users', async () => {
  const res = await get(`${BASE}/users?q=medcord`, adminToken);
  assertStatus(res, 200);
  assert(res.data?.data?.items?.length > 0, 'email search returned results');
});

await test('U-L-04', '?isAdmin=true returns only admin users', async () => {
  const res = await get(`${BASE}/users?isAdmin=true`, adminToken);
  assertStatus(res, 200);
  const items = res.data?.data?.items ?? [];
  assert(items.length > 0, 'at least one admin (alice)');
  for (const u of items) {
    assertEqual(u.isAdmin, true, `user ${u.id} should be admin`);
  }
});

await test('U-L-05', '?isAdmin=false returns only non-admin users', async () => {
  const res = await get(`${BASE}/users?isAdmin=false`, adminToken);
  assertStatus(res, 200);
  const items = res.data?.data?.items ?? [];
  for (const u of items) {
    assertEqual(u.isAdmin, false, `user ${u.id} should not be admin`);
  }
});

await test('U-L-06', 'Pagination: ?page=2&limit=3 has correct offset', async () => {
  const res = await get(`${BASE}/users?page=2&limit=3`, adminToken);
  assertStatus(res, 200);
  const d = res.data?.data;
  assertEqual(d?.page, 2, 'page is 2');
  assertEqual(d?.limit, 3, 'limit is 3');
});

await test('U-L-07 [BUG-A-01 verify]', 'No sensitive fields in user list response', async () => {
  const res = await get(`${BASE}/users`, adminToken);
  assertStatus(res, 200);
  for (const user of res.data?.data?.items ?? []) {
    assertNoSecrets(user, `user ${user.id}`);
  }
});

// 4.2 Get single

await test('U-G-01', 'GET /admin/users/:id returns user + memberships', async () => {
  const res = await get(`${BASE}/users/${aliceId}`, adminToken);
  assertStatus(res, 200);
  const d = res.data?.data;
  assert(d?.user?.id, 'user.id present');
  assertEqual(d?.user?.id, aliceId, 'correct user returned');
  assert(Array.isArray(d?.memberships), 'memberships is array');
});

await test('U-G-02', 'User with memberships — membership shape is correct', async () => {
  const res = await get(`${BASE}/users/${aliceId}`, adminToken);
  assertStatus(res, 200);
  const memberships = res.data?.data?.memberships;
  assert(memberships.length > 0, 'alice has at least one membership');
  const m = memberships[0];
  assert(m.id, 'membership.id present');
  assert(m.hospitalId, 'membership.hospitalId present');
  assert(m.userId, 'membership.userId present');
  assert(m.role, 'membership.role present');
  assert(m.status, 'membership.status present');
});

await test('U-G-03', 'Non-existent userId → 404', async () => {
  const res = await get(`${BASE}/users/USR-doesnotexist`, adminToken);
  assertStatus(res, 404);
  assertEqual(res.data?.error?.code, 'not_found', 'not_found');
});

await test('U-G-04 [BUG-A-01 verify]', 'No sensitive fields in GET /admin/users/:id response', async () => {
  const res = await get(`${BASE}/users/${aliceId}`, adminToken);
  assertStatus(res, 200);
  assertNoSecrets(res.data?.data?.user, 'user object');
});

// 4.3 Patch

// We'll use a throwaway user for promote/demote tests to avoid disrupting alice mid-suite
const throwawayEmail = `throwaway_user_${Date.now()}@medcord.test`;
let throwawayUserId;

const regRes = await post('/auth/register', {
  email: throwawayEmail,
  password: 'Medcord123!',
  name: 'Throwaway User',
});
throwawayUserId = regRes.data?.data?.user?.id;
assert(throwawayUserId, 'Throwaway user registered for patch tests');

await test('U-P-01', 'Promote user to platform admin → isAdmin: true', async () => {
  const res = await patch(`${BASE}/users/${throwawayUserId}`, { isAdmin: true }, adminToken);
  assertStatus(res, 200);
  assertEqual(res.data?.data?.user?.isAdmin, true, 'isAdmin is true');
});

await test('U-P-02', 'Promoted user can call admin endpoints', async () => {
  const loginR = await post('/auth/login', { email: throwawayEmail, password: 'Medcord123!' });
  const newAdminToken = loginR.data?.data?.tokens?.accessToken;
  const res = await get(`${BASE}/stats`, newAdminToken);
  assertStatus(res, 200);
});

await test('U-P-03', 'Demote platform admin → isAdmin: false', async () => {
  const res = await patch(`${BASE}/users/${throwawayUserId}`, { isAdmin: false }, adminToken);
  assertStatus(res, 200);
  assertEqual(res.data?.data?.user?.isAdmin, false, 'isAdmin is false');
});

await test('U-P-04', 'Demoted user gets 403 on admin endpoint', async () => {
  const loginR = await post('/auth/login', { email: throwawayEmail, password: 'Medcord123!' });
  const demotedToken = loginR.data?.data?.tokens?.accessToken;
  const res = await get(`${BASE}/stats`, demotedToken);
  assertStatus(res, 403);
});

await test('U-P-05', 'Verify email flag → isEmailVerified: true', async () => {
  const res = await patch(`${BASE}/users/${throwawayUserId}`, { isEmailVerified: true }, adminToken);
  assertStatus(res, 200);
  assertEqual(res.data?.data?.user?.isEmailVerified, true, 'isEmailVerified is true');
});

await test('U-P-06', 'Both fields at once', async () => {
  const res = await patch(`${BASE}/users/${throwawayUserId}`, { isAdmin: true, isEmailVerified: true }, adminToken);
  assertStatus(res, 200);
  assertEqual(res.data?.data?.user?.isAdmin, true, 'isAdmin updated');
  assertEqual(res.data?.data?.user?.isEmailVerified, true, 'isEmailVerified updated');
  // Reset
  await patch(`${BASE}/users/${throwawayUserId}`, { isAdmin: false }, adminToken);
});

await test('U-P-07', 'Empty body → 200, user unchanged', async () => {
  const before = (await get(`${BASE}/users/${throwawayUserId}`, adminToken)).data?.data?.user;
  const res = await patch(`${BASE}/users/${throwawayUserId}`, {}, adminToken);
  assertStatus(res, 200);
  assertEqual(res.data?.data?.user?.isAdmin, before.isAdmin, 'isAdmin unchanged');
});

await test('U-P-08', 'Non-existent userId → 404', async () => {
  const res = await patch(`${BASE}/users/USR-doesnotexist`, { isAdmin: true }, adminToken);
  assertStatus(res, 404);
  assertEqual(res.data?.error?.code, 'not_found', 'not_found');
});

await test('U-P-09', 'Invalid isAdmin type → 400', async () => {
  const res = await patch(`${BASE}/users/${throwawayUserId}`, { isAdmin: 'yes' }, adminToken);
  assertStatus(res, 400);
  assertEqual(res.data?.error?.code, 'validation_error', 'validation_error');
});

await test('U-P-10 [self-demotion]', 'Admin self-demotion → 200; subsequent admin call → 403', async () => {
  // Create a separate admin to self-demote (don't use alice — would lock us out)
  const selfDemoteEmail = `self_demote_${Date.now()}@medcord.test`;
  const reg = await post('/auth/register', { email: selfDemoteEmail, password: 'Medcord123!', name: 'Self Demote' });
  const selfId = reg.data?.data?.user?.id;
  await patch(`${BASE}/users/${selfId}`, { isAdmin: true }, adminToken);
  const selfLogin = await post('/auth/login', { email: selfDemoteEmail, password: 'Medcord123!' });
  const selfToken = selfLogin.data?.data?.tokens?.accessToken;

  // Self-demote
  const res = await patch(`${BASE}/users/${selfId}`, { isAdmin: false }, selfToken);
  assertStatus(res, 200);
  assertEqual(res.data?.data?.user?.isAdmin, false, 'isAdmin: false');

  // Now that same token should be 403 (requireAdmin re-checks DB each request)
  const check = await get(`${BASE}/stats`, selfToken);
  assertStatus(check, 403);
});

// 4.4 Disable

let disableTargetToken;
let disableTargetEmail = `disable_target_${Date.now()}@medcord.test`;
let disableTargetId;

await test('D-01', 'Register target user + disable → 204', async () => {
  const reg = await post('/auth/register', { email: disableTargetEmail, password: 'Medcord123!', name: 'Disable Target' });
  disableTargetId = reg.data?.data?.user?.id;
  disableTargetToken = reg.data?.data?.tokens?.accessToken;
  assert(disableTargetId, 'target user registered');

  const res = await apost(`/users/${disableTargetId}/disable`, {}, adminToken);
  assertStatus(res, 204);
});

await test('D-02 [BUG-A-02 verify + BUG-A-07]', 'Disable returns 204; tokenVersion not in response; access token still works (known bug)', async () => {
  // The disable endpoint returns 204 (no body) — confirm tokenVersion never exposed
  const disableRes = await apost(`/users/${disableTargetId}/disable`, {}, adminToken);
  assertStatus(disableRes, 204);
  const disableBody = typeof disableRes.data === 'object' && disableRes.data !== null ? disableRes.data : {};
  assert(!('tokenVersion' in disableBody), 'tokenVersion not in response body — BUG-A-02 fix confirmed');

  // BUG-A-07: authenticate middleware does NOT validate tokenVersion against DB.
  // bumpTokenVersion only kills refresh tokens; access tokens remain valid until expiry.
  // The handoff doc says "current access token is rejected" — this is WRONG.
  const meRes = await rget('/auth/me', disableTargetToken);
  if (meRes.status === 401) {
    // If fixed: great
    assert(true, 'access token correctly rejected after disable');
  } else {
    // Current behaviour: 200 — access token still valid (BUG-A-07)
    assertStatus(meRes, 200);
    throw new Error(
      'BUG-A-07: POST /admin/users/:id/disable bumps tokenVersion in DB but authenticate middleware ' +
      'never checks tokenVersion — existing access tokens remain valid until natural JWT expiry. ' +
      'Fix: add DB tokenVersion check in authenticate, or use a token blocklist/short access token TTL.'
    );
  }
});

await test('D-03', 'Disabled user can re-login and get new valid token', async () => {
  const loginR = await post('/auth/login', { email: disableTargetEmail, password: 'Medcord123!' });
  assertStatus(loginR, 200);
  const newToken = loginR.data?.data?.tokens?.accessToken;
  assert(newToken, 'new token obtained');

  const meRes = await rget('/auth/me', newToken);
  assertStatus(meRes, 200);
});

await test('D-04', 'Disable non-existent userId → 404', async () => {
  const res = await apost(`/users/USR-doesnotexist/disable`, {}, adminToken);
  assertStatus(res, 404);
  assertEqual(res.data?.error?.code, 'not_found', 'not_found');
});

await test('D-05', 'Disable same user twice → both 204', async () => {
  const res1 = await apost(`/users/${disableTargetId}/disable`, {}, adminToken);
  assertStatus(res1, 204);
  const res2 = await apost(`/users/${disableTargetId}/disable`, {}, adminToken);
  assertStatus(res2, 204);
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — Error Envelope (BUG-A-04 verify)
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── Section 5: Error Envelope ──');

await test('E-01 [BUG-A-04 verify]', '401 uses { error: { code, message } } envelope', async () => {
  const res = await get(`${BASE}/stats`, null);
  assertStatus(res, 401);
  assert(res.data?.error, 'error object present at top level');
  assert(typeof res.data.error.code === 'string', 'error.code is string');
  assert(typeof res.data.error.message === 'string', 'error.message is string');
  assert(!res.data.status, 'no top-level "status" field (stale envelope gone)');
  assert(!res.data.code, 'no top-level "code" field (stale envelope gone)');
});

await test('E-02 [BUG-A-04 verify]', '403 uses correct envelope', async () => {
  const res = await get(`${BASE}/stats`, bobToken);
  assertStatus(res, 403);
  assertEqual(res.data?.error?.code, 'forbidden', 'code is forbidden (snake_case)');
  assert(!res.data.code, 'no top-level code');
});

await test('E-03 [BUG-A-04 verify]', '404 uses correct envelope', async () => {
  const res = await get(`${BASE}/hospitals/HSP-doesnotexist`, adminToken);
  assertStatus(res, 404);
  assertEqual(res.data?.error?.code, 'not_found', 'code is not_found (snake_case)');
});

await test('E-04 [BUG-A-04 verify]', '400 validation_error includes fieldErrors', async () => {
  const res = await get(`${BASE}/hospitals?limit=101`, adminToken);
  assertStatus(res, 400);
  assertEqual(res.data?.error?.code, 'validation_error', 'code is validation_error');
  assert(res.data?.error?.message, 'error.message present');
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6 — Cross-cutting
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── Section 6: Cross-cutting ──');

await test('X-01', 'Timestamps are ISO 8601 strings', async () => {
  const res = await get(`${BASE}/hospitals/${hospAId}`, adminToken);
  const h = res.data?.data?.hospital;
  assert(typeof h?.createdAt === 'string', 'createdAt is string');
  assert(!isNaN(Date.parse(h.createdAt)), 'createdAt is valid ISO date');
  assert(typeof h?.updatedAt === 'string', 'updatedAt is string');
  assert(!isNaN(Date.parse(h.updatedAt)), 'updatedAt is valid ISO date');

  const uRes = await get(`${BASE}/users/${aliceId}`, adminToken);
  const u = uRes.data?.data?.user;
  assert(typeof u?.createdAt === 'string', 'user.createdAt is string');
  assert(!isNaN(Date.parse(u.createdAt)), 'user.createdAt valid ISO');
});

await test('X-02', 'ID prefixes: HSP-, USR-, MBR-', async () => {
  const hRes = await get(`${BASE}/hospitals/${hospAId}`, adminToken);
  const h = hRes.data?.data?.hospital;
  assert(h?.id?.startsWith('HSP-'), `hospital.id starts with HSP-: ${h?.id}`);

  const uRes = await get(`${BASE}/users/${aliceId}`, adminToken);
  const u = uRes.data?.data?.user;
  assert(u?.id?.startsWith('USR-'), `user.id starts with USR-: ${u?.id}`);

  const memberships = uRes.data?.data?.memberships;
  if (memberships.length > 0) {
    assert(memberships[0]?.id?.startsWith('MBR-'), `membership.id starts with MBR-: ${memberships[0]?.id}`);
  }
});

await test('X-03', 'PATCH modules uses dot-notation — unspecified toggles are unchanged', async () => {
  // Get current state
  const before = await get(`${BASE}/hospitals/${hospAId}`, adminToken);
  const mBefore = before.data?.data?.hospital?.modules;

  // Only toggle emr
  await patch(`${BASE}/hospitals/${hospAId}`, { modules: { emr: false } }, adminToken);
  const after = await get(`${BASE}/hospitals/${hospAId}`, adminToken);
  const mAfter = after.data?.data?.hospital?.modules;

  assertEqual(mAfter.emr, false, 'emr changed to false');
  if (mBefore?.labs !== undefined) assertEqual(mAfter.labs, mBefore.labs, 'labs unchanged');
  if (mBefore?.assets !== undefined) assertEqual(mAfter.assets, mBefore.assets, 'assets unchanged');
  if (mBefore?.onlineConsultation !== undefined) assertEqual(mAfter.onlineConsultation, mBefore.onlineConsultation, 'onlineConsultation unchanged');

  // Restore
  await patch(`${BASE}/hospitals/${hospAId}`, { modules: { emr: true } }, adminToken);
});

await test('X-04', 'Hard delete does NOT cascade members/patients', async () => {
  // Create a fresh hospital + check DB counts before
  const createRes = await post('/hospitals', {
    name: 'Cascade Test Hospital',
    type: 'clinic',
    location: 'Test Location, Accra',
    subdomain: `cascadetest-${Date.now()}`,
    timezone: 'Africa/Accra',
    locale: 'en',
  }, adminToken);
  const cascadeHospId = createRes.data?.data?.hospital?.id;
  assert(cascadeHospId, 'cascade hospital created');

  // Capture member count before delete (alice is a member via create)
  const membersBefore = await col('hospital_members').countDocuments({ hospitalId: cascadeHospId });

  // Hard delete via admin
  await del(`${BASE}/hospitals/${cascadeHospId}`, adminToken);

  // Hospital doc gone
  const hospDoc = await col('hospitals').findOne({ id: cascadeHospId });
  assert(!hospDoc, 'hospital doc removed from DB');

  // Members still exist (no cascade)
  const membersAfter = await col('hospital_members').countDocuments({ hospitalId: cascadeHospId });
  assertEqual(membersAfter, membersBefore, `hospital_members NOT cascaded (still ${membersAfter} docs)`);
});

await test('X-05', 'Promoting user to isAdmin does not change hospital StaffRole', async () => {
  // Bob's hospital role is hospital_admin in Hospital A
  const before = await get(`${BASE}/users/${state.users.bob.id}`, adminToken);
  const roleBefore = before.data?.data?.memberships?.find(m => m.hospitalId === hospAId)?.role;
  assert(roleBefore, 'bob has a membership role before promotion');

  await patch(`${BASE}/users/${state.users.bob.id}`, { isAdmin: true }, adminToken);

  const after = await get(`${BASE}/users/${state.users.bob.id}`, adminToken);
  const roleAfter = after.data?.data?.memberships?.find(m => m.hospitalId === hospAId)?.role;
  assertEqual(roleAfter, roleBefore, 'hospital StaffRole unchanged after isAdmin promotion');

  // Demote back
  await patch(`${BASE}/users/${state.users.bob.id}`, { isAdmin: false }, adminToken);
});

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────

await disconnect();
const failures = summary();
process.exit(failures > 0 ? 1 : 0);
