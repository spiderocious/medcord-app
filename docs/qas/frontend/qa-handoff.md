# QA Handoff — Phases 4, 5, 6

**Date:** 2026-05-16  
**Build status:** Typecheck clean ✅  
**Modules covered:** Assets (Phase 4), Patients (Phase 5), EMR Chart + Labs (Phase 6)

---

## Phase 4 — Assets

### Asset List Screen
**Route:** `/h/:slug/assets`  
**File:** `apps/medcord-web/src/features/assets/features/asset-list/screen/asset-list-screen.tsx`  
**Sidebar:** Visible when `modules.assets === true`

On the Asset List screen: user must be able to:
- view a table of all hospital assets with name, category, status badge, location, and asset tag
- search assets by name or category using the search input
- filter assets by status (available, in_use, maintenance, retired)
- clear active filters with the Clear button
- click a table row to navigate to the asset detail page
- click "Add Asset" to navigate to the asset create page
- click "Delete" on a row — a confirmation modal must appear before the asset is deleted
- see a loading spinner while assets are loading
- see an error message if the asset fetch fails
- see an empty state icon and message when no assets match

---

### Asset Create Screen
**Route:** `/h/:slug/assets/new`  
**File:** `apps/medcord-web/src/features/assets/features/asset-create/screen/asset-create-screen.tsx`

On the Asset Create screen: user must be able to:
- fill in required fields: name and category
- fill in optional fields: asset tag, condition, status, current location, manufacturer, model, serial number, purchase date, purchase price, warranty expiry, and notes
- click "Create asset" to submit — on success, user is redirected to the asset detail page
- see a toast error if creation fails
- click "Cancel" to go back to the asset list
- see all form fields disabled and loading indicator while submission is in progress

---

### Asset Detail Screen
**Route:** `/h/:slug/assets/:assetId`  
**File:** `apps/medcord-web/src/features/assets/features/asset-detail/screen/asset-detail-screen.tsx`

On the Asset Detail screen: user must be able to:
- view the asset name and category in the page heading
- view and edit asset info (name, category, condition, manufacturer, model, serial number, notes) via the info form — saving must show a success toast
- view the current status badge and current location in the status panel
- click "Change status" to open a modal with a status dropdown and an "Assigned to" field (shown only when status is "in_use")
- click "Move" to open an input modal for entering a new location — on confirm, asset is moved and toast shown
- view the location history list sorted by time
- see "No movement recorded" when location history is empty
- click "Back" (arrow left) to return to the asset list

---

## Phase 5 — Patients

### Patient List Screen
**Route:** `/h/:slug/patients`  
**File:** `apps/medcord-web/src/features/patients/features/patient-list/screen/patient-list-screen.tsx`  
**Sidebar:** Visible when `modules.emr === true`

On the Patient List screen: user must be able to:
- view a table of all registered patients with full name, preferred name (if set), patient code, date of birth, admission status badge, and phone number
- search patients by name or patient code using the search input
- clear the search with the Clear button
- click a row to navigate to the patient profile page
- click "Register patient" to navigate to the registration screen
- see total patient count in the subtitle
- see a loading spinner while patients load
- see an error message if fetch fails
- see an empty state icon and message when no patients found

---

### Patient Register Screen
**Route:** `/h/:slug/patients/register`  
**File:** `apps/medcord-web/src/features/patients/features/patient-register/screen/patient-register-screen.tsx`

On the Patient Register screen: user must be able to:
- fill in required demographic fields: first name, last name, date of birth, sex
- fill in optional demographic fields: preferred name, gender identity, phone, email, address, religion, cultural preferences
- fill in emergency contact details: name, relationship, phone (all optional as a group, but required together if any is filled)
- click "Register patient" to submit
- if duplicate patients are detected, see a modal showing the possible duplicates with "Register anyway" and "Go back" options
- if registration succeeds with no duplicates, see a success toast and be redirected to the patient profile
- see a toast error if registration fails
- click "Cancel" to go back to the patient list
- see all form fields disabled while submission is in progress

---

### Patient Profile Screen
**Route:** `/h/:slug/patients/:code`  
**File:** `apps/medcord-web/src/features/patients/features/patient-profile/screen/patient-profile-screen.tsx`

On the Patient Profile screen: user must be able to:
- view the patient's full name, preferred name, patient code, and admission status badge in the header
- click "Favorite" / "Unfavorite" to toggle the patient from their favorites list — button shows loading while in flight
- click "View chart" to navigate to the patient's EMR chart
- view all demographics: date of birth, sex, gender identity, phone, email, address, religion, cultural preferences
- view emergency contact details if set
- view guarantor details if set
- view and manage the patient's ID card:
  - if no active ID card: see "No active ID card" and an "Issue ID card" button
  - if active ID card: see the "Active" status badge, issue date, and "Reissue" / "Deactivate" buttons
  - clicking "Deactivate" must show a destructive confirmation modal before deactivating
  - toast shown on success or error for all ID card actions
- view patient actions panel based on admission status:
  - **outpatient**: "Check in" and "Admit" buttons
  - **admitted**: "Check out", "Discharge", and "Transfer" buttons
  - **discharged**: "Re-admit (check in)" button
- clicking "Check in" opens a modal with department and assigned-to fields
- clicking "Admit" opens a modal with department (required), assigned-to, and notes fields
- clicking "Check out" shows a confirmation modal
- clicking "Discharge" shows a destructive confirmation modal
- clicking "Transfer" opens a modal with destination hospital ID (required) and reason (required)
- see a loading spinner and error state if patient load fails

---

## Phase 6 — EMR Chart

All chart screens share a tab navigation bar: Overview · Vitals · Medications · History · Procedures · Immunizations · Documents · Audit

### Chart Overview Screen
**Route:** `/h/:slug/patients/:code/chart`  
**File:** `apps/medcord-web/src/features/emr/features/chart-overview/screen/chart-overview-screen.tsx`

On the Chart Overview screen: user must be able to:
- see a summary card showing the most recent vitals (BP, HR, temp, SpO₂) and the date recorded
- see an alert badge when any vital field is out of range
- see the count of active medications
- see the count of recorded diagnoses
- see recent procedures with procedure name, date, and performer
- see "No vitals recorded" when no vitals exist
- see a loading spinner and error state on fetch failure
- navigate between chart sections using the tab bar

---

### Vitals Screen
**Route:** `/h/:slug/patients/:code/chart/vitals`  
**File:** `apps/medcord-web/src/features/emr/features/vitals/screen/vitals-screen.tsx`

On the Vitals screen: user must be able to:
- view a table of all recorded vitals entries: date, BP, HR, temp, SpO₂, weight
- see an out-of-range alert icon on rows with abnormal values
- click "Record vitals" to open a modal form with fields for all vital signs (all optional: systolic BP, diastolic BP, HR, RR, temp, SpO₂, weight, height, pain score)
- submit the vitals form — on success, a toast is shown and the table refreshes
- see "No vitals recorded yet" when empty
- see a loading spinner and error state on fetch failure

---

### Medications Screen
**Route:** `/h/:slug/patients/:code/chart/medications`  
**File:** `apps/medcord-web/src/features/emr/features/medications/screen/medications-screen.tsx`

On the Medications screen: user must be able to:
- view all medications with drug name, strength/route/frequency, indication, prescriber, and status badge (Active, On hold, Discontinued)
- click "Add medication" to open a modal form with drug (required), strength, route, frequency, indication, and duration fields
- submit the medication form — on success, toast shown and list refreshes
- click "Update" on any medication to open a modal for changing status (active / on_hold / discontinued) with an optional reason field
- submit the update — on success, toast shown
- see "No medications recorded" when list is empty
- see a loading spinner and error state on fetch failure

---

### History Screen
**Route:** `/h/:slug/patients/:code/chart/history`  
**File:** `apps/medcord-web/src/features/emr/features/history/screen/history-screen.tsx`

On the History screen: user must be able to:
- view the full medical history: diagnoses (ICD-10 code + description + date), social history (smoking, alcohol, occupation), family history items, and notes
- click "Edit" to open a modal for editing social history fields (smoking, alcohol, occupation) and notes
- submit — on success, toast shown and history refreshes
- see empty sections gracefully when no data is recorded
- see a loading spinner and error state on fetch failure

---

### Procedures Screen
**Route:** `/h/:slug/patients/:code/chart/procedures`  
**File:** `apps/medcord-web/src/features/emr/features/procedures/screen/procedures-screen.tsx`

On the Procedures screen: user must be able to:
- view all recorded procedures with procedure name, CPT code, date, performer, location, and notes
- click "Record procedure" to open a modal form with: procedure name (required), performed by (required), date (required), CPT code, location, notes, and the full pre-op checklist (4 checkboxes: consent obtained, NPO status, allergies confirmed, site marked)
- submit — on success, toast shown and list refreshes
- see "No procedures recorded" when empty
- see a loading spinner and error state on fetch failure

---

### Immunizations Screen
**Route:** `/h/:slug/patients/:code/chart/immunizations`  
**File:** `apps/medcord-web/src/features/emr/features/immunizations/screen/immunizations-screen.tsx`

On the Immunizations screen: user must be able to:
- view a table of all immunizations: vaccine name, dose, date administered, next due date, administrator
- click "Record immunization" to open a modal form with: vaccine (required), dose, date administered (required), administrator (required), lot number, next due date
- submit — on success, toast shown and table refreshes
- see "No immunizations recorded" when empty
- see a loading spinner and error state on fetch failure

---

### Documents Screen
**Route:** `/h/:slug/patients/:code/chart/documents`  
**File:** `apps/medcord-web/src/features/emr/features/documents/screen/documents-screen.tsx`

On the Documents screen: user must be able to:
- view a list of all uploaded documents with title, category, date, and a "Sensitive" indicator
- click "Upload document" to open a modal form with: title (required), category dropdown (referral, lab_report, imaging, consent, other), a file picker, and a "Mark as sensitive" checkbox
- the file is uploaded to the external file service before the metadata is saved to the backend
- on upload success, toast shown and list refreshes
- on file upload failure, an error toast is shown
- see "No documents uploaded" when empty
- see a loading spinner and error state on fetch failure

---

### Audit Log Screen
**Route:** `/h/:slug/patients/:code/chart/audit`  
**File:** `apps/medcord-web/src/features/emr/features/access-log/screen/access-log-screen.tsx`

On the Audit Log screen: user must be able to:
- view a table of all chart access events: time, user, action, section
- see rows with a "BREAK GLASS" badge for emergency access events, highlighted in amber
- click "Break glass" to open a modal explaining this is an emergency access override requiring a reason
- enter a reason and confirm — a warning toast is shown and the log refreshes
- cancel the break glass modal to abort
- see "No access events recorded" when empty
- see a loading spinner and error state on fetch failure

---

## Phase 6 — Labs

### Lab Orders Screen
**Route:** `/h/:slug/labs`  
**File:** `apps/medcord-web/src/features/labs/features/lab-orders/screen/lab-orders-screen.tsx`  
**Sidebar:** Visible when `modules.labs === true`

On the Lab Orders screen: user must be able to:
- view a hospital-wide table of all lab orders with test name, test code, priority badge (Routine / Urgent / STAT), status badge, ordered by, and date
- filter orders by status using the status dropdown
- click "New order" to open a modal form with: test name (required), test code, category, priority (routine/urgent/stat), sample type, notes
- submit the order — on success, toast shown and table refreshes
- see a loading spinner and error state on fetch failure
- see an empty state icon and message when no orders found

---

## Route Registration Summary

| Route | Screen |
|---|---|
| `/h/:slug/patients` | PatientListScreen |
| `/h/:slug/patients/register` | PatientRegisterScreen |
| `/h/:slug/patients/:code` | PatientProfileScreen |
| `/h/:slug/patients/:code/chart` | ChartOverviewScreen |
| `/h/:slug/patients/:code/chart/vitals` | VitalsScreen |
| `/h/:slug/patients/:code/chart/medications` | MedicationsScreen |
| `/h/:slug/patients/:code/chart/history` | HistoryScreen |
| `/h/:slug/patients/:code/chart/procedures` | ProceduresScreen |
| `/h/:slug/patients/:code/chart/immunizations` | ImmunizationsScreen |
| `/h/:slug/patients/:code/chart/documents` | DocumentsScreen |
| `/h/:slug/patients/:code/chart/audit` | AccessLogScreen |
| `/h/:slug/labs` | LabOrdersScreen |
| `/h/:slug/assets` | AssetListScreen |
| `/h/:slug/assets/new` | AssetCreateScreen |
| `/h/:slug/assets/:assetId` | AssetDetailScreen |

## Module Gating

| Sidebar Entry | Visible when |
|---|---|
| Patients | `modules.emr === true` |
| Labs | `modules.labs === true` |
| Assets | `modules.assets === true` |

## Toast Behaviour to Verify

- All successful mutations show a green success toast
- All failed mutations show a red error toast with the backend error message (never a hardcoded string)
- Break glass confirmation shows an amber warning toast (not success)
- No inline error paragraphs for mutation results — only `Loadable` error for initial data fetches

## Confirmation Modal Behaviour to Verify

All destructive actions must show a confirmation modal before proceeding:
- Delete asset (destructive: true)
- Discharge patient (destructive: true)
- Deactivate ID card (destructive: true)
- Check out patient (non-destructive confirmation)
