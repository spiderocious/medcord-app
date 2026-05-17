import { useState } from 'react';
import { Loadable, Repeat, Show } from 'meemaw';

import { AppText } from '@medcord/ui';
import { IconHeartPulse } from '@icons';
import { useAuth } from '@shared/hooks/use-auth.ts';
import { useIncomingTransfers, useOutgoingTransfers } from '../api/use-patient-transfers.ts';
import { TransferCard } from './parts/transfer-card.tsx';
import { OutgoingTransferCard } from './parts/outgoing-transfer-card.tsx';
import type { PatientTransfer } from '@shared/types/patient.ts';

type TransferTab = 'incoming' | 'outgoing';

export function TransfersScreen() {
  const { activeHospitalId } = useAuth();
  const hospitalId = activeHospitalId ?? '';
  const [activeTab, setActiveTab] = useState<TransferTab>('incoming');

  const { data: incomingTransfers, isLoading: incomingLoading, error: incomingError } = useIncomingTransfers(hospitalId);
  const { data: outgoingTransfers, isLoading: outgoingLoading, error: outgoingError } = useOutgoingTransfers(hospitalId);

  const isLoading = activeTab === 'incoming' ? incomingLoading : outgoingLoading;
  const error = activeTab === 'incoming' ? incomingError : outgoingError;
  const transfers = activeTab === 'incoming' ? incomingTransfers : outgoingTransfers;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <AppText variant="heading-2" className="text-charcoal-900">Transfers</AppText>
        <AppText variant="body-sm" className="mt-1 text-charcoal-700">
          Manage patient transfers to and from your hospital.
        </AppText>
      </div>

      {/* Tab nav */}
      <div className="flex gap-0.5 border-b border-forest-900/10">
        {(['incoming', 'outgoing'] as TransferTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={[
              'shrink-0 px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none border-b-2 -mb-px capitalize',
              activeTab === tab
                ? 'border-forest-900 text-forest-900'
                : 'border-transparent text-charcoal-700 hover:text-charcoal-900',
            ].join(' ')}
          >
            {tab}
          </button>
        ))}
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
              <p className="text-sm text-charcoal-700/60">
                {activeTab === 'incoming' ? 'No pending incoming transfers.' : 'No outgoing transfers sent.'}
              </p>
            </div>
          }
        >
          <div className="space-y-4">
            <Show when={activeTab === 'incoming'}>
              <Repeat each={(transfers ?? []) as PatientTransfer[]}>
                {(transfer: PatientTransfer) => (
                  <TransferCard key={transfer.id} transfer={transfer} hospitalId={hospitalId} />
                )}
              </Repeat>
            </Show>
            <Show when={activeTab === 'outgoing'}>
              <Repeat each={(transfers ?? []) as PatientTransfer[]}>
                {(transfer: PatientTransfer) => (
                  <OutgoingTransferCard key={transfer.id} transfer={transfer} />
                )}
              </Repeat>
            </Show>
          </div>
        </Show>
      </Loadable>
    </div>
  );
}
