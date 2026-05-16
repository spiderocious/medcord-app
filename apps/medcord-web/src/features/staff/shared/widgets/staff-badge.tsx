import { Show } from 'meemaw';

import { AppText } from '@medcord/ui';
import type { StaffRole } from '@shared/types/hospital.ts';

interface StaffBadgeProps {
  readonly name: string;
  readonly role: StaffRole;
  readonly email?: string;
  readonly size?: 'sm' | 'md';
}

const ROLE_LABELS: Record<StaffRole, string> = {
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
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');
}

export function StaffBadge({ name, role, email, size = 'md' }: StaffBadgeProps) {
  const initials = getInitials(name);
  const isSmall = size === 'sm';

  return (
    <div className="flex items-center gap-2.5">
      <div
        className={[
          'shrink-0 flex items-center justify-center rounded-full font-semibold bg-forest-900/10 text-forest-900 border border-forest-900/15',
          isSmall ? 'h-7 w-7 text-xs' : 'h-9 w-9 text-sm',
        ].join(' ')}
      >
        {initials}
      </div>
      <div className="min-w-0">
        <AppText
          variant={isSmall ? 'caption' : 'body-sm'}
          as="p"
          className="truncate font-semibold normal-case tracking-normal text-charcoal-900"
        >
          {name}
        </AppText>
        <Show when={email !== undefined}>
          <AppText variant="caption" as="p" className="truncate normal-case tracking-normal text-charcoal-700">
            {email}
          </AppText>
        </Show>
        <span className="inline-flex items-center rounded-full border border-forest-900/10 bg-cream-50 px-1.5 py-px text-xs text-charcoal-700">
          {ROLE_LABELS[role]}
        </span>
      </div>
    </div>
  );
}
