# Medcord API Reference

**Base URL**: `http://localhost:8085/api/v1`  
**Content-Type**: `application/json`

---

## Auth

All protected endpoints require the `Authorization: Bearer <accessToken>` header.

### POST /auth/register
Create an account.

**Body**
```json
{ "email": "string", "password": "string (min 8)", "name": "string", "phone?": "string" }
```
**Response 201**
```json
{
  "data": {
    "user": { "id": "string", "email": "string", "name": "string" },
    "tokens": { "accessToken": "string", "refreshToken": "string" }
  }
}
```
> Note: Login and register return a slim user `{ id, email, name }`. For the full user object (including `twoFactorEnabled`, `roles`, etc.) call `GET /auth/me`.

---

### POST /auth/login
```json
{ "email": "string", "password": "string", "totpCode?": "string (required if 2FA enabled)" }
```
**Response 200** — same shape as register.  
If 2FA is enabled and `totpCode` is absent → **401**.

---

### POST /auth/refresh
```json
{ "refreshToken": "string" }
```
**Response 200**
```json
{ "data": { "tokens": { "accessToken": "string", "refreshToken": "string" } } }
```
> Note: The `Authorization` header (access token) is not validated on this endpoint. Only the refresh token matters.

---

### POST /auth/logout `🔒`
```json
{ "refreshToken": "string" }
```
**Response 204**

---

### POST /auth/setup-2fa `🔒`
Generates a new TOTP secret and stores it server-side. Does **not** enable 2FA yet — call `/auth/verify-2fa` to activate.

**Response 200**
```json
{ "data": { "qrCodeUrl": "string", "backupCodes": ["string"] } }
```
> Note: The raw secret is **not** returned. It is stored as `pendingTwoFactorSecret` on the server. Scan the QR code with an authenticator app; for manual entry use the secret encoded in `qrCodeUrl`.

---

### POST /auth/verify-2fa `🔒`
Verifies the TOTP code against the pending secret and activates 2FA.

**Body**
```json
{ "totpCode": "string" }
```
**Response 204** — 2FA is now active on the account.

---

### GET /auth/me `🔒`
**Response 200**
```json
{
  "data": {
    "user": {
      "id": "string", "email": "string", "name": "string",
      "phone?": "string", "photoKey?": "string",
      "twoFactorEnabled": "boolean",
      "createdAt": "ISO date", "updatedAt": "ISO date"
    }
  }
}
```

---

### PATCH /auth/me `🔒`
```json
{ "name?": "string", "phone?": "string", "photoKey?": "string" }
```
**Response 200** `{ "data": { "user": IUser } }`

---

### PATCH /auth/me/password `🔒`
```json
{ "currentPassword": "string", "newPassword": "string (min 8)" }
```
**Response 204** — All existing refresh tokens are invalidated.

---

## Hospitals

### POST /hospitals `🔒`
Create a hospital. Caller becomes `super_admin`.

**Body**
```json
{
  "name": "string",
  "type": "specialty | clinic | teaching | other",
  "subdomain": "string (slug)",
  "timezone": "string (IANA)",
  "locale": "string",
  "location?": "string",
  "contact?": { "email?": "string", "phone?": "string", "website?": "string" }
}
```
**Response 201** `{ "data": { "hospital": IHospital } }`

> `type` enum: `specialty | clinic | teaching | other`  
> `location` is a plain string (e.g. `"123 Main St, Lagos"`), not an address object.

---

### GET /hospitals `🔒`
List all hospitals the caller is a member of.

**Response 200**
```json
{ "data": { "items": "IHospital[]", "total": "number", "page": "number", "limit": "number" } }
```
> Default `limit` is 10.

---

### GET /hospitals/:hospitalId `🔒🏥`
**Response 200** `{ "data": { "hospital": IHospital } }`

---

### PATCH /hospitals/:hospitalId `🔒🏥` `[super_admin, hospital_admin]`
```json
{
  "name?": "string",
  "type?": "specialty | clinic | teaching | other",
  "timezone?": "string",
  "locale?": "string",
  "location?": "string",
  "contact?": { "email?": "string", "phone?": "string", "website?": "string" }
}
```
**Response 200** `{ "data": { "hospital": IHospital } }`

---

### PATCH /hospitals/:hospitalId/branding `🔒🏥` `[super_admin]`
```json
{ "logoKey?": "string", "primaryColor?": "string", "secondaryColor?": "string", "tagline?": "string" }
```
**Response 200** `{ "data": { "hospital": IHospital } }`

---

### PATCH /hospitals/:hospitalId/modules `🔒🏥` `[super_admin]`
```json
{ "emr?": "boolean", "labs?": "boolean", "assets?": "boolean", "onlineConsultation?": "boolean" }
```
**Response 200** `{ "data": { "hospital": IHospital } }`

---

### GET /hospitals/:hospitalId/domain `🔒🏥`
**Response 200**
```json
{ "data": { "subdomain": "string", "subdomainUrl": "string", "customDomain?": "string", "customDomainVerified": "boolean" } }
```

---

### PATCH /hospitals/:hospitalId/domain `🔒🏥` `[super_admin]`
```json
{ "customDomain?": "string" }
```
**Response 200** `{ "data": { "hospital": IHospital } }`

---

### GET /hospitals/:hospitalId/usage `🔒🏥` `[super_admin, hospital_admin]`
**Response 200**
```json
{ "data": { "members": "number" } }
```

---

### POST /hospitals/:hospitalId/transfer-ownership `🔒🏥` `[super_admin]`
```json
{ "newOwnerId": "string (userId — USR-xxx — of existing member, not memberId)" }
```
**Response 200** `{ "data": { "hospital": IHospital } }`

---

### DELETE /hospitals/:hospitalId `🔒🏥` `[super_admin]`
Archives the hospital. **Response 204**

---

## Staff & Invitations

All staff routes are scoped to `/hospitals/:hospitalId/`.

### POST /hospitals/:hospitalId/invitations `🔒🏥` `[super_admin, hospital_admin]`
```json
{ "email": "string", "role": "StaffRole", "department?": "string", "unit?": "string" }
```
**Response 201** `{ "data": { "invitation": IInvitation } }`

---

### POST /hospitals/:hospitalId/invitations/bulk `🔒🏥` `[super_admin, hospital_admin]`
```json
{ "invitations": [{ "email": "string", "role": "StaffRole", "department?": "string", "unit?": "string" }] }
```
**Response 201**

---

### GET /hospitals/:hospitalId/invitations `🔒🏥` `[super_admin, hospital_admin]`
**Response 200** `{ "data": { "invitations": "IInvitation[]" } }`

---

### DELETE /hospitals/:hospitalId/invitations/:invitationId `🔒🏥` `[super_admin, hospital_admin]`
Revoke a pending invitation. **Response 204**

---

### POST /hospitals/:hospitalId/invitations/:invitationId/resend `🔒🏥` `[super_admin, hospital_admin]`
Resets TTL and sends a new email. **Response 200**

---

### GET /invitations/:token
Validate an invitation token and return all data needed to render the accept page. No `Authorization` header required.

**Response 200**
```json
{
  "data": {
    "invitation": {
      "email": "newstaff@test.com",
      "role": "doctor",
      "department": "Neurology",
      "expiresAt": "2026-05-23T21:37:57.393Z"
    },
    "hospital": {
      "name": "City General Hospital",
      "slug": "city-general",
      "logoKey": "logos/city-general.png",
      "location": "Lagos, Nigeria"
    },
    "invitedBy": {
      "name": "Alice Mensah"
    }
  }
}
```

`logoKey` and `department` are omitted when not set.

**Errors**
- `404` — token not found
- `409` — invitation already accepted, declined, or revoked
- `409` — invitation has expired

---

### POST /invitations/:token/accept
Accept an invitation and create a new Medcord account. No `Authorization` header required — the token in the URL is the authentication mechanism.

**Body**
```json
{ "name": "string", "password": "string (min 8 chars)" }
```

**Response 200**
```json
{
  "data": {
    "hospitalId": "HSP-xxx",
    "hospitalSlug": "subdomain-string",
    "accessToken": "string",
    "refreshToken": "string"
  }
}
```

The user is registered and logged in immediately. Redirect to the hospital dashboard using `hospitalSlug`.

**Errors**
- `409` — invitation already accepted/declined/revoked, or expired
- `409` — an account with this email already exists (user should log in instead)

---

### POST /invitations/:token/decline
Decline an invitation. No `Authorization` header required.

**Body**: none  
**Response 204**

---

### GET /hospitals/:hospitalId/staff `🔒🏥`
Query: `page`, `limit`, `role?`, `status?`

**Response 200** (paginated)
```json
{ "data": { "members": "IHospitalMember[]", "total": "number", "page": "number", "limit": "number", "totalPages": "number" } }
```

---

### GET /hospitals/:hospitalId/staff/:memberId `🔒🏥`
**Response 200** `{ "data": { "member": IHospitalMember } }`

---

### PATCH /hospitals/:hospitalId/staff/:memberId `🔒🏥` `[super_admin, hospital_admin]`
```json
{ "role?": "StaffRole", "department?": "string", "unit?": "string", "specialty?": "string" }
```
**Response 200** `{ "data": { "member": IHospitalMember } }`

---

### POST /hospitals/:hospitalId/staff/:memberId/suspend `🔒🏥` `[super_admin, hospital_admin]`
**Response 204**

---

### POST /hospitals/:hospitalId/staff/:memberId/activate `🔒🏥` `[super_admin, hospital_admin]`
**Response 204**

---

### DELETE /hospitals/:hospitalId/staff/:memberId `🔒🏥` `[super_admin, hospital_admin]`
**Response 204**

---

### GET /hospitals/:hospitalId/roles `🔒🏥`
**Response 200** `{ "data": { "roles": "ICustomRole[]" } }`

---

### POST /hospitals/:hospitalId/roles `🔒🏥` `[super_admin]`
```json
{ "name": "string", "slug": "string (kebab-case, required)", "permissions": "string[]" }
```
**Response 201** `{ "data": { "role": ICustomRole } }`

---

### PATCH /hospitals/:hospitalId/roles/:roleId `🔒🏥` `[super_admin]`
```json
{ "name?": "string", "permissions?": "string[]" }
```
**Response 200** `{ "data": { "role": ICustomRole } }`

---

### GET /hospitals/:hospitalId/org-chart `🔒🏥`
**Response 200**
```json
{
  "data": {
    "chart": [
      { "id": "string", "userId": "string", "name": "string", "role": "string", "directReports": [] }
    ]
  }
}
```
> Note: `department` and `managerId` are not currently returned in the org-chart node.

---

### GET /hospitals/:hospitalId/share `🔒🏥`
**Response 200** `{ "data": { "workspaceUrl": "string", "inviteUrl": "string" } }`

---

## Patients

All patient routes: `/hospitals/:hospitalId/patients/...`

### POST /hospitals/:hospitalId/patients `🔒🏥`
Register a new patient.

```json
{
  "demographics": {
    "firstName": "string",
    "lastName": "string",
    "dateOfBirth": "ISO date",
    "sex": "male | female | other",
    "bloodGroup?": "A+ | A- | B+ | B- | AB+ | AB- | O+ | O-",
    "address?": {},
    "nationality?": "string",
    "occupation?": "string",
    "maritalStatus?": "single | married | divorced | widowed | other"
  },
  "emergencyContact?": { "name?": "string", "relationship?": "string", "phone?": "string", "address?": {} },
  "guarantor?": {
    "name?": "string", "relationship?": "string", "phone?": "string",
    "address?": {}, "idType?": "string", "idNumber?": "string",
    "employer?": "string", "occupation?": "string"
  },
  "photoKey?": "string",
  "documentKeys?": "string[]"
}
```
**Response 201**
```json
{ "data": { "patient": "IPatient", "possibleDuplicates": "IPatient[]" } }
```
> `sex` enum: `male | female | other` (not `gender`; `prefer_not_to_say` is not valid).

---

### GET /hospitals/:hospitalId/patients `🔒🏥`
Query: `page`, `limit` (default 10), `q?` (searches firstName, lastName, patientCode)

**Response 200** (paginated)
```json
{ "data": { "items": "IPatient[]", "total": "number", "page": "number", "limit": "number" } }
```

---

### GET /hospitals/:hospitalId/patients/recent `🔒🏥`
Last 10 patients accessed by the caller (non-paginated).

**Response 200**
```json
{ "data": { "patients": "IPatient[]" } }
```

---

### GET /hospitals/:hospitalId/patients/favorites `🔒🏥`
Patients the caller has favorited (non-paginated).

**Response 200**
```json
{ "data": { "patients": "IPatient[]" } }
```

---

### GET /hospitals/:hospitalId/patients/:patientId `🔒🏥`
**Response 200** `{ "data": { "patient": IPatient } }`

---

### PATCH /hospitals/:hospitalId/patients/:patientId `🔒🏥`
Partial update of demographics, emergencyContact, guarantor, photoKey, documentKeys.

**Response 200** `{ "data": { "patient": IPatient } }`

> When patching `demographics`, include all subfields you want to retain — partial demographic objects may overwrite existing data.

---

### GET /hospitals/:hospitalId/patients/:patientId/id-card `🔒🏥`
**Response 200**
```json
{ "data": { "patient": "IPatient", "idCard": { "isActive": "boolean", "issuedAt?": "ISO date", "reissuedAt?": "ISO date" } } }
```

---

### POST /hospitals/:hospitalId/patients/:patientId/id-card `🔒🏥`
Issue or re-issue ID card.

**Response 200**
```json
{ "data": { "patient": { "idCard": { "isActive": "boolean", "issuedAt": "ISO date" } } } }
```

---

### DELETE /hospitals/:hospitalId/patients/:patientId/id-card `🔒🏥`
Deactivate card. **Response 204**

---

### POST /hospitals/:hospitalId/patients/:patientId/checkin `🔒🏥`
Check a patient in for a visit.

**Body**: none required (body fields currently accepted but not persisted — omit for now)

**Response 200** `{ "data": { "patient": IPatient } }`

---

### POST /hospitals/:hospitalId/patients/:patientId/checkout `🔒🏥`
**Response 200** `{ "data": { "patient": IPatient } }`

---

### POST /hospitals/:hospitalId/patients/:patientId/admit `🔒🏥`
```json
{ "department": "string (required)", "bed?": "string", "admittingDoctorId?": "string", "admissionReason?": "string" }
```
**Response 200** `{ "data": { "patient": IPatient } }`

> `department` replaces `ward` from older docs.

---

### POST /hospitals/:hospitalId/patients/:patientId/discharge `🔒🏥`
```json
{ "dischargeSummary?": "string", "followUpDate?": "ISO date", "dischargeInstructions?": "string" }
```
**Response 200** `{ "data": { "patient": IPatient } }`

---

### POST /hospitals/:hospitalId/patients/:patientId/transfer `🔒🏥`
Request inter-hospital transfer.

```json
{
  "toHospitalId": "string",
  "reason": "string",
  "department?": "string",
  "recordsPackage?": {
    "labResults": "boolean",
    "vitals": "boolean",
    "medications": "boolean",
    "documents": "boolean"
  }
}
```
**Response 201** `{ "data": { "transfer": ITransfer } }`

---

### GET /hospitals/:hospitalId/transfers/incoming `🔒🏥`
List pending incoming transfers.

**Response 200** (paginated) `{ "data": { "items": "ITransfer[]", "total": "number" } }`

---

### POST /hospitals/:hospitalId/transfers/:transferId/accept `🔒🏥`
**Response 200** `{ "data": { "transfer": ITransfer } }`

---

### POST /hospitals/:hospitalId/transfers/:transferId/decline `🔒🏥`
**Response 200** `{ "data": { "transfer": ITransfer } }`

---

### POST /hospitals/:hospitalId/patients/:patientId/favorite `🔒🏥`
**Response 204**

---

### DELETE /hospitals/:hospitalId/patients/:patientId/favorite `🔒🏥`
**Response 204**

---

## EMR (Electronic Medical Records)

All EMR routes: `/hospitals/:hospitalId/patients/:patientId/chart/...`

> ⚠️ Base path is `/chart/`, not `/emr/`.

All EMR endpoints enforce that `patientId` is linked to `hospitalId`. A patient not registered at the requesting hospital returns **404**.

---

### GET .../chart `🔒🏥`
Full chart summary (latest vitals, active medications, history, recent procedures, immunizations, documents).

**Response 200**
```json
{ "data": { "summary": { "lastVitals": {}, "activeMedicationsCount": "number", "activeAllergyCount": "number", "recentProcedures": [], "immunizationCount": "number", "documentCount": "number" } } }
```

---

### GET .../chart/vitals `🔒🏥`
Query: `limit?` (number). Returns array newest-first.

**Response 200** `{ "data": { "vitals": [] } }`

---

### POST .../chart/vitals `🔒🏥`
```json
{
  "hr?": "number (heart rate, bpm)",
  "bp_systolic?": "number (mmHg)",
  "bp_diastolic?": "number (mmHg)",
  "rr?": "number (respiratory rate, breaths/min)",
  "spo2?": "number (oxygen saturation, %)",
  "temp?": "number (temperature, always in °C)",
  "weight?": "number (kg)",
  "height?": "number (cm)",
  "painScore?": "number (0–10)",
  "notes?": "string"
}
```
**Response 201** `{ "data": { "vitals": IVitals } }`

> BMI is auto-calculated when both `weight` (kg) and `height` (cm) are provided.  
> Unit fields (`temperatureUnit`, `weightUnit`, `heightUnit`, `bloodGlucoseUnit`) do **not** exist — units are fixed (°C, kg, cm).  
> `bloodGlucose` does **not** exist in the vitals schema.

---

### GET .../chart/medications `🔒🏥`
**Response 200** `{ "data": { "medications": [] } }`

---

### POST .../chart/medications `🔒🏥` `[doctor, nurse_practitioner, physician_assistant]`
```json
{
  "drug": "string",
  "strength": "string",
  "frequency": "string",
  "route?": "string",
  "startDate?": "ISO date",
  "endDate?": "ISO date",
  "prescribedBy?": "string",
  "instructions?": "string",
  "status?": "active | discontinued | completed"
}
```
**Response 201** `{ "data": { "medication": IMedication } }`

> `drug` replaces `name`; `strength` replaces `dosage` from older docs.

---

### PATCH .../chart/medications/:medId `🔒🏥` `[doctor, nurse_practitioner, physician_assistant]`
**Response 200** `{ "data": { "medication": IMedication } }`

---

### GET .../chart/history `🔒🏥`
Returns full medical history object.

**Response 200** `{ "data": { "history": IMedicalHistory } }`

---

### PATCH .../chart/history `🔒🏥` `[clinical roles]`
Append/update medical history fields:
```json
{
  "diagnoses?": [
    {
      "icd10Code": "string",
      "description": "string",
      "onsetDate?": "ISO date",
      "resolvedDate?": "ISO date",
      "notes?": "string"
    }
  ],
  "allergies?": [{ "substance": "string", "reaction?": "string", "severity?": "mild | moderate | severe", "onsetDate?": "ISO date" }],
  "familyHistory?": [{ "relation": "string", "condition": "string", "notes?": "string" }],
  "socialHistory?": { "smokingStatus?": "string", "alcoholUse?": "string", "exerciseFrequency?": "string", "occupation?": "string", "diet?": "string", "notes?": "string" }
}
```
**Response 200** `{ "data": { "history": IMedicalHistory } }`

> Diagnosis object uses `icd10Code` + `description` (not `code`/`name`/`type` from older docs).

---

### GET .../chart/procedures `🔒🏥`
**Response 200** `{ "data": { "procedures": [] } }`

---

### POST .../chart/procedures `🔒🏥` `[clinical roles]`
```json
{
  "name": "string",
  "code?": "string",
  "performedBy": "string",
  "performedAt?": "ISO date",
  "notes?": "string",
  "fileKeys?": "string[]",
  "preOpChecklist": {
    "consentObtained": "boolean",
    "npoStatus": "boolean",
    "allergiesConfirmed": "boolean",
    "siteMarked": "boolean"
  }
}
```
**Response 201** `{ "data": { "procedure": IProcedure } }`

> `preOpChecklist` is required.

---

### GET .../chart/immunizations `🔒🏥`
**Response 200** `{ "data": { "immunizations": [] } }`

---

### POST .../chart/immunizations `🔒🏥` `[clinical roles]`
```json
{
  "vaccine": "string",
  "dose?": "string",
  "administeredAt?": "ISO date",
  "administrator?": "string",
  "batchNumber?": "string",
  "nextDueDate?": "ISO date",
  "notes?": "string"
}
```
**Response 201** `{ "data": { "immunization": IImmunization } }`

> `administrator` replaces `administeredBy` from older docs.

---

### GET .../chart/documents `🔒🏥`
**Response 200** `{ "data": { "documents": [] } }`

---

### POST .../chart/documents `🔒🏥`
```json
{
  "title": "string",
  "category": "referral | lab_report | imaging | consent | other",
  "fileKey": "string",
  "notes?": "string"
}
```
**Response 201** `{ "data": { "document": IDocument } }`

> `category` replaces `type` from older docs. Enum values differ: use `lab_report` (not `lab_result`), `imaging` (not `imaging_result`). `prescription` and `discharge_summary` are not valid values.

---

### PATCH .../chart/documents/:docId `🔒🏥`
**Response 200** `{ "data": { "document": IDocument } }`

---

### GET .../chart/access-log `🔒🏥` `[super_admin, hospital_admin]`
Query: `page`, `limit`. Returns paginated access log entries.

**Response 200**
```json
{ "data": { "logs": [], "total": "number" } }
```
> Response key is `logs`, not `entries`.

---

### POST .../chart/break-glass `🔒🏥`
Emergency access override. Access is logged with IP and user-agent.

```json
{ "reason": "string" }
```
**Response 204**

---

## Lab Orders

Routes: `/hospitals/:hospitalId/patients/:patientId/labs/...`

> ⚠️ Base path is `/labs/`, not `/lab-orders/`.

---

### GET .../labs `🔒🏥`
Query: `page`, `limit` (default 10), `status?`, `priority?`

**Response 200** (paginated)
```json
{ "data": { "items": "ILabOrder[]", "total": "number", "page": "number", "limit": "number" } }
```

---

### POST .../labs `🔒🏥`
```json
{
  "testName": "string",
  "testCode?": "string",
  "category?": "string",
  "priority": "routine | urgent | stat",
  "sampleType?": "string",
  "notes?": "string",
  "fileKey?": "string"
}
```
**Response 201** — Initial status: `awaiting_sample`

```json
{
  "data": {
    "order": {
      "id": "string", "status": "awaiting_sample",
      "stateHistory": [],
      "createdAt": "ISO date"
    }
  }
}
```

---

### GET .../labs/:orderId `🔒🏥`
**Response 200**
```json
{
  "data": {
    "order": {
      "id": "string", "testName": "string", "status": "string",
      "result?": { "value": "string", "unit?": "string", "referenceRange?": "string", "isAbnormal": "boolean" },
      "stateHistory": [{ "from": "string", "to": "string", "note?": "string", "timestamp": "ISO date", "actorId": "string" }],
      "resultReleasedAt?": "ISO date", "resultReleasedBy?": "string",
      "createdAt": "ISO date", "updatedAt": "ISO date"
    }
  }
}
```

---

### PATCH .../labs/:orderId `🔒🏥`
Update notes/fileKey/category before release. Returns 409 if order is already `result_released`.

**Response 200** `{ "data": { "order": ILabOrder } }`

---

### POST .../labs/:orderId/advance `🔒🏥`
Advance through the 7-state machine (one step at a time, no skipping).

```
awaiting_sample → sample_received → awaiting_test → in_progress → awaiting_result → result_ready → result_released
```

**Body**
```json
{
  "note?": "string",
  "sampleType?": "string (only for awaiting_sample → sample_received transition)",
  "sampleCollectedAt?": "ISO date (only for awaiting_sample → sample_received transition)"
}
```
**Response 200** `{ "data": { "order": ILabOrder } }`

> Guard: `awaiting_result → result_ready` requires that a result has been recorded first via `/result`. Attempting to advance without a recorded result returns **409**.  
> Advancing from the terminal state `result_released` returns **409**.

---

### POST .../labs/:orderId/result `🔒🏥`
Record test result. Only valid when status is `awaiting_result`.

```json
{
  "value": "string",
  "unit?": "string",
  "referenceRange?": "string",
  "isAbnormal": "boolean",
  "notes?": "string"
}
```
**Response 200** `{ "data": { "order": ILabOrder } }` — status becomes `result_ready`.

---

## Assets

Routes: `/hospitals/:hospitalId/assets/...`

---

### GET /hospitals/:hospitalId/assets `🔒🏥`
Query: `page`, `limit` (default 10), `category?`, `status?`, `q?` (name search)

**Response 200** (paginated)
```json
{ "data": { "items": "IAsset[]", "total": "number", "page": "number", "limit": "number" } }
```

---

### POST /hospitals/:hospitalId/assets `🔒🏥`
```json
{
  "name": "string",
  "category": "string",
  "assetTag?": "string",
  "manufacturer?": "string",
  "modelName?": "string",
  "serialNumber?": "string",
  "purchaseDate?": "ISO date",
  "purchasePrice?": "number",
  "warrantyExpiresAt?": "ISO date",
  "currentLocation?": "string",
  "status?": "available | in_use | maintenance | retired",
  "condition?": "string",
  "notes?": "string"
}
```
**Response 201** `{ "data": { "asset": IAsset } }`

> `warrantyExpiresAt` replaces `warrantyExpiry`; `currentLocation` replaces `location`.  
> `department` and `assignedTo` are not valid fields.  
> `disposed` is not a valid `status` value — valid values: `available | in_use | maintenance | retired`.  
> Photos are added separately via the `/photos` endpoint; `photoKeys` array is not accepted on create.

---

### GET /hospitals/:hospitalId/assets/:assetId `🔒🏥`
**Response 200**
```json
{
  "data": {
    "asset": {
      "id": "string", "name": "string", "category": "string",
      "status": "available | in_use | maintenance | retired",
      "currentLocation?": "string",
      "warrantyExpiresAt?": "ISO date",
      "photos": [{ "fileKey": "string", "caption?": "string", "uploadedAt": "ISO date" }],
      "locationHistory": [{ "location": "string", "note?": "string", "movedBy": "string", "movedAt": "ISO date" }],
      "createdAt": "ISO date", "updatedAt": "ISO date"
    }
  }
}
```

---

### PATCH /hospitals/:hospitalId/assets/:assetId `🔒🏥`
**Response 200** `{ "data": { "asset": IAsset } }`

---

### PATCH /hospitals/:hospitalId/assets/:assetId/status `🔒🏥`
```json
{ "status": "available | in_use | maintenance | retired", "note?": "string" }
```
**Response 200** `{ "data": { "asset": IAsset } }`

---

### POST /hospitals/:hospitalId/assets/:assetId/move `🔒🏥`
Records a location change in `locationHistory`.

```json
{ "location": "string", "note?": "string" }
```
**Response 200** `{ "data": { "asset": IAsset } }`

> `currentLocation` on the asset is updated; a new entry is appended to `locationHistory`.

---

### POST /hospitals/:hospitalId/assets/:assetId/photos `🔒🏥`
Add a photo to the asset.

```json
{ "fileKey": "string", "caption?": "string" }
```
**Response 200** `{ "data": { "asset": IAsset } }`

> `photos` is an array of objects `{ fileKey, caption?, uploadedAt }`, not a plain string array.

---

### DELETE /hospitals/:hospitalId/assets/:assetId/photos/:fileKey `🔒🏥`
`:fileKey` must be URL-encoded (`encodeURIComponent`).  
**Response 200** `{ "data": { "asset": IAsset } }`

---

### DELETE /hospitals/:hospitalId/assets/:assetId `🔒🏥`
**Response 204**

---

## Review Queue

### GET /hospitals/:hospitalId/review-queue `🔒🏥`
Query: `page`, `limit` (default 10), `status?` (`pending | approved | rejected | escalated`), `type?`

**Response 200** (paginated)
```json
{ "data": { "items": "IReviewItem[]", "total": "number", "page": "number", "limit": "number" } }
```

---

### POST /hospitals/:hospitalId/review-queue `🔒🏥`
```json
{
  "patientId": "string (required)",
  "type": "lab_result | vitals | medication | procedure | document | other",
  "referenceId": "string",
  "title": "string",
  "summary?": "string",
  "priority?": "routine | urgent | stat"
}
```
**Response 201** `{ "data": { "item": IReviewItem } }`

> `patientId` is required.  
> `type` is an enum (not a free-form string): `lab_result | vitals | medication | procedure | document | other`.  
> `referenceId` replaces `resourceId`; `type` replaces `resourceType` from older docs.  
> `priority` enum is `routine | urgent | stat` (not `low | normal | high | critical`).

---

### GET /hospitals/:hospitalId/review-queue/:itemId `🔒🏥`
**Response 200** `{ "data": { "item": IReviewItem } }`

---

### POST /hospitals/:hospitalId/review-queue/:itemId/act `🔒🏥`
```json
{ "action": "approve | reject | escalate", "note?": "string" }
```
**Response 200** `{ "data": { "item": IReviewItem } }`

- Approving/rejecting an already-resolved item returns **409**
- Acting on an item from the wrong hospital returns **404**
- Invalid `action` value returns **400** with `validation_error`

---

## Audit Log

### GET /hospitals/:hospitalId/audit-log `🔒🏥` `[super_admin, hospital_admin]`
Query: `page`, `limit`, `action?`, `actorId?`

**Response 200** (paginated)
```json
{ "data": { "items": "IAuditEntry[]", "total": "number", "page": "number", "limit": "number" } }
```

---

## Notifications

### GET /hospitals/:hospitalId/notifications `🔒🏥`
Query: `page`, `limit`, `unread?` (`true` / `false`)

**Response 200** (paginated)
```json
{ "data": { "items": "INotification[]", "total": "number", "page": "number", "limit": "number" } }
```

---

### POST /hospitals/:hospitalId/notifications/:notificationId/read `🔒🏥`
Mark one notification read. **Response 200**

---

### POST /hospitals/:hospitalId/notifications/read-all `🔒🏥`
Mark all notifications read. **Response 204**

---

## Global Search

### GET /hospitals/:hospitalId/search `🔒🏥`
Query: `q` (min 1, max 200 chars), `types?` (comma-separated: `patients,assets,labs`), `limit?` (default 5, max 20)

**Response 200**
```json
{
  "data": {
    "results": {
      "patients": [],
      "assets": [],
      "labs": []
    },
    "total": "number"
  }
}
```

---

## Health

### GET /api/v1/health
> Note: The `/api/v1` prefix is required even for the health endpoint.

**Response 200**
```json
{
  "data": {
    "status": "ok",
    "time": "ISO date",
    "service": "medcord-api",
    "env": "development"
  }
}
```

---

## Error Envelope

All error responses use this envelope:
```json
{
  "error": {
    "code": "snake_case_error_code",
    "message": "Human-readable message"
  }
}
```

Validation errors include an additional `fieldErrors` object:
```json
{
  "error": {
    "code": "validation_error",
    "message": "Validation failed",
    "fieldErrors": {
      "fieldName": ["error message"]
    }
  }
}
```

| HTTP | `error.code` | Meaning |
|------|--------------|---------|
| 400 | `validation_error` | Zod parse failure |
| 401 | `unauthorized` | Missing / invalid / expired token |
| 401 | `invalid_credentials` | Wrong email or password |
| 403 | `forbidden` | Authenticated but insufficient role/scope |
| 404 | `not_found` | Resource doesn't exist |
| 409 | `conflict` | Duplicate or state conflict |
| 500 | `internal_error` | Unhandled server error |

---

## Success Envelope

All successful responses with a body use:
```json
{ "data": { ... } }
```
Endpoints that return **204** have an empty body.

---

## Pagination

All list endpoints return:
```json
{ "data": { "items": [], "total": "number", "page": "number", "limit": "number" } }
```
Default `limit` is **10** unless noted otherwise.  
Exceptions: `GET /patients/recent` and `GET /patients/favorites` return `{ "data": { "patients": [] } }` without pagination metadata.

---

## Common Response Fields

All resources include `createdAt` and `updatedAt` ISO date strings.  
Mongoose internal fields (`_id`, `__v`) may appear in responses — use the `id` field (string) as the canonical identifier.

---

## Legend

- `🔒` — requires `Authorization: Bearer <accessToken>`
- `🏥` — requires active hospital membership (`hospitalScope` middleware)
- `[roles]` — further restricted to listed roles via `requireRole`

**Role groups:**
- Clinical roles: `doctor`, `nurse`, `nurse_practitioner`, `physician_assistant`
- Prescriber roles: `doctor`, `nurse_practitioner`, `physician_assistant`
- Admin roles: `super_admin`, `hospital_admin`
