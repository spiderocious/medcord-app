import { Loadable, Repeat, Show } from 'meemaw';

import { AppText } from '@medcord/ui';
import { IconHeartPulse } from '@icons';
import { useAuth } from '@shared/hooks/use-auth.ts';
import { useIncomingTransfers } from '../api/use-patient-transfers.ts';
import { TransferCard } from './parts/transfer-card.tsx';
import type { PatientTransfer } from '@shared/types/patient.ts';

export function TransfersScreen() {
  const { activeHospitalId } = useAuth();
  const hospitalId = activeHospitalId ?? '';

  const { data: transfers, isLoading, error } = useIncomingTransfers(hospitalId);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <AppText variant="heading-2" className="text-charcoal-900">Incoming Transfers</AppText>
        <AppText variant="body-sm" className="mt-1 text-charcoal-700">
          Patients pending transfer to your hospital
        </AppText>
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
            {error instanceof Error ? error.message : 'Failed to load transfers.'}
          </p>
        }
      >
        <Show
          when={(transfers?.length ?? 0) > 0}
          fallback={
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <IconHeartPulse size={32} className="text-charcoal-700/30" />
              <p className="text-sm text-charcoal-700/60">No pending transfers.</p>
            </div>
          }
        >
          <div className="space-y-4">
            <Repeat each={(transfers ?? []) as PatientTransfer[]}>
              {(transfer: PatientTransfer) => (
                <TransferCard key={transfer.id} transfer={transfer} hospitalId={hospitalId} />
              )}
            </Repeat>
          </div>
        </Show>
      </Loadable>
    </div>
  );
}
