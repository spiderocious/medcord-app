# Spec — Patient Flow: Admissions, Check-in Management & Queue Board

**Date:** 2026-05-17
**Author:** Claude  
**Status:** Draft — pending review

---

## Overview

Four related problems, tackled as one coherent feature:

1. **Admitted patients** — a dedicated list/management view for inpatients (`admissionStatus: admitted`)
2. **Checked-in patients** — a list of everyone currently visiting (outpatient status, at this hospital today)
3. **Check-in flow enhancement** — structured assignment to nurse (for vitals) then to doctor, replacing the freetext `assignedTo` string
4. **Queue / tally board** — hospital-wide display of the check-in queue, sequential numbering, stage tracking, "call next" and "remove" actions

These are intentionally additive. The existing `checkIn`, `admit`, `discharge`, `checkout` endpoints stay as-is unless noted.

---

## What already exists (do not re-build)

| Thing | Location |
|-------|---------|
| `admissionStatus` field on `Patient` (`outpatient / admitted / discharged`) | `patient.model.ts`, `patient.schema.ts` |
| `POST /:patientId/checkin`, `POST /:patientId/checkout`, `POST /:patientId/admit`, `POST /:patientId/discharge` | `patient.routes.ts` |
| `CheckInBody { department?, assignedTo? }`, `AdmitBody { department, assignedTo?, notes? }` | `patient.schema.ts` |
| Patient profile page with Check in / Admit / Discharge / Transfer action buttons | `profile-actions.tsx` |
| Patient list at `/h/:slug/patients` | `patient-list` feature |
| `PATIENT_ADMIT` permission gate on check-in / admit / discharge / checkout routes | `patient.routes.ts` |
| `EMR_VITALS_RECORD` permission | `permissions.ts` |

---

## Part 1 — Admitted Patients Screen

### What it is

A dedicated screen listing every patient currently `admissionStatus: admitted` at this hospital. Replaces digging through the general patient list and filtering manually. Gives clinical staff an at-a-glance ward view.

### Backend changes

#### 1a. `GET /hospitals/:hospitalId/patients` — add `admissionStatus` filter

The existing search endpoint (`SearchPatientsQuery`) has no `admissionStatus` filter. Add it.

**File:** `apps/main-backend/src/features/patients/patient.schema.ts`

```ts
export const SearchPatientsQuery = z.object({
  q: z.string().optional(),
  admissionStatus: z.enum(['outpatient', 'admitted', 'discharged']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
```

**File:** `apps/main-backend/src/features/patients/patient.repo.ts`

Pass `admissionStatus` filter into the MongoDB query in `searchByHospital` and `countSearchByHospital`. When present: `{ admissionStatus: filter.admissionStatus, currentHospitalId: hospitalId }`. When absent: current behaviour.

No new route needed.

#### 1b. `PATCH /:patientId/admission` — assign doctor to admitted patient

Currently, `assignedTo` on `AdmitBody` is a freetext string stored nowhere durable (it's cast to `update` but the field doesn't exist on `IPatient`). We need a proper doctor assignment for admitted patients.

Add `assignedDoctorId` to `IPatient`:

```ts
// patient.model.ts
assignedDoctorId?: string | undefined;
```

Add `PATCH /:patientId/admission` endpoint:

```
PATCH /hospitals/:hospitalId/patients/:patientId/admission
Permission: PATIENT_ADMIT
Body: { assignedDoctorId?: string; department?: string; ward?: string; notes?: string }
Response: { patient }
```

This lets clinical staff reassign doctor or update ward/department without a full re-admit flow.

### Frontend changes

#### 1c. New screen: `AdmittedPatientsScreen`

**Route:** `/h/:slug/patients/admitted`
**Route constant:** `HOSPITAL_PATIENTS_ADMITTED: (slug) => /h/${slug}/patients/admitted`

Fetches `GET /patients?admissionStatus=admitted&limit=50`. Lists:
- Patient name + code
- Admitted since (`createdAt` of the admit action — approximate: use `updatedAt` when `admissionStatus` became `admitted`, which we don't track precisely; use `updatedAt` for now as a proxy)
- Department / ward
- Assigned doctor name (from `assignedDoctorId` resolved to staff name — see 1b)
- Quick link to chart (`HOSPITAL_CHART`)
- Quick link to patient profile (`HOSPITAL_PATIENT_PROFILE`)

Permission gate: `PATIENT_VIEW`.

#### 1d. Navigation entry

Add "Admitted" sub-nav link or tab on the patients section alongside the existing patient list. Exact placement: a tab strip on the patients layout (`Patients | Admitted | Checked In`).

---

## Part 2 — Checked-In Patients Screen

### What it is

A list of patients who are currently checked in for an outpatient visit — `admissionStatus: outpatient` AND `currentHospitalId: this hospital` AND checked in today (i.e. visited within the last 24h, or more precisely: a `CheckInVisit` record with `checkedOutAt: null`).

The current model smashes "outpatient and not currently visiting" and "outpatient and currently visiting" into the same `admissionStatus: outpatient` value. We need to distinguish them.

### Backend changes

#### 2a. New model: `CheckInVisit`

**File:** `apps/main-backend/src/features/patients/patient.model.ts` — add model

```ts
export interface ICheckInVisit {
  id: string;
  hospitalId: string;
  patientId: string;
  patientCode: string;
  queueNumber: number;             // sequential, scoped to this hospital's current day
  checkedInAt: Date;
  checkedInBy: string;             // userId of the reception staff
  checkedOutAt?: Date | undefined;
  checkedOutBy?: string | undefined;

  // Nurse assignment
  assignedNurseId?: string | undefined;
  nurseAssignedAt?: Date | undefined;
  nurseSeenAt?: Date | undefined;  // when nurse marked vitals done

  // Doctor assignment
  assignedDoctorId?: string | undefined;
  doctorAssignedAt?: Date | undefined;

  // Stage
  stage: 'waiting_nurse' | 'with_nurse' | 'waiting_doctor' | 'with_doctor' | 'done';

  department?: string | undefined;
  notes?: string | undefined;

  createdAt: Date;
  updatedAt: Date;
}
```

Index: `{ hospitalId: 1, checkedOutAt: 1 }` (for "active visits at this hospital"), `{ hospitalId: 1, queueNumber: 1 }`.

Queue number is a daily counter per hospital — backend maintains a `DailyQueueCounter` document (`{ hospitalId, date, lastNumber }`) and atomically increments it on each check-in.

#### 2b. Update `POST /:patientId/checkin`

**File:** `apps/main-backend/src/features/patients/patient.service.ts`

Existing check-in: updates `Patient.admissionStatus` and some loose fields. Now:
1. Creates a `CheckInVisit` record (stage: `waiting_nurse` if a nurse is assigned, else `waiting_doctor` if only a doctor is assigned, else `waiting_nurse` by default).
2. Assigns `queueNumber` from the daily counter.
3. Returns the updated patient + the visit object.

**`CheckInBody` updates** (`patient.schema.ts`):

```ts
export const CheckInBody = z.object({
  department: z.string().max(100).optional(),
  assignedNurseId: z.string().optional(),   // replaces freetext assignedTo
  assignedDoctorId: z.string().optional(),
  notes: z.string().max(500).optional(),
});
```

The old `assignedTo: string` field is removed from `CheckInBody` (it was never persisted properly anyway).

#### 2c. New routes for visit management

All under `/hospitals/:hospitalId/visits` (or `/hospitals/:hospitalId/patients/:patientId/visits`):

```
GET  /hospitals/:hospitalId/visits
     ?active=true (default: only non-checked-out)
     Permission: PATIENT_VIEW
     Response: { visits: ICheckInVisit[] } (with patient snapshot: name, code, photo)

PATCH /hospitals/:hospitalId/visits/:visitId
     Permission: PATIENT_ADMIT
     Body: { assignedNurseId?, assignedDoctorId?, stage?, notes? }
     Response: { visit }

POST /hospitals/:hospitalId/visits/:visitId/checkout
     Permission: PATIENT_ADMIT
     Body: {}
     Sets checkedOutAt, checkedOutBy, stage: 'done'
     Also sets patient.admissionStatus back to 'outpatient' and clears currentHospitalId
     Response: { visit }
```

**Stage transition rules (enforced by backend):**

| From | Allowed transitions |
|------|-------------------|
| `waiting_nurse` | → `with_nurse` (nurse calls patient) |
| `with_nurse` | → `waiting_doctor` (nurse done, forwards to doctor) |
| `waiting_doctor` | → `with_doctor` (doctor calls patient) |
| `with_doctor` | → `done` (doctor done — checkout) |
| Any | → `done` via checkout endpoint (abscond / early departure) |

The backend only enforces that stage can only move forward (no going backwards). The checkout endpoint is available from any stage.

### Frontend changes

#### 2d. New screen: `CheckedInPatientsScreen`

**Route:** `/h/:slug/patients/checked-in`
**Route constant:** `HOSPITAL_PATIENTS_CHECKEDIN: (slug) => /h/${slug}/patients/checked-in`

Fetches `GET /visits?active=true`. Lists active check-in visits sorted by `queueNumber` ascending.

Columns:
- Queue number (#)
- Patient name + code
- Department
- Stage (badge: Waiting for nurse / With nurse / Waiting for doctor / With doctor)
- Nurse assigned (name or "—")
- Doctor assigned (name or "—")
- Checked in at (time only for today's visits)
- Actions: "Assign" (opens modal), "Check out" (calls checkout endpoint)

Permission gate: `PATIENT_VIEW` to see the list, `PATIENT_ADMIT` to assign/checkout.

---

## Part 3 — Check-in Flow Enhancement

### What it is

The existing check-in modal in `profile-actions.tsx` has freetext `assignedTo`. Replace with structured nurse + doctor dropdowns using the staff list.

### Frontend changes

#### 3a. Update `CheckinForm` in `profile-actions.tsx`

Replace freetext "Assigned to" with two dropdowns:
- "Assign nurse" — `useStaff(hospitalId, { role: 'nurse', status: 'active', limit: 100 })` → populates a `<select>` with staff names.
- "Assign doctor" — `useStaff(hospitalId, { role: 'doctor', status: 'active', limit: 100 })` → same pattern.

Both optional. Neither blocks check-in from completing.

Send `{ department, assignedNurseId, assignedDoctorId }` as `CheckInBody`.

**Note:** The staff that gets assigned will then see this patient in their "my patients" view (see Part 4 — queue board shows assignments).

#### 3b. Nurses see their assigned patients

On the `CheckedInPatientsScreen`, the nurse's own assigned patients are visually highlighted (border/background). A nurse with `PATIENT_VIEW` but without `PATIENT_ADMIT` can still see the list (read-only). The "Call patient" stage advance (waiting_nurse → with_nurse) requires the assigned nurse or anyone with `PATIENT_ADMIT`.

---

## Part 4 — Queue / Tally Board

### What it is

A hospital-wide display screen showing the current check-in queue, grouped by stage, with a sequential queue number per patient. Designed to be displayed on a TV or shared screen in the waiting area. Fully visible to all staff. Staff with the right permissions can call/advance or remove patients.

### Mental model

Each checked-in patient gets a queue number (e.g. #7). The board shows:

```
┌─────────────────┬──────────────────┬───────────────────┐
│  Waiting: Nurse │  Waiting: Doctor │  Currently with   │
│                 │                  │                   │
│  #3 Adeyemi O.  │  #1 Okafor C.    │  Nurse: #5 Bello  │
│  #7 Fashola T.  │  #4 Ibrahim S.   │  Doctor: #2 Nwosu │
└─────────────────┴──────────────────┴───────────────────┘

[ Now serving: #2 Nwosu K. — Dr. Adeleke ]   ← highlighted banner
```

The "called" highlight shows the single most recently called patient (the one currently `with_doctor` or `with_nurse`).

### Backend changes

No new endpoints beyond what's in Part 2. The queue board consumes `GET /visits?active=true` and polls/refreshes. A future enhancement would use WebSockets for real-time updates — for now, polling every 15 seconds is sufficient.

### Frontend changes

#### 4a. New screen: `QueueBoardScreen`

**Route:** `/h/:slug/queue`
**Route constant:** `HOSPITAL_QUEUE: (slug) => /h/${slug}/queue`

**Permission:** `PATIENT_VIEW` (visible to everyone in the hospital).

**Layout:**

- Full-width, ideally usable on a large display.
- Three columns: "Waiting (Nurse)", "Waiting (Doctor)", "Active" (currently with nurse or doctor).
- Each patient card shows: queue number (large, prominent), first name + last initial (for privacy), time checked in.
- "Currently serving" banner at the top: the patient(s) actively being seen, highlighted in a distinct colour.
- Stage action buttons — visible only to users with `PATIENT_ADMIT`:
  - "Call" button: advances the next patient in "Waiting (Nurse)" to "With nurse", or next in "Waiting (Doctor)" to "With doctor".
  - "Done" button on an active card: advances from with_nurse → waiting_doctor, or from with_doctor → done.
  - "Remove" button (destructive): on any card — calls checkout endpoint. Used when patient absconds or leaves. Confirmation modal required.
- Auto-refresh every 15 seconds (useQuery `refetchInterval: 15_000`).
- Manual "Refresh" button for immediate refresh.

#### 4b. Nav entry

Add "Queue" to the sidebar navigation. Visible to all staff.

---

## New permissions needed

Two new permissions should be added to `@medcord/rbac`:

```ts
PATIENT_QUEUE_MANAGE: 'patient.queue.manage',  // call next, advance stages, remove from queue
```

Actually — re-evaluate: `PATIENT_ADMIT` already covers check-in/checkout. Stage advancement on the queue board can reuse `PATIENT_ADMIT` rather than adding a new permission. Keeps the permission surface small. **Decision: reuse `PATIENT_ADMIT` for all queue board actions.** No new permissions needed.

---

## New routes summary

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/hospitals/:hospitalId/patients?admissionStatus=admitted` | `patient.view` | Admitted patients (existing endpoint, new filter) |
| GET | `/hospitals/:hospitalId/visits` | `patient.view` | Active check-in visits (queue) |
| PATCH | `/hospitals/:hospitalId/visits/:visitId` | `patient.admit` | Assign nurse/doctor, update stage |
| POST | `/hospitals/:hospitalId/visits/:visitId/checkout` | `patient.admit` | Check out / remove from queue |

---

## New frontend screens summary

| Screen | Route | Permission |
|--------|-------|-----------|
| `AdmittedPatientsScreen` | `/h/:slug/patients/admitted` | `patient.view` |
| `CheckedInPatientsScreen` | `/h/:slug/patients/checked-in` | `patient.view` |
| `QueueBoardScreen` | `/h/:slug/queue` | `patient.view` |

---

## New route constants needed

```ts
HOSPITAL_PATIENTS_ADMITTED: (slug: string) => `/h/${slug}/patients/admitted`,
HOSPITAL_PATIENTS_CHECKEDIN: (slug: string) => `/h/${slug}/patients/checked-in`,
HOSPITAL_QUEUE: (slug: string) => `/h/${slug}/queue`,
```

---

## New models summary

| Model | Collection | Key fields |
|-------|-----------|-----------|
| `CheckInVisit` | `checkin_visits` | `hospitalId, patientId, queueNumber, stage, assignedNurseId, assignedDoctorId, checkedOutAt` |
| `DailyQueueCounter` | `daily_queue_counters` | `hospitalId, date, lastNumber` — atomic increment via `findOneAndUpdate` with `upsert: true` |

---

## Out of scope for this spec

- Real-time push (WebSockets) — polling at 15s is sufficient for v1
- Inter-department queues (one queue board per department) — v2
- Nurse vitals pre-screen recorded inline in the queue board — that goes into the patient chart via the existing vitals form; this spec only tracks stage progression
- Patient-facing queue number display (patient's own screen) — v2
- Appointment scheduling (pre-scheduled check-ins) — separate feature
