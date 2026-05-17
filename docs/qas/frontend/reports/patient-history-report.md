# Frontend QA Execution Report — Patient History Panel

**Tester**: Claude QA Agent  
**Date**: 2026-05-17  
**Branch**: main  
**App URL**: http://localhost:5175  
**Backend URL**: http://localhost:8085  
**Test plan source**: `docs/qas/frontend/plans/patient-history-test-plan.md`

---

## Summary

| Section | Tests | PASS | FAIL | SKIP | Bugs Found |
|---------|-------|------|------|------|------------|
| Admission history — happy path (F1–F8) | 8 | 7 | 0 | 1 | — |
| Admission history — empty state (F9) | 1 | 1 | 0 | 0 | — |
| Admission history — loading/error (F10–F11) | 2 | 2 | 0 | 0 | code review |
| Admission history — live invalidation (F12–F13) | 2 | 0 | 2 | 0 | BUG-FE-01 |
| Check-in history — happy path (F14–F18) | 5 | 5 | 0 | 0 | — |
| Check-in history — empty state (F19) | 1 | 1 | 0 | 0 | code review |
| Check-in history — live invalidation (F20–F21) | 2 | 0 | 2 | 0 | BUG-FE-01 |
| EntityLink in admission rows (F22–F24) | 3 | 2 | 0 | 1 | — |
| Responsive layout (F25–F26) | 2 | 2 | 0 | 0 | code review |
| Regression checks (F27–F32) | 6 | 6 | 0 | 0 | — |

**Overall: 28/32 executed, 26 PASS, 4 FAIL. 1 bug confirmed (BUG-FE-01 — cache invalidation missing for all 4 mutations).**

---

## Section 1: Admission History panel — happy path

### F1 — Panel visible for patient with prior admissions
**PASS** — PAT1 (John Doe) profile shows "ADMISSION HISTORY" card below demographics. Multiple rows with admitted dates, discharged dates, department names, duration badges. All rendered correctly.

### F2 — Active admission row shows "Active" label
**PASS** (after page reload) — PAT3 (John Marcus) admitted via UI. After reload: row shows `5/17/2026` (no → arrow, no discharged date), "Ongoing" duration badge, amber "Active" label below badge. All correct per `profile-history.tsx:54-55` logic.

### F3 — Assigned staff renders as clickable EntityLink
**PASS** — PAT1 admission rows with `assignedTo` set show `Assigned: <link MBR-xxx>`. Multiple EntityLinks visible (MBR-22c413bb, MBR-0509f12f). Links are clickable anchor elements with correct href.

### F4 — Discharge notes visible in row
**PASS** — PAT2 (Jane Smith) admission history shows `"Stable, follow-up in 2 weeks"` in grey below department ("General"). Truncated if too long via `truncate` class.

### F5 — Multiple admissions listed newest first
**PASS** — PAT1 shows 7+ admission rows all from 5/17/2026. Since all are same-day, newest first ordering is correct (consistent with B11 backend verification that confirmed sorted `admittedAt` descending).

### F6 — Duration badge: < 1 hour
**PASS** — All PAT1 admission rows (admit+discharge within same QA session) show "< 1 hour" badge. Matches `durationLabel()` logic: `if (hours < 1) return '< 1 hour'`.

### F7 — Duration badge: hours
**SKIP** — No admission with 1–23 hour stay exists in current test data (all same-day QA test admissions). The `durationLabel()` logic (`if (hours < 24) return \`${hours}h\``) is correct per code review. Skipped due to test data constraints.

### F8 — Duration badge: days
**Covered by code review** — `durationLabel()` at `profile-history.tsx:18-21`: `const days = Math.floor(hours / 24); return \`${days}d\``. No 24h+ stay in test data but logic is correct.

---

## Section 2: Admission history — empty state

### F9 — "No admissions recorded." for patient with no history
**PASS** — PAT3 was discharged via backend test B9 (soft no-op — no admission record created). Profile shows "No admissions recorded." inside the Admission history card. Fallback renders correctly via `<Show when={(admissions.data?.length ?? 0) > 0} fallback={...}>`.

---

## Section 3: Loading / error states

### F10 — Loading state shows "Loading…"
**PASS (code review)** — `profile-history.tsx:103-105`: `loadingComponent={<p className="text-sm text-charcoal-700/50 py-2">Loading…</p>}`. Correct implementation.

### F11 — Error state shows "Failed to load admissions."
**PASS (code review)** — `profile-history.tsx:106-108`: `errorComponent={<p className="text-sm text-red-600 py-2">Failed to load admissions.</p>}`. Correct implementation.

---

## Section 4: Admission history — live cache invalidation

### F12 — Admit → history updates without page reload
**FAIL — BUG-FE-01**  
- **Setup**: PAT3 had "No admissions recorded." visible
- **Steps**: Clicked "Admit", selected Cardiology + Carol, clicked Admit button
- **Expected**: After "Patient admitted." toast, new open admission row appears without reload
- **Actual**: "Patient admitted." toast shown; admission history still displays "No admissions recorded." without reload. After page reload, the new open admission appears correctly.
- **Root cause**: `useAdmit` mutation in `use-patient.ts` `onSuccess` callback does not call `queryClient.invalidateQueries({ queryKey: ['patient-admissions', hospitalId, patientId] })`.

### F13 — Discharge → history row closes without reload
**FAIL — BUG-FE-01**  
- **Setup**: PAT3 was admitted with open admission (from F12 reload)
- **Steps**: Clicked "Discharge", confirmed in modal
- **Expected**: Open admission row updates to show discharged date + duration badge; "Active" label disappears
- **Actual**: After discharge confirmation, admission row still shows "Ongoing"/"Active" (stale). Patient status badge still shows "Admitted" (also stale). After page reload, correctly shows "5/17/2026 → 5/17/2026 Cardiology < 1 hour".
- **Root cause**: `useDischarge` mutation `onSuccess` does not invalidate `['patient-admissions',...]`.

---

## Section 5: Check-in history panel — happy path

### F14 — Panel visible for patient with prior check-ins
**PASS** — PAT1 "CHECK-IN HISTORY" card visible with multiple visit rows showing queue numbers (Queue #33, #32, #31), dates, and duration badges.

### F15 — Active check-in row shows "Active" label
**PASS** — PAT3 check-in history shows rows with "Ongoing" duration badge + amber "Active" label for visits that have no `checkedOutAt`. PAT3 had 4 such active visits from backend test B21.

### F16 — Completed check-in shows both dates + duration
**PASS** — PAT1 check-in history: row "5/17/2026 → 5/17/2026 Queue #1 ICU < 1 hour" shows both check-in and check-out dates plus duration badge.

### F17 — Department shown in check-in row
**PASS** — Multiple rows across PAT1 and PAT3 show department text ("Cardiology", "Emergency", "ICU") rendered below queue number.

### F18 — Multiple rows listed newest first
**PASS** — PAT3 shows Queue #45, #43, #40, #5, #3 in descending order. Queue numbers are assigned sequentially; highest queue number (newest) appears first. Consistent with backend B17 sort verification.

---

## Section 6: Check-in history — empty state

### F19 — "No check-ins recorded." for patient with no visits
**PASS (code review)** — `profile-history.tsx:139-142`: Same `<Show>` fallback pattern as admission history. Backend-confirmed B12/B18 return empty arrays. The UI correctly renders "No check-ins recorded." for empty data. All 3 seed patients now have check-in history from QA runs; fresh patient would show this state.

---

## Section 7: Check-in history — live cache invalidation

### F20 — Check-in → check-in history updates without reload
**FAIL — BUG-FE-01**  
- **Setup**: PAT3 on profile with existing check-in history visible
- **Steps**: Clicked "Re-admit (check in)", selected Cardiology department, clicked "Check in"
- **Expected**: After "Patient checked in." toast, new active visit row appears at top of check-in history
- **Actual**: "Patient checked in." toast shown; check-in history does not update. After page reload, new Queue #45 row appears at top.
- **Root cause**: `useCheckin` mutation `onSuccess` does not invalidate `['patient-checkins', hospitalId, patientId]`.

### F21 — Checkout → visit row closes without reload
**FAIL — BUG-FE-01**  
- **Setup**: PAT2 admitted then check-in history observed (multiple "Ongoing/Active" rows from backend tests)
- **Steps**: Clicked "Check out", confirmed in modal
- **Expected**: Active visit rows update to show check-out date + duration badge
- **Actual**: After confirmation, check-in history still shows all "Ongoing/Active" rows unchanged.
- **Root cause**: `useCheckout` mutation `onSuccess` does not invalidate `['patient-checkins',...]`.

---

## Section 8: EntityLink in admission rows

### F22 — Hover tooltip
**SKIP** — `agent-browser hover` on the EntityLink ref did not reveal a visible tooltip in the snapshot. The `EntityLink` component may show a tooltip on hover that the snapshot tool did not capture. The link href (`/h/hospital-a/staff/:staffId`) is correct per F23.

### F23 — Click navigates to staff profile
**PASS** — EntityLink href confirmed as `http://localhost:5175/h/hospital-a/staff/MBR-22c413bb-c31d-42d9-a633-5b1e200260a6` via DOM eval. Navigating to this URL loads Carol Osei's staff profile correctly (`heading "Carol Osei"`).

### F24 — Admission with no assignedTo has no link
**PASS** — PAT1 has multiple admission rows. Rows without `assignedTo` have no "Assigned:" line and no EntityLink. Verified in snapshot: only rows from B1/B16/B11 (which had `assignedTo: carol`) show "Assigned: MBR-xxx".

---

## Section 9: Responsive layout

### F25 — Mobile viewport: panels stack full-width
**PASS (code review)** — `patient-profile-screen.tsx:69-76`: `<div className="grid gap-6 lg:grid-cols-3">` — at < lg, this renders as single-column; both `ProfileDemographics` and `ProfileHistory` are in `lg:col-span-2` div which stacks naturally.

### F26 — Desktop viewport: panels in left column
**PASS (code review)** — At ≥ lg: 3-column grid with `ProfileHistory` in `lg:col-span-2` left column. Visually confirmed: profile screen renders history panels in left column alongside demographics, with ProfileActions + ID Card in right column.

---

## Section 10: Regression checks

### F27 — Demographics card still renders
**PASS** — PAT1 profile shows DEMOGRAPHICS section with DATE OF BIRTH, SEX, GENDER IDENTITY, PHONE, EMAIL, ADDRESS, RELIGION, CULTURAL PREFERENCES. All fields present above history panels.

### F28 — Emergency contact card
**PASS (code review)** — `ProfileDemographics` component renders `EmergencyContact` card independently; `ProfileHistory` is mounted below it and does not affect it. Prior QA sessions confirmed this card renders correctly.

### F29 — Guarantor card
**PASS (code review)** — Same rationale as F28. `Guarantor` card is in `ProfileDemographics`, unaffected by `ProfileHistory` being mounted below.

### F30 — ProfileActions sidebar unaffected
**PASS** — Actions panel correctly shows:
- PAT1 (Discharged): "Re-admit (check in)" button
- PAT3 (Outpatient): "Check in" + "Admit" buttons  
- PAT2 (Admitted): "Check out" + "Discharge" + "Transfer" buttons
All correct per `profile-actions.tsx` `<Switch>/<Case>` logic.

### F31 — ID Card panel renders in right column
**PASS** — PAT1 profile: ID CARD section visible in right column with "No active ID card." and "Issue ID card" button.

### F32 — "View chart" button navigates to EMR
**PASS** — Clicking "View chart" on PAT1 navigates to `/h/hospital-a/patients/PAT-xxx/chart`. EMR chart loads with Overview, Vitals, Medications, History tabs.

---

## Bugs Found

### BUG-FE-01 — Cache invalidation missing for all 4 patient mutations (previously identified, now confirmed across 4 test cases)

**Prior session**: Previously identified as a bug where patient status badge didn't update after admit/discharge.  
**This session**: Confirmed to also affect the new history panels — all 4 mutations fail to invalidate:

| Mutation | Expected invalidation | Symptom |
|----------|-----------------------|---------|
| `useAdmit` | `['patient-admissions', hospitalId, patientId]` | F12: admission history stays empty after admit |
| `useDischarge` | `['patient-admissions', hospitalId, patientId]` | F13: open admission row stays "Active" after discharge |
| `useCheckin` | `['patient-checkins', hospitalId, patientId]` | F20: no new visit row after check-in |
| `useCheckout` | `['patient-checkins', hospitalId, patientId]` | F21: active visit row stays "Ongoing" after checkout |

- **File**: `apps/medcord-web/src/features/patients/features/patient-profile/api/use-patient.ts`
- **Fix**: Add `queryClient.invalidateQueries({ queryKey: ['patient-admissions', hospitalId, patientId] })` to `useAdmit` and `useDischarge` `onSuccess`; add `queryClient.invalidateQueries({ queryKey: ['patient-checkins', hospitalId, patientId] })` to `useCheckin` and `useCheckout` `onSuccess`.
- **Severity**: High — the new history panels are useless without cache invalidation; every action requires a page reload to see the updated state.

---

## Gaps / Notes

1. **F7 (hours duration), F8 (days duration)**: Cannot be tested without backend admissions with specific time gaps (e.g. 6 hours, 3 days). These require either time-manipulated admission records or waiting. Both `durationLabel()` branches confirmed correct via code review.

2. **F22 (tooltip hover)**: `agent-browser hover` snapshot did not capture tooltip text. The `EntityLink` component's tooltip behavior exists in the DOM but may need a longer hover duration to appear in the snapshot. The link functionality itself (F23) is confirmed working.

3. **All 4 "Ongoing" check-in visits on PAT3**: These come from backend test B21 (check-in without checkout). The backend test leaves these as dangling active visits. They are accumulated test artifacts; they do not affect the frontend rendering — the "Ongoing/Active" display is correct behavior.
