import { useParams } from 'react-router-dom';
import { Loadable, Show, Repeat } from 'meemaw';
import { AppButton, DrawerService } from '@medcord/ui';
import { IconPlus } from '@icons';
import { PERMISSIONS } from '@medcord/rbac';
import { useHospitalSlug } from '@shared/hooks/use-hospital-slug.ts';
import { useAuth } from '@shared/hooks/use-auth.ts';
import { usePermissions } from '@shared/hooks/use-permissions.ts';
import { ChartLayout } from '../../../shared/chart-layout.tsx';
import { useMedications } from '../api/use-medications.ts';
import type { Medication, MedicationStatus } from '../../../shared/types/emr.ts';
import { AddMedicationForm } from './parts/add-medication-form.tsx';
import { UpdateMedicationForm } from './parts/update-medication-form.tsx';

const STATUS_STYLE: Record<MedicationStatus, string> = {
  active: 'text-records-800 border-records-200 bg-records-50',
  discontinued: 'text-charcoal-700 border-forest-900/10 bg-cream-50',
  on_hold: 'text-equipment-800 border-equipment-200 bg-equipment-50',
};

const STATUS_LABEL: Record<MedicationStatus, string> = {
  active: 'Active',
  discontinued: 'Discontinued',
  on_hold: 'On hold',
};

export function MedicationsScreen() {
  const slug = useHospitalSlug();
  const { activeHospitalId } = useAuth();
  const { code = '' } = useParams<{ slug: string; code: string }>();
  const { can } = usePermissions();

  const { data: medications, isLoading, error } = useMedications(activeHospitalId ?? '', code);

  function handleUpdate(med: Medication) {
    DrawerService.showCustomModal('Update medication', () => (
      <UpdateMedicationForm med={med} hospitalId={activeHospitalId ?? ''} patientId={code} />
    ));
  }

  return (
    <ChartLayout slug={slug} patientCode={code}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Medications</p>
          <Show when={can(PERMISSIONS.EMR_MEDICATIONS_WRITE)}>
            <AppButton
              variant="secondary"
              leadingIcon={<IconPlus size={14} />}
              onClick={() => DrawerService.showCustomModal('Add medication', () => (
                <AddMedicationForm hospitalId={activeHospitalId ?? ''} patientId={code} />
              ))}
            >
              Add medication
            </AppButton>
          </Show>
        </div>

        <Loadable
          loading={isLoading}
          error={error ?? undefined}
          loadingComponent={<div className="flex items-center justify-center py-16"><div className="h-6 w-6 animate-spin rounded-full border-2 border-forest-900/20 border-t-forest-900" /></div>}
          errorComponent={<p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error instanceof Error ? error.message : 'Failed to load medications.'}</p>}
        >
          <Show
            when={(medications?.length ?? 0) > 0}
            fallback={<p className="py-8 text-center text-sm text-charcoal-700/50">No medications recorded.</p>}
          >
            <div className="divide-y divide-forest-900/10 rounded-xl border border-forest-900/10 overflow-hidden">
              <Repeat each={(medications ?? []) as Medication[]}>
                {(med: Medication) => (
                  <div key={med.id} className="flex flex-wrap items-start justify-between gap-3 bg-white px-4 py-4 hover:bg-cream-50/60 transition-colors">
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-sm font-medium text-charcoal-900">{med.drug}</p>
                      <p className="text-xs text-charcoal-700/60">
                        {[med.strength, med.route, med.frequency].filter(Boolean).join(' · ')}
                      </p>
                      <Show when={med.indication !== undefined}>
                        <p className="text-xs text-charcoal-700/60">Indication: {med.indication}</p>
                      </Show>
                      <p className="text-xs text-charcoal-700/40">Prescribed by {med.prescribedBy}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[med.status]}`}>
                        {STATUS_LABEL[med.status]}
                      </span>
                      <Show when={can(PERMISSIONS.EMR_MEDICATIONS_WRITE)}>
                        <AppButton variant="ghost" onClick={() => handleUpdate(med)}>Update</AppButton>
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
