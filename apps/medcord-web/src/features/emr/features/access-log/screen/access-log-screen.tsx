import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loadable, Show, Repeat } from 'meemaw';
import { AppButton, DrawerService } from '@medcord/ui';
import { IconLock } from '@icons';
import { useHospitalSlug } from '@shared/hooks/use-hospital-slug.ts';
import { useAuth } from '@shared/hooks/use-auth.ts';
import { ChartLayout } from '../../../shared/chart-layout.tsx';
import { useAccessLog, useBreakGlass } from '../api/use-access-log.ts';
import type { ChartAccessLog } from '../../../shared/types/emr.ts';

const INPUT_CLS = 'mt-1 block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 focus:border-forest-900 focus:outline-none';

function BreakGlassForm({ hospitalId, patientId }: { hospitalId: string; patientId: string }) {
  const mutation = useBreakGlass(hospitalId, patientId);
  const [reason, setReason] = useState('');

  function handleConfirm() {
    if (!reason.trim()) return;
    mutation.mutate(reason.trim(), { onSuccess: () => { DrawerService.dismissAllModals(); } });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
        <p className="text-sm font-medium text-amber-900">Emergency access override</p>
        <p className="mt-0.5 text-xs text-amber-700">This action will be logged and audited.</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-900">Reason for emergency access <span className="text-red-500">*</span></label>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} disabled={mutation.isPending} className={INPUT_CLS} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <AppButton variant="ghost" onClick={() => DrawerService.dismissAllModals()}>Cancel</AppButton>
        <AppButton onClick={handleConfirm} loading={mutation.isPending}>Confirm emergency access</AppButton>
      </div>
    </div>
  );
}

export function AccessLogScreen() {
  const slug = useHospitalSlug();
  const { activeHospitalId } = useAuth();
  const { code = '' } = useParams<{ slug: string; code: string }>();

  const { data, isLoading, error } = useAccessLog(activeHospitalId ?? '', code);

  function handleBreakGlass() {
    DrawerService.showCustomModal('Break glass — Emergency access', () => (
      <BreakGlassForm hospitalId={activeHospitalId ?? ''} patientId={code} />
    ));
  }

  return (
    <ChartLayout slug={slug} patientCode={code}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Access audit log</p>
          <AppButton variant="ghost" leadingIcon={<IconLock size={14} />} onClick={handleBreakGlass}>
            Break glass
          </AppButton>
        </div>

        <Loadable
          loading={isLoading}
          error={error ?? undefined}
          loadingComponent={<div className="flex items-center justify-center py-16"><div className="h-6 w-6 animate-spin rounded-full border-2 border-forest-900/20 border-t-forest-900" /></div>}
          errorComponent={<p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error instanceof Error ? error.message : 'Failed to load access log.'}</p>}
        >
          <Show
            when={(data?.items?.length ?? 0) > 0}
            fallback={<p className="py-8 text-center text-sm text-charcoal-700/50">No access events recorded.</p>}
          >
            <div className="overflow-x-auto rounded-xl border border-forest-900/10">
              <table className="min-w-full divide-y divide-forest-900/10 bg-white">
                <thead>
                  <tr className="bg-cream-50">
                    <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-charcoal-700/60">Time</th>
                    <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-charcoal-700/60">User</th>
                    <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-charcoal-700/60">Action</th>
                    <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-charcoal-700/60">Section</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-forest-900/10">
                  <Repeat each={(data?.items ?? []) as ChartAccessLog[]}>
                    {(log: ChartAccessLog, idx: number) => (
                      <tr key={`${log.accessedAt}-${idx}`} className={`hover:bg-cream-50/60 transition-colors ${log.isBreakGlass ? 'bg-amber-50/40' : ''}`}>
                        <td className="px-4 py-3 text-sm text-charcoal-700">{new Date(log.accessedAt).toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-charcoal-900">{log.accessedBy}</td>
                        <td className="px-4 py-3 text-sm text-charcoal-700">
                          <Show when={log.isBreakGlass}>
                            <span className="mr-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">BREAK GLASS</span>
                          </Show>
                          {log.action.replace(/_/g, ' ')}
                        </td>
                        <td className="px-4 py-3 text-sm text-charcoal-700">{log.section}</td>
                      </tr>
                    )}
                  </Repeat>
                </tbody>
              </table>
            </div>
          </Show>
        </Loadable>
      </div>
    </ChartLayout>
  );
}
