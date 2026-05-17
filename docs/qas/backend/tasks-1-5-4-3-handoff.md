# Backend QA Handoff — Dashboard Stats, Outbound Transfers, Hospital Units

## Overview

Three backend features shipped:
1. **Task 1.5** — Extended `GET /hospitals/:hospitalId/usage` to return live patient and lab counts
2. **Task 3** — New `GET /transfers/outgoing` endpoint + `requirePermission` added to all transfer routes
3. **Task 4** — New hospital units system (model, CRUD endpoints, `UNITS_MANAGE` permission)

All changes live under `apps/main-backend/src/features/`.

---

## Task 1.5 — Extended Usage Endpoint

### Endpoint

| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/v1/hospitals/:hospitalId/usage` |
| **Permission** | `SETTINGS_VIEW` |

### Updated Response Shape

```json
{
  "data": {
    "members": 12,
    "patientsAdmitted": 4,
    "patientsCheckedIn": 7,
    "labsPending": 3
  }
}
```

| Field | Source |
|---|---|
| `members` | Count of active `HospitalMember` documents |
| `patientsAdmitted` | Count of patients with `admissionStatus=admitted` AND `currentHospitalId=hospitalId` |
| `patientsCheckedIn` | Count of `CheckInVisit` documents with no `checkedOutAt` |
| `labsPending` | Count of lab orders with status in `[awaiting_sample, sample_received, awaiting_test, in_progress, awaiting_result]` |

### Test Cases

| # | Scenario | Expected |
|---|---|---|
| 1 | Hospital with admitted patients | `patientsAdmitted` matches count of `admitted` patients scoped to this hospital |
| 2 | Hospital with active check-in visits | `patientsCheckedIn` matches active visit count |
| 3 | Hospital with pending lab orders | `labsPending` includes all pre-result-released statuses |
| 4 | Empty hospital (no patients, no labs) | All new fields return `0` |
| 5 | User without `SETTINGS_VIEW` | `403` |

---

## Task 3 — Outbound Transfers + Permission Fix

### New Endpoint

| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/v1/hospitals/:hospitalId/transfers/outgoing` |
| **Permission** | `PATIENT_TRANSFER` |

Returns all transfers where `fromHospitalId = hospitalId`, sorted by `createdAt` descending. Includes all statuses: `pending`, `accepted`, `declined`.

**Response:**
```json
{
  "data": {
    "transfers": [
      {
        "id": "TRF-...",
        "patientId": "PAT-...",
        "fromHospitalId": "HSP-...",
        "toHospitalId": "HSP-...",
        "reason": "Specialist required",
        "status": "pending",
        "recordsPackage": { ... },
        "createdAt": "...",
        "updatedAt": "..."
      }
    ]
  }
}
```

### Fixed: Permission on Existing Transfer Routes

All three transfer routes now require `PATIENT_TRANSFER`. Previously only `hospitalScope` was checked (any member of the hospital could accept/decline a transfer):

| Route | Was | Now |
|---|---|---|
| `GET /transfers/incoming` | `hospitalScope` only | + `PATIENT_TRANSFER` |
| `POST /transfers/:id/accept` | `hospitalScope` only | + `PATIENT_TRANSFER` |
| `POST /transfers/:id/decline` | `hospitalScope` only | + `PATIENT_TRANSFER` |

### Roles with `PATIENT_TRANSFER`

`hospital_admin`, `doctor`, `nurse_practitioner`, `physician_assistant`, `reception`

### Test Cases

| # | Scenario | Expected |
|---|---|---|
| 6 | GET outgoing transfers | Returns transfers where `fromHospitalId` matches, all statuses |
| 7 | GET outgoing — no transfers sent | Empty array, `200` |
| 8 | GET outgoing — includes accepted and declined | All statuses visible |
| 9 | User without `PATIENT_TRANSFER` → GET outgoing | `403` |
| 10 | User without `PATIENT_TRANSFER` → GET incoming | `403` (was previously `200`) — **regression fix** |
| 11 | User without `PATIENT_TRANSFER` → POST accept | `403` (was previously `200`) — **regression fix** |
| 12 | User without `PATIENT_TRANSFER` → POST decline | `403` (was previously `200`) — **regression fix** |
| 13 | Hospital A calls GET outgoing for Hospital B | `403` (hospitalScope blocks) |

---

## Task 4 — Hospital Units

### New Permission

`UNITS_MANAGE` (`'units.manage'`) — added to `packages/rbac/src/permissions.ts`.

Assigned by default to: `hospital_admin`.

No other system roles have this permission.

### New Model: `HospitalUnit` (collection: `hospital_units`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | yes | `UNT-` prefix |
| `hospitalId` | string | yes | |
| `name` | string | yes | Unique per hospital (case-insensitive enforced in service) |
| `type` | enum | yes | `department \| unit \| ward` |
| `parentId` | string | no | ID of a parent `HospitalUnit` |
| `isActive` | boolean | yes | Default: `true` |
| `createdAt` | Date | yes | |
| `updatedAt` | Date | yes | |

Indexes: `{ hospitalId, isActive }`, `{ hospitalId, name }` (unique)

### Endpoints

#### GET `/api/v1/hospitals/:hospitalId/units`

| | |
|---|---|
| **Permission** | `hospitalScope` only (any authenticated member) |

Returns all units for the hospital (active and inactive), sorted by `type` then `name`.

#### POST `/api/v1/hospitals/:hospitalId/units`

| | |
|---|---|
| **Permission** | `UNITS_MANAGE` |

**Request body:**
```json
{
  "name": "Cardiology",
  "type": "department",
  "parentId": "UNT-..."
}
```
`parentId` is optional.

**Business rules:**
- Name must be unique per hospital (409 if duplicate)
- `parentId` must exist and belong to same hospital (404 if not)

#### PATCH `/api/v1/hospitals/:hospitalId/units/:unitId`

| | |
|---|---|
| **Permission** | `UNITS_MANAGE` |

All fields optional. Can update `name`, `type`, `parentId`, `isActive`.

**Business rules:**
- Unit must belong to this hospital (404 if not)
- Name uniqueness enforced on change (409 if name taken)
- `parentId` validated against same hospital

#### DELETE `/api/v1/hospitals/:hospitalId/units/:unitId`

| | |
|---|---|
| **Permission** | `UNITS_MANAGE` |

**Business rules:**
- Unit must belong to this hospital (404 if not)
- Unit with active child units cannot be deleted (409 Conflict)

### Test Cases

| # | Scenario | Expected |
|---|---|---|
| 14 | GET /units — hospital with units | Returns all units (active + inactive) |
| 15 | GET /units — unauthenticated | `401` |
| 16 | GET /units — member of another hospital | `403` |
| 17 | POST /units — valid department | `201`, unit created with `isActive: true` |
| 18 | POST /units — duplicate name | `409` Conflict |
| 19 | POST /units — non-existent `parentId` | `404` Not Found |
| 20 | POST /units — user without `UNITS_MANAGE` | `403` |
| 21 | PATCH /units/:id — rename | `200`, name updated |
| 22 | PATCH /units/:id — set `isActive: false` | `200`, unit deactivated |
| 23 | PATCH /units/:id — rename to existing name | `409` Conflict |
| 24 | PATCH /units/:id — unit from different hospital | `404` |
| 25 | PATCH /units/:id — user without `UNITS_MANAGE` | `403` |
| 26 | DELETE /units/:id — unit with no children | `204` |
| 27 | DELETE /units/:id — unit with active child units | `409` Conflict |
| 28 | DELETE /units/:id — unit from different hospital | `404` |
| 29 | DELETE /units/:id — user without `UNITS_MANAGE` | `403` |

---

## Files Changed

| File | Change |
|---|---|
| `packages/rbac/src/permissions.ts` | Added `UNITS_MANAGE` |
| `packages/rbac/src/roles.ts` | Added `UNITS_MANAGE` to `hospital_admin` defaults |
| `packages/rbac/src/descriptions.ts` | Added description and group entry for `UNITS_MANAGE` |
| `apps/main-backend/src/lib/ids.ts` | Added `unit: () => make('UNT-')` |
| `apps/main-backend/src/features/hospitals/hospital-unit.model.ts` | New |
| `apps/main-backend/src/features/hospitals/hospital-unit.schema.ts` | New |
| `apps/main-backend/src/features/hospitals/hospital-unit.repo.ts` | New |
| `apps/main-backend/src/features/hospitals/hospital-unit.service.ts` | New |
| `apps/main-backend/src/features/hospitals/hospital.routes.ts` | Added 4 unit routes |
| `apps/main-backend/src/features/hospitals/hospital.service.ts` | Extended `getUsage()` |
| `apps/main-backend/src/features/patients/patient.repo.ts` | Added `countByAdmissionStatus`, `countActiveVisits`, `findOutgoingTransfers` |
| `apps/main-backend/src/features/patients/patient.service.ts` | Added `getOutgoingTransfers` |
| `apps/main-backend/src/features/patients/index.ts` | Added outgoing transfers route + `requirePermission` on all transfer routes |
| `apps/main-backend/src/features/labs/lab.repo.ts` | Added `countPendingByHospital` |
