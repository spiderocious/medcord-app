import { useState, type FormEvent } from 'react';
import { Show } from 'meemaw';

import { AppButton, AppText } from '@medcord/ui';
import { parseApiError } from '@medcord/api';
import type { Hospital } from '@shared/types/hospital.ts';
import { useUpdateBranding } from '../../api/use-update-branding.ts';

const INPUT_CLS =
  'mt-1 block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 placeholder-charcoal-700/50 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900 disabled:cursor-not-allowed disabled:opacity-50';

const LOGO_POSITIONS: ReadonlyArray<{ readonly value: 'left' | 'center' | 'right'; readonly label: string }> = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
];

interface SettingsBrandingProps {
  readonly hospital: Hospital;
}

export function SettingsBranding({ hospital }: SettingsBrandingProps) {
  const mutation = useUpdateBranding(hospital.id);

  const [primaryColor, setPrimaryColor] = useState(hospital.branding.primaryColor ?? '#1a2e1a');
  const [accentColor, setAccentColor] = useState(hospital.branding.accentColor ?? '#f5f0e8');
  const [logoPosition, setLogoPosition] = useState<'left' | 'center' | 'right'>(
    hospital.branding.idCardLogoPosition ?? 'left',
  );
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    try {
      await mutation.mutateAsync({
        primaryColor,
        accentColor,
        idCardLogoPosition: logoPosition,
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
        <AppText variant="heading-3" className="text-charcoal-900">Branding</AppText>
        <AppText variant="body-sm" className="mt-1 text-charcoal-700">
          Colours and ID card configuration for your hospital.
        </AppText>
      </div>

      <div className="rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm space-y-5 sm:p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="sb-primary" className="block text-sm font-medium text-charcoal-900">
              Primary colour
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                id="sb-primary"
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                disabled={mutation.isPending}
                className="h-9 w-12 cursor-pointer rounded-lg border border-forest-900/20 bg-white p-1 disabled:opacity-50"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                disabled={mutation.isPending}
                className="flex-1 rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900 disabled:opacity-50"
                placeholder="#1a2e1a"
              />
            </div>
          </div>

          <div>
            <label htmlFor="sb-accent" className="block text-sm font-medium text-charcoal-900">
              Accent colour
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                id="sb-accent"
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                disabled={mutation.isPending}
                className="h-9 w-12 cursor-pointer rounded-lg border border-forest-900/20 bg-white p-1 disabled:opacity-50"
              />
              <input
                type="text"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                disabled={mutation.isPending}
                className="flex-1 rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900 disabled:opacity-50"
                placeholder="#f5f0e8"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-forest-900/10 pt-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">ID Card</p>
          <div>
            <label htmlFor="sb-logo-pos" className="block text-sm font-medium text-charcoal-900">
              Logo position
            </label>
            <select
              id="sb-logo-pos"
              value={logoPosition}
              onChange={(e) => setLogoPosition(e.target.value as 'left' | 'center' | 'right')}
              disabled={mutation.isPending}
              className={INPUT_CLS}
            >
              {LOGO_POSITIONS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Preview strip */}
        <div className="border-t border-forest-900/10 pt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Preview</p>
          <div
            className="flex h-14 items-center rounded-lg border border-forest-900/10 px-4"
            style={{ backgroundColor: accentColor }}
          >
            <div
              className={[
                'flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold text-white',
                logoPosition === 'center' ? 'mx-auto' : logoPosition === 'right' ? 'ml-auto' : '',
              ].join(' ')}
              style={{ backgroundColor: primaryColor }}
            >
              M
            </div>
          </div>
        </div>
      </div>

      <Show when={error !== null}>
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      </Show>

      <div className="flex items-center gap-3">
        <AppButton type="submit" loading={mutation.isPending}>Save changes</AppButton>
        <Show when={saved}>
          <span className="text-sm text-forest-900">Saved!</span>
        </Show>
      </div>
    </form>
  );
}
