# QA Handoff — Role View + Member Counts (Backend)

**Date:** 2026-05-17
**Build status:** Typecheck clean ✅
**Scope:** `GET /roles` member counts · `resolvePermissions()` BUG-RE-01 fix

---

## What changed

### 1. `GET /hospitals/:hospitalId/roles` — `memberCount` added per role

**File:** `apps/main-backend/src/features/staff/staff.service.ts` — `listRoles()`

Each role object in the response now includes `memberCount: number` — the count of `active` members whose `role` field matches that role's slug in this hospital.

**Response shape (updated):**
```json
{
  "data": {
    "roles": [
      {
        "id": "...",
        "name": "Doctor",
        "slug": "doctor",
        "isSystem": true,
        "permissions": ["patient.view", "..."],
        "memberCount": 4,
        "createdAt": "...",
        "updatedAt": "..."
      }
    ],
    "permissionDescriptions": { ... },
    "permissionGroups": [ ... ]
  }
}
```

`memberCount` is always a non-negative integer (0 if no active members assigned).

### 2. `resolvePermissions()` — BUG-RE-01 fix

**File:** `apps/main-backend/src/lib/permissions.ts`

**Old behaviour (broken):** For any system role slug (`doctor`, `nurse`, `admin`, etc.), the function immediately returned the compile-time constant `DEFAULT_ROLE_PERMISSIONS[slug]` without consulting the database. System role permission edits were written to the DB correctly, but completely ignored at login/token-resolution time.

**New behaviour:** For all non-`super_admin` roles (system or custom), `resolvePermissions()` now queries `CustomRoleModel` first. If a DB record exists (which it will for all seeded system roles), its `permissions` array is used. The hardcoded `DEFAULT_ROLE_PERMISSIONS` constant is now only a fallback for the rare case where a system role has not yet been seeded (e.g. a fresh hospital during setup before `seedDefaultRoles` has run).

```ts
// New
export async function resolvePermissions(member: IHospitalMember): Promise<string[] | null> {
  if (member.role === ROLES.SUPER_ADMIN) return null;
  const role = await CustomRoleModel.findOne({ hospitalId: member.hospitalId, slug: member.role }).lean();
  if (role) return role.permissions;
  return DEFAULT_ROLE_PERMISSIONS[member.role as Exclude<SystemRole, 'super_admin'>] ?? [];
}
```

---

## Test cases

### ROLE-V-01 — `GET /roles` returns `memberCount`

```
GET /api/v1/hospitals/:hospitalId/roles
Authorization: Bearer <any valid staff token>
```

**Expect:** Every object in `data.roles` has a `memberCount` field that is a non-negative integer. For a hospital with 3 active doctors, the `doctor` role entry has `memberCount: 3`.

### ROLE-V-02 — `memberCount` reflects active members only

Setup: suspend one doctor in the hospital. Call `GET /roles`.

**Expect:** `doctor.memberCount` decrements by 1 (suspended members are `status: 'suspended'`, not counted).

### ROLE-V-03 — `memberCount` is 0 for a role with no members

Create a new custom role with no invited members. Call `GET /roles`.

**Expect:** The new role entry has `memberCount: 0`.

---

### ROLE-V-04 — BUG-RE-01: System role permission edit reflected at next login

```
PATCH /api/v1/hospitals/:hospitalId/roles/:doctorRoleId
Authorization: Bearer <settings.update token>
Content-Type: application/json

{ "permissions": ["patient.view", "staff.view"] }
```

Then log in fresh as a Doctor user (old token should 401 first).

```
POST /api/v1/auth/login
{ "email": "...", "password": "..." }
```

Then:
```
GET /api/v1/hospitals/:hospitalId/staff/me
Authorization: Bearer <new doctor token>
```

**Expect:** `data.permissions` = `["patient.view", "staff.view"]` — exactly the array that was patched. NOT the original 23-permission default set.

### ROLE-V-05 — Fallback when role not seeded

This is an edge case — should never happen in normal flow since `seedDefaultRoles` runs at hospital creation. Covered by the fallback logic in code; no manual test required. Verify the fallback does not throw.

### ROLE-V-06 — `super_admin` unaffected

`resolvePermissions()` for a `super_admin` member still returns `null` immediately (bypass path unchanged). Verify `GET /staff/me` for a super_admin still shows `isSuperAdmin: true` and the correct sentinel in the JWT.

---

## Files changed

| File | Change |
|------|--------|
| `apps/main-backend/src/lib/permissions.ts` | `resolvePermissions()` — remove system-role short-circuit, query DB first for all non-super_admin roles |
| `apps/main-backend/src/features/staff/staff.service.ts` | `listRoles()` — add `HospitalMemberModel.countDocuments` per role, attach `memberCount` |
