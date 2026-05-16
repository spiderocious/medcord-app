import { Link } from 'react-router-dom';
import { Repeat } from 'meemaw';

import { AppButton, AppText } from '@medcord/ui';
import { IconChevronRight } from '@icons';
import { ROUTES } from '@shared/constants/routes.ts';
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

interface StaffTableProps {
  readonly slug: string;
  readonly hospitalId: string;
  readonly members: readonly StaffMember[];
}

export function StaffTable({ slug, members }: StaffTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-forest-900/10 bg-white shadow-sm">
      <div className="hidden grid-cols-[1fr_160px_120px_100px] gap-4 border-b border-forest-900/10 px-5 py-3 sm:grid">
        <AppText variant="caption" className="font-semibold uppercase text-charcoal-700/60">Staff member</AppText>
        <AppText variant="caption" className="font-semibold uppercase text-charcoal-700/60">Role</AppText>
        <AppText variant="caption" className="font-semibold uppercase text-charcoal-700/60">Status</AppText>
        <span />
      </div>

      <div className="divide-y divide-forest-900/10">
        <Repeat each={members as StaffMember[]}>
          {(member: StaffMember) => (
            <div
              key={member.id}
              className="flex flex-col gap-3 px-4 py-4 sm:grid sm:grid-cols-[1fr_160px_120px_80px] sm:items-center sm:gap-4 sm:px-5"
            >
              {/* Identity */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-forest-900 text-xs font-semibold text-white">
                  {member.name != null && member.name !== ''
                    ? getInitials(member.name)
                    : member.role.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <AppText variant="body-sm" as="p" className="truncate font-medium text-charcoal-900">
                    {member.name ?? '—'}
                  </AppText>
                  <AppText variant="caption" as="p" className="normal-case tracking-normal text-charcoal-700/60 truncate">
                    {member.email ?? member.userId}
                  </AppText>
                </div>
              </div>

              <AppText variant="caption" as="p" className="normal-case tracking-normal text-charcoal-700 sm:truncate">
                {ROLE_LABELS[member.role] ?? member.role}
              </AppText>

              <span
                className={[
                  'inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium',
                  member.status === 'active'
                    ? 'bg-forest-900/10 text-forest-900'
                    : 'bg-red-50 text-red-600',
                ].join(' ')}
              >
                {member.status === 'active' ? 'Active' : 'Suspended'}
              </span>

              <div className="flex items-center sm:justify-end">
                <Link to={ROUTES.HOSPITAL_STAFF_PROFILE(slug, member.id)}>
                  <AppButton variant="ghost" trailingIcon={<IconChevronRight size={13} />}>
                    <span className="hidden sm:inline">View</span>
                  </AppButton>
                </Link>
              </div>
            </div>
          )}
        </Repeat>
      </div>
    </div>
  );
}
