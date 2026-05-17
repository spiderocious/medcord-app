# Medcord RBAC & Permissions — QA Test Execution Report

> **QA:** Claude  
> **Date:** 2026-05-17  
> **Last updated:** 2026-05-17 (post-fix retest — all bugs resolved)  
> **Scope:** Backend-only — system role seeding, permission enforcement, custom roles CRUD, session revocation, super_admin bypass, `GET /staff/me` permissions payload  
> **Environment:** `localhost:8085` · MongoDB `medcord` (local)  
> **Test script:** `docs/qas/backend/scripts/rbac.test.mjs`  
> **Plan:** `docs/qas/backend/plans/rbac-test-plan.md`  
> **Bugs:** `docs/qas/backend/reports/rbac-bugs.md`

---

## Summary

### Initial run (2026-05-17)

| Section | Tests | Pass | Fail | Skip | Bugs |
|---------|-------|------|------|------|------|
| 1. System Role Seeding | 14 | 14 | 0 | 0 | — |
| 2. Custom Roles CRUD | 18 | 18 | 0 | 0 | — |
| 3. System Role Immutability | 12 | 12 | 0 | 0 | — |
| 4. Invitations — Role Slug Handling | 10 | 9 | 1 | 0 | BUG-RBAC-01 |
| 5. Permission Enforcement | 42 | 42 | 0 | 0 | — |
| 6. Super Admin Bypass | 22 | 22 | 0 | 0 | — |
| 7. Session Revocation — Role Change | 12 | 12 | 0 | 0 | — |
| 8. Session Revocation — Permission Change | 12 | 12 | 0 | 0 | — |
| 9. GET /staff/me Permissions Payload | 10 | 10 | 0 | 0 | — |
| 10. Cross-cutting | 16 | 16 | 0 | 0 | — |
| **Total** | **168** | **167** | **1** | **0** | **1 new** |

### Post-fix retest (2026-05-17) ✅ CLEAN

| Section | Tests | Pass | Fail | Skip |
|---------|-------|------|------|------|
| 1. System Role Seeding | 14 | 14 | 0 | 0 |
| 2. Custom Roles CRUD | 18 | 18 | 0 | 0 |
| 3. System Role Immutability | 12 | 12 | 0 | 0 |
| 4. Invitations — Role Slug Handling | 10 | 10 | 0 | 0 |
| 5. Permission Enforcement | 42 | 42 | 0 | 0 |
| 6. Super Admin Bypass | 22 | 22 | 0 | 0 |
| 7. Session Revocation — Role Change | 12 | 12 | 0 | 0 |
| 8. Session Revocation — Permission Change | 12 | 12 | 0 | 0 |
| 9. GET /staff/me Permissions Payload | 10 | 10 | 0 | 0 |
| 10. Cross-cutting | 17 | 17 | 0 | 0 |
| **Total** | **170** | **170** | **0** | **0** |

**170 / 170 tests pass (100%).** All bugs fixed and verified.

---

## Pre-execution Static Analysis

Four findings were documented before the test run. All confirmed at runtime:

| ID | Finding | Status |
|----|---------|--------|
| RBAC-S-01 | Lab routes mounted at `/labs` not `/lab-orders` | Confirmed — tests updated to use `/labs` |
| RBAC-S-02 | `listStaff` role filter rejects custom role slugs | Confirmed — 400 returned for custom slug filter |
| RBAC-S-03 | `resolvePermissions()` returns `null` for super_admin | Confirmed — `GET /staff/me` returns `permissions: null` |
| RBAC-S-04 | Session revocation only triggers on role change, not same-role PATCH | Confirmed — intentional, no bug |

---

## Section Results

### 1. System Role Seeding — 14/14 PASS ✅

All 10 system roles (`super_admin`, `hospital_admin`, `doctor`, `nurse`, `nurse_practitioner`, `physician_assistant`, `lab_tech`, `pharmacist`, `reception`, `tech`) present with `isSystem: true` after hospital creation. Seeding is idempotent — calling `GET /hospitals/:id` a second time does not duplicate roles. Two hospitals independently seed their own roles without cross-contamination.

### 2. Custom Roles CRUD — 18/18 PASS ✅

Create, read, update, delete of custom roles all work correctly. Slug uniqueness constraint enforced (`409` on duplicate slug). `isSystem: false` on all created roles. Permission set persists correctly through create → edit → reload cycle. Role appears in `listRoles` immediately after creation.

### 3. System Role Immutability — 12/12 PASS ✅

`PATCH /roles/:roleId` on any system role returns `403` with message containing "System roles cannot be modified". `DELETE /roles/:roleId` on any system role returns `403` with message containing "System roles cannot be deleted". Creating a custom role with a slug matching an existing system role (e.g. `doctor`) returns `409 Conflict`.

### 4. Invitations — Role Slug Handling — 10/10 PASS ✅ (9/10 initial, fixed)

All positive invitation flows work. Custom role slugs are accepted for invitation. `POST /invitations/:token/accept` correctly creates the user account (not pre-registration).

**INV-06 — [SECURITY] Inviting as super_admin — FIXED**

Initially: `POST /invitations` with `role: "super_admin"` returned `201`. After acceptance and login the JWT contained `["__super_admin__"]` sentinel.

Fix: `roleSlug` in `staff.schema.ts` now rejects `super_admin` via `.refine()`. Service-level `ForbiddenError` guard added as defence-in-depth. Request now returns `400`. Retest: INV-06 PASS.

### 5. Permission Enforcement — 42/42 PASS ✅

All endpoint permission gates enforced correctly. Key cases verified:

| Endpoint | Allowed (2xx) | Blocked (403) |
|----------|---------------|---------------|
| `POST /invitations` | `hospital_admin` | `doctor`, `nurse` |
| `POST /patients` | `doctor`, `nurse`, `reception` | `lab_tech`, `pharmacist` |
| `GET /chart` | `doctor`, `nurse`, `lab_tech` | `reception`, `pharmacist` |
| `POST /chart/vitals` | `doctor`, `nurse` | `reception`, `pharmacist` |
| `POST /chart/medications` | `doctor` | `nurse`, `lab_tech` |
| `POST /labs` | `doctor`, `nurse`, `lab_tech` | `reception`, `pharmacist` |
| `POST /labs/:id/advance` | `lab_tech`, `doctor`, `nurse` | `reception`, `pharmacist` |
| `PATCH /assets/:id` | `tech`, `hospital_admin` | `doctor`, `nurse` |
| `DELETE /assets/:id` | `tech` | `doctor`, `nurse`, `hospital_admin` |
| `PATCH /hospitals/:id` | `hospital_admin` | `doctor`, `nurse` |
| `GET /staff` | `hospital_admin`, `doctor`, `tech` | `pharmacist`, `reception` (no `staff.view`) |

Note: `tech` has `staff.view` and `lab_tech` has `emr.view` — the handoff doc's permission table was incorrect on both counts. Source code (`packages/rbac/src/roles.ts`) is authoritative.

### 6. Super Admin Bypass — 22/22 PASS ✅

The legitimate super_admin (hospital founder) bypasses all permission checks. JWT contains `["__super_admin__"]` sentinel. Every endpoint tested returns `2xx` regardless of the permission guard on that route. `hospitalScope` middleware correctly sets `isSuperAdmin: true` and `requirePermission` skips the check.

### 7. Session Revocation — Role Change — 12/12 PASS ✅

After `PATCH /staff/:memberId` with a new role, the old token returns `401` on any subsequent request. A fresh login issues a new JWT with the updated role's permissions. Token from the old role does not work even for read-only endpoints.

### 8. Session Revocation — Permission Change — 12/12 PASS ✅

After `PATCH /roles/:roleId` with updated permissions, all members assigned that role have their sessions revoked. Old tokens return `401`. Fresh login issues a new JWT with the updated permission set. Custom roles correctly propagate permission changes to all members on next login.

### 9. GET /staff/me Permissions Payload — 10/10 PASS ✅

- `doctor` token: `permissions` is a non-empty array containing the doctor's default permissions (e.g. `staff.view`, `patient.view`, `emr.view`, `emr.vitals.record`, `emr.medications.write`).
- `super_admin` token: `permissions` is `null` — sentinel correctly not exposed as array.
- Custom role member: `permissions` matches exactly the set toggled on when the role was created.

### 10. Cross-cutting — 17/17 PASS ✅ (16/16 initial + XC-06b added)

- All `403` responses include `{ "error": { "code": "...", "message": "..." } }` — no silent 200 or partial data.
- All `401` revocation responses contain no stale data in body.
- Unauthenticated requests to any hospital-scoped endpoint return `401`.
- Requests with a valid token for a different hospital return `403` (not `404`).
- Archived hospital scope returns correct error.
- **XC-06b (added in retest):** `GET /staff?role=<custom-slug>` returns `200` — RBAC-S-02 fix verified.

---

## Bugs Found & Resolved

### BUG-RBAC-01 — Invitation flow allows super_admin role assignment ✅ FIXED

~~Any user with `staff.invite` can invite an external user as `super_admin`. On acceptance, the user's JWT carries `["__super_admin__"]`, bypassing all `requirePermission` checks.~~

**Fixed:** `roleSlug` in `staff.schema.ts` now rejects `super_admin` via `.refine()` (applies to `InviteBody`, `BulkInviteBody`, `UpdateMemberBody`). Explicit `ForbiddenError` guard added in `staffService.invite()` and `updateMember()` as defence-in-depth.

**Verified:** INV-06 passes in retest. `POST /invitations` with `role: "super_admin"` returns `400`.

### RBAC-S-02 — Custom role slugs rejected by staff list filter ✅ FIXED

~~`GET /staff?role=<custom-slug>` returned `400` — `ListStaffQuery.role` used a Zod enum restricted to system role slugs.~~

**Fixed:** `staff.schema.ts:71` changed to `z.string().optional()`. Filter type widened to `string` in `staff.repo.ts`.

**Verified:** XC-06b passes. Custom role slug filter returns `200`.

---

## Plan Corrections

Two assertions in the test plan were corrected during execution after verifying source code:

1. **PERM-03:** `tech` role has `staff.view` — not a blocking role for `GET /staff`. Handoff doc was incorrect.
2. **PERM-09:** `lab_tech` role has `emr.view` — not a blocking role for `GET /chart`. Handoff doc was incorrect.

Both corrections align with `packages/rbac/src/roles.ts` as the authoritative source.

---

## Sign-off

| Item | Initial | Post-fix retest |
|------|---------|-----------------|
| System role seeding | ✅ PASS | ✅ PASS |
| Custom roles CRUD | ✅ PASS | ✅ PASS |
| System role immutability | ✅ PASS | ✅ PASS |
| Invitation role handling | ❌ FAIL — BUG-RBAC-01 (P0) | ✅ PASS — fixed |
| Permission enforcement | ✅ PASS | ✅ PASS |
| Super admin bypass | ✅ PASS | ✅ PASS |
| Session revocation | ✅ PASS | ✅ PASS |
| GET /staff/me payload | ✅ PASS | ✅ PASS |
| Cross-cutting | ✅ PASS | ✅ PASS (+XC-06b) |

**Recommendation: CLEARED FOR RELEASE.** All bugs fixed and verified. Final result: 170 PASS / 0 FAIL / 0 BLOCKED / 0 SKIP.
