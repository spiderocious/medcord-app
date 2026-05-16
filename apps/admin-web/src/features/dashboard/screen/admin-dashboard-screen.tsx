import { Loadable } from 'meemaw';
import { AppText } from '@medcord/ui';

import { usePlatformStats } from '../api/use-platform-stats.ts';

interface StatTileProps {
  readonly label: string;
  readonly value: number;
}

function StatTile({ label, value }: StatTileProps) {
  return (
    <div className="rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm">
      <AppText variant="caption" className="text-charcoal-700/60 uppercase tracking-wider">
        {label}
      </AppText>
      <p className="mt-2 text-3xl font-semibold text-forest-900">{value}</p>
    </div>
  );
}

interface RecentCardProps {
  readonly title: string;
  readonly last7d: number;
  readonly last30d: number;
}

function RecentCard({ title, last7d, last30d }: RecentCardProps) {
  return (
    <div className="rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm">
      <AppText variant="caption" className="text-charcoal-700/60 uppercase tracking-wider">
        {title}
      </AppText>
      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-charcoal-700">Last 7 days</span>
          <span className="text-sm font-semibold text-charcoal-900">{last7d}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-charcoal-700">Last 30 days</span>
          <span className="text-sm font-semibold text-charcoal-900">{last30d}</span>
        </div>
      </div>
    </div>
  );
}

export function AdminDashboardScreen() {
  const { data: stats, isLoading, error } = usePlatformStats();

  return (
    <div className="space-y-6">
      <div>
        <AppText variant="heading-2" className="text-charcoal-900">Dashboard</AppText>
        <AppText variant="body-sm" className="mt-1 text-charcoal-700">
          Platform-wide overview
        </AppText>
      </div>

      <Loadable
        loading={isLoading}
        error={error ?? undefined}
        loadingComponent={
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-forest-900/20 border-t-forest-900" />
          </div>
        }
        errorComponent={
          <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error instanceof Error ? error.message : 'Failed to load stats.'}
          </p>
        }
      >
        {stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatTile label="Hospitals" value={stats.hospitals.total} />
              <StatTile label="Active" value={stats.hospitals.active} />
              <StatTile label="Archived" value={stats.hospitals.archived} />
              <StatTile label="Users" value={stats.users.total} />
              <StatTile label="Admins" value={stats.users.admins} />
              <StatTile label="2FA enabled" value={stats.users.twoFactorEnabled} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <RecentCard
                title="New signups"
                last7d={stats.recentSignups.last7d}
                last30d={stats.recentSignups.last30d}
              />
              <RecentCard
                title="New hospitals"
                last7d={stats.recentHospitals.last7d}
                last30d={stats.recentHospitals.last30d}
              />
            </div>
          </div>
        )}
      </Loadable>
    </div>
  );
}
