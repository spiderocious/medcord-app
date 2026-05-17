# Medcord RBAC & Permissions — Backend QA Test Plan

> **QA:** Claude  
> **Date:** 2026-05-17  
> **Scope:** Backend-only — RBAC enforcement, system role seeding, custom roles CRUD, session revocation on role/permission change, `GET /staff/me` permissions payload, super_admin bypass  
> **Explicitly out of scope:** Frontend (roles screen, invite form, CSV upload) — UI tests are separate  
> **Backend files reviewed:**
> - `apps/main-backend/src/features/staff/staff.routes.ts`
> - `apps/main-backend/src/features/staff/staff.service.ts`
> - `apps/main-backend/src/features/staff/staff.repo.ts`
> - `apps/main-backend/src/features/staff/staff.schema.ts`
> - `apps/main-backend/src/features/staff/staff.model.ts`
> - `apps/main-backend/src/features/hospitals/hospital.service.ts`
> - `apps/main-backend/src/middlewares/hospital-scope.middleware.ts`
> - `apps/main-backend/src/middlewares/require-permission.middleware.ts`
> - `apps/main-backend/src/middlewares/auth.middleware.ts`
> - `apps/main-backend/src/lib/permissions.ts`
> - `apps/main-backend/src/lib/seed-roles.ts`
> - `apps/main-backend/src/lib/jwt.ts`
> - `packages/rbac/src/roles.ts`
> - `packages/rbac/src/permissions.ts`
> **Handoff doc:** `docs/qas/rbac-handoff.md`  
> **RBAC reference:** `docs/api/rbac.md`

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

These facts are confirmed from code — test assertions must match them exactly:

1. **System roles live in `custom_roles` collection** with `isSystem: true`. There is no separate system-role collection. `listRoles` returns from `CustomRoleModel.find({ hospitalId })` — both system and custom roles come from the same collection.

2. **Seeding triggers:** `seedDefaultRoles` is called in two places:
   - `hospitalService.create()` — on hospital creation
   - `hospitalService.get()` — on `GET /hospitals/:hospitalId`
   It is idempotent: only inserts missing slugs.

3. **`requirePermission` reads from `req.hospitalMember.permissions`** which is a `Set` built from the JWT's `hospitalPermissions[hospitalId]` array. Permissions are **not** re-queried from the DB on each request — they come from the JWT. Stale tokens carry stale permissions until revoked.

4. **Super admin sentinel:** `__super_admin__` stored in `hospitalPermissions[hospitalId]` array. `hospitalScope` checks for this sentinel; if present, sets `isSuperAdmin: true` and skips all permission checks.

5. **Session revocation (tokenVersion bump) triggers:**
   - `PATCH /staff/:memberId` with a `role` change → bumps the member's user `tokenVersion`
   - `PATCH /roles/:roleId` with `permissions` change → bumps `tokenVersion` for ALL members assigned that role slug

6. **`getMyMembership`** resolves permissions via `resolvePermissions()` which hits the DB (not the JWT). Super admin returns `permissions: null`.

7. **`listRoles` response shape:** `{ roles: [...], permissionDescriptions: {...}, permissionGroups: {...} }`

8. **System role immutability enforced in service:** `deleteRole` and `updateRole` throw `ForbiddenError` if `role.isSystem === true`. Error messages are exactly: `'System roles cannot be deleted'` and `'System roles cannot be modified'`.

9. **Custom role slug uniqueness:** enforced by MongoDB compound index `{ hospitalId, slug }` — a duplicate slug returns a DB error (likely 409 or 500).

---

## Test Accounts

The following accounts must be created before test execution. The script bootstraps them via the seed or direct DB insertion.

| Handle | Email | Password | Notes |
|--------|-------|----------|-------|
| owner | owner@rbac.test | RbacTest123! | Creates hospital; gets `super_admin` membership automatically |
| hospital_admin_user | ha@rbac.test | RbacTest123! | Invited as `hospital_admin` |
| doctor_user | dr@rbac.test | RbacTest123! | Invited as `doctor` |
| nurse_user | nurse@rbac.test | RbacTest123! | Invited as `nurse` |
| lab_tech_user | lt@rbac.test | RbacTest123! | Invited as `lab_tech` |
| pharmacist_user | ph@rbac.test | RbacTest123! | Invited as `pharmacist` |
| reception_user | rec@rbac.test | RbacTest123! | Invited as `reception` |
| tech_user | tech@rbac.test | RbacTest123! | Invited as `tech` |

Bootstrap sequence (all done in test script setup, not manual):
1. Register `owner` → creates account via `POST /auth/register`
2. Create hospital via `POST /hospitals` as `owner` → returns `hospitalId`; owner auto-gets `super_admin`
3. `GET /hospitals/:hospitalId` as owner → triggers role seeding
4. For each other account: `POST /hospitals/:hospitalId/invitations` as owner, `POST /invitations/:token/accept` to create account
5. Login each account fresh → store tokens

> All tokens refreshed at test start. Never hardcode tokens.

---

## Preliminary Static Findings

These are candidate bugs identified from code review before dynamic testing.

| ID | Severity | Finding | Source |
|----|----------|---------|--------|
| RBAC-S-01 | Low | `listRoles` returns all roles including `super_admin` — clients must filter it themselves for invite dropdowns. The API does not filter it. | `staff.repo.ts:listRoles` — no `slug != super_admin` filter |
| RBAC-S-02 | Medium | `ListStaffQuery.role` validates against `STAFF_ROLES` enum (system roles only), blocking filtering by custom role slug. A custom role member cannot be searched by role. | `staff.schema.ts:ListStaffQuery` |
| RBAC-S-03 | Low | `resolvePermissions` for a custom role queries `CustomRoleModel` but only matches on `hospitalId + slug`. If a custom role is deleted, members still in that role get an empty `[]` permissions array rather than an error. No orphan detection. | `lib/permissions.ts:resolvePermissions` |
| RBAC-S-04 | Medium | `updateMember` validates the new role exists via `findRoleBySlug` which searches `CustomRoleModel`. But system roles are in `custom_roles` with `isSystem: true` — this should work. Confirm: assigning a system role slug like `doctor` is accepted. | `staff.service.ts:updateMember` |

---

## Section 1 — System Role Seeding

**Trigger:** `POST /hospitals` (creation) and `GET /hospitals/:hospitalId`  
**Source:** `lib/seed-roles.ts`, `hospital.service.ts:create`, `hospital.service.ts:get`

### 1.1 Seeding on Hospital Creation

| ID | Scenario | Steps | Expected |
|----|----------|-------|----------|
| SEED-01 | 10 system roles exist after hospital creation | Create hospital as owner; immediately `GET /hospitals/:id/roles` | `roles` array has exactly 10 entries with slugs: `super_admin`, `hospital_admin`, `doctor`, `nurse`, `nurse_practitioner`, `physician_assistant`, `lab_tech`, `pharmacist`, `reception`, `tech` |
| SEED-02 | All seeded roles have `isSystem: true` | Inspect SEED-01 response | Every role object has `isSystem: true` |
| SEED-03 | `super_admin` role has empty permissions array | Inspect SEED-01 response | Role with slug `super_admin` has `permissions: []` |
| SEED-04 | `doctor` role has correct permission set | Inspect SEED-01 response | Role with slug `doctor` contains: `staff.view`, `patient.view`, `emr.view`, `emr.vitals.record`, `emr.medications.view`, `emr.medications.write`, `emr.history.write`, `emr.procedures.write`, `emr.immunizations.write`, `emr.documents.write`, `emr.break_glass`, `lab.view`, `lab.create`, `lab.process`, `lab.release`, `review.view`, `review.act`, `search.use`, `notifications.view` |
| SEED-05 | `hospital_admin` role has `settings.update` | Inspect SEED-01 response | Role with slug `hospital_admin` includes `settings.update` in its `permissions` array |

### 1.2 Idempotency

| ID | Scenario | Steps | Expected |
|----|----------|-------|----------|
| SEED-06 | Second `GET /hospitals/:id` does not duplicate roles | Call `GET /hospitals/:id` twice; check role count both times | `roles` array length is 10 both times — no duplicates |
| SEED-07 | `GET /hospitals/:id/roles` after double GET still returns 10 | Call `GET /hospitals/:id` 3 times, then `GET /hospitals/:id/roles` | Exactly 10 roles |

### 1.3 Hospital Isolation

| ID | Scenario | Steps | Expected |
|----|----------|-------|----------|
| SEED-08 | Second hospital gets its own independent set | Create a second hospital as a second user; `GET /hospitals/:id2/roles` | Returns exactly 10 roles; role IDs are different from hospital 1's roles |
| SEED-09 | Hospital 1 roles not visible via hospital 2 scope | Fetch roles using hospital 2's token on hospital 1's role IDs | 403 or 404 — cannot access another hospital's roles |

---

## Section 2 — Roles CRUD & Guards

**Routes:** `GET /hospitals/:id/roles`, `POST /hospitals/:id/roles`, `PATCH /hospitals/:id/roles/:roleId`, `DELETE /hospitals/:id/roles/:roleId`  
**Permission required:** `GET` — member scope only; `POST/PATCH/DELETE` — `settings.update`

### 2.1 List Roles

| ID | Scenario | Actor | Expected |
|----|----------|-------|----------|
| ROLE-L-01 | Any member can list roles | `doctor_user` token | 200; `data` has `roles`, `permissionDescriptions`, `permissionGroups` |
| ROLE-L-02 | Non-member cannot list roles | Valid token but not a member of this hospital | 403 |
| ROLE-L-03 | Response includes `permissionDescriptions` map | Any member token | `data.permissionDescriptions` is a non-empty object |
| ROLE-L-04 | Response includes `permissionGroups` map | Any member token | `data.permissionGroups` is a non-empty object |

### 2.2 Create Custom Role

| ID | Scenario | Actor | Input | Expected |
|----|----------|-------|-------|----------|
| ROLE-C-01 | `hospital_admin` can create custom role | `hospital_admin_user` | `{ name: "Cleaner", slug: "cleaner", permissions: ["staff.view"] }` | 201; `data.role.id` present, `data.role.isSystem: false`, `data.role.slug: "cleaner"` |
| ROLE-C-02 | `doctor` cannot create custom role (no `settings.update`) | `doctor_user` | Same body | 403 |
| ROLE-C-03 | `super_admin` can create custom role | `owner` (super_admin) | `{ name: "Runner", slug: "runner", permissions: [] }` | 201 |
| ROLE-C-04 | Missing `name` → 400 | `hospital_admin_user` | `{ slug: "x", permissions: [] }` | 400 validation error |
| ROLE-C-05 | Missing `slug` → 400 | `hospital_admin_user` | `{ name: "X", permissions: [] }` | 400 validation error |
| ROLE-C-06 | Slug with uppercase → 400 | `hospital_admin_user` | `{ name: "X", slug: "MyRole", permissions: [] }` | 400 — slug regex requires lowercase |
| ROLE-C-07 | Slug with spaces → 400 | `hospital_admin_user` | `{ name: "X", slug: "my role", permissions: [] }` | 400 |
| ROLE-C-08 | Duplicate slug → error | `hospital_admin_user` | Create "cleaner" again (from ROLE-C-01) | 409 or 400 — slug unique per hospital |
| ROLE-C-09 | Slug matching a system role slug → conflict | `hospital_admin_user` | `{ name: "Doc", slug: "doctor", permissions: [] }` | 409 or error — same compound index |
| ROLE-C-10 | Empty permissions array is valid | `hospital_admin_user` | `{ name: "NoPerms", slug: "noperms", permissions: [] }` | 201; `data.role.permissions: []` |
| ROLE-C-11 | Valid permissions list saved correctly | `hospital_admin_user` | `{ name: "Viewer", slug: "viewer-x", permissions: ["staff.view", "patient.view"] }` | 201; `data.role.permissions` contains both strings |

### 2.3 Update Custom Role

| ID | Scenario | Actor | Input | Expected |
|----|----------|-------|-------|----------|
| ROLE-U-01 | `hospital_admin` can rename a custom role | `hospital_admin_user` on "cleaner" role | `{ name: "Janitor" }` | 200; `data.role.name: "Janitor"`, slug unchanged |
| ROLE-U-02 | `hospital_admin` can change permissions | `hospital_admin_user` on "cleaner" role | `{ permissions: ["staff.view", "patient.view"] }` | 200; `data.role.permissions` is updated array |
| ROLE-U-03 | `doctor` cannot update custom role | `doctor_user` | Any body | 403 |
| ROLE-U-04 | PATCH system role `doctor` → 403 | `hospital_admin_user` | `{ name: "Dr" }` on `doctor` role ID | 403; error message contains "System roles cannot be modified" |
| ROLE-U-05 | PATCH system role `hospital_admin` → 403 | `hospital_admin_user` | `{ permissions: [] }` | 403; error message contains "System roles cannot be modified" |
| ROLE-U-06 | PATCH system role `super_admin` → 403 | `owner` (super_admin) | `{ name: "Boss" }` | 403 — even super_admin cannot modify system roles |
| ROLE-U-07 | Non-existent roleId → 404 | `hospital_admin_user` | PATCH on `ROLE-invalid-id` | 404 |
| ROLE-U-08 | Role from another hospital → 404 | `hospital_admin_user` of hospital 1 | PATCH on a valid role ID from hospital 2 | 404 — role.hospitalId check |

### 2.4 Delete Custom Role

| ID | Scenario | Actor | Expected |
|----|----------|-------|----------|
| ROLE-D-01 | `hospital_admin` can delete custom role | `hospital_admin_user` on "runner" role (from ROLE-C-03) | 204; subsequent `GET /roles` does not include "runner" |
| ROLE-D-02 | `doctor` cannot delete custom role | `doctor_user` | 403 |
| ROLE-D-03 | DELETE system role `doctor` → 403 | `hospital_admin_user` | 403; error message contains "System roles cannot be deleted" |
| ROLE-D-04 | DELETE system role `nurse` → 403 | `hospital_admin_user` | 403 |
| ROLE-D-05 | DELETE system role `super_admin` → 403 | `owner` (super_admin) | 403 — super_admin cannot delete system roles |
| ROLE-D-06 | Non-existent roleId → 404 | `hospital_admin_user` | 404 |
| ROLE-D-07 | Deleted role no longer in `GET /roles` | After ROLE-D-01 | `roles` array does not contain slug "runner" |

---

## Section 3 — Permission Enforcement (`requirePermission`)

**Setup per test:** call the endpoint with:
1. No token → 401
2. A role that lacks the required permission → 403
3. A role that has the required permission → 2xx
4. `super_admin` (owner) → 2xx (bypass)

For each row, a patient and/or other resources must exist. The test script creates them during bootstrap using the `owner` token which bypasses all checks.

### 3.1 Permission Map Tests

| ID | Endpoint | Allowed actors (expect 2xx) | Blocked actors (expect 403) | Permission required |
|----|----------|-----------------------------|-----------------------------|---------------------|
| PERM-01 | `POST /hospitals/:id/invitations` | `hospital_admin_user` | `doctor_user` | `staff.invite` |
| PERM-02 | `GET /hospitals/:id/invitations` | `hospital_admin_user` | `doctor_user`, `nurse_user` | `staff.invite` |
| PERM-03 | `GET /hospitals/:id/staff` | `hospital_admin_user`, `doctor_user` | `tech_user` | `staff.view` |
| PERM-04 | `PATCH /hospitals/:id/staff/:memberId` | `hospital_admin_user` | `doctor_user`, `nurse_user` | `staff.update` |
| PERM-05 | `POST /hospitals/:id/staff/:memberId/suspend` | `hospital_admin_user` | `doctor_user` | `staff.suspend` |
| PERM-06 | `DELETE /hospitals/:id/staff/:memberId` | `hospital_admin_user` | `doctor_user`, `nurse_user` | `staff.remove` |
| PERM-07 | `POST /hospitals/:id/patients` | `doctor_user`, `nurse_user`, `reception_user` | `lab_tech_user`, `pharmacist_user` | `patient.create` |
| PERM-08 | `GET /hospitals/:id/patients` | `doctor_user`, `nurse_user`, `reception_user`, `lab_tech_user`, `pharmacist_user` | `tech_user` | `patient.view` |
| PERM-09 | `GET /hospitals/:id/patients/:patientId/chart` | `doctor_user`, `nurse_user` | `reception_user`, `lab_tech_user` | `emr.view` |
| PERM-10 | `POST /hospitals/:id/patients/:patientId/chart/vitals` | `doctor_user`, `nurse_user` | `reception_user`, `pharmacist_user` | `emr.vitals.record` |
| PERM-11 | `POST /hospitals/:id/patients/:patientId/chart/medications` | `doctor_user` | `nurse_user`, `lab_tech_user` | `emr.medications.write` |
| PERM-12 | `POST /hospitals/:id/patients/:patientId/lab-orders` | `doctor_user`, `nurse_user`, `lab_tech_user` | `reception_user`, `pharmacist_user` | `lab.create` |
| PERM-13 | `POST /hospitals/:id/patients/:patientId/lab-orders/:id/advance` | `doctor_user`, `nurse_user`, `lab_tech_user` | `reception_user`, `pharmacist_user` | `lab.process` |
| PERM-14 | `PATCH /hospitals/:id/assets/:assetId` | `tech_user`, `hospital_admin_user` | `doctor_user`, `nurse_user` | `asset.update` |
| PERM-15 | `DELETE /hospitals/:id/assets/:assetId` | `tech_user` | `doctor_user`, `nurse_user`, `hospital_admin_user` | `asset.delete` |
| PERM-16 | `PATCH /hospitals/:id` | `hospital_admin_user` | `doctor_user`, `nurse_user` | `settings.update` |
| PERM-17 | `POST /hospitals/:id/roles` | `hospital_admin_user` | `doctor_user` | `settings.update` |

### 3.2 No-Token Guard (sample endpoints)

| ID | Endpoint | Expected |
|----|----------|----------|
| GUARD-01 | `GET /hospitals/:id/staff` (no token) | 401 |
| GUARD-02 | `POST /hospitals/:id/roles` (no token) | 401 |
| GUARD-03 | `GET /hospitals/:id/patients` (no token) | 401 |
| GUARD-04 | `POST /hospitals/:id/patients/:id/chart/vitals` (no token) | 401 |

### 3.3 Non-Member Guard

| ID | Scenario | Steps | Expected |
|----|----------|-------|----------|
| GUARD-05 | User authenticated but not a member of this hospital | Register a fresh user with no hospital; call `GET /hospitals/:otherId/staff` with their token | 403 `not_a_member` or similar |
| GUARD-06 | Archived hospital returns 403 | Archive the hospital via admin; attempt any scoped call | 403 — hospital is archived |

---

## Section 4 — Super Admin Bypass

| ID | Scenario | Steps | Expected |
|----|----------|-------|----------|
| SA-01 | Super admin can call `staff.invite`-gated endpoint | `owner` (super_admin) calls `POST /hospitals/:id/invitations` | 201 or meaningful response — NOT 403 |
| SA-02 | Super admin can call `patient.create`-gated endpoint | `owner` creates patient | 2xx |
| SA-03 | Super admin can call `emr.view`-gated endpoint | `owner` calls `GET /chart` | 2xx |
| SA-04 | Super admin can call `settings.update`-gated endpoint | `owner` calls `PATCH /hospitals/:id` | 2xx |
| SA-05 | Super admin can delete assets (`asset.delete`) | `owner` deletes an asset | 2xx |
| SA-06 | JWT `hospitalPermissions` contains `__super_admin__` sentinel | Decode `owner`'s access token (base64 middle segment) | `hospitalPermissions[hospitalId]` equals `["__super_admin__"]` |
| SA-07 | Super admin sentinel is hospital-scoped | `owner` has super_admin in hospital 1; try their token on hospital 2 they are not a member of | 403 — sentinel only valid for hospital 1 |

---

## Section 5 — `GET /staff/me` Permissions Payload

**Route:** `GET /hospitals/:hospitalId/staff/me`  
**Auth:** member scope only (no permission required)

| ID | Scenario | Actor | Expected |
|----|----------|-------|----------|
| ME-01 | Doctor gets correct permissions array | `doctor_user` | 200; `data.member.permissions` is an array containing `emr.view`, `patient.view`, `lab.view`; does NOT contain `settings.update` |
| ME-02 | Nurse gets correct permissions | `nurse_user` | `permissions` includes `emr.vitals.record` but NOT `emr.medications.write` |
| ME-03 | `lab_tech` permissions match spec | `lab_tech_user` | `permissions` includes `lab.view`, `lab.create`, `lab.process`; does NOT include `lab.release`, `emr.vitals.record` |
| ME-04 | `reception` permissions match spec | `reception_user` | `permissions` includes `patient.admit`, `patient.transfer`; does NOT include `emr.view` |
| ME-05 | Super admin returns `permissions: null` | `owner` | `data.member.permissions === null` — sentinel, not an empty array |
| ME-06 | Custom role returns exact permissions set | After creating "viewer-x" role (from ROLE-C-11) and a user with that role | `permissions` array is exactly `["staff.view", "patient.view"]` |
| ME-07 | Response includes membership fields | `doctor_user` | `data.member` has `id`, `role`, `userId`, `hospitalId`, `status`, `name`, `email` |

---

## Section 6 — Session Revocation on Role Change

**Mechanism:** `bumpTokenVersion` on the user → old JWT's `tokenVersion` no longer matches DB → 401 on next request

### 6.1 Member Role Change

| ID | Scenario | Steps | Expected |
|----|----------|-------|----------|
| REV-01 | Old token → 401 after role change | (a) Login `nurse_user`, record token. (b) `hospital_admin_user` PATCHes nurse's role to `reception`. (c) Use old nurse token on `GET /hospitals/:id/staff/me` | 401 — `tokenVersion` mismatch |
| REV-02 | Fresh login gets new role's permissions | After REV-01: login again as `nurse_user` (now `reception`) | New token works; `GET /staff/me` returns `reception`-scoped permissions |
| REV-03 | New token no longer has nurse permissions | After REV-02: try `POST /chart/vitals` with new token | 403 — reception does not have `emr.vitals.record` |
| REV-04 | Old token fails on read-only endpoints too | Use old nurse token from REV-01 on `GET /hospitals/:id/staff` | 401 — not just write endpoints |
| REV-05 | Requester's own token unaffected by changing another member | `hospital_admin_user` changes nurse role; use `hospital_admin_user`'s own token immediately after | Still 200 — only target user is revoked |

### 6.2 Permissions Change on Custom Role

| ID | Scenario | Steps | Expected |
|----|----------|-------|----------|
| REV-06 | Custom role permission change revokes all assigned members | (a) Create custom role "auditor" with `["staff.view"]`. (b) Invite and accept as `auditor_user`. (c) Login `auditor_user`, record token. (d) `hospital_admin_user` PATCHes "auditor" role — changes `permissions` to `["staff.view", "patient.view"]`. (e) Use old `auditor_user` token. | 401 |
| REV-07 | Fresh login gets updated permissions | After REV-06: login `auditor_user` again | `GET /staff/me` → `permissions` now includes `patient.view` |
| REV-08 | Renaming a role WITHOUT changing permissions does NOT revoke | PATCH "auditor" with only `{ name: "Senior Auditor" }` (no permissions key) | `auditor_user`'s existing token still works |
| REV-09 | Multiple members assigned same role — all revoked | Invite `auditor_user_2` with same "auditor" role; both logged in; admin changes permissions | Both old tokens return 401; both must re-login |

---

## Section 7 — Invitations with Custom & System Roles

**Goal:** Verify that the backend accepts custom role slugs in invitation requests (not just system roles).

| ID | Scenario | Actor | Input | Expected |
|----|----------|-------|-------|----------|
| INV-01 | Invite with system role slug `doctor` | `hospital_admin_user` | `{ email: "newdoc@test.com", role: "doctor" }` | 201 |
| INV-02 | Invite with system role slug `nurse` | `hospital_admin_user` | `{ email: "newnurse@test.com", role: "nurse" }` | 201 |
| INV-03 | Invite with custom role slug "cleaner" | `hospital_admin_user` | `{ email: "cleaner@test.com", role: "cleaner" }` (must exist first) | 201 |
| INV-04 | Invite with non-existent role slug → 404 | `hospital_admin_user` | `{ email: "x@test.com", role: "made-up-role" }` | 404 — `staffService.invite` checks `findRoleBySlug` |
| INV-05 | Accept invitation with custom role creates correct membership | Accept token for cleaner invite | `GET /staff/me` in that hospital → `member.role: "cleaner"` |
| INV-06 | `super_admin` slug cannot be invited (custom role doesn't change this) | `hospital_admin_user` | `{ email: "boss@test.com", role: "super_admin" }` | 201 if `super_admin` slug exists as system role; verify the accepted user actually gets super_admin bypass in JWT — this is a **security test** |
| INV-07 | Bulk invite accepts mixed system + custom roles | `hospital_admin_user` | Array with `doctor` and `cleaner` slugs | 201 for both |
| INV-08 | Bulk invite with one invalid role fails the whole batch or reports per-item | `hospital_admin_user` | Array with `doctor` (valid) and `ghost` (invalid) | Service calls `staffService.invite` per item via `Promise.all` — should 404 on ghost item |

---

## Section 8 — Staff Update (PATCH /staff/:memberId) — Role Validation

| ID | Scenario | Actor | Input | Expected |
|----|----------|-------|-------|----------|
| UPD-01 | Change member to valid system role | `hospital_admin_user` on `nurse_user`'s member | `{ role: "doctor" }` | 200; `member.role: "doctor"` |
| UPD-02 | Change member to valid custom role | `hospital_admin_user` | `{ role: "cleaner" }` (must exist) | 200; `member.role: "cleaner"` |
| UPD-03 | Change member to non-existent role → 404 | `hospital_admin_user` | `{ role: "ghost-role" }` | 404 |
| UPD-04 | Role change with no actual change does not bump tokenVersion | `hospital_admin_user` patches same role | `{ role: "doctor" }` when already `doctor` | Token still works (service checks `body.role !== member.role`) |
| UPD-05 | Can update non-role fields without revoking session | `hospital_admin_user` | `{ department: "ICU" }` | 200; token still valid for affected member |
| UPD-06 | Cannot update self's role | If `hospital_admin_user` is also a member, try to PATCH own member record's role | Source: no self-update guard for role only; test and observe |

---

## Section 9 — Error Envelope & HTTP Status Codes

Every error response across all tests above must conform to:

```json
{ "error": { "code": "snake_case_string", "message": "human readable" } }
```

| ID | Scenario | Expected code |
|----|----------|---------------|
| ENV-01 | No token | `unauthorized` |
| ENV-02 | Non-member trying member-scoped endpoint | `forbidden` |
| ENV-03 | Member with insufficient permission | `forbidden` |
| ENV-04 | Non-existent role on delete | `not_found` |
| ENV-05 | System role delete attempt | `forbidden` |
| ENV-06 | System role update attempt | `forbidden` |
| ENV-07 | Duplicate role slug | Error with meaningful message |
| ENV-08 | 403 never returns partial data | `403` response body has only `error` — no user data, no resource data |
| ENV-09 | 401 after revocation contains no stale data | `401` body has only `error` |

---

## Section 10 — Cross-Cutting

| ID | Scenario | Expected |
|----|----------|----------|
| XC-01 | Token from hospital A cannot scope into hospital B | Login `doctor_user` (member of hospital 1); call `GET /hospitals/:id2/staff` | 403 — not a member of hospital 2 |
| XC-02 | Suspended member cannot authenticate into hospital scope | Suspend `lab_tech_user`; they call any hospital-scoped endpoint | 403 — `hospitalScope` checks `status: 'active'` |
| XC-03 | Re-activated member can authenticate again | Activate `lab_tech_user`; call same endpoint | 200 |
| XC-04 | Super admin bypass does NOT apply to platform admin routes | `owner`'s token (super_admin in hospital) on `GET /admin/stats` | 403 — `isSuperAdmin` is hospital-level, `requireAdmin` checks `req.user.isAdmin` |
| XC-05 | Pagination on staff list works | `GET /hospitals/:id/staff?page=1&limit=3` | ≤ 3 items; `totalPages = ceil(total/3)` |
| XC-06 | Staff list filter by role works | `GET /hospitals/:id/staff?role=doctor` | Only members with role `doctor` returned |
| XC-07 | Staff list filter by status works | `GET /hospitals/:id/staff?status=suspended` | Only suspended members returned |
| XC-08 | `GET /org-chart` accessible to any member | `reception_user` | 200 |
| XC-09 | `GET /share` accessible to any member | `nurse_user` | 200; response has `workspaceUrl`, `inviteUrl` |

---

## Notes for Test Script Author

1. **Bootstrap order matters.** Create hospital first. The owner automatically gets `super_admin`. Then invite all other roles using the owner's token. Accept each invitation to create accounts. Login each account to get tokens. Store all tokens before any tests run.

2. **Use `Date.now()` for unique email/slug values** to avoid conflicts across runs.

3. **Decode JWT without a library:** `JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())` — use this for SA-06.

4. **REV tests depend on state.** Run them sequentially. Do not parallelize revocation tests.

5. **PERM tests that need a patient:** create one patient during bootstrap using `owner` token. Use the same patient ID throughout section 3.

6. **PERM-15 (asset delete):** create a throwaway asset per test iteration — after deletion it's gone.

7. **ROLE-D tests must not delete roles still needed by later tests.** Create dedicated "runner" and "auditor" roles specifically for deletion tests.

8. **INV-06 is a security test:** if `super_admin` can be invited as a role, verify that the accepted user's JWT actually receives `__super_admin__` sentinel, meaning they get full bypass. Document the finding regardless of pass/fail.

9. **Script location:** `docs/qas/backend/scripts/rbac.test.mjs`

10. **Report location:** `docs/qas/backend/reports/rbac-report.md`

11. **Bug report location:** `docs/qas/backend/reports/rbac-bugs.md`
