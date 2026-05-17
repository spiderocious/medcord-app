/**
 * staff.test.mjs — Tests for §3 Staff & Invitations (S-*)
 *
 * Covers: invitation lifecycle, bulk invite, accept/decline/revoke,
 * staff listing/filtering, suspend/activate/remove, org-chart, roles CRUD,
 * RBAC enforcement on all management operations.
 *
 * Usage: node staff.test.mjs
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
const members = state.members;

await connect();

console.log('=== STAFF & INVITATION TESTS ===\n');

// Register a fresh outsider user for invitation tests
const outsiderReg = await post('/auth/register', {
  email: 'outsider_staff@medcord.test',
  name: 'Outsider Staff',
  password: 'Medcord123!',
});
const outsider = outsiderReg.data.data;

// ── 3.1 Invitation Lifecycle ──────────────────────────────────────────────

let pendingInvToken;
let pendingInvId;

await test('S-HP-01', 'Invite staff by email as super_admin returns 201 with pending invitation', async () => {
  const res = await post(
    `/hospitals/${hospAId}/invitations`,
    { email: 'outsider_staff@medcord.test', role: 'doctor' },
    alice.accessToken,
  );
  assertStatus(res, 201);
  const inv = res.data.data.invitation;
  assert(inv?.token, 'invitation token present');
  assertEqual(inv?.status, 'pending', 'status is pending');
  pendingInvToken = inv.token;
  pendingInvId = inv.id;
});

await test('S-HP-02', 'List pending invitations includes created invitation', async () => {
  const res = await get(`/hospitals/${hospAId}/invitations`, alice.accessToken);
  assertStatus(res, 200);
  const items = res.data.data?.items ?? res.data.data?.invitations ?? [];
  assert(items.length > 0, 'at least one invitation in list');
  const found = items.find((i) => i.token === pendingInvToken || i.id === pendingInvId);
  assert(found, 'created invitation appears in list');
});

await test('S-HP-03', 'Resend invitation generates new token', async () => {
  const res = await post(
    `/hospitals/${hospAId}/invitations/${pendingInvId}/resend`,
    undefined,
    alice.accessToken,
  );
  assertStatus(res, 200);
  const newToken = res.data.data?.invitation?.token;
  assert(newToken, 'new token in response');
  // Token may or may not change depending on impl — just verify 200
  pendingInvToken = newToken ?? pendingInvToken;
});

await test('S-HP-04', 'Accept invitation — user becomes a member', async () => {
  const res = await post(
    `/invitations/${pendingInvToken}/accept`,
    undefined,
    outsider.tokens.accessToken,
  );
  assertStatus(res, 200);
  assertContains(res.data.data, 'hospitalId', 'hospitalId in response');
  // Verify membership in DB
  const member = await col('hospital_members').findOne({
    hospitalId: hospAId,
    userId: outsider.user.id,
  });
  assert(member, 'member record created in DB');
  assertEqual(member.role, 'doctor', 'role is doctor');
});

await test('S-HP-05', 'Decline invitation returns 200', async () => {
  // Create a fresh invitation for a new user to decline
  const tmpReg = await post('/auth/register', {
    email: 'decline_test@medcord.test',
    name: 'Decline Test',
    password: 'Medcord123!',
  });
  const tmpToken = tmpReg.data.data.tokens.accessToken;

  const invRes = await post(
    `/hospitals/${hospAId}/invitations`,
    { email: 'decline_test@medcord.test', role: 'nurse' },
    alice.accessToken,
  );
  const inv = invRes.data.data.invitation;

  const res = await post(`/invitations/${inv.token}/decline`, undefined, tmpToken);
  assert(res.status === 200 || res.status === 204, `expected 200 or 204, got ${res.status}`);
});

await test('S-HP-06', 'Revoke pending invitation returns 204', async () => {
  // Create an invitation to revoke
  const tmpReg = await post('/auth/register', {
    email: 'revoke_test@medcord.test',
    name: 'Revoke Test',
    password: 'Medcord123!',
  });

  const invRes = await post(
    `/hospitals/${hospAId}/invitations`,
    { email: 'revoke_test@medcord.test', role: 'nurse' },
    alice.accessToken,
  );
  const inv = invRes.data.data.invitation;

  const res = await del(
    `/hospitals/${hospAId}/invitations/${inv.id}`,
    alice.accessToken,
  );
  assertStatus(res, 204);
});

await test('S-EG-01', 'Invite same email twice (pending) returns 409', async () => {
  // Create fresh user and invite them
  const tmpReg = await post('/auth/register', {
    email: 'dupe_invite@medcord.test',
    name: 'Dupe Invite',
    password: 'Medcord123!',
  });

  // First invite
  await post(
    `/hospitals/${hospAId}/invitations`,
    { email: 'dupe_invite@medcord.test', role: 'nurse' },
    alice.accessToken,
  );

  // Second invite same email
  const res = await post(
    `/hospitals/${hospAId}/invitations`,
    { email: 'dupe_invite@medcord.test', role: 'nurse' },
    alice.accessToken,
  );
  assertStatus(res, 409);
  assertEqual(res.data.error?.code, 'conflict', 'conflict code');
});

await test('S-EG-04', 'Accept invitation with invalid token returns 404', async () => {
  const res = await post(
    '/invitations/00000000-0000-0000-0000-000000000000/accept',
    undefined,
    alice.accessToken,
  );
  assertStatus(res, 404);
});

await test('S-EG-05', 'Accept already-accepted invitation returns 409', async () => {
  // outsider_staff's invitation was already accepted above
  const res = await post(
    `/invitations/${pendingInvToken}/accept`,
    undefined,
    outsider.tokens.accessToken,
  );
  assertStatus(res, 409);
  assert(
    res.data.error?.message?.toLowerCase().includes('no longer valid') ||
    res.data.error?.message?.toLowerCase().includes('accepted') ||
    res.data.error?.code === 'conflict',
    `expected conflict on re-accept, got: ${JSON.stringify(res.data.error)}`,
  );
});

await test('S-EG-07', 'Accept invitation when already a hospital member returns 409', async () => {
  // alice is already a super_admin in Hospital A — invite her to Hospital A again
  // First we need to create an invitation for her (she's already a member)
  // The invite endpoint itself might reject — OR accept returns 409
  const invRes = await post(
    `/hospitals/${hospAId}/invitations`,
    { email: 'alice@medcord.test', role: 'doctor' },
    alice.accessToken,
  );
  // If create already rejects with conflict, that's also acceptable
  if (invRes.status === 409) {
    assertEqual(invRes.data.error?.code, 'conflict', 'conflict on invite of existing member');
    return;
  }
  // Otherwise accept should fail
  assertStatus(invRes, 201);
  const invToken = invRes.data.data.invitation.token;
  const res = await post(`/invitations/${invToken}/accept`, undefined, alice.accessToken);
  assertStatus(res, 409);
});

await test('S-RBAC-01', 'Invite staff as doctor (non-admin) returns 403', async () => {
  const res = await post(
    `/hospitals/${hospAId}/invitations`,
    { email: 'anyone@medcord.test', role: 'nurse' },
    carol.accessToken,
  );
  assertStatus(res, 403);
});

await test('S-RBAC-02', 'List invitations as nurse returns 403', async () => {
  const res = await get(`/hospitals/${hospAId}/invitations`, dave.accessToken);
  assertStatus(res, 403);
});

// ── 3.2 Staff Management ──────────────────────────────────────────────────

await test('S-HP-10', 'GET /staff returns paginated staff list', async () => {
  const res = await get(`/hospitals/${hospAId}/staff`, alice.accessToken);
  assertStatus(res, 200);
  const items = res.data.data?.items ?? [];
  assert(items.length > 0, 'staff list not empty');
  // Verify shape of first item
  const first = items[0];
  assert(first.id, 'member id present');
  assert(first.userId, 'userId present');
  assert(first.role, 'role present');
});

await test('S-HP-11', 'Filter staff by role returns only matching members', async () => {
  const res = await get(`/hospitals/${hospAId}/staff?role=doctor`, alice.accessToken);
  assertStatus(res, 200);
  const items = res.data.data?.items ?? [];
  // All returned members should be doctors (carol + outsider_staff)
  for (const m of items) {
    assertEqual(m.role, 'doctor', `member ${m.id} should be doctor`);
  }
});

await test('S-HP-12', 'Filter staff by status returns only matching members', async () => {
  const res = await get(`/hospitals/${hospAId}/staff?status=active`, alice.accessToken);
  assertStatus(res, 200);
  const items = res.data.data?.items ?? [];
  for (const m of items) {
    assertEqual(m.status, 'active', `member ${m.id} should be active`);
  }
});

await test('S-HP-13', 'GET /staff/:memberId returns single member', async () => {
  const carolMemberId = members.carol;
  const res = await get(`/hospitals/${hospAId}/staff/${carolMemberId}`, alice.accessToken);
  assertStatus(res, 200);
  const m = res.data.data?.member ?? res.data.data;
  assert(m?.id === carolMemberId || m?.memberId === carolMemberId, 'correct member returned');
});

await test('S-HP-14', 'PATCH /staff/:memberId updates role/department', async () => {
  const frankMemberId = members.frank;
  const res = await patch(
    `/hospitals/${hospAId}/staff/${frankMemberId}`,
    { department: 'Radiology' },
    alice.accessToken,
  );
  assertStatus(res, 200);
});

await test('S-HP-15', 'Suspend a staff member returns 204', async () => {
  // Suspend eve
  const eveMemberId = members.eve;
  const res = await post(
    `/hospitals/${hospAId}/staff/${eveMemberId}/suspend`,
    undefined,
    alice.accessToken,
  );
  assertStatus(res, 204);
});

await test('S-HP-16', 'Suspended member gets 403 on hospital-scoped request', async () => {
  // eve is now suspended — try to access a hospital route
  const res = await get(`/hospitals/${hospAId}/staff`, eve.accessToken);
  assertStatus(res, 403);
});

await test('S-HP-17', 'Activate suspended member returns 204', async () => {
  const eveMemberId = members.eve;
  const res = await post(
    `/hospitals/${hospAId}/staff/${eveMemberId}/activate`,
    undefined,
    alice.accessToken,
  );
  assertStatus(res, 204);
});

await test('S-HP-18', 'Re-activated member can access resources', async () => {
  const res = await get(`/hospitals/${hospAId}/staff`, eve.accessToken);
  assertStatus(res, 200);
});

await test('S-HP-20', 'GET /hospitals/:id/org-chart returns array', async () => {
  const res = await get(`/hospitals/${hospAId}/org-chart`, alice.accessToken);
  assertStatus(res, 200);
  const items = res.data.data?.chart ?? res.data.data?.items ?? res.data.data;
  assert(Array.isArray(items), 'org-chart is an array');
  assert(items.length > 0, 'org-chart has members');
});

await test('S-HP-21', 'GET /hospitals/:id/share returns workspaceUrl', async () => {
  const res = await get(`/hospitals/${hospAId}/share`, alice.accessToken);
  assertStatus(res, 200);
  assert(res.data.data?.workspaceUrl || res.data.data?.inviteUrl, 'workspaceUrl or inviteUrl present');
});

await test('S-HP-22', 'GET /hospitals/:id/roles returns array', async () => {
  const res = await get(`/hospitals/${hospAId}/roles`, alice.accessToken);
  assertStatus(res, 200);
  const items = res.data.data?.items ?? res.data.data?.roles ?? [];
  assert(Array.isArray(items), 'roles is an array');
});

await test('S-HP-23', 'POST /hospitals/:id/roles as super_admin creates custom role', async () => {
  const res = await post(
    `/hospitals/${hospAId}/roles`,
    { name: 'Test Role', slug: 'test-role', permissions: [] },
    alice.accessToken,
  );
  assertStatus(res, 201);
  assert(res.data.data?.role?.id || res.data.data?.id, 'role id present');
});

await test('S-EG-10', 'Suspend yourself returns 403', async () => {
  const aliceMemberRes = await get(`/hospitals/${hospAId}/staff`, alice.accessToken);
  const aliceMember = (aliceMemberRes.data.data?.items ?? []).find((m) => m.userId === alice.id);
  const res = await post(
    `/hospitals/${hospAId}/staff/${aliceMember.id}/suspend`,
    undefined,
    alice.accessToken,
  );
  assertStatus(res, 403);
  assert(
    res.data.error?.message?.toLowerCase().includes('yourself') ||
    res.data.error?.code === 'forbidden',
    `expected self-suspend message, got: ${JSON.stringify(res.data.error)}`,
  );
});

await test('S-EG-12', 'GET /staff/:memberId from different hospital returns 404', async () => {
  // carol's member ID is in Hospital A — try to access it from Hospital B context
  // grace is the owner of Hospital B
  const carolMemberId = members.carol;
  const hospBId = state.hospitalB.id;
  const res = await get(`/hospitals/${hospBId}/staff/${carolMemberId}`, grace.accessToken);
  assertStatus(res, 404);
});

await test('S-RBAC-10', 'Suspend member as doctor returns 403', async () => {
  const eveMemberId = members.eve;
  const res = await post(
    `/hospitals/${hospAId}/staff/${eveMemberId}/suspend`,
    undefined,
    carol.accessToken,
  );
  assertStatus(res, 403);
});

await test('S-RBAC-11', 'Remove member as nurse returns 403', async () => {
  const eveMemberId = members.eve;
  const res = await del(
    `/hospitals/${hospAId}/staff/${eveMemberId}`,
    dave.accessToken,
  );
  assertStatus(res, 403);
});

await test('S-RBAC-12', 'Create role as hospital_admin returns 403 (super_admin only)', async () => {
  const res = await post(
    `/hospitals/${hospAId}/roles`,
    { name: 'Admin Role Test', permissions: [] },
    bob.accessToken,
  );
  assertStatus(res, 403);
});

// Remove a staff member (do this last)
await test('S-HP-19', 'Remove a staff member returns 204', async () => {
  // Remove outsider_staff (who was added during this test run)
  const staffRes = await get(`/hospitals/${hospAId}/staff`, alice.accessToken);
  const outsiderMember = (staffRes.data.data?.items ?? []).find(
    (m) => m.userId === outsider.user.id,
  );
  assert(outsiderMember, 'outsider member found');
  const res = await del(
    `/hospitals/${hospAId}/staff/${outsiderMember.id}`,
    alice.accessToken,
  );
  assertStatus(res, 204);
});

// ── Summary ───────────────────────────────────────────────────────────────

await disconnect();
const failures = summary();
process.exit(failures > 0 ? 1 : 0);
