# Medcord — Role Editing Backend QA Test Plan

> **QA:** Claude  
> **Date:** 2026-05-17  
> **Scope:** `PATCH /hospitals/:hospitalId/roles/:roleId` — system role permission editing  
> **Explicitly out of scope:** Frontend, custom role CRUD (already covered in RBAC plan), `DELETE /roles/:roleId` beyond regression check  
> **Handoff doc:** `docs/qas/backend/role-editing-handoff.md`  
> **RBAC reference:** `docs/api/rbac.md`  
> **Backend files reviewed:**
> - `apps/main-backend/src/features/staff/staff.service.ts` — `updateRole()`
> - `apps/main-backend/src/features/staff/staff.repo.ts` — `updateRole()`
> - `apps/main-backend/src/features/staff/staff.routes.ts`

---

## Environment & Setup

| Item | Value |
|------|-------|
| Base URL | `http://localhost:8085/api/v1` |
| Auth header | `Authorization: Bearer <accessToken>` |
| DB | MongoDB `medcord` (local) |
| Error envelope | `{ "error": { "code": "snake_case", "message": "..." } }` |
| Success envelope | `{ "data": { ... } }` |

---

## Key Implementation Notes (from source read)

1. **`updateRole()` patch logic:** For system roles (`isSystem: true`), only `permissions` is applied — `name` is stripped from the patch. For custom roles, both `name` and `permissions` are accepted unchanged.

2. **Session revocation:** `bumpTokenVersion` is called for ALL members assigned the role's slug whenever `body.permissions !== undefined` — even for system roles. This fires regardless of whether permissions actually changed.

3. **Delete guard unchanged:** `deleteRole()` still throws `ForbiddenError('System roles cannot be deleted')` for system roles.

4. **No permission-set validation:** There is no server-side check that the permissions array contains only known permission strings. Arbitrary strings in the permissions array will be stored.

5. **Revocation uses role slug, not roleId:** `HospitalMemberModel.find({ hospitalId, role: role.slug })` — ensures all members with that role across the hospital get bumped, not just future ones.

---

## Test Cases

### Section 1 — System Role Permission Update

| ID | Description | Method | Path | Body | Expected |
|----|-------------|--------|------|------|----------|
| ROLE-E-01 | Update permissions on a system role | PATCH | `/hospitals/:id/roles/:doctorRoleId` | `{ "permissions": ["staff.view", "patient.view"] }` | 200, `role.permissions` = sent array, `role.isSystem` = true |
| ROLE-E-01b | Persisted — GET after update shows new permissions | GET | `/hospitals/:id/roles` | — | doctor role in list has updated permissions |
| ROLE-E-02 | Name + permissions sent — name is ignored | PATCH | `/hospitals/:id/roles/:doctorRoleId` | `{ "name": "Changed Name", "permissions": ["staff.view"] }` | 200, `role.name` unchanged (original), `role.permissions` updated |
| ROLE-E-03 | Only name sent — no-op for system role | PATCH | `/hospitals/:id/roles/:doctorRoleId` | `{ "name": "Changed Name" }` | 200, role unchanged (name and permissions identical to pre-call) |
| ROLE-E-03b | Empty object sent | PATCH | `/hospitals/:id/roles/:doctorRoleId` | `{}` | 200, role unchanged |

### Section 2 — Custom Role Update (Regression)

| ID | Description | Method | Path | Body | Expected |
|----|-------------|--------|------|------|----------|
| ROLE-E-06a | Custom role: update permissions | PATCH | `/hospitals/:id/roles/:customRoleId` | `{ "permissions": ["asset.view"] }` | 200, permissions updated |
| ROLE-E-06b | Custom role: update name | PATCH | `/hospitals/:id/roles/:customRoleId` | `{ "name": "Senior Cleaner" }` | 200, name updated |
| ROLE-E-06c | Custom role: update both name and permissions | PATCH | `/hospitals/:id/roles/:customRoleId` | `{ "name": "X", "permissions": ["staff.view"] }` | 200, both updated |

### Section 3 — Permission Guard

| ID | Description | Method | Path | Actor | Expected |
|----|-------------|--------|------|-------|----------|
| ROLE-E-07a | Doctor (no settings.update) cannot PATCH system role | PATCH | `/hospitals/:id/roles/:doctorRoleId` | doctor | 403 |
| ROLE-E-07b | Nurse cannot PATCH any role | PATCH | `/hospitals/:id/roles/:doctorRoleId` | nurse | 403 |
| ROLE-E-07c | No token → 401 | PATCH | `/hospitals/:id/roles/:doctorRoleId` | none | 401 |
| ROLE-E-07d | hospital_admin (has settings.update) can PATCH system role | PATCH | `/hospitals/:id/roles/:doctorRoleId` | hospital_admin | 200 |

### Section 4 — Delete Regression

| ID | Description | Method | Path | Expected |
|----|-------------|--------|------|----------|
| ROLE-E-04 | DELETE system role still returns 403 | DELETE | `/hospitals/:id/roles/:doctorRoleId` | 403, message contains "System roles cannot be deleted" |
| ROLE-E-04b | DELETE custom role still works | DELETE | `/hospitals/:id/roles/:customRoleId` | 204 |

### Section 5 — Session Revocation on System Role Permission Change

| ID | Description | Steps | Expected |
|----|-------------|-------|----------|
| ROLE-E-05a | Old token → 401 after system role permission change | 1. Login as doctor. 2. PATCH doctor role permissions. 3. Use old token. | 401 |
| ROLE-E-05b | Fresh login gets updated permissions | 4. Login as doctor again. 5. GET /staff/me. | `permissions` reflects the patched set |
| ROLE-E-05c | Non-doctor token unaffected | After step 2, use nurse token on any endpoint. | 200 — only doctor tokens revoked |
| ROLE-E-05d | Name-only PATCH does NOT revoke session | 1. Login as doctor. 2. PATCH doctor role with name only. 3. Use old token. | 200 — `body.permissions === undefined`, no bump |

### Section 6 — Error Envelope

| ID | Description | Expected |
|----|-------------|----------|
| ENV-01 | 401 has `{ error: { code, message } }` | Envelope correct |
| ENV-02 | 403 has `{ error: { code, message } }` | Envelope correct |
| ENV-03 | 404 (non-existent roleId) has correct envelope | Envelope correct |

---

## Out of Scope

- System role seeding — covered in RBAC plan
- Custom role CRUD (create, delete) — covered in RBAC plan
- Frontend roles screen — separate test
- Known behaviour: no server-side validation of permission string values (arbitrary strings are stored) — not a regression, pre-existing
