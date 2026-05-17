import { useState, useEffect, useRef } from 'react';
import { Loadable, Repeat, Show } from 'meemaw';

import { AppButton } from '@medcord/ui';
import { useAuditLog } from '@features/workspace/features/audit-log/api/use-audit-log.ts';
import type { AuditAction, AuditLog } from '@shared/types/audit.ts';
import { ROUTES } from '@shared/constants/routes.ts';
import { EntityLink } from '@shared/components/entity-link.tsx';

interface SettingsAuditLogProps {
  readonly hospitalId: string;
  readonly slug: string;
}

const AUDIT_ACTIONS: AuditAction[] = [
  'patient.created',
  'patient.updated',
  'patient.admitted',
  'patient.discharged',
  'patient.transferred',
  'emr.accessed',
  'emr.break_glass',
  'lab.created',
  'lab.result_recorded',
  'lab.result_released',
  'member.invited',
  'member.suspended',
  'member.removed',
  'hospital.updated',
  'asset.created',
  'asset.status_changed',
  'review.acted',
];

const AUDIT_ACTION_LABEL: Record<AuditAction, string> = {
  'patient.created': 'Patient created',
  'patient.updated': 'Patient updated',
  'patient.admitted': 'Patient admitted',
  'patient.discharged': 'Patient discharged',
  'patient.transferred': 'Patient transferred',
  'emr.accessed': 'EMR accessed',
  'emr.break_glass': 'Break-glass access',
  'lab.created': 'Lab order created',
  'lab.result_recorded': 'Lab result recorded',
  'lab.result_released': 'Lab result released',
  'member.invited': 'Member invited',
  'member.suspended': 'Member suspended',
  'member.removed': 'Member removed',
  'hospital.updated': 'Hospital updated',
  'asset.created': 'Asset created',
  'asset.status_changed': 'Asset status changed',
  'review.acted': 'Review acted on',
};

const INPUT_CLS = 'rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900';

function auditResourceRoute(slug: string, id: string): string {
  if (id.startsWith('LAB-')) return ROUTES.HOSPITAL_LAB_ORDER(slug, id);
  if (id.startsWith('AST-')) return ROUTES.HOSPITAL_ASSET_DETAIL(slug, id);
  if (id.startsWith('STF-') || id.startsWith('MBR-')) return ROUTES.HOSPITAL_STAFF_PROFILE(slug, id);
  return ROUTES.HOSPITAL_PATIENT_PROFILE(slug, id);
}

export function SettingsAuditLog({ hospitalId, slug }: SettingsAuditLogProps) {
  const [action, setAction] = useState<AuditAction | ''>('');
  const [actorIdInput, setActorIdInput] = useState('');
  const [actorId, setActorId] = useState('');
  const [page, setPage] = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setActorId(actorIdInput);
      setPage(1);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [actorIdInput]);

  const { data, isLoading, error } = useAuditLog(hospitalId, {
    action: action !== '' ? action : undefined,
    actorId: actorId !== '' ? actorId : undefined,
    page,
  });

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-charcoal-900">Audit Log</p>
        <p className="text-sm text-charcoal-700/60 mt-0.5">All system activity for this hospital</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={action}
          onChange={(e) => { setAction(e.target.value as AuditAction | ''); setPage(1); }}
          className={INPUT_CLS}
        >
          <option value="">All actions</option>
          {AUDIT_ACTIONS.map((a) => (
            <option key={a} value={a}>{AUDIT_ACTION_LABEL[a]}</option>
          ))}
        </select>
        <input
          type="text"
          value={actorIdInput}
          onChange={(e) => setActorIdInput(e.target.value)}
          placeholder="Filter by actor ID…"
          className={INPUT_CLS}
        />
      </div>

      <Loadable
        loading={isLoading}
        error={error ?? undefined}
        loadingComponent={
          <div className="flex items-center justify-center py-10">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-forest-900/20 border-t-forest-900" />
          </div>
        }
        errorComponent={
          <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error instanceof Error ? error.message : 'Failed to load audit log.'}
          </p>
        }
      >
        <Show
          when={(data?.items.length ?? 0) > 0}
          fallback={<p className="py-8 text-center text-sm text-charcoal-700/60">No audit events found.</p>}
        >
          <div className="overflow-x-auto rounded-xl border border-forest-900/10">
            <table className="w-full">
              <thead>
                <tr className="border-b border-forest-900/10 bg-cream-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Resource</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Actor ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">IP</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Date</th>
                </tr>
              </thead>
              <tbody>
                <Repeat each={(data?.items ?? []) as AuditLog[]}>
                  {(log: AuditLog) => (
                    <tr key={log.id} className="border-b border-forest-900/5 last:border-0">
                      <td className="px-4 py-3 text-sm font-medium text-charcoal-900">
                        {AUDIT_ACTION_LABEL[log.action]}
                      </td>
                      <td className="px-4 py-3 text-sm text-charcoal-700">
                        <span className="font-medium">{log.resourceType}</span>
                        <span className="ml-2">
                          <EntityLink id={log.resourceId} to={auditResourceRoute(slug, log.resourceId)} label={log.resourceType} />
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <EntityLink id={log.actorId} to={ROUTES.HOSPITAL_STAFF_PROFILE(slug, log.actorId)} label="Staff member" />
                      </td>
                      <td className="px-4 py-3 text-sm text-charcoal-700">
                        <Show when={log.actorRole !== undefined}>
                          <span>{log.actorRole}</span>
                        </Show>
                      </td>
                      <td className="px-4 py-3 text-xs text-charcoal-700/60">
                        <Show when={log.ipAddress !== undefined}>
                          <span>{log.ipAddress}</span>
                        </Show>
                      </td>
                      <td className="px-4 py-3 text-xs text-charcoal-700">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  )}
                </Repeat>
              </tbody>
            </table>
          </div>
        </Show>

        {/* Pagination */}
        <Show when={data !== undefined && data.totalPages > 1}>
          <div className="flex items-center justify-between pt-2">
            <AppButton
              variant="ghost"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Prev
            </AppButton>
            <span className="text-sm text-charcoal-700">
              Page {data?.page ?? 1} of {data?.totalPages ?? 1}
            </span>
            <AppButton
              variant="ghost"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= (data?.totalPages ?? 1)}
            >
              Next
            </AppButton>
          </div>
        </Show>
      </Loadable>
    </div>
  );
}
