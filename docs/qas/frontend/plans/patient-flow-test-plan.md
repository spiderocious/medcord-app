# Frontend QA Test Plan — Patient Flow
## Admitted · Checked-In · Queue Board · Check-in Form

**Date:** 2026-05-17  
**Handoff:** `docs/qas/frontend/patient-flow-handoff.md`  
**Scope:** Frontend only — no backend changes tested here  
**App:** `apps/medcord-web`

---

## Spec Drifts vs Handoff

The following discrepancies were found by reading the actual source code. Tests are written against the **code**, not the handoff.

| # | Handoff says | Code says | Impact |
|---|---|---|---|
| SD-1 | Admitted columns: Patient, Code, Department, Assigned Doctor, Date Admitted | Actual: Patient (name + preferred name), Code, Date of birth, Contact (phone) | Several expected columns are absent; two entirely different columns present |
| SD-2 | Admitted: clicking a row navigates to patient profile | Code: table rows are not clickable; "Chart" button appears in action column (requires `PATIENT_ADMIT`) | Row click test invalid; action button test replaces it |
| SD-3 | Stage badge `with_nurse` → "With Nurse" (title case) | Code: `with_nurse` → "With nurse" (lowercase n) | Exact string assertions must match lowercase |
| SD-4 | Stage badge `with_doctor` → "With Doctor" (title case) | Code: `with_doctor` → "With doctor" (lowercase d) | Same |
| SD-5 | Queue Board: `with_doctor` card has no Call/Next button | Code: `nextStage('with_doctor')` returns `'done'` (not null), so `canAdvance=true` and Call/Next IS rendered | Advancing a with_doctor card moves it to done (removes from board) |
| SD-6 | Queue Board: with_nurse visits have their own implied separation | Code: col 1 ("Waiting · Nurse") renders `waitingNurse` (inactive style) + `withNurse` (active style) in the same column | No separate column; active style distinguishes them |
| SD-7 | Confirmation text: "Remove [Name] from the queue?" | Code: "Remove [Name] from the queue? This will check them out." | Extra sentence in modal body |
| SD-8 | Navigation button label: "Queue Board" | Code: label is "Queue board" (lowercase b) | Exact string |
| SD-9 | "Now Serving" banner (title case) | Code: "Now serving" (lowercase s) | Exact string |
| SD-10 | Remove button available to all users | Code: Remove (checked-in screen) requires `PATIENT_ADMIT` permission | Permission gate test required |

---

## Seed State

| Resource | Count | Notes |
|---|---|---|
| Active visits (checked-in) | 0 | Board will be empty at test start |
| Admitted patients | 0 | Admitted screen will show empty state |
| Outpatient patients | ~9 | Available for check-in tests (use any — e.g. first patient in list) |
| Active staff (nurses) | ≥1 | Needed to populate nurse dropdown |
| Active staff (doctors) | ≥3 | Needed to populate doctor dropdown; carol@medcord.test is a Doctor |

**Test users:**
- `alice@medcord.test` / `Medcord123!` — Manager, has `PATIENT_VIEW` + `PATIENT_ADMIT` + `emr` module
- `carol@medcord.test` / `Medcord123!` — Doctor, has `PATIENT_VIEW` (no `PATIENT_ADMIT`)

---

## Pre-flight

1. Start both dev servers (`medcord-web` on `http://localhost:5173`, backend on `http://localhost:8085`)
2. Log in as alice, confirm Hospital A loaded and `emr` module is enabled (Admitted/Checked In/Queue links appear in sidebar)
3. Verify 0 active visits: navigate to `/h/:slug/patients/checked-in` — empty state should show
4. Verify 0 admitted: navigate to `/h/:slug/patients/admitted` — empty state should show

---

## Section 1 — Sidebar Gating

| ID | Test | Expected |
|----|------|----------|
| PF-S-01 | Log in as alice (PATIENT_VIEW + emr module) | "Admitted", "Checked In", "Queue" entries visible in sidebar |
| PF-S-02 | Log in as carol (PATIENT_VIEW + emr module) | Same three entries visible |
| PF-S-03 | Icons for Admitted, Checked In, Queue | Stethoscope, UserCheck, Activity icons respectively |
| PF-S-04 | Click "Admitted" sidebar entry | Navigates to `/h/:slug/patients/admitted` |
| PF-S-05 | Click "Checked In" sidebar entry | Navigates to `/h/:slug/patients/checked-in` |
| PF-S-06 | Click "Queue" sidebar entry | Navigates to `/h/:slug/queue` |
| PF-S-07 | Direct URL access to all three routes | Pages load without 404; routes are registered |

> For PF-S-04 through PF-S-07: confirm the URL changes and the correct screen renders (heading visible).

---

## Section 2 — Admitted Patients Screen (Empty State)

| ID | Test | Expected |
|----|------|----------|
| PF-A-01 | Navigate to admitted screen with 0 admitted patients | Empty state shown: "No patients currently admitted." |
| PF-A-02 | Empty state icon | `IconStethoscope` (stethoscope shape) present |
| PF-A-03 | Page heading | "Admitted Patients" or equivalent heading visible |
| PF-A-04 | Subtitle with 0 total | Subtitle shows `0 currently admitted` once loaded |
| PF-A-05 | Loading state | Spinner visible before data resolves (cache-cold load) |

---

## Section 3 — Admitted Patients Screen (With Data)

*Pre-step: Admit a patient via the patient profile so at least one admitted patient exists.*

| ID | Test | Expected |
|----|------|----------|
| PF-A-06 | Columns present | Headers: Patient, Code, Date of birth, Contact |
| PF-A-07 | Patient column content | Shows first name + last name; preferred name shown beneath if present |
| PF-A-08 | Code column | Shows patient code string (e.g. `PAT-xxxx`) |
| PF-A-09 | Date of birth column | ISO date or formatted date string (not "Department" or "Assigned Doctor") |
| PF-A-10 | Contact column | Phone number shown; blank/dash if no phone |
| PF-A-11 | Subtitle count updates | Shows `N currently admitted` after admitting a patient |
| PF-A-12 | Chart button absent for carol (no PATIENT_ADMIT) | No "Chart" button in any row when signed in as carol |
| PF-A-13 | Chart button present for alice (has PATIENT_ADMIT) | "Chart" button visible in action column for alice |
| PF-A-14 | Click Chart → patient profile | Navigates to `/h/:slug/patients/:patientCode` (the profile route) |

*Post-step: Discharge the admitted patient to restore seed state.*

---

## Section 4 — Checked-In Patients Screen (Empty State)

| ID | Test | Expected |
|----|------|----------|
| PF-C-01 | Navigate to checked-in screen with 0 active visits | Empty state shown: "No active check-ins right now." |
| PF-C-02 | "Queue board" button present | Button visible with label "Queue board" (lowercase b) |
| PF-C-03 | Click "Queue board" button | Navigates to `/h/:slug/queue` |

---

## Section 5 — Checked-In Patients Screen (With Data)

*Pre-step: Check in 2–3 patients via their profile pages (use alice for mutations).*

| ID | Test | Expected |
|----|------|----------|
| PF-C-04 | Columns present | Headers: #, Patient, Stage, Dept, Checked in, [Remove column if PATIENT_ADMIT] |
| PF-C-05 | Queue number column | Shows integer queue number with `#` prefix or plain integer |
| PF-C-06 | Patient column | Patient name rendered; patient code is a clickable link |
| PF-C-07 | Click patient code link → profile | Navigates to `/h/:slug/patients/:patientCode` |
| PF-C-08 | Stage badge: fresh check-in | Badge shows "Waiting · Nurse" for stage `waiting_nurse` |
| PF-C-09 | Stage badge for `with_nurse` | Badge shows "With nurse" (lowercase n — not "With Nurse") |
| PF-C-10 | Stage badge for `waiting_doctor` | Badge shows "Waiting · Doctor" |
| PF-C-11 | Stage badge for `with_doctor` | Badge shows "With doctor" (lowercase d — not "With Doctor") |
| PF-C-12 | Stage badge for `done` | Badge shows "Done" |
| PF-C-13 | Checked in column | Shows timestamp of check-in |
| PF-C-14 | Remove button absent for carol (no PATIENT_ADMIT) | No Remove button visible when signed in as carol |
| PF-C-15 | Remove button present for alice (has PATIENT_ADMIT) | Remove button visible in action column |
| PF-C-16 | Click Remove → confirmation modal | Modal appears with text "Remove [Name] from the queue? This will check them out." |
| PF-C-17 | Confirm removal | Visit disappears from list on next poll; checkout POST fired |
| PF-C-18 | Cancel removal | No change; visit still listed |
| PF-C-19 | Auto-refresh: 15s interval | New visit appears within 15s after being checked in externally (or via separate tab) |
| PF-C-20 | Done / checked-out visits not shown | Only active visits listed; no `done` stage visits appear |

---

## Section 6 — Queue Board Screen (Empty State)

| ID | Test | Expected |
|----|------|----------|
| PF-Q-01 | Navigate to queue with 0 active visits | Empty state: "Queue is empty." with activity icon |
| PF-Q-02 | "Now serving" banner absent | Banner not rendered when no `with_nurse` or `with_doctor` visits exist |
| PF-Q-03 | Column headers visible | "Waiting · Nurse", "Waiting · Doctor", "With Doctor" column headers shown |
| PF-Q-04 | Column count placeholders | Each column shows "—" or empty when no visits in that stage |
| PF-Q-05 | "List view" button | Button present; click navigates to `/h/:slug/patients/checked-in` |
| PF-Q-06 | "Refresh" button | Button present; clicking triggers immediate refetch |
| PF-Q-07 | Auto-refresh subtitle | Subtitle or note indicates "auto-refreshes every 15s" |

---

## Section 7 — Queue Board Screen (With Data)

*Pre-step: Ensure at least 3 patients are checked in (stage = `waiting_nurse`). Use alice.*

| ID | Test | Expected |
|----|------|----------|
| PF-Q-08 | `waiting_nurse` visits appear in col 1 ("Waiting · Nurse") | Cards rendered with inactive style (white background) |
| PF-Q-09 | VisitCard contents | Shows `#<queueNumber>`, abbreviated name (`First L.`), department (if set), "In since HH:MM" |
| PF-Q-10 | VisitCard name format | Last initial only: "John D." — not full last name |
| PF-Q-11 | Time label | "In since HH:MM" format (not "Checked in at") |
| PF-Q-12 | Call/Next button on `waiting_nurse` (alice) | Visible; clicking advances to `with_nurse` |
| PF-Q-13 | Remove button on `waiting_nurse` (alice) | Visible |
| PF-Q-14 | Call/Next and Remove absent for carol (no PATIENT_ADMIT) | Neither button rendered |

---

## Section 8 — Queue Board Stage Advancement

*Pre-step: Have visits at various stages to walk through the full chain.*

| ID | Test | Expected |
|----|------|----------|
| PF-Q-15 | Advance `waiting_nurse` → `with_nurse` | Card moves to active style; still in col 1 ("Waiting · Nurse"); highlighted background |
| PF-Q-16 | `with_nurse` in col 1 (active style) | Card appears in col 1 with `isActive=true` styling (border-forest-900/40, bg-forest-900/5, shadow-md) |
| PF-Q-17 | "Now serving" banner appears | Banner shows when at least one `with_nurse` or `with_doctor` visit exists |
| PF-Q-18 | "Now serving" label | Text reads "Now serving" (lowercase s — not "Now Serving") |
| PF-Q-19 | Banner shows queue number + abbreviated name | e.g. "#3 · John D." with "With nurse" label |
| PF-Q-20 | Advance `with_nurse` → `waiting_doctor` | Card moves to col 2 ("Waiting · Doctor"), inactive style |
| PF-Q-21 | `waiting_doctor` in col 2 | Card shows in "Waiting · Doctor" column |
| PF-Q-22 | Advance `waiting_doctor` → `with_doctor` | Card moves to col 3 ("With Doctor"), active style |
| PF-Q-23 | `with_doctor` in col 3 | Card shows in "With Doctor" column with active styling |
| PF-Q-24 | **Call/Next button IS rendered for `with_doctor`** | Button visible (spec drift SD-5); clicking advances to `done` |
| PF-Q-25 | Advance `with_doctor` → done | Card disappears from board (stage `done`); "Now serving" banner hides if no other active visits |
| PF-Q-26 | Remove button on `with_doctor` | Visible; confirmation modal: "Remove [Name] from the queue? This will check them out." |
| PF-Q-27 | Confirm remove from queue board | Card disappears; visit checked out |
| PF-Q-28 | Cancel remove | No change |
| PF-Q-29 | "Now serving" banner hides | When 0 `with_nurse` and 0 `with_doctor` visits remain, banner is absent |

---

## Section 9 — Updated Check-in Form

| ID | Test | Expected |
|----|------|----------|
| PF-F-01 | Open patient profile (outpatient) → click "Check in" | Modal opens with title "Check in patient" |
| PF-F-02 | Modal contains "Assign nurse" dropdown | Dropdown present with first option "— no nurse assigned —" |
| PF-F-03 | Nurse dropdown options | Lists only staff with `role=nurse` and `status=active` |
| PF-F-04 | Modal contains "Assign doctor" dropdown | Dropdown present with first option "— no doctor assigned —" |
| PF-F-05 | Doctor dropdown options | Lists only staff with `role=doctor` and `status=active` |
| PF-F-06 | Department field | Freetext input present; placeholder "e.g. Cardiology" |
| PF-F-07 | Submit with no selections | Check-in succeeds; `assignedNurseId` and `assignedDoctorId` omitted from payload (empty string → undefined) |
| PF-F-08 | Submit with nurse + doctor selected | Correct staff IDs sent in payload |
| PF-F-09 | Submit with department filled | Department value included in payload |
| PF-F-10 | Cancel button | Modal dismisses; no check-in fired |
| PF-F-11 | Patient status after check-in | `admissionStatus` updates; profile actions show "Check out" instead of "Check in" |
| PF-F-12 | Discharged patient: "Re-admit (check in)" button | Discharged patient profile shows "Re-admit (check in)" button instead of "Check in" |
| PF-F-13 | Re-admit button opens same CheckinForm | Same nurse/doctor dropdown form rendered |

---

## Section 10 — Regression: Other Profile Actions

| ID | Test | Expected |
|----|------|----------|
| PF-R-01 | Outpatient profile: "Check in" + "Admit" buttons | Both present; no "Check out" or "Discharge" |
| PF-R-02 | Admitted profile: "Check out" + "Discharge" + "Transfer" buttons | All three present; no "Check in" |
| PF-R-03 | Checked-in profile: "Check out" action available | Post-checkin, checkout button reachable |
| PF-R-04 | "Admit" button → admit modal | Opens modal with Department (required), Assigned to, Notes fields |
| PF-R-05 | "Admit" without department | Cannot submit — `if (!dept.trim()) return` guard fires |
| PF-R-06 | "Discharge" → confirmation | Destructive modal: "Discharge [Name]?" with red confirm button |
| PF-R-07 | "Transfer" → transfer modal | Opens modal with Destination hospital ID + Reason (both required) |

---

## Section 11 — Loading and Error States

| ID | Test | Expected |
|----|------|----------|
| PF-E-01 | Admitted screen: loading spinner | Spinner visible on cache-cold load before data resolves |
| PF-E-02 | Checked-in screen: loading spinner | Spinner or skeleton visible before visits resolve |
| PF-E-03 | Queue board: loading spinner | Spinner visible before visits resolve |
| PF-E-04 | Queue board error state | If visits fetch fails, red error alert rendered (not a crash) |

---

## Notes

- **Test execution order:** Section 2–3 (Admitted) should admit a patient, test, then discharge. Sections 4–10 will independently check in patients via the form — restore state (check out) after each section's mutations.
- **Call/Next on with_doctor (SD-5):** The handoff says this button is absent, but the code renders it. The button advances to `done`, which is the correct checkout flow. This is a spec drift, not a bug — document it in the report.
- **Stage labels (SD-3, SD-4):** "With nurse" and "With doctor" — lowercase second word. Test assertions must use the exact lowercase string.
- **Remove requires PATIENT_ADMIT (SD-10):** Both the checked-in screen and queue board Remove buttons are gated on `PATIENT_ADMIT`. Test with carol (no PATIENT_ADMIT) to confirm absence.
- **Admitted screen Chart button:** Only visible for `PATIENT_ADMIT` users. The handoff described row click navigation — the actual UX is a button click instead. Not a bug.
- **Seed restoration:** After each section that mutates state (admits, check-ins), restore to 0 admitted / 0 checked-in before moving on. This prevents cascade failures across sections.

---

## Key Files

| File | Purpose |
|---|---|
| [admitted-patients-screen.tsx](apps/medcord-web/src/features/patients/features/patient-admitted/screen/admitted-patients-screen.tsx) | AdmittedPatientsScreen |
| [checkedin-patients-screen.tsx](apps/medcord-web/src/features/patients/features/patient-checkedin/screen/checkedin-patients-screen.tsx) | CheckedInPatientsScreen |
| [queue-board-screen.tsx](apps/medcord-web/src/features/queue/screen/queue-board-screen.tsx) | QueueBoardScreen |
| [profile-actions.tsx](apps/medcord-web/src/features/patients/features/patient-profile/screen/parts/profile-actions.tsx) | CheckinForm + all profile action buttons |
| [use-visits.ts](apps/medcord-web/src/features/patients/features/patient-checkedin/api/use-visits.ts) | Visit queries and mutations |
| [sidebar.tsx](apps/medcord-web/src/shared/widgets/app-shell/parts/sidebar.tsx) | Sidebar gating logic |
| [app.routes.tsx](apps/medcord-web/src/app/app.routes.tsx) | Route registrations |
