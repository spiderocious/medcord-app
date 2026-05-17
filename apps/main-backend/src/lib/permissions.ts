import { ROLES, DEFAULT_ROLE_PERMISSIONS, SUPER_ADMIN_SENTINEL, type SystemRole } from '@medcord/rbac';
import { CustomRoleModel } from '@features/staff/staff.model.js';
import type { IHospitalMember } from '@features/hospitals/hospital.model.js';

// Returns the resolved permissions string array for a single membership.
// Returns null for super_admin (signals bypass — no permission check needed).
export async function resolvePermissions(member: IHospitalMember): Promise<string[] | null> {
  if (member.role === ROLES.SUPER_ADMIN) return null;

  const systemRoles = Object.values(ROLES) as string[];
  if (systemRoles.includes(member.role)) {
    return DEFAULT_ROLE_PERMISSIONS[member.role as Exclude<SystemRole, 'super_admin'>] ?? [];
  }

  // Custom role — look up by slug in this hospital's custom_roles collection
  const customRole = await CustomRoleModel.findOne({
    hospitalId: member.hospitalId,
    slug: member.role,
  }).lean();

  return customRole?.permissions ?? [];
}

// Resolves permissions for all active hospital memberships of a user.
// Returns a Record<hospitalId, string[]> where super_admin entries contain
// the SUPER_ADMIN_SENTINEL so the middleware can detect the bypass.
export async function resolveAllPermissions(
  members: IHospitalMember[],
): Promise<Record<string, string[]>> {
  const entries = await Promise.all(
    members.map(async (m) => {
      const perms = await resolvePermissions(m);
      return [m.hospitalId, perms ?? [SUPER_ADMIN_SENTINEL]] as const;
    }),
  );
  return Object.fromEntries(entries);
}
