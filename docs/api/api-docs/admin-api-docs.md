# Medcord Platform Admin API Reference

**Base URL**: `http://localhost:8085/admin`  
**Content-Type**: `application/json`

All admin endpoints require:
1. `Authorization: Bearer <accessToken>` — a valid, non-expired JWT
2. The authenticated user must have `isAdmin: true` on their account

Any request failing either check returns:
- `401` — missing or invalid token
- `403 FORBIDDEN` — authenticated but `isAdmin` is `false`

There is no self-service way to become a platform admin. The `isAdmin` flag is set directly via `PATCH /admin/users/:userId` by an existing admin, or bootstrapped directly in the database for the first admin account.

---

## Stats

### GET /admin/stats
Platform-wide aggregated metrics.

**Response 200**
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

---

## Hospitals

### GET /admin/hospitals
List all hospitals across the platform. Supports filtering and pagination.

**Query params**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `q` | string | — | Search by name or subdomain (case-insensitive regex) |
| `isArchived` | `true` \| `false` | — | Filter by archived status. Omit to return all. |
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Max 100 |

**Response 200** (paginated)
```json
{
  "data": {
    "items": [ /* IHospital[] */ ],
    "total": 42,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

---

### GET /admin/hospitals/:hospitalId
Full hospital detail including current member count.

**Response 200**
```json
{
  "data": {
    "hospital": { /* IHospital */ },
    "memberCount": 14
  }
}
```

---

### PATCH /admin/hospitals/:hospitalId
Force-update a hospital's archived status or module toggles.

**Body** (all fields optional)
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

**Response 200** `{ "data": { "hospital": IHospital } }`

Use cases:
- Restore an archived hospital: `{ "isArchived": false }`
- Disable a module for a hospital: `{ "modules": { "onlineConsultation": false } }`

---

### DELETE /admin/hospitals/:hospitalId
**Permanently delete** a hospital and its document. This is a hard delete — unlike the hospital owner's archive action which only sets `isArchived: true`, this removes the record from the database.

> Use with caution. This does not cascade-delete members, patients, or EMR data.

**Response 204**

---

## Users

### GET /admin/users
List all user accounts across the platform.

**Query params**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `q` | string | — | Search by name or email (case-insensitive regex) |
| `isAdmin` | `true` \| `false` | — | Filter to admin or non-admin users |
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Max 100 |

**Response 200** (paginated)
```json
{
  "data": {
    "items": [ /* IUser[] (no secrets) */ ],
    "total": 310,
    "page": 1,
    "limit": 20,
    "totalPages": 16
  }
}
```

Note: `passwordHash`, `twoFactorSecret`, `pendingTwoFactorSecret`, and `tokenVersion` are excluded from all user responses (Mongoose `select: false`).

---

### GET /admin/users/:userId
Full user detail plus all their hospital memberships.

**Response 200**
```json
{
  "data": {
    "user": { /* IUser */ },
    "memberships": [
      {
        "id": "MBR-xxx",
        "hospitalId": "HSP-xxx",
        "userId": "USR-xxx",
        "role": "doctor",
        "status": "active",
        "joinedAt": "2026-01-15T10:00:00.000Z"
      }
    ]
  }
}
```

---

### PATCH /admin/users/:userId
Update platform-level flags on a user account.

**Body** (all fields optional)
```json
{
  "isAdmin": true,
  "isEmailVerified": true
}
```

**Response 200** `{ "data": { "user": IUser } }`

Use cases:
- Promote a user to platform admin: `{ "isAdmin": true }`
- Demote a platform admin: `{ "isAdmin": false }`
- Manually verify a user's email: `{ "isEmailVerified": true }`

---

### POST /admin/users/:userId/disable
Invalidate all active sessions for a user by bumping their `tokenVersion`. Any access token they currently hold will be rejected on next use (at token refresh or on routes that re-validate the version).

**Body**: none  
**Response 204**

This does **not** delete the account or block future logins — it only terminates existing sessions. To prevent future login, combine with account-level controls (future feature).

---

## Error Responses

All errors follow the standard envelope:
```json
{
  "status": "error",
  "message": "Human-readable message",
  "code": "ERROR_CODE"
}
```

| HTTP | code | when |
|------|------|------|
| 400 | `VALIDATION_ERROR` | Invalid query params or body |
| 401 | `UNAUTHORIZED` | Missing or expired access token |
| 403 | `FORBIDDEN` | Token valid but user is not a platform admin |
| 404 | `NOT_FOUND` | Hospital or user not found |
| 500 | `INTERNAL_ERROR` | Unhandled server error |

---

## IHospital shape (reference)

```ts
{
  id: string;               // "HSP-xxx"
  name: string;
  type: 'general' | 'specialty' | 'clinic' | 'teaching' | 'other';
  location: string;
  contact: { phone?, email?, address? };
  logoKey?: string;
  subdomain: string;
  customDomain?: string;
  customDomainVerified: boolean;
  modules: { emr: boolean; labs: boolean; assets: boolean; onlineConsultation: boolean };
  plan: 'pro';
  ownerId: string;          // userId of the owner
  timezone: string;
  locale: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## IUser shape (reference, secrets excluded)

```ts
{
  id: string;               // "USR-xxx"
  email: string;
  name: string;
  phone?: string;
  photoKey?: string;
  isEmailVerified: boolean;
  isAdmin: boolean;
  twoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```
