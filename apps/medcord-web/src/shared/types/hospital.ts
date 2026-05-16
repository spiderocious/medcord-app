export type HospitalType =
  | 'general'
  | 'specialty'
  | 'clinic'
  | 'teaching'
  | 'private'
  | 'other';

export type HospitalModule =
  | 'emr'
  | 'labs'
  | 'assets'
  | 'online_consultation';

export type StaffRole =
  | 'super_admin'
  | 'hospital_admin'
  | 'doctor'
  | 'nurse'
  | 'nurse_practitioner'
  | 'physician_assistant'
  | 'lab_tech'
  | 'pharmacist'
  | 'reception'
  | 'tech'
  | 'custom';

export interface Hospital {
  id: string;
  name: string;
  slug: string;
  type: HospitalType;
  logoKey?: string;
  primaryColor?: string;
  accentColor?: string;
  timezone: string;
  locale: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  modules: HospitalModule[];
  plan: 'pro';
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HospitalMembership {
  hospitalId: string;
  hospital: Hospital;
  role: StaffRole;
  department?: string;
  unit?: string;
}

export interface HospitalStats {
  staffCount: number;
  patientCount: number;
  storageUsedBytes: number;
}
