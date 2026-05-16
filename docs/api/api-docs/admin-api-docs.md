# Medcord Platform Admin API Reference

**Base URL**: `http://localhost:8085`  
**Admin prefix**: `/admin` (all endpoints below are relative to this — e.g. full path is `http://localhost:8085/admin/stats`)  
**Content-Type**: `application/json`

---

## Authentication

Every admin endpoint runs through two middleware layers in sequence:

1. **`authenticate`** — verifies the `Authorization: Bearer <accessToken>` header, decodes the JWT, and checks that `tokenVersion` in the token matches the value in the database (invalidated when sessions are disabled).
2. **`requireAdmin`** — re-fetches the user from the database and checks `user.isAdmin === true`.

If either check fails the request is rejected before reaching the handler.

---

## Response envelope

### Success

```json
{ "data": <payload> }
```

All 200/201 responses wrap their payload in `{ data }`. The exact shape of `<payload>` is documented per endpoint.

### 204 No Content

Body is empty. No JSON. Do not call `.json()` on these responses.

### Error

```json
{
  "error": {
    "code": "error_code_snake_case",
    "message": "Human-readable message"
  }
}
```

The ky client in `packages/api/src/client.ts` intercepts all non-2xx responses and re-throws a plain `Error` whose `.message` is the backend `error.message` string. Frontend error handlers should always use `err instanceof Error ? err.message : 'Something went wrong.'` — never hardcode.

---

## Common error responses

These can be returned by **every** admin endpoint — document once, not per endpoint.

### 401 Unauthorized

Returned when:
- `Authorization` header is missing or does not start with `Bearer `
- The JWT signature is invalid or the token is expired
- The token's `tokenVersion` no longer matches the database (user sessions were disabled)

```json
{
  "error": {
    "code": "unauthorized",
    "message": "Missing bearer token"
  }
}
```

```json
{
  "error": {
    "code": "unauthorized",
    "message": "Invalid or expired token"
  }
}
```

```json
{
  "error": {
    "code": "unauthorized",
    "message": "Token has been revoked"
  }
}
```

### 403 Forbidden

Returned when the token is valid but the user does not have `isAdmin: true`.

```json
{
  "error": {
    "code": "forbidden",
    "message": "Platform admin access required"
  }
}
```

### 400 Validation Error

Returned when query params or request body fail zod validation.

```json
{
  "error": {
    "code": "validation_error",
    "message": "Validation failed"
  }
}
```

### 404 Not Found

Returned when the requested hospital or user does not exist.

```json
{
  "error": {
    "code": "not_found",
    "message": "Hospital not found"
  }
}
```

```json
{
  "error": {
    "code": "not_found",
    "message": "User not found"
  }
}
```

### 500 Internal Server Error

Unhandled exceptions caught by the global error handler.

```json
{
  "error": {
    "code": "internal_error",
    "message": "Internal server error"
  }
}
```

---

## Stats

### `GET /admin/stats`

Platform-wide aggregated metrics. No query params.

**Auth required**: yes (admin)

#### Response 200

Route: `ResponseUtil.ok(res, { stats })` — payload is wrapped under the key `stats`.

```json
{
  "data": {
    "stats": {
      "hospitals": {
        "total": 42,
        "active": 38,
        "archived": 4
      },
      "users": {
        "total": 310,
        "admins": 2,
        "twoFactorEnabled": 87
      },
      "recentSignups": {
        "last7d": 12,
        "last30d": 45
      },
      "recentHospitals": {
        "last7d": 2,
        "last30d": 7
      }
    }
  }
}
```

**Frontend access**: `r.data.stats`

#### Error responses

| Status | When |
|--------|------|
| 401 | Missing/invalid/revoked token |
| 403 | Token valid but `isAdmin` is false |
| 500 | Unhandled server error |

---

## Hospitals

### `GET /admin/hospitals`

List all hospitals across the platform with filtering and pagination.

**Auth required**: yes (admin)

#### Query params

| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `q` | string | — | Case-insensitive regex search on name and subdomain. Omit to return all. |
| `isArchived` | `"true"` \| `"false"` | — | Filter by archived status. **Send as string** — URLSearchParams serialises booleans as strings. Omit entirely (do not send empty string) to return all. |
| `page` | number | `1` | Min 1 |
| `limit` | number | `20` | Min 1, max 100 |

#### Response 200

Route: `ResponseUtil.ok(res, result)` where `result` is `PaginatedResult<IHospital>` returned directly from the service — flat, **no extra wrapper key**.

```json
{
  "data": {
    "items": [
      {
        "id": "HSP-abc123",
        "name": "Lagos General Hospital",
        "type": "general",
        "location": "Lagos, Nigeria",
        "contact": {
          "phone": "+2348012345678",
          "email": "info@lagosgeneral.com",
          "address": "1 Marina Road, Lagos"
        },
        "logoKey": null,
        "subdomain": "lagosgeneral",
        "customDomain": null,
        "customDomainVerified": false,
        "modules": {
          "emr": true,
          "labs": true,
          "assets": false,
          "onlineConsultation": false
        },
        "plan": "pro",
        "ownerId": "USR-xyz789",
        "timezone": "Africa/Lagos",
        "locale": "en-NG",
        "isArchived": false,
        "createdAt": "2026-01-10T09:00:00.000Z",
        "updatedAt": "2026-03-15T14:22:00.000Z"
      }
    ],
    "total": 42,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

**Frontend access**: `r.data` gives `{ items, total, page, limit, totalPages }` directly. `r.data.items` for the array.

#### Error responses

| Status | When |
|--------|------|
| 400 | Invalid query param type (e.g. `page=abc`) |
| 401 | Missing/invalid/revoked token |
| 403 | Not a platform admin |
| 500 | Unhandled server error |

---

### `GET /admin/hospitals/:hospitalId`

Full hospital record plus current member count.

**Auth required**: yes (admin)

#### Path params

| Param | Type | Notes |
|-------|------|-------|
| `hospitalId` | string | Hospital ID (e.g. `HSP-abc123`) |

#### Response 200

Route: `ResponseUtil.ok(res, data)` where `data = { hospital, memberCount }` — service returns both together.

```json
{
  "data": {
    "hospital": {
      "id": "HSP-abc123",
      "name": "Lagos General Hospital",
      "type": "general",
      "location": "Lagos, Nigeria",
      "contact": {
        "phone": "+2348012345678",
        "email": "info@lagosgeneral.com",
        "address": "1 Marina Road, Lagos"
      },
      "logoKey": null,
      "subdomain": "lagosgeneral",
      "customDomain": null,
      "customDomainVerified": false,
      "modules": {
        "emr": true,
        "labs": true,
        "assets": false,
        "onlineConsultation": false
      },
      "plan": "pro",
      "ownerId": "USR-xyz789",
      "timezone": "Africa/Lagos",
      "locale": "en-NG",
      "isArchived": false,
      "createdAt": "2026-01-10T09:00:00.000Z",
      "updatedAt": "2026-03-15T14:22:00.000Z"
    },
    "memberCount": 14
  }
}
```

**Frontend access**: `r.data.hospital` for the hospital object, `r.data.memberCount` for the count.

#### Error responses

| Status | When |
|--------|------|
| 401 | Missing/invalid/revoked token |
| 403 | Not a platform admin |
| 404 | No hospital with this ID exists — `{ error: { code: "not_found", message: "Hospital not found" } }` |
| 500 | Unhandled server error |

---

### `PATCH /admin/hospitals/:hospitalId`

Force-update a hospital's archived status and/or module toggles. All body fields are optional — only send what you want to change.

**Auth required**: yes (admin)

#### Path params

| Param | Type |
|-------|------|
| `hospitalId` | string |

#### Request body

All fields optional. You may send one or both.

```json
{
  "isArchived": false,
  "modules": {
    "emr": true,
    "labs": true,
    "assets": false,
    "onlineConsultation": true
  }
}
```

Module fields inside `modules` are individually optional — you can toggle only `labs` without touching the others.

**Body validation** (zod):
- `isArchived` must be a boolean if present
- Each `modules.*` field must be a boolean if present
- Sending `isArchived: "true"` (string) will be rejected with 400

#### Response 200

Route: `ResponseUtil.ok(res, { hospital })` — the updated hospital is wrapped under the key `hospital`.

```json
{
  "data": {
    "hospital": {
      "id": "HSP-abc123",
      "name": "Lagos General Hospital",
      "isArchived": false,
      "modules": {
        "emr": true,
        "labs": true,
        "assets": false,
        "onlineConsultation": true
      }
      // ... full IHospital shape
    }
  }
}
```

**Frontend access**: `r.data.hospital`

#### Error responses

| Status | When |
|--------|------|
| 400 | Body field types invalid (e.g. `isArchived: "true"` instead of `true`) |
| 401 | Missing/invalid/revoked token |
| 403 | Not a platform admin |
| 404 | Hospital not found |
| 500 | Unhandled server error |

---

### `DELETE /admin/hospitals/:hospitalId`

**Permanently hard-delete** a hospital document. Unlike archiving (`isArchived: true`), this removes the record from the database entirely. Does **not** cascade-delete members, patients, or EMR data.

**Auth required**: yes (admin)

#### Path params

| Param | Type |
|-------|------|
| `hospitalId` | string |

#### Response 204

Empty body. Do **not** call `.json()` on this response.

```
HTTP/1.1 204 No Content
```

#### Error responses

| Status | When |
|--------|------|
| 401 | Missing/invalid/revoked token |
| 403 | Not a platform admin |
| 404 | Hospital not found |
| 500 | Unhandled server error |

---

## Users

### `GET /admin/users`

List all user accounts across the platform.

**Auth required**: yes (admin)

#### Query params

| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `q` | string | — | Case-insensitive regex search on name and email. Omit to return all. |
| `isAdmin` | `"true"` \| `"false"` | — | Filter to admin or non-admin users. **Send as string.** Omit entirely to return all. |
| `page` | number | `1` | Min 1 |
| `limit` | number | `20` | Min 1, max 100 |

**Note**: `passwordHash`, `twoFactorSecret`, `pendingTwoFactorSecret`, and `tokenVersion` are excluded from all user responses (Mongoose `select: false`).

#### Response 200

Route: `ResponseUtil.ok(res, result)` where `result` is `PaginatedResult<IUser>` flat — no extra wrapper key.

```json
{
  "data": {
    "items": [
      {
        "id": "USR-xyz789",
        "email": "doctor@lagosgeneral.com",
        "name": "Dr. Amara Okafor",
        "phone": "+2348099887766",
        "photoKey": null,
        "isEmailVerified": true,
        "isAdmin": false,
        "twoFactorEnabled": false,
        "createdAt": "2026-01-15T10:00:00.000Z",
        "updatedAt": "2026-04-01T08:30:00.000Z"
      }
    ],
    "total": 310,
    "page": 1,
    "limit": 20,
    "totalPages": 16
  }
}
```

**Frontend access**: `r.data` gives `{ items, total, page, limit, totalPages }`. `r.data.items` for the array.

#### Error responses

| Status | When |
|--------|------|
| 400 | Invalid query param type |
| 401 | Missing/invalid/revoked token |
| 403 | Not a platform admin |
| 500 | Unhandled server error |

---

### `GET /admin/users/:userId`

Full user record plus all hospital memberships for that user.

**Auth required**: yes (admin)

#### Path params

| Param | Type |
|-------|------|
| `userId` | string |

#### Response 200

Route: `ResponseUtil.ok(res, data)` where `data = { user, memberships }`.

```json
{
  "data": {
    "user": {
      "id": "USR-xyz789",
      "email": "doctor@lagosgeneral.com",
      "name": "Dr. Amara Okafor",
      "phone": "+2348099887766",
      "photoKey": null,
      "isEmailVerified": true,
      "isAdmin": false,
      "twoFactorEnabled": false,
      "createdAt": "2026-01-15T10:00:00.000Z",
      "updatedAt": "2026-04-01T08:30:00.000Z"
    },
    "memberships": [
      {
        "id": "MBR-111aaa",
        "hospitalId": "HSP-abc123",
        "userId": "USR-xyz789",
        "role": "doctor",
        "status": "active",
        "joinedAt": "2026-01-15T10:00:00.000Z"
      },
      {
        "id": "MBR-222bbb",
        "hospitalId": "HSP-def456",
        "userId": "USR-xyz789",
        "role": "nurse",
        "status": "suspended",
        "joinedAt": "2026-02-20T11:00:00.000Z"
      }
    ]
  }
}
```

**Frontend access**: `r.data.user` for the user object, `r.data.memberships` for the memberships array. `memberships` may be an empty array `[]` if the user has no hospital memberships.

#### Error responses

| Status | When |
|--------|------|
| 401 | Missing/invalid/revoked token |
| 403 | Not a platform admin |
| 404 | No user with this ID exists — `{ error: { code: "not_found", message: "User not found" } }` |
| 500 | Unhandled server error |

---

### `PATCH /admin/users/:userId`

Update platform-level flags on a user account. All body fields are optional.

**Auth required**: yes (admin)

#### Path params

| Param | Type |
|-------|------|
| `userId` | string |

#### Request body

```json
{
  "isAdmin": true,
  "isEmailVerified": true
}
```

Both fields are optional. You may send one or both.

**Body validation** (zod):
- `isAdmin` must be a boolean if present
- `isEmailVerified` must be a boolean if present

**Use cases:**
- Promote user to platform admin: `{ "isAdmin": true }`
- Demote platform admin: `{ "isAdmin": false }`
- Manually verify email: `{ "isEmailVerified": true }`

#### Response 200

Route: `ResponseUtil.ok(res, { user })` — updated user wrapped under the key `user`.

```json
{
  "data": {
    "user": {
      "id": "USR-xyz789",
      "email": "doctor@lagosgeneral.com",
      "name": "Dr. Amara Okafor",
      "phone": "+2348099887766",
      "photoKey": null,
      "isEmailVerified": true,
      "isAdmin": true,
      "twoFactorEnabled": false,
      "createdAt": "2026-01-15T10:00:00.000Z",
      "updatedAt": "2026-05-16T12:00:00.000Z"
    }
  }
}
```

**Frontend access**: `r.data.user`

#### Error responses

| Status | When |
|--------|------|
| 400 | Body field types invalid (e.g. `isAdmin: "true"` string instead of boolean) |
| 401 | Missing/invalid/revoked token |
| 403 | Not a platform admin |
| 404 | User not found |
| 500 | Unhandled server error |

---

### `POST /admin/users/:userId/disable`

Invalidate all active sessions for a user by bumping their `tokenVersion`. Any access token they currently hold will be rejected on next use. Does **not** delete the account or block future logins — it only terminates existing sessions.

**Auth required**: yes (admin)

#### Path params

| Param | Type |
|-------|------|
| `userId` | string |

#### Request body

None.

#### Response 204

Empty body. Do **not** call `.json()` on this response.

```
HTTP/1.1 204 No Content
```

#### Error responses

| Status | When |
|--------|------|
| 401 | Missing/invalid/revoked token |
| 403 | Not a platform admin |
| 404 | User not found |
| 500 | Unhandled server error |

---

## Auth endpoints used by admin-web

These are **not** under `/admin` — they are the same auth endpoints used by medcord-web. Documented here for completeness since admin-web depends on them.

### `POST /api/v1/auth/login`

Used by the admin login screen. Same endpoint and response shape as medcord-web.

**⚠️ Critical**: `isAdmin` is **NOT** in the login response. The login response only includes `id`, `email`, and `name`. You must call `GET /api/v1/auth/me` after login to get the full user object including `isAdmin`.

#### Request body

```json
{
  "email": "admin@medcord.com",
  "password": "secret"
}
```

#### Response 200

```json
{
  "data": {
    "user": {
      "id": "USR-xyz789",
      "email": "admin@medcord.com",
      "name": "Platform Admin"
    },
    "tokens": {
      "accessToken": "<jwt>",
      "refreshToken": "<jwt>"
    }
  }
}
```

**Frontend access**: `r.data.user` (id/email/name only — no isAdmin), `r.data.tokens.accessToken`, `r.data.tokens.refreshToken`.

#### Error responses

| Status | When |
|--------|------|
| 401 | Wrong email or password — `{ error: { code: "invalid_credentials", message: "Invalid email or password" } }` |
| 400 | Body validation error |

---

### `GET /api/v1/auth/me`

Returns the full authenticated user. Used by `UserBootstrap` after login to get the `isAdmin` flag.

**Auth required**: yes (any valid token)

#### Response 200

```json
{
  "data": {
    "user": {
      "id": "USR-xyz789",
      "email": "admin@medcord.com",
      "name": "Platform Admin",
      "phone": null,
      "photoKey": null,
      "isEmailVerified": true,
      "isAdmin": true,
      "twoFactorEnabled": false,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-05-16T12:00:00.000Z"
    }
  }
}
```

**Frontend access**: `r.data.user` — this is where `isAdmin` is checked.

#### Error responses

| Status | When |
|--------|------|
| 401 | Missing/invalid/revoked token |

---

## IHospital shape (full reference)

Verified from `apps/main-backend/src/features/hospitals/hospital.model.ts`:

```ts
{
  id: string;                    // "HSP-xxx" prefixed ID
  name: string;
  type: 'general' | 'specialty' | 'clinic' | 'teaching' | 'other';
  location: string;
  contact?: {                    // optional — older records may not have this
    phone?: string;
    email?: string;
    address?: string;
  };
  logoKey?: string;              // null if no logo uploaded
  subdomain: string;             // used as the hospital URL slug
  customDomain?: string;         // null if not configured
  customDomainVerified: boolean;
  modules: {
    emr: boolean;
    labs: boolean;
    assets: boolean;
    onlineConsultation: boolean;
  };
  plan: 'pro';                   // currently only one plan
  ownerId: string;               // userId of the hospital owner
  timezone: string;              // e.g. "Africa/Lagos"
  locale: string;                // e.g. "en-NG"
  isArchived: boolean;
  createdAt: string;             // ISO 8601 date string
  updatedAt: string;             // ISO 8601 date string
}
```

**⚠️ Defensive access required**: `contact` and its sub-fields may be `undefined` on older records even if your TypeScript type says otherwise. Always use `hospital.contact?.phone` not `hospital.contact.phone`.

---

## IUser shape (full reference, secrets excluded)

Verified from `apps/main-backend/src/features/auth/auth.model.ts`. The following fields are excluded from all responses via Mongoose `select: false`: `passwordHash`, `twoFactorSecret`, `pendingTwoFactorSecret`, `tokenVersion`.

```ts
{
  id: string;                    // "USR-xxx" prefixed ID
  email: string;
  name: string;
  phone?: string;                // optional
  photoKey?: string;             // optional — null if no photo
  isEmailVerified: boolean;
  isAdmin: boolean;              // platform admin flag
  twoFactorEnabled: boolean;
  createdAt: string;             // ISO 8601 date string
  updatedAt: string;             // ISO 8601 date string
}
```

---

## MembershipSummary shape

Returned inside `GET /admin/users/:userId` response under `memberships`:

```ts
{
  id: string;         // "MBR-xxx" prefixed ID
  hospitalId: string;
  userId: string;
  role: string;       // e.g. "doctor", "nurse", "admin"
  status: string;     // e.g. "active", "suspended", "invited"
  joinedAt: string;   // ISO 8601 date string
}
```

---

## EP constants reference

These constants must be added to `packages/api/src/endpoints.ts` and imported via `EP` in all admin-web hooks:

```ts
// Admin — mounted at /admin (NOT /api/v1/)
ADMIN_STATS: 'admin/stats',
ADMIN_HOSPITALS: 'admin/hospitals',
ADMIN_HOSPITAL: (hospitalId: string) => `admin/hospitals/${hospitalId}`,
ADMIN_HOSPITAL_UPDATE: (hospitalId: string) => `admin/hospitals/${hospitalId}`,
ADMIN_HOSPITAL_DELETE: (hospitalId: string) => `admin/hospitals/${hospitalId}`,
ADMIN_USERS: 'admin/users',
ADMIN_USER: (userId: string) => `admin/users/${userId}`,
ADMIN_USER_UPDATE: (userId: string) => `admin/users/${userId}`,
ADMIN_USER_DISABLE: (userId: string) => `admin/users/${userId}/disable`,
```

Note: `ADMIN_HOSPITAL`, `ADMIN_HOSPITAL_UPDATE`, and `ADMIN_HOSPITAL_DELETE` all point to the same path but are named distinctly to make the intent of each call explicit at the call site.
