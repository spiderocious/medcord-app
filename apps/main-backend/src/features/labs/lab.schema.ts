import { z } from 'zod';

export const CreateLabOrderFromHospitalBody = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  testName: z.string().min(1, 'Test name is required').max(200, 'Test name is too long').trim(),
  testCode: z.string().max(50, 'Test code is too long').optional(),
  category: z.string().max(100, 'Category is too long').optional(),
  priority: z.enum(['routine', 'urgent', 'stat'], {
    errorMap: () => ({ message: 'Priority must be one of: routine, urgent, stat' }),
  }).default('routine'),
  sampleType: z.string().max(100, 'Sample type is too long').optional(),
  notes: z.string().max(1000, 'Notes are too long').optional(),
});
export type CreateLabOrderFromHospitalBody = z.infer<typeof CreateLabOrderFromHospitalBody>;

export const CreateLabOrderBody = z.object({
  testName: z.string().min(1, 'Test name is required').max(200, 'Test name is too long').trim(),
  testCode: z.string().max(50, 'Test code is too long').optional(),
  category: z.string().max(100, 'Category is too long').optional(),
  priority: z.enum(['routine', 'urgent', 'stat'], {
    errorMap: () => ({ message: 'Priority must be one of: routine, urgent, stat' }),
  }).default('routine'),
  sampleType: z.string().max(100, 'Sample type is too long').optional(),
  notes: z.string().max(1000, 'Notes are too long').optional(),
});
export type CreateLabOrderBody = z.infer<typeof CreateLabOrderBody>;

export const UpdateLabOrderBody = z.object({
  testName: z.string().min(1, 'Test name is required').max(200, 'Test name is too long').trim().optional(),
  testCode: z.string().max(50, 'Test code is too long').optional(),
  category: z.string().max(100, 'Category is too long').optional(),
  priority: z.enum(['routine', 'urgent', 'stat'], {
    errorMap: () => ({ message: 'Priority must be one of: routine, urgent, stat' }),
  }).optional(),
  notes: z.string().max(1000, 'Notes are too long').optional(),
  fileKey: z.string().min(1, 'File key is required').optional(),
});
export type UpdateLabOrderBody = z.infer<typeof UpdateLabOrderBody>;

export const AdvanceStatusBody = z.object({
  note: z.string().max(500, 'Note is too long').optional(),
  sampleType: z.string().max(100, 'Sample type is too long').optional(),
  sampleCollectedAt: z.coerce.date({ errorMap: () => ({ message: 'Sample collection date must be a valid date' }) }).optional(),
});
export type AdvanceStatusBody = z.infer<typeof AdvanceStatusBody>;

export const RecordResultBody = z.object({
  value: z.string().min(1, 'Result value is required').max(500, 'Result value is too long'),
  unit: z.string().max(50, 'Unit is too long').optional(),
  referenceRange: z.string().max(200, 'Reference range is too long').optional(),
  isAbnormal: z.boolean().default(false),
  notes: z.string().max(1000, 'Notes are too long').optional(),
  fileKey: z.string().min(1, 'File key is required').optional(),
});
export type RecordResultBody = z.infer<typeof RecordResultBody>;

export const ListLabOrdersQuery = z.object({
  status: z
    .enum([
      'awaiting_sample',
      'sample_received',
      'awaiting_test',
      'in_progress',
      'awaiting_result',
      'result_ready',
      'result_released',
    ], {
      errorMap: () => ({ message: 'Invalid status value' }),
    })
    .optional(),
  priority: z.enum(['routine', 'urgent', 'stat'], {
    errorMap: () => ({ message: 'Priority must be one of: routine, urgent, stat' }),
  }).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListLabOrdersQuery = z.infer<typeof ListLabOrdersQuery>;
