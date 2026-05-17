import { DEFAULT_ROLE_PERMISSIONS, ROLES, SYSTEM_ROLES } from '@medcord/rbac';

import { newId } from '@lib/ids.js';
import { CustomRoleModel } from '@features/staff/staff.model.js';

export async function seedDefaultRoles(hospitalId: string): Promise<void> {
  const existing = await CustomRoleModel.find({ hospitalId, isSystem: true }).lean();
  const existingSlugs = new Set(existing.map((r) => r.slug));

  const missing = SYSTEM_ROLES.filter((slug) => !existingSlugs.has(slug));
  if (missing.length === 0) return;

  await CustomRoleModel.insertMany(
    missing.map((slug) => ({
      id: newId.role(),
      hospitalId,
      name: slug === ROLES.SUPER_ADMIN ? 'Super Admin' : slug.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      slug,
      permissions: slug === ROLES.SUPER_ADMIN ? [] : DEFAULT_ROLE_PERMISSIONS[slug as keyof typeof DEFAULT_ROLE_PERMISSIONS] ?? [],
      isSystem: true,
    })),
  );
}
