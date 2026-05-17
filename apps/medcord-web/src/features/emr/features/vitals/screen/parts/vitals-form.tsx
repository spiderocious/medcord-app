import { useState } from 'react';
import { Repeat } from 'meemaw';
import { AppButton, DrawerService } from '@medcord/ui';
import { useRecordVitals, type RecordVitalsPayload } from '../../api/use-vitals.ts';

const INPUT_CLS = 'mt-1 block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 placeholder-charcoal-700/50 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900 disabled:opacity-50';

interface VitalsFormProps {
  readonly hospitalId: string;
  readonly patientId: string;
}

const FIELDS: ReadonlyArray<{ key: string; label: string }> = [
  { key: 'bp_systolic', label: 'Systolic BP (mmHg)' },
  { key: 'bp_diastolic', label: 'Diastolic BP (mmHg)' },
  { key: 'hr', label: 'Heart rate (bpm)' },
  { key: 'rr', label: 'Respiratory rate (/min)' },
  { key: 'temp', label: 'Temperature (°C)' },
  { key: 'spo2', label: 'SpO₂ (%)' },
  { key: 'weight', label: 'Weight (kg)' },
  { key: 'height', label: 'Height (cm)' },
  { key: 'painScore', label: 'Pain score (0–10)' },
];

export function VitalsForm({ hospitalId, patientId }: VitalsFormProps) {
  const mutation = useRecordVitals(hospitalId, patientId);
  const [fields, setFields] = useState<Record<string, string>>({});

  function set(key: string, val: string) { setFields((prev) => ({ ...prev, [key]: val })); }
  function num(key: string): number | undefined {
    const v = fields[key];
    return v && v.trim() !== '' ? Number(v) : undefined;
  }

  function handleSubmit() {
    const payload: RecordVitalsPayload = {
      bp_systolic: num('bp_systolic'),
      bp_diastolic: num('bp_diastolic'),
      hr: num('hr'),
      rr: num('rr'),
      temp: num('temp'),
      spo2: num('spo2'),
      weight: num('weight'),
      height: num('height'),
      painScore: num('painScore'),
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
      <div className="grid gap-3 sm:grid-cols-2">
        <Repeat each={FIELDS as Array<{ key: string; label: string }>}>
          {({ key, label }: { key: string; label: string }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-charcoal-900">{label}</label>
              <input type="number" step="0.1" value={fields[key] ?? ''} onChange={(e) => set(key, e.target.value)} disabled={mutation.isPending} className={INPUT_CLS} />
            </div>
          )}
        </Repeat>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <AppButton variant="ghost" onClick={() => DrawerService.dismissAllModals()}>Cancel</AppButton>
        <AppButton onClick={handleSubmit} loading={mutation.isPending}>Record vitals</AppButton>
      </div>
    </div>
  );
}
