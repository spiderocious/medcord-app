import { z } from 'zod';

const DemographicsSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100, 'First name is too long').trim(),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Last name is too long').trim(),
  preferredName: z.string().max(100, 'Preferred name is too long').trim().optional(),
  dateOfBirth: z.coerce.date({ errorMap: () => ({ message: 'Date of birth is required and must be a valid date' }) }),
  sex: z.enum(['male', 'female', 'other'], {
    errorMap: () => ({ message: 'Sex must be one of: male, female, other' }),
  }),
  gender: z.string().max(80, 'Gender value is too long').optional(),
  address: z.string().max(400, 'Address is too long').optional(),
  phone: z.string().max(20, 'Phone number is too long').optional(),
  email: z.string().email('Invalid email address').optional(),
  religion: z.string().max(100, 'Religion is too long').optional(),
  culturalPreferences: z.string().max(400, 'Cultural preferences is too long').optional(),
});

const EmergencyContactSchema = z.object({
  name: z.string().min(1, 'Emergency contact name is required').max(150, 'Name is too long').trim(),
  relationship: z.string().min(1, 'Relationship is required').max(80, 'Relationship is too long').trim(),
  phone: z.string().min(7, 'Phone number is too short').max(20, 'Phone number is too long').trim(),
});

const GuarantorSchema = z.object({
  name: z.string().min(1, 'Guarantor name is required').max(150, 'Name is too long').trim(),
  relationship: z.string().min(1, 'Relationship is required').max(80, 'Relationship is too long').trim(),
  phone: z.string().max(20, 'Phone number is too long').optional(),
  address: z.string().max(400, 'Address is too long').optional(),
});

export const RegisterPatientBody = z.object({
  demographics: DemographicsSchema,
  emergencyContact: EmergencyContactSchema.optional(),
  guarantor: GuarantorSchema.optional(),
  photoKey: z.string().min(1, 'Photo key is required').optional(),
  documentKeys: z.array(z.string().min(1)).default([]),
});
export type RegisterPatientBody = z.infer<typeof RegisterPatientBody>;

export const UpdatePatientBody = z.object({
  demographics: DemographicsSchema.partial().optional(),
  emergencyContact: EmergencyContactSchema.optional(),
  guarantor: GuarantorSchema.optional(),
  photoKey: z.string().min(1, 'Photo key is required').optional(),
});
export type UpdatePatientBody = z.infer<typeof UpdatePatientBody>;

export const SearchPatientsQuery = z.object({
  q: z.string().optional(),
  admissionStatus: z.enum(['outpatient', 'admitted', 'discharged']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type SearchPatientsQuery = z.infer<typeof SearchPatientsQuery>;

export const CheckInBody = z.object({
  department: z.string().max(100, 'Department name is too long').optional(),
  assignedNurseId: z.string().optional(),
  assignedDoctorId: z.string().optional(),
  notes: z.string().max(500, 'Notes are too long').optional(),
});
export type CheckInBody = z.infer<typeof CheckInBody>;

export const UpdateVisitBody = z.object({
  assignedNurseId: z.string().optional(),
  assignedDoctorId: z.string().optional(),
  stage: z.enum(['waiting_nurse', 'with_nurse', 'waiting_doctor', 'with_doctor', 'done']).optional(),
  notes: z.string().max(500, 'Notes are too long').optional(),
  department: z.string().max(100, 'Department name is too long').optional(),
});
export type UpdateVisitBody = z.infer<typeof UpdateVisitBody>;

export const UpdateAdmissionBody = z.object({
  assignedDoctorId: z.string().optional(),
  department: z.string().max(100, 'Department name is too long').optional(),
  notes: z.string().max(1000, 'Notes are too long').optional(),
});
export type UpdateAdmissionBody = z.infer<typeof UpdateAdmissionBody>;

export const AdmitBody = z.object({
  department: z.string().max(100, 'Department name is too long').trim().optional(),
  assignedTo: z.string().optional(),
  notes: z.string().max(1000, 'Notes are too long').optional(),
});
export type AdmitBody = z.infer<typeof AdmitBody>;

export const DischargeBody = z.object({
  notes: z.string().max(1000, 'Notes are too long').optional(),
  followUpDate: z.coerce.date({ errorMap: () => ({ message: 'Follow-up date must be a valid date' }) }).optional(),
});
export type DischargeBody = z.infer<typeof DischargeBody>;

export const TransferBody = z.object({
  toHospitalId: z.string().min(1, 'Destination hospital is required'),
  reason: z.string().min(1, 'Transfer reason is required').max(1000, 'Reason is too long').trim(),
  department: z.string().max(100, 'Department name is too long').optional(),
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
