/**
 * emr.test.mjs — Tests for §5 EMR (E-*)
 *
 * Routes: /api/v1/hospitals/:hospitalId/patients/:patientId/chart[/...]
 *
 * Usage: node emr.test.mjs
 * Prerequisite: seed.mjs must have run and .state.json must be current.
 */

import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { connect, disconnect } from './db.mjs';
import { get, post, patch } from './api.mjs';
import { test, summary, assert, assertEqual, assertStatus } from './runner.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const state = JSON.parse(await readFile(join(__dirname, '.state.json'), 'utf8'));

const { alice, bob, carol, dave, eve, frank, grace } = state.users;
const hospAId = state.hospitalA.id;
const hospBId = state.hospitalB.id;
const patientId = state.patients[0]; // John Doe
const emrBase = `/hospitals/${hospAId}/patients/${patientId}`;

await connect();

console.log('=== EMR TESTS ===\n');

// ── 5.1 Chart Summary & Vitals ─────────────────────────────────────────────

await test('E-HP-01', 'GET .../chart returns summary', async () => {
  const res = await get(`${emrBase}/chart`, carol.accessToken);
  assertStatus(res, 200);
  const s = res.data.data?.summary ?? res.data.data;
  assert(s !== undefined, 'summary in response');
});

await test('E-HP-02', 'POST .../chart/vitals — basic vitals', async () => {
  const res = await post(
    `${emrBase}/chart/vitals`,
    { bp_systolic: 120, bp_diastolic: 80, hr: 72, temp: 36.6, weight: 70, height: 175 },
    carol.accessToken,
  );
  assertStatus(res, 201);
  const v = res.data.data?.vitals;
  assert(v?.id, 'vitals.id present');
});

await test('E-HP-03', 'POST .../chart/vitals — weight+height calculates BMI', async () => {
  const res = await post(
    `${emrBase}/chart/vitals`,
    { weight: 70, height: 175 }, // BMI = 70 / (1.75^2) ≈ 22.86
    carol.accessToken,
  );
  assertStatus(res, 201);
  const v = res.data.data?.vitals;
  assert(v?.bmi !== undefined && v.bmi !== null, `bmi should be calculated, got: ${v?.bmi}`);
  // BMI ≈ 22.86 (allow tolerance)
  assert(Math.abs(v.bmi - 22.86) < 0.5, `bmi ${v.bmi} should be ~22.86`);
});

await test('E-HP-04', 'POST .../chart/vitals — out-of-range BP marks isOutOfRange', async () => {
  const res = await post(
    `${emrBase}/chart/vitals`,
    { bp_systolic: 160, bp_diastolic: 95 },
    carol.accessToken,
  );
  assertStatus(res, 201);
  const v = res.data.data?.vitals;
  assertEqual(v?.isOutOfRange, true, 'isOutOfRange is true');
  assert(
    Array.isArray(v?.outOfRangeFields) && v.outOfRangeFields.includes('bp_systolic'),
    `outOfRangeFields should include 'bp_systolic', got: ${JSON.stringify(v?.outOfRangeFields)}`,
  );
});

await test('E-HP-05', 'GET .../chart/vitals returns array', async () => {
  const res = await get(`${emrBase}/chart/vitals`, carol.accessToken);
  assertStatus(res, 200);
  const vitals = res.data.data?.vitals ?? [];
  assert(Array.isArray(vitals), 'vitals is array');
  assert(vitals.length > 0, 'has vitals after posting');
});

await test('E-HP-06', 'GET .../chart/vitals?limit=1 returns ≤1 entry', async () => {
  const res = await get(`${emrBase}/chart/vitals?limit=1`, carol.accessToken);
  assertStatus(res, 200);
  const vitals = res.data.data?.vitals ?? [];
  assert(vitals.length <= 1, `should be ≤1 result, got ${vitals.length}`);
});

await test('E-EG-01', 'Access EMR for patient not linked to this hospital returns 404 [BUG-11]', async () => {
  // patientId is in Hospital A — grace tries to access via Hospital B
  // BUG-11: getChartSummary does NOT check patient-hospital linkage — returns 200 with empty data
  // This is a data leakage bug: any member of any hospital can fetch the chart summary of any patient
  const res = await get(`/hospitals/${hospBId}/patients/${patientId}/chart`, grace.accessToken);
  if (res.status === 200) {
    throw new Error(
      `BUG-11: GET chart for patient not in hospital returned 200 (should be 404). ` +
      `EMR getChartSummary does not validate patient-hospital linkage before returning data. ` +
      `A member of Hospital B can view chart summaries for patients registered only in Hospital A.`,
    );
  }
  assertStatus(res, 404);
});

// ── 5.2 Medications ────────────────────────────────────────────────────────

let medId;

await test('E-HP-10', 'GET .../chart/medications returns array', async () => {
  const res = await get(`${emrBase}/chart/medications`, carol.accessToken);
  assertStatus(res, 200);
  assert(Array.isArray(res.data.data?.medications), 'medications is array');
});

await test('E-HP-11', 'POST .../chart/medications as doctor returns 201 with active status', async () => {
  const res = await post(
    `${emrBase}/chart/medications`,
    { drug: 'Amoxicillin', strength: '500mg', route: 'oral', frequency: 'TID' },
    carol.accessToken, // carol is doctor
  );
  assertStatus(res, 201);
  const med = res.data.data?.medication;
  assert(med?.id, 'medication.id present');
  assertEqual(med?.status, 'active', 'medication is active');
  medId = med.id;
});

await test('E-HP-13', 'PATCH .../chart/medications/:medId — discontinue', async () => {
  const res = await patch(
    `${emrBase}/chart/medications/${medId}`,
    { status: 'discontinued', reason: 'Course completed' },
    carol.accessToken,
  );
  assertStatus(res, 200);
  const med = res.data.data?.medication;
  assertEqual(med?.status, 'discontinued', 'status is discontinued');
  assert(med?.discontinuedBy, 'discontinuedBy set');
  assert(med?.discontinuedAt, 'discontinuedAt set');
});

await test('E-HP-14', 'PATCH .../chart/medications/:medId — on_hold', async () => {
  // Create a new med first
  const createRes = await post(
    `${emrBase}/chart/medications`,
    { drug: 'Metformin', strength: '500mg' },
    carol.accessToken,
  );
  assertStatus(createRes, 201);
  const newMedId = createRes.data.data?.medication.id;

  const res = await patch(
    `${emrBase}/chart/medications/${newMedId}`,
    { status: 'on_hold', reason: 'Procedure pending' },
    carol.accessToken,
  );
  assertStatus(res, 200);
  assertEqual(res.data.data?.medication?.status, 'on_hold', 'status is on_hold');
});

await test('E-RBAC-01', 'POST medications as nurse (not PRESCRIBER_ROLE) returns 403', async () => {
  const res = await post(
    `${emrBase}/chart/medications`,
    { drug: 'Aspirin' },
    dave.accessToken, // dave is nurse
  );
  assertStatus(res, 403);
});

await test('E-RBAC-02', 'POST medications as reception returns 403', async () => {
  const res = await post(
    `${emrBase}/chart/medications`,
    { drug: 'Aspirin' },
    eve.accessToken, // eve is reception
  );
  assertStatus(res, 403);
});

await test('E-RBAC-03', 'POST medications as lab_tech returns 403', async () => {
  const res = await post(
    `${emrBase}/chart/medications`,
    { drug: 'Aspirin' },
    frank.accessToken, // frank is lab_tech
  );
  assertStatus(res, 403);
});

// ── 5.3 Medical History ────────────────────────────────────────────────────

await test('E-HP-20', 'GET .../chart/history returns 200', async () => {
  const res = await get(`${emrBase}/chart/history`, carol.accessToken);
  assertStatus(res, 200);
  // history may be null initially
});

await test('E-HP-21', 'PATCH .../chart/history as doctor upserts history', async () => {
  const res = await patch(
    `${emrBase}/chart/history`,
    {
      diagnoses: [{ icd10Code: 'J45', description: 'Asthma', diagnosedAt: '2020-01-01' }],
      notes: 'Controlled with inhalers',
    },
    carol.accessToken,
  );
  assertStatus(res, 200);
  const h = res.data.data?.history;
  assert(h, 'history returned');
  assert(h?.diagnoses?.length > 0, 'diagnoses populated');
});

await test('E-HP-22', 'PATCH .../chart/history as nurse returns 200', async () => {
  const res = await patch(
    `${emrBase}/chart/history`,
    { notes: 'Updated by nurse' },
    dave.accessToken, // dave is nurse — in CLINICAL_ROLES
  );
  assertStatus(res, 200);
});

await test('E-RBAC-10', 'PATCH history as reception returns 403', async () => {
  const res = await patch(
    `${emrBase}/chart/history`,
    { notes: 'Reception note' },
    eve.accessToken,
  );
  assertStatus(res, 403);
});

await test('E-RBAC-11', 'PATCH history as lab_tech returns 403', async () => {
  const res = await patch(
    `${emrBase}/chart/history`,
    { notes: 'Lab note' },
    frank.accessToken,
  );
  assertStatus(res, 403);
});

await test('E-RBAC-12', 'PATCH history as hospital_admin returns 403', async () => {
  const res = await patch(
    `${emrBase}/chart/history`,
    { notes: 'Admin note' },
    bob.accessToken, // bob is hospital_admin — not in CLINICAL_ROLES
  );
  assertStatus(res, 403);
});

// ── 5.4 Procedures & Immunizations ────────────────────────────────────────

await test('E-HP-30', 'POST .../chart/procedures as doctor returns 201', async () => {
  const res = await post(
    `${emrBase}/chart/procedures`,
    {
      name: 'Appendectomy',
      performedBy: 'Dr. Carol',
      performedAt: '2026-01-15',
      preOpChecklist: {
        consentObtained: true,
        npoStatus: true,
        allergiesConfirmed: true,
        siteMarked: true,
      },
    },
    carol.accessToken,
  );
  assertStatus(res, 201);
  assert(res.data.data?.procedure?.id, 'procedure.id present');
});

await test('E-HP-31', 'GET .../chart/procedures returns array', async () => {
  const res = await get(`${emrBase}/chart/procedures`, carol.accessToken);
  assertStatus(res, 200);
  assert(Array.isArray(res.data.data?.procedures), 'procedures is array');
});

await test('E-HP-32', 'POST .../chart/immunizations as nurse returns 201', async () => {
  const res = await post(
    `${emrBase}/chart/immunizations`,
    {
      vaccine: 'COVID-19 mRNA',
      administeredAt: '2026-01-10',
      administrator: 'Nurse Dave',
    },
    dave.accessToken, // nurse is in CLINICAL_ROLES
  );
  assertStatus(res, 201);
  assert(res.data.data?.immunization?.id, 'immunization.id present');
});

await test('E-HP-33', 'GET .../chart/immunizations returns array', async () => {
  const res = await get(`${emrBase}/chart/immunizations`, carol.accessToken);
  assertStatus(res, 200);
  assert(Array.isArray(res.data.data?.immunizations), 'immunizations is array');
});

await test('E-RBAC-20', 'POST procedures as reception returns 403', async () => {
  const res = await post(
    `${emrBase}/chart/procedures`,
    {
      name: 'Test Proc',
      performedBy: 'Eve',
      performedAt: '2026-01-01',
      preOpChecklist: { consentObtained: true, npoStatus: true, allergiesConfirmed: true, siteMarked: true },
    },
    eve.accessToken,
  );
  assertStatus(res, 403);
});

await test('E-RBAC-21', 'POST immunizations as lab_tech returns 403', async () => {
  const res = await post(
    `${emrBase}/chart/immunizations`,
    { vaccine: 'Test', administeredAt: '2026-01-01', administrator: 'Frank' },
    frank.accessToken,
  );
  assertStatus(res, 403);
});

// ── 5.5 Documents ──────────────────────────────────────────────────────────

let docId;

await test('E-HP-40', 'POST .../chart/documents returns 201', async () => {
  const res = await post(
    `${emrBase}/chart/documents`,
    { title: 'Lab Report Q1', category: 'lab_report', fileKey: 'documents/lab-q1.pdf' },
    alice.accessToken,
  );
  assertStatus(res, 201);
  docId = res.data.data?.document?.id;
  assert(docId, 'document.id present');
});

await test('E-HP-41', 'GET .../chart/documents returns array', async () => {
  const res = await get(`${emrBase}/chart/documents`, alice.accessToken);
  assertStatus(res, 200);
  assert(Array.isArray(res.data.data?.documents), 'documents is array');
});

await test('E-HP-42', 'PATCH .../chart/documents/:docId updates document', async () => {
  const res = await patch(
    `${emrBase}/chart/documents/${docId}`,
    { isSensitive: true },
    alice.accessToken,
  );
  assertStatus(res, 200);
  assertEqual(res.data.data?.document?.isSensitive, true, 'isSensitive updated');
});

// ── 5.6 Access Log & Break Glass ──────────────────────────────────────────

await test('E-HP-50', 'GET .../chart/access-log as super_admin returns 200', async () => {
  const res = await get(`${emrBase}/chart/access-log`, alice.accessToken);
  assertStatus(res, 200);
});

await test('E-HP-51', 'GET .../chart/access-log as hospital_admin returns 200', async () => {
  const res = await get(`${emrBase}/chart/access-log`, bob.accessToken);
  assertStatus(res, 200);
});

await test('E-HP-52', 'POST .../chart/break-glass with reason returns 204', async () => {
  const res = await post(
    `${emrBase}/chart/break-glass`,
    { reason: 'Emergency patient care — unconscious patient brought in' },
    carol.accessToken,
  );
  assertStatus(res, 204);
});

await test('E-HP-53', 'Access log contains break-glass entry', async () => {
  const res = await get(`${emrBase}/chart/access-log`, alice.accessToken);
  assertStatus(res, 200);
  const entries = res.data.data?.items ?? res.data.data?.entries ?? [];
  const bgEntry = entries.find((e) => e.action === 'break_glass' || e.isBreakGlass === true);
  assert(bgEntry, 'break_glass entry found in access log');
});

await test('E-RBAC-30', 'GET access-log as doctor returns 403', async () => {
  const res = await get(`${emrBase}/chart/access-log`, carol.accessToken);
  assertStatus(res, 403);
});

await test('E-RBAC-31', 'GET access-log as nurse returns 403', async () => {
  const res = await get(`${emrBase}/chart/access-log`, dave.accessToken);
  assertStatus(res, 403);
});

await test('E-EG-50', 'POST break-glass missing reason returns 400', async () => {
  const res = await post(`${emrBase}/chart/break-glass`, {}, carol.accessToken);
  assertStatus(res, 400);
  assertEqual(res.data.error?.code, 'validation_error', 'validation_error');
});

// ── Summary ───────────────────────────────────────────────────────────────

await disconnect();
const failures = summary();
process.exit(failures > 0 ? 1 : 0);
