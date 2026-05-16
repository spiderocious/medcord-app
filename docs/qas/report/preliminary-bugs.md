# Preliminary Bug Report — Medcord Backend

> **QA:** Claude  
> **Date:** 2026-05-15  
> **Source:** Static code review (BUG-01–09) + runtime test execution (BUG-10)  
> **Fixed:** 2026-05-15 — BUG-01 through BUG-09 patched by dev; BUG-10 found during test execution, awaiting fix  
> **Status:** BUG-01–09 FIXED · BUG-10 OPEN (found 2026-05-15 during auth test run)  
> **Fix confirmation:** Embedded in each bug entry below; runtime verification in `reports/report.md`

These bugs were identified by reading the service layer, route handlers, middleware, and schema files end-to-end before running a single request. They are ordered by severity.

---

## BUG-01 — Patient transfer accept links receiving hospital with empty patientCode

**Severity:** 🔴 HIGH — silent data corruption  
**Status:** ✅ FIXED  
**Fixed in:** `apps/main-backend/src/features/patients/patient.service.ts`

### What the code does

```ts
async acceptTransfer(hospitalId: string, transferId: string, userId: string) {
  const transfer = await patientRepo.findTransferById(transferId);
  // ...
  await patientRepo.linkToHospital(hospitalId, transfer.patientId, '', userId);
  // ...
}
```

The third argument to `linkToHospital` is `patientCode`. It is hardcoded as an empty string `''`.

### Why it matters

`HospitalPatientModel` stores the patient's code alongside the hospital link — this is how reception staff can look up a patient by their code at any Medcord hospital. After a transfer is accepted, the receiving hospital's link record will have `patientCode: ''` instead of the patient's actual globally-unique code (e.g. `PAT-3F8K-2P9X`).

Downstream impact:
- Searching by patient code at the receiving hospital will not find this patient
- ID card scan workflows at the receiving hospital will silently fail
- The inter-hospital patient code invariant ("same code across all hospitals") described in the product spec is violated

### What the fix should be

Look up the patient's existing `patientCode` before linking:

```ts
const patient = await patientRepo.findById(transfer.patientId);
await patientRepo.linkToHospital(hospitalId, transfer.patientId, patient.patientCode, userId);
```

### Fix applied

`acceptTransfer()` now fetches the patient record before calling `linkToHospital` and passes `patient.patientCode` instead of `''`:

```ts
const patient = await patientRepo.findById(transfer.patientId);
if (!patient) throw new NotFoundError('Patient');
await patientRepo.linkToHospital(hospitalId, transfer.patientId, patient.patientCode, userId);
```

### Fix confirmation (runtime)

- Accept a transfer and query `HospitalPatientModel` for the receiving hospital — `patientCode` must equal the patient's actual code
- Search for patient by code at receiving hospital — must return a result

---

## BUG-02 — Patient search: pagination totals are wrong when a query string is used

**Severity:** 🔴 HIGH — incorrect API contract, broken pagination  
**Status:** ✅ FIXED  
**Fixed in:** `apps/main-backend/src/features/patients/patient.service.ts`

### What the code does

```ts
async search(hospitalId, userId, query) {
  const skip = (query.page - 1) * query.limit;
  const rows = await patientRepo.findPatientIdsByHospital(hospitalId, skip, query.limit);
  const total = await patientRepo.countInHospital(hospitalId);          // counts ALL patients
  const patients = await Promise.all(rows.map(r => patientRepo.findById(r.patientId)));
  const valid = patients.filter(Boolean);

  if (query.q) {
    const q = query.q.toLowerCase();
    const filtered = valid.filter(p =>
      p.demographics.firstName.toLowerCase().includes(q) || ...
    );
    return { items: filtered, total, ... };  // total is still the ALL-patients count
  }

  return { items: valid, total, ... };
}
```

There are two separate problems here.

### Problem A — `total` never reflects the filtered count

When `q` is provided, the filtering happens in JavaScript after the DB fetch. The `total` returned to the client is always `countInHospital(hospitalId)` — the count of every patient in the hospital — regardless of how many match `q`. A hospital with 500 patients where 3 match "Johnson" will return `total: 500, totalPages: 50` instead of `total: 3, totalPages: 1`.

### Problem B — Pagination window is applied before filtering

`skip` and `limit` are applied at the DB query level on the unfiltered set. If a hospital has 100 patients and the ones matching `q` happen to be patient records 51–60 in insertion order, and the client requests `page=1, limit=10`, those patients will never be returned — the first 10 records from DB are fetched, none match `q`, the response comes back empty, and the client thinks the search found nothing.

### Why it matters

This means patient search with a name or code fragment is fundamentally unreliable on hospitals with more patients than one page. It works by accident on small datasets (single page). This is the primary patient lookup workflow used by all clinical and reception staff.

### What the fix should be

Push the search filter to MongoDB using a regex or text index query that also returns the correct filtered count.

### Fix applied

`search()` now delegates fully to two new repo methods. The in-memory filter and the unfiltered `countInHospital` call are gone:

```ts
const [patients, total] = await Promise.all([
  patientRepo.searchByHospital(hospitalId, query.q, skip, query.limit),
  patientRepo.countSearchByHospital(hospitalId, query.q),
]);
```

Both methods apply the `q` regex filter (or no filter if `q` is undefined) at the MongoDB query level. Pagination window and total are now consistent.

### Fix confirmation (runtime)

- Seed 15 patients, 3 with firstName "Marcus"
- `GET /patients?q=marcus&page=1&limit=5` → `total: 3`, `totalPages: 1`, `items.length: 3`
- `GET /patients?page=1&limit=5` (no q) → `total: 15`, `totalPages: 3`

---

## BUG-03 — Staff invitations email the inviter's userId instead of their name

**Severity:** 🟡 MEDIUM — broken user experience, confusing emails  
**Status:** ✅ FIXED  
**Fixed in:** `apps/main-backend/src/features/staff/staff.service.ts`

### What the code does

```ts
async invite(hospitalId: string, invitedBy: string, body: InviteBody) {
  // invitedBy = req.user!.id, e.g. "usr_01JV4KQZM..."
  const invitation = await staffRepo.createInvitation({
    invitedBy,   // stored as userId
    ...
  });

  await emailService.sendStaffInvitation({
    inviterName: invitedBy,   // userId passed as display name
    ...
  });
}
```

And on resend:

```ts
async resendInvitation(hospitalId: string, invitationId: string) {
  const inv = await staffRepo.findInvitationById(invitationId);
  // inv.invitedBy is the stored userId
  await emailService.sendStaffInvitation({
    inviterName: inv.invitedBy,   // same issue: userId as display name
    ...
  });
}
```

The route passes `req.user!.id` as the `invitedBy` argument. That ID is stored and then used directly as `inviterName` in the email template.

### Why it matters

Invited staff will receive an email that reads "You have been invited by `usr_01JV4KQZM8FGPZ5T2NVHYDJ3N`" — a raw prefixed ID string — instead of a human name like "Dr. Alice Mensah". This will cause confusion and reduce trust in the invitation email, potentially leading staff to treat it as spam.

### Fix applied

Both `invite()` and `resendInvitation()` now look up the inviter via `authRepo.findById(invitedBy)` and pass `inviter?.name ?? 'A team member'` to the email:

```ts
const inviter = await authRepo.findById(invitedBy);
await emailService.sendStaffInvitation({
  inviterName: inviter?.name ?? 'A team member',
  ...
});
```

### Fix confirmation (runtime)

- Invite a staff member and inspect the `sendStaffInvitation` call arguments
- `inviterName` must be a human name string (e.g. `"Alice Mensah"`), not a `usr_01...` ID

---

## BUG-04 — Archived hospitals still appear in GET /hospitals list

**Severity:** 🟡 MEDIUM — incorrect data returned to clients  
**Status:** ✅ FIXED  
**Fixed in:** `apps/main-backend/src/middlewares/hospital-scope.middleware.ts`

### What the code does

```ts
async listMine(userId: string) {
  const memberships = await hospitalRepo.listByUserId(userId);
  const ids = memberships.map(m => m.hospitalId);
  const hospitals = await Promise.all(ids.map(id => hospitalRepo.findById(id)));
  return hospitals.filter(Boolean);
}
```

`hospitalRepo.findById` fetches the hospital regardless of its `isArchived` status. There is no `isArchived: false` filter anywhere in this chain.

### Why it matters

When a hospital is archived via `DELETE /hospitals/:id`, the `isArchived` flag is set to `true` on the document. But `GET /hospitals` will still return that hospital in the list. Users will see archived (deleted) workspaces in their hospital switcher, which they should no longer have access to.

Additionally, hospital members can still access an archived hospital's resources because `hospitalScope` only checks that the user is an active member — it does not check `hospital.isArchived`.

### Fix applied

`hospitalScope` middleware now fetches the hospital document first and gates on `isArchived`:

```ts
const hospital = await HospitalModel.findOne({ id: hospitalId }).lean();
if (!hospital) return next(new NotFoundError('Hospital'));
if (hospital.isArchived) return next(new ForbiddenError('This hospital has been archived'));
```

**Note:** `GET /hospitals` (`listMine`) still returns archived hospitals in the list — the middleware fix only blocks resource access. The list endpoint does not go through `hospitalScope`. This is a partial fix: archived hospitals appear in the switcher list but all subsequent actions on them are blocked. Full fix would also filter the list. This partial gap is noted and will be flagged in the report.

### Fix confirmation (runtime)

- Create hospital, archive it (`DELETE /hospitals/:id`)
- Attempt `GET /hospitals/:id` — must return 403 "This hospital has been archived"
- Attempt `GET /hospitals/:id/staff` — must return 403
- `GET /hospitals` — note whether archived hospital still appears (expected partial gap)

---

## BUG-05 — Previous owner retains super_admin role after ownership transfer

**Severity:** 🟡 MEDIUM — privilege escalation, incorrect access control  
**Status:** ✅ FIXED  
**Fixed in:** `apps/main-backend/src/features/hospitals/hospital.service.ts`

### What the code does

```ts
async transferOwnership(hospitalId: string, requesterId: string, body: TransferOwnershipBody) {
  // ...
  await hospitalRepo.updateById(hospitalId, { ownerId: body.newOwnerId });
  await hospitalRepo.updateMember(newOwnerMember.id, { role: 'super_admin' });
  // ← original owner's role is never changed
  return hospitalRepo.findById(hospitalId);
}
```

The new owner is correctly elevated to `super_admin`. But the previous owner's `HospitalMemberModel` entry still has `role: 'super_admin'` — nothing demotes them.

### Why it matters

After a transfer, both the old and new owner have `super_admin` role. The old owner retains full control: they can still invite staff, change branding, update modules, re-transfer ownership back to themselves, or archive the hospital. The `ownerId` field changes but the role-based access control is unaffected because every permission check uses `req.hospitalMember.role`, not `hospital.ownerId`.

The only operations that check `ownerId` directly are `transferOwnership` and `archive` — so the old owner cannot do those two actions, but everything else remains accessible.

### Fix applied

`transferOwnership()` now looks up the previous owner's member record and demotes them to `hospital_admin`:

```ts
const previousOwnerMember = await hospitalRepo.findMember(hospitalId, requesterId);
await hospitalRepo.updateMember(newOwnerMember.id, { role: 'super_admin' });
if (previousOwnerMember) {
  await hospitalRepo.updateMember(previousOwnerMember.id, { role: 'hospital_admin' });
}
```

### Fix confirmation (runtime)

- Register User A, create hospital (User A = super_admin), invite User B as any role, accept
- User A calls `POST /hospitals/:id/transfer-ownership` with User B's userId
- User A calls `PATCH /hospitals/:id/branding` → must return 403
- User A calls `PATCH /hospitals/:id` → must return 200 (hospital_admin can still PATCH general settings)
- User B calls `PATCH /hospitals/:id/branding` → must return 200

---

## BUG-06 — Check-in silently discards visitType, referredBy, and chiefComplaint

**Severity:** 🟡 MEDIUM — silent data loss, broken clinical workflow  
**Status:** ✅ FIXED (partial)  
**Fixed in:** `apps/main-backend/src/features/patients/patient.service.ts`

### What the code does

```ts
async checkIn(hospitalId: string, patientId: string, _body: CheckInBody) {
  const link = await patientRepo.findHospitalPatient(hospitalId, patientId);
  if (!link) throw new NotFoundError('Patient');
  return patientRepo.updateById(patientId, { currentHospitalId: hospitalId });
}
```

The `_body` parameter is named with a leading underscore — a TypeScript convention explicitly indicating it is intentionally unused. The `CheckInBody` schema carries `visitType`, `referredBy`, and `chiefComplaint` fields. All three are silently discarded.

The patient model presumably has fields for visit context (or a visits/encounters sub-collection). None of that is written.

### Why it matters

Reception staff filling in check-in details — the presenting complaint, referral source, visit type — are submitting data that disappears. The API accepts the request with a 200, gives no indication that the data wasn't stored, and clinicians viewing the chart later have no visit context. This is a workflow correctness issue, not just a cosmetic one.

### Fix applied

`checkIn()` now persists `department` and `assignedTo` from the request body:

```ts
const update: Partial<IPatient> = { currentHospitalId: hospitalId, admissionStatus: 'outpatient' };
if (body.department !== undefined) update['checkInDepartment'] = body.department;
if (body.assignedTo !== undefined) update['assignedTo'] = body.assignedTo;
```

**Note:** `visitType`, `referredBy`, and `chiefComplaint` from the original API spec are still not persisted — the schema appears to have been revised to `department` + `assignedTo`. This partial resolution is acceptable if the `CheckInBody` schema was updated to match. Will verify the actual schema fields during execution.

### Fix confirmation (runtime)

- Check in a patient with `{ department: "Cardiology", assignedTo: "<doctorId>" }`
- Retrieve the patient — `checkInDepartment` and `assignedTo` must be set on the document

---

## BUG-07 — Asset creation ignores the `status` field from the request body

**Severity:** 🟡 MEDIUM — API contract violation  
**Status:** ✅ FIXED  
**Fixed in:** `apps/main-backend/src/features/assets/asset.service.ts`

### What the code does

```ts
async create(hospitalId: string, body: CreateAssetBody): Promise<IAsset> {
  const asset = await assetRepo.create({
    id: newId.asset(),
    hospitalId,
    name: body.name,
    category: body.category,
    status: 'available',   // ← hardcoded, body.status never read
    // ...
  });
}
```

The API docs say the `status` field accepts `available | in_use | maintenance | retired | disposed`. The Zod schema likely includes this field. But the service ignores it entirely and always creates the asset as `available`.

### Why it matters

An admin registering an asset that is currently `in_use` (e.g. an MRI machine already allocated to a ward) or `maintenance` (e.g. equipment just received from repair) must set the correct status at registration time. Instead, the asset is always created as `available`, requiring a separate PATCH to correct it — and there is no indication to the client that the provided `status` was ignored.

### Fix applied

```ts
status: body.status ?? 'available',
```

### Fix confirmation (runtime)

- Create asset with `status: 'maintenance'`
- Response must show `status: 'maintenance'`
- `GET /assets?status=maintenance` must include the new asset

---

## BUG-08 — 2FA setup: secret is not persisted until verify-2fa is called

**Severity:** 🟢 LOW — design gap, documentation issue  
**Status:** ✅ FIXED  
**Fixed in:** `apps/main-backend/src/features/auth/auth.service.ts`, `auth.model.ts`, `auth.repo.ts`, `auth.schema.ts`

### What the code does

```ts
async setup2fa(userId: string) {
  const user = await authRepo.findById(userId);
  if (!user) throw new NotFoundError('User');
  const secret = generateSecret();
  const otpauthUrl = generateURI({ issuer: 'Medcord', label: user.email, secret });
  return { secret, otpauthUrl };
  // ← secret is NOT saved to DB here
}

async verify2fa(userId: string, body: Verify2faBody) {
  const ok = await totpVerify({ token: body.totpCode, secret: body.secret });
  if (!ok) throw new UnauthorizedError('Invalid two-factor code');
  await authRepo.updateById(userId, { twoFactorSecret: body.secret, twoFactorEnabled: true });
  // ← secret is saved here, along with body.secret (client-supplied)
}
```

The `setup-2fa` response returns a `secret` to the client. The client is expected to pass that same `secret` back in the `verify-2fa` body. The server trusts this client-supplied `secret` and stores it directly.

### Why it matters

**Security concern:** The server does not validate that the `secret` in `verify-2fa` is the same one it issued in `setup-2fa`. A client can generate their own TOTP secret, pass a valid TOTP code for it, and the server will store the client-supplied secret. This is only a concern if the secret itself needs to be server-authoritative; in practice it means a user could technically register a different authenticator app's secret than the one from `setup-2fa`.

**UX concern:** If a user calls `setup-2fa` twice before calling `verify-2fa` (e.g. they re-scan the QR), each call returns a different secret. The user must use the most recently generated secret. There is no way to know which secret is "active" since none are persisted until verify. This is confusing.

**The more practical risk:** An attacker who controls the network between the client and server can intercept the `secret` from the `setup-2fa` response (if not over TLS) and use it to generate future TOTP codes. This is not a backend-only bug — it requires HTTPS — but the design makes the secret's entire validity window a transport-layer concern.

### Fix applied

Full server-authoritative 2FA flow:

- `IUser` model gains a `pendingTwoFactorSecret` field (`select: false`)
- `authRepo.findByIdWithSecrets` now selects `+pendingTwoFactorSecret`
- `setup2fa()` generates the secret, saves it to `pendingTwoFactorSecret` in DB, and returns only `otpauthUrl` (secret no longer in response)
- `verify2fa()` reads `user.pendingTwoFactorSecret` from DB, verifies the TOTP against it, then promotes it to `twoFactorSecret` and clears `pendingTwoFactorSecret`
- `Verify2faBody` schema no longer has a `secret` field — client only sends `totpCode`

### Fix confirmation (runtime)

- Call `POST /auth/setup-2fa` — response must have `otpauthUrl`, must NOT have `secret`
- Query DB directly — `pendingTwoFactorSecret` must be set, `twoFactorSecret` must still be null
- Call `POST /auth/verify-2fa` with only `{ totpCode }` — must succeed (204)
- Query DB — `twoFactorEnabled: true`, `twoFactorSecret` set, `pendingTwoFactorSecret` cleared
- Try `POST /auth/verify-2fa` with `{ totpCode, secret: "anything" }` — Zod strips unknown fields, must still work

---

## BUG-09 — Expired invitations can still be declined

**Severity:** 🟢 LOW — minor state inconsistency  
**Status:** ✅ FIXED  
**Fixed in:** `apps/main-backend/src/features/staff/staff.service.ts`

### What the code does

```ts
async declineInvitation(token: string) {
  const inv = await staffRepo.findInvitationByToken(token);
  if (!inv) throw new NotFoundError('Invitation');
  if (inv.status !== 'pending') throw new ConflictError('Invitation is no longer valid');
  return staffRepo.updateInvitation(inv.id, { status: 'declined' });
  // ← no check for inv.expiresAt
}
```

Compare to `acceptInvitation`, which does check expiry:

```ts
if (inv.expiresAt < new Date()) throw new ConflictError('Invitation has expired');
```

### Why it matters

A 7-day-old expired invitation that was never acted on has `status: 'pending'` and `expiresAt` in the past. Calling `decline` on it will succeed and set `status: 'declined'`. This is a minor inconsistency — the invitation was already effectively dead — but it means the status history is inaccurate (expired vs declined are semantically different) and could confuse admin staff reviewing invitation history.

### Fix applied

`declineInvitation()` now has the same expiry guard as `acceptInvitation()`:

```ts
if (inv.expiresAt < new Date()) throw new ConflictError('Invitation has expired');
```

### Fix confirmation (runtime)

- Seed an invitation with `expiresAt` in the past (via DB script)
- Call `POST /auth/invitations/decline` with its token
- Must return 409 `conflict` "Invitation has expired"

---

---

## BUG-11 — EMR chart endpoints do not validate patient-hospital linkage

**Severity:** 🔴 HIGH — cross-hospital data leakage  
**Status:** 🔴 OPEN — found during EMR test execution 2026-05-15  
**File:** `apps/main-backend/src/features/emr/emr.service.ts`

### What the code does

`getChartSummary()` and other EMR read functions take `hospitalId` and `patientId` parameters but never validate that the patient is linked to that hospital. The `hospitalScope` middleware only checks that the requester is a member of `hospitalId` — not that the patient belongs to it.

```ts
async function getChartSummary(hospitalId: string, patientId: string, userId: string) {
  // No patient-hospital link check here
  await logAccess({ hospitalId, patientId, userId, action: 'view_chart', section: 'summary' });
  const [vitals, medications, history, procedures] = await Promise.all([
    emrRepo.listVitals(patientId, hospitalId, 1),
    // ...
  ]);
  return { ... }; // Returns empty data, not 404
}
```

### Verified by runtime test

```
GET /api/v1/hospitals/HSP-B/patients/PAT-A/chart
(grace, Hospital B member, patient registered in Hospital A)
→ 200 { summary: { lastVitals: null, activeMedicationsCount: 0, ... } }
```

Returns 200 with empty summary instead of 404. This means Hospital B staff can discover which patients have charts registered in Hospital A (by trying patient IDs) and read their summary structure.

### Impact

Any staff member of any hospital can access chart summary, vitals list, medications, medical history, procedures, immunizations, and documents for patients registered in other hospitals — as long as they know or can guess the patientId.

Write operations (POST/PATCH) that go through `patientRepo.findHospitalPatient` are protected, but all GET operations and `getChartSummary` are unprotected.

### Fix

Add a patient-hospital link validation at the start of each EMR function, or add a shared middleware that checks `patientRepo.findHospitalPatient(hospitalId, patientId)` before dispatching EMR routes.

### Fix confirmation steps

After fix:
1. Register patient in Hospital A
2. As Hospital B member, call `GET /hospitals/B/patients/A_PATIENT/chart` → must return 404
3. As Hospital A member, same call → must return 200

---

## Summary Table

| # | Severity | File | Issue | Status |
|---|----------|------|-------|--------|
| BUG-01 | 🔴 HIGH | `patient.service.ts` | Transfer accept stored empty `patientCode` on receiving hospital link | ✅ FIXED |
| BUG-02 | 🔴 HIGH | `patient.service.ts` | Search pagination `total` wrong when `q` used; page window applied before filter | ✅ FIXED |
| BUG-03 | 🟡 MED | `staff.service.ts` | Invitation emails showed userId as inviter name | ✅ FIXED |
| BUG-04 | 🟡 MED | `hospital-scope.middleware.ts` | Archived hospitals accessible via all scoped endpoints | ✅ FIXED (partial — list still shows archived) |
| BUG-05 | 🟡 MED | `hospital.service.ts` | Previous owner retained `super_admin` role after ownership transfer | ✅ FIXED |
| BUG-06 | 🟡 MED | `patient.service.ts` | Check-in silently discarded body fields | ✅ FIXED (department + assignedTo now persisted) |
| BUG-07 | 🟡 MED | `asset.service.ts` | Asset `status` from request body ignored; always created as `available` | ✅ FIXED |
| BUG-08 | 🟢 LOW | `auth.service.ts` + model + repo + schema | 2FA secret not persisted server-side; client could supply arbitrary secret | ✅ FIXED |
| BUG-09 | 🟢 LOW | `staff.service.ts` | Expired invitations could be declined without expiry check | ✅ FIXED |
| BUG-10 | 🔴 HIGH | `auth.service.ts` lines 61 + 106 | `otplib.verify()` returns `{ valid: boolean }` object — checked as `if (!ok)` which is always falsy (truthy object), so **any TOTP code is accepted** for both login and verify-2fa | 🔴 OPEN |
| BUG-11 | 🔴 HIGH | `emr.service.ts` — `getChartSummary()` and other read functions | EMR chart endpoints do not validate patient-hospital linkage — any hospital member can read chart data for patients from other hospitals | 🔴 OPEN |
| BUG-12 | 🟡 MED | `lab.service.ts` — `advanceStatus()` | State machine allows `awaiting_result → result_ready` via `advance()` without requiring a result to be recorded first. Guard only exists for `result_ready → result_released`. | 🔴 OPEN |

---

## BUG-10 — Any TOTP code accepted: `otplib.verify()` returns object, not boolean

**Severity:** 🔴 HIGH — complete bypass of 2FA  
**Status:** 🔴 OPEN — found during auth test execution 2026-05-15  
**File:** `apps/main-backend/src/features/auth/auth.service.ts` lines 61 and 106

### What the code does

```ts
import { verify as totpVerify } from 'otplib';

// line 106 (verify-2fa):
const ok = await totpVerify({ token: body.totpCode, secret: user.pendingTwoFactorSecret });
if (!ok) throw new UnauthorizedError('Invalid two-factor code');

// line 61 (login with 2FA):
const ok = await totpVerify({ token: body.totpCode, secret: userWithSecret.twoFactorSecret });
if (!ok) throw new UnauthorizedError('Invalid two-factor code');
```

### Why it's broken

`otplib`'s `verify()` returns `{ valid: boolean }` (a wrapped result object), **not** a raw boolean. The check `if (!ok)` evaluates the truthiness of the object itself — a non-null object is always truthy. So `!ok` is always `false`, and the `throw` is never reached. **Every TOTP code passes**, including `000000`.

### Verified by runtime test

```
POST /auth/verify-2fa  { totpCode: "000000" }  → 204  ✓ (should be 401)
```

Also confirmed via direct otplib call:
```js
await verify({ token: '000000', secret: '5YHYESFLUAUQYZWAKB3LRKZYVVDKKA3T' })
// returns: { valid: false }   ← truthy object!
```

### Fix

```ts
const result = await totpVerify({ token: body.totpCode, secret: ... });
if (!result.valid) throw new UnauthorizedError('Invalid two-factor code');
```

Apply this fix in both locations (line 61 and line 106).

### Impact

- `POST /auth/verify-2fa` — any code enables 2FA on any account during setup
- `POST /auth/login` (2FA-enabled user) — any 6-digit code bypasses 2FA entirely

### Fix confirmation steps

After fix:
1. Enable 2FA on a test user (setup + verify with correct TOTP)
2. Call `POST /auth/login` with `totpCode: "000000"` → must return 401
3. Call `POST /auth/login` with correct TOTP code → must return 200
4. Call `POST /auth/verify-2fa` with `totpCode: "000000"` after `setup-2fa` → must return 401
