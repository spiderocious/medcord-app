import { useParams } from 'react-router-dom';
import { Loadable, Show, Repeat } from 'meemaw';
import { AppButton, DrawerService } from '@medcord/ui';
import { useHospitalSlug } from '@shared/hooks/use-hospital-slug.ts';
import { useAuth } from '@shared/hooks/use-auth.ts';
import { ChartLayout } from '../../../shared/chart-layout.tsx';
import { useHistory } from '../api/use-history.ts';
import type { Diagnosis } from '../../../shared/types/emr.ts';
import { HistoryEditForm } from './parts/history-edit-form.tsx';

export function HistoryScreen() {
  const slug = useHospitalSlug();
  const { activeHospitalId } = useAuth();
  const { code = '' } = useParams<{ slug: string; code: string }>();

  const { data: history, isLoading, error } = useHistory(activeHospitalId ?? '', code);

  function handleEdit() {
    if (!history) return;
    DrawerService.showCustomModal('Edit medical history', () => (
      <HistoryEditForm history={history} hospitalId={activeHospitalId ?? ''} patientId={code} />
    ));
  }

  return (
    <ChartLayout slug={slug} patientCode={code}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Medical history</p>
          <AppButton variant="secondary" onClick={handleEdit} disabled={!history}>Edit</AppButton>
        </div>

        <Loadable
          loading={isLoading}
          error={error ?? undefined}
          loadingComponent={<div className="flex items-center justify-center py-16"><div className="h-6 w-6 animate-spin rounded-full border-2 border-forest-900/20 border-t-forest-900" /></div>}
          errorComponent={<p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error instanceof Error ? error.message : 'Failed to load history.'}</p>}
        >
          <Show when={history !== undefined}>
            <div className="space-y-4">
              <Show when={(history?.diagnoses.length ?? 0) > 0}>
                <div className="rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Diagnoses</p>
                  <div className="divide-y divide-forest-900/10">
                    <Repeat each={history!.diagnoses as Diagnosis[]}>

                      {(d) => (
                        <div key={d.icd10Code} className="py-2">
                          <p className="text-sm font-medium text-charcoal-900">{d.description}</p>
                          <p className="text-xs text-charcoal-700/60">
                            {d.icd10Code}
                            {d.diagnosedAt ? ` · ${new Date(d.diagnosedAt).toLocaleDateString()}` : ''}
                          </p>
                        </div>
                      )}
                    </Repeat>
                  </div>
                </div>
              </Show>

              <div className="rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Social history</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Repeat each={[
                    { label: 'Smoking', value: history?.socialHistory.smoking },
                    { label: 'Alcohol', value: history?.socialHistory.alcohol },
                    { label: 'Occupation', value: history?.socialHistory.occupation },
                    { label: 'Other', value: history?.socialHistory.other },
                  ] as Array<{ label: string; value: string | undefined }>}>
                    {({ label, value }: { label: string; value: string | undefined }) => (
                      <div key={label}>
                        <p className="text-xs font-mono uppercase tracking-wider text-charcoal-700/60">{label}</p>
                        <p className="mt-0.5 text-sm text-charcoal-900">{value ?? <span className="text-charcoal-700/40">—</span>}</p>
                      </div>
                    )}
                  </Repeat>
                </div>
              </div>

              <Show when={(history?.familyHistory.length ?? 0) > 0}>
                <div className="rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Family history</p>
                  <ul className="space-y-1">
                    <Repeat each={history!.familyHistory as string[]}>
                      {(item: string) => (
                        <li key={item} className="text-sm text-charcoal-900">· {item}</li>
                      )}
                    </Repeat>
                  </ul>
                </div>
              </Show>

              <Show when={history?.notes !== undefined}>
                <div className="rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60 mb-2">Notes</p>
                  <p className="text-sm text-charcoal-900">{history!.notes}</p>
                </div>
              </Show>
            </div>
          </Show>
        </Loadable>
      </div>
    </ChartLayout>
  );
}
