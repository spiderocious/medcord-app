/**
 * assets.test.mjs — Tests for §7 Assets (AS-*)
 *
 * Routes: /api/v1/hospitals/:hospitalId/assets[/...]
 *
 * Usage: node assets.test.mjs
 * Prerequisite: seed.mjs must have run and .state.json must be current.
 */

import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { connect, disconnect } from './db.mjs';
import { get, post, patch, del } from './api.mjs';
import { test, summary, assert, assertEqual, assertStatus } from './runner.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const state = JSON.parse(await readFile(join(__dirname, '.state.json'), 'utf8'));

const { alice, bob, carol } = state.users;
const hospAId = state.hospitalA.id;
const hospBId = state.hospitalB.id;
const assetsBase = `/hospitals/${hospAId}/assets`;

await connect();

console.log('=== ASSET TESTS ===\n');

let assetId;

await test('AS-HP-01', 'Create asset returns 201', async () => {
  const res = await post(assetsBase, {
    name: 'Ultrasound Machine',
    category: 'Imaging',
    manufacturer: 'GE Healthcare',
    modelName: 'LOGIQ P9',
    status: 'maintenance', // BUG-07 check: this should be ignored
    condition: 'good',
    currentLocation: 'Radiology',
  }, alice.accessToken);
  assertStatus(res, 201);
  const asset = res.data.data?.asset;
  assert(asset?.id, 'asset.id present');
  assetId = asset.id;
  // BUG-07 fix confirmation: status from body should be respected
  // If still returning 'available', that's BUG-07 unfixed
  if (asset?.status === 'available') {
    throw new Error(
      `BUG-07 check: asset created with status='maintenance' in body, but returned status='available'. ` +
      `BUG-07 fix should persist the status from the request body.`,
    );
  }
  assertEqual(asset?.status, 'maintenance', 'BUG-07 fix: status from body respected');
});

await test('AS-HP-02', 'List assets returns paginated result', async () => {
  const res = await get(assetsBase, alice.accessToken);
  assertStatus(res, 200);
  const d = res.data.data;
  assert(Array.isArray(d?.items), 'items is array');
  assert(typeof d?.total === 'number', 'total is number');
});

await test('AS-HP-03', 'Filter assets by category returns only matching', async () => {
  const res = await get(`${assetsBase}?category=Imaging`, alice.accessToken);
  assertStatus(res, 200);
  const items = res.data.data?.items ?? [];
  assert(items.length > 0, 'at least one Imaging asset');
  for (const a of items) {
    assertEqual(a.category, 'Imaging', `asset ${a.id} should be Imaging`);
  }
});

await test('AS-HP-04', 'Filter assets by status returns only matching', async () => {
  const res = await get(`${assetsBase}?status=maintenance`, alice.accessToken);
  assertStatus(res, 200);
  const items = res.data.data?.items ?? [];
  assert(items.length > 0, 'at least one maintenance asset');
  for (const a of items) {
    assertEqual(a.status, 'maintenance', `asset ${a.id} should be maintenance`);
  }
});

await test('AS-HP-05', 'Search assets by name fragment (q)', async () => {
  const res = await get(`${assetsBase}?q=Ultrasound`, alice.accessToken);
  assertStatus(res, 200);
  assert(res.data.data?.items?.length > 0, 'search returned results');
});

await test('AS-HP-06', 'GET /assets/:assetId returns full asset', async () => {
  const res = await get(`${assetsBase}/${assetId}`, alice.accessToken);
  assertStatus(res, 200);
  const asset = res.data.data?.asset;
  assertEqual(asset?.id, assetId, 'correct asset returned');
  assert(asset?.name, 'asset name present');
});

await test('AS-HP-07', 'PATCH /assets/:assetId updates asset', async () => {
  const res = await patch(
    `${assetsBase}/${assetId}`,
    { notes: 'Scheduled for quarterly maintenance' },
    alice.accessToken,
  );
  assertStatus(res, 200);
  assertEqual(res.data.data?.asset?.notes, 'Scheduled for quarterly maintenance', 'notes updated');
});

await test('AS-HP-08', 'PATCH /assets/:assetId/status updates status', async () => {
  const res = await patch(
    `${assetsBase}/${assetId}/status`,
    { status: 'available' },
    alice.accessToken,
  );
  assertStatus(res, 200);
  assertEqual(res.data.data?.asset?.status, 'available', 'status updated to available');
});

await test('AS-HP-09', 'POST /assets/:assetId/move records location change', async () => {
  const res = await post(
    `${assetsBase}/${assetId}/move`,
    { location: 'ICU Room 3', note: 'Moved for emergency use' },
    alice.accessToken,
  );
  assertStatus(res, 200);
  const asset = res.data.data?.asset;
  assertEqual(asset?.currentLocation, 'ICU Room 3', 'currentLocation updated');
  assert(
    Array.isArray(asset?.locationHistory) && asset.locationHistory.length > 0,
    'locationHistory has new entry',
  );
  const entry = asset.locationHistory[asset.locationHistory.length - 1];
  assert(entry?.movedBy, 'movedBy set');
  assert(entry?.movedAt, 'movedAt set');
});

await test('AS-HP-10', 'POST /assets/:assetId/photos adds photo', async () => {
  const res = await post(
    `${assetsBase}/${assetId}/photos`,
    { fileKey: 'assets/ultrasound-photo.jpg', caption: 'Front view' },
    alice.accessToken,
  );
  assertStatus(res, 200);
  const asset = res.data.data?.asset;
  assert(asset?.photos?.length > 0, 'photos array updated');
});

await test('AS-HP-11', 'DELETE /assets/:assetId/photos/:fileKey removes photo', async () => {
  const fileKey = 'assets/ultrasound-photo.jpg';
  const encodedKey = encodeURIComponent(fileKey);
  const res = await del(
    `${assetsBase}/${assetId}/photos/${encodedKey}`,
    alice.accessToken,
  );
  assertStatus(res, 200);
});

await test('AS-EG-01', 'GET asset from wrong hospital returns 404', async () => {
  // assetId is in Hospital A — grace tries Hospital B context
  const res = await get(
    `/hospitals/${hospBId}/assets/${assetId}`,
    state.users.grace.accessToken,
  );
  assertStatus(res, 404);
});

await test('AS-EG-02', 'PATCH asset from wrong hospital returns 404', async () => {
  const res = await patch(
    `/hospitals/${hospBId}/assets/${assetId}`,
    { notes: 'Cross-hospital edit' },
    state.users.grace.accessToken,
  );
  assertStatus(res, 404);
});

await test('AS-HP-12', 'DELETE /assets/:assetId returns 204', async () => {
  // Create a throwaway asset to delete
  const createRes = await post(assetsBase, {
    name: 'To Delete Asset',
    category: 'Misc',
  }, alice.accessToken);
  const toDeleteId = createRes.data.data?.asset?.id;
  const res = await del(`${assetsBase}/${toDeleteId}`, alice.accessToken);
  assertStatus(res, 204);
});

await test('AS-EG-03', 'DELETE asset from wrong hospital returns 404', async () => {
  const res = await del(
    `/hospitals/${hospBId}/assets/${assetId}`,
    state.users.grace.accessToken,
  );
  assertStatus(res, 404);
});

// ── Summary ───────────────────────────────────────────────────────────────

await disconnect();
const failures = summary();
process.exit(failures > 0 ? 1 : 0);
