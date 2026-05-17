import { useState } from 'react';
import { Loadable, Repeat, Show } from 'meemaw';

import { AppButton, AppText, DrawerService } from '@medcord/ui';
import { IconBuilding } from '@icons';
import type { Hospital, HospitalUnit, HospitalUnitType } from '@shared/types/hospital.ts';
import {
  useHospitalUnits,
  useCreateUnit,
  useUpdateUnit,
  useDeleteUnit,
} from '../../api/use-hospital-units.ts';

const TYPE_LABELS: Record<HospitalUnitType, string> = {
  department: 'Department',
  unit: 'Unit',
  ward: 'Ward',
};

const INPUT_CLS =
  'mt-1 block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 placeholder-charcoal-700/50 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900 disabled:cursor-not-allowed disabled:opacity-50';

interface SettingsUnitsProps {
  readonly hospital: Hospital;
}

interface UnitFormData {
  name: string;
  type: HospitalUnitType;
  parentId: string;
}

function UnitForm({
  initial,
  departments,
  onSubmit,
  onCancel,
  loading,
}: {
  initial?: UnitFormData;
  departments: HospitalUnit[];
  onSubmit: (data: UnitFormData) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [type, setType] = useState<HospitalUnitType>(initial?.type ?? 'department');
  const [parentId, setParentId] = useState(initial?.parentId ?? '');

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-charcoal-900">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={INPUT_CLS}
          placeholder="e.g. Cardiology, ICU"
          disabled={loading}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-900">Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as HospitalUnitType)}
          className={INPUT_CLS}
          disabled={loading}
        >
          <option value="department">Department</option>
          <option value="unit">Unit</option>
          <option value="ward">Ward</option>
        </select>
      </div>
      <Show when={departments.length > 0}>
        <div>
          <label className="block text-sm font-medium text-charcoal-900">
            Parent department <span className="font-normal text-charcoal-700">(optional)</span>
          </label>
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className={INPUT_CLS}
            disabled={loading}
          >
            <option value="">— none —</option>
            <Repeat each={departments as HospitalUnit[]}>
              {(d: HospitalUnit) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              )}
            </Repeat>
          </select>
        </div>
      </Show>
      <div className="flex justify-end gap-2 pt-2">
        <AppButton variant="ghost" onClick={onCancel} disabled={loading}>Cancel</AppButton>
        <AppButton
          onClick={() => { if (name.trim()) onSubmit({ name: name.trim(), type, parentId }); }}
          loading={loading}
          disabled={name.trim() === ''}
        >
          Save
        </AppButton>
      </div>
    </div>
  );
}

export function SettingsUnits({ hospital }: SettingsUnitsProps) {
  const { data: units, isLoading, error } = useHospitalUnits(hospital.id);
  const createMutation = useCreateUnit(hospital.id);
  const updateMutation = useUpdateUnit(hospital.id);
  const deleteMutation = useDeleteUnit(hospital.id);

  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const departments = (units ?? []).filter((u) => u.type === 'department' && u.isActive);

  function handleCreate(data: UnitFormData) {
    createMutation.mutate(
      { name: data.name, type: data.type, ...(data.parentId !== '' ? { parentId: data.parentId } : {}) },
      { onSuccess: () => setShowCreate(false) },
    );
  }

  function handleUpdate(unitId: string, data: UnitFormData) {
    updateMutation.mutate(
      { unitId, name: data.name, type: data.type, ...(data.parentId !== '' ? { parentId: data.parentId } : {}) },
      { onSuccess: () => setEditingId(null) },
    );
  }

  function handleToggleActive(unit: HospitalUnit) {
    const action = unit.isActive ? 'Deactivate' : 'Reactivate';
    DrawerService.showConfirmationModal(
      `${action} "${unit.name}"?`,
      unit.isActive
        ? 'Deactivated units will not appear in dropdown menus.'
        : 'This unit will be available again in dropdown menus.',
      {
        destructive: unit.isActive,
        confirmButtonText: action,
        onConfirm: () => { updateMutation.mutate({ unitId: unit.id, isActive: !unit.isActive }); },
      },
    );
  }

  function handleDelete(unit: HospitalUnit) {
    DrawerService.showConfirmationModal(
      `Delete "${unit.name}"?`,
      'This cannot be undone. Units with active sub-units cannot be deleted.',
      {
        destructive: true,
        confirmButtonText: 'Delete',
        onConfirm: () => { deleteMutation.mutate(unit.id); },
      },
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <AppText variant="heading-3" className="text-charcoal-900">Units & Departments</AppText>
          <AppText variant="body-sm" className="mt-1 text-charcoal-700">
            Define the departments, units, and wards in your hospital. These appear as dropdowns when inviting staff.
          </AppText>
        </div>
        <Show when={!showCreate}>
          <AppButton onClick={() => setShowCreate(true)}>Add unit</AppButton>
        </Show>
      </div>

      <Show when={showCreate}>
        <div className="rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm">
          <AppText variant="body-sm" className="mb-4 font-semibold text-charcoal-900">New unit</AppText>
          <UnitForm
            departments={departments}
            onSubmit={handleCreate}
            onCancel={() => setShowCreate(false)}
            loading={createMutation.isPending}
          />
        </div>
      </Show>

      <Loadable
        loading={isLoading}
        error={error ?? undefined}
        loadingComponent={
          <div className="space-y-3">
            <div className="h-14 animate-pulse rounded-xl bg-forest-900/5" />
            <div className="h-14 animate-pulse rounded-xl bg-forest-900/5" />
          </div>
        }
        errorComponent={
          <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            Could not load units.
          </p>
        }
      >
        <Show
          when={(units?.length ?? 0) > 0}
          fallback={
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-forest-900/20 py-12 text-center">
              <IconBuilding size={28} className="text-charcoal-700/30" />
              <AppText variant="body-sm" className="text-charcoal-700/60">
                No units configured yet. Add your first department or unit above.
              </AppText>
            </div>
          }
        >
          <div className="divide-y divide-forest-900/5 rounded-xl border border-forest-900/10 bg-white shadow-sm">
            <Repeat each={(units ?? []) as HospitalUnit[]}>
              {(unit: HospitalUnit) => (
                <div key={unit.id} className="px-5 py-4">
                  <Show when={editingId === unit.id}>
                    <UnitForm
                      initial={{ name: unit.name, type: unit.type, parentId: unit.parentId ?? '' }}
                      departments={departments.filter((d) => d.id !== unit.id)}
                      onSubmit={(data) => handleUpdate(unit.id, data)}
                      onCancel={() => setEditingId(null)}
                      loading={updateMutation.isPending}
                    />
                  </Show>
                  <Show when={editingId !== unit.id}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-charcoal-900">{unit.name}</span>
                          <span className="rounded-full border border-forest-900/20 bg-forest-900/5 px-2 py-0.5 text-xs text-charcoal-700">
                            {TYPE_LABELS[unit.type]}
                          </span>
                          <Show when={!unit.isActive}>
                            <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs text-red-600">
                              Inactive
                            </span>
                          </Show>
                        </div>
                        <Show when={unit.parentId !== undefined}>
                          <p className="mt-0.5 text-xs text-charcoal-700/60">
                            Under: {(units ?? []).find((u) => u.id === unit.parentId)?.name ?? unit.parentId}
                          </p>
                        </Show>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <AppButton variant="ghost" onClick={() => setEditingId(unit.id)}>Edit</AppButton>
                        <AppButton variant="ghost" onClick={() => handleToggleActive(unit)}>
                          {unit.isActive ? 'Deactivate' : 'Activate'}
                        </AppButton>
                        <AppButton variant="ghost" onClick={() => handleDelete(unit)}>Delete</AppButton>
                      </div>
                    </div>
                  </Show>
                </div>
              )}
            </Repeat>
          </div>
        </Show>
      </Loadable>
    </div>
  );
}
