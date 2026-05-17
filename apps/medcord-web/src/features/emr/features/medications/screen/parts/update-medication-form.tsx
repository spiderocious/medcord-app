import { useState } from 'react';
import { AppButton, DrawerService } from '@medcord/ui';
import type { Medication, MedicationStatus } from '../../../../shared/types/emr.ts';
import { useUpdateMedication } from '../../api/use-medications.ts';

const INPUT_CLS = 'mt-1 block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 placeholder-charcoal-700/50 focus:border-forest-900 focus:outline-none';

interface UpdateMedicationFormProps {
  readonly med: Medication;
  readonly hospitalId: string;
  readonly patientId: string;
}

export function UpdateMedicationForm({ med, hospitalId, patientId }: UpdateMedicationFormProps) {
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
