# Medcord Frontend — Auth Module Test Plan

> **QA:** Claude
> **Date:** 2026-05-16
> **Module:** 1 — Auth
> **Scope:** Login and Register screens only
> **Environment:** `http://localhost:5173` (frontend) · `http://localhost:8085` (backend)
> **Browser tool:** `agent-browser`
> **Legend:** `[HP]` happy path · `[EG]` edge/boundary · `[NAV]` navigation/routing · `[VIS]` visual/layout · `[SEC]` security/guard

---

## Screens in Scope

| Screen | Route | File |
|---|---|---|
| LoginScreen | `/login` | `features/auth/features/login/screen/login-screen.tsx` |
| RegisterScreen | `/register` | `features/auth/features/register/screen/register-screen.tsx` |
| AuthLayout (shared shell) | — | `features/auth/shared/parts/auth-layout.tsx` |

## Screens Skipped (deferred)

- TwoFaStep
- ForgotPasswordScreen
- ResetPasswordScreen
- Setup2faScreen

---

## Test Personas

| Handle | Email | Password | Notes |
|---|---|---|---|
| alice | `alice@medcord.test` | `password123` | Super admin, Hospital A owner |
| new_user | `newuser@medcord.test` | `Password1!` | Fresh registration (no prior account) |

---

## Pre-test Setup

- [ ] Backend running on port 8085: confirm `GET http://localhost:8085/health` → 200
- [ ] Frontend dev server running on port 5173
- [ ] Seed state intact: `docs/qas/backend/scripts/.state.json` shows alice with valid Hospital A
- [ ] Browser session cleared (no leftover auth tokens in localStorage)

---

## 1. Auth Layout (shared shell)

| ID | Type | Scenario | Steps | Expected |
|----|------|----------|-------|----------|
| AL-VIS-01 | VIS | Layout renders on login and register screens | Navigate to `/login`, then `/register` | Centered card on each screen; consistent logo/branding present |
| AL-VIS-02 | VIS | No app shell on auth screens | Visit `/login` while unauthenticated | No sidebar, no topbar — only the auth layout card |
| AL-NAV-01 | NAV | Auth layout does not flash app shell | Direct navigate to `/login` | No sidebar or topbar renders before or after load |

---

## 2. Login Screen

### 2.1 Happy Path

| ID | Type | Scenario | Steps | Expected |
|----|------|----------|-------|----------|
| L-HP-01 | HP | Successful login redirects to hospital list | Fill email `alice@medcord.test`, password `password123`, submit | Redirected to `/hospitals`; user is authenticated |
| L-HP-02 | HP | Tokens stored after login | Login as alice, inspect localStorage | `accessToken` and `refreshToken` present in storage |
| L-HP-03 | HP | User menu shows logged-in user name | Login as alice, land on `/hospitals` | Alice's display name visible in the UI |
| L-HP-04 | HP | "Forgot password?" link present | Visit `/login` | Link to `/forgot-password` visible and clickable |
| L-HP-05 | HP | Register link present | Visit `/login` | Link to `/register` is present |

### 2.2 Edge / Boundary

| ID | Type | Scenario | Steps | Expected |
|----|------|----------|-------|----------|
| L-EG-01 | EG | Empty email — error shown | Submit form with empty email | Inline error on email field; no API call fired |
| L-EG-02 | EG | Empty password — error shown | Submit with email only, no password | Inline error on password field; no toast |
| L-EG-03 | EG | Invalid email format | Type `notanemail`, submit | Inline error — not a valid email format |
| L-EG-04 | EG | Wrong password | Email `alice@medcord.test`, password `wrongpass` | Inline error from API; no redirect |
| L-EG-05 | EG | Unknown email | Email `ghost@medcord.test`, password `password123` | Inline error; does not reveal whether email exists |
| L-EG-06 | EG | Submit button shows loading state during request | Click submit with valid credentials | Button shows loading; cannot double-submit |
| L-EG-07 | EG | Error clears on next submit attempt | Trigger L-EG-04, fix credentials, resubmit | Previous error gone before/on resubmit |

### 2.3 Navigation / Routing Guards

| ID | Type | Scenario | Steps | Expected |
|----|------|----------|-------|----------|
| L-NAV-01 | NAV | Unauthenticated visit to protected route redirects to login | Visit `/hospitals` while logged out | Redirected to `/login` |
| L-NAV-02 | NAV | Already-logged-in user visiting `/login` redirects away | Login as alice, then navigate to `/login` | Redirected to `/hospitals` |
| L-NAV-03 | NAV | Logout clears session and redirects to login | Login as alice, logout from user menu | Redirected to `/login`; localStorage tokens cleared |

---

## 3. Register Screen

### 3.1 Happy Path

| ID | Type | Scenario | Steps | Expected |
|----|------|----------|-------|----------|
| R-HP-01 | HP | Successful registration | Fill name, email `newuser@medcord.test`, password `Password1!`, submit | Account created; redirected to login or next step (no crash) |
| R-HP-02 | HP | Phone field is optional | Register without filling phone | Registration succeeds |
| R-HP-03 | HP | Link back to login present | Visit `/register` | Link to `/login` visible and functional |

### 3.2 Edge / Boundary

| ID | Type | Scenario | Steps | Expected |
|----|------|----------|-------|----------|
| R-EG-01 | EG | Missing name — error shown | Submit without name | Inline error on name field |
| R-EG-02 | EG | Missing email — error shown | Submit without email | Inline error on email field |
| R-EG-03 | EG | Invalid email format | Type `bademail`, submit | Inline error |
| R-EG-04 | EG | Password too short (< 8 chars) | Password `abc`, submit | Inline error; API not called |
| R-EG-05 | EG | Duplicate email | Register with `alice@medcord.test` | Inline error from API — email already in use; no toast |
| R-EG-06 | EG | Submit button shows loading state | Click register with valid data | Button shows loading; cannot double-submit |
| R-EG-07 | EG | All required fields error on empty submit | Click submit with all fields empty | Errors on all required fields simultaneously |

---

## 4. Cross-cutting Checks

| ID | Type | Scenario | Steps | Expected |
|----|------|----------|-------|----------|
| CC-SEC-01 | SEC | Protected route without auth redirects to login | Navigate to `/h/some-slug/dashboard` while logged out | Redirected to `/login` via `AuthGuard` |
| CC-SEC-02 | SEC | Errors shown inline, never as toasts | Trigger wrong password, duplicate email errors | Error appears as inline text — no toast/notification |
| CC-VIS-01 | VIS | `AppButton` used for all buttons | Inspect login and register screens | No raw `<button>` with inline Tailwind used for primary actions |
| CC-VIS-02 | VIS | `AppText` used for headings and body | Inspect login and register screens | No raw `<h1>`, `<p>` for semantic text |
| CC-NAV-01 | NAV | Login ↔ Register cross-links work | From `/login` click register link; from `/register` click login link | Each navigates to the correct screen |

---

## Out of Scope (this plan)

- TwoFaStep, ForgotPassword, ResetPassword, Setup2FA — deferred
- Social/OAuth login — not in MVP
- Email delivery for password reset — backend only
- Admin app auth — Phase 12

---

## Notes for Execution

1. **Credentials**: All seeded users use `password123`. New registration test uses `newuser@medcord.test` / `Password1!`.
2. **No toasts rule**: Per build plan, errors must appear as inline `<p role="alert">` elements, not toast notifications. Flag any toast on error.
3. **Meemaw compliance** (CC-VIS-01/02): Source inspection may be needed — rendered HTML alone won't reveal raw ternaries/`&&` in JSX.
