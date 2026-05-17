import { useNavigate, useParams } from 'react-router-dom';

import { AppButton, AppText } from '@medcord/ui';
import { Loadable } from 'meemaw';
import { IconArrowLeft } from '@icons';
import { ROUTES } from '@shared/constants/routes.ts';
import { useHospitalSlug } from '@shared/hooks/use-hospital-slug.ts';
import { useAuth } from '@shared/hooks/use-auth.ts';
import { useRoles } from '../api/use-roles.ts';
import { RoleForm } from './parts/role-form.tsx';

export function RoleEditScreen() {
  const slug = useHospitalSlug();
  const { activeHospitalId } = useAuth();
  const hospitalId = activeHospitalId ?? '';
  const { roleId = '' } = useParams<{ roleId: string }>();
  const navigate = useNavigate();

  const { data, isLoading, error } = useRoles(hospitalId);
  const role = data?.roles.find((r) => r.id === roleId);

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
        <AppText variant="heading-1" className="text-charcoal-900">
          {role !== undefined ? (role.slug === 'super_admin' ? `View: ${role.name}` : `Edit: ${role.name}`) : 'Edit role'}
        </AppText>
        <AppText variant="body-sm" className="mt-1 text-charcoal-700">
          {role?.slug === 'super_admin'
            ? 'Super Admin bypasses all permission checks. Permissions cannot be modified.'
            : role?.isSystem === true
              ? 'System roles: permissions are editable, name is fixed.'
              : 'Update this role\'s name and permissions.'}
        </AppText>
      </div>

      <Loadable
        loading={isLoading}
        error={(error ?? (data !== undefined && role === undefined ? new Error('Role not found.') : null)) ?? undefined}
        loadingComponent={
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-forest-900/20 border-t-forest-900" />
          </div>
        }
        errorComponent={
          <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error instanceof Error ? error.message : 'Role not found.'}
          </p>
        }
      >
        <RoleForm
          hospitalId={hospitalId}
          role={role}
          permissionDescriptions={data!.permissionDescriptions}
          permissionGroups={data!.permissionGroups}
          onDone={handleDone}
          readOnly={role?.slug === 'super_admin'}
        />
      </Loadable>
    </div>
  );
}
