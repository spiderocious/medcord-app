import { useState } from 'react';
import { Show, Repeat } from 'meemaw';
import { AppButton, DrawerService } from '@medcord/ui';
import type { Asset, AssetStatus } from '../../../../shared/types/asset.ts';
import { useUpdateAssetStatus, useMoveAsset } from '../../../asset-list/api/use-assets.ts';

const STATUS_OPTIONS: ReadonlyArray<{ readonly value: AssetStatus; readonly label: string }> = [
  { value: 'available', label: 'Available' },
  { value: 'in_use', label: 'In Use' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'retired', label: 'Retired' },
];

const STATUS_STYLE: Record<AssetStatus, string> = {
  available: 'text-records-800 border-records-200 bg-records-50',
  in_use: 'text-patient-800 border-patient-200 bg-patient-50',
  maintenance: 'text-equipment-800 border-equipment-200 bg-equipment-50',
  retired: 'text-charcoal-700 border-forest-900/10 bg-cream-50',
};

interface AssetStatusPanelProps {
  readonly asset: Asset;
  readonly hospitalId: string;
}

export function AssetStatusPanel({ asset, hospitalId }: AssetStatusPanelProps) {
  const statusMutation = useUpdateAssetStatus(hospitalId, asset.id);
  const moveMutation = useMoveAsset(hospitalId, asset.id);

  function handleStatusChange() {
    DrawerService.showCustomModal('Change status', () => (
      <StatusChangeForm asset={asset} hospitalId={hospitalId} />
    ));
  }

  function handleMove() {
    DrawerService.showInputModal(
      'Move asset',
      `Enter the new location for "${asset.name}".`,
      {
        placeholder: 'e.g. Ward B, Room 12',
        confirmButtonText: 'Move',
        onConfirm: (location) => {
          if (!location.trim()) return;
          moveMutation.mutate({ location: location.trim() });
        },
      },
    );
  }

  return (
    <div className="rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Status</p>
      <div className="flex items-center gap-3">
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${STATUS_STYLE[asset.status]}`}>
          <span className="h-2 w-2 rounded-full bg-current opacity-80" />
          {STATUS_OPTIONS.find((o) => o.value === asset.status)?.label ?? asset.status}
        </span>
      </div>
      <Show when={asset.currentLocation !== undefined}>
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-charcoal-700/60">Current location</p>
          <p className="mt-0.5 text-sm text-charcoal-900">{asset.currentLocation}</p>
        </div>
      </Show>
      <Show when={asset.assignedTo !== undefined}>
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-charcoal-700/60">Assigned to</p>
          <p className="mt-0.5 text-sm text-charcoal-900">{asset.assignedTo}</p>
        </div>
      </Show>
      <div className="flex gap-2 pt-1">
        <AppButton variant="secondary" onClick={handleStatusChange} loading={statusMutation.isPending}>
          Change status
        </AppButton>
        <AppButton variant="ghost" onClick={handleMove} loading={moveMutation.isPending}>
          Move
        </AppButton>
      </div>
    </div>
  );
}

// Inner form used inside the custom modal
interface StatusChangeFormProps {
  readonly asset: Asset;
  readonly hospitalId: string;
}

function StatusChangeForm({ asset, hospitalId }: StatusChangeFormProps) {
  const [status, setStatus] = useState<AssetStatus>(asset.status);
  const [assignedTo, setAssignedTo] = useState(asset.assignedTo ?? '');
  const mutation = useUpdateAssetStatus(hospitalId, asset.id);

  function handleSubmit() {
    mutation.mutate(
      { status, assignedTo: assignedTo.trim() || undefined },
      {
        onSuccess: () => { DrawerService.dismissAllModals(); },
        onError: (err: unknown) => {
          const message = err instanceof Error ? err.message : 'Something went wrong.';
          DrawerService.toast(message, { type: 'error' });
        },
      },
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-charcoal-900">Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value as AssetStatus)} className="mt-1 block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 focus:border-forest-900 focus:outline-none">
          <Repeat each={STATUS_OPTIONS as Array<{ value: AssetStatus; label: string }>}>
            {(opt: { value: AssetStatus; label: string }) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            )}
          </Repeat>
        </select>
      </div>
      <Show when={status === 'in_use'}>
        <div>
          <label className="block text-sm font-medium text-charcoal-900">Assigned to</label>
          <input value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="Staff name or ID" className="mt-1 block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 focus:border-forest-900 focus:outline-none" />
        </div>
      </Show>
      <div className="flex justify-end gap-2 pt-2">
        <AppButton variant="ghost" onClick={() => DrawerService.dismissAllModals()}>Cancel</AppButton>
        <AppButton onClick={handleSubmit} loading={mutation.isPending}>Update</AppButton>
      </div>
    </div>
  );
}
