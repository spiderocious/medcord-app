# Test Plan — Phase 4 (Assets), Phase 5 (Patients), Phase 6 (EMR Chart + Labs)

**Prepared:** 2026-05-16  
**Ref:** cross-cutting-test-plan.md (applies to all tests here)  
**Seed user:** alice@medcord.test / Medcord123!  
**Seed patients:** John Doe, Jane Smith, John Marcus (patient codes discovered at runtime)  
**Screenshots → ** `/Users/feranmi/codebases/2026/medcord-app/screenshots/`

---

## Pre-flight

Before running any tests:

1. Confirm backend is running: `curl http://localhost:8085/api/v1/health`
2. Confirm medcord-web is on 5173: open `http://localhost:5173`
3. Log in as `alice@medcord.test / Medcord123!`
4. Fetch live IDs from API (hospital is `HSP-*`, patient codes are `P-*` — needed for direct URL tests):
   ```
   GET /api/v1/hospitals/:hospitalId/patients
   GET /api/v1/hospitals/:hospitalId/assets
   ```
5. Screenshots directory must exist: `/Users/feranmi/codebases/2026/medcord-app/screenshots/`

---

## Phase 4 — Assets

### A1 — Asset List Screen (`/h/hospital-a/assets`)

#### Render & initial state

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| A1-01 | Screen renders with table | Asset table visible with columns: name, category, status badge, location, asset tag | `agent-browser snapshot`, screenshot |
| A1-02 | Screen with empty DB shows empty state | EmptyState component renders — glyph + italic title + description | Clear all assets via API first, then navigate. Check body text for "No assets" |
| A1-03 | Loading skeleton renders before data arrives | SkLine/SkBlock skeleton rows appear during fetch | Screenshot immediately on navigation |
| A1-04 | "Add Asset" button is present | `AppButton` labelled "Add Asset" visible in page header | `agent-browser snapshot` |
| A1-05 | Status badge style per status | `available` = green, `in_use` = blue, `maintenance` = amber, `retired` = grey | Screenshot; visually check each status row |

**Bug to probe (A1-05):** Status badge colours are raw hex (`#166534`, `#bbf7d0`, etc.) not design token variables. Verify against design system — `StatusPill` from `@medcord/ui` is NOT used; hand-rolled spans are used instead. Document this as a design system violation.

#### Search & filter

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| A1-06 | Search by asset name filters table rows | Typing partial name narrows the table; non-matching rows disappear | Type "wheel" or "syringe" etc. |
| A1-07 | Status filter dropdown filters to matching rows | Selecting `in_use` shows only in-use assets | Use `<select>` dropdown |
| A1-08 | Clear filter button appears only when filter active | "Clear" button absent with no filter; appears with active filter | `agent-browser snapshot` before and after setting filter |
| A1-09 | Clear filter resets to full list | Clicking Clear removes filter chip and shows all rows | Click Clear, verify count matches total |
| A1-10 | Combined: search + status filter narrows correctly | Only assets matching both name and status show | Apply both, check results |

#### Actions

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| A1-11 | Row click navigates to asset detail | URL changes to `/h/hospital-a/assets/:assetId` | `agent-browser eval "window.location.href"` |
| A1-12 | Delete button visible on each row (hover) | "Delete" button present on rows (may need hover) | `agent-browser snapshot` |
| A1-13 | Delete shows `showConfirmationModal` with `destructive: true` | Modal opens: "Delete [asset name]? This action cannot be undone. Cancel / Delete" | `document.body.childElementCount === 3` after click |
| A1-14 | Delete modal cancel — no deletion | Modal closes, asset still in table | Cancel, verify row still present |
| A1-15 | Delete modal confirm — asset removed from table | Row disappears; API confirms 404 on the deleted asset ID | Confirm in modal, verify via API |
| A1-16 | Delete error — red toast if API fails | Red toast with backend error message | Force 500 or test with invalid ID |

**Known bug to document (A1-11):** Same agent-browser click issue as previous modules — row `onClick` may not fire via `.click()`. Use direct URL navigation for the detail screen tests.

---

### A2 — Asset Create Screen (`/h/hospital-a/assets/new`)

#### Form structure

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| A2-01 | Screen renders all fields | Name (required), Category (required), Asset Tag, Condition (dropdown, defaults "good"), Status (dropdown, defaults "available"), Current Location, Manufacturer, Model, Serial Number, Purchase Date, Purchase Price, Warranty Expiry, Notes | `agent-browser snapshot` |
| A2-02 | "Create asset" button disabled until required fields filled | Button disabled with empty name or category | Check `button.disabled` attribute |
| A2-03 | "Cancel" button navigates back to asset list | URL returns to `/h/hospital-a/assets` | Click Cancel, check URL |
| A2-04 | All fields disabled during submission | `disabled` attr on all inputs while loading | Rapidly screenshot during submit |

#### Submission

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| A2-05 | Fill required fields only + create | Redirects to asset detail page; URL is `/h/hospital-a/assets/:newId` | Fill name + category, submit, check URL |
| A2-06 | Fill all optional fields + create | All data preserved in asset detail view | Fill everything, submit, check detail |
| A2-07 | Purchase price accepts decimal values | e.g. `1250.50` stored as number | Fill price, verify in detail screen |
| A2-08 | Purchase price with invalid input | `NaN` or negative not accepted (`min="0"` on input) | Try "-100" and "abc" |
| A2-09 | Duplicate name — backend rejects | If backend returns error, red toast with message | Attempt to create asset with same name |
| A2-10 | Network error shows error toast | Red toast with backend error message (not hardcoded) | Disconnect backend, try submit |

---

### A3 — Asset Detail Screen (`/h/hospital-a/assets/:assetId`)

#### Header & navigation

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| A3-01 | Screen renders asset name and category in heading | `AppText heading-2` with asset name; category subtitle visible | `agent-browser snapshot` |
| A3-02 | Asset tag shown in heading (if set) | "· TAG001" appended next to name | Check with asset that has a tag |
| A3-03 | Back arrow button returns to asset list | Click back → URL `/h/hospital-a/assets` | `agent-browser eval "window.location.href"` |

#### Info form (left panel)

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| A3-04 | Info form pre-filled with asset data | Name, category, condition, manufacturer, model, serial number, notes all match API | Compare form values to API response |
| A3-05 | Edit name + save — API updates | Field editable, save button present, success state after save | Fill new name, click save |
| A3-06 | **Bug to verify:** no success toast after save | `asset-info-form.tsx` has no `toast` on success — form just silently saves. This should show a success toast per cross-cutting rules. | Submit form, check `document.body.childElementCount` — if stays 2, toast is missing |
| A3-07 | Save error shows red toast | Red toast with backend error message | Force error, try save |

#### Status panel (right panel)

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| A3-08 | Current status badge displayed | Status badge styled per status; current location shown | `agent-browser snapshot` |
| A3-09 | "Change status" button opens `showCustomModal` | Modal opens with status dropdown | Click button, check `childElementCount === 3` |
| A3-10 | "Assigned to" field only shown when status is `in_use` | Field hidden for other statuses; appears when in_use selected | Switch dropdown, verify field visibility |
| A3-11 | Change status confirm updates status badge | Badge updates to new status after submit | Change to `in_use`, confirm, check badge |
| A3-12 | Change status error shows red toast | Red toast with backend message | Force error |
| A3-13 | "Move" button opens `showInputModal` | Input modal: "Enter new location" prompt | Click Move, check modal |
| A3-14 | Move modal — empty input does nothing | Blank input → clicking confirm shows no action / no toast | Enter blank, click confirm |
| A3-15 | Move modal — valid location updates and shows location in history | Location history list gains new entry | Enter "Radiology Ward", confirm, check history |
| A3-16 | Move error shows red toast | Red toast | Force error |

#### Location history

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| A3-17 | Location history renders entries sorted by time | Most recent at top; each entry shows location, timestamp, moved-by, optional note | `agent-browser eval "document.body.innerText"` |
| A3-18 | "No movement recorded" shown when history empty | EmptyState or text shown for asset with no moves | Test with new asset |

---

## Phase 5 — Patients

### P1 — Patient List Screen (`/h/hospital-a/patients`)

#### Render & initial state

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| P1-01 | Patient table renders seeded patients | John Doe, Jane Smith, John Marcus shown with name, patient code, DOB, sex, admission status badge, phone | `agent-browser snapshot` |
| P1-02 | Admission status badge correct style | `outpatient` vs `admitted` vs `discharged` have distinct colour styles | Screenshot; verify all three states if possible |
| P1-03 | Total count shown in subtitle | "3 patients" or similar in subtitle | Check page text |
| P1-04 | Empty state shown when no patients | Italic serif glyph + title shown | Filter to return zero results |
| P1-05 | Sidebar "Patients" link only visible with EMR module on | Navigate with module off (use hospital-b); Patients not in sidebar | Check sidebar for hospital-b |

**Known bug to document (P1-02):** Same raw hex colours in `ADMISSION_STYLE` — `#166534`, `#1e40af`, etc. Should be design tokens or `StatusPill` from `@medcord/ui`.

#### Search

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| P1-06 | Search by first name | "John" returns John Doe and John Marcus | Type "John", check rows |
| P1-07 | Search by patient code | Exact code search returns one result | Type patient code, check |
| P1-08 | **Bug to verify:** "Clear" button uses raw `&&` not `<Show>` | In `patient-filters.tsx`, the Clear button is `{q && <AppButton>}` — raw `&&` in JSX. This is a meemaw violation (should be `<Show when={q !== ''}>`) | Inspect source; also test that the button appears and disappears correctly |
| P1-09 | Row click navigates to patient profile | URL: `/h/hospital-a/patients/:code` | Click row (may need JS eval); check URL |

#### Actions

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| P1-10 | "Register patient" button navigates to register screen | URL: `/h/hospital-a/patients/register` | Click button, check URL |

---

### P2 — Patient Register Screen (`/h/hospital-a/patients/register`)

#### Form structure

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| P2-01 | Screen renders demographics section with required fields | First name, Last name, Date of birth, Sex (required); preferred name, gender identity, phone, email, address, religion, cultural preferences (optional) | `agent-browser snapshot` |
| P2-02 | Emergency contact section present | Name, Relationship, Phone fields in separate section | Check page text |
| P2-03 | "Register patient" button state | Disabled until first name, last name, DOB, sex filled | Check `button.disabled` |
| P2-04 | "Cancel" navigates back to patient list | URL returns to `/h/hospital-a/patients` | Click Cancel, check URL |
| P2-05 | All fields disabled during submission | `disabled` on all inputs while loading | Screenshot during submit |

#### Submission — no duplicates

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| P2-06 | Register new patient (unique name/DOB) | Success toast shown; redirect to patient profile | Fill unique data (e.g. "Test Patient", 2000-01-01), submit |
| P2-07 | Patient code auto-assigned and visible in profile header | `P-XXXXXXXX` code shown on profile page | Check profile after redirect |
| P2-08 | **Bug to verify:** no `onError` handler — registration errors silently discarded | If submission fails, no error shown to user. The mutation has no `onError` callback. | Force error (network off), submit, verify no feedback |

#### Submission — duplicates detected

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| P2-09 | Registering patient with same name + near DOB triggers duplicate warning modal | `showCustomModal` opens with `DuplicateWarning` — shows count of existing matches, "Register anyway" and "Go back" | Register "John Doe", DOB 1990-03-15 again |
| P2-10 | "Go back" in duplicate modal closes modal only | URL stays on register screen; form still populated | Click Go back, check modal gone |
| P2-11 | "Register anyway" proceeds and redirects to new patient profile | New patient created even with duplicate; redirect to profile | Click Register anyway, check URL |
| P2-12 | **Bug to verify:** `pendingPatient` and `duplicates` state in `patient-register-screen.tsx` are set but never read | These are dead state variables — set in the mutation success handler but never used in render. Verify by checking that the register-anyway path still works correctly despite the dead state. | Trigger duplicate path, register anyway, verify redirect works |

---

### P3 — Patient Profile Screen (`/h/hospital-a/patients/:code`)

#### Header

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| P3-01 | Profile renders patient name, code, and admission badge | "John Doe · P-XXXXXXXX" with status badge in header | `agent-browser snapshot` |
| P3-02 | Preferred name shown when set | "(Preferred: Johnny)" line visible if preferredName set | Register patient with preferredName, check profile |
| P3-03 | "View chart" button navigates to chart overview | URL: `/h/hospital-a/patients/:code/chart` | Click button, check URL |
| P3-04 | Favorite button renders "Favorite" initially | Star icon button with label "Favorite" | Check button text |
| P3-05 | **Bug to verify:** `isFavorited` hardcoded as `false` — unfavoriting is impossible | In `patient-profile-screen.tsx:60`, `<ProfileHeader ... isFavorited={false} />` is hardcoded. Clicking "Favorite" always sends `{ favorite: true }`. Clicking again does not unfavorite. | Click Favorite, verify star appears to activate; click again, verify it does NOT unfavorite (stays favorited or resets — confirm which) |
| P3-06 | Favorite button shows loading state during mutation | Button disabled/spinner while in flight | Screenshot immediately after click |

#### Demographics section

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| P3-07 | All filled demographics displayed | DOB, sex, phone, email, address, religion, cultural preferences, gender identity shown | Compare to registered data |
| P3-08 | Optional fields show "—" when not set | Empty optional fields render dash placeholder, not blank/error | Check a field not filled during registration |
| P3-09 | Emergency contact section shown when set | Name, relationship, phone displayed | Register patient with emergency contact, check profile |
| P3-10 | Emergency contact hidden when not set | Section absent or shows "None on record" | Confirm with patient without emergency contact |
| P3-11 | Guarantor section shown when set | Name, relationship, phone, address displayed | Check if any seeded patient has guarantor (likely none) |

#### ID Card panel

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| P3-12 | No active ID card state — "No active ID card" and "Issue ID card" button | Correct empty state; button present | Navigate to profile of patient with no card |
| P3-13 | "Issue ID card" button — success toast + ID card appears | Card becomes active; issue date shown; Reissue + Deactivate buttons appear | Click Issue, check body text for dates |
| P3-14 | "Reissue" button re-issues the ID card | Success toast; reissued date updates | Click Reissue on an active card |
| P3-15 | "Deactivate" button shows destructive confirmation modal | Modal: "Deactivate ID card? ... Cancel / Deactivate" | Click Deactivate, check `childElementCount === 3` |
| P3-16 | Deactivate confirm — card deactivated | Card section reverts to "No active ID card" state | Confirm in modal, check state |
| P3-17 | **Bug to verify:** `idCard.issuedAt!` non-null assertion | If API returns a card with `isActive: true` but `issuedAt: null`, the non-null assertion causes a runtime crash. Document if API can return this state. | Verify with API; if possible force null issuedAt |

#### Patient actions — outpatient

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| P3-18 | Outpatient patient shows "Check in" and "Admit" buttons | Two buttons visible; no "Discharge" or "Transfer" | Check body text for action buttons |
| P3-19 | "Check in" opens modal with department and assigned-to fields | `showCustomModal` — form with Dept and Assigned To inputs | Click Check in, check `childElementCount === 3` |
| P3-20 | **Bug to verify:** Check in form uses `document.getElementById('dept')` — DOM query not React state | `CheckinForm` in `profile-actions.tsx` reads input values via `document.getElementById`. This means if the DOM ID conflicts or the modal re-renders, stale values could be read. | Check in with a department value; verify the department is actually sent to the API (check API call or patient state after) |
| P3-21 | Check in empty department — still submits | No validation on department (sent as empty string → `undefined`) | Submit with blank dept, verify patient status changes |
| P3-22 | Check in success — admission status badge changes to "admitted" | Badge updates; Admit button disappears; Check out/Discharge/Transfer appear | Complete check-in, check UI |
| P3-23 | "Admit" opens modal with department (required), assigned-to, notes | Modal opens; submitting with blank dept does nothing silently (no feedback) | Click Admit; try empty dept submit |

#### Patient actions — admitted

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| P3-24 | Admitted patient shows "Check out", "Discharge", "Transfer" | Three buttons visible; no "Check in" or "Admit" | Check admitted patient |
| P3-25 | "Check out" shows non-destructive confirmation modal | Modal: "Check out patient? ... Cancel / Check out" | Click Check out, check modal |
| P3-26 | Check out confirm — patient goes back to outpatient | Admission badge updates; Check in + Admit buttons reappear | Confirm, check UI |
| P3-27 | "Discharge" shows destructive confirmation modal | Modal: "Discharge patient? This action ... Cancel / Discharge" with `destructive: true` styling | Click Discharge, check modal style |
| P3-28 | Discharge confirm — patient status → "discharged" | Badge shows Discharged; Re-admit button appears | Confirm, check UI |
| P3-29 | "Transfer" opens modal with destination hospital ID (required) and reason (required) | Modal opens with `toHospitalId` and `reason` inputs | Click Transfer, check modal |
| P3-30 | **Bug to verify:** Transfer form uses `document.getElementById('toHospId')` and `document.getElementById('transferReason')` | Same DOM query anti-pattern as check-in. Verify values are correctly sent. | Fill transfer form with valid hospital ID (use HSP-* of Hospital B), check if API call made |
| P3-31 | Transfer empty fields — silent no-op | Empty required fields → button click does nothing | Try Transfer with blank fields |

#### Patient actions — discharged

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| P3-32 | Discharged patient shows "Re-admit (check in)" button only | One button visible | Check discharged patient |
| P3-33 | Re-admit triggers check-in flow | Same Check in modal; on success, status → outpatient or admitted | Click Re-admit, complete flow |

#### Cross-cutting: `&&` in JSX

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| P3-34 | **Profile body uses raw `&&`** — `{patient && (...)}` and `{idCardData && <IdCardPanel />}` | Source-level meemaw violation. Test functionally: if `patient` is null after load, screen renders nothing silently. | Document in report; also test error state (bad patient code URL) |

---

## Phase 6 — EMR Chart

All chart tests use John Doe's patient code. Navigate to `/h/hospital-a/patients/:code/chart` first.

### E0 — Chart Layout (shared)

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| E0-01 | Tab bar renders all 8 tabs | Overview, Vitals, Medications, History, Procedures, Immunizations, Documents, Audit | `agent-browser snapshot` |
| E0-02 | Active tab is highlighted | Selected tab has distinct active style | Check current tab styling |
| E0-03 | Clicking each tab navigates to correct URL | Overview = `/chart`, Vitals = `/chart/vitals`, etc. | Click each tab, verify `window.location.href` |
| E0-04 | Patient name and code shown in breadcrumb | "John Doe · P-XXXXXXXX" visible in layout header | Check breadcrumb text |
| E0-05 | **Bug to document:** `TABS.map()` in `chart-layout.tsx` | Raw `.map()` in JSX render — meemaw violation; should be `<Repeat>` | Source review; document in report |

---

### E1 — Chart Overview (`/h/hospital-a/patients/:code/chart`)

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| E1-01 | Empty state: "No vitals recorded" shown when no vitals | Seeded patients have no vitals — overview should show empty vitals card | Screenshot; check body text |
| E1-02 | Active medications count shown (0 initially) | "0 active medications" or similar | Check count |
| E1-03 | Diagnoses count shown (0 initially) | "0 diagnoses" or similar | Check count |
| E1-04 | Recent procedures shown (empty initially) | Empty procedures section or "No recent procedures" | Check section |
| E1-05 | After recording vitals, overview updates | Last vitals card shows most recent recording | Record vitals in E2, return to overview |
| E1-06 | Out-of-range vitals show alert badge | Red alert indicator visible when any vital is outside normal range | Record vitals with SpO₂ = 85 (low), verify alert |
| E1-07 | **Bug to probe:** double `&&` guard | `Show when={summary.lastVitals !== null}` + inner `{summary.lastVitals && (...)}` — redundant. Document and verify functionally correct. | Check that vitals section appears after recording vitals |
| E1-08 | Loading state shows during fetch | Skeleton or spinner visible briefly on navigation | Screenshot immediately |

---

### E2 — Vitals Screen (`/h/hospital-a/patients/:code/chart/vitals`)

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| E2-01 | Empty state "No vitals recorded yet" with "Record vitals" button | Correct empty state for new chart | `agent-browser snapshot` |
| E2-02 | "Record vitals" opens `showCustomModal` with all vital fields | Modal has: systolic BP, diastolic BP, HR, RR, temp, SpO₂, weight, height, pain score (all optional) | Click button, check `childElementCount === 3` |
| E2-03 | Submit fully empty vitals form | All fields blank — mutation fires; should probably still create a vitals record (all null) | Submit, check if API call made |
| E2-04 | Record vitals with some fields filled | E.g. BP 120/80, HR 72, temp 36.6, SpO₂ 98 — submit; row appears in table | Fill partial vitals, submit, check table |
| E2-05 | Success: modal closes + table refreshes + toast shown | Row appears; toast fires | Check `childElementCount` drops back to 2 + toast text |
| E2-06 | **Bug to verify:** no error handling in VitalsForm | If `mutation.mutate` fails, error is silently swallowed. No toast, no inline error. | Force error, submit vitals, verify nothing shown |
| E2-07 | Out-of-range vitals show alert icon on row | SpO₂ = 85 or HR = 200 shows red/orange icon | Record out-of-range value, check row |
| E2-08 | Vitals table columns: date, BP, HR, temp, SpO₂, weight | All columns present; empty cells show "—" | Check table headers |
| E2-09 | **Bug to document:** `VitalsForm` uses `.map()` in JSX | Meemaw violation — `.map()` over vitals field array in the form render. Source-level only. | Document in report |

---

### E3 — Medications Screen (`/h/hospital-a/patients/:code/chart/medications`)

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| E3-01 | Empty state "No medications recorded" + "Add medication" button | Correct empty state | `agent-browser snapshot` |
| E3-02 | "Add medication" opens modal with: drug (required), strength, route, frequency, indication, duration | All fields present | Check modal |
| E3-03 | Submit with empty drug name — silent no-op | Nothing happens; modal stays open | Click submit with empty drug |
| E3-04 | Submit valid medication | Drug appears in list with status "Active"; toast shown | Fill drug name, submit |
| E3-05 | Medication row shows: drug name, strength/route/frequency (dot-separated), indication, prescriber, status badge | Correct layout | Check row after E3-04 |
| E3-06 | **Bug to verify:** Update medication uses `document.getElementById('medStatus')` and `document.getElementById('medReason')` | DOM query anti-pattern. Verify values are sent correctly: select "Discontinued", enter reason, confirm. | Click "Update" on a medication, change status, submit |
| E3-07 | Update medication — success toast + status badge updates | Badge changes from "Active" to "Discontinued" or "On hold" | Complete E3-06, check badge |
| E3-08 | Status badges have distinct styles | Active = green, On hold = amber, Discontinued = grey — all raw hex, not tokens | Screenshot; document violation |
| E3-09 | **Bug to document:** no error handling in AddMedicationForm | Mutation failure silently discarded | Force error; document |

---

### E4 — History Screen (`/h/hospital-a/patients/:code/chart/history`)

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| E4-01 | Empty sections render gracefully | Diagnoses (empty list), Social history (all "—"), Family history (empty), Notes (—) | `agent-browser snapshot` |
| E4-02 | "Edit" button opens `showCustomModal` with social history form | Modal has smoking, alcohol, occupation, notes fields | Click Edit, check modal |
| E4-03 | Edit is disabled when `history` is null (loading) | Button `disabled={!history}` — confirm it's disabled while loading | Screenshot on page load |
| E4-04 | Submit social history update — toast + history refreshes | Fields update in the view | Fill smoking = "Non-smoker", submit, check display |
| E4-05 | **Bug to verify:** `history.socialHistory.other` shown in view but NOT editable | The edit form has smoking/alcohol/occupation but no `other` field. If `other` is set, it cannot be edited via this form. | Check if `other` field appears in history view |
| E4-06 | **Bug to document:** `useEffect` imported but unused in history-screen.tsx | Dead import. Document in report. | Source-level only |
| E4-07 | **Bug to document:** `history` used with raw `&&` — `{history && (...)}` | Meemaw violation. Document. | Source-level only |

---

### E5 — Procedures Screen (`/h/hospital-a/patients/:code/chart/procedures`)

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| E5-01 | Empty state "No procedures recorded" + "Record procedure" button | Correct empty state | `agent-browser snapshot` |
| E5-02 | "Record procedure" opens modal with: name (required), performed by (required), date (required), CPT code, location, notes, pre-op checklist (4 checkboxes) | All fields present; checklist items: Consent obtained, NPO status, Allergies confirmed, Site marked | Check modal |
| E5-03 | Submit with empty required fields — silent no-op | Nothing happens | Click submit with blank name |
| E5-04 | Submit valid procedure with all required + some optional | Procedure appears in list; toast shown | Fill name, performedBy, date; submit |
| E5-05 | Pre-op checklist checkboxes work | Each checkbox toggleable | Click each checkbox |
| E5-06 | Procedure row shows: name, CPT code, date, performer, location, notes | Correct data in row | Check after E5-04 |
| E5-07 | **Bug to document:** `AddProcedureForm` uses `.map()` over checklist items | Meemaw violation. Document. | Source-level only |

---

### E6 — Immunizations Screen (`/h/hospital-a/patients/:code/chart/immunizations`)

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| E6-01 | Empty state "No immunizations recorded" + "Record immunization" button | Correct empty state | `agent-browser snapshot` |
| E6-02 | "Record immunization" opens modal with: vaccine (required), dose, administered date (required), administrator (required), lot number, next due date | All fields present | Check modal |
| E6-03 | Submit with empty required fields — silent no-op | Nothing happens | Try submit with blank vaccine |
| E6-04 | Submit valid immunization | Immunization appears in table; toast shown | Fill vaccine = "COVID-19 mRNA", date, administrator; submit |
| E6-05 | Table columns: vaccine, dose, date, next due, administrator | All columns correct; next due shows "—" when not set | Check after E6-04 |

---

### E7 — Documents Screen (`/h/hospital-a/patients/:code/chart/documents`)

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| E7-01 | Empty state "No documents uploaded" + "Upload document" button | Correct empty state | `agent-browser snapshot` |
| E7-02 | "Upload document" opens modal with: title (required), category dropdown, file picker, "Mark as sensitive" checkbox | All fields present | Check modal |
| E7-03 | Category options: referral, lab_report, imaging, consent, other | All five present in dropdown | Check `<select>` options |
| E7-04 | File picker accepts file selection | File input responds to file | Test with a real file |
| E7-05 | "Mark as sensitive" checkbox works | Checkbox toggleable | Check/uncheck it |
| E7-06 | Upload success — document appears in list; toast shown | Title, category, date, Sensitive indicator (if checked) in list | Upload a file, check list |
| E7-07 | **Critical bug to verify:** hardcoded production URL `https://go-file-service-production.up.railway.app` | `documents-screen.tsx` has `const FILE_SERVICE = 'https://go-file-service-production.up.railway.app'` — no env var. Must work in QA env (it calls a live Railway service) but should be `VITE_FILE_SERVICE_URL`. Document as config violation. | Attempt upload; if service is live, upload succeeds. If not, observe error handling. |
| E7-08 | File upload failure shows error toast | Red toast with error message | Simulate by uploading invalid file type or disconnecting |
| E7-09 | **Bug to document:** no document download/view link | Documents are uploaded but have no "Download" or "View" button. `fileKey` is stored but not exposed in the UI. | Check list item for any action buttons |
| E7-10 | **Bug to document:** `CATEGORY_OPTIONS.map()` in JSX | Meemaw violation in modal. | Source-level only |

---

### E8 — Audit Log Screen (`/h/hospital-a/patients/:code/chart/audit`)

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| E8-01 | Access log renders with entries (generated from prior test activity) | After testing E1–E7, audit log should have entries for view_chart, view_vitals, etc. | `agent-browser snapshot` |
| E8-02 | Log row shows: time, user, action (underscore replaced with spaces), section | "view vitals" not "view_vitals" (`.replace(/_/g, ' ')`) | Check row text |
| E8-03 | "BREAK GLASS" badge shown on emergency access rows | Amber-highlighted row with "BREAK GLASS" label | Look for any existing break glass rows; if none, proceed to E8-04 |
| E8-04 | "Break glass" button opens `showCustomModal` | Modal with reason textarea and confirm button | Click button, check `childElementCount === 3` |
| E8-05 | **Bug to verify:** `BreakGlassForm` reads textarea value via `document.getElementById('breakGlassReason')` | DOM query anti-pattern. Enter a reason, confirm — verify reason is sent in API call body. | Fill reason text, click confirm, check log refreshes with break glass entry |
| E8-06 | Break glass cancel — no log entry created | Modal closes; log unchanged | Click cancel |
| E8-07 | Break glass confirm — warning toast shown (not success) | Amber/warning-type toast, not green success | Confirm break glass, check toast colour |
| E8-08 | Break glass log entry highlighted in amber | Row after confirmation has amber background | Check `bg-amber-50/40` class on new row |
| E8-09 | Empty state: "No access events recorded" | Text shown for brand-new chart | Check on a patient never accessed |

---

## Phase 6 — Labs

### L1 — Lab Orders Screen (`/h/hospital-a/labs`)

#### Render & initial state

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| L1-01 | Lab orders table renders (empty initially for seeded DB) | Empty state with "No lab orders found" + "New order" button | `agent-browser snapshot` |
| L1-02 | Sidebar "Labs" only visible when `modules.labs === true` | Navigate to hospital-b (labs off); Labs not in sidebar | Check Hospital B sidebar |
| L1-03 | Loading state shows during fetch | Skeleton/spinner visible | Screenshot immediately |
| L1-04 | Table columns after orders exist: test name, test code, priority badge, status badge, ordered by, date | Correct columns present | Create order, check table |

#### Status filter

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| L1-05 | Status filter dropdown shows all statuses | awaiting_sample, sample_received, awaiting_test, in_progress, awaiting_result, result_ready, result_released | Check `<select>` options |
| L1-06 | Selecting status filters table | Only orders with that status shown | Create 2 orders, filter by one status |
| L1-07 | **Bug to document:** no "Clear filter" button — select stays on chosen status unless user manually resets | Selecting "" clears the filter (dropdown goes back to all) — this is less obvious UX than a Clear button. Document. | Try to reset; verify selecting blank option works |

#### Create order

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| L1-08 | "New order" button opens `showCustomModal` | Modal with fields: test name (required), test code, category, priority (routine/urgent/stat), sample type, notes | Click button, check modal |
| L1-09 | Submit with empty test name — silent no-op | Nothing happens | Try submit with blank test name |
| L1-10 | Submit valid order | Order appears in table; toast shown | Fill "CBC", priority = routine, submit |
| L1-11 | Priority badge styles | Routine = grey, Urgent = amber, STAT = red — all raw hex currently. Document. | Screenshot after creating orders with each priority |
| L1-12 | Status badge correct for new order | New orders start as `awaiting_sample` | Check badge on newly created order |
| L1-13 | **Critical bug to verify:** `patientId=""` hardcoded for all orders created from hospital-wide lab screen | `lab-orders-screen.tsx` passes `patientId=""` to `CreateLabOrderForm`. All orders created here will have no patient association. | Create an order; check API response — verify `patientId` in stored order |
| L1-14 | **Bug to document:** `Object.keys(STATUS_LABEL).map()` in JSX | Meemaw violation in status filter. | Source-level only |

---

## Cross-Cutting Checks for Phases 4–6

Run these after completing functional tests.

### CC — Meemaw Violations (compile list for report)

| ID | File | Violation | Severity |
|----|------|-----------|----------|
| CC-01 | `chart-layout.tsx` | `TABS.map()` in JSX render | Medium |
| CC-02 | `vitals-screen.tsx` | Vitals fields array `.map()` in VitalsForm render | Medium |
| CC-03 | `history-screen.tsx` | Social history fields `.map()` in HistoryEditForm render | Medium |
| CC-04 | `procedures-screen.tsx` | Pre-op checklist `.map()` in AddProcedureForm render | Medium |
| CC-05 | `documents-screen.tsx` | `CATEGORY_OPTIONS.map()` in UploadDocumentForm render | Medium |
| CC-06 | `lab-orders-screen.tsx` | `Object.keys(STATUS_LABEL).map()` in status filter render | Medium |
| CC-07 | `patient-filters.tsx` | `{q && <AppButton>Clear</AppButton>}` — raw `&&` in JSX | High |
| CC-08 | `asset-detail-screen.tsx` | `{data && (...)}` inside `<Loadable>` | Medium |
| CC-09 | `patient-profile-screen.tsx` | `{patient && (...)}` and `{idCardData && <IdCardPanel/>}` inside `<Loadable>` | Medium |
| CC-10 | `history-screen.tsx` | `{history && (...)}` inside `<Loadable>` | Medium |
| CC-11 | `profile-actions.tsx` | Three raw `&&` JSX branches for admission status | High |

### CC — Color Token Violations

| ID | File | Tokens Used | Violation |
|----|------|-------------|-----------|
| CC-12 | `asset-table.tsx` | `#166534`, `#bbf7d0`, `#f0fdf4`, `#1e40af`, `#bfdbfe`, `#eff6ff`, `#92400e`, `#fde68a`, `#fffbeb` | Raw hex in `style=` or Tailwind arbitrary values |
| CC-13 | `asset-status-panel.tsx` | Same palette as above | Same |
| CC-14 | `patient-table.tsx` | Same palette | Same |
| CC-15 | `profile-header.tsx` | Same palette | Same |
| CC-16 | `id-card-panel.tsx` | `#166534`, `#bbf7d0`, `#f0fdf4` | Tailwind arbitrary values in `className` |
| CC-17 | `medications-screen.tsx` | Same palette for status styles | Same |
| CC-18 | `lab-orders-screen.tsx` | Priority and status badge palette | Same |

**Recommendation:** All status badge styling should use the `StatusPill` component from `@medcord/ui` (variant: `ok`, `warn`, `crit`, `default`) or design token CSS variables. The `Table.StatusPill` from `@medcord/ui` already handles these four variants with proper token colours.

### CC — Icon Imports

| ID | Check | Expected |
|----|-------|----------|
| CC-19 | No `from 'lucide-react'` imports in any phase 4–6 feature file | All icons via `@icons` proxy |

Run: `grep -r "from 'lucide-react'" apps/medcord-web/src/features/assets apps/medcord-web/src/features/patients apps/medcord-web/src/features/emr apps/medcord-web/src/features/labs`

### CC — FSD Structure Violations

| ID | File | Issue |
|----|------|-------|
| CC-20 | `vitals-screen.tsx` | `VitalsForm` defined inline — should be `vitals/screen/parts/vitals-form.tsx` |
| CC-21 | `medications-screen.tsx` | `AddMedicationForm` defined inline — should be `medications/screen/parts/add-medication-form.tsx` |
| CC-22 | `history-screen.tsx` | `HistoryEditForm` defined inline — should be `history/screen/parts/history-edit-form.tsx` |
| CC-23 | `procedures-screen.tsx` | `AddProcedureForm` defined inline — should be `procedures/screen/parts/add-procedure-form.tsx` |
| CC-24 | `immunizations-screen.tsx` | `AddImmunizationForm` defined inline — should be `immunizations/screen/parts/add-immunization-form.tsx` |
| CC-25 | `documents-screen.tsx` | `UploadDocumentForm` defined inline — should be `documents/screen/parts/upload-document-form.tsx` |
| CC-26 | `access-log-screen.tsx` | `BreakGlassForm` defined inline — should be `access-log/screen/parts/break-glass-form.tsx` |
| CC-27 | `lab-orders-screen.tsx` | `CreateLabOrderForm` defined inline — should be `lab-orders/screen/parts/create-lab-order-form.tsx` |

### CC — Critical Bug Catalogue (not functional failures but must document)

| ID | Bug | File | Severity |
|----|-----|------|----------|
| CC-28 | `isFavorited` hardcoded as `false` — cannot unfavorite a patient | `patient-profile-screen.tsx:60` | P1 |
| CC-29 | DOM queries via `document.getElementById` instead of React state | `profile-actions.tsx`, `medications-screen.tsx`, `access-log-screen.tsx` | P1 |
| CC-30 | Hardcoded production file service URL | `documents-screen.tsx` | P1 |
| CC-31 | `patientId=""` for all hospital-wide lab orders | `lab-orders-screen.tsx` | P1 |
| CC-32 | No error handling on `useRegisterPatient` | `patient-register-screen.tsx` | P1 |
| CC-33 | Dead state: `pendingPatient` and `duplicates` set but never read | `patient-register-screen.tsx` | P2 |
| CC-34 | Dead prop: `slug` declared but unused in `ProfileActions` | `profile-actions.tsx` | P3 |
| CC-35 | Dead import: `useEffect` unused in `history-screen.tsx` | `history-screen.tsx` | P3 |
| CC-36 | No success toast after asset info save in `asset-info-form.tsx` | `asset-info-form.tsx` | P2 |
| CC-37 | Duplicate `useUpdateAssetStatus` instances in `asset-status-panel.tsx` | `asset-status-panel.tsx` | P3 |
| CC-38 | No document view/download link in Documents screen | `documents-screen.tsx` | P2 |
| CC-39 | Silent no-op on required-field validation failures across all EMR forms | Multiple screen files | P2 |
| CC-40 | No success toast on asset info form save | `asset-info-form.tsx` | P2 |
| CC-41 | `@medcord/ui` `Table` and `StatusPill` components not used — all tables and badges are hand-rolled | All list screens | P2 |

### CC — Confirmation Modal Catalog

Verify all destructive actions have a modal with `destructive: true`:

| Action | Screen | Expected modal | Must verify |
|--------|--------|---------------|-------------|
| Delete asset | Asset list / Asset table | `showConfirmationModal({ destructive: true })` | Yes |
| Deactivate ID card | Patient profile | `showConfirmationModal({ destructive: true })` | Yes |
| Discharge patient | Patient profile actions | `showConfirmationModal({ destructive: true })` | Yes |
| Check out patient | Patient profile actions | `showConfirmationModal({ destructive: false })` | Yes |

Non-destructive modals (verify fire and fire correctly):
- Change asset status → `showCustomModal` (status dropdown)
- Move asset → `showInputModal`
- Check in / Admit / Transfer → `showCustomModal` (form)
- Record vitals → `showCustomModal`
- Add medication → `showCustomModal`
- Update medication status → `showCustomModal` (inline in screen)
- Edit history → `showCustomModal`
- Record procedure → `showCustomModal`
- Record immunization → `showCustomModal`
- Upload document → `showCustomModal`
- Break glass → `showCustomModal`
- Create lab order → `showCustomModal`

---

## Test Execution Order

Execute in this order to build state for dependent tests:

1. **A2-05** — Create an asset (needed for A3 tests)
2. **A1** — Test list screen (needs at least one asset)
3. **A3** — Test detail screen
4. **P1** — Patient list (seeded patients exist)
5. **P2-06** — Register a new patient (for clean profile tests)
6. **P3** — Patient profile (use seeded patients for admission flow; new patient for registration flow)
7. **P3-13** — Issue ID card (needed for P3-15, P3-16)
8. **P3-22** — Check in patient (needs outpatient; transitions to admitted)
9. **E0–E8** — All chart tabs (use John Doe; record data in order: vitals → meds → procedures → immunizations → documents)
10. **E1-05** — Return to overview after recording vitals (verifies refresh)
11. **E8** — Audit log (run last; log is richest after all chart activity)
12. **L1-10** — Create lab order (needed for L1-05/L1-06 filter tests)

---

## Screenshots Naming Convention

```
phase4-asset-list.png
phase4-asset-list-empty.png
phase4-asset-create-form.png
phase4-asset-create-success.png
phase4-asset-detail.png
phase4-asset-change-status-modal.png
phase4-asset-move-modal.png
phase4-asset-location-history.png
phase4-asset-delete-modal.png

phase5-patient-list.png
phase5-patient-register-form.png
phase5-patient-register-duplicate-modal.png
phase5-patient-profile.png
phase5-patient-profile-id-card-empty.png
phase5-patient-profile-id-card-active.png
phase5-patient-profile-id-card-deactivate-modal.png
phase5-patient-profile-checkin-modal.png
phase5-patient-profile-admit-modal.png
phase5-patient-profile-checkout-modal.png
phase5-patient-profile-discharge-modal.png
phase5-patient-profile-transfer-modal.png

phase6-chart-overview-empty.png
phase6-chart-overview-with-vitals.png
phase6-vitals-empty.png
phase6-vitals-record-modal.png
phase6-vitals-with-data.png
phase6-vitals-out-of-range.png
phase6-medications-empty.png
phase6-medications-add-modal.png
phase6-medications-update-modal.png
phase6-history.png
phase6-history-edit-modal.png
phase6-procedures-empty.png
phase6-procedures-add-modal.png
phase6-immunizations-empty.png
phase6-immunizations-add-modal.png
phase6-documents-empty.png
phase6-documents-upload-modal.png
phase6-audit-log.png
phase6-audit-break-glass-modal.png
phase6-audit-break-glass-row.png

phase6-labs-empty.png
phase6-labs-new-order-modal.png
phase6-labs-with-orders.png
```

---

## Total Test Count

| Phase | Functional | Bug checks | CC | Total |
|-------|-----------|------------|-----|-------|
| Phase 4 — Assets | 36 | 5 | — | 41 |
| Phase 5 — Patients | 33 | 10 | — | 43 |
| Phase 6 — EMR Chart | 42 | 12 | — | 54 |
| Phase 6 — Labs | 14 | 3 | — | 17 |
| Cross-cutting | — | — | 41 | 41 |
| **Total** | **125** | **30** | **41** | **196** |
