import { useState, type FormEvent } from 'react';
import { Show, Repeat } from 'meemaw';

import { AppButton, AppText } from '@medcord/ui';
import { parseApiError } from '@medcord/api';
import { IconCheckCircle } from '@icons';
import type { StaffRole } from '@shared/types/hospital.ts';
import type { InvitePayload } from '../../api/use-invite-staff.ts';
import { useInviteStaff } from '../../api/use-invite-staff.ts';

const INPUT_CLS =
  'mt-1 block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 placeholder-charcoal-700/50 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900 disabled:cursor-not-allowed disabled:opacity-50';

interface RoleOption {
  readonly value: StaffRole;
  readonly label: string;
}

const ROLE_OPTIONS: ReadonlyArray<RoleOption> = [
  { value: 'doctor', label: 'Doctor' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'nurse_practitioner', label: 'Nurse Practitioner' },
  { value: 'physician_assistant', label: 'Physician Assistant' },
  { value: 'lab_tech', label: 'Lab Tech' },
  { value: 'pharmacist', label: 'Pharmacist' },
  { value: 'reception', label: 'Reception' },
  { value: 'hospital_admin', label: 'Hospital Admin' },
  { value: 'tech', label: 'Tech' },
];

interface InviteFormProps {
  readonly hospitalId: string;
}

export function InviteForm({ hospitalId }: InviteFormProps) {
  const mutation = useInviteStaff(hospitalId);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<StaffRole>('doctor');
  const [department, setDepartment] = useState('');
  const [unit, setUnit] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [invited, setInvited] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInvited(null);

    const payload: InvitePayload = {
      email: email.trim(),
      role,
      ...(department.trim() !== '' ? { department: department.trim() } : {}),
      ...(unit.trim() !== '' ? { unit: unit.trim() } : {}),
    };

    try {
      await mutation.mutateAsync(payload);
      setInvited(email.trim());
      setEmail('');
      setDepartment('');
      setUnit('');
    } catch (err: unknown) {
      setError(parseApiError(err).message);
    }
  }

  return (
    <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
      <div>
        <AppText variant="heading-3" className="text-charcoal-900">Invite by email</AppText>
        <AppText variant="body-sm" className="mt-1 text-charcoal-700">
          Send an invitation to a team member's email address.
        </AppText>
      </div>

      <div className="rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm space-y-4 sm:p-6">
        <div>
          <label htmlFor="if-email" className="block text-sm font-medium text-charcoal-900">
            Email address
          </label>
          <input
            id="if-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={mutation.isPending}
            className={INPUT_CLS}
            placeholder="doctor@hospital.ng"
          />
        </div>

        <div>
          <label htmlFor="if-role" className="block text-sm font-medium text-charcoal-900">
            Role
          </label>
          <select
            id="if-role"
            value={role}
            onChange={(e) => setRole(e.target.value as StaffRole)}
            disabled={mutation.isPending}
            className={INPUT_CLS}
          >
            <Repeat each={ROLE_OPTIONS as RoleOption[]}>
              {(opt: RoleOption) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              )}
            </Repeat>
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="if-dept" className="block text-sm font-medium text-charcoal-900">
              Department <span className="font-normal text-charcoal-700">(optional)</span>
            </label>
            <input
              id="if-dept"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              disabled={mutation.isPending}
              className={INPUT_CLS}
              placeholder="Cardiology"
            />
          </div>
          <div>
            <label htmlFor="if-unit" className="block text-sm font-medium text-charcoal-900">
              Unit <span className="font-normal text-charcoal-700">(optional)</span>
            </label>
            <input
              id="if-unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              disabled={mutation.isPending}
              className={INPUT_CLS}
              placeholder="ICU"
            />
          </div>
        </div>

        <Show when={invited !== null}>
          <div className="flex items-center gap-2 rounded-lg bg-forest-900/5 px-3 py-2 text-sm text-forest-900">
            <IconCheckCircle size={14} className="shrink-0" />
            Invitation sent to <strong>{invited}</strong>
          </div>
        </Show>

        <Show when={error !== null}>
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        </Show>

        <AppButton type="submit" loading={mutation.isPending} disabled={email.trim() === ''}>
          Send invitation
        </AppButton>
      </div>
    </form>
  );
}
