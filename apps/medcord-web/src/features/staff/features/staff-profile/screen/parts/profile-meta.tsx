import { AppText } from '@medcord/ui';
import type { StaffMember } from '../../../../shared/types/staff.ts';

interface MetaRowProps {
  readonly label: string;
  readonly value: string;
}

function MetaRow({ label, value }: MetaRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <AppText variant="caption" as="span" className="normal-case tracking-normal text-charcoal-700/60 shrink-0">
        {label}
      </AppText>
      <AppText variant="caption" as="span" className="normal-case tracking-normal text-charcoal-900 font-medium text-right break-all">
        {value}
      </AppText>
    </div>
  );
}

interface ProfileMetaProps {
  readonly member: StaffMember;
}

export function ProfileMeta({ member }: ProfileMetaProps) {
  const joinedFormatted = new Date(member.joinedAt).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="overflow-hidden rounded-xl border border-forest-900/10 bg-white shadow-sm">
      <div className="border-b border-forest-900/10 px-5 py-3">
        <AppText variant="caption" className="font-semibold uppercase text-charcoal-700/60">
          Account info
        </AppText>
      </div>
      <div className="divide-y divide-forest-900/5 px-5 py-4">
        <MetaRow label="Member ID" value={member.id} />
        <MetaRow label="User ID" value={member.userId} />
        <MetaRow label="Joined" value={joinedFormatted} />
        <MetaRow label="Status" value={member.status === 'active' ? 'Active' : 'Suspended'} />
      </div>
    </div>
  );
}
