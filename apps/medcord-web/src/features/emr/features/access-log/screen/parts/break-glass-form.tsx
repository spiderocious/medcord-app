import { useState } from 'react';
import { AppButton, DrawerService } from '@medcord/ui';
import { useBreakGlass } from '../../api/use-access-log.ts';

const INPUT_CLS = 'mt-1 block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 focus:border-forest-900 focus:outline-none';

interface BreakGlassFormProps {
  readonly hospitalId: string;
  readonly patientId: string;
}

export function BreakGlassForm({ hospitalId, patientId }: BreakGlassFormProps) {
  const mutation = useBreakGlass(hospitalId, patientId);
  const [reason, setReason] = useState('');

  function handleConfirm() {
    if (!reason.trim()) return;
    mutation.mutate(reason.trim(), { onSuccess: () => { DrawerService.dismissAllModals(); } });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
        <p className="text-sm font-medium text-amber-900">Emergency access override</p>
        <p className="mt-0.5 text-xs text-amber-700">This action will be logged and audited.</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-900">Reason for emergency access <span className="text-red-500">*</span></label>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} disabled={mutation.isPending} className={INPUT_CLS} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <AppButton variant="ghost" onClick={() => DrawerService.dismissAllModals()}>Cancel</AppButton>
        <AppButton onClick={handleConfirm} loading={mutation.isPending}>Confirm emergency access</AppButton>
      </div>
    </div>
  );
}
