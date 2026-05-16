# Medcord Platform Admin API — QA Handoff

**Base URL**: `http://localhost:8085/admin`

---

## Setup

### Test accounts needed

| Account | Setup |
|---------|-------|
| Platform admin | Any registered user with `isAdmin: true` set directly in DB |
| Regular user (non-admin) | Any registered user, `isAdmin` is `false` by default |
| Unauthenticated | No token |

To bootstrap the first platform admin, set `isAdmin: true` directly in MongoDB on any existing user document. After that, use `PATCH /admin/users/:userId` to promote/demote from within the API.

---

## 1 — Platform Admin Guard

These checks apply to **every** admin endpoint. Test once against any route (e.g. `GET /admin/stats`) and the behaviour is identical everywhere.

| # | Scenario | Input | Expected |
|---|----------|-------|----------|
| G-01 | No token | No `Authorization` header | `401 UNAUTHORIZED` |
| G-02 | Malformed token | `Authorization: Bearer garbage` | `401 UNAUTHORIZED` |
| G-03 | Expired token | Expired JWT | `401 UNAUTHORIZED` |
| G-04 | Valid token, non-admin user | Valid JWT, `isAdmin: false` | `403 FORBIDDEN` |
| G-05 | Valid token, platform admin | Valid JWT, `isAdmin: true` | `200` (route proceeds normally) |

---

## 2 — Stats: `GET /admin/stats`

| # | Scenario | Expected |
|---|----------|----------|
| S-01 | Request as platform admin | `200` with `data.stats` containing all six keys: `hospitals.total`, `hospitals.active`, `hospitals.archived`, `users.total`, `users.admins`, `users.twoFactorEnabled`, `recentSignups.last7d`, `recentSignups.last30d`, `recentHospitals.last7d`, `recentHospitals.last30d` |
| S-02 | `hospitals.active + hospitals.archived = hospitals.total` | Verify arithmetic consistency in the response |
| S-03 | Create a new user, re-fetch stats | `users.total` increments by 1; `recentSignups.last7d` and `last30d` each increment by 1 |
| S-04 | Create a new hospital, re-fetch stats | `hospitals.total` and `hospitals.active` each increment by 1 |
| S-05 | Archive a hospital, re-fetch stats | `hospitals.active` decrements by 1; `hospitals.archived` increments by 1; `hospitals.total` unchanged |

---

## 3 — Hospitals

### 3.1 `GET /admin/hospitals`

| # | Scenario | Input | Expected |
|---|----------|-------|----------|
| H-L-01 | No params | — | `200`, all hospitals, paginated at 20 per page |
| H-L-02 | `?page=1&limit=5` | — | Returns ≤ 5 items; `totalPages` = ceil(total/5) |
| H-L-03 | `?limit=101` | — | `400 VALIDATION_ERROR` (max is 100) |
| H-L-04 | `?isArchived=false` | — | Only non-archived hospitals |
| H-L-05 | `?isArchived=true` | — | Only archived hospitals |
| H-L-06 | `?q=<name substring>` | Partial name match | Returns matching hospitals; case-insensitive |
| H-L-07 | `?q=<subdomain substring>` | Partial subdomain match | Returns matching hospitals |
| H-L-08 | `?q=zzznomatch` | — | `200`, `items: []`, `total: 0` |
| H-L-09 | `?isArchived=banana` | — | `isArchived` treated as `false` (string `"banana" !== "true"`) — verify no 400 |

### 3.2 `GET /admin/hospitals/:hospitalId`

| # | Scenario | Expected |
|---|----------|----------|
| H-G-01 | Valid existing hospitalId | `200`, `data.hospital` (IHospital shape), `data.memberCount` (integer ≥ 0) |
| H-G-02 | `memberCount` correctness | Add a member to the hospital, re-fetch — `memberCount` increments by 1 |
| H-G-03 | Non-existent hospitalId | `404 NOT_FOUND` |
| H-G-04 | Malformed ID (e.g. random string) | `404 NOT_FOUND` |

### 3.3 `PATCH /admin/hospitals/:hospitalId`

| # | Scenario | Body | Expected |
|---|----------|------|----------|
| H-P-01 | Archive a hospital | `{ "isArchived": true }` | `200`, `hospital.isArchived: true` |
| H-P-02 | Restore an archived hospital | `{ "isArchived": false }` | `200`, `hospital.isArchived: false` |
| H-P-03 | Disable a module | `{ "modules": { "labs": false } }` | `200`, `hospital.modules.labs: false`; other modules unchanged |
| H-P-04 | Enable a module | `{ "modules": { "onlineConsultation": true } }` | `200`, `hospital.modules.onlineConsultation: true` |
| H-P-05 | Partial modules object | `{ "modules": { "emr": true } }` | Only `emr` changes; `labs`, `assets`, `onlineConsultation` unchanged |
| H-P-06 | Empty body `{}` | — | `200`, hospital returned unchanged |
| H-P-07 | Extra unknown field | `{ "name": "Hacked" }` | `200`, unknown field silently ignored; name unchanged |
| H-P-08 | Non-existent hospitalId | `{ "isArchived": false }` | `404 NOT_FOUND` |
| H-P-09 | Invalid `isArchived` type | `{ "isArchived": "yes" }` | `400 VALIDATION_ERROR` |

### 3.4 `DELETE /admin/hospitals/:hospitalId`

> **Hard delete** — removes the DB document permanently. Distinct from the hospital owner's archive action which only sets `isArchived: true`.

| # | Scenario | Expected |
|---|----------|----------|
| H-D-01 | Delete an existing hospital | `204 No Content` |
| H-D-02 | Verify deletion | After H-D-01, `GET /admin/hospitals/:hospitalId` returns `404` |
| H-D-03 | Stats update after delete | `GET /admin/stats` — `hospitals.total` decrements by 1 |
| H-D-04 | Delete a non-existent hospitalId | `404 NOT_FOUND` |
| H-D-05 | Delete same hospital twice | First `204`; second `404` |

---

## 4 — Users

### 4.1 `GET /admin/users`

| # | Scenario | Input | Expected |
|---|----------|-------|----------|
| U-L-01 | No params | — | `200`, all users, paginated |
| U-L-02 | `?q=<name substring>` | Partial name match | Matching users returned; case-insensitive |
| U-L-03 | `?q=<email substring>` | Partial email match | Matching users returned |
| U-L-04 | `?isAdmin=true` | — | Only users where `isAdmin: true` |
| U-L-05 | `?isAdmin=false` | — | Only users where `isAdmin: false` |
| U-L-06 | `?page=2&limit=10` | — | Correct offset applied; `page: 2` in response |
| U-L-07 | No secrets in response | — | Response must NOT include `passwordHash`, `twoFactorSecret`, `pendingTwoFactorSecret`, `tokenVersion` fields on any user object |

### 4.2 `GET /admin/users/:userId`

| # | Scenario | Expected |
|---|----------|----------|
| U-G-01 | Valid userId | `200`, `data.user` (IUser shape), `data.memberships` (array) |
| U-G-02 | User with no hospital memberships | `data.memberships: []` |
| U-G-03 | User with memberships | `data.memberships` contains objects with `id`, `hospitalId`, `userId`, `role`, `status`, `joinedAt` |
| U-G-04 | Non-existent userId | `404 NOT_FOUND` |
| U-G-05 | No secrets in response | `data.user` must not include `passwordHash`, `twoFactorSecret`, `pendingTwoFactorSecret`, `tokenVersion` |

### 4.3 `PATCH /admin/users/:userId`

| # | Scenario | Body | Expected |
|---|----------|------|----------|
| U-P-01 | Promote user to platform admin | `{ "isAdmin": true }` | `200`, `user.isAdmin: true`; user can now call admin endpoints successfully |
| U-P-02 | Demote platform admin | `{ "isAdmin": false }` | `200`, `user.isAdmin: false`; user gets `403` on next admin request |
| U-P-03 | Manually verify email | `{ "isEmailVerified": true }` | `200`, `user.isEmailVerified: true` |
| U-P-04 | Both fields at once | `{ "isAdmin": true, "isEmailVerified": true }` | `200`, both fields updated |
| U-P-05 | Empty body `{}` | — | `200`, user unchanged |
| U-P-06 | Non-existent userId | `{ "isAdmin": true }` | `404 NOT_FOUND` |
| U-P-07 | Invalid `isAdmin` type | `{ "isAdmin": "yes" }` | `400 VALIDATION_ERROR` |
| U-P-08 | Self-demotion | Admin calls with their own userId, `{ "isAdmin": false }` | `200`; subsequent admin request from that token returns `403` (no self-protection) |

### 4.4 `POST /admin/users/:userId/disable`

This bumps the user's `tokenVersion`, invalidating all current sessions. It does **not** delete the account or prevent future logins.

| # | Scenario | Expected |
|---|----------|----------|
| D-01 | Disable an active user | `204 No Content` |
| D-02 | Token invalidated immediately | After D-01, the disabled user's current access token is rejected (any protected route returns `401`) |
| D-03 | User can still log in after disable | Disabled user logs in fresh → receives a new valid access token |
| D-04 | Non-existent userId | `404 NOT_FOUND` |
| D-05 | Call twice on same user | Both calls return `204`; no error on second call |

---

## 5 — Error Response Shape

All error responses across all admin endpoints must conform to:

```json
{
  "error": {
    "code": "snake_case_code",
    "message": "<human-readable string>"
  }
}
```

Validation errors also include a `field_errors` object:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Validation failed",
    "field_errors": { "isArchived": ["Expected boolean, received string"] }
  }
}
```

| HTTP | `error.code` | when |
|------|-------------|------|
| 400 | `validation_error` | Invalid query params or body |
| 401 | `unauthorized` | Missing or expired access token |
| 403 | `forbidden` | Token valid but user is not a platform admin |
| 404 | `not_found` | Hospital or user not found |
| 500 | `internal` | Unhandled server error |

Verify the shape for: `401` (G-01), `403` (G-04), `404` (H-G-03), `400` (H-L-03), and `500` (trigger by inserting a corrupt hospital document directly into the DB).

---

## 6 — Cross-cutting Checks

| # | Check |
|---|-------|
| X-01 | All timestamps (`createdAt`, `updatedAt`, `joinedAt`) are ISO 8601 strings, not Unix integers |
| X-02 | Hospital `id` values are prefixed `HSP-`; user `id` values are prefixed `USR-`; membership `id` values are prefixed `MBR-` |
| X-03 | `PATCH /admin/hospitals/:hospitalId` with `modules` only writes the provided sub-fields — does not wipe unspecified module toggles |
| X-04 | `DELETE /admin/hospitals/:hospitalId` does NOT cascade-delete hospital members, patients, or EMR records (verify those collections still have their documents after deletion) |
| X-05 | Promoting a regular user to `isAdmin: true` does not change any of their hospital-scoped `StaffRole` values (verify their `HospitalMember` role is unchanged) |
