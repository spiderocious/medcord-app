import { useState, type FormEvent } from 'react';
import { Show } from 'meemaw';

import { AppButton, AppText } from '@medcord/ui';
import { parseApiError } from '@medcord/api';
import type { Hospital } from '@shared/types/hospital.ts';
import { useUpdateHospital } from '../../api/use-update-hospital.ts';

const INPUT_CLS =
  'mt-1 block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 placeholder-charcoal-700/50 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900 disabled:cursor-not-allowed disabled:opacity-50';

const HOSPITAL_TYPES: ReadonlyArray<{ readonly value: Hospital['type']; readonly label: string }> = [
  { value: 'general', label: 'General Hospital' },
  { value: 'specialty', label: 'Specialty Hospital' },
  { value: 'clinic', label: 'Clinic' },
  { value: 'teaching', label: 'Teaching Hospital' },
  { value: 'other', label: 'Other' },
];

interface SettingsGeneralProps {
  readonly hospital: Hospital;
}

export function SettingsGeneral({ hospital }: SettingsGeneralProps) {
  const mutation = useUpdateHospital(hospital.id);

  const [name, setName] = useState(hospital.name);
  const [type, setType] = useState<Hospital['type']>(hospital.type);
  const [location, setLocation] = useState(hospital.location);
  const [phone, setPhone] = useState(hospital.contact?.phone ?? '');
  const [email, setEmail] = useState(hospital.contact?.email ?? '');
  const [address, setAddress] = useState(hospital.contact?.address ?? '');
  const [timezone, setTimezone] = useState(hospital.timezone);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    try {
      await mutation.mutateAsync({
        name: name.trim(),
        type,
        location: location.trim(),
        timezone: timezone.trim(),
        contact: {
          phone: phone.trim() !== '' ? phone.trim() : undefined,
          email: email.trim() !== '' ? email.trim() : undefined,
          address: address.trim() !== '' ? address.trim() : undefined,
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError(parseApiError(err).message);
    }
  }

  return (
    <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-6">
      <div>
        <AppText variant="heading-3" className="text-charcoal-900">General</AppText>
        <AppText variant="body-sm" className="mt-1 text-charcoal-700">
          Basic information about your hospital workspace.
        </AppText>
      </div>

      <div className="rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm space-y-5 sm:p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="sg-name" className="block text-sm font-medium text-charcoal-900">Hospital name</label>
            <input id="sg-name" required value={name} onChange={(e) => setName(e.target.value)}
              disabled={mutation.isPending} className={INPUT_CLS} placeholder="City General Hospital" />
          </div>

          <div>
            <label htmlFor="sg-type" className="block text-sm font-medium text-charcoal-900">Type</label>
            <select id="sg-type" value={type} onChange={(e) => setType(e.target.value as Hospital['type'])}
              disabled={mutation.isPending} className={INPUT_CLS}>
              {HOSPITAL_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="sg-timezone" className="block text-sm font-medium text-charcoal-900">Timezone</label>
            <input id="sg-timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)}
              disabled={mutation.isPending} className={INPUT_CLS} placeholder="UTC" />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="sg-location" className="block text-sm font-medium text-charcoal-900">Location</label>
            <input id="sg-location" required value={location} onChange={(e) => setLocation(e.target.value)}
              disabled={mutation.isPending} className={INPUT_CLS} placeholder="Lagos, Nigeria" />
          </div>
        </div>

        <div className="border-t border-forest-900/10 pt-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Contact</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="sg-phone" className="block text-sm font-medium text-charcoal-900">Phone</label>
              <input id="sg-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                disabled={mutation.isPending} className={INPUT_CLS} placeholder="+234 800 000 0000" />
            </div>
            <div>
              <label htmlFor="sg-email" className="block text-sm font-medium text-charcoal-900">Email</label>
              <input id="sg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                disabled={mutation.isPending} className={INPUT_CLS} placeholder="admin@hospital.ng" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="sg-address" className="block text-sm font-medium text-charcoal-900">Address</label>
              <input id="sg-address" value={address} onChange={(e) => setAddress(e.target.value)}
                disabled={mutation.isPending} className={INPUT_CLS} placeholder="123 Hospital Road" />
            </div>
          </div>
        </div>
      </div>

      <Show when={error !== null}>
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      </Show>

      <div className="flex items-center gap-3">
        <AppButton type="submit" loading={mutation.isPending}>
          Save changes
        </AppButton>
        <Show when={saved}>
          <span className="text-sm text-forest-900">Saved!</span>
        </Show>
      </div>
    </form>
  );
}
