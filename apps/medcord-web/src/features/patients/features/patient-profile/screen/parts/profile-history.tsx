import { Loadable, Repeat, Show } from 'meemaw';
import { ROUTES } from '@shared/constants/routes.ts';
import { useHospitalSlug } from '@shared/hooks/use-hospital-slug.ts';
import { EntityLink } from '@shared/components/entity-link.tsx';
import { usePatientAdmissions, usePatientCheckIns } from '../../api/use-patient-history.ts';
import type { PatientAdmission, CheckInVisit } from '../../../../shared/types/patient.ts';

interface ProfileHistoryProps {
  readonly hospitalId: string;
  readonly patientId: string;
}

function durationLabel(from: string, to: string | undefined): string {
  if (to === undefined) return 'Ongoing';
  const ms = new Date(to).getTime() - new Date(from).getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours < 1) return '< 1 hour';
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function AdmissionRow({ admission, slug }: { admission: PatientAdmission; slug: string }) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-x-4 py-3 border-b border-forest-900/5 last:border-0">
      <div className="space-y-0.5 min-w-0">
        <p className="text-sm text-charcoal-900">
          {new Date(admission.admittedAt).toLocaleDateString()}
          <Show when={admission.dischargedAt !== undefined}>
            <span className="text-charcoal-700/50"> → {new Date(admission.dischargedAt!).toLocaleDateString()}</span>
          </Show>
        </p>
        <Show when={admission.department !== undefined}>
          <p className="text-xs text-charcoal-700/60">{admission.department}</p>
        </Show>
        <Show when={admission.assignedTo !== undefined}>
          <p className="text-xs text-charcoal-700/60">
            Assigned:{' '}
            <EntityLink
              id={admission.assignedTo!}
              to={ROUTES.HOSPITAL_STAFF_PROFILE(slug, admission.assignedTo!)}
              label="Staff member"
            />
          </p>
        </Show>
        <Show when={admission.dischargeNotes !== undefined}>
          <p className="text-xs text-charcoal-700/50 truncate">{admission.dischargeNotes}</p>
        </Show>
      </div>
      <div className="text-right shrink-0">
        <span className="inline-block rounded-full bg-forest-900/5 px-2 py-0.5 text-xs font-medium text-forest-900">
          {durationLabel(admission.admittedAt, admission.dischargedAt)}
        </span>
        <Show when={admission.dischargedAt === undefined}>
          <span className="mt-1 block text-xs font-medium text-amber-600">Active</span>
        </Show>
      </div>
    </div>
  );
}

function CheckInRow({ visit }: { visit: CheckInVisit }) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-x-4 py-3 border-b border-forest-900/5 last:border-0">
      <div className="space-y-0.5 min-w-0">
        <p className="text-sm text-charcoal-900">
          {new Date(visit.checkedInAt).toLocaleDateString()}
          <Show when={visit.checkedOutAt !== undefined}>
            <span className="text-charcoal-700/50"> → {new Date(visit.checkedOutAt!).toLocaleDateString()}</span>
          </Show>
        </p>
        <p className="text-xs text-charcoal-700/60">Queue #{visit.queueNumber}</p>
        <Show when={visit.department !== undefined}>
          <p className="text-xs text-charcoal-700/60">{visit.department}</p>
        </Show>
      </div>
      <div className="text-right shrink-0">
        <span className="inline-block rounded-full bg-forest-900/5 px-2 py-0.5 text-xs font-medium text-forest-900">
          {durationLabel(visit.checkedInAt, visit.checkedOutAt)}
        </span>
        <Show when={visit.checkedOutAt === undefined}>
          <span className="mt-1 block text-xs font-medium text-amber-600">Active</span>
        </Show>
      </div>
    </div>
  );
}

export function ProfileHistory({ hospitalId, patientId }: ProfileHistoryProps) {
  const slug = useHospitalSlug();
  const admissions = usePatientAdmissions(hospitalId, patientId);
  const checkIns = usePatientCheckIns(hospitalId, patientId);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60 mb-4">
          Admission history
        </p>
        <Loadable
          loading={admissions.isLoading}
          error={admissions.error ?? undefined}
          loadingComponent={
            <p className="text-sm text-charcoal-700/50 py-2">Loading…</p>
          }
          errorComponent={
            <p className="text-sm text-red-600 py-2">Failed to load admissions.</p>
          }
        >
          <Show
            when={(admissions.data?.length ?? 0) > 0}
            fallback={
              <p className="text-sm text-charcoal-700/40 py-2">No admissions recorded.</p>
            }
          >
            <Repeat each={(admissions.data ?? []) as PatientAdmission[]}>
              {(admission: PatientAdmission) => (
                <AdmissionRow key={admission.id} admission={admission} slug={slug} />
              )}
            </Repeat>
          </Show>
        </Loadable>
      </div>

      <div className="rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60 mb-4">
          Check-in history
        </p>
        <Loadable
          loading={checkIns.isLoading}
          error={checkIns.error ?? undefined}
          loadingComponent={
            <p className="text-sm text-charcoal-700/50 py-2">Loading…</p>
          }
          errorComponent={
            <p className="text-sm text-red-600 py-2">Failed to load check-ins.</p>
          }
        >
          <Show
            when={(checkIns.data?.length ?? 0) > 0}
            fallback={
              <p className="text-sm text-charcoal-700/40 py-2">No check-ins recorded.</p>
            }
          >
            <Repeat each={(checkIns.data ?? []) as CheckInVisit[]}>
              {(visit: CheckInVisit) => (
                <CheckInRow key={visit.id} visit={visit} />
              )}
            </Repeat>
          </Show>
        </Loadable>
      </div>
    </div>
  );
}
