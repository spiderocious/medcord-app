import { useState } from 'react';
import { Loadable, Repeat, Show } from 'meemaw';

import { AppButton, AppText } from '@medcord/ui';
import { PERMISSIONS } from '@medcord/rbac';
import { useAuth } from '@shared/hooks/use-auth.ts';
import { usePermissions } from '@shared/hooks/use-permissions.ts';
import { useRoles, useDeleteRole } from '../api/use-roles.ts';
import { RoleForm } from './parts/role-form.tsx';
import type { CustomRole } from '@shared/types/staff.ts';

export function RolesScreen() {
  const { activeHospitalId } = useAuth();
  const hospitalId = activeHospitalId ?? '';
  const { can } = usePermissions();

  const { data, isLoading, error } = useRoles(hospitalId);
  const deleteMutation = useDeleteRole(hospitalId);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  const canManage = can(PERMISSIONS.SETTINGS_UPDATE);
  const roles = data?.roles ?? [];
  const permissionDescriptions = data?.permissionDescriptions;
  const permissionGroups = data?.permissionGroups;

  const systemRoles = roles.filter((r) => r.isSystem);
  const customRoles = roles.filter((r) => !r.isSystem);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <AppText variant="heading-2" className="text-charcoal-900">Roles</AppText>
          <AppText variant="body-sm" className="mt-1 text-charcoal-700">
            Manage system and custom roles for this hospital.
          </AppText>
        </div>
        <Show when={canManage && !showCreateForm && editingRoleId === null}>
          <AppButton onClick={() => setShowCreateForm(true)}>New role</AppButton>
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
        {/* ── System roles (read-only) ─────────────────────────────────── */}
        <div className="space-y-3">
          <AppText variant="caption" className="font-semibold uppercase text-charcoal-700/60">
            System roles · {systemRoles.length}
          </AppText>
          <div className="rounded-xl border border-forest-900/10 bg-white shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-forest-900/10 bg-cream-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Name</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Permissions</th>
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
                          when={role.slug !== 'super_admin'}
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

          <Show when={showCreateForm && permissionDescriptions !== undefined && permissionGroups !== undefined}>
            <RoleForm
              hospitalId={hospitalId}
              permissionDescriptions={permissionDescriptions!}
              permissionGroups={permissionGroups!}
              onDone={() => setShowCreateForm(false)}
            />
          </Show>

          <Show
            when={customRoles.length > 0}
            fallback={
              <Show when={!showCreateForm}>
                <p className="text-sm text-charcoal-700/60 py-6 text-center rounded-xl border border-forest-900/10 bg-white">
                  No custom roles yet. Create one to extend the built-in system roles.
                </p>
              </Show>
            }
          >
            <div className="rounded-xl border border-forest-900/10 bg-white shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-forest-900/10 bg-cream-50">
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Name</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Permissions</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Created</th>
                    <Show when={canManage}>
                      <th className="px-5 py-3" />
                    </Show>
                  </tr>
                </thead>
                <tbody>
                  <Repeat each={customRoles as CustomRole[]}>
                    {(role: CustomRole) => (
                      <tr key={role.id} className="border-b border-forest-900/5 last:border-0">
                        <Show
                          when={editingRoleId === role.id && permissionDescriptions !== undefined && permissionGroups !== undefined}
                          fallback={
                            <>
                              <td className="px-5 py-4 text-sm font-medium text-charcoal-900">{role.name}</td>
                              <td className="px-5 py-4">
                                <span className="inline-flex items-center rounded-full border border-forest-900/10 bg-cream-50 px-2.5 py-0.5 text-xs font-medium text-charcoal-700">
                                  {role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-sm text-charcoal-700">
                                {new Date(role.createdAt).toLocaleDateString()}
                              </td>
                              <Show when={canManage}>
                                <td className="px-5 py-4">
                                  <div className="flex items-center justify-end gap-2">
                                    <AppButton variant="ghost" onClick={() => setEditingRoleId(role.id)}>
                                      Edit
                                    </AppButton>
                                    <AppButton
                                      variant="ghost"
                                      onClick={() => { void deleteMutation.mutateAsync(role.id); }}
                                      loading={deleteMutation.isPending}
                                    >
                                      Delete
                                    </AppButton>
                                  </div>
                                </td>
                              </Show>
                            </>
                          }
                        >
                          <td colSpan={canManage ? 4 : 3} className="px-5 py-4">
                            <RoleForm
                              hospitalId={hospitalId}
                              role={role}
                              permissionDescriptions={permissionDescriptions!}
                              permissionGroups={permissionGroups!}
                              onDone={() => setEditingRoleId(null)}
                            />
                          </td>
                        </Show>
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
