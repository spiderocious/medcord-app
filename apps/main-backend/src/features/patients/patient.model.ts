import mongoose, { type Document, Schema } from 'mongoose';

// ── Patient ───────────────────────────────────────────────────────────────────

export interface IPatientDemographics {
  firstName: string;
  lastName: string;
  preferredName?: string | undefined;
  dateOfBirth: Date;
  sex: 'male' | 'female' | 'other';
  gender?: string | undefined;
  address?: string | undefined;
  phone?: string | undefined;
  email?: string | undefined;
  religion?: string | undefined;
  culturalPreferences?: string | undefined;
}

export interface IEmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface IGuarantor {
  name: string;
  relationship: string;
  phone?: string | undefined;
  address?: string | undefined;
}

export interface IIdCard {
  isActive: boolean;
  issuedAt?: Date | undefined;
  reissuedAt?: Date | undefined;
}

export interface IPatient {
  id: string;
  patientCode: string;
  registeredByHospitalId: string;
  registeredByUserId: string;
  demographics: IPatientDemographics;
  emergencyContact?: IEmergencyContact | undefined;
  guarantor?: IGuarantor | undefined;
  photoKey?: string | undefined;
  documentKeys: string[];
  idCard: IIdCard;
  admissionStatus: 'outpatient' | 'admitted' | 'discharged';
  currentHospitalId?: string | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPatientDocument extends IPatient, Document {}

const patientSchema = new Schema<IPatientDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    patientCode: { type: String, required: true, unique: true, index: true },
    registeredByHospitalId: { type: String, required: true, index: true },
    registeredByUserId: { type: String, required: true },
    demographics: {
      firstName: { type: String, required: true, trim: true },
      lastName: { type: String, required: true, trim: true },
      preferredName: String,
      dateOfBirth: { type: Date, required: true },
      sex: { type: String, enum: ['male', 'female', 'other'], required: true },
      gender: String,
      address: String,
      phone: String,
      email: String,
      religion: String,
      culturalPreferences: String,
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
    },
    guarantor: {
      name: String,
      relationship: String,
      phone: String,
      address: String,
    },
    photoKey: String,
    documentKeys: [{ type: String }],
    idCard: {
      isActive: { type: Boolean, default: false },
      issuedAt: Date,
      reissuedAt: Date,
    },
    admissionStatus: {
      type: String,
      enum: ['outpatient', 'admitted', 'discharged'],
      default: 'outpatient',
    },
    currentHospitalId: String,
  },
  { timestamps: true, collection: 'patients' },
);

patientSchema.index({ 'demographics.firstName': 'text', 'demographics.lastName': 'text' });
patientSchema.index({ 'demographics.dateOfBirth': 1 });
patientSchema.index({ registeredByHospitalId: 1, 'demographics.lastName': 1 });

export const PatientModel = mongoose.model<IPatientDocument>('Patient', patientSchema);

// ── HospitalPatient (links a patient to a hospital's roster) ──────────────────

export interface IHospitalPatient {
  id: string;
  hospitalId: string;
  patientId: string;
  patientCode: string;
  addedAt: Date;
  addedBy: string;
  isActive: boolean;
}

export interface IHospitalPatientDocument extends IHospitalPatient, Document {}

const hospitalPatientSchema = new Schema<IHospitalPatientDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    hospitalId: { type: String, required: true, index: true },
    patientId: { type: String, required: true, index: true },
    patientCode: { type: String, required: true },
    addedAt: { type: Date, default: Date.now },
    addedBy: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: false, collection: 'hospital_patients' },
);

hospitalPatientSchema.index({ hospitalId: 1, patientId: 1 }, { unique: true });
hospitalPatientSchema.index({ hospitalId: 1, patientCode: 1 });

export const HospitalPatientModel = mongoose.model<IHospitalPatientDocument>(
  'HospitalPatient',
  hospitalPatientSchema,
);

// ── PatientFavorite ────────────────────────────────────────────────────────────

const favoriteSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    hospitalId: { type: String, required: true },
    patientId: { type: String, required: true },
  },
  { timestamps: true, collection: 'patient_favorites' },
);
favoriteSchema.index({ userId: 1, hospitalId: 1, patientId: 1 }, { unique: true });
export const PatientFavoriteModel = mongoose.model('PatientFavorite', favoriteSchema);

// ── PatientRecentAccess ────────────────────────────────────────────────────────

const recentSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    hospitalId: { type: String, required: true },
    patientId: { type: String, required: true },
    accessedAt: { type: Date, default: Date.now },
  },
  { timestamps: false, collection: 'patient_recent_access' },
);
recentSchema.index({ userId: 1, hospitalId: 1, accessedAt: -1 });
export const PatientRecentModel = mongoose.model('PatientRecentAccess', recentSchema);

// ── Transfer ──────────────────────────────────────────────────────────────────

export type TransferStatus = 'pending' | 'accepted' | 'declined';

export interface ITransfer {
  id: string;
  patientId: string;
  fromHospitalId: string;
  toHospitalId: string;
  reason: string;
  department?: string | undefined;
  recordsPackage: {
    includeVitals: boolean;
    includeMedications: boolean;
    includeHistory: boolean;
    includeLabs: boolean;
    includeDocuments: boolean;
  };
  status: TransferStatus;
  requestedBy: string;
  respondedBy?: string | undefined;
  respondedAt?: Date | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITransferDocument extends ITransfer, Document {}

const transferSchema = new Schema<ITransferDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    patientId: { type: String, required: true, index: true },
    fromHospitalId: { type: String, required: true, index: true },
    toHospitalId: { type: String, required: true, index: true },
    reason: { type: String, required: true },
    department: String,
    recordsPackage: {
      includeVitals: { type: Boolean, default: true },
      includeMedications: { type: Boolean, default: true },
      includeHistory: { type: Boolean, default: true },
      includeLabs: { type: Boolean, default: true },
      includeDocuments: { type: Boolean, default: false },
    },
    status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
    requestedBy: { type: String, required: true },
    respondedBy: String,
    respondedAt: Date,
  },
  { timestamps: true, collection: 'transfers' },
);

export const TransferModel = mongoose.model<ITransferDocument>('Transfer', transferSchema);
