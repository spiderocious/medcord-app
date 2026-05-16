export type HospitalType = 'general' | 'specialty' | 'clinic' | 'teaching' | 'other';

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

export interface HospitalModules {
  readonly emr: boolean;
  readonly labs: boolean;
  readonly assets: boolean;
  readonly onlineConsultation: boolean;
}

export interface HospitalBranding {
  readonly primaryColor?: string;
  readonly accentColor?: string;
  readonly idCardLogoPosition?: 'left' | 'center' | 'right';
  readonly idCardColorScheme?: string;
}

export interface HospitalContact {
  readonly phone?: string;
  readonly email?: string;
  readonly address?: string;
}

export interface Hospital {
  readonly id: string;
  readonly name: string;
  readonly subdomain: string;
  readonly type: HospitalType;
  readonly location: string;
  readonly contact: HospitalContact;
  readonly logoKey?: string;
  readonly branding: HospitalBranding;
  readonly customDomain?: string;
  readonly customDomainVerified: boolean;
  readonly modules: HospitalModules;
  readonly plan: 'pro';
  readonly ownerId: string;
  readonly timezone: string;
  readonly locale: string;
  readonly businessHours?: string;
  readonly isArchived: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface HospitalStats {
  readonly staffCount: number;
  readonly patientCount: number;
  readonly storageUsedBytes: number;
}
