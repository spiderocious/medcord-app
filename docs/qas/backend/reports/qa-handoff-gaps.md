# QA Handoff — Gap Features (Backend)

**Date:** 2026-05-17  
**Build status:** main-backend:build clean ✅  
**Environment:** `localhost:8085` · MongoDB `medcord` (local)  
**Gaps covered:** 1 (Password Reset), 2 (Lab Result Sign-Off)

> Gaps 3, 4, 5 are frontend-only (no new backend routes). Only Gaps 1 and 2 have backend changes.

---

## Gap 1 — Password Reset via Super-Admin Code

### New Routes

| Method | Path | Auth | Body |
|--------|------|------|------|
| POST | `/api/v1/auth/generate-reset-code` | Bearer token (must be super_admin) | `{ userId: string }` |
| POST | `/api/v1/auth/verify-reset-code` | none | `{ code: string }` |
| POST | `/api/v1/auth/reset-password` | none | `{ code: string, password: string }` |

### New Staff Route

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/v1/hospitals/:hospitalId/staff/me` | Bearer token | Returns the caller's own staff membership in the given hospital |

---

### Test Cases — `POST /api/v1/auth/generate-reset-code`

**Setup:** Have a valid super_admin JWT and a target `userId` that exists in the system.

| ID | Scenario | Expected |
|----|----------|----------|
| GRC-01 | POST with valid super_admin token and existing `userId` | 200 `{ data: { code: "<7-char-uppercase-string>" } }` |
| GRC-02 | POST with a non-super_admin token (e.g. `hospital_admin`) | 403 `{ error: { code: "forbidden", message: ... } }` |
| GRC-03 | POST with no Authorization header | 401 `{ error: { code: "unauthorized", ... } }` |
| GRC-04 | POST with an invalid/nonexistent `userId` | 404 `{ error: { code: "not_found", ... } }` |
| GRC-05 | POST with missing `userId` field in body | 422 validation error |
| GRC-06 | Call GRC-01 twice for the same user — second code overwrites first | Second code in 200 response; first code must now fail verify-reset-code |
| GRC-07 | The code returned is exactly 7 characters, uppercase alphanumeric | Assert `code.length === 7` and `/^[A-Z0-9]{7}$/.test(code)` |

---

### Test Cases — `POST /api/v1/auth/verify-reset-code`

**Setup:** Use a code generated in GRC-01.

| ID | Scenario | Expected |
|----|----------|----------|
| VRC-01 | POST with a valid, unexpired code | 200 `{ data: { valid: true } }` |
| VRC-02 | POST with a code that does not exist | 200 `{ data: { valid: false } }` OR 400 — either is acceptable |
| VRC-03 | POST with missing `code` field | 422 validation error |
| VRC-04 | POST with an expired code (manually set `passwordResetCodeExpiresAt` to the past in DB, or wait out TTL) | 200 `{ data: { valid: false } }` or 400 |

---

### Test Cases — `POST /api/v1/auth/reset-password`

**Setup:** Use a valid, unexpired code from GRC-01.

| ID | Scenario | Expected |
|----|----------|----------|
| RP-01 | POST with valid code and password >= 8 chars | 200 success; user can now login with the new password |
| RP-02 | POST with the same valid code a second time | 400 `bad_request` — code was cleared on first use |
| RP-03 | POST with a nonexistent or expired code | 400 `bad_request` |
| RP-04 | POST with `password` under 8 characters | 422 validation error |
| RP-05 | POST with missing `code` or `password` fields | 422 validation error |
| RP-06 | After RP-01, the user's old password must no longer work | POST `/api/v1/auth/login` with old password → 401 |
| RP-07 | After RP-01, verify `passwordResetCode` and `passwordResetCodeExpiresAt` are removed from the user document in MongoDB | Check via DB or by re-running VRC-01 with the same code → it must be invalid |

---

### Test Cases — `GET /api/v1/hospitals/:hospitalId/staff/me`

| ID | Scenario | Expected |
|----|----------|----------|
| SM-01 | GET with a valid token for a member of the hospital | 200 `{ data: { id, userId, hospitalId, role, ... } }` where `userId` matches the caller |
| SM-02 | GET with a valid token but the user is NOT a member of that hospital | 404 `not_found` |
| SM-03 | GET with no Authorization header | 401 |
| SM-04 | Route must resolve BEFORE `GET /staff/:memberId` — verify `/staff/me` does not match `:memberId = "me"` and try to look up a member with id "me" | Assert: `SM-01` returns `role` and `userId` fields, NOT a `not_found` for member id "me" |

---

## Gap 2 — Lab Result Sign-Off (Prescriber Role Guard)

### Modified Route

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/api/v1/hospitals/:hospitalId/patients/:patientId/labs/:orderId/advance` | Bearer token (staff member) | `nextStatus: result_released` now requires caller role to be in prescriber set |

Prescriber roles: `doctor`, `nurse_practitioner`, `physician_assistant`

---

### Test Cases — Advance to `result_released`

**Setup:** Create a lab order and advance it to `result_ready` status first. Have tokens for multiple roles.

| ID | Scenario | Expected |
|----|----------|----------|
| LSO-01 | `doctor` calls advance with `{ nextStatus: "result_released" }` on an order in `result_ready` | 200; order status becomes `result_released` |
| LSO-02 | `nurse_practitioner` calls the same | 200; order status becomes `result_released` |
| LSO-03 | `physician_assistant` calls the same | 200; order status becomes `result_released` |
| LSO-04 | `hospital_admin` calls advance to `result_released` on a `result_ready` order | 403 `{ error: { code: "forbidden", message: "Only prescribers can release lab results" } }` |
| LSO-05 | `nurse` calls advance to `result_released` | 403 forbidden |
| LSO-06 | `lab_technician` calls advance to `result_released` | 403 forbidden |
| LSO-07 | `super_admin` calls advance to `result_released` | 403 forbidden (not a prescriber role) |
| LSO-08 | `doctor` calls advance to any OTHER status (e.g. `specimen_collected` → `processing`) | 200 — role guard only applies to `result_released` |
| LSO-09 | Advance to `result_released` when order status is NOT `result_ready` (e.g. `ordered`) | 400/422 — invalid transition regardless of role |

---

## Error Envelope Reminder

All error responses must follow:

```json
{
  "error": {
    "code": "<snake_case_code>",
    "message": "<human-readable string>"
  }
}
```

New error code added: `bad_request` (used in reset-password when code not found/expired).

---

## No New Backend Changes for Gaps 3, 4, 5

- **Gap 3 (Transfers):** Uses existing `GET /hospitals/:id/transfers/incoming`, `POST .../accept`, `POST .../decline` — no changes.
- **Gap 4 (Roles):** Uses existing `GET/POST /hospitals/:id/roles` and `PATCH /hospitals/:id/roles/:roleId` — no changes.
- **Gap 5 (Audit Log):** Uses existing `GET /hospitals/:id/audit-log` — no changes. Confirm the endpoint returns `{ data: { items, total, page, limit, totalPages } }` with optional `action` and `actorId` query filters and a `page` + `limit` param.
