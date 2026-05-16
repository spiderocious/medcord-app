import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loadable, Show, Repeat } from 'meemaw';
import { AppButton, DrawerService } from '@medcord/ui';
import { useHospitalSlug } from '@shared/hooks/use-hospital-slug.ts';
import { useAuth } from '@shared/hooks/use-auth.ts';
import { ChartLayout } from '../../../shared/chart-layout.tsx';
import { useHistory, useUpdateHistory } from '../api/use-history.ts';
import type { MedicalHistory } from '../../../shared/types/emr.ts';

const INPUT_CLS = 'mt-1 block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 placeholder-charcoal-700/50 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900 disabled:opacity-50';

function HistoryEditForm({ history, hospitalId, patientId }: { history: MedicalHistory; hospitalId: string; patientId: string }) {
  const mutation = useUpdateHistory(hospitalId, patientId);
  const [notes, setNotes] = useState(history.notes ?? '');
  const [smoking, setSmoking] = useState(history.socialHistory.smoking ?? '');
  const [alcohol, setAlcohol] = useState(history.socialHistory.alcohol ?? '');
  const [occupation, setOccupation] = useState(history.socialHistory.occupation ?? '');

  function handleSave() {
    mutation.mutate(
      {
        notes: notes.trim() || undefined,
        socialHistory: {
          smoking: smoking.trim() || undefined,
          alcohol: alcohol.trim() || undefined,
          occupation: occupation.trim() || undefined,
        },
      },
      { onSuccess: () => { DrawerService.dismissAllModals(); } }
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-charcoal-900">Smoking</label>
          <input value={smoking} onChange={(e) => setSmoking(e.target.value)} disabled={mutation.isPending} className={INPUT_CLS} placeholder="e.g. Non-smoker" />
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal-900">Alcohol</label>
          <input value={alcohol} onChange={(e) => setAlcohol(e.target.value)} disabled={mutation.isPending} className={INPUT_CLS} placeholder="e.g. Occasional" />
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal-900">Occupation</label>
          <input value={occupation} onChange={(e) => setOccupation(e.target.value)} disabled={mutation.isPending} className={INPUT_CLS} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-900">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} disabled={mutation.isPending} className={INPUT_CLS} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <AppButton variant="ghost" onClick={() => DrawerService.dismissAllModals()}>Cancel</AppButton>
        <AppButton onClick={handleSave} loading={mutation.isPending}>Save</AppButton>
      </div>
    </div>
  );
}

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
                    <Repeat each={history!.diagnoses as Array<(typeof history.diagnoses)[number]>}>
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
