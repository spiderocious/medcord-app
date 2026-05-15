# QA Handoff — Medcord API

Test matrix, state machine verification, RBAC checks, and edge cases for the Medcord backend.

---

## Environment Setup

| Variable | Value |
|----------|-------|
| `BASE_URL` | `http://localhost:3000/api/v1` |
| `MONGO_URI` | local dev URI |
| `JWT_ACCESS_SECRET` | any string |
| `JWT_REFRESH_SECRET` | any string |
| `JWT_ACCESS_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `APP_BASE_URL` | `http://localhost:5173` |

---

## Auth Tests

| # | Test | Expected |
|---|------|----------|
| A1 | Register with valid body | 201, tokens returned |
| A2 | Register duplicate email | 409 CONFLICT |
| A3 | Login correct credentials | 200, tokens |
| A4 | Login wrong password | 401 INVALID_CREDENTIALS |
| A5 | Login unknown email | 401 INVALID_CREDENTIALS |
| A6 | Refresh with valid refresh token | 200, new tokens |
| A7 | Refresh with invalid/expired token | 401 |
| A8 | Refresh with revoked token (after logout) | 401 Token revoked |
| A9 | Logout | 204, refresh token version bumped |
| A10 | Access protected route without token | 401 Missing bearer token |
| A11 | Access protected route with expired access token | 401 Invalid or expired token |
| A12 | GET /auth/me returns current user | 200 |
| A13 | PATCH /auth/me/password with wrong current password | 401 |
| A14 | PATCH /auth/me/password with correct credentials | 204, all old tokens invalidated |

### 2FA Tests

| # | Test | Expected |
|---|------|----------|
| 2FA1 | POST /auth/setup-2fa | 200, secret + otpauthUrl |
| 2FA2 | POST /auth/verify-2fa with valid TOTP | 204 |
| 2FA3 | POST /auth/verify-2fa with wrong code | 401 |
| 2FA4 | Login when 2FA enabled, no totpCode in body | 401 "Two-factor code required" |
| 2FA5 | Login with valid totpCode after 2FA enabled | 200 |

---

## Hospital Tests

| # | Test | Expected |
|---|------|----------|
| H1 | Create hospital | 201, caller becomes super_admin member |
| H2 | Create hospital with duplicate subdomain | 409 |
| H3 | GET /hospitals lists only caller's memberships | 200 |
| H4 | GET /hospitals/:id as member | 200 |
| H5 | GET /hospitals/:id as non-member | 403 |
| H6 | PATCH /hospitals/:id as hospital_admin | 200 |
| H7 | PATCH /hospitals/:id/branding as hospital_admin (not super_admin) | 403 |
| H8 | PATCH /hospitals/:id/modules as super_admin | 200 |
| H9 | Transfer ownership to non-member userId | 404 |
| H10 | Transfer ownership as non-owner | 403 |
| H11 | Archive hospital as non-owner | 403 |
| H12 | Archive hospital as owner | 204 |

---

## Staff / Invitation Tests

| # | Test | Expected |
|---|------|----------|
| S1 | Invite new staff by email (admin) | 201, invitation created |
| S2 | Invite same email twice (pending exists) | 409 |
| S3 | Revoke pending invitation | 204 |
| S4 | Revoke already-accepted invitation | 409 |
| S5 | Resend invitation (resets TTL) | 200, new token |
| S6 | Accept invitation with valid token | 200, hospitalId returned |
| S7 | Accept already-accepted invitation | 409 |
| S8 | Accept expired invitation | 409 "Invitation has expired" |
| S9 | Accept if already a member | 409 |
| S10 | Decline invitation | 200 |
| S11 | List staff (paginated) | 200 |
| S12 | Filter staff by role | 200, only matching roles |
| S13 | Suspend self | 403 "Cannot suspend yourself" |
| S14 | Suspend another member | 204 |
| S15 | Remove self | 403 "Cannot remove yourself" |
| S16 | Invite/manage staff as non-admin role | 403 |
| S17 | Bulk invite 3 emails | 201, 3 invitations |

---

## Patient Tests

| # | Test | Expected |
|---|------|----------|
| P1 | Register patient | 201, possibleDuplicates in response |
| P2 | Register patient with same name+dob as existing | 201, possibleDuplicates non-empty |
| P3 | Search patients by firstName fragment | 200, filtered list |
| P4 | Search patients by patientCode | 200 |
| P5 | GET /patients/recent | 200, max 10 entries |
| P6 | GET patient from different hospital | 404 |
| P7 | Issue ID card | 200, idCard.isActive=true |
| P8 | Re-issue already active card | 200, idCard.reissuedAt set |
| P9 | Deactivate ID card | 204 |
| P10 | Check in patient | 200, currentHospitalId updated |
| P11 | Admit patient | 200, admissionStatus=admitted |
| P12 | Discharge patient | 200, admissionStatus=discharged |
| P13 | Request transfer to nonexistent hospital | 404 |
| P14 | Accept transfer as receiving hospital | 200, patient linked to new hospital |
| P15 | Decline transfer | 200, status=declined |
| P16 | Accept already-accepted transfer | 409 |
| P17 | Add to favorites | 204 |
| P18 | Remove from favorites | 204 |

---

## EMR Tests

| # | Test | Expected |
|---|------|----------|
| E1 | GET chart summary | 200 |
| E2 | Record vitals | 201 |
| E3 | List vitals (limit=3) | 200, 3 entries max |
| E4 | Add medication as nurse | 403 (nurse lacks PRESCRIBER_ROLE) |
| E5 | Add medication as doctor | 201 |
| E6 | Update medication as doctor | 200 |
| E7 | GET medical history | 200 |
| E8 | PATCH history as reception (non-clinical) | 403 |
| E9 | PATCH history as nurse | 200 |
| E10 | Add procedure as clinical role | 201 |
| E11 | Add immunization as clinical role | 201 |
| E12 | Add chart document (any member) | 201 |
| E13 | GET access log as super_admin | 200, paginated |
| E14 | GET access log as doctor | 403 |
| E15 | Break glass | 204, access log entry created |
| E16 | Access EMR for patient not linked to hospital | 404 |

---

## Lab Order State Machine Tests

The state machine is strictly linear. Each step: `POST .../advance`.

| # | From → To | Expected |
|---|-----------|----------|
| L1 | (create) | status=awaiting_sample |
| L2 | awaiting_sample → sample_received | 200 |
| L3 | sample_received → awaiting_test | 200 |
| L4 | awaiting_test → in_progress | 200 |
| L5 | in_progress → awaiting_result | 200 |
| L6 | awaiting_result → result_ready | 200 |
| L7 | result_ready → result_released | 200 (only if result recorded) |
| L8 | result_released → advance | 409 "already at terminal state" |
| L9 | Skip step (e.g. advance twice rapidly) | 2nd advance correctly reflects next valid state |
| L10 | Record result at awaiting_result | 200 |
| L11 | Release without result recorded | 409 "result required before release" |
| L12 | List lab orders with status filter | 200, only matching |
| L13 | List lab orders with priority filter | 200 |
| L14 | Get lab order from wrong hospital | 404 |

---

## Asset Tests

| # | Test | Expected |
|---|------|----------|
| AS1 | Create asset | 201 |
| AS2 | List assets | 200, paginated |
| AS3 | Filter assets by category | 200 |
| AS4 | Filter assets by status | 200 |
| AS5 | Update asset | 200 |
| AS6 | Update asset status | 200 |
| AS7 | Move asset to new location | 200, location history updated |
| AS8 | Add photo (fileKey) | 200, photoKeys array updated |
| AS9 | Remove photo | 200, fileKey removed from array |
| AS10 | Delete asset | 204 |
| AS11 | Get asset from wrong hospital | 404 |

---

## Review Queue Tests

| # | Test | Expected |
|---|------|----------|
| RQ1 | Create review item | 201, status=pending |
| RQ2 | List review queue with status filter | 200 |
| RQ3 | Approve item | 200, status=approved |
| RQ4 | Reject item with note | 200, status=rejected, note stored |
| RQ5 | Escalate item | 200, status=escalated |
| RQ6 | Act on non-pending item | 409 |

---

## Audit Log Tests

| # | Test | Expected |
|---|------|----------|
| AU1 | GET audit log | 200, paginated |
| AU2 | Filter by actorId | 200, only that actor's entries |
| AU3 | Audit entries are immutable (no update/delete endpoints) | — |

---

## Notification Tests

| # | Test | Expected |
|---|------|----------|
| N1 | GET notifications (all) | 200, paginated |
| N2 | GET notifications?unread=true | 200, only unread |
| N3 | Mark one notification read | 200, readAt set |
| N4 | Mark all read | 204 |
| N5 | Mark notification belonging to different user | 404 |

---

## Search Tests

| # | Test | Expected |
|---|------|----------|
| SR1 | Search q="John" | 200, patients matching |
| SR2 | Search with types=assets | 200, only assets in results |
| SR3 | Search with types=patients,labs | 200, both buckets populated |
| SR4 | Search q="" (empty) | 400 VALIDATION_ERROR |
| SR5 | Search from non-member | 403 |

---

## RBAC Matrix

| Endpoint area | super_admin | hospital_admin | doctor | nurse | lab_tech | reception | tech | any_member |
|---------------|:-----------:|:--------------:|:------:|:-----:|:--------:|:---------:|:----:|:----------:|
| Hospital CRUD | ✅ | PATCH only | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Staff management | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Invite staff | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Branding/modules | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Patient register | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| EMR read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| EMR vitals write | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Prescriptions | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ (NP, PA also ✅) |
| History/procedures | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| EMR access log | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Lab orders | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Assets | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Usage stats | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## Suspended Member Tests

| # | Test | Expected |
|---|------|----------|
| SM1 | Any request from suspended member | 403 (hospitalScope returns Forbidden) |
| SM2 | Re-activate suspended member | 204 |
| SM3 | Re-activated member can access resources | 200 |

---

## Edge Cases

| # | Scenario | Expected |
|---|----------|----------|
| EC1 | Zod validation failure (missing required field) | 400 VALIDATION_ERROR with details |
| EC2 | Invalid MongoDB ObjectId in URL param | 404 NOT_FOUND (repo returns null) |
| EC3 | hospitalId in URL doesn't match any hospital | 403 (hospitalScope: not a member) |
| EC4 | Pagination page=0 | 400 VALIDATION_ERROR |
| EC5 | Pagination limit=0 | 400 VALIDATION_ERROR |
| EC6 | Transfer to self (same hospital) | Should succeed (no guard), transfer created |
| EC7 | Duplicate patient registration (same name+dob) | 201, possibleDuplicates non-empty |
| EC8 | Accept invitation when already a member | 409 |
| EC9 | Lab order: advance from terminal state | 409 |
| EC10 | Release lab result without recording result | 409 "result required" |
| EC11 | Break glass logs IP + user-agent | Verify in access log after call |
| EC12 | Search with limit=21 | 400 VALIDATION_ERROR |
| EC13 | Notification from different user | 404 |
