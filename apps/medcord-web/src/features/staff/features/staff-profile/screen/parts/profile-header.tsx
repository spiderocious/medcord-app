import { Show } from 'meemaw';

import { AppButton, AppText } from '@medcord/ui';
import { IconUserX, IconUserCheck, IconTrash } from '@icons';
import type { StaffMember } from '../../../../shared/types/staff.ts';

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  hospital_admin: 'Admin',
  doctor: 'Doctor',
  nurse: 'Nurse',
  nurse_practitioner: 'Nurse Practitioner',
  physician_assistant: 'Physician Assistant',
  lab_tech: 'Lab Tech',
  pharmacist: 'Pharmacist',
  reception: 'Reception',
  tech: 'Tech',
  custom: 'Custom',
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter((p) => p.length > 0);
  if (parts.length === 0) return '?';
  const first = parts[0] ?? '';
  const last = parts[parts.length - 1] ?? '';
  if (parts.length === 1) return first.slice(0, 2).toUpperCase();
  return ((first[0] ?? '') + (last[0] ?? '')).toUpperCase();
}

interface ProfileHeaderProps {
  readonly member: StaffMember;
  readonly onSuspend: () => void;
  readonly onActivate: () => void;
  readonly onRemove: () => void;
}

export function ProfileHeader({ member, onSuspend, onActivate, onRemove }: ProfileHeaderProps) {
  const roleLabel = ROLE_LABELS[member.role] ?? member.role;

  return (
    <div className="overflow-hidden rounded-xl border border-forest-900/10 bg-white shadow-sm">
      <div
        className={[
          'h-1.5 w-full',
          member.status === 'active' ? 'bg-forest-900' : 'bg-red-400',
        ].join(' ')}
      />

      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:gap-6 sm:p-6">
        {/* Avatar */}
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-forest-900 text-lg font-semibold text-white sm:h-20 sm:w-20 sm:text-xl">
          {member.name != null && member.name !== ''
            ? getInitials(member.name)
            : member.role.slice(0, 2).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
            <AppText variant="heading-2" className="text-charcoal-900">
              {member.name ?? roleLabel}
            </AppText>
            <span
              className={[
                'inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                member.status === 'active'
                  ? 'bg-forest-900/10 text-forest-900'
                  : 'bg-red-50 text-red-600',
              ].join(' ')}
            >
              {member.status === 'active' ? 'Active' : 'Suspended'}
            </span>
          </div>

          <AppText variant="body-sm" className="mt-0.5 text-charcoal-700">
            {roleLabel}
            {member.department !== undefined ? ` · ${member.department}` : ''}
            {member.unit !== undefined ? ` · ${member.unit}` : ''}
          </AppText>

          <AppText variant="caption" as="p" className="mt-1 normal-case tracking-normal text-charcoal-700/60">
            {member.email ?? member.id}
          </AppText>
        </div>

        <div className="flex items-center gap-2 sm:shrink-0">
          <Show when={member.status === 'active'}>
            <AppButton
              variant="secondary"
              leadingIcon={<IconUserX size={14} />}
              onClick={onSuspend}
            >
              Suspend
            </AppButton>
          </Show>
          <Show when={member.status === 'suspended'}>
            <AppButton
              variant="secondary"
              leadingIcon={<IconUserCheck size={14} />}
              onClick={onActivate}
            >
              Activate
            </AppButton>
          </Show>
          <AppButton
            variant="ghost"
            leadingIcon={<IconTrash size={14} />}
            onClick={onRemove}
          >
            Remove
          </AppButton>
        </div>
      </div>
    </div>
  );
}
