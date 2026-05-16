import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Switch, Case, Default, Loadable } from 'meemaw';

import { AppText } from '@medcord/ui';
import { useHospitalBySlug } from '@shared/api/use-hospital-by-slug.ts';
import { SettingsGeneral } from './parts/settings-general.tsx';
import { SettingsBranding } from './parts/settings-branding.tsx';
import { SettingsModules } from './parts/settings-modules.tsx';
import { SettingsDomain } from './parts/settings-domain.tsx';
import { SettingsUsage } from './parts/settings-usage.tsx';
import { SettingsDangerZone } from './parts/settings-danger-zone.tsx';

type SettingsTab = 'general' | 'branding' | 'modules' | 'domain' | 'usage' | 'danger';

interface TabDef {
  readonly id: SettingsTab;
  readonly label: string;
  readonly danger?: boolean;
}

const TABS: ReadonlyArray<TabDef> = [
  { id: 'general', label: 'General' },
  { id: 'branding', label: 'Branding' },
  { id: 'modules', label: 'Modules' },
  { id: 'domain', label: 'Domain' },
  { id: 'usage', label: 'Usage' },
  { id: 'danger', label: 'Danger Zone', danger: true },
];

export function HospitalSettingsScreen() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { data: hospital, isLoading, error } = useHospitalBySlug(slug);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <AppText variant="heading-2" className="text-charcoal-900">Settings</AppText>
        <AppText variant="body-sm" className="mt-1 text-charcoal-700">
          Manage your hospital workspace configuration.
        </AppText>
      </div>

      {/* Tab nav — scrollable on mobile */}
      <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-0.5 overflow-x-auto border-b border-forest-900/10 pb-0 scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={[
                'relative shrink-0 px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none',
                'border-b-2 -mb-px',
                activeTab === tab.id
                  ? tab.danger === true
                    ? 'border-red-500 text-red-600'
                    : 'border-forest-900 text-forest-900'
                  : tab.danger === true
                    ? 'border-transparent text-red-400 hover:text-red-600'
                    : 'border-transparent text-charcoal-700 hover:text-charcoal-900',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <Loadable
        loading={isLoading}
        error={error ?? undefined}
        loadingComponent={
          <div className="space-y-4">
            <div className="h-40 animate-pulse rounded-xl bg-forest-900/5" />
            <div className="h-24 animate-pulse rounded-xl bg-forest-900/5" />
          </div>
        }
        errorComponent={
          <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            Could not load hospital settings.
          </p>
        }
      >
        <Switch>
          <Case when={activeTab === 'general'}>
            <SettingsGeneral hospital={hospital!} />
          </Case>
          <Case when={activeTab === 'branding'}>
            <SettingsBranding hospital={hospital!} />
          </Case>
          <Case when={activeTab === 'modules'}>
            <SettingsModules hospital={hospital!} />
          </Case>
          <Case when={activeTab === 'domain'}>
            <SettingsDomain hospital={hospital!} />
          </Case>
          <Case when={activeTab === 'usage'}>
            <SettingsUsage hospital={hospital!} />
          </Case>
          <Default>
            <SettingsDangerZone hospital={hospital!} />
          </Default>
        </Switch>
      </Loadable>
    </div>
  );
}
