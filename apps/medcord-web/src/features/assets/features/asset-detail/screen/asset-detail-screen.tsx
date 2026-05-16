import { useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loadable, Show } from 'meemaw';
import { AppButton, AppText } from '@medcord/ui';
import { IconArrowLeft, IconPrint } from '@icons';
import { ROUTES } from '@shared/constants/routes.ts';
import { useHospitalSlug } from '@shared/hooks/use-hospital-slug.ts';
import { useAuth } from '@shared/hooks/use-auth.ts';
import { useAsset } from '../../asset-list/api/use-assets.ts';
import { AssetInfoForm } from './parts/asset-info-form.tsx';
import { AssetStatusPanel } from './parts/asset-status-panel.tsx';
import { AssetLocationHistoryPanel } from './parts/asset-location-history.tsx';

export function AssetDetailScreen() {
  const slug = useHospitalSlug();
  const { activeHospitalId } = useAuth();
  const { assetId = '' } = useParams<{ slug: string; assetId: string }>();
  const navigate = useNavigate();
  const labelRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, error } = useAsset(activeHospitalId ?? '', assetId);

  function handlePrintLabel() {
    const el = labelRef.current;
    if (!el) return;
    const win = window.open('', '_blank', 'width=400,height=300');
    if (!win) return;
    win.document.write(`
      <html><head><title>Asset Label</title>
      <style>body{font-family:monospace;padding:24px;text-align:center;}
      h2{font-size:18px;margin:0 0 8px;}
      p{font-size:13px;margin:4px 0;color:#555;}
      .id{font-size:11px;color:#999;margin-top:12px;}</style>
      </head><body>${el.innerHTML}<script>window.onload=()=>{window.print();window.close();}<\/script></body></html>
    `);
    win.document.close();
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <AppButton
          variant="ghost"
          leadingIcon={<IconArrowLeft size={14} />}
          onClick={() => navigate(ROUTES.HOSPITAL_ASSETS(slug))}
        >
          Assets
        </AppButton>
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
            {error instanceof Error ? error.message : 'Failed to load asset.'}
          </p>
        }
      >
        <Show when={data !== undefined}>
          <div className="space-y-6">
            {/* Hidden printable label */}
            <div ref={labelRef} className="hidden">
              <h2>{data!.name}</h2>
              <p>{data!.category}</p>
              <Show when={data!.assetTag !== undefined}>
                <p>Tag: {data!.assetTag}</p>
              </Show>
              <p className="id">ID: {data!.id}</p>
            </div>

            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <AppText variant="heading-2" className="text-charcoal-900">{data!.name}</AppText>
                <AppText variant="body-sm" className="mt-1 text-charcoal-700">
                  {data!.category}
                  {data!.assetTag ? ` · ${data!.assetTag}` : ''}
                </AppText>
              </div>
              <AppButton
                variant="secondary"
                leadingIcon={<IconPrint size={14} />}
                onClick={handlePrintLabel}
              >
                Print label
              </AppButton>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <div className="rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Asset information</p>
                  <AssetInfoForm asset={data!} hospitalId={activeHospitalId ?? ''} />
                </div>
                <AssetLocationHistoryPanel history={data!.locationHistory} />
              </div>

              <div className="space-y-4">
                <AssetStatusPanel asset={data!} hospitalId={activeHospitalId ?? ''} />
              </div>
            </div>
          </div>
        </Show>
      </Loadable>
    </div>
  );
}
