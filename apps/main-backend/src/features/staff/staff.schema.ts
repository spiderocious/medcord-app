import { z } from 'zod';

import { STAFF_ROLES } from '@shared/types/roles.types.js';

export const InviteBody = z.object({
  email: z.string().email().toLowerCase().trim(),
  role: z.enum(STAFF_ROLES),
  department: z.string().trim().optional(),
  unit: z.string().trim().optional(),
});
export type InviteBody = z.infer<typeof InviteBody>;

export const BulkInviteBody = z.object({
  invitations: z
    .array(
      z.object({
        email: z.string().email().toLowerCase().trim(),
        role: z.enum(STAFF_ROLES),
        department: z.string().trim().optional(),
        unit: z.string().trim().optional(),
      }),
    )
    .min(1)
    .max(100),
});
export type BulkInviteBody = z.infer<typeof BulkInviteBody>;

export const UpdateMemberBody = z.object({
  role: z.enum(STAFF_ROLES).optional(),
  department: z.string().trim().optional(),
  unit: z.string().trim().optional(),
  specialty: z.string().trim().optional(),
  managerId: z.string().optional(),
});
export type UpdateMemberBody = z.infer<typeof UpdateMemberBody>;

export const CreateRoleBody = z.object({
  name: z.string().min(1).max(80).trim(),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9_-]+$/)
    .trim(),
  permissions: z.array(z.string()).default([]),
});
export type CreateRoleBody = z.infer<typeof CreateRoleBody>;

export const UpdateRoleBody = z.object({
  name: z.string().min(1).max(80).trim().optional(),
  permissions: z.array(z.string()).optional(),
});
export type UpdateRoleBody = z.infer<typeof UpdateRoleBody>;

export const ListStaffQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  role: z.enum(STAFF_ROLES).optional(),
  status: z.enum(['active', 'suspended']).optional(),
  q: z.string().optional(),
});
export type ListStaffQuery = z.infer<typeof ListStaffQuery>;
