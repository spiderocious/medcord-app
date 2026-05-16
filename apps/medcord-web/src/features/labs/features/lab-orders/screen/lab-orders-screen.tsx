import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loadable, Show, Repeat } from 'meemaw';
import { AppButton, AppText, DrawerService } from '@medcord/ui';
import { IconPlus, IconFlask } from '@icons';
import { useAuth } from '@shared/hooks/use-auth.ts';
import { useHospitalSlug } from '@shared/hooks/use-hospital-slug.ts';
import { ROUTES } from '@shared/constants/routes.ts';
import { useHospitalLabOrders, useCreateLabOrder } from '../api/use-lab-orders.ts';
import type { LabOrder, LabOrderStatus } from '../../../shared/types/lab.ts';

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
  sample_received: 'text-[#92400e] border-[#fde68a] bg-[#fffbeb]',
  awaiting_test: 'text-[#92400e] border-[#fde68a] bg-[#fffbeb]',
  in_progress: 'text-[#1e40af] border-[#bfdbfe] bg-[#eff6ff]',
  awaiting_result: 'text-[#1e40af] border-[#bfdbfe] bg-[#eff6ff]',
  result_ready: 'text-[#166534] border-[#bbf7d0] bg-[#f0fdf4]',
  result_released: 'text-[#166534] border-[#bbf7d0] bg-[#f0fdf4]',
};

const PRIORITY_STYLE: Record<string, string> = {
  routine: 'text-charcoal-700 border-forest-900/10 bg-cream-50',
  urgent: 'text-[#92400e] border-[#fde68a] bg-[#fffbeb]',
  stat: 'text-red-700 border-red-200 bg-red-50',
};

const INPUT_CLS = 'mt-1 block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 placeholder-charcoal-700/50 focus:border-forest-900 focus:outline-none';

function CreateLabOrderForm({ hospitalId, patientId }: { hospitalId: string; patientId: string }) {
  const mutation = useCreateLabOrder(hospitalId, patientId);
  const [testName, setTestName] = useState('');
  const [testCode, setTestCode] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<'routine' | 'urgent' | 'stat'>('routine');
  const [sampleType, setSampleType] = useState('');
  const [notes, setNotes] = useState('');

  function handleSubmit() {
    if (!testName.trim()) return;
    mutation.mutate(
      {
        testName: testName.trim(),
        testCode: testCode.trim() || undefined,
        category: category.trim() || undefined,
        priority,
        sampleType: sampleType.trim() || undefined,
        notes: notes.trim() || undefined,
      },
      { onSuccess: () => { DrawerService.dismissAllModals(); } }
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-charcoal-900">Test name <span className="text-red-500">*</span></label>
        <input value={testName} onChange={(e) => setTestName(e.target.value)} required disabled={mutation.isPending} className={INPUT_CLS} placeholder="e.g. Complete blood count" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-charcoal-900">Test code</label>
          <input value={testCode} onChange={(e) => setTestCode(e.target.value)} disabled={mutation.isPending} className={INPUT_CLS} placeholder="e.g. CBC" />
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal-900">Category</label>
          <input value={category} onChange={(e) => setCategory(e.target.value)} disabled={mutation.isPending} className={INPUT_CLS} placeholder="e.g. Haematology" />
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal-900">Priority</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value as 'routine' | 'urgent' | 'stat')} disabled={mutation.isPending} className={INPUT_CLS}>
            <option value="routine">Routine</option>
            <option value="urgent">Urgent</option>
            <option value="stat">STAT</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal-900">Sample type</label>
          <input value={sampleType} onChange={(e) => setSampleType(e.target.value)} disabled={mutation.isPending} className={INPUT_CLS} placeholder="e.g. Venous blood" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-900">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} disabled={mutation.isPending} className={INPUT_CLS} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <AppButton variant="ghost" onClick={() => DrawerService.dismissAllModals()}>Cancel</AppButton>
        <AppButton onClick={handleSubmit} loading={mutation.isPending}>Create order</AppButton>
      </div>
    </div>
  );
}

export function LabOrdersScreen() {
  const { activeHospitalId } = useAuth();
  const slug = useHospitalSlug();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<LabOrderStatus | ''>('');

  const { data, isLoading, error } = useHospitalLabOrders(activeHospitalId ?? '', {
    status: statusFilter || undefined,
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <AppText variant="heading-2" className="text-charcoal-900">Lab orders</AppText>
          <AppText variant="body-sm" className="mt-1 text-charcoal-700">
            {data ? `${data.total} order${data.total !== 1 ? 's' : ''}` : 'Hospital-wide lab queue'}
          </AppText>
        </div>
        <AppButton
          leadingIcon={<IconPlus size={14} />}
          onClick={() => DrawerService.showCustomModal('Create lab order', () => (
            <CreateLabOrderForm hospitalId={activeHospitalId ?? ''} patientId="" />
          ))}
        >
          New order
        </AppButton>
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
          <div className="overflow-x-auto rounded-xl border border-forest-900/10">
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
        </Show>
      </Loadable>
    </div>
  );
}
