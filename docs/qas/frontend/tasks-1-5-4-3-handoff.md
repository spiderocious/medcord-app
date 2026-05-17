# Frontend QA Handoff — Dynamic Dashboard, Outbound Transfers, Hospital Units

## Overview

Three frontend features shipped:
1. **Task 1.5** — Dashboard is now permission-aware: stats and nav cards shown based on what the user can access
2. **Task 3** — Transfers screen now has Incoming/Outgoing tabs; TransferForm now has records package toggles
3. **Task 4** — Units & Departments settings tab + invite form now uses dropdowns from the configured units

All changes live under `apps/medcord-web/src/features/`.

---

## Task 1.5 — Dynamic Dashboard

**Route:** `/h/:slug/dashboard`  
**File:** `apps/medcord-web/src/features/workspace/features/hospital-dashboard/screen/hospital-dashboard-screen.tsx`

### Stat Cards (Overview section)

Each stat card is conditionally rendered based on the user's permissions:

| Stat card | Condition |
|---|---|
| Staff members | `STAFF_VIEW` |
| Admitted | `PATIENT_VIEW` + `emr` module enabled |
| Checked in | `PATIENT_VIEW` + `emr` module enabled |
| Labs pending | `LAB_VIEW` + `labs` module enabled |
| Plan + Timezone (fallback) | None of the above conditions met |

All counts come from `GET /hospitals/:hospitalId/usage`. Counts show `—` while loading.

### Quick Access cards (navigation section)

Each card only appears if the user has the relevant permission AND the module is enabled (where applicable):

| Card | Permission | Module check |
|---|---|---|
| Staff | `STAFF_VIEW` | — |
| Patients | `PATIENT_VIEW` | — |
| Admitted patients | `PATIENT_VIEW` | `emr` |
| Queue board | `PATIENT_VIEW` | `emr` |
| Transfers | `PATIENT_TRANSFER` | — |
| Labs | `LAB_VIEW` | `labs` |
| Assets | `ASSET_VIEW` | `assets` |
| Review Queue | `REVIEW_VIEW` | — |
| Settings | `SETTINGS_VIEW` | — |

**EMR card removed:** The old EMR nav card that linked to the Patients list has been removed. EMR is accessible from patient charts, not as a standalone module nav item.

### Fallback state

If the user has none of the above permissions, a simple "Contact your administrator" message is shown with a "Back to hospitals" button.

### Test Cases

| # | Scenario | Expected |
|---|---|---|
| 1 | Super admin logs in | All stat cards and all nav cards visible |
| 2 | Lab tech logs in | Only "Labs pending" stat; only Labs nav card |
| 3 | Reception logs in | No stats; Patients + Transfers nav cards visible |
| 4 | Nurse logs in | Admitted + Checked in stats; Patients + Admitted + Queue + Labs nav cards |
| 5 | Doctor logs in | All patient + lab stats; full patient/labs/review nav |
| 6 | Hospital with `emr` module disabled | Admitted and Checked In stats hidden; Admitted patients and Queue board nav hidden |
| 7 | Hospital with `labs` module disabled | Labs pending stat hidden; Labs nav card hidden |
| 8 | Counts load while page renders | `—` shown until usage data arrives |
| 9 | Old "EMR" nav card | Not present (removed) |
| 10 | User with no meaningful permissions | Sees fallback message + "Back to hospitals" button |

---

## Task 3 — Outgoing Transfers Screen + Records Package Toggles

### Transfers Screen

**Route:** `/h/:slug/patients/transfers`  
**File:** `apps/medcord-web/src/features/patients/features/patient-transfers/screen/transfers-screen.tsx`

Screen now has two tabs: **Incoming** and **Outgoing**.

| Tab | Data source | Content |
|---|---|---|
| Incoming | `GET /transfers/incoming` | Pending transfers TO this hospital; Accept + Decline actions |
| Outgoing | `GET /transfers/outgoing` | All transfers FROM this hospital; status badge (Pending/Accepted/Declined); read-only |

### OutgoingTransferCard

**File:** `apps/medcord-web/src/features/patients/features/patient-transfers/screen/parts/outgoing-transfer-card.tsx`

Shows:
- Patient ID (text only, no copy button needed — receiving hospital acts on it)
- Destination hospital ID
- Status badge: Pending (amber), Accepted (green), Declined (red)
- Date sent
- Reason
- Department (if present)
- Records included pills (same style as incoming card)
- Response date (if responded)

No actions — this hospital initiated the transfer; they can only observe status.

### TransferForm — Records Package Toggles

**File:** `apps/medcord-web/src/features/patients/features/patient-profile/screen/parts/profile-actions.tsx`

The Transfer modal now includes record type toggle buttons:

| Toggle | Default |
|---|---|
| Vitals | On |
| Medications | On |
| History | On |
| Labs | On |
| Documents | Off |

Toggle buttons visually indicate active state (forest background = included, white = excluded). The full `recordsPackage` object is sent in the transfer request body.

### Test Cases

| # | Scenario | Expected |
|---|---|---|
| 11 | Navigate to Transfers screen | Incoming tab active by default |
| 12 | Click Outgoing tab | Outgoing transfers list loads |
| 13 | Outgoing tab — no transfers sent | Empty state shown |
| 14 | Outgoing tab — pending transfer | Amber "Pending" badge |
| 15 | Outgoing tab — accepted transfer | Green "Accepted" badge |
| 16 | Outgoing tab — declined transfer | Red "Declined" badge |
| 17 | Outgoing card shows records included | Pills match what was selected at transfer time |
| 18 | Outgoing card has no Accept/Decline buttons | Confirmed absent |
| 19 | Click "Transfer" on patient profile | Modal opens with Destination ID, Reason, and 5 record toggles |
| 20 | Toggle "Vitals" off | Button turns white; Vitals will be excluded from request |
| 21 | Toggle "Documents" on | Button turns forest; Documents included in request |
| 22 | Submit transfer | `recordsPackage` in request body reflects toggle state |
| 23 | Submit with empty Destination ID or Reason | Button does nothing (disabled by guard) |

---

## Task 4 — Hospital Units Management + Invite Form Dropdowns

### Settings — Units & Departments Tab

**Route:** `/h/:slug/settings` → "Units & Depts" tab (only visible to users with `UNITS_MANAGE`)  
**File:** `apps/medcord-web/src/features/workspace/features/hospital-settings/screen/parts/settings-units.tsx`

#### Tab visibility
The "Units & Depts" tab is only rendered in the settings tab bar if the user `can(PERMISSIONS.UNITS_MANAGE)`. It is absent entirely for all other roles.

#### Features
- List all units (active and inactive) sorted by type then name
- Type badge: `Department`, `Unit`, or `Ward`
- Inactive badge shown on deactivated units
- Parent unit name shown if unit has a `parentId`
- **Add unit** button → inline create form
- Each row: **Edit**, **Deactivate/Activate**, **Delete** buttons

#### Create form fields
| Field | Type | Required |
|---|---|---|
| Name | text | yes |
| Type | select (department/unit/ward) | yes |
| Parent department | select (active departments only) | no |

Parent select only shown when at least one department exists.

#### Edit form
Same fields, pre-populated. Editing inline replaces the row.

#### Deactivate/Activate
Confirmation modal before toggling. Deactivated units will not appear in invite form dropdowns.

#### Delete
Confirmation modal. Shows note that units with active sub-units cannot be deleted.

### Invite Form — Dropdowns

**File:** `apps/medcord-web/src/features/staff/features/staff-invite/screen/parts/invite-form.tsx`

When the hospital has configured units:
- Department field becomes a `<select>` populated with active `type=department` units
- Unit field becomes a `<select>` populated with active `type=unit` and `type=ward` units
- First option in each: `— none —`

Fallback: if no units are configured (new hospital, or all deactivated), both fields revert to freetext inputs.

### Test Cases

| # | Scenario | Expected |
|---|---|---|
| 24 | Hospital admin opens Settings | "Units & Depts" tab visible |
| 25 | Non-admin opens Settings | "Units & Depts" tab absent |
| 26 | Click "Add unit" | Create form appears below header |
| 27 | Submit create with name + type | Unit appears in list |
| 28 | Submit create with duplicate name | Error toast shown |
| 29 | Create sub-unit with parent | Parent name shown on unit row |
| 30 | Click Edit on a unit | Row switches to edit form |
| 31 | Click Deactivate | Confirmation modal → unit shows "Inactive" badge |
| 32 | Deactivated unit in list | Still visible but labelled Inactive |
| 33 | Deactivated unit in invite form dropdowns | Not present |
| 34 | Click Delete on unit with no children | Confirmation → unit removed from list |
| 35 | Click Delete on unit with active children | Confirmation → `409` error toast shown |
| 36 | Open invite form — hospital has departments | Department field is a select dropdown |
| 37 | Open invite form — hospital has units/wards | Unit field is a select dropdown |
| 38 | Open invite form — no units configured | Both fields are freetext inputs |
| 39 | Submit invite with department selected from dropdown | Department name sent in payload |

---

## Files Changed

| File | Change |
|---|---|
| `packages/api/src/endpoints.ts` | Added `HOSPITAL_UNITS`, `HOSPITAL_UNIT`, `HOSPITAL_TRANSFERS_OUTGOING` |
| `apps/medcord-web/src/shared/types/hospital.ts` | Added `HospitalUnit`, `HospitalUnitType` |
| `apps/medcord-web/src/shared/constants/routes.ts` | Added `HOSPITAL_TRANSFERS_OUTGOING` |
| `apps/medcord-web/src/features/workspace/features/hospital-dashboard/api/use-hospital-usage.ts` | Extended `HospitalUsage` type with new fields |
| `apps/medcord-web/src/features/workspace/features/hospital-dashboard/screen/hospital-dashboard-screen.tsx` | Full rewrite — permission-aware widgets |
| `apps/medcord-web/src/features/workspace/features/hospital-settings/api/use-hospital-units.ts` | New — `useHospitalUnits`, `useCreateUnit`, `useUpdateUnit`, `useDeleteUnit` |
| `apps/medcord-web/src/features/workspace/features/hospital-settings/screen/parts/settings-units.tsx` | New — units management tab panel |
| `apps/medcord-web/src/features/workspace/features/hospital-settings/screen/hospital-settings-screen.tsx` | Added Units tab (gated on `UNITS_MANAGE`) |
| `apps/medcord-web/src/features/patients/features/patient-transfers/api/use-patient-transfers.ts` | Added `useOutgoingTransfers` |
| `apps/medcord-web/src/features/patients/features/patient-transfers/screen/transfers-screen.tsx` | Rewritten with Incoming/Outgoing tabs |
| `apps/medcord-web/src/features/patients/features/patient-transfers/screen/parts/outgoing-transfer-card.tsx` | New |
| `apps/medcord-web/src/features/patients/features/patient-profile/screen/parts/profile-actions.tsx` | TransferForm now exposes record package toggles |
| `apps/medcord-web/src/features/staff/features/staff-invite/screen/parts/invite-form.tsx` | Department + unit fields use dropdowns when units configured |
