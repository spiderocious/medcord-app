import { useNavigate } from 'react-router-dom';
import { Loadable, Repeat, Show } from 'meemaw';

import { AppButton, AppText, DrawerService } from '@medcord/ui';
import { PERMISSIONS } from '@medcord/rbac';
import { IconActivity } from '@icons';
import { ROUTES } from '@shared/constants/routes.ts';
import { useHospitalSlug } from '@shared/hooks/use-hospital-slug.ts';
import { useAuth } from '@shared/hooks/use-auth.ts';
import { usePermissions } from '@shared/hooks/use-permissions.ts';
import { useVisits, useUpdateVisit, useCheckoutVisit } from '@features/patients/features/patient-checkedin/api/use-visits.ts';
import type { CheckInVisit, VisitStage } from '@features/patients/shared/types/patient.ts';

const STAGE_ORDER: VisitStage[] = ['waiting_nurse', 'with_nurse', 'waiting_doctor', 'with_doctor', 'done'];

function nextStage(stage: VisitStage): VisitStage | null {
  const idx = STAGE_ORDER.indexOf(stage);
  if (idx === -1 || idx >= STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[idx + 1] ?? null;
}

interface VisitCardProps {
  readonly visit: CheckInVisit;
  readonly canAct: boolean;
  readonly isActive: boolean;
  readonly onAdvance: (visit: CheckInVisit) => void;
  readonly onRemove: (visit: CheckInVisit) => void;
}

function VisitCard({ visit, canAct, isActive, onAdvance, onRemove }: VisitCardProps) {
  const name = visit.patient
    ? `${visit.patient.firstName} ${visit.patient.lastName[0] ?? ''}.`
    : visit.patientCode;

  const canAdvance = nextStage(visit.stage) !== null;

  return (
    <div className={`rounded-xl border p-4 space-y-2 transition-all ${isActive ? 'border-forest-900/40 bg-forest-900/5 shadow-md' : 'border-forest-900/10 bg-white'}`}>
      <div className="flex items-center justify-between">
        <span className={`text-3xl font-bold ${isActive ? 'text-forest-900' : 'text-charcoal-900'}`}>
          #{visit.queueNumber}
        </span>
        <Show when={visit.department !== undefined}>
          <span className="text-xs text-charcoal-700/60">{visit.department}</span>
        </Show>
      </div>
      <p className="text-sm font-semibold text-charcoal-900">{name}</p>
      <p className="text-xs text-charcoal-700/60">
        In since {new Date(visit.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </p>
      <Show when={canAct}>
        <div className="flex gap-2 pt-1">
          <Show when={canAdvance}>
            <AppButton variant="secondary" onClick={() => onAdvance(visit)}>
              Call / Next
            </AppButton>
          </Show>
          <AppButton variant="ghost" onClick={() => onRemove(visit)}>
            Remove
          </AppButton>
        </div>
      </Show>
    </div>
  );
}

export function QueueBoardScreen() {
  const slug = useHospitalSlug();
  const { activeHospitalId } = useAuth();
  const hospitalId = activeHospitalId ?? '';
  const navigate = useNavigate();
  const { can } = usePermissions();

  const { data: visits, isLoading, error, refetch } = useVisits(hospitalId);
  const updateMutation = useUpdateVisit(hospitalId);
  const checkoutMutation = useCheckoutVisit(hospitalId);

  const canAct = can(PERMISSIONS.PATIENT_ADMIT);

  const waitingNurse = (visits ?? []).filter((v) => v.stage === 'waiting_nurse');
  const withNurse = (visits ?? []).filter((v) => v.stage === 'with_nurse');
  const waitingDoctor = (visits ?? []).filter((v) => v.stage === 'waiting_doctor');
  const withDoctor = (visits ?? []).filter((v) => v.stage === 'with_doctor');

  const activeVisits = [...withNurse, ...withDoctor];

  function handleAdvance(visit: CheckInVisit) {
    const next = nextStage(visit.stage);
    if (next === null) return;
    void updateMutation.mutateAsync({ visitId: visit.id, stage: next });
  }

  function handleRemove(visit: CheckInVisit) {
    const name = visit.patient ? `${visit.patient.firstName} ${visit.patient.lastName}` : 'this patient';
    DrawerService.showConfirmationModal(
      'Remove from queue',
      `Remove ${name} from the queue?`,
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
          <AppText variant="heading-2" className="text-charcoal-900">Queue Board</AppText>
          <AppText variant="body-sm" className="mt-1 text-charcoal-700">
            {visits !== undefined ? `${visits.length} active` : 'Live queue view'} · auto-refreshes every 15s
          </AppText>
        </div>
        <div className="flex gap-2">
          <AppButton variant="ghost" onClick={() => navigate(ROUTES.HOSPITAL_PATIENTS_CHECKEDIN(slug))}>
            List view
          </AppButton>
          <AppButton variant="secondary" onClick={() => { void refetch(); }}>
            Refresh
          </AppButton>
        </div>
      </div>

      <Show when={(activeVisits.length) > 0}>
        <div className="rounded-xl border-2 border-forest-900/30 bg-forest-900/5 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-forest-900/60 mb-3">Now serving</p>
          <div className="flex flex-wrap gap-4">
            <Repeat each={activeVisits as CheckInVisit[]}>
              {(visit: CheckInVisit) => (
                <div key={visit.id} className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-forest-900">#{visit.queueNumber}</span>
                  <div>
                    <p className="text-sm font-semibold text-charcoal-900">
                      {visit.patient ? `${visit.patient.firstName} ${visit.patient.lastName[0] ?? ''}.` : visit.patientCode}
                    </p>
                    <p className="text-xs text-charcoal-700/60">
                      {visit.stage === 'with_nurse' ? 'With nurse' : 'With doctor'}
                    </p>
                  </div>
                </div>
              )}
            </Repeat>
          </div>
        </div>
      </Show>

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
            {error instanceof Error ? error.message : 'Failed to load queue.'}
          </p>
        }
      >
        <Show
          when={(visits?.length ?? 0) > 0}
          fallback={
            <div className="flex flex-col items-center gap-3 py-20 text-center">
              <IconActivity size={32} className="text-charcoal-700/30" />
              <AppText variant="body-sm" className="text-charcoal-700">Queue is empty.</AppText>
            </div>
          }
        >
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Waiting for nurse */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <AppText variant="caption" className="font-semibold uppercase text-charcoal-700/60">
                  Waiting · Nurse
                </AppText>
                <span className="text-xs text-charcoal-700/60">{waitingNurse.length}</span>
              </div>
              <Show
                when={waitingNurse.length > 0}
                fallback={<p className="text-sm text-charcoal-700/40 py-4 text-center">—</p>}
              >
                <div className="space-y-3">
                  <Repeat each={waitingNurse as CheckInVisit[]}>
                    {(visit: CheckInVisit) => (
                      <VisitCard
                        key={visit.id}
                        visit={visit}
                        canAct={canAct}
                        isActive={false}
                        onAdvance={handleAdvance}
                        onRemove={handleRemove}
                      />
                    )}
                  </Repeat>
                </div>
              </Show>
              <Show when={withNurse.length > 0}>
                <div className="space-y-3">
                  <Repeat each={withNurse as CheckInVisit[]}>
                    {(visit: CheckInVisit) => (
                      <VisitCard
                        key={visit.id}
                        visit={visit}
                        canAct={canAct}
                        isActive
                        onAdvance={handleAdvance}
                        onRemove={handleRemove}
                      />
                    )}
                  </Repeat>
                </div>
              </Show>
            </div>

            {/* Waiting for doctor */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <AppText variant="caption" className="font-semibold uppercase text-charcoal-700/60">
                  Waiting · Doctor
                </AppText>
                <span className="text-xs text-charcoal-700/60">{waitingDoctor.length}</span>
              </div>
              <Show
                when={waitingDoctor.length > 0}
                fallback={<p className="text-sm text-charcoal-700/40 py-4 text-center">—</p>}
              >
                <div className="space-y-3">
                  <Repeat each={waitingDoctor as CheckInVisit[]}>
                    {(visit: CheckInVisit) => (
                      <VisitCard
                        key={visit.id}
                        visit={visit}
                        canAct={canAct}
                        isActive={false}
                        onAdvance={handleAdvance}
                        onRemove={handleRemove}
                      />
                    )}
                  </Repeat>
                </div>
              </Show>
            </div>

            {/* With doctor */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <AppText variant="caption" className="font-semibold uppercase text-charcoal-700/60">
                  With Doctor
                </AppText>
                <span className="text-xs text-charcoal-700/60">{withDoctor.length}</span>
              </div>
              <Show
                when={withDoctor.length > 0}
                fallback={<p className="text-sm text-charcoal-700/40 py-4 text-center">—</p>}
              >
                <div className="space-y-3">
                  <Repeat each={withDoctor as CheckInVisit[]}>
                    {(visit: CheckInVisit) => (
                      <VisitCard
                        key={visit.id}
                        visit={visit}
                        canAct={canAct}
                        isActive
                        onAdvance={handleAdvance}
                        onRemove={handleRemove}
                      />
                    )}
                  </Repeat>
                </div>
              </Show>
            </div>
          </div>
        </Show>
      </Loadable>
    </div>
  );
}
