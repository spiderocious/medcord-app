# Test Plan — RBAC Frontend

**Prepared:** 2026-05-17  
**Spec:** `docs/qas/rbac-handoff.md`  
**Backend report:** `docs/qas/backend/reports/rbac-report.md` (167/168 pass; P0 bug BUG-RBAC-01 in invite flow)  
**Environment:** `http://localhost:5173` · Backend `http://localhost:8085`  
**Primary seed user:** `alice@medcord.test` / `Medcord123!` (hospital_admin, Hospital A)  
**Screenshots →** `/Users/feranmi/codebases/2026/medcord-app/docs/qas/frontend/screenshots/rbac/`

---

## Scope

Frontend-only. Three screens under test:

1. **Roles Screen** — `/h/:slug/settings/roles`  
   `apps/medcord-web/src/features/staff/features/roles/screen/roles-screen.tsx`  
   `apps/medcord-web/src/features/staff/features/roles/screen/parts/role-form.tsx`

2. **Invite Form (single)** — `/h/:slug/staff/invite` (top section)  
   `apps/medcord-web/src/features/staff/features/staff-invite/screen/parts/invite-form.tsx`

3. **Bulk CSV Invite** — `/h/:slug/staff/invite` (bottom section)  
   `apps/medcord-web/src/features/staff/features/staff-invite/screen/parts/csv-upload.tsx`

Session revocation, permission enforcement on endpoints, and `GET /staff/me` payload are **backend concerns** — already tested and documented. This plan covers only what happens in the browser.

---

## Pre-flight

1. Confirm backend running: `curl http://localhost:8085/api/v1/health`
2. Confirm frontend running: `curl -s http://localhost:5173 | head -3`
3. Log in as `alice@medcord.test` / `Medcord123!`
4. Fetch Hospital A's ID and slug:
   ```bash
   TOKEN=$(curl -s -X POST http://localhost:8085/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"alice@medcord.test","password":"Medcord123!"}' | \
     python3 -c "import sys,json; print(json.load(sys.stdin)['data']['tokens']['accessToken'])")
   curl -s http://localhost:8085/api/v1/hospitals \
     -H "Authorization: Bearer $TOKEN" | python3 -m json.tool | head -20
   ```
5. Confirm roles are seeded: `GET /hospitals/:hospitalId/roles` — must return 10 system roles with `isSystem: true`.
6. Create a second test user with `reception` role (no `settings.update`) for permission-visibility tests. If one doesn't exist from previous sessions, invite and accept via API.

---

## Phase 1 — Roles Screen

**Route:** `/h/hospital-a/settings/roles`  
**Files:** `roles-screen.tsx`, `role-form.tsx`

### 1.1 Page Load & System Roles Table

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| RS-01 | Navigate to roles page as `hospital_admin` | Page renders — two sections visible: "System roles" and "Custom roles" | `agent-browser eval "document.body.innerText"` contains "System roles" and "Custom roles" |
| RS-02 | System roles table row count | All 10 system roles visible: `super_admin`, `hospital_admin`, `doctor`, `nurse`, `nurse_practitioner`, `physician_assistant`, `lab_tech`, `pharmacist`, `reception`, `tech` | Read body text — all 10 slugs present |
| RS-03 | Loading state renders spinner | `<Loadable>` spinner shows on initial load before data arrives | Screenshot immediately after navigation; look for spinner `animate-spin` div |
| RS-04 | System roles have NO Edit or Delete buttons | No "Edit" or "Delete" button appears anywhere in the system roles table | `agent-browser eval "Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim())"` — no Edit/Delete in system section |
| RS-05 | `super_admin` row shows "All permissions (bypass)" badge | The super_admin row shows the bypass badge, not a permission count | Check body text for "All permissions (bypass)" |
| RS-06 | Other system roles show permission count badge | e.g. doctor row shows "N permissions" | Body text contains "permissions" count for each non-super_admin role |
| RS-07 | "New role" button visible to `hospital_admin` | "New role" button rendered in page header | `agent-browser snapshot -i` lists "New role" button |
| RS-08 | No error state when data loads | No `role="alert"` error element visible | `agent-browser eval "document.querySelector('[role=alert]')"` returns null |

### 1.2 Permission Visibility — User Without `settings.update`

> **Setup:** Log in as a user with `reception` role (no `settings.update`). Navigate to the roles page. If the page is protected and redirects, note it.

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| RS-09 | Reception user can view roles page | Page still loads (read-only) — no redirect or 403 screen | Body text contains "System roles" |
| RS-10 | "New role" button is hidden for reception user | No "New role" button visible | `snapshot -i` — no "New role" button ref |
| RS-11 | No Edit or Delete buttons in custom roles table | Even if custom roles exist, action buttons absent | Body text does not contain "Edit" or "Delete" |

### 1.3 Create Custom Role

> **As `hospital_admin`.**

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| RS-12 | Click "New role" — form appears inline | `RoleForm` renders below custom roles section with "New role" title, name input, permission checkboxes | Body text contains "New role" and "Role name" |
| RS-13 | "New role" button hides while form is open | The header "New role" button disappears when `showCreateForm` is true | `snapshot -i` — "New role" button not listed while form is visible |
| RS-14 | Slug auto-populates from name | Type "Senior Pharmacist" in name field — slug shown in the request payload as `senior_pharmacist` | Check HAR: `POST /roles` body has `slug: "senior_pharmacist"` |
| RS-15 | Saving with blank name shows inline error | Empty name → validation error "Role name is required." appears inline | Body text contains "Role name is required" |
| RS-16 | Toggle at least two permissions and save | `POST /hospitals/:id/roles` called with selected permissions; success toast appears; new role appears in custom roles section without reload | `agent-browser network requests --method POST --filter /roles`; body text includes new role name |
| RS-17 | Success toast after create | "Role created." toast fires | `agent-browser eval "document.body.innerText"` immediately after save — contains "Role created" |
| RS-18 | Query invalidated — new role appears live | Custom roles table updates without page reload | Check custom roles table for new role before reloading |
| RS-19 | Reload persists new role | After `agent-browser reload`, custom role still appears | Body text includes new role name after reload |
| RS-20 | Cancel button closes form without saving | Clicking Cancel dismisses the form; no new role created; "New role" button reappears | Snapshot after Cancel — form gone; "New role" button back |

### 1.4 Edit Custom Role

> Use the role created in RS-16.

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| RS-21 | Click Edit on custom role — inline form opens | Row expands into `RoleForm` in edit mode with existing name pre-filled | Body text contains "Edit role" and pre-filled name |
| RS-22 | Change permission set and save | `PATCH /hospitals/:id/roles/:roleId` called; success toast "Role updated."; table updates live | HAR shows PATCH; toast text visible |
| RS-23 | Reload after edit — permissions persist | After reload, updated permission count matches what was saved | Body text permission count correct |
| RS-24 | Edit form Cancel closes without mutating | Clicking Cancel: form collapses, no PATCH fired | HAR shows no PATCH request; role unchanged |

### 1.5 Delete Custom Role

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| RS-25 | Click Delete on custom role — role disappears | `DELETE /hospitals/:id/roles/:roleId` called; toast "Role deleted."; row removed immediately | Body text does not include deleted role name |
| RS-26 | Toast fires on delete | "Role deleted." toast visible immediately after deletion | Body text contains "Role deleted" |
| RS-27 | Reload — role does not reappear | After reload, deleted role is gone from custom roles | Body text confirms absence |
| RS-28 | Empty state shown after last custom role deleted | When no custom roles remain, empty state message appears: "No custom roles yet…" | Body text contains "No custom roles yet" |

### 1.6 System Role Immutability on the Frontend

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| RS-29 | System roles table never shows Edit/Delete at any render cycle | Even after creating/editing custom roles (which re-renders), no Edit/Delete appear in the system section | Snapshot before and after custom role creation — system section unchanged |
| RS-30 | **Bug probe:** System roles render in read-only table, no action column | The system table has only Name and Permissions columns (no third action column) | Body text or snapshot — system table has no action `<th>` |

---

## Phase 2 — Invite Form (Single Invite)

**Route:** `/h/hospital-a/staff/invite`  
**File:** `invite-form.tsx`

### 2.1 Role Dropdown Population

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| IF-01 | Navigate to invite screen | Page renders with "Invite by email" heading and form | `eval "document.body.innerText"` contains "Invite by email" |
| IF-02 | Role dropdown populated from API, not hardcoded | Role `<select>` contains options for system roles (hospital_admin, doctor, nurse, etc.) | `eval "Array.from(document.querySelectorAll('select option')).map(o => o.value)"` — list matches hospital roles |
| IF-03 | `super_admin` is NOT in the dropdown | No option with value `super_admin` | Option list from IF-02 does not include `super_admin` |
| IF-04 | All 9 non-super_admin system roles appear | dropdown has at least 9 options (hospital_admin, doctor, nurse, nurse_practitioner, physician_assistant, lab_tech, pharmacist, reception, tech) | Option count ≥ 9 |
| IF-05 | Create custom role "Cleaner" on roles screen, return to invite page — "Cleaner" appears in dropdown | Custom roles are included dynamically | After creating role, navigate back to invite page; option list includes `cleaner` |

### 2.2 Send Invitation

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| IF-06 | Submit form with valid email + `doctor` role | `POST /hospitals/:id/invitations` called with `{email, role: "doctor"}`; success banner "Invitation sent to..." appears | HAR POST + body text contains "Invitation sent to" |
| IF-07 | Success banner shows the invited email | Banner text contains the submitted email address | Body text |
| IF-08 | Email field clears after successful invite | After success, email input is empty | `eval "document.querySelector('input[type=email]').value"` === '' |
| IF-09 | Request body contains role slug (not display name) | POST body has `role: "doctor"` not `role: "Doctor"` | HAR request body |
| IF-10 | Send button disabled when email empty | Button disabled before typing email | `eval "document.querySelector('button[type=submit]').disabled"` === true on fresh load |
| IF-11 | Submit with backend error shows inline error | Simulate error (e.g. duplicate email from previous session) → inline `role="alert"` error shows backend message | Body text contains error text; no toast for this error |
| IF-12 | Department + Unit optional fields included in payload when filled | Fill "Cardiology" and "ICU" → POST body contains `department` and `unit` | HAR request body |

### 2.3 `super_admin` Invite Guard (Frontend)

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| IF-13 | `super_admin` never appears as selectable option | No way for user to choose `super_admin` via the dropdown | Option values from IF-02 — `super_admin` absent |

> **Note:** Backend BUG-RBAC-01 means the backend currently accepts `super_admin` via API — but the frontend correctly filters it from the dropdown (source confirmed: `filter(r => r.slug !== ROLES.SUPER_ADMIN)`). Frontend is not the bug vector here; this test confirms frontend defence is in place.

---

## Phase 3 — Bulk CSV Invite

**Route:** `/h/hospital-a/staff/invite` (lower section)  
**File:** `csv-upload.tsx`

### 3.1 Format Hint Text (Dynamic Role List)

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| CSV-01 | "Valid roles" hint text is populated from API | Hint text lists actual role slugs (e.g. `hospital_admin, doctor, nurse, ...`) — not hardcoded | Body text contains hint slugs matching what API returns |
| CSV-02 | `super_admin` absent from hint text | "Valid roles:" text does not include `super_admin` | Body text — no `super_admin` in hint |
| CSV-03 | Custom role slug appears in hint after creation | Create "Cleaner" (`cleaner`) role → reload invite page → hint text includes `cleaner` | Body text after reload |
| CSV-04 | Hint shows "loading…" before data arrives | Before roles API responds, hint shows `loading…` | Screenshot immediately on page load (may be too fast to capture; SKIP if staleTime cache serves immediately) |

### 3.2 CSV Parsing — Validation

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| CSV-05 | Upload valid CSV — all rows marked valid | CSV with valid emails + system role slugs → green "N valid invitations ready to send" banner | Body text contains "valid invitations ready to send" |
| CSV-06 | Unknown role slug → row marked invalid | CSV row with `role=janitor` (not a real role) → amber "invalid rows" section shows error "Unknown role: janitor" | Body text contains "Unknown role: janitor" |
| CSV-07 | Invalid email → row marked invalid | CSV row with `invalid-email` → amber section shows "Invalid email" | Body text contains "Invalid email" |
| CSV-08 | Mixed CSV — valid and invalid rows separated correctly | CSV with one valid row + one invalid row → both "1 invalid row (will be skipped)" and "1 valid invitation ready to send" visible | Body text contains both |
| CSV-09 | Header row skipped during parse | CSV starting with `email,role,department,unit` header row → header not counted as a data row | Row counts correct |
| CSV-10 | `super_admin` role slug in CSV → row marked invalid | CSV with `role=super_admin` → "Unknown role: super_admin" (because super_admin is filtered from `validRoleSlugs`) | Body text confirms invalid |
| CSV-11 | Custom role slug in CSV → row marked valid | CSV with `role=cleaner` (after creating Cleaner role) → row is valid | Body text shows valid count |

### 3.3 Send Bulk Invite

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| CSV-12 | "Send N invitations" button appears only with valid rows | Before upload: no send button. After valid CSV: send button appears | Snapshot before and after upload |
| CSV-13 | Click send — `POST /hospitals/:id/invitations/bulk` called | Bulk endpoint hit with correct payload | HAR `--method POST --filter /bulk` |
| CSV-14 | Payload structure correct | Request body: `{invitations: [{email, role}, ...]}` for each valid row | HAR request body |
| CSV-15 | Success message shows count | After send: "N invitations sent successfully" | Body text contains "sent successfully" |
| CSV-16 | File input resets after success | After successful send, upload area resets to "Click to upload CSV" state | Body text: "Click to upload CSV" visible; row count gone |
| CSV-17 | Backend error on send shows inline error | If bulk API fails, inline `role="alert"` error appears — no toast | Body text contains error |

---

## Phase 4 — Cross-Cutting Code Checks

These are **source-level audits** run from the terminal, not through the browser.

### 4.1 Meemaw Violations

Scan the three files under test:

```bash
# raw && in JSX
grep -n "{.*&&" \
  apps/medcord-web/src/features/staff/features/roles/screen/roles-screen.tsx \
  apps/medcord-web/src/features/staff/features/roles/screen/parts/role-form.tsx \
  apps/medcord-web/src/features/staff/features/staff-invite/screen/parts/invite-form.tsx \
  apps/medcord-web/src/features/staff/features/staff-invite/screen/parts/csv-upload.tsx

# raw .map() in JSX render
grep -n "\.map(" \
  apps/medcord-web/src/features/staff/features/roles/screen/roles-screen.tsx \
  apps/medcord-web/src/features/staff/features/roles/screen/parts/role-form.tsx \
  apps/medcord-web/src/features/staff/features/staff-invite/screen/parts/invite-form.tsx \
  apps/medcord-web/src/features/staff/features/staff-invite/screen/parts/csv-upload.tsx
```

| ID | File | Violation | Severity |
|----|------|-----------|----------|
| CC-01 | (to be filled at runtime) | | |

### 4.2 Color Token Violations

```bash
grep -n "bg-\[#\|text-\[#\|border-\[#" \
  apps/medcord-web/src/features/staff/features/roles/screen/roles-screen.tsx \
  apps/medcord-web/src/features/staff/features/roles/screen/parts/role-form.tsx \
  apps/medcord-web/src/features/staff/features/staff-invite/screen/parts/invite-form.tsx \
  apps/medcord-web/src/features/staff/features/staff-invite/screen/parts/csv-upload.tsx
```

| ID | File | Violation | Severity |
|----|------|-----------|----------|
| CC-10 | (to be filled at runtime) | | |

### 4.3 Icon Import Source

```bash
grep -n "from 'lucide-react'" \
  apps/medcord-web/src/features/staff/features/roles/screen/roles-screen.tsx \
  apps/medcord-web/src/features/staff/features/roles/screen/parts/role-form.tsx \
  apps/medcord-web/src/features/staff/features/staff-invite/screen/parts/invite-form.tsx \
  apps/medcord-web/src/features/staff/features/staff-invite/screen/parts/csv-upload.tsx
```

Expected: empty output. Any hit is a violation (must import from `@icons`).

### 4.4 Missing `onError` on Mutations

```bash
grep -n "useMutation\|mutationFn" \
  apps/medcord-web/src/features/staff/features/staff-invite/api/use-invite-staff.ts \
  apps/medcord-web/src/features/staff/features/roles/api/use-roles.ts | head -20

grep -n "onError" \
  apps/medcord-web/src/features/staff/features/staff-invite/api/use-invite-staff.ts \
  apps/medcord-web/src/features/staff/features/roles/api/use-roles.ts
```

**Pre-identified from source review:**

- `useInviteStaff` in `use-invite-staff.ts` — no `onError` handler. Error is caught in `handleSubmit` via try/catch and shown inline. This is intentional (inline error display pattern).
- `useBulkInviteStaff` in `use-invite-staff.ts` — no `onError` handler. Same pattern — error caught in `handleSend`. Intentional.
- `useCreateRole`, `useUpdateRole`, `useDeleteRole` in `use-roles.ts` — all have `onError` → `DrawerService.toast(...)`. Correct.

Verify at runtime: confirm that single and bulk invite errors DO show inline (not toast) — per design pattern.

### 4.5 `readonly` Props

```bash
grep -n "interface.*Props" \
  apps/medcord-web/src/features/staff/features/roles/screen/roles-screen.tsx \
  apps/medcord-web/src/features/staff/features/roles/screen/parts/role-form.tsx \
  apps/medcord-web/src/features/staff/features/staff-invite/screen/parts/invite-form.tsx \
  apps/medcord-web/src/features/staff/features/staff-invite/screen/parts/csv-upload.tsx
```

All prop interfaces must use `readonly` on every property.

**Pre-identified from source review:**

- `RoleFormProps` in `role-form.tsx` — all props are `readonly`. ✓
- `InviteFormProps` in `invite-form.tsx` — all props are `readonly`. ✓
- `CsvUploadProps` in `csv-upload.tsx` — all props are `readonly`. ✓

### 4.6 Non-null Assertions

```bash
grep -n "!" \
  apps/medcord-web/src/features/staff/features/roles/screen/roles-screen.tsx \
  apps/medcord-web/src/features/staff/features/roles/screen/parts/role-form.tsx
```

**Pre-identified from source review:**

- `roles-screen.tsx` line 111: `permissionDescriptions!` — used inside `<Show when={showCreateForm && permissionDescriptions !== undefined}>`. Safe — the `!` only reached when guard is true.
- `roles-screen.tsx` line 112: `permissionGroups!` — same guard. Safe.
- `roles-screen.tsx` line 176-177: `permissionDescriptions!` and `permissionGroups!` in edit form — inside `<Show when={editingRoleId === role.id && permissionDescriptions !== undefined && permissionGroups !== undefined}>`. Safe.

Document as informational — not bugs.

---

## Phase 5 — Behavioural Edge Cases

| ID | Test | Expected | How to verify |
|----|------|----------|---------------|
| BE-01 | `useRoles` has `staleTime: 60_000` — navigate away and back within 60s | Roles page loads instantly from cache (no spinner on second visit within 60s) | Navigate away, back; no spinner visible |
| BE-02 | After deleting a role, query is invalidated immediately | Deleted role gone from list without reload (cache invalidated by `useDeleteRole.onSuccess`) | Check live list immediately after delete |
| BE-03 | After creating a role, invite form dropdown includes new role | `useRoles` is shared via queryKey `['roles', hospitalId]` — same data drives both screens | After RS-16, navigate to invite screen without reload; new role in dropdown |
| BE-04 | Role form slug generation: "Senior Pharmacist" → `senior_pharmacist` | Spaces → underscores; non-alphanumeric removed | Submit and check HAR POST body `slug` field |
| BE-05 | CSV upload: header row starting with "email" is skipped | `parseCSV` checks `lines[0]?.toLowerCase().startsWith('email')` — if true, slices it | Upload CSV with header; row count = data rows only |

---

## Test Execution Order

1. **Pre-flight** — verify servers, get token, confirm roles seeded
2. **Phase 1** — Roles Screen (start with hospital_admin, then switch to reception user for permission tests)
3. **Phase 2** — Invite Form (verify dropdown after custom role created in Phase 1)
4. **Phase 3** — CSV Bulk Invite
5. **Phase 4** — Cross-cutting code checks (grep commands)
6. **Phase 5** — Edge cases

---

## Seed Data Needed

| Need | Method |
|------|--------|
| Hospital A with 10 system roles | Already seeded by `GET /hospitals/:id` trigger |
| Custom role "Cleaner" (slug: `cleaner`) | Create via UI in RS-16, or via API before test |
| Reception-role user for permission tests | Create via invitation API, or reuse existing session |
| Test CSV files | Create locally before Phase 3 |

**CSV files to prepare:**

`valid-all.csv`
```
email,role,department,unit
csvtest-01@medcord.test,doctor,Cardiology,ICU
```

`invalid-role.csv`
```
email,role
csvtest-bad@medcord.test,janitor
```

`mixed.csv`
```
email,role
csvtest-valid@medcord.test,nurse
csvtest-invalid@medcord.test,janitor
```

`super-admin-attempt.csv`
```
email,role
csvtest-sa@medcord.test,super_admin
```

---

## Screenshots Naming Convention

```
rbac-rs-{ID}-{state}.png         e.g. rbac-rs-01-page-load.png
rbac-if-{ID}-{state}.png         e.g. rbac-if-06-invite-success.png
rbac-csv-{ID}-{state}.png        e.g. rbac-csv-06-invalid-role.png
```

---

## Total Test Count

| Phase | Functional | Bug probes | CC | Total |
|-------|-----------|------------|-----|-------|
| 1 — Roles Screen | 26 | 2 (RS-29, RS-30) | — | 28 |
| 2 — Invite Form | 12 | 1 (IF-13) | — | 13 |
| 3 — CSV Bulk Invite | 13 | 1 (CSV-10) | — | 14 |
| 4 — Cross-cutting | — | — | 6 checks | 6 |
| 5 — Edge cases | 5 | — | — | 5 |
| **Total** | **56** | **4** | **6** | **66** |
