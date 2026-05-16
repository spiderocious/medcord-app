# Medcord Platform Admin API — QA Test Plan

> **QA:** Claude  
> **Date:** 2026-05-16  
> **Scope:** `/admin/*` — Stats, Hospitals (list/get/patch/delete), Users (list/get/patch/disable)  
> **Backend files reviewed:**
> - `apps/main-backend/src/features/admin/admin.routes.ts`
> - `apps/main-backend/src/features/admin/admin.service.ts`
> - `apps/main-backend/src/features/admin/admin.repo.ts`
> - `apps/main-backend/src/middlewares/require-admin.middleware.ts`
> **Preliminary bugs:** `docs/qas/reports/admin-preliminary-bugs.md`

---

## Environment & Setup

| Item | Value |
|------|-------|
| Base URL | `http://localhost:8085/admin` |
| Auth | `Authorization: Bearer <accessToken>` |
| DB | MongoDB `medcord` (local) |
| Prerequisite | QA seed must have run (`node seed.mjs`) so users/hospitals exist |

### Bootstrapping a Platform Admin

There is no signup flow for platform admins. To create one:
1. Run the seed: `node seed.mjs`  
2. Set `isAdmin: true` directly in MongoDB on alice's user document:
   ```js
   db.users.updateOne({ email: "alice@medcord.test" }, { $set: { isAdmin: true } })
   ```
3. Log in as alice to get a fresh access token — this is the `adminToken` used in all tests.

A second non-admin token (any other seeded user, e.g. bob) is used for G-04 (403 check).

---

## Test Accounts

| Handle | Email | Password | Role for tests |
|--------|-------|----------|----------------|
| alice | alice@medcord.test | Medcord123! | Platform admin (after DB bootstrap) |
| bob | bob@medcord.test | Medcord123! | Regular user (non-admin) |

---

## Section 1 — Platform Admin Guard

Tests G-01 through G-05 cover the `authenticate` + `requireAdmin` middleware chain. These need only run against one route — `GET /admin/stats` is used as the probe.

| ID | Scenario | Method + Path | Input | Expected |
|----|----------|---------------|-------|----------|
| G-01 | No Authorization header | GET /admin/stats | — | 401 `unauthorized` |
| G-02 | Malformed token | GET /admin/stats | `Bearer garbage` | 401 `unauthorized` |
| G-03 | Expired token | GET /admin/stats | Expired JWT | 401 `unauthorized` |
| G-04 | Valid token, non-admin user | GET /admin/stats | Bob's valid token | 403 `forbidden` |
| G-05 | Valid token, platform admin | GET /admin/stats | Alice's token | 200 with `data.stats` |

---

## Section 2 — Stats: `GET /admin/stats`

| ID | Scenario | Steps | Expected |
|----|----------|-------|----------|
| S-01 | Full stats shape | GET /admin/stats | 200; `data.stats` has: `hospitals.{total,active,archived}`, `users.{total,admins,twoFactorEnabled}`, `recentSignups.{last7d,last30d}`, `recentHospitals.{last7d,last30d}` — all values are numbers |
| S-02 | Arithmetic consistency | Read S-01 response | `hospitals.active + hospitals.archived === hospitals.total` |
| S-03 | New user increments counts | Register new user → GET /admin/stats | `users.total` +1; `recentSignups.last7d` +1; `recentSignups.last30d` +1 |
| S-04 | New hospital increments counts | Create new hospital → GET /admin/stats | `hospitals.total` +1; `hospitals.active` +1 |
| S-05 | Archive hospital shifts counts | Archive existing hospital → GET /admin/stats | `hospitals.active` -1; `hospitals.archived` +1; `hospitals.total` unchanged |

---

## Section 3 — Hospitals

### 3.1 List: `GET /admin/hospitals`

| ID | Scenario | Query | Expected |
|----|----------|-------|----------|
| H-L-01 | No params | — | 200; paginated result with `items`, `total`, `page`, `limit`, `totalPages` |
| H-L-02 | Pagination | `?page=1&limit=5` | ≤ 5 items; `totalPages = ceil(total/5)` |
| H-L-03 | Limit over max | `?limit=101` | 400 `validation_error` |
| H-L-04 | Filter active | `?isArchived=false` | All returned hospitals have `isArchived: false` |
| H-L-05 | Filter archived | `?isArchived=true` | All returned hospitals have `isArchived: true` |
| H-L-06 | Search by name | `?q=<partial hospital name>` | Returns matching hospitals; case-insensitive |
| H-L-07 | Search by subdomain | `?q=<partial subdomain>` | Returns matching hospitals |
| H-L-08 | No match | `?q=zzznomatch` | 200; `items: []`, `total: 0` |
| H-L-09 | Invalid isArchived value | `?isArchived=banana` | 200; treated as `false` (string `"banana" !== "true"`); no 400 |

### 3.2 Get Single: `GET /admin/hospitals/:hospitalId`

| ID | Scenario | Expected |
|----|----------|----------|
| H-G-01 | Valid hospitalId | 200; `data.hospital` (IHospital), `data.memberCount` (integer ≥ 0) |
| H-G-02 | memberCount correctness | Add a member → re-fetch; `memberCount` increments by 1 |
| H-G-03 | Non-existent hospitalId | 404 `not_found` |
| H-G-04 | Malformed ID (random string) | 404 `not_found` |

### 3.3 Update: `PATCH /admin/hospitals/:hospitalId`

| ID | Scenario | Body | Expected |
|----|----------|------|----------|
| H-P-01 | Archive hospital | `{ "isArchived": true }` | 200; `hospital.isArchived: true` |
| H-P-02 | Restore hospital | `{ "isArchived": false }` | 200; `hospital.isArchived: false` |
| H-P-03 | Disable a module | `{ "modules": { "labs": false } }` | 200; `hospital.modules.labs: false`; other modules unchanged |
| H-P-04 | Enable a module | `{ "modules": { "onlineConsultation": true } }` | 200; `hospital.modules.onlineConsultation: true` |
| H-P-05 | Partial modules object | `{ "modules": { "emr": true } }` | Only `emr` changes; `labs`, `assets`, `onlineConsultation` unchanged |
| H-P-06 | Empty body | `{}` | 200; hospital returned unchanged |
| H-P-07 | Unknown field | `{ "name": "Hacked" }` | 200; field silently stripped by Zod; `name` on hospital unchanged |
| H-P-08 | Non-existent hospitalId | `{ "isArchived": false }` | 404 `not_found` |
| H-P-09 | Invalid type for isArchived | `{ "isArchived": "yes" }` | 400 `validation_error` |

### 3.4 Delete: `DELETE /admin/hospitals/:hospitalId`

> Hard delete — permanently removes the DB document. Distinct from the owner-level `isArchived: true`.

| ID | Scenario | Expected |
|----|----------|----------|
| H-D-01 | Delete existing hospital | 204 No Content |
| H-D-02 | Verify gone | After H-D-01: GET /admin/hospitals/:hospitalId → 404 |
| H-D-03 | Stats reflect deletion | GET /admin/stats → `hospitals.total` -1 |
| H-D-04 | Delete non-existent | 404 `not_found` |
| H-D-05 | Double delete | First → 204; second → 404 |

---

## Section 4 — Users

### 4.1 List: `GET /admin/users`

| ID | Scenario | Query | Expected |
|----|----------|-------|----------|
| U-L-01 | No params | — | 200; paginated result with `items`, `total`, `page`, `limit`, `totalPages` |
| U-L-02 | Search by name | `?q=<partial name>` | Matching users returned; case-insensitive |
| U-L-03 | Search by email | `?q=<partial email>` | Matching users returned |
| U-L-04 | Filter admins | `?isAdmin=true` | Only users with `isAdmin: true` |
| U-L-05 | Filter non-admins | `?isAdmin=false` | Only users with `isAdmin: false` |
| U-L-06 | Pagination | `?page=2&limit=10` | Correct offset applied; `page: 2` in response |
| U-L-07 | No secrets in list | — | No user object in `items` has `passwordHash`, `twoFactorSecret`, `pendingTwoFactorSecret`, or `tokenVersion` |

### 4.2 Get Single: `GET /admin/users/:userId`

| ID | Scenario | Expected |
|----|----------|----------|
| U-G-01 | Valid userId | 200; `data.user` (IUser), `data.memberships` (array) |
| U-G-02 | User with no memberships | `data.memberships: []` |
| U-G-03 | User with memberships | `data.memberships` items have `id`, `hospitalId`, `userId`, `role`, `status`, `joinedAt` |
| U-G-04 | Non-existent userId | 404 `not_found` |
| U-G-05 | No secrets in response | `data.user` must NOT contain `passwordHash`, `twoFactorSecret`, `pendingTwoFactorSecret`, `tokenVersion` |

### 4.3 Update: `PATCH /admin/users/:userId`

| ID | Scenario | Body | Expected |
|----|----------|------|----------|
| U-P-01 | Promote to platform admin | `{ "isAdmin": true }` | 200; `user.isAdmin: true`; user can then call admin endpoints successfully |
| U-P-02 | Demote platform admin | `{ "isAdmin": false }` | 200; `user.isAdmin: false`; user gets 403 on next admin request |
| U-P-03 | Verify email | `{ "isEmailVerified": true }` | 200; `user.isEmailVerified: true` |
| U-P-04 | Both fields together | `{ "isAdmin": true, "isEmailVerified": true }` | 200; both fields updated |
| U-P-05 | Empty body | `{}` | 200; user unchanged |
| U-P-06 | Non-existent userId | `{ "isAdmin": true }` | 404 `not_found` |
| U-P-07 | Invalid isAdmin type | `{ "isAdmin": "yes" }` | 400 `validation_error` |
| U-P-08 | Self-demotion | Admin patches own userId with `{ "isAdmin": false }` | 200; subsequent admin request with same token → 403 |

### 4.4 Disable: `POST /admin/users/:userId/disable`

> Bumps `tokenVersion`, invalidating all active sessions. Does not delete the account.

| ID | Scenario | Expected |
|----|----------|----------|
| D-01 | Disable active user | 204 No Content |
| D-02 | Token invalidated | After D-01: disabled user's current access token → 401 on any protected route |
| D-03 | User can re-login | After D-01: disabled user logs in fresh → valid token; 200 on protected routes |
| D-04 | Non-existent userId | 404 `not_found` |
| D-05 | Disable twice | Both calls → 204; no error on second call |

---

## Section 5 — Error Envelope

Verify the error shape is consistent across all error types. Based on the rest of the backend the actual envelope is:

```json
{ "error": { "code": "snake_case_code", "message": "..." } }
```

> ⚠️ The QA handoff doc specifies `{ "status": "error", "message": "...", "code": "..." }` — this is the **stale** format. The rest of the backend uses the `{ error: { code, message } }` envelope. Test against the actual envelope shape.

| ID | HTTP | How to trigger | Verify |
|----|------|----------------|--------|
| E-01 | 401 | No token on any admin route | `error.code: "unauthorized"` |
| E-02 | 403 | Non-admin token | `error.code: "forbidden"` |
| E-03 | 404 | Non-existent hospitalId/userId | `error.code: "not_found"` |
| E-04 | 400 | `?limit=101` or invalid type | `error.code: "validation_error"` with `error.fieldErrors` |

---

## Section 6 — Cross-cutting Checks

| ID | Check |
|----|-------|
| X-01 | All timestamps (`createdAt`, `updatedAt`, `joinedAt`) are ISO 8601 strings, not Unix integers |
| X-02 | Hospital IDs prefixed `HSP-`; user IDs prefixed `USR-`; membership IDs prefixed `MBR-` |
| X-03 | `PATCH /admin/hospitals/:id` with `modules` only writes provided sub-fields (uses dot-notation `$set`); verify unspecified module toggles are unchanged |
| X-04 | `DELETE /admin/hospitals/:id` does NOT cascade-delete hospital members, patients, or EMR records — verify via DB after deletion |
| X-05 | Promoting a user to `isAdmin: true` does not change their `HospitalMember.role` — verify via `GET /admin/users/:userId` memberships |
| X-06 | `GET /admin/users` and `GET /admin/users/:userId` never return `passwordHash`, `twoFactorSecret`, `pendingTwoFactorSecret`, or `tokenVersion` (all have `select: false` in schema — but `.lean()` can bypass this — see preliminary bugs) |

---

## Pre-execution Bug Fix Verification

The following checks confirm the 4 code-level fixes (BUG-A-01 through BUG-A-03) are actually live:

| Bug | Fix claimed | Verification test |
|-----|-------------|-------------------|
| BUG-A-01 | `listUsers` and `findUserById` have `.select('-passwordHash -twoFactorSecret -pendingTwoFactorSecret -tokenVersion')` | U-L-07 and U-G-05 — inspect raw JSON for absence of all 4 fields |
| BUG-A-02 | `.select('+tokenVersion')` removed from `bumpTokenVersion` | D-01 + D-02 — disable a user, confirm 204 returned and previous token rejected; check that `tokenVersion` never appears in any response |
| BUG-A-03 | `updateHospital` now throws `NotFoundError` if `findOneAndUpdate` returns null | H-P-08 — PATCH non-existent hospital → must return 404, not `{ hospital: null }` 200 |
| BUG-A-05 | Not a bug — `isArchived` defaults to `false` in schema | S-02 — `hospitals.active + hospitals.archived === hospitals.total` must hold |

---

## Test Execution Order

```
1. Bootstrap: set alice isAdmin via DB, run seed
2. G-01 through G-05 (guard checks)
3. S-01 through S-02 (stats shape + arithmetic)
4. H-L-01 through H-L-09 (list hospitals)
5. H-G-01 through H-G-04 (get hospital)
6. H-P-01 through H-P-09 (patch hospital)
7. S-03 through S-05 (stats increment checks — use hospitals created/archived in H-P-*)
8. H-D-01 through H-D-05 (delete hospital)
9. U-L-01 through U-L-07 (list users)
10. U-G-01 through U-G-05 (get user)
11. U-P-01 through U-P-08 (patch user)
12. D-01 through D-05 (disable user)
13. E-01 through E-04 (error envelope)
14. X-01 through X-06 (cross-cutting)
```

---

## Scripts Location

Test script will be written to: `docs/qas/scripts/admin.test.mjs`  
Run after `node seed.mjs` and the manual DB bootstrap of alice's `isAdmin` flag.
