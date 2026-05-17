# QA Handoff — RBAC Redesign

**Date:** 2026-05-17  
**Build status:** Typecheck clean ✅ · Lint clean ✅ · Build clean ✅  
**Modules covered:** Role-Based Access Control redesign — system roles seeding, roles screen, invite form, backend permission enforcement, session revocation, custom roles

---

## 1. System Roles Seeding

**Backend only — no frontend route**

The 10 system roles must be seeded automatically on hospital creation and on every `GET /hospitals/:id` call. Seeding is idempotent.

Scenarios:
- Create a new hospital. Call `GET /hospitals/:id/roles`. The `roles` array must contain exactly 10 entries with the following slugs: `super_admin`, `hospital_admin`, `doctor`, `nurse`, `nurse_practitioner`, `physician_assistant`, `lab_tech`, `pharmacist`, `reception`, `tech`. Every entry must have `isSystem: true`.
- Call `GET /hospitals/:id/roles` a second time on the same hospital. The total number of roles must not increase — duplicate seeding must not occur.
- Create a second hospital. Both hospitals must independently have all 10 system roles seeded; roles from one hospital must not appear in the other's list.

---

## 2. Roles Screen

**Route:** `/h/:slug/settings/roles`  
**File:** `apps/medcord-web/src/features/staff/features/roles/screen/roles-screen.tsx`  
**Permission hook:** `apps/medcord-web/src/shared/hooks/use-permissions.ts`

Scenarios:
- The page renders two sections: "System roles" (read-only table) and "Custom roles". All 10 system roles must appear in the system roles section.
- No row in the system roles table has an Edit or Delete button. This applies to every system role, including `super_admin`.
- When no custom roles exist, the custom roles section shows an empty state. An "Add role" button is visible to users who have the `settings.update` permission.
- As a user **without** `settings.update`: the Add role button is hidden; no Edit or Delete buttons appear anywhere on the page; the page still loads and the read-only tables are visible.
- **Create a custom role:** click Add role, enter a display name (slug must auto-populate from the name), toggle at least two permissions on, save. The new role must appear in the custom roles section without a page reload.
- **Edit a custom role:** click Edit on a custom role row, change the permission set, save. Reload the page — the updated permissions must persist.
- **Delete a custom role:** click Delete on a custom role row, confirm the prompt. The role disappears from the list immediately. It must not reappear on reload.
- System roles must not have Edit or Delete buttons even when inspected after creating custom roles — the UI separation between system and custom must remain intact.

---

## 3. Invite Form — Role Dropdown

**Route:** `/h/:slug/staff/invite`  
**File:** `apps/medcord-web/src/features/staff/features/staff-invite/screen/parts/invite-form.tsx`

The Role dropdown is populated from `GET /hospitals/:hospitalId/roles`, not from a hardcoded list.

Scenarios:
- Open the invite form. The Role dropdown must include all 10 system roles **except** `super_admin`, plus any custom roles defined for this hospital.
- `super_admin` must never appear as an option in the dropdown.
- Create a custom role named "Cleaner" (slug: `cleaner`) on the roles screen, then return to the invite form. "Cleaner" must appear as a selectable option.
- Submit the form with a valid custom role slug selected. The `POST /hospitals/:id/invitations` request body must contain the selected slug (not a display name). The backend must accept custom role slugs without error.
- Submit the form with a valid system role (e.g. `doctor`) selected. The request must succeed.

---

## 4. Permission Enforcement — Backend

These scenarios must be tested with direct API calls (e.g. cURL or a REST client), not through the frontend UI. Frontend gating is UX-only; the backend must enforce permissions independently.

**Setup:** Create two test accounts in the same hospital — one `doctor` (has `emr.view`) and one `reception` (does **not** have `emr.view`). Obtain valid JWT access tokens for each.

For each row in the table below, call the endpoint with the blocked role's token. Expect `403 Forbidden`. Then call it with the allowed role's token. Expect `2xx`.

| Endpoint | Allowed roles | Blocked roles (expect 403) |
|---|---|---|
| `POST /hospitals/:id/invitations` | `hospital_admin` | `doctor` |
| `POST /hospitals/:id/patients` | `doctor`, `nurse`, `reception` | `lab_tech`, `pharmacist` |
| `GET /patients/:id/chart` | `doctor`, `nurse` | `reception`, `lab_tech` |
| `POST /chart/vitals` | `doctor`, `nurse` | `reception`, `pharmacist` |
| `POST /chart/medications` | `doctor` | `nurse`, `lab_tech` |
| `POST /lab-orders` | `doctor`, `nurse`, `lab_tech` | `reception`, `pharmacist` |
| `POST /lab-orders/:id/advance` | `lab_tech`, `doctor`, `nurse` | `reception`, `pharmacist` |
| `PATCH /assets/:id` | `tech`, `hospital_admin` | `doctor`, `nurse` |
| `DELETE /assets/:id` | `tech` | `doctor`, `nurse`, `hospital_admin` |
| `PATCH /hospitals/:id` | `hospital_admin`, `super_admin` | `doctor` |

**Super admin bypass:** Log in as the hospital's `super_admin`. Call every endpoint in the table above. Every call must return `2xx` regardless of the permission listed. The JWT for `super_admin` must contain the sentinel `__super_admin__` — verify this by decoding the token.

---

## 5. Session Revocation on Role Change

Scenarios:
- Log in as user A (role: `nurse`). Record the access token. An admin calls `PATCH /staff/:memberId` to change user A's role to `reception`. User A makes any authenticated request using the **old** token. The response must be `401 Unauthorized`.
- Log in again as user A. A new token is issued. The new token's permissions payload must reflect the `reception` role's permissions, not the nurse's.
- Log in as user B assigned a custom role "Cleaner". An admin calls `PATCH /roles/:roleId` to update the "Cleaner" role's permission set. User B makes any authenticated request with the **old** token. The response must be `401 Unauthorized`.
- Log in again as user B. The new token must contain the updated permission set for "Cleaner".
- In both revocation cases: the old token must not work for any endpoint, even read-only ones.

---

## 6. `GET /staff/me` — Permissions Payload

**Endpoint:** `GET /hospitals/:id/staff/me`

Scenarios:
- Authenticated as a `doctor`: the response must include a `member` object with a `permissions` array. The array must contain the doctor's default permissions from the `@medcord/rbac` package (e.g. `staff.view`, `patient.view`, `emr.view`). The list must not be empty.
- Authenticated as `super_admin`: the `permissions` field must be `null`. A `null` value signals the bypass sentinel — the actual permissions array must not be exposed in this response.
- Authenticated as a user with a custom role: `permissions` must reflect the exact set toggled on when that role was created or last edited.

---

## 7. System Role Immutability & Custom Role Guards

Scenarios:
- Attempt `POST /roles` as a user **without** `settings.update`. Expect `403 Forbidden`.
- Attempt `DELETE /roles/:roleId` on any system role (e.g. `doctor`). Expect `403 Forbidden` with a message containing "System roles cannot be deleted".
- Attempt `PATCH /roles/:roleId` on any system role to change its name or permissions. Expect `403 Forbidden` with a message containing "System roles cannot be modified".
- Create a custom role, then call `DELETE /roles/:roleId` on it as a `hospital_admin` (who has `settings.update`). Expect `200` — custom roles are deletable.
- Attempt to create a custom role with the same slug as an existing system role (e.g. slug `doctor`). Expect `409 Conflict` or a validation error.

---

## 8. Bulk CSV Invite — Dynamic Role Validation

**Route:** `/h/:slug/staff/invite` (CSV tab)  
**File:** `apps/medcord-web/src/features/staff/features/staff-invite/screen/parts/csv-upload.tsx`

The CSV upload must validate role slugs against the hospital's live role list, not a hardcoded set.

Scenarios:
- Upload a CSV where one row contains a role slug that exists as a custom role in this hospital. That row must parse as valid.
- Upload a CSV where one row contains an unrecognised role slug (one that does not exist as a system or custom role for this hospital). That row must be marked invalid with an error message indicating the role is unrecognised.
- The "Valid roles" hint text in the CSV format card must list the actual roles fetched from `GET /hospitals/:hospitalId/roles` — not a hardcoded string. Create a new custom role and reload the invite page; the hint text must include the new role's slug.
- `super_admin` must not appear in the hint text even if it is present in the API response.
- Submit a fully valid CSV. All rows must be submitted successfully. The backend must accept custom role slugs in bulk invitations.

---

## Route Registration Summary

| Route | Screen |
|---|---|
| `/h/:slug/settings/roles` | RolesScreen |
| `/h/:slug/staff/invite` | StaffInviteScreen |

---

## Behaviour to Verify Across All Scenarios

- A `403` response must never silently succeed or return a partial result. The response body should include a human-readable `message` field.
- A `401` after session revocation must not include stale data in the response body.
- All error toasts on the frontend must display the backend error message, not a hardcoded string.
- The roles screen must not flash Edit/Delete buttons for system roles at any point during load — they must never appear, even momentarily.
- After any role or permission change, a fresh login must always produce a token that reflects the current state.
