# Medcord Role View + Member Counts — QA Test Execution Report

> **QA:** Claude  
> **Date:** 2026-05-17  
> **Scope:** `GET /roles` — `memberCount` field · `resolvePermissions()` BUG-RE-01 fix  
> **Environment:** `localhost:8085` · MongoDB `medcord` (local)  
> **Test script:** `docs/qas/backend/scripts/role-view.test.mjs`  
> **Plan:** `docs/qas/backend/plans/role-view-test-plan.md`

---

## Summary

| Section | Tests | Pass | Fail | Blocked |
|---------|-------|------|------|---------|
| 1. memberCount field presence & shape | 5 | 5 | 0 | 0 |
| 2. memberCount accuracy | 7 | 7 | 0 | 0 |
| 3. BUG-RE-01 system role permission edit | 9 | 9 | 0 | 0 |
| 4. super_admin bypass unaffected | 3 | 3 | 0 | 0 |
| **Total** | **24** | **24** | **0** | **0** |

**24 / 24 tests pass (100%).** No bugs found. Both changes ship correctly.

---

## Section Results

### 1. memberCount field presence & shape — 5/5 PASS ✅

Every role object in `GET /roles` response contains `memberCount` as a non-negative integer. `super_admin` has `memberCount ≥ 1` (the founding owner). A freshly-created custom role with no members returns exactly `0`.

### 2. memberCount accuracy — 7/7 PASS ✅

- Baseline: 2 active doctors → `doctor.memberCount = 2`.
- After inviting and accepting a 3rd doctor → `memberCount = 3`.
- After suspending that doctor (`status: 'suspended'`) → back to `2`. Suspended members are correctly excluded.
- After reactivating → back to `3`. Count is live.
- Hospital isolation: Hospital 2 has its own independent doctor count — H1 and H2 counts do not bleed into each other.

### 3. BUG-RE-01 system role permission edit reflected at next login — 9/9 PASS ✅

Full end-to-end flow verified:

1. Fresh doctor token has the default 23-permission set.
2. `PATCH /roles/:doctorRoleId` with `{ permissions: ["patient.view", "staff.view"] }` → 200. Response and `GET /roles` both reflect the new set.
3. Old doctor token → 401 (tokenVersion bumped).
4. Fresh login → `GET /staff/me` returns exactly `["patient.view", "staff.view"]` — not the old 23-permission set. **BUG-RE-01 fix is working.**
5. `GET /chart` with the new token (requires `emr.view`) → 403. New permissions are enforced at the API level.
6. After restoring defaults and re-login, full permission set is back.

### 4. super_admin bypass unaffected — 3/3 PASS ✅

- `GET /staff/me` as super_admin returns `permissions: null` — bypass sentinel unchanged.
- JWT `hospitalPermissions` contains `["__super_admin__"]` — not affected by `resolvePermissions()` refactor.
- `PATCH /hospitals/:id` (requires `settings.update`) returns `2xx` — super_admin bypass intact end-to-end.

---

## No Bugs Found

Both changes work correctly. Cleared for release.
