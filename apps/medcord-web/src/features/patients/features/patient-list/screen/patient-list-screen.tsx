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
import { usePatients } from '../api/use-patients.ts';
import { PatientFilters } from './parts/patient-filters.tsx';
import { PatientTable } from './parts/patient-table.tsx';

export function PatientListScreen() {
  const slug = useHospitalSlug();
  const { activeHospitalId } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const { can } = usePermissions();

  const { data, isLoading, error } = usePatients(activeHospitalId ?? '', { q: q || undefined });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <AppText variant="heading-2" className="text-charcoal-900">Patients</AppText>
          <AppText variant="body-sm" className="mt-1 text-charcoal-700">
            {data ? `${data.total} patient${data.total !== 1 ? 's' : ''}` : 'Patient registry'}
          </AppText>
        </div>
        <Show when={can(PERMISSIONS.PATIENT_CREATE)}>
          <AppButton
            leadingIcon={<IconPlus size={14} />}
            onClick={() => navigate(ROUTES.HOSPITAL_PATIENT_REGISTER(slug))}
          >
            Register patient
          </AppButton>
        </Show>
      </div>

      <PatientFilters q={q} onQChange={setQ} onClear={() => setQ('')} />

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
            {error instanceof Error ? error.message : 'Failed to load patients.'}
          </p>
        }
      >
        <PatientTable patients={data?.items ?? []} slug={slug} />
      </Loadable>
    </div>
  );
}
