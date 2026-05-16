import { useParams } from 'react-router-dom';
import { Loadable, Show, Repeat } from 'meemaw';
import { IconHeartPulse, IconPill, IconStethoscope, IconActivity } from '@icons';
import { useHospitalSlug } from '@shared/hooks/use-hospital-slug.ts';
import { useAuth } from '@shared/hooks/use-auth.ts';
import { ChartLayout } from '../../../shared/chart-layout.tsx';
import { useChartSummary } from '../api/use-chart-summary.ts';

export function ChartOverviewScreen() {
  const slug = useHospitalSlug();
  const { activeHospitalId } = useAuth();
  const { code = '' } = useParams<{ slug: string; code: string }>();

  const { data: summary, isLoading, error } = useChartSummary(activeHospitalId ?? '', code);

  return (
    <ChartLayout slug={slug} patientCode={code}>
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
            {error instanceof Error ? error.message : 'Failed to load chart.'}
          </p>
        }
      >
        {summary && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <IconHeartPulse size={16} className="text-charcoal-700/60" />
                <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Last vitals</p>
              </div>
              <Show
                when={summary.lastVitals !== null}
                fallback={<p className="text-sm text-charcoal-700/50">No vitals recorded.</p>}
              >
                {summary.lastVitals && (
                  <div className="space-y-1">
                    <Show when={summary.lastVitals.bp_systolic !== undefined && summary.lastVitals.bp_diastolic !== undefined}>
                      <p className="text-sm text-charcoal-900">BP: {summary.lastVitals.bp_systolic}/{summary.lastVitals.bp_diastolic} mmHg</p>
                    </Show>
                    <Show when={summary.lastVitals.hr !== undefined}>
                      <p className="text-sm text-charcoal-900">HR: {summary.lastVitals.hr} bpm</p>
                    </Show>
                    <Show when={summary.lastVitals.temp !== undefined}>
                      <p className="text-sm text-charcoal-900">Temp: {summary.lastVitals.temp}°C</p>
                    </Show>
                    <Show when={summary.lastVitals.spo2 !== undefined}>
                      <p className="text-sm text-charcoal-900">SpO₂: {summary.lastVitals.spo2}%</p>
                    </Show>
                    <Show when={summary.lastVitals.isOutOfRange}>
                      <p className="mt-1 text-xs text-amber-600">Out-of-range fields: {summary.lastVitals.outOfRangeFields.join(', ')}</p>
                    </Show>
                    <p className="mt-1 text-xs text-charcoal-700/50">
                      {new Date(summary.lastVitals.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </Show>
            </div>

            <div className="rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <IconPill size={16} className="text-charcoal-700/60" />
                <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Medications</p>
              </div>
              <p className="text-2xl font-semibold text-charcoal-900">{summary.activeMedicationsCount}</p>
              <p className="text-xs text-charcoal-700/60">active medication{summary.activeMedicationsCount !== 1 ? 's' : ''}</p>
            </div>

            <div className="rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <IconActivity size={16} className="text-charcoal-700/60" />
                <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Diagnoses</p>
              </div>
              <p className="text-2xl font-semibold text-charcoal-900">{summary.diagnosesCount}</p>
              <p className="text-xs text-charcoal-700/60">recorded</p>
            </div>

            <Show when={summary.recentProcedures.length > 0}>
              <div className="sm:col-span-2 lg:col-span-3 rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <IconStethoscope size={16} className="text-charcoal-700/60" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Recent procedures</p>
                </div>
                <div className="divide-y divide-forest-900/10">
                  <Repeat each={summary.recentProcedures as typeof summary.recentProcedures & Array<(typeof summary.recentProcedures)[number]>}>
                    {(proc) => (
                      <div key={proc.id} className="py-2">
                        <p className="text-sm font-medium text-charcoal-900">{proc.name}</p>
                        <p className="text-xs text-charcoal-700/60">
                          {new Date(proc.performedAt).toLocaleDateString()} · {proc.performedBy}
                        </p>
                      </div>
                    )}
                  </Repeat>
                </div>
              </div>
            </Show>
          </div>
        )}
      </Loadable>
    </ChartLayout>
  );
}
