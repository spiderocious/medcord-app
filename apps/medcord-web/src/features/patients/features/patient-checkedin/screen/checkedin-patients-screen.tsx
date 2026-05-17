import { useState } from 'react';
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
import type { CheckInVisit, VisitStage } from '../../../shared/types/patient.ts';

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

function matchesVisit(visit: CheckInVisit, q: string): boolean {
  const term = q.toLowerCase();
  const fullName = visit.patient
    ? `${visit.patient.firstName} ${visit.patient.lastName}`.toLowerCase()
    : '';
  return fullName.includes(term) || visit.patientCode.toLowerCase().includes(term);
}

const STAGE_OPTIONS: { value: VisitStage | ''; label: string }[] = [
  { value: '', label: 'All stages' },
  { value: 'waiting_nurse', label: 'Waiting · Nurse' },
  { value: 'with_nurse', label: 'With nurse' },
  { value: 'waiting_doctor', label: 'Waiting · Doctor' },
  { value: 'with_doctor', label: 'With doctor' },
];

export function CheckedInPatientsScreen() {
  const slug = useHospitalSlug();
  const { activeHospitalId } = useAuth();
  const hospitalId = activeHospitalId ?? '';
  const navigate = useNavigate();
  const { can } = usePermissions();
  const [q, setQ] = useState('');
  const [stageFilter, setStageFilter] = useState<VisitStage | ''>('');

  const { data: visits, isLoading, error } = useVisits(hospitalId);
  const checkoutMutation = useCheckoutVisit(hospitalId);

  const canAct = can(PERMISSIONS.PATIENT_ADMIT);

  const filtered = (visits ?? []).filter((v) => {
    if (stageFilter !== '' && v.stage !== stageFilter) return false;
    if (q.trim() !== '' && !matchesVisit(v, q.trim())) return false;
    return true;
  });

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
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or code…"
          className="w-full max-w-sm rounded-lg border border-forest-900/15 bg-white px-3 py-2 text-sm text-charcoal-900 placeholder:text-charcoal-700/40 focus:border-forest-900/40 focus:outline-none focus:ring-2 focus:ring-forest-900/10"
        />
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value as VisitStage | '')}
          className="rounded-lg border border-forest-900/15 bg-white px-3 py-2 text-sm text-charcoal-900 focus:border-forest-900/40 focus:outline-none focus:ring-2 focus:ring-forest-900/10"
        >
          <Repeat each={STAGE_OPTIONS as typeof STAGE_OPTIONS}>
            {(opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            )}
          </Repeat>
        </select>
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
          <Show
            when={filtered.length > 0}
            fallback={
              <div className="flex flex-col items-center gap-3 py-20 text-center">
                <IconUserCheck size={32} className="text-charcoal-700/30" />
                <AppText variant="body-sm" className="text-charcoal-700">
                  No results{q.trim() !== '' ? ` for "${q}"` : ' for selected stage'}.
                </AppText>
              </div>
            }
          >
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-xl border border-forest-900/10 md:block">
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
                <Repeat each={filtered as CheckInVisit[]}>
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

          {/* Mobile cards */}
          <div className="space-y-2 md:hidden">
            <Repeat each={filtered as CheckInVisit[]}>
              {(visit: CheckInVisit) => (
                <div key={visit.id} className="rounded-xl border border-forest-900/10 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-forest-900">#{visit.queueNumber}</span>
                      <div className="min-w-0">
                        <Show when={visit.patient !== null}>
                          <button
                            type="button"
                            className="truncate text-sm font-semibold text-charcoal-900 hover:underline text-left"
                            onClick={() => navigate(ROUTES.HOSPITAL_PATIENT_PROFILE(slug, visit.patientCode))}
                          >
                            {visit.patient?.firstName} {visit.patient?.lastName}
                          </button>
                          <p className="font-mono text-xs text-charcoal-700/60">{visit.patientCode}</p>
                        </Show>
                        <Show when={visit.patient === null}>
                          <p className="font-mono text-xs text-charcoal-700/60">{visit.patientCode}</p>
                        </Show>
                      </div>
                    </div>
                    <span className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${STAGE_STYLE[visit.stage] ?? ''}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                      {STAGE_LABEL[visit.stage] ?? visit.stage}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-charcoal-700/60">
                      <Show when={visit.department !== undefined}>
                        <span>{visit.department}</span>
                      </Show>
                      <span>{new Date(visit.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <Show when={canAct}>
                      <AppButton
                        variant="ghost"
                        onClick={() => handleCheckout(visit)}
                        loading={checkoutMutation.isPending}
                      >
                        Remove
                      </AppButton>
                    </Show>
                  </div>
                </div>
              )}
            </Repeat>
          </div>
          </Show>
        </Show>
      </Loadable>
    </div>
  );
}
