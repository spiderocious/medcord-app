# Medcord Frontend — Staff Invitations, Session Resumption & Table Fixes

> **QA:** Claude  
> **Date:** 2026-05-17  
> **Modules:** Staff Directory · Invitation Accept Flow · Resumable Sessions  
> **Environment:** `http://localhost:5176` · Backend `http://localhost:8085`  
> **Credentials:** `alice@medcord.test` / `Medcord123!` (hospital_admin seed)

---

## Scope

This handoff covers five distinct work areas shipped in this session:

1. **Staff Directory table** — swapped hand-rolled table for design system `Table<T>`, `StaffAvatar`, `StatusPill`
2. **Staff Directory empty states** — differentiated "no staff yet" vs "no results" states
3. **Settings branding crash fix** — `hospital.branding?.primaryColor` defensive null guard
4. **Resumable sessions** — `?next=` URL param so users land back where they were after re-login
5. **Invitation copy-link** — "Copy link" button on pending invitation rows
6. **Accept invitation screen** — new public route `/invitations/:token` with full registration flow

---

## Rules Under Test

| Rule | Expectation |
|---|---|
| **meemaw-REPEAT** | No raw `.map()` in JSX. Use `<Repeat each={...}>` |
| **meemaw-SHOW** | No raw `&&` or ternaries. Use `<Show when={...}>` |
| **AppButton** | All interactive buttons use `<AppButton variant="...">` |
| **AppText** | All text content uses `<AppText variant="...">` — no raw `<p>`, `<span>` |
| **Color tokens** | No raw hex. Forest/charcoal/cream tokens only |
| **Error display** | Mutation errors shown inline with `role="alert"`. No toast for errors |
| **Success toasts** | Post-mutation success via `DrawerService.toast(msg, { type: 'success' })` |
| **Confirmation modals** | Destructive/irreversible actions use `DrawerService.showConfirmationModal(...)` |
| **Props readonly** | All prop interfaces use `readonly` |

---

## 1 — Staff Directory Table

**Route:** `/h/:slug/staff`  
**Files:** `staff-directory-screen.tsx`, `screen/parts/staff-table.tsx`

### 1.1 Table Layout

| ID | Test | Expected |
|---|---|---|
| SD-TBL-01 | Visit `/h/:slug/staff` | Staff renders in the design system `Table` component — not a hand-rolled `<table>`. Columns: Member, Role, Status, Department, (actions). |
| SD-TBL-02 | Member column | Each row shows a `StaffAvatar` (initials circle with role-keyed colour) alongside the staff member's full name and email in two lines. |
| SD-TBL-03 | Status column | Each row shows a `StatusPill` component from `@medcord/ui` — green for active, yellow/amber for suspended, etc. Not a raw badge `<span>`. |
| SD-TBL-04 | "View →" link | Each row's action cell contains a link that navigates to `/h/:slug/staff/:staffId`. Must not be a raw `<button>`. |
| SD-TBL-05 | Pagination | Page controls render inside the `Table` component (not a hand-rolled bar below the table). Clicking next/prev changes the visible page of results. |
| SD-TBL-06 | Skeleton loading | While data loads, skeleton rows animate — built with `<Repeat times={N}>`, not `.map([1,2,3,4,...])`. |
| SD-TBL-07 | Fetch error | If the staff API call fails, an error state is shown — not a blank table. |

### 1.2 Empty States

| ID | Test | Expected |
|---|---|---|
| SD-EMPTY-01 | No staff, no filters | Empty state shows a generic icon, "No staff yet" message, and an "Invite staff" CTA button linking to the invite screen. |
| SD-EMPTY-02 | Filters applied, no results | Empty state shows a search/filter icon, "No results" heading, a hint like "Try adjusting your filters", and a "Clear filters" button that resets all filter fields. |
| SD-EMPTY-03 | Clear filters button works | Clicking "Clear filters" resets the name search, role filter, and status filter fields simultaneously. The table re-fetches and the correct empty state or data renders. |
| SD-EMPTY-04 | Filter then clear | Type a search term that returns 0 results → "No results" state. Click "Clear filters" → state switches back to full staff list (or "No staff yet" if there truly are none). |
| SD-EMPTY-05 | Invite CTA is visible | On the "no staff" empty state, the "Invite staff" button navigates to `/h/:slug/staff/invite`. |

---

## 2 — Settings Branding Crash Fix

**Route:** `/h/:slug/settings` (Branding tab)  
**File:** `hospital-settings/screen/parts/settings-branding.tsx`

### 2.1 Branding Panel

| ID | Test | Expected |
|---|---|---|
| BR-01 | Open Branding tab for a hospital with branding data | All colour pickers and the logo position selector pre-fill with the saved values. No crash. |
| BR-02 | Open Branding tab for a hospital with **no branding** data | Panel renders with default placeholder values — **does not crash**. Previously crashed with `Cannot read properties of undefined (reading 'primaryColor')`. |
| BR-03 | Open Branding tab for a hospital with **partial branding** (e.g. `accentColor` missing) | No crash. Missing fields render with their defaults. |
| BR-04 | Save branding from a null-branding hospital | After saving, the fields persist on next open. |

---

## 3 — Resumable Sessions

**Files:** `packages/api/src/client.ts`, `auth-guard.tsx`, `login-screen.tsx`

### 3.1 Session Expiry Redirect

| ID | Test | Expected |
|---|---|---|
| RS-EXPIRY-01 | Access token expires while user is on a deep route (e.g. `/h/demo-hospital/patients/PT-001/chart/medications`) | After the ky `afterResponse` hook detects a 401 that cannot be refreshed, the user is redirected to `/login?next=%2Fh%2Fdemo-hospital%2Fpatients%2FPT-001%2Fchart%2Fmedications`. The `?next=` value is the full URL-encoded path + query string of the page the user was on. |
| RS-EXPIRY-02 | Session expires while user is already on `/login` | Redirect goes to `/login` with **no** `?next=` param — no infinite loop. |
| RS-EXPIRY-03 | Log in after expiry redirect | After submitting valid credentials on `/login?next=...`, user lands on the `?next=` path — not the default `/hospitals`. |
| RS-EXPIRY-04 | Log in with TOTP after expiry redirect | If the account has 2FA, the TOTP step must also respect `?next=`. After correct TOTP entry, user lands on the `?next=` path. |

### 3.2 Auth Guard Redirect

| ID | Test | Expected |
|---|---|---|
| RS-GUARD-01 | Unauthenticated user visits a protected route directly | `AuthGuard` redirects to `/login?next=<encoded-path>`. The `next` param matches the full route they attempted to visit. |
| RS-GUARD-02 | Unauthenticated user visits `/hospitals` | Redirect to `/login?next=%2Fhospitals`. |
| RS-GUARD-03 | Log in after guard redirect | User lands on the route they originally tried to reach. |

### 3.3 Manual Logout — No Resumption

| ID | Test | Expected |
|---|---|---|
| RS-LOGOUT-01 | User clicks the logout button in the topbar | Tokens cleared. User redirected to `/login` with **no** `?next=` param. |
| RS-LOGOUT-02 | After manual logout, log back in | User lands on the default `/hospitals` page — not any previous deep route. |

---

## 4 — Invitation Copy-Link

**Route:** `/h/:slug/staff`  
**File:** `staff-directory/screen/parts/invitation-row.tsx`

### 4.1 Copy Link Button

| ID | Test | Expected |
|---|---|---|
| INV-COPY-01 | Visit staff directory with at least one pending invitation | Each pending invitation row shows a "Copy link" button (ghost variant, `IconCopy` icon) alongside the Resend and Revoke buttons. |
| INV-COPY-02 | Click "Copy link" | Clipboard receives the full invitation URL: `https://<origin>/invitations/<token>`. A success toast appears: "Invite link copied." |
| INV-COPY-03 | Button state after copy | Button icon changes to `IconCheck` and label becomes "Copied" for the duration of the `CopyToClipboard` copied state. Reverts to "Copy link" after the reset delay. |
| INV-COPY-04 | Link content is correct | Paste the copied text. The URL must open the `/invitations/:token` accept screen (new public route). |
| INV-COPY-05 | Multiple pending invitations | Each invitation row has its **own** copy button with the correct token — not a shared token. |
| INV-COPY-06 | No copy button on expired/revoked invitations | Only `status === 'pending'` invitations appear in the list. Expired/revoked rows are not shown. |

---

## 5 — Accept Invitation Screen

**Route:** `/invitations/:token` (public — no AuthGuard)  
**Files:** `accept-invite/screen/accept-invite-screen.tsx`, `accept-invite/api/use-invitation-details.ts`, `accept-invite/api/use-accept-invitation.ts`

> **Critical:** This screen is crash-prone. Test all sub-states thoroughly. The token in the URL is the only source of truth.

### 5.1 Loading State

| ID | Test | Expected |
|---|---|---|
| AI-LOAD-01 | Open any valid `/invitations/:token` URL | A loading skeleton is shown (animated pulse) while `GET /api/v1/invitations/:token` is in flight. Title shows "You've been invited". |
| AI-LOAD-02 | Skeleton layout | At minimum: one large block (hospital card skeleton), two narrow lines, two button-height blocks. Uses animate-pulse CSS — not a spinner. |

### 5.2 Invalid / Expired Token (Dead-End Error State)

| ID | Test | Expected |
|---|---|---|
| AI-ERR-01 | Token does not exist (404 from GET) | Error state renders. Title changes to "Invitation unavailable". `IconLock` icon in a red circle. Message from backend (e.g. "Invitation not found"). "Go to sign in" button links to `/login`. No form is shown. |
| AI-ERR-02 | Token already used (409 from GET) | Same dead-end error card. Message shows the backend reason (e.g. "This invitation has already been used"). |
| AI-ERR-03 | Token expired (another 409/400 from GET) | Dead-end error card with expiry message. "Ask the person who invited you to send a new invitation" helper text shown below the message. |
| AI-ERR-04 | No retries on GET error | The GET request must NOT retry on failure. Error state surfaces immediately (TanStack Query configured with `retry: false`). |
| AI-ERR-05 | Empty token in URL | Token param missing or empty — `useInvitationDetails` is disabled (`enabled: token !== ''`). Screen must not fire the API call. Shows error state or remains in loading without crashing. |

### 5.3 Valid Token — Form State

| ID | Test | Expected |
|---|---|---|
| AI-FORM-01 | Valid token, GET succeeds | Full form renders. Title: "You've been invited". Subtitle shows invited-by name and expiry date formatted as `"16 May 2026"`. |
| AI-FORM-02 | Hospital card | Card shows hospital name (bold) and hospital location (muted). An `IconBuilding` icon in a small rounded box on the left. |
| AI-FORM-03 | Role badge | Below the card: "Joining as **Doctor**" (or relevant role label). If `department` is set: "Joining as **Doctor · Cardiology**". |
| AI-FORM-04 | Email field | Read-only input pre-filled with the invited email. Visually greyed out (`bg-forest-900/5`). Not editable. Not focusable as an edit target. |
| AI-FORM-05 | Full name field | Empty input, placeholder "Your full name". Accepts text. Required. |
| AI-FORM-06 | Password field | Empty input, placeholder "Min. 8 characters". Type `password`. `minLength={8}`. Required. |
| AI-FORM-07 | Password show/hide toggle | Eye/EyeOff icon button (right side of password field). Clicking toggles between `type="password"` and `type="text"`. Button has `aria-label`. |
| AI-FORM-08 | Submit button | "Accept invitation" `<AppButton type="submit">` at bottom of form. |

### 5.4 Form Validation

| ID | Test | Expected |
|---|---|---|
| AI-VAL-01 | Submit with empty name | Browser/HTML5 `required` validation fires — native tooltip on name field. Form does not submit. |
| AI-VAL-02 | Submit with empty password | Browser/HTML5 `required` validation fires on password field. Form does not submit. |
| AI-VAL-03 | Submit with password under 8 characters | Browser/HTML5 `minLength` validation fires. Form does not submit. |

### 5.5 Happy Path — Successful Submission

| ID | Test | Expected |
|---|---|---|
| AI-SUCCESS-01 | Fill name + valid password, click "Accept invitation" | `POST /api/v1/invitations/:token/accept` is called with `{ name, password }`. |
| AI-SUCCESS-02 | Loading state during submission | "Accept invitation" button shows loading spinner. All inputs are disabled. |
| AI-SUCCESS-03 | On success — token storage | `accessToken` and `refreshToken` from the response are stored in token storage. |
| AI-SUCCESS-04 | On success — user context | User context is populated with at minimum: `email` (from invitation details), `name` (from form input), `isEmailVerified: true`. |
| AI-SUCCESS-05 | On success — navigation | User is redirected to the hospital dashboard: `/h/:hospitalSlug/dashboard`. The slug comes from the POST response `hospitalSlug` field. |
| AI-SUCCESS-06 | Redirect replaces history | The redirect uses `replace: true` — pressing browser back from the dashboard does **not** return to the invitation form. |

### 5.6 POST Error — Account Already Exists

| ID | Test | Expected |
|---|---|---|
| AI-EXISTS-01 | Submit with email that already has a Medcord account | POST returns an error whose message contains "already exists". Inline error alert appears (`role="alert"`, red background). Button is no longer loading. |
| AI-EXISTS-02 | "Sign in instead" link | Below the error message, a "Sign in instead →" link appears. It links to `/login?next=/invitations/:token`. |
| AI-EXISTS-03 | Sign in instead — redirect chain | Clicking the link goes to login. After successful login, the `?next=` param routes user back to `/invitations/:token`. The invitation accept then handles the already-logged-in scenario. |

### 5.7 POST Error — Generic Failure

| ID | Test | Expected |
|---|---|---|
| AI-GENERIC-ERR-01 | POST returns a non-"already exists" error | Inline error alert (`role="alert"`) shows the backend error message. No "Sign in instead" link. Button re-enables. |
| AI-GENERIC-ERR-02 | Network failure during POST | Error alert shows a fallback message ("Something went wrong."). No crash. |
| AI-GENERIC-ERR-03 | Retry after error | User can fix the issue and re-submit without refreshing the page. Error clears on next submit attempt. |

### 5.8 Edge Cases

| ID | Test | Expected |
|---|---|---|
| AI-EDGE-01 | Logged-in user visits `/invitations/:token` | The route is public (no `AuthGuard`). The form renders normally regardless of login state. The accept flow still works — the existing session is replaced by the new tokens returned from POST. |
| AI-EDGE-02 | `invitedBy.name` missing | If backend omits `invitedBy.name`, subtitle must not crash. Renders gracefully (empty or with a fallback). |
| AI-EDGE-03 | `hospital.location` missing | Hospital card must not crash if `location` is undefined. Renders gracefully. |
| AI-EDGE-04 | Very long hospital name | Truncated with `truncate` CSS in the hospital card — does not overflow or break layout. |
| AI-EDGE-05 | Token with special URL characters | URL-safe tokens only (base64url). Verify the `useParams` token value is passed verbatim to API calls — no double encoding. |
| AI-EDGE-06 | Direct URL bar navigation | Pasting `/invitations/<token>` in the address bar renders the screen correctly (no broken hydration, no missing context crash). |

---

## 6 — Route Registration

| Route | Guard | Screen |
|---|---|---|
| `/invitations/:token` | **None (public)** | `AcceptInviteScreen` |

> Verify: opening `/invitations/:token` while logged out must NOT redirect to `/login`. The route must render without any auth check.

---

## 7 — API Calls to Verify

| Call | When | Expected Response Shape |
|---|---|---|
| `GET /api/v1/invitations/:token` | On screen mount (if token present) | `{ data: { invitation: { email, role, department?, expiresAt }, hospital: { name, slug, location, logoKey? }, invitedBy: { name } } }` |
| `POST /api/v1/invitations/:token/accept` | On form submit | `{ data: { hospitalId, hospitalSlug, accessToken, refreshToken } }` |

---

## 8 — Cross-Cutting Checks

| ID | Check | Expected |
|---|---|---|
| CC-01 | No raw `&&` or ternary rendering in new files | `<Show when={...}>` used throughout |
| CC-02 | No `.map()` in JSX in new files | `<Repeat each={...}>` or `<Repeat times={N}>` used |
| CC-03 | All text content uses `AppText` | No raw `<p>`, `<h3>`, `<span>` for content |
| CC-04 | All buttons use `AppButton` | Exception: the password show/hide toggle uses a raw `<button>` — this is intentional (toggle semantics) |
| CC-05 | No raw hex colour values | Token-based classes only |
| CC-06 | Named exports only | No `export default` in new files |
| CC-07 | All props `readonly` | Check `AcceptInviteScreen` has no mutable prop interfaces (it uses no props — acceptable) |
| CC-08 | TypeScript: no `any` | Verify with `pnpm nx typecheck medcord-web` — must pass clean |

---

## 9 — Known Risk Areas

- **`window.location.origin` in copy-link** — Works in browser. Will throw in SSR contexts (not applicable here, but note for future).
- **`setUser` with partial data** — After accept, user object is constructed from `email` (invitation) + `name` (form). Fields like `id`, `createdAt`, `updatedAt` are set to empty strings. This matches the `User` type but may surface issues if any screen reads `user.id` before a page refresh repopulates it from the API.
- **Branding null guard** — `hospital.branding?.primaryColor` is safe, but if any other settings tab reads `hospital.branding.*` without `?.`, similar crashes may occur in settings. Spot-check all settings tabs.
- **`?next=` open redirect** — The `next` param is currently used verbatim. If it contains a fully external URL (e.g. `?next=https://evil.com`), the user would be redirected off-domain. Verify that `login-screen.tsx` only navigates to the `next` value if it starts with `/`.