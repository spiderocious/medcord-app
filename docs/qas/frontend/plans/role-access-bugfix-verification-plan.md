# Test Plan — Role Access, Per-Staff Flows & Bug Fix Verification

**Prepared:** 2026-05-17
**Source handoff:** `docs/qas/frontend/plans/staff-invitations-session-handoff.md`
**Browser tool:** agent-browser (`/opt/homebrew/bin/agent-browser`)
**Agent-browser guide:** `/Users/feranmi/codebases/2026/dockito/skill-persona/agent-browser.md`
**App:** http://localhost:5173 (medcord-web)
**Backend:** http://localhost:8085
**Screenshots →** `/Users/feranmi/codebases/2026/medcord-app/screenshots/role-access/`

---

## Context

The app has **no frontend role-based guards**. Every route under `/h/:slug/*` is accessible to
any authenticated member regardless of role. The sidebar nav is identical for all roles — filtered
only by module flags, not by user role. This plan tests:

1. **Previously skipped tests** from the staff-invitations session (SD-EMPTY-01/05, BR-03/04,
   INV-COPY-08, AI-LOAD-01/02, AI-ERR-05, AI-VAL-02/03, AI-GENERIC-ERR-02, AI-EDGE-01/02/03)
2. **Bug fix verification** for BUG-NEW-03, BUG-NEW-04, BUG-NEW-05, BUG-NEW-06
3. **Role access audit** — invite each role, accept invitation as that role, log in, snapshot
   dashboard + sidebar + all module screens, attempt every action, document what works vs what
   the API rejects

---

## Pre-flight

```bash
# Login and get token
TOKEN=$(curl -s -X POST http://localhost:8085/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@medcord.test","password":"Medcord123!"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['tokens']['accessToken'])")

HSP_ID="HSP-0fe2c032-7d09-45a0-9259-4e9fc75ddf80"
SLUG="hospital-a"
```

Roles to test: `doctor`, `nurse`, `lab_tech`, `reception`
(skip super_admin/hospital_admin — alice already covers admin-level)

For each role: create invitation → navigate to invite URL → accept (creates account) → login as
that user → run role-specific tests.

---

## Part A — Previously Skipped Tests

### A1 — SD-EMPTY-01 / SD-EMPTY-05: "No staff yet" empty state

Create a brand-new hospital with alice, navigate to its staff directory (zero members).

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| SD-EMPTY-01 | Staff directory on a hospital with 0 members, no filters | `IconUsers` icon, "No staff yet" heading, "Invite your first team member to get started." body, "Invite staff" `AppButton` visible | Create new hospital via UI; go to `/h/<new-slug>/staff`; `agent-browser eval "document.body.innerText"` |
| SD-EMPTY-05 | "Invite staff" CTA on empty state navigates to invite screen | Click → URL becomes `/h/<new-slug>/staff/invite` | `agent-browser click` on button; `agent-browser get url` |

### A2 — BR-03: Partial branding data

Use the API to PATCH partial branding (only `primaryColor`, no `accentColor`) onto Hospital A,
then open the Branding tab.

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| BR-03 | Branding tab with partial branding (`accentColor` missing) | No crash. `accentColor` field shows its `??` default (`#f5f0e8`). `primaryColor` field shows the patched value. | `curl -X PATCH .../branding`; navigate to Branding tab; read field values |

### A3 — BR-04: Save branding from a null-branding hospital

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| BR-04 | Fill colour pickers + save on a hospital with no prior branding | `PATCH /api/v1/hospitals/:id/branding` fires. Success toast. Reload page → saved values re-appear in the fields. | Fill fields; click "Save changes"; check toast; reload; check field values |

### A4 — INV-COPY-08: Resend confirmation → success toast

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| INV-COPY-08 | Confirm the Resend modal for a pending invitation | `POST .../resend` fires with 200. Toast: "Invitation resent to `<email>`." | Click Resend; confirm modal; `agent-browser network requests --method POST`; check toast text |

### A5 — AI-LOAD-01 / AI-LOAD-02: Invitation loading skeleton

Intercept the fetch to delay it so the skeleton is visible.

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| AI-LOAD-01 | Loading skeleton visible while GET /invitations/:token is in-flight | Title "You've been invited"; animated pulse blocks visible (h-16, h-4, h-4, h-10, h-10) | Intercept fetch via eval before navigating; screenshot immediately |
| AI-LOAD-02 | Skeleton shape: 1 large block + 2 narrow lines + 2 button-height blocks | At minimum 5 `animate-pulse` divs present | `document.querySelectorAll('.animate-pulse').length >= 5` |

### A6 — AI-ERR-05: Empty token in URL

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| AI-ERR-05 | Navigate to `/invitations/` (trailing slash, no token) | `useParams` returns `token = ''`. `enabled: token !== ''` prevents GET. No network request to `/api/v1/invitations//`. Screen shows error state or stays loading without crash. | Navigate; `agent-browser network requests --filter "/invitations//"` → must be empty |

### A7 — AI-VAL-02 / AI-VAL-03: Password field validation

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| AI-VAL-02 | Submit with name filled but empty password | POST fires with empty password; backend returns 400 with password-related error message; inline `role="alert"` appears | Fill name, leave password empty, click submit; check alert |
| AI-VAL-03 | Submit with password under 8 characters | POST fires with short password; backend returns 400; alert appears | Fill name, fill "abc", click submit; check alert |

### A8 — AI-GENERIC-ERR-02: Network failure during POST

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| AI-GENERIC-ERR-02 | Backend unreachable during POST /accept | Catch block runs; fallback "Something went wrong." shown in `role="alert"`. No crash. | Override `fetch` via eval to simulate network failure; submit form; check alert text |

### A9 — AI-EDGE-01/02: Missing hospital.location and invitedBy.name

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| AI-EDGE-01 | `hospital.location` is undefined in GET response | Hospital card renders, location line empty or hidden. No crash or blank page. | Intercept fetch via eval; return mock response with `hospital.location` omitted; check page |
| AI-EDGE-02 | `invitedBy.name` is undefined in GET response | Subtitle renders as "Invited by  · Expires …". No crash. | Same intercept approach; omit `invitedBy.name` |

### A10 — AI-EDGE-03: Very long hospital name

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| AI-EDGE-03 | Hospital name is 80+ characters | Name truncates in hospital card (`truncate` class). Does not overflow card. | Create hospital with 80-char name via API; create invitation; visit accept screen; screenshot |

---

## Part B — Bug Fix Verification

### B1 — BUG-NEW-03: retry:0 now stops retries on 404

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| BUG-03-FIX | Navigate to `/invitations/INVALID-TOKEN` — GET returns 404 | Exactly **1** GET request to `/api/v1/invitations/INVALID-TOKEN`. Error state appears immediately. | `agent-browser navigate`; wait 3s; `agent-browser network requests --method GET --filter "/invitations/"` — count entries for that token |

### B2 — BUG-NEW-04: Open redirect rejected — user lands on /hospitals

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| BUG-04-FIX | Login at `/login?next=https%3A%2F%2Fexample.com` | After login, user lands on `/hospitals` — not stuck on login, no `replaceState` error in page body | Navigate to URL; login; `agent-browser get url` must be `/hospitals`; `document.body.innerText` must NOT contain "replaceState" |

### B3 — BUG-NEW-05: Raw `<p>` replaced with AppText

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| BUG-05-FIX | Submit accept form with empty name → see inline error | Error text rendered inside `AppText` (not raw `<p>`). `role="alert"` div contains an element with DS component classes. | Submit empty form; `document.querySelector('[role=alert] p')` → null (raw p gone); `document.querySelector('[role=alert]')?.innerHTML` shows AppText markup |

### B4 — BUG-NEW-06: Revoke — confirm updated behavior

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| BUG-06-FIX | Revoke a genuinely pending invitation | DELETE fires; if 200 → row disappears from list. If 409 → error toast appears, row stays (API failure surfaced, not silent). | Revoke the `qa-invite-test2@medcord.test` invitation (created fresh); check API status + UI outcome |

---

## Part C — Role Access Audit

### C0 — Setup: Create and onboard one staff per role

For each role (`doctor`, `nurse`, `lab_tech`, `reception`):
1. As alice, create invitation via API
2. Navigate to `/invitations/<token>` as unauthenticated user
3. Fill name + password, accept
4. Credentials stored in plan as: `<role>@medcord.test` / `RolePass123!`

| ID | Test | Expected |
|----|------|----------|
| ROLE-SETUP-01 | Create doctor invitation + accept | Account created, redirected to `/h/hospital-a/dashboard` |
| ROLE-SETUP-02 | Create nurse invitation + accept | Same |
| ROLE-SETUP-03 | Create lab_tech invitation + accept | Same |
| ROLE-SETUP-04 | Create reception invitation + accept | Same |

### C1 — Doctor role

Login as doctor. For each screen: navigate, snapshot, attempt every action available.

| ID | Screen | Test | Expected |
|----|--------|------|----------|
| DR-01 | Dashboard | Render + snapshot | Shows hospital name, stats, module nav cards |
| DR-02 | Sidebar | All nav items visible | Same nav as admin: Dashboard, Staff, Patients, Labs, Assets, Review Queue, Search, Settings |
| DR-03 | Staff directory | Can view staff list | List renders |
| DR-04 | Staff directory | Can click "Invite" | Invite screen loads |
| DR-05 | Staff directory | Can send invitation | POST `/invitations` → success or 403 |
| DR-06 | Patients | Can view patient list | List renders |
| DR-07 | Patients | Can register a patient | Click "New patient" → form → submit → success or 403 |
| DR-08 | EMR | Can open patient chart | Chart overview loads |
| DR-09 | EMR | Can add vitals | POST vitals → success or 403 |
| DR-10 | EMR | Can add medication | POST medications → success or 403 |
| DR-11 | Labs | Can view lab orders | List renders |
| DR-12 | Labs | Can create lab order | POST lab → success or 403 |
| DR-13 | Labs | Can advance lab status | POST `/advance` → success or 403 |
| DR-14 | Review Queue | Can view review items | List renders |
| DR-15 | Review Queue | Can act on item | POST `/act` → success or 403 |
| DR-16 | Assets | Can view assets | List renders |
| DR-17 | Settings | Can open settings | Page loads or 403 |
| DR-18 | Settings | Can save general settings | PATCH hospital → success or 403 |

### C2 — Nurse role

Login as nurse. Same sweep.

| ID | Screen | Test | Expected |
|----|--------|------|----------|
| NR-01 | Dashboard | Render + snapshot | Renders |
| NR-02 | Sidebar | Nav items | All same as admin |
| NR-03 | Patients | Can view | Renders |
| NR-04 | Patients | Can register patient | Success or 403 |
| NR-05 | EMR | Can add vitals | Success or 403 |
| NR-06 | EMR | Can add medication | Success or 403 |
| NR-07 | Labs | Can view orders | Renders |
| NR-08 | Labs | Can create order | Success or 403 |
| NR-09 | Staff | Can send invitation | Success or 403 |
| NR-10 | Settings | Can save | Success or 403 |

### C3 — Lab Tech role

| ID | Screen | Test | Expected |
|----|--------|------|----------|
| LT-01 | Dashboard | Render + snapshot | Renders |
| LT-02 | Labs | Can view orders | Renders |
| LT-03 | Labs | Can advance lab status | Success or 403 |
| LT-04 | Labs | Can record result | Success or 403 |
| LT-05 | Patients | Can view | Renders |
| LT-06 | EMR | Can add vitals | Success or 403 |
| LT-07 | Staff | Can send invitation | Success or 403 |
| LT-08 | Settings | Can save | Success or 403 |

### C4 — Reception role

| ID | Screen | Test | Expected |
|----|--------|------|----------|
| RC-01 | Dashboard | Render + snapshot | Renders |
| RC-02 | Patients | Can view | Renders |
| RC-03 | Patients | Can register patient | Success or 403 |
| RC-04 | Labs | Can view orders | Renders |
| RC-05 | Labs | Can create order | Success or 403 |
| RC-06 | EMR | Can add vitals | Success or 403 |
| RC-07 | Staff | Can send invitation | Success or 403 |
| RC-08 | Settings | Can save | Success or 403 |

### C5 — Cross-role finding: Frontend role enforcement

| ID | Test | Expected |
|----|------|----------|
| RBAC-01 | Any non-admin role visits `/h/:slug/settings` | Route loads without redirect (no frontend guard). Document: settings page accessible to all roles in UI even if API rejects writes. |
| RBAC-02 | Any non-admin role visits `/h/:slug/staff/invite` | Invite screen loads without redirect. Document: invitation form accessible to all roles. |
| RBAC-03 | All roles see identical sidebar | Confirm sidebar nav items are identical for doctor, nurse, lab_tech, reception vs alice. No role-based hiding. |

---

## Screenshot naming

```
screenshots/role-access/
  SD-EMPTY-01-no-staff.png
  BR-03-partial-branding.png
  BR-04-branding-saved.png
  AI-LOAD-01-skeleton.png
  AI-EDGE-03-long-name.png
  BUG-03-FIX-one-request.png
  BUG-04-FIX-hospitals-redirect.png
  BUG-05-FIX-apptext-error.png
  ROLE-SETUP-01-doctor-dashboard.png
  ROLE-SETUP-02-nurse-dashboard.png
  ROLE-SETUP-03-labtech-dashboard.png
  ROLE-SETUP-04-reception-dashboard.png
  DR-02-doctor-sidebar.png
  NR-01-nurse-dashboard.png
  LT-01-labtech-dashboard.png
  RC-01-reception-dashboard.png
  RBAC-01-settings-no-guard.png
  RBAC-02-invite-no-guard.png
  RBAC-03-sidebar-comparison.png
```
