import { useState } from 'react';
import { AppButton, DrawerService } from '@medcord/ui';
import type { MedicalHistory } from '../../../../shared/types/emr.ts';
import { useUpdateHistory } from '../../api/use-history.ts';

const INPUT_CLS = 'mt-1 block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 placeholder-charcoal-700/50 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900 disabled:opacity-50';

interface HistoryEditFormProps {
  readonly history: MedicalHistory;
  readonly hospitalId: string;
  readonly patientId: string;
}

export function HistoryEditForm({ history, hospitalId, patientId }: HistoryEditFormProps) {
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
