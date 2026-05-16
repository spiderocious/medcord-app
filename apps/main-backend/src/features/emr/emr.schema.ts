import { z } from 'zod';

// ── Vitals ────────────────────────────────────────────────────────────────────

export const RecordVitalsBody = z.object({
  bp_systolic: z.number().positive('Systolic blood pressure must be positive').optional(),
  bp_diastolic: z.number().positive('Diastolic blood pressure must be positive').optional(),
  hr: z.number().positive('Heart rate must be positive').optional(),
  rr: z.number().positive('Respiratory rate must be positive').optional(),
  temp: z.number().optional(),
  spo2: z.number().min(0, 'SpO2 cannot be negative').max(100, 'SpO2 cannot exceed 100').optional(),
  weight: z.number().positive('Weight must be positive').optional(),
  height: z.number().positive('Height must be positive').optional(),
  painScore: z.number().int().min(0, 'Pain score must be between 0 and 10').max(10, 'Pain score must be between 0 and 10').optional(),
});
export type RecordVitalsBody = z.infer<typeof RecordVitalsBody>;

// ── Medications ───────────────────────────────────────────────────────────────

export const AddMedicationBody = z.object({
  drug: z.string().min(1, 'Drug name is required').max(200, 'Drug name is too long').trim(),
  strength: z.string().max(100, 'Strength is too long').optional(),
  route: z.string().max(100, 'Route is too long').optional(),
  frequency: z.string().max(100, 'Frequency is too long').optional(),
  indication: z.string().max(500, 'Indication is too long').optional(),
  duration: z.string().max(100, 'Duration is too long').optional(),
  drugInteractionWarnings: z.array(z.string().min(1)).default([]),
  allergyWarnings: z.array(z.string().min(1)).default([]),
});
export type AddMedicationBody = z.infer<typeof AddMedicationBody>;

export const UpdateMedicationBody = z.object({
  status: z.enum(['discontinued', 'on_hold', 'active'], {
    errorMap: () => ({ message: 'Status must be one of: discontinued, on_hold, active' }),
  }),
  reason: z.string().max(500, 'Reason is too long').optional(),
});
export type UpdateMedicationBody = z.infer<typeof UpdateMedicationBody>;

// ── Medical History ───────────────────────────────────────────────────────────

const DiagnosisSchema = z.object({
  icd10Code: z.string().min(1, 'ICD-10 code is required').max(20, 'ICD-10 code is too long').trim(),
  description: z.string().min(1, 'Diagnosis description is required').max(500, 'Description is too long').trim(),
  diagnosedAt: z.coerce.date({ errorMap: () => ({ message: 'Diagnosed date must be a valid date' }) }).optional(),
});

const HistoryProcedureSchema = z.object({
  cptCode: z.string().min(1, 'CPT code is required').max(20, 'CPT code is too long').trim(),
  description: z.string().min(1, 'Procedure description is required').max(500, 'Description is too long').trim(),
  performedAt: z.coerce.date({ errorMap: () => ({ message: 'Performed date must be a valid date' }) }).optional(),
});

const SocialHistorySchema = z.object({
  smoking: z.string().max(200, 'Smoking history is too long').optional(),
  alcohol: z.string().max(200, 'Alcohol history is too long').optional(),
  occupation: z.string().max(200, 'Occupation is too long').optional(),
  other: z.string().max(500, 'Other history is too long').optional(),
});

export const AddMedicalHistoryBody = z.object({
  diagnoses: z.array(DiagnosisSchema).default([]),
  procedures: z.array(HistoryProcedureSchema).default([]),
  familyHistory: z.array(z.string().min(1).max(500)).default([]),
  socialHistory: SocialHistorySchema.default({}),
  notes: z.string().max(2000, 'Notes are too long').optional(),
});
export type AddMedicalHistoryBody = z.infer<typeof AddMedicalHistoryBody>;

// ── Procedures ────────────────────────────────────────────────────────────────

const PreOpChecklistSchema = z.object({
  consentObtained: z.boolean(),
  npoStatus: z.boolean(),
  allergiesConfirmed: z.boolean(),
  siteMarked: z.boolean(),
});

export const AddProcedureBody = z.object({
  name: z.string().min(1, 'Procedure name is required').max(300, 'Procedure name is too long').trim(),
  cptCode: z.string().max(20, 'CPT code is too long').optional(),
  performedBy: z.string().min(1, 'Performed by is required').max(200, 'Name is too long').trim(),
  performedAt: z.coerce.date({ errorMap: () => ({ message: 'Performed date is required and must be a valid date' }) }),
  location: z.string().max(200, 'Location is too long').optional(),
  notes: z.string().max(2000, 'Notes are too long').optional(),
  operativeNoteKey: z.string().min(1, 'Operative note key is required').optional(),
  preOpChecklist: PreOpChecklistSchema,
  followUpDate: z.coerce.date({ errorMap: () => ({ message: 'Follow-up date must be a valid date' }) }).optional(),
});
export type AddProcedureBody = z.infer<typeof AddProcedureBody>;

// ── Immunizations ─────────────────────────────────────────────────────────────

export const AddImmunizationBody = z.object({
  vaccine: z.string().min(1, 'Vaccine name is required').max(200, 'Vaccine name is too long').trim(),
  dose: z.string().max(100, 'Dose is too long').optional(),
  administeredAt: z.coerce.date({ errorMap: () => ({ message: 'Administration date is required and must be a valid date' }) }),
  lotNumber: z.string().max(100, 'Lot number is too long').optional(),
  administrator: z.string().min(1, 'Administrator name is required').max(200, 'Administrator name is too long').trim(),
  nextDueDate: z.coerce.date({ errorMap: () => ({ message: 'Next due date must be a valid date' }) }).optional(),
});
export type AddImmunizationBody = z.infer<typeof AddImmunizationBody>;

// ── Chart Documents ───────────────────────────────────────────────────────────

export const AddChartDocumentBody = z.object({
  title: z.string().min(1, 'Document title is required').max(300, 'Title is too long').trim(),
  category: z.enum(['referral', 'lab_report', 'imaging', 'consent', 'other'], {
    errorMap: () => ({ message: 'Category must be one of: referral, lab_report, imaging, consent, other' }),
  }),
  fileKey: z.string().min(1, 'File key is required'),
  isSensitive: z.boolean().default(false),
});
export type AddChartDocumentBody = z.infer<typeof AddChartDocumentBody>;

export const UpdateChartDocumentBody = z.object({
  category: z.enum(['referral', 'lab_report', 'imaging', 'consent', 'other'], {
    errorMap: () => ({ message: 'Category must be one of: referral, lab_report, imaging, consent, other' }),
  }).optional(),
  isSensitive: z.boolean().optional(),
});
export type UpdateChartDocumentBody = z.infer<typeof UpdateChartDocumentBody>;

// ── Break Glass ───────────────────────────────────────────────────────────────

export const BreakGlassBody = z.object({
  reason: z.string().min(1, 'Reason is required').max(1000, 'Reason is too long').trim(),
});
export type BreakGlassBody = z.infer<typeof BreakGlassBody>;
