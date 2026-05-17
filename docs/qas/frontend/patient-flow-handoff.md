# Frontend QA Handoff — Patient Flow (Admitted, Checked-In, Queue Board, Check-in Form)

**App:** `apps/medcord-web`
**Date:** 2026-05-17

---

## Scope

| Screen | Route |
|---|---|
| AdmittedPatientsScreen | `/h/:slug/patients/admitted` |
| CheckedInPatientsScreen | `/h/:slug/patients/checked-in` |
| QueueBoardScreen | `/h/:slug/queue` |
| Updated Check-in Form | Patient profile → "Check in" action |

---

## Permission & Module Gates

All three new screens require **both** conditions met:

| Condition | Value |
|---|---|
| Permission | `PATIENT_VIEW` |
| Module | `emr` enabled for the hospital |

Mutating actions on the Queue Board (advance stage, remove) additionally require `PATIENT_ADMIT`.

---

## Screen: AdmittedPatientsScreen

**Route:** `/h/:slug/patients/admitted`
**Sidebar label:** "Admitted"
**Data:** `GET /patients?admissionStatus=admitted`

### Table Columns

| Column | Notes |
|---|---|
| Patient Name | Clickable row |
| Code | Patient code |
| Department | Assigned department |
| Assigned Doctor | `assignedDoctorId` |
| Date Admitted | ISO date |

Clicking a row navigates to the patient profile.

---

## Screen: CheckedInPatientsScreen

**Route:** `/h/:slug/patients/checked-in`
**Sidebar label:** "Checked In"
**Data:** `GET /visits` (active visits only, `refetchInterval: 15s`)

### Table Columns

| Column | Notes |
|---|---|
| Queue # | Queue number |
| Patient | Patient name |
| Stage | Badge (see values below) |
| Department | |
| Checked in at | Timestamp |
| Actions | "Remove" button |

### Stage Badge Values

| Raw value | Displayed label |
|---|---|
| `waiting_nurse` | Waiting · Nurse |
| `with_nurse` | With Nurse |
| `waiting_doctor` | Waiting · Doctor |
| `with_doctor` | With Doctor |
| `done` | Done |

### Behaviours
- Remove button opens a confirmation modal before POSTing checkout.
- Page auto-refetches every 15 seconds — no manual trigger required.
- "Queue Board" button navigates to `/h/:slug/queue`.

---

## Screen: QueueBoardScreen

**Route:** `/h/:slug/queue`
**Sidebar label:** "Queue"
**Data:** auto-refresh every 15s + manual Refresh button

### "Now Serving" Banner

Displayed when at least one visit has stage `with_nurse` or `with_doctor`. Hidden when no such visits exist.

### Column Layout

| Column | Stages shown |
|---|---|
| Waiting · Nurse | `waiting_nurse`, `with_nurse` |
| Waiting · Doctor | `waiting_doctor` |
| With Doctor | `with_doctor` |

### VisitCard Contents

| Field | Format |
|---|---|
| Queue number | `#<number>` |
| Patient name | First name + last initial (e.g. "John D.") |
| Department | |
| Time in | Check-in timestamp |
| Call / Next button | Advances stage (hidden when stage = `with_doctor`) |
| Remove button | Triggers confirmation → POST checkout |

### Stage Advancement Chain

```
waiting_nurse → with_nurse → waiting_doctor → with_doctor → done
```

Once stage is `with_doctor`, "Call / Next" is not rendered (no next stage).

### Permission Gates on Queue Board

| Action | Required permission |
|---|---|
| Call / Next (advance stage) | `PATIENT_ADMIT` |
| Remove | `PATIENT_ADMIT` |

Users without `PATIENT_ADMIT` do not see these buttons at all.

### Navigation
- "List view" button → `/h/:slug/patients/checked-in`
- Manual "Refresh" button triggers an immediate refetch.

---

## Updated Check-in Form (ProfileActionsPanel → CheckinForm)

**Before:** single "Assigned to" freetext field.
**After:** two role-scoped dropdowns — "Assign nurse" and "Assign doctor".

### Dropdown Behaviour

| Dropdown | API call | First option |
|---|---|---|
| Assign nurse | `useStaff({ role: 'nurse', status: 'active', limit: 100 })` | "— no nurse assigned —" |
| Assign doctor | `useStaff({ role: 'doctor', status: 'active', limit: 100 })` | "— no doctor assigned —" |

- Selecting "no assignment" sends an empty string; the field is omitted from the request payload.
- Department field remains as freetext.

---

## Test Cases

### Admitted Patients Screen

| # | Action | Expected result |
|---|---|---|
| 1 | Navigate to `/h/:slug/patients/admitted` | Page loads; table shows only patients with `admissionStatus=admitted` |
| 2 | No admitted patients | Empty state is displayed |
| 3 | Fetch in progress | Loading state visible |
| 4 | Click a patient row | Navigates to that patient's profile |
| 5 | User has `PATIENT_VIEW` + `emr` module enabled | "Admitted" sidebar entry visible |
| 6 | User lacks `PATIENT_VIEW` | Sidebar entry hidden; direct URL access handled by guard or redirect |

### Checked-In Patients Screen

| # | Action | Expected result |
|---|---|---|
| 7 | Load page | Table shows only active visits (not `done` / checked-out) |
| 8 | Inspect stage badge per row | Label matches stage badge table above |
| 9 | Click Remove on any row | Confirmation modal appears: "Remove [Name] from the queue?" |
| 10 | Confirm removal | Visit removed from list on next poll |
| 11 | Cancel removal | No change; visit still listed |
| 12 | Wait 15 seconds (new check-in added externally) | New visit appears without manual refresh |
| 13 | Click "Queue Board" button | Navigates to `/h/:slug/queue` |
| 14 | No active visits | Empty state is displayed |

### Queue Board Screen

| # | Action | Expected result |
|---|---|---|
| 15 | At least one visit is `with_nurse` or `with_doctor` | "Now serving" banner is visible |
| 16 | No `with_nurse` or `with_doctor` visits | Banner is absent |
| 17 | Inspect column grouping | `waiting_nurse` in col 1, `waiting_doctor` in col 2, `with_doctor` in col 3 |
| 18 | `with_nurse` visits | Appear in col 1 (Waiting · Nurse) |
| 19 | Inspect a VisitCard | Shows `#queueNumber`, abbreviated name, department, check-in time |
| 20 | Click "Call / Next" on a `waiting_nurse` card | Card moves to `with_nurse` |
| 21 | Inspect a `with_doctor` card | "Call / Next" button is not rendered |
| 22 | Click "Remove" and confirm | Visit removed; POST checkout fired |
| 23 | User lacks `PATIENT_ADMIT` | "Call / Next" and "Remove" buttons not rendered |
| 24 | Click "Refresh" button | Page data refetched immediately |
| 25 | Click "List view" button | Navigates to `/h/:slug/patients/checked-in` |
| 26 | Wait 15 seconds (data changes externally) | Board updates without manual action |

### Updated Check-in Form

| # | Action | Expected result |
|---|---|---|
| 27 | Open patient profile → click "Check in" | Modal opens; shows "Assign nurse" and "Assign doctor" dropdowns |
| 28 | Inspect nurse dropdown options | Lists only staff with `role=nurse` and `status=active` |
| 29 | Inspect doctor dropdown options | Lists only staff with `role=doctor` and `status=active` |
| 30 | Both dropdowns on open | First option is "— no nurse/doctor assigned —" |
| 31 | Submit with no selections | `assignedNurseId` and `assignedDoctorId` omitted from request payload |
| 32 | Submit with nurse + doctor selected | Correct staff IDs sent in payload |
| 33 | Fill department field and submit | Department value sent as freetext; no regression |

### Navigation & Routes

| # | Check | Expected result |
|---|---|---|
| 34 | All three screens in sidebar (permissions + module met) | Admitted, Checked In, Queue entries visible |
| 35 | Click "Admitted" sidebar entry | Navigates to `/h/:slug/patients/admitted` |
| 36 | Click "Checked In" sidebar entry | Navigates to `/h/:slug/patients/checked-in` |
| 37 | Click "Queue" sidebar entry | Navigates to `/h/:slug/queue` |
| 38 | Access all three routes directly via URL | Pages load without 404; routes are registered in `app.routes.tsx` |

---

## Key Files

| File | Purpose |
|---|---|
| `apps/medcord-web/src/features/patients/features/admitted-patients/` | AdmittedPatientsScreen |
| `apps/medcord-web/src/features/patients/features/checked-in-patients/` | CheckedInPatientsScreen |
| `apps/medcord-web/src/features/patients/features/queue-board/` | QueueBoardScreen |
| `apps/medcord-web/src/features/patients/features/patient-profile/` | ProfileActionsPanel / CheckinForm |
| `apps/medcord-web/src/app/app.routes.tsx` | Route registrations |
