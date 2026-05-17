# Frontend QA Handoff — Check-in/Admit Form Fixes + Entity ID Autolinking

## Overview

Four areas changed:
1. **Check-in modal** — department field now uses units dropdown instead of freetext
2. **Admit modal** — department uses units dropdown; "Assigned to" now a multi-role staff picker
3. **Query invalidation** — patient lists and visit lists now refresh after check-in, checkout, admit, discharge
4. **Entity autolinking** — every entity ID shown in the app is now a clickable link to that entity's detail page

---

## Fix 1 — Check-in Modal: Department Dropdown

**File:** `apps/medcord-web/src/features/patients/features/patient-profile/screen/parts/profile-actions.tsx`

**Route:** `/h/:slug/patients/:code`  
**Trigger:** "Check in" button on a patient profile

### What changed

The Department field in the Check-in modal was a freetext input. It now:
- Shows a `<select>` dropdown populated from `GET /hospitals/:hospitalId/units` (active departments only)
- Falls back to a freetext input if the hospital has no configured departments

The nurse and doctor selects were already working — no change there.

### Test Cases

| # | Scenario | Expected |
|---|---|---|
| 1 | Hospital has departments configured | Department field is a `<select>` with department names |
| 2 | Hospital has no active departments | Department field is a freetext input |
| 3 | Select a department + check in | Department name sent in request body |
| 4 | Leave department blank + check in | Check-in succeeds; department omitted from payload |

---

## Fix 2 — Admit Modal: Department + Assigned To Dropdowns

**File:** `apps/medcord-web/src/features/patients/features/patient-profile/screen/parts/profile-actions.tsx`

**Route:** `/h/:slug/patients/:code`  
**Trigger:** "Admit" button on a patient profile (only shown when `admissionStatus === 'outpatient'`)

### What changed

#### Department field
Was freetext. Now uses the same units dropdown as check-in (active departments only, freetext fallback).

#### "Assigned to" field
Was a freetext input accepting any string. Now:
- `<select>` populated from 4 concurrent `useStaff` calls: `nurse`, `nurse_practitioner`, `physician_assistant`, `doctor` (all active, limit 100 each)
- Combined into a single list in the dropdown; each option shows the staff member's name (falls back to their ID if name is missing)
- First option is `— unassigned —` (blank value)
- Lab techs, pharmacists, receptionists, and technicians are **not included**

The submit guard still requires department to be non-empty before the Admit button fires.

### Test Cases

| # | Scenario | Expected |
|---|---|---|
| 5 | Hospital has departments | Department field is a select |
| 6 | Hospital has no departments | Department field is freetext |
| 7 | "Assigned to" dropdown | Shows nurses, nurse practitioners, physician assistants, doctors — no lab techs or pharmacy |
| 8 | Submit with no department | Button does nothing (guard) |
| 9 | Submit with department + assigned staff | Staff ID sent in `assignedTo` field of request body |
| 10 | Submit with department + no assigned | Admit succeeds; `assignedTo` omitted |

---

## Fix 3 — Query Invalidation After Patient State Changes

**File:** `apps/medcord-web/src/features/patients/features/patient-profile/api/use-patient.ts`

All 4 patient action mutations now invalidate additional query keys on success:

| Mutation | Previously invalidated | Now also invalidates |
|---|---|---|
| `useCheckin` | `['patient', hospitalId, patientId]` | `['patients', hospitalId]`, `['visits', hospitalId]` |
| `useCheckout` | `['patient', hospitalId, patientId]` | `['patients', hospitalId]`, `['visits', hospitalId]` |
| `useAdmit` | `['patient', hospitalId, patientId]` | `['patients', hospitalId]` |
| `useDischarge` | `['patient', hospitalId, patientId]` | `['patients', hospitalId]` |

The `['patients', hospitalId]` prefix invalidation covers:
- All-patients list (`/h/:slug/patients`)
- Admitted patients list (`/h/:slug/patients/admitted`) — query key `['patients', hospitalId, { admissionStatus: 'admitted' }]`
- Discharged patients list

The `['visits', hospitalId]` invalidation covers the check-in queue board.

### Test Cases

| # | Scenario | Expected |
|---|---|---|
| 11 | Check in a patient → navigate to Admitted list | Patient now appears in admitted list without page refresh |
| 12 | Check in a patient → navigate to Queue board | Patient appears in the live queue |
| 13 | Discharge a patient → navigate to Admitted list | Patient no longer appears |
| 14 | Checkout a patient → navigate to Queue board | Patient removed from queue |
| 15 | Admit from outpatient → navigate to Admitted patients screen | Patient is listed |

---

## Feature 4 — Entity ID Autolinking

### Overview

A new shared component `EntityLink` wraps any entity ID and turns it into a clickable link. Every ID shown in the app now navigates to that entity's detail page on click. A `title` tooltip ("Go to Patient", "Go to Staff member", etc.) appears on hover.

**New component:** `apps/medcord-web/src/shared/components/entity-link.tsx`

Props:
- `id: string` — the ID to display
- `to: string` — route to navigate to
- `label: string` — tooltip text (e.g. "Patient", "Staff member")
- `mono?: boolean` — renders in `font-mono` by default

### Autolinking locations

| Location | ID | Links to |
|---|---|---|
| Transfers → Incoming card | `patientId` | Patient profile |
| Transfers → Outgoing card | `patientId` | Patient profile |
| Lab order detail | `patientId` | Patient profile |
| Lab order detail | `orderedBy` (staff ID) | Staff profile |
| Lab order detail | `sampleCollectedBy` (staff ID) | Staff profile |
| Lab results queue | `patientId` (table cell) | Patient profile |
| Review queue list | `patientId` | Patient profile |
| Review queue list | `submittedBy` (staff ID) | Staff profile |
| Review item detail | `patientId` | Patient profile |
| Review item detail | `referenceId` | Prefix-routed (see below) |
| Review item detail | `submittedBy` (staff ID) | Staff profile |
| Audit log | `resourceId` | Prefix-routed (see below) |
| Audit log | `actorId` (staff ID) | Staff profile |

### Prefix routing for referenceId / resourceId

When an ID could belong to multiple entity types, the ID prefix determines the destination:

| Prefix | Routes to |
|---|---|
| `LAB-` | Lab order detail |
| `AST-` | Asset detail |
| `STF-` / `MBR-` | Staff profile (audit log `resourceId` only) |
| anything else | Patient profile |

### Other changes

- **Transfer card (incoming)**: replaced `CopyToClipboard` with `EntityLink` — link is more useful than copy here
- **Staff profile — Member ID / User ID**: now shows the full ID instead of the first 8 chars truncated
- **Audit log**: `SettingsAuditLog` now accepts a `slug` prop (required) — passed from `HospitalSettingsScreen`

### Test Cases

| # | Scenario | Expected |
|---|---|---|
| 16 | Hover over any entity ID | `title` tooltip shows ("Go to Patient", "Go to Staff member", etc.) |
| 17 | Click patient ID on incoming transfer card | Navigates to patient profile |
| 18 | Click patient ID on outgoing transfer card | Navigates to patient profile |
| 19 | Click patient ID on lab order detail | Navigates to patient profile |
| 20 | Click `orderedBy` on lab order detail | Navigates to staff profile |
| 21 | Click `sampleCollectedBy` on lab order detail | Navigates to staff profile |
| 22 | Click patient ID in lab results queue table | Navigates to patient profile |
| 23 | Click patient ID in review queue table | Navigates to patient profile |
| 24 | Click `submittedBy` in review queue table | Navigates to staff profile |
| 25 | Click patient ID in review item detail | Navigates to patient profile |
| 26 | Click referenceId starting with `LAB-` | Navigates to lab order detail |
| 27 | Click referenceId starting with `AST-` | Navigates to asset detail |
| 28 | Click referenceId (patient ID, no prefix) | Navigates to patient profile |
| 29 | Click `submittedBy` in review item detail | Navigates to staff profile |
| 30 | Click `resourceId` in audit log | Routes by prefix — patient, lab, or asset detail |
| 31 | Click `actorId` in audit log | Navigates to staff profile |
| 32 | Staff profile Account Info section | Member ID and User ID now show in full (no truncation) |

---

## Files Changed

| File | Change |
|---|---|
| `apps/medcord-web/src/shared/components/entity-link.tsx` | **New** — shared EntityLink component |
| `apps/medcord-web/src/features/patients/features/patient-profile/screen/parts/profile-actions.tsx` | CheckinForm dept → units dropdown; AdmitForm dept → units + assignedTo → staff picker |
| `apps/medcord-web/src/features/patients/features/patient-profile/api/use-patient.ts` | Added query invalidations to useCheckin, useCheckout, useAdmit, useDischarge |
| `apps/medcord-web/src/features/patients/features/patient-transfers/screen/parts/transfer-card.tsx` | patientId → EntityLink (replaced CopyToClipboard) |
| `apps/medcord-web/src/features/patients/features/patient-transfers/screen/parts/outgoing-transfer-card.tsx` | patientId → EntityLink |
| `apps/medcord-web/src/features/labs/features/lab-orders/screen/lab-order-detail-screen.tsx` | patientId + orderedBy + sampleCollectedBy → EntityLink |
| `apps/medcord-web/src/features/labs/features/lab-results/screen/lab-result-queue-screen.tsx` | patientId → EntityLink |
| `apps/medcord-web/src/features/review-queue/screen/review-queue-screen.tsx` | patientId + submittedBy → EntityLink |
| `apps/medcord-web/src/features/review-queue/screen/review-item-screen.tsx` | patientId + referenceId + submittedBy → EntityLink; added `referenceIdRoute` helper |
| `apps/medcord-web/src/features/staff/features/staff-profile/screen/parts/profile-meta.tsx` | Member ID + User ID show full value, not truncated |
| `apps/medcord-web/src/features/workspace/features/hospital-settings/screen/parts/settings-audit-log.tsx` | Added `slug` prop; resourceId + actorId → EntityLink; added `auditResourceRoute` helper |
| `apps/medcord-web/src/features/workspace/features/hospital-settings/screen/hospital-settings-screen.tsx` | Passes `slug` to SettingsAuditLog |
