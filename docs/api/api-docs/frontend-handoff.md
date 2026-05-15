# Frontend Handoff — Medcord API

This document covers everything a frontend engineer needs to integrate with the Medcord backend.

---

## Base URL

```
http://localhost:8085/api/v1
```

All JSON. All requests that send a body must include `Content-Type: application/json`.

---

## Authentication Flow

### Token pair

Login returns two tokens:
- `accessToken` — short-lived JWT (default 15 min). Sent in every API request.
- `refreshToken` — long-lived JWT. Used only to get a new access token.

### Storing tokens

| Location | Recommendation |
|----------|---------------|
| `accessToken` | Memory (JS variable or React state). NOT localStorage. |
| `refreshToken` | `httpOnly` cookie set by your own BFF, or in memory if no BFF. |

If storing in memory: both tokens are lost on page reload. Implement a silent-refresh on mount by calling `POST /auth/refresh` with the stored refresh token.

### Attaching the token

```
Authorization: Bearer <accessToken>
```

### Token refresh

When any API call returns `401`, refresh the access token:

```ts
const res = await fetch('/api/v1/auth/refresh', {
  method: 'POST',
  body: JSON.stringify({ refreshToken }),
});
const { data: { tokens } } = await res.json();
// retry the original request with tokens.accessToken
```

On `400` or `401` from the refresh itself → redirect to login.

### 2FA login flow

```
POST /auth/login   →  { email, password }
   ↓ if twoFactorEnabled
401  "Two-factor code required"
   ↓ show TOTP prompt
POST /auth/login   →  { email, password, totpCode }
   ↓
200  { tokens }
```

---

## Hospital Scope

Most endpoints are scoped to a hospital. The pattern is always:

```
/hospitals/:hospitalId/<resource>
```

After login, call `GET /hospitals` to get the user's memberships, then store the selected `hospitalId` in app state (URL param or context).

The backend enforces scope via the `hospitalScope` middleware — it checks the caller is an active member of that hospital. A `403` from a scoped route means either:
1. User is not a member of that hospital, or
2. Their membership is `suspended`.

---

## Roles and Permissions

Roles are assigned per-hospital-membership, not per-user account.

| Role | Typical permissions |
|------|---------------------|
| `super_admin` | All actions including branding, modules, ownership transfer, archive |
| `hospital_admin` | Staff management, invitations, usage stats |
| `doctor` | EMR write, prescriptions, procedures, immunizations |
| `nurse` / `nurse_practitioner` / `physician_assistant` | EMR write (no prescriptions for nurse) |
| `lab_tech` | Lab order advancement and result recording |
| `pharmacist` | (Read-only on most EMR) |
| `reception` | Patient registration, check-in/out |
| `tech` | Asset management |
| `custom` | Depends on custom role permissions |

A `403 FORBIDDEN` with message `"Insufficient role"` means the user is authenticated and a member, but their role isn't in the required list for that endpoint.

---

## File Handling

The backend **never handles file bytes**. It only stores and returns `fileKey` strings.

**Pattern**:
1. Frontend requests a pre-signed upload URL from your storage service (S3, Cloudflare R2, etc.).
2. Frontend uploads file directly to storage.
3. Frontend sends the resulting `fileKey` to the backend in the relevant API field.

Fields that accept file keys: `photoKey` (user/patient), `fileKey` (lab orders, chart documents), `documentKeys` (patient), `photoKeys` (assets).

---

## Pagination

Paginated responses follow this envelope:

```json
{
  "status": "success",
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

Standard query params: `page` (default 1), `limit` (default varies by endpoint).

---

## Response Envelope

**Success**:
```json
{
  "status": "success",
  "data": { ... }
}
```

**Created** (201) — same shape.

**No Content** (204) — empty body.

**Error**:
```json
{
  "status": "error",
  "message": "Human-readable description",
  "code": "ERROR_CODE"
}
```

### Common error codes

| code | HTTP | when to show / handle |
|------|------|-----------------------|
| `VALIDATION_ERROR` | 400 | Show inline field errors (message contains details) |
| `INVALID_CREDENTIALS` | 401 | Wrong email/password |
| `UNAUTHORIZED` | 401 | Token expired — trigger refresh |
| `FORBIDDEN` | 403 | Insufficient role — hide the UI affordance |
| `NOT_FOUND` | 404 | Show empty state |
| `CONFLICT` | 409 | Show specific message (e.g. "Email already registered") |
| `INTERNAL_ERROR` | 500 | Show generic "Something went wrong" |

---

## Key Workflows

### Register a patient
```
POST /hospitals/:hospitalId/patients
```
Response includes `possibleDuplicates` — show a warning UI if this array is non-empty.

### Patient admission lifecycle
```
checkin  →  admit  →  discharge
            (or)
checkin  →  checkout
```
`admissionStatus` values: `outpatient | admitted | discharged`

### Inter-hospital patient transfer
1. `POST .../transfer` — creates a pending transfer
2. Receiving hospital sees it via `GET /hospitals/:hospitalId/transfers/incoming`
3. `POST .../accept` or `POST .../decline`

### Lab order state machine
Progress is linear, one step at a time:
```
awaiting_sample → sample_received → awaiting_test → in_progress → awaiting_result → result_ready → result_released
```
Call `POST .../advance` to move forward. Each advance records who triggered it and when (`stateHistory`).  
Record result at `awaiting_result` or `result_ready` — result must be set before releasing.

### Staff invitation flow
```
POST /invitations  →  email sent  →  user clicks link  →  POST /auth/invitations/accept
```
Invite token TTL: 7 days. Admin can resend (resets TTL) or revoke.

---

## Favoring Access Patterns

| Need | Endpoint |
|------|----------|
| Recently viewed patients | `GET /hospitals/:hospitalId/patients/recent` |
| Pinned/bookmarked patients | `GET /hospitals/:hospitalId/patients?favorites=true` — use POST/DELETE `.../favorite` |
| Global search across patients, assets, labs | `GET /hospitals/:hospitalId/search?q=...&types=patients,assets` |
| Unread notification count | `GET .../notifications?unread=true` and check `total` |

---

## 2FA Setup Flow (Settings page)

```
POST /auth/setup-2fa       → { secret, otpauthUrl }
// show QR code using otpauthUrl
// user scans with authenticator app
POST /auth/verify-2fa      → { totpCode, secret }
// 2FA is now active
```

---

## Invite Acceptance (Onboarding flow)

The invitation token arrives in a URL like `/invite/:token`.

```
POST /auth/invitations/accept   body: { token }
// requires: Authorization: Bearer <accessToken>
// → { hospitalId }
// redirect to the hospital workspace
```

If the user doesn't have an account yet, have them register first, then call accept.

---

## CORS / Subdomain Note

Each hospital gets a subdomain: `<slug>.Medcord.app`. The API does not change per subdomain — always call the main API. The subdomain is a frontend routing concern only.
