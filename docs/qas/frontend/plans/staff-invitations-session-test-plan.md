# Test Plan — Staff Invitations, Session Resumption & Table Fixes

**Prepared:** 2026-05-17
**Source handoff:** `docs/qas/frontend/plans/staff-invitations-session-handoff.md`
**Seed user:** alice@medcord.test / Medcord123!
**App port:** http://localhost:5176
**Backend:** http://localhost:8085
**Screenshots →** `/Users/feranmi/codebases/2026/medcord-app/screenshots/staff-session/`

---

## Pre-flight

1. Confirm backend running: `curl http://localhost:8085/api/v1/health`
2. Confirm medcord-web is on **5176**: `curl http://localhost:5176`
3. Fetch hospital slug for alice's hospital:
   ```
   curl -s -X POST http://localhost:8085/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"alice@medcord.test","password":"Medcord123!"}' \
     | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['tokens']['accessToken'])"
   ```
   Store as `$TOKEN`. Then:
   ```
   curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8085/api/v1/hospitals \
     | python3 -c "import sys,json; h=json.load(sys.stdin)['data']['hospitals'][0]; print(h['id'], h['slug'])"
   ```
   Store hospitalId as `$HSP_ID` and slug as `$SLUG` (probably `hospital-a`).
4. Confirm at least one pending invitation exists; if not, create one via the invite screen or:
   ```
   curl -s -X POST http://localhost:8085/api/v1/hospitals/$HSP_ID/staff/invite \
     -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
     -d '{"email":"qa-test-invite@medcord.test","role":"nurse"}'
   ```
   Store the returned `token` as `$INV_TOKEN`.
5. Screenshots directory: `mkdir -p /Users/feranmi/codebases/2026/medcord-app/screenshots/staff-session`

---

## Section 1 — Staff Directory Table

**Route:** `/h/$SLUG/staff`
**Files:** `staff-directory-screen.tsx`, `screen/parts/staff-table.tsx`

### 1A — Table Layout & Columns

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| SD-TBL-01 | Visit `/h/$SLUG/staff` | Table renders using the design system `Table<T>` component — no hand-rolled `<table>` tags. Columns visible: Staff member, Role, Status, Department, (actions). | `agent-browser snapshot -i` — look for table role elements; `agent-browser screenshot --annotate` |
| SD-TBL-02 | Member column shows avatar + name + email | Each row: `StaffAvatar` initials circle left, name in medium weight, email in muted mono below it. | Screenshot the first row; `agent-browser eval "document.body.innerText"` for text content |
| SD-TBL-03 | StaffAvatar colour is role-keyed | Doctor rows get `md` avatar colour; nurse → `rn`; lab tech → `tech`; admin → `admin`; reception/custom → `other`. | Compare screenshots across rows with different roles |
| SD-TBL-04 | Status column uses `StatusPill` | Active staff show green pill; suspended show amber/red pill. Not a raw `<span class="...">`. | `agent-browser snapshot` — look for statusPill role/class; screenshot |
| SD-TBL-05 | "View →" link navigates to staff profile | Click navigates to `/h/$SLUG/staff/:staffId`. Must be an `<a>` tag (Link), not a `<button>`. | `agent-browser find role link text "View →"` then click; `agent-browser get url` |
| SD-TBL-06 | Pagination controls inside Table component | Next/prev controls are rendered by the `Table` component, not a custom bar below it. Clicking next changes the visible rows. | `agent-browser snapshot -i` for pagination controls; click next if >1 page |
| SD-TBL-07 | Skeleton during load | On first visit (before data loads), 4 animated pulse skeleton rows visible. Built with `<Repeat times={4}>`, not a `.map([1,2,3,4])`. | Navigate fresh, screenshot immediately |
| SD-TBL-08 | Fetch error state | If staff API fails, a `role="alert"` error element shows "Could not load staff directory." — not a blank table. | Navigate with an invalid hospitalId or force offline; check `agent-browser eval "document.querySelector('[role=alert]')?.textContent"` |

**Code smell to flag (SD-TBL-02):** `staff-table.tsx` uses raw `var(--text-primary)`, `var(--text-secondary)`, `var(--text-tertiary)` CSS variables and raw `font-ui` / `font-mono` class utilities in the member column and role/department cells — not `AppText`. This may be a CC-APPTEXT violation depending on design system rules. Record as a code note regardless.

### 1B — Empty States

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| SD-EMPTY-01 | No staff, no filters applied | Empty state shows `IconUsers` icon, "No staff yet" heading, "Invite your first team member to get started." body, and an "Invite staff" `AppButton`. | Clear all filters, ensure 0 members, `agent-browser eval "document.body.innerText"` |
| SD-EMPTY-02 | Filters applied with no results | Empty state shows `IconSearch` icon, "No results" heading, "No staff match the current filters. Try adjusting your search." body, and a "Clear filters" `AppButton`. | Type a nonsense search term that returns 0 results; check body text |
| SD-EMPTY-03 | "Clear filters" resets all filter fields | After clicking "Clear filters", search input clears, role and status dropdowns reset to "All". Table re-fetches. | Check input values after click: `agent-browser eval "document.querySelectorAll('input')[0].value"` |
| SD-EMPTY-04 | "Clear filters" switches empty state back | Was on "No results" → click clear → either full member list or "No staff yet" state appears. "No results" must be gone. | Check `document.body.innerText` for absence of "No results" after clear |
| SD-EMPTY-05 | "Invite staff" CTA navigates correctly | Clicking "Invite staff" button on the "No staff yet" state navigates to `/h/$SLUG/staff/invite`. | `agent-browser click` on button; `agent-browser get url` |

---

## Section 2 — Settings Branding Crash Fix

**Route:** `/h/$SLUG/settings` → Branding tab
**File:** `hospital-settings/screen/parts/settings-branding.tsx`

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| BR-01 | Branding tab with existing branding data | All colour pickers and logo position selector pre-fill with saved values. No crash or blank screen. | Navigate to settings; click branding tab; screenshot |
| BR-02 | Branding tab for a hospital with no branding data | Panel renders with default values (`#1a2e1a` primary, `#f5f0e8` accent, `left` position). **Does not crash.** Blank white screen or JS error = FAIL. | Use a fresh hospital or one never saved to; open branding tab; `agent-browser eval "document.body.innerText"` for form fields |
| BR-03 | Partial branding (some fields missing) | No crash. Missing fields fall back to defaults from `??` expressions. | If possible, manually remove one branding field from DB; reload settings; verify no crash |
| BR-04 | Save from null-branding hospital persists | Fill in colours, save. Reload page. Saved values re-appear. | Complete a save; `agent-browser navigate` to reload; check field values |

---

## Section 3 — Resumable Sessions (`?next=` param)

**Files:** `packages/api/src/client.ts`, `auth-guard.tsx`, `login-screen.tsx`

### 3A — Token Expiry Redirect (API client hook)

These tests require forcing a 401. Approach: clear tokens from storage mid-session, then trigger any API call.

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| RS-EXPIRY-01 | 401 on a deep route causes redirect to `/login?next=<path>` | After access+refresh tokens both fail, `clearTokensAndRedirect()` fires. Browser navigates to `/login?next=<encoded-current-path>`. | Navigate to `/h/$SLUG/patients`, clear tokens via `agent-browser eval "localStorage.clear(); sessionStorage.clear()"`, trigger a fetch (reload), check `agent-browser get url` |
| RS-EXPIRY-02 | 401 while already on `/login` → no `?next=` | `clearTokensAndRedirect()` checks `current !== '/login'`. If already on login, `next` is empty string → redirect to `/login` (no loop). | From `/login`, clear tokens and force 401; URL must be `/login` with no `?next=` param |
| RS-EXPIRY-03 | Login after expiry redirect lands on `?next=` path | Submit valid credentials on `/login?next=%2Fh%2F$SLUG%2Fpatients`; expect redirect to `/h/$SLUG/patients`, not `/hospitals`. | Navigate manually to `/login?next=%2Fh%2F$SLUG%2Fpatients` (not logged in), login, check final URL |

### 3B — AuthGuard Redirect

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| RS-GUARD-01 | Unauthenticated user hits protected route | `AuthGuard` checks `tokenStorage.getAccess() === null`. Redirects to `/login?next=<encoded-attempted-path>`. | Log out (clear tokens), `agent-browser navigate` to `/h/$SLUG/staff`; check URL |
| RS-GUARD-02 | Unauthenticated user visits `/hospitals` | Redirected to `/login?next=%2Fhospitals`. | Same approach; target URL `/hospitals` |
| RS-GUARD-03 | Login after guard redirect → lands at original route | After RS-GUARD-01 redirected to `/login?next=...`, log in. Expect to land on the attempted route. | Follow RS-GUARD-01; submit login; check `agent-browser get url` |

### 3C — Manual Logout — No Resumption

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| RS-LOGOUT-01 | Click logout button in topbar | Tokens cleared. User redirected to `/login` with **no** `?next=` param. | Click logout; `agent-browser get url`; confirm no `?next=` in URL |
| RS-LOGOUT-02 | Log back in after manual logout | Lands on `/hospitals` — not any previous deep route. | Complete logout; login again; check URL |

### 3D — Open Redirect Check (Security)

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| RS-SEC-01 | `?next=https://evil.com` on login page | `login-screen.tsx` uses `nextUrl` verbatim (`navigate(nextUrl, { replace: true })`). A value like `https://evil.com` would navigate off-domain. Verify current behaviour: does login navigate to an external URL? | Navigate to `/login?next=https%3A%2F%2Fexample.com`; login; check final URL. **If it navigates to example.com — this is a BUG to report (open redirect).** |

---

## Section 4 — Invitation Copy-Link

**Route:** `/h/$SLUG/staff`
**File:** `staff-directory/screen/parts/invitation-row.tsx`

Pre-condition: at least one `pending` invitation exists in the DB (see pre-flight step 4).

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| INV-COPY-01 | Pending invitation row has three action buttons | Each pending row shows: "Copy link" (with `IconCopy`), "Resend" (with `IconRefresh`), "Revoke" (with `IconClose`). | `agent-browser snapshot -i` — find buttons in invitation list |
| INV-COPY-02 | "Copy link" fires success toast | Click "Copy link"; `DrawerService.toast('Invite link copied.', { type: 'success' })` fires. Toast visible. | Click button; `agent-browser eval "document.body.innerText"` for toast text |
| INV-COPY-03 | Button icon + label change to "Copied" | Immediately after click: `IconCopy` → `IconCheck`, label → "Copied". | Screenshot immediately after click |
| INV-COPY-04 | "Copied" state reverts after delay | After the `CopyToClipboard` reset timeout, button returns to "Copy link" / `IconCopy`. | Wait ~2 seconds, screenshot again |
| INV-COPY-05 | Clipboard content is correct invitation URL | Paste the copied text. Must be `http://localhost:5176/invitations/$INV_TOKEN`. | `agent-browser eval "navigator.clipboard.readText()"` after click — compare against expected URL |
| INV-COPY-06 | Each pending row has its own correct token | If 2+ pending invitations exist, each "Copy link" copies a different URL matching that row's token. | Create two invitations; copy each; compare |
| INV-COPY-07 | Resend button shows confirmation modal | Click "Resend"; `DrawerService.showConfirmationModal` fires. Modal visible. Title: "Resend invitation?". | Click resend; `agent-browser eval "document.body.childElementCount"` — expect 3 |
| INV-COPY-08 | Resend confirm → success toast | Confirm the modal. Toast: "Invitation resent to `<email>`." | Confirm; check toast text |
| INV-COPY-09 | Revoke button shows destructive confirmation modal | Click "Revoke"; confirmation modal with `kind: 'error'` (red/destructive styling). Title: "Revoke invitation?". | `agent-browser eval "document.body.childElementCount"` — expect 3; screenshot |
| INV-COPY-10 | Revoke confirm → invitation removed from list | After revoking, the invitation row disappears from the list. | Confirm; check that row is gone from the pending list |
| INV-COPY-11 | No copy/resend/revoke on expired or revoked rows | Only `status === 'pending'` invitations appear in the section. Expired/revoked are not rendered. | `InvitationList` internally filters `invitations.filter(inv => inv.status === 'pending')` — verify no non-pending rows appear |

---

## Section 5 — Accept Invitation Screen

**Route:** `/invitations/:token` (public — no AuthGuard)
**Files:** `accept-invite/screen/accept-invite-screen.tsx`, `accept-invite/api/use-invitation-details.ts`, `accept-invite/api/use-accept-invitation.ts`

### 5A — Route is Public

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| AI-PUB-01 | Unauthenticated user visits `/invitations/$INV_TOKEN` | Screen renders — does NOT redirect to `/login`. | Clear tokens; navigate to the URL; check `agent-browser get url` stays on `/invitations/...` |
| AI-PUB-02 | Logged-in user visits `/invitations/$INV_TOKEN` | Screen still renders the form — session is not an obstacle. | Log in as alice; navigate to the URL; verify form renders (not redirect to dashboard) |

### 5B — Loading State

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| AI-LOAD-01 | Valid token — loading skeleton visible | On navigation, before GET resolves, animated pulse skeleton shows. Title: "You've been invited". | Screenshot immediately on navigation; check for `animate-pulse` elements |
| AI-LOAD-02 | Skeleton has expected shape | At least: one large block (h-16 hospital card placeholder), two narrow lines, two button-height blocks. | Screenshot |

### 5C — Invalid / Expired Token

Use a fake token: `agent-browser navigate http://localhost:5176/invitations/INVALID-TOKEN-000`

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| AI-ERR-01 | 404 token → dead-end error card | Title changes to "Invitation unavailable". `IconLock` in red circle. Backend error message shown. No form rendered. "Go to sign in" button links to `/login`. | `agent-browser eval "document.body.innerText"` — must contain "Invitation unavailable" and "Go to sign in" |
| AI-ERR-02 | No form rendered on error | `<form>` element must not be present. Name/password inputs absent. | `agent-browser eval "document.querySelector('form')"` → null |
| AI-ERR-03 | "Go to sign in" navigates to `/login` | Click the button; URL becomes `/login`. | Click; `agent-browser get url` |
| AI-ERR-04 | No retry on GET failure | GET fires once. No polling or retry. Error state appears immediately (TanStack Query `retry: false`). | `agent-browser network requests --method GET --filter "/invitations/"` — exactly 1 request |
| AI-ERR-05 | Empty token param does not fire API | Navigate to `/invitations/` (empty token). `enabled: token !== ''` prevents the GET. No network request to `/invitations//`. Screen shows error or loading without crash. | `agent-browser network requests --filter "/invitations//"` — must be empty |

### 5D — Valid Token — Form

Use the real `$INV_TOKEN` from pre-flight.

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| AI-FORM-01 | Full form renders after GET succeeds | Title: "You've been invited". Subtitle: "Invited by Alice Mensah · Expires `<date>`". Hospital card visible. | `agent-browser eval "document.body.innerText"` |
| AI-FORM-02 | Hospital card shows name and location | Bold hospital name + muted location text. `IconBuilding` icon left-side. | Screenshot; `document.body.innerText` |
| AI-FORM-03 | Role badge: no department | "Joining as **Nurse**" (or invited role). No department suffix. | Check body text |
| AI-FORM-03b | Role badge: with department | If invitation has department set: "Joining as **Nurse · Cardiology**". | Create invitation with department, re-test |
| AI-FORM-04 | Email field is read-only and pre-filled | Input value = invited email. `readOnly` attribute present. Cannot be edited. | `agent-browser eval "document.querySelector('#ai-email').readOnly"` → true; try typing, value should not change |
| AI-FORM-05 | Full name field: empty, accepts text | Input is empty on load. Accepts text input. | `agent-browser eval "document.querySelector('#ai-name').value"` → empty string |
| AI-FORM-06 | Password field: empty, min 8 chars | `type="password"`. `minLength="8"` attribute present. | `agent-browser eval "document.querySelector('#ai-password').minLength"` → 8 |
| AI-FORM-07 | Password show/hide toggle | Click eye button → input type becomes `text`. Click again → back to `password`. `aria-label` present. | Toggle; `agent-browser eval "document.querySelector('#ai-password').type"` |
| AI-FORM-08 | Submit button present | "Accept invitation" `AppButton` at bottom. `type="submit"`. | `agent-browser snapshot -i` |

### 5E — Form Validation

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| AI-VAL-01 | Submit with empty name | Browser `required` validation fires on `#ai-name`. Form does not submit. No network request. | Click "Accept invitation" with empty name; `agent-browser network requests --method POST` — should be empty |
| AI-VAL-02 | Submit with empty password | Browser `required` validation fires on `#ai-password`. No POST. | Same check |
| AI-VAL-03 | Submit with password < 8 chars | Browser `minLength` validation fires. No POST. | Fill name, fill "abc" for password, submit; check no POST |

### 5F — Happy Path

Use the `$INV_TOKEN` from pre-flight. This will consume the invitation — create a fresh one if needed.

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| AI-SUCCESS-01 | Submit valid name + password → POST fires | `POST /api/v1/invitations/$INV_TOKEN/accept` called with `{ name, password }`. | `agent-browser network har start` before submit; check requests after |
| AI-SUCCESS-02 | Submit button shows loading during POST | Button shows spinner; name/password inputs are disabled during in-flight request. | Screenshot immediately after click |
| AI-SUCCESS-03 | Success → tokens stored | After POST 200, access and refresh tokens are in storage. | `agent-browser eval "Object.keys(localStorage).filter(k => k.includes('token') || k.includes('medcord'))"` |
| AI-SUCCESS-04 | Success → redirect to hospital dashboard | URL becomes `/h/<hospitalSlug>/dashboard`. Slug comes from POST response `hospitalSlug`. | `agent-browser get url` after navigation |
| AI-SUCCESS-05 | Dashboard redirect replaces history | Press browser back from dashboard → does NOT go back to `/invitations/...`. | `agent-browser eval "history.length"` or navigate back; check URL |

### 5G — POST Error: Account Already Exists

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| AI-EXISTS-01 | Submit with email that already has an account | POST returns error with "already exists" in message. Inline `role="alert"` appears with red background. Button stops loading. | Check `agent-browser eval "document.querySelector('[role=alert]')?.textContent"` |
| AI-EXISTS-02 | "Sign in instead →" link appears | Below the error, a link with text "Sign in instead →" is visible. | `agent-browser snapshot -i` |
| AI-EXISTS-03 | "Sign in instead" link URL is correct | Link href = `/login?next=%2Finvitations%2F$INV_TOKEN`. | `agent-browser eval "document.querySelector('[role=alert] a')?.href"` |

### 5H — POST Error: Generic Failure

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| AI-GENERIC-ERR-01 | Non "already exists" POST error | Inline `role="alert"` shows backend error message. No "Sign in instead" link. | Check alert text; check absence of "Sign in instead" |
| AI-GENERIC-ERR-02 | Network failure → fallback message | Alert shows "Something went wrong." (from catch block). No crash. | Simulate offline or invalid backend URL |
| AI-GENERIC-ERR-03 | Re-submit after error clears error | `setSubmitError(null)` called at top of `handleSubmit`. Error disappears on next attempt. Submit again successfully. | Fix form issue; submit again; confirm error gone before new response |

### 5I — Edge Cases

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| AI-EDGE-01 | `hospital.location` missing in GET response | Hospital card renders without crash. Location line empty or hidden. | Test with a mocked/backend-adjusted response or ask if any hospital has no location |
| AI-EDGE-02 | `invitedBy.name` missing | Subtitle renders without crash: "Invited by  · Expires …" (empty string OK, no crash). | Same approach |
| AI-EDGE-03 | Very long hospital name | Name truncates in the hospital card (`truncate` CSS class). Does not overflow card boundary. | Create hospital with 80-char name; screenshot |
| AI-EDGE-04 | Token with hyphens/underscores (URL-safe) | Token passed verbatim to API — no double encoding. URL bar shows `/invitations/abc-123_XYZ`; GET request uses the same string. | `agent-browser network requests --filter "/invitations/"` — verify token in URL matches |
| AI-EDGE-05 | Direct URL bar navigation | Paste `/invitations/$INV_TOKEN` into address bar from a fresh tab. Screen renders correctly — no crash, no missing context error. | `agent-browser navigate` from logged-out state; verify form renders |

---

## Section 6 — Cross-Cutting Checks

Run these after all functional tests, on the files touched in this session.

| ID | Check | Files | How to verify |
|----|-------|-------|---------------|
| CC-01 | No raw `&&` or ternary conditional rendering in JSX | `accept-invite-screen.tsx`, `invitation-row.tsx`, `staff-directory-screen.tsx` | Read source: search for `{condition &&` or `{condition ?` in JSX return blocks |
| CC-02 | No `.map()` in JSX | Same files | Search for `.map(` inside JSX |
| CC-03 | All body text uses `AppText` | `accept-invite-screen.tsx`, `staff-directory-screen.tsx` | Scan for raw `<p>`, `<span>`, `<h3>` elements in JSX. Note: labels (`<label>`) are acceptable. `<div>` wrappers are acceptable. |
| CC-04 | All interactive buttons use `AppButton` | Same files | Exception: password show/hide toggle in `accept-invite-screen.tsx` uses raw `<button>` — this is **intentional and acceptable**. All other interactive buttons must be `AppButton`. |
| CC-05 | No raw hex colours | `accept-invite-screen.tsx`, `invitation-row.tsx`, `staff-table.tsx` | Search for `#[0-9a-fA-F]{3,6}` in className strings |
| CC-06 | Named exports only | All new files | Grep for `export default` — must be absent |
| CC-07 | All prop interfaces use `readonly` | `InvitationListProps`, `StaffTableProps`, `AuthGuardProps` | Read interface definitions |
| CC-08 | TypeScript passes clean | All touched files | `pnpm nx typecheck medcord-web` — zero errors |

**Known code smells found in source (record but do not block):**
- `staff-table.tsx` uses `var(--text-primary)`, `var(--text-secondary)`, `var(--text-tertiary)` CSS custom properties and raw `font-ui`/`font-mono` Tailwind utilities instead of `AppText` in the member, role, and department columns. Flag as CC-APPTEXT violation.
- `invitation-row.tsx` has `<span>` for the pending invitation count badge — raw HTML, not `AppText`.

---

## Section 7 — API Verification

After happy paths for sections 4 and 5, run these spot-checks.

| Call | Section | Verification |
|------|---------|--------------|
| `GET /api/v1/invitations/:token` | AI | Response shape: `{ data: { invitation: { email, role, department?, expiresAt }, hospital: { name, slug, location, logoKey? }, invitedBy: { name } } }` |
| `POST /api/v1/invitations/:token/accept` | AI | Response shape: `{ data: { hospitalId, hospitalSlug, accessToken, refreshToken } }`. Both tokens non-empty strings. |
| `GET /api/v1/hospitals/:id/staff/invitations` | INV | Only `status === "pending"` invitations returned. No expired/revoked rows. |

---

## Test Execution Order

1. **SD-TBL** (1-8) — Staff table layout and columns
2. **SD-EMPTY** (1-5) — Empty states
3. **BR** (1-4) — Branding crash fix
4. **RS-GUARD** (1-3) — Auth guard redirect (log out first)
5. **RS-EXPIRY** (1-3) — Token expiry redirect
6. **RS-LOGOUT** (1-2) — Manual logout
7. **RS-SEC-01** — Open redirect check
8. **INV-COPY** (1-11) — Copy-link and invitation actions
9. **AI-PUB** (1-2) — Route is public
10. **AI-LOAD** (1-2) — Loading skeleton
11. **AI-ERR** (1-5) — Invalid token errors
12. **AI-FORM** (1-8) — Valid token form
13. **AI-VAL** (1-3) — Validation
14. **AI-SUCCESS** (1-5) — Happy path (consumes invitation)
15. **AI-EXISTS** (1-3) — Already exists error
16. **AI-GENERIC-ERR** (1-3) — Generic POST errors
17. **AI-EDGE** (1-5) — Edge cases
18. **CC** (1-8) — Cross-cutting checks

---

## Screenshot Naming Convention

```
screenshots/staff-session/
  SD-TBL-01-staff-table.png
  SD-TBL-03-status-pill.png
  SD-EMPTY-01-no-staff.png
  SD-EMPTY-02-no-results.png
  BR-02-no-branding-no-crash.png
  RS-GUARD-01-login-next-param.png
  RS-SEC-01-open-redirect.png
  INV-COPY-01-copy-link-buttons.png
  INV-COPY-03-copied-state.png
  AI-LOAD-01-skeleton.png
  AI-ERR-01-invalid-token.png
  AI-FORM-01-valid-form.png
  AI-FORM-07-password-toggle.png
  AI-SUCCESS-04-dashboard-redirect.png
  AI-EXISTS-01-already-exists-error.png
```

---

## Total Test Count

| Section | Count |
|---------|-------|
| SD-TBL (table layout) | 8 |
| SD-EMPTY (empty states) | 5 |
| BR (branding crash) | 4 |
| RS-EXPIRY | 3 |
| RS-GUARD | 3 |
| RS-LOGOUT | 2 |
| RS-SEC | 1 |
| INV-COPY (invitation actions) | 11 |
| AI-PUB | 2 |
| AI-LOAD | 2 |
| AI-ERR | 5 |
| AI-FORM | 9 |
| AI-VAL | 3 |
| AI-SUCCESS | 5 |
| AI-EXISTS | 3 |
| AI-GENERIC-ERR | 3 |
| AI-EDGE | 5 |
| CC | 8 |
| **Total** | **82** |
