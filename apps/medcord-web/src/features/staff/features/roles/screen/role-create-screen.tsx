import { useNavigate } from 'react-router-dom';

import { AppButton, AppText } from '@medcord/ui';
import { Loadable } from 'meemaw';
import { IconArrowLeft } from '@icons';
import { ROUTES } from '@shared/constants/routes.ts';
import { useHospitalSlug } from '@shared/hooks/use-hospital-slug.ts';
import { useAuth } from '@shared/hooks/use-auth.ts';
import { useRoles } from '../api/use-roles.ts';
import { RoleForm } from './parts/role-form.tsx';

export function RoleCreateScreen() {
  const slug = useHospitalSlug();
  const { activeHospitalId } = useAuth();
  const hospitalId = activeHospitalId ?? '';
  const navigate = useNavigate();

  const { data, isLoading, error } = useRoles(hospitalId);

  function handleDone() {
    navigate(ROUTES.HOSPITAL_ROLES(slug));
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      <div>
        <AppButton
          variant="ghost"
          leadingIcon={<IconArrowLeft size={14} />}
          onClick={() => navigate(ROUTES.HOSPITAL_ROLES(slug))}
        >
          Back to roles
        </AppButton>
      </div>

      <div>
        <AppText variant="heading-1" className="text-charcoal-900">New role</AppText>
        <AppText variant="body-sm" className="mt-1 text-charcoal-700">
          Create a custom role with a specific set of permissions.
        </AppText>
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
            {error instanceof Error ? error.message : 'Failed to load permissions.'}
          </p>
        }
      >
        <RoleForm
          hospitalId={hospitalId}
          permissionDescriptions={data!.permissionDescriptions}
          permissionGroups={data!.permissionGroups}
          onDone={handleDone}
        />
      </Loadable>
    </div>
  );
}
