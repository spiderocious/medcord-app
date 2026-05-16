/**
 * review.test.mjs — Tests for §8 Review Queue (RQ-*)
 *
 * Routes: /api/v1/hospitals/:hospitalId/review-queue[/...]
 *
 * Usage: node review.test.mjs
 * Prerequisite: seed.mjs must have run and .state.json must be current.
 */

import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { connect, disconnect } from './db.mjs';
import { get, post } from './api.mjs';
import { test, summary, assert, assertEqual, assertStatus } from './runner.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const state = JSON.parse(await readFile(join(__dirname, '.state.json'), 'utf8'));

const { alice, bob, carol } = state.users;
const hospAId = state.hospitalA.id;
const patientId = state.patients[0];
const rqBase = `/hospitals/${hospAId}/review-queue`;

await connect();

console.log('=== REVIEW QUEUE TESTS ===\n');

let itemId;
let item2Id;
let item3Id;

await test('RQ-HP-01', 'Create review item returns 201 with status=pending', async () => {
  const res = await post(rqBase, {
    patientId,
    type: 'lab_result',
    referenceId: 'LAB-test-ref-001',
    title: 'CBC Result — Abnormal WBC',
    summary: 'WBC elevated, requires physician review',
    priority: 'urgent',
  }, alice.accessToken);
  assertStatus(res, 201);
  const item = res.data.data?.item;
  assert(item?.id, 'item.id present');
  assertEqual(item?.status, 'pending', 'status is pending');
  itemId = item.id;
});

await test('RQ-HP-02', 'List review queue returns paginated result', async () => {
  const res = await get(rqBase, alice.accessToken);
  assertStatus(res, 200);
  const d = res.data.data;
  assert(Array.isArray(d?.items), 'items is array');
  assert(typeof d?.total === 'number', 'total is number');
  assert(d.items.length > 0, 'at least one item');
});

await test('RQ-HP-03', 'Filter by status=pending returns only pending items', async () => {
  const res = await get(`${rqBase}?status=pending`, alice.accessToken);
  assertStatus(res, 200);
  const items = res.data.data?.items ?? [];
  for (const i of items) {
    assertEqual(i.status, 'pending', `item ${i.id} should be pending`);
  }
});

await test('RQ-HP-04', 'GET review item returns correct item', async () => {
  const res = await get(`${rqBase}/${itemId}`, alice.accessToken);
  assertStatus(res, 200);
  const item = res.data.data?.item;
  assertEqual(item?.id, itemId, 'correct item returned');
});

await test('RQ-HP-05', 'Approve item returns 200 with status=approved, reviewedBy+reviewedAt set', async () => {
  const res = await post(`${rqBase}/${itemId}/act`, { action: 'approve', note: 'Reviewed and approved' }, alice.accessToken);
  assertStatus(res, 200);
  const item = res.data.data?.item;
  assertEqual(item?.status, 'approved', 'status is approved');
  assert(item?.reviewedBy, 'reviewedBy set');
  assert(item?.reviewedAt, 'reviewedAt set');
});

await test('RQ-HP-06', 'Reject item with note returns 200 with status=rejected', async () => {
  // Create a new item to reject
  const createRes = await post(rqBase, {
    patientId,
    type: 'vitals',
    referenceId: 'VIT-test-ref-002',
    title: 'High BP Reading',
    priority: 'routine',
  }, carol.accessToken);
  item2Id = createRes.data.data?.item?.id;

  const res = await post(`${rqBase}/${item2Id}/act`, { action: 'reject', note: 'False alarm — patient rechecked' }, alice.accessToken);
  assertStatus(res, 200);
  const item = res.data.data?.item;
  assertEqual(item?.status, 'rejected', 'status is rejected');
  assert(item?.reviewNote || item?.note, 'reviewNote set');
});

await test('RQ-HP-07', 'Escalate item returns 200 with status=escalated', async () => {
  const createRes = await post(rqBase, {
    patientId,
    type: 'medication',
    referenceId: 'MED-test-ref-003',
    title: 'Drug interaction warning',
    priority: 'stat',
  }, carol.accessToken);
  item3Id = createRes.data.data?.item?.id;

  const res = await post(`${rqBase}/${item3Id}/act`, { action: 'escalate', note: 'Needs senior review' }, alice.accessToken);
  assertStatus(res, 200);
  assertEqual(res.data.data?.item?.status, 'escalated', 'status is escalated');
});

await test('RQ-HP-08', 'Approve from escalated state returns 200', async () => {
  const res = await post(`${rqBase}/${item3Id}/act`, { action: 'approve', note: 'Escalated item approved' }, alice.accessToken);
  assertStatus(res, 200);
  assertEqual(res.data.data?.item?.status, 'approved', 'escalated item approved');
});

await test('RQ-EG-01', 'Approve already-approved item returns 409', async () => {
  const res = await post(`${rqBase}/${itemId}/act`, { action: 'approve' }, alice.accessToken);
  assertStatus(res, 409);
  assert(
    res.data.error?.message?.toLowerCase().includes('resolved') ||
    res.data.error?.code === 'conflict',
    `expected conflict, got: ${JSON.stringify(res.data.error)}`,
  );
});

await test('RQ-EG-02', 'Reject already-rejected item returns 409', async () => {
  const res = await post(`${rqBase}/${item2Id}/act`, { action: 'reject', note: 'Second rejection' }, alice.accessToken);
  assertStatus(res, 409);
  assertEqual(res.data.error?.code, 'conflict', 'conflict error');
});

await test('RQ-EG-03', 'Act on item from wrong hospital returns 404', async () => {
  const res = await post(
    `/hospitals/${state.hospitalB.id}/review-queue/${itemId}/act`,
    { action: 'approve' },
    state.users.grace.accessToken,
  );
  assertStatus(res, 404);
});

await test('RQ-EG-04', 'Invalid action value returns 400', async () => {
  // Create a fresh pending item
  const createRes = await post(rqBase, {
    patientId,
    type: 'document',
    referenceId: 'DOC-test-ref-004',
    title: 'Consent Form',
    priority: 'routine',
  }, alice.accessToken);
  const tmpItemId = createRes.data.data?.item?.id;

  const res = await post(`${rqBase}/${tmpItemId}/act`, { action: 'invalid_action' }, alice.accessToken);
  assertStatus(res, 400);
  assertEqual(res.data.error?.code, 'validation_error', 'validation_error');
});

// ── Summary ───────────────────────────────────────────────────────────────

await disconnect();
const failures = summary();
process.exit(failures > 0 ? 1 : 0);
