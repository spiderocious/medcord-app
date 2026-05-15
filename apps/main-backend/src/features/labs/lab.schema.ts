import { z } from 'zod';

export const CreateLabOrderBody = z.object({
  testName: z.string().min(1).max(200).trim(),
  testCode: z.string().max(50).optional(),
  category: z.string().max(100).optional(),
  priority: z.enum(['routine', 'urgent', 'stat']).default('routine'),
  sampleType: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
});
export type CreateLabOrderBody = z.infer<typeof CreateLabOrderBody>;

export const UpdateLabOrderBody = z.object({
  testName: z.string().min(1).max(200).trim().optional(),
  testCode: z.string().max(50).optional(),
  category: z.string().max(100).optional(),
  priority: z.enum(['routine', 'urgent', 'stat']).optional(),
  notes: z.string().max(1000).optional(),
  fileKey: z.string().min(1).optional(),
});
export type UpdateLabOrderBody = z.infer<typeof UpdateLabOrderBody>;

export const AdvanceStatusBody = z.object({
  note: z.string().max(500).optional(),
  sampleType: z.string().max(100).optional(),
  sampleCollectedAt: z.coerce.date().optional(),
});
export type AdvanceStatusBody = z.infer<typeof AdvanceStatusBody>;

export const RecordResultBody = z.object({
  value: z.string().min(1).max(500),
  unit: z.string().max(50).optional(),
  referenceRange: z.string().max(200).optional(),
  isAbnormal: z.boolean().default(false),
  notes: z.string().max(1000).optional(),
  fileKey: z.string().min(1).optional(),
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
    ])
    .optional(),
  priority: z.enum(['routine', 'urgent', 'stat']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListLabOrdersQuery = z.infer<typeof ListLabOrdersQuery>;
