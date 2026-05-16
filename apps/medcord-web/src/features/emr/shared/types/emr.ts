export interface Vitals {
  readonly id: string;
  readonly hospitalId: string;
  readonly patientId: string;
  readonly recordedBy: string;
  readonly bp_systolic?: number;
  readonly bp_diastolic?: number;
  readonly hr?: number;
  readonly rr?: number;
  readonly temp?: number;
  readonly spo2?: number;
  readonly weight?: number;
  readonly height?: number;
  readonly painScore?: number;
  readonly bmi?: number;
  readonly isOutOfRange: boolean;
  readonly outOfRangeFields: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type MedicationStatus = 'active' | 'discontinued' | 'on_hold';

export interface Medication {
  readonly id: string;
  readonly hospitalId: string;
  readonly patientId: string;
  readonly drug: string;
  readonly strength?: string;
  readonly route?: string;
  readonly frequency?: string;
  readonly indication?: string;
  readonly duration?: string;
  readonly status: MedicationStatus;
  readonly prescribedBy: string;
  readonly discontinuedBy?: string;
  readonly discontinuedAt?: string;
  readonly discontinuedReason?: string;
  readonly drugInteractionWarnings: readonly string[];
  readonly allergyWarnings: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface Diagnosis {
  readonly icd10Code: string;
  readonly description: string;
  readonly diagnosedAt?: string;
}

export interface HistoryProcedure {
  readonly cptCode: string;
  readonly description: string;
  readonly performedAt?: string;
}

export interface SocialHistory {
  readonly smoking?: string;
  readonly alcohol?: string;
  readonly occupation?: string;
  readonly other?: string;
}

export interface MedicalHistory {
  readonly id: string;
  readonly hospitalId: string;
  readonly patientId: string;
  readonly diagnoses: readonly Diagnosis[];
  readonly procedures: readonly HistoryProcedure[];
  readonly familyHistory: readonly string[];
  readonly socialHistory: SocialHistory;
  readonly notes?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PreOpChecklist {
  readonly consentObtained: boolean;
  readonly npoStatus: boolean;
  readonly allergiesConfirmed: boolean;
  readonly siteMarked: boolean;
}

export interface Procedure {
  readonly id: string;
  readonly hospitalId: string;
  readonly patientId: string;
  readonly name: string;
  readonly cptCode?: string;
  readonly performedBy: string;
  readonly performedAt: string;
  readonly location?: string;
  readonly notes?: string;
  readonly operativeNoteKey?: string;
  readonly preOpChecklist: PreOpChecklist;
  readonly followUpDate?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface Immunization {
  readonly id: string;
  readonly hospitalId: string;
  readonly patientId: string;
  readonly vaccine: string;
  readonly dose?: string;
  readonly administeredAt: string;
  readonly lotNumber?: string;
  readonly administrator: string;
  readonly nextDueDate?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type ChartDocumentCategory = 'referral' | 'lab_report' | 'imaging' | 'consent' | 'other';

export interface ChartDocument {
  readonly id: string;
  readonly hospitalId: string;
  readonly patientId: string;
  readonly title: string;
  readonly category: ChartDocumentCategory;
  readonly fileKey: string;
  readonly uploadedBy: string;
  readonly isSensitive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ChartAccessLog {
  readonly hospitalId: string;
  readonly patientId: string;
  readonly accessedBy: string;
  readonly action:
    | 'view_chart'
    | 'view_vitals'
    | 'view_medications'
    | 'view_history'
    | 'view_procedures'
    | 'view_immunizations'
    | 'view_documents'
    | 'break_glass';
  readonly section: string;
  readonly reason?: string;
  readonly isBreakGlass: boolean;
  readonly ip?: string;
  readonly userAgent?: string;
  readonly accessedAt: string;
}

export interface ChartSummary {
  readonly lastVitals: Vitals | null;
  readonly activeMedicationsCount: number;
  readonly diagnosesCount: number;
  readonly recentProcedures: readonly Procedure[];
}
