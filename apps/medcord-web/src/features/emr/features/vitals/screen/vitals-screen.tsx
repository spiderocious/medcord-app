import { useParams } from 'react-router-dom';
import { Loadable, Show, Repeat } from 'meemaw';
import { AppButton, DrawerService } from '@medcord/ui';
import { IconPlus, IconAlert } from '@icons';
import { useHospitalSlug } from '@shared/hooks/use-hospital-slug.ts';
import { useAuth } from '@shared/hooks/use-auth.ts';
import { ChartLayout } from '../../../shared/chart-layout.tsx';
import { useVitals } from '../api/use-vitals.ts';
import { VitalsForm } from './parts/vitals-form.tsx';
import type { Vitals } from '../../../shared/types/emr.ts';

export function VitalsScreen() {
  const slug = useHospitalSlug();
  const { activeHospitalId } = useAuth();
  const { code = '' } = useParams<{ slug: string; code: string }>();

  const { data: vitals, isLoading, error } = useVitals(activeHospitalId ?? '', code);

  function handleRecord() {
    DrawerService.showCustomModal('Record vitals', () => (
      <VitalsForm hospitalId={activeHospitalId ?? ''} patientId={code} />
    ));
  }

  return (
    <ChartLayout slug={slug} patientCode={code}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Vitals history</p>
          <AppButton variant="secondary" leadingIcon={<IconPlus size={14} />} onClick={handleRecord}>Record vitals</AppButton>
        </div>

        <Loadable
          loading={isLoading}
          error={error ?? undefined}
          loadingComponent={<div className="flex items-center justify-center py-16"><div className="h-6 w-6 animate-spin rounded-full border-2 border-forest-900/20 border-t-forest-900" /></div>}
          errorComponent={<p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error instanceof Error ? error.message : 'Failed to load vitals.'}</p>}
        >
          <Show
            when={(vitals?.length ?? 0) > 0}
            fallback={<p className="py-8 text-center text-sm text-charcoal-700/50">No vitals recorded yet.</p>}
          >
            {/* Desktop table */}
            <div className="hidden overflow-x-auto rounded-xl border border-forest-900/10 md:block">
              <table className="min-w-full divide-y divide-forest-900/10 bg-white">
                <thead>
                  <tr className="bg-cream-50">
                    <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-charcoal-700/60">Date</th>
                    <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-charcoal-700/60">BP</th>
                    <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-charcoal-700/60">HR</th>
                    <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-charcoal-700/60">Temp</th>
                    <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-charcoal-700/60">SpO₂</th>
                    <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-charcoal-700/60">Weight</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-forest-900/10">
                  <Repeat each={(vitals ?? []) as Vitals[]}>
                    {(v: Vitals) => (
                      <tr key={v.id} className="hover:bg-cream-50/60 transition-colors">
                        <td className="px-4 py-3 text-sm text-charcoal-900">{new Date(v.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-sm text-charcoal-700">
                          {v.bp_systolic !== undefined && v.bp_diastolic !== undefined ? `${v.bp_systolic}/${v.bp_diastolic}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-charcoal-700">{v.hr ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-charcoal-700">{v.temp !== undefined ? `${v.temp}°C` : '—'}</td>
                        <td className="px-4 py-3 text-sm text-charcoal-700">{v.spo2 !== undefined ? `${v.spo2}%` : '—'}</td>
                        <td className="px-4 py-3 text-sm text-charcoal-700">{v.weight !== undefined ? `${v.weight} kg` : '—'}</td>
                        <td className="px-4 py-3">
                          <Show when={v.isOutOfRange}>
                            <IconAlert size={14} className="text-amber-500" />
                          </Show>
                        </td>
                      </tr>
                    )}
                  </Repeat>
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-2 md:hidden">
              <Repeat each={(vitals ?? []) as Vitals[]}>
                {(v: Vitals) => (
                  <div key={v.id} className="rounded-xl border border-forest-900/10 bg-white p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-charcoal-900">{new Date(v.createdAt).toLocaleDateString()}</p>
                      <Show when={v.isOutOfRange}>
                        <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                          <IconAlert size={12} />
                          Out of range
                        </span>
                      </Show>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <Show when={v.bp_systolic !== undefined && v.bp_diastolic !== undefined}>
                        <div>
                          <p className="font-mono text-[9px] uppercase tracking-widest text-charcoal-700/50">BP</p>
                          <p className="text-sm font-medium text-charcoal-900">{v.bp_systolic}/{v.bp_diastolic}</p>
                        </div>
                      </Show>
                      <Show when={v.hr !== undefined}>
                        <div>
                          <p className="font-mono text-[9px] uppercase tracking-widest text-charcoal-700/50">HR</p>
                          <p className="text-sm font-medium text-charcoal-900">{v.hr} bpm</p>
                        </div>
                      </Show>
                      <Show when={v.temp !== undefined}>
                        <div>
                          <p className="font-mono text-[9px] uppercase tracking-widest text-charcoal-700/50">Temp</p>
                          <p className="text-sm font-medium text-charcoal-900">{v.temp}°C</p>
                        </div>
                      </Show>
                      <Show when={v.spo2 !== undefined}>
                        <div>
                          <p className="font-mono text-[9px] uppercase tracking-widest text-charcoal-700/50">SpO₂</p>
                          <p className="text-sm font-medium text-charcoal-900">{v.spo2}%</p>
                        </div>
                      </Show>
                      <Show when={v.weight !== undefined}>
                        <div>
                          <p className="font-mono text-[9px] uppercase tracking-widest text-charcoal-700/50">Weight</p>
                          <p className="text-sm font-medium text-charcoal-900">{v.weight} kg</p>
                        </div>
                      </Show>
                    </div>
                  </div>
                )}
              </Repeat>
            </div>
          </Show>
        </Loadable>
      </div>
    </ChartLayout>
  );
}
