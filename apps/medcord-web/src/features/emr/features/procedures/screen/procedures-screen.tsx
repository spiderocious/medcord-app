import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loadable, Show, Repeat } from 'meemaw';
import { AppButton, DrawerService } from '@medcord/ui';
import { IconPlus } from '@icons';
import { useHospitalSlug } from '@shared/hooks/use-hospital-slug.ts';
import { useAuth } from '@shared/hooks/use-auth.ts';
import { ChartLayout } from '../../../shared/chart-layout.tsx';
import { useProcedures, useAddProcedure, type AddProcedurePayload } from '../api/use-procedures.ts';
import type { Procedure } from '../../../shared/types/emr.ts';

const INPUT_CLS = 'mt-1 block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 placeholder-charcoal-700/50 focus:border-forest-900 focus:outline-none';

function AddProcedureForm({ hospitalId, patientId }: { hospitalId: string; patientId: string }) {
  const mutation = useAddProcedure(hospitalId, patientId);
  const [name, setName] = useState('');
  const [performedBy, setPerformedBy] = useState('');
  const [performedAt, setPerformedAt] = useState('');
  const [cptCode, setCptCode] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [checklist, setChecklist] = useState({
    consentObtained: false, npoStatus: false, allergiesConfirmed: false, siteMarked: false,
  });

  function toggle(key: keyof typeof checklist) {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleSubmit() {
    if (!name.trim() || !performedBy.trim() || !performedAt) return;
    const payload: AddProcedurePayload = {
      name: name.trim(),
      performedBy: performedBy.trim(),
      performedAt,
      cptCode: cptCode.trim() || undefined,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
      preOpChecklist: checklist,
    };
    mutation.mutate(payload, { onSuccess: () => { DrawerService.dismissAllModals(); } });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-charcoal-900">Procedure name <span className="text-red-500">*</span></label>
        <input value={name} onChange={(e) => setName(e.target.value)} required className={INPUT_CLS} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-charcoal-900">Performed by <span className="text-red-500">*</span></label>
          <input value={performedBy} onChange={(e) => setPerformedBy(e.target.value)} required className={INPUT_CLS} />
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal-900">Date <span className="text-red-500">*</span></label>
          <input type="date" value={performedAt} onChange={(e) => setPerformedAt(e.target.value)} required className={INPUT_CLS} />
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal-900">CPT code</label>
          <input value={cptCode} onChange={(e) => setCptCode(e.target.value)} className={INPUT_CLS} />
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal-900">Location</label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} className={INPUT_CLS} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-900">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={INPUT_CLS} />
      </div>
      <div>
        <p className="text-sm font-medium text-charcoal-900 mb-2">Pre-op checklist</p>
        <div className="space-y-2">
          {([
            ['consentObtained', 'Consent obtained'],
            ['npoStatus', 'NPO status confirmed'],
            ['allergiesConfirmed', 'Allergies confirmed'],
            ['siteMarked', 'Site marked'],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={checklist[key]} onChange={() => toggle(key)} className="rounded border-forest-900/20" />
              <span className="text-sm text-charcoal-900">{label}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <AppButton variant="ghost" onClick={() => DrawerService.dismissAllModals()}>Cancel</AppButton>
        <AppButton onClick={handleSubmit} loading={mutation.isPending}>Record procedure</AppButton>
      </div>
    </div>
  );
}

export function ProceduresScreen() {
  const slug = useHospitalSlug();
  const { activeHospitalId } = useAuth();
  const { code = '' } = useParams<{ slug: string; code: string }>();

  const { data: procedures, isLoading, error } = useProcedures(activeHospitalId ?? '', code);

  return (
    <ChartLayout slug={slug} patientCode={code}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Procedures</p>
          <AppButton
            variant="secondary"
            leadingIcon={<IconPlus size={14} />}
            onClick={() => DrawerService.showCustomModal('Record procedure', () => (
              <AddProcedureForm hospitalId={activeHospitalId ?? ''} patientId={code} />
            ))}
          >
            Record procedure
          </AppButton>
        </div>

        <Loadable
          loading={isLoading}
          error={error ?? undefined}
          loadingComponent={<div className="flex items-center justify-center py-16"><div className="h-6 w-6 animate-spin rounded-full border-2 border-forest-900/20 border-t-forest-900" /></div>}
          errorComponent={<p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error instanceof Error ? error.message : 'Failed to load procedures.'}</p>}
        >
          <Show
            when={(procedures?.length ?? 0) > 0}
            fallback={<p className="py-8 text-center text-sm text-charcoal-700/50">No procedures recorded.</p>}
          >
            <div className="divide-y divide-forest-900/10 rounded-xl border border-forest-900/10 overflow-hidden">
              <Repeat each={(procedures ?? []) as Procedure[]}>
                {(proc: Procedure) => (
                  <div key={proc.id} className="bg-white px-4 py-4 hover:bg-cream-50/60 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-charcoal-900">{proc.name}</p>
                        <p className="text-xs text-charcoal-700/60 mt-0.5">
                          {new Date(proc.performedAt).toLocaleDateString()} · {proc.performedBy}
                        </p>
                        <Show when={proc.location !== undefined}>
                          <p className="text-xs text-charcoal-700/60">{proc.location}</p>
                        </Show>
                        <Show when={proc.notes !== undefined}>
                          <p className="mt-1 text-xs text-charcoal-700">{proc.notes}</p>
                        </Show>
                      </div>
                      <Show when={proc.cptCode !== undefined}>
                        <span className="flex-shrink-0 font-mono text-xs text-charcoal-700/50">{proc.cptCode}</span>
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
