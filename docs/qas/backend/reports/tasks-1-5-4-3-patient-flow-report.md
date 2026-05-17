# Backend QA Report — Patient Flow + Tasks 1.5 / 3 / 4

**Date:** 2026-05-17  
**Tester:** QA Agent  
**Test script:** `docs/qas/backend/scripts/tasks-1-5-4-3-patient-flow.test.mjs`  
**Seed script:** `docs/qas/backend/scripts/seed.mjs` (patched — see below)  
**Result: 111/111 PASS**

---

## Summary

| Section | Tests | Result |
|---------|-------|--------|
| Patient Flow — Check-In (CI) | 12 | 12 PASS |
| Queue Numbers (Q) | 3 | 3 PASS |
| List Active Visits (VS) | 7 | 7 PASS |
| Advance Stage (SA) | 11 | 11 PASS |
| Checkout Visit (CO) | 8 | 8 PASS |
| Patient Search — admissionStatus Filter (PS) | 7 | 7 PASS |
| Task 1.5 — Extended Usage (U) | 9 | 9 PASS |
| Task 3 — Outgoing Transfers (TO) | 8 | 8 PASS |
| Task 3 — Transfer Permission Regression (TR) | 8 | 8 PASS |
| Task 4 — Units GET (UN) | 5 | 5 PASS |
| Task 4 — Units Create (UC) | 14 | 14 PASS |
| Task 4 — Units Update (UU) | 11 | 11 PASS |
| Task 4 — Units Delete (UD) | 6 | 6 PASS |
| Cross-Cutting (X) | 2 | 2 PASS |
| **Total** | **111** | **111 PASS** |

---

## Bugs Confirmed

### BUG-PF-01 — `patient.currentHospitalId` not cleared on checkout
**Severity:** MEDIUM  
**Test:** CO-03  
**Evidence:** After checkout, `patient.currentHospitalId` remains set to the hospital ID. The service code calls `patientRepo.updateById(id, { ..., currentHospitalId: undefined })` — passing `undefined` in a Mongoose update object is silently ignored (Mongoose strips `undefined` values), so the field is never unset.  
**Fix needed:** Use `$unset: { currentHospitalId: 1 }` or set the value to `null` explicitly.  
**Status:** Open.

### GAP-PF-01 — Double check-in creates a new visit (no active-visit guard)
**Severity:** MEDIUM  
**Test:** CI-10  
**Evidence:** A second `POST /patients/:id/checkin` for a patient with an active visit returns 200 and creates a second `CheckInVisit` document. No guard checks for an existing non-checked-out visit before creating a new one.  
**Status:** Pre-existing gap.

---

## Notable Findings

### SA-10 — BUG-PF-S-01 apparently fixed
The original bug report stated backward stage transitions were accepted. In testing, the backend now **rejects** backward transitions with `409 Conflict`. Logged as "potentially fixed" — no regression.

### Architecture corrections (handoff inaccuracies)
1. `POST /patients/:id/checkin` returns `{ patient }`, NOT `{ visit }`. The visit is created internally but not returned. Callers must use `GET /visits` to retrieve the visit ID.
2. Transfer creation route is `POST /hospitals/:id/patients/:patientId/transfer` (singular, on patient sub-router). The handoff implied `/hospitals/:id/transfers`.
3. `reception` role has `PATIENT_ADMIT` by default — the handoff incorrectly stated reception does not have this permission.

### Permission regression fix (Task 3) — CONFIRMED
All 4 transfer routes now require `PATIENT_TRANSFER`. Dave (nurse) and Frank (lab_tech) both receive `403`. Carol (doctor) and Eve (reception) still receive `200`. ✅

### Task 1.5 (Extended Usage) — all 4 fields present and accurate
`GET /hospitals/:id/usage` returns `members`, `patientsAdmitted`, `patientsCheckedIn`, `labsPending` — all as numbers. Counts are live and reflect database state. Hospital B isolation verified (all zeroes). ✅

### Task 4 (Hospital Units) — all CRUD operations verified
- `UNT-` prefix on all created units ✅
- Duplicate name rejected case-insensitively (409) ✅
- Cross-hospital parent IDs rejected (404) ✅
- Active children block parent deletion (409) ✅
- Inactive-only children allow parent deletion (204) ✅
- UNITS_MANAGE gating correct — only bob (hospital_admin) can write ✅

---

## Seed Script Changes Made

The existing `seed.mjs` had two critical bugs:
1. **Missing collections from drop list** — `checkin_visits`, `daily_queue_counters`, `hospital_units` were not dropped between runs, causing test contamination.
2. **Wrong invitation flow** — Original script pre-registered all users then tried to accept invitations, but `POST /invitations/:token/accept` *creates* the user (not accepts for an existing one). Non-owner users should not be pre-registered.
3. **Expired hospital-scope tokens** — Alice and grace's registration tokens contain no `hospitalPermissions` (hospital doesn't exist yet at registration time). Script now re-logs in both after hospital creation.

All three issues are fixed in the current seed.

---

## Environment

- Backend: `http://localhost:8085/api/v1`
- Database: MongoDB (local) — fully re-seeded before test run
- Node: v25.7.0
