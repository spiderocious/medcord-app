export const PERMISSIONS = {
  // Staff
  STAFF_VIEW:         'staff.view',
  STAFF_INVITE:       'staff.invite',
  STAFF_UPDATE:       'staff.update',
  STAFF_SUSPEND:      'staff.suspend',
  STAFF_REMOVE:       'staff.remove',
  STAFF_ROLES_MANAGE: 'staff.roles.manage',

  // Patients
  PATIENT_VIEW:     'patient.view',
  PATIENT_CREATE:   'patient.create',
  PATIENT_UPDATE:   'patient.update',
  PATIENT_ADMIT:    'patient.admit',
  PATIENT_TRANSFER: 'patient.transfer',

  // EMR
  EMR_VIEW:                'emr.view',
  EMR_VITALS_RECORD:       'emr.vitals.record',
  EMR_MEDICATIONS_VIEW:    'emr.medications.view',
  EMR_MEDICATIONS_WRITE:   'emr.medications.write',
  EMR_HISTORY_WRITE:       'emr.history.write',
  EMR_PROCEDURES_WRITE:    'emr.procedures.write',
  EMR_IMMUNIZATIONS_WRITE: 'emr.immunizations.write',
  EMR_DOCUMENTS_WRITE:     'emr.documents.write',
  EMR_ACCESS_LOG_VIEW:     'emr.access_log.view',
  EMR_BREAK_GLASS:         'emr.break_glass',

  // Labs
  LAB_VIEW:    'lab.view',
  LAB_CREATE:  'lab.create',
  LAB_PROCESS: 'lab.process',
  LAB_RELEASE: 'lab.release',

  // Assets
  ASSET_VIEW:   'asset.view',
  ASSET_CREATE: 'asset.create',
  ASSET_UPDATE: 'asset.update',
  ASSET_STATUS: 'asset.status',
  ASSET_MOVE:   'asset.move',
  ASSET_DELETE: 'asset.delete',

  // Review
  REVIEW_VIEW: 'review.view',
  REVIEW_ACT:  'review.act',

  // Workspace / Settings
  SETTINGS_VIEW:      'settings.view',
  SETTINGS_UPDATE:    'settings.update',
  MODULES_MANAGE:     'modules.manage',
  AUDIT_VIEW:         'audit.view',
  SEARCH_USE:         'search.use',
  NOTIFICATIONS_VIEW: 'notifications.view',
  UNITS_MANAGE:       'units.manage',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS) as Permission[];

// Sentinel stored in JWT for super_admin — checked by middleware to bypass permission checks
export const SUPER_ADMIN_SENTINEL = '__super_admin__';
