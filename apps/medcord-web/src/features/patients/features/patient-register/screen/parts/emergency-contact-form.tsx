const INPUT_CLS = 'mt-1 block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 placeholder-charcoal-700/50 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900 disabled:cursor-not-allowed disabled:opacity-50';

interface EmergencyContactValues {
  readonly name: string;
  readonly relationship: string;
  readonly phone: string;
}

interface EmergencyContactFormProps {
  readonly values: EmergencyContactValues;
  readonly onChange: (values: EmergencyContactValues) => void;
  readonly disabled: boolean;
}

export function EmergencyContactForm({ values, onChange, disabled }: EmergencyContactFormProps) {
  function set<K extends keyof EmergencyContactValues>(key: K, value: string) {
    onChange({ ...values, [key]: value });
  }

  return (
    <div className="rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Emergency contact</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-charcoal-900">Name</label>
          <input value={values.name} onChange={(e) => set('name', e.target.value)} disabled={disabled} className={INPUT_CLS} />
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal-900">Relationship</label>
          <input value={values.relationship} onChange={(e) => set('relationship', e.target.value)} disabled={disabled} placeholder="e.g. Spouse, Parent" className={INPUT_CLS} />
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal-900">Phone</label>
          <input type="tel" value={values.phone} onChange={(e) => set('phone', e.target.value)} disabled={disabled} className={INPUT_CLS} />
        </div>
      </div>
    </div>
  );
}
