import { z } from 'zod';

// ── Vitals ────────────────────────────────────────────────────────────────────

export const RecordVitalsBody = z.object({
  bp_systolic: z.number().positive().optional(),
  bp_diastolic: z.number().positive().optional(),
  hr: z.number().positive().optional(),
  rr: z.number().positive().optional(),
  temp: z.number().optional(),
  spo2: z.number().min(0).max(100).optional(),
  weight: z.number().positive().optional(),
  height: z.number().positive().optional(),
  painScore: z.number().int().min(0).max(10).optional(),
});
export type RecordVitalsBody = z.infer<typeof RecordVitalsBody>;

// ── Medications ───────────────────────────────────────────────────────────────

export const AddMedicationBody = z.object({
  drug: z.string().min(1).max(200).trim(),
  strength: z.string().max(100).optional(),
  route: z.string().max(100).optional(),
  frequency: z.string().max(100).optional(),
  indication: z.string().max(500).optional(),
  duration: z.string().max(100).optional(),
  drugInteractionWarnings: z.array(z.string().min(1)).default([]),
  allergyWarnings: z.array(z.string().min(1)).default([]),
});
export type AddMedicationBody = z.infer<typeof AddMedicationBody>;

export const UpdateMedicationBody = z.object({
  status: z.enum(['discontinued', 'on_hold', 'active']),
  reason: z.string().max(500).optional(),
});
export type UpdateMedicationBody = z.infer<typeof UpdateMedicationBody>;

// ── Medical History ───────────────────────────────────────────────────────────

const DiagnosisSchema = z.object({
  icd10Code: z.string().min(1).max(20).trim(),
  description: z.string().min(1).max(500).trim(),
  diagnosedAt: z.coerce.date().optional(),
});

const HistoryProcedureSchema = z.object({
  cptCode: z.string().min(1).max(20).trim(),
  description: z.string().min(1).max(500).trim(),
  performedAt: z.coerce.date().optional(),
});

const SocialHistorySchema = z.object({
  smoking: z.string().max(200).optional(),
  alcohol: z.string().max(200).optional(),
  occupation: z.string().max(200).optional(),
  other: z.string().max(500).optional(),
});

export const AddMedicalHistoryBody = z.object({
  diagnoses: z.array(DiagnosisSchema).default([]),
  procedures: z.array(HistoryProcedureSchema).default([]),
  familyHistory: z.array(z.string().min(1).max(500)).default([]),
  socialHistory: SocialHistorySchema.default({}),
  notes: z.string().max(2000).optional(),
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
  name: z.string().min(1).max(300).trim(),
  cptCode: z.string().max(20).optional(),
  performedBy: z.string().min(1).max(200).trim(),
  performedAt: z.coerce.date(),
  location: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
  operativeNoteKey: z.string().min(1).optional(),
  preOpChecklist: PreOpChecklistSchema,
  followUpDate: z.coerce.date().optional(),
});
export type AddProcedureBody = z.infer<typeof AddProcedureBody>;

// ── Immunizations ─────────────────────────────────────────────────────────────

export const AddImmunizationBody = z.object({
  vaccine: z.string().min(1).max(200).trim(),
  dose: z.string().max(100).optional(),
  administeredAt: z.coerce.date(),
  lotNumber: z.string().max(100).optional(),
  administrator: z.string().min(1).max(200).trim(),
  nextDueDate: z.coerce.date().optional(),
});
export type AddImmunizationBody = z.infer<typeof AddImmunizationBody>;

// ── Chart Documents ───────────────────────────────────────────────────────────

export const AddChartDocumentBody = z.object({
  title: z.string().min(1).max(300).trim(),
  category: z.enum(['referral', 'lab_report', 'imaging', 'consent', 'other']),
  fileKey: z.string().min(1),
  isSensitive: z.boolean().default(false),
});
export type AddChartDocumentBody = z.infer<typeof AddChartDocumentBody>;

export const UpdateChartDocumentBody = z.object({
  category: z.enum(['referral', 'lab_report', 'imaging', 'consent', 'other']).optional(),
  isSensitive: z.boolean().optional(),
});
export type UpdateChartDocumentBody = z.infer<typeof UpdateChartDocumentBody>;

// ── Break Glass ───────────────────────────────────────────────────────────────

export const BreakGlassBody = z.object({
  reason: z.string().min(1).max(1000).trim(),
});
export type BreakGlassBody = z.infer<typeof BreakGlassBody>;
