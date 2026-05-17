# QA Report — Staff Invitations, Session Resumption & Table Fixes

**Date:** 2026-05-17
**Tester:** Claude (agent-browser)
**Plan ref:** `docs/qas/frontend/plans/staff-invitations-session-test-plan.md`
**App:** http://localhost:5173 (medcord-web)
**Backend:** http://localhost:8085
**Seed user:** alice@medcord.test / Medcord123!

---

## Summary

| Result | Count |
|--------|-------|
| PASS | 58 |
| FAIL | 5 |
| NOTE | 3 |
| SKIP | 16 |
| **Total run** | **82** |

---

## Bugs Found

### BUG-NEW-03 — MEDIUM: `useInvitationDetails` `retry: false` is not respected

**ID:** BUG-NEW-03  
**Severity:** P2 (medium)  
**File:** `apps/medcord-web/src/features/staff/features/accept-invite/api/use-invitation-details.ts`

`useInvitationDetails` sets `retry: false` at the query level. The global `QueryClient` in `app.provider.tsx:19` sets `defaultOptions: { queries: { retry: 1 } }`. In practice, network tab shows **3 GET requests** to `/api/v1/invitations/<invalid-token>` on a 404 — meaning TanStack Query is applying the library default of 3 retries, not the global `1` and not the per-query `false`.

**Evidence:** HAR shows:
```
GET /api/v1/invitations/INVALID-TOKEN-NORETR (Fetch) 404
GET /api/v1/invitations/INVALID-TOKEN-NORETR (Fetch) 404
GET /api/v1/invitations/INVALID-TOKEN-NORETR (Fetch) 404
```
Three total requests (1 initial + 2 retries). Expected: 1 request total.

**Impact:** On bad/expired tokens the error state takes ~3 seconds longer to appear (3 retries with backoff). Not critical, but causes visible delay and unnecessary API load.

**Fix:** Ensure per-query `retry: false` actually overrides the global. May need to verify TanStack Query v5 per-query override semantics. Alternatively, set `defaultOptions.queries.retry: 0` globally and opt into retries per-query.

---

### BUG-NEW-04 — LOW: Open redirect via `?next=` on login page renders a visible error in the UI

**ID:** BUG-NEW-04  
**Severity:** P3 (low — security note)  
**File:** `apps/medcord-web/src/features/auth/features/login/screen/login-screen.tsx:36`

When `?next=https://example.com` is in the login URL, after successful login, `navigate(nextUrl, { replace: true })` (where `nextUrl = 'https://example.com'`) triggers a React Router `replaceState` cross-origin error. The error is:

```
Failed to execute 'replaceState' on 'History': A history state object with URL
'https://example.com/' cannot be created in a document with origin 'http://localhost:5173'
```

This error text is rendered **inside the page body** (appears below the form), the user stays stuck on the login page indefinitely, and login succeeds but the user sees a broken state.

**Observed URL after login:** `http://localhost:5173/login?next=https%3A%2F%2Fexample.com` (stays on login)

**Screenshot:** `screenshots/staff-session/RS-SEC-01-open-redirect.png`

**Fix:** In `login-screen.tsx`, guard `nextUrl` before using it:
```ts
const raw = searchParams.get('next') ?? ROUTES.HOSPITALS;
const nextUrl = raw.startsWith('/') ? raw : ROUTES.HOSPITALS;
```

---

### BUG-NEW-05 — LOW: `<p>` and `<span>` inside `AcceptInviteScreen` — raw HTML content elements

**ID:** BUG-NEW-05  
**Severity:** P3 (code quality / design system)  
**File:** `apps/medcord-web/src/features/staff/features/accept-invite/screen/accept-invite-screen.tsx`

Two raw HTML content elements found:
- **Line 143:** `<span className="font-semibold text-charcoal-900">{roleLine}</span>` inside an `AppText` — the inner span is raw HTML.
- **Line 212:** `<p>{submitError}</p>` inside the `role="alert"` error div — should be `<AppText variant="body-sm" as="p">`.

**Rule violated:** CC-03 (no raw `<p>`, `<span>` for content).

---

### BUG-NEW-06 — LOW: Revoke mutation fails silently for invitations in unexpected states

**ID:** BUG-NEW-06  
**Severity:** P3 (UX)  
**File:** `apps/medcord-web/src/features/staff/features/staff-directory/api/use-staff-invitations.ts`

When "Revoke" is confirmed for an invitation that the backend considers already-non-pending, the DELETE returns `409 { "code": "conflict", "message": "Invitation is not pending" }`. The UI shows a "toast" error (from the `.catch` in `handleRevoke`), but the invitation row **does not disappear** and the query **is still invalidated** — which means after invalidation it refetches and shows the still-pending row. Functionally the mutation fired correctly during the confirm flow, but the error handling results in no visible change or feedback to the user beyond the error toast.

Observed in INV-COPY-10: after confirming Revoke, invitation remained in the list, and backend confirmed status still `pending`.

---

## Section Results

### Section 1 — Staff Directory Table

| ID | Result | Notes |
|----|--------|-------|
| SD-TBL-01 | PASS | `Table<T>` DS component used. `<table>` tag present but internal to DS component — expected. Columns: STAFF MEMBER, ROLE, STATUS, DEPARTMENT + actions. |
| SD-TBL-02 | PASS | `StaffAvatar` renders with initials (e.g. "AM", "CO", "DM") and role-keyed badge ("AD", "MD", "RN"). Name + email in two lines below avatar. |
| SD-TBL-03 | PASS | `StatusPill` used — `<span class="inline-flex ... rounded-full">` with role/pill styling. Active = green ring, dot. Not a raw badge. |
| SD-TBL-04 | PASS | "View →" is an `<a>` link → `/h/hospital-a/staff/MBR-*`. Navigation confirmed. |
| SD-TBL-05 | PASS | Pagination controls present inside the Table component. Only 6 members (< 1 page), so next/prev not clickable — component renders correctly. |
| SD-TBL-06 | NOTE | Skeleton uses `<Repeat times={4}>` with `animate-pulse` divs (confirmed via source). Could not screenshot loading state as data loads from cache instantly after first visit. Source confirms correct implementation. |
| SD-TBL-07 | PASS | Invalid slug → "Could not load hospital workspace." error renders. Note: this is the shell error, not a staff-specific alert — `useStaff` doesn't reach the call because hospital context fails first. |
| SD-TBL-08 | NOTE | `staff-table.tsx` uses `var(--text-primary)`, `var(--text-secondary)`, `var(--text-tertiary)` CSS variables and `font-ui`/`font-mono` utilities in member/role/department cells instead of `AppText`. This is a **CC-APPTEXT violation**. Not a test failure per the functional plan, but flagged for dev review. |

### Section 1B — Empty States

| ID | Result | Notes |
|----|--------|-------|
| SD-EMPTY-01 | SKIP | No way to reach "no staff at all" state — Hospital A has 6 members and removing them would be destructive. Source confirmed: `IconUsers` icon + "No staff yet" + "Invite staff" CTA is wired to the `members.length === 0 && no-filter` branch. |
| SD-EMPTY-02 | PASS | Search "zzznobodymatchesthisxyz" → "No results" heading + "No staff match the current filters. Try adjusting your search." + "Clear filters" button visible. `IconSearch` icon rendered. |
| SD-EMPTY-03 | PASS | Click "Clear filters" → search input clears, MEMBERS count returns to 6. |
| SD-EMPTY-04 | PASS | "No results" state appeared, clear filters → full list appeared. Correct state switch. |
| SD-EMPTY-05 | SKIP | "No staff yet" state unreachable during this test run (see SD-EMPTY-01). |

### Section 2 — Settings Branding Crash Fix

| ID | Result | Notes |
|----|--------|-------|
| BR-01 | PASS | Branding tab opens on Hospital A. Panel shows "Primary colour", "Accent colour", "Logo position", "Save changes". No crash. |
| BR-02 | PASS | **Critical fix verified.** Hospital A has `branding: null` confirmed via API. Branding tab renders with default values (`#1a2e1a` primary, `#f5f0e8` accent, left position). Zero crash. Previous `Cannot read properties of undefined (reading 'primaryColor')` no longer occurs. |
| BR-03 | SKIP | Couldn't test partial branding without modifying DB. Source confirms `??` fallbacks on each field. |
| BR-04 | SKIP | Save flow not executed during this run. |

### Section 3 — Resumable Sessions

| ID | Result | Notes |
|----|--------|-------|
| RS-EXPIRY-01 | PASS | Corrupted tokens mid-session → `clearTokensAndRedirect()` fired → URL became `/login?next=%2Fh%2Fhospital-a%2Fstaff`. Screenshot: `RS-EXPIRY-01-expiry-redirect.png` |
| RS-EXPIRY-02 | PASS (source) | Verified via `client.ts:115-116`: `current !== '/login'` guard prevents `?next=` appended when already on login. Not reproducible in browser without a running auth refresh call. |
| RS-EXPIRY-03 | PASS | Navigated to `/login?next=%2Fh%2Fhospital-a%2Fstaff` → logged in → landed at `/h/hospital-a/staff`. |
| RS-GUARD-01 | PASS | Cleared tokens → visited `/h/hospital-a/staff` → redirected to `/login?next=%2Fh%2Fhospital-a%2Fstaff`. Screenshot: `RS-GUARD-01-login-next-param.png` |
| RS-GUARD-02 | PASS | Cleared tokens → visited `/hospitals` → redirected to `/login?next=%2Fhospitals`. |
| RS-GUARD-03 | PASS | After RS-GUARD-01 redirect, logged in → landed at `/h/hospital-a/staff`. |
| RS-LOGOUT-01 | PASS | Clicked "Sign out" via user menu → redirected to `/login` with no `?next=` param. `window.location.search === ""`. |
| RS-LOGOUT-02 | PASS | After RS-LOGOUT-01, logged in → landed at `/hospitals`. |
| RS-SEC-01 | **FAIL** | Open redirect confirmed as producing a **broken login state** (see BUG-NEW-04). Not an off-domain redirect (browser blocked it), but left user stuck on login page with an error in the page body. |

### Section 4 — Invitation Copy-Link

| ID | Result | Notes |
|----|--------|-------|
| INV-COPY-01 | PASS | Two pending invitation rows visible, each with "Copy link", "Resend", "Revoke" buttons. Screenshot: `INV-COPY-01-copy-link-buttons.png` |
| INV-COPY-02 | PASS | Toast `"Invite link copied."` fired (confirmed via DOM scan; toast auto-dismissed before screenshot). |
| INV-COPY-03 | NOTE | "Copied" transient state (IconCheck + "Copied" label) not captured in snapshot — appeared and reset before snapshot could run. Source confirms `CopyToClipboard` renders `copied` state correctly. |
| INV-COPY-04 | SKIP | Clipboard read permission denied by browser. URL content verified indirectly via source: `${window.location.origin}${ROUTES.INVITATION_ACCEPT(inv.token)}` = `http://localhost:5173/invitations/<token>`. |
| INV-COPY-05 | PASS (source) | Two pending rows each have separate `inv.token` passed to `CopyToClipboard`. Verified via API: different tokens per row. |
| INV-COPY-06 | PASS | Only `status === 'pending'` invitations render. API returns `pending` only — revoked/expired excluded. |
| INV-COPY-07 | PASS | JS click on "Resend" → `DrawerService.showConfirmationModal` fired → `childElementCount === 3`. Modal title: "Resend invitation?", body mentions email address. Screenshot: `INV-COPY-07-resend-modal.png` |
| INV-COPY-08 | SKIP | Resend cancelled during test; not confirmed. |
| INV-COPY-09 | PASS | JS click on "Revoke" → confirmation modal with title "Revoke invitation?" and destructive body text. Screenshot: `INV-COPY-09-revoke-modal.png` |
| INV-COPY-10 | **FAIL** | After confirming Revoke, invitation row **did not disappear**. API confirmed invitation still has `status: pending`. Backend returned `409 "Invitation is not pending"` for the DELETE call — see BUG-NEW-06. |
| INV-COPY-11 | PASS | No expired/revoked rows visible in pending list (API-level filter). |

### Section 5 — Accept Invitation Screen

#### 5A — Route is Public

| ID | Result | Notes |
|----|--------|-------|
| AI-PUB-01 | PASS | Cleared tokens → navigated to `/invitations/<token>` → stayed on invitation URL. No redirect to `/login`. |
| AI-PUB-02 | PASS | Logged in as alice → navigated to `/invitations/<token>` → stayed on invitation URL, form rendered. |

#### 5B — Loading State

| ID | Result | Notes |
|----|--------|-------|
| AI-LOAD-01 | SKIP | Cache hit on repeat visits — skeleton not visible. Source confirms `AuthLayout title="You've been invited"` + `animate-pulse` skeleton on `isLoading`. |
| AI-LOAD-02 | SKIP | Same reason. |

#### 5C — Invalid / Expired Token

| ID | Result | Notes |
|----|--------|-------|
| AI-ERR-01 | PASS | Invalid token → title "Invitation unavailable", `IconLock` in red circle, message "Invitation not found", "Go to sign in" link. Screenshot: `AI-ERR-01-invalid-token.png` |
| AI-ERR-02 | PASS | `document.querySelector('form')` → `null`. No form rendered in error state. |
| AI-ERR-03 | PASS | "Go to sign in" → navigated to `/login`. |
| AI-ERR-04 | **FAIL** | **BUG-NEW-03.** 3 GET requests fired on 404 token, not 1. `retry: false` is not being respected (see bug report above). |
| AI-ERR-05 | SKIP | Empty token path `/invitations/` not separately tested. `enabled: token !== ''` verified via source. |

#### 5D — Valid Token — Form

| ID | Result | Notes |
|----|--------|-------|
| AI-FORM-01 | PASS | Title: "You've been invited". Subtitle: "Invited by Alice Mensah · Expires May 24, 2026". Hospital card, role badge all render. Screenshot: `AI-FORM-01-valid-form.png` |
| AI-FORM-02 | PASS | Hospital card: "Hospital A" (bold) + "Accra, Ghana" (muted). `IconBuilding` icon left. |
| AI-FORM-03 | PASS | "Joining as Nurse" (no department). |
| AI-FORM-03b | PASS | Second invitation (doctor with no dept): "Joining as Doctor". A separate pending invite (brandnew@test.com) shows "Doctor · Neurology" — confirmed on staff directory page. |
| AI-FORM-04 | PASS | `#ai-email.readOnly === true`. Email input pre-filled. Cannot be edited. |
| AI-FORM-05 | PASS | `#ai-name` empty on load, accepts text via `fill`. |
| AI-FORM-06 | PASS | `#ai-password.minLength === 8`. |
| AI-FORM-07 | PASS | Eye button toggles type: `password` → `text` → `password`. `aria-label="Show password"/"Hide password"` present. Screenshot: `AI-FORM-07-password-toggle.png` |
| AI-FORM-08 | PASS | "Accept invitation" button renders as `AppButton type="submit"`. |

#### 5E — Form Validation

| ID | Result | Notes |
|----|--------|-------|
| AI-VAL-01 | **FAIL** | Form has `noValidate` attribute — browser-native `required` validation is **suppressed**. Submitting with empty name fires the POST which returns `400 "Name is required"`, which then shows as an inline `role="alert"`. Functional outcome correct (error shown), but **validation occurs server-side instead of client-side**. This is a design choice deviation from the spec (spec expected browser `required` tooltip). Error renders inline correctly. |
| AI-VAL-02 | SKIP | Follows same pattern as AI-VAL-01. |
| AI-VAL-03 | SKIP | Follows same pattern. `minLength` attribute is on the element but `noValidate` suppresses browser enforcement. |

#### 5F — Happy Path

| ID | Result | Notes |
|----|--------|-------|
| AI-SUCCESS-01 | PASS | `POST /api/v1/invitations/<token>/accept` fired with `{ name, password }`. HAR: 200 response. |
| AI-SUCCESS-02 | PASS | Loading state screenshot taken — button shows loading, inputs disabled during POST. Screenshot: `AI-SUCCESS-02-loading.png` |
| AI-SUCCESS-03 | PASS | After success, tokens present in localStorage. |
| AI-SUCCESS-04 | PASS | Navigated to `/h/hospital-a/dashboard`. Slug from response correctly used. Screenshot: `AI-SUCCESS-04-dashboard-redirect.png` |
| AI-SUCCESS-05 | PASS | History back from dashboard went to `/h/hospital-a/staff` (not back to invitation form). `replace: true` worked. |

#### 5G — POST Error: Already Exists

| ID | Result | Notes |
|----|--------|-------|
| AI-EXISTS-01 | PASS | POST 409 → inline `role="alert"`: "An account with this email already exists. Please log in to accept your invitation." Screenshot: `AI-EXISTS-01-already-exists-error.png` |
| AI-EXISTS-02 | PASS | "Sign in instead →" link visible inside alert. |
| AI-EXISTS-03 | PASS | Link href: `http://localhost:5173/login?next=%2Finvitations%2Ff29c8a8b-...`. Correct format. |

#### 5H — Generic POST Errors

| ID | Result | Notes |
|----|--------|-------|
| AI-GENERIC-ERR-01 | PASS (source) | Catch block: `message.toLowerCase().includes('already exists')` → toggles `alreadyExists`. Non-matching errors show alert without "Sign in instead". Confirmed via source + AI-EXISTS-01 test (only "already exists" showed the link). |
| AI-GENERIC-ERR-02 | SKIP | Network failure simulation not performed. Catch block falls back to `'Something went wrong.'` (confirmed in source). |
| AI-GENERIC-ERR-03 | PASS | `setSubmitError(null)` called at top of `handleSubmit` on each submit. Confirmed by re-submitting after an error — previous error clears before new response. |

#### 5I — Edge Cases

| ID | Result | Notes |
|----|--------|-------|
| AI-EDGE-01 | SKIP | No hospital without `location` available. Source shows `{hospital.location}` with no `?.` guard — potential crash if location is undefined. **Flag for backend to always return `location`.** |
| AI-EDGE-02 | SKIP | No invitation without `invitedBy.name` available. Source: `${invitedBy.name}` — no `?.` guard. Similar risk. |
| AI-EDGE-03 | SKIP | No hospital with 80+ char name. |
| AI-EDGE-04 | PASS | Token `e87b288f-0895-4036-bd0f-0b22bace56e7` passed verbatim in API call URL. No double encoding. |
| AI-EDGE-05 | PASS | Direct `navigate()` to `/invitations/<token>` renders correctly. |
| AI-EDGE-06 | PASS | Direct URL navigation renders correctly. |

### Section 6 — Cross-Cutting Checks

| ID | Result | Notes |
|----|--------|-------|
| CC-01 | PASS | No raw `&&` or ternary rendering in new JSX files. `<Show when={...}>` used throughout. |
| CC-02 | PASS | No `.map()` in JSX. `<Repeat each={...}>` and `<Repeat times={N}>` used. |
| CC-03 | **FAIL** | Two raw content elements in `accept-invite-screen.tsx`: `<span>` at line 143 inside `AppText`, and `<p>` at line 212 inside the alert div. See BUG-NEW-05. |
| CC-04 | PASS | All buttons use `AppButton`. Password toggle uses raw `<button>` — intentional per spec. |
| CC-05 | PASS | No raw hex in new files. `accept-invite-screen.tsx` color inputs use `#1a2e1a` etc. as **values** (not className) — acceptable for color pickers. |
| CC-06 | PASS | No `export default` in any new file. |
| CC-07 | PASS | `InvitationListProps`, `StaffTableProps`, `AuthGuardProps` all use `readonly`. |
| CC-08 | PASS | `pnpm nx typecheck medcord-web` passes clean. |

---

## Priority Fix List

| Priority | Bug | Description |
|----------|-----|-------------|
| P2 | BUG-NEW-03 | `retry: false` in `useInvitationDetails` not overriding global `retry: 1` — 3 retries on 404 |
| P3 | BUG-NEW-04 | `?next=https://external.com` on login leaves user stuck on broken login page |
| P3 | BUG-NEW-05 | Raw `<p>` (line 212) and `<span>` (line 143) in `accept-invite-screen.tsx` — CC-03 violation |
| P3 | BUG-NEW-06 | Revoke mutation fails with 409 for some pending invitations; row stays in list |

---

## Screenshots

```
screenshots/staff-session/
  SD-TBL-01-staff-table.png
  SD-TBL-02-member-column.png
  SD-EMPTY-02-no-results.png
  BR-01-branding-tab.png
  BR-02-no-branding-no-crash.png
  RS-GUARD-01-login-next-param.png
  RS-EXPIRY-01-expiry-redirect.png
  INV-COPY-01-copy-link-buttons.png
  INV-COPY-02-copy-toast.png
  INV-COPY-07-resend-modal.png
  INV-COPY-09-revoke-modal.png
  AI-FORM-01-valid-form.png
  AI-FORM-07-password-toggle.png
  AI-SUCCESS-02-loading.png
  AI-SUCCESS-04-dashboard-redirect.png
  AI-EXISTS-01-already-exists-error.png
  AI-ERR-01-invalid-token.png
  AI-VAL-01-name-required-error.png
```
