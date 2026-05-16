import { useNavigate } from 'react-router-dom';
import { AppButton, AppText, DrawerService } from '@medcord/ui';
import { IconArrowLeft } from '@icons';
import { ROUTES } from '@shared/constants/routes.ts';
import { useHospitalSlug } from '@shared/hooks/use-hospital-slug.ts';
import { useAuth } from '@shared/hooks/use-auth.ts';
import { useCreateAsset } from '../../asset-list/api/use-assets.ts';
import { AssetForm, type AssetFormValues } from './parts/asset-form.tsx';

export function AssetCreateScreen() {
  const slug = useHospitalSlug();
  const { activeHospitalId } = useAuth();
  const navigate = useNavigate();
  const mutation = useCreateAsset(activeHospitalId ?? '');

  function handleSubmit(values: AssetFormValues) {
    mutation.mutate(values, {
      onSuccess: (asset) => {
        navigate(ROUTES.HOSPITAL_ASSET_DETAIL(slug, asset.id));
      },
      onError: (err: unknown) => {
        const message = err instanceof Error ? err.message : 'Something went wrong.';
        DrawerService.toast(message, { type: 'error' });
      },
    });
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

      <div>
        <AppText variant="heading-2" className="text-charcoal-900">Add asset</AppText>
        <AppText variant="body-sm" className="mt-1 text-charcoal-700">
          Register a new piece of equipment or medical device.
        </AppText>
      </div>

      <AssetForm
        onSubmit={handleSubmit}
        loading={mutation.isPending}
        onCancel={() => navigate(ROUTES.HOSPITAL_ASSETS(slug))}
      />
    </div>
  );
}
