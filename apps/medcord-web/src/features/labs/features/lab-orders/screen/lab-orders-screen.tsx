import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loadable, Show, Repeat } from 'meemaw';
import { AppButton, AppText, DrawerService } from '@medcord/ui';
import { IconPlus, IconFlask } from '@icons';
import { PERMISSIONS } from '@medcord/rbac';
import { useAuth } from '@shared/hooks/use-auth.ts';
import { useHospitalSlug } from '@shared/hooks/use-hospital-slug.ts';
import { usePermissions } from '@shared/hooks/use-permissions.ts';
import { ROUTES } from '@shared/constants/routes.ts';
import { useHospitalLabOrders } from '../api/use-lab-orders.ts';
import type { LabOrder, LabOrderStatus } from '../../../shared/types/lab.ts';
import { CreateLabOrderForm } from './parts/create-lab-order-form.tsx';

const STATUS_LABEL: Record<LabOrderStatus, string> = {
  awaiting_sample: 'Awaiting sample',
  sample_received: 'Sample received',
  awaiting_test: 'Awaiting test',
  in_progress: 'In progress',
  awaiting_result: 'Awaiting result',
  result_ready: 'Result ready',
  result_released: 'Released',
};

const STATUS_STYLE: Record<LabOrderStatus, string> = {
  awaiting_sample: 'text-charcoal-700 border-forest-900/10 bg-cream-50',
  sample_received: 'text-equipment-800 border-equipment-200 bg-equipment-50',
  awaiting_test: 'text-equipment-800 border-equipment-200 bg-equipment-50',
  in_progress: 'text-patient-800 border-patient-200 bg-patient-50',
  awaiting_result: 'text-patient-800 border-patient-200 bg-patient-50',
  result_ready: 'text-records-800 border-records-200 bg-records-50',
  result_released: 'text-records-800 border-records-200 bg-records-50',
};

const PRIORITY_STYLE: Record<string, string> = {
  routine: 'text-charcoal-700 border-forest-900/10 bg-cream-50',
  urgent: 'text-equipment-800 border-equipment-200 bg-equipment-50',
  stat: 'text-red-700 border-red-200 bg-red-50',
};

export function LabOrdersScreen() {
  const { activeHospitalId } = useAuth();
  const slug = useHospitalSlug();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const [statusFilter, setStatusFilter] = useState<LabOrderStatus | ''>('');

  const { data, isLoading, error } = useHospitalLabOrders(activeHospitalId ?? '', {
    status: statusFilter || undefined,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <AppText variant="heading-2" className="text-charcoal-900">Lab orders</AppText>
          <AppText variant="body-sm" className="mt-1 text-charcoal-700">
            {data ? `${data.total} order${data.total !== 1 ? 's' : ''}` : 'Hospital-wide lab queue'}
          </AppText>
        </div>
        <Show when={can(PERMISSIONS.LAB_CREATE)}>
          <AppButton
            leadingIcon={<IconPlus size={14} />}
            onClick={() => DrawerService.showCustomModal('Create lab order', () => (
              <CreateLabOrderForm hospitalId={activeHospitalId ?? ''} patientId="" />
            ))}
          >
            New order
          </AppButton>
        </Show>
      </div>

      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as LabOrderStatus | '')}
          className="rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 focus:border-forest-900 focus:outline-none"
        >
          <option value="">All statuses</option>
          <Repeat each={Object.keys(STATUS_LABEL) as LabOrderStatus[]}>
            {(s: LabOrderStatus) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>}
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
            {error instanceof Error ? error.message : 'Failed to load lab orders.'}
          </p>
        }
      >
        <Show
          when={(data?.items?.length ?? 0) > 0}
          fallback={
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <IconFlask size={32} className="text-charcoal-700/30" />
              <AppText variant="body-sm" className="text-charcoal-700">No lab orders found.</AppText>
            </div>
          }
        >
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-xl border border-forest-900/10 md:block">
            <table className="min-w-full divide-y divide-forest-900/10 bg-white">
              <thead>
                <tr className="bg-cream-50">
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-charcoal-700/60">Test</th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-charcoal-700/60">Priority</th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-charcoal-700/60">Status</th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-charcoal-700/60">Ordered by</th>
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
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${PRIORITY_STYLE[order.priority]}`}>
                          {order.priority.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[order.status]}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                          {STATUS_LABEL[order.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-charcoal-700">{order.orderedBy}</td>
                      <td className="px-4 py-3 text-sm text-charcoal-700">{new Date(order.createdAt).toLocaleDateString()}</td>
                    </tr>
                  )}
                </Repeat>
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-2 md:hidden">
            <Repeat each={(data?.items ?? []) as LabOrder[]}>
              {(order: LabOrder) => (
                <button
                  key={order.id}
                  type="button"
                  className="w-full rounded-xl border border-forest-900/10 bg-white p-4 text-left transition-colors hover:bg-cream-50/60 active:bg-cream-50"
                  onClick={() => navigate(`${ROUTES.HOSPITAL_LAB_ORDER(slug, order.id)}?patientId=${order.patientId}`)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-charcoal-900">{order.testName}</p>
                      <Show when={order.testCode !== undefined}>
                        <p className="font-mono text-xs text-charcoal-700/60">{order.testCode}</p>
                      </Show>
                    </div>
                    <span className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[order.status]}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                      {STATUS_LABEL[order.status]}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${PRIORITY_STYLE[order.priority]}`}>
                      {order.priority.toUpperCase()}
                    </span>
                    <span className="text-xs text-charcoal-700/60">{order.orderedBy}</span>
                    <span className="text-xs text-charcoal-700/60">{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                </button>
              )}
            </Repeat>
          </div>
        </Show>
      </Loadable>
    </div>
  );
}
