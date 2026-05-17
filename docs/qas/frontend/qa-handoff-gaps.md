# QA Handoff — Gap Features (Frontend)

**Date:** 2026-05-17  
**Build status:** Typecheck clean ✅ | Lint clean ✅ | Build clean ✅  
**Gaps covered:** 1 (Password Reset), 2 (Lab Result Sign-Off), 3 (Incoming Transfers), 4 (Role Management), 5 (Hospital-Wide Audit Log)

---

## Gap 1 — Password Reset via Super-Admin Code

### Forgot Password Screen
**Route:** `/forgot-password`  
**File:** `apps/medcord-web/src/features/auth/features/forgot-password/screen/forgot-password-screen.tsx`

On the Forgot Password screen, user must be able to:
- see an info message explaining that password resets require a super-admin generated code
- click "I have a reset code" to navigate to `/reset-password`
- click "Back to login" to return to the login screen

---

### Enter Reset Code Screen
**Route:** `/reset-password`  
**File:** `apps/medcord-web/src/features/auth/features/reset-password/screen/enter-code-screen.tsx`

On the Enter Reset Code screen, user must be able to:
- type or paste a 7-character reset code — input must auto-uppercase
- click "Verify code" to validate the code against the server
- see a spinner on the button while verifying
- see a toast error if the code is invalid or expired
- be redirected to `/reset-password/new?code=<CODE>` on success

---

### New Password Screen
**Route:** `/reset-password/new` (requires `?code=` query param)  
**File:** `apps/medcord-web/src/features/auth/features/reset-password/screen/new-password-screen.tsx`

On the New Password screen, user must be able to:
- enter a new password with a show/hide eye toggle
- enter the same password in the confirm field with its own eye toggle
- click "Set new password" to submit — form must be disabled while loading
- see an inline error if the two passwords do not match (no network call made)
- see a toast error if the server rejects the reset (code expired/invalid)
- see a success confirmation state ("Password updated") after a successful reset — the screen must navigate to `/login` after 2 seconds automatically

---

### Staff Profile — Generate Reset Code (Super-Admin)
**Route:** `/h/:slug/staff/:staffId`  
**File:** `apps/medcord-web/src/features/staff/features/staff-profile/screen/staff-profile-screen.tsx`  
**Part:** `apps/medcord-web/src/features/staff/features/staff-profile/screen/parts/profile-actions.tsx`

On the Staff Profile screen, a super-admin must be able to:
- see a "Generate reset code" button — this button is ONLY visible when the current user's role is `super_admin` AND the profile being viewed is NOT their own account
- click "Generate reset code" — on success, a modal must open displaying the generated code and a "Copy" button
- click "Copy" in the modal — the button must change to "Copied!" then revert
- NOT see the button if logged in as any role other than `super_admin`
- NOT see the button on their own profile even if they are super_admin

---

## Gap 2 — Lab Result Sign-Off

### Lab Order Detail — Result Sign-Off Panel
**Route:** `/h/:slug/patients/:patientCode/labs/:orderId`  
**File:** `apps/medcord-web/src/features/labs/features/lab-orders/screen/lab-order-detail-screen.tsx`  
**Part:** `apps/medcord-web/src/features/labs/features/lab-orders/screen/parts/result-signoff-panel.tsx`

The sign-off panel is only visible when the order status is `result_ready` or `result_released`.

When status is `result_ready`:
- a prescriber (doctor / nurse_practitioner / physician_assistant) must see a "Release result to chart" button
- clicking "Release result to chart" must advance the status and refresh the order
- a non-prescriber must see a read-only message "Awaiting prescriber sign-off" — no action button
- the standard advance-status button area must NOT show an advance button for this status

When status is `result_released`:
- all users must see a green "Released" badge with the release timestamp (formatted as locale string)
- no further action buttons appear

The backend must reject a `result_released` advance from a non-prescriber role with a 403 error — verify this with a direct API call if possible.

---

## Gap 3 — Incoming Transfer Queue

### Transfers Screen
**Route:** `/h/:slug/patients/transfers`  
**File:** `apps/medcord-web/src/features/patients/features/patient-transfers/screen/transfers-screen.tsx`  
**Sidebar:** Listed under Patients when `modules.emr === true`

On the Transfers screen, user must be able to:
- see a list of pending incoming patient transfer requests with: patient name, patient code (copyable), sending hospital, ward, attending, and any included records (EMR, labs, medications shown as green pills)
- click "Copy" on the patient code — button must change to "Copied!" then revert
- click "Accept" on a transfer card — transfer is accepted immediately (no confirmation modal)
- click "Decline" on a transfer card — a destructive confirmation modal must appear; transfer is declined on confirm
- see a loading spinner while transfers are loading
- see an error message if the fetch fails
- see an empty state (icon + "No incoming transfers") when the queue is empty

---

## Gap 4 — Role Management Screen

### Roles Screen
**Route:** `/h/:slug/staff/roles`  
**File:** `apps/medcord-web/src/features/staff/features/roles/screen/roles-screen.tsx`  
**Sidebar:** Listed after "Staff", visible only to `super_admin` and `hospital_admin` roles

On the Roles Screen, a user with manage access (`super_admin` or `hospital_admin`) must be able to:
- see a table of all custom roles with: name and permissions list
- click "New role" to expand an inline create form
- fill in role name and permissions (one per line in a textarea) and click "Save" — role is created and list refreshes
- click an "Edit" button on an existing role row — the row expands an inline edit form pre-filled with the role's current name and permissions
- update the name or permissions and click "Save" — role is updated and list refreshes
- click "Cancel" in either form to collapse it without saving
- see a loading spinner while the role list loads
- see an error message if the fetch fails
- see "No custom roles yet" empty state when the list is empty

A user without manage access must:
- see the roles list (read-only table, no "New role" button, no "Edit" buttons)

---

## Gap 5 — Hospital-Wide Audit Log

### Settings — Audit Log Tab
**Route:** `/h/:slug/settings` → "Audit Log" tab  
**File:** `apps/medcord-web/src/features/workspace/features/hospital-settings/screen/hospital-settings-screen.tsx`  
**Part:** `apps/medcord-web/src/features/workspace/features/hospital-settings/screen/parts/settings-audit-log.tsx`

On the Settings screen, the "Audit Log" tab must be present between "Usage" and "Danger Zone".

On the Audit Log tab, user must be able to:
- see a table of audit events with columns: Action, Resource (type + truncated ID), Actor ID (truncated), Role, IP, Date
- filter by action using the dropdown — selecting any action type must refresh the table immediately and reset to page 1
- filter by actor ID using the text input — the table must debounce and update ~300ms after typing stops and reset to page 1
- use both filters together
- see a loading spinner while the log is loading
- see an error message if the fetch fails
- see "No audit events found" when no events match the filters
- see Prev / Next pagination buttons when totalPages > 1 — Prev must be disabled on page 1, Next must be disabled on the last page
- see the current page / total pages counter between the Prev and Next buttons
