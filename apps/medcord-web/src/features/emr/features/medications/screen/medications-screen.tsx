import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loadable, Show, Repeat } from 'meemaw';
import { AppButton, DrawerService } from '@medcord/ui';
import { IconPlus } from '@icons';
import { useHospitalSlug } from '@shared/hooks/use-hospital-slug.ts';
import { useAuth } from '@shared/hooks/use-auth.ts';
import { ChartLayout } from '../../../shared/chart-layout.tsx';
import { useMedications, useAddMedication, useUpdateMedication, type AddMedicationPayload } from '../api/use-medications.ts';
import type { Medication, MedicationStatus } from '../../../shared/types/emr.ts';

const STATUS_STYLE: Record<MedicationStatus, string> = {
  active: 'text-[#166534] border-[#bbf7d0] bg-[#f0fdf4]',
  discontinued: 'text-charcoal-700 border-forest-900/10 bg-cream-50',
  on_hold: 'text-[#92400e] border-[#fde68a] bg-[#fffbeb]',
};

const STATUS_LABEL: Record<MedicationStatus, string> = {
  active: 'Active',
  discontinued: 'Discontinued',
  on_hold: 'On hold',
};

const INPUT_CLS = 'mt-1 block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 placeholder-charcoal-700/50 focus:border-forest-900 focus:outline-none';

function AddMedicationForm({ hospitalId, patientId }: { hospitalId: string; patientId: string }) {
  const mutation = useAddMedication(hospitalId, patientId);
  const [drug, setDrug] = useState('');
  const [strength, setStrength] = useState('');
  const [route, setRoute] = useState('');
  const [frequency, setFrequency] = useState('');
  const [indication, setIndication] = useState('');
  const [duration, setDuration] = useState('');

  function handleSubmit() {
    if (!drug.trim()) return;
    const payload: AddMedicationPayload = {
      drug: drug.trim(),
      strength: strength.trim() || undefined,
      route: route.trim() || undefined,
      frequency: frequency.trim() || undefined,
      indication: indication.trim() || undefined,
      duration: duration.trim() || undefined,
    };
    mutation.mutate(payload, {
      onSuccess: () => { DrawerService.dismissAllModals(); },
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-charcoal-900">Drug <span className="text-red-500">*</span></label>
        <input value={drug} onChange={(e) => setDrug(e.target.value)} required className={INPUT_CLS} placeholder="e.g. Amoxicillin" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-charcoal-900">Strength</label>
          <input value={strength} onChange={(e) => setStrength(e.target.value)} className={INPUT_CLS} placeholder="e.g. 500mg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal-900">Route</label>
          <input value={route} onChange={(e) => setRoute(e.target.value)} className={INPUT_CLS} placeholder="e.g. Oral" />
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal-900">Frequency</label>
          <input value={frequency} onChange={(e) => setFrequency(e.target.value)} className={INPUT_CLS} placeholder="e.g. TID" />
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal-900">Duration</label>
          <input value={duration} onChange={(e) => setDuration(e.target.value)} className={INPUT_CLS} placeholder="e.g. 7 days" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-charcoal-900">Indication</label>
          <input value={indication} onChange={(e) => setIndication(e.target.value)} className={INPUT_CLS} placeholder="Reason for prescribing" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <AppButton variant="ghost" onClick={() => DrawerService.dismissAllModals()}>Cancel</AppButton>
        <AppButton onClick={handleSubmit} loading={mutation.isPending}>Add medication</AppButton>
      </div>
    </div>
  );
}

function UpdateMedicationForm({ med, hospitalId, patientId }: { med: Medication; hospitalId: string; patientId: string }) {
  const mutation = useUpdateMedication(hospitalId, patientId);
  const [status, setStatus] = useState<MedicationStatus>(med.status);
  const [reason, setReason] = useState('');

  function handleSubmit() {
    mutation.mutate({ medId: med.id, status, reason: reason.trim() || undefined }, {
      onSuccess: () => { DrawerService.dismissAllModals(); },
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-charcoal-700">{med.drug} — {med.strength ?? 'no strength specified'}</p>
      <div>
        <label className="block text-sm font-medium text-charcoal-900">New status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value as MedicationStatus)} disabled={mutation.isPending} className={INPUT_CLS}>
          <option value="active">Active</option>
          <option value="on_hold">On hold</option>
          <option value="discontinued">Discontinued</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-900">Reason (if discontinuing)</label>
        <input value={reason} onChange={(e) => setReason(e.target.value)} disabled={mutation.isPending} className={INPUT_CLS} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <AppButton variant="ghost" onClick={() => DrawerService.dismissAllModals()}>Cancel</AppButton>
        <AppButton onClick={handleSubmit} loading={mutation.isPending}>Update</AppButton>
      </div>
    </div>
  );
}

export function MedicationsScreen() {
  const slug = useHospitalSlug();
  const { activeHospitalId } = useAuth();
  const { code = '' } = useParams<{ slug: string; code: string }>();

  const { data: medications, isLoading, error } = useMedications(activeHospitalId ?? '', code);

  function handleUpdate(med: Medication) {
    DrawerService.showCustomModal('Update medication', () => (
      <UpdateMedicationForm med={med} hospitalId={activeHospitalId ?? ''} patientId={code} />
    ));
  }

  return (
    <ChartLayout slug={slug} patientCode={code}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Medications</p>
          <AppButton
            variant="secondary"
            leadingIcon={<IconPlus size={14} />}
            onClick={() => DrawerService.showCustomModal('Add medication', () => (
              <AddMedicationForm hospitalId={activeHospitalId ?? ''} patientId={code} />
            ))}
          >
            Add medication
          </AppButton>
        </div>

        <Loadable
          loading={isLoading}
          error={error ?? undefined}
          loadingComponent={<div className="flex items-center justify-center py-16"><div className="h-6 w-6 animate-spin rounded-full border-2 border-forest-900/20 border-t-forest-900" /></div>}
          errorComponent={<p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error instanceof Error ? error.message : 'Failed to load medications.'}</p>}
        >
          <Show
            when={(medications?.length ?? 0) > 0}
            fallback={<p className="py-8 text-center text-sm text-charcoal-700/50">No medications recorded.</p>}
          >
            <div className="divide-y divide-forest-900/10 rounded-xl border border-forest-900/10 overflow-hidden">
              <Repeat each={(medications ?? []) as Medication[]}>
                {(med: Medication) => (
                  <div key={med.id} className="flex items-start justify-between gap-4 bg-white px-4 py-4 hover:bg-cream-50/60 transition-colors">
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-sm font-medium text-charcoal-900">{med.drug}</p>
                      <p className="text-xs text-charcoal-700/60">
                        {[med.strength, med.route, med.frequency].filter(Boolean).join(' · ')}
                      </p>
                      <Show when={med.indication !== undefined}>
                        <p className="text-xs text-charcoal-700/60">Indication: {med.indication}</p>
                      </Show>
                      <p className="text-xs text-charcoal-700/40">Prescribed by {med.prescribedBy}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[med.status]}`}>
                        {STATUS_LABEL[med.status]}
                      </span>
                      <AppButton variant="ghost" onClick={() => handleUpdate(med)}>Update</AppButton>
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
