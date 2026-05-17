import { useState } from 'react';
import { Repeat } from 'meemaw';
import { AppButton, DrawerService } from '@medcord/ui';
import { useAddProcedure, type AddProcedurePayload } from '../../api/use-procedures.ts';

const INPUT_CLS = 'mt-1 block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 placeholder-charcoal-700/50 focus:border-forest-900 focus:outline-none';

type ChecklistKey = 'consentObtained' | 'npoStatus' | 'allergiesConfirmed' | 'siteMarked';

const CHECKLIST_ITEMS: ReadonlyArray<{ key: ChecklistKey; label: string }> = [
  { key: 'consentObtained', label: 'Consent obtained' },
  { key: 'npoStatus', label: 'NPO status confirmed' },
  { key: 'allergiesConfirmed', label: 'Allergies confirmed' },
  { key: 'siteMarked', label: 'Site marked' },
];

interface AddProcedureFormProps {
  readonly hospitalId: string;
  readonly patientId: string;
}

export function AddProcedureForm({ hospitalId, patientId }: AddProcedureFormProps) {
  const mutation = useAddProcedure(hospitalId, patientId);
  const [name, setName] = useState('');
  const [performedBy, setPerformedBy] = useState('');
  const [performedAt, setPerformedAt] = useState('');
  const [cptCode, setCptCode] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [checklist, setChecklist] = useState<Record<ChecklistKey, boolean>>({
    consentObtained: false, npoStatus: false, allergiesConfirmed: false, siteMarked: false,
  });

  function toggle(key: ChecklistKey) {
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
          <Repeat each={CHECKLIST_ITEMS as Array<{ key: ChecklistKey; label: string }>}>
            {({ key, label }: { key: ChecklistKey; label: string }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={checklist[key]} onChange={() => toggle(key)} className="rounded border-forest-900/20" />
                <span className="text-sm text-charcoal-900">{label}</span>
              </label>
            )}
          </Repeat>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <AppButton variant="ghost" onClick={() => DrawerService.dismissAllModals()}>Cancel</AppButton>
        <AppButton onClick={handleSubmit} loading={mutation.isPending}>Record procedure</AppButton>
      </div>
    </div>
  );
}
