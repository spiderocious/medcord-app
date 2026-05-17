# Patient Flow — Backend QA Bug Report

> **QA:** Claude  
> **Date:** 2026-05-17  
> **Test script:** `docs/qas/backend/scripts/patient-flow.test.mjs`  
> **Plan:** `docs/qas/backend/plans/patient-flow-test-plan.md`

---

## BUG-PF-S-01 — Stage backward movement not validated on backend 🔴 HIGH

**Status:** CONFIRMED  
**Test:** VS-06  
**File:** `apps/main-backend/src/features/patients/patient.schema.ts` — `UpdateVisitBody`

**What happens:** `PATCH /hospitals/:id/visits/:visitId` accepts any valid stage value regardless of current stage. A visit at stage `done` can be walked back to `waiting_nurse` with a single API call.

**Evidence from test run:**
```
VS-06 (BUG-PF-S-01): backward stage done→waiting_nurse → status=200
stage=waiting_nurse
```

**Root cause:** `UpdateVisitBody.stage` is `z.enum([...all 5 values...]).optional()` — no current-stage check in the schema or the service.

**Impact:** Stage machine is frontend-enforced only. A direct API call bypasses the visit lifecycle entirely. Visits can be walked backward or jumped arbitrarily, corrupting the workflow audit trail.

**Fix:** Add a `VALID_TRANSITIONS` map in `patientService.updateVisit()` and throw `ForbiddenError` or `UnprocessableError` if `body.stage` is not a valid next stage from `visit.stage`.

---

## BUG-PF-01 — Checkout does not clear `patient.currentHospitalId` 🟡 MEDIUM

**Status:** NEW — NOT in handoff  
**Test:** CO-02b  
**File:** `apps/main-backend/src/features/patients/patient.service.ts` — `checkoutVisit()`

**What happens:** After `POST /visits/:visitId/checkout`, `patient.admissionStatus` is correctly set to `outpatient`, but `patient.currentHospitalId` is **not cleared** — it remains set to the hospital where the patient was checked in.

**Evidence from test run:**
```
✗ CO-02b: Checkout clears patient.currentHospitalId
    → currentHospitalId=HSP-f1b4fbbd-ed16-4e06-8a9c-c8099c8d4f43
```

**Expected per handoff:** `patient.currentHospitalId` should be unset/null after checkout (patient is no longer an active inpatient of that hospital).

**Impact:** `currentHospitalId` leaks across visits. A patient who checks in, checks out, and then checks into a different hospital could appear as still associated with the first hospital until explicitly cleared.

**Fix:** In `checkoutVisit()`, add `patient.currentHospitalId = undefined` (or `null`) to the patient update alongside the `admissionStatus = 'outpatient'` write.

---

## GAP-PF-01 — Double check-in creates a new visit (no active-visit guard) 🟡 MEDIUM

**Status:** CONFIRMED BEHAVIOR (not a regression — matches source read)  
**Test:** CI-10

**What happens:** Checking in a patient who already has an active visit succeeds with 200 and creates a new visit. There is no guard against multiple concurrent active visits for the same patient.

**Evidence from test run:**
```
CI-10: double check-in → status=200 (documenting behavior)
✓ CI-10: Double check-in returns 200 (new visit created — no active-visit guard)
```

**Severity:** Medium — multiple active visits per patient corrupts the queue and can confuse clinical staff.

**Recommendation:** Add a check in `checkIn()` for an existing active visit (`checkedOutAt: null`) for this patient in this hospital, and throw `ConflictError` if one exists.

---

## GAP-PF-02 — No FK validation on `assignedNurseId` / `assignedDoctorId` ℹ️ LOW

**Status:** CONFIRMED BEHAVIOR (expected per handoff)  
**Test:** CI-08

Any string is accepted for `assignedNurseId` and `assignedDoctorId`. Non-existent staff IDs are stored without error. This is a known gap acknowledged in the handoff.

---

## NOTE — `/patients/:id/admit` endpoint returns 400

During PS-03 setup, `POST /hospitals/:id/patients/:id/admit` returned 400. This endpoint either does not exist in the current implementation or requires a different request shape. The `admissionStatus=admitted` filter test (PS-03b, PS-03c) was not fully exercised as a result. This should be investigated separately — it may indicate the admit flow is not yet implemented.
