import { CopyToClipboard, Show } from 'meemaw';

import { AppButton, DrawerService } from '@medcord/ui';
import { useAcceptTransfer, useDeclineTransfer } from '../../api/use-patient-transfers.ts';
import type { PatientTransfer } from '@shared/types/patient.ts';

interface TransferCardProps {
  readonly transfer: PatientTransfer;
  readonly hospitalId: string;
}

interface RecordPill {
  readonly label: string;
  readonly included: boolean;
}

export function TransferCard({ transfer, hospitalId }: TransferCardProps) {
  const acceptMutation = useAcceptTransfer(hospitalId);
  const declineMutation = useDeclineTransfer(hospitalId);

  const pills: RecordPill[] = [
    { label: 'Vitals', included: transfer.recordsPackage.includeVitals },
    { label: 'Medications', included: transfer.recordsPackage.includeMedications },
    { label: 'History', included: transfer.recordsPackage.includeHistory },
    { label: 'Labs', included: transfer.recordsPackage.includeLabs },
    { label: 'Documents', included: transfer.recordsPackage.includeDocuments },
  ];

  function handleDecline() {
    DrawerService.showConfirmationModal(
      'Decline this transfer?',
      'The requesting hospital will be notified.',
      {
        destructive: true,
        onConfirm: () => declineMutation.mutate(transfer.id),
      },
    );
  }

  return (
    <div className="rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-charcoal-700/60">Patient ID</span>
            <CopyToClipboard text={transfer.patientId}>
              {(copy, copied) => (
                <button
                  onClick={copy}
                  className="font-mono text-sm font-medium text-charcoal-900 hover:text-forest-900 transition-colors"
                >
                  {copied ? 'Copied!' : transfer.patientId}
                </button>
              )}
            </CopyToClipboard>
          </div>
          <p className="text-xs text-charcoal-700/60">
            From: <span className="font-medium text-charcoal-900">{transfer.fromHospitalId}</span>
          </p>
        </div>
        <p className="text-xs text-charcoal-700/60">
          {new Date(transfer.createdAt).toLocaleDateString()}
        </p>
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
        <p className="text-xs text-charcoal-700/60">Records included</p>
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

      <div className="flex items-center gap-2 pt-1">
        <AppButton
          onClick={() => acceptMutation.mutate(transfer.id)}
          loading={acceptMutation.isPending}
          disabled={declineMutation.isPending}
        >
          Accept
        </AppButton>
        <AppButton
          variant="ghost"
          onClick={handleDecline}
          loading={declineMutation.isPending}
          disabled={acceptMutation.isPending}
        >
          Decline
        </AppButton>
      </div>
    </div>
  );
}
