import { useNavigate, useParams } from 'react-router-dom';

import { AppButton, AppText } from '@medcord/ui';
import { Loadable, Repeat, Show } from 'meemaw';
import { IconArrowLeft } from '@icons';
import { ROLES } from '@medcord/rbac';
import { ROUTES } from '@shared/constants/routes.ts';
import { useHospitalSlug } from '@shared/hooks/use-hospital-slug.ts';
import { useAuth } from '@shared/hooks/use-auth.ts';
import { usePermissions } from '@shared/hooks/use-permissions.ts';
import { PERMISSIONS } from '@medcord/rbac';
import { useStaff } from '@features/staff/features/staff-directory/api/use-staff.ts';
import type { StaffMember } from '@features/staff/shared/types/staff.ts';
import { useRoles } from '../api/use-roles.ts';

export function RoleViewScreen() {
  const slug = useHospitalSlug();
  const { activeHospitalId } = useAuth();
  const hospitalId = activeHospitalId ?? '';
  const { roleId = '' } = useParams<{ roleId: string }>();
  const navigate = useNavigate();
  const { can } = usePermissions();

  const { data, isLoading, error } = useRoles(hospitalId);
  const role = data?.roles.find((r) => r.id === roleId);

  const { data: staffData, isLoading: staffLoading } = useStaff(hospitalId, {
    role: role?.slug,
    limit: 100,
    status: 'active',
  });

  const canManage = can(PERMISSIONS.SETTINGS_UPDATE);
  const isSuperAdmin = role?.slug === ROLES.SUPER_ADMIN;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <div>
        <AppButton
          variant="ghost"
          leadingIcon={<IconArrowLeft size={14} />}
          onClick={() => navigate(ROUTES.HOSPITAL_ROLES(slug))}
        >
          Back to roles
        </AppButton>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <AppText variant="heading-1" className="text-charcoal-900">
            {role !== undefined ? role.name : 'Role'}
          </AppText>
          <AppText variant="body-sm" className="mt-1 text-charcoal-700">
            {isSuperAdmin
              ? 'Super Admin bypasses all permission checks.'
              : role?.isSystem === true
                ? 'System role — permissions are editable, name is fixed.'
                : 'Custom role'}
          </AppText>
        </div>

        <Show when={canManage && !isSuperAdmin}>
          <AppButton onClick={() => navigate(ROUTES.HOSPITAL_ROLE_EDIT(slug, roleId))}>
            Edit permissions
          </AppButton>
        </Show>
      </div>

      <Loadable
        loading={isLoading}
        error={(error ?? (data !== undefined && role === undefined ? new Error('Role not found.') : null)) ?? undefined}
        loadingComponent={
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-forest-900/20 border-t-forest-900" />
          </div>
        }
        errorComponent={
          <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error instanceof Error ? error.message : 'Role not found.'}
          </p>
        }
      >
        <div className="grid gap-6 lg:grid-cols-2">
          {/* ── Permissions ───────────────────────────────────────────── */}
          <div className="space-y-3">
            <AppText variant="caption" className="font-semibold uppercase text-charcoal-700/60">
              Permissions
            </AppText>
            <div className="rounded-xl border border-forest-900/10 bg-white p-4 shadow-sm space-y-2">
              <Show
                when={!isSuperAdmin}
                fallback={
                  <span className="inline-flex items-center rounded-full border border-forest-900/20 bg-forest-900/5 px-2.5 py-0.5 text-xs font-medium text-charcoal-700">
                    All permissions (bypass)
                  </span>
                }
              >
                <Show
                  when={(role?.permissions.length ?? 0) > 0}
                  fallback={
                    <p className="text-sm text-charcoal-700/60">No permissions assigned.</p>
                  }
                >
                  <Repeat each={(role?.permissions ?? []) as string[]}>
                    {(perm: string) => (
                      <div
                        key={perm}
                        className="flex items-center gap-2 rounded-lg border border-forest-900/10 bg-cream-50/60 px-3 py-2"
                      >
                        <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-forest-900/40" />
                        <span className="text-sm text-charcoal-900">
                          {data?.permissionDescriptions[perm as keyof typeof data.permissionDescriptions] ?? perm}
                        </span>
                      </div>
                    )}
                  </Repeat>
                </Show>
              </Show>
            </div>
          </div>

          {/* ── Members ───────────────────────────────────────────────── */}
          <div className="space-y-3">
            <AppText variant="caption" className="font-semibold uppercase text-charcoal-700/60">
              Members · {role?.memberCount ?? 0}
            </AppText>
            <div className="rounded-xl border border-forest-900/10 bg-white shadow-sm overflow-hidden">
              <Show when={staffLoading}>
                <div className="flex items-center justify-center py-10">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-forest-900/20 border-t-forest-900" />
                </div>
              </Show>
              <Show
                when={!staffLoading && (staffData?.items.length ?? 0) === 0}
              >
                <p className="py-8 text-center text-sm text-charcoal-700/60">No active members with this role.</p>
              </Show>
              <Show when={!staffLoading && (staffData?.items.length ?? 0) > 0}>
                <table className="w-full">
                  <tbody>
                    <Repeat each={(staffData?.items ?? []) as StaffMember[]}>
                      {(member: StaffMember) => (
                        <tr
                          key={member.id}
                          className="border-b border-forest-900/5 last:border-0 cursor-pointer hover:bg-cream-50 transition-colors"
                          onClick={() => navigate(ROUTES.HOSPITAL_STAFF_PROFILE(slug, member.id))}
                        >
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-charcoal-900">{member.name}</p>
                            <p className="text-xs text-charcoal-700/60">{member.email}</p>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Show when={member.department !== undefined}>
                              <span className="text-xs text-charcoal-700/60">{member.department}</span>
                            </Show>
                          </td>
                        </tr>
                      )}
                    </Repeat>
                  </tbody>
                </table>
              </Show>
            </div>
          </div>
        </div>
      </Loadable>
    </div>
  );
}
