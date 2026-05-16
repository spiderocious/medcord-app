import { z } from 'zod';

export const CreateReviewItemBody = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  type: z.enum(['lab_result', 'vitals', 'medication', 'document', 'discharge', 'transfer'], {
    errorMap: () => ({ message: 'Type must be one of: lab_result, vitals, medication, document, discharge, transfer' }),
  }),
  referenceId: z.string().min(1, 'Reference ID is required'),
  title: z.string().min(1, 'Title is required').max(300, 'Title is too long').trim(),
  summary: z.string().max(1000, 'Summary is too long').optional(),
  priority: z.enum(['routine', 'urgent', 'stat'], {
    errorMap: () => ({ message: 'Priority must be one of: routine, urgent, stat' }),
  }).default('routine'),
});
export type CreateReviewItemBody = z.infer<typeof CreateReviewItemBody>;

export const ReviewActionBody = z.object({
  action: z.enum(['approve', 'reject', 'escalate'], {
    errorMap: () => ({ message: 'Action must be one of: approve, reject, escalate' }),
  }),
  note: z.string().max(1000, 'Note is too long').optional(),
});
export type ReviewActionBody = z.infer<typeof ReviewActionBody>;

export const ListReviewQueueQuery = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'escalated'], {
    errorMap: () => ({ message: 'Status must be one of: pending, approved, rejected, escalated' }),
  }).optional(),
  type: z.enum(['lab_result', 'vitals', 'medication', 'document', 'discharge', 'transfer'], {
    errorMap: () => ({ message: 'Type must be one of: lab_result, vitals, medication, document, discharge, transfer' }),
  }).optional(),
  priority: z.enum(['routine', 'urgent', 'stat'], {
    errorMap: () => ({ message: 'Priority must be one of: routine, urgent, stat' }),
  }).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListReviewQueueQuery = z.infer<typeof ListReviewQueueQuery>;
