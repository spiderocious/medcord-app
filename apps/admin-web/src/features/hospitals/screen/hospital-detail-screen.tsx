import { useNavigate, useParams } from 'react-router-dom';
import { Loadable, Show } from 'meemaw';
import { AppButton, AppText, DrawerService } from '@medcord/ui';
import { IconArrowLeft } from '@icons';

import { ADMIN_ROUTES } from '@shared/constants/routes.ts';
import {
  useAdminHospital,
  useUpdateAdminHospital,
  useDeleteAdminHospital,
} from '../api/use-admin-hospitals.ts';
import { HospitalModulesForm } from './parts/hospital-modules-form.tsx';

export function HospitalDetailScreen() {
  const { hospitalId = '' } = useParams<{ hospitalId: string }>();
  const navigate = useNavigate();

  const { data, isLoading, error } = useAdminHospital(hospitalId);
  const updateMutation = useUpdateAdminHospital(hospitalId);
  const deleteMutation = useDeleteAdminHospital(hospitalId);

  function handleArchive() {
    DrawerService.showConfirmationModal(
      'Archive this hospital?',
      'Staff will lose access until it is restored.',
      {
        destructive: true,
        onConfirm: () => {
          updateMutation.mutate(
            { isArchived: true },
            {
              onSuccess: () => {
                DrawerService.toast('Hospital archived.', { type: 'success' });
              },
            },
          );
        },
      },
    );
  }

  function handleRestore() {
    updateMutation.mutate(
      { isArchived: false },
      {
        onSuccess: () => {
          DrawerService.toast('Hospital restored.', { type: 'success' });
        },
      },
    );
  }

  function handleDelete() {
    DrawerService.showConfirmationModal(
      'Permanently delete this hospital?',
      'This cannot be undone. Member, patient, and EMR data are not cascade-deleted.',
      {
        destructive: true,
        onConfirm: () => {
          deleteMutation.mutate(undefined, {
            onSuccess: () => {
              void navigate(ADMIN_ROUTES.HOSPITALS, { replace: true });
            },
          });
        },
      },
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <AppButton
          variant="ghost"
          leadingIcon={<IconArrowLeft size={14} />}
          onClick={() => navigate(ADMIN_ROUTES.HOSPITALS)}
        >
          Hospitals
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
            {error instanceof Error ? error.message : 'Failed to load hospital.'}
          </p>
        }
      >
        {data && (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <AppText variant="heading-2" className="text-charcoal-900">
                {data.hospital.name}
              </AppText>
              <Show
                when={data.hospital.isArchived}
                fallback={
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    Active
                  </span>
                }
              >
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  Archived
                </span>
              </Show>
            </div>
            <AppText variant="body-sm" className="text-charcoal-700">
              {data.hospital.subdomain}
            </AppText>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              {/* Left — Info card */}
              <div className="lg:col-span-2 space-y-4">
                <div className="rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">
                    Hospital info
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { label: 'Type', value: data.hospital.type },
                      { label: 'Location', value: data.hospital.location },
                      { label: 'Plan', value: data.hospital.plan },
                      { label: 'Timezone', value: data.hospital.timezone },
                      { label: 'Locale', value: data.hospital.locale },
                      { label: 'Owner ID', value: data.hospital.ownerId },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-xs font-mono uppercase tracking-wider text-charcoal-700/60">
                          {label}
                        </p>
                        <p className="mt-0.5 text-sm text-charcoal-900">{value}</p>
                      </div>
                    ))}
                    <Show when={data.hospital.customDomain !== undefined && data.hospital.customDomain !== null}>
                      <div>
                        <p className="text-xs font-mono uppercase tracking-wider text-charcoal-700/60">
                          Custom domain
                        </p>
                        <p className="mt-0.5 text-sm text-charcoal-900">{data.hospital.customDomain}</p>
                      </div>
                    </Show>
                    <Show when={data.hospital.contact?.email !== undefined}>
                      <div>
                        <p className="text-xs font-mono uppercase tracking-wider text-charcoal-700/60">
                          Contact email
                        </p>
                        <p className="mt-0.5 text-sm text-charcoal-900">{data.hospital.contact?.email}</p>
                      </div>
                    </Show>
                    <Show when={data.hospital.contact?.phone !== undefined}>
                      <div>
                        <p className="text-xs font-mono uppercase tracking-wider text-charcoal-700/60">
                          Contact phone
                        </p>
                        <p className="mt-0.5 text-sm text-charcoal-900">{data.hospital.contact?.phone}</p>
                      </div>
                    </Show>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="inline-flex items-center rounded-full bg-forest-900/10 px-3 py-1 text-sm font-medium text-forest-900">
                      {data.memberCount} member{data.memberCount === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 border-t border-forest-900/10 pt-3">
                    <div>
                      <p className="text-xs font-mono uppercase tracking-wider text-charcoal-700/60">Created</p>
                      <p className="mt-0.5 text-sm text-charcoal-900">
                        {new Date(data.hospital.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-mono uppercase tracking-wider text-charcoal-700/60">Updated</p>
                      <p className="mt-0.5 text-sm text-charcoal-900">
                        {new Date(data.hospital.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right — Actions card */}
              <div className="space-y-4">
                <div className="rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm space-y-5">
                  <HospitalModulesForm hospital={data.hospital} />

                  <div className="border-t border-forest-900/10 pt-4 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">
                      Archive
                    </p>
                    <Show
                      when={data.hospital.isArchived}
                      fallback={
                        <AppButton
                          variant="danger"
                          onClick={handleArchive}
                          loading={updateMutation.isPending}
                        >
                          Archive hospital
                        </AppButton>
                      }
                    >
                      <AppButton
                        variant="secondary"
                        onClick={handleRestore}
                        loading={updateMutation.isPending}
                      >
                        Restore hospital
                      </AppButton>
                    </Show>
                  </div>

                  <div className="border-t border-forest-900/10 pt-4 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-red-600/70">
                      Danger zone
                    </p>
                    <AppButton
                      variant="danger"
                      onClick={handleDelete}
                      loading={deleteMutation.isPending}
                    >
                      Permanently delete
                    </AppButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Loadable>
    </div>
  );
}
