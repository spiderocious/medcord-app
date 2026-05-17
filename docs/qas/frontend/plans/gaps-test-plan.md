# Test Plan — Gap Features (Frontend + Backend)

**Prepared:** 2026-05-17  
**Source handoffs:**  
- `docs/qas/frontend/qa-handoff-gaps.md`  
- `docs/qas/backend/reports/qa-handoff-gaps.md`  
**Browser tool:** agent-browser (`/opt/homebrew/bin/agent-browser`)  
**Agent-browser guide:** `/Users/feranmi/codebases/2026/dockito/skill-persona/agent-browser.md`  
**App:** http://localhost:5173 (medcord-web)  
**Backend:** http://localhost:8085  
**Screenshots →** `/Users/feranmi/codebases/2026/medcord-app/screenshots/gaps/`

---

## Pre-flight

```bash
# Confirm backend running
curl http://localhost:8085/api/v1/health

# Login as alice (super_admin)
TOKEN=$(curl -s -X POST http://localhost:8085/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@medcord.test","password":"Medcord123!"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['tokens']['accessToken'])")

HSP_ID="HSP-0fe2c032-7d09-45a0-9259-4e9fc75ddf80"
SLUG="hospital-a"

# Confirm screenshots dir
mkdir -p /Users/feranmi/codebases/2026/medcord-app/screenshots/gaps
```

Role accounts available from earlier sessions:
- `qa-doctor@medcord.test / RolePass123!` — doctor role
- `qa-nurse@medcord.test / RolePass123!` — nurse role
- `qa-lab-tech@medcord.test / RolePass123!` — lab_tech role

If a `nurse_practitioner` or `physician_assistant` account is needed for LSO-02/03, create new invitations via alice's token before starting.

---

## Gap 1 — Password Reset via Super-Admin Code

### 1A — Backend: Generate Reset Code (`POST /api/v1/auth/generate-reset-code`)

**Setup:**
```bash
# Get a target userId (any non-alice user)
TARGET_USER_ID=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8085/api/v1/hospitals/$HSP_ID/staff" \
  | python3 -c "import sys,json; members=json.load(sys.stdin)['data']['members']; \
    m=[m for m in members if m['email']!='alice@medcord.test'][0]; print(m['userId'])")
echo "Target user: $TARGET_USER_ID"
```

| ID | Test | Command / Action | Expected |
|----|------|-----------------|----------|
| GRC-01 | Valid super_admin generates code | `curl -s -X POST http://localhost:8085/api/v1/auth/generate-reset-code -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "{\"userId\":\"$TARGET_USER_ID\"}"` | 200. `data.code` present. |
| GRC-07 | Code is exactly 7 chars, uppercase alphanumeric | Parse `code` from GRC-01 response | `code.length === 7` and matches `/^[A-Z0-9]{7}$/` |
| GRC-02 | Non-super_admin token rejected | Login as `qa-doctor@medcord.test`, use that token to call same endpoint | 403 `forbidden` |
| GRC-03 | No auth header | Call endpoint with no `Authorization` header | 401 `unauthorized` |
| GRC-04 | Nonexistent userId | `"userId":"USR-00000000-0000-0000-0000-000000000000"` | 404 `not_found` |
| GRC-05 | Missing userId field | POST with empty body `{}` | 422 validation error |
| GRC-06 | Second call overwrites first code | Call GRC-01 twice for same user; save both codes. Run VRC-01 on the first code | First code must now be invalid (`valid: false` or 400); second code must be valid |

Store the valid code from GRC-01 as `$RESET_CODE`.

---

### 1B — Backend: Verify Reset Code (`POST /api/v1/auth/verify-reset-code`)

| ID | Test | Command / Action | Expected |
|----|------|-----------------|----------|
| VRC-01 | Valid, unexpired code | `curl -s -X POST http://localhost:8085/api/v1/auth/verify-reset-code -H "Content-Type: application/json" -d "{\"code\":\"$RESET_CODE\"}"` | 200. `data.valid: true` |
| VRC-02 | Nonexistent code | Use `"code":"AAAAAAA"` (seven As, unlikely to be valid) | 200 `{ data: { valid: false } }` OR 400 |
| VRC-03 | Missing code field | POST with empty body `{}` | 422 validation error |
| VRC-04 | Expired code | Manually set `passwordResetCodeExpiresAt` to the past in DB for the target user, then call with that code | 200 `{ data: { valid: false } }` or 400 |

---

### 1C — Backend: Reset Password (`POST /api/v1/auth/reset-password`)

**Setup:** Use `$RESET_CODE` from GRC-01. Store target user's email as `$TARGET_EMAIL`.

| ID | Test | Command / Action | Expected |
|----|------|-----------------|----------|
| RP-01 | Valid code + strong password | `curl -s -X POST http://localhost:8085/api/v1/auth/reset-password -H "Content-Type: application/json" -d "{\"code\":\"$RESET_CODE\",\"password\":\"NewPass123!\"}"` | 200 success |
| RP-06 | Old password no longer works | `curl -s -X POST http://localhost:8085/api/v1/auth/login -d "{\"email\":\"$TARGET_EMAIL\",\"password\":\"RolePass123!\"}"` | 401 — old password rejected |
| RP-01b | New password works | Login with `$TARGET_EMAIL` / `NewPass123!` | 200 with tokens — login succeeds |
| RP-02 | Code already consumed — reuse rejected | Call reset-password again with same `$RESET_CODE` | 400 `bad_request` — code cleared on first use |
| RP-03 | Nonexistent code | `"code":"BBBBBBB"` | 400 `bad_request` |
| RP-04 | Password under 8 chars | `"password":"abc"` with valid code (generate a fresh one) | 422 validation error |
| RP-05 | Missing fields | POST with `{}` or missing `password` | 422 validation error |
| RP-07 | DB cleanup — reset code fields removed | After RP-01, run VRC-01 with same code | Must be invalid (`valid: false` or 400) — confirms `passwordResetCode` was cleared |

---

### 1D — Backend: Staff/Me (`GET /api/v1/hospitals/:hospitalId/staff/me`)

| ID | Test | Command / Action | Expected |
|----|------|-----------------|----------|
| SM-01 | Alice calls /staff/me on her hospital | `curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8085/api/v1/hospitals/$HSP_ID/staff/me"` | 200. `data.userId` matches alice's userId. `data.role` present. |
| SM-02 | User not a member of that hospital | Use alice's token on a different hospital ID she doesn't belong to | 404 `not_found` |
| SM-03 | No auth header | Call with no `Authorization` | 401 |
| SM-04 | Route doesn't match `/staff/:memberId = "me"` | Assert SM-01 returns `role` and `userId`, NOT a not_found for memberId "me" | Confirmed by SM-01 returning 200 with membership data, not 404 |

---

### 1E — Frontend: Forgot Password Screen (`/forgot-password`)

| ID | Test | Action | Expected |
|----|------|--------|----------|
| FP-01 | Screen renders | `agent-browser navigate http://localhost:5173/forgot-password` → `agent-browser snapshot -i` | Title "Forgot your password?". Paragraph explaining to contact super-admin. "I have a code" button. "Back to Sign in" link. |
| FP-02 | "I have a code" navigates to enter-code screen | `agent-browser click` on "I have a code" button | URL becomes `/reset-password` |
| FP-03 | "Back to Sign in" link works | `agent-browser click` on "Back to Sign in" | URL becomes `/login` |
| FP-04 | Screenshot | `agent-browser screenshot screenshots/gaps/FP-01-forgot-password.png` | — |

---

### 1F — Frontend: Enter Reset Code Screen (`/reset-password`)

| ID | Test | Action | Expected |
|----|------|--------|----------|
| ERC-01 | Screen renders | Navigate to `/reset-password` → snapshot | Title "Enter your reset code". Subtitle mentions 7-character code. Input field. "Continue" button. "Back to forgot password" link. |
| ERC-02 | Input auto-uppercases | Type `a3k9pz2` in the code input | Input shows `A3K9PZ2` — `onChange` calls `.toUpperCase()` |
| ERC-03 | Input capped at 7 chars | Type 10 characters | Only first 7 accepted (`maxLength={7}`) |
| ERC-04 | Submit spinner shows | Fill in a code, click "Continue" | Button shows spinner while API call in flight |
| ERC-05 | Invalid code shows inline error | Submit with code `AAAAAAA` (invalid) | `role="alert"` appears: "That code is invalid or has expired. Check with your super-admin." |
| ERC-06 | Valid code navigates to new-password screen | Use `$RESET_CODE` generated via API (GRC-01); fill and submit | URL becomes `/reset-password/new?code=<CODE>` |
| ERC-07 | Screenshot error state | After ERC-05 | `agent-browser screenshot screenshots/gaps/ERC-05-invalid-code.png` |

**Note:** For ERC-06, generate a fresh reset code first via `POST /auth/generate-reset-code` because GRC-01's code may have been consumed in RP-01.

---

### 1G — Frontend: New Password Screen (`/reset-password/new?code=<CODE>`)

| ID | Test | Action | Expected |
|----|------|--------|----------|
| NPW-01 | Screen renders with code | Navigate to `/reset-password/new?code=TESTCODE` → snapshot | Title "Choose a new password". Two password fields with eye toggles. "Reset password" button. |
| NPW-02 | Eye toggle works on new password field | Click eye icon on first field | Input type changes `password` → `text`, icon switches to eye-off |
| NPW-03 | Eye toggle works on confirm field | Click eye icon on confirm field | Same toggle behavior |
| NPW-04 | Password mismatch shows inline error — no API call | Fill `password: "aaaaaaaa"`, `confirm: "bbbbbbbb"`, click submit | Error: "Passwords do not match." No network request fired. |
| NPW-05 | Short password (< 8 chars) shows inline error — no API call | Fill `password: "abc"`, `confirm: "abc"`, click submit | Error: "Password must be at least 8 characters." No network request. |
| NPW-06 | Missing code query param shows error | Navigate to `/reset-password/new` (no `?code=`) → submit valid matching passwords | Error: "Missing reset code. Go back and re-enter it." No API call. |
| NPW-07 | Expired/invalid code shows server error | Use an already-consumed code, submit valid matching passwords | Server returns 400; inline error shows the API error message |
| NPW-08 | Successful reset shows confirmation state | Use a fresh valid code (generate one); submit valid matching passwords | Success state: green check icon, "Password updated" title, "Your password has been reset. Redirecting…" text |
| NPW-09 | Auto-redirect after success | After NPW-08, wait 2 seconds | URL becomes `/login` automatically |
| NPW-10 | Form disabled during submit | Click submit with valid inputs | Button shows loading spinner; both inputs disabled while request in flight |
| NPW-11 | Screenshot success state | After NPW-08 | `agent-browser screenshot screenshots/gaps/NPW-08-success.png` |

---

### 1H — Frontend: Generate Reset Code (Staff Profile — Super-Admin)

**Setup:** Login as alice (super_admin). Navigate to staff profile of a non-alice staff member.

```bash
# Get a staff member ID to view
STAFF_ID=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8085/api/v1/hospitals/$HSP_ID/staff" \
  | python3 -c "import sys,json; m=[m for m in json.load(sys.stdin)['data']['members'] if m['email']!='alice@medcord.test'][0]; print(m['id'])")
echo "Staff ID: $STAFF_ID"
```

| ID | Test | Action | Expected |
|----|------|--------|----------|
| GRC-UI-01 | "Generate reset code" button visible on another user's profile (as super_admin) | Navigate to `/h/$SLUG/staff/$STAFF_ID` as alice → snapshot | "Generate reset code" button visible in the Account section card |
| GRC-UI-02 | Button NOT visible on alice's own profile | Navigate to alice's own staff profile → snapshot | No "Generate reset code" button |
| GRC-UI-03 | Button NOT visible when logged in as non-super_admin | Login as `qa-doctor@medcord.test`; navigate to another staff profile | No "Generate reset code" button |
| GRC-UI-04 | Click generates code and shows modal | As alice, click "Generate reset code" on another user's profile | `POST /api/v1/auth/generate-reset-code` fires. Modal opens titled "Reset code generated" with 7-char code displayed in large monospace font. Copy button present. |
| GRC-UI-05 | Loading state on button click | Click "Generate reset code" | Button shows spinner while POST in flight |
| GRC-UI-06 | Copy button in modal | Click the code text in modal | Code copied to clipboard; CopyToClipboard state changes to "Copied!" briefly (per CopyToClipboard component behavior) |
| GRC-UI-07 | Screenshot modal | After GRC-UI-04 | `agent-browser screenshot screenshots/gaps/GRC-UI-04-reset-modal.png` |

---

## Gap 2 — Lab Result Sign-Off

### 2A — Backend: Advance to `result_released` Role Guard

**Setup:**
```bash
# Get a patient ID and create a lab order, advance to result_ready
PAT_ID=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8085/api/v1/hospitals/$HSP_ID/patients" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['items'][0]['id'])")

# Create order
LAB_ID=$(curl -s -X POST "http://localhost:8085/api/v1/hospitals/$HSP_ID/patients/$PAT_ID/labs" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"testName":"CBC","testCode":"CBC","priority":"routine"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['order']['id'])")
echo "Lab order: $LAB_ID"

# Advance through pipeline to result_ready (4 advances)
for i in 1 2 3 4; do
  curl -s -X POST "http://localhost:8085/api/v1/hospitals/$HSP_ID/patients/$PAT_ID/labs/$LAB_ID/advance" \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{}' \
    | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('order',{}).get('status',''))"
done
# Status sequence: awaiting_sample → sample_received → awaiting_test → in_progress → awaiting_result
# Then record result to get to result_ready:
curl -s -X POST "http://localhost:8085/api/v1/hospitals/$HSP_ID/patients/$PAT_ID/labs/$LAB_ID/result" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"value":"Normal range","unit":"cells/uL","isAbnormal":false}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('order',{}).get('status',''))"
# Should print: result_ready

DR_TOKEN=$(curl -s -X POST http://localhost:8085/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"qa-doctor@medcord.test","password":"RolePass123!"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['tokens']['accessToken'])")

NR_TOKEN=$(curl -s -X POST http://localhost:8085/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"qa-nurse@medcord.test","password":"RolePass123!"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['tokens']['accessToken'])")

LT_TOKEN=$(curl -s -X POST http://localhost:8085/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"qa-lab-tech@medcord.test","password":"RolePass123!"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['tokens']['accessToken'])")
```

For LSO-02 and LSO-03 create new lab orders and advance to `result_ready` separately, then test with nurse_practitioner and physician_assistant tokens if those accounts exist.

| ID | Test | Command / Action | Expected |
|----|------|-----------------|----------|
| LSO-01 | doctor releases result | `curl -s -X POST ".../labs/$LAB_ID/advance" -H "Authorization: Bearer $DR_TOKEN" -d '{}'` | 200. `data.order.status: "result_released"` |
| LSO-02 | nurse_practitioner releases result | Same advance call with nurse_practitioner token on a separate `result_ready` order | 200. Status → `result_released` |
| LSO-03 | physician_assistant releases result | Same with physician_assistant token | 200. Status → `result_released` |
| LSO-04 | hospital_admin cannot release | Use alice's token (super_admin; also try creating a hospital_admin account) on a `result_ready` order | 403. Error message: "Only prescribers can release lab results" (or similar) |
| LSO-05 | nurse cannot release | `$NR_TOKEN` on a `result_ready` order | 403 `forbidden` |
| LSO-06 | lab_tech cannot release | `$LT_TOKEN` on a `result_ready` order | 403 `forbidden` |
| LSO-07 | super_admin cannot release | `$TOKEN` (alice) on a `result_ready` order | 403 `forbidden` |
| LSO-08 | doctor CAN advance to non-release status | `$DR_TOKEN` advancing an `awaiting_sample` order to next status | 200 — role guard only applies to `result_released` |
| LSO-09 | Invalid transition regardless of role | `$DR_TOKEN` advancing a `result_released` order | 400/409 — already in terminal state |

---

### 2B — Frontend: Sign-Off Panel UI

**Setup:** Login as alice in the browser, navigate to a patient's lab order detail screen for an order in `result_ready` status, and separately one in `result_released` status.

```bash
# The doctor-released order from LSO-01 is now result_released — use it for the released UI test
# Create another order and advance to result_ready for the prescriber test
```

| ID | Test | Action | Expected |
|----|------|--------|----------|
| LSO-UI-01 | Sign-off panel NOT visible for orders before result_ready | Navigate to lab order detail for an `awaiting_sample` order → snapshot | No sign-off panel on screen |
| LSO-UI-02 | Sign-off panel visible on result_ready order (prescriber view) | Login as alice (super_admin — NOTE: super_admin is NOT a prescriber, see note below). Login as doctor instead. Navigate to order detail for a `result_ready` order → snapshot | "Sign-off" section visible with "Result is ready." text and "Release to chart" button |
| LSO-UI-03 | Non-prescriber sees read-only message | Login as `qa-nurse@medcord.test`; navigate to same `result_ready` order | Sign-off panel visible with "Awaiting sign-off by an ordering provider." text. No action button. |
| LSO-UI-04 | "Release to chart" fires advance request | As doctor, click "Release to chart" on `result_ready` order | `POST .../advance` fires. Toast "Result released to patient chart." appears. |
| LSO-UI-05 | Button shows loading while request in flight | During LSO-UI-04 | Button shows spinner while pending |
| LSO-UI-06 | Order status updates to released state | After LSO-UI-04 | Order status displayed as `result_released` on screen |
| LSO-UI-07 | result_released panel shows green badge + timestamp | Navigate to a `result_released` order → snapshot | Green "Released" badge visible. Release timestamp shown as locale date string. No action buttons. |
| LSO-UI-08 | Screenshot result_ready (prescriber) | After LSO-UI-02 | `agent-browser screenshot screenshots/gaps/LSO-UI-02-prescriber-panel.png` |
| LSO-UI-09 | Screenshot result_ready (non-prescriber) | After LSO-UI-03 | `agent-browser screenshot screenshots/gaps/LSO-UI-03-nonprescriber-panel.png` |
| LSO-UI-10 | Screenshot result_released | After LSO-UI-07 | `agent-browser screenshot screenshots/gaps/LSO-UI-07-released-panel.png` |

**Note:** `super_admin` is NOT a prescriber role — the prescriber set is `['doctor', 'nurse_practitioner', 'physician_assistant']`. Alice (super_admin) viewing a `result_ready` order will see the read-only "Awaiting sign-off" message, not the release button. Use `qa-doctor@medcord.test` for the prescriber view tests.

---

## Gap 3 — Incoming Transfer Queue

### 3A — Backend: Verify endpoints work

```bash
# Check that GET /transfers/incoming returns the envelope shape
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8085/api/v1/hospitals/$HSP_ID/transfers/incoming" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('items:', len(d.get('data',{}).get('items',d.get('data',[]))), 'error:', d.get('error',{}).get('code','none'))"
```

If no transfers exist in the system, create one via the sending hospital's API or seed data before testing accept/decline.

---

### 3B — Frontend: Transfers Screen (`/h/:slug/patients/transfers`)

| ID | Test | Action | Expected |
|----|------|--------|----------|
| TR-01 | Route accessible from sidebar | Navigate to `/h/$SLUG/patients/transfers` → snapshot | "Incoming Transfers" heading. Subtitle "Patients pending transfer to your hospital". |
| TR-02 | Loading state | Navigate to route (before data loads) | Spinner visible (`animate-spin` element). No content flash. |
| TR-03 | Empty state when no transfers | If queue is empty → snapshot | `IconHeartPulse` icon. Text "No pending transfers." No cards. |
| TR-04 | Transfer card renders with all fields | When at least one transfer exists → snapshot | Card shows: Patient ID (monospace, copyable), From hospital, date, Reason text, Department (if present), Records pills (Vitals, Medications, History, Labs, Documents — green if included, muted if not). Accept + Decline buttons. |
| TR-05 | Copy patient ID | Click the patient ID code on a transfer card | Button changes to "Copied!" then reverts. Clipboard contains the patient ID. |
| TR-06 | Accept transfer | Click "Accept" on a transfer card | `POST .../transfers/:id/accept` fires. No confirmation modal (immediate). Card disappears from list after success. |
| TR-07 | Accept shows loading | During TR-06 | Accept button shows spinner while POST in flight. Decline button disabled. |
| TR-08 | Decline opens destructive confirmation modal | Click "Decline" on a transfer card | `DrawerService.showConfirmationModal` opens. Modal has destructive styling (red/danger). Message: "The requesting hospital will be notified." Cancel + confirm (Decline) buttons visible. |
| TR-09 | Cancel in decline modal — transfer stays | Click "Cancel" in the decline modal | Modal closes. Transfer card still in list. No API call fired. |
| TR-10 | Confirm decline removes transfer | Click "Decline" in modal (confirm) | `POST .../transfers/:id/decline` fires. Card disappears from list. |
| TR-11 | Decline shows loading on confirm | During TR-10 | Decline button shows spinner. Accept button disabled. |
| TR-12 | Error state on fetch failure | Force API to fail (invalid hospital ID or network intercept) | `role="alert"` element with red error message. Not a blank page. |
| TR-13 | Screenshot transfer card | After TR-04 | `agent-browser screenshot screenshots/gaps/TR-04-transfer-card.png` |
| TR-14 | Screenshot decline modal | After TR-08 | `agent-browser screenshot screenshots/gaps/TR-08-decline-modal.png` |
| TR-15 | Screenshot empty state | After queue is cleared | `agent-browser screenshot screenshots/gaps/TR-03-empty-state.png` |

---

## Gap 4 — Role Management Screen

### 4A — Backend: Verify role endpoints exist

```bash
# GET roles
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8085/api/v1/hospitals/$HSP_ID/roles" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('items:', len(d.get('data',{}).get('roles',[])), 'error:', d.get('error',{}).get('code','none'))"

# Create a role
curl -s -X POST "http://localhost:8085/api/v1/hospitals/$HSP_ID/roles" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"QA Test Role","permissions":["view_patients","view_labs"]}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('id:', d.get('data',{}).get('role',{}).get('id',''), 'error:', d.get('error',{}).get('code','none'))"
```

---

### 4B — Frontend: Roles Screen (`/h/:slug/staff/roles`)

**Setup:** Login as alice (super_admin).

| ID | Test | Action | Expected |
|----|------|--------|----------|
| RM-01 | Route accessible | Navigate to `/h/$SLUG/staff/roles` → snapshot | "Roles" heading. "Custom roles for this hospital" subtitle. "New role" button visible (super_admin). |
| RM-02 | Loading state | Navigate before data loads | Spinner (`animate-spin`) visible. No table flash. |
| RM-03 | Empty state when no custom roles | Delete all roles or use a fresh hospital with no custom roles | "No custom roles yet." text centered. No table. |
| RM-04 | Roles table renders | When custom roles exist → snapshot | Table with columns: Name, Permissions (count pill), Created date. Edit button in last column for each row. |
| RM-05 | Permissions pill shows count | Each role row shows pill like "2 permissions" or "1 permission" (singular/plural handled) | Check text of pill for first role |
| RM-06 | Click "New role" shows inline create form | Click "New role" button | "New role" button disappears. Inline form appears with name input, permissions textarea, Save + Cancel buttons. |
| RM-07 | Cancel collapses create form | Click "Cancel" in create form | Form disappears. "New role" button reappears. No API call. |
| RM-08 | Save creates new role | Fill name: "QA Auto Role", permissions: "view_patients\nview_labs", click "Save" | `POST .../roles` fires. Form collapses. New role appears in table. |
| RM-09 | Edit button expands inline edit form | Click "Edit" on an existing role row | Row expands with pre-filled form (name + permissions). Save + Cancel buttons. Rest of table still visible. |
| RM-10 | Cancel collapses edit form | Click "Cancel" in edit form | Row collapses back to normal. No API call. |
| RM-11 | Save updates role | Change name in edit form, click "Save" | `PATCH .../roles/:roleId` fires. Row updates with new name. Form collapses. |
| RM-12 | Error state on fetch failure | Force fetch to fail | `role="alert"` with error message. |
| RM-13 | Non-super_admin sees read-only table | Login as `qa-doctor@medcord.test`; navigate to `/h/$SLUG/staff/roles` | Table renders (read-only). No "New role" button. No "Edit" buttons in rows. |
| RM-14 | Screenshot roles table (manage mode) | After RM-04 | `agent-browser screenshot screenshots/gaps/RM-04-roles-table.png` |
| RM-15 | Screenshot roles table (read-only, doctor) | After RM-13 | `agent-browser screenshot screenshots/gaps/RM-13-roles-readonly.png` |
| RM-16 | Screenshot create form | After RM-06 | `agent-browser screenshot screenshots/gaps/RM-06-create-form.png` |

---

## Gap 5 — Hospital-Wide Audit Log

### 5A — Backend: Verify audit log endpoint

```bash
# GET audit log
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8085/api/v1/hospitals/$HSP_ID/audit-log" \
  | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; \
    print('items:', len(d.get('items',[])), 'total:', d.get('total'), 'page:', d.get('page'), 'totalPages:', d.get('totalPages'))"

# With action filter
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8085/api/v1/hospitals/$HSP_ID/audit-log?action=patient.created" \
  | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print('items:', len(d.get('items',[])))"

# With pagination
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8085/api/v1/hospitals/$HSP_ID/audit-log?page=1&limit=5" \
  | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; \
    print('items:', len(d.get('items',[])), 'totalPages:', d.get('totalPages'))"
```

Confirm response shape: `{ data: { items, total, page, limit, totalPages } }`.

---

### 5B — Frontend: Audit Log Tab in Settings

**Setup:** Login as alice. Navigate to `/h/$SLUG/settings` → click "Audit Log" tab.

| ID | Test | Action | Expected |
|----|------|--------|----------|
| AL-01 | "Audit Log" tab present in settings | Navigate to `/h/$SLUG/settings` → snapshot | Tabs visible: General, Branding, Modules, Domain, Usage, **Audit Log**, Danger Zone (in that order). |
| AL-02 | Audit Log tab renders table | Click "Audit Log" tab → snapshot | Table with columns: Action, Resource, Actor ID, Role, IP, Date. Filter controls above table. |
| AL-03 | Loading spinner | Click tab before data loads | Spinner visible while loading. |
| AL-04 | Audit events populate table | After load → eval body text | At least one row with action label, resource type + truncated ID (format: `type XXXXXXXX…`), truncated actor ID (12 chars + `…`), role, date. |
| AL-05 | Action filter changes results | Select "Patient created" from action dropdown | Table refreshes. All visible rows show "Patient created" action. Page resets to 1. |
| AL-06 | Action filter "All actions" shows everything | Reset dropdown to "All actions" | All event types visible again. |
| AL-07 | Actor ID filter debounces | Type `USR-` in the actor ID input; wait 300ms | Table refreshes with filtered results. Page resets to 1. |
| AL-08 | Actor ID filter clears | Clear the input | Table resets to unfiltered. |
| AL-09 | Both filters together | Select action AND type actor ID | Table shows only rows matching both filters simultaneously. |
| AL-10 | Empty state | Apply filter that returns no results (e.g. actor ID `USR-ZZZZZZZZ`) | "No audit events found." text shown. No table rows. |
| AL-11 | Pagination hidden when 1 page | If totalPages === 1 → snapshot | No Prev/Next buttons rendered. |
| AL-12 | Pagination shows when > 1 page | Use `limit=5` URL or ensure enough events → snapshot | "Prev" and "Next" buttons visible. "Page X of Y" counter between them. |
| AL-13 | Prev disabled on page 1 | On page 1 with pagination visible | "Prev" button is disabled. |
| AL-14 | Next navigates to next page | Click "Next" | `data.page` increments. Table shows next set of events. |
| AL-15 | Prev navigates back | After AL-14, click "Prev" | Returns to page 1. |
| AL-16 | Next disabled on last page | Navigate to last page | "Next" button is disabled. |
| AL-17 | Error state | Force API failure (corrupt token, etc.) | `role="alert"` with red error message. |
| AL-18 | Screenshot audit log tab (with data) | After AL-04 | `agent-browser screenshot screenshots/gaps/AL-02-audit-log.png` |
| AL-19 | Screenshot filter applied | After AL-05 | `agent-browser screenshot screenshots/gaps/AL-05-action-filter.png` |
| AL-20 | Screenshot pagination | After AL-12 | `agent-browser screenshot screenshots/gaps/AL-12-pagination.png` |

---

## Screenshot naming

```
screenshots/gaps/
  FP-01-forgot-password.png
  ERC-05-invalid-code.png
  NPW-08-success.png
  GRC-UI-04-reset-modal.png
  LSO-UI-02-prescriber-panel.png
  LSO-UI-03-nonprescriber-panel.png
  LSO-UI-07-released-panel.png
  TR-04-transfer-card.png
  TR-08-decline-modal.png
  TR-03-empty-state.png
  RM-04-roles-table.png
  RM-06-create-form.png
  RM-13-roles-readonly.png
  AL-02-audit-log.png
  AL-05-action-filter.png
  AL-12-pagination.png
```

---

## Test count

| Gap | Backend | Frontend | Total |
|-----|---------|----------|-------|
| 1 — Password Reset | 18 (GRC×7, VRC×4, RP×7, SM×4) | 22 (FP×4, ERC×7, NPW×11) | 40 |
| 2 — Lab Sign-Off | 9 (LSO×9) | 10 (LSO-UI×10) | 19 |
| 3 — Transfers | — | 15 | 15 |
| 4 — Roles | — | 16 | 16 |
| 5 — Audit Log | — | 20 | 20 |
| **Total** | **27** | **83** | **110** |
