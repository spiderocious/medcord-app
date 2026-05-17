import { useNavigate } from 'react-router-dom';
import { Loadable, Repeat, Show } from 'meemaw';

import { AppButton, AppText } from '@medcord/ui';
import { PERMISSIONS } from '@medcord/rbac';
import { IconStethoscope } from '@icons';
import { ROUTES } from '@shared/constants/routes.ts';
import { useHospitalSlug } from '@shared/hooks/use-hospital-slug.ts';
import { useAuth } from '@shared/hooks/use-auth.ts';
import { usePermissions } from '@shared/hooks/use-permissions.ts';
import { usePatients } from '../../patient-list/api/use-patients.ts';
import type { Patient } from '../../../shared/types/patient.ts';

export function AdmittedPatientsScreen() {
  const slug = useHospitalSlug();
  const { activeHospitalId } = useAuth();
  const hospitalId = activeHospitalId ?? '';
  const navigate = useNavigate();
  const { can } = usePermissions();

  const { data, isLoading, error } = usePatients(hospitalId, { admissionStatus: 'admitted', limit: 100 });

  const canAct = can(PERMISSIONS.PATIENT_ADMIT);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <AppText variant="heading-2" className="text-charcoal-900">Admitted Patients</AppText>
          <AppText variant="body-sm" className="mt-1 text-charcoal-700">
            {data !== undefined ? `${data.total} currently admitted` : 'Inpatient ward view'}
          </AppText>
        </div>
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
            {error instanceof Error ? error.message : 'Failed to load admitted patients.'}
          </p>
        }
      >
        <Show
          when={(data?.items.length ?? 0) > 0}
          fallback={
            <div className="flex flex-col items-center gap-3 py-20 text-center">
              <IconStethoscope size={32} className="text-charcoal-700/30" />
              <AppText variant="body-sm" className="text-charcoal-700">No patients currently admitted.</AppText>
            </div>
          }
        >
          <div className="overflow-x-auto rounded-xl border border-forest-900/10">
            <table className="min-w-full divide-y divide-forest-900/10 bg-white">
              <thead>
                <tr className="bg-cream-50">
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-charcoal-700/60">Patient</th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-charcoal-700/60">Code</th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-charcoal-700/60">Date of birth</th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-charcoal-700/60">Contact</th>
                  <Show when={canAct}>
                    <th className="px-4 py-3" />
                  </Show>
                </tr>
              </thead>
              <tbody className="divide-y divide-forest-900/10">
                <Repeat each={(data?.items ?? []) as Patient[]}>
                  {(patient: Patient) => (
                    <tr
                      key={patient.id}
                      className="cursor-pointer hover:bg-cream-50/60 transition-colors"
                      onClick={() => navigate(ROUTES.HOSPITAL_PATIENT_PROFILE(slug, patient.patientCode))}
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-charcoal-900">
                          {patient.demographics.firstName} {patient.demographics.lastName}
                        </p>
                        <Show when={patient.demographics.preferredName !== undefined}>
                          <p className="text-xs text-charcoal-700/60">"{patient.demographics.preferredName}"</p>
                        </Show>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-charcoal-700/60">{patient.patientCode}</td>
                      <td className="px-4 py-3 text-sm text-charcoal-700">
                        {new Date(patient.demographics.dateOfBirth).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-charcoal-700">
                        {patient.demographics.phone ?? <span className="text-charcoal-700/40">—</span>}
                      </td>
                      <Show when={canAct}>
                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <AppButton
                            variant="ghost"
                            onClick={() => navigate(ROUTES.HOSPITAL_CHART(slug, patient.patientCode))}
                          >
                            Chart
                          </AppButton>
                        </td>
                      </Show>
                    </tr>
                  )}
                </Repeat>
              </tbody>
            </table>
          </div>
        </Show>
      </Loadable>
    </div>
  );
}
