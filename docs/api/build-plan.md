# Caelum — Backend Build Plan

> Express + TypeScript + MongoDB. This document is the single reference for what we're building, in what order, and how each module maps to the MVP spec.

---

## Stack decisions (locked)

| Concern | Choice |
|---|---|
| Runtime | Node.js ≥ 20 |
| Framework | Express |
| Language | TypeScript (strict) |
| Database | MongoDB via Mongoose |
| Validation | Zod (feature.schema.ts per feature) |
| Auth | JWT access + refresh tokens |
| File storage | TBD (S3-compatible — needed for patient photos, documents, asset photos) |
| Email | TBD (needed for invitations, verification, notifications) |
| Real-time | Socket.io — deferred to when notifications module is wired |

---

## Architecture (already established)

```
apps/main-backend/src/
├── features/          # One folder per domain feature
│   └── <name>/
│       ├── index.ts              # register(app) — mounts router
│       ├── <name>.routes.ts      # Route definitions + asyncHandler
│       ├── <name>.service.ts     # Business logic (ServiceResult pattern)
│       ├── <name>.repo.ts        # DB queries — all Mongoose calls live here
│       ├── <name>.schema.ts      # Zod schemas for request validation
│       └── <name>.types.ts       # TS interfaces for this domain
├── lib/               # asyncHandler, ResponseUtil, AppError subclasses
├── middlewares/       # auth, requestId, requestLog, errorHandler
└── shared/
    ├── types/         # Envelope types, common interfaces
    └── constants/     # HTTP status, message codes
```

Response envelope (always):
```
Success  →  { data, meta? }
Error    →  { error: { code, message, field_errors? } }
```

---

## Build order

Modules are ordered by dependency. Each module unlocks the next.

---

### Phase 0 — Foundation (pre-feature work)

Things that every feature depends on. Do this first, touch it once.

- [ ] MongoDB connection utility (`lib/db.ts`) with graceful connect/disconnect
- [ ] Base `AppError` class hierarchy (`lib/errors.ts`) — `NotFoundError`, `ValidationError`, `UnauthorizedError`, `ForbiddenError`, `ConflictError`
- [ ] `ServiceResult<T>` pattern — `ServiceSuccess<T>` / `ServiceError` classes (`shared/types/service.types.ts`)
- [ ] Auth middleware — JWT verify, attach `req.user` (`middlewares/auth.middleware.ts`)
- [ ] Role-based `authorize(...roles)` middleware
- [ ] Hospital-scoping middleware — attach `req.hospitalId` from param or token claim
- [ ] Mongoose base schema config — `id` (prefixed string), `createdAt`, `updatedAt`, `isDeleted` soft-delete flag
- [ ] ID generator utility — prefixed human-readable IDs (e.g. `USR-`, `HSP-`, `PAT-`)

---

### Phase 1 — Auth & Identity (Module 1.1)

The login wall. Nothing else works without this.

**Endpoints:**
```
POST   /api/v1/auth/register          # Create platform account
POST   /api/v1/auth/verify-email      # Email verification
POST   /api/v1/auth/login             # Email + password → tokens
POST   /api/v1/auth/refresh           # Rotate access + refresh token
POST   /api/v1/auth/logout            # Revoke refresh token
POST   /api/v1/auth/forgot-password   # Trigger reset email
POST   /api/v1/auth/reset-password    # Consume reset token, set new password
POST   /api/v1/auth/setup-2fa         # Generate TOTP secret
POST   /api/v1/auth/verify-2fa        # Confirm TOTP code → enable 2FA
GET    /api/v1/auth/me                # Current user profile
PATCH  /api/v1/auth/me                # Update name, photo, contact
PATCH  /api/v1/auth/me/password       # Change password
```

**Data model:** `User` — `id`, `email`, `passwordHash`, `name`, `photo`, `phone`, `isEmailVerified`, `twoFactorSecret`, `twoFactorEnabled`, `refreshTokenHash`, `createdAt`, `updatedAt`

---

### Phase 2 — Hospital Workspace (Module 1.2 + 1.3)

Core multi-tenancy. Every subsequent feature is hospital-scoped.

**Endpoints:**
```
POST   /api/v1/hospitals                         # Create hospital (caller becomes super-admin)
GET    /api/v1/hospitals                         # List hospitals I belong to
GET    /api/v1/hospitals/:hospitalId             # Get hospital profile
PATCH  /api/v1/hospitals/:hospitalId             # Update hospital profile
PATCH  /api/v1/hospitals/:hospitalId/branding    # Logo, colors, ID card template
PATCH  /api/v1/hospitals/:hospitalId/modules     # Enable/disable feature modules
GET    /api/v1/hospitals/:hospitalId/domain      # Subdomain + custom domain info
PATCH  /api/v1/hospitals/:hospitalId/domain      # Mark custom domain as configured
GET    /api/v1/hospitals/:hospitalId/usage       # Staff count, patient count, storage
POST   /api/v1/hospitals/:hospitalId/transfer    # Transfer ownership
DELETE /api/v1/hospitals/:hospitalId             # Archive / delete hospital
```

**Data model:** `Hospital` — `id`, `name`, `type`, `location`, `contact`, `logoUrl`, `branding` (colors, idCardTemplate), `subdomain`, `customDomain`, `modules` (enabled flags), `plan`, `ownerId`, `isArchived`, `createdAt`, `updatedAt`

**Data model:** `HospitalMember` — `id`, `hospitalId`, `userId`, `role`, `department`, `unit`, `managerId`, `status` (active/suspended), `joinedAt`

---

### Phase 3 — Staff Invitation & Directory (Module 1.4 + 1.5 + 2.x)

Who's in the hospital and what can they do.

**Endpoints:**
```
POST   /api/v1/hospitals/:hospitalId/invitations              # Invite via email
POST   /api/v1/hospitals/:hospitalId/invitations/bulk         # CSV bulk invite
GET    /api/v1/hospitals/:hospitalId/invitations              # List pending invitations
DELETE /api/v1/hospitals/:hospitalId/invitations/:id          # Revoke invitation
POST   /api/v1/hospitals/:hospitalId/invitations/:id/resend   # Resend invite email
POST   /api/v1/invitations/:token/accept                      # Accept invite (join hospital)
POST   /api/v1/invitations/:token/decline                     # Decline invite

GET    /api/v1/hospitals/:hospitalId/staff                    # Staff directory
GET    /api/v1/hospitals/:hospitalId/staff/:memberId          # Single staff profile
PATCH  /api/v1/hospitals/:hospitalId/staff/:memberId          # Edit role/dept/manager
POST   /api/v1/hospitals/:hospitalId/staff/:memberId/suspend  # Suspend
POST   /api/v1/hospitals/:hospitalId/staff/:memberId/activate # Reactivate
DELETE /api/v1/hospitals/:hospitalId/staff/:memberId          # Remove from hospital

GET    /api/v1/hospitals/:hospitalId/roles                    # List roles + default permissions
POST   /api/v1/hospitals/:hospitalId/roles                    # Create custom role
PATCH  /api/v1/hospitals/:hospitalId/roles/:roleId            # Edit custom role
GET    /api/v1/hospitals/:hospitalId/org-chart                # Reporting hierarchy

GET    /api/v1/hospitals/:hospitalId/share                    # Shareable link + QR
```

**Data model:** `Invitation` — `id`, `hospitalId`, `email`, `role`, `department`, `unit`, `invitedBy`, `token`, `status` (pending/accepted/declined/revoked), `expiresAt`

**Data model:** `Role` — `id`, `hospitalId` (null = system role), `name`, `slug`, `permissions[]`, `isCustom`

---

### Phase 4 — Patient Management (Module 3)

The first clinical data. Patient codes are platform-global.

**Endpoints:**
```
POST   /api/v1/hospitals/:hospitalId/patients                         # Register patient
GET    /api/v1/hospitals/:hospitalId/patients                         # Search / list
GET    /api/v1/hospitals/:hospitalId/patients/:patientId              # Patient profile
PATCH  /api/v1/hospitals/:hospitalId/patients/:patientId              # Update demographics
GET    /api/v1/hospitals/:hospitalId/patients/:patientId/id-card      # ID card data
POST   /api/v1/hospitals/:hospitalId/patients/:patientId/id-card      # Issue / reissue card
DELETE /api/v1/hospitals/:hospitalId/patients/:patientId/id-card      # Deactivate card
POST   /api/v1/hospitals/:hospitalId/patients/:patientId/checkin      # Check in
POST   /api/v1/hospitals/:hospitalId/patients/:patientId/checkout     # Check out
POST   /api/v1/hospitals/:hospitalId/patients/:patientId/admit        # Admit (inpatient)
POST   /api/v1/hospitals/:hospitalId/patients/:patientId/discharge    # Initiate discharge
POST   /api/v1/hospitals/:hospitalId/patients/:patientId/transfer     # Inter-hospital transfer
GET    /api/v1/hospitals/:hospitalId/transfers/incoming               # Incoming transfer queue
POST   /api/v1/hospitals/:hospitalId/transfers/:transferId/accept     # Accept transfer
POST   /api/v1/hospitals/:hospitalId/transfers/:transferId/decline    # Decline transfer

GET    /api/v1/patients/lookup/:patientCode                           # Platform-global lookup by code
GET    /api/v1/hospitals/:hospitalId/patients/recent                  # Recently accessed
POST   /api/v1/hospitals/:hospitalId/patients/:patientId/favorite     # Star patient
DELETE /api/v1/hospitals/:hospitalId/patients/:patientId/favorite     # Unstar
```

**Data model:** `Patient` — `patientCode` (globally unique, e.g. `CAE-3F8K-2P9X`), `registeredAt` (hospitalId), `demographics`, `emergencyContact`, `guarantor`, `photo`, `documents[]`, `idCard` (status, issuedAt)

**Data model:** `Transfer` — `id`, `patientId`, `fromHospitalId`, `toHospitalId`, `reason`, `department`, `recordsPackage`, `status` (pending/accepted/declined), `requestedBy`, `respondedBy`

---

### Phase 5 — EMR / Medical Records (Module 4)

The chart. All sub-sections live under `/patients/:patientId/chart/`.

**Endpoints:**
```
GET    .../chart                              # Chart summary
GET    .../chart/vitals                       # Vitals history
POST   .../chart/vitals                       # Record vitals
GET    .../chart/medications                  # Medication list
POST   .../chart/medications                  # Add medication
PATCH  .../chart/medications/:id             # Discontinue / hold
GET    .../chart/history                      # Medical history
PATCH  .../chart/history                      # Update (diagnoses, procedures, family, social)
GET    .../chart/procedures                   # Procedures list
POST   .../chart/procedures                   # Record procedure
GET    .../chart/immunizations                # Immunization history
POST   .../chart/immunizations                # Record vaccine
GET    .../chart/documents                    # Document repository
POST   .../chart/documents                    # Upload document
GET    .../chart/documents/:id                # Download / preview
PATCH  .../chart/documents/:id               # Update category / sensitivity
GET    .../chart/access-log                   # Chart access log (admin/compliance)
POST   .../chart/break-glass                  # Emergency access with reason
```

**Data models:** `Vitals`, `Medication`, `MedicalHistory`, `Procedure`, `Immunization`, `ChartDocument`, `ChartAccessLog` — all carrying `patientId`, `hospitalId`, `recordedBy`, timestamps.

**Cross-cutting:** Every chart read writes to `ChartAccessLog`. Break-glass events flagged for review.

---

### Phase 6 — Labs (Module 5)

State-machine-driven. Lab order moves through 7 states.

**States:** `awaiting_sample → sample_received → awaiting_test → in_progress → awaiting_result → result_ready → result_released`

**Endpoints:**
```
POST   /api/v1/hospitals/:hospitalId/lab-orders                       # Create order (doctor)
GET    /api/v1/hospitals/:hospitalId/lab-orders                       # Order queue (lab tech)
GET    /api/v1/hospitals/:hospitalId/lab-orders/:orderId              # Single order
PATCH  /api/v1/hospitals/:hospitalId/lab-orders/:orderId/state        # Advance state
POST   /api/v1/hospitals/:hospitalId/lab-orders/:orderId/results      # Enter results
POST   /api/v1/hospitals/:hospitalId/lab-orders/:orderId/acknowledge  # Provider acknowledges
POST   /api/v1/hospitals/:hospitalId/lab-orders/:orderId/sign-off     # Provider signs off
GET    /api/v1/hospitals/:hospitalId/patients/:patientId/lab-results  # Results on chart
```

**Data model:** `LabOrder` — `id`, `patientId`, `hospitalId`, `tests[]`, `priority`, `specimenType`, `state`, `stateHistory[]` (who moved it, when), `results[]` (value, unit, refRange, flag), `orderedBy`, `acknowledgedBy`, `signedOffBy`

---

### Phase 7 — Asset Registry (Module 6)

No patient data. Standalone within the hospital.

**Endpoints:**
```
POST   /api/v1/hospitals/:hospitalId/assets                           # Register asset
GET    /api/v1/hospitals/:hospitalId/assets                           # List / search
GET    /api/v1/hospitals/:hospitalId/assets/:assetId                  # Asset detail
PATCH  /api/v1/hospitals/:hospitalId/assets/:assetId                  # Edit
DELETE /api/v1/hospitals/:hospitalId/assets/:assetId                  # Archive
POST   /api/v1/hospitals/:hospitalId/assets/bulk                      # CSV import
GET    /api/v1/hospitals/:hospitalId/assets/:assetId/label            # Generate QR/barcode
PATCH  /api/v1/hospitals/:hospitalId/assets/:assetId/location         # Move asset
GET    /api/v1/hospitals/:hospitalId/assets/:assetId/history          # Location history
GET    /api/v1/assets/scan/:code                                      # Public scan lookup
```

**Data model:** `Asset` — `id`, `hospitalId`, `name`, `type`, `manufacturer`, `model`, `serialNumber`, `purchaseDate`, `cost`, `photos[]`, `tags[]`, `parentId`, `location` (department, room, shelf), `locationHistory[]`, `qrCode`, `barcode`, `rfidTag`, `isArchived`

---

### Phase 8 — Cross-cutting infrastructure

Build incrementally as each module needs it, but design the interfaces upfront.

**Approval/Review system:**
- `ReviewQueue` collection — any reviewable entity (lab result, note, prescription, transfer) registers a review item
- States: `pending → approved / rejected / changes_requested`
- Endpoints under `/api/v1/hospitals/:hospitalId/review-queue`

**Audit log:**
- `AuditLog` collection — append-only, every write action across all features
- `who`, `action`, `resource`, `resourceId`, `hospitalId`, `ip`, `userAgent`, `timestamp`
- Indexable, exportable, immutable (no update/delete routes)

**Notifications:**
- `Notification` collection + delivery queue
- In-app: GET `/api/v1/me/notifications`
- Email/SMS via background job (trigger on: critical lab, approval request, transfer, invite)

**Global search:**
- GET `/api/v1/hospitals/:hospitalId/search?q=&scope=patients,staff,assets,labs`
- Results respect role-based access control

---

## Feature gate map

Each endpoint checks `hospital.modules` before processing. Gating is a no-op for now (all hospitals are Pro and all modules enabled) but the check must be in place from day one.

| Module flag | Gates |
|---|---|
| `emr` | All chart endpoints |
| `labs` | All lab-order endpoints |
| `assets` | All asset endpoints |
| `online_consultation` | Deferred to v2 |

---

## What we're explicitly NOT building (MVP)

- Continuous vitals monitoring (v2)
- Pharmacy / e-prescribing integration (Surescripts — PDF prescription only for now)
- Staff credentialing / license tracking (v2)
- Billing / insurance claims (v2)
- ICU workflows (requires continuous monitoring — v2)