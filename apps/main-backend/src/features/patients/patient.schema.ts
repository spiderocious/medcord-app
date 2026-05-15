import { z } from 'zod';

const DemographicsSchema = z.object({
  firstName: z.string().min(1).max(100).trim(),
  lastName: z.string().min(1).max(100).trim(),
  preferredName: z.string().max(100).trim().optional(),
  dateOfBirth: z.coerce.date(),
  sex: z.enum(['male', 'female', 'other']),
  gender: z.string().max(80).optional(),
  address: z.string().max(400).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  religion: z.string().max(100).optional(),
  culturalPreferences: z.string().max(400).optional(),
});

const EmergencyContactSchema = z.object({
  name: z.string().min(1).max(150).trim(),
  relationship: z.string().min(1).max(80).trim(),
  phone: z.string().min(7).max(20).trim(),
});

const GuarantorSchema = z.object({
  name: z.string().min(1).max(150).trim(),
  relationship: z.string().min(1).max(80).trim(),
  phone: z.string().max(20).optional(),
  address: z.string().max(400).optional(),
});

export const RegisterPatientBody = z.object({
  demographics: DemographicsSchema,
  emergencyContact: EmergencyContactSchema.optional(),
  guarantor: GuarantorSchema.optional(),
  photoKey: z.string().min(1).optional(),
  documentKeys: z.array(z.string().min(1)).default([]),
});
export type RegisterPatientBody = z.infer<typeof RegisterPatientBody>;

export const UpdatePatientBody = z.object({
  demographics: DemographicsSchema.partial().optional(),
  emergencyContact: EmergencyContactSchema.optional(),
  guarantor: GuarantorSchema.optional(),
  photoKey: z.string().min(1).optional(),
});
export type UpdatePatientBody = z.infer<typeof UpdatePatientBody>;

export const SearchPatientsQuery = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type SearchPatientsQuery = z.infer<typeof SearchPatientsQuery>;

export const CheckInBody = z.object({
  department: z.string().max(100).optional(),
  assignedTo: z.string().optional(),
});
export type CheckInBody = z.infer<typeof CheckInBody>;

export const AdmitBody = z.object({
  department: z.string().min(1).max(100).trim(),
  assignedTo: z.string().optional(),
  notes: z.string().max(1000).optional(),
});
export type AdmitBody = z.infer<typeof AdmitBody>;

export const DischargeBody = z.object({
  notes: z.string().max(1000).optional(),
  followUpDate: z.coerce.date().optional(),
});
export type DischargeBody = z.infer<typeof DischargeBody>;

export const TransferBody = z.object({
  toHospitalId: z.string().min(1),
  reason: z.string().min(1).max(1000).trim(),
  department: z.string().max(100).optional(),
  recordsPackage: z
    .object({
      includeVitals: z.boolean().default(true),
      includeMedications: z.boolean().default(true),
      includeHistory: z.boolean().default(true),
      includeLabs: z.boolean().default(true),
      includeDocuments: z.boolean().default(false),
    })
    .default({}),
});
export type TransferBody = z.infer<typeof TransferBody>;
