# QA Handoff — Role Editing Backend

**Date:** 2026-05-17
**Build status:** Typecheck clean ✅ · Lint clean ✅
**Scope:** `PATCH /hospitals/:hospitalId/roles/:roleId` — system role permission editing

---

## What changed

`updateRole()` in `apps/main-backend/src/features/staff/staff.service.ts` previously threw `403 Forbidden` for any update to a system role (`isSystem: true`). That guard is removed.

**New behaviour:**
- System roles: `PATCH /roles/:roleId` with `{ "permissions": [...] }` is accepted. Only `permissions` is applied — `name` is ignored even if sent.
- Custom roles: unchanged — both `name` and `permissions` are accepted.
- Delete (`DELETE /roles/:roleId`) still returns `403` for system roles. That guard is untouched.
- Session revocation on permission change: unchanged — all members assigned the updated role have `tokenVersion` bumped, forcing re-login.

---

## Test cases

### ROLE-E-01 — Update permissions on a system role

```
PATCH /api/v1/hospitals/:hospitalId/roles/:roleId
Authorization: Bearer <hospital_admin token>
Content-Type: application/json

{ "permissions": ["staff.view", "patient.view"] }
```

**Expect:** `200 OK` with updated role object. `role.permissions` matches the sent array. `role.isSystem` remains `true`. `role.name` is unchanged.

### ROLE-E-02 — Name is ignored for system roles

```
PATCH /api/v1/hospitals/:hospitalId/roles/:roleId   (system role)
{ "name": "Changed Name", "permissions": ["staff.view"] }
```

**Expect:** `200 OK`. `role.name` in the response is the **original** system role name — the sent `name` is silently ignored.

### ROLE-E-03 — Update with only name on a system role

```
PATCH /api/v1/hospitals/:hospitalId/roles/:roleId   (system role)
{ "name": "Changed Name" }
```

**Expect:** `200 OK`. Role is returned unchanged — `name` not applied, no permissions changed. (Empty patch is a no-op.)

### ROLE-E-04 — Delete a system role still returns 403

```
DELETE /api/v1/hospitals/:hospitalId/roles/:roleId  (system role)
```

**Expect:** `403 Forbidden` with message containing "System roles cannot be deleted".

### ROLE-E-05 — Session revocation fires for system role permission change

Setup: log in as a `doctor`. Record the access token.
Call `PATCH /roles/:doctorRoleId` with a changed `permissions` array (doctor is a system role).
Use the old doctor token on any endpoint.

**Expect:** `401 Unauthorized`. The token version was bumped for all members with `role: 'doctor'`.

### ROLE-E-06 — Custom role update unchanged

```
PATCH /api/v1/hospitals/:hospitalId/roles/:roleId   (custom role, isSystem: false)
{ "name": "Senior Cleaner", "permissions": ["asset.view"] }
```

**Expect:** `200 OK`. Both `name` and `permissions` updated. Behaviour identical to before.

### ROLE-E-07 — Requires settings.update permission

Call `PATCH /roles/:roleId` (any role) with a token that does **not** have `settings.update`.

**Expect:** `403 Forbidden`.

---

## File changed

`apps/main-backend/src/features/staff/staff.service.ts` — `updateRole()` function.

Old:
```ts
if (role.isSystem) throw new ForbiddenError('System roles cannot be modified');
const updated = await staffRepo.updateRole(roleId, body as Partial<ICustomRole>);
```

New:
```ts
const patch: Partial<ICustomRole> = role.isSystem
  ? (body.permissions !== undefined ? { permissions: body.permissions } : {})
  : (body as Partial<ICustomRole>);
const updated = await staffRepo.updateRole(roleId, patch);
```
