import { useState } from 'react';
import { AppButton, DrawerService } from '@medcord/ui';
import { useAddMedication, type AddMedicationPayload } from '../../api/use-medications.ts';

const INPUT_CLS = 'mt-1 block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 placeholder-charcoal-700/50 focus:border-forest-900 focus:outline-none';

interface AddMedicationFormProps {
  readonly hospitalId: string;
  readonly patientId: string;
}

export function AddMedicationForm({ hospitalId, patientId }: AddMedicationFormProps) {
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
      onError: (err: unknown) => {
        DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', { type: 'error' });
      },
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
