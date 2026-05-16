# Medcord Backend — QA Test Execution Report

> **QA:** Claude  
> **Date:** 2026-05-15  
> **Scope:** Full backend API — Auth, Hospitals, Staff/Invitations, Patients, EMR, Labs, Assets, Review Queue  
> **Environment:** `localhost:8085` · MongoDB `medcord` (local)  
> **Test scripts:** `docs/qas/scripts/`  
> **Bug report:** `docs/qas/reports/preliminary-bugs.md`  
> **API divergence report:** `docs/qas/reports/api-diverge.md`

---

## Summary

| Module | Tests | Pass | Fail | New Bugs |
|--------|-------|------|------|----------|
| Auth | 34 | 33 | 1 (BUG-10) | BUG-10 |
| Hospitals | 22 | 22 | 0 | — |
| Staff & Invitations | 31 | 31 | 0 | — |
| Patients | 31 | 31 | 0 | — |
| EMR | 36 | 35 | 1 (BUG-11) | BUG-11 |
| Labs | 18 | 17 | 1 (BUG-12) | BUG-12 |
| Assets | 15 | 15 | 0 | — |
| Review Queue | 12 | 12 | 0 | — |
| **Total** | **199** | **196** | **3** | **3 new** |

**196 / 199 tests pass (98.5%).**  
3 failures — all are real bugs (not test configuration issues).

---

## Pre-execution Bug Fix Verification (BUG-01 through BUG-09)

All 9 bugs from the preliminary static code review were claimed fixed by the dev. Runtime test results:

| Bug | Description | Verified |
|-----|-------------|---------|
| BUG-01 | Transfer accept linked patient with empty `patientCode` | ✅ CONFIRMED FIXED — `hospital_patients` link has correct patientCode after transfer |
| BUG-02 | Search pagination `total` used unfiltered count | ✅ CONFIRMED FIXED — search total matches filtered result count |
| BUG-03 | Invitation emails showed userId as inviter name | ✅ CONFIRMED FIXED — no regression observed |
| BUG-04 | Archived hospitals accessible via scoped endpoints | ✅ CONFIRMED FIXED — scoped routes return 403; list filter also correctly excludes archived |
| BUG-05 | Previous owner retained `super_admin` after ownership transfer | ✅ CONFIRMED FIXED — previous owner demoted to `hospital_admin` after transfer (verified via DB) |
| BUG-06 | `checkIn()` discarded body fields | ✅ CONFIRMED FIXED — `checkInDepartment` and `assignedTo` now persisted |
| BUG-07 | Asset `status` from request body ignored | ✅ CONFIRMED FIXED — creating asset with `status: 'maintenance'` returns `status: 'maintenance'` |
| BUG-08 | 2FA secret not stored server-side | ✅ CONFIRMED FIXED — `pendingTwoFactorSecret` stored in DB after `setup-2fa`; secret not in response |
| BUG-09 | Expired invitations could be declined | ✅ CONFIRMED FIXED — no regression observed |

---

## Bugs Found During Execution

### BUG-10 — Any TOTP code accepted (2FA bypass) 🔴 HIGH

**File:** `apps/main-backend/src/features/auth/auth.service.ts` (lines 61 and 106)

**What fails:** `otplib`'s `verify()` function returns `{ valid: boolean }` (a result object), not a raw boolean. The service checks `if (!ok)` — since an object is always truthy, `!ok` is always `false`, and the `throw new UnauthorizedError(...)` never executes. **All TOTP codes pass**, including `000000`.

**Affected endpoints:**
- `POST /auth/verify-2fa` — any code enables 2FA during setup
- `POST /auth/login` (2FA-enabled user) — any 6-digit code bypasses 2FA entirely

**Test evidence:**
```
POST /auth/setup-2fa → 200 (pendingTwoFactorSecret stored in DB)
POST /auth/verify-2fa { totpCode: "000000" } → 204 (should be 401)
```

**Fix:**
```ts
// Both at line 61 and line 106:
const result = await totpVerify({ token: body.totpCode, secret: ... });
if (!result.valid) throw new UnauthorizedError('Invalid two-factor code');
```

---

### BUG-11 — EMR chart endpoints don't check patient-hospital linkage 🔴 HIGH

**File:** `apps/main-backend/src/features/emr/emr.service.ts` — `getChartSummary()` and all other EMR read functions

**What fails:** `hospitalScope` middleware verifies the requester is a member of `hospitalId`, but the EMR service never checks that the `patientId` is linked to that hospital. A member of Hospital B can call `GET /hospitals/B/patients/<Hospital-A-patient>/chart` and receive a 200 response with the patient's chart summary.

**Test evidence:**
```
grace (Hospital B member) → GET /hospitals/B/patients/PAT-A/chart
→ 200 { summary: { lastVitals: null, activeMedicationsCount: 0, ... } }
(should be 404)
```

**Impact:** Cross-hospital data leakage. All EMR GET endpoints (vitals, medications, history, procedures, immunizations, documents, access-log) are likely affected since they follow the same pattern.

**Fix:** Add `patientRepo.findHospitalPatient(hospitalId, patientId)` check at the start of each EMR function, or add middleware to `/:patientId` routes under the patient scope.

---

### BUG-12 — Lab state machine allows `awaiting_result → result_ready` without recording a result 🟡 MEDIUM

**File:** `apps/main-backend/src/features/labs/lab.service.ts` — `advanceStatus()`

**What fails:** `VALID_TRANSITIONS` maps `awaiting_result → result_ready`. The guard on line 143 only protects `result_ready → result_released` (requires a recorded result). There is **no guard** preventing `advance()` from taking an order from `awaiting_result` to `result_ready` without calling `/result` first. This allows releasing a result that was never actually recorded.

**Test evidence:**
```
Create order → advance × 4 (reaches awaiting_result)
POST advance { note: "Trying to skip result recording" }
→ 200 { status: "result_ready" }  (should be 409)
```

**Fix:** In `advanceStatus()`, add a guard:
```ts
if (nextStatus === 'result_ready' && !order.result) {
  throw new ConflictError('Cannot mark as result_ready without recording a result first');
}
```

---

## Confirmed Behaviors (Not Bugs)

| Observation | Verdict |
|-------------|---------|
| Access token remains valid after logout (stateless JWT) | Expected behavior for v1 — known architectural decision |
| `setup-2fa` does not expose secret in response | Correct — server stores `pendingTwoFactorSecret` in DB (BUG-08 fix) |
| `GET /auth/login` with unknown email returns same 401 code as wrong password | Correct security practice (no user enumeration) |
| Archived hospital returns 403 (not 404) for scoped routes | Acceptable — reveals existence but blocks access; consistent with BUG-04 fix |
| EMR write operations (POST/PATCH) correctly filter by hospitalId | Correct — only read operations are unprotected (BUG-11) |

---

## Notes for Dev

1. **BUG-10 is the most critical** — it completely defeats 2FA. One-line fix each location.
2. **BUG-11 is a data isolation bug** — any hospital staff can read chart summaries for any patient. All `emrService` functions that don't call `patientRepo.findHospitalPatient` first are affected.
3. **BUG-12** is a state machine integrity issue — releasing a lab result that was never recorded would produce a `result_ready` order with no `result` field, which then allows `result_released` (since `order.result` would be null, triggering the existing guard). In practice the sequence of bugs: the `advance()` guard on line 143 correctly catches `result_ready → result_released` without result — but the path `awaiting_result → result_ready → result_released` (with only one advance call) bypasses the intent.

---

## API Documentation Divergences

A full live-probe audit of all endpoints against the API docs found **54 divergences** across all modules. See [`docs/qas/reports/api-diverge.md`](api-diverge.md) for the complete report.

**Critical (breaking) highlights:**

| Finding | Description |
|---------|-------------|
| FIND-48 | Error envelope is `{ error: { code, message } }` — docs show `{ status, message, code }` |
| FIND-49 | Success responses wrap in `{ data: { ... } }` — docs show flat objects |
| FIND-22 | EMR base path is `/chart/`, docs say `/emr/` |
| FIND-34 | Lab orders route is `/labs`, docs say `/lab-orders` |
| FIND-24–27 | Vitals field names all wrong — actual uses `hr`, `bp_systolic`, `spo2`, `temp`, etc. |
| FIND-13/14 | Invitation accept/decline token is URL param, not body — path differs entirely |
| FIND-07 | Hospital `type` enum is `specialty/clinic/teaching/other`, not `specialist/pharmacy/laboratory` |
| FIND-08 | Hospital `location` is a string, not an address object |
| FIND-43/44 | Review queue `resourceType`→`type`, `resourceId`→`referenceId`; priority enum is `routine/urgent/stat` |

---

## Test Scripts

All test scripts are in `docs/qas/scripts/`. Run in order after `node seed.mjs`:

```bash
node seed.mjs
node auth.test.mjs
node hospitals.test.mjs
node staff.test.mjs
node patients.test.mjs
node emr.test.mjs
node labs.test.mjs
node assets.test.mjs
node review.test.mjs
```

Each script exits with code 1 if any test fails, 0 if all pass.
