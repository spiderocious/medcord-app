import { useParams } from 'react-router-dom';
import { Loadable, Show, Repeat } from 'meemaw';
import { AppButton, DrawerService } from '@medcord/ui';
import { IconPlus } from '@icons';
import { PERMISSIONS } from '@medcord/rbac';
import { useHospitalSlug } from '@shared/hooks/use-hospital-slug.ts';
import { useAuth } from '@shared/hooks/use-auth.ts';
import { usePermissions } from '@shared/hooks/use-permissions.ts';
import { ChartLayout } from '../../../shared/chart-layout.tsx';
import { useProcedures } from '../api/use-procedures.ts';
import type { Procedure } from '../../../shared/types/emr.ts';
import { AddProcedureForm } from './parts/add-procedure-form.tsx';

export function ProceduresScreen() {
  const slug = useHospitalSlug();
  const { activeHospitalId } = useAuth();
  const { code = '' } = useParams<{ slug: string; code: string }>();
  const { can } = usePermissions();

  const { data: procedures, isLoading, error } = useProcedures(activeHospitalId ?? '', code);

  return (
    <ChartLayout slug={slug} patientCode={code}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Procedures</p>
          <Show when={can(PERMISSIONS.EMR_PROCEDURES_WRITE)}>
            <AppButton
              variant="secondary"
              leadingIcon={<IconPlus size={14} />}
              onClick={() => DrawerService.showCustomModal('Record procedure', () => (
                <AddProcedureForm hospitalId={activeHospitalId ?? ''} patientId={code} />
              ))}
            >
              Record procedure
            </AppButton>
          </Show>
        </div>

        <Loadable
          loading={isLoading}
          error={error ?? undefined}
          loadingComponent={<div className="flex items-center justify-center py-16"><div className="h-6 w-6 animate-spin rounded-full border-2 border-forest-900/20 border-t-forest-900" /></div>}
          errorComponent={<p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error instanceof Error ? error.message : 'Failed to load procedures.'}</p>}
        >
          <Show
            when={(procedures?.length ?? 0) > 0}
            fallback={<p className="py-8 text-center text-sm text-charcoal-700/50">No procedures recorded.</p>}
          >
            <div className="divide-y divide-forest-900/10 rounded-xl border border-forest-900/10 overflow-hidden">
              <Repeat each={(procedures ?? []) as Procedure[]}>
                {(proc: Procedure) => (
                  <div key={proc.id} className="bg-white px-4 py-4 hover:bg-cream-50/60 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-charcoal-900">{proc.name}</p>
                        <p className="text-xs text-charcoal-700/60 mt-0.5">
                          {new Date(proc.performedAt).toLocaleDateString()} · {proc.performedBy}
                        </p>
                        <Show when={proc.location !== undefined}>
                          <p className="text-xs text-charcoal-700/60">{proc.location}</p>
                        </Show>
                        <Show when={proc.notes !== undefined}>
                          <p className="mt-1 text-xs text-charcoal-700">{proc.notes}</p>
                        </Show>
                      </div>
                      <Show when={proc.cptCode !== undefined}>
                        <span className="flex-shrink-0 font-mono text-xs text-charcoal-700/50">{proc.cptCode}</span>
                      </Show>
                    </div>
                  </div>
                )}
              </Repeat>
            </div>
          </Show>
        </Loadable>
      </div>
    </ChartLayout>
  );
}
