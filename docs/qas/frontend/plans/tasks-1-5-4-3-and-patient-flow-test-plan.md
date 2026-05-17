# Frontend QA Test Plan — Patient Flow + Tasks 1.5 / 3 / 4

**Prepared:** 2026-05-17  
**Tester:** QA Agent  
**Handoffs:**
- `docs/qas/frontend/patient-flow-handoff.md`
- `docs/qas/frontend/tasks-1-5-4-3-handoff.md`

**Login:** alice@medcord.test / Medcord123! (super_admin — all permissions + all modules)  
**Base URL:** `http://localhost:5175`  
**Hospital slug:** `hospital-a`  
**Screenshots →** `docs/qas/frontend/screenshots/patient-flow-tasks/`  
**Backend seed required:** `node docs/qas/backend/scripts/restore-seed.mjs` before session (safe to re-run; never wipes existing data)

---

## Source Audit Findings (Code-Flow Review)

Violations found during source review — verify at runtime:

| ID | File | Violation | Severity |
|----|------|-----------|----------|
| CC-01 | `outgoing-transfer-card.tsx:78` | Raw `pills.map()` in JSX render — should use `<Repeat>` | P3 |
| CC-02 | `checkedin-patients-screen.tsx:114` | `<Show when={visit.patient !== null}>` followed by `<Show when={visit.patient === null}>` — raw boolean pattern, not `<Switch><Case>` | P3 |
| CC-03 | `profile-actions.tsx` (TransferForm, CheckinForm, AdmitForm) | `DrawerService.dismissAllModals()` called in `onConfirm` (before mutation resolves) — if the API call fails, modal is already gone and error is invisible (GAP-EMR-05 pattern) | P2 |
| CC-04 | `admitted-patients-screen.tsx` | Table columns (Patient, Code, DOB, Contact) do NOT match the handoff spec (which says: Patient Name, Code, Department, Assigned Doctor, Date Admitted) — column mismatch | P2 |

---

## Pre-flight Checks

Run these before opening the browser:

| # | Check | Command | Pass condition |
|---|-------|---------|---------------|
| PF-01 | Backend running | `curl http://localhost:8085/api/v1/health` | `200` |
| PF-02 | Frontend running | `curl http://localhost:5175 \| head -3` | HTML response, no connection error |
| PF-03 | Seed done | `.state.json` exists and is recent | File present, `patients` array has 3 IDs |
| PF-04 | Login works | Open app, log in as alice | Lands on hospital list or dashboard |
| PF-05 | Check in a patient via API | `POST /hospitals/:id/patients/:id/checkin` as carol | Visit created — needed for queue board tests |

---

## Section 1 — Dynamic Dashboard (Task 1.5)

**Route:** `/h/hospital-a/dashboard`  
**File:** `hospital-dashboard-screen.tsx`

### 1A — Stat Cards

| ID | Test | Login as | Expected | How to verify |
|----|------|----------|----------|---------------|
| DB-01 | Super admin sees all 4 stat cards | alice | Staff members, Admitted, Checked in, Labs pending cards all visible | `agent-browser eval "document.body.innerText"` — all 4 labels present |
| DB-02 | Counts show "—" while loading | alice | Dashes visible before usage data arrives | Screenshot immediately on navigate |
| DB-03 | Counts resolve to numbers after load | alice | All 4 stat cards show numeric values | Wait for networkidle; verify no "—" remains |
| DB-04 | Lab tech sees only "Labs pending" stat | frank | Only labs stat visible; no Staff/Admitted/Checked-in | Login as frank; inspect body text |
| DB-05 | Reception sees no stat cards | eve | Neither patient nor lab stats — fallback Plan + Timezone shown | Login as eve; confirm fallback stats |
| DB-06 | Fallback stat cards (Plan + Timezone) shown when user has no view permissions | eve | "Plan" and "Timezone" cards visible | Confirm values match hospital config |
| DB-07 | `patientsAdmitted` count reflects admitted patients | alice | After admitting a patient via API, count increments | Admit patient → reload dashboard → verify count |
| DB-08 | `patientsCheckedIn` count reflects active visits | alice | After checking in a patient via API, count increments | Check in → reload → verify |

### 1B — Quick Access Nav Cards

| ID | Test | Login as | Expected | How to verify |
|----|------|----------|----------|---------------|
| DB-09 | Super admin sees all 9 nav cards | alice | Staff, Patients, Admitted patients, Queue board, Transfers, Labs, Assets, Review Queue, Settings | Count cards in body text |
| DB-10 | Lab tech sees only Labs nav card | frank | Only Labs nav card visible | Login as frank; inspect nav cards |
| DB-11 | Reception sees Patients + Transfers | eve | Those two cards present; no Labs, no Staff | Confirm |
| DB-12 | Nurse sees Patients, Admitted, Queue, Labs | dave | Four cards visible | Confirm |
| DB-13 | "EMR" nav card is absent | alice | No nav card labelled "EMR" | Confirm `document.body.innerText` does not contain standalone "EMR" nav |
| DB-14 | Transfers nav card links to transfers screen | alice | Clicking navigates to `/h/hospital-a/patients/transfers` | Click; `agent-browser get url` |
| DB-15 | Hospital with `emr` module disabled → Admitted + Queue hidden | alice | When emr=false, those two cards absent — **Note: requires module toggle via settings or DB** | Document via settings; confirm absence |
| DB-16 | Fallback CTA: user with no meaningful permissions | Create a user with no permissions | "Contact your administrator" + "Back to hospitals" button visible | Confirm text present |

---

## Section 2 — Admitted Patients Screen (Patient Flow)

**Route:** `/h/hospital-a/patients/admitted`  
**File:** `admitted-patients-screen.tsx`

**Source audit note (CC-04):** Actual table columns are: Patient, Code, Date of birth, Contact, (Chart action) — NOT Department/Assigned Doctor as described in the handoff. Test against what the code renders.

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| AP-01 | Page loads without error | No `<p role="alert">` visible | Navigate; confirm |
| AP-02 | Heading "Admitted Patients" visible | Exact heading text | `agent-browser eval "document.body.innerText"` |
| AP-03 | Empty state: "No patients currently admitted." | Exact text; centered with stethoscope icon | Load with no admitted patients |
| AP-04 | With admitted patients: table renders | Rows visible with patient data | Admit a patient via API first |
| AP-05 | Table columns: Patient, Code, Date of birth, Contact | Column headers match source code | Inspect `<th>` elements |
| AP-06 | Clicking a row navigates to patient profile | URL: `/h/hospital-a/patients/:code` | Click first row; confirm URL |
| AP-07 | Loading state shown while fetching | Spinner visible before data arrives | Screenshot immediately on navigate |
| AP-08 | Error state on API failure | `<p role="alert">Failed to load admitted patients.</p>` | Mock network failure; confirm |
| AP-09 | "Chart" action button visible for user with `PATIENT_ADMIT` | Button in row | Confirm for alice (super_admin) |
| AP-10 | "Chart" button absent for user without `PATIENT_ADMIT` | Button column absent | Login as frank; confirm no Chart button |
| AP-11 | "Chart" button navigates to chart | URL: `/h/hospital-a/patients/:code/chart` | Click; confirm URL |
| AP-12 | Only admitted patients shown (no outpatient/discharged) | All rows have admitted status | Verify by checking `admissionStatus` on each via API |

---

## Section 3 — Checked-In Patients Screen (Patient Flow)

**Route:** `/h/hospital-a/patients/checked-in`  
**File:** `checkedin-patients-screen.tsx`

**Precondition:** At least one patient checked in via API (`POST /visits` via checkin endpoint)

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| CI-01 | Page loads without error | No `<p role="alert">` | Navigate; confirm |
| CI-02 | Heading "Checked-In Patients" visible | Exact heading | Body text |
| CI-03 | Sub-heading shows active visit count | "N active visit(s)" | Confirm after seed visit exists |
| CI-04 | Empty state: "No active check-ins right now." | Exact text with icon | Load before any check-in |
| CI-05 | Table columns: #, Patient, Stage, Dept, Checked in, (Remove) | All 6 headers present | Inspect `<th>` elements |
| CI-06 | Queue number column shows `#N` format | Prefix `#` + integer | Confirm on a row |
| CI-07 | Stage badge: `waiting_nurse` → "Waiting · Nurse" | Exact label | Check-in without nurse assignment → stage = `waiting_doctor`; check-in with nurse → `waiting_nurse` |
| CI-08 | Stage badge: `with_nurse` → "With nurse" | Exact label | Advance via API; reload |
| CI-09 | Stage badge: `waiting_doctor` → "Waiting · Doctor" | Exact label | Confirm default check-in badge |
| CI-10 | Stage badge: `with_doctor` → "With doctor" | Exact label | Advance fully via API; reload |
| CI-11 | Department column: absent dept shows "—" | "—" placeholder | Check-in without department |
| CI-12 | Patient name links to patient profile | Click name navigates to `/h/hospital-a/patients/:code` | Click; confirm URL |
| CI-13 | Remove button visible for `PATIENT_ADMIT` users | Button on each row | Confirm for alice |
| CI-14 | Remove button absent for non-`PATIENT_ADMIT` users | Button absent | Login as frank; confirm |
| CI-15 | Click Remove → confirmation modal opens | `document.body.childElementCount === 3`; modal text contains "Remove from queue" | Click Remove; verify |
| CI-16 | Cancel removal closes modal | `document.body.childElementCount === 2`; visit still in list | Click Cancel |
| CI-17 | Confirm removal fires checkout, visit disappears | API call made; row gone on next poll | Confirm; wait; verify |
| CI-18 | "Queue board" button navigates to queue | URL: `/h/hospital-a/queue` | Click; confirm URL |
| CI-19 | Loading state visible on initial load | Spinner visible | Screenshot on navigate |
| CI-20 | Error state on API failure | `<p role="alert">Failed to load visits.</p>` | Mock API failure; confirm |

---

## Section 4 — Queue Board Screen (Patient Flow)

**Route:** `/h/hospital-a/queue`  
**File:** `queue-board-screen.tsx`

**Precondition:** Multiple visits in different stages (seed via API before this section)

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| QB-01 | Page loads without error | No `<p role="alert">` | Navigate; confirm |
| QB-02 | Heading "Queue Board" visible | Exact heading | Body text |
| QB-03 | Empty state: "Queue is empty." | Exact text with icon | Load before any check-ins |
| QB-04 | "Now serving" banner visible when `with_nurse` or `with_doctor` exists | Banner with "Now serving" text visible | Advance a visit to `with_nurse` via API; reload |
| QB-05 | "Now serving" banner absent when no active visits | Banner absent when all visits in `waiting_*` stages | Confirm |
| QB-06 | "Now serving" banner shows patient name and queue number | `#N` and abbreviated name (first + last initial) | Inspect banner content |
| QB-07 | Column 1 "Waiting · Nurse" contains `waiting_nurse` visits | `waiting_nurse` visits appear in col 1 | Seed a visit in this stage; confirm |
| QB-08 | Column 1 also contains `with_nurse` visits (active styling) | `with_nurse` visits in col 1 with `border-forest-900/40` highlight | Advance to `with_nurse`; reload |
| QB-09 | Column 2 "Waiting · Doctor" contains `waiting_doctor` visits | Verify | Seed or advance to this stage |
| QB-10 | Column 3 "With Doctor" contains `with_doctor` visits (active styling) | Verify | Advance to `with_doctor`; confirm |
| QB-11 | VisitCard shows `#queueNumber` in large bold | Format: `#N` | Inspect card |
| QB-12 | VisitCard shows abbreviated patient name | Format: "John D." (first + last[0] + ".") | Confirm format |
| QB-13 | VisitCard shows department when present | Department text shown | Check-in with department |
| QB-14 | VisitCard shows "In since HH:MM" | Formatted check-in time | Confirm format |
| QB-15 | "Call / Next" button present on `waiting_nurse` card | Button visible | Confirm for alice |
| QB-16 | "Call / Next" absent on `with_doctor` card | Button NOT rendered (no next stage) | Advance to `with_doctor`; confirm |
| QB-17 | Click "Call / Next" on `waiting_nurse` → moves to `with_nurse` | PATCH fires; card moves to col 1 active | Click; wait networkidle; verify |
| QB-18 | "Remove" button present on all cards (for `PATIENT_ADMIT` users) | Button on every card | Confirm for alice |
| QB-19 | Click "Remove" → destructive confirmation modal | `document.body.childElementCount === 3`; confirm button has destructive style | Click; screenshot |
| QB-20 | Confirm remove → visit removed from board | Card disappears after confirm | Confirm; verify |
| QB-21 | Cancel remove → visit stays | Card still present | Click Cancel; verify |
| QB-22 | User without `PATIENT_ADMIT` sees no "Call / Next" or "Remove" | Both buttons absent | Login as frank; confirm |
| QB-23 | "List view" button navigates to checked-in screen | URL: `/h/hospital-a/patients/checked-in` | Click; confirm URL |
| QB-24 | "Refresh" button triggers immediate refetch | Network request fired | Click; inspect network via HAR |
| QB-25 | Loading state on initial load | Spinner visible | Screenshot on navigate |
| QB-26 | Error state on API failure | `<p role="alert">Failed to load queue.</p>` | Mock API; confirm |

---

## Section 5 — Updated Check-In Form (Patient Flow)

**Route:** Patient profile → "Check in" button  
**File:** `profile-actions.tsx` — `CheckinForm`

**Precondition:** Patient with `admissionStatus = 'outpatient'`. Alice seeded with at least carol (doctor) and dave (nurse) on Hospital A.

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| CF-01 | "Check in" button opens modal with 3 body children | `document.body.childElementCount === 3` | Click Check in; check |
| CF-02 | Modal title is "Check in patient" | Exact text | `document.body.children[2].innerText` |
| CF-03 | Modal contains Department, Assign nurse, Assign doctor fields | 3 fields | Inspect modal inputs |
| CF-04 | Nurse dropdown first option: "— no nurse assigned —" | Exact text | Inspect first `<option>` in nurse select |
| CF-05 | Doctor dropdown first option: "— no doctor assigned —" | Exact text | Inspect first `<option>` in doctor select |
| CF-06 | Nurse dropdown lists only staff with `role=nurse` | Dave (nurse) present; carol (doctor) absent | Inspect options |
| CF-07 | Doctor dropdown lists only staff with `role=doctor` | Carol (doctor) present; dave (nurse) absent | Inspect options |
| CF-08 | Submit with both dropdowns on default (no assignment) | `assignedNurseId` and `assignedDoctorId` absent from request payload | Submit empty; check network HAR |
| CF-09 | Submit with nurse selected | `assignedNurseId` = dave's member ID in payload | Select dave; submit; check network |
| CF-10 | Submit with doctor selected | `assignedDoctorId` = carol's member ID in payload | Select carol; submit; check network |
| CF-11 | Fill department + submit | `department` in payload | Fill "Cardiology"; submit; check network |
| CF-12 | Cancel button closes modal | `document.body.childElementCount === 2`; no API call | Click Cancel; verify |
| CF-13 | After successful check-in, modal closes | Modal dismissed | Submit; wait; confirm `childElementCount === 2` |
| CF-14 | **GAP-EMR-05**: modal closes before mutation resolves | `dismissAllModals()` called in `onConfirm`, not `onSuccess` — error is invisible | Simulate 500 response; confirm modal already gone before error could be shown |

---

## Section 6 — Outgoing Transfers Screen (Task 3)

**Route:** `/h/hospital-a/patients/transfers`  
**File:** `transfers-screen.tsx`

**Precondition:** At least one outgoing transfer created via API from Hospital A to Hospital B

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| TR-01 | Transfers screen loads with Incoming tab active | "Incoming" tab is highlighted; "Outgoing" tab present | Navigate; inspect tab styles |
| TR-02 | Click "Outgoing" tab | Tab becomes active (forest border-bottom); outgoing transfers load | Click; confirm tab style and content |
| TR-03 | Outgoing empty state: "No outgoing transfers sent." | Exact text with icon | Load with no outgoing transfers |
| TR-04 | Outgoing tab shows pending transfer with amber badge | Badge text "Pending"; amber styling (`bg-amber-50 text-amber-700`) | Confirm via screenshot |
| TR-05 | Outgoing tab shows accepted transfer with green badge | Badge text "Accepted"; green styling | Accept via API (grace accepts); reload |
| TR-06 | Outgoing tab shows declined transfer with red badge | Badge text "Declined"; red styling | Decline via API; reload |
| TR-07 | OutgoingTransferCard shows Patient ID | `transfer.patientId` in mono text | Inspect card |
| TR-08 | OutgoingTransferCard shows destination hospital | "To: HSP-..." text | Inspect card |
| TR-09 | OutgoingTransferCard shows date sent | `toLocaleDateString()` format | Confirm date present |
| TR-10 | OutgoingTransferCard shows Reason | Reason text visible | Confirm |
| TR-11 | OutgoingTransferCard shows Department when present | Department section visible | Create transfer with department; confirm |
| TR-12 | OutgoingTransferCard shows Records pills | 5 pills: Vitals, Medications, History, Labs, Documents | Inspect pills |
| TR-13 | Included records pill is green; excluded is muted | Confirm Vitals/Meds/History/Labs green; Documents muted (default off) | Screenshot pill section |
| TR-14 | OutgoingTransferCard has NO Accept/Decline buttons | No action buttons on outgoing card | Confirm absent |
| TR-15 | Responded date shows when `respondedAt` set | "Responded [date]" visible after accept/decline | Accept or decline; reload |
| TR-16 | Switching tabs does not lose state | Tab switch back to Incoming shows incoming transfers | Switch; confirm |
| TR-17 | Loading state per tab | Spinner visible while tab data loads | Screenshot on tab click |
| TR-18 | Error state on API failure | `<p role="alert">Failed to load transfers.</p>` | Mock API; confirm |

---

## Section 7 — TransferForm Records Package Toggles (Task 3)

**Route:** Patient profile → admitted state → "Transfer" button  
**File:** `profile-actions.tsx` — `TransferForm`

**Precondition:** Patient with `admissionStatus = 'admitted'`

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| TF-01 | Transfer modal opens with 3 body children | `document.body.childElementCount === 3` | Click Transfer; check |
| TF-02 | Modal title "Transfer patient" | Exact text | Inspect modal innerText |
| TF-03 | "Destination hospital ID" field present (required) | Labelled field with asterisk | Inspect modal |
| TF-04 | "Reason" textarea present (required) | Labelled field with asterisk | Inspect modal |
| TF-05 | 5 record toggle buttons present | Vitals, Medications, History, Labs, Documents | Inspect button labels |
| TF-06 | Default state: Vitals, Medications, History, Labs are selected (forest bg) | 4 buttons with `bg-forest-900 text-white` class | Screenshot toggles |
| TF-07 | Default state: Documents is deselected (white bg) | Documents button with `bg-white text-charcoal-700` | Confirm |
| TF-08 | Clicking "Documents" toggles it to selected | Button style changes to forest bg | Click; confirm class change |
| TF-09 | Clicking selected toggle deselects it | Style reverts to white bg | Click Vitals; confirm |
| TF-10 | Submit with empty Destination ID → no API call | Button click does nothing | Leave field empty; click; check no network request |
| TF-11 | Submit with empty Reason → no API call | Button click does nothing | Fill ID, leave reason; confirm no request |
| TF-12 | Submit with both fields filled | API call fires with correct `recordsPackage` | Fill fields; submit; inspect network payload |
| TF-13 | `recordsPackage` payload reflects toggle state | Toggled-off Vitals = `includeVitals: false` | Toggle off Vitals; submit; check payload |
| TF-14 | **GAP-EMR-05** on TransferForm | `dismissAllModals()` called in `onConfirm`, not `onSuccess` | Simulate 500; modal already closed before error visible |

---

## Section 8 — Hospital Units Settings (Task 4)

**Route:** `/h/hospital-a/settings` → "Units & Depts" tab  
**File:** `settings-units.tsx`, `hospital-settings-screen.tsx`

### 8A — Tab visibility gate

| ID | Test | Login as | Expected | How to verify |
|----|------|----------|----------|---------------|
| US-01 | Hospital admin sees "Units & Depts" tab | bob | Tab visible in settings tab bar | Navigate to settings; confirm tab present |
| US-02 | Doctor does NOT see "Units & Depts" tab | carol | Tab absent entirely | Login as carol; inspect settings tabs |
| US-03 | Super admin sees "Units & Depts" tab | alice | Tab visible | Confirm |

### 8B — Empty state and create flow

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| US-04 | Empty state: "No units configured yet." | Exact text in dashed border box | Load before any units created |
| US-05 | "Add unit" button visible | Button in header | Confirm |
| US-06 | Clicking "Add unit" shows inline create form | Form appears below header; "Add unit" button hides | Click; confirm form visible |
| US-07 | Create form: Name (required), Type (select), Parent department (optional) | 3 fields present | Inspect form |
| US-08 | Type select options: Department, Unit, Ward | 3 options | Inspect select |
| US-09 | Parent department select hidden when no departments exist | Third field absent initially | Confirm |
| US-10 | Submit with empty name → Save button disabled | Save button has `disabled` attribute | Clear name; inspect button |
| US-11 | Submit valid department (name + type=department) | Unit appears in list; form hides; "Add unit" button returns | Fill name "Cardiology", type "department"; click Save |
| US-12 | After first department created, Parent select appears in form | Opening create again shows Parent dept dropdown | Click "Add unit"; confirm Parent field now visible |
| US-13 | Submit unit with parent selected | Unit row shows "Under: Cardiology" | Create "Ward A" with parent "Cardiology" |
| US-14 | Duplicate name → error toast | Toast with error message shown | Try to create "Cardiology" again |
| US-15 | Type badge shown on each row | "Department", "Unit", or "Ward" badge | Inspect row |

### 8C — Edit flow

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| US-16 | Click "Edit" on a unit row | Row switches to inline edit form pre-populated with current values | Click Edit; inspect form values |
| US-17 | Edit name → Save | Name updated in list; edit form dismissed | Change name; click Save |
| US-18 | Cancel edit | Form dismissed; no change | Click Cancel |
| US-19 | Cannot use a unit as its own parent | When editing a department, it is filtered out of parent dropdown | Open edit on "Cardiology"; confirm it's not in parent select |

### 8D — Deactivate / Activate flow

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| US-20 | Click "Deactivate" → confirmation modal opens | Modal text contains "Deactivated units will not appear in dropdown menus." | Click Deactivate; check modal content |
| US-21 | Confirm deactivation | Unit gets "Inactive" badge in red; "Deactivate" button becomes "Activate" | Confirm; inspect row |
| US-22 | Deactivated unit still visible in list | Unit remains in list (not removed) | Confirm row present |
| US-23 | Click "Activate" → confirmation modal | Modal text contains "This unit will be available again" | Click Activate; check modal |
| US-24 | Confirm reactivation | "Inactive" badge disappears | Confirm |

### 8E — Delete flow

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| US-25 | Click "Delete" → confirmation modal | Modal text: "This cannot be undone. Units with active sub-units cannot be deleted." | Click Delete; check |
| US-26 | Confirm delete on leaf unit | Unit removed from list | Confirm; reload; verify |
| US-27 | Confirm delete on unit with active children | `409` error → error toast shown | Create parent with active child; try to delete parent |
| US-28 | Cancel delete | Unit still in list | Click Cancel |

---

## Section 9 — Invite Form Dropdowns (Task 4)

**Route:** `/h/hospital-a/staff/invite`  
**File:** `invite-form.tsx`

**Precondition for dropdowns:** At least one active department unit and one active unit/ward unit must exist (created in Section 8)

| ID | Test | Setup | Expected | How to verify |
|----|------|-------|----------|---------------|
| IF-01 | Hospital has departments → Department field is a `<select>` | Create a department first | Field is dropdown with active departments | Inspect field type |
| IF-02 | Department dropdown: first option is "— none —" | | Exact first option text | Inspect options |
| IF-03 | Department dropdown: only active departments listed | Deactivate one department | Deactivated dept absent from dropdown | Confirm |
| IF-04 | Hospital has units/wards → Unit field is a `<select>` | Create a unit/ward first | Field is dropdown | Inspect field type |
| IF-05 | Unit dropdown: first option is "— none —" | | Exact first option text | Inspect |
| IF-06 | Unit dropdown: only active units and wards listed | Deactivate a unit | Deactivated unit absent | Confirm |
| IF-07 | No units configured → Department field is freetext input | Use Hospital B (no units) | `<input type="text">` not `<select>` | Verify with fresh hospital |
| IF-08 | No units configured → Unit field is freetext input | | `<input type="text">` | Verify |
| IF-09 | Submit invite with department selected from dropdown | Select a department; submit | Department name sent in payload | Check network payload |

---

## Section 10 — Cross-Cutting Checks

Run after all functional tests.

### Meemaw / JSX correctness

```bash
grep -rn "{.*&&" apps/medcord-web/src/features/patients/features/patient-admitted \
  apps/medcord-web/src/features/patients/features/patient-checkedin \
  apps/medcord-web/src/features/queue \
  apps/medcord-web/src/features/patients/features/patient-transfers \
  apps/medcord-web/src/features/workspace/features/hospital-dashboard \
  apps/medcord-web/src/features/workspace/features/hospital-settings \
  --include="*.tsx" | grep -v "//\|test\|spec" | head -20

grep -rn "\.map(" apps/medcord-web/src/features/patients/features/patient-transfers \
  apps/medcord-web/src/features/workspace/features/hospital-settings \
  --include="*.tsx" | grep -v "//\|test\|spec\|const\|let\|=" | head -20
```

| ID | Check | Expected |
|----|-------|----------|
| XC-01 | `outgoing-transfer-card.tsx` raw `.map()` | **CC-01 known** — pills.map() at line 78 — confirm violation exists |
| XC-02 | `checkedin-patients-screen.tsx` double `<Show>` pattern | **CC-02 known** — two consecutive `<Show>` for null check instead of `<Switch>` |
| XC-03 | No raw `&&` in JSX in any of the 6 in-scope files | All JSX conditionals use `<Show>` or `<Switch>` | Grep confirms |

### Color token violations

```bash
grep -rn "bg-\[#\|text-\[#\|border-\[#" \
  apps/medcord-web/src/features/patients/features/patient-admitted \
  apps/medcord-web/src/features/patients/features/patient-checkedin \
  apps/medcord-web/src/features/queue \
  apps/medcord-web/src/features/patients/features/patient-transfers \
  apps/medcord-web/src/features/workspace/features/hospital-dashboard \
  apps/medcord-web/src/features/workspace/features/hospital-settings \
  --include="*.tsx" | head -20
```

| ID | Check | Expected |
|----|-------|----------|
| XC-04 | No raw hex values in Tailwind class names | Empty grep output |

### Missing onError handlers

```bash
grep -rn "useMutation\|mutationFn" \
  apps/medcord-web/src/features/patients/features/patient-checkedin/api \
  apps/medcord-web/src/features/workspace/features/hospital-settings/api \
  --include="*.ts" -l | xargs grep -L "onError"
```

| ID | Check | Expected |
|----|-------|----------|
| XC-05 | All mutations in scope have `onError` handlers | No files listed — or document which ones are missing |

### Direct URL access

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| XC-06 | `/h/hospital-a/patients/admitted` loads directly | No 404, page renders | Direct navigate |
| XC-07 | `/h/hospital-a/patients/checked-in` loads directly | Page renders | Direct navigate |
| XC-08 | `/h/hospital-a/queue` loads directly | Page renders | Direct navigate |
| XC-09 | `/h/hospital-a/patients/transfers` defaults to Incoming tab | Incoming tab active | Direct navigate |

---

## Known Gaps to Verify at Runtime

| ID | Gap | Location | Test cases |
|----|-----|----------|-----------|
| CC-01 | `pills.map()` in JSX | `outgoing-transfer-card.tsx:78` | XC-01 |
| CC-02 | Double `<Show>` instead of `<Switch>` | `checkedin-patients-screen.tsx:114` | XC-02 |
| CC-03 | `dismissAllModals()` before mutation resolves | `profile-actions.tsx` — all 3 forms | CF-14, TF-14 |
| CC-04 | Table columns don't match handoff spec | `admitted-patients-screen.tsx` | AP-05 |

---

## Execution Order

1. Pre-flight (PF-01 → PF-05)
2. Dynamic Dashboard (DB-01 → DB-16)
3. Admitted Patients Screen (AP-01 → AP-12)
4. Checked-In Patients Screen (CI-01 → CI-20)
5. Queue Board Screen (QB-01 → QB-26)
6. Updated Check-In Form (CF-01 → CF-14)
7. Outgoing Transfers (TR-01 → TR-18)
8. TransferForm Toggles (TF-01 → TF-14)
9. Hospital Units — Settings (US-01 → US-28)
10. Invite Form Dropdowns (IF-01 → IF-09)
11. Cross-Cutting Checks (XC-01 → XC-09)

---

## Total Test Count

| Section | Cases |
|---------|-------|
| Pre-flight | 5 |
| 1 — Dynamic Dashboard | 16 |
| 2 — Admitted Patients | 12 |
| 3 — Checked-In Patients | 20 |
| 4 — Queue Board | 26 |
| 5 — Check-In Form (updated) | 14 |
| 6 — Outgoing Transfers | 18 |
| 7 — TransferForm Toggles | 14 |
| 8 — Hospital Units Settings | 25 |
| 9 — Invite Form Dropdowns | 9 |
| 10 — Cross-cutting | 9 |
| **Total** | **168** |
