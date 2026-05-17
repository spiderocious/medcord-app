# Medcord Role Editing — Backend QA Bug Report

> **QA:** Claude  
> **Date:** 2026-05-17  
> **Last updated:** 2026-05-17 (post-fix retest — all bugs resolved)  
> **Scope:** `PATCH /hospitals/:hospitalId/roles/:roleId` — system role permission editing  
> **Test script:** `docs/qas/backend/scripts/role-editing.test.mjs`  
> **Plan:** `docs/qas/backend/plans/role-editing-test-plan.md`

---

## Summary

| Severity | Count | Status |
|----------|-------|--------|
| P1 — High | 1 | ✅ Fixed & verified |

---

## P1 Bugs

### BUG-RE-01 — System role permission changes are NOT reflected in new JWT after re-login ✅ FIXED

**Test case:** ROLE-E-05b-perms  
**Status:** ~~FAIL~~ → **FIXED & VERIFIED** (retest 2026-05-17: 38 PASS / 0 FAIL)  
**File:** `apps/main-backend/src/lib/permissions.ts` — `resolvePermissions()`

#### What happens

1. `PATCH /roles/:roleId` on a system role (e.g. `doctor`) with a new `permissions` array succeeds (200).
2. The DB record in `custom_roles` is updated correctly — `GET /roles` returns the new permission set.
3. All doctor members' `tokenVersion` is bumped — their old tokens return `401` correctly.
4. A doctor re-logs in to get a new token.
5. **The new JWT contains the original, hardcoded default permissions — NOT the updated ones from the DB.**

#### Evidence (from test run)

```
PATCH /roles/:doctorRoleId  →  { permissions: ["staff.view", "patient.view"] }
-- Response 200, DB updated --
Old token → 401 ✓
Fresh login → new token
GET /staff/me → permissions = [
  "staff.view","patient.view","patient.create","patient.update","patient.admit",
  "patient.transfer","emr.view","emr.vitals.record","emr.medications.view",
  "emr.medications.write","emr.history.write","emr.procedures.write",
  "emr.immunizations.write","emr.documents.write","emr.break_glass",
  "lab.view","lab.create","lab.process","lab.release","review.view",
  "review.act","search.use","notifications.view"
]
Expected: ["staff.view", "patient.view"] only
```

The full 23-permission default doctor set is present — the DB update had zero effect on the JWT.

#### Root cause

`resolvePermissions()` in `apps/main-backend/src/lib/permissions.ts` lines 10–12:

```ts
const systemRoles = Object.values(ROLES) as string[];
if (systemRoles.includes(member.role)) {
  return DEFAULT_ROLE_PERMISSIONS[member.role as Exclude<SystemRole, 'super_admin'>] ?? [];
}
```

For any system role slug, the function short-circuits and returns the compile-time constant from `@medcord/rbac` — it **never reads from the `custom_roles` collection**. The DB write from `updateRole()` is completely ignored at login time.

The fix path for custom roles beneath it (`CustomRoleModel.findOne(...)`) is never reached for system role slugs.

#### Impact

- System role permission editing appears to work (200 response, DB updated, old tokens revoked) but is silently a no-op from the user's perspective — re-login always restores the original hardcoded permissions.
- Administrators cannot actually restrict or extend system role permissions. The feature is half-implemented: write and revocation work, JWT resolution does not.
- Any member assigned a system role will always have the hardcoded permission set regardless of what was saved in the DB.

#### Fix applied

`resolvePermissions()` now queries `CustomRoleModel` for all non-super_admin roles, falling back to `DEFAULT_ROLE_PERMISSIONS` only if no DB record exists. The system-role short-circuit branch is removed.

```ts
// apps/main-backend/src/lib/permissions.ts (as shipped)
export async function resolvePermissions(member: IHospitalMember): Promise<string[] | null> {
  if (member.role === ROLES.SUPER_ADMIN) return null;

  const role = await CustomRoleModel.findOne({
    hospitalId: member.hospitalId,
    slug: member.role,
  }).lean();

  if (role) return role.permissions;

  // Fallback for system roles not yet seeded
  return DEFAULT_ROLE_PERMISSIONS[member.role as Exclude<SystemRole, 'super_admin'>] ?? [];
}
```

#### Verification

ROLE-E-05b-perms passes: after PATCH doctor to `["staff.view", "patient.view"]` and re-login, `GET /staff/me` returns exactly `["staff.view", "patient.view"]`. Retest result: **38 PASS / 0 FAIL**.
