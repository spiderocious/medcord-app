# Medcord Platform Admin API — QA Test Execution Report

> **QA:** Claude  
> **Date:** 2026-05-16  
> **Scope:** `/admin/*` — Guard, Stats, Hospitals, Users, Error Envelope, Cross-cutting  
> **Environment:** `localhost:8085` · MongoDB `medcord` (local)  
> **Test script:** `docs/qas/scripts/admin.test.mjs`  
> **Plan:** `docs/qas/plans/admin-test-plan.md`  
> **Bugs (preliminary):** `docs/qas/reports/admin-preliminary-bugs.md`

---

## Summary

| Section | Tests | Pass | Fail | New Bugs |
|---------|-------|------|------|----------|
| Guard | 4 | 4 | 0 | — |
| Stats | 5 | 5 | 0 | — |
| Hospitals — List | 8 | 8 | 0 | — |
| Hospitals — Get | 4 | 4 | 0 | — |
| Hospitals — Patch | 8 | 8 | 0 | — |
| Hospitals — Delete | 5 | 5 | 0 | — |
| Users — List | 7 | 7 | 0 | — |
| Users — Get | 4 | 4 | 0 | — |
| Users — Patch | 10 | 10 | 0 | — |
| Users — Disable | 5 | 4 | 1 (BUG-A-07) | BUG-A-07 |
| Error Envelope | 4 | 4 | 0 | — |
| Cross-cutting | 5 | 5 | 0 | — |
| **Total** | **69** | **68** | **1** | **1 new** |

**68 / 69 tests pass (98.6%).**  
1 failure — a real bug (not a test configuration issue).

---

## Pre-execution Bug Fix Verification (BUG-A-01 through BUG-A-06)

All 4 code-level bugs claimed fixed by the dev. Runtime results:

| Bug | Description | Verified |
|-----|-------------|---------|
| BUG-A-01 | Sensitive fields leak in admin user list/get | ✅ CONFIRMED FIXED — U-L-07 and U-G-04: `passwordHash`, `twoFactorSecret`, `pendingTwoFactorSecret`, `tokenVersion` absent from all user responses |
| BUG-A-02 | `bumpTokenVersion` had unnecessary `.select('+tokenVersion')` | ✅ CONFIRMED FIXED — D-02: disable returns 204 with no body; `tokenVersion` never appears in any response |
| BUG-A-03 | `updateHospital` returned `{ hospital: null }` 200 on race | ✅ CONFIRMED FIXED — H-P-05: `PATCH /admin/hospitals/HSP-doesnotexist` returns 404 `not_found` |
| BUG-A-04 | Admin handoff doc had stale error envelope | ✅ CONFIRMED FIXED — E-01 through E-04: all error responses use `{ error: { code, message } }` with snake_case codes; no top-level `status`/`code` fields |
| BUG-A-05 | Stats arithmetic could break if `isArchived` missing on documents | ✅ NOT A BUG — S-02: `hospitals.active + hospitals.archived === hospitals.total` holds; schema default confirmed |
| BUG-A-06 | `requireAdmin` makes extra DB round-trip per request | ✅ DOCUMENTED TRADE-OFF — intentional for immediate demotion propagation; U-P-10 confirms demoted user gets 403 on very next request using the same token |

---

## Bug Found During Execution

### BUG-A-07 — `POST /admin/users/:userId/disable` does not actually invalidate access tokens 🔴 HIGH

**File:** `apps/main-backend/src/middlewares/auth.middleware.ts`

**What fails:** The handoff doc states:

> "After D-01, the disabled user's current access token is rejected (any protected route returns 401)"

**Actual behaviour:** After `POST /admin/users/:userId/disable`, the disabled user's existing access token continues to work on all protected endpoints (`GET /auth/me` returns 200) until the JWT naturally expires.

**Root cause:** `bumpTokenVersion` increments `tokenVersion` in the DB — but the `authenticate` middleware only verifies the JWT signature and expiry. It never reads `tokenVersion` from the DB:

```ts
// auth.middleware.ts — authenticate()
const payload = verifyAccessToken(token);
req.user = { id: payload.sub, email: payload.email, tokenVersion: payload.tokenVersion };
next();
// ↑ No DB lookup. tokenVersion from JWT is trusted as-is. Bumping DB has no effect on access tokens.
```

The `tokenVersion` check exists only in the **refresh** flow (`auth.service.ts` line 80): bumping it correctly kills the ability to get new tokens via `/auth/refresh`. But the current access token — which is typically valid for 15 minutes or more — keeps working for its remaining lifetime.

**Impact:** An admin disabling a user to revoke access immediately is a false assurance. The user's active session continues for the full access token TTL after "disable." Only after the access token expires will the user be unable to get a new one (refresh is broken). This creates a window where a compromised or terminated account remains active.

**Test evidence:**
```
POST /admin/users/USR-xxx/disable → 204
GET /auth/me  (using the disabled user's old token) → 200 ✗ (should be 401)
```

**Fix options:**
1. Add a DB `tokenVersion` check inside `authenticate` for every request (adds one DB round-trip to all API calls — same trade-off as `requireAdmin`)
2. Add a short access token TTL (e.g. 5 minutes) so the window is small
3. Maintain a server-side token blocklist for explicitly disabled users (Redis recommended)

---

## Confirmed Behaviours (Not Bugs)

| Observation | Verdict |
|-------------|---------|
| `DELETE /admin/hospitals/:id` does not cascade-delete members/patients | Correct by design — only the hospital doc is removed (X-04 confirmed) |
| `PATCH /admin/hospitals/:id` with unknown fields (e.g. `name`) silently ignored | Correct — admin `UpdateHospitalBody` schema only allows `isArchived` and `modules`; Zod strips unknown keys (H-P-07 confirmed) |
| `?isArchived=banana` returns `isArchived: false` results, no 400 | Correct — string transform `v === 'true'` returns false for any non-"true" string (H-L-08 confirmed) |
| Self-demotion immediately locks out the admin (no grace period) | Correct — `requireAdmin` re-checks DB on every request; U-P-10 confirmed |
| Promoting user to `isAdmin: true` does not change hospital `StaffRole` | Correct — X-05 confirmed, `HospitalMember.role` unchanged after isAdmin promotion |
| Stats arithmetic: `active + archived === total` | Correct — BUG-A-05 was not a bug; schema default `isArchived: false` ensures all hospitals are counted in one bucket (S-02 confirmed) |

---

## Test Script

```bash
cd docs/qas/scripts
node seed.mjs          # reseed (alice's isAdmin is set automatically by the test)
node admin.test.mjs    # runs 69 tests, bootstraps alice as admin via DB
```

Exit code 0 = all pass. Exit code 1 = failures (currently 1, BUG-A-07).
