import { useState } from 'react';
import { AppButton, DrawerService } from '@medcord/ui';
import { useAddImmunization, type AddImmunizationPayload } from '../../api/use-immunizations.ts';

const INPUT_CLS = 'mt-1 block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 placeholder-charcoal-700/50 focus:border-forest-900 focus:outline-none';

interface AddImmunizationFormProps {
  readonly hospitalId: string;
  readonly patientId: string;
}

export function AddImmunizationForm({ hospitalId, patientId }: AddImmunizationFormProps) {
  const mutation = useAddImmunization(hospitalId, patientId);
  const [vaccine, setVaccine] = useState('');
  const [dose, setDose] = useState('');
  const [administeredAt, setAdministeredAt] = useState('');
  const [administrator, setAdministrator] = useState('');
  const [lotNumber, setLotNumber] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');

  function handleSubmit() {
    if (!vaccine.trim() || !administeredAt || !administrator.trim()) return;
    const payload: AddImmunizationPayload = {
      vaccine: vaccine.trim(),
      dose: dose.trim() || undefined,
      administeredAt,
      administrator: administrator.trim(),
      lotNumber: lotNumber.trim() || undefined,
      nextDueDate: nextDueDate || undefined,
    };
    mutation.mutate(payload, { onSuccess: () => { DrawerService.dismissAllModals(); } });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-charcoal-900">Vaccine <span className="text-red-500">*</span></label>
        <input value={vaccine} onChange={(e) => setVaccine(e.target.value)} required className={INPUT_CLS} placeholder="e.g. Hepatitis B" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-charcoal-900">Dose</label>
          <input value={dose} onChange={(e) => setDose(e.target.value)} className={INPUT_CLS} placeholder="e.g. Dose 1 of 3" />
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal-900">Date administered <span className="text-red-500">*</span></label>
          <input type="date" value={administeredAt} onChange={(e) => setAdministeredAt(e.target.value)} required className={INPUT_CLS} />
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal-900">Administrator <span className="text-red-500">*</span></label>
          <input value={administrator} onChange={(e) => setAdministrator(e.target.value)} required className={INPUT_CLS} />
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal-900">Lot number</label>
          <input value={lotNumber} onChange={(e) => setLotNumber(e.target.value)} className={INPUT_CLS} />
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal-900">Next due date</label>
          <input type="date" value={nextDueDate} onChange={(e) => setNextDueDate(e.target.value)} className={INPUT_CLS} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <AppButton variant="ghost" onClick={() => DrawerService.dismissAllModals()}>Cancel</AppButton>
        <AppButton onClick={handleSubmit} loading={mutation.isPending}>Record immunization</AppButton>
      </div>
    </div>
  );
}
