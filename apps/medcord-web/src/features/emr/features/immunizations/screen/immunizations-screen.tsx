import { useParams } from 'react-router-dom';
import { Loadable, Show, Repeat } from 'meemaw';
import { AppButton, DrawerService } from '@medcord/ui';
import { IconPlus } from '@icons';
import { PERMISSIONS } from '@medcord/rbac';
import { useHospitalSlug } from '@shared/hooks/use-hospital-slug.ts';
import { useAuth } from '@shared/hooks/use-auth.ts';
import { usePermissions } from '@shared/hooks/use-permissions.ts';
import { ChartLayout } from '../../../shared/chart-layout.tsx';
import { useImmunizations } from '../api/use-immunizations.ts';
import type { Immunization } from '../../../shared/types/emr.ts';
import { AddImmunizationForm } from './parts/add-immunization-form.tsx';

export function ImmunizationsScreen() {
  const slug = useHospitalSlug();
  const { activeHospitalId } = useAuth();
  const { code = '' } = useParams<{ slug: string; code: string }>();
  const { can } = usePermissions();

  const { data: immunizations, isLoading, error } = useImmunizations(activeHospitalId ?? '', code);

  return (
    <ChartLayout slug={slug} patientCode={code}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Immunizations</p>
          <Show when={can(PERMISSIONS.EMR_IMMUNIZATIONS_WRITE)}>
            <AppButton
              variant="secondary"
              leadingIcon={<IconPlus size={14} />}
              onClick={() => DrawerService.showCustomModal('Record immunization', () => (
                <AddImmunizationForm hospitalId={activeHospitalId ?? ''} patientId={code} />
              ))}
            >
              Record immunization
            </AppButton>
          </Show>
        </div>

        <Loadable
          loading={isLoading}
          error={error ?? undefined}
          loadingComponent={<div className="flex items-center justify-center py-16"><div className="h-6 w-6 animate-spin rounded-full border-2 border-forest-900/20 border-t-forest-900" /></div>}
          errorComponent={<p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error instanceof Error ? error.message : 'Failed to load immunizations.'}</p>}
        >
          <Show
            when={(immunizations?.length ?? 0) > 0}
            fallback={<p className="py-8 text-center text-sm text-charcoal-700/50">No immunizations recorded.</p>}
          >
            <div className="overflow-x-auto rounded-xl border border-forest-900/10">
              <table className="min-w-full divide-y divide-forest-900/10 bg-white">
                <thead>
                  <tr className="bg-cream-50">
                    <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-charcoal-700/60">Vaccine</th>
                    <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-charcoal-700/60">Dose</th>
                    <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-charcoal-700/60">Date</th>
                    <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-charcoal-700/60">Next due</th>
                    <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-charcoal-700/60">Administrator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-forest-900/10">
                  <Repeat each={(immunizations ?? []) as Immunization[]}>
                    {(imm: Immunization) => (
                      <tr key={imm.id} className="hover:bg-cream-50/60 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-charcoal-900">{imm.vaccine}</td>
                        <td className="px-4 py-3 text-sm text-charcoal-700">{imm.dose ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-charcoal-700">{new Date(imm.administeredAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-sm text-charcoal-700">
                          {imm.nextDueDate ? new Date(imm.nextDueDate).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-charcoal-700">{imm.administrator}</td>
                      </tr>
                    )}
                  </Repeat>
                </tbody>
              </table>
            </div>
          </Show>
        </Loadable>
      </div>
    </ChartLayout>
  );
}
