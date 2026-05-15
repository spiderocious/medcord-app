import mongoose, { type Document, Schema } from 'mongoose';

import type { StaffRole } from '@shared/types/roles.types.js';

// ── Hospital ──────────────────────────────────────────────────────────────────

export interface IHospitalBranding {
  primaryColor?: string | undefined;
  accentColor?: string | undefined;
  idCardLogoPosition?: 'left' | 'center' | 'right' | undefined;
  idCardColorScheme?: string | undefined;
}

export interface IHospitalModules {
  emr: boolean;
  labs: boolean;
  assets: boolean;
  onlineConsultation: boolean;
}

export interface IHospital {
  id: string;
  name: string;
  type: 'general' | 'specialty' | 'clinic' | 'teaching' | 'other';
  location: string;
  contact: { phone?: string | undefined; email?: string | undefined; address?: string | undefined };
  logoKey?: string | undefined;
  branding: IHospitalBranding;
  subdomain: string;
  customDomain?: string | undefined;
  customDomainVerified: boolean;
  modules: IHospitalModules;
  plan: 'pro';
  ownerId: string;
  timezone: string;
  locale: string;
  businessHours?: string | undefined;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IHospitalDocument extends IHospital, Document {}

const hospitalSchema = new Schema<IHospitalDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['general', 'specialty', 'clinic', 'teaching', 'other'],
      required: true,
    },
    location: { type: String, required: true, trim: true },
    contact: {
      phone: String,
      email: String,
      address: String,
    },
    logoKey: String,
    branding: {
      primaryColor: String,
      accentColor: String,
      idCardLogoPosition: { type: String, enum: ['left', 'center', 'right'] },
      idCardColorScheme: String,
    },
    subdomain: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    customDomain: String,
    customDomainVerified: { type: Boolean, default: false },
    modules: {
      emr: { type: Boolean, default: true },
      labs: { type: Boolean, default: true },
      assets: { type: Boolean, default: true },
      onlineConsultation: { type: Boolean, default: false },
    },
    plan: { type: String, default: 'pro' },
    ownerId: { type: String, required: true, index: true },
    timezone: { type: String, default: 'UTC' },
    locale: { type: String, default: 'en' },
    businessHours: String,
    isArchived: { type: Boolean, default: false, index: true },
  },
  { timestamps: true, collection: 'hospitals' },
);

export const HospitalModel = mongoose.model<IHospitalDocument>('Hospital', hospitalSchema);

// ── HospitalMember ────────────────────────────────────────────────────────────

export interface IHospitalMember {
  id: string;
  hospitalId: string;
  userId: string;
  role: StaffRole;
  department?: string | undefined;
  unit?: string | undefined;
  specialty?: string | undefined;
  managerId?: string | undefined;
  status: 'active' | 'suspended';
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IHospitalMemberDocument extends IHospitalMember, Document {}

const memberSchema = new Schema<IHospitalMemberDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    hospitalId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    role: { type: String, required: true },
    department: String,
    unit: String,
    specialty: String,
    managerId: String,
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: 'hospital_members' },
);

memberSchema.index({ hospitalId: 1, userId: 1 }, { unique: true });
memberSchema.index({ hospitalId: 1, status: 1 });

export const HospitalMemberModel = mongoose.model<IHospitalMemberDocument>('HospitalMember', memberSchema);
