# Medcord — Role View + Member Counts — Backend QA Test Plan

> **QA:** Claude  
> **Date:** 2026-05-17  
> **Scope:** `GET /hospitals/:hospitalId/roles` — `memberCount` field · `resolvePermissions()` BUG-RE-01 fix  
> **Explicitly out of scope:** Frontend, role create/edit/delete (covered in RBAC + role-editing plans)  
> **Handoff doc:** `docs/qas/backend/role-view-handoff.md`  
> **Backend files reviewed:**
> - `apps/main-backend/src/features/staff/staff.service.ts` — `listRoles()`
> - `apps/main-backend/src/lib/permissions.ts` — `resolvePermissions()`

---

## Environment & Setup

| Item | Value |
|------|-------|
| Base URL | `http://localhost:8085/api/v1` |
| Auth header | `Authorization: Bearer <accessToken>` |
| Error envelope | `{ "error": { "code": "...", "message": "..." } }` |
| Success envelope | `{ "data": { ... } }` |

---

## Key Implementation Notes (from source read)

1. **`memberCount` query:** `HospitalMemberModel.countDocuments({ hospitalId, role: r.slug, status: 'active' })` — counts only `status: 'active'` members. Suspended or removed members are not counted.

2. **Counts run in parallel:** `Promise.all` over all roles — one `countDocuments` per role slug. Count is attached at index `i`, defaulting to 0 if undefined.

3. **`resolvePermissions()` fix:** For all non-`super_admin` roles, queries `CustomRoleModel` first. Returns `role.permissions` from DB. Falls back to `DEFAULT_ROLE_PERMISSIONS` only if no DB record (pre-seeding edge case). `super_admin` still returns `null` immediately.

4. **BUG-RE-01 was already verified** in the role-editing test suite (ROLE-E-05b-perms). This plan re-verifies it explicitly per the handoff's ROLE-V-04 case, and adds the `super_admin` sentinel regression (ROLE-V-06).

---

## Test Cases

### Section 1 — memberCount field presence and shape

| ID | Description | Expected |
|----|-------------|----------|
| ROLE-V-01a | `GET /roles` — every role has `memberCount` field | All role objects have `memberCount` key |
| ROLE-V-01b | `memberCount` is always a non-negative integer | No role has `null`, `undefined`, or negative count |
| ROLE-V-01c | `super_admin` role has `memberCount` | Field present (value ≥ 0, typically 1 for the founder) |
| ROLE-V-01d | Custom role with no members has `memberCount: 0` | Exactly `0`, not missing |

### Section 2 — memberCount accuracy

| ID | Description | Setup | Expected |
|----|-------------|-------|----------|
| ROLE-V-02a | Count matches actual active member count | Note doctor count before adding a member; invite + accept a doctor; call `GET /roles` | `doctor.memberCount` incremented by 1 |
| ROLE-V-02b | Suspended member not counted | Suspend the newly added doctor; call `GET /roles` | `doctor.memberCount` back to original count |
| ROLE-V-02c | Reactivated member counted again | Reactivate the suspended doctor; call `GET /roles` | `doctor.memberCount` incremented again |
| ROLE-V-02d | Counts are per-hospital (isolation) | Hospital 2 has its own doctor | `doctor.memberCount` in H2 does not include H1 doctors |

### Section 3 — BUG-RE-01: System role permission edit reflected at next login

| ID | Description | Expected |
|----|-------------|----------|
| ROLE-V-04a | Login as doctor; record old token; `GET /staff/me` has full permission set | `permissions` is non-null array with ≥ 10 items (default doctor set) |
| ROLE-V-04b | `PATCH /roles/:doctorRoleId` with `{ permissions: ["patient.view", "staff.view"] }` → 200 | Response `role.permissions = ["patient.view", "staff.view"]` |
| ROLE-V-04c | `GET /roles` after patch shows updated permissions on doctor role | `doctor.permissions = ["patient.view", "staff.view"]` |
| ROLE-V-04d | Old doctor token → 401 on any endpoint | Session revoked — tokenVersion bumped |
| ROLE-V-04e | Fresh login as doctor; `GET /staff/me` | `permissions = ["patient.view", "staff.view"]` — NOT the original 23-permission set |
| ROLE-V-04f | `GET /chart` with new doctor token (requires `emr.view`) | `403` — `emr.view` no longer in token |
| ROLE-V-04g | Restore doctor permissions to defaults; re-login | `GET /staff/me` returns full default permission set again |

### Section 4 — super_admin unaffected (ROLE-V-06)

| ID | Description | Expected |
|----|-------------|----------|
| ROLE-V-06a | `GET /staff/me` as super_admin | `permissions: null` — sentinel unchanged |
| ROLE-V-06b | JWT decoded — `hospitalPermissions[hospitalId]` contains `__super_admin__` | Sentinel still in token; bypass not broken by `resolvePermissions()` change |
| ROLE-V-06c | super_admin can still call a `settings.update`-gated endpoint after BUG-RE-01 fix | `2xx` — bypass intact |
