# QA Handoff — Role View Screen + Member Counts

**Date:** 2026-05-17
**Build status:** Typecheck clean ✅
**Scope:** Role view page, member count on roles list, BUG-RE-01 (frontend-observable effect)

---

## What changed

- **Roles list** (`/h/:slug/staff/roles`) — both system and custom role tables now show a **Members** column with the active member count per role. Each row now has a **View** button alongside Edit. `super_admin` row has View only (no Edit button).
- **New role view page** (`/h/:slug/staff/roles/:roleId`) — 2-column layout: permissions list on the left, active members on the right.
- **BUG-RE-01 backend fix** — system role permission edits now take effect on next login. The frontend test that validates this is: edit a system role's permissions, log out and back in, observe the correct reduced/extended permission set.

---

## 1. Roles List — Member Count Column + View/Edit Buttons

**Route:** `/h/:slug/staff/roles`
**File:** `apps/medcord-web/src/features/staff/features/roles/screen/roles-screen.tsx`

### System roles table

| Column | Content |
|--------|---------|
| Name | Role name + slug monospace |
| Permissions | Badge with count, or "All permissions (bypass)" for super_admin |
| Members | Active member count (integer) |
| Actions | View button always visible; Edit button visible only for non-super_admin AND users with `settings.update` |

- `super_admin` row: View button only — no Edit button at all.
- All other system roles: View + Edit (for managers), View only (for non-managers).
- Clicking View → navigates to `/h/:slug/staff/roles/:roleId`.
- Clicking Edit → navigates to `/h/:slug/staff/roles/:roleId/edit`.

### Custom roles table

Same columns as system roles (Name, Permissions, Members, Created, Actions).

- All custom roles: View + Edit + Delete (for managers), View only (for non-managers).
- Member count reflects active members assigned to this role slug at time of page load.

---

## 2. Role View Page

**Route:** `/h/:slug/staff/roles/:roleId`
**File:** `apps/medcord-web/src/features/staff/features/roles/screen/role-view-screen.tsx`

### Layout

2-column grid (stacks to 1 column on mobile):
- Left: **Permissions panel**
- Right: **Members panel**

### Header

- "Back to roles" ghost button (arrow left) at top.
- Heading: role name.
- Subtitle:
  - `super_admin`: "Super Admin bypasses all permission checks."
  - System role (non-super_admin): "System role — permissions are editable, name is fixed."
  - Custom role: "Custom role"
- "Edit permissions" button top-right — visible only to users with `settings.update` AND only for non-super_admin roles. For super_admin: button not rendered at all.

### Permissions panel

- Title: "Permissions"
- `super_admin`: shows badge "All permissions (bypass)" — no list items.
- Other roles with 0 permissions: shows "No permissions assigned."
- Other roles: list of permission descriptions (plain text, one item per row with a small dot indicator). Uses `permissionDescriptions` from the roles API response — never raw permission strings.

### Members panel

- Title: "Members · {memberCount}" where memberCount comes from the role object (populated by backend).
- While loading staff: spinner.
- No active members: "No active members with this role."
- Member rows: name (bold) + email (muted), department shown on right if set. Clicking a row navigates to `/h/:slug/staff/:memberId`.
- Fetches `GET /staff?role={slug}&status=active&limit=100` — shows up to 100. (Pagination not implemented on this screen.)

### Error + loading states

- If role not found (`data` loaded but `roleId` not in list): red alert "Role not found."
- Loading: centred spinner.

---

## 3. Permission-gated behaviour

- Users **without** `settings.update`: no "Edit permissions" button on the view page. View page is fully accessible (no permission needed to view a role).
- `super_admin` role: no Edit button on either list or view page, regardless of user permissions.

---

## 4. BUG-RE-01 — System role permission edits now take effect

**How to verify:**

1. Log in as a hospital admin (super_admin or with `settings.update`).
2. Navigate to a system role (e.g. Doctor) and edit its permissions — remove all but `patient.view`.
3. Save. Note the toast "Role updated."
4. Open a separate browser session logged in as a Doctor. The existing session should return 401 on the next API call (token version bumped).
5. The Doctor logs in again (fresh login).
6. `GET /staff/me` — `permissions` array should now contain only `patient.view` (or whatever was set in step 2), not the original 23-permission default set.

This was broken before (BUG-RE-01): re-login always returned the hardcoded defaults regardless of what was saved. The backend fix is in `apps/main-backend/src/lib/permissions.ts`.
