import { Loadable } from 'meemaw';

import { AppText } from '@medcord/ui';
import { IconUsers } from '@icons';
import type { Hospital } from '@shared/types/hospital.ts';
import { useHospitalUsage } from '../../../hospital-dashboard/api/use-hospital-usage.ts';

interface UsageBarProps {
  readonly label: string;
  readonly value: number;
  readonly max: number;
  readonly unit: string;
}

function UsageBar({ label, value, max, unit }: UsageBarProps) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <AppText variant="body-sm" as="span" className="text-charcoal-900">{label}</AppText>
        <AppText variant="caption" as="span" className="normal-case tracking-normal text-charcoal-700">
          {value} / {max} {unit}
        </AppText>
      </div>
      <div className="h-2 w-full rounded-full bg-forest-900/10">
        <div
          className="h-2 rounded-full bg-forest-900 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

interface SettingsUsageProps {
  readonly hospital: Hospital;
}

export function SettingsUsage({ hospital }: SettingsUsageProps) {
  const { data: usage, isLoading, error } = useHospitalUsage(hospital.id);

  return (
    <div className="space-y-6">
      <div>
        <AppText variant="heading-3" className="text-charcoal-900">Usage</AppText>
        <AppText variant="body-sm" className="mt-1 text-charcoal-700">
          Current workspace usage and plan limits.
        </AppText>
      </div>

      {/* Plan badge */}
      <div className="flex items-center gap-3 rounded-xl border border-forest-900/10 bg-white px-5 py-4 shadow-sm sm:px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-forest-900/10 bg-cream-50">
          <IconUsers size={16} className="text-forest-900/70" />
        </div>
        <div>
          <AppText variant="body-sm" as="p" className="font-semibold text-charcoal-900">Pro Plan</AppText>
          <AppText variant="caption" as="p" className="mt-0.5 normal-case tracking-normal text-charcoal-700">
            All modules enabled · Unlimited patients
          </AppText>
        </div>
        <span className="ml-auto rounded-full bg-forest-900 px-3 py-1 text-xs font-semibold text-white">
          Active
        </span>
      </div>

      <Loadable
        loading={isLoading}
        error={error ?? undefined}
        loadingComponent={
          <div className="space-y-4">
            <div className="h-12 animate-pulse rounded-xl bg-forest-900/5" />
          </div>
        }
        errorComponent={
          <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            Could not load usage data.
          </p>
        }
      >
        <div className="rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm space-y-5 sm:p-6">
          <UsageBar label="Staff members" value={usage?.members ?? 0} max={500} unit="members" />
        </div>
      </Loadable>
    </div>
  );
}
