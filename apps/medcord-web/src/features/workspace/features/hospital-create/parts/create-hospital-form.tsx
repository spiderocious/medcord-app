import { useState } from 'react';
import { Show } from 'meemaw';

import { AppButton } from '@medcord/ui';
import type { HospitalType } from '@shared/types/hospital.ts';
import type { CreateHospitalInput } from '../api/use-create-hospital.ts';

interface ReadonlyProps {
  readonly onSubmit: (input: CreateHospitalInput) => Promise<void>;
  readonly isLoading: boolean;
  readonly error: string | null;
}

const HOSPITAL_TYPES: ReadonlyArray<{ readonly value: HospitalType; readonly label: string }> = [
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

const INPUT_CLS =
  'mt-1 block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 placeholder-charcoal-700/50 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900 disabled:opacity-50 disabled:cursor-not-allowed';

export function CreateHospitalForm({ onSubmit, isLoading, error }: ReadonlyProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<HospitalType>('general');
  const [location, setLocation] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [subdomainTouched, setSubdomainTouched] = useState(false);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  function handleNameChange(value: string) {
    setName(value);
    if (!subdomainTouched) {
      setSubdomain(slugify(value));
    }
  }

  function handleSubdomainChange(value: string) {
    setSubdomainTouched(true);
    setSubdomain(slugify(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input: CreateHospitalInput = {
      name: name.trim(),
      type,
      location: location.trim(),
      subdomain,
      ...(phone.trim() !== '' || email.trim() !== ''
        ? {
            contact: {
              ...(phone.trim() !== '' ? { phone: phone.trim() } : {}),
              ...(email.trim() !== '' ? { email: email.trim() } : {}),
            },
          }
        : {}),
    };
    await onSubmit(input);
  }

  return (
    <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-5">
      <Show when={error != null}>
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      </Show>

      {/* Hospital name */}
      <div>
        <label htmlFor="hc-name" className="block text-sm font-medium text-charcoal-900">
          Hospital name
        </label>
        <input
          id="hc-name"
          required
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="City General Hospital"
          disabled={isLoading}
          className={INPUT_CLS}
        />
      </div>

      {/* Type */}
      <div>
        <label htmlFor="hc-type" className="block text-sm font-medium text-charcoal-900">
          Type
        </label>
        <select
          id="hc-type"
          value={type}
          onChange={(e) => setType(e.target.value as HospitalType)}
          disabled={isLoading}
          className={INPUT_CLS}
        >
          {HOSPITAL_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Location */}
      <div>
        <label htmlFor="hc-location" className="block text-sm font-medium text-charcoal-900">
          Location
        </label>
        <input
          id="hc-location"
          required
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Lagos, Nigeria"
          disabled={isLoading}
          className={INPUT_CLS}
        />
      </div>

      {/* Subdomain */}
      <div>
        <label htmlFor="hc-subdomain" className="block text-sm font-medium text-charcoal-900">
          Workspace URL
        </label>
        <div className="mt-1 flex rounded-lg border border-forest-900/20 bg-white focus-within:border-forest-900 focus-within:ring-1 focus-within:ring-forest-900">
          <input
            id="hc-subdomain"
            required
            value={subdomain}
            onChange={(e) => handleSubdomainChange(e.target.value)}
            placeholder="city-general"
            disabled={isLoading}
            pattern="[a-z0-9-]+"
            minLength={3}
            maxLength={63}
            className="min-w-0 flex-1 rounded-l-lg bg-transparent px-3 py-2 text-sm text-charcoal-900 placeholder-charcoal-700/50 focus:outline-none disabled:opacity-50"
          />
          <span className="flex items-center rounded-r-lg bg-forest-900/5 px-3 text-sm text-charcoal-700 border-l border-forest-900/20 select-none">
            .medcord.app
          </span>
        </div>
        <p className="mt-1 text-xs text-charcoal-700/70">
          Lowercase letters, numbers and hyphens only.
        </p>
      </div>

      {/* Optional contact */}
      <div className="border-t border-forest-900/10 pt-5">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">
          Contact (optional)
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="hc-phone" className="block text-sm font-medium text-charcoal-900">
              Phone
            </label>
            <input
              id="hc-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+234 800 000 0000"
              disabled={isLoading}
              className={INPUT_CLS}
            />
          </div>
          <div>
            <label htmlFor="hc-email" className="block text-sm font-medium text-charcoal-900">
              Email
            </label>
            <input
              id="hc-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@hospital.ng"
              disabled={isLoading}
              className={INPUT_CLS}
            />
          </div>
        </div>
      </div>

      <AppButton
        type="submit"
        loading={isLoading}
        disabled={name.trim() === '' || location.trim() === '' || subdomain === ''}
        className="w-full"
      >
        Create hospital
      </AppButton>
    </form>
  );
}
