# Backend QA Handoff — Patient History & Admission Records

## Summary

Two new endpoints were added to expose a patient's full admission history and check-in (visit) history. The `admit` and `discharge` actions were updated to write/close `PatientAdmission` records so that every inpatient stay is permanently tracked.

---

## New / Changed Endpoints

### 1. `POST /api/v1/hospitals/:hospitalId/patients/:patientId/admit`

**Changed behaviour** — now creates a `PatientAdmission` record in addition to updating the patient's `admissionStatus`.

| Field | Value |
|-------|-------|
| Auth | Bearer token required |
| Permission | `PATIENT_ADMIT` |
| Body | `{ department?: string, assignedTo?: string, notes?: string }` |

**What changed internally:**
- Calls `patientRepo.createAdmission()` with a new `ADM-` prefixed ID
- Fields persisted: `patientId`, `hospitalId`, `admittedAt`, `admittedBy`, `department`, `assignedTo`, `notes`
- Patient `admissionStatus` still updated to `"admitted"`

**Test cases:**

| # | Scenario | Expected |
|---|----------|----------|
| B1 | Admit a patient with department + assignedTo | 200 OK; patient returned with `admissionStatus: "admitted"`; admission record created in DB (`patient_admissions` collection) |
| B2 | Admit with no optional fields | 200 OK; admission created with only required fields |
| B3 | Admit without token | 401 |
| B4 | Admit without `PATIENT_ADMIT` permission | 403 |
| B5 | Admit a patient not linked to this hospital | 404 |
| B6 | Verify `ADM-` prefix on new record ID | Admission `id` starts with `ADM-` |

---

### 2. `POST /api/v1/hospitals/:hospitalId/patients/:patientId/discharge`

**Changed behaviour** — now closes the most recent open `PatientAdmission` record.

| Field | Value |
|-------|-------|
| Auth | Bearer token required |
| Permission | `PATIENT_ADMIT` |
| Body | `{ notes?: string, followUpDate?: string }` |

**What changed internally:**
- Calls `patientRepo.closeAdmission()` — finds open record (`dischargedAt: { $exists: false }`) and sets `dischargedAt`, `dischargedBy`, `dischargeNotes`
- Patient `admissionStatus` still updated to `"discharged"`

**Test cases:**

| # | Scenario | Expected |
|---|----------|----------|
| B7 | Discharge a currently admitted patient | 200 OK; open admission record now has `dischargedAt` + `dischargedBy` set |
| B8 | Discharge with discharge notes | `dischargeNotes` saved on closed admission |
| B9 | Discharge a patient who was never admitted (no open admission) | 200 OK (patient status updated); no error thrown (closeAdmission is a soft no-op if no open record) |
| B10 | Discharge without token | 401 |

---

### 3. `GET /api/v1/hospitals/:hospitalId/patients/:patientId/admissions` *(new)*

Returns all admission records for a patient at this hospital, sorted newest first.

| Field | Value |
|-------|-------|
| Auth | Bearer token required |
| Permission | `PATIENT_VIEW` |
| Response | `{ admissions: PatientAdmission[] }` |

**Test cases:**

| # | Scenario | Expected |
|---|----------|----------|
| B11 | Fetch admissions for a patient with 3 previous admissions | 200 OK; array of 3 records, sorted `admittedAt` descending |
| B12 | Fetch admissions for a patient with no history | 200 OK; `admissions: []` |
| B13 | Fetch admissions — patient not linked to hospital | 404 |
| B14 | Fetch using patientCode (`CAE-xxx`) instead of ID | 200 OK (resolvePatientId handles both) |
| B15 | Fetch without `PATIENT_VIEW` permission | 403 |
| B16 | Verify `dischargedAt` present on closed admissions, absent on open | Matches DB state |

**Response shape:**
```json
{
  "data": {
    "admissions": [
      {
        "id": "ADM-xxx",
        "patientId": "PAT-xxx",
        "hospitalId": "HSP-xxx",
        "admittedAt": "2026-05-10T08:00:00.000Z",
        "admittedBy": "STF-xxx",
        "department": "Cardiology",
        "assignedTo": "STF-yyy",
        "notes": "...",
        "dischargedAt": "2026-05-12T14:00:00.000Z",
        "dischargedBy": "STF-xxx",
        "dischargeNotes": "Stable, follow up in 2 weeks",
        "createdAt": "...",
        "updatedAt": "..."
      }
    ]
  }
}
```

---

### 4. `GET /api/v1/hospitals/:hospitalId/patients/:patientId/check-ins` *(new)*

Returns all check-in visit records for a patient at this hospital, sorted newest first.

| Field | Value |
|-------|-------|
| Auth | Bearer token required |
| Permission | `PATIENT_VIEW` |
| Response | `{ visits: CheckInVisit[] }` |

**Test cases:**

| # | Scenario | Expected |
|---|----------|----------|
| B17 | Fetch check-ins for a patient with prior visits | 200 OK; array sorted `checkedInAt` descending |
| B18 | Fetch check-ins for a patient with no history | 200 OK; `visits: []` |
| B19 | Fetch check-ins — patient not linked to hospital | 404 |
| B20 | Fetch using patientCode | 200 OK |
| B21 | Verify active visit has no `checkedOutAt` field | `checkedOutAt` absent on in-progress visits |

**Response shape:**
```json
{
  "data": {
    "visits": [
      {
        "id": "VIS-xxx",
        "hospitalId": "HSP-xxx",
        "patientId": "PAT-xxx",
        "patientCode": "CAE-xxx",
        "queueNumber": 4,
        "checkedInAt": "2026-05-15T09:30:00.000Z",
        "checkedInBy": "STF-xxx",
        "checkedOutAt": "2026-05-15T11:00:00.000Z",
        "stage": "done",
        "department": "General",
        "createdAt": "...",
        "updatedAt": "..."
      }
    ]
  }
}
```

---

## Database

### New collection: `patient_admissions`

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | `ADM-` prefix |
| `patientId` | string | |
| `hospitalId` | string | |
| `admittedAt` | Date | |
| `admittedBy` | string | userId |
| `department` | string? | |
| `assignedTo` | string? | userId |
| `notes` | string? | |
| `dischargedAt` | Date? | absent if still admitted |
| `dischargedBy` | string? | |
| `dischargeNotes` | string? | |

**Indexes:** `{ patientId, hospitalId }`, `{ hospitalId, admittedAt: -1 }`

---

## Regression checks

| # | Scenario | Expected |
|---|----------|----------|
| B22 | Checkin flow still works end-to-end | `POST /checkin` returns 200; visit created in `check_in_visits` |
| B23 | Checkout flow still works | `POST /checkout` returns 200 |
| B24 | Transfer flow unaffected | `POST /transfer` creates transfer record |
| B25 | Existing `/admissions` route for `PatientAdmissions` list (non-history) unaffected | `GET /hospitals/:id/patients` still paginates correctly |
