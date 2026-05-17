import { Show } from 'meemaw';

import { AppButton, DrawerService } from '@medcord/ui';
import { useAuth } from '@shared/hooks/use-auth.ts';
import { useMyMembership } from '@features/staff/features/staff-profile/api/use-my-membership.ts';
import { useAdvanceLabStatus } from '../../api/use-lab-orders.ts';
import type { LabOrder } from '../../../../shared/types/lab.ts';

interface ResultSignoffPanelProps {
  readonly order: LabOrder;
  readonly hospitalId: string;
}

const PRESCRIBER_ROLES = ['doctor', 'nurse_practitioner', 'physician_assistant'];

export function ResultSignoffPanel({ order, hospitalId }: ResultSignoffPanelProps) {
  const { activeHospitalId } = useAuth();
  const { data: myMembership } = useMyMembership(activeHospitalId ?? '');
  const advanceMutation = useAdvanceLabStatus(hospitalId, order.patientId, order.id);

  const isResultReady = order.status === 'result_ready';
  const isReleased = order.status === 'result_released';
  const isPrescriber = PRESCRIBER_ROLES.includes(myMembership?.role ?? '');

  if (!isResultReady && !isReleased) return null;

  return (
    <div className="rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">
        Sign-off
      </p>

      <Show
        when={isReleased}
        fallback={
          <Show
            when={isPrescriber}
            fallback={
              <p className="text-sm text-charcoal-700/60">
                Awaiting sign-off by an ordering provider.
              </p>
            }
          >
            <div className="space-y-3">
              <p className="text-sm text-charcoal-700">
                Result is ready. Release it to the patient chart and notify the team.
              </p>
              <AppButton
                onClick={() => {
                  advanceMutation.mutate(
                    {},
                    {
                      onSuccess: () => {
                        DrawerService.toast('Result released to patient chart.', { type: 'success' });
                      },
                    },
                  );
                }}
                loading={advanceMutation.isPending}
              >
                Release to chart
              </AppButton>
            </div>
          </Show>
        }
      >
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
            Released
          </span>
          <Show when={order.resultReleasedAt !== undefined}>
            <span className="text-sm text-charcoal-700">
              {new Date(order.resultReleasedAt ?? '').toLocaleString()}
            </span>
          </Show>
        </div>
      </Show>
    </div>
  );
}
