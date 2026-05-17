# Frontend Test Plan — Patient History Panel

**Handoff source**: `docs/qas/frontend/patient-history-handoff.md`  
**Prepared**: 2026-05-17  
**App URL**: http://localhost:5175  
**Backend URL**: http://localhost:8085

---

## Test actors

| Handle | Role | Password |
|--------|------|----------|
| alice | hospital_owner | Medcord123! |
| carol | doctor | Medcord123! |

---

## Fixed patient IDs (from .state.json)

| Patient | ID | PatientCode |
|---------|----|-------------|
| John Doe (PAT1) | `PAT-4b2fe9c6-04c8-4c5c-9703-13b01bfcfae7` | resolved from profile |
| Jane Smith (PAT2) | `PAT-d82c25ea-46b2-46f2-a56c-960df6b98348` | resolved from profile |
| John Marcus (PAT3) | `PAT-f11a9748-2cb3-43de-a509-f4bce6d2d67f` | resolved from profile |

---

## Prerequisites / Setup

1. Ensure backend is running at http://localhost:8085
2. Ensure frontend is running at http://localhost:5175
3. Run `node docs/qas/backend/scripts/restore-seed.mjs` to get a clean baseline
4. Log in as alice at `/auth/login`
5. Navigate to `/h/hospital-a/patients` to verify patient list loads

---

## Section 1: Admission History panel — happy path

### F1 — Panel visible for patient with prior admissions
- **Setup**: Admit + discharge PAT1 (John Doe) at least once via profile Actions panel
- **Steps**: Navigate to PAT1's profile screen
- **Expected**: 
  - "Admission history" card visible below demographics
  - At least one row showing admitted date + discharged date + duration badge (e.g. "2d" or "Xh")
  - Department shown if set

### F2 — Active (open) admission row shows "Active" label
- **Setup**: Admit PAT2 (Jane Smith) without discharging
- **Steps**: Navigate to PAT2's profile screen
- **Expected**:
  - Admission history shows one row with admitted date
  - Duration badge shows "Ongoing"
  - Amber "Active" label visible below duration badge
  - No discharged date shown

### F3 — Assigned staff renders as clickable EntityLink
- **Setup**: Admit PAT1 with `assignedTo` set to carol's member ID (done via API or via the Admit form's "Assigned to" dropdown)
- **Steps**: Navigate to PAT1's profile → Admission history
- **Expected**:
  - "Assigned:" text visible in admission row
  - Staff ID renders as a clickable `EntityLink` (shows ID with link styling)
  - Clicking navigates to `/h/hospital-a/staff/:staffId`

### F4 — Discharge notes visible in row
- **Setup**: Discharge PAT1 via Actions (drawer service modal) or API with notes set
- **Steps**: Navigate to PAT1's profile
- **Expected**: Discharge notes text visible in grey below department line, truncated if long

### F5 — Multiple admissions listed newest first
- **Setup**: PAT1 should have ≥ 2 complete admit/discharge cycles
- **Steps**: Navigate to PAT1's profile
- **Expected**: All admission rows visible; newest `admittedAt` at top

### F6 — Duration badge: < 1 hour
- **Requires**: Backend admission where discharged < 1 hour after admitted (create via API directly)
- **Steps**: View the row for that admission
- **Expected**: Duration badge shows "< 1 hour"

### F7 — Duration badge: hours
- **Requires**: Admission where stay is between 1 and 23 hours (created via API with manipulated dates)
- **Expected**: Badge shows e.g. "6h"

### F8 — Duration badge: days
- **Requires**: Admission where stay is ≥ 24 hours
- **Expected**: Badge shows e.g. "3d"

---

## Section 2: Admission history — empty state

### F9 — "No admissions recorded." for patient with no history
- **Setup**: Use PAT3 (John Marcus) — ensure they have never been admitted (or restore seed to reset)
- **Steps**: Navigate to PAT3's profile
- **Expected**: Admission history card visible; inside: "No admissions recorded." in grey text; no rows

---

## Section 3: Admission history — loading / error states

### F10 — Loading state shows "Loading…" text
- **Method**: Code review of `profile-history.tsx:103-105` — `Loadable` loading component renders `<p>Loading…</p>`
- **Expected**: `loadingComponent` is `<p className="text-sm text-charcoal-700/50 py-2">Loading…</p>`

### F11 — Error state shows "Failed to load admissions."
- **Method**: Code review of `profile-history.tsx:106-108` — error component
- **Expected**: `errorComponent` is `<p className="text-sm text-red-600 py-2">Failed to load admissions.</p>`

---

## Section 4: Admission history — live cache invalidation

### F12 — Admit → history updates without page reload
- **Setup**: Navigate to PAT3's profile (no admissions)
- **Steps**: 
  1. Confirm "No admissions recorded." visible
  2. Click "Admit" in Actions panel
  3. Fill department + click Admit
  4. Wait for success toast
- **Expected**: Without reloading page, Admission history card refreshes and shows the new open admission row with "Active" label

### F13 — Discharge → history row closes without reload
- **Setup**: PAT3 is currently admitted (from F12)
- **Steps**:
  1. Click "Discharge" in Actions panel
  2. Confirm in the modal
  3. Wait for success toast
- **Expected**: Without reloading, open admission row gains `dischargedAt` date and duration badge; "Active" label disappears

---

## Section 5: Check-in History panel — happy path

### F14 — Panel visible for patient with prior check-ins
- **Setup**: Check in + check out PAT2 at least once
- **Steps**: Navigate to PAT2's profile
- **Expected**:
  - "Check-in history" card visible
  - Rows show date, queue number (Queue #N), duration badge

### F15 — Active check-in row shows "Active" label
- **Setup**: Check in PAT2 (do not check out)
- **Steps**: Navigate to PAT2's profile
- **Expected**:
  - Row shows checked-in date, no checked-out date
  - Duration badge shows "Ongoing"
  - Amber "Active" label visible

### F16 — Completed check-in shows both dates + duration
- **Setup**: Check in + check out PAT2
- **Steps**: Navigate to PAT2's profile
- **Expected**: Row shows `checkedInDate → checkedOutDate` + duration badge (not "Ongoing")

### F17 — Department shown in check-in row
- **Setup**: Check in PAT2 with a department selected (e.g. "Cardiology")
- **Expected**: Department text visible below the queue number line in the row

### F18 — Multiple check-in rows listed newest first
- **Setup**: PAT2 has ≥ 2 completed check-ins
- **Steps**: Navigate to PAT2's profile
- **Expected**: All rows visible; newest `checkedInAt` at top

---

## Section 6: Check-in History panel — empty state

### F19 — "No check-ins recorded." for patient with no visits
- **Setup**: PAT1 is admitted (not checked in); or use a fresh patient with no check-ins
- **Steps**: Navigate to PAT1's profile
- **Expected**: Check-in history card shows "No check-ins recorded."

---

## Section 7: Check-in History — live cache invalidation

### F20 — Check-in → check-in history updates without reload
- **Setup**: Navigate to PAT3's profile; PAT3 is discharged (from F13), re-admit is not needed — reset to outpatient or use PAT2
- **Steps**:
  1. Ensure "No check-ins recorded." or verify existing list
  2. Click "Check in" in Actions panel
  3. Fill department, click Check in
  4. Wait for toast
- **Expected**: Without reload, Check-in history card shows new active visit row

### F21 — Checkout → visit row updates without reload
- **Setup**: Patient has an active check-in (from F20)
- **Steps**:
  1. Click "Check out" in Actions panel
  2. Confirm in modal
  3. Wait for toast
- **Expected**: Open visit row gains `checkedOutAt` date and duration badge; "Active" label disappears

---

## Section 8: EntityLink in admission rows

### F22 — Hover over staff link shows tooltip
- **Steps**: On an admission row with `assignedTo` set, hover over the staff EntityLink
- **Expected**: Tooltip shows "Go to Staff member" (or similar EntityLink tooltip text)

### F23 — Click staff link navigates to staff profile
- **Steps**: Click the staff EntityLink in an admission row
- **Expected**: URL changes to `/h/hospital-a/staff/:staffId`; staff profile page loads

### F24 — Admission with no assignedTo has no link
- **Setup**: Admit a patient without setting assignedTo
- **Steps**: View the admission row
- **Expected**: No "Assigned:" line in the row; EntityLink absent

---

## Section 9: Responsive layout

### F25 — Mobile viewport: panels stack full-width
- **Steps**: Set browser viewport to < lg (< 1024px); navigate to patient profile
- **Expected**: Both history panels (admission + check-in) stack full-width below demographics; no horizontal overflow

### F26 — Desktop viewport: panels in left column
- **Steps**: Set viewport to ≥ lg (≥ 1024px)
- **Expected**: Both history panels remain in the `lg:col-span-2` left column alongside demographics cards

---

## Section 10: Regression checks

### F27 — Demographics card still renders
- **Steps**: Open any patient profile
- **Expected**: Patient name, DOB, sex, phone, address card still visible above the history panels

### F28 — Emergency contact card still shows
- **Steps**: Open a patient with emergency contact data
- **Expected**: Emergency contact card still visible

### F29 — Guarantor card still shows
- **Steps**: Open a patient with guarantor data
- **Expected**: Guarantor card still visible

### F30 — ProfileActions sidebar unaffected
- **Steps**: Open an admitted patient; open an outpatient
- **Expected**: Correct action buttons shown for each status (Check out/Discharge/Transfer for admitted; Check in/Admit for outpatient)

### F31 — ID Card panel still renders in right column
- **Steps**: Open any patient profile
- **Expected**: ID Card panel visible in right column (`lg:col-span-1`)

### F32 — "View chart" button navigates to EMR
- **Steps**: Click "View chart" / "Chart" button on patient profile
- **Expected**: Navigates to `/h/hospital-a/patients/:patientId/chart`; EMR chart loads

---

## Implementation notes for browser execution

- Profile screen URL pattern: `/h/hospital-a/patients/:patientId`
- History panels are in `profile-history.tsx`; look for the card heading "ADMISSION HISTORY" and "CHECK-IN HISTORY" (uppercase via CSS `tracking-wider`)
- Duration is computed in `durationLabel()` function in `profile-history.tsx:13-21`
- `EntityLink` component renders the staff ID as a link; ref in snapshot will be a `link` type
- Cache invalidation is wired via `queryClient.invalidateQueries` in `use-patient.ts` mutations
- Meemaw `<Repeat>` is used for both admission rows and check-in rows — no raw `.map()` violations expected
