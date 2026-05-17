export const STAFF_ROLES = [
  'super_admin',
  'hospital_admin',
  'doctor',
  'nurse',
  'nurse_practitioner',
  'physician_assistant',
  'lab_tech',
  'pharmacist',
  'reception',
  'tech',
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export const ADMIN_ROLES: StaffRole[] = ['super_admin', 'hospital_admin'];
export const CLINICAL_ROLES: StaffRole[] = ['doctor', 'nurse', 'nurse_practitioner', 'physician_assistant'];
export const PRESCRIBER_ROLES: StaffRole[] = ['doctor', 'nurse_practitioner', 'physician_assistant'];
export const LAB_ROLES: StaffRole[] = ['lab_tech', 'doctor', 'nurse_practitioner', 'physician_assistant'];
