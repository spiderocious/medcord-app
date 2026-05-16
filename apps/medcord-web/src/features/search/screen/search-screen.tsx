import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Show, Repeat } from 'meemaw';
import { AppText } from '@medcord/ui';
import { IconLoader, IconUser, IconPackage, IconFlask, IconAlert } from '@icons';
import { useAuth } from '@shared/hooks/use-auth.ts';
import { useHospitalSlug } from '@shared/hooks/use-hospital-slug.ts';
import { ROUTES } from '@shared/constants/routes.ts';
import { useGlobalSearch } from '../api/use-search.ts';
import type { Patient } from '@features/patients/shared/types/patient.ts';
import type { Asset } from '@features/assets/shared/types/asset.ts';
import type { LabOrder } from '@features/labs/shared/types/lab.ts';

const INPUT_CLS = 'mt-1 block w-full rounded-lg border border-forest-900/20 bg-white px-4 py-3 text-base text-charcoal-900 placeholder-charcoal-700/50 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900';

const ADMISSION_STYLE: Record<string, string> = {
  outpatient: 'text-charcoal-700 border-forest-900/10 bg-cream-50',
  admitted: 'text-[#166534] border-[#bbf7d0] bg-[#f0fdf4]',
  discharged: 'text-[#1e40af] border-[#bfdbfe] bg-[#eff6ff]',
};

const ASSET_STATUS_STYLE: Record<string, string> = {
  available: 'text-[#166534] border-[#bbf7d0] bg-[#f0fdf4]',
  in_use: 'text-[#1e40af] border-[#bfdbfe] bg-[#eff6ff]',
  maintenance: 'text-[#92400e] border-[#fde68a] bg-[#fffbeb]',
  retired: 'text-charcoal-700 border-forest-900/10 bg-cream-50',
};

const PRIORITY_STYLE: Record<string, string> = {
  routine: 'text-charcoal-700 border-forest-900/10 bg-cream-50',
  urgent: 'text-[#92400e] border-[#fde68a] bg-[#fffbeb]',
  stat: 'text-red-700 border-red-200 bg-red-50',
};

const LAB_STATUS_STYLE: Record<string, string> = {
  awaiting_sample: 'text-charcoal-700 border-forest-900/10 bg-cream-50',
  sample_received: 'text-[#92400e] border-[#fde68a] bg-[#fffbeb]',
  awaiting_test: 'text-[#92400e] border-[#fde68a] bg-[#fffbeb]',
  in_progress: 'text-[#1e40af] border-[#bfdbfe] bg-[#eff6ff]',
  awaiting_result: 'text-[#1e40af] border-[#bfdbfe] bg-[#eff6ff]',
  result_ready: 'text-[#166534] border-[#bbf7d0] bg-[#f0fdf4]',
  result_released: 'text-[#166534] border-[#bbf7d0] bg-[#f0fdf4]',
};

const LAB_STATUS_LABEL: Record<string, string> = {
  awaiting_sample: 'Awaiting Sample',
  sample_received: 'Sample Received',
  awaiting_test: 'Awaiting Test',
  in_progress: 'In Progress',
  awaiting_result: 'Awaiting Result',
  result_ready: 'Result Ready',
  result_released: 'Released',
};

export function SearchScreen() {
  const { activeHospitalId } = useAuth();
  const slug = useHospitalSlug();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const hospitalId = activeHospitalId ?? '';
  const { data: results, isLoading, error } = useGlobalSearch(hospitalId, debouncedQ);

  const hasResults =
    (results?.patients?.length ?? 0) > 0 ||
    (results?.assets?.length ?? 0) > 0 ||
    (results?.labs?.length ?? 0) > 0;

  const showEmpty = debouncedQ.trim().length >= 2 && !isLoading && !hasResults && !error;

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <AppText variant="heading-2" className="text-charcoal-900">Search</AppText>

      <div className="relative">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search patients, assets, lab orders…"
          className={INPUT_CLS}
        />
        <Show when={isLoading && debouncedQ.trim().length >= 2}>
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <IconLoader size={16} className="animate-spin text-charcoal-700/50" />
          </div>
        </Show>
      </div>

      <Show when={error !== null && error !== undefined}>
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error instanceof Error ? error.message : 'Search failed.'}
        </p>
      </Show>

      <Show when={debouncedQ.trim().length < 2 && query.length === 0}>
        <p className="text-sm text-charcoal-700/50">Start typing to search patients, assets, and lab orders.</p>
      </Show>

      <Show when={showEmpty}>
        <p className="text-sm text-charcoal-700/50">No results for &quot;{debouncedQ}&quot;. Try different keywords.</p>
      </Show>

      <Show when={(results?.patients?.length ?? 0) > 0}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <IconUser size={14} className="text-charcoal-700/60" />
            <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">
              Patients ({results?.patients?.length ?? 0})
            </p>
          </div>
          <div className="divide-y divide-forest-900/10 rounded-xl border border-forest-900/10 overflow-hidden">
            <Repeat each={(results?.patients ?? []) as Patient[]}>
              {(patient: Patient) => (
                <button
                  key={patient.id}
                  type="button"
                  className="flex w-full items-center justify-between gap-4 bg-white px-4 py-3 text-left hover:bg-cream-50/60 transition-colors"
                  onClick={() => navigate(ROUTES.HOSPITAL_PATIENT_PROFILE(slug, patient.patientCode))}
                >
                  <div>
                    <p className="text-sm font-medium text-charcoal-900">
                      {patient.demographics.firstName} {patient.demographics.lastName}
                    </p>
                    <p className="text-xs text-charcoal-700/60">
                      {patient.patientCode}
                      <Show when={patient.demographics.dateOfBirth !== undefined}>
                        {' · '}{new Date(patient.demographics.dateOfBirth!).toLocaleDateString()}
                      </Show>
                    </p>
                  </div>
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${ADMISSION_STYLE[patient.admissionStatus]}`}>
                    {patient.admissionStatus}
                  </span>
                </button>
              )}
            </Repeat>
          </div>
        </div>
      </Show>

      <Show when={(results?.assets?.length ?? 0) > 0}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <IconPackage size={14} className="text-charcoal-700/60" />
            <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">
              Assets ({results?.assets?.length ?? 0})
            </p>
          </div>
          <div className="divide-y divide-forest-900/10 rounded-xl border border-forest-900/10 overflow-hidden">
            <Repeat each={(results?.assets ?? []) as Asset[]}>
              {(asset: Asset) => (
                <button
                  key={asset.id}
                  type="button"
                  className="flex w-full items-center justify-between gap-4 bg-white px-4 py-3 text-left hover:bg-cream-50/60 transition-colors"
                  onClick={() => navigate(ROUTES.HOSPITAL_ASSET_DETAIL(slug, asset.id))}
                >
                  <div>
                    <p className="text-sm font-medium text-charcoal-900">{asset.name}</p>
                    <p className="text-xs text-charcoal-700/60">
                      {asset.category}
                      <Show when={asset.currentLocation !== undefined}>
                        {' · '}{asset.currentLocation}
                      </Show>
                    </p>
                  </div>
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${ASSET_STATUS_STYLE[asset.status] ?? ''}`}>
                    {asset.status.replace('_', ' ')}
                  </span>
                </button>
              )}
            </Repeat>
          </div>
        </div>
      </Show>

      <Show when={(results?.labs?.length ?? 0) > 0}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <IconFlask size={14} className="text-charcoal-700/60" />
            <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">
              Lab Orders ({results?.labs?.length ?? 0})
            </p>
          </div>
          <div className="divide-y divide-forest-900/10 rounded-xl border border-forest-900/10 overflow-hidden">
            <Repeat each={(results?.labs ?? []) as LabOrder[]}>
              {(order: LabOrder) => (
                <button
                  key={order.id}
                  type="button"
                  className="flex w-full items-center justify-between gap-4 bg-white px-4 py-3 text-left hover:bg-cream-50/60 transition-colors"
                  onClick={() => navigate(`${ROUTES.HOSPITAL_LAB_ORDER(slug, order.id)}?patientId=${order.patientId}`)}
                >
                  <div>
                    <p className="text-sm font-medium text-charcoal-900">{order.testName}</p>
                    <p className="text-xs text-charcoal-700/60">Ordered by {order.orderedBy}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Show when={order.result?.isAbnormal === true}>
                      <IconAlert size={12} className="text-red-500" />
                    </Show>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${PRIORITY_STYLE[order.priority]}`}>
                      {order.priority.toUpperCase()}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${LAB_STATUS_STYLE[order.status] ?? ''}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                      {LAB_STATUS_LABEL[order.status] ?? order.status}
                    </span>
                  </div>
                </button>
              )}
            </Repeat>
          </div>
        </div>
      </Show>
    </div>
  );
}
