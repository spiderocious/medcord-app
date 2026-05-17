export interface PatientTransfer {
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
