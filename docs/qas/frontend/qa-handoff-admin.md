# QA Handoff — Admin Web

**Date:** 2026-05-16  
**Build status:** Typecheck clean ✅ · Lint clean ✅ · Build clean ✅  
**App:** `apps/admin-web/` — runs on port `5174`  
**Modules covered:** Auth, Dashboard, Hospitals, Users

---

## App-level setup to verify

Before testing individual screens, confirm the following:

- Navigating to `http://localhost:5174` (or any route) when **not logged in** must redirect to `/admin/login`
- Navigating to `/admin/login` when **already logged in as an admin** must redirect to `/admin`
- Logging in with a non-admin account must NOT grant access — tokens must be cleared and the user must be sent back to `/admin/login`
- The sidebar is visible on all authenticated screens: Dashboard, Hospitals, Users — with the active item highlighted
- The topbar shows "Medcord · Admin" on the left and the user menu on the right on all authenticated screens
- The user menu shows the logged-in user's name and email, and a "Sign out" button

---

## Auth — Login Screen

**Route:** `/admin/login`  
**File:** `apps/admin-web/src/features/auth/screen/admin-login-screen.tsx`

On the Login screen: user must be able to:
- see the "Medcord Admin" branding at the top
- see the heading "Sign in to your account"
- see the caption "Platform admin access only." below the heading
- see an email field (placeholder: `admin@medcord.com`) and a password field
- toggle password visibility using the eye icon on the password field
- click "Sign in" — if fields are empty, see inline field-level errors ("Email is required.", "Password is required.") without submitting
- click "Sign in" with an invalid email format — see "Enter a valid email address." inline
- click "Sign in" with valid credentials for an admin account:
  - tokens are stored
  - user is redirected to `/admin`
- click "Sign in" with valid credentials for a **non-admin** account:
  - tokens are NOT stored
  - user remains on `/admin/login`
  - an inline error message is shown (never a toast)
- click "Sign in" with wrong credentials:
  - see the backend error message shown inline ("Invalid email or password")
- see the button in a loading state while the request is in flight
- there is **no** "Forgot password?" link on this screen

---

## Dashboard Screen

**Route:** `/admin`  
**File:** `apps/admin-web/src/features/dashboard/screen/admin-dashboard-screen.tsx`  
**Sidebar:** Dashboard item active

On the Dashboard screen: user must be able to:
- see the page heading "Dashboard" with subtitle "Platform-wide overview"
- see 6 stat tiles in a responsive grid (3 columns on desktop, 2 on tablet, 1 on mobile):
  - Hospitals (total count)
  - Active (active hospital count)
  - Archived (archived hospital count)
  - Users (total user count)
  - Admins (platform admin count)
  - 2FA enabled (count of users with 2FA enabled)
- see 2 recent activity cards side by side below the grid:
  - "New signups" — showing "Last 7 days: X" and "Last 30 days: X"
  - "New hospitals" — showing "Last 7 days: X" and "Last 30 days: X"
- see a loading spinner while stats are loading
- see an error message if the fetch fails
- stats must refresh automatically when the browser tab is refocused (refetchOnWindowFocus)

---

## Hospital List Screen

**Route:** `/admin/hospitals`  
**File:** `apps/admin-web/src/features/hospitals/screen/hospital-list-screen.tsx`  
**Sidebar:** Hospitals item active

On the Hospital List screen: user must be able to:
- see the page heading "Hospitals" with a subtitle showing the total hospital count
- see a search input that filters hospitals by name or subdomain — results must update after a 300ms debounce (not on every keystroke)
- see an archive filter select with options: All statuses / Active / Archived — changing the filter must reset to page 1
- see a table of hospitals with columns: Name (with subdomain as muted caption below), Type, Location, Modules, Status, Created
- Module pills in the Modules column must be colour-coded:
  - Enabled module: dark green pill (`bg-forest-900/10 text-forest-900`)
  - Disabled module: muted grey pill
  - 4 pills shown per row: EMR · Labs · Assets · Consult
- Status badge: "Active" (green) or "Archived" (amber)
- click any table row to navigate to `/admin/hospitals/:hospitalId`
- see pagination below the table: "Page X of Y" label, Previous and Next buttons
  - Previous is disabled on page 1
  - Next is disabled on the last page
- see an empty state (building icon + "No hospitals found.") when no results match
- see a loading spinner while loading
- see an error message if the fetch fails

---

## Hospital Detail Screen

**Route:** `/admin/hospitals/:hospitalId`  
**File:** `apps/admin-web/src/features/hospitals/screen/hospital-detail-screen.tsx`

On the Hospital Detail screen: user must be able to:
- see a "Hospitals" back button (arrow left) that returns to the hospital list
- see the hospital name as the page heading with an Active (green) or Archived (amber) status badge beside it
- see the hospital subdomain as a subtitle below the heading
- see a two-column layout: info card on the left (spanning 2/3), actions card on the right (1/3)

**Info card (left, read-only):**
- Type, Location, Plan, Timezone, Locale, Owner ID
- Custom domain (only shown if set)
- Contact email (only shown if set)
- Contact phone (only shown if set)
- A member count pill showing "X members"
- Created and Updated dates

**Actions card (right):**

*Modules section:*
- 4 checkboxes: EMR, Labs, Assets, Online Consultation — pre-filled from the hospital's current module state
- "Save modules" button — clicking sends a PATCH with the current checkbox values
- On success: a success toast "Modules updated." is shown
- On error: an error toast with the backend error message is shown
- Button shows loading state while the request is in flight

*Archive section:*
- If hospital is **active**: show "Archive hospital" button (danger variant)
  - clicking must show a destructive confirmation modal: title "Archive this hospital?", body "Staff will lose access until it is restored."
  - on confirm: PATCH is sent, on success toast "Hospital archived." is shown and the status badge updates
- If hospital is **archived**: show "Restore hospital" button (secondary variant)
  - clicking must act immediately (no confirmation modal)
  - on success: toast "Hospital restored." is shown and the status badge updates

*Danger zone:*
- "Permanently delete" button (danger variant)
  - clicking must show a destructive confirmation modal: title "Permanently delete this hospital?", body "This cannot be undone. Member, patient, and EMR data are not cascade-deleted."
  - on confirm: DELETE is sent — on success, user is navigated back to `/admin/hospitals` immediately (no toast)
  - on error: error toast with backend message is shown

- see a loading spinner while the hospital loads
- see an error message if the fetch fails

---

## User List Screen

**Route:** `/admin/users`  
**File:** `apps/admin-web/src/features/users/screen/user-list-screen.tsx`  
**Sidebar:** Users item active

On the User List screen: user must be able to:
- see the page heading "Users" with a subtitle showing the total user count
- see a search input that filters users by name or email — results must update after a 300ms debounce
- see an admin filter select with options: All users / Admins only / Non-admins — changing the filter must reset to page 1
- see a table of users with columns: Name (with email as muted caption below), Email verified, Admin, 2FA, Joined
- Email verified column: green check icon (`IconCheckCircle`) if verified, red x icon (`IconXCircle`) if not
- Admin column: purple "Admin" badge if `isAdmin` is true, empty if false
- 2FA column: green "2FA on" badge if enabled, muted grey "2FA off" badge if not
- click any table row to navigate to `/admin/users/:userId`
- see pagination below the table: "Page X of Y", Previous and Next buttons with correct disabled states
- see an empty state (users icon + "No users found.") when no results match
- see a loading spinner while loading
- see an error message if the fetch fails

---

## User Detail Screen

**Route:** `/admin/users/:userId`  
**File:** `apps/admin-web/src/features/users/screen/user-detail-screen.tsx`

On the User Detail screen: user must be able to:
- see a "Users" back button (arrow left) that returns to the user list
- see the user's name as the page heading and email as a subtitle
- see a two-column layout: info + memberships on the left (2/3), actions card on the right (1/3)

**Account info card (left):**
- Email, Phone (only shown if set)
- Badges: "Email verified" (green, only shown if true), "Admin" (purple, only shown if true), "2FA on" (green, only shown if true)
- Joined and Updated dates

**Memberships table (below info card):**
- Columns: Hospital ID, Role, Status, Joined
- Shows all hospital memberships for the user
- If the user has no memberships: show "No memberships." text (no table rendered)

**Actions card (right):**

*Platform flags section:*
- Checkbox: "Platform admin" — pre-filled from `user.isAdmin`
- Checkbox: "Email verified" — pre-filled from `user.isEmailVerified`
- "Save flags" button
  - clicking saves changed flags via PATCH
  - on success: toast "User updated." is shown
  - on error: error toast with backend message
  - button shows loading state while in flight
- **Self-demotion guard**: if the currently logged-in admin is viewing their own user detail and unchecks "Platform admin", clicking "Save flags" must show a destructive confirmation modal first: title "Remove your own admin access?", body "You will be logged out and unable to return." — only then proceeds with the PATCH

*Session control section:*
- "Disable all sessions" button (danger variant)
  - clicking must show a destructive confirmation modal: title "Disable all sessions?", body "This will invalidate all active sessions for this user. They will need to log in again."
  - on confirm: POST is sent — on success, toast "All sessions disabled." is shown
  - on error: error toast with backend message

- see a loading spinner while the user loads
- see an error message if the fetch fails

---

## Route Registration Summary

| Route | Screen |
|---|---|
| `/admin/login` | AdminLoginScreen |
| `/admin` | AdminDashboardScreen |
| `/admin/hospitals` | HospitalListScreen |
| `/admin/hospitals/:hospitalId` | HospitalDetailScreen |
| `/admin/users` | UserListScreen |
| `/admin/users/:userId` | UserDetailScreen |

All routes except `/admin/login` are wrapped in `AdminGuard` — unauthenticated access redirects to `/admin/login`.

---

## Auth Behaviour to Verify

| Scenario | Expected behaviour |
|---|---|
| Visit any route without a token | Redirected to `/admin/login` |
| Login with non-admin account | Tokens cleared, redirected back to `/admin/login`, inline error shown |
| Login with invalid credentials | Inline error shown, no redirect |
| Login with valid admin credentials | Redirected to `/admin` |
| User with token visits `/admin/login` | Redirected to `/admin` (token is present, guard passes) |
| Admin clicks Sign out | Tokens cleared, redirected to `/admin/login` |
| Session disabled by another admin | Next API call returns 401, ky client redirects to login |

---

## Toast Behaviour to Verify

| Action | Toast |
|---|---|
| Modules updated | "Modules updated." — success |
| Hospital archived | "Hospital archived." — success |
| Hospital restored | "Hospital restored." — success |
| Hospital permanently deleted | No toast — navigate to `/admin/hospitals` immediately |
| User flags saved | "User updated." — success |
| Sessions disabled | "All sessions disabled." — success |
| Any mutation error | Backend error message — error (never hardcoded) |

---

## Confirmation Modal Behaviour to Verify

| Action | Destructive | Title | Body |
|---|---|---|---|
| Archive hospital | Yes | "Archive this hospital?" | "Staff will lose access until it is restored." |
| Permanently delete hospital | Yes | "Permanently delete this hospital?" | "This cannot be undone. Member, patient, and EMR data are not cascade-deleted." |
| Self-demotion from admin | Yes | "Remove your own admin access?" | "You will be logged out and unable to return." |
| Disable user sessions | Yes | "Disable all sessions?" | "This will invalidate all active sessions for this user. They will need to log in again." |

Non-destructive actions (restore hospital, promote user, verify email) must act immediately — no confirmation modal.

---

## Pagination Behaviour to Verify

- Hospital list and User list both paginate at 20 items per page
- Changing a filter (search query or dropdown) must reset to page 1
- "Previous" button is disabled when on page 1
- "Next" button is disabled when on the last page (`page >= totalPages`)
- Navigating to a detail screen and back must return to the same page the user was on

---

## Debounce Behaviour to Verify

- Search inputs on Hospital List and User List must NOT fire a new API request on every keystroke
- The request fires 300ms after the user stops typing
- Changing the search query resets the page to 1
