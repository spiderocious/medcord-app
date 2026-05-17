# Patient Flow — Backend QA Handoff

## Overview

This document covers backend changes to the patient check-in, visit management, and patient search flows in the medcord-app. The primary goal was to introduce a structured visit lifecycle (queue → triage → doctor → discharge) backed by new collections, and to extend patient search with an admission status filter.

All endpoints live under `apps/main-backend/src/features/patients/`.

---

## Scope of Changes

### New Models

**`CheckInVisit`** — collection: `checkin_visits`

Represents a single patient visit from check-in to checkout.

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `hospitalId` | string | |
| `patientId` | string | |
| `patientCode` | string | |
| `queueNumber` | number | Daily sequential, resets at midnight UTC |
| `stage` | `VisitStage` | See stage machine below |
| `assignedNurseId` | string? | Optional |
| `assignedDoctorId` | string? | Optional |
| `department` | string? | Optional |
| `notes` | string? | Optional |
| `checkedInAt` | Date | Set on creation |
| `checkedOutAt` | Date? | `null` = visit is still active |
| `checkedInBy` | string | Staff member who performed the check-in |

Stage machine (forward-only): `waiting_nurse → with_nurse → waiting_doctor → with_doctor → done`

**`DailyQueueCounter`** — collection: `daily_queue_counters`

Tracks daily sequential queue numbers per hospital.

| Field | Type | Notes |
|---|---|---|
| `hospitalId` | string | |
| `date` | string | Format: `YYYY-MM-DD` (UTC) |
| `count` | number | Incremented atomically |

Unique index on `{ hospitalId, date }`. Incremented via `findOneAndUpdate($inc: { count: 1 }, upsert: true)`.

### Updated `IPatient`

- Added optional field: `assignedDoctorId?: string`

---

## API Endpoints

### Updated: Check-In Patient

| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/v1/hospitals/:hospitalId/patients/:patientId/checkin` |
| **Permission** | `PATIENT_ADMIT` |

**Request body (new shape):**

```json
{
  "department": "string (optional)",
  "assignedNurseId": "string (optional)",
  "assignedDoctorId": "string (optional)",
  "notes": "string (optional)"
}
```

> Note: `assignedTo` from the old body is replaced by `assignedNurseId` and `assignedDoctorId`.

**Success response (`200`):**

```json
{
  "visit": {
    "id": "...",
    "queueNumber": 1,
    "stage": "waiting_nurse",
    "checkedInAt": "...",
    ...
  }
}
```

**Edge cases:**

| Scenario | Expected |
|---|---|
| Patient has an existing active visit | Should fail or return existing visit — verify behavior |
| `department` omitted | Succeeds; field absent or null on document |
| `assignedNurseId` / `assignedDoctorId` omitted | Succeeds; fields absent |
| `assignedNurseId` references a non-existent staff ID | No FK validation — field is stored as-is |

---

### New: List Active Visits

| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/v1/hospitals/:hospitalId/visits` |
| **Permission** | `PATIENT_VIEW` |

**Success response (`200`):**

```json
{
  "visits": [
    {
      "id": "...",
      "queueNumber": 1,
      "stage": "waiting_nurse",
      "checkedInAt": "...",
      "patient": {
        "firstName": "...",
        "lastName": "...",
        "code": "..."
      }
    }
  ]
}
```

**Edge cases:**

| Scenario | Expected |
|---|---|
| No active visits | Empty array, `200` |
| Visit has `checkedOutAt` set | Must NOT appear in results |
| Patient snapshot fields | `firstName`, `lastName`, `code` present on every visit |

---

### New: Advance Visit Stage

| | |
|---|---|
| **Method** | `PATCH` |
| **Path** | `/api/v1/hospitals/:hospitalId/visits/:visitId` |
| **Permission** | `PATIENT_ADMIT` |

**Request body:**

```json
{
  "stage": "with_nurse"
}
```

Valid values: `waiting_nurse`, `with_nurse`, `waiting_doctor`, `with_doctor`, `done`

**Success response (`200`):** Updated visit document.

**Edge cases:**

| Scenario | Expected |
|---|---|
| Invalid stage value | `422` |
| Stage moved backward (e.g. `with_doctor → waiting_nurse`) | **Backend does not validate forward-only** — this is a known gap. Frontend enforces it. Flag as security risk. |
| `visitId` not found | `404` |

---

### New: Checkout Visit

| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/v1/hospitals/:hospitalId/visits/:visitId/checkout` |
| **Permission** | `PATIENT_ADMIT` |

No request body required.

**Success response (`200`):**

```json
{
  "visit": {
    "id": "...",
    "stage": "done",
    "checkedOutAt": "2026-05-17T10:00:00.000Z",
    ...
  }
}
```

**Side effects:**
- Sets `visit.checkedOutAt = now()`
- Sets `visit.stage = 'done'`
- Sets `patient.admissionStatus = 'outpatient'`

**Edge cases:**

| Scenario | Expected |
|---|---|
| Visit already checked out (`checkedOutAt` not null) | **Not currently validated** — flag as gap, document actual behavior |
| `visitId` not found | `404` |

---

### Updated: Search / List Patients

| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/v1/hospitals/:hospitalId/patients` |
| **Permission** | `PATIENT_VIEW` (assumed) |

**New optional query param:** `admissionStatus`

| Value | Behavior |
|---|---|
| `outpatient` | Returns only outpatient patients |
| `admitted` | Returns only admitted patients |
| `discharged` | Returns only discharged patients |
| *(omitted)* | Returns all patients (unchanged behavior) |

**Edge cases:**

| Scenario | Expected |
|---|---|
| `admissionStatus` with unknown value | Verify — likely returns empty array or `422` |
| No patients match the filter | Empty array, `200` |

---

## Model Changes Summary

| Collection | Change |
|---|---|
| `checkin_visits` | New collection |
| `daily_queue_counters` | New collection with unique index on `{ hospitalId, date }` |
| `patients` | Added `assignedDoctorId?: string` field |

---

## Business Logic Rules to Verify

1. **Queue number is hospital-scoped and day-scoped.** Two hospitals checking in patients on the same day get independent counters starting at 1.
2. **Queue number is atomic.** Concurrent check-ins must not produce duplicate queue numbers. Use `findOneAndUpdate` with `$inc` and `upsert: true` — verify no race condition under load.
3. **Queue number resets daily.** The counter key is `{ hospitalId, date }` where `date` is today in UTC. A new day produces a new counter document, not a reset of the existing one.
4. **Active visit = `checkedOutAt` is null.** This is the sole filter for "active" in the GET /visits endpoint.
5. **Checkout is a two-write operation.** Both `visit.checkedOutAt` and `patient.admissionStatus` must be updated. Verify both are persisted.
6. **Stage machine is frontend-enforced only.** The backend `PATCH /visits/:visitId` accepts any valid stage value regardless of current stage. This must be flagged and a backend guard added in a future iteration.

---

## Permission Tests

These tests should be run with tokens that have specific roles assigned. For each case, use a user who is authenticated to the correct hospital but lacks the stated permission.

| # | Endpoint | Permission Missing | Expected Response |
|---|---|---|---|
| 16 | `GET /visits` | `PATIENT_VIEW` | `403` |
| 17 | `POST /patients/:patientId/checkin` | `PATIENT_ADMIT` | `403` |
| 18 | `PATCH /visits/:visitId` | `PATIENT_ADMIT` | `403` |
| 19 | `POST /visits/:visitId/checkout` | `PATIENT_ADMIT` | `403` |

**Additional cross-hospital isolation tests:**

| Scenario | Expected |
|---|---|
| User with `PATIENT_VIEW` for Hospital A calls `GET /visits` for Hospital B | `403` |
| User with `PATIENT_ADMIT` for Hospital A calls `POST /checkin` for Hospital B | `403` |

---

## Full Test Case List

| # | Area | Test | Expected |
|---|---|---|---|
| 1 | Check-in | POST checkin with valid `assignedNurseId` and `assignedDoctorId` | Visit created, `queueNumber > 0`, both IDs stored |
| 2 | Check-in | POST checkin twice for same patient (both active) | Second call fails or returns existing — verify and document behavior |
| 3 | Queue | Check in 3 patients → inspect queue numbers | Numbers are 1, 2, 3 in order |
| 4 | Queue | Queue numbers on a new calendar day | Counter starts at 1 (requires DB date manipulation or time mock) |
| 5 | Check-in | `assignedNurseId` references non-existent staff | Field stored as-is, no error |
| 6 | Check-in | `department` omitted | Request succeeds |
| 7 | Visits | GET /visits | Only returns visits where `checkedOutAt` is null |
| 8 | Visits | GET /visits | Each visit has `patient.firstName`, `patient.lastName`, `patient.code` |
| 9 | Stage | PATCH visit stage to next valid stage | Stage updated in DB |
| 10 | Stage | PATCH visit with invalid stage string | `422` |
| 11 | Checkout | POST checkout | `checkedOutAt` set, `patient.admissionStatus = 'outpatient'` |
| 12 | Checkout | POST checkout on already-checked-out visit | Expected: fail gracefully — **currently unvalidated, flag as gap** |
| 13 | Search | GET /patients?admissionStatus=admitted | Only admitted patients returned |
| 14 | Search | GET /patients?admissionStatus=outpatient | Only outpatient patients returned |
| 15 | Search | GET /patients (no filter) | All patients returned |
| 16 | Permissions | No `PATIENT_VIEW` → GET /visits | `403` |
| 17 | Permissions | No `PATIENT_ADMIT` → POST /checkin | `403` |
| 18 | Permissions | No `PATIENT_ADMIT` → PATCH visit stage | `403` |
| 19 | Permissions | No `PATIENT_ADMIT` → POST checkout | `403` |

---

## Known Gaps / Flagged Issues

| Issue | Severity | Notes |
|---|---|---|
| Stage backward movement not validated on backend | High | Only enforced on frontend. A direct API call can set any stage value. |
| Double check-in not explicitly handled | Medium | Behavior when a patient already has an active visit is unspecified. |
| Double checkout not validated | Low | Calling checkout on an already-checked-out visit is not guarded. |
| No FK validation on `assignedNurseId` / `assignedDoctorId` | Low | Any string is accepted; no check that the referenced staff member exists or has the correct role. |
