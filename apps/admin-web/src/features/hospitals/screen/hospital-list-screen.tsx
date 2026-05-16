import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loadable, Show, Repeat } from 'meemaw';
import { AppButton, AppText } from '@medcord/ui';
import { IconBuilding } from '@icons';

import { ADMIN_ROUTES } from '@shared/constants/routes.ts';
import type { AdminHospital } from '@shared/types/admin.ts';
import { useAdminHospitals, type HospitalsFilters } from '../api/use-admin-hospitals.ts';

const INPUT_CLS =
  'block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 placeholder-charcoal-700/50 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900';

const SELECT_CLS =
  'block rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900';

type ArchivedFilter = 'all' | 'true' | 'false';

const MODULE_LABELS: { key: keyof AdminHospital['modules']; label: string }[] = [
  { key: 'emr', label: 'EMR' },
  { key: 'labs', label: 'Labs' },
  { key: 'assets', label: 'Assets' },
  { key: 'onlineConsultation', label: 'Consult' },
];

export function HospitalListScreen() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [isArchived, setIsArchived] = useState<ArchivedFilter>('all');
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

  const filters: HospitalsFilters = { q: debouncedQ, isArchived, page };
  const { data, isLoading, error } = useAdminHospitals(filters);

  function handleArchiveChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setIsArchived(e.target.value as ArchivedFilter);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <div>
        <AppText variant="heading-2" className="text-charcoal-900">Hospitals</AppText>
        <Show when={data !== undefined}>
          <AppText variant="body-sm" className="mt-1 text-charcoal-700">
            {data?.total ?? 0} hospital{data?.total === 1 ? '' : 's'}
          </AppText>
        </Show>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by name or subdomain…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className={`${INPUT_CLS} max-w-xs`}
        />
        <select value={isArchived} onChange={handleArchiveChange} className={SELECT_CLS}>
          <option value="all">All statuses</option>
          <option value="false">Active</option>
          <option value="true">Archived</option>
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
            {error instanceof Error ? error.message : 'Failed to load hospitals.'}
          </p>
        }
      >
        {data && (
          <div className="space-y-4">
            <Show
              when={data.items.length > 0}
              fallback={
                <div className="flex flex-col items-center justify-center py-16 text-charcoal-700/50">
                  <IconBuilding size={32} />
                  <p className="mt-3 text-sm">No hospitals found.</p>
                </div>
              }
            >
              <div className="overflow-hidden rounded-xl border border-forest-900/10 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-forest-900/10">
                  <thead className="bg-forest-900/5">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Location</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Modules</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-forest-900/10">
                    <Repeat each={data.items as AdminHospital[]}>
                      {(hospital: AdminHospital) => (
                        <tr
                          key={hospital.id}
                          onClick={() => navigate(ADMIN_ROUTES.HOSPITAL_DETAIL(hospital.id))}
                          className="cursor-pointer hover:bg-forest-900/5 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-charcoal-900">{hospital.name}</p>
                            <p className="text-xs text-charcoal-700/60">{hospital.subdomain}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-charcoal-700 capitalize">{hospital.type}</td>
                          <td className="px-4 py-3 text-sm text-charcoal-700">{hospital.location}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              <Repeat each={MODULE_LABELS as typeof MODULE_LABELS[number][]}>
                                {(mod: typeof MODULE_LABELS[number]) => (
                                  <span
                                    key={mod.key}
                                    className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${
                                      hospital.modules[mod.key]
                                        ? 'bg-forest-900/10 text-forest-900'
                                        : 'bg-charcoal-700/10 text-charcoal-700/50'
                                    }`}
                                  >
                                    {mod.label}
                                  </span>
                                )}
                              </Repeat>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Show
                              when={hospital.isArchived}
                              fallback={
                                <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                  Active
                                </span>
                              }
                            >
                              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                                Archived
                              </span>
                            </Show>
                          </td>
                          <td className="px-4 py-3 text-sm text-charcoal-700">
                            {new Date(hospital.createdAt).toLocaleDateString()}
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
