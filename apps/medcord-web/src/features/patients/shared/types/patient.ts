export interface PatientDemographics {
  readonly firstName: string;
  readonly lastName: string;
  readonly preferredName?: string;
  readonly dateOfBirth: string;
  readonly sex: 'male' | 'female' | 'other';
  readonly gender?: string;
  readonly address?: string;
  readonly phone?: string;
  readonly email?: string;
  readonly religion?: string;
  readonly culturalPreferences?: string;
}

export interface EmergencyContact {
  readonly name: string;
  readonly relationship: string;
  readonly phone: string;
}

export interface Guarantor {
  readonly name: string;
  readonly relationship: string;
  readonly phone?: string;
  readonly address?: string;
}

export interface IdCard {
  readonly isActive: boolean;
  readonly issuedAt?: string;
  readonly reissuedAt?: string;
}

export interface Patient {
  readonly id: string;
  readonly patientCode: string;
  readonly registeredByHospitalId: string;
  readonly registeredByUserId: string;
  readonly demographics: PatientDemographics;
  readonly emergencyContact?: EmergencyContact;
  readonly guarantor?: Guarantor;
  readonly photoKey?: string;
  readonly documentKeys: readonly string[];
  readonly idCard: IdCard;
  readonly admissionStatus: 'outpatient' | 'admitted' | 'discharged';
  readonly currentHospitalId?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface Transfer {
  readonly id: string;
  readonly patientId: string;
  readonly fromHospitalId: string;
  readonly toHospitalId: string;
  readonly reason: string;
  readonly department?: string;
  readonly recordsPackage: {
    readonly includeVitals: boolean;
    readonly includeMedications: boolean;
    readonly includeHistory: boolean;
    readonly includeLabs: boolean;
    readonly includeDocuments: boolean;
  };
  readonly status: 'pending' | 'accepted' | 'declined';
  readonly requestedBy: string;
  readonly respondedBy?: string;
  readonly respondedAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PatientListResult {
  readonly items: readonly Patient[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}
