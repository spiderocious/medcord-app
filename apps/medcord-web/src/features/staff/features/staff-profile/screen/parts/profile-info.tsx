import { useState, type FormEvent } from 'react';
import { Show, Repeat } from 'meemaw';

import { AppButton, AppText } from '@medcord/ui';
import { parseApiError } from '@medcord/api';
import { IconEdit, IconCheckCircle } from '@icons';
import type { StaffRole } from '@shared/types/hospital.ts';
import type { StaffMember } from '../../../../shared/types/staff.ts';
import { useUpdateStaff } from '../../api/use-update-staff.ts';

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

interface ProfileInfoProps {
  readonly member: StaffMember;
}

export function ProfileInfo({ member }: ProfileInfoProps) {
  const mutation = useUpdateStaff(member.hospitalId, member.id);

  const [editing, setEditing] = useState(false);
  const [role, setRole] = useState<StaffRole>(member.role);
  const [department, setDepartment] = useState(member.department ?? '');
  const [unit, setUnit] = useState(member.unit ?? '');
  const [specialty, setSpecialty] = useState(member.specialty ?? '');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    try {
      await mutation.mutateAsync({
        role,
        ...(department.trim() !== '' ? { department: department.trim() } : {}),
        ...(unit.trim() !== '' ? { unit: unit.trim() } : {}),
        ...(specialty.trim() !== '' ? { specialty: specialty.trim() } : {}),
      });
      setSaved(true);
      setEditing(false);
    } catch (err: unknown) {
      setError(parseApiError(err).message);
    }
  }

  function handleCancel() {
    setRole(member.role);
    setDepartment(member.department ?? '');
    setUnit(member.unit ?? '');
    setSpecialty(member.specialty ?? '');
    setError(null);
    setEditing(false);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-forest-900/10 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-forest-900/10 px-5 py-3">
        <AppText variant="caption" className="font-semibold uppercase text-charcoal-700/60">
          Role & placement
        </AppText>
        <Show when={!editing}>
          <AppButton
            variant="ghost"
            leadingIcon={<IconEdit size={13} />}
            onClick={() => setEditing(true)}
          >
            Edit
          </AppButton>
        </Show>
      </div>

      <Show
        when={editing}
        fallback={
          <dl className="grid gap-x-8 gap-y-4 p-5 sm:grid-cols-2 sm:p-6">
            <div>
              <AppText variant="caption" as="dt" className="normal-case tracking-normal text-charcoal-700/60">Role</AppText>
              <AppText variant="body-sm" as="dd" className="mt-0.5 font-medium text-charcoal-900 capitalize">
                {member.role.replace(/_/g, ' ')}
              </AppText>
            </div>
            <div>
              <AppText variant="caption" as="dt" className="normal-case tracking-normal text-charcoal-700/60">Department</AppText>
              <AppText variant="body-sm" as="dd" className="mt-0.5 font-medium text-charcoal-900">
                {member.department ?? '—'}
              </AppText>
            </div>
            <div>
              <AppText variant="caption" as="dt" className="normal-case tracking-normal text-charcoal-700/60">Unit</AppText>
              <AppText variant="body-sm" as="dd" className="mt-0.5 font-medium text-charcoal-900">
                {member.unit ?? '—'}
              </AppText>
            </div>
            <div>
              <AppText variant="caption" as="dt" className="normal-case tracking-normal text-charcoal-700/60">Specialty</AppText>
              <AppText variant="body-sm" as="dd" className="mt-0.5 font-medium text-charcoal-900">
                {member.specialty ?? '—'}
              </AppText>
            </div>
            <div>
              <AppText variant="caption" as="dt" className="normal-case tracking-normal text-charcoal-700/60">Joined</AppText>
              <AppText variant="body-sm" as="dd" className="mt-0.5 font-medium text-charcoal-900">
                {new Date(member.joinedAt).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })}
              </AppText>
            </div>
          </dl>
        }
      >
        <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4 p-5 sm:p-6">
          <div>
            <label htmlFor="pi-role" className="block text-sm font-medium text-charcoal-900">Role</label>
            <select
              id="pi-role"
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
              <label htmlFor="pi-dept" className="block text-sm font-medium text-charcoal-900">
                Department <span className="font-normal text-charcoal-700">(optional)</span>
              </label>
              <input
                id="pi-dept"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                disabled={mutation.isPending}
                className={INPUT_CLS}
                placeholder="Cardiology"
              />
            </div>
            <div>
              <label htmlFor="pi-unit" className="block text-sm font-medium text-charcoal-900">
                Unit <span className="font-normal text-charcoal-700">(optional)</span>
              </label>
              <input
                id="pi-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                disabled={mutation.isPending}
                className={INPUT_CLS}
                placeholder="ICU"
              />
            </div>
          </div>

          <div>
            <label htmlFor="pi-specialty" className="block text-sm font-medium text-charcoal-900">
              Specialty <span className="font-normal text-charcoal-700">(optional)</span>
            </label>
            <input
              id="pi-specialty"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              disabled={mutation.isPending}
              className={INPUT_CLS}
              placeholder="Cardiothoracic surgery"
            />
          </div>

          <Show when={saved}>
            <div className="flex items-center gap-2 rounded-lg bg-forest-900/5 px-3 py-2 text-sm text-forest-900">
              <IconCheckCircle size={14} />
              Changes saved
            </div>
          </Show>

          <Show when={error !== null}>
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          </Show>

          <div className="flex items-center gap-2">
            <AppButton type="submit" loading={mutation.isPending}>
              Save changes
            </AppButton>
            <AppButton type="button" variant="ghost" onClick={handleCancel} disabled={mutation.isPending}>
              Cancel
            </AppButton>
          </div>
        </form>
      </Show>
    </div>
  );
}
