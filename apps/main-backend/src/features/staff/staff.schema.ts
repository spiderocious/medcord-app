import { z } from 'zod';

import { STAFF_ROLES } from '@shared/types/roles.types.js';

const systemRoleEnum = z.enum(STAFF_ROLES, {
  errorMap: () => ({ message: `Role must be one of: ${STAFF_ROLES.join(', ')}` }),
});

// Invite and update accept any string slug — service validates against actual hospital roles
const roleSlug = z.string().min(1, 'Role is required').max(80, 'Role slug is too long').trim();

export const InviteBody = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  role: roleSlug,
  department: z.string().trim().optional(),
  unit: z.string().trim().optional(),
});
export type InviteBody = z.infer<typeof InviteBody>;

export const BulkInviteBody = z.object({
  invitations: z
    .array(
      z.object({
        email: z.string().email('Invalid email address').toLowerCase().trim(),
        role: roleSlug,
        department: z.string().trim().optional(),
        unit: z.string().trim().optional(),
      }),
    )
    .min(1, 'At least one invitation is required')
    .max(100, 'Cannot send more than 100 invitations at once'),
});
export type BulkInviteBody = z.infer<typeof BulkInviteBody>;

export const UpdateMemberBody = z.object({
  role: roleSlug.optional(),
  department: z.string().trim().optional(),
  unit: z.string().trim().optional(),
  specialty: z.string().trim().optional(),
  managerId: z.string().optional(),
});
export type UpdateMemberBody = z.infer<typeof UpdateMemberBody>;

export const CreateRoleBody = z.object({
  name: z.string().min(1, 'Role name is required').max(80, 'Role name is too long').trim(),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(80, 'Slug is too long')
    .regex(/^[a-z0-9_-]+$/, 'Slug may only contain lowercase letters, numbers, underscores, and hyphens')
    .trim(),
  permissions: z.array(z.string()).default([]),
});
export type CreateRoleBody = z.infer<typeof CreateRoleBody>;

export const UpdateRoleBody = z.object({
  name: z.string().min(1, 'Role name is required').max(80, 'Role name is too long').trim().optional(),
  permissions: z.array(z.string()).optional(),
});
export type UpdateRoleBody = z.infer<typeof UpdateRoleBody>;

export const AcceptInvitationBody = z.object({
  name: z.string().min(1, 'Name is required').max(120, 'Name is too long').trim(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password is too long'),
});
export type AcceptInvitationBody = z.infer<typeof AcceptInvitationBody>;

export const ListStaffQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  role: systemRoleEnum.optional(),
  status: z.enum(['active', 'suspended']).optional(),
  q: z.string().optional(),
});
export type ListStaffQuery = z.infer<typeof ListStaffQuery>;
