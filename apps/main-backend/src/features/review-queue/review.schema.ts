import { z } from 'zod';

export const CreateReviewItemBody = z.object({
  patientId: z.string().min(1),
  type: z.enum(['lab_result', 'vitals', 'medication', 'document', 'discharge', 'transfer']),
  referenceId: z.string().min(1),
  title: z.string().min(1).max(300).trim(),
  summary: z.string().max(1000).optional(),
  priority: z.enum(['routine', 'urgent', 'stat']).default('routine'),
});
export type CreateReviewItemBody = z.infer<typeof CreateReviewItemBody>;

export const ReviewActionBody = z.object({
  action: z.enum(['approve', 'reject', 'escalate']),
  note: z.string().max(1000).optional(),
});
export type ReviewActionBody = z.infer<typeof ReviewActionBody>;

export const ListReviewQueueQuery = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'escalated']).optional(),
  type: z
    .enum(['lab_result', 'vitals', 'medication', 'document', 'discharge', 'transfer'])
    .optional(),
  priority: z.enum(['routine', 'urgent', 'stat']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListReviewQueueQuery = z.infer<typeof ListReviewQueueQuery>;
