import { Repeat } from 'meemaw';
import type { RegisterPatientPayload } from '../../api/use-register-patient.ts';

const INPUT_CLS = 'mt-1 block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 placeholder-charcoal-700/50 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900 disabled:cursor-not-allowed disabled:opacity-50';

const SEX_OPTIONS: ReadonlyArray<{ readonly value: string; readonly label: string }> = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

type DemographicsValues = RegisterPatientPayload['demographics'];

interface DemographicsFormProps {
  readonly values: DemographicsValues;
  readonly onChange: (values: DemographicsValues) => void;
  readonly disabled: boolean;
}

export function DemographicsForm({ values, onChange, disabled }: DemographicsFormProps) {
  function set<K extends keyof DemographicsValues>(key: K, value: DemographicsValues[K]) {
    onChange({ ...values, [key]: value });
  }

  return (
    <div className="rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Demographics</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-charcoal-900">First name <span className="text-red-500">*</span></label>
          <input value={values.firstName} onChange={(e) => set('firstName', e.target.value)} required disabled={disabled} className={INPUT_CLS} />
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal-900">Last name <span className="text-red-500">*</span></label>
          <input value={values.lastName} onChange={(e) => set('lastName', e.target.value)} required disabled={disabled} className={INPUT_CLS} />
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal-900">Preferred name</label>
          <input value={values.preferredName ?? ''} onChange={(e) => set('preferredName', e.target.value || undefined)} disabled={disabled} className={INPUT_CLS} />
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal-900">Date of birth <span className="text-red-500">*</span></label>
          <input type="date" value={values.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} required disabled={disabled} className={INPUT_CLS} />
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal-900">Sex <span className="text-red-500">*</span></label>
          <select value={values.sex} onChange={(e) => set('sex', e.target.value as 'male' | 'female' | 'other')} disabled={disabled} className={INPUT_CLS}>
            <Repeat each={SEX_OPTIONS as Array<{ value: string; label: string }>} >
              {(opt: { value: string; label: string }) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              )}
            </Repeat>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal-900">Gender identity</label>
          <input value={values.gender ?? ''} onChange={(e) => set('gender', e.target.value || undefined)} disabled={disabled} placeholder="Optional" className={INPUT_CLS} />
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal-900">Phone</label>
          <input type="tel" value={values.phone ?? ''} onChange={(e) => set('phone', e.target.value || undefined)} disabled={disabled} className={INPUT_CLS} />
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal-900">Email</label>
          <input type="email" value={values.email ?? ''} onChange={(e) => set('email', e.target.value || undefined)} disabled={disabled} className={INPUT_CLS} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-charcoal-900">Address</label>
          <input value={values.address ?? ''} onChange={(e) => set('address', e.target.value || undefined)} disabled={disabled} className={INPUT_CLS} />
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal-900">Religion</label>
          <input value={values.religion ?? ''} onChange={(e) => set('religion', e.target.value || undefined)} disabled={disabled} className={INPUT_CLS} />
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal-900">Cultural preferences</label>
          <input value={values.culturalPreferences ?? ''} onChange={(e) => set('culturalPreferences', e.target.value || undefined)} disabled={disabled} className={INPUT_CLS} />
        </div>
      </div>
    </div>
  );
}
