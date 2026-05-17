import { useState } from 'react';
import { Repeat, Show } from 'meemaw';

import { AppButton } from '@medcord/ui';
import type { Permission, PermissionGroup } from '@medcord/rbac';
import { useCreateRole, useUpdateRole } from '../../api/use-roles.ts';
import type { CustomRole } from '@shared/types/staff.ts';

interface RoleFormProps {
  readonly hospitalId: string;
  readonly role?: CustomRole;
  readonly permissionDescriptions: Record<Permission, string>;
  readonly permissionGroups: PermissionGroup[];
  readonly onDone: () => void;
}

const INPUT_CLS = 'mt-1 block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 placeholder-charcoal-700/50 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900 disabled:opacity-50';

export function RoleForm({ hospitalId, role, permissionDescriptions, permissionGroups, onDone }: RoleFormProps) {
  const isEdit = role !== undefined;
  const [name, setName] = useState(role?.name ?? '');
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(
    new Set(role?.permissions ?? []),
  );
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useCreateRole(hospitalId);
  const updateMutation = useUpdateRole(hospitalId, role?.id ?? '');
  const isPending = createMutation.isPending || updateMutation.isPending;

  function togglePerm(perm: string) {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      if (next.has(perm)) {
        next.delete(perm);
      } else {
        next.add(perm);
      }
      return next;
    });
  }

  function slugify(s: string): string {
    return s.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  }

  async function handleSave() {
    setFormError(null);
    if (!name.trim()) { setFormError('Role name is required.'); return; }
    const permissions = Array.from(selectedPerms);
    if (isEdit) {
      await updateMutation.mutateAsync({ name: name.trim(), permissions });
    } else {
      await createMutation.mutateAsync({ name: name.trim(), slug: slugify(name.trim()), permissions });
    }
    onDone();
  }

  return (
    <div className="rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm space-y-5">
      <p className="text-sm font-semibold text-charcoal-900">
        {isEdit ? 'Edit role' : 'New role'}
      </p>

      <div>
        <label className="block text-sm font-medium text-charcoal-900">Role name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isPending || (isEdit && role.isSystem)}
          className={INPUT_CLS}
          placeholder="e.g. Senior Pharmacist"
        />
      </div>

      <div className="space-y-4">
        <p className="text-sm font-medium text-charcoal-900">Permissions</p>
        <Repeat each={permissionGroups as PermissionGroup[]}>
          {(group: PermissionGroup) => (
            <div key={group.label} className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">{group.label}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <Repeat each={group.permissions as Permission[]}>
                  {(perm: Permission) => (
                    <label
                      key={perm}
                      className="flex cursor-pointer items-start gap-3 rounded-lg border border-forest-900/10 bg-cream-50/60 px-3 py-2.5 hover:bg-cream-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPerms.has(perm)}
                        onChange={() => togglePerm(perm)}
                        disabled={isPending}
                        className="mt-0.5 h-4 w-4 rounded border-forest-900/30 text-forest-900 focus:ring-forest-900"
                      />
                      <span className="text-sm text-charcoal-900">{permissionDescriptions[perm]}</span>
                    </label>
                  )}
                </Repeat>
              </div>
            </div>
          )}
        </Repeat>
      </div>

      <Show when={formError !== null}>
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>
      </Show>

      <div className="flex items-center gap-2">
        <AppButton onClick={() => { void handleSave(); }} loading={isPending}>
          Save
        </AppButton>
        <AppButton variant="ghost" onClick={onDone} disabled={isPending}>
          Cancel
        </AppButton>
      </div>
    </div>
  );
}
