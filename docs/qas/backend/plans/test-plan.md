# Medcord Backend — Full Test Plan

> **QA:** Claude  
> **Date:** 2026-05-15  
> **Scope:** All backend API endpoints — Auth, Hospitals, Staff/Invitations, Patients, EMR, Labs, Assets, Review Queue, Audit Log, Notifications, Global Search  
> **Status:** IN PROGRESS — bugs fixed, execution begun 2026-05-15  
> **Legend:** `[HP]` happy path · `[EG]` edge/boundary · `[SEC]` security · `[RBAC]` role enforcement · `[SM]` state machine · `[BUG]` suspected defect from code review

---

## 0. Pre-test setup

Before any test runs:

- [ ] MongoDB running locally, `MONGODB_URI` points to a clean test database
- [ ] Backend running: `pnpm nx run main-backend:dev` (port 8085)
- [ ] `.env` file present with all required vars (see §0.1)
- [ ] DB clean: all collections dropped between full runs (seed script handles this)
- [ ] Server health confirmed: `GET /health` returns `200 { status: "ok" }`
- [ ] Scripts installed: `node` ≥ 20, `mongoose` available via backend's `node_modules`

### 0.1 Required env vars

```
PORT=8085
MONGODB_URI=mongodb://localhost:27017/medcord_test
JWT_ACCESS_SECRET=<32+ chars>
JWT_REFRESH_SECRET=<32+ chars>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
APP_BASE_URL=http://localhost:8085
WEB_BASE_URL=http://localhost:5173
DATA_LAYER_BASE_URL=http://localhost:9000
```

### 0.2 Test personas (seeded by setup script)

All scripts will use a shared `db.mjs` helper that connects to MongoDB directly for DB-state assertions.

| Handle | Role | Purpose |
|--------|------|---------|
| `alice` | creator → `super_admin` | Hospital A owner |
| `bob` | `hospital_admin` | Hospital A admin |
| `carol` | `doctor` | Clinical staff |
| `dave` | `nurse` | Nurse, also tests CLINICAL_ROLES |
| `eve` | `reception` | Non-clinical, tests RBAC boundaries |
| `frank` | `lab_tech` | Lab-specific tests |
| `grace` | no membership | Tests cross-hospital isolation |

### 0.3 Script file structure

```
docs/qas/scripts/
  db.mjs          — MongoDB connection helper
  restore-seed.mjs — idempotent restore: creates/skips users, hospitals, members, patients
  api.mjs         — shared fetch wrapper (logs req/res)
  auth.test.mjs
  hospitals.test.mjs
  staff.test.mjs
  patients.test.mjs
  emr.test.mjs
  labs.test.mjs
  assets.test.mjs
  review.test.mjs
  audit.test.mjs
  notifications.test.mjs
  search.test.mjs
  rbac-matrix.test.mjs
  edge-cases.test.mjs
```

---

## 1. Auth

### 1.1 Registration & Login

| ID | Type | Scenario | Input | Expected |
|----|------|----------|-------|----------|
| A-HP-01 | HP | Register new user | valid email, password ≥8, name | 201, `data.user` has `id/email/name`, `data.tokens` has `accessToken/refreshToken` |
| A-HP-02 | HP | Login with correct credentials | valid email+password | 200, tokens |
| A-HP-03 | HP | GET /auth/me with valid token | Bearer token | 200, `data.user` matches registered user |
| A-HP-04 | HP | PATCH /auth/me — update name | `{ name: "New Name" }` | 200, user returned with updated name |
| A-HP-05 | HP | PATCH /auth/me/password — correct current password | valid currentPassword + newPassword≥8 | 204 |
| A-HP-06 | HP | Login fails with old password after change | old password | 401 `invalid_credentials` |
| A-HP-07 | HP | Login succeeds with new password after change | new password | 200 |
| A-EG-01 | EG | Register duplicate email | same email twice | 409 `conflict` |
| A-EG-02 | EG | Register with email that has uppercase | `ALICE@TEST.COM` | 201, stored as lowercase (Mongoose `lowercase: true`) |
| A-EG-03 | EG | Login uppercase email (different case than stored) | `ALICE@test.com` | 200 — email field has `lowercase` transform in Zod schema |
| A-EG-04 | EG | Register password exactly 7 chars | `"abcdefg"` | 400 `validation_error` |
| A-EG-05 | EG | Register password exactly 8 chars | `"abcdefgh"` | 201 |
| A-EG-06 | EG | Login wrong password | correct email, wrong pass | 401 `invalid_credentials` |
| A-EG-07 | EG | Login unknown email | `nobody@x.com` | 401 `invalid_credentials` — must be same code as wrong password (no enumeration) |
| A-EG-08 | EG | Register missing `name` | no name field | 400 `validation_error`, `field_errors.name` |
| A-EG-09 | EG | Register missing `email` | no email field | 400, `field_errors.email` |
| A-EG-10 | EG | Register invalid email format | `"notanemail"` | 400, `field_errors.email` |
| A-EG-11 | EG | PATCH /auth/me/password — wrong current password | wrong current | 401 `invalid_credentials` |
| A-EG-12 | EG | PATCH /auth/me/password — new password 7 chars | `"abcdefg"` | 400 `validation_error` |
| A-SEC-01 | SEC | No Authorization header on protected route | omit header | 401 `unauthorized`, message "Missing bearer token" |
| A-SEC-02 | SEC | Expired access token | tamper `exp` claim | 401 `unauthorized`, message "Invalid or expired token" |
| A-SEC-03 | SEC | Tampered JWT signature | flip one char in signature | 401 |
| A-SEC-04 | SEC | `alg: none` JWT attack | send JWT with no signature | 401 |
| A-SEC-05 | SEC | Token signed with wrong secret | sign with different key | 401 |
| A-SEC-06 | SEC | `Authorization: Bearer ` (empty token after space) | | 401 |
| A-SEC-07 | SEC | `Authorization: Basic user:pass` | | 401 |

### 1.2 Token Refresh & Logout

| ID | Type | Scenario | Expected |
|----|------|----------|----------|
| A-HP-10 | HP | Refresh with valid refreshToken | 200, new `accessToken` + new `refreshToken` |
| A-HP-11 | HP | Old refreshToken no longer works after refresh | 401 — tokenVersion bumped on logout, same principle applies when logout is used |
| A-HP-12 | HP | Logout | 204 |
| A-HP-13 | HP | Refresh after logout fails | 401 `unauthorized` "Token has been revoked" — `tokenVersion` was bumped by `bumpTokenVersion` |
| A-EG-20 | EG | Refresh with garbage token | 401 |
| A-EG-21 | EG | Refresh with expired JWT (if refresh TTL is small) | 401 |
| A-EG-22 | EG | Refresh missing `refreshToken` field | 400 `validation_error` |
| A-EG-23 | EG | Logout without body | 400 `validation_error` |
| A-BUG-01 | BUG | **Access token still works after logout** (stateless JWT) | Protected route returns 200 — expected behavior, document as known v1 gap. Token has been issued; it remains valid until its `exp`. No server-side revocation. |

### 1.3 Two-Factor Authentication

| ID | Type | Scenario | Expected |
|----|------|----------|----------|
| A-HP-20 | HP | POST /auth/setup-2fa | 200, `data.secret` non-empty, `data.otpauthUrl` starts with `otpauth://` |
| A-HP-21 | HP | POST /auth/verify-2fa with valid TOTP code | 204, `twoFactorEnabled` now true in DB |
| A-HP-22 | HP | Login with 2FA enabled, provide valid `totpCode` | 200, tokens |
| A-EG-30 | EG | Login with 2FA enabled, no `totpCode` | 401 `unauthorized`, message "Two-factor code required" |
| A-EG-31 | EG | Login with 2FA enabled, wrong `totpCode` | 401 `unauthorized`, message "Invalid two-factor code" |
| A-EG-32 | EG | POST /auth/verify-2fa with wrong code | 401 |
| A-EG-33 | EG | `totpCode` not exactly 6 chars in login body | 400 `validation_error` (Zod: `z.string().length(6)`) |
| A-BUG-02 | BUG | **setup-2fa does not persist secret** — `setup2fa()` generates secret in-memory and returns it, but does NOT save it to DB. The secret is only persisted when `verify-2fa` is called with `body.secret`. This means two concurrent `setup-2fa` calls each return different secrets; the one whose secret is used in `verify-2fa` wins. This is intentional by design — but means a TOTP app must scan immediately. Verify: DB `twoFactorSecret` is null after `setup-2fa` alone, set after `verify-2fa`. |

---

## 2. Hospitals

### 2.1 CRUD & Settings

| ID | Type | Scenario | Expected |
|----|------|----------|----------|
| H-HP-01 | HP | Create hospital | 201, `data.hospital` returned, caller is `super_admin` member (verify in DB) |
| H-HP-02 | HP | GET /hospitals lists caller's memberships only | 200, only hospitals caller belongs to |
| H-HP-03 | HP | GET /hospitals/:id as member | 200, full hospital object |
| H-HP-04 | HP | PATCH /hospitals/:id as super_admin | 200, updated hospital |
| H-HP-05 | HP | PATCH /hospitals/:id as hospital_admin | 200 |
| H-HP-06 | HP | PATCH /hospitals/:id/branding as super_admin | 200 |
| H-HP-07 | HP | PATCH /hospitals/:id/modules as super_admin | 200, modules updated |
| H-HP-08 | HP | GET /hospitals/:id/domain | 200, `subdomain`, `subdomainUrl`, `customDomainVerified` |
| H-HP-09 | HP | GET /hospitals/:id/usage as super_admin | 200, `data.members` is a number |
| H-HP-10 | HP | Transfer ownership to existing member | 200, new owner has `super_admin` role in DB |
| H-HP-11 | HP | DELETE /hospitals/:id (archive) as owner | 204 |
| H-EG-01 | EG | Create hospital with duplicate subdomain | 409 `conflict` |
| H-EG-02 | EG | GET /hospitals/:id as non-member | 403 `forbidden` |
| H-EG-03 | EG | PATCH /hospitals/:id/branding as hospital_admin (not super_admin) | 403 `forbidden` |
| H-EG-04 | EG | PATCH /hospitals/:id/modules as hospital_admin | 403 `forbidden` |
| H-EG-05 | EG | Transfer ownership — newOwnerId is not a hospital member | 404 |
| H-EG-06 | EG | Transfer ownership as non-owner (hospital_admin) | 403 |
| H-EG-07 | EG | Archive hospital as non-owner | 403 |
| H-EG-08 | EG | POST /hospitals missing required `name` | 400 `validation_error` |
| H-EG-09 | EG | POST /hospitals missing `subdomain` | 400 `validation_error` |
| H-EG-10 | EG | POST /hospitals missing `timezone` | 400 `validation_error` |
| H-BUG-01 | BUG | **GET /hospitals lists archived hospitals** — `listMine()` does `listByUserId(userId)` then fetches each hospital including archived ones. No `isArchived: false` filter. Archived hospitals may still appear in the list. Verify: create, archive, then list — archived hospital should not appear (or should be clearly marked). |
| H-BUG-02 | BUG | **Transfer ownership does not demote previous owner** — `transferOwnership()` sets `ownerId` and elevates the new owner to `super_admin`, but does NOT change the previous owner's role. Original `super_admin` remains `super_admin`. Verify: after transfer, original owner still has `super_admin` role in `HospitalMemberModel`. |

---

## 3. Staff & Invitations

### 3.1 Invitations

| ID | Type | Scenario | Expected |
|----|------|----------|----------|
| S-HP-01 | HP | Invite staff by email (as super_admin) | 201, invitation returned, `status=pending` |
| S-HP-02 | HP | List pending invitations | 200, includes created invitation |
| S-HP-03 | HP | Resend invitation (resets TTL) | 200, new token generated |
| S-HP-04 | HP | Accept invitation with valid token (authenticated user) | 200, `data.hospitalId` returned, user is now a member in DB |
| S-HP-05 | HP | Decline invitation | 200, `status=declined` |
| S-HP-06 | HP | Revoke pending invitation | 204 |
| S-HP-07 | HP | Bulk invite 3 emails | 201, 3 invitations in response |
| S-EG-01 | EG | Invite same email twice (pending exists) | 409 `conflict` |
| S-EG-02 | EG | Revoke a non-pending invitation (already accepted) | 409 `conflict` |
| S-EG-03 | EG | Resend a non-pending invitation | 409 `conflict` |
| S-EG-04 | EG | Accept invitation with invalid token | 404 `not_found` |
| S-EG-05 | EG | Accept already-accepted invitation (status=accepted) | 409 `conflict` "Invitation is no longer valid" |
| S-EG-06 | EG | Accept expired invitation (TTL past) | 409 `conflict` "Invitation has expired" |
| S-EG-07 | EG | Accept when already a member of the hospital | 409 `conflict` "Already a member of this hospital" |
| S-EG-08 | EG | Decline already-declined invitation | 409 `conflict` |
| S-RBAC-01 | RBAC | Invite staff as `doctor` (non-admin) | 403 `forbidden` |
| S-RBAC-02 | RBAC | List invitations as `nurse` | 403 `forbidden` |
| S-BUG-01 | BUG | **`invitedBy` is stored as userId, not name** — `staffService.invite()` receives `invitedBy = req.user!.id` and passes it directly to `emailService.sendStaffInvitation({ inviterName: invitedBy })`. The email will say "invited by usr_01JV..." instead of a human name. Also `resendInvitation` uses `inv.invitedBy` (the stored userId) as `inviterName`. Verify: inspect invitation email content / check stored `invitedBy` field. |
| S-BUG-02 | BUG | **Expired invitation can still be declined** — `declineInvitation()` does not check `expiresAt`. An expired invitation can be declined. This may or may not be intended. Verify and flag. |

### 3.2 Staff Management

| ID | Type | Scenario | Expected |
|----|------|----------|----------|
| S-HP-10 | HP | GET /staff (list all members, paginated) | 200, paginated `items` |
| S-HP-11 | HP | Filter staff by role | 200, only matching roles |
| S-HP-12 | HP | Filter staff by status | 200, only matching status |
| S-HP-13 | HP | GET /staff/:memberId | 200, single member |
| S-HP-14 | HP | PATCH /staff/:memberId (update role/department) | 200, updated member |
| S-HP-15 | HP | Suspend a staff member | 204 |
| S-HP-16 | HP | Suspended member gets 403 on any hospital-scoped request | 403 `forbidden` — `hospitalScope` only finds `status: 'active'` |
| S-HP-17 | HP | Activate a suspended member | 204 |
| S-HP-18 | HP | Re-activated member can access resources | 200 |
| S-HP-19 | HP | Remove a staff member | 204 |
| S-HP-20 | HP | GET /hospitals/:id/org-chart | 200, array of `{id, userId, role, department, managerId}` |
| S-HP-21 | HP | GET /hospitals/:id/share | 200, `workspaceUrl` + `inviteUrl` |
| S-HP-22 | HP | GET /hospitals/:id/roles | 200, array |
| S-HP-23 | HP | POST /hospitals/:id/roles as super_admin | 201, custom role created |
| S-HP-24 | HP | PATCH /hospitals/:id/roles/:roleId as super_admin | 200, role updated |
| S-EG-10 | EG | Suspend yourself | 403 `forbidden` "Cannot suspend yourself" |
| S-EG-11 | EG | Remove yourself | 403 `forbidden` "Cannot remove yourself" |
| S-EG-12 | EG | GET /staff/:memberId from different hospital | 404 |
| S-RBAC-10 | RBAC | Suspend member as `doctor` | 403 |
| S-RBAC-11 | RBAC | Remove member as `nurse` | 403 |
| S-RBAC-12 | RBAC | Create role as `hospital_admin` | 403 — only `super_admin` |

---

## 4. Patients

### 4.1 Registration & Search

| ID | Type | Scenario | Expected |
|----|------|----------|----------|
| P-HP-01 | HP | Register new patient | 201, `data.patient` with `patientCode`, `data.possibleDuplicates` (empty array) |
| P-HP-02 | HP | Register patient — patientCode is globally unique | Create same-named patient at Hospital B — different patientCode |
| P-HP-03 | HP | GET /patients (list, paginated) | 200, paginated |
| P-HP-04 | HP | Search patients by firstName fragment | 200, filtered list |
| P-HP-05 | HP | Search patients by patientCode | 200, match |
| P-HP-06 | HP | GET /patients/recent | 200, ≤10 entries for this user |
| P-HP-07 | HP | GET /patients/:patientId | 200, patient object |
| P-HP-08 | HP | PATCH /patients/:patientId | 200, updated patient |
| P-EG-01 | EG | Register patient with same firstName+lastName+DOB as existing | 201, `possibleDuplicates` is non-empty |
| P-EG-02 | EG | GET /patients/:patientId from different hospital | 404 — `findHospitalPatient` checks hospital linkage |
| P-EG-03 | EG | Register missing required `demographics.firstName` | 400 `validation_error` |
| P-EG-04 | EG | Register missing required `demographics.dateOfBirth` | 400 `validation_error` |
| P-BUG-01 | BUG | **Search pagination `total` is wrong when `q` is used** — `search()` fetches `countInHospital(hospitalId)` for `total` (all patients), but then filters the fetched page in-memory by `q`. The returned `total` and `totalPages` reflect the unfiltered count, not the count matching `q`. A search for "John" with 100 patients (5 Johns) will report `total: 100`, `totalPages: 10` when the true answer is `total: 5`, `totalPages: 1`. Verify: register 3 patients, search with `q` that matches 1 — check that `total` matches reality. |
| P-BUG-02 | BUG | **Search query `q` uses pagination on unfiltered set** — the skip/limit is applied to the full hospital patient list before in-memory filtering. On large hospitals, patients matching `q` on page 2+ of the hospital may never appear in results. This is a compound of P-BUG-01. Flag as architectural issue. |

### 4.2 ID Card

| ID | Type | Scenario | Expected |
|----|------|----------|----------|
| P-HP-10 | HP | GET /patients/:id/id-card (before issuance) | 200, `idCard.isActive = false` |
| P-HP-11 | HP | POST /patients/:id/id-card (issue) | 200, `idCard.isActive = true`, `idCard.issuedAt` set |
| P-HP-12 | HP | POST /patients/:id/id-card again (re-issue active card) | 200, `idCard.reissuedAt` set, `issuedAt` unchanged |
| P-HP-13 | HP | DELETE /patients/:id/id-card (deactivate) | 204 |
| P-HP-14 | HP | GET /patients/:id/id-card after deactivation | 200, `idCard.isActive = false` |

### 4.3 Check-In / Admit / Discharge / Transfer

| ID | Type | Scenario | Expected |
|----|------|----------|----------|
| P-HP-20 | HP | Check in patient | 200, `currentHospitalId` updated |
| P-HP-21 | HP | Check out patient | 200, `admissionStatus = 'outpatient'` |
| P-HP-22 | HP | Admit patient | 200, `admissionStatus = 'admitted'` |
| P-HP-23 | HP | Discharge patient | 200, `admissionStatus = 'discharged'` |
| P-HP-24 | HP | Request transfer to valid hospital | 201, transfer object `status = 'pending'` |
| P-HP-25 | HP | GET /transfers/incoming at receiving hospital | 200, transfer visible |
| P-HP-26 | HP | Accept transfer at receiving hospital | 200, `status = 'accepted'`, patient linked to new hospital in DB |
| P-HP-27 | HP | Decline transfer | 200, `status = 'declined'` |
| P-EG-20 | EG | Request transfer to non-existent hospital | 404 |
| P-EG-21 | EG | Accept already-accepted transfer | 409 `conflict` "Transfer is no longer pending" |
| P-EG-22 | EG | Decline already-accepted transfer | 409 |
| P-BUG-03 | BUG | **Accept transfer links patient with empty patientCode** — `acceptTransfer()` calls `patientRepo.linkToHospital(hospitalId, transfer.patientId, '', userId)` — the patientCode is hardcoded as empty string `''`. The patient already has a patientCode from registration but this link record will have `patientCode: ''`. Verify: after accepting transfer, inspect `HospitalPatientModel` for the receiving hospital — `patientCode` field should be the patient's actual code, not empty. |
| P-BUG-04 | BUG | **checkIn() does not record visit details** — `checkIn()` ignores the `CheckInBody` (visitType, referredBy, chiefComplaint). It only updates `currentHospitalId`. The visit context is silently dropped. Verify with `_body` parameter in service — it's named `_body` confirming it's unused. |

### 4.4 Favorites

| ID | Type | Scenario | Expected |
|----|------|----------|----------|
| P-HP-30 | HP | Add patient to favorites | 204 |
| P-HP-31 | HP | Remove patient from favorites | 204 |
| P-EG-30 | EG | Add favorite for patient not in hospital | 404 — service checks hospital link |
| P-EG-31 | EG | Remove favorite that doesn't exist | should not error (idempotent) — verify response |

---

## 5. EMR (Electronic Medical Records)

### 5.1 Chart Summary & Vitals

| ID | Type | Scenario | Expected |
|----|------|----------|----------|
| E-HP-01 | HP | GET .../chart | 200, summary with `lastVitals`, `activeMedicationsCount`, `diagnosesCount`, `recentProcedures` |
| E-HP-02 | HP | POST .../chart/vitals — all fields | 201, vitals object returned |
| E-HP-03 | HP | POST .../chart/vitals — weight+height → BMI auto-calculated | 201, `bmi` field set (verify formula: kg / m²) |
| E-HP-04 | HP | POST .../chart/vitals — out-of-range BP (systolic > 140) | 201, `isOutOfRange = true`, `outOfRangeFields` includes `'bp_systolic'` |
| E-HP-05 | HP | GET .../chart/vitals | 200, array newest-first |
| E-HP-06 | HP | GET .../chart/vitals?limit=2 | 200, ≤2 entries |
| E-EG-01 | EG | Access EMR for patient not linked to this hospital | 404 |

### 5.2 Medications

| ID | Type | Scenario | Expected |
|----|------|----------|----------|
| E-HP-10 | HP | GET .../chart/medications | 200, array |
| E-HP-11 | HP | POST .../chart/medications as doctor | 201, medication with `status = 'active'` |
| E-HP-12 | HP | POST .../chart/medications as nurse_practitioner | 201 |
| E-HP-13 | HP | PATCH .../chart/medications/:medId — discontinue | 200, `status = 'discontinued'`, `discontinuedBy` set, `discontinuedAt` set |
| E-HP-14 | HP | PATCH .../chart/medications/:medId — on_hold | 200, `status = 'on_hold'` |
| E-RBAC-01 | RBAC | POST medications as nurse (not PRESCRIBER_ROLE) | 403 `forbidden` |
| E-RBAC-02 | RBAC | POST medications as reception | 403 |
| E-RBAC-03 | RBAC | POST medications as lab_tech | 403 |
| E-EG-10 | EG | PATCH medication from different hospital | 404 |

### 5.3 Medical History

| ID | Type | Scenario | Expected |
|----|------|----------|----------|
| E-HP-20 | HP | GET .../chart/history (empty) | 200, `data.history` may be null |
| E-HP-21 | HP | PATCH .../chart/history as doctor | 200, history upserted |
| E-HP-22 | HP | PATCH .../chart/history as nurse | 200 — nurse is in CLINICAL_ROLES |
| E-HP-23 | HP | PATCH .../chart/history — append diagnoses | 200, `diagnoses` array updated |
| E-RBAC-10 | RBAC | PATCH history as reception | 403 — reception not in CLINICAL_ROLES |
| E-RBAC-11 | RBAC | PATCH history as lab_tech | 403 |
| E-RBAC-12 | RBAC | PATCH history as hospital_admin | 403 — hospital_admin is not in CLINICAL_ROLES |

### 5.4 Procedures & Immunizations

| ID | Type | Scenario | Expected |
|----|------|----------|----------|
| E-HP-30 | HP | POST .../chart/procedures as doctor | 201, procedure created |
| E-HP-31 | HP | GET .../chart/procedures | 200 |
| E-HP-32 | HP | POST .../chart/immunizations as nurse | 201, immunization created |
| E-HP-33 | HP | GET .../chart/immunizations | 200 |
| E-RBAC-20 | RBAC | POST procedures as reception | 403 |
| E-RBAC-21 | RBAC | POST immunizations as lab_tech | 403 |

### 5.5 Documents

| ID | Type | Scenario | Expected |
|----|------|----------|----------|
| E-HP-40 | HP | POST .../chart/documents (any member) | 201, document created |
| E-HP-41 | HP | GET .../chart/documents | 200 |
| E-HP-42 | HP | PATCH .../chart/documents/:docId | 200 |
| E-EG-40 | EG | PATCH document from different hospital | 404 |

### 5.6 Access Log & Break Glass

| ID | Type | Scenario | Expected |
|----|------|----------|----------|
| E-HP-50 | HP | GET .../chart/access-log as super_admin | 200, paginated log entries |
| E-HP-51 | HP | GET .../chart/access-log as hospital_admin | 200 |
| E-HP-52 | HP | POST .../chart/break-glass with reason | 204, access log entry created with `isBreakGlass = true`, `ip` and `userAgent` recorded |
| E-HP-53 | HP | Verify break-glass log entry visible in access-log | 200, entry with `action = 'break_glass'` |
| E-RBAC-30 | RBAC | GET access-log as doctor | 403 `forbidden` |
| E-RBAC-31 | RBAC | GET access-log as nurse | 403 |
| E-EG-50 | EG | POST break-glass missing `reason` | 400 `validation_error` |

---

## 6. Lab Orders — State Machine

### 6.1 Happy Path (Full Pipeline)

| ID | Type | Scenario | Expected |
|----|------|----------|----------|
| L-HP-01 | HP | Create lab order | 201, `status = 'awaiting_sample'`, `stateHistory` is empty |
| L-HP-02 | HP | Advance: `awaiting_sample → sample_received` | 200, `status = 'sample_received'`, history entry appended |
| L-HP-03 | HP | Advance: `sample_received → awaiting_test` | 200 |
| L-HP-04 | HP | Advance: `awaiting_test → in_progress` | 200 |
| L-HP-05 | HP | Advance: `in_progress → awaiting_result` | 200 |
| L-HP-06 | HP | Record result at `awaiting_result` | 200, `status = 'result_ready'`, `result.value` set |
| L-HP-07 | HP | Advance: `result_ready → result_released` | 200, `resultReleasedAt` and `resultReleasedBy` set |
| L-HP-08 | HP | GET lab order | 200, full order with history |
| L-HP-09 | HP | PATCH lab order (update notes before release) | 200 |
| L-HP-10 | HP | List lab orders | 200, paginated |
| L-HP-11 | HP | Filter by `status=awaiting_sample` | 200, only matching |
| L-HP-12 | HP | Filter by `priority=stat` | 200, only matching |

### 6.2 State Machine Guards

| ID | Type | Scenario | Expected |
|----|------|----------|----------|
| L-SM-01 | SM | Advance from terminal `result_released` | 409 `conflict` "Lab order has reached its final state" |
| L-SM-02 | SM | Advance to `result_released` without recording result | 409 `conflict` "Cannot release result without recording it first" — create order, advance to `result_ready` manually by recording result first, then advance; test the NO-result path by trying to advance from `awaiting_result` to `result_ready` without calling `/result` |
| L-SM-03 | SM | Record result at wrong state (e.g. `awaiting_sample`) | 409 `conflict` "Results can only be recorded when order is awaiting_result or result_ready" |
| L-SM-04 | SM | PATCH a released lab order | 409 `conflict` "Cannot edit a released lab order" |
| L-SM-05 | SM | Verify `stateHistory` grows with each advance | After 3 advances, `stateHistory.length = 3` |
| L-SM-06 | SM | Verify `sampleCollectedBy` and `sampleCollectedAt` set on `sample_received` transition | Advance with `sampleType` in body; check returned fields |

### 6.3 Edge Cases

| ID | Type | Scenario | Expected |
|----|------|----------|----------|
| L-EG-01 | EG | GET lab order from wrong hospital | 404 |
| L-EG-02 | EG | GET lab order for wrong patient (different patient, same hospital) | 404 |
| L-EG-03 | EG | Create lab order for patient not in hospital | 404 |
| L-BUG-01 | BUG | **`recordResult()` auto-advances to `result_ready`** — the service sets `status: 'result_ready'` whenever a result is recorded, regardless of current status. If order is already `result_ready` (result updated), the advance is idempotent. But if called at `awaiting_result`, it bypasses the explicit `advance` call. The state machine guard on `advanceStatus` checks `VALID_TRANSITIONS[order.status]` — advancing from `result_ready` correctly goes to `result_released`. The L-SM-02 scenario requires careful testing: is there any path to reach `result_released` from `awaiting_result` without going through `/result`? Test: advance to `awaiting_result`, then immediately advance (without `/result`) — should 409. |

---

## 7. Assets

### 7.1 CRUD

| ID | Type | Scenario | Expected |
|----|------|----------|----------|
| AS-HP-01 | HP | Create asset | 201, asset with `status = 'available'` (hardcoded in service — `body.status` is ignored) |
| AS-HP-02 | HP | List assets | 200, paginated |
| AS-HP-03 | HP | Filter assets by category | 200, only matching |
| AS-HP-04 | HP | Filter assets by status | 200, only matching |
| AS-HP-05 | HP | Search assets by name fragment (`q`) | 200, filtered |
| AS-HP-06 | HP | GET /assets/:assetId | 200, full asset |
| AS-HP-07 | HP | PATCH /assets/:assetId | 200, updated |
| AS-HP-08 | HP | PATCH /assets/:assetId/status | 200, `status` changed |
| AS-HP-09 | HP | POST /assets/:assetId/move — record location change | 200, `currentLocation` updated, `locationHistory` has new entry with `movedBy`, `movedAt` |
| AS-HP-10 | HP | POST /assets/:assetId/photos — add photo | 200, `photos` array updated |
| AS-HP-11 | HP | DELETE /assets/:assetId/photos/:fileKey | 200, photo removed from array |
| AS-HP-12 | HP | DELETE /assets/:assetId | 204 |
| AS-EG-01 | EG | GET asset from wrong hospital | 404 |
| AS-EG-02 | EG | PATCH asset from wrong hospital | 404 |
| AS-EG-03 | EG | Delete asset from wrong hospital | 404 |
| AS-BUG-01 | BUG | **Create asset ignores `status` field in body** — `assetService.create()` hardcodes `status: 'available'`, ignoring `body.status` from the request. The API schema accepts a `status` field but it has no effect. Verify: create asset with `status: 'maintenance'` — returned asset will have `status: 'available'`. |

---

## 8. Review Queue

| ID | Type | Scenario | Expected |
|----|------|----------|----------|
| RQ-HP-01 | HP | Create review item | 201, `status = 'pending'` |
| RQ-HP-02 | HP | List review queue | 200, paginated |
| RQ-HP-03 | HP | Filter by `status=pending` | 200, only pending |
| RQ-HP-04 | HP | GET review item | 200 |
| RQ-HP-05 | HP | Approve item | 200, `status = 'approved'`, `reviewedBy` + `reviewedAt` set |
| RQ-HP-06 | HP | Reject item with note | 200, `status = 'rejected'`, `reviewNote` set |
| RQ-HP-07 | HP | Escalate item | 200, `status = 'escalated'` |
| RQ-HP-08 | HP | Act on escalated item (approve/reject from escalated) | 200 — code allows action from `escalated` state too (check: `status !== 'pending' && status !== 'escalated'` throws) |
| RQ-EG-01 | EG | Approve an already-approved item | 409 `conflict` "Review item has already been resolved" |
| RQ-EG-02 | EG | Reject an already-rejected item | 409 |
| RQ-EG-03 | EG | Act on item from wrong hospital | 404 |
| RQ-EG-04 | EG | Invalid `action` value | 400 `validation_error` |

---

## 9. Audit Log

| ID | Type | Scenario | Expected |
|----|------|----------|----------|
| AU-HP-01 | HP | GET /audit-log | 200, paginated entries |
| AU-HP-02 | HP | Filter by `actorId` | 200, only that actor's entries |
| AU-HP-03 | HP | Filter by `action` | 200, only that action type |
| AU-EG-01 | EG | GET audit-log as non-member | 403 |
| AU-EG-02 | EG | Audit entries have no update/delete endpoint | confirm by checking routes — no PATCH/DELETE for audit |

---

## 10. Notifications

| ID | Type | Scenario | Expected |
|----|------|----------|----------|
| N-HP-01 | HP | GET /notifications (all) | 200, paginated |
| N-HP-02 | HP | GET /notifications?unread=true | 200, only `isRead=false` entries |
| N-HP-03 | HP | POST /notifications/:id/read — mark one read | 200, `readAt` set |
| N-HP-04 | HP | POST /notifications/read-all | 204 |
| N-HP-05 | HP | GET /notifications after read-all — no unread | 200, empty when filtered by `unread=true` |
| N-EG-01 | EG | Mark notification belonging to different user as read | 404 — `notificationRepo.markRead(id, recipientId)` checks both fields |
| N-EG-02 | EG | GET notifications as non-member | 403 |

---

## 11. Global Search

| ID | Type | Scenario | Expected |
|----|------|----------|----------|
| SR-HP-01 | HP | Search `q=John` (no type filter) | 200, results with `patients`, `assets`, `labs` keys |
| SR-HP-02 | HP | Search with `types=patients` | 200, only `patients` key populated, others absent or empty |
| SR-HP-03 | HP | Search with `types=assets` | 200, only assets |
| SR-HP-04 | HP | Search with `types=patients,labs` | 200, both keys present |
| SR-HP-05 | HP | Search respects hospital isolation | results only contain data from the caller's hospital |
| SR-EG-01 | EG | Search with `q=""` (empty) | 400 `validation_error` |
| SR-EG-02 | EG | Search with `limit=21` (> max 20) | 400 `validation_error` |
| SR-EG-03 | EG | Search `q` of 201 chars | 400 `validation_error` |
| SR-EG-04 | EG | Search as non-member | 403 |

---

## 12. RBAC Cross-Cutting Matrix

This section is executed by `rbac-matrix.test.mjs`. It makes a single call per endpoint per role and verifies the HTTP status.

### 12.1 Roles under test

Six tokens seeded: `super_admin`, `hospital_admin`, `doctor`, `nurse`, `reception`, `lab_tech`.

### 12.2 Key assertions to verify

| Endpoint | super_admin | hospital_admin | doctor | nurse | reception | lab_tech |
|----------|:-----------:|:--------------:|:------:|:-----:|:---------:|:--------:|
| PATCH /hospitals/:id/branding | 200 | **403** | 403 | 403 | 403 | 403 |
| PATCH /hospitals/:id/modules | 200 | **403** | 403 | 403 | 403 | 403 |
| POST /hospitals/:id/invitations | 200 | 200 | **403** | 403 | 403 | 403 |
| POST /chart/medications | 200 | **403** | 200 | **403** | 403 | 403 |
| PATCH /chart/history | **403** (not CLINICAL) | **403** | 200 | 200 | 403 | 403 |
| GET /chart/access-log | 200 | 200 | **403** | 403 | 403 | 403 |
| DELETE /staff/:memberId | 200 | 200 | **403** | 403 | 403 | 403 |
| POST /hospitals/:id/roles | 200 | **403** | 403 | 403 | 403 | 403 |

**Note on hospital_admin and PATCH /chart/history:** `hospital_admin` is in `ADMIN_ROLES` but NOT in `CLINICAL_ROLES`. The history endpoint uses `requireRole(...CLINICAL_ROLES)` which only includes `doctor, nurse, nurse_practitioner, physician_assistant`. Hospital admins cannot write medical history — verify this is intentional.

**Note on super_admin and PATCH /chart/history:** `super_admin` is NOT in `CLINICAL_ROLES` either. Same restriction applies. Verify this is intentional — a super_admin cannot update medical history through the API.

---

## 13. Suspended Member Behaviour

| ID | Type | Scenario | Expected |
|----|------|----------|----------|
| SM-01 | HP | Suspended member calls any hospital-scoped endpoint | 403 `forbidden` "Not an active member of this hospital" — `hospitalScope` only returns member where `status: 'active'` |
| SM-02 | HP | Suspended member calls auth endpoints (not scoped) | 200 — suspension is hospital-scoped only, auth is global |
| SM-03 | HP | Reactivate suspended member | 204 |
| SM-04 | HP | Reactivated member can access hospital resources | 200 |

---

## 14. Global Edge Cases

| ID | Type | Scenario | Expected |
|----|------|----------|----------|
| EC-01 | EG | Zod validation — missing required field | 400 `validation_error`, `field_errors` has at least one key |
| EC-02 | EG | Zod validation — multiple fields invalid simultaneously | 400, `field_errors` contains ALL failing fields (not just first) — verify Zod collects all issues |
| EC-03 | EG | Invalid MongoDB-style ID in URL param | 404 `not_found` — service returns null for invalid ID, throws NotFoundError |
| EC-04 | EG | hospitalId in URL doesn't match any hospital | 403 (hospitalScope: not a member) |
| EC-05 | EG | `page=0` query param | 400 `validation_error` |
| EC-06 | EG | `limit=0` query param | 400 `validation_error` |
| EC-07 | EG | `limit=1000` query param (above max if enforced) | depends on schema — check if Zod caps limit |
| EC-08 | EG | Request body is not valid JSON | 400 — express body-parser rejects |
| EC-09 | EG | Unknown route | 404 `not_found` "Route not found" |
| EC-10 | EG | Response envelope on all 2xx: `{ data: ... }` | verify no bare objects |
| EC-11 | EG | Response envelope on all 4xx: `{ status: "error", message, code }` | verify every error path |
| EC-12 | EG | Every response has `X-Request-Id` header | check response headers |

---

## 15. Pre-execution Bug Fixes — Confirmation Tests

All 9 bugs identified during static code review were fixed before test execution began (2026-05-15). Full detail and fix diffs are in `reports/preliminary-bugs.md`. Each fix must pass its confirmation test during execution before that module's section is marked complete.

| # | Severity | Fix Summary | Confirmation Test IDs |
|---|----------|-------------|----------------------|
| BUG-01 | 🔴 HIGH | `acceptTransfer` now fetches `patient.patientCode` before `linkToHospital` | P-HP-26, P-BUG-03 |
| BUG-02 | 🔴 HIGH | `search()` delegates to DB-level `searchByHospital` / `countSearchByHospital` | P-HP-04, P-BUG-01 |
| BUG-03 | 🟡 MED | `invite` / `resendInvitation` resolve inviter name via `authRepo.findById` | S-BUG-01 |
| BUG-04 | 🟡 MED | `hospitalScope` fetches hospital and returns 403 if `isArchived: true` | H-BUG-01 |
| BUG-05 | 🟡 MED | `transferOwnership` demotes previous owner to `hospital_admin` | H-BUG-02, H-HP-10 |
| BUG-06 | 🟡 MED | `checkIn` now persists `department` and `assignedTo` | P-HP-20, P-BUG-04 |
| BUG-07 | 🟡 MED | Asset `create` uses `body.status ?? 'available'` | AS-HP-01, AS-BUG-01 |
| BUG-08 | 🟢 LOW | `setup2fa` persists `pendingTwoFactorSecret`; `verify2fa` reads from DB, not client body | A-HP-20–22, A-BUG-02 |
| BUG-09 | 🟢 LOW | `declineInvitation` now checks `expiresAt` | S-EG-08 (new), S-EG-05 |

### BUG-04 partial gap (note for report)

The `hospitalScope` middleware now blocks access to archived hospitals. However, `GET /hospitals` (`listMine`) does not pass through `hospitalScope` — it fetches memberships then looks up hospitals without filtering `isArchived`. Archived hospitals will still appear in the list. This residual gap must be flagged as a new finding in the execution report if confirmed.

---

## 16. Test Execution Order

Scripts must run in this order (state builds on prior steps):

1. `restore-seed.mjs` — restore/create test users and Hospital A/B (safe to re-run)
2. `auth.test.mjs`
3. `hospitals.test.mjs`
4. `staff.test.mjs`
5. `patients.test.mjs`
6. `emr.test.mjs`
7. `labs.test.mjs`
8. `assets.test.mjs`
9. `review.test.mjs`
10. `audit.test.mjs`
11. `notifications.test.mjs`
12. `search.test.mjs`
13. `rbac-matrix.test.mjs`
14. `edge-cases.test.mjs`

Each script is standalone and logs PASS/FAIL per test ID. The report will be written to `docs/qas/reports/report.md`.

---

## 17. Out of Scope

- Email delivery (emails are fire-and-forget; no real SMTP configured in test env)
- File upload / S3 (`fileKey`, `photoKey` fields accept any string — actual upload tested separately)
- TOTP clock drift scenarios (TOTP window tolerance not tested here)
- Rate limiting (no rate limiting middleware present in this backend)
- WebSocket / realtime (not implemented in MVP)
