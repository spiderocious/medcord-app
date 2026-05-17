import { z } from 'zod';

export const CreateUnitBody = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long').trim(),
  type: z.enum(['department', 'unit', 'ward'], {
    errorMap: () => ({ message: 'Type must be one of: department, unit, ward' }),
  }),
  parentId: z.string().optional(),
});
export type CreateUnitBody = z.infer<typeof CreateUnitBody>;

export const UpdateUnitBody = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long').trim().optional(),
  type: z.enum(['department', 'unit', 'ward'], {
    errorMap: () => ({ message: 'Type must be one of: department, unit, ward' }),
  }).optional(),
  parentId: z.string().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateUnitBody = z.infer<typeof UpdateUnitBody>;
