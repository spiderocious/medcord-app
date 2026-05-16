import { useNavigate, useParams, Link } from 'react-router-dom';
import { Loadable, Show } from 'meemaw';
import { AppButton } from '@medcord/ui';
import { IconArrowLeft, IconClipboard } from '@icons';
import { ROUTES } from '@shared/constants/routes.ts';
import { useHospitalSlug } from '@shared/hooks/use-hospital-slug.ts';
import { useAuth } from '@shared/hooks/use-auth.ts';
import { usePatient, useIdCard } from '../api/use-patient.ts';
import { useFavoritePatients } from '../../../patient-list/api/use-patients.ts';
import { ProfileHeader } from './parts/profile-header.tsx';
import { ProfileDemographics } from './parts/profile-demographics.tsx';
import { ProfileActions } from './parts/profile-actions.tsx';
import { IdCardPanel } from './parts/id-card-panel.tsx';

export function PatientProfileScreen() {
  const slug = useHospitalSlug();
  const { activeHospitalId } = useAuth();
  const { code = '' } = useParams<{ slug: string; code: string }>();
  const navigate = useNavigate();

  const { data: patient, isLoading, error } = usePatient(activeHospitalId ?? '', code);
  const { data: idCardData } = useIdCard(activeHospitalId ?? '', code);
  const { data: favorites } = useFavoritePatients(activeHospitalId ?? '');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <AppButton
          variant="ghost"
          leadingIcon={<IconArrowLeft size={14} />}
          onClick={() => navigate(ROUTES.HOSPITAL_PATIENTS(slug))}
        >
          Patients
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
            {error instanceof Error ? error.message : 'Failed to load patient.'}
          </p>
        }
      >
        <Show when={patient !== undefined}>
          <div className="space-y-6">
            <ProfileHeader
              patient={patient!}
              hospitalId={activeHospitalId ?? ''}
              isFavorited={(favorites ?? []).some((f) => f.id === patient?.id)}
            />

            <div className="flex gap-2">
              <Link to={ROUTES.HOSPITAL_CHART(slug, patient!.patientCode)}>
                <AppButton variant="secondary" leadingIcon={<IconClipboard size={14} />}>
                  View chart
                </AppButton>
              </Link>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <ProfileDemographics patient={patient!} />
              </div>
              <div className="space-y-4">
                <ProfileActions patient={patient!} hospitalId={activeHospitalId ?? ''} />
                <Show when={idCardData !== undefined}>
                  <IdCardPanel
                    idCard={idCardData!.idCard}
                    hospitalId={activeHospitalId ?? ''}
                    patientId={patient!.id}
                  />
                </Show>
              </div>
            </div>
          </div>
        </Show>
      </Loadable>
    </div>
  );
}
