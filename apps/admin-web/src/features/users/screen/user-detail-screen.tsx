import { useNavigate, useParams } from 'react-router-dom';
import { Loadable, Show, Repeat } from 'meemaw';
import { AppButton, AppText } from '@medcord/ui';
import { IconArrowLeft } from '@icons';

import { ADMIN_ROUTES } from '@shared/constants/routes.ts';
import type { MembershipSummary } from '@shared/types/admin.ts';
import { useAdminUser } from '../api/use-admin-users.ts';
import { UserFlagsForm } from './parts/user-flags-form.tsx';

export function UserDetailScreen() {
  const { userId = '' } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const { data, isLoading, error } = useAdminUser(userId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <AppButton
          variant="ghost"
          leadingIcon={<IconArrowLeft size={14} />}
          onClick={() => navigate(ADMIN_ROUTES.USERS)}
        >
          Users
        </AppButton>
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
            {error instanceof Error ? error.message : 'Failed to load user.'}
          </p>
        }
      >
        {data && (
          <div className="space-y-2">
            <AppText variant="heading-2" className="text-charcoal-900">
              {data.user.name}
            </AppText>
            <AppText variant="body-sm" className="text-charcoal-700">
              {data.user.email}
            </AppText>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              {/* Left — Info + Memberships */}
              <div className="lg:col-span-2 space-y-4">
                {/* User info card */}
                <div className="rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">
                    Account info
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-mono uppercase tracking-wider text-charcoal-700/60">Email</p>
                      <p className="mt-0.5 text-sm text-charcoal-900">{data.user.email}</p>
                    </div>
                    <Show when={data.user.phone !== undefined}>
                      <div>
                        <p className="text-xs font-mono uppercase tracking-wider text-charcoal-700/60">Phone</p>
                        <p className="mt-0.5 text-sm text-charcoal-900">{data.user.phone}</p>
                      </div>
                    </Show>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Show when={data.user.isEmailVerified}>
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        Email verified
                      </span>
                    </Show>
                    <Show when={data.user.isAdmin}>
                      <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                        Admin
                      </span>
                    </Show>
                    <Show when={data.user.twoFactorEnabled}>
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        2FA on
                      </span>
                    </Show>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 border-t border-forest-900/10 pt-3">
                    <div>
                      <p className="text-xs font-mono uppercase tracking-wider text-charcoal-700/60">Joined</p>
                      <p className="mt-0.5 text-sm text-charcoal-900">
                        {new Date(data.user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-mono uppercase tracking-wider text-charcoal-700/60">Updated</p>
                      <p className="mt-0.5 text-sm text-charcoal-900">
                        {new Date(data.user.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Memberships table */}
                <div className="rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">
                    Hospital memberships
                  </p>
                  <Show
                    when={data.memberships.length > 0}
                    fallback={
                      <p className="text-sm text-charcoal-700/60">No memberships.</p>
                    }
                  >
                    <table className="min-w-full divide-y divide-forest-900/10">
                      <thead>
                        <tr>
                          <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Hospital ID</th>
                          <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Role</th>
                          <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Status</th>
                          <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-forest-900/10">
                        <Repeat each={data.memberships as MembershipSummary[]}>
                          {(m: MembershipSummary) => (
                            <tr key={m.id}>
                              <td className="py-2 text-xs font-mono text-charcoal-700">{m.hospitalId}</td>
                              <td className="py-2 text-sm text-charcoal-900 capitalize">{m.role}</td>
                              <td className="py-2 text-sm text-charcoal-700 capitalize">{m.status}</td>
                              <td className="py-2 text-sm text-charcoal-700">
                                {new Date(m.joinedAt).toLocaleDateString()}
                              </td>
                            </tr>
                          )}
                        </Repeat>
                      </tbody>
                    </table>
                  </Show>
                </div>
              </div>

              {/* Right — Actions card */}
              <div>
                <div className="rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm">
                  <UserFlagsForm user={data.user} />
                </div>
              </div>
            </div>
          </div>
        )}
      </Loadable>
    </div>
  );
}
