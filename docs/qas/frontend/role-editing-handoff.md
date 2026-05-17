# QA Handoff — Role Editing (System + Custom Roles)

**Date:** 2026-05-17
**Build status:** Typecheck clean ✅ · Lint clean ✅
**Scope:** Roles screen navigation refactor + system role permission editing

---

## What changed

- **Roles list screen** (`/h/:slug/staff/roles`) — "New role" button now navigates to a dedicated page. Edit buttons (system and custom roles) navigate to a dedicated edit page. No more inline form toggling.
- **New role create page** (`/h/:slug/staff/roles/new`) — standalone page with back nav.
- **New role edit page** (`/h/:slug/staff/roles/:roleId/edit`) — works for both system and custom roles.
- **System roles are now editable** — permissions can be toggled. Name field is disabled (system role names are immutable). Backend enforces this.

---

## 1. Roles List Screen

**Route:** `/h/:slug/staff/roles`
**File:** `apps/medcord-web/src/features/staff/features/roles/screen/roles-screen.tsx`

- System roles table now has an **Edit** column with an Edit button on each row, visible only to users with `settings.update`.
- `super_admin` row also has an Edit button — clicking it navigates to the edit page, where only the permission list is shown (super_admin has no editable permissions — it always bypasses checks). The form should load normally.
- Custom roles table: Edit button navigates to edit page (no longer expands inline). Delete button remains.
- "New role" button navigates to `/h/:slug/staff/roles/new`. No inline form ever appears on this screen.
- Users **without** `settings.update`: no New role button, no Edit buttons, no Delete buttons. Both tables load in read-only mode.
- Loading state: spinner centred. Error state: red alert box.

---

## 2. New Role Page

**Route:** `/h/:slug/staff/roles/new`
**File:** `apps/medcord-web/src/features/staff/features/roles/screen/role-create-screen.tsx`

- "Back to roles" button (ghost, arrow left icon) navigates back to `/h/:slug/staff/roles`.
- Page heading: "New role". Subtitle: "Create a custom role with a specific set of permissions."
- Form loads grouped permission toggles fetched from the API (same `permissionDescriptions` + `permissionGroups` from `GET /roles`).
- While permissions are loading: spinner shown, form is not rendered.
- Fill in role name → slug auto-generates in the form. Toggle permissions. Click Save.
- On success: toast "Role created." → navigate back to `/h/:slug/staff/roles`. New role appears in custom roles section.
- On error: toast with error message.
- Cancel button navigates back to roles list without saving.

---

## 3. Edit Role Page

**Route:** `/h/:slug/staff/roles/:roleId/edit`
**File:** `apps/medcord-web/src/features/staff/features/roles/screen/role-edit-screen.tsx`

### Editing a custom role

- "Back to roles" button navigates to roles list.
- Page heading: "Edit: {role name}". Subtitle: "Update this role's name and permissions."
- Name field is editable.
- All permission toggles are shown with current state pre-filled.
- Toggle permissions, optionally rename, click Save.
- On success: toast "Role updated." → navigate back to roles list.
- On error: toast with error message.

### Editing a system role

- Page heading: "Edit: {role name}" (e.g. "Edit: Doctor").
- Subtitle: "System roles: permissions are editable, name is fixed."
- **Name field is disabled** — cannot be changed.
- Permission toggles are shown and interactive.
- Save sends only the updated permissions to the backend. The backend silently ignores any name field for system roles.
- On success: toast "Role updated." → navigate back.
- Session revocation: any staff member currently logged in with this system role will have their session revoked. They will receive a 401 on their next request and must log in again to receive updated permissions.

### Role not found

- If `:roleId` does not match any role in the hospital: error state shown ("Role not found."). Back button still works.

---

## 4. Permission-gated access

- A user **without** `settings.update` who manually navigates to `/h/:slug/staff/roles/new` or `/h/:slug/staff/roles/:roleId/edit` — the page loads but the form's Save button calls the backend which returns `403 Forbidden`. The error toast shows the API error message.
- The roles list does not show Edit/New buttons for these users (frontend gating), but backend enforcement is the source of truth.

---

## Behaviour to verify across all scenarios

- No inline form ever appears on the roles list screen — navigation always goes to a new URL.
- `super_admin` role row: Edit button present (for users with `settings.update`), navigates to edit page, name field disabled, permission count shown as "All permissions (bypass)" on the list — the form still loads with empty permission toggles (super_admin has `permissions: []` in the DB since it uses the sentinel instead).
- Browser back button from create/edit page returns to roles list correctly.
- After saving a system role's permissions, the roles list screen shows the updated permission count when navigated back to.
