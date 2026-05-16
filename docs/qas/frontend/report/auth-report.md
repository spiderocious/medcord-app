# Medcord Frontend — Auth Module QA Execution Report

> **QA:** Claude
> **Date:** 2026-05-16
> **Module:** 1 — Auth (Login + Register)
> **Environment:** `http://localhost:5176` · Backend `http://localhost:8085`
> **Test plan:** `docs/qas/frontend/plans/auth-test-plan.md`
> **Screenshots:** `screenshots/`

---

## Summary

| Section | Tests | Pass | Fail | Warn |
|---|---|---|---|---|
| Auth Layout | 3 | 3 | 0 | 0 |
| Login — Happy Path | 5 | 4 | 0 | 1 |
| Login — Edge Cases | 7 | 3 | 0 | 4 |
| Login — Navigation/Guards | 3 | 1 | 2 | 0 |
| Register — Happy Path | 3 | 3 | 0 | 0 |
| Register — Edge Cases | 7 | 0 | 4 | 3 |
| Cross-cutting | 5 | 3 | 0 | 2 |
| **Total** | **33** | **17** | **6** | **10** |

**17 / 33 pass. 6 failures. 10 warnings.**

> **Note:** Actual password for seeded users is `Medcord123!` — test plan had `password123`. Updated credential confirmed from `seed.mjs`.

---

## Pre-test Notes

- Backend seed had to be re-run (`node seed.mjs`) — the existing `.state.json` tokens were expired and users did not exist in the DB.
- Medcord-web was running on port **5176**, not 5173 (port 5173 was occupied by Solon, a different project).

---

## Auth Layout

| ID | Result | Notes |
|---|---|---|
| AL-VIS-01 | ✅ PASS | Centered card on both `/login` and `/register`; logo present |
| AL-VIS-02 | ✅ PASS | No sidebar/topbar on any auth screen |
| AL-NAV-01 | ✅ PASS | No app shell flash on direct navigate to `/login` |

---

## Login — Happy Path

| ID | Result | Notes |
|---|---|---|
| L-HP-01 | ✅ PASS | Login with `alice@medcord.test` / `Medcord123!` → redirected to `/hospitals` |
| L-HP-02 | ✅ PASS | `medcord.access_token` and `medcord.refresh_token` present in localStorage |
| L-HP-03 | ⚠️ WARN | Topbar shows `alice@medcord.test` (email), not display name "Alice Mensah". Build plan says user name should be visible — email shown instead |
| L-HP-04 | ✅ PASS | "Forgot password?" link visible on login screen |
| L-HP-05 | ✅ PASS | "Create one" link to `/register` present |

---

## Login — Edge Cases

| ID | Result | Notes |
|---|---|---|
| L-EG-01 | ⚠️ WARN | Empty email submit shows "Something went wrong" — no field-level error on the email field specifically. API call fires (no client-side guard) |
| L-EG-02 | ⚠️ WARN | Empty password shows "Something went wrong" — same generic message, no field-level error on the password field |
| L-EG-03 | ⚠️ WARN | Invalid email format (`notanemail`) fires API call and shows "Something went wrong" — no client-side email format validation before submit |
| L-EG-04 | ⚠️ WARN | Wrong password shows "Something went wrong" — error is inline (no toast ✅) but message is too generic; does not say "Invalid credentials" |
| L-EG-05 | ✅ PASS | Unknown email shows same "Something went wrong" — does not differentiate between unknown email and wrong password (no user enumeration) |
| L-EG-06 | ✅ PASS | Button shows "Loading..." and is disabled during in-flight request |
| L-EG-07 | ✅ PASS | Error clears on next submit attempt; corrected credentials succeed |

---

## Login — Navigation / Guards

| ID | Result | Notes |
|---|---|---|
| L-NAV-01 | ✅ PASS | Unauthenticated visit to `/hospitals` redirects to `/login` via `AuthGuard` |
| L-NAV-02 | ❌ FAIL | Authenticated user navigating to `/login` is NOT redirected — login screen renders for a logged-in user. Should redirect to `/hospitals` |
| L-NAV-03 | ❌ FAIL | After logout: localStorage tokens cleared ✅, but URL stays on `/hospitals` — no redirect to `/login`. Page continues to render hospital data from React Query cache. User sees protected content after signing out |

---

## Register — Happy Path

| ID | Result | Notes |
|---|---|---|
| R-HP-01 | ✅ PASS | `newuser@medcord.test` / `Password1!` registered successfully; redirected to `/hospitals` with empty workspace state |
| R-HP-02 | ✅ PASS | Phone field is optional — registration succeeds without it |
| R-HP-03 | ✅ PASS | "Already have an account? Sign in" link visible and routes to `/login` |

---

## Register — Edge Cases

| ID | Result | Notes |
|---|---|---|
| R-EG-01 | ❌ FAIL | Empty name — no error shown on submit. Form sits silently |
| R-EG-02 | ❌ FAIL | Empty email — no error shown on submit. Form sits silently |
| R-EG-03 | ⚠️ WARN | Invalid email format — no client-side validation; API fires, but no visible error rendered |
| R-EG-04 | ❌ FAIL | Password too short (`abc`) — no error shown. API likely rejected it but no error is rendered on screen |
| R-EG-05 | ❌ FAIL | Duplicate email (`alice@medcord.test`) — API returns 409 but no error is rendered. Form sits silently |
| R-EG-06 | ⚠️ WARN | Loading state not verified separately — button state during register not captured clearly (form also showed no feedback on error cases, making it hard to isolate) |
| R-EG-07 | ⚠️ WARN | Empty form submit shows no errors at all — register form has zero client-side validation feedback |

---

## Cross-cutting Checks

| ID | Result | Notes |
|---|---|---|
| CC-SEC-01 | ✅ PASS | `/h/some-slug/dashboard` while logged out → redirected to `/login` |
| CC-SEC-02 | ✅ PASS | All auth errors appear as inline text; no toast notifications observed |
| CC-VIS-01 | ⚠️ WARN | `Sign in` and `Create account` buttons are raw `<button>` elements with hardcoded Tailwind classes (e.g. `bg-[#1B4332]`). Build plan requires `AppButton` for all buttons. Raw `<button>` with inline CSS color values violates both the component rule and the color token rule |
| CC-VIS-02 | ⚠️ WARN | `<h3>` and `<p>` tags used directly with raw Tailwind. Build plan requires `AppText` for all headings and body text |
| CC-NAV-01 | ✅ PASS | Login ↔ Register cross-links both functional |

---

## Bugs Found

### FE-BUG-01 — Register form shows no validation errors on any invalid input 🔴 HIGH

**Screens:** `RegisterScreen` / `register-form.tsx`

**What fails:** Submitting the register form with empty fields, invalid email, short password, or duplicate email produces no visible feedback. The form sits silently — no field errors, no form-level error banner, nothing. API errors are being swallowed without being rendered.

**Affected cases:** R-EG-01, R-EG-02, R-EG-03, R-EG-04, R-EG-05, R-EG-07

**Expected:** Inline field-level errors per build plan — no toasts, errors shown as `<p role="alert">` under the relevant field or as a form-level banner.

---

### FE-BUG-02 — Logout does not redirect to `/login` 🔴 HIGH

**Screen:** `HospitalListScreen` / `app-shell.tsx` logout handler

**What fails:** Clicking "Sign out" clears localStorage tokens but the router does not navigate to `/login`. The page stays on `/hospitals` and continues rendering hospital data from the React Query cache. A user who signs out still sees their workspace data.

**Expected:** On logout, `navigate('/login')` should be called and the Query cache should be cleared/invalidated.

---

### FE-BUG-03 — Authenticated user can view `/login` screen 🟡 MEDIUM

**Screen:** `LoginScreen` / `auth-guard.tsx` or login route

**What fails:** A logged-in user navigating to `/login` sees the login form — they are not redirected to `/hospitals`. The inverse guard (redirect away if already authed) is missing.

**Expected:** If `accessToken` exists in storage, `/login` and `/register` should redirect to `/hospitals`.

---

## Warnings Summary

| ID | Warning |
|---|---|
| L-HP-03 | Topbar shows email instead of display name |
| L-EG-01/02/03/04 | No client-side validation on login — all errors are "Something went wrong" (generic API error), no field-level messages |
| CC-VIS-01 | `AppButton` not used — raw `<button>` with inline hex color `bg-[#1B4332]` violates build plan and color token rules |
| CC-VIS-02 | `AppText` not used — raw `<h3>`, `<p>` tags with Tailwind classes |

---

## Out of Scope (Deferred)

- TwoFaStep, ForgotPassword, ResetPassword, Setup2FA
