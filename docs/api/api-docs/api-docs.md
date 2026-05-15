# Medcord API Reference

**Base URL**: `http://localhost:8085`  
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
{ "data": { "user": { "id", "email", "name" }, "tokens": { "accessToken", "refreshToken" } } }
```

### POST /auth/login
```json
{ "email": "string", "password": "string", "totpCode?": "string (required if 2FA enabled)" }
```
**Response 200** — same shape as register.  
If 2FA is enabled and `totpCode` is absent → **401**.

### POST /auth/refresh
```json
{ "refreshToken": "string" }
```
**Response 200**
```json
{ "data": { "tokens": { "accessToken", "refreshToken" } } }
```

### POST /auth/logout `🔒`
```json
{ "refreshToken": "string" }
```
**Response 204**

### POST /auth/setup-2fa `🔒`
Generates a new TOTP secret. Does **not** enable 2FA yet — call `/auth/verify-2fa` to activate.  
**Response 200**
```json
{ "data": { "secret": "string", "otpauthUrl": "string" } }
```

### POST /auth/verify-2fa `🔒`
```json
{ "totpCode": "string", "secret": "string" }
```
**Response 204** — 2FA is now active on the account.

### GET /auth/me `🔒`
**Response 200** `{ "data": { "user": IUser } }`

### PATCH /auth/me `🔒`
```json
{ "name?": "string", "phone?": "string", "photoKey?": "string" }
```
**Response 200** `{ "data": { "user": IUser } }`

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
  "type": "general | specialist | clinic | pharmacy | laboratory | other",
  "subdomain": "string (slug)",
  "timezone": "string (IANA)",
  "locale": "string",
  "location?": { "address?", "city?", "state?", "country?", "postalCode?" },
  "contact?": { "email?", "phone?", "website?" }
}
```
**Response 201** `{ "data": { "hospital": IHospital } }`

### GET /hospitals `🔒`
List all hospitals the caller is a member of.  
**Response 200** `{ "data": { "hospitals": IHospital[] } }`

### GET /hospitals/:hospitalId `🔒🏥`
**Response 200** `{ "data": { "hospital": IHospital } }`

### PATCH /hospitals/:hospitalId `🔒🏥` `[super_admin, hospital_admin]`
```json
{ "name?": "string", "type?": "...", "timezone?": "string", "locale?": "string", "location?": {...}, "contact?": {...} }
```
**Response 200** `{ "data": { "hospital": IHospital } }`

### PATCH /hospitals/:hospitalId/branding `🔒🏥` `[super_admin]`
```json
{ "logoKey?": "string", "primaryColor?": "string", "secondaryColor?": "string", "tagline?": "string" }
```

### PATCH /hospitals/:hospitalId/modules `🔒🏥` `[super_admin]`
```json
{ "emr?": true, "labs?": true, "assets?": true, "onlineConsultation?": false }
```

### GET /hospitals/:hospitalId/domain `🔒🏥`
```json
{ "data": { "subdomain", "subdomainUrl", "customDomain?", "customDomainVerified" } }
```

### PATCH /hospitals/:hospitalId/domain `🔒🏥` `[super_admin]`
```json
{ "customDomain?": "string" }
```

### GET /hospitals/:hospitalId/usage `🔒🏥` `[super_admin, hospital_admin]`
```json
{ "data": { "members": 12 } }
```

### POST /hospitals/:hospitalId/transfer-ownership `🔒🏥` `[super_admin]`
```json
{ "newOwnerId": "string (userId of existing member)" }
```

### DELETE /hospitals/:hospitalId `🔒🏥` `[super_admin]`
Archives the hospital. **Response 204**

---

## Staff

All staff routes are scoped to `/hospitals/:hospitalId/`.

### POST /hospitals/:hospitalId/invitations `🔒🏥` `[super_admin, hospital_admin]`
```json
{ "email": "string", "role": "StaffRole", "department?": "string", "unit?": "string" }
```
**Response 201** `{ "data": { "invitation": IInvitation } }`

### POST /hospitals/:hospitalId/invitations/bulk `🔒🏥` `[super_admin, hospital_admin]`
```json
{ "invitations": [{ "email", "role", "department?", "unit?" }, ...] }
```

### GET /hospitals/:hospitalId/invitations `🔒🏥` `[super_admin, hospital_admin]`
**Response 200** `{ "data": { "invitations": IInvitation[] } }`

### DELETE /hospitals/:hospitalId/invitations/:invitationId `🔒🏥` `[super_admin, hospital_admin]`
Revoke a pending invitation. **Response 204**

### POST /hospitals/:hospitalId/invitations/:invitationId/resend `🔒🏥` `[super_admin, hospital_admin]`
Resets TTL and sends a new email. **Response 200**

### POST /auth/invitations/accept (public)
Accept an invitation by token.
```json
{ "token": "string" }
```
Requires authenticated user (Bearer token). **Response 200** `{ "data": { "hospitalId": "string" } }`

### POST /auth/invitations/decline (public)
```json
{ "token": "string" }
```

### GET /hospitals/:hospitalId/staff `🔒🏥`
Query: `page`, `limit`, `role?`, `status?`  
**Response 200** (paginated) `{ "data": { "items": IHospitalMember[], "total", "page", "limit", "totalPages" } }`

### GET /hospitals/:hospitalId/staff/:memberId `🔒🏥`
**Response 200** `{ "data": { "member": IHospitalMember } }`

### PATCH /hospitals/:hospitalId/staff/:memberId `🔒🏥` `[super_admin, hospital_admin]`
```json
{ "role?": "StaffRole", "department?": "string", "unit?": "string", "specialty?": "string" }
```

### POST /hospitals/:hospitalId/staff/:memberId/suspend `🔒🏥` `[super_admin, hospital_admin]`
**Response 204**

### POST /hospitals/:hospitalId/staff/:memberId/activate `🔒🏥` `[super_admin, hospital_admin]`
**Response 204**

### DELETE /hospitals/:hospitalId/staff/:memberId `🔒🏥` `[super_admin, hospital_admin]`
**Response 204**

### GET /hospitals/:hospitalId/roles `🔒🏥`
**Response 200** `{ "data": { "roles": ICustomRole[] } }`

### POST /hospitals/:hospitalId/roles `🔒🏥` `[super_admin]`
```json
{ "name": "string", "slug": "string", "permissions": string[] }
```

### PATCH /hospitals/:hospitalId/roles/:roleId `🔒🏥` `[super_admin]`

### GET /hospitals/:hospitalId/org-chart `🔒🏥`
**Response 200** `{ "data": { "chart": [{id, userId, role, department, managerId}] } }`

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
    "firstName": "string", "lastName": "string", "dateOfBirth": "ISO date",
    "gender": "male|female|other|prefer_not_to_say",
    "bloodGroup?": "A+|A-|B+|B-|AB+|AB-|O+|O-",
    "address?": {...}, "nationality?": "string", "occupation?": "string",
    "maritalStatus?": "single|married|divorced|widowed|other"
  },
  "emergencyContact?": { "name?", "relationship?", "phone?", "address?": {...} },
  "guarantor?": { "name?", "relationship?", "phone?", "address?": {...}, "idType?", "idNumber?", "employer?", "occupation?" },
  "photoKey?": "string",
  "documentKeys?": "string[]"
}
```
**Response 201** `{ "data": { "patient": IPatient, "possibleDuplicates": IPatient[] } }`

### GET /hospitals/:hospitalId/patients `🔒🏥`
Query: `page`, `limit`, `q?` (searches firstName, lastName, patientCode)  
**Response 200** paginated.

### GET /hospitals/:hospitalId/patients/recent `🔒🏥`
Last 10 patients accessed by the caller.

### GET /hospitals/:hospitalId/patients/:patientId `🔒🏥`

### PATCH /hospitals/:hospitalId/patients/:patientId `🔒🏥`
Partial update of demographics, emergencyContact, guarantor, photoKey, documentKeys.

### GET /hospitals/:hospitalId/patients/:patientId/id-card `🔒🏥`
```json
{ "data": { "patient": IPatient, "idCard": { "isActive", "issuedAt?", "reissuedAt?" } } }
```

### POST /hospitals/:hospitalId/patients/:patientId/id-card `🔒🏥`
Issue or re-issue card.

### DELETE /hospitals/:hospitalId/patients/:patientId/id-card `🔒🏥`
Deactivate card. **Response 204**

### POST /hospitals/:hospitalId/patients/:patientId/checkin `🔒🏥`
```json
{ "visitType?": "string", "referredBy?": "string", "chiefComplaint?": "string" }
```

### POST /hospitals/:hospitalId/patients/:patientId/checkout `🔒🏥`

### POST /hospitals/:hospitalId/patients/:patientId/admit `🔒🏥`
```json
{ "ward?": "string", "bed?": "string", "admittingDoctorId?": "string", "admissionReason?": "string" }
```

### POST /hospitals/:hospitalId/patients/:patientId/discharge `🔒🏥`
```json
{ "dischargeSummary?": "string", "followUpDate?": "ISO date", "dischargeInstructions?": "string" }
```

### POST /hospitals/:hospitalId/patients/:patientId/transfer `🔒🏥`
Request inter-hospital transfer.
```json
{ "toHospitalId": "string", "reason": "string", "department?": "string", "recordsPackage?": "string[]" }
```
**Response 201** `{ "data": { "transfer": ITransfer } }`

### GET /hospitals/:hospitalId/transfers/incoming `🔒🏥`
List pending incoming transfers.

### POST /hospitals/:hospitalId/transfers/:transferId/accept `🔒🏥`
### POST /hospitals/:hospitalId/transfers/:transferId/decline `🔒🏥`

### POST /hospitals/:hospitalId/patients/:patientId/favorite `🔒🏥`
**Response 204**

### DELETE /hospitals/:hospitalId/patients/:patientId/favorite `🔒🏥`
**Response 204**

---

## EMR (Electronic Medical Records)

All EMR routes: `/hospitals/:hospitalId/patients/:patientId/...`

### GET .../chart `🔒🏥`
Full chart summary (vitals latest, active medications, history, recent procedures, immunizations, documents).

### GET .../chart/vitals `🔒🏥`
Query: `limit?` (number). Returns array newest-first.

### POST .../chart/vitals `🔒🏥`
```json
{
  "temperature?": "number", "temperatureUnit?": "C|F",
  "heartRate?": "number", "bloodPressureSystolic?": "number", "bloodPressureDiastolic?": "number",
  "respiratoryRate?": "number", "oxygenSaturation?": "number", "weight?": "number",
  "weightUnit?": "kg|lbs", "height?": "number", "heightUnit?": "cm|in",
  "bmi?": "number", "bloodGlucose?": "number", "bloodGlucoseUnit?": "mg/dL|mmol/L",
  "notes?": "string"
}
```

### GET .../chart/medications `🔒🏥`
### POST .../chart/medications `🔒🏥` `[doctor, nurse_practitioner, physician_assistant]`
```json
{
  "name": "string", "dosage": "string", "frequency": "string",
  "route?": "string", "startDate?": "ISO date", "endDate?": "ISO date",
  "prescribedBy?": "string", "instructions?": "string", "status?": "active|discontinued|completed"
}
```

### PATCH .../chart/medications/:medId `🔒🏥` `[doctor, nurse_practitioner, physician_assistant]`

### GET .../chart/history `🔒🏥`
Returns full medical history object.

### PATCH .../chart/history `🔒🏥` `[clinical roles]`
Append/update medical history fields:
```json
{
  "diagnoses?": [{ "code?", "name", "type": "primary|secondary|chronic|acute", "onsetDate?", "resolvedDate?", "notes?" }],
  "procedures?": [{ "code?", "name", "performedAt?", "performedBy?", "notes?" }],
  "allergies?": [{ "substance", "reaction?", "severity?": "mild|moderate|severe", "onsetDate?" }],
  "familyHistory?": [{ "relation", "condition", "notes?" }],
  "socialHistory?": { "smokingStatus?", "alcoholUse?", "exerciseFrequency?", "occupation?", "diet?", "notes?" }
}
```

### GET .../chart/procedures `🔒🏥`
### POST .../chart/procedures `🔒🏥` `[clinical roles]`
```json
{ "name": "string", "code?": "string", "performedBy": "string", "performedAt?": "ISO date", "notes?": "string", "fileKeys?": "string[]" }
```

### GET .../chart/immunizations `🔒🏥`
### POST .../chart/immunizations `🔒🏥` `[clinical roles]`
```json
{ "vaccine": "string", "dose?": "string", "administeredAt?": "ISO date", "administeredBy?": "string", "batchNumber?": "string", "nextDueDate?": "ISO date", "notes?": "string" }
```

### GET .../chart/documents `🔒🏥`
### POST .../chart/documents `🔒🏥`
```json
{ "title": "string", "type": "lab_result|imaging|prescription|referral|consent|discharge_summary|other", "fileKey": "string", "notes?": "string" }
```

### PATCH .../chart/documents/:docId `🔒🏥`

### GET .../chart/access-log `🔒🏥` `[super_admin, hospital_admin]`
Query: `page`, `limit`. Returns paginated access log entries.

### POST .../chart/break-glass `🔒🏥`
Emergency access override.
```json
{ "reason": "string" }
```
**Response 204** — Access is logged with IP and user-agent.

---

## Lab Orders

Routes: `/hospitals/:hospitalId/patients/:patientId/lab-orders/...`

### GET .../lab-orders `🔒🏥`
Query: `page`, `limit`, `status?`, `priority?`

### POST .../lab-orders `🔒🏥`
```json
{
  "testName": "string", "testCode?": "string", "category?": "string",
  "priority": "routine|urgent|stat",
  "sampleType?": "string", "notes?": "string", "fileKey?": "string"
}
```
**Response 201** — Initial status: `awaiting_sample`

### GET .../lab-orders/:orderId `🔒🏥`
### PATCH .../lab-orders/:orderId `🔒🏥`
Update notes/fileKey/category before release.

### POST .../lab-orders/:orderId/advance `🔒🏥`
Advance through the 7-state machine.
```json
{ "note?": "string" }
```
State machine (one step at a time, no skipping):
```
awaiting_sample → sample_received → awaiting_test → in_progress → awaiting_result → result_ready → result_released
```

### POST .../lab-orders/:orderId/result `🔒🏥`
Record test result. Only valid when status is `awaiting_result` or `result_ready`.
```json
{
  "value": "string", "unit?": "string", "referenceRange?": "string",
  "isAbnormal": "boolean", "notes?": "string"
}
```

---

## Assets

Routes: `/hospitals/:hospitalId/assets/...`

### GET /hospitals/:hospitalId/assets `🔒🏥`
Query: `page`, `limit`, `category?`, `status?`, `location?`

### POST /hospitals/:hospitalId/assets `🔒🏥`
```json
{
  "name": "string", "category": "string", "assetTag?": "string",
  "manufacturer?": "string", "modelName?": "string", "serialNumber?": "string",
  "purchaseDate?": "ISO date", "purchasePrice?": "number", "warrantyExpiry?": "ISO date",
  "location?": "string", "department?": "string", "assignedTo?": "string",
  "status": "available|in_use|maintenance|retired|disposed",
  "notes?": "string", "photoKeys?": "string[]"
}
```

### GET /hospitals/:hospitalId/assets/:assetId `🔒🏥`
### PATCH /hospitals/:hospitalId/assets/:assetId `🔒🏥`
### PATCH /hospitals/:hospitalId/assets/:assetId/status `🔒🏥`
```json
{ "status": "available|in_use|maintenance|retired|disposed", "note?": "string" }
```

### POST /hospitals/:hospitalId/assets/:assetId/move `🔒🏥`
```json
{ "location": "string", "department?": "string" }
```

### POST /hospitals/:hospitalId/assets/:assetId/photos `🔒🏥`
```json
{ "fileKey": "string" }
```

### DELETE /hospitals/:hospitalId/assets/:assetId/photos/:fileKey `🔒🏥`
### DELETE /hospitals/:hospitalId/assets/:assetId `🔒🏥`

---

## Review Queue

### GET /hospitals/:hospitalId/review-queue `🔒🏥`
Query: `page`, `limit`, `status?` (pending|approved|rejected|escalated), `resourceType?`

### POST /hospitals/:hospitalId/review-queue `🔒🏥`
```json
{
  "resourceType": "string", "resourceId": "string",
  "title": "string", "description?": "string", "priority?": "low|normal|high|critical"
}
```

### GET /hospitals/:hospitalId/review-queue/:itemId `🔒🏥`

### POST /hospitals/:hospitalId/review-queue/:itemId/act `🔒🏥`
```json
{ "action": "approve|reject|escalate", "note?": "string" }
```

---

## Audit Log

### GET /hospitals/:hospitalId/audit-log `🔒🏥`
Query: `page`, `limit`, `action?`, `actorId?`  
**Response 200** paginated list of immutable audit entries.

---

## Notifications

### GET /hospitals/:hospitalId/notifications `🔒🏥`
Query: `page`, `limit`, `unread?` (true/false string)

### POST /hospitals/:hospitalId/notifications/:notificationId/read `🔒🏥`
Mark one notification read.

### POST /hospitals/:hospitalId/notifications/read-all `🔒🏥`
Mark all notifications read. **Response 204**

---

## Global Search

### GET /hospitals/:hospitalId/search `🔒🏥`
Query: `q` (min 1, max 200), `types?` (comma-separated: `patients,assets,labs`), `limit?` (default 5, max 20)

**Response 200**
```json
{
  "data": {
    "results": {
      "patients": [...],
      "assets": [...],
      "labs": [...]
    }
  }
}
```

---

## Health

### GET /health
**Response 200** `{ "status": "ok", "timestamp": "ISO date" }`

---

## Error Envelope

All error responses follow:
```json
{
  "status": "error",
  "message": "Human-readable message",
  "code": "ERROR_CODE"
}
```

| HTTP | code | meaning |
|------|------|---------|
| 400 | VALIDATION_ERROR | Zod parse failure |
| 401 | UNAUTHORIZED | Missing/invalid/expired token |
| 401 | INVALID_CREDENTIALS | Wrong email or password |
| 403 | FORBIDDEN | Authenticated but insufficient role/scope |
| 404 | NOT_FOUND | Resource doesn't exist |
| 409 | CONFLICT | Duplicate or state conflict |
| 500 | INTERNAL_ERROR | Unhandled server error |

---

## Legend

- `🔒` — requires `Authorization: Bearer <accessToken>`
- `🏥` — requires active hospital membership (hospitalScope middleware sets `req.hospitalMember`)
- `[roles]` — further restricted to listed roles via `requireRole`
