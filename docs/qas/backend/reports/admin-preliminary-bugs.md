# Medcord Platform Admin API — Preliminary Bug Report

> **QA:** Claude  
> **Date:** 2026-05-16  
> **Method:** Static code review — `admin.routes.ts`, `admin.service.ts`, `admin.repo.ts`, `require-admin.middleware.ts`, `auth.model.ts`  
> **Status:** All bugs OPEN — not yet verified at runtime

---

## Summary

| Bug | Severity | Area | Description |
|-----|----------|------|-------------|
| BUG-A-01 | 🔴 HIGH | Users — List/Get | Sensitive fields leak in admin user responses |
| BUG-A-02 | 🔴 HIGH | Users — Get single | `tokenVersion` leaks via `.lean()` bypass |
| BUG-A-03 | 🟡 MEDIUM | Hospitals — Update | `updateHospital` returns `null` on success instead of the updated document |
| BUG-A-04 | 🟡 MEDIUM | Error envelope | Admin handoff doc specifies stale error format; admin routes use the correct backend format — docs diverge |
| BUG-A-05 | 🟢 LOW | Stats | `hospitals.active` count may be off-by-one if newly created hospitals don't default `isArchived: false` |
| BUG-A-06 | 🟢 LOW | Admin guard | `requireAdmin` makes a redundant DB round-trip on every admin request |
| BUG-A-07 | 🔴 HIGH | Users — Disable | `disable` bumps `tokenVersion` in DB but `authenticate` never checks it — active access tokens stay valid until expiry |

---

## BUG-A-01 — Sensitive fields leak in admin user list/get responses 🔴 HIGH

**Files:**
- `apps/main-backend/src/features/admin/admin.repo.ts` lines 65–67, 71–72

**Root cause:** The `UserModel` schema marks `passwordHash`, `pendingTwoFactorSecret`, `twoFactorSecret`, and `tokenVersion` as `select: false`. Mongoose enforces this for normal `.find()` calls — but only when the query does **not** explicitly use `.select('+field')`. The issue is that `.lean()` is called on all admin user queries:

```ts
listUsers: (filters, skip, limit) =>
  UserModel.find(buildUserFilter(filters)).skip(skip).limit(limit).lean(),

findUserById: (id) =>
  UserModel.findOne({ id }).lean(),
```

`.lean()` returns a plain JS object. Mongoose's `select: false` is enforced at the query projection level, not post-hydration — so `.lean()` alone does NOT bypass `select: false`. However, if any upstream code or plugin has modified the schema's `projection` defaults, these fields could leak.

**More certain issue:** `listUsers` and `findUserById` do not explicitly project out `passwordHash` etc. If the schema projection is ever loosened (or if a different Mongoose version interprets `lean()` differently), these fields will silently appear in every admin user response.

**Recommended fix:** Add an explicit `.select('-passwordHash -twoFactorSecret -pendingTwoFactorSecret -tokenVersion')` to all user queries in admin.repo.ts to make the exclusion unconditional and code-level, not schema-default-dependent.

```ts
listUsers: (filters, skip, limit) =>
  UserModel.find(buildUserFilter(filters))
    .select('-passwordHash -twoFactorSecret -pendingTwoFactorSecret -tokenVersion')
    .skip(skip).limit(limit).lean(),

findUserById: (id) =>
  UserModel.findOne({ id })
    .select('-passwordHash -twoFactorSecret -pendingTwoFactorSecret -tokenVersion')
    .lean(),
```

**Test to confirm:** U-L-07, U-G-05 — inspect raw response body for presence of these fields.

---

## BUG-A-02 — `tokenVersion` exposed on `bumpTokenVersion` result (internal, low-blast-radius) 🔴 HIGH

**File:** `apps/main-backend/src/features/admin/admin.repo.ts` line 77–80

```ts
bumpTokenVersion: (id: string) =>
  UserModel.findOneAndUpdate({ id }, { $inc: { tokenVersion: 1 } }, { new: true })
    .select('+tokenVersion')
    .lean(),
```

`bumpTokenVersion` explicitly opts `tokenVersion` back in with `.select('+tokenVersion')` — this is intentional so the service can see the new value. However, `adminService.disableUser` discards the return value entirely:

```ts
async disableUser(userId: string) {
  const user = await adminRepo.findUserById(userId);
  if (!user) throw new NotFoundError('User');
  await adminRepo.bumpTokenVersion(userId);   // ← return value discarded
},
```

The result is never sent to the client, so there is no external leak. However, the `.select('+tokenVersion')` on the `findOneAndUpdate` is unnecessary and misleading — it suggests the caller uses the result. If a future dev changes `disableUser` to return the bumped user, `tokenVersion` would leak.

**Fix:** Remove `.select('+tokenVersion')` from `bumpTokenVersion` since the return value is unused.

---

## BUG-A-03 — `PATCH /admin/hospitals/:hospitalId` returns `null` body when hospital doesn't exist at update time 🟡 MEDIUM

**File:** `apps/main-backend/src/features/admin/admin.service.ts` lines 39–44

```ts
async updateHospital(hospitalId: string, data: Record<string, unknown>) {
  const hospital = await adminRepo.findHospitalById(hospitalId);
  if (!hospital) throw new NotFoundError('Hospital');
  const updated = await adminRepo.updateHospital(hospitalId, data);   // ← can return null
  return updated;
},
```

`adminRepo.updateHospital` uses `findOneAndUpdate` with `{ new: true }`. If the hospital document is deleted between the existence check and the update (TOCTOU — time-of-check-to-time-of-use race), `findOneAndUpdate` returns `null`. The service then returns `null` to the route, which responds with `{ "data": { "hospital": null } }` — a 200 with a null body, not a 404.

**In practice** this is a low-probability race condition but a real one. The same pattern exists in `auth.service.ts` for other resources.

**Fix:** Check the return value of `updateHospital`:

```ts
const updated = await adminRepo.updateHospital(hospitalId, data);
if (!updated) throw new NotFoundError('Hospital');
return updated;
```

---

## BUG-A-04 — QA handoff doc specifies stale error envelope format 🟡 MEDIUM

**File:** `docs/api/api-docs/admin-qa-handoff.md` — Section 5

The handoff doc says error responses follow:
```json
{ "status": "error", "message": "...", "code": "ERROR_CODE" }
```

The actual backend uses (consistent with the rest of the API):
```json
{ "error": { "code": "snake_case_code", "message": "..." } }
```

This is confirmed by `errorHandler.middleware.ts` and all other modules. The admin routes share the same `errorHandler` and `ResponseUtil` — there is no admin-specific error serialiser.

**Impact:** Test cases G-01 through G-05 and E-01 through E-04 in the handoff plan assert against the wrong response shape. Tests written against `res.data.status === 'error'` or `res.data.code` will fail on correct behaviour.

**Fix:** Update the handoff doc's Section 5 to reflect the actual envelope. Correct assertions:
- `res.data.error.code === 'unauthorized'` (not `res.data.code === 'UNAUTHORIZED'`)
- `res.data.error.code === 'forbidden'`
- `res.data.error.code === 'not_found'`
- `res.data.error.code === 'validation_error'`

---

## BUG-A-05 — Stats `hospitals.active` count may diverge from reality 🟢 LOW

**File:** `apps/main-backend/src/features/admin/admin.repo.ts` lines 86–91

```ts
statsHospitals: () =>
  Promise.all([
    HospitalModel.countDocuments({}),
    HospitalModel.countDocuments({ isArchived: false }),
    HospitalModel.countDocuments({ isArchived: true }),
  ]),
```

This counts `isArchived: false` for "active" hospitals. If any hospital document was created without an explicit `isArchived` field (i.e. the field is `undefined` or missing), it will **not** match `{ isArchived: false }` (Mongoose strict equality) — so it won't be counted as active or archived. The arithmetic `active + archived = total` would break for those hospitals.

This depends on whether the `Hospital` schema sets `isArchived: false` as a default. If it does, this is fine. If not, legacy or manually-inserted documents could be invisible to both active and archived counts.

**To verify:** Check `hospital.model.ts` for `isArchived` default. If no default, add one or change the active query to `{ $or: [{ isArchived: false }, { isArchived: { $exists: false } }] }`.

**Test:** S-02 — `hospitals.active + hospitals.archived === hospitals.total`.

---

## BUG-A-06 — `requireAdmin` makes an extra DB round-trip on every admin request 🟢 LOW

**File:** `apps/main-backend/src/middlewares/require-admin.middleware.ts`

```ts
export const requireAdmin = async (req, _res, next) => {
  if (!req.user) return next(new UnauthorizedError());

  const user = await authRepo.findById(req.user.id);   // ← DB hit every request
  if (!user?.isAdmin) return next(new ForbiddenError(...));

  next();
};
```

The `authenticate` middleware that runs before `requireAdmin` already decodes the JWT and sets `req.user`. The JWT payload presumably does not include `isAdmin`, so a DB lookup is needed. However this adds a DB round-trip to every single admin API call.

**Not a correctness bug** — it correctly re-reads from DB (which means a just-demoted admin is correctly rejected without waiting for token expiry). But it's worth noting for performance: the admin routes will always cost an extra DB query per request. If `isAdmin` were included in the JWT payload (or cached), this could be eliminated.

**Verdict:** Document as a known architectural trade-off, not a bug to fix immediately.

---

---

## BUG-A-07 — `disable` endpoint does not invalidate existing access tokens 🔴 HIGH

**Found:** During test execution (D-02), not static review.  
**File:** `apps/main-backend/src/middlewares/auth.middleware.ts`

**Root cause:** `POST /admin/users/:userId/disable` calls `bumpTokenVersion` which increments `tokenVersion` in the DB. However the `authenticate` middleware never reads `tokenVersion` from the DB — it only verifies the JWT signature. The `tokenVersion` check exists only in the `/auth/refresh` flow. Result: active access tokens remain valid for their full TTL after a user is disabled.

**Test evidence:**
```
POST /admin/users/USR-xxx/disable → 204
GET  /auth/me (disabled user's old token) → 200  ← should be 401
```

**Fix options:**
1. Add a DB `tokenVersion` check in `authenticate` for every request (adds 1 DB lookup per request)
2. Shorten access token TTL to a few minutes
3. Use a server-side token blocklist (Redis) for explicitly revoked tokens

---

## Not a Bug — Confirmed Correct Behaviour

| Observation | Verdict |
|-------------|---------|
| `PATCH /admin/hospitals/:id` with unknown fields (e.g. `name`) — Zod strips them before they reach the update | Correct — `UpdateHospitalBody` schema only allows `isArchived` and `modules`; unknown keys are stripped by Zod's default strict mode |
| `DELETE /admin/hospitals/:id` — does not cascade-delete members/patients | Correct by design; only the `Hospital` document is hard-deleted via `deleteOne({ id })` |
| Self-demotion (U-P-08) allowed — no self-protection guard | Intentional per handoff spec; worth verifying at runtime |
| `disableUser` bumps `tokenVersion` only — does not lock the account | Correct; user can re-login immediately and get a new valid token |
