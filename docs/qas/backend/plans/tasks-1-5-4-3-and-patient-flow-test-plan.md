# Backend QA Test Plan — Patient Flow + Tasks 1.5 / 3 / 4

**Prepared:** 2026-05-17  
**Tester:** QA Agent  
**Handoffs:**
- `docs/qas/backend/patient-flow-handoff.md`
- `docs/qas/backend/tasks-1-5-4-3-handoff.md`

**Base URL:** `http://localhost:8085/api/v1`  
**Test script:** `docs/qas/backend/scripts/tasks-1-5-4-3-patient-flow.test.mjs`  
**Seed:** `node docs/qas/backend/scripts/restore-seed.mjs` (safe to re-run; never wipes existing data)  
**State file:** `docs/qas/backend/scripts/.state.json`

---

## Test Actors

| Handle | Email | Role in Hospital A | Key permissions |
|--------|-------|--------------------|-----------------|
| alice | alice@medcord.test | super_admin | All |
| bob | bob@medcord.test | hospital_admin | `SETTINGS_VIEW`, `UNITS_MANAGE`, `PATIENT_VIEW`, `PATIENT_TRANSFER` |
| carol | carol@medcord.test | doctor | `PATIENT_VIEW`, `PATIENT_ADMIT`, `PATIENT_TRANSFER`, `LAB_VIEW` |
| dave | dave@medcord.test | nurse | `PATIENT_VIEW`, `PATIENT_ADMIT` — no `PATIENT_TRANSFER` |
| eve | eve@medcord.test | reception | `PATIENT_VIEW`, `PATIENT_TRANSFER` — no `PATIENT_ADMIT` |
| frank | frank@medcord.test | lab_tech | `LAB_VIEW` — no `PATIENT_VIEW`, no `PATIENT_ADMIT` |
| grace | grace@medcord.test | super_admin of Hospital B only | No role in Hospital A |

**Password for all:** `Medcord123!`

---

## Pre-flight Checklist

Before running any tests:

- [ ] Backend running: `curl http://localhost:8085/api/v1/health` → 200
- [ ] MongoDB reachable: `mongosh --quiet --eval 'db = db.getSiblingDB("medcord"); print(db.users.countDocuments({}))'`
- [ ] Seed run: `node docs/qas/backend/scripts/restore-seed.mjs`
- [ ] Spot-check alice login: `curl -s -X POST http://localhost:8085/api/v1/auth/login -H 'Content-Type: application/json' -d '{"email":"alice@medcord.test","password":"Medcord123!"}' | jq .data.tokens.accessToken`
- [ ] `.state.json` exists and contains `hospitalA.id`, `hospitalB.id`, `patients[]`, `members.*`

---

## Section 1 — Patient Flow: Check-In

**Endpoint:** `POST /api/v1/hospitals/:hospitalId/patients/:patientId/checkin`  
**Permission required:** `PATIENT_ADMIT`  
**Actors:** carol (doctor, has `PATIENT_ADMIT`), frank (lab_tech, no `PATIENT_ADMIT`)

| ID | Test | Actor | Input | Expected |
|----|------|-------|-------|----------|
| CI-01 | Happy path — minimal body | carol | `{}` | `200`, `visit.queueNumber >= 1`, `visit.stage = "waiting_doctor"` (no nurse assigned → skip nurse stage), `visit.checkedInAt` set |
| CI-02 | Happy path — with nurseId and doctorId | carol | `{ assignedNurseId: dave_member_id, assignedDoctorId: carol_member_id }` | `200`, both IDs stored on visit, `visit.stage = "waiting_nurse"` (nurse assigned → starts at nurse) |
| CI-03 | Nurse only, no doctor | carol | `{ assignedNurseId: dave_member_id }` | `200`, `visit.stage = "waiting_nurse"`, no `assignedDoctorId` |
| CI-04 | Doctor only, no nurse | carol | `{ assignedDoctorId: carol_member_id }` | `200`, `visit.stage = "waiting_doctor"`, no `assignedNurseId` |
| CI-05 | With department | carol | `{ department: "Cardiology" }` | `200`, `visit.department = "Cardiology"` |
| CI-06 | With notes | carol | `{ notes: "Chest pain on exertion" }` | `200`, `visit.notes` stored |
| CI-07 | Department omitted | carol | `{}` | `200`, `visit.department` absent or null |
| CI-08 | Non-existent assignedNurseId | carol | `{ assignedNurseId: "MBR-does-not-exist" }` | `200`, field stored as-is — no FK validation |
| CI-09 | Non-existent patient | carol | path param = `PAT-does-not-exist` | `404` |
| CI-10 | Double check-in (same patient, existing active visit) | carol | second call on same patient | Document actual behavior — expected: 409 (if guarded) or new visit created (gap) |
| CI-11 | No `PATIENT_ADMIT` | frank | valid body | `403` |
| CI-12 | Cross-hospital isolation (Hospital A user → Hospital B patient) | carol | Hospital B's hospitalId | `403` |
| CI-13 | Unauthenticated | — | no token | `401` |

**Side effect verification for CI-01:**
```
db.patients.findOne({ id: patientId }) 
→ admissionStatus = "outpatient", currentHospitalId = hospitalAId
```

---

## Section 2 — Patient Flow: Queue Numbers

**Depends on:** CI-01 through CI-04

| ID | Test | Expected |
|----|------|----------|
| Q-01 | First check-in on fresh seed | `queueNumber = 1` |
| Q-02 | Three sequential check-ins (3 different patients) | Numbers are 1, 2, 3 — unique, sequential |
| Q-03 | Queue numbers are hospital-scoped | Hospital B check-in starts its own counter at 1 (independent from Hospital A) |
| Q-04 | Queue numbers are positive integers | All `queueNumber >= 1`, all whole numbers |

---

## Section 3 — Patient Flow: List Active Visits

**Endpoint:** `GET /api/v1/hospitals/:hospitalId/visits`  
**Permission required:** `PATIENT_VIEW`

| ID | Test | Actor | Expected |
|----|------|-------|----------|
| VS-01 | Returns active visits only | carol | `200`, `visits` array contains only visits where `checkedOutAt` is null |
| VS-02 | Each visit has patient snapshot | carol | Each item has `patient.firstName`, `patient.lastName`, `patient.code` |
| VS-03 | Checked-out visit absent | carol | After checkout (see Section 5), that visit no longer appears |
| VS-04 | No active visits | carol | `200`, `{ visits: [] }` |
| VS-05 | No `PATIENT_VIEW` | frank | `403` |
| VS-06 | Cross-hospital: Hospital A user → Hospital B visits | carol | `403` |
| VS-07 | Unauthenticated | — | `401` |

---

## Section 4 — Patient Flow: Advance Visit Stage

**Endpoint:** `PATCH /api/v1/hospitals/:hospitalId/visits/:visitId`  
**Permission required:** `PATIENT_ADMIT`

| ID | Test | Input | Expected |
|----|------|-------|----------|
| SA-01 | Forward: `waiting_nurse → with_nurse` | `{ stage: "with_nurse" }` | `200`, stage updated in DB |
| SA-02 | Forward: `with_nurse → waiting_doctor` | `{ stage: "waiting_doctor" }` | `200` |
| SA-03 | Forward: `waiting_doctor → with_doctor` | `{ stage: "with_doctor" }` | `200` |
| SA-04 | Forward: `with_doctor → done` | `{ stage: "done" }` | `200` |
| SA-05 | Update `assignedNurseId` via PATCH | `{ assignedNurseId: dave_member_id }` | `200`, field updated |
| SA-06 | Update `assignedDoctorId` via PATCH | `{ assignedDoctorId: carol_member_id }` | `200`, field updated |
| SA-07 | Update `notes` via PATCH | `{ notes: "Updated notes" }` | `200`, notes updated |
| SA-08 | Update `department` via PATCH | `{ department: "ICU" }` | `200`, dept updated |
| SA-09 | Invalid stage string | `{ stage: "at_reception" }` | `400` or `422` — invalid enum |
| SA-10 | Backward stage transition (`with_doctor → waiting_nurse`) | `{ stage: "waiting_nurse" }` | **Known gap**: backend accepts this — expected `200`, but MUST be filed as `BUG-PF-S-01` |
| SA-11 | Non-existent visitId | path param = `VIS-does-not-exist` | `404` |
| SA-12 | PATCH on checked-out visit | valid stage on checkout visit | `409` |
| SA-13 | No `PATIENT_ADMIT` | frank | `403` |
| SA-14 | Cross-hospital | carol on Hospital B visit | `403` or `404` |

---

## Section 5 — Patient Flow: Checkout Visit

**Endpoint:** `POST /api/v1/hospitals/:hospitalId/visits/:visitId/checkout`  
**Permission required:** `PATIENT_ADMIT`

| ID | Test | Expected |
|----|------|----------|
| CO-01 | Happy path checkout | `200`, `visit.checkedOutAt` set (ISO timestamp), `visit.stage = "done"` |
| CO-02 | Patient `admissionStatus` after checkout | `patient.admissionStatus = "outpatient"` — verified in DB |
| CO-03 | `patient.currentHospitalId` after checkout | **BUG-PF-01 regression check**: should be `null` or unset — document actual value |
| CO-04 | Visit absent from GET /visits after checkout | GET /visits does not include this visit |
| CO-05 | Double checkout | `409` Conflict |
| CO-06 | Non-existent visitId | `404` |
| CO-07 | No `PATIENT_ADMIT` | frank | `403` |
| CO-08 | Cross-hospital | `403` or `404` |

---

## Section 6 — Patient Search: admissionStatus Filter

**Endpoint:** `GET /api/v1/hospitals/:hospitalId/patients?admissionStatus=:value`

| ID | Test | Expected |
|----|------|----------|
| PS-01 | No filter | `200`, all patients returned |
| PS-02 | `admissionStatus=outpatient` | Only outpatient patients in results |
| PS-03 | `admissionStatus=admitted` | Only admitted patients in results |
| PS-04 | `admissionStatus=discharged` | Only discharged patients in results |
| PS-05 | `admissionStatus=dead` (invalid value) | `400` — Zod strict enum rejects it |
| PS-06 | No patients match filter | `200`, empty array |
| PS-07 | Combined: `?q=John&admissionStatus=outpatient` | Only outpatient patients whose name matches "John" |

---

## Section 7 — Task 1.5: Extended Usage Endpoint

**Endpoint:** `GET /api/v1/hospitals/:hospitalId/usage`  
**Permission required:** `SETTINGS_VIEW`

| ID | Test | Setup | Expected |
|----|------|-------|----------|
| U-01 | Returns all 4 fields | alice | `200`, response has `members`, `patientsAdmitted`, `patientsCheckedIn`, `labsPending` — all numbers |
| U-02 | `members` count | Fresh seed: 6 members | `members = 6` |
| U-03 | `patientsAdmitted` count | Admit a patient first; check count | `patientsAdmitted = 1` |
| U-04 | `patientsCheckedIn` count | Check in a patient (active visit); verify count | `patientsCheckedIn = 1` |
| U-05 | `patientsCheckedIn` decrements after checkout | Checkout the visit | `patientsCheckedIn` back to 0 |
| U-06 | `labsPending` count | Create a lab order with non-released status | `labsPending >= 1` |
| U-07 | All counts zero on empty hospital | Use Hospital B (no patients, no labs) | All new fields = `0` |
| U-08 | No `SETTINGS_VIEW` | frank (lab_tech) | `403` |
| U-09 | Cross-hospital isolation | carol (no SETTINGS_VIEW on Hosp B) | `403` |

---

## Section 8 — Task 3: Outgoing Transfers

**Endpoint:** `GET /api/v1/hospitals/:hospitalId/transfers/outgoing`  
**Permission required:** `PATIENT_TRANSFER`

| ID | Test | Setup | Expected |
|----|------|-------|----------|
| TO-01 | Returns outgoing transfers | alice: first create a transfer (POST transfer from Hosp A to Hosp B) | `200`, `transfers` array contains the transfer with `fromHospitalId = hospitalAId` |
| TO-02 | No transfers sent | Use Hospital B (no outgoing transfers) | `200`, `{ transfers: [] }` |
| TO-03 | Includes `pending` transfers | Transfer just created | Status = `"pending"` in response |
| TO-04 | Includes `accepted` transfers | Grace accepts the transfer from Hosp B | Transfer still visible in outgoing, status = `"accepted"` |
| TO-05 | Includes `declined` transfers | Create + decline a transfer | Transfer visible in outgoing, status = `"declined"` |
| TO-06 | Does NOT return incoming transfers | Transfers TO Hospital A not in this response | Verify `fromHospitalId` on all returned items = Hospital A |
| TO-07 | No `PATIENT_TRANSFER` | frank (lab_tech) | `403` |
| TO-08 | Cross-hospital: Hosp A user queries Hosp B outgoing | carol → Hospital B | `403` |

---

## Section 9 — Task 3: Permission Regression on Existing Transfer Routes

These 4 routes previously only checked `hospitalScope`. They now require `PATIENT_TRANSFER`. This is a regression fix — verify old behavior is gone.

**Users to test with:** dave (nurse) and frank (lab_tech) — neither has `PATIENT_TRANSFER`

| ID | Route | Actor | Expected |
|----|-------|-------|----------|
| TR-01 | `GET /transfers/incoming` | dave (nurse, no `PATIENT_TRANSFER`) | `403` — was previously `200` |
| TR-02 | `GET /transfers/incoming` | frank (lab_tech) | `403` |
| TR-03 | `POST /transfers/:id/accept` | dave | `403` — was previously callable |
| TR-04 | `POST /transfers/:id/decline` | dave | `403` — was previously callable |
| TR-05 | `GET /transfers/incoming` | carol (doctor, has `PATIENT_TRANSFER`) | `200` — still works |
| TR-06 | `GET /transfers/outgoing` | carol | `200` |
| TR-07 | `GET /transfers/incoming` | eve (reception, has `PATIENT_TRANSFER`) | `200` |
| TR-08 | Unauthenticated on any transfer route | — | `401` |

---

## Section 10 — Task 4: Hospital Units — GET (List)

**Endpoint:** `GET /api/v1/hospitals/:hospitalId/units`  
**Permission required:** `hospitalScope` only (any authenticated member)

| ID | Test | Expected |
|----|------|----------|
| UN-01 | Hospital with units (after creating some) | `200`, `{ units: [...] }` — all units (active + inactive) |
| UN-02 | Hospital with no units (fresh Hospital B) | `200`, `{ units: [] }` |
| UN-03 | Unauthenticated | `401` |
| UN-04 | Member of a different hospital | `403` |
| UN-05 | Sorted by type then name | Verify sort order on response |

---

## Section 11 — Task 4: Hospital Units — POST (Create)

**Endpoint:** `POST /api/v1/hospitals/:hospitalId/units`  
**Permission required:** `UNITS_MANAGE` (hospital_admin only by default)

| ID | Test | Actor | Input | Expected |
|----|------|-------|-------|----------|
| UC-01 | Create department | bob | `{ name: "Cardiology", type: "department" }` | `201`, `unit.id` starts with `UNT-`, `unit.isActive = true` |
| UC-02 | Create unit type | bob | `{ name: "Ward 3", type: "unit" }` | `201` |
| UC-03 | Create ward type | bob | `{ name: "ICU", type: "ward" }` | `201` |
| UC-04 | Create with parentId | bob | `{ name: "Cardiology Clinic", type: "unit", parentId: cardio_unit_id }` | `201`, `unit.parentId` stored |
| UC-05 | Duplicate name (same hospital) | bob | `{ name: "Cardiology", type: "department" }` | `409` Conflict |
| UC-06 | Duplicate name — case insensitive | bob | `{ name: "cardiology", type: "department" }` | `409` (case-insensitive enforcement) |
| UC-07 | Non-existent parentId | bob | `{ name: "Sub", type: "unit", parentId: "UNT-does-not-exist" }` | `404` |
| UC-08 | parentId belongs to different hospital | bob | parentId from Hospital B | `404` |
| UC-09 | Missing `name` | bob | `{ type: "department" }` | `400` |
| UC-10 | Missing `type` | bob | `{ name: "Test" }` | `400` |
| UC-11 | Invalid `type` enum | bob | `{ name: "Test", type: "surgery_suite" }` | `400` |
| UC-12 | No `UNITS_MANAGE` | carol (doctor) | valid body | `403` |
| UC-13 | No `UNITS_MANAGE` | frank | valid body | `403` |
| UC-14 | Unauthenticated | — | valid body | `401` |

---

## Section 12 — Task 4: Hospital Units — PATCH (Update)

**Endpoint:** `PATCH /api/v1/hospitals/:hospitalId/units/:unitId`  
**Permission required:** `UNITS_MANAGE`

| ID | Test | Input | Expected |
|----|------|-------|----------|
| UU-01 | Rename | `{ name: "Cardiology Dept" }` | `200`, name updated |
| UU-02 | Change type | `{ type: "ward" }` | `200`, type updated |
| UU-03 | Set parentId | `{ parentId: other_unit_id }` | `200`, parentId stored |
| UU-04 | Deactivate | `{ isActive: false }` | `200`, `unit.isActive = false` |
| UU-05 | Reactivate | `{ isActive: true }` | `200`, `unit.isActive = true` |
| UU-06 | Rename to existing name | `{ name: "Cardiology" }` (name taken) | `409` |
| UU-07 | Rename to same name (no change) | `{ name: "Cardiology Dept" }` same as current | `200` — not a conflict |
| UU-08 | parentId from different hospital | `{ parentId: hospitalB_unit_id }` | `404` |
| UU-09 | Unit belongs to different hospital | path uses hospitalB unitId | `404` |
| UU-10 | Non-existent unitId | path = `UNT-does-not-exist` | `404` |
| UU-11 | No `UNITS_MANAGE` | carol | `403` |

---

## Section 13 — Task 4: Hospital Units — DELETE

**Endpoint:** `DELETE /api/v1/hospitals/:hospitalId/units/:unitId`  
**Permission required:** `UNITS_MANAGE`

| ID | Test | Setup | Expected |
|----|------|-------|----------|
| UD-01 | Delete unit with no children | Leaf unit | `204`, unit gone from GET /units |
| UD-02 | Delete unit with active children | Parent unit with active child | `409` Conflict |
| UD-03 | Delete unit with only inactive children | Deactivate child first, then delete parent | `204` — inactive children do not block |
| UD-04 | Unit belongs to different hospital | hospitalB unitId via hospitalA | `404` |
| UD-05 | Non-existent unitId | `UNT-does-not-exist` | `404` |
| UD-06 | No `UNITS_MANAGE` | carol | `403` |

---

## Section 14 — Cross-Cutting Checks

| ID | Check | How to verify |
|----|-------|---------------|
| X-01 | No token → 401 on every protected endpoint | Spot-check one endpoint from each section above with no Authorization header |
| X-02 | Error envelope shape | Every error response must have `{ error: { code: "...", message: "..." } }` — never flat `{ message }` |
| X-03 | All IDs are prefixed | `UNT-`, `TRF-`, visit IDs — verify format on create responses |
| X-04 | Timestamps are ISO 8601 | `checkedInAt`, `createdAt`, `updatedAt` — all must include timezone (`Z` suffix) |
| X-05 | PATCH is non-destructive | Sending `{ name: "X" }` to a unit PATCH does not null out other fields |
| X-06 | No sensitive fields in responses | No `passwordHash`, `tokenVersion`, internal DB fields leaked |

---

## Pre-Execution Fix Verification

These bugs were found in the last test run. Each has a dedicated case above:

| Bug ID | Claim | Test Case | Pass condition |
|--------|-------|-----------|----------------|
| BUG-PF-01 | Checkout clears `patient.currentHospitalId` | CO-03 | `patient.currentHospitalId` is `null` or unset after checkout |
| BUG-PF-S-01 | Stage backward movement rejected | SA-10 | `403` or `409` — currently returns `200` (gap) |

---

## Known Gaps to Document (not fix criteria for this run)

| Gap | Section | Notes |
|-----|---------|-------|
| GAP-PF-01 | CI-10 | Double check-in creates new visit — no active-visit guard |
| GAP-PF-02 | CI-08 | No FK validation on `assignedNurseId` / `assignedDoctorId` |
| BUG-PF-S-01 | SA-10 | Backend accepts backward stage transitions |

---

## Total Test Count

| Section | Cases |
|---------|-------|
| 1 — Check-In | 13 |
| 2 — Queue Numbers | 4 |
| 3 — List Active Visits | 7 |
| 4 — Advance Visit Stage | 14 |
| 5 — Checkout Visit | 8 |
| 6 — Patient Search Filter | 7 |
| 7 — Task 1.5: Usage Endpoint | 9 |
| 8 — Task 3: Outgoing Transfers | 8 |
| 9 — Task 3: Permission Regression | 8 |
| 10 — Task 4: Units GET | 5 |
| 11 — Task 4: Units POST | 14 |
| 12 — Task 4: Units PATCH | 11 |
| 13 — Task 4: Units DELETE | 6 |
| 14 — Cross-cutting | 6 |
| **Total** | **120** |