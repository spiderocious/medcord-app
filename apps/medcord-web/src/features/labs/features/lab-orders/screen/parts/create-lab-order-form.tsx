import { useState } from 'react';
import { AppButton, DrawerService } from '@medcord/ui';
import { useCreateLabOrder } from '../../api/use-lab-orders.ts';

const INPUT_CLS = 'mt-1 block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 placeholder-charcoal-700/50 focus:border-forest-900 focus:outline-none';

interface CreateLabOrderFormProps {
  readonly hospitalId: string;
  readonly patientId: string;
}

export function CreateLabOrderForm({ hospitalId, patientId }: CreateLabOrderFormProps) {
  const mutation = useCreateLabOrder(hospitalId, patientId);
  const [testName, setTestName] = useState('');
  const [testCode, setTestCode] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<'routine' | 'urgent' | 'stat'>('routine');
  const [sampleType, setSampleType] = useState('');
  const [notes, setNotes] = useState('');

  function handleSubmit() {
    if (!testName.trim()) return;
    mutation.mutate(
      {
        testName: testName.trim(),
        testCode: testCode.trim() || undefined,
        category: category.trim() || undefined,
        priority,
        sampleType: sampleType.trim() || undefined,
        notes: notes.trim() || undefined,
      },
      { onSuccess: () => { DrawerService.dismissAllModals(); } }
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-charcoal-900">Test name <span className="text-red-500">*</span></label>
        <input value={testName} onChange={(e) => setTestName(e.target.value)} required disabled={mutation.isPending} className={INPUT_CLS} placeholder="e.g. Complete blood count" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-charcoal-900">Test code</label>
          <input value={testCode} onChange={(e) => setTestCode(e.target.value)} disabled={mutation.isPending} className={INPUT_CLS} placeholder="e.g. CBC" />
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal-900">Category</label>
          <input value={category} onChange={(e) => setCategory(e.target.value)} disabled={mutation.isPending} className={INPUT_CLS} placeholder="e.g. Haematology" />
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal-900">Priority</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value as 'routine' | 'urgent' | 'stat')} disabled={mutation.isPending} className={INPUT_CLS}>
            <option value="routine">Routine</option>
            <option value="urgent">Urgent</option>
            <option value="stat">STAT</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal-900">Sample type</label>
          <input value={sampleType} onChange={(e) => setSampleType(e.target.value)} disabled={mutation.isPending} className={INPUT_CLS} placeholder="e.g. Venous blood" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-900">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} disabled={mutation.isPending} className={INPUT_CLS} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <AppButton variant="ghost" onClick={() => DrawerService.dismissAllModals()}>Cancel</AppButton>
        <AppButton onClick={handleSubmit} loading={mutation.isPending}>Create order</AppButton>
      </div>
    </div>
  );
}
