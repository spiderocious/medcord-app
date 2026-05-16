import { Show } from 'meemaw';
import type { Patient } from '../../../../shared/types/patient.ts';

interface ProfileDemographicsProps {
  readonly patient: Patient;
}

function Field({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div>
      <p className="text-xs font-mono uppercase tracking-wider text-charcoal-700/60">{label}</p>
      <p className="mt-0.5 text-sm text-charcoal-900">{value ?? <span className="text-charcoal-700/40">—</span>}</p>
    </div>
  );
}

export function ProfileDemographics({ patient }: ProfileDemographicsProps) {
  const { demographics, emergencyContact, guarantor } = patient;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Demographics</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date of birth" value={new Date(demographics.dateOfBirth).toLocaleDateString()} />
          <Field label="Sex" value={demographics.sex.charAt(0).toUpperCase() + demographics.sex.slice(1)} />
          <Field label="Gender identity" value={demographics.gender} />
          <Field label="Phone" value={demographics.phone} />
          <Field label="Email" value={demographics.email} />
          <Field label="Address" value={demographics.address} />
          <Field label="Religion" value={demographics.religion} />
          <Field label="Cultural preferences" value={demographics.culturalPreferences} />
        </div>
      </div>

      <Show when={emergencyContact !== undefined}>
        <div className="rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Emergency contact</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" value={emergencyContact?.name} />
            <Field label="Relationship" value={emergencyContact?.relationship} />
            <Field label="Phone" value={emergencyContact?.phone} />
          </div>
        </div>
      </Show>

      <Show when={guarantor !== undefined}>
        <div className="rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Guarantor</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" value={guarantor?.name} />
            <Field label="Relationship" value={guarantor?.relationship} />
            <Field label="Phone" value={guarantor?.phone} />
            <Field label="Address" value={guarantor?.address} />
          </div>
        </div>
      </Show>
    </div>
  );
}
