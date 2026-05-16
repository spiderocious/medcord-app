import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loadable, Show, Repeat } from 'meemaw';
import { AppButton, DrawerService } from '@medcord/ui';
import { IconPlus, IconAlert } from '@icons';
import { useHospitalSlug } from '@shared/hooks/use-hospital-slug.ts';
import { useAuth } from '@shared/hooks/use-auth.ts';
import { ChartLayout } from '../../../shared/chart-layout.tsx';
import { useVitals, useRecordVitals, type RecordVitalsPayload } from '../api/use-vitals.ts';
import type { Vitals } from '../../../shared/types/emr.ts';

const INPUT_CLS = 'mt-1 block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 placeholder-charcoal-700/50 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900 disabled:opacity-50';

function VitalsForm({ hospitalId, patientId }: { hospitalId: string; patientId: string }) {
  const mutation = useRecordVitals(hospitalId, patientId);
  const [fields, setFields] = useState<Record<string, string>>({});

  function set(key: string, val: string) { setFields((prev) => ({ ...prev, [key]: val })); }
  function num(key: string): number | undefined {
    const v = fields[key];
    return v && v.trim() !== '' ? Number(v) : undefined;
  }

  function handleSubmit() {
    const payload: RecordVitalsPayload = {
      bp_systolic: num('bp_systolic'),
      bp_diastolic: num('bp_diastolic'),
      hr: num('hr'),
      rr: num('rr'),
      temp: num('temp'),
      spo2: num('spo2'),
      weight: num('weight'),
      height: num('height'),
      painScore: num('painScore'),
    };
    mutation.mutate(payload, {
      onSuccess: () => { DrawerService.dismissAllModals(); },
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { key: 'bp_systolic', label: 'Systolic BP (mmHg)' },
          { key: 'bp_diastolic', label: 'Diastolic BP (mmHg)' },
          { key: 'hr', label: 'Heart rate (bpm)' },
          { key: 'rr', label: 'Respiratory rate (/min)' },
          { key: 'temp', label: 'Temperature (°C)' },
          { key: 'spo2', label: 'SpO₂ (%)' },
          { key: 'weight', label: 'Weight (kg)' },
          { key: 'height', label: 'Height (cm)' },
          { key: 'painScore', label: 'Pain score (0–10)' },
        ].map(({ key, label }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-charcoal-900">{label}</label>
            <input type="number" step="0.1" value={fields[key] ?? ''} onChange={(e) => set(key, e.target.value)} disabled={mutation.isPending} className={INPUT_CLS} />
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <AppButton variant="ghost" onClick={() => DrawerService.dismissAllModals()}>Cancel</AppButton>
        <AppButton onClick={handleSubmit} loading={mutation.isPending}>Record vitals</AppButton>
      </div>
    </div>
  );
}

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
        <div className="flex items-center justify-between">
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
            <div className="overflow-x-auto rounded-xl border border-forest-900/10">
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
          </Show>
        </Loadable>
      </div>
    </ChartLayout>
  );
}
