import { useNavigate } from 'react-router-dom';
import { Loadable, Repeat, Show } from 'meemaw';

import { AppButton, AppText, DrawerService } from '@medcord/ui';
import { PERMISSIONS } from '@medcord/rbac';
import { IconUserCheck } from '@icons';
import { ROUTES } from '@shared/constants/routes.ts';
import { useHospitalSlug } from '@shared/hooks/use-hospital-slug.ts';
import { useAuth } from '@shared/hooks/use-auth.ts';
import { usePermissions } from '@shared/hooks/use-permissions.ts';
import { useVisits, useCheckoutVisit } from '../api/use-visits.ts';
import type { CheckInVisit } from '../../../shared/types/patient.ts';

const STAGE_LABEL: Record<string, string> = {
  waiting_nurse: 'Waiting · Nurse',
  with_nurse: 'With nurse',
  waiting_doctor: 'Waiting · Doctor',
  with_doctor: 'With doctor',
  done: 'Done',
};

const STAGE_STYLE: Record<string, string> = {
  waiting_nurse: 'text-charcoal-700 border-forest-900/10 bg-cream-50',
  with_nurse: 'text-patient-800 border-patient-200 bg-patient-50',
  waiting_doctor: 'text-charcoal-700 border-forest-900/10 bg-cream-50',
  with_doctor: 'text-records-800 border-records-200 bg-records-50',
  done: 'text-charcoal-700/60 border-forest-900/10 bg-cream-50',
};

export function CheckedInPatientsScreen() {
  const slug = useHospitalSlug();
  const { activeHospitalId } = useAuth();
  const hospitalId = activeHospitalId ?? '';
  const navigate = useNavigate();
  const { can } = usePermissions();

  const { data: visits, isLoading, error } = useVisits(hospitalId);
  const checkoutMutation = useCheckoutVisit(hospitalId);

  const canAct = can(PERMISSIONS.PATIENT_ADMIT);

  function handleCheckout(visit: CheckInVisit) {
    const name = visit.patient ? `${visit.patient.firstName} ${visit.patient.lastName}` : 'this patient';
    DrawerService.showConfirmationModal(
      'Remove from queue',
      `Remove ${name} from the queue? This will check them out.`,
      {
        destructive: true,
        confirmButtonText: 'Remove',
        onConfirm: () => { void checkoutMutation.mutateAsync(visit.id); },
      },
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <AppText variant="heading-2" className="text-charcoal-900">Checked-In Patients</AppText>
          <AppText variant="body-sm" className="mt-1 text-charcoal-700">
            {visits !== undefined ? `${visits.length} active visit${visits.length !== 1 ? 's' : ''}` : 'Today\'s active visits'}
          </AppText>
        </div>
        <AppButton variant="secondary" onClick={() => navigate(ROUTES.HOSPITAL_QUEUE(slug))}>
          Queue board
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
            {error instanceof Error ? error.message : 'Failed to load visits.'}
          </p>
        }
      >
        <Show
          when={(visits?.length ?? 0) > 0}
          fallback={
            <div className="flex flex-col items-center gap-3 py-20 text-center">
              <IconUserCheck size={32} className="text-charcoal-700/30" />
              <AppText variant="body-sm" className="text-charcoal-700">No active check-ins right now.</AppText>
            </div>
          }
        >
          <div className="overflow-x-auto rounded-xl border border-forest-900/10">
            <table className="min-w-full divide-y divide-forest-900/10 bg-white">
              <thead>
                <tr className="bg-cream-50">
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-charcoal-700/60">#</th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-charcoal-700/60">Patient</th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-charcoal-700/60">Stage</th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-charcoal-700/60">Dept</th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-charcoal-700/60">Checked in</th>
                  <Show when={canAct}>
                    <th className="px-4 py-3" />
                  </Show>
                </tr>
              </thead>
              <tbody className="divide-y divide-forest-900/10">
                <Repeat each={(visits ?? []) as CheckInVisit[]}>
                  {(visit: CheckInVisit) => (
                    <tr key={visit.id} className="hover:bg-cream-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-lg font-bold text-forest-900">#{visit.queueNumber}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Show when={visit.patient !== null}>
                          <p
                            className="text-sm font-medium text-charcoal-900 cursor-pointer hover:underline"
                            onClick={() => navigate(ROUTES.HOSPITAL_PATIENT_PROFILE(slug, visit.patientCode))}
                          >
                            {visit.patient?.firstName} {visit.patient?.lastName}
                          </p>
                          <p className="font-mono text-xs text-charcoal-700/60">{visit.patientCode}</p>
                        </Show>
                        <Show when={visit.patient === null}>
                          <p className="font-mono text-xs text-charcoal-700/60">{visit.patientCode}</p>
                        </Show>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${STAGE_STYLE[visit.stage] ?? ''}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                          {STAGE_LABEL[visit.stage] ?? visit.stage}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-charcoal-700">
                        {visit.department ?? <span className="text-charcoal-700/40">—</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-charcoal-700">
                        {new Date(visit.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <Show when={canAct}>
                        <td className="px-4 py-3 text-right">
                          <AppButton
                            variant="ghost"
                            onClick={() => handleCheckout(visit)}
                            loading={checkoutMutation.isPending}
                          >
                            Remove
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
