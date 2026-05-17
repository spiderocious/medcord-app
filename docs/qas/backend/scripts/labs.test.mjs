/**
 * labs.test.mjs — Tests for §6 Lab Orders (L-*)
 *
 * State machine: awaiting_sample → sample_received → awaiting_test
 *                → in_progress → awaiting_result → result_ready → result_released
 *
 * Routes: /api/v1/hospitals/:hospitalId/patients/:patientId/labs[/...]
 *
 * Usage: node labs.test.mjs
 * Prerequisite: restore-seed.mjs must have run (node restore-seed.mjs). Safe to re-run.
 */

import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { connect, disconnect } from './db.mjs';
import { get, post, patch } from './api.mjs';
import { test, summary, assert, assertEqual, assertStatus } from './runner.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const state = JSON.parse(await readFile(join(__dirname, '.state.json'), 'utf8'));

const { alice, carol, frank } = state.users;
const hospAId = state.hospitalA.id;
const patientId = state.patients[0]; // John Doe
const labBase = `/hospitals/${hospAId}/patients/${patientId}/labs`;

await connect();

console.log('=== LAB ORDER TESTS ===\n');

// ── 6.1 Happy Path ─────────────────────────────────────────────────────────

let orderId;

await test('L-HP-01', 'Create lab order returns 201 with status=awaiting_sample', async () => {
  const res = await post(labBase, {
    testName: 'Complete Blood Count',
    testCode: 'CBC',
    category: 'Hematology',
    priority: 'routine',
    sampleType: 'blood',
  }, carol.accessToken);
  assertStatus(res, 201);
  const order = res.data.data?.order;
  assert(order?.id, 'order.id present');
  assertEqual(order?.status, 'awaiting_sample', 'initial status is awaiting_sample');
  assert(Array.isArray(order?.stateHistory), 'stateHistory is array');
  orderId = order.id;
});

await test('L-HP-02', 'Advance: awaiting_sample → sample_received', async () => {
  const res = await post(
    `${labBase}/${orderId}/advance`,
    { note: 'Sample collected', sampleType: 'blood', sampleCollectedAt: new Date().toISOString() },
    frank.accessToken, // frank is lab_tech
  );
  assertStatus(res, 200);
  assertEqual(res.data.data?.order?.status, 'sample_received', 'status is sample_received');
});

await test('L-HP-03', 'Advance: sample_received → awaiting_test', async () => {
  const res = await post(
    `${labBase}/${orderId}/advance`,
    { note: 'Sample received at lab' },
    frank.accessToken,
  );
  assertStatus(res, 200);
  assertEqual(res.data.data?.order?.status, 'awaiting_test', 'status is awaiting_test');
});

await test('L-HP-04', 'Advance: awaiting_test → in_progress', async () => {
  const res = await post(
    `${labBase}/${orderId}/advance`,
    { note: 'Testing started' },
    frank.accessToken,
  );
  assertStatus(res, 200);
  assertEqual(res.data.data?.order?.status, 'in_progress', 'status is in_progress');
});

await test('L-HP-05', 'Advance: in_progress → awaiting_result', async () => {
  const res = await post(
    `${labBase}/${orderId}/advance`,
    { note: 'Awaiting results from analyzer' },
    frank.accessToken,
  );
  assertStatus(res, 200);
  assertEqual(res.data.data?.order?.status, 'awaiting_result', 'status is awaiting_result');
});

await test('L-HP-06', 'Record result at awaiting_result → status becomes result_ready', async () => {
  const res = await post(
    `${labBase}/${orderId}/result`,
    {
      value: 'Hb: 14.5 g/dL, WBC: 7.2 x10³/μL, Platelets: 250 x10³/μL',
      unit: 'various',
      referenceRange: 'Normal',
      isAbnormal: false,
    },
    frank.accessToken,
  );
  assertStatus(res, 200);
  assertEqual(res.data.data?.order?.status, 'result_ready', 'status is result_ready');
  assert(res.data.data?.order?.result?.value, 'result.value set');
});

await test('L-HP-07', 'Advance: result_ready → result_released', async () => {
  const res = await post(
    `${labBase}/${orderId}/advance`,
    { note: 'Results reviewed and released by doctor' },
    carol.accessToken,
  );
  assertStatus(res, 200);
  const order = res.data.data?.order;
  assertEqual(order?.status, 'result_released', 'status is result_released');
  assert(order?.resultReleasedAt, 'resultReleasedAt set');
  assert(order?.resultReleasedBy, 'resultReleasedBy set');
});

await test('L-HP-08', 'GET lab order returns full order with stateHistory', async () => {
  const res = await get(`${labBase}/${orderId}`, carol.accessToken);
  assertStatus(res, 200);
  const order = res.data.data?.order;
  assert(order?.id === orderId, 'correct order returned');
  assert(Array.isArray(order?.stateHistory), 'stateHistory present');
});

await test('L-HP-09', 'PATCH lab order before release updates notes', async () => {
  // Create a new order for this test (the existing one is released)
  const createRes = await post(labBase, { testName: 'Urinalysis', priority: 'routine' }, carol.accessToken);
  const newOrderId = createRes.data.data?.order?.id;

  const res = await patch(
    `${labBase}/${newOrderId}`,
    { notes: 'Updated notes before processing' },
    carol.accessToken,
  );
  assertStatus(res, 200);
  assertEqual(res.data.data?.order?.notes, 'Updated notes before processing', 'notes updated');
});

await test('L-HP-10', 'List lab orders returns paginated result', async () => {
  const res = await get(labBase, carol.accessToken);
  assertStatus(res, 200);
  const d = res.data.data;
  assert(Array.isArray(d?.items), 'items is array');
  assert(typeof d?.total === 'number', 'total is number');
});

await test('L-HP-11', 'Filter by status=awaiting_sample returns only matching', async () => {
  const res = await get(`${labBase}?status=awaiting_sample`, carol.accessToken);
  assertStatus(res, 200);
  const items = res.data.data?.items ?? [];
  for (const o of items) {
    assertEqual(o.status, 'awaiting_sample', `order ${o.id} should be awaiting_sample`);
  }
});

await test('L-HP-12', 'Filter by priority=stat returns only matching', async () => {
  // Create a stat order first
  await post(labBase, { testName: 'Stat Glucose', priority: 'stat' }, carol.accessToken);

  const res = await get(`${labBase}?priority=stat`, carol.accessToken);
  assertStatus(res, 200);
  const items = res.data.data?.items ?? [];
  assert(items.length > 0, 'at least one stat order');
  for (const o of items) {
    assertEqual(o.priority, 'stat', `order ${o.id} should be stat priority`);
  }
});

// ── 6.2 State Machine Guards ──────────────────────────────────────────────

await test('L-SM-01', 'Advance from terminal result_released returns 409', async () => {
  const res = await post(
    `${labBase}/${orderId}/advance`,
    { note: 'Try to advance past final state' },
    carol.accessToken,
  );
  assertStatus(res, 409);
  assert(
    res.data.error?.message?.toLowerCase().includes('final') ||
    res.data.error?.code === 'conflict',
    `expected final state conflict, got: ${JSON.stringify(res.data.error)}`,
  );
});

await test('L-SM-02', 'Advance from awaiting_result without recording result returns 409 [BUG-12]', async () => {
  // BUG-12: VALID_TRANSITIONS allows awaiting_result → result_ready via advance(),
  // with no guard requiring result to be recorded first. The guard only protects
  // result_ready → result_released (line 143). So advance() takes you from
  // awaiting_result → result_ready even without a recorded result.
  const createRes = await post(labBase, { testName: 'SM02 Test', priority: 'routine' }, carol.accessToken);
  const smOrderId = createRes.data.data?.order?.id;

  // Advance through all states to awaiting_result
  for (let i = 0; i < 4; i++) {
    await post(`${labBase}/${smOrderId}/advance`, {}, frank.accessToken);
  }

  // Try to advance from awaiting_result → result_ready WITHOUT recording result
  const res = await post(
    `${labBase}/${smOrderId}/advance`,
    { note: 'Trying to skip result recording' },
    carol.accessToken,
  );
  if (res.status === 200 && res.data.data?.order?.status === 'result_ready') {
    throw new Error(
      `BUG-12: advance() from awaiting_result → result_ready succeeded WITHOUT recording a result. ` +
      `The state machine should require a result to be recorded before allowing this transition. ` +
      `Only the result_ready → result_released transition has a guard; awaiting_result → result_ready has none.`,
    );
  }
  assertStatus(res, 409);
});

await test('L-SM-03', 'Record result at wrong state (awaiting_sample) returns 409', async () => {
  // Create fresh order (starts at awaiting_sample)
  const createRes = await post(labBase, { testName: 'SM03 Test', priority: 'routine' }, carol.accessToken);
  const smOrderId = createRes.data.data?.order?.id;

  // Try to record result at awaiting_sample
  const res = await post(
    `${labBase}/${smOrderId}/result`,
    { value: 'Early result', isAbnormal: false },
    frank.accessToken,
  );
  assertStatus(res, 409);
  assert(
    res.data.error?.message?.toLowerCase().includes('awaiting_result') ||
    res.data.error?.code === 'conflict',
    `expected state conflict for result at wrong state, got: ${JSON.stringify(res.data.error)}`,
  );
});

await test('L-SM-04', 'PATCH released lab order returns 409', async () => {
  const res = await patch(
    `${labBase}/${orderId}`,
    { notes: 'Try to edit released order' },
    carol.accessToken,
  );
  assertStatus(res, 409);
  assert(
    res.data.error?.message?.toLowerCase().includes('released') ||
    res.data.error?.code === 'conflict',
    `expected released conflict, got: ${JSON.stringify(res.data.error)}`,
  );
});

await test('L-SM-05', 'stateHistory grows with each advance', async () => {
  const res = await get(`${labBase}/${orderId}`, carol.accessToken);
  assertStatus(res, 200);
  const order = res.data.data?.order;
  // Order went through 6 transitions: awaiting_sample → ... → result_released
  // Plus sample advance had sampleType — stateHistory should have entries
  assert(order?.stateHistory?.length >= 4, `stateHistory should have ≥4 entries, got ${order?.stateHistory?.length}`);
});

// ── 6.3 Edge Cases ─────────────────────────────────────────────────────────

await test('L-EG-01', 'GET lab order from wrong hospital returns 404', async () => {
  const res = await get(
    `/hospitals/${state.hospitalB.id}/patients/${patientId}/labs/${orderId}`,
    state.users.grace.accessToken,
  );
  assertStatus(res, 404);
});

// ── Summary ───────────────────────────────────────────────────────────────

await disconnect();
const failures = summary();
process.exit(failures > 0 ? 1 : 0);
