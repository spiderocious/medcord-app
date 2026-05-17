import { Show } from 'meemaw';
import type { PatientTransfer } from '@shared/types/patient.ts';
import { useHospitalSlug } from '@shared/hooks/use-hospital-slug.ts';
import { ROUTES } from '@shared/constants/routes.ts';
import { EntityLink } from '@shared/components/entity-link.tsx';

interface OutgoingTransferCardProps {
  readonly transfer: PatientTransfer;
}

const STATUS_STYLES: Record<PatientTransfer['status'], string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  accepted: 'bg-green-50 text-green-700 border-green-200',
  declined: 'bg-red-50 text-red-700 border-red-200',
};

const STATUS_LABELS: Record<PatientTransfer['status'], string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  declined: 'Declined',
};

interface RecordPill {
  readonly label: string;
  readonly included: boolean;
}

export function OutgoingTransferCard({ transfer }: OutgoingTransferCardProps) {
  const slug = useHospitalSlug();
  const pills: RecordPill[] = [
    { label: 'Vitals', included: transfer.recordsPackage.includeVitals },
    { label: 'Medications', included: transfer.recordsPackage.includeMedications },
    { label: 'History', included: transfer.recordsPackage.includeHistory },
    { label: 'Labs', included: transfer.recordsPackage.includeLabs },
    { label: 'Documents', included: transfer.recordsPackage.includeDocuments },
  ];

  return (
    <div className="rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-charcoal-700/60">Patient ID</span>
            <EntityLink id={transfer.patientId} to={ROUTES.HOSPITAL_PATIENT_PROFILE(slug, transfer.patientId)} label="Patient" />
          </div>
          <p className="text-xs text-charcoal-700/60">
            To: <span className="font-medium text-charcoal-900">{transfer.toHospitalId}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={[
              'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
              STATUS_STYLES[transfer.status],
            ].join(' ')}
          >
            {STATUS_LABELS[transfer.status]}
          </span>
          <p className="text-xs text-charcoal-700/60">
            {new Date(transfer.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs text-charcoal-700/60">Reason</p>
        <p className="text-sm text-charcoal-900">{transfer.reason}</p>
      </div>

      <Show when={transfer.department !== undefined}>
        <div className="space-y-1">
          <p className="text-xs text-charcoal-700/60">Department</p>
          <p className="text-sm text-charcoal-900">{transfer.department}</p>
        </div>
      </Show>

      <div className="space-y-1">
        <p className="text-xs text-charcoal-700/60">Records sent</p>
        <div className="flex flex-wrap gap-1.5">
          {pills.map((pill) => (
            <span
              key={pill.label}
              className={[
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                pill.included
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-charcoal-700/5 text-charcoal-700/50 border border-charcoal-700/10',
              ].join(' ')}
            >
              {pill.label}
            </span>
          ))}
        </div>
      </div>

      <Show when={transfer.respondedAt !== undefined}>
        <p className="text-xs text-charcoal-700/60">
          Responded {new Date(transfer.respondedAt!).toLocaleDateString()}
        </p>
      </Show>
    </div>
  );
}
