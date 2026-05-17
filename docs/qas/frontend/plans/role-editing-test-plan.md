# Test Plan — Role Editing (Navigation Refactor + System Role Editing)

**Prepared:** 2026-05-17  
**Handoff:** `docs/qas/frontend/role-editing-handoff.md`  
**Scope:** Frontend only — 3 screens refactored/new  
**Environment:** `http://localhost:5173` · Backend `http://localhost:8085`  
**Primary seed user:** `alice@medcord.test` / `Medcord123!` (super_admin, Hospital A)  
**Low-perm user:** `eve@medcord.test` / `Medcord123!` (reception, no `settings.update`)  
**Screenshots →** `docs/qas/frontend/screenshots/role-editing/`

---

## What changed

| File | Change |
|------|--------|
| `roles-screen.tsx` | Edit buttons on both system and custom rows now navigate; no inline form |
| `role-create-screen.tsx` | **New** — standalone create page at `/h/:slug/staff/roles/new` |
| `role-edit-screen.tsx` | **New** — standalone edit page at `/h/:slug/staff/roles/:roleId/edit` |
| `role-form.tsx` | Shared — used by both create and edit screens |

---

## Pre-flight

1. `curl http://localhost:8085/api/v1/health`
2. `curl http://localhost:5173 | head -3`
3. Login as alice, get token, confirm Hospital A roles seeded
4. Ensure at least 1 custom role exists (create `cleaner` if not)
5. Note a valid system role ID (e.g. `doctor`) and a valid custom role ID for URL tests

---

## Phase 1 — Roles List Screen

**Route:** `/h/hospital-a/staff/roles`  
**File:** `roles-screen.tsx`

Key change: Edit buttons now navigate; no inline form ever appears.

### 1.1 Layout (as alice — has `settings.update`)

| ID | Test | Expected |
|----|------|----------|
| RL-01 | Navigate to roles list | Page renders; both "System roles" and "Custom roles" sections visible |
| RL-02 | System roles table has 3 columns | Name · Permissions · action column (with Edit button per row) |
| RL-03 | Every system role row has an Edit button | All 10 rows — including `super_admin` — have an Edit button |
| RL-04 | No Delete button on system role rows | System rows only have Edit, never Delete |
| RL-05 | "New role" button links to create page | Clicking "New role" navigates to `/h/hospital-a/staff/roles/new` |
| RL-06 | No inline form ever appears on this screen | After clicking "New role" the URL changes — the list page does NOT expand a form |
| RL-07 | Custom roles table: Edit navigates | Clicking Edit on a custom role row navigates to `/h/hospital-a/staff/roles/:roleId/edit` |
| RL-08 | Custom roles table: Delete still works | Delete button calls `DELETE /roles/:id`, role disappears, toast fires |
| RL-09 | Empty state (no custom roles) | "No custom roles yet. Create one to extend the built-in system roles." |

### 1.2 Layout (as eve — no `settings.update`)

| ID | Test | Expected |
|----|------|----------|
| RL-10 | System roles table has 2 columns only | No action column — Name and Permissions only |
| RL-11 | No Edit buttons on system role rows | Zero buttons in system table |
| RL-12 | No Edit/Delete on custom role rows | Custom roles show name, permissions, created date — no action column |
| RL-13 | No "New role" button | Button absent from page header |
| RL-14 | Empty state message adapted for read-only user | "No custom roles yet." — without the "Create one…" CTA text |

---

## Phase 2 — New Role Create Screen

**Route:** `/h/hospital-a/staff/roles/new`  
**File:** `role-create-screen.tsx`

### 2.1 Page Load

| ID | Test | Expected |
|----|------|----------|
| RC-01 | Navigate to `/staff/roles/new` | Page renders with "New role" heading and "Create a custom role..." subtitle |
| RC-02 | "Back to roles" button present | Ghost button with arrow-left icon |
| RC-03 | Permission groups load | Spinner shown while loading; after load, all permission groups visible (Staff, Patients, EMR, Labs, Assets, Review Queue, Workspace & Settings) |
| RC-04 | No role name pre-filled | Name input is empty |

### 2.2 Create flow

| ID | Test | Expected |
|----|------|----------|
| RC-05 | Blank name → inline validation error | "Role name is required." shown |
| RC-06 | Fill name "QA Test Role" + toggle 2 perms + Save | `POST /roles` (201); toast "Role created."; navigate back to `/staff/roles`; new role in custom table |
| RC-07 | Slug auto-generates from name | "QA Test Role" → `qa_test_role` (confirmed in POST body) |
| RC-08 | Cancel navigates back without saving | URL returns to `/staff/roles`; no POST fired |
| RC-09 | Browser back button returns to roles list | Navigate back via browser back; URL = `/staff/roles` |

---

## Phase 3 — Edit Role Screen (Custom Role)

**Route:** `/h/hospital-a/staff/roles/:roleId/edit` (custom role)  
**File:** `role-edit-screen.tsx`

### 3.1 Page Load

| ID | Test | Expected |
|----|------|----------|
| RE-C-01 | Navigate to edit page for custom role | Heading: "Edit: {role name}"; subtitle: "Update this role's name and permissions." |
| RE-C-02 | "Back to roles" button present | Ghost button with arrow-left icon |
| RE-C-03 | Name field is pre-filled and editable | Input contains current role name; not disabled |
| RE-C-04 | Permission toggles pre-filled | Currently-assigned permissions are checked |

### 3.2 Edit flow

| ID | Test | Expected |
|----|------|----------|
| RE-C-05 | Rename + change permissions + Save | `PATCH /roles/:id` (200); toast "Role updated."; navigate to `/staff/roles`; updated count in list |
| RE-C-06 | Roles list shows updated permission count | After nav back, custom role shows new permission count without reload |
| RE-C-07 | Cancel navigates back without saving | No PATCH fired; roles list unchanged |

### 3.3 Not found

| ID | Test | Expected |
|----|------|----------|
| RE-C-08 | Navigate to edit page with bogus roleId | Error state shown: "Role not found."; Back button still works |

---

## Phase 4 — Edit Role Screen (System Role)

**Route:** `/h/hospital-a/staff/roles/:roleId/edit` (system role — e.g. `doctor`)  
**File:** `role-edit-screen.tsx`

### 4.1 Page Load

| ID | Test | Expected |
|----|------|----------|
| RE-S-01 | Navigate to edit page for `doctor` system role | Heading: "Edit: Doctor"; subtitle: "System roles: permissions are editable, name is fixed." |
| RE-S-02 | Name field is **disabled** | Input has `disabled` attribute; cannot be typed into |
| RE-S-03 | Doctor's permissions are pre-checked | The 23 doctor permissions are checked; others unchecked |
| RE-S-04 | All permission toggles are interactive (not disabled) | Can toggle permissions despite being a system role |

### 4.2 Edit system role permissions

| ID | Test | Expected |
|----|------|----------|
| RE-S-05 | Toggle 1 permission off + Save | `PATCH /roles/:id` (200) with updated permissions array; toast "Role updated."; navigate back |
| RE-S-06 | Roles list shows updated permission count | Doctor row now shows updated count (e.g. 22 if one removed) |
| RE-S-07 | Restore original permissions | Toggle the permission back on; Save; count returns to original |

### 4.3 `super_admin` edit page

| ID | Test | Expected |
|----|------|----------|
| RE-S-08 | Navigate to edit page for `super_admin` role | Page loads: heading "Edit: Super Admin"; name disabled |
| RE-S-09 | super_admin page shows empty permission toggles | All checkboxes unchecked — `super_admin` uses sentinel, `permissions: []` in DB |
| RE-S-10 | List still shows "All permissions (bypass)" badge | After navigating back, super_admin row still shows bypass badge (unaffected by edit page visit) |

---

## Phase 5 — Permission Gating + Edge Cases

| ID | Test | Expected |
|----|------|----------|
| PG-01 | Eve navigates to `/staff/roles/new` directly | Page loads (form renders) but Save calls backend → `403`; error toast shows |
| PG-02 | Eve navigates to a role's edit page directly | Page loads; Save → `403`; error toast |
| PG-03 | After creating a role and navigating back, role appears in list | Query invalidated by `onSuccess`; no reload needed |
| PG-04 | After editing a role and navigating back, updated count in list | Same invalidation check |
| PG-05 | Browser back from create page → list | Correct |
| PG-06 | Browser back from edit page → list | Correct |
| PG-07 | "New role" is a `<Link>` not a JS navigate call | Inspect: button is wrapped in `<Link to={...}>` — clicking does a React Router navigation |

---

## Phase 6 — Cross-cutting Code Checks

Run grep-based audits on the 3 screen files and the shared form.

```bash
FILES=(
  "apps/medcord-web/src/features/staff/features/roles/screen/roles-screen.tsx"
  "apps/medcord-web/src/features/staff/features/roles/screen/role-create-screen.tsx"
  "apps/medcord-web/src/features/staff/features/roles/screen/role-edit-screen.tsx"
  "apps/medcord-web/src/features/staff/features/roles/screen/parts/role-form.tsx"
)
```

| Check | Command | Expected |
|-------|---------|----------|
| Raw `&&` in JSX | `grep -n "{.*&&"` | None (or only inside prop attribute values, not JSX conditional rendering) |
| Raw `.map()` in JSX | `grep -n "\.map("` | None in render |
| Raw hex | `grep -n "bg-\[#\|text-\[#"` | None |
| Lucide direct imports | `grep -n "from 'lucide-react'"` | None |
| Non-null assertions (`!`) | `grep -n "!"` | Only where guarded |
| `readonly` props | Verify all prop interfaces | All readonly |

**Pre-identified from source review:**

- `role-create-screen.tsx:59` — `data!.permissionDescriptions` — inside `<Loadable loading={isLoading}>`. Safe: `!` only reached after `isLoading = false` and `error = undefined`, which means `data` is defined.
- `role-create-screen.tsx:60` — `data!.permissionGroups` — same guard.
- `role-edit-screen.tsx:66` — `data!.permissionDescriptions` — same `<Loadable>` guard. `role` could be `undefined` here if roleId not found, but `Loadable` redirects to error component in that case (line 51 synthesises the error).
- `role-edit-screen.tsx:67` — `data!.permissionGroups` — same.

These are pre-identified as safe. Confirm at runtime by verifying no crash on page load.

---

## Seed Data Needed

| Need | Method |
|------|--------|
| ≥1 custom role | Create via API before Phase 3 |
| All 10 system roles | Triggered by `GET /hospitals/:id` |
| Doctor role ID | From `GET /hospitals/:id/roles` |

---

## Screenshots Naming

```
role-editing-rl-{ID}.png
role-editing-rc-{ID}.png
role-editing-re-c-{ID}.png
role-editing-re-s-{ID}.png
role-editing-pg-{ID}.png
```

---

## Total Test Count

| Phase | Tests |
|-------|-------|
| 1 — Roles List | 14 |
| 2 — Create Page | 9 |
| 3 — Edit Custom | 8 |
| 4 — Edit System | 10 |
| 5 — Gating / Edge | 7 |
| 6 — Cross-cutting | 6 checks |
| **Total** | **48** |
