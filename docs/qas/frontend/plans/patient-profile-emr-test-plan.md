# Medcord — Patient Profile & EMR Chart — Frontend QA Test Plan

> **QA:** Claude
> **Date:** 2026-05-17
> **Scope:** Patient Profile screen + 8 EMR chart tabs (Overview, Vitals, Medications, Procedures, History, Immunizations, Documents, Audit/Access Log)
> **Login:** alice@medcord.test / Medcord123! (super_admin — all permissions)
> **Patient under test:** CAE-3390e62f-537e-4781-8cd1-e3a8bf368ead (John Doe / John Marcus — verify name on load)
> **Base URL:** `http://localhost:5175`
> **Hospital slug:** `hospital-a`

---

## Pre-flight Checks

| # | Check | Pass condition |
|---|-------|---------------|
| PF-01 | Backend running | `curl http://localhost:8085/api/v1/health` → 200 |
| PF-02 | Frontend running | `http://localhost:5175` loads without blank screen |
| PF-03 | Login succeeds | alice@medcord.test / Medcord123! → lands on hospital dashboard or hospital picker |
| PF-04 | Seed patient exists | After login, navigate to patients list; patient with code `CAE-3390e62f-537e-4781-8cd1-e3a8bf368ead` is visible |
| PF-05 | EMR module enabled | Chart tab visible on patient profile (not hidden by module gate) |

---

## Implementation Notes (from source)

1. **Patient profile route** uses `code` param = `CAE-3390e62f-537e-4781-8cd1-e3a8bf368ead` (the patientCode, not patientId)
2. **ProfileActions `<Switch>`** renders buttons based on `patient.admissionStatus`:
   - `outpatient` → "Check in" + "Admit"
   - `admitted` → "Check out" + "Discharge" + "Transfer"
   - `discharged` → "Re-admit (check in)"
3. **CheckinForm** uses three React `useState` hooks (dept, nurseId, doctorId) — NOT document.getElementById
4. **AdmitForm** requires dept (hard-block if empty string), optional assignedTo and notes
5. **TransferForm** requires toHospitalId and reason; records toggles default: vitals/meds/history/labs = true, documents = false
6. **DocumentUpload** calls external file service (`VITE_FILE_SERVICE`) before calling the Medcord API — two-phase upload
7. **Break Glass** form has an amber warning banner, requires non-empty reason, `onSuccess` dismisses modal
8. **Audit log** rows: `isBreakGlass = true` → amber row background + "BREAK GLASS" badge
9. **History "Edit" button** disabled while `!history` (before data loads)
10. **History "other" social field** is shown read-only but is NOT editable in the form — no "Other" input
11. **VitalsForm** has **no `onError` handler** — silent failure on mutation error
12. **AddMedicationForm** has **no `onError` handler** — silent failure
13. **DocumentUpload** shows `DrawerService.toast('File upload failed.')` on network error during upload — this IS handled

---

## Section 1 — Patient Profile Screen

**URL:** `/h/hospital-a/patients/CAE-3390e62f-537e-4781-8cd1-e3a8bf368ead`

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| PP-01 | Page loads without error | No red error banner; no blank screen | Navigate to URL; confirm `<p role="alert">` absent |
| PP-02 | Back button ("Patients") visible and functional | Button with left-arrow icon at top left; clicking navigates to `/h/hospital-a/patients` | Click; confirm URL change |
| PP-03 | Patient name and code in header | Full name shown; patient code shown (format: `CAE-XXXX`) | Inspect `ProfileHeader` area |
| PP-04 | "View chart" button present | Secondary button with clipboard icon | Confirm button visible below header |
| PP-05 | "View chart" navigates to chart overview | Clicking navigates to `/h/hospital-a/patients/CAE-xxx/chart` | Click; confirm URL |
| PP-06 | Demographics card: all fields rendered | Date of birth, Sex, Phone, Email, Address, Gender identity, Religion, Cultural preferences | Inspect demographics card; blank fields show "—" |
| PP-07 | Emergency contact card only shown when present | Card appears only if patient has emergency contact data | Inspect DOM; `<Show when={emergencyContact !== undefined}>` |
| PP-08 | Guarantor card only shown when present | Card appears only if patient has guarantor data | Inspect DOM |
| PP-09 | Actions panel shows correct buttons for admissionStatus | Depends on patient's current status (check API response) | GET `/hospitals/:id/patients/:code`; match status to expected buttons |
| PP-10 | Loading state shown while data fetches | Spinner visible before patient data arrives | Throttle network; confirm spinner appears |
| PP-11 | Error state on API failure | `<p role="alert">Failed to load patient.</p>` shown | Block API call; confirm error element |
| PP-12 | ID card panel shown when idCard data exists | `IdCardPanel` appears in right column | Confirm via API response and DOM |
| PP-13 | Favorite toggle present in ProfileHeader | Star/heart icon for favoriting patient | Interact with toggle; confirm visual state change |

---

## Section 2 — Actions Panel — Check In Flow

**Precondition:** Patient `admissionStatus = 'outpatient'` (check API; if not outpatient, checkout/discharge first)

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| AC-01 | "Check in" button opens modal | Modal with title "Check in patient" opens; body has 3 children (body.childElementCount === 3) | Click; check modal presence |
| AC-02 | Modal contains Department, Assign nurse, Assign doctor fields | All three inputs present | Inspect modal content |
| AC-03 | Nurse dropdown first option is "— no nurse assigned —" | Empty-value option at top | Inspect `<select>` options |
| AC-04 | Doctor dropdown first option is "— no doctor assigned —" | Empty-value option at top | Inspect `<select>` options |
| AC-05 | Submit with all fields empty | Request fires with no assignedNurseId, no assignedDoctorId (fields omitted) | Network tab — verify payload has no null/empty IDs |
| AC-06 | Submit with nurse selected | `assignedNurseId` = selected nurse's ID in payload | Select a nurse; submit; check network |
| AC-07 | Submit with department filled | `department` in request payload | Fill dept; submit; check network |
| AC-08 | Cancel button closes modal | Modal dismissed; no API call fired | Click Cancel; confirm modal gone and no network request |
| AC-09 | After successful check-in, modal closes | `DrawerService.dismissAllModals()` called — modal gone | Submit; wait for success |
| AC-10 | "Admit" button opens admit modal | Modal title "Admit patient"; has Department (required), Assigned to, Notes fields | Click Admit |
| AC-11 | Admit — submit with empty department | Submit does not fire (guard: `if (!dept.trim()) return`) | Leave dept blank; click Admit button; confirm no network request |
| AC-12 | Admit — submit with department filled | API call fires; patient status transitions to admitted | Fill dept; submit; confirm |

---

## Section 3 — Actions Panel — Admitted State

**Precondition:** Patient `admissionStatus = 'admitted'`

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| AC-13 | Buttons shown: Check out, Discharge, Transfer | Three buttons in Actions panel | Confirm `admissionStatus=admitted` then inspect UI |
| AC-14 | "Check out" opens confirmation modal | Standard confirmation modal: "Check out [Name]?" with "Check out" confirm button | Click; confirm modal |
| AC-15 | Confirm check out | POST checkout fires; patient transitions to outpatient | Confirm; check network; reload |
| AC-16 | "Discharge" opens destructive confirmation modal | Modal has destructive confirm style + "Discharge" button; shows patient name | Click; confirm modal |
| AC-17 | Cancel discharge | No API call; patient still admitted | Click Cancel; confirm |
| AC-18 | "Transfer" opens transfer modal | Modal title "Transfer patient"; has "Destination hospital ID" (required), "Reason" (required), Records toggles | Click; inspect |
| AC-19 | Transfer record toggles — default state | Vitals, Medications, History, Labs = selected (filled); Documents = unselected | Inspect toggle pill buttons |
| AC-20 | Transfer submit with empty hospitalId | No API call (guard: `if (!toHospitalId.trim() || !reason.trim()) return`) | Leave fields blank; click; confirm no request |

---

## Section 4 — Chart Layout (Shell — All Tab Routes)

**URL prefix:** `/h/hospital-a/patients/CAE-xxx/chart`

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| CL-01 | Chart layout renders on all 8 tab routes | No blank screen on any `/chart/*` URL | Navigate to each of the 8 routes; confirm layout present |
| CL-02 | Breadcrumb shows: Patients / {name or code} / Chart | Top breadcrumb correct | Inspect breadcrumb element |
| CL-03 | All 8 tab links present | Overview, Vitals, Medications, History, Procedures, Immunizations, Documents, Audit | Inspect tab nav |
| CL-04 | Active tab is highlighted | Current route's tab has active state | Compare active vs inactive tab styling |
| CL-05 | Clicking each tab navigates to correct route | Tab click changes URL | Click all 8 tabs; confirm URLs |

---

## Section 5 — Chart Overview

**URL:** `/h/hospital-a/patients/CAE-xxx/chart`

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| OV-01 | Page loads without error | No `<p role="alert">` visible | Load page |
| OV-02 | Error state on API failure | `<p role="alert">Failed to load chart.</p>` | Block API; confirm |
| OV-03 | "Last vitals" card shown | Card with most recent vitals readings present | Check if patient has vitals; confirm card |
| OV-04 | Out-of-range vitals show amber text | Fields with out-of-range readings listed in amber | Check `isOutOfRange` flag from API response |
| OV-05 | "Medications" count card shown | Shows count of active medications | Confirm count matches medications tab |
| OV-06 | "Diagnoses" count card shown | Shows count from history.diagnoses | Confirm count matches history tab |
| OV-07 | Recent procedures section hidden when none exist | `when={(recentProcedures.length > 0)}` — section absent if no procedures | Confirm conditional render |
| OV-08 | Recent procedures shown when data exists | Procedure entries listed | Add a procedure first if none; reload |
| OV-09 | No vitals yet → graceful state | Overview renders without crashing; last vitals card either absent or shows empty state | Verify with fresh patient |

---

## Section 6 — Vitals

**URL:** `/h/hospital-a/patients/CAE-xxx/chart/vitals`

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| VT-01 | Empty state shown when no vitals | Text: `"No vitals recorded yet."` centered on page | Load; confirm exact string |
| VT-02 | "Record vitals" button present (with icon) | Secondary variant button, leading + icon | Confirm button visible |
| VT-03 | "Record vitals" opens modal | Modal with title containing "vitals"; body.childElementCount === 3 | Click; check modal |
| VT-04 | Modal contains all 9 fields | bp_systolic, bp_diastolic, hr, rr, temp, spo2, weight, height, painScore | Inspect form inputs |
| VT-05 | All fields are number inputs | type="number", step="0.1" | Inspect input attributes |
| VT-06 | "Record vitals" submit button in modal | Primary button labelled "Record vitals" | Confirm |
| VT-07 | "Cancel" button closes modal | Modal dismissed, no API call | Click Cancel; confirm |
| VT-08 | Submitting with all fields filled fires mutation | POST to `/emr/:patientId/vitals` | Fill all fields; submit; check network |
| VT-09 | **Silent failure on error** — no `onError` handler | If mutation fails, form does not show an error message | Simulate 500; confirm no error UI |
| VT-10 | On success, modal closes | `DrawerService.dismissAllModals()` called | Submit valid; confirm modal gone |
| VT-11 | After recording, vitals appear in table | Table shows: Date, BP, HR, Temp, SpO₂, Weight columns | Record vitals; reload |
| VT-12 | Out-of-range row shows amber alert icon | `<IconAlert>` with amber-500 class on rows where `isOutOfRange = true` | Record out-of-range values; check |
| VT-13 | Multiple vitals entries shown in order | Table rows sorted by date (most recent first or as returned by API) | Record two entries; verify order |

---

## Section 7 — Medications

**URL:** `/h/hospital-a/patients/CAE-xxx/chart/medications`

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| MED-01 | Empty state: `"No medications recorded."` | Exact string centered | Load with no meds |
| MED-02 | "Add medication" button gated by `EMR_MEDICATIONS_WRITE` | Alice (super_admin) sees button; pharmacist without permission should not | Confirm visible for alice |
| MED-03 | "Add medication" opens modal | Modal title contains "medication"; 3 body children | Click; check |
| MED-04 | Modal has: drug (required), strength, route, frequency, indication, duration fields | All 6 fields present | Inspect modal form |
| MED-05 | Submit with empty drug field — blocked | Guard: `if (!drug.trim()) return` — no API call | Clear drug field; click Add; check network (no request) |
| MED-06 | Submit with drug filled | POST fires; medication appears in list | Fill drug "Amoxicillin"; submit; confirm |
| MED-07 | **Silent failure on error** — no `onError` handler | Mutation error shows no error message in UI | Simulate 500; confirm no feedback |
| MED-08 | On success, modal closes | `DrawerService.dismissAllModals()` called | Submit valid; confirm |
| MED-09 | Medication list shows status badge | "Active", "Discontinued", or "On hold" badge per row | Check badge labels |
| MED-10 | Status badge uses design tokens (not raw hex) | CSS classes: `records-*`, `equipment-*`, `charcoal-*` pattern | Inspect badge class attribute |
| MED-11 | "Update" button per row (if `EMR_MEDICATIONS_WRITE`) | Button on each row | Confirm for alice |
| MED-12 | "Update" opens UpdateMedicationForm modal | Modal contains status dropdown and reason field | Click Update on a row |
| MED-13 | Update form uses React state — not DOM queries | Status = `useState<MedicationStatus>(med.status)`, reason = `useState('')` | Code already confirmed; verify behavior: change status, it persists |
| MED-14 | Status change sent correctly | `{ medId, status, reason }` in PATCH payload | Change status; submit; check network |

---

## Section 8 — Procedures

**URL:** `/h/hospital-a/patients/CAE-xxx/chart/procedures`

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| PR-01 | Empty state: `"No procedures recorded."` | Exact string | Load with no procedures |
| PR-02 | "Add procedure" gated by `EMR_PROCEDURES_WRITE` | Visible for alice | Confirm |
| PR-03 | "Add procedure" opens modal | Modal with procedure form; 3 body children | Click; check |
| PR-04 | Required fields: name, performedBy, performedAt | Three required fields in form | Inspect |
| PR-05 | Submit with any required field empty — blocked | Guard: `if (!name.trim() \|\| !performedBy.trim() \|\| !performedAt) return` | Clear each required field; confirm no API call |
| PR-06 | Optional fields: cptCode, location, notes | Fields present but not required | Confirm they exist in form |
| PR-07 | Pre-op checklist present | 4 checkboxes: consentObtained, npoStatus, allergiesConfirmed, siteMarked via `<Repeat>` | Confirm via UI |
| PR-08 | Submit with all required fields | POST fires; procedure appears | Fill required; submit |
| PR-09 | Procedure row: name bold, date · performedBy | Format: `{name}` bold; below `{date} · {performedBy}` | Confirm row layout |
| PR-10 | Optional columns: location, notes, cptCode (monospace, right-aligned) | Shown when present; cptCode in mono | Add procedure with all fields; verify |

---

## Section 9 — History

**URL:** `/h/hospital-a/patients/CAE-xxx/chart/history`

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| HX-01 | Page loads, history record shown | History data visible | Load; confirm no error |
| HX-02 | "Edit" button disabled while data loading | `disabled` attribute when `!history` | Throttle network; confirm button disabled |
| HX-03 | "Edit" button enabled after data loads | Button active after data arrives | Confirm after load |
| HX-04 | Diagnoses section hidden when empty | `when={(history?.diagnoses.length ?? 0) > 0}` — hidden by default if no diagnoses | Load; check section absent |
| HX-05 | Social history section always shown | 4 rows: Smoking, Alcohol, Occupation, Other via `<Repeat>` | Confirm all 4 present |
| HX-06 | Undefined social fields show "—" | Fields with no data show dash | Confirm format |
| HX-07 | Family history section hidden when empty | `when={(history?.familyHistory.length ?? 0) > 0}` | Confirm conditional |
| HX-08 | Notes section hidden when undefined | `when={history?.notes !== undefined}` | Confirm conditional |
| HX-09 | "Edit" opens history edit form modal | Modal with smoking, alcohol, occupation, notes fields | Click Edit; check modal |
| HX-10 | **"Other" is NOT editable in the form** | Form has smoking, alcohol, occupation, notes — no "Other" input | Inspect modal form fields |
| HX-11 | Edit form uses React state | Changes to smoking/alcohol/occupation/notes persist without page quirks | Edit each field; confirm |
| HX-12 | Save fires PATCH with updated values | Payload contains edited fields | Edit; click Save; check network |
| HX-13 | Cancel closes modal without saving | No API call; data unchanged | Click Cancel; verify |

---

## Section 10 — Immunizations

**URL:** `/h/hospital-a/patients/CAE-xxx/chart/immunizations`

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| IMM-01 | Empty state: `"No immunizations recorded."` | Exact string | Load with no records |
| IMM-02 | "Add immunization" gated by `EMR_IMMUNIZATIONS_WRITE` | Visible for alice | Confirm |
| IMM-03 | "Add immunization" opens modal | 3 body children | Click; check |
| IMM-04 | Required fields: vaccine, administeredAt, administrator | Three required | Inspect |
| IMM-05 | Submit with any required field empty — blocked | Guard: `if (!vaccine.trim() \|\| !administeredAt \|\| !administrator.trim()) return` | Clear each; confirm no request |
| IMM-06 | Optional fields: dose, lotNumber, nextDueDate | Present in form | Confirm |
| IMM-07 | Submit with all required fields | POST fires; row appears | Fill; submit; verify |
| IMM-08 | Table columns: Vaccine, Dose, Date, Next due, Administrator | All 5 columns | Inspect table headers |
| IMM-09 | Dose and nextDueDate show "—" when absent | `imm.dose ?? '—'`, formatted nextDueDate or "—" | Add immunization without optional fields; confirm "—" |

---

## Section 11 — Documents

**URL:** `/h/hospital-a/patients/CAE-xxx/chart/documents`

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| DOC-01 | Empty state: `"No documents uploaded."` | Exact string | Load with no documents |
| DOC-02 | "Upload document" gated by `EMR_DOCUMENTS_WRITE` | Visible for alice | Confirm |
| DOC-03 | "Upload document" opens modal | 3 body children | Click; check |
| DOC-04 | Modal fields: Title (required), Category (select), File (required), isSensitive (checkbox) | All 4 present | Inspect |
| DOC-05 | Category dropdown options: Referral, Lab report, Imaging, Consent, Other | All 5 options | Inspect select options |
| DOC-06 | Submit with empty title or no file — blocked | Guard: `if (!title.trim() \|\| !file) return` — no request | Leave title empty; confirm no request |
| DOC-07 | File picker triggered by "Choose file" button | Hidden input, button triggers `fileRef.current.click()` | Click; file dialog opens |
| DOC-08 | Selected file name shown in button text | After selection, button shows filename | Select a file; confirm label |
| DOC-09 | Upload flow: file service call then Medcord API | Two network requests: 1) GET upload URI, 2) PUT file, 3) POST document record | Select file; submit; inspect network |
| DOC-10 | File service error shows toast | `DrawerService.toast('File upload failed.')` shown if fetch fails | Simulate file service failure; confirm toast |
| DOC-11 | On success, modal closes | `DrawerService.dismissAllModals()` called | Upload successfully; confirm |
| DOC-12 | Document row: title, category label · date, [Sensitive] badge | Format correct | Upload doc; verify row layout |
| DOC-13 | Category label mapping: `lab_report` → "Lab report", `referral` → "Referral" etc. | Labels not raw values | Upload with each category; verify |
| DOC-14 | **No download or view button on rows** | `fileKey` not exposed in UI; no link or button to open file | Confirm action buttons absent |
| DOC-15 | isSensitive=true shows "· Sensitive" in row | Sensitive badge appended | Upload with sensitive checked; verify |

---

## Section 12 — Audit / Access Log

**URL:** `/h/hospital-a/patients/CAE-xxx/chart/audit`

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| AL-01 | Page loads without error | No red error banner | Navigate |
| AL-02 | Empty state: `"No access events recorded."` | Exact string; centered; shown when `items.length === 0` | Load on fresh patient |
| AL-03 | Error state on API failure | `<p role="alert">` with error message | Block API; confirm |
| AL-04 | Access log table shows: Time, User, Action, Section columns | All 4 column headers | Inspect table `<th>` elements |
| AL-05 | "Break glass" button visible for `EMR_BREAK_GLASS` permission | Ghost button with lock icon; visible for alice (super_admin) | Confirm |
| AL-06 | "Break glass" button hidden without permission | Users lacking `EMR_BREAK_GLASS` do not see button | Use lower-permission account to verify (if available) |
| AL-07 | "Break glass" opens modal | Modal title: "Break glass — Emergency access"; 3 body children | Click; check |
| AL-08 | Modal contains amber warning banner | Banner: "Emergency access override" / "This action will be logged and audited." | Inspect modal content |
| AL-09 | Modal has "Reason for emergency access" textarea | Required textarea | Confirm field |
| AL-10 | Submit with empty reason — blocked | Guard: `if (!reason.trim()) return` — no request | Leave blank; click Confirm; check network |
| AL-11 | Submit with reason filled | POST fires; `onSuccess` dismisses modal | Fill reason; submit; confirm |
| AL-12 | After break glass, log entry appears | New entry in table with "BREAK GLASS" badge | Submit; reload page; verify row |
| AL-13 | Break glass row has amber background | `bg-amber-50/40` class on `isBreakGlass = true` rows | Inspect row class |
| AL-14 | Break glass row shows "BREAK GLASS" badge | Amber badge in Action column | Confirm badge present |
| AL-15 | Action text formatted: underscores → spaces | `log.action.replace(/_/g, ' ')` | Check rendered action text |
| AL-16 | Log entries show correct time format | `new Date(log.accessedAt).toLocaleString()` | Verify time column format |

---

## Section 13 — Cross-Cutting Checks

| ID | Test | Expected |
|----|------|----------|
| XC-01 | All chart tabs reachable via direct URL | Navigate to each of 8 chart URLs directly; no 404 |
| XC-02 | Meemaw `<Repeat>` used (no raw `.map()` in JSX) | All list renders in chart tabs use `<Repeat>` component | Code confirmed; spot-check rendered output |
| XC-03 | Meemaw `<Show>` used (no raw `&&` for conditional renders) | All conditionals use `<Show>` — exception: raw `&&` inside `<Loadable>` is OK | Code confirmed; spot-check |
| XC-04 | `<Loadable>` wraps all data-fetching screens | Each chart tab has loading + error handling via `<Loadable>` | Throttle network; confirm spinner on each tab |
| XC-05 | Modals open as body's 3rd child | `document.body.childElementCount === 3` when any modal is open | Check on each modal |
| XC-06 | Modal cancel buttons always dismiss | Every modal's Cancel/ghost button calls `DrawerService.dismissAllModals()` | Click Cancel on every modal; confirm |
| XC-07 | No `document.getElementById` or `document.querySelector` in forms | All forms use React state | Code confirmed in all form files read |
| XC-08 | `EMR_MEDICATIONS_WRITE`, `EMR_PROCEDURES_WRITE`, `EMR_IMMUNIZATIONS_WRITE`, `EMR_DOCUMENTS_WRITE`, `EMR_BREAK_GLASS` — all gated correctly | Action buttons hidden without permission | Verify per section above |
| XC-09 | Patient profile Back button functional from all chart tabs | Back button navigates to patient profile not patients list | N/A — chart has breadcrumb, not back button. Verify breadcrumb "Patients" link goes to list |

---

## Known Code Gaps (verify and document during test run)

| ID | Gap | Location | Severity |
|----|-----|----------|----------|
| GAP-EMR-01 | `VitalsForm` has no `onError` handler — silent failure | `vitals-form.tsx` | Medium — user gets no feedback if record fails |
| GAP-EMR-02 | `AddMedicationForm` has no `onError` handler — silent failure | `add-medication-form.tsx` | Medium |
| GAP-EMR-03 | History form does not expose "Other" social field for editing | `history-edit-form.tsx` | Low — by design or oversight? Document actual behavior |
| GAP-EMR-04 | Documents screen has no way to view/download uploaded files | `documents-screen.tsx` — `fileKey` not exposed | Medium — user can upload but not retrieve |
| GAP-EMR-05 | `CheckinForm` closes modal before mutation resolves | `DrawerService.dismissAllModals()` called in `onConfirm`, not in `onSuccess` | Medium — if checkin API fails, modal is already gone; error is invisible |

---

## Screenshots Naming Convention

```
{SECTION}-{ID}-{state}.png

Examples:
  PP-01-profile-loaded.png
  AC-01-checkin-modal-open.png
  VT-09-silent-failure-no-error.png
  DOC-10-upload-toast-error.png
  AL-13-breakglass-amber-row.png
```

---

## Execution Order

1. Pre-flight (PF-01 → PF-05)
2. Patient Profile (PP-01 → PP-13)
3. Profile Actions — Check In (AC-01 → AC-12)
4. Profile Actions — Admitted (AC-13 → AC-20)
5. Chart layout shell (CL-01 → CL-05)
6. Chart Overview (OV-01 → OV-09)
7. Vitals (VT-01 → VT-13)
8. Medications (MED-01 → MED-14)
9. Procedures (PR-01 → PR-10)
10. History (HX-01 → HX-13)
11. Immunizations (IMM-01 → IMM-09)
12. Documents (DOC-01 → DOC-15)
13. Audit / Access Log (AL-01 → AL-16)
14. Cross-cutting (XC-01 → XC-09)

---

## Total Test Cases

| Section | Count |
|---------|-------|
| Pre-flight | 5 |
| Patient Profile | 13 |
| Actions — Check In | 12 |
| Actions — Admitted | 8 |
| Chart Layout Shell | 5 |
| Chart Overview | 9 |
| Vitals | 13 |
| Medications | 14 |
| Procedures | 10 |
| History | 13 |
| Immunizations | 9 |
| Documents | 15 |
| Audit / Access Log | 16 |
| Cross-cutting | 9 |
| **Total** | **161** |
