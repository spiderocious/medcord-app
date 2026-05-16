import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loadable, Show, Repeat } from 'meemaw';
import { AppButton, AppText } from '@medcord/ui';
import { IconUsers, IconCheckCircle, IconXCircle } from '@icons';

import { ADMIN_ROUTES } from '@shared/constants/routes.ts';
import type { AdminUser } from '@shared/types/admin.ts';
import { useAdminUsers, type UsersFilters } from '../api/use-admin-users.ts';

const INPUT_CLS =
  'block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 placeholder-charcoal-700/50 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900';

const SELECT_CLS =
  'block rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900';

type AdminFilter = 'all' | 'true' | 'false';

export function UserListScreen() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [isAdmin, setIsAdmin] = useState<AdminFilter>('all');
  const [page, setPage] = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQ(q);
      setPage(1);
    }, 300);
    return () => {
      if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    };
  }, [q]);

  const filters: UsersFilters = { q: debouncedQ, isAdmin, page };
  const { data, isLoading, error } = useAdminUsers(filters);

  function handleAdminChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setIsAdmin(e.target.value as AdminFilter);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <div>
        <AppText variant="heading-2" className="text-charcoal-900">Users</AppText>
        <Show when={data !== undefined}>
          <AppText variant="body-sm" className="mt-1 text-charcoal-700">
            {data?.total ?? 0} user{data?.total === 1 ? '' : 's'}
          </AppText>
        </Show>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by name or email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className={`${INPUT_CLS} max-w-xs`}
        />
        <select value={isAdmin} onChange={handleAdminChange} className={SELECT_CLS}>
          <option value="all">All users</option>
          <option value="true">Admins only</option>
          <option value="false">Non-admins</option>
        </select>
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
            {error instanceof Error ? error.message : 'Failed to load users.'}
          </p>
        }
      >
        {data && (
          <div className="space-y-4">
            <Show
              when={data.items.length > 0}
              fallback={
                <div className="flex flex-col items-center justify-center py-16 text-charcoal-700/50">
                  <IconUsers size={32} />
                  <p className="mt-3 text-sm">No users found.</p>
                </div>
              }
            >
              <div className="overflow-hidden rounded-xl border border-forest-900/10 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-forest-900/10">
                  <thead className="bg-forest-900/5">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Email verified</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Admin</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">2FA</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-forest-900/10">
                    <Repeat each={data.items as AdminUser[]}>
                      {(user: AdminUser) => (
                        <tr
                          key={user.id}
                          onClick={() => navigate(ADMIN_ROUTES.USER_DETAIL(user.id))}
                          className="cursor-pointer hover:bg-forest-900/5 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-charcoal-900">{user.name}</p>
                            <p className="text-xs text-charcoal-700/60">{user.email}</p>
                          </td>
                          <td className="px-4 py-3">
                            <Show
                              when={user.isEmailVerified}
                              fallback={<IconXCircle size={16} className="text-red-500" />}
                            >
                              <IconCheckCircle size={16} className="text-green-600" />
                            </Show>
                          </td>
                          <td className="px-4 py-3">
                            <Show when={user.isAdmin}>
                              <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                                Admin
                              </span>
                            </Show>
                          </td>
                          <td className="px-4 py-3">
                            <Show
                              when={user.twoFactorEnabled}
                              fallback={
                                <span className="inline-flex items-center rounded-full bg-charcoal-700/10 px-2 py-0.5 text-xs font-medium text-charcoal-700">
                                  2FA off
                                </span>
                              }
                            >
                              <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                2FA on
                              </span>
                            </Show>
                          </td>
                          <td className="px-4 py-3 text-sm text-charcoal-700">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      )}
                    </Repeat>
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between">
                <AppText variant="body-sm" className="text-charcoal-700">
                  Page {data.page} of {data.totalPages}
                </AppText>
                <div className="flex gap-2">
                  <AppButton
                    variant="secondary"
                    onClick={() => setPage((p) => p - 1)}
                    disabled={data.page <= 1}
                  >
                    Previous
                  </AppButton>
                  <AppButton
                    variant="secondary"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={data.page >= data.totalPages}
                  >
                    Next
                  </AppButton>
                </div>
              </div>
            </Show>
          </div>
        )}
      </Loadable>
    </div>
  );
}
