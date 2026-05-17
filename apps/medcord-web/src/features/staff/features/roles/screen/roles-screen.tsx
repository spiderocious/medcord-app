import { Link, useNavigate } from 'react-router-dom';
import { Loadable, Repeat, Show } from 'meemaw';

import { AppButton, AppText } from '@medcord/ui';
import { PERMISSIONS, ROLES } from '@medcord/rbac';
import { useAuth } from '@shared/hooks/use-auth.ts';
import { usePermissions } from '@shared/hooks/use-permissions.ts';
import { ROUTES } from '@shared/constants/routes.ts';
import { useHospitalSlug } from '@shared/hooks/use-hospital-slug.ts';
import { useRoles, useDeleteRole } from '../api/use-roles.ts';
import type { CustomRole } from '@shared/types/staff.ts';

export function RolesScreen() {
  const slug = useHospitalSlug();
  const { activeHospitalId } = useAuth();
  const hospitalId = activeHospitalId ?? '';
  const navigate = useNavigate();
  const { can } = usePermissions();

  const { data, isLoading, error } = useRoles(hospitalId);
  const deleteMutation = useDeleteRole(hospitalId);

  const canManage = can(PERMISSIONS.SETTINGS_UPDATE);
  const roles = data?.roles ?? [];
  const systemRoles = roles.filter((r) => r.isSystem);
  const customRoles = roles.filter((r) => !r.isSystem);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <AppText variant="heading-2" className="text-charcoal-900">Roles</AppText>
          <AppText variant="body-sm" className="mt-1 text-charcoal-700">
            Manage system and custom roles for this hospital.
          </AppText>
        </div>
        <Show when={canManage}>
          <Link to={ROUTES.HOSPITAL_ROLE_CREATE(slug)}>
            <AppButton>New role</AppButton>
          </Link>
        </Show>
      </div>

      <Loadable
        loading={isLoading}
        error={error ?? undefined}
        loadingComponent={
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-forest-900/20 border-t-forest-900" />
          </div>
        }
        errorComponent={
          <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error instanceof Error ? error.message : 'Failed to load roles.'}
          </p>
        }
      >
        {/* ── System roles ──────────────────────────────────────────────── */}
        <div className="space-y-3">
          <AppText variant="caption" className="font-semibold uppercase text-charcoal-700/60">
            System roles · {systemRoles.length}
          </AppText>
          <div className="overflow-x-auto rounded-xl border border-forest-900/10 bg-white shadow-sm">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-forest-900/10 bg-cream-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Name</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Permissions</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Members</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                <Repeat each={systemRoles as CustomRole[]}>
                  {(role: CustomRole) => (
                    <tr key={role.id} className="border-b border-forest-900/5 last:border-0">
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-charcoal-900">{role.name}</p>
                        <p className="text-xs text-charcoal-700/50 font-mono mt-0.5">{role.slug}</p>
                      </td>
                      <td className="px-5 py-4">
                        <Show
                          when={role.slug !== ROLES.SUPER_ADMIN}
                          fallback={
                            <span className="inline-flex items-center rounded-full border border-forest-900/20 bg-forest-900/5 px-2.5 py-0.5 text-xs font-medium text-charcoal-700">
                              All permissions (bypass)
                            </span>
                          }
                        >
                          <span className="inline-flex items-center rounded-full border border-forest-900/10 bg-cream-50 px-2.5 py-0.5 text-xs font-medium text-charcoal-700">
                            {role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}
                          </span>
                        </Show>
                      </td>
                      <td className="px-5 py-4 text-sm text-charcoal-700">{role.memberCount}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <AppButton
                            variant="ghost"
                            onClick={() => navigate(ROUTES.HOSPITAL_ROLE_VIEW(slug, role.id))}
                          >
                            View
                          </AppButton>
                          <Show when={canManage && role.slug !== ROLES.SUPER_ADMIN}>
                            <AppButton
                              variant="ghost"
                              onClick={() => navigate(ROUTES.HOSPITAL_ROLE_EDIT(slug, role.id))}
                            >
                              Edit
                            </AppButton>
                          </Show>
                        </div>
                      </td>
                    </tr>
                  )}
                </Repeat>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Custom roles ──────────────────────────────────────────────── */}
        <div className="space-y-3">
          <AppText variant="caption" className="font-semibold uppercase text-charcoal-700/60">
            Custom roles · {customRoles.length}
          </AppText>

          <Show
            when={customRoles.length > 0}
            fallback={
              <p className="text-sm text-charcoal-700/60 py-6 text-center rounded-xl border border-forest-900/10 bg-white">
                No custom roles yet.{canManage ? ' Create one to extend the built-in system roles.' : ''}
              </p>
            }
          >
            <div className="overflow-x-auto rounded-xl border border-forest-900/10 bg-white shadow-sm">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-forest-900/10 bg-cream-50">
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Name</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Permissions</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Members</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Created</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  <Repeat each={customRoles as CustomRole[]}>
                    {(role: CustomRole) => (
                      <tr key={role.id} className="border-b border-forest-900/5 last:border-0">
                        <td className="px-5 py-4 text-sm font-medium text-charcoal-900">{role.name}</td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center rounded-full border border-forest-900/10 bg-cream-50 px-2.5 py-0.5 text-xs font-medium text-charcoal-700">
                            {role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-charcoal-700">{role.memberCount}</td>
                        <td className="px-5 py-4 text-sm text-charcoal-700">
                          {new Date(role.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <AppButton
                              variant="ghost"
                              onClick={() => navigate(ROUTES.HOSPITAL_ROLE_VIEW(slug, role.id))}
                            >
                              View
                            </AppButton>
                            <Show when={canManage}>
                              <AppButton
                                variant="ghost"
                                onClick={() => navigate(ROUTES.HOSPITAL_ROLE_EDIT(slug, role.id))}
                              >
                                Edit
                              </AppButton>
                              <AppButton
                                variant="ghost"
                                onClick={() => { void deleteMutation.mutateAsync(role.id); }}
                                loading={deleteMutation.isPending}
                              >
                                Delete
                              </AppButton>
                            </Show>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Repeat>
                </tbody>
              </table>
            </div>
          </Show>
        </div>
      </Loadable>
    </div>
  );
}
