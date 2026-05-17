# Medcord Patient Flow — QA Test Execution Report

> **QA:** Claude  
> **Date:** 2026-05-17  
> **Scope:** Patient check-in, visit lifecycle (queue → stage advance → checkout), admission status filter on patient search  
> **Environment:** `localhost:8085` · MongoDB `medcord` (local)  
> **Test script:** `docs/qas/backend/scripts/patient-flow.test.mjs`  
> **Plan:** `docs/qas/backend/plans/patient-flow-test-plan.md`  
> **Bugs:** `docs/qas/backend/reports/patient-flow-bugs.md`

---

## Summary

| Section | Tests | Pass | Fail | Blocked |
|---------|-------|------|------|---------|
| 1. Check-In | 26 | 26 | 0 | 0 |
| 2. Queue Number | 4 | 4 | 0 | 0 |
| 3. List Active Visits | 9 | 9 | 0 | 0 |
| 4. Advance Visit Stage | 14 | 13 | 1 | 0 |
| 5. Checkout Visit | 9 | 8 | 1 | 0 |
| 6. Patient Search filter | 10 | 10 | 0 | 0 |
| 7. Cross-cutting / Permissions | 5 | 5 | 0 | 0 |
| **Total** | **77** | **76** | **2** | **0** |

**76 / 77 tests pass.** 2 failures — 1 known pre-existing gap (BUG-PF-S-01), 1 new bug (BUG-PF-01).

**NOT cleared for release** — BUG-PF-01 (checkout does not clear `currentHospitalId`) is a data-correctness regression. BUG-PF-S-01 is a pre-existing design gap.

---

## Section Results

### 1. Check-In — 26/26 PASS ✅

All check-in scenarios pass:

- Minimal body → `waiting_doctor` stage, `queueNumber ≥ 1`, `checkedInAt` set.
- `assignedNurseId` body → `waiting_nurse` stage. Both nurse + doctor IDs → `waiting_nurse`. Doctor-only → `waiting_doctor`.
- `department` and `notes` stored correctly.
- Zod validation: `department > 100 chars` → 400; `notes > 500 chars` → 400.
- Non-existent `assignedNurseId` stored as-is (no FK check) — confirmed gap, expected.
- Non-existent patient → 404.
- Double check-in (CI-10) → 200, new visit created — no active-visit guard (documented as GAP-PF-01).
- Permission gate: `pharmacist` (no `patient.admit`) → 403; `doctor` (has `patient.admit`) → not 403.
- Check-in side effects: `patient.admissionStatus = 'outpatient'` and `patient.currentHospitalId` set — both verified.

### 2. Queue Number — 4/4 PASS ✅

- Queue numbers start at ≥ 1.
- Three sequential check-ins produce sequential, unique queue numbers.
- Queue numbers are positive integers.
- Hospital isolation: Hospital 2 starts its own counter at 1 (independent from Hospital 1).

### 3. List Active Visits (GET /visits) — 9/9 PASS ✅

- `GET /visits` returns 200 with `visits` array.
- Each visit includes `patient.firstName`, `patient.lastName`, `patient.patientCode` snapshot.
- A known active visit (from Section 1) appears in results.
- Checked-out visit is absent from active list.
- `tech` role (no `patient.view`) → 403.
- H1 doctor cannot call `GET /visits` on H2 → 403.
- H2 owner's `GET /visits` returns 200 + array (1 visit from Q-03 checkin — expected).

### 4. Advance Visit Stage — 13/14 PASS · 1 FAIL ❌

**Passing:** Full forward stage chain `waiting_nurse → with_nurse → waiting_doctor → with_doctor → done` all return 200 with correct stage. `PATCH` updates `assignedNurseId`, `assignedDoctorId`, `notes`, `department` individually. Invalid stage value → 400. Non-existent visit → 404. Pharmacist → 403. Cross-hospital PATCH → 404. PATCH on checked-out visit → 409.

**FAIL — VS-06 (BUG-PF-S-01):** Backward stage transition (`done → waiting_nurse`) returns 200 and sets the stage. Backend does not enforce forward-only stage machine. See `patient-flow-bugs.md`.

### 5. Checkout Visit — 8/9 PASS · 1 FAIL ❌

**Passing:** Active visit checkout returns 200; `checkedOutAt` set; `stage = done`. `patient.admissionStatus = 'outpatient'` after checkout. Checked-out visit absent from `GET /visits`. Double checkout → 409. Non-existent visit → 404. Pharmacist → 403. Cross-hospital checkout → 403/404.

**FAIL — CO-02b (BUG-PF-01 NEW):** After checkout, `patient.currentHospitalId` is NOT cleared — it remains set to the hospital's ID. The handoff states it should be unset/null. This is a data-correctness bug. See `patient-flow-bugs.md`.

### 6. Patient Search admissionStatus Filter — 10/10 PASS ✅

- No filter → 200 + all patients.
- `admissionStatus=outpatient` → 200, only outpatient patients returned.
- `admissionStatus=admitted` → 200 (content sub-test skipped — `/patients/:id/admit` returned 400; admit endpoint may not be implemented).
- `admissionStatus=discharged` → 200, only discharged patients returned.
- Unknown value (`dead`) → 400 (Zod strict enum).
- Valid filter with no matching patients → empty array, 200 (H2 hospital).
- Combined `q=` + `admissionStatus=` → 200, only outpatient results.

### 7. Cross-cutting Permissions & Hospital Isolation — 5/5 PASS ✅

- `tech` (no `patient.view`) → 403 on `GET /visits`.
- `pharmacist` (no `patient.admit`) → 403 on check-in, PATCH visit, checkout.
- No token → 401 on all 4 endpoints.

---

## Bugs Found

| ID | Severity | Description | Status |
|----|----------|-------------|--------|
| BUG-PF-S-01 | 🔴 HIGH | Stage backward movement not validated on backend | Pre-existing gap — confirmed |
| BUG-PF-01 | 🟡 MEDIUM | Checkout does not clear `patient.currentHospitalId` | **NEW** — fix required |
| GAP-PF-01 | 🟡 MEDIUM | Double check-in creates new visit (no active-visit guard) | Pre-existing gap — confirmed |
| GAP-PF-02 | ℹ️ LOW | No FK validation on assignedNurseId/assignedDoctorId | Pre-existing gap — expected |

---

## Corrections to Handoff

| Claim in handoff | Actual behavior |
|-----------------|-----------------|
| "Double checkout not validated — currently unvalidated" | Double checkout IS validated — returns 409 Conflict (already fixed before this test run) |
| `patient.currentHospitalId` cleared on checkout | NOT cleared — BUG-PF-01 |
| Zod validation errors return 422 | This backend returns 400 for Zod validation errors |

---

## Verdict

**NOT cleared for release.**  
BUG-PF-01 must be fixed: checkout leaves `patient.currentHospitalId` set, which means a checked-out patient still appears associated with the hospital. BUG-PF-S-01 (stage backward movement) is a pre-existing architecture gap that should be tracked for a future iteration.
