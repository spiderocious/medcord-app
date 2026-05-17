# Medcord Role Editing — QA Test Execution Report

> **QA:** Claude  
> **Date:** 2026-05-17  
> **Last updated:** 2026-05-17 (post-fix retest — all bugs resolved)  
> **Scope:** `PATCH /hospitals/:hospitalId/roles/:roleId` — system role permission editing  
> **Environment:** `localhost:8085` · MongoDB `medcord` (local)  
> **Test script:** `docs/qas/backend/scripts/role-editing.test.mjs`  
> **Plan:** `docs/qas/backend/plans/role-editing-test-plan.md`  
> **Bugs:** `docs/qas/backend/reports/role-editing-bugs.md`

---

## Summary

### Initial run (2026-05-17)

| Section | Tests | Pass | Fail | Blocked | Bugs |
|---------|-------|------|------|---------|------|
| 1. System Role Permission Update | 12 | 12 | 0 | 0 | — |
| 2. Custom Role Update (Regression) | 8 | 8 | 0 | 0 | — |
| 3. Permission Guard | 4 | 4 | 0 | 0 | — |
| 4. Delete Regression | 3 | 3 | 0 | 0 | — |
| 5. Session Revocation | 7 | 6 | 1 | 0 | BUG-RE-01 |
| 6. Error Envelope | 4 | 4 | 0 | 0 | — |
| **Total** | **38** | **37** | **1** | **0** | **1 new** |

### Post-fix retest (2026-05-17) ✅ CLEAN

| Section | Tests | Pass | Fail | Blocked |
|---------|-------|------|------|---------|
| 1. System Role Permission Update | 12 | 12 | 0 | 0 |
| 2. Custom Role Update (Regression) | 8 | 8 | 0 | 0 |
| 3. Permission Guard | 4 | 4 | 0 | 0 |
| 4. Delete Regression | 3 | 3 | 0 | 0 |
| 5. Session Revocation | 7 | 7 | 0 | 0 |
| 6. Error Envelope | 4 | 4 | 0 | 0 |
| **Total** | **38** | **38** | **0** | **0** |

**38 / 38 tests pass (100%).** All bugs fixed and verified.

---

## Section Results

### 1. System Role Permission Update — 12/12 PASS ✅

- `PATCH /roles/:roleId` on a system role with `{ permissions: [...] }` returns `200`.
- Response `role.permissions` matches the sent array exactly.
- `role.isSystem` remains `true` in the response.
- `role.name` is unchanged (name field stripped from patch for system roles).
- `GET /roles` after the PATCH returns the updated permission set — DB write is correct.
- Sending `{ name: "...", permissions: [...] }` — name silently ignored, permissions applied.
- Sending `{ name: "..." }` only — no-op, role unchanged (no permissions in body → empty patch).
- Sending `{}` — no-op, 200 returned.

### 2. Custom Role Update (Regression) — 8/8 PASS ✅

Custom role PATCH behaviour is unchanged: both `name` and `permissions` are applied, `isSystem` stays `false`. Name-only, permissions-only, and combined updates all work correctly.

### 3. Permission Guard — 4/4 PASS ✅

- `doctor` (no `settings.update`) → 403.
- `nurse` → 403.
- No token → 401.
- `hospital_admin` (has `settings.update`) → 200.

### 4. Delete Regression — 3/3 PASS ✅

`DELETE /roles/:roleId` on a system role still returns `403` with message containing "System roles cannot be deleted". Custom role delete still returns `204`. The delete guard is unaffected by the `updateRole` change.

### 5. Session Revocation — 7/7 PASS ✅ (6/7 initial, fixed)

- Old token → `401` after system role permission change (tokenVersion bump fires correctly).
- Nurse token unaffected (only doctor members revoked).
- Fresh login succeeds after revocation.
- **ROLE-E-05b-perms — FIXED:** After re-login, `GET /staff/me` now returns exactly the permissions written by the PATCH (`["staff.view", "patient.view"]`), not the hardcoded defaults. `resolvePermissions()` now queries `CustomRoleModel` first for all non-super_admin roles.
- Name-only PATCH (`body.permissions === undefined`) does NOT revoke session — correct.

### 6. Error Envelope — 4/4 PASS ✅

All error responses (`401`, `403`, `404`) carry `{ "error": { "code": "...", "message": "..." } }` correctly. No partial data leaks in error bodies.

---

## Bug Found & Resolved

### BUG-RE-01 — System role permission changes not reflected in JWT on re-login ✅ FIXED

~~`resolvePermissions()` short-circuited for system role slugs and returned the hardcoded `DEFAULT_ROLE_PERMISSIONS` constant, ignoring the DB.~~

**Fixed:** `resolvePermissions()` in `apps/main-backend/src/lib/permissions.ts` now queries `CustomRoleModel` for all non-super_admin roles, falling back to `DEFAULT_ROLE_PERMISSIONS` only if no DB record exists.

**Verified:** ROLE-E-05b-perms passes — re-login after system role permission change returns the updated permission set in `GET /staff/me`.

---

## Recommendation

**CLEARED FOR RELEASE.** All tests pass. The system role permission editing feature is fully functional end-to-end: write, revocation, and JWT resolution all work correctly.
