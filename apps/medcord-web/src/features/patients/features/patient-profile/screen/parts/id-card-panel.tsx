import { Show } from 'meemaw';
import { AppButton, DrawerService } from '@medcord/ui';
import { IconQrCode } from '@icons';
import type { IdCard } from '../../../../shared/types/patient.ts';
import { useIssueIdCard, useDeactivateIdCard } from '../../api/use-patient.ts';

interface IdCardPanelProps {
  readonly idCard: IdCard;
  readonly hospitalId: string;
  readonly patientId: string;
}

export function IdCardPanel({ idCard, hospitalId, patientId }: IdCardPanelProps) {
  const issueMutation = useIssueIdCard(hospitalId, patientId);
  const deactivateMutation = useDeactivateIdCard(hospitalId, patientId);

  function handleDeactivate() {
    DrawerService.showConfirmationModal(
      'Deactivate ID card',
      'Deactivate this patient\'s ID card? They will need a new one to be issued.',
      {
        destructive: true,
        confirmButtonText: 'Deactivate',
        onConfirm: () => { deactivateMutation.mutate(); },
      }
    );
  }

  return (
    <div className="rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <IconQrCode size={14} className="text-charcoal-700/60" />
        <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">ID Card</p>
      </div>

      <Show
        when={idCard.isActive}
        fallback={
          <div className="space-y-3">
            <p className="text-sm text-charcoal-700">No active ID card.</p>
            <AppButton variant="secondary" onClick={() => issueMutation.mutate()} loading={issueMutation.isPending}>
              Issue ID card
            </AppButton>
          </div>
        }
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-records-200 bg-records-50 px-2 py-0.5 text-[11px] font-medium text-records-800">
              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
              Active
            </span>
          </div>
          <Show when={idCard.issuedAt !== undefined}>
            <p className="text-xs text-charcoal-700/60">
              Issued {new Date(idCard.issuedAt ?? '').toLocaleDateString()}
            </p>
          </Show>
          <Show when={idCard.reissuedAt !== undefined}>
            <p className="text-xs text-charcoal-700/60">
              Reissued {new Date(idCard.reissuedAt ?? '').toLocaleDateString()}
            </p>
          </Show>
          <div className="flex gap-2 pt-1">
            <AppButton variant="secondary" onClick={() => issueMutation.mutate()} loading={issueMutation.isPending}>
              Reissue
            </AppButton>
            <AppButton variant="ghost" onClick={handleDeactivate} loading={deactivateMutation.isPending}>
              Deactivate
            </AppButton>
          </div>
        </div>
      </Show>
    </div>
  );
}
