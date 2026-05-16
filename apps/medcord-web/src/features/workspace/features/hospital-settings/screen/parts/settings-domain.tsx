import { useState, type FormEvent } from 'react';
import { Show } from 'meemaw';
import { Loadable } from 'meemaw';

import { AppButton, AppText } from '@medcord/ui';
import { IconCheckCircle, IconClock } from '@icons';
import { parseApiError } from '@medcord/api';
import { CopyToClipboard } from 'meemaw';
import type { Hospital } from '@shared/types/hospital.ts';
import { useHospitalDomain, useUpdateDomain } from '../../api/use-hospital-domain.ts';

const INPUT_CLS =
  'mt-1 block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 placeholder-charcoal-700/50 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900 disabled:cursor-not-allowed disabled:opacity-50';

interface SettingsDomainProps {
  readonly hospital: Hospital;
}

export function SettingsDomain({ hospital }: SettingsDomainProps) {
  const { data: domain, isLoading, error: loadError } = useHospitalDomain(hospital.id);
  const mutation = useUpdateDomain(hospital.id);

  const [customDomain, setCustomDomain] = useState(hospital.customDomain ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const medcordUrl = `${hospital.subdomain}.medcord.app`;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    try {
      await mutation.mutateAsync({
        customDomain: customDomain.trim() !== '' ? customDomain.trim() : undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError(parseApiError(err).message);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <AppText variant="heading-3" className="text-charcoal-900">Domain</AppText>
        <AppText variant="body-sm" className="mt-1 text-charcoal-700">
          Your Medcord URL and optional custom domain configuration.
        </AppText>
      </div>

      <Loadable
        loading={isLoading}
        error={loadError ?? undefined}
        loadingComponent={
          <div className="h-32 animate-pulse rounded-xl bg-forest-900/5" />
        }
        errorComponent={
          <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            Could not load domain information.
          </p>
        }
      >
        <div className="space-y-6">
          {/* Medcord URL */}
          <div className="rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm sm:p-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Your Medcord URL</p>
            <div className="flex items-center gap-3 rounded-lg border border-forest-900/10 bg-cream-50 px-4 py-3">
              <code className="flex-1 text-sm font-medium text-charcoal-900">{domain?.subdomain ?? hospital.subdomain}.medcord.app</code>
              <CopyToClipboard text={medcordUrl}>
                {(copy, copied) => (
                  <AppButton variant="ghost" onClick={copy}>
                    {copied ? 'Copied!' : 'Copy'}
                  </AppButton>
                )}
              </CopyToClipboard>
            </div>
          </div>

          {/* Custom domain */}
          <form onSubmit={(e) => { void handleSubmit(e); }} className="rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm space-y-4 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Custom Domain</p>

            <div>
              <label htmlFor="sd-domain" className="block text-sm font-medium text-charcoal-900">
                Domain name
              </label>
              <input
                id="sd-domain"
                type="text"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                disabled={mutation.isPending}
                className={INPUT_CLS}
                placeholder="app.yourhospital.com"
              />
              <AppText variant="caption" as="p" className="mt-1 normal-case tracking-normal text-charcoal-700/70">
                Point a CNAME record from your domain to <code className="font-mono">{hospital.subdomain}.medcord.app</code>
              </AppText>
            </div>

            <Show when={(domain?.customDomain ?? '') !== ''}>
              <div className={[
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm',
                (domain?.customDomainVerified === true)
                  ? 'bg-forest-900/5 text-forest-900'
                  : 'bg-amber-50 text-amber-700',
              ].join(' ')}>
                <Show
                  when={domain?.customDomainVerified === true}
                  fallback={<IconClock size={14} className="shrink-0" />}
                >
                  <IconCheckCircle size={14} className="shrink-0" />
                </Show>
                <span>
                  {domain?.customDomainVerified === true ? 'Domain verified' : 'Awaiting DNS propagation — may take up to 48 hours'}
                </span>
              </div>
            </Show>

            <Show when={error !== null}>
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            </Show>

            <div className="flex items-center gap-3">
              <AppButton type="submit" loading={mutation.isPending}>
                Save domain
              </AppButton>
              <Show when={saved}>
                <span className="text-sm text-forest-900">Saved!</span>
              </Show>
            </div>
          </form>

          {/* CNAME instructions */}
          <div className="rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm sm:p-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">DNS Setup Instructions</p>
            <ol className="space-y-2 text-sm text-charcoal-700">
              <li className="flex gap-2"><span className="font-mono text-xs text-charcoal-700/50 mt-0.5">1.</span> Log in to your DNS provider.</li>
              <li className="flex gap-2"><span className="font-mono text-xs text-charcoal-700/50 mt-0.5">2.</span> Add a <code className="rounded bg-cream-50 px-1.5 py-0.5 text-xs">CNAME</code> record pointing to <code className="rounded bg-cream-50 px-1.5 py-0.5 text-xs">{hospital.subdomain}.medcord.app</code></li>
              <li className="flex gap-2"><span className="font-mono text-xs text-charcoal-700/50 mt-0.5">3.</span> Enter your domain above and save — verification is automatic.</li>
            </ol>
          </div>
        </div>
      </Loadable>
    </div>
  );
}
