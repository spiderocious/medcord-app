import { useState, type FormEvent } from 'react';
import { Repeat } from 'meemaw';

import { AppButton } from '@medcord/ui';
import type { HospitalType } from '@shared/types/hospital.ts';
import { useHospitalCreate } from '../../providers/hospital-create-provider.tsx';

const INPUT_CLS =
  'mt-1 block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 placeholder-charcoal-700/50 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900 disabled:cursor-not-allowed disabled:opacity-50';

interface HospitalTypeOption {
  readonly value: HospitalType;
  readonly label: string;
}

const HOSPITAL_TYPES: ReadonlyArray<HospitalTypeOption> = [
  { value: 'general', label: 'General Hospital' },
  { value: 'specialty', label: 'Specialty Hospital' },
  { value: 'clinic', label: 'Clinic' },
  { value: 'teaching', label: 'Teaching Hospital' },
  { value: 'other', label: 'Other' },
];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 63);
}

export function StepBasicInfo() {
  const { draft, setDraft, goToReview } = useHospitalCreate();

  const [subdomainTouched, setSubdomainTouched] = useState(false);

  function handleNameChange(value: string) {
    const patch: { name: string; subdomain?: string } = { name: value };
    if (!subdomainTouched) patch.subdomain = slugify(value);
    setDraft(patch);
  }

  function handleSubdomainChange(value: string) {
    setSubdomainTouched(true);
    setDraft({ subdomain: slugify(value) });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    goToReview();
  }

  const isValid =
    draft.name.trim() !== '' &&
    draft.location.trim() !== '' &&
    draft.subdomain.length >= 3;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="sbi-name" className="block text-sm font-medium text-charcoal-900">
          Hospital name
        </label>
        <input
          id="sbi-name"
          required
          value={draft.name}
          onChange={(e) => handleNameChange(e.target.value)}
          className={INPUT_CLS}
          placeholder="City General Hospital"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="sbi-type" className="block text-sm font-medium text-charcoal-900">
            Type
          </label>
          <select
            id="sbi-type"
            value={draft.type}
            onChange={(e) => setDraft({ type: e.target.value as HospitalType })}
            className={INPUT_CLS}
          >
            <Repeat each={HOSPITAL_TYPES as HospitalTypeOption[]}>
              {(t: HospitalTypeOption) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              )}
            </Repeat>
          </select>
        </div>

        <div>
          <label htmlFor="sbi-tz" className="block text-sm font-medium text-charcoal-900">
            Timezone
          </label>
          <input
            id="sbi-tz"
            value={draft.timezone}
            onChange={(e) => setDraft({ timezone: e.target.value })}
            className={INPUT_CLS}
            placeholder="UTC"
          />
        </div>
      </div>

      <div>
        <label htmlFor="sbi-location" className="block text-sm font-medium text-charcoal-900">
          Location
        </label>
        <input
          id="sbi-location"
          required
          value={draft.location}
          onChange={(e) => setDraft({ location: e.target.value })}
          className={INPUT_CLS}
          placeholder="Lagos, Nigeria"
        />
      </div>

      <div>
        <label htmlFor="sbi-subdomain" className="block text-sm font-medium text-charcoal-900">
          Workspace URL
        </label>
        <div className="mt-1 flex rounded-lg border border-forest-900/20 bg-white focus-within:border-forest-900 focus-within:ring-1 focus-within:ring-forest-900">
          <input
            id="sbi-subdomain"
            required
            value={draft.subdomain}
            onChange={(e) => handleSubdomainChange(e.target.value)}
            pattern="[a-z0-9-]+"
            minLength={3}
            maxLength={63}
            className="min-w-0 flex-1 rounded-l-lg bg-transparent px-3 py-2 text-sm text-charcoal-900 placeholder-charcoal-700/50 focus:outline-none"
            placeholder="city-general"
          />
          <span className="flex items-center rounded-r-lg border-l border-forest-900/20 bg-forest-900/5 px-3 text-sm text-charcoal-700 select-none">
            .medcord.app
          </span>
        </div>
        <p className="mt-1 text-xs text-charcoal-700/70">Lowercase letters, numbers and hyphens only. Min 3 characters.</p>
      </div>

      <div className="border-t border-forest-900/10 pt-5">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Contact (optional)</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="sbi-phone" className="block text-sm font-medium text-charcoal-900">Phone</label>
            <input
              id="sbi-phone"
              type="tel"
              value={draft.phone}
              onChange={(e) => setDraft({ phone: e.target.value })}
              className={INPUT_CLS}
              placeholder="+234 800 000 0000"
            />
          </div>
          <div>
            <label htmlFor="sbi-email" className="block text-sm font-medium text-charcoal-900">Email</label>
            <input
              id="sbi-email"
              type="email"
              value={draft.email}
              onChange={(e) => setDraft({ email: e.target.value })}
              className={INPUT_CLS}
              placeholder="admin@hospital.ng"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="sbi-address" className="block text-sm font-medium text-charcoal-900">Address</label>
            <input
              id="sbi-address"
              value={draft.address}
              onChange={(e) => setDraft({ address: e.target.value })}
              className={INPUT_CLS}
              placeholder="123 Hospital Road"
            />
          </div>
        </div>
      </div>

      <AppButton type="submit" disabled={!isValid} className="w-full">
        Continue to review
      </AppButton>
    </form>
  );
}
