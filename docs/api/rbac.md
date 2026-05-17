# Medcord — RBAC & Permissions API Reference

Every write endpoint is guarded by `requirePermission()`. `super_admin` bypasses all checks — a sentinel value `__super_admin__` is stored in the JWT instead of a permission list. Permissions are embedded in the JWT at login and re-resolved on next login when roles change.

---

## Permission Constants

| Permission string | Constant | Description |
|---|---|---|
| `staff.view` | `STAFF_VIEW` | Can view the staff directory |
| `staff.invite` | `STAFF_INVITE` | Can invite new staff members |
| `staff.update` | `STAFF_UPDATE` | Can update staff roles and details |
| `staff.suspend` | `STAFF_SUSPEND` | Can suspend or reactivate staff members |
| `staff.remove` | `STAFF_REMOVE` | Can permanently remove staff members |
| `staff.roles.manage` | `STAFF_ROLES_MANAGE` | Can create and edit custom roles |
| `patient.view` | `PATIENT_VIEW` | Can view the patient list |
| `patient.create` | `PATIENT_CREATE` | Can register new patients |
| `patient.update` | `PATIENT_UPDATE` | Can update patient demographics |
| `patient.admit` | `PATIENT_ADMIT` | Can admit and discharge patients |
| `patient.transfer` | `PATIENT_TRANSFER` | Can initiate and accept patient transfers |
| `emr.view` | `EMR_VIEW` | Can open a patient's chart |
| `emr.vitals.record` | `EMR_VITALS_RECORD` | Can record vital signs |
| `emr.medications.view` | `EMR_MEDICATIONS_VIEW` | Can view the medication list |
| `emr.medications.write` | `EMR_MEDICATIONS_WRITE` | Can prescribe and update medications |
| `emr.history.write` | `EMR_HISTORY_WRITE` | Can add and edit medical history entries |
| `emr.procedures.write` | `EMR_PROCEDURES_WRITE` | Can record procedures |
| `emr.immunizations.write` | `EMR_IMMUNIZATIONS_WRITE` | Can record immunizations |
| `emr.documents.write` | `EMR_DOCUMENTS_WRITE` | Can upload and edit chart documents |
| `emr.access_log.view` | `EMR_ACCESS_LOG_VIEW` | Can view who accessed a patient's chart |
| `emr.break_glass` | `EMR_BREAK_GLASS` | Can use emergency break-glass chart access |
| `lab.view` | `LAB_VIEW` | Can view lab orders |
| `lab.create` | `LAB_CREATE` | Can create new lab orders |
| `lab.process` | `LAB_PROCESS` | Can advance lab order status |
| `lab.release` | `LAB_RELEASE` | Can release lab results to the patient chart |
| `asset.view` | `ASSET_VIEW` | Can view the asset list |
| `asset.create` | `ASSET_CREATE` | Can add new assets |
| `asset.update` | `ASSET_UPDATE` | Can update asset information |
| `asset.status` | `ASSET_STATUS` | Can change asset status |
| `asset.move` | `ASSET_MOVE` | Can move assets between locations |
| `asset.delete` | `ASSET_DELETE` | Can delete assets |
| `review.view` | `REVIEW_VIEW` | Can view the review queue |
| `review.act` | `REVIEW_ACT` | Can approve or reject items in the review queue |
| `settings.view` | `SETTINGS_VIEW` | Can view hospital settings |
| `settings.update` | `SETTINGS_UPDATE` | Can update hospital settings (name, branding, domain) |
| `modules.manage` | `MODULES_MANAGE` | Can enable or disable feature modules |
| `audit.view` | `AUDIT_VIEW` | Can view the hospital-wide audit log |
| `search.use` | `SEARCH_USE` | Can use global search |
| `notifications.view` | `NOTIFICATIONS_VIEW` | Can view notifications |

---

## System Roles

System roles are seeded automatically on hospital creation. They are read-only — permissions cannot be changed, and they cannot be deleted. Custom roles (user-created, `isSystem: false`) have a fully editable permission set.

### `super_admin` — Super Admin

Bypasses all permission checks. Sentinel `__super_admin__` stored in JWT instead of a permission list.

### `hospital_admin` — Hospital Admin

`staff.view`, `staff.invite`, `staff.update`, `staff.suspend`, `patient.view`, `patient.create`, `patient.update`, `patient.admit`, `patient.transfer`, `emr.view`, `emr.medications.view`, `emr.documents.write`, `emr.access_log.view`, `emr.break_glass`, `lab.view`, `asset.view`, `asset.create`, `asset.update`, `asset.status`, `asset.move`, `review.view`, `review.act`, `settings.view`, `settings.update`, `audit.view`, `search.use`, `notifications.view`

### `doctor` — Doctor

`staff.view`, `patient.view`, `patient.create`, `patient.update`, `patient.admit`, `patient.transfer`, `emr.view`, `emr.vitals.record`, `emr.medications.view`, `emr.medications.write`, `emr.history.write`, `emr.procedures.write`, `emr.immunizations.write`, `emr.documents.write`, `emr.break_glass`, `lab.view`, `lab.create`, `lab.process`, `lab.release`, `review.view`, `review.act`, `search.use`, `notifications.view`

### `nurse` — Nurse

`staff.view`, `patient.view`, `patient.create`, `patient.update`, `patient.admit`, `emr.view`, `emr.vitals.record`, `emr.medications.view`, `emr.history.write`, `emr.procedures.write`, `emr.immunizations.write`, `lab.view`, `lab.create`, `lab.process`, `review.view`, `search.use`, `notifications.view`

### `nurse_practitioner` — Nurse Practitioner

Same as `doctor`.

### `physician_assistant` — Physician Assistant

Same as `doctor`.

### `lab_tech` — Lab Technician

`staff.view`, `patient.view`, `emr.view`, `emr.medications.view`, `lab.view`, `lab.create`, `lab.process`, `search.use`, `notifications.view`

### `pharmacist` — Pharmacist

`staff.view`, `patient.view`, `emr.view`, `emr.medications.view`, `lab.view`, `search.use`, `notifications.view`

### `reception` — Receptionist

`staff.view`, `patient.view`, `patient.create`, `patient.update`, `patient.admit`, `patient.transfer`, `search.use`, `notifications.view`

### `tech` — Technician

`staff.view`, `asset.view`, `asset.create`, `asset.update`, `asset.status`, `asset.move`, `asset.delete`, `notifications.view`

---

## Endpoint Permission Map

Base path: `/api/v1`

### Hospitals

| Method | Path | Permission required | Notes |
|---|---|---|---|
| `POST` | `/hospitals` | (none — authenticated only) | Create hospital; caller becomes `super_admin` |
| `GET` | `/hospitals` | (none — authenticated only) | List hospitals I belong to |
| `GET` | `/hospitals/:hospitalId` | (none — member scope only) | Get hospital profile; seeds default roles |
| `PATCH` | `/hospitals/:hospitalId` | `settings.update` | |
| `PATCH` | `/hospitals/:hospitalId/branding` | `settings.update` | |
| `PATCH` | `/hospitals/:hospitalId/modules` | `modules.manage` | |
| `GET` | `/hospitals/:hospitalId/domain` | `settings.view` | |
| `PATCH` | `/hospitals/:hospitalId/domain` | `settings.update` | |
| `GET` | `/hospitals/:hospitalId/usage` | `settings.view` | |
| `POST` | `/hospitals/:hospitalId/transfer-ownership` | `settings.update` | |
| `DELETE` | `/hospitals/:hospitalId` | `settings.update` | Archives the hospital |

### Invitations

| Method | Path | Permission required | Notes |
|---|---|---|---|
| `POST` | `/hospitals/:hospitalId/invitations` | `staff.invite` | Role slug validated against hospital's role list |
| `POST` | `/hospitals/:hospitalId/invitations/bulk` | `staff.invite` | Up to 100 invitations per request |
| `GET` | `/hospitals/:hospitalId/invitations` | `staff.invite` | |
| `DELETE` | `/hospitals/:hospitalId/invitations/:invitationId` | `staff.invite` | Sets status to "revoked" |
| `POST` | `/hospitals/:hospitalId/invitations/:invitationId/resend` | `staff.invite` | Resets token and expiry |
| `POST` | `/invitations/:token/accept` | (public) | Creates user account + hospital membership |
| `POST` | `/invitations/:token/decline` | (public) | |
| `GET` | `/invitations/:token` | (public) | Preview invitation details before accepting |

### Staff Directory

| Method | Path | Permission required | Notes |
|---|---|---|---|
| `GET` | `/hospitals/:hospitalId/staff` | `staff.view` | |
| `GET` | `/hospitals/:hospitalId/staff/me` | (member scope only) | Returns own membership + resolved permissions |
| `GET` | `/hospitals/:hospitalId/staff/:memberId` | `staff.view` | |
| `PATCH` | `/hospitals/:hospitalId/staff/:memberId` | `staff.update` | Role change revokes user session |
| `POST` | `/hospitals/:hospitalId/staff/:memberId/suspend` | `staff.suspend` | |
| `POST` | `/hospitals/:hospitalId/staff/:memberId/activate` | `staff.suspend` | |
| `DELETE` | `/hospitals/:hospitalId/staff/:memberId` | `staff.remove` | |

### Roles

| Method | Path | Permission required | Notes |
|---|---|---|---|
| `GET` | `/hospitals/:hospitalId/roles` | (member scope only) | Returns roles + `permissionDescriptions` + `permissionGroups` |
| `POST` | `/hospitals/:hospitalId/roles` | `settings.update` | `isSystem: false`; slug must be unique per hospital |
| `PATCH` | `/hospitals/:hospitalId/roles/:roleId` | `settings.update` | Fails if `isSystem: true`; permission change revokes member sessions |
| `DELETE` | `/hospitals/:hospitalId/roles/:roleId` | `settings.update` | Fails if `isSystem: true` |

### Org Chart & Share

| Method | Path | Permission required | Notes |
|---|---|---|---|
| `GET` | `/hospitals/:hospitalId/org-chart` | (member scope only) | |
| `GET` | `/hospitals/:hospitalId/share` | (member scope only) | |

### Patients

All routes under `/hospitals/:hospitalId`.

| Method | Path | Permission required | Notes |
|---|---|---|---|
| `POST` | `/patients` | `patient.create` | |
| `GET` | `/patients` | `patient.view` | |
| `GET` | `/patients/recent` | `patient.view` | |
| `GET` | `/patients/:patientId` | `patient.view` | |
| `PATCH` | `/patients/:patientId` | `patient.update` | |
| `GET` | `/patients/:patientId/id-card` | `patient.view` | |
| `POST` | `/patients/:patientId/id-card` | `patient.update` | Issue/reissue ID card |
| `DELETE` | `/patients/:patientId/id-card` | `patient.update` | Deactivate card |
| `POST` | `/patients/:patientId/checkin` | `patient.admit` | |
| `POST` | `/patients/:patientId/checkout` | `patient.admit` | |
| `POST` | `/patients/:patientId/admit` | `patient.admit` | |
| `POST` | `/patients/:patientId/discharge` | `patient.admit` | |
| `POST` | `/patients/:patientId/transfer` | `patient.transfer` | |
| `POST` | `/patients/:patientId/favorite` | `patient.view` | |
| `DELETE` | `/patients/:patientId/favorite` | `patient.view` | |

### EMR

All routes under `/hospitals/:hospitalId/patients/:patientId`.

| Method | Path | Permission required | Notes |
|---|---|---|---|
| `GET` | `/chart` | `emr.view` | |
| `GET` | `/chart/vitals` | `emr.view` | |
| `POST` | `/chart/vitals` | `emr.vitals.record` | |
| `GET` | `/chart/medications` | `emr.medications.view` | |
| `POST` | `/chart/medications` | `emr.medications.write` | |
| `PATCH` | `/chart/medications/:medId` | `emr.medications.write` | |
| `GET` | `/chart/history` | `emr.view` | |
| `PATCH` | `/chart/history` | `emr.history.write` | |
| `GET` | `/chart/procedures` | `emr.view` | |
| `POST` | `/chart/procedures` | `emr.procedures.write` | |
| `GET` | `/chart/immunizations` | `emr.view` | |
| `POST` | `/chart/immunizations` | `emr.immunizations.write` | |
| `GET` | `/chart/documents` | `emr.view` | |
| `POST` | `/chart/documents` | `emr.documents.write` | |
| `PATCH` | `/chart/documents/:docId` | `emr.documents.write` | |
| `GET` | `/chart/access-log` | `emr.access_log.view` | |
| `POST` | `/chart/break-glass` | `emr.break_glass` | |

### Labs

All routes under `/hospitals/:hospitalId/patients/:patientId`.

| Method | Path | Permission required | Notes |
|---|---|---|---|
| `GET` | `/lab-orders` | `lab.view` | |
| `POST` | `/lab-orders` | `lab.create` | |
| `GET` | `/lab-orders/:orderId` | `lab.view` | |
| `PATCH` | `/lab-orders/:orderId` | `lab.create` | |
| `POST` | `/lab-orders/:orderId/advance` | `lab.process` | |
| `POST` | `/lab-orders/:orderId/result` | `lab.process` | |

### Assets

All routes under `/hospitals/:hospitalId`.

| Method | Path | Permission required | Notes |
|---|---|---|---|
| `GET` | `/assets` | `asset.view` | |
| `POST` | `/assets` | `asset.create` | |
| `GET` | `/assets/:assetId` | `asset.view` | |
| `PATCH` | `/assets/:assetId` | `asset.update` | |
| `PATCH` | `/assets/:assetId/status` | `asset.status` | |
| `POST` | `/assets/:assetId/move` | `asset.move` | |
| `POST` | `/assets/:assetId/photos` | `asset.update` | |
| `DELETE` | `/assets/:assetId/photos/:fileKey` | `asset.update` | |
| `DELETE` | `/assets/:assetId` | `asset.delete` | |

---

## Session Revocation

When permissions change, the affected user's session is immediately revoked by bumping `tokenVersion`. The next API call returns `401` and the user must log in again to get a new JWT with updated permissions.

| Trigger | Sessions revoked |
|---|---|
| `PATCH /staff/:memberId` with `role` | The updated member's session |
| `PATCH /roles/:roleId` with `permissions` | All members assigned that role |

---

## JWT Structure

The access token payload:

```json
{
  "sub": "USR-...",
  "email": "...",
  "tokenVersion": 0,
  "hospitalPermissions": {
    "HSP-abc": ["staff.view", "patient.view", "..."],
    "HSP-xyz": ["__super_admin__"]
  }
}
```

`__super_admin__` as the single entry means all permission checks are bypassed for that hospital. The `hospitalPermissions` map covers all hospitals the user belongs to.
