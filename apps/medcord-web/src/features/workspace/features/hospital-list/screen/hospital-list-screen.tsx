import { Link } from 'react-router-dom';
import { Loadable, Show, Repeat } from 'meemaw';

import { AppButton, AppText } from '@medcord/ui';
import { IconPlus, IconBuilding } from '@icons';
import { ROUTES } from '@shared/constants/routes.ts';
import { useAuth } from '@shared/hooks/use-auth.ts';
import type { Hospital } from '@shared/types/hospital.ts';
import { useMyHospitals } from '../api/use-my-hospitals.ts';
import { HospitalCard } from './parts/hospital-card.tsx';

export function HospitalListScreen() {
  const { user, logout } = useAuth();
  const { data: hospitals, isLoading, error } = useMyHospitals();

  return (
    <div className="flex min-h-full flex-col bg-cream-50">
      {/* Minimal topbar */}
      <header className="flex h-14 items-center justify-between border-b border-forest-900/10 bg-white px-6">
        <span className="text-sm font-semibold text-forest-900">Medcord</span>

        <div className="flex items-center gap-4">
          <Show when={user != null}>
            <span className="text-sm text-charcoal-700">{user?.email}</span>
          </Show>
          <AppButton variant="ghost" onClick={logout}>
            Sign out
          </AppButton>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-4 py-12">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <AppText variant="heading-2" className="text-charcoal-900">
              Your workspaces
            </AppText>
            <AppText variant="body-sm" className="mt-1 text-charcoal-700">
              Select a hospital to continue, or create a new one.
            </AppText>
          </div>

          <Link to={ROUTES.HOSPITAL_CREATE}>
            <AppButton leadingIcon={<IconPlus size={14} />}>
              New hospital
            </AppButton>
          </Link>
        </div>

        <Loadable
          loading={isLoading}
          error={error ?? undefined}
          loadingComponent={
            <div className="space-y-3">
              <Repeat times={3}>
                <div className="h-24 animate-pulse rounded-xl bg-forest-900/5" />
              </Repeat>
            </div>
          }
          errorComponent={
            <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              Could not load your hospitals. Please try refreshing.
            </p>
          }
        >
          <Show
            when={(hospitals?.length ?? 0) > 0}
            fallback={
              <div className="py-16 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-forest-900/10 bg-white">
                  <IconBuilding size={28} className="text-charcoal-700/40" />
                </div>
                <AppText variant="heading-3" className="text-charcoal-900">
                  No workspaces yet
                </AppText>
                <AppText variant="body-sm" className="mt-1 mb-6 text-charcoal-700">
                  Create your first hospital to get started.
                </AppText>
                <Link to={ROUTES.HOSPITAL_CREATE}>
                  <AppButton leadingIcon={<IconPlus size={14} />}>
                    Create hospital
                  </AppButton>
                </Link>
              </div>
            }
          >
            <div className="space-y-3">
              <Repeat each={hospitals as Hospital[]}>
                {(hospital: Hospital) => (
                  <HospitalCard key={hospital.id} hospital={hospital} />
                )}
              </Repeat>
            </div>
          </Show>
        </Loadable>
      </main>
    </div>
  );
}
