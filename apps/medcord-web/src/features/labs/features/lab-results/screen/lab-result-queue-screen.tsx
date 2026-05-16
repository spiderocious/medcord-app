import { useNavigate } from 'react-router-dom';
import { Loadable, Show, Repeat } from 'meemaw';
import { AppButton, AppText } from '@medcord/ui';
import { IconArrowLeft, IconFlask, IconAlert } from '@icons';
import { useAuth } from '@shared/hooks/use-auth.ts';
import { useHospitalSlug } from '@shared/hooks/use-hospital-slug.ts';
import { ROUTES } from '@shared/constants/routes.ts';
import { useHospitalLabOrders } from '../../lab-orders/api/use-lab-orders.ts';
import type { LabOrder } from '../../../shared/types/lab.ts';

const PRIORITY_STYLE: Record<string, string> = {
  routine: 'text-charcoal-700 border-forest-900/10 bg-cream-50',
  urgent: 'text-[#92400e] border-[#fde68a] bg-[#fffbeb]',
  stat: 'text-red-700 border-red-200 bg-red-50',
};

export function LabResultQueueScreen() {
  const { activeHospitalId } = useAuth();
  const slug = useHospitalSlug();
  const navigate = useNavigate();

  const { data, isLoading, error } = useHospitalLabOrders(activeHospitalId ?? '', {
    status: 'result_ready',
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <AppButton
          variant="ghost"
          leadingIcon={<IconArrowLeft size={14} />}
          onClick={() => navigate(ROUTES.HOSPITAL_LABS(slug))}
        >
          Lab orders
        </AppButton>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <AppText variant="heading-2" className="text-charcoal-900">Results ready</AppText>
          <AppText variant="body-sm" className="mt-1 text-charcoal-700">
            {data ? `${data.total} result${data.total !== 1 ? 's' : ''} awaiting release` : 'Lab results ready for review'}
          </AppText>
        </div>
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
            {error instanceof Error ? error.message : 'Failed to load results.'}
          </p>
        }
      >
        <Show
          when={(data?.items?.length ?? 0) > 0}
          fallback={
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <IconFlask size={32} className="text-charcoal-700/30" />
              <AppText variant="body-sm" className="text-charcoal-700">No results ready for review.</AppText>
            </div>
          }
        >
          <div className="overflow-x-auto rounded-xl border border-forest-900/10">
            <table className="min-w-full divide-y divide-forest-900/10 bg-white">
              <thead>
                <tr className="bg-cream-50">
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-charcoal-700/60">Test</th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-charcoal-700/60">Result</th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-charcoal-700/60">Priority</th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-charcoal-700/60">Patient</th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-charcoal-700/60">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-forest-900/10">
                <Repeat each={(data?.items ?? []) as LabOrder[]}>
                  {(order: LabOrder) => (
                    <tr
                      key={order.id}
                      className="hover:bg-cream-50/60 transition-colors cursor-pointer"
                      onClick={() => navigate(`${ROUTES.HOSPITAL_LAB_ORDER(slug, order.id)}?patientId=${order.patientId}`)}
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-charcoal-900">{order.testName}</p>
                        <Show when={order.testCode !== undefined}>
                          <p className="text-xs text-charcoal-700/60">{order.testCode}</p>
                        </Show>
                      </td>
                      <td className="px-4 py-3">
                        <Show
                          when={order.result !== undefined}
                          fallback={<span className="text-xs text-charcoal-700/50">—</span>}
                        >
                          {order.result && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-medium text-charcoal-900">
                                {order.result.value}
                                <Show when={order.result.unit !== undefined}>
                                  <span className="ml-1 text-charcoal-700/60">{order.result.unit}</span>
                                </Show>
                              </span>
                              <Show when={order.result.isAbnormal}>
                                <span className="inline-flex items-center gap-0.5 rounded-full border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
                                  <IconAlert size={9} />
                                  Abnormal
                                </span>
                              </Show>
                            </div>
                          )}
                        </Show>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${PRIORITY_STYLE[order.priority]}`}>
                          {order.priority.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-charcoal-700">{order.patientId}</td>
                      <td className="px-4 py-3 text-sm text-charcoal-700">{new Date(order.createdAt).toLocaleDateString()}</td>
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
