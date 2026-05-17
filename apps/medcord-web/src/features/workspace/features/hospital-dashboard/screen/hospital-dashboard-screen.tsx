import { useNavigate, useParams } from 'react-router-dom';
import { Show } from 'meemaw';

import { AppButton, AppText } from '@medcord/ui';
import { PERMISSIONS } from '@medcord/rbac';
import {
  IconUsers,
  IconHeartPulse,
  IconFlask,
  IconPackage,
  IconSettings,
  IconClipboard,
  IconBuilding,
  IconStethoscope,
  IconActivity,
  IconRefresh,
} from '@icons';
import { ROUTES } from '@shared/constants/routes.ts';
import { useHospitalBySlug } from '@shared/api/use-hospital-by-slug.ts';
import { usePermissions } from '@shared/hooks/use-permissions.ts';
import { useHospitalUsage } from '../api/use-hospital-usage.ts';
import { StatCard } from './parts/stat-card.tsx';
import { ModuleNavCard } from './parts/module-nav-card.tsx';

export function HospitalDashboardScreen() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { data: hospital } = useHospitalBySlug(slug);
  const { data: usage, isLoading: usageLoading } = useHospitalUsage(hospital?.id ?? '');
  const { can } = usePermissions();
  const navigate = useNavigate();

  const modules = hospital?.modules;

  const canViewPatients = can(PERMISSIONS.PATIENT_VIEW);
  const canViewLabs = can(PERMISSIONS.LAB_VIEW);
  const canViewAssets = can(PERMISSIONS.ASSET_VIEW);
  const canViewStaff = can(PERMISSIONS.STAFF_VIEW);
  const canViewSettings = can(PERMISSIONS.SETTINGS_VIEW);
  const canViewReview = can(PERMISSIONS.REVIEW_VIEW);
  const canTransfer = can(PERMISSIONS.PATIENT_TRANSFER);
  const emrEnabled = modules?.emr === true;
  const labsEnabled = modules?.labs === true;
  const assetsEnabled = modules?.assets === true;

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

      {/* Stats — shown based on what the user can see */}
      <section>
        <AppText variant="caption" className="mb-3 font-semibold uppercase tracking-wider text-charcoal-700/60">
          Overview
        </AppText>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          <Show when={canViewStaff}>
            <StatCard
              label="Staff members"
              value={usage?.members ?? '—'}
              Icon={IconUsers}
              loading={usageLoading}
            />
          </Show>
          <Show when={canViewPatients && emrEnabled}>
            <StatCard
              label="Admitted"
              value={usage?.patientsAdmitted ?? '—'}
              Icon={IconStethoscope}
              loading={usageLoading}
            />
          </Show>
          <Show when={canViewPatients && emrEnabled}>
            <StatCard
              label="Checked in"
              value={usage?.patientsCheckedIn ?? '—'}
              Icon={IconActivity}
              loading={usageLoading}
            />
          </Show>
          <Show when={canViewLabs && labsEnabled}>
            <StatCard
              label="Labs pending"
              value={usage?.labsPending ?? '—'}
              Icon={IconFlask}
              loading={usageLoading}
            />
          </Show>
          <Show when={!canViewStaff && !canViewPatients && !canViewLabs}>
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
          </Show>
        </div>
      </section>

      {/* Quick actions / navigation */}
      <section>
        <AppText variant="caption" className="mb-3 font-semibold uppercase tracking-wider text-charcoal-700/60">
          Quick access
        </AppText>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <Show when={canViewStaff}>
            <ModuleNavCard
              label="Staff"
              description="Manage your team, roles, and invitations."
              Icon={IconUsers}
              to={ROUTES.HOSPITAL_STAFF(slug)}
            />
          </Show>
          <Show when={canViewPatients}>
            <ModuleNavCard
              label="Patients"
              description="Register, search, and manage patient records."
              Icon={IconHeartPulse}
              to={ROUTES.HOSPITAL_PATIENTS(slug)}
            />
          </Show>
          <Show when={canViewPatients && emrEnabled}>
            <ModuleNavCard
              label="Admitted patients"
              description="View and manage currently admitted patients."
              Icon={IconStethoscope}
              to={ROUTES.HOSPITAL_PATIENTS_ADMITTED(slug)}
            />
          </Show>
          <Show when={canViewPatients && emrEnabled}>
            <ModuleNavCard
              label="Queue board"
              description="Live check-in queue and triage stages."
              Icon={IconActivity}
              to={ROUTES.HOSPITAL_QUEUE(slug)}
            />
          </Show>
          <Show when={canTransfer}>
            <ModuleNavCard
              label="Transfers"
              description="Incoming and outgoing patient transfers."
              Icon={IconRefresh}
              to={ROUTES.HOSPITAL_TRANSFERS(slug)}
            />
          </Show>
          <Show when={canViewLabs && labsEnabled}>
            <ModuleNavCard
              label="Labs"
              description="Lab orders, specimen tracking, and results."
              Icon={IconFlask}
              to={ROUTES.HOSPITAL_LABS(slug)}
            />
          </Show>
          <Show when={canViewAssets && assetsEnabled}>
            <ModuleNavCard
              label="Assets"
              description="Equipment registry, labeling, and location."
              Icon={IconPackage}
              to={ROUTES.HOSPITAL_ASSETS(slug)}
            />
          </Show>
          <Show when={canViewReview}>
            <ModuleNavCard
              label="Review Queue"
              description="Review pending items awaiting approval."
              Icon={IconClipboard}
              to={ROUTES.HOSPITAL_REVIEW_QUEUE(slug)}
            />
          </Show>
          <Show when={canViewSettings}>
            <ModuleNavCard
              label="Settings"
              description="Configure your workspace, branding, and modules."
              Icon={IconSettings}
              to={ROUTES.HOSPITAL_SETTINGS(slug)}
            />
          </Show>
        </div>
      </section>

      {/* Fallback CTA for users with very limited permissions */}
      <Show when={!canViewStaff && !canViewPatients && !canViewLabs && !canViewAssets && !canViewSettings}>
        <div className="rounded-xl border border-forest-900/10 bg-cream-50 p-6 text-center">
          <AppText variant="body-sm" className="text-charcoal-700">
            Contact your administrator if you need access to additional areas.
          </AppText>
          <div className="mt-4">
            <AppButton variant="secondary" onClick={() => navigate(ROUTES.HOSPITALS)}>
              Back to hospitals
            </AppButton>
          </div>
        </div>
      </Show>
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
