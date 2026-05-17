# Medcord RBAC — Backend QA Bug Report

> **QA:** Claude  
> **Date:** 2026-05-17  
> **Last updated:** 2026-05-17 (post-fix retest)  
> **Scope:** RBAC redesign — system role seeding, permission enforcement, session revocation, custom roles CRUD, super_admin bypass  
> **Test script:** `docs/qas/backend/scripts/rbac.test.mjs`  
> **Plan:** `docs/qas/backend/plans/rbac-test-plan.md`

---

## Summary

| Severity | Count | Status |
|----------|-------|--------|
| P0 — Critical Security | 1 | ✅ Fixed & verified |
| P1 — High | 0 | — |
| P2 — Medium | 0 | — |
| Plan corrections (not bugs) | 2 | ✅ Docs updated |
| Static findings | 4 | ✅ All resolved |

---

## P0 Security Bugs

### BUG-RBAC-01 — Any staff.invite holder can invite a user as super_admin, granting full permission bypass ✅ FIXED

**Test case:** INV-06  
**Status:** ~~FAIL~~ → **FIXED & VERIFIED** (retest 2026-05-17: 170 PASS / 0 FAIL)  
**File:** `apps/main-backend/src/features/staff/staff.service.ts` — `invite()` function  
**Schema file:** `apps/main-backend/src/features/staff/staff.schema.ts` — `InviteBody` / `roleSlug`

#### What happens

1. A user with `staff.invite` permission calls `POST /hospitals/:hospitalId/invitations` with body `{ "email": "attacker@example.com", "role": "super_admin" }`.
2. The server returns **201 Created** — no validation rejects `super_admin` as an invitable role.
3. The invited user calls `POST /invitations/:token/accept` with `{ "name": "...", "password": "..." }`.
4. A new hospital membership is created with `role: 'super_admin'`.
5. The accepted user logs in. `resolveAllPermissions()` in `apps/main-backend/src/lib/permissions.ts` detects `member.role === 'super_admin'` and writes `["__super_admin__"]` into `hospitalPermissions[hospitalId]` in the JWT.
6. The user's JWT now carries the super_admin sentinel.
7. `hospitalScope` middleware sets `req.hospitalMember.isSuperAdmin = true`.
8. `requirePermission()` calls `next()` immediately — **all permission checks are bypassed** for this hospital.

#### Evidence (from test run)

```
Token decoded: hospitalPermissions[HSP-fab61cd9-...] = ["__super_admin__"]
Expected: NOT to contain __super_admin__
```

#### Root cause

`InviteBody.role` uses `roleSlug` which is a plain `z.string()` — it accepts any string including `super_admin`. The `invite()` service function does not check whether the supplied role slug is `super_admin` before creating the invitation.

`super_admin` is intended to be granted only by `hospitalService.create()` (hospital founder). There is no code path that prevents it from being assigned through the invitation flow.

#### Impact

- Any hospital member with `staff.invite` (e.g. `hospital_admin`) can silently escalate any external user to full super_admin access.
- The escalated user bypasses all `requirePermission` checks on every hospital-scoped endpoint: patient creation, EMR read/write, medication prescribing, asset deletion, settings update, audit log access — everything.
- The attack requires only one valid invitation token and is undetectable before the accepted user's token is decoded.

#### Fix applied (both layers)

**Layer 1 — Schema (`staff.schema.ts:5-10`):** `roleSlug` now has `.refine(v => v !== 'super_admin', ...)`. Applies to `InviteBody`, `BulkInviteBody`, and `UpdateMemberBody` since all three share the same `roleSlug` definition. Returns `400` on attempt.

**Layer 2 — Service (`staff.service.ts`):** Explicit `ForbiddenError` guard at the top of `invite()` and `updateMember()` as defence-in-depth.

#### Verification

`POST /hospitals/:id/invitations` with `{ role: "super_admin" }` now returns `400`. INV-06 passes. Retest result: **170 PASS / 0 FAIL**.

---

## Plan Corrections (Not Bugs — Handoff Doc Was Incorrect)

These were discovered during static analysis and confirmed at runtime. The source code is correct; the handoff document contained inaccurate permission assignments.

### FIND-RBAC-01 — `tech` role has `staff.view` (handoff doc said it should be blocked) ✅ DOC FIXED

**Source of truth:** `packages/rbac/src/roles.ts` — `tech` role includes `staff.view`.  
**Handoff doc claim:** Section 4 permission table listed `tech` as a "blocked role" for `GET /hospitals/:id/staff` (which requires `staff.view`).  
**Actual behaviour:** `GET /hospitals/:id/staff` with a `tech` token returns **200** — correct and expected.  
**Plan correction:** PERM-03 was updated to treat `tech` as an allowed actor, not blocked.  
**Resolution:** `docs/qas/rbac-handoff.md` updated — `GET /staff` row added with `tech` in Allowed column.

### FIND-RBAC-02 — `lab_tech` role has `emr.view` (handoff doc said it should be blocked) ✅ DOC FIXED

**Source of truth:** `packages/rbac/src/roles.ts` — `lab_tech` role includes `emr.view`.  
**Handoff doc claim:** Section 4 permission table listed `lab_tech` as a "blocked role" for `GET /patients/:id/chart` (which requires `emr.view`).  
**Actual behaviour:** `GET /chart` with a `lab_tech` token returns **200** — correct and expected.  
**Plan correction:** PERM-09 was updated to include `lab_tech` as an allowed actor alongside `doctor` and `nurse`.  
**Resolution:** `docs/qas/rbac-handoff.md` updated — `lab_tech` moved to Allowed column for `GET /chart`.

---

## Static Findings (Pre-execution Code Review)

These were identified during static analysis before the test run and confirmed by runtime behaviour.

### RBAC-S-01 — Lab routes are mounted at `/labs`, not `/lab-orders` ✅ DOC FIXED

**File:** `apps/main-backend/src/features/labs/index.ts`  
**Finding:** Lab order routes are mounted at `/api/v1/hospitals/:hospitalId/patients/:patientId/labs`. The handoff doc and API reference use `/lab-orders` — both are incorrect.  
**Impact:** Any client or test using `/lab-orders` will get 404. Frontend and external integrations must use `/labs`.  
**Severity:** Documentation gap — no code change needed.  
**Resolution:** All 6 lab route paths corrected from `/lab-orders` to `/labs` in `docs/api/rbac.md`. `docs/qas/rbac-handoff.md` also updated.

### RBAC-S-02 — `listStaff` role filter (`?role=`) only accepts system role slugs ✅ FIXED & VERIFIED

**File:** `apps/main-backend/src/features/staff/staff.schema.ts` — `ListStaffQuery.role`  
**Finding:** The `role` query parameter used `systemRoleEnum` (a Zod enum of the 10 system role slugs). Filtering by a custom role slug returned a 400 validation error.  
**Impact:** Custom roles could not be used in the staff directory filter.  
**Severity:** Feature gap.  
**Fix applied:** `staff.schema.ts:71` — `ListStaffQuery.role` changed to `z.string().optional()`. Filter type widened from `StaffRole` to `string` in `staff.repo.ts`.  
**Verification:** XC-06b passes — `GET /staff?role=cleaner-...` returns `200`.

### RBAC-S-03 — `resolvePermissions()` for super_admin returns `null`, not `[]`

**File:** `apps/main-backend/src/lib/permissions.ts`  
**Finding:** When `role === 'super_admin'`, `resolvePermissions()` returns `null` (not an empty array). `GET /staff/me` correctly exposes this as `permissions: null`. Any consumer that iterates `permissions` without a null check will crash.  
**Impact:** Low — the current frontend must handle `null` explicitly. Worth noting for SDK/consumer documentation.  
**Severity:** Documentation gap — no code change needed.

### RBAC-S-04 — Session revocation on role change only fires if `body.role !== member.role`

**File:** `apps/main-backend/src/features/staff/staff.service.ts` — `updateMember()`  
**Finding:** `bumpTokenVersion` is only called when the new role differs from the current role. If a PATCH request resends the same role slug (e.g. as part of a bulk update), the session is not revoked and no stale-token issue occurs. This is correct and intentional.  
**Impact:** None — behaviour is correct. Documented here for clarity.  
**Severity:** Informational.
