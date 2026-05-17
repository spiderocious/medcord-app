import { PERMISSIONS, type Permission } from './permissions.js';
import { ROLES, type SystemRole } from './roles.js';

export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  [PERMISSIONS.STAFF_VIEW]:         'Can view the staff directory',
  [PERMISSIONS.STAFF_INVITE]:       'Can invite new staff members',
  [PERMISSIONS.STAFF_UPDATE]:       'Can update staff roles and details',
  [PERMISSIONS.STAFF_SUSPEND]:      'Can suspend or reactivate staff members',
  [PERMISSIONS.STAFF_REMOVE]:       'Can permanently remove staff members',
  [PERMISSIONS.STAFF_ROLES_MANAGE]: 'Can create and edit custom roles',

  [PERMISSIONS.PATIENT_VIEW]:     'Can view the patient list',
  [PERMISSIONS.PATIENT_CREATE]:   'Can register new patients',
  [PERMISSIONS.PATIENT_UPDATE]:   'Can update patient demographics',
  [PERMISSIONS.PATIENT_ADMIT]:    'Can admit and discharge patients',
  [PERMISSIONS.PATIENT_TRANSFER]: 'Can initiate and accept patient transfers',

  [PERMISSIONS.EMR_VIEW]:                'Can open a patient\'s chart',
  [PERMISSIONS.EMR_VITALS_RECORD]:       'Can record vital signs',
  [PERMISSIONS.EMR_MEDICATIONS_VIEW]:    'Can view the medication list',
  [PERMISSIONS.EMR_MEDICATIONS_WRITE]:   'Can prescribe and update medications',
  [PERMISSIONS.EMR_HISTORY_WRITE]:       'Can add and edit medical history entries',
  [PERMISSIONS.EMR_PROCEDURES_WRITE]:    'Can record procedures',
  [PERMISSIONS.EMR_IMMUNIZATIONS_WRITE]: 'Can record immunizations',
  [PERMISSIONS.EMR_DOCUMENTS_WRITE]:     'Can upload and edit chart documents',
  [PERMISSIONS.EMR_ACCESS_LOG_VIEW]:     'Can view who accessed a patient\'s chart',
  [PERMISSIONS.EMR_BREAK_GLASS]:         'Can use emergency break-glass chart access',

  [PERMISSIONS.LAB_VIEW]:    'Can view lab orders',
  [PERMISSIONS.LAB_CREATE]:  'Can create new lab orders',
  [PERMISSIONS.LAB_PROCESS]: 'Can advance lab order status (collected → processing → ready)',
  [PERMISSIONS.LAB_RELEASE]: 'Can release lab results to the patient chart',

  [PERMISSIONS.ASSET_VIEW]:   'Can view the asset list',
  [PERMISSIONS.ASSET_CREATE]: 'Can add new assets',
  [PERMISSIONS.ASSET_UPDATE]: 'Can update asset information',
  [PERMISSIONS.ASSET_STATUS]: 'Can change asset status',
  [PERMISSIONS.ASSET_MOVE]:   'Can move assets between locations',
  [PERMISSIONS.ASSET_DELETE]: 'Can delete assets',

  [PERMISSIONS.REVIEW_VIEW]: 'Can view the review queue',
  [PERMISSIONS.REVIEW_ACT]:  'Can approve or reject items in the review queue',

  [PERMISSIONS.SETTINGS_VIEW]:      'Can view hospital settings',
  [PERMISSIONS.SETTINGS_UPDATE]:    'Can update hospital settings (name, branding, domain)',
  [PERMISSIONS.MODULES_MANAGE]:     'Can enable or disable feature modules',
  [PERMISSIONS.AUDIT_VIEW]:         'Can view the hospital-wide audit log',
  [PERMISSIONS.SEARCH_USE]:         'Can use global search',
  [PERMISSIONS.NOTIFICATIONS_VIEW]: 'Can view notifications',
};

export interface PermissionGroup {
  readonly label: string;
  readonly permissions: Permission[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    label: 'Staff',
    permissions: [
      PERMISSIONS.STAFF_VIEW, PERMISSIONS.STAFF_INVITE, PERMISSIONS.STAFF_UPDATE,
      PERMISSIONS.STAFF_SUSPEND, PERMISSIONS.STAFF_REMOVE, PERMISSIONS.STAFF_ROLES_MANAGE,
    ],
  },
  {
    label: 'Patients',
    permissions: [
      PERMISSIONS.PATIENT_VIEW, PERMISSIONS.PATIENT_CREATE, PERMISSIONS.PATIENT_UPDATE,
      PERMISSIONS.PATIENT_ADMIT, PERMISSIONS.PATIENT_TRANSFER,
    ],
  },
  {
    label: 'Medical Records (EMR)',
    permissions: [
      PERMISSIONS.EMR_VIEW, PERMISSIONS.EMR_VITALS_RECORD,
      PERMISSIONS.EMR_MEDICATIONS_VIEW, PERMISSIONS.EMR_MEDICATIONS_WRITE,
      PERMISSIONS.EMR_HISTORY_WRITE, PERMISSIONS.EMR_PROCEDURES_WRITE,
      PERMISSIONS.EMR_IMMUNIZATIONS_WRITE, PERMISSIONS.EMR_DOCUMENTS_WRITE,
      PERMISSIONS.EMR_ACCESS_LOG_VIEW, PERMISSIONS.EMR_BREAK_GLASS,
    ],
  },
  {
    label: 'Labs',
    permissions: [
      PERMISSIONS.LAB_VIEW, PERMISSIONS.LAB_CREATE, PERMISSIONS.LAB_PROCESS, PERMISSIONS.LAB_RELEASE,
    ],
  },
  {
    label: 'Assets',
    permissions: [
      PERMISSIONS.ASSET_VIEW, PERMISSIONS.ASSET_CREATE, PERMISSIONS.ASSET_UPDATE,
      PERMISSIONS.ASSET_STATUS, PERMISSIONS.ASSET_MOVE, PERMISSIONS.ASSET_DELETE,
    ],
  },
  {
    label: 'Review Queue',
    permissions: [PERMISSIONS.REVIEW_VIEW, PERMISSIONS.REVIEW_ACT],
  },
  {
    label: 'Workspace & Settings',
    permissions: [
      PERMISSIONS.SETTINGS_VIEW, PERMISSIONS.SETTINGS_UPDATE, PERMISSIONS.MODULES_MANAGE,
      PERMISSIONS.AUDIT_VIEW, PERMISSIONS.SEARCH_USE, PERMISSIONS.NOTIFICATIONS_VIEW,
    ],
  },
];

export const ROLE_LABELS: Record<SystemRole, string> = {
  [ROLES.SUPER_ADMIN]:         'Super Admin',
  [ROLES.HOSPITAL_ADMIN]:      'Hospital Admin',
  [ROLES.DOCTOR]:              'Doctor',
  [ROLES.NURSE]:               'Nurse',
  [ROLES.NURSE_PRACTITIONER]:  'Nurse Practitioner',
  [ROLES.PHYSICIAN_ASSISTANT]: 'Physician Assistant',
  [ROLES.LAB_TECH]:            'Lab Technician',
  [ROLES.PHARMACIST]:          'Pharmacist',
  [ROLES.RECEPTION]:           'Receptionist',
  [ROLES.TECH]:                'Technician',
};
