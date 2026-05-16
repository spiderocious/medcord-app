import { useParams } from 'react-router-dom';
import { Show } from 'meemaw';

import { AppText } from '@medcord/ui';
import {
  IconUsers,
  IconHeartPulse,
  IconFlask,
  IconPackage,
  IconSettings,
  IconClipboard,
  IconBuilding,
} from '@icons';
import { ROUTES } from '@shared/constants/routes.ts';
import { useHospitalBySlug } from '@shared/api/use-hospital-by-slug.ts';
import { useHospitalUsage } from '../api/use-hospital-usage.ts';
import { StatCard } from './parts/stat-card.tsx';
import { ModuleNavCard } from './parts/module-nav-card.tsx';

export function HospitalDashboardScreen() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { data: hospital } = useHospitalBySlug(slug);
  const { data: usage, isLoading: usageLoading } = useHospitalUsage(hospital?.id ?? '');

  const modules = hospital?.modules;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-forest-900/10 bg-cream-50">
              <IconBuilding size={18} className="text-forest-900/60" />
            </div>
            <AppText variant="heading-2" className="truncate text-charcoal-900">
              {hospital?.name ?? 'Dashboard'}
            </AppText>
          </div>
          <AppText variant="body-sm" className="mt-1.5 text-charcoal-700 sm:ml-[46px]">
            {hospital?.type !== undefined ? TYPE_LABELS[hospital.type] : ''}{hospital?.location !== undefined ? ` · ${hospital.location}` : ''}
          </AppText>
        </div>
      </div>

      {/* Stats */}
      <section>
        <AppText variant="caption" className="mb-3 font-semibold uppercase tracking-wider text-charcoal-700/60">
          Overview
        </AppText>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          <StatCard
            label="Staff members"
            value={usage?.members ?? '—'}
            Icon={IconUsers}
            loading={usageLoading}
          />
          <StatCard
            label="Plan"
            value={hospital?.plan === 'pro' ? 'Pro' : '—'}
            Icon={IconBuilding}
          />
          <StatCard
            label="Timezone"
            value={hospital?.timezone ?? '—'}
            Icon={IconClipboard}
          />
        </div>
      </section>

      {/* Module navigation */}
      <section>
        <AppText variant="caption" className="mb-3 font-semibold uppercase tracking-wider text-charcoal-700/60">
          Modules
        </AppText>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <ModuleNavCard
            label="Staff"
            description="Manage your team, roles, and invitations."
            Icon={IconUsers}
            to={ROUTES.HOSPITAL_STAFF(slug)}
          />
          <ModuleNavCard
            label="Patients"
            description="Register, search, and manage patient records."
            Icon={IconHeartPulse}
            to={ROUTES.HOSPITAL_PATIENTS(slug)}
          />
          <Show when={modules?.emr === true}>
            <ModuleNavCard
              label="EMR"
              description="Charts, vitals, medications, and history."
              Icon={IconHeartPulse}
              to={ROUTES.HOSPITAL_PATIENTS(slug)}
              badge="EMR"
            />
          </Show>
          <Show when={modules?.labs === true}>
            <ModuleNavCard
              label="Labs"
              description="Lab orders, specimen tracking, and results."
              Icon={IconFlask}
              to={ROUTES.HOSPITAL_LABS(slug)}
            />
          </Show>
          <Show when={modules?.assets === true}>
            <ModuleNavCard
              label="Assets"
              description="Equipment registry, labeling, and location."
              Icon={IconPackage}
              to={ROUTES.HOSPITAL_ASSETS(slug)}
            />
          </Show>
          <ModuleNavCard
            label="Settings"
            description="Configure your workspace, branding, and modules."
            Icon={IconSettings}
            to={ROUTES.HOSPITAL_SETTINGS(slug)}
          />
        </div>
      </section>
    </div>
  );
}

const TYPE_LABELS: Record<string, string> = {
  general: 'General Hospital',
  specialty: 'Specialty Hospital',
  clinic: 'Clinic',
  teaching: 'Teaching Hospital',
  other: 'Hospital',
};
