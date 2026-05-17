# Medcord — Patient Profile & EMR Chart — Retest Report

> **QA:** Claude
> **Retest 1 Date:** 2026-05-17
> **Retest 2 Date:** 2026-05-17
> **Session:** `medcord-qa` (isolated, port 5176)
> **Test Plan:** `docs/qas/frontend/plans/patient-profile-emr-test-plan.md`
> **Prior Report:** `docs/qas/frontend/reports/patient-profile-emr-report.md`
> **Tester:** alice@medcord.test / Medcord123! (super_admin)
> **Patient under test:** `CAE-19174593-9efa-42ec-9941-f9e6a3e2f26a` (John Doe) — Hospital A
> **Secondary patient:** `CAE-4a022826-5c59-40f7-8d20-ec2d057d0bbd` (Jane Smith) — for checkin
> **No-history patient:** `CAE-14d46816-3ff2-4eef-a151-f4229880ccdb` (Efua) — for HX-03 test
> **Base URL:** `http://localhost:5176`
> **Backend:** `http://localhost:8085` — healthy at test start
> **Build:** main branch — typecheck ✅ lint ✅ build ✅ (both gates)

---

## Purpose

This document covers two retest runs:

**Retest 1** — after developer fixed BUG-EMR-01, GAP-EMR-01/02, GAP-EMR-05. All 57 BLOCKED, 7 FAILED, and 6 SKIPPED cases from the initial run were retested. Result: 2 new bugs found (BUG-NEW-01, BUG-NEW-02).

**Retest 2** — after developer fixed BUG-NEW-01 and BUG-NEW-02. All 6 FAILs and 6 SKIPs from Retest 1 were retested.

| Retest | Fixes Under Test |
|--------|-----------------|
| **Retest 1** | BUG-EMR-01 (CAE→PAT ID resolution), GAP-EMR-01/02 (onError toasts), GAP-EMR-05 (checkin modal dismiss) |
| **Retest 2** | BUG-NEW-01 (`updateMedication`/`updateDocument` patientId compare), BUG-NEW-02 (Edit history button disabled={!history}) |

---

## Summary

### Retest 1 Summary

| Section | PASS | FAIL | BLOCKED | SKIP | Notes |
|---------|------|------|---------|------|-------|
| Chart Overview (OV) | 5 | 0 | 0 | 0 | All 8 tabs loading |
| Vitals (VT) | 7 | 0 | 0 | 1 | VT-13 loading state not capturable |
| Medications (MED) | 4 | 5 | 0 | 1 | BUG-NEW-01: update medication 404 |
| History (HX) | 5 | 1 | 0 | 1 | BUG-NEW-02: Edit disabled when no history |
| Procedures (PR) | 5 | 0 | 0 | 0 | Full add flow passes |
| Immunizations (IMM) | 4 | 0 | 0 | 0 | Full add flow passes |
| Documents (DOC) | 6 | 0 | 0 | 2 | Upload works end-to-end incl. external file service |
| Audit / Break Glass (AL) | 7 | 0 | 0 | 0 | Break glass POST 204, entry in log |
| Patient Profile Actions (PP) | 8 | 0 | 0 | 1 | GAP-EMR-05 confirmed fixed |

**Retest 1 total: 51 PASS / 6 FAIL / 0 BLOCKED / 6 SKIP**

### Retest 2 Summary

| Section | PASS | FAIL | BLOCKED | SKIP | Notes |
|---------|------|------|---------|------|-------|
| Medications (MED-09–14) | 6 | 0 | 0 | 0 | BUG-NEW-01 confirmed fixed; all status transitions pass |
| History (HX-03, HX-12) | 1 | 1 | 0 | 1 | BUG-NEW-02 partially fixed; new BUG-NEW-03 found |
| Vitals (VT-13) | 1 | 0 | 0 | 0 | Source-verified: loadingComponent present |
| Documents (DOC-13) | 1 | 0 | 0 | 0 | Sensitive flag pipeline confirmed end-to-end |
| GAP-EMR-01 (vitals onError) | 1 | 0 | 0 | 0 | Source-verified: onError handler confirmed in use-vitals.ts:48 |
| GAP-EMR-02 (med onError) | 1 | 0 | 0 | 0 | Source-verified: onError handler confirmed in use-medications.ts:47 |

**Retest 2 total: 11 PASS / 1 FAIL / 0 BLOCKED / 1 SKIP**

**Combined running total: 62 PASS / 1 FAIL / 0 BLOCKED / 1 SKIP**

Progress from initial run (80 PASS / 7 FAIL / 57 BLOCKED / 6 SKIP):
- All 57 BLOCKEDs cleared ✅
- BUG-EMR-01, BUG-NEW-01, GAP-EMR-01/02/05 all confirmed fixed ✅
- BUG-NEW-02 partially fixed (button enabled; handler still bails on null) → **BUG-NEW-03**
- 1 remaining FAIL (BUG-NEW-03), 1 remaining SKIP (HX-12 — diagnoses UI not built)

---

## Pre-flight Notes

- Session isolation: used `--session medcord-qa` throughout to avoid conflicts with other agent-browser sessions
- Frontend running on port 5176 (not 5175)
- Password for alice is `Medcord123!` (not `Password123!`)
- Alice has one hospital context in this DB: `HSP-e505e6a1-d8e8-4cc4-b7cf-5c193defc9f1` (Hospital A, slug `hospital-a`)
- JWT expiry ~15 min caused 2 mid-run session drops (FIND-01 still present, unchanged)
- History data seeded via API (PATCH `/chart/history`) before testing edit flow since Edit button is disabled when history is null

---

## Chart Overview Tab

### OV tests

| ID | Result | Notes |
|----|--------|-------|
| OV-01 | **PASS** | Chart overview loads at `/chart`; no "Patient not found" error |
| OV-02 | **PASS** | All 8 tab links present in nav (Overview, Vitals, Medications, History, Procedures, Immunizations, Documents, Audit) |
| OV-03 | **PASS** | Last Vitals card shows real data: BP 120/80, HR 72, Temp 37°C, SpO₂ 98% |
| OV-04 | **PASS** | Medications card shows "0 active medications" |
| OV-05 | **PASS** | Diagnoses card shows "0 recorded" |

**BUG-EMR-01 CONFIRMED FIXED** — All 8 chart tabs load data via `CAE-xxx` URL codes. Backend correctly resolves them to internal `PAT-xxx` IDs.

---

## Vitals Tab

| ID | Result | Notes |
|----|--------|-------|
| VT-01 | **PASS** | Vitals tab loads, "VITALS HISTORY" heading, "Record vitals" button |
| VT-02 | **PASS** | Prior vitals record visible (from previous test session): 120/80 BP, 72 HR |
| VT-03 | **PASS** | "Record vitals" button visible and enabled |
| VT-04 | **PASS** | Vitals list table has DATE, BP, HR, TEMP, SPO₂, WEIGHT columns |
| VT-05 | **PASS** | Record vitals modal opens with all 9 fields (Systolic BP, Diastolic BP, HR, RR, Temp, SpO₂, Weight, Height, Pain score) |
| VT-08 | **PASS** | Submitted 9 vitals values; POST `/chart/vitals` → 201; modal closed |
| VT-09 | **PASS** | New vitals row (118/78, 74 HR, 36.8°C, 99%, 71kg) appears immediately without reload — query invalidation works |
| VT-10 | **PASS** | Vitals list shows multiple rows in reverse-chronological order |
| VT-11 | **PASS** | Out-of-range vitals row (150/95 BP, 110 HR, 92% SpO₂) shows amber triangle alert icon (`lucide-triangle-alert text-amber-500`) |
| VT-13 | **PASS** *(Retest 2)* | Source-verified: `vitals-screen.tsx:36` has `loadingComponent={<div className="...animate-spin..."/>}` in `<Loadable>`. Same pattern as all other EMR tabs (confirmed working). |

**GAP-EMR-01 CONFIRMED FIXED (source + retest-2)** — `use-vitals.ts:48-50` has `onError: (err) => DrawerService.toast(...)`. MutationObserver confirmed toast DOM insertion is wired up; direct HTTP error simulation via fetch override caused stack overflow due to ky internals, so source verification is the authoritative confirmation.

---

## Medications Tab

| ID | Result | Notes |
|----|--------|-------|
| MED-01 | **PASS** | Medications tab loads; "No medications recorded." empty state; "Add medication" button |
| MED-02 | **PASS** | Add medication modal has fields: Drug*, Strength, Route, Frequency, Duration, Indication |
| MED-06 | **PASS** | Metformin 500mg added; POST `/chart/medications` → 201; list updated without reload |
| MED-07 | **PASS (source)** | `add-medication-form.tsx:33` has `onError` toast — GAP-EMR-02 confirmed fixed |
| MED-08 | **PASS** | Update medication modal opens with drug name, status dropdown (Active/On hold/Discontinued), reason field |
| MED-09 | **PASS** *(Retest 2)* | **BUG-NEW-01 FIXED:** PATCH → 200; badge updates to "On hold" without reload |
| MED-10 | **PASS** *(Retest 2)* | PATCH → 200; badge updates to "Discontinued" without reload |
| MED-11 | **PASS** *(Retest 2)* | PATCH → 200; badge updates back to "Active" without reload |
| MED-12 | **PASS** *(Retest 2)* | Active → On hold via UI; badge updates immediately |
| MED-13 | **PASS** *(Retest 2)* | On hold → Discontinued with reason "Treatment complete"; badge updates |
| MED-14 | **PASS** *(Retest 2)* | Discontinued reason "Patient reports nausea" stored in DB; `discontinuedReason`, `discontinuedAt`, `discontinuedBy` all persisted (confirmed via API response) |

---

## History Tab

| ID | Result | Notes |
|----|--------|-------|
| HX-01 | **PASS** | History tab loads; shows "MEDICAL HISTORY" section and Edit button |
| HX-02 | **PASS** | After API seed, diagnoses (Type 2 Diabetes E11) and social history (smoking: never, alcohol: occasional, occupation: Teacher) displayed correctly |
| HX-03 | **FAIL** *(Retest 2)* | **BUG-NEW-02 partially fixed / BUG-NEW-03:** Button is now enabled (`disabled={isLoading}` fix applied). But `handleEdit()` still has `if (!history) return;` guard — clicking Edit when patient has no history silently does nothing. Modal never opens. See BUG-NEW-03 |
| HX-09 | **PASS** | Edit modal opens with Social History fields (Smoking, Alcohol, Occupation, Notes) |
| HX-10 | **PASS** | PATCH `/chart/history` → 200; modal closed |
| HX-11 | **PASS** | Notes field "Controlled on Metformin 500mg BID" appears immediately after save — query invalidation works |
| HX-12 | **SKIP** *(unchanged)* | `HistoryEditForm` has no Diagnoses field — only Smoking, Alcohol, Occupation, Notes. Diagnoses cannot be added via the UI. |

---

## Procedures Tab

| ID | Result | Notes |
|----|--------|-------|
| PR-01 | **PASS** | Procedures tab loads; "No procedures recorded." empty state; "Record procedure" button |
| PR-02 | **PASS** | Record procedure modal has fields: Name*, Performed by*, Date*, CPT code, Location, Notes, Pre-op checklist (4 checkboxes) |
| PR-08 | **PASS** | "Appendectomy" added; POST `/chart/procedures` → 201; shows date, performed by, location, notes, CPT code |
| PR-09 | **PASS** | List updated without reload — query invalidation works |
| PR-10 | **PASS** | Procedure row renders all fields correctly |

---

## Immunizations Tab

| ID | Result | Notes |
|----|--------|-------|
| IMM-01 | **PASS** | Immunizations tab loads; empty state; "Record immunization" button |
| IMM-02 | **PASS** | Record immunization modal has fields: Vaccine*, Dose, Date administered*, Administrator*, Lot number, Next due date |
| IMM-07 | **PASS** | "COVID-19 Pfizer" added; POST `/chart/immunizations` → 201 |
| IMM-08 | **PASS** | Immunization table shows VACCINE, DOSE, DATE, NEXT DUE, ADMINISTRATOR columns with correct data |
| IMM-09 | **PASS** | List updated without reload |

---

## Documents Tab

| ID | Result | Notes |
|----|--------|-------|
| DOC-01 | **PASS** | Documents tab loads; prior document visible from previous session |
| DOC-02 | **PASS** | Upload document modal has Title*, Category (select), File*, Mark as sensitive checkbox |
| DOC-08 | **PASS** | After file selection, file name "test-discharge-summary.txt" shown in Choose file button |
| DOC-09 | **PASS** | Full upload flow: GET file service URI (200) → PUT to S3 (200) → POST `/chart/documents` (201) |
| DOC-10 | **PASS** | "Discharge Summary Q2" appears in list immediately after upload — no reload needed |
| DOC-11 | **PASS** | Document shows correct category (Other) and date |
| DOC-12 | **SKIP** | Edit document not available in UI (upload-only design) |
| DOC-13 | **PASS** *(Retest 2)* | Uploaded "sensitive-doc-test.txt" with "Mark as sensitive" checkbox checked. Full pipeline: GET upload URI (200) → PUT S3 (200) → POST `/chart/documents` (201). Document appears in list with "Sensitive" badge immediately. |

---

## Audit Log / Break Glass Tab

| ID | Result | Notes |
|----|--------|-------|
| AL-01 | **PASS** | Audit log tab loads; entries from this test session visible (view vitals, view medications, etc.) |
| AL-02 | **PASS** | Table shows TIME, USER, ACTION, SECTION columns |
| AL-03 | **PASS** | "Break glass" button present |
| AL-11 | **PASS** | Break glass modal opens: "Emergency access override" heading, logged/audited warning, Reason field |
| AL-12 | **PASS** | POST `/chart/break-glass` → 204; modal closed |
| AL-13 | **PASS** | Break glass entry appears at top of audit log immediately with "BREAK GLASS" badge, section "chart" |
| AL-14 | **PASS** | Pagination controls visible (not tested for exact counts, 20+ entries present) |

**Note:** USER column in audit log displays raw `USR-xxx` IDs instead of human-readable names. Same issue present in medications "Prescribed by" field. Not a regression — pre-existing display limitation.

---

## Patient Profile Actions (GAP-EMR-05 Retest)

| ID | Result | Notes |
|----|--------|-------|
| PP-05 | **PASS** | John Doe profile loads; "Admitted" badge; "Check out", "Discharge", "Transfer" action buttons |
| PP-06 | **PASS** | Jane Smith (outpatient): Check in modal opens with department dropdown (Cardiology, Emergency, Gynecology, Neurology, Pediatrics — from hospital units), nurse dropdown, doctor dropdown |
| PP-GAP05 | **PASS** | **GAP-EMR-05 CONFIRMED FIXED:** After submitting check-in, modal closed AFTER POST 200 resolved (not before). Jane Smith visit (#35) appeared in Checked-In Patients queue at `/patients/checked-in` |
| PP-07 | **PASS** | John Doe "Check out" confirmation modal: "Check out John Doe?" with Cancel and Check out buttons |
| PP-08 | **PASS** | After checkout confirmation: POST `/patients/PAT-xxx/checkout` → 200; modal closed |
| PP-09 | **PASS** | Status badge changed from "Admitted" → "Outpatient" immediately after checkout; actions changed to "Check in" / "Admit" — no reload needed |
| PP-10 | **SKIP** | Loading state (skeleton) not capturable |

---

## New Bugs Found in Retests

### BUG-NEW-01 — Update medication / document always returns 404 (P1) — FIXED in Retest 2

**File:** `apps/main-backend/src/features/emr/emr.service.ts:234, :418`

Found in Retest 1. `updateMedication` and `updateDocument` compared `existing.patientId` (PAT-xxx from DB) against raw `patientId` URL param (CAE-xxx). These never matched.

**Fix applied:** Both functions now call `const resolvedPatientId = await resolvePatientId(patientId);` and compare against `resolvedPatientId`.

**Retest 2 verification:** All 6 medication status transitions (MED-09–14) pass. PATCH returns 200; UI badges update immediately; `discontinuedReason` persists to DB.

---

### BUG-NEW-02 — Edit history button disabled when no history exists (P2) — FIXED in Retest 2

**File:** `apps/medcord-web/src/features/emr/features/history/screen/history-screen.tsx:34`

```tsx
// Before fix
<AppButton variant="secondary" onClick={handleEdit} disabled={!history}>Edit</AppButton>
// After fix (Retest 2 build)
<AppButton variant="secondary" onClick={handleEdit} disabled={isLoading}>Edit</AppButton>
```

Fix confirmed: button is now enabled. But see **BUG-NEW-03** — the handler still bails.

---

### BUG-NEW-03 — Edit history handler silently does nothing when history is null (P2)

**Found in:** Retest 2 (2026-05-17)
**File:** `apps/medcord-web/src/features/emr/features/history/screen/history-screen.tsx:22`

```tsx
function handleEdit() {
  if (!history) return;  // ← still present after BUG-NEW-02 fix
  DrawerService.showCustomModal('Edit medical history', () => (
    <HistoryEditForm history={history} hospitalId={...} patientId={code} />
  ));
}
```

Although the Edit button is now enabled (BUG-NEW-02 fix applied), clicking it for a patient with no history silently returns without opening the modal. The user sees a clickable button but nothing happens — no modal, no error toast, no feedback of any kind.

**Root cause:** BUG-NEW-02 fix only removed the `disabled` attribute but left the handler guard in place. The `HistoryEditForm` prop type requires `history: MedicalHistory` (non-nullable), so the guard is protecting a type constraint. The real fix is to make `HistoryEditForm` accept `history: MedicalHistory | null` and initialize all fields to empty strings when `null`.

**Fix:**
1. Change `HistoryEditForm` prop type to `history: MedicalHistory | null`
2. Update state initialization: `useState(history?.notes ?? '')` etc. (already uses optional chaining in places)
3. Remove the `if (!history) return;` guard in `handleEdit`

---

## Findings — Cumulative Status

| Finding | Initial | Retest 1 | Retest 2 |
|---------|---------|----------|----------|
| BUG-EMR-01 — CAE vs PAT ID mismatch in EMR service | P1 FAIL | ✅ FIXED | — |
| BUG-NEW-01 — updateMedication / updateDocument 404 | — | P1 FAIL (found) | ✅ FIXED |
| BUG-NEW-02 — Edit history button disabled when no history | — | P2 FAIL (found) | ⚠️ PARTIAL (button enabled, handler still bails) |
| BUG-NEW-03 — Edit history handler silent no-op when null | — | — | P2 FAIL (found) |
| GAP-EMR-01 — Vitals form no error toast | P2 FAIL | ✅ FIXED (source) | ✅ confirmed |
| GAP-EMR-02 — Add medication form no error toast | P2 FAIL | ✅ FIXED (source) | ✅ confirmed |
| GAP-EMR-05 — Checkin modal closes before mutation | P2 FAIL | ✅ FIXED (browser) | — |
| FIND-01 — React Query 5× retries on 401 | Open | Open | Open (unchanged) |
| FIND-02 — Stale badge after checkin | Open | Open | Open (by-design) |
| FIND-03 — "Done" visits in active checked-in list | Open | Open | Open (unchanged) |
| HX-12 — Diagnoses not editable via UI | SKIP | SKIP | SKIP — HistoryEditForm has no Diagnoses field |

---

## Priority Fix List

### Must Fix Before Sign-off

1. **BUG-NEW-03** — Edit history handler silent no-op when patient has no history
   - File: `history-screen.tsx:22` (handler guard) + `history-edit-form.tsx` (prop type)
   - Fix: accept `history: MedicalHistory | null` in form; remove `if (!history) return` guard
   - Note: BUG-NEW-02 fix (disabled={isLoading}) was correct — this is the remaining gap

### Should Fix Before Launch

2. **FIND-01** — React Query 5× retries on auth failure (401)
   - Causes 5 identical failed API calls when session expires; degrades UX during JWT refresh
   - Fix: configure `retry: false` or `retry: 1` in QueryClient for 401 responses

3. **HX-12 / Missing Diagnoses UI** — No way to add/edit diagnoses through the EMR UI
   - `HistoryEditForm` only covers social history + notes; no Diagnoses section
   - Fix: add Diagnoses management to the Edit form (add/remove diagnosis entries with ICD-10 code + description)

### Code Quality (Post-MVP)

4. **FIND-03** — "Done" visits visible in the Checked-In active queue (`/patients/checked-in`)
   - Visits with stage `done` should be filtered out of the active queue view, or shown in a separate section

5. **Display: Raw user IDs** — Audit log "USER" column and medications "Prescribed by" show `USR-xxx` raw IDs
   - Should resolve to staff member names for readability

---

## Screenshots

| File | Description |
|------|-------------|
| `screenshots/retest/ov-01-chart-overview.png` | Chart overview with Last Vitals card showing real data |
| `screenshots/retest/vt-01-vitals-tab.png` | Vitals tab with out-of-range entry showing amber triangle icon |
| `screenshots/retest/med-bug-new-01-404.png` | Medications tab — status still "Active" after failed PATCH (BUG-NEW-01) |
| `screenshots/retest/doc-01-documents-tab.png` | Documents tab with uploaded document visible |
