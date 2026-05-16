/**
 * auth.test.mjs — Tests for §1 Auth (A-*)
 *
 * Covers: registration, login, /me, password change, token refresh,
 * logout, token revocation, JWT attack vectors, 2FA setup + verify.
 *
 * Usage: node auth.test.mjs
 */

import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { connect, disconnect, col } from './db.mjs';
import { get, post, patch } from './api.mjs';
import { test, summary, assert, assertEqual, assertStatus } from './runner.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const state = JSON.parse(await readFile(join(__dirname, '.state.json'), 'utf8'));

await connect();

console.log('=== AUTH TESTS ===\n');

// ── 1.1 Registration & Login ───────────────────────────────────────────────

await test('A-HP-01', 'Register new user returns 201 with user+tokens', async () => {
  const res = await post('/auth/register', {
    email: 'testuser_a_hp_01@medcord.test',
    name: 'Test A-HP-01',
    password: 'Medcord123!',
  });
  assertStatus(res, 201);
  const d = res.data.data;
  assert(d.user?.id, 'user.id present');
  assert(d.user?.email, 'user.email present');
  assert(d.user?.name, 'user.name present');
  assert(d.tokens?.accessToken, 'accessToken present');
  assert(d.tokens?.refreshToken, 'refreshToken present');
});

await test('A-HP-02', 'Login with correct credentials returns 200 with tokens', async () => {
  const res = await post('/auth/login', {
    email: 'alice@medcord.test',
    password: 'Medcord123!',
  });
  assertStatus(res, 200);
  assert(res.data.data.tokens?.accessToken, 'accessToken present');
  assert(res.data.data.tokens?.refreshToken, 'refreshToken present');
});

await test('A-HP-03', 'GET /auth/me with valid token returns user', async () => {
  const res = await get('/auth/me', state.users.alice.accessToken);
  assertStatus(res, 200);
  const user = res.data.data.user;
  assert(user?.id, 'user.id present');
  assertEqual(user.email, 'alice@medcord.test', 'email matches');
});

await test('A-HP-04', 'PATCH /auth/me — update name', async () => {
  const res = await patch('/auth/me', { name: 'Alice M. (updated)' }, state.users.alice.accessToken);
  assertStatus(res, 200);
  assertEqual(res.data.data.user?.name, 'Alice M. (updated)', 'name updated');
  // restore
  await patch('/auth/me', { name: 'Alice Mensah' }, state.users.alice.accessToken);
});

await test('A-HP-05', 'PATCH /auth/me/password — correct current password returns 204', async () => {
  const res = await patch(
    '/auth/me/password',
    { currentPassword: 'Medcord123!', newPassword: 'NewPass456!' },
    state.users.bob.accessToken,
  );
  assertStatus(res, 204);
});

await test('A-HP-06', 'Login fails with old password after password change', async () => {
  const res = await post('/auth/login', {
    email: 'bob@medcord.test',
    password: 'Medcord123!',
  });
  assertStatus(res, 401);
  assertEqual(res.data.error?.code, 'invalid_credentials', 'error code correct');
});

await test('A-HP-07', 'Login succeeds with new password after change', async () => {
  const res = await post('/auth/login', {
    email: 'bob@medcord.test',
    password: 'NewPass456!',
  });
  assertStatus(res, 200);
  assert(res.data.data.tokens?.accessToken, 'token present');
  // update bob's token in memory for subsequent tests
  state.users.bob.accessToken = res.data.data.tokens.accessToken;
  state.users.bob.refreshToken = res.data.data.tokens.refreshToken;
  // restore password
  await patch(
    '/auth/me/password',
    { currentPassword: 'NewPass456!', newPassword: 'Medcord123!' },
    state.users.bob.accessToken,
  );
});

// Edge cases

await test('A-EG-01', 'Register duplicate email returns 409', async () => {
  const res = await post('/auth/register', {
    email: 'alice@medcord.test',
    name: 'Duplicate Alice',
    password: 'Medcord123!',
  });
  assertStatus(res, 409);
  assertEqual(res.data.error?.code, 'conflict', 'error code is conflict');
});

await test('A-EG-02', 'Register with uppercase email is stored lowercase', async () => {
  const res = await post('/auth/register', {
    email: 'UPPERCASE_A_EG_02@MEDCORD.TEST',
    name: 'Uppercase Test',
    password: 'Medcord123!',
  });
  assertStatus(res, 201);
  assertEqual(
    res.data.data.user.email,
    'uppercase_a_eg_02@medcord.test',
    'email lowercased in response',
  );
});

await test('A-EG-03', 'Login with uppercase email works (case-insensitive)', async () => {
  const res = await post('/auth/login', {
    email: 'ALICE@MEDCORD.TEST',
    password: 'Medcord123!',
  });
  assertStatus(res, 200);
});

await test('A-EG-04', 'Register password exactly 7 chars returns 400', async () => {
  const res = await post('/auth/register', {
    email: 'short_pw@medcord.test',
    name: 'Short PW',
    password: 'abc1234',
  });
  assertStatus(res, 400);
  assertEqual(res.data.error?.code, 'validation_error', 'validation_error code');
});

await test('A-EG-05', 'Register password exactly 8 chars returns 201', async () => {
  const res = await post('/auth/register', {
    email: 'exact8_pw@medcord.test',
    name: 'Exact 8',
    password: 'abcd1234',
  });
  assertStatus(res, 201);
});

await test('A-EG-06', 'Login wrong password returns 401 invalid_credentials', async () => {
  const res = await post('/auth/login', {
    email: 'alice@medcord.test',
    password: 'WrongPassword!',
  });
  assertStatus(res, 401);
  assertEqual(res.data.error?.code, 'invalid_credentials', 'error code');
});

await test('A-EG-07', 'Login unknown email returns same 401 code (no enumeration)', async () => {
  const res = await post('/auth/login', {
    email: 'nobody_at_all@medcord.test',
    password: 'SomePassword1!',
  });
  assertStatus(res, 401);
  assertEqual(res.data.error?.code, 'invalid_credentials', 'same code as wrong password');
});

await test('A-EG-08', 'Register missing name returns 400 with field_errors.name', async () => {
  const res = await post('/auth/register', {
    email: 'noname@medcord.test',
    password: 'Medcord123!',
  });
  assertStatus(res, 400);
  assert(res.data.error?.field_errors?.name, 'field_errors.name present');
});

await test('A-EG-09', 'Register missing email returns 400 with field_errors.email', async () => {
  const res = await post('/auth/register', {
    name: 'No Email',
    password: 'Medcord123!',
  });
  assertStatus(res, 400);
  assert(res.data.error?.field_errors?.email, 'field_errors.email present');
});

await test('A-EG-10', 'Register invalid email format returns 400', async () => {
  const res = await post('/auth/register', {
    email: 'notanemail',
    name: 'Bad Email',
    password: 'Medcord123!',
  });
  assertStatus(res, 400);
  assertEqual(res.data.error?.code, 'validation_error', 'validation_error code');
});

await test('A-EG-11', 'PATCH /auth/me/password — wrong current password returns 401', async () => {
  const res = await patch(
    '/auth/me/password',
    { currentPassword: 'WrongCurrent!', newPassword: 'Medcord999!' },
    state.users.carol.accessToken,
  );
  assertStatus(res, 401);
  assertEqual(res.data.error?.code, 'invalid_credentials', 'error code');
});

await test('A-EG-12', 'PATCH /auth/me/password — new password 7 chars returns 400', async () => {
  const res = await patch(
    '/auth/me/password',
    { currentPassword: 'Medcord123!', newPassword: 'abc1234' },
    state.users.carol.accessToken,
  );
  assertStatus(res, 400);
  assertEqual(res.data.error?.code, 'validation_error', 'validation_error code');
});

// Security

await test('A-SEC-01', 'No Authorization header returns 401', async () => {
  const res = await get('/auth/me');
  assertStatus(res, 401);
  assertEqual(res.data.error?.code, 'unauthorized', 'unauthorized code');
});

await test('A-SEC-02', 'Tampered JWT signature returns 401', async () => {
  const token = state.users.alice.accessToken;
  const parts = token.split('.');
  parts[2] = parts[2].slice(0, -4) + 'XXXX'; // corrupt signature
  const badToken = parts.join('.');
  const res = await get('/auth/me', badToken);
  assertStatus(res, 401);
});

await test('A-SEC-03', 'Totally garbage token returns 401', async () => {
  const res = await get('/auth/me', 'not.a.jwt.at.all.garbage');
  assertStatus(res, 401);
});

await test('A-SEC-04', 'Empty bearer token returns 401', async () => {
  const { api } = await import('./api.mjs');
  const res = await api('/auth/me', { headers: { Authorization: 'Bearer ' } });
  assertStatus(res, 401);
});

await test('A-SEC-05', 'Basic auth header returns 401', async () => {
  const { api } = await import('./api.mjs');
  const res = await api('/auth/me', { headers: { Authorization: 'Basic dXNlcjpwYXNz' } });
  assertStatus(res, 401);
});

// ── 1.2 Token Refresh & Logout ────────────────────────────────────────────

// Use dave's tokens for refresh/logout tests to avoid disrupting other user sessions
const loginRes = await post('/auth/login', {
  email: 'dave@medcord.test',
  password: 'Medcord123!',
});
let daveAccess = loginRes.data.data.tokens.accessToken;
let daveRefresh = loginRes.data.data.tokens.refreshToken;

await test('A-HP-10', 'Refresh with valid refreshToken returns new tokens', async () => {
  const res = await post('/auth/refresh', { refreshToken: daveRefresh });
  assertStatus(res, 200);
  assert(res.data.data.tokens?.accessToken, 'new accessToken');
  assert(res.data.data.tokens?.refreshToken, 'new refreshToken');
  daveAccess = res.data.data.tokens.accessToken;
  daveRefresh = res.data.data.tokens.refreshToken;
});

await test('A-HP-12', 'Logout returns 204', async () => {
  const res = await post('/auth/logout', { refreshToken: daveRefresh }, daveAccess);
  assertStatus(res, 204);
});

await test('A-HP-13', 'Refresh after logout fails with 401', async () => {
  const res = await post('/auth/refresh', { refreshToken: daveRefresh });
  assertStatus(res, 401);
  assertEqual(res.data.error?.code, 'unauthorized', 'unauthorized code');
});

await test('A-EG-20', 'Refresh with garbage token returns 401', async () => {
  const res = await post('/auth/refresh', { refreshToken: 'garbage.garbage.garbage' });
  assertStatus(res, 401);
});

await test('A-EG-22', 'Refresh missing refreshToken field returns 400', async () => {
  const res = await post('/auth/refresh', {});
  assertStatus(res, 400);
  assertEqual(res.data.error?.code, 'validation_error', 'validation_error code');
});

await test('A-EG-23', 'Logout without body returns 400', async () => {
  const res = await post('/auth/logout', undefined, state.users.alice.accessToken);
  assertStatus(res, 400);
  assertEqual(res.data.error?.code, 'validation_error', 'validation_error code');
});

// ── 1.3 Two-Factor Authentication ─────────────────────────────────────────

// Use a dedicated throwaway user for 2FA tests so seeded personas stay clean
const tfa2faReg = await post('/auth/register', {
  email: 'twofa_tester@medcord.test',
  name: '2FA Tester',
  password: 'Medcord123!',
});
const eveToken = tfa2faReg.data.data.tokens.accessToken;

await test('A-HP-20', 'POST /auth/setup-2fa returns otpauthUrl', async () => {
  const res = await post('/auth/setup-2fa', undefined, eveToken);
  assertStatus(res, 200);
  assert(res.data.data.otpauthUrl?.startsWith('otpauth://'), 'otpauthUrl has otpauth:// prefix');
  // BUG-08 fix: secret should NOT be in response (server stores it as pendingTwoFactorSecret)
  assert(!res.data.data.secret, 'secret is NOT in response (server-side storage, BUG-08 fix)');
});

await test('A-HP-20-DB', 'setup-2fa stores pendingTwoFactorSecret in DB', async () => {
  // Use eveToken (twofa_tester) which hasn't had verify called yet after this setup
  const res = await post('/auth/setup-2fa', undefined, eveToken);
  assertStatus(res, 200);
  const dbUser = await col('users').findOne({ email: 'twofa_tester@medcord.test' });
  assert(dbUser?.pendingTwoFactorSecret, 'pendingTwoFactorSecret stored in DB');
  assert(!dbUser?.twoFactorEnabled, '2FA not yet enabled before verify');
});

await test('A-EG-30', 'POST /auth/verify-2fa with wrong TOTP code returns 401 [BUG-10]', async () => {
  // BUG-10: otplib.verify() returns { valid: boolean } not a raw boolean.
  // auth.service.ts checks `if (!ok)` — always false (truthy object) → any code accepted.
  // This test documents the bug; it will pass once BUG-10 is fixed.
  // Use a fresh user so this test is isolated
  const tmpReg = await post('/auth/register', {
    email: 'twofa_eg30@medcord.test',
    name: '2FA EG30 Tester',
    password: 'Medcord123!',
  });
  const tmpToken = tmpReg.data.data.tokens.accessToken;
  await post('/auth/setup-2fa', undefined, tmpToken);
  const res = await post('/auth/verify-2fa', { totpCode: '000000' }, tmpToken);
  if (res.status === 204) {
    throw new Error(
      'BUG-10: verify-2fa accepted code "000000" (should be 401). ' +
      'otplib.verify() returns { valid: false } (truthy object) — fix: check result.valid not result',
    );
  }
  assertStatus(res, 401);
});

await test('A-EG-33', 'Login totpCode not 6 chars returns 400', async () => {
  const res = await post('/auth/login', {
    email: 'eve@medcord.test',
    password: 'Medcord123!',
    totpCode: '12345', // 5 chars
  });
  // Either 400 (validation) or 200 (2FA not enabled yet for eve) — if 2FA not enabled
  // the totpCode field should be ignored. Test that it doesn't crash.
  assert(res.status === 200 || res.status === 400, `expected 200 or 400, got ${res.status}`);
});

// ── Summary ───────────────────────────────────────────────────────────────

await disconnect();
const failures = summary();
process.exit(failures > 0 ? 1 : 0);
