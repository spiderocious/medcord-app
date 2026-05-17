import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loadable, Show } from 'meemaw';

import { AppButton, AppText } from '@medcord/ui';
import { IconPlus } from '@icons';
import { PERMISSIONS } from '@medcord/rbac';
import { ROUTES } from '@shared/constants/routes.ts';
import { useHospitalSlug } from '@shared/hooks/use-hospital-slug.ts';
import { useAuth } from '@shared/hooks/use-auth.ts';
import { usePermissions } from '@shared/hooks/use-permissions.ts';
import { useAssets } from '../api/use-assets.ts';
import type { AssetStatus } from '../../../shared/types/asset.ts';
import { AssetFilters } from './parts/asset-filters.tsx';
import { AssetTable } from './parts/asset-table.tsx';

export function AssetListScreen() {
  const slug = useHospitalSlug();
  const { activeHospitalId } = useAuth();
  const navigate = useNavigate();
  const { can } = usePermissions();

  const [q, setQ] = useState('');
  const [status, setStatus] = useState<AssetStatus | ''>('');

  const { data, isLoading, error } = useAssets(activeHospitalId ?? '', {
    q: q || undefined,
    status: status || undefined,
  });

  function handleClear() {
    setQ('');
    setStatus('');
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <AppText variant="heading-2" className="text-charcoal-900">Assets</AppText>
          <AppText variant="body-sm" className="mt-1 text-charcoal-700">
            {data ? `${data.total} asset${data.total !== 1 ? 's' : ''}` : 'Equipment inventory'}
          </AppText>
        </div>
        <Show when={can(PERMISSIONS.ASSET_CREATE)}>
          <AppButton
            leadingIcon={<IconPlus size={14} />}
            onClick={() => navigate(ROUTES.HOSPITAL_ASSET_CREATE(slug))}
          >
            Add Asset
          </AppButton>
        </Show>
      </div>

      <AssetFilters
        q={q}
        status={status}
        onQChange={setQ}
        onStatusChange={setStatus}
        onClear={handleClear}
      />

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
            {error instanceof Error ? error.message : 'Failed to load assets.'}
          </p>
        }
      >
        <AssetTable
          assets={data?.items ?? []}
          slug={slug}
          hospitalId={activeHospitalId ?? ''}
        />
      </Loadable>
    </div>
  );
}
