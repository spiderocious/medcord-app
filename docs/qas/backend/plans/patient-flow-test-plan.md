# Medcord — Patient Flow — Backend QA Test Plan

> **QA:** Claude  
> **Date:** 2026-05-17  
> **Scope:** Patient check-in, visit lifecycle (queue → stage advance → checkout), admission status filter on patient search  
> **Handoff doc:** `docs/qas/backend/patient-flow-handoff.md`  
> **Backend files reviewed:**
> - `apps/main-backend/src/features/patients/index.ts`
> - `apps/main-backend/src/features/patients/patient.routes.ts`
> - `apps/main-backend/src/features/patients/patient.service.ts`
> - `apps/main-backend/src/features/patients/patient.model.ts`
> - `apps/main-backend/src/features/patients/patient.schema.ts`

---

## Environment & Setup

| Item | Value |
|------|-------|
| Base URL | `http://localhost:8085/api/v1` |
| Auth header | `Authorization: Bearer <accessToken>` |
| Error envelope | `{ "error": { "code": "...", "message": "..." } }` |
| Success envelope | `{ "data": { ... } }` |

---

## Key Implementation Notes (from source read)

1. **Route paths** — Visits routes are NOT under `/patients/:patientId`. They are hospital-scoped:
   - `GET /hospitals/:hospitalId/visits`
   - `PATCH /hospitals/:hospitalId/visits/:visitId`
   - `POST /hospitals/:hospitalId/visits/:visitId/checkout`
   - Check-in remains at `POST /hospitals/:hospitalId/patients/:patientId/checkin`

2. **Initial stage logic** — `checkIn()` sets initial stage to `waiting_nurse` if `assignedNurseId` is present in the body, otherwise `waiting_doctor`. This is not documented in the handoff.

3. **Double-checkout is already guarded** — `checkoutVisit()` checks `visit.checkedOutAt !== undefined` and throws `ConflictError`. Handoff listed this as "currently unvalidated" — that was incorrect; it IS validated. Expect `409` not an unguarded 200.

4. **`updateVisit()` also guards double-checkout** — `PATCH /visits/:visitId` throws `ConflictError` if the visit is already checked out.

5. **`PATCH /visits/:visitId` accepts more than `stage`** — Body also accepts `assignedNurseId`, `assignedDoctorId`, `notes`, `department`. All are optional.

6. **`admissionStatus` filter is a strict Zod enum** — Values must be exactly `outpatient`, `admitted`, or `discharged`. An unknown value produces `422` (Zod validation error), not an empty array.

7. **Stage machine is forward-only in the UI only** — `UpdateVisitBody.stage` is a plain enum — all 5 stage values are always valid regardless of current stage. A direct API call can set any stage. This is a confirmed backend gap (flagged in handoff, documented below as BUG-PF-S-01).

8. **Queue counter field is `lastNumber`** — The `IDailyQueueCounter` model uses `lastNumber`, not `count`.

9. **`listActiveVisits()` response** — Each visit includes `patient: { id, patientCode, firstName, lastName, photoKey }`. `patient` can be `null` if the patient record is missing (defensive).

10. **`checkin` updates patient** — Sets `patient.admissionStatus = 'outpatient'` and `patient.currentHospitalId = hospitalId` on the patient record.

---

## Static Findings (Pre-execution)

### BUG-PF-S-01 — Stage backward movement not validated on backend 🔴 HIGH

**File:** `apps/main-backend/src/features/patients/patient.schema.ts` — `UpdateVisitBody`  
`stage` is `z.enum([...all 5 values...]).optional()` — no current-stage check. Any stage value is accepted at any time. `PATCH /visits/:visitId` with `{ "stage": "waiting_nurse" }` on a visit currently `with_doctor` succeeds.

This is frontend-enforced only. A direct API call bypasses the stage machine entirely. Risk: visits can be walked backward or jumped arbitrarily, corrupting the workflow audit trail.

**Severity:** High — the stage machine is the core data invariant of the visit lifecycle.  
**Fix:** Add current-stage validation in `patientService.updateVisit()`. Define a `VALID_TRANSITIONS` map and throw `ForbiddenError` or `UnprocessableError` if `body.stage` is not a valid next stage.

---

## Test Cases

### Section 1 — Check-In

| ID | Description | Body | Expected |
|----|-------------|------|----------|
| CI-01 | Check in patient — minimal body (no optionals) | `{}` | 200; `visit.id` present; `visit.queueNumber ≥ 1`; `visit.stage = 'waiting_doctor'` (no nurse assigned → falls through to doctor stage); `visit.checkedInAt` set |
| CI-02 | Check in with `assignedNurseId` | `{ "assignedNurseId": "MBR-xxx" }` | 200; `visit.stage = 'waiting_nurse'`; `visit.assignedNurseId = "MBR-xxx"` |
| CI-03 | Check in with both nurse and doctor IDs | `{ "assignedNurseId": "MBR-n", "assignedDoctorId": "MBR-d" }` | 200; stage = `waiting_nurse`; both IDs stored |
| CI-04 | Check in with only `assignedDoctorId` (no nurse) | `{ "assignedDoctorId": "MBR-d" }` | 200; stage = `waiting_doctor`; `assignedDoctorId` stored |
| CI-05 | Check in with `department` and `notes` | `{ "department": "Cardiology", "notes": "Chest pain" }` | 200; fields present on returned visit |
| CI-06 | `department` max length exceeded (>100 chars) | `{ "department": "A".repeat(101) }` | 422 |
| CI-07 | `notes` max length exceeded (>500 chars) | `{ "notes": "A".repeat(501) }` | 422 |
| CI-08 | `assignedNurseId` is non-existent staff ID | `{ "assignedNurseId": "MBR-doesnotexist" }` | 200 — no FK validation; field stored as-is |
| CI-09 | Patient does not exist in this hospital | POST checkin for a patientId not registered here | 404 |
| CI-10 | Patient already has an active visit | Check in same patient twice without checkout | 200 or conflict — **verify and document actual behavior** |
| CI-11 | No `patient.admit` permission | Call with `doctor` token (has `patient.admit`) vs `pharmacist` (does not) | pharmacist → 403; doctor → 200 |
| CI-12 | Check-in sets `patient.admissionStatus = 'outpatient'` | After CI-01, GET patient | `admissionStatus = 'outpatient'`; `currentHospitalId` = this hospital |

---

### Section 2 — Queue Number

| ID | Description | Expected |
|----|-------------|----------|
| Q-01 | First check-in of the day → `queueNumber = 1` | Visit has `queueNumber: 1` |
| Q-02 | Three sequential check-ins → numbers 1, 2, 3 | Visits have `queueNumber` 1, 2, 3 in order |
| Q-03 | Queue numbers are hospital-scoped | Hospital A and Hospital B each start their own sequence from 1; H1 queue numbers do not appear in H2 visits |
| Q-04 | Queue number is always a positive integer | All `queueNumber` values are integers ≥ 1 — never 0 or negative |

---

### Section 3 — List Active Visits (`GET /visits`)

| ID | Description | Expected |
|----|-------------|----------|
| V-01 | GET /visits — basic | 200; `visits` is an array |
| V-02 | Checked-out visit not in results | After checkout, that visit does not appear in `GET /visits` |
| V-03 | Active visit appears in results | After check-in, visit appears with correct `queueNumber`, `stage`, `checkedInAt` |
| V-04 | Each visit has `patient` snapshot | `patient.firstName`, `patient.lastName`, `patient.patientCode` present on every visit object |
| V-05 | No active visits → empty array | Hospital with no active visits returns `{ "visits": [] }`, status 200 |
| V-06 | Visits are hospital-scoped | H1 visits not visible via H2's `GET /visits` |
| V-07 | No `patient.view` permission → 403 | `pharmacist` has `patient.view`; `tech` does not — tech → 403 |

---

### Section 4 — Advance Visit Stage (`PATCH /visits/:visitId`)

| ID | Description | Body | Expected |
|----|-------------|------|----------|
| VS-01 | Advance stage — `waiting_nurse → with_nurse` | `{ "stage": "with_nurse" }` | 200; `visit.stage = 'with_nurse'` |
| VS-02 | Advance stage — `with_nurse → waiting_doctor` | `{ "stage": "waiting_doctor" }` | 200; stage updated |
| VS-03 | Advance stage — `waiting_doctor → with_doctor` | `{ "stage": "with_doctor" }` | 200; stage updated |
| VS-04 | Advance stage — `with_doctor → done` | `{ "stage": "done" }` | 200; stage updated |
| VS-05 | Invalid stage value | `{ "stage": "in_surgery" }` | 422 |
| VS-06 | Backward stage (BUG-PF-S-01 verification) | Set stage to `with_doctor`, then PATCH to `waiting_nurse` | **Expected per handoff: succeeds (no backend guard).** Document actual response — this is the known gap. |
| VS-07 | Update `assignedNurseId` | `{ "assignedNurseId": "MBR-xxx" }` | 200; `assignedNurseId` updated on visit |
| VS-08 | Update `assignedDoctorId` | `{ "assignedDoctorId": "MBR-yyy" }` | 200; `assignedDoctorId` updated |
| VS-09 | Update `notes` | `{ "notes": "updated" }` | 200; notes updated |
| VS-10 | Update `department` | `{ "department": "ICU" }` | 200; department updated |
| VS-11 | PATCH already-checked-out visit | Checkout a visit, then PATCH stage | 409 Conflict |
| VS-12 | Non-existent visitId | PATCH `/visits/VIS-doesnotexist` | 404 |
| VS-13 | Visit from another hospital | PATCH with valid visitId but wrong hospitalId in path | 404 (hospital scope mismatch) |
| VS-14 | No `patient.admit` permission → 403 | `pharmacist` token | 403 |

---

### Section 5 — Checkout Visit (`POST /visits/:visitId/checkout`)

| ID | Description | Expected |
|----|-------------|----------|
| CO-01 | Checkout active visit | 200; `visit.checkedOutAt` is set (non-null); `visit.stage = 'done'` |
| CO-02 | Checkout sets patient admissionStatus | After CO-01, GET patient → `admissionStatus = 'outpatient'`; `currentHospitalId` is unset/null |
| CO-03 | Visit disappears from `GET /visits` after checkout | Visit no longer returned in active visits list |
| CO-04 | Double checkout returns 409 | Call checkout on already-checked-out visit → 409 Conflict |
| CO-05 | Non-existent visitId → 404 | POST `/visits/VIS-doesnotexist/checkout` → 404 |
| CO-06 | Visit from another hospital → 404 | Hospital scope mismatch |
| CO-07 | No `patient.admit` permission → 403 | `pharmacist` token → 403 |

---

### Section 6 — Patient Search — `admissionStatus` Filter

| ID | Description | Query | Expected |
|----|-------------|-------|----------|
| PS-01 | No filter — all patients returned | `GET /patients` | All patients regardless of admissionStatus |
| PS-02 | `admissionStatus=outpatient` filter | `GET /patients?admissionStatus=outpatient` | Only patients with `admissionStatus: 'outpatient'` |
| PS-03 | `admissionStatus=admitted` filter | `GET /patients?admissionStatus=admitted` | Only patients with `admissionStatus: 'admitted'` |
| PS-04 | `admissionStatus=discharged` filter | `GET /patients?admissionStatus=discharged` | Only patients with `admissionStatus: 'discharged'` |
| PS-05 | Unknown admissionStatus value | `GET /patients?admissionStatus=dead` | 422 (Zod strict enum — not an empty array) |
| PS-06 | No patients match filter | Valid filter, no matching patients | `{ "items": [] }`, 200 |
| PS-07 | Filter combined with text search | `GET /patients?q=Kofi&admissionStatus=outpatient` | Only outpatient patients whose name contains "Kofi" |

---

### Section 7 — Cross-Cutting: Permissions & Hospital Isolation

| ID | Description | Expected |
|----|-------------|----------|
| XC-01 | `GET /visits` — no `patient.view` | `tech` role → 403 |
| XC-02 | `POST /checkin` — no `patient.admit` | `pharmacist` role → 403 |
| XC-03 | `PATCH /visits/:visitId` — no `patient.admit` | `pharmacist` role → 403 |
| XC-04 | `POST /visits/:visitId/checkout` — no `patient.admit` | `pharmacist` role → 403 |
| XC-05 | Cross-hospital visit access — PATCH | User from H1 PATCHes a visit belonging to H2 | 404 (hospitalScope rejects) |
| XC-06 | Cross-hospital visit access — checkout | User from H1 checkouts a visit in H2 | 404 |
| XC-07 | No token — all new endpoints | 401 on all 4 new/updated endpoints |

---

## Known Gaps (to verify and document during test run)

| ID | Gap | Handoff assessment | Source assessment |
|----|-----|--------------------|-------------------|
| BUG-PF-S-01 | Stage backward movement not validated | Confirmed gap | Confirmed gap — `VALID_TRANSITIONS` map not implemented |
| GAP-PF-01 | Double check-in (patient already has active visit) | "unspecified" | Verify actual behavior at runtime — no guard visible in service |
| GAP-PF-02 | No FK validation on `assignedNurseId`/`assignedDoctorId` | Confirmed no FK check | Confirmed — any string is stored |

> Note: **Double-checkout IS validated** (409 Conflict). Handoff incorrectly listed it as unvalidated. Source confirms `visit.checkedOutAt !== undefined` check in both `checkoutVisit()` and `updateVisit()`.
