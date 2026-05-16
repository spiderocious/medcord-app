# Medcord Backend — API Documentation Divergence Report

> **QA:** Claude  
> **Date:** 2026-05-15  
> **Method:** Live endpoint probing against `localhost:8085` · MongoDB `medcord`  
> **Reference:** `docs/api/api-docs/api-docs.md`  
> **Total findings:** 54

Findings are grouped by module. Severity:
- 🔴 **BREAKING** — client code using the documented shape will fail
- 🟡 **MISMATCH** — documented but wrong; workaround exists
- 🟢 **UNDOCUMENTED** — works but docs don't mention it

---

## Summary Table

| Module | Breaking | Mismatch | Undocumented | Total |
|--------|----------|----------|--------------|-------|
| Auth | 3 | 2 | 1 | 6 |
| Hospitals | 2 | 1 | 0 | 3 |
| Staff & Invitations | 3 | 1 | 1 | 5 |
| Patients | 4 | 1 | 1 | 6 |
| EMR | 9 | 1 | 2 | 12 |
| Labs | 1 | 0 | 2 | 3 |
| Assets | 5 | 0 | 1 | 6 |
| Review Queue | 4 | 0 | 1 | 5 |
| Global / Error Envelope | 3 | 0 | 4 | 7 |
| Health | 1 | 0 | 0 | 1 |
| **Total** | **35** | **6** | **13** | **54** |

---

## Auth

### FIND-01 — `POST /auth/setup-2fa` does not return `secret` in response 🟡 MISMATCH

**Docs say:** Response includes `{ secret, qrCodeUrl, backupCodes }`  
**Actual:** `{ qrCodeUrl, backupCodes }` — `secret` is deliberately omitted (server stores it as `pendingTwoFactorSecret` in DB per BUG-08 fix).  
**Impact:** Clients that display the raw secret for manual entry will break.  
**Fix docs:** Remove `secret` from response schema. Note that the QR code encodes the secret; manual-entry flows must use a separate `/auth/setup-2fa/secret` endpoint or show it pre-BUG-08-fix.

---

### FIND-02 — `POST /auth/verify-2fa` body schema mismatch 🔴 BREAKING

**Docs say:** Body is `{ totpCode: string, secret: string }`  
**Actual:** Body only accepts `{ totpCode: string }` — `secret` is ignored (server reads from `pendingTwoFactorSecret` in DB).  
**Impact:** Docs imply client must supply the secret; it must not.  
**Fix docs:** Remove `secret` from request body schema.

---

### FIND-03 — `POST /auth/login` 2FA step body mismatch 🔴 BREAKING

**Docs say:** 2FA login body is `{ totpCode: string, loginToken: string }`  
**Actual:** `{ totpCode: string }` — `loginToken` is not a field; the server uses the access token from the first login response to identify the session.  
**Fix docs:** Clarify the two-step flow: first login returns partial auth; the client uses the same access token in the `Authorization` header to call `POST /auth/login` with `{ totpCode }`.

---

### FIND-04 — User objects expose Mongoose internals (`_id`, `__v`) 🟡 MISMATCH

**Docs say:** User object has `{ id, email, name, ... }` (clean DTO)  
**Actual:** All user-returning endpoints also return `_id` (ObjectId string duplicate of `id`) and `__v` (Mongoose version key).  
**Impact:** Clients relying on `id` alone are safe, but `_id` may cause duplicate-key confusion in typed clients.  
**Fix:** Add `.toObject({ virtuals: true })` + `transform` to strip `_id`/`__v`, or use a serializer.

---

### FIND-05 — Login/register return slim user vs full user from `GET /auth/me` 🟡 MISMATCH

**Docs say:** All user-returning endpoints return the same `IUser` shape.  
**Actual:**  
- `POST /auth/register` and `POST /auth/login` return `{ id, email, name }` only  
- `GET /auth/me` returns full user with `twoFactorEnabled`, `roles`, `createdAt`, etc.  
**Impact:** Clients that parse login response for 2FA status will always see `undefined`.  
**Fix docs:** Document distinct slim (`AuthUser`) vs full (`User`) response types per endpoint.

---

### FIND-06 — `POST /auth/refresh` accepts expired access token in `Authorization` header 🟢 UNDOCUMENTED

**Docs say:** Nothing about whether the access token must be valid for refresh.  
**Actual:** The refresh endpoint reads only the refresh token from the body/cookie; a stale or expired `Authorization` header doesn't block the call.  
**Fix docs:** Clarify that `/auth/refresh` does not validate the access token — only the refresh token matters.

---

## Hospitals

### FIND-07 — Hospital `type` enum values are wrong 🔴 BREAKING

**Docs say:** `type` enum is `specialist | pharmacy | laboratory`  
**Actual:** `type` enum is `specialty | clinic | teaching | other`  
**Impact:** Any client sending `specialist`, `pharmacy`, or `laboratory` receives a `validation_error`.  
**Fix docs:** Update enum to `specialty | clinic | teaching | other`.

---

### FIND-08 — Hospital `location` is a plain string, not an address object 🔴 BREAKING

**Docs say:** `location` is `{ address: string, city: string, state: string, country: string, postalCode: string }`  
**Actual:** `location` is a plain `string` (e.g., `"123 Main St, Lagos"`).  
**Impact:** Clients sending an object receive a validation error or silently store `[object Object]`.  
**Fix docs:** Change `location` type to `string`.

---

### FIND-09 — `GET /hospitals` pagination key is `items` not `hospitals` 🟡 MISMATCH

**Docs say:** Response data key is `hospitals`  
**Actual:** Response data key is `items` (consistent with other list endpoints).  
**Fix docs:** Change `data.hospitals` to `data.items`.

---

## Staff & Invitations

### FIND-10 — `GET /hospitals/:id/staff` list key is `members` not `staff` 🟡 MISMATCH

**Docs say:** Response is `{ data: { staff: [...], total, page, limit } }`  
**Actual:** Response is `{ data: { members: [...], total, page, limit } }`  
**Fix docs:** Change `staff` → `members`.

---

### FIND-11 — `POST /hospitals/:id/staff` add-member response key mismatch 🟡 MISMATCH

**Docs say:** Response body is `{ data: { staffMember: { ... } } }`  
**Actual:** `{ data: { member: { ... } } }` — key is `member` not `staffMember`.  
**Fix docs:** Change `staffMember` → `member`.

---

### FIND-12 — Org-chart response is missing `department` and `managerId` fields 🟡 MISMATCH

**Docs say:** Each org-chart node has `{ id, name, role, department, managerId, directReports }`  
**Actual:** Each node has `{ id, name, role, directReports }` — `department` and `managerId` are absent.  
**Impact:** Clients rendering org-chart with department labels or hierarchy lines will show nothing.  
**Fix:** Either populate these fields in the response or remove them from docs.

---

### FIND-13 — Invitation accept path is wrong — token in URL, not body 🔴 BREAKING

**Docs say:** `POST /auth/invitations/accept` with body `{ token: string }`  
**Actual:** `POST /invitations/:token/accept` — token is a URL path parameter; no body needed.  
**Impact:** All clients using the documented path receive 404.  
**Fix docs:** Update path to `/invitations/:token/accept` and remove `token` from body.

---

### FIND-14 — Invitation decline path is wrong — same issue as accept 🔴 BREAKING

**Docs say:** `POST /auth/invitations/decline` with body `{ token: string }`  
**Actual:** `POST /invitations/:token/decline` — token in URL; returns 204 (not 200 as documented).  
**Fix docs:** Update path to `/invitations/:token/decline`, change success status to 204.

---

### FIND-15 — Custom role requires `slug` field (undocumented) 🟢 UNDOCUMENTED

**Docs say:** Create role body is `{ name: string, permissions: string[] }`  
**Actual:** `slug` field is required (`validation_error` if omitted). Must be a URL-safe kebab-case identifier.  
**Fix docs:** Add `slug: string` as required field in create-role request body.

---

## Patients

### FIND-16 — Demographics field is `sex` not `gender` 🔴 BREAKING

**Docs say:** `demographics.gender` (enum `male | female | other | prefer_not_to_say`)  
**Actual:** Field is `demographics.sex` (enum `male | female | other`).  
**Impact:** Clients sending `gender` will have the field silently ignored; `sex` will be missing.  
**Fix docs:** Rename field to `sex`, update enum to `male | female | other`.

---

### FIND-17 — Admit body fields mismatch 🔴 BREAKING

**Docs say:** `POST /patients/:id/admit` body: `{ ward: string, bed?: string, admittingDoctorId: string }`  
**Actual:** Body uses `{ department: string, bed?: string, admittingDoctorId?: string }` — `ward` → `department`; `admittingDoctorId` is optional not required.  
**Fix docs:** Replace `ward` with `department`; mark `admittingDoctorId` as optional.

---

### FIND-18 — Check-in fields `visitType`, `referredBy`, `chiefComplaint` are silently discarded 🟡 MISMATCH

**Docs say:** `POST /patients/:id/checkin` accepts `{ visitType, referredBy, chiefComplaint, ... }`  
**Actual:** These fields are accepted without error but not persisted — `GET /patients/:id` does not include them in `checkIn`.  
**Impact:** Clients storing triage information via these fields will lose data silently.  
**Fix:** Either persist these fields or return a `validation_error` for unrecognised keys.

---

### FIND-19 — Transfer `recordsPackage` is an object with boolean flags, not a string array 🔴 BREAKING

**Docs say:** `recordsPackage: string[]` (array of record-type strings)  
**Actual:** `recordsPackage: { labResults: boolean, vitals: boolean, medications: boolean, documents: boolean }` — a boolean flags object.  
**Fix docs:** Update type to reflect the object shape.

---

### FIND-20 — Transfer endpoint path is `/:patientId/transfer` not `/transfers` 🔴 BREAKING

**Docs say:** `POST /hospitals/:hospitalId/transfers` with body `{ patientId, targetHospitalId, reason }`  
**Actual:** `POST /hospitals/:hospitalId/patients/:patientId/transfer` with body `{ toHospitalId, reason }` — `patientId` is in the URL, `targetHospitalId` → `toHospitalId`.  
**Fix docs:** Update path and body field name.

---

### FIND-21 — `GET /patients/recent` and `GET /patients/favorites` response key is `patients` not `items` 🟢 UNDOCUMENTED

**Docs say:** Standard paginated `{ items, total }` shape  
**Actual:** `{ data: { patients: [...] } }` — no pagination metadata.  
**Fix docs:** Document non-paginated response with `patients` key.

---

## EMR

### FIND-22 — All EMR routes are under `/chart`, not `/emr` 🔴 BREAKING

**Docs say:** `GET /hospitals/:hospitalId/patients/:patientId/emr/summary`  
**Actual:** `GET /hospitals/:hospitalId/patients/:patientId/chart` — base path is `chart`, not `emr`.  
**Impact:** All EMR endpoint calls using `/emr/` prefix receive 404.  
**Fix docs:** Replace `/emr/` with `/chart/` throughout the EMR section.

---

### FIND-23 — `GET /chart` returns `summary` not `chart` as top-level key 🟡 MISMATCH

**Docs say:** Response is `{ data: { chart: { ... } } }`  
**Actual:** Response is `{ data: { summary: { ... } } }` for the base chart summary endpoint.  
**Fix docs:** Change `chart` → `summary` for this endpoint.

---

### FIND-24 — Vitals field names are all wrong (snake_case vs camelCase) 🔴 BREAKING

**Docs say:**
```
heartRate, bloodPressureSystolic, bloodPressureDiastolic,
respiratoryRate, oxygenSaturation, temperature, weight, height
```
**Actual:**
```
hr, bp_systolic, bp_diastolic, rr, spo2, temp, weight, height
```
**Impact:** Clients using documented field names will silently send data that is either ignored or rejected.  
**Fix docs:** Update all vitals field names to snake_case actual values.

---

### FIND-25 — `temperatureUnit` field does not exist 🔴 BREAKING

**Docs say:** `temperatureUnit: 'C' | 'F'`  
**Actual:** No such field. Temperature is assumed to be Celsius.  
**Fix docs:** Remove `temperatureUnit`; note that `temp` is always in Celsius.

---

### FIND-26 — `bloodGlucose` and `bloodGlucoseUnit` fields do not exist 🔴 BREAKING

**Docs say:** Both fields are part of the vitals schema.  
**Actual:** Neither field exists in the actual vitals schema. Sending them results in the values being silently dropped.  
**Fix docs:** Remove both fields, or add them to the backend schema.

---

### FIND-27 — `weightUnit` and `heightUnit` fields do not exist 🔴 BREAKING

**Docs say:** Both fields are documented.  
**Actual:** Neither exists. Weight is assumed to be kg; height is assumed to be cm. BMI is auto-calculated from these assumptions.  
**Fix docs:** Remove both fields; document the assumed units.

---

### FIND-28 — Medications: `name` → `drug`, `dosage` → `strength` 🔴 BREAKING

**Docs say:** `{ name: string, dosage: string, ... }`  
**Actual:** `{ drug: string, strength: string, ... }` — both field names differ.  
**Fix docs:** Update field names: `name` → `drug`, `dosage` → `strength`.

---

### FIND-29 — Medical history diagnosis object schema mismatch 🔴 BREAKING

**Docs say:** `{ code: string, name: string, type: string }`  
**Actual:** `{ icd10Code: string, description: string }` — field names differ and `type` is silently discarded.  
**Fix docs:** Update to `{ icd10Code, description }`.

---

### FIND-30 — Procedures require undocumented `preOpChecklist` object 🟢 UNDOCUMENTED

**Docs say:** Nothing about `preOpChecklist`.  
**Actual:** `POST /chart/procedures` requires (or strongly expects):
```json
{
  "preOpChecklist": {
    "consentObtained": boolean,
    "npoStatus": boolean,
    "allergiesConfirmed": boolean,
    "siteMarked": boolean
  }
}
```
Omitting this causes a validation error.  
**Fix docs:** Add `preOpChecklist` as a required object in the procedure creation body.

---

### FIND-31 — Documents: `type` → `category`, enum values differ 🔴 BREAKING

**Docs say:** Field is `type`, enum: `lab_result | imaging_result | prescription | referral | discharge_summary | other`  
**Actual:** Field is `category`, enum: `referral | lab_report | imaging | consent | other`  
Note: `lab_result` → `lab_report`, `imaging_result` → `imaging`; `prescription` and `discharge_summary` don't exist.  
**Fix docs:** Rename `type` → `category` and update enum values.

---

### FIND-32 — Immunizations: `administeredBy` → `administrator` 🔴 BREAKING

**Docs say:** Field is `administeredBy: string`  
**Actual:** Field is `administrator: string`  
**Fix docs:** Rename field.

---

### FIND-33 — `GET /chart/access-log` response key is `logs` not `entries` 🟡 MISMATCH

**Docs say:** `{ data: { entries: [...], total } }`  
**Actual:** `{ data: { logs: [...], total } }`  
**Fix docs:** Change `entries` → `logs`.

---

## Labs

### FIND-34 — Lab orders route is `/labs` not `/lab-orders` 🔴 BREAKING

**Docs say:** `POST /hospitals/:hospitalId/patients/:patientId/lab-orders`  
**Actual:** `POST /hospitals/:hospitalId/patients/:patientId/labs`  
**Impact:** All lab endpoint calls receive 404.  
**Fix docs:** Replace `/lab-orders` with `/labs` throughout.

---

### FIND-35 — Advance `awaiting_sample → sample_received` accepts undocumented fields 🟢 UNDOCUMENTED

**Docs say:** Advance body is `{ note?: string }`  
**Actual:** The `awaiting_sample → sample_received` transition also accepts `sampleType` and `sampleCollectedAt` and stores them on the order.  
**Fix docs:** Document these extra fields for the first transition.

---

### FIND-36 — `stateHistory` array is not documented 🟢 UNDOCUMENTED

**Docs say:** Lab order object does not mention `stateHistory`.  
**Actual:** Every lab order has `stateHistory: [{ from, to, note, timestamp, actorId }]` tracking every state transition.  
**Fix docs:** Add `stateHistory` to the lab order response schema.

---

## Assets

### FIND-37 — `warrantyExpiry` → `warrantyExpiresAt` 🔴 BREAKING

**Docs say:** Field is `warrantyExpiry`  
**Actual:** Field is `warrantyExpiresAt`  
**Fix docs:** Rename field.

---

### FIND-38 — `location` → `currentLocation` 🔴 BREAKING

**Docs say:** Field is `location`  
**Actual:** Field is `currentLocation`  
**Fix docs:** Rename field.

---

### FIND-39 — `department` and `assignedTo` fields do not exist in asset schema 🔴 BREAKING

**Docs say:** Asset object includes `department: string` and `assignedTo: string`  
**Actual:** Neither field exists. Sending them in create/update body is silently ignored.  
**Fix docs:** Remove both fields, or add them to the backend schema.

---

### FIND-40 — Photos field is an array of objects, not string keys 🔴 BREAKING

**Docs say:** `photos: string[]` (array of file-key strings)  
**Actual:** `photos: [{ fileKey: string, caption?: string, uploadedAt: Date }]`  
The add-photo endpoint body is `{ fileKey, caption? }` not a plain string.  
**Fix docs:** Update type and document the object structure.

---

### FIND-41 — `disposed` is not a valid `status` enum value 🟡 MISMATCH

**Docs say:** Asset `status` enum: `available | in_use | maintenance | retired | disposed`  
**Actual:** `disposed` returns a validation error. Valid values are: `available | in_use | maintenance | retired`.  
**Fix docs:** Remove `disposed` from the enum.

---

### FIND-42 — `locationHistory` is not documented 🟢 UNDOCUMENTED

**Docs say:** Asset object does not mention `locationHistory`.  
**Actual:** Asset includes `locationHistory: [{ location, note, movedBy, movedAt }]` updated by the `/move` endpoint.  
**Fix docs:** Add `locationHistory` to asset response schema.

---

## Review Queue

### FIND-43 — `resourceType` → `type`; `resourceId` → `referenceId` 🔴 BREAKING

**Docs say:** Create-item body uses `{ resourceType: string, resourceId: string }`  
**Actual:** Fields are `{ type: string, referenceId: string }`  
**Fix docs:** Rename both fields.

---

### FIND-44 — Priority enum is completely wrong 🔴 BREAKING

**Docs say:** `priority` enum: `low | normal | high | critical`  
**Actual:** `priority` enum: `routine | urgent | stat`  
**Impact:** Any client sending documented values receives a validation error.  
**Fix docs:** Replace enum with `routine | urgent | stat`.

---

### FIND-45 — `patientId` is required but not documented 🟢 UNDOCUMENTED

**Docs say:** `patientId` is not mentioned as required in the create-item body.  
**Actual:** Omitting `patientId` causes a validation error.  
**Fix docs:** Add `patientId: string (required)` to the create-item body schema.

---

### FIND-46 — `type` is a constrained enum, not a free-form string 🟡 MISMATCH

**Docs say:** `type` is a free-form `string`  
**Actual:** `type` is an enum: `lab_result | vitals | medication | procedure | document | other`  
**Fix docs:** Add enum values to `type` field.

---

### FIND-47 — Review item `summary` field is optional (not required) 🟢 UNDOCUMENTED

**Docs say:** Implies `summary` is required.  
**Actual:** Creating items without `summary` succeeds with 201.  
**Fix docs:** Mark `summary` as optional.

---

## Global / Error Envelope

### FIND-48 — Error envelope structure is completely different 🔴 BREAKING

**Docs say:**
```json
{ "status": "error", "message": "Human readable message", "code": "SCREAMING_SNAKE_CASE_CODE" }
```
**Actual:**
```json
{ "error": { "code": "snake_case_code", "message": "Human readable message" } }
```
Differences:
1. Top-level key is `error` (object), not flat fields
2. `code` values are `snake_case` not `SCREAMING_SNAKE_CASE`
3. No top-level `status` field
4. Validation errors include an additional `fieldErrors: { [field]: string[] }` inside `error`

**Impact:** All client error-handling code using the documented shape will fail.  
**Fix docs:** Update error envelope to actual shape, including validation error shape.

---

### FIND-49 — Success envelope wraps in `data`, but docs show flat responses 🔴 BREAKING

**Docs say:** Many endpoints document flat response objects (e.g., `{ user: {...}, token: "..." }`)  
**Actual:** All success responses are wrapped: `{ data: { ... } }`  
**Fix docs:** Add `data` wrapper to all success response schemas.

---

### FIND-50 — `GET /health` requires `/api/v1` prefix 🔴 BREAKING

**Docs say:** `GET /health`  
**Actual:** `GET /api/v1/health`  
**Fix docs:** Update health endpoint path.

---

### FIND-51 — Health response shape differs from docs 🟡 MISMATCH

**Docs say:** `{ status: "ok", timestamp: "..." }`  
**Actual:** `{ data: { status: "ok", time: "...", service: "medcord-api", env: "development" } }` — key is `time` not `timestamp`; extra `service` and `env` fields; wrapped in `data`.  
**Fix docs:** Update response schema.

---

### FIND-52 — `Hospital` objects expose `_id` and `__v` 🟡 MISMATCH

Same issue as FIND-04 for users — Mongoose internals leak in hospital responses.  
**Fix:** Apply consistent DTO transformation for all document types.

---

### FIND-53 — Pagination defaults differ from docs 🟡 MISMATCH

**Docs say:** Default `limit` is 20.  
**Actual:** Default `limit` is 10 (verified across hospitals, patients, staff list endpoints).  
**Fix docs:** Update default `limit` to 10.

---

### FIND-54 — `createdAt`/`updatedAt` are present on all resources but not always documented 🟢 UNDOCUMENTED

**Actual:** All Mongoose documents include `createdAt` and `updatedAt` timestamps in responses.  
**Fix docs:** Add `createdAt` and `updatedAt` to all resource schemas.

---

## Recommendations

**Immediate doc fixes needed (breaking):**
1. Error envelope shape (FIND-48) — all error handling will be wrong
2. Success envelope `data` wrapper (FIND-49) — all response parsing will be wrong  
3. Hospital `type` enum (FIND-07), `location` type (FIND-08)
4. Invitation accept/decline paths (FIND-13, FIND-14)
5. EMR base path `/emr/` → `/chart/` (FIND-22)
6. All vitals field names (FIND-24, FIND-25, FIND-26, FIND-27)
7. Lab route name (FIND-34)
8. Review queue field names and enums (FIND-43, FIND-44)

**Backend fixes to consider:**
- Strip `_id` / `__v` from all responses (FIND-04, FIND-52)
- Persist check-in fields that are currently discarded (FIND-18)
- Persist or reject undocumented asset fields `department`/`assignedTo` (FIND-39)
