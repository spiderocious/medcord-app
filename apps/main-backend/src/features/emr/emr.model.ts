import mongoose, { type Document, Schema } from 'mongoose';

// ── Vitals ────────────────────────────────────────────────────────────────────

export interface IVitals {
  id: string;
  hospitalId: string;
  patientId: string;
  recordedBy: string;
  bp_systolic?: number | undefined;
  bp_diastolic?: number | undefined;
  hr?: number | undefined;
  rr?: number | undefined;
  temp?: number | undefined;
  spo2?: number | undefined;
  weight?: number | undefined;
  height?: number | undefined;
  painScore?: number | undefined;
  bmi?: number | undefined;
  isOutOfRange: boolean;
  outOfRangeFields: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IVitalsDocument extends IVitals, Document {}

const vitalsSchema = new Schema<IVitalsDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    hospitalId: { type: String, required: true, index: true },
    patientId: { type: String, required: true, index: true },
    recordedBy: { type: String, required: true },
    bp_systolic: Number,
    bp_diastolic: Number,
    hr: Number,
    rr: Number,
    temp: Number,
    spo2: Number,
    weight: Number,
    height: Number,
    painScore: { type: Number, min: 0, max: 10 },
    bmi: Number,
    isOutOfRange: { type: Boolean, default: false },
    outOfRangeFields: [{ type: String }],
  },
  { timestamps: true, collection: 'vitals' },
);

vitalsSchema.index({ hospitalId: 1, patientId: 1, createdAt: -1 });

export const VitalsModel = mongoose.model<IVitalsDocument>('Vitals', vitalsSchema);

// ── Medication ────────────────────────────────────────────────────────────────

export type MedicationStatus = 'active' | 'discontinued' | 'on_hold';

export interface IMedication {
  id: string;
  hospitalId: string;
  patientId: string;
  recordedBy: string;
  drug: string;
  strength?: string | undefined;
  route?: string | undefined;
  frequency?: string | undefined;
  indication?: string | undefined;
  duration?: string | undefined;
  status: MedicationStatus;
  prescribedBy: string;
  discontinuedBy?: string | undefined;
  discontinuedAt?: Date | undefined;
  discontinuedReason?: string | undefined;
  drugInteractionWarnings: string[];
  allergyWarnings: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IMedicationDocument extends IMedication, Document {}

const medicationSchema = new Schema<IMedicationDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    hospitalId: { type: String, required: true, index: true },
    patientId: { type: String, required: true, index: true },
    recordedBy: { type: String, required: true },
    drug: { type: String, required: true },
    strength: String,
    route: String,
    frequency: String,
    indication: String,
    duration: String,
    status: {
      type: String,
      enum: ['active', 'discontinued', 'on_hold'],
      default: 'active',
    },
    prescribedBy: { type: String, required: true },
    discontinuedBy: String,
    discontinuedAt: Date,
    discontinuedReason: String,
    drugInteractionWarnings: [{ type: String }],
    allergyWarnings: [{ type: String }],
  },
  { timestamps: true, collection: 'medications' },
);

medicationSchema.index({ hospitalId: 1, patientId: 1, status: 1 });

export const MedicationModel = mongoose.model<IMedicationDocument>('Medication', medicationSchema);

// ── MedicalHistory ────────────────────────────────────────────────────────────

export interface IDiagnosis {
  icd10Code: string;
  description: string;
  diagnosedAt?: Date | undefined;
}

export interface IHistoryProcedure {
  cptCode: string;
  description: string;
  performedAt?: Date | undefined;
}

export interface ISocialHistory {
  smoking?: string | undefined;
  alcohol?: string | undefined;
  occupation?: string | undefined;
  other?: string | undefined;
}

export interface IMedicalHistory {
  id: string;
  hospitalId: string;
  patientId: string;
  recordedBy: string;
  diagnoses: IDiagnosis[];
  procedures: IHistoryProcedure[];
  familyHistory: string[];
  socialHistory: ISocialHistory;
  notes?: string | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMedicalHistoryDocument extends IMedicalHistory, Document {}

const medicalHistorySchema = new Schema<IMedicalHistoryDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    hospitalId: { type: String, required: true, index: true },
    patientId: { type: String, required: true, index: true },
    recordedBy: { type: String, required: true },
    diagnoses: [
      {
        icd10Code: { type: String, required: true },
        description: { type: String, required: true },
        diagnosedAt: Date,
        _id: false,
      },
    ],
    procedures: [
      {
        cptCode: { type: String, required: true },
        description: { type: String, required: true },
        performedAt: Date,
        _id: false,
      },
    ],
    familyHistory: [{ type: String }],
    socialHistory: {
      smoking: String,
      alcohol: String,
      occupation: String,
      other: String,
    },
    notes: String,
  },
  { timestamps: true, collection: 'medical_histories' },
);

medicalHistorySchema.index({ hospitalId: 1, patientId: 1 }, { unique: true });

export const MedicalHistoryModel = mongoose.model<IMedicalHistoryDocument>(
  'MedicalHistory',
  medicalHistorySchema,
);

// ── Procedure ─────────────────────────────────────────────────────────────────

export interface IPreOpChecklist {
  consentObtained: boolean;
  npoStatus: boolean;
  allergiesConfirmed: boolean;
  siteMarked: boolean;
}

export interface IProcedure {
  id: string;
  hospitalId: string;
  patientId: string;
  recordedBy: string;
  cptCode?: string | undefined;
  name: string;
  performedBy: string;
  performedAt: Date;
  location?: string | undefined;
  notes?: string | undefined;
  operativeNoteKey?: string | undefined;
  preOpChecklist: IPreOpChecklist;
  followUpDate?: Date | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProcedureDocument extends IProcedure, Document {}

const procedureSchema = new Schema<IProcedureDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    hospitalId: { type: String, required: true, index: true },
    patientId: { type: String, required: true, index: true },
    recordedBy: { type: String, required: true },
    cptCode: String,
    name: { type: String, required: true },
    performedBy: { type: String, required: true },
    performedAt: { type: Date, required: true },
    location: String,
    notes: String,
    operativeNoteKey: String,
    preOpChecklist: {
      consentObtained: { type: Boolean, default: false },
      npoStatus: { type: Boolean, default: false },
      allergiesConfirmed: { type: Boolean, default: false },
      siteMarked: { type: Boolean, default: false },
    },
    followUpDate: Date,
  },
  { timestamps: true, collection: 'procedures' },
);

procedureSchema.index({ hospitalId: 1, patientId: 1, performedAt: -1 });

export const ProcedureModel = mongoose.model<IProcedureDocument>('Procedure', procedureSchema);

// ── Immunization ──────────────────────────────────────────────────────────────

export interface IImmunization {
  id: string;
  hospitalId: string;
  patientId: string;
  recordedBy: string;
  vaccine: string;
  dose?: string | undefined;
  administeredAt: Date;
  lotNumber?: string | undefined;
  administrator: string;
  nextDueDate?: Date | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export interface IImmunizationDocument extends IImmunization, Document {}

const immunizationSchema = new Schema<IImmunizationDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    hospitalId: { type: String, required: true, index: true },
    patientId: { type: String, required: true, index: true },
    recordedBy: { type: String, required: true },
    vaccine: { type: String, required: true },
    dose: String,
    administeredAt: { type: Date, required: true },
    lotNumber: String,
    administrator: { type: String, required: true },
    nextDueDate: Date,
  },
  { timestamps: true, collection: 'immunizations' },
);

immunizationSchema.index({ hospitalId: 1, patientId: 1, administeredAt: -1 });

export const ImmunizationModel = mongoose.model<IImmunizationDocument>(
  'Immunization',
  immunizationSchema,
);

// ── ChartDocument ─────────────────────────────────────────────────────────────

export type ChartDocumentCategory = 'referral' | 'lab_report' | 'imaging' | 'consent' | 'other';

export interface IChartDocument {
  id: string;
  hospitalId: string;
  patientId: string;
  recordedBy: string;
  title: string;
  category: ChartDocumentCategory;
  fileKey: string;
  uploadedBy: string;
  isSensitive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChartDocumentDocument extends IChartDocument, Document {}

const chartDocumentSchema = new Schema<IChartDocumentDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    hospitalId: { type: String, required: true, index: true },
    patientId: { type: String, required: true, index: true },
    recordedBy: { type: String, required: true },
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ['referral', 'lab_report', 'imaging', 'consent', 'other'],
      required: true,
    },
    fileKey: { type: String, required: true },
    uploadedBy: { type: String, required: true },
    isSensitive: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'chart_documents' },
);

chartDocumentSchema.index({ hospitalId: 1, patientId: 1, category: 1 });

export const ChartDocumentModel = mongoose.model<IChartDocumentDocument>(
  'ChartDocument',
  chartDocumentSchema,
);

// ── ChartAccessLog ────────────────────────────────────────────────────────────

export type ChartAccessAction =
  | 'view_chart'
  | 'view_vitals'
  | 'view_medications'
  | 'view_history'
  | 'view_procedures'
  | 'view_immunizations'
  | 'view_documents'
  | 'break_glass';

export interface IChartAccessLog {
  hospitalId: string;
  patientId: string;
  accessedBy: string;
  action: ChartAccessAction;
  section: string;
  reason?: string | undefined;
  isBreakGlass: boolean;
  ip?: string | undefined;
  userAgent?: string | undefined;
  accessedAt: Date;
}

export interface IChartAccessLogDocument extends IChartAccessLog, Document {}

const chartAccessLogSchema = new Schema<IChartAccessLogDocument>(
  {
    hospitalId: { type: String, required: true, index: true },
    patientId: { type: String, required: true, index: true },
    accessedBy: { type: String, required: true, index: true },
    action: {
      type: String,
      enum: [
        'view_chart',
        'view_vitals',
        'view_medications',
        'view_history',
        'view_procedures',
        'view_immunizations',
        'view_documents',
        'break_glass',
      ],
      required: true,
    },
    section: { type: String, required: true },
    reason: String,
    isBreakGlass: { type: Boolean, default: false },
    ip: String,
    userAgent: String,
    accessedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false, collection: 'chart_access_logs' },
);

chartAccessLogSchema.index({ hospitalId: 1, patientId: 1, accessedAt: -1 });
chartAccessLogSchema.index({ hospitalId: 1, patientId: 1, isBreakGlass: 1 });

export const ChartAccessLogModel = mongoose.model<IChartAccessLogDocument>(
  'ChartAccessLog',
  chartAccessLogSchema,
);
