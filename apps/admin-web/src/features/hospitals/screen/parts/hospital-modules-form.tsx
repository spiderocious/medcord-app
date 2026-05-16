import { useState } from 'react';
import { DrawerService, AppButton } from '@medcord/ui';

import type { AdminHospital, HospitalModules } from '@shared/types/admin.ts';
import { useUpdateAdminHospital } from '../../api/use-admin-hospitals.ts';

interface HospitalModulesFormProps {
  readonly hospital: AdminHospital;
}

export function HospitalModulesForm({ hospital }: HospitalModulesFormProps) {
  const mutation = useUpdateAdminHospital(hospital.id);
  const [modules, setModules] = useState<HospitalModules>({ ...hospital.modules });

  function toggle(key: keyof HospitalModules) {
    setModules((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleSave() {
    mutation.mutate(
      { modules },
      {
        onSuccess: () => {
          DrawerService.toast('Modules updated.', { type: 'success' });
        },
      },
    );
  }

  const entries: { key: keyof HospitalModules; label: string }[] = [
    { key: 'emr', label: 'EMR' },
    { key: 'labs', label: 'Labs' },
    { key: 'assets', label: 'Assets' },
    { key: 'onlineConsultation', label: 'Online Consultation' },
  ];

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Modules</p>
      <div className="space-y-2">
        {entries.map(({ key, label }) => (
          <label key={key} className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={modules[key]}
              onChange={() => toggle(key)}
              disabled={mutation.isPending}
              className="h-4 w-4 rounded border-forest-900/30 text-forest-900 focus:ring-forest-900"
            />
            <span className="text-sm text-charcoal-900">{label}</span>
          </label>
        ))}
      </div>
      <AppButton
        variant="secondary"
        onClick={handleSave}
        loading={mutation.isPending}
      >
        Save modules
      </AppButton>
    </div>
  );
}
