import { useState } from 'react';
import { Show } from 'meemaw';

import { AppButton, AppText } from '@medcord/ui';
import { parseApiError } from '@medcord/api';
import type { Hospital, HospitalModules } from '@shared/types/hospital.ts';
import { useUpdateModules } from '../../api/use-update-modules.ts';

interface ModuleRowProps {
  readonly label: string;
  readonly description: string;
  readonly enabled: boolean;
  readonly onChange: (val: boolean) => void;
  readonly disabled: boolean;
}

function ModuleRow({ label, description, enabled, onChange, disabled }: ModuleRowProps) {
  return (
    <div className="flex items-start gap-4 py-4">
      <div className="flex-1 min-w-0">
        <AppText variant="body-sm" as="p" className="font-semibold text-charcoal-900">{label}</AppText>
        <AppText variant="caption" as="p" className="mt-0.5 normal-case tracking-normal text-charcoal-700">
          {description}
        </AppText>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        disabled={disabled}
        className={[
          'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-forest-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          enabled ? 'bg-forest-900' : 'bg-charcoal-700/20',
        ].join(' ')}
      >
        <span
          className={[
            'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg transition-transform',
            enabled ? 'translate-x-4' : 'translate-x-0',
          ].join(' ')}
        />
      </button>
    </div>
  );
}

interface SettingsModulesProps {
  readonly hospital: Hospital;
}

export function SettingsModules({ hospital }: SettingsModulesProps) {
  const mutation = useUpdateModules(hospital.id);

  const [modules, setModules] = useState<HospitalModules>({ ...hospital.modules });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function toggle(key: keyof HospitalModules) {
    setModules((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSave() {
    setError(null);
    setSaved(false);
    try {
      await mutation.mutateAsync(modules);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError(parseApiError(err).message);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <AppText variant="heading-3" className="text-charcoal-900">Modules</AppText>
        <AppText variant="body-sm" className="mt-1 text-charcoal-700">
          Enable or disable features for your hospital workspace.
        </AppText>
      </div>

      <div className="rounded-xl border border-forest-900/10 bg-white px-5 shadow-sm sm:px-6">
        <div className="divide-y divide-forest-900/10">
          <ModuleRow
            label="Electronic Medical Records (EMR)"
            description="Patient charts, vitals, medications, diagnoses, and procedures."
            enabled={modules.emr}
            onChange={() => toggle('emr')}
            disabled={mutation.isPending}
          />
          <ModuleRow
            label="Labs"
            description="Lab order management, specimen tracking, and result sign-off."
            enabled={modules.labs}
            onChange={() => toggle('labs')}
            disabled={mutation.isPending}
          />
          <ModuleRow
            label="Asset Registry"
            description="Track equipment, label assets, and manage location history."
            enabled={modules.assets}
            onChange={() => toggle('assets')}
            disabled={mutation.isPending}
          />
          <ModuleRow
            label="Online Consultation"
            description="Remote patient consultations and telehealth sessions."
            enabled={modules.onlineConsultation}
            onChange={() => toggle('onlineConsultation')}
            disabled={mutation.isPending}
          />
        </div>
      </div>

      <Show when={error !== null}>
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      </Show>

      <div className="flex items-center gap-3">
        <AppButton onClick={() => { void handleSave(); }} loading={mutation.isPending}>
          Save changes
        </AppButton>
        <Show when={saved}>
          <span className="text-sm text-forest-900">Saved!</span>
        </Show>
      </div>
    </div>
  );
}
