import { Repeat, Show } from 'meemaw';
import { useNavigate } from 'react-router-dom';
import { IconPackage } from '@icons';
import { AppText, DrawerService } from '@medcord/ui';
import { ROUTES } from '@shared/constants/routes.ts';
import type { Asset, AssetStatus } from '../../../../shared/types/asset.ts';
import { useDeleteAsset } from '../../api/use-assets.ts';

const STATUS_STYLE: Record<AssetStatus, string> = {
  available: 'text-records-800 border-records-200 bg-records-50',
  in_use: 'text-patient-800 border-patient-200 bg-patient-50',
  maintenance: 'text-equipment-800 border-equipment-200 bg-equipment-50',
  retired: 'text-charcoal-700 border-forest-900/10 bg-cream-50',
};

const STATUS_LABEL: Record<AssetStatus, string> = {
  available: 'Available',
  in_use: 'In Use',
  maintenance: 'Maintenance',
  retired: 'Retired',
};

interface AssetTableProps {
  readonly assets: readonly Asset[];
  readonly slug: string;
  readonly hospitalId: string;
}

export function AssetTable({ assets, slug, hospitalId }: AssetTableProps) {
  const navigate = useNavigate();
  const deleteMutation = useDeleteAsset(hospitalId);

  function handleDelete(asset: Asset) {
    DrawerService.showConfirmationModal(
      'Delete asset',
      `Delete "${asset.name}"? This cannot be undone.`,
      {
        destructive: true,
        confirmButtonText: 'Delete',
        onConfirm: () => {
          deleteMutation.mutate(asset.id, {
            onError: (err: unknown) => {
              const message = err instanceof Error ? err.message : 'Something went wrong.';
              DrawerService.toast(message, { type: 'error' });
            },
          });
        },
      },
    );
  }

  return (
    <Show
      when={assets.length > 0}
      fallback={
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <IconPackage size={32} className="text-charcoal-700/30" />
          <AppText variant="body-sm" className="text-charcoal-700">No assets found.</AppText>
        </div>
      }
    >
      <div className="overflow-x-auto rounded-xl border border-forest-900/10">
        <table className="min-w-full divide-y divide-forest-900/10 bg-white">
          <thead>
            <tr className="bg-cream-50">
              <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-charcoal-700/60">Name</th>
              <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-charcoal-700/60">Category</th>
              <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-charcoal-700/60">Status</th>
              <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-charcoal-700/60">Location</th>
              <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-charcoal-700/60">Tag</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-forest-900/10">
            <Repeat each={assets as Asset[]}>
              {(asset: Asset) => (
                <tr
                  key={asset.id}
                  className="cursor-pointer hover:bg-cream-50/60 transition-colors"
                  onClick={() => navigate(ROUTES.HOSPITAL_ASSET_DETAIL(slug, asset.id))}
                >
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-charcoal-900">{asset.name}</span>
                    <Show when={asset.modelName !== undefined}>
                      <span className="ml-1.5 text-xs text-charcoal-700/60">{asset.modelName}</span>
                    </Show>
                  </td>
                  <td className="px-4 py-3 text-sm text-charcoal-700">{asset.category}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[asset.status]}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                      {STATUS_LABEL[asset.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-charcoal-700">
                    {asset.currentLocation ?? <span className="text-charcoal-700/40">—</span>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-charcoal-700/60">
                    {asset.assetTag ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleDelete(asset); }}
                      className="rounded px-2 py-1 text-xs text-charcoal-700/50 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              )}
            </Repeat>
          </tbody>
        </table>
      </div>
    </Show>
  );
}
