import { Link } from 'react-router-dom';
import { Table, StaffAvatar, StatusPill } from '@medcord/ui';
import type { StaffRole as AvatarRole } from '@medcord/ui';
import type { TableColumn } from '@medcord/ui';
import { ROUTES } from '@shared/constants/routes.ts';
import type { StaffMember } from '../../../../shared/types/staff.ts';

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  hospital_admin: 'Admin',
  doctor: 'Doctor',
  nurse: 'Nurse',
  nurse_practitioner: 'NP',
  physician_assistant: 'PA',
  lab_tech: 'Lab Tech',
  pharmacist: 'Pharmacist',
  reception: 'Reception',
  tech: 'Tech',
  custom: 'Custom',
};

const ROLE_TO_AVATAR: Record<string, AvatarRole> = {
  doctor: 'md',
  nurse: 'rn',
  nurse_practitioner: 'rn',
  physician_assistant: 'rn',
  lab_tech: 'tech',
  tech: 'tech',
  pharmacist: 'pharm',
  hospital_admin: 'admin',
  super_admin: 'admin',
  reception: 'other',
  custom: 'other',
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter((p) => p.length > 0);
  if (parts.length === 0) return '?';
  const first = parts[0] ?? '';
  const last = parts[parts.length - 1] ?? '';
  if (parts.length === 1) return first.slice(0, 2).toUpperCase();
  return ((first[0] ?? '') + (last[0] ?? '')).toUpperCase();
}

type StaffRow = StaffMember & { readonly id: string; readonly [key: string]: unknown };

interface StaffTableProps {
  readonly slug: string;
  readonly hospitalId: string;
  readonly members: readonly StaffMember[];
  readonly page: number;
  readonly pageCount: number;
  readonly onPageChange: (page: number) => void;
}

export function StaffTable({ slug, members, page, pageCount, onPageChange }: StaffTableProps) {
  const columns: Array<TableColumn<StaffRow>> = [
    {
      key: 'name',
      header: 'Staff member',
      render: (row) => (
        <div className="flex items-center gap-3">
          <StaffAvatar
            initials={row.name != null && row.name !== '' ? getInitials(row.name) : row.role.slice(0, 2).toUpperCase()}
            role={ROLE_TO_AVATAR[row.role] ?? 'other'}
            size="md"
          />
          <div className="min-w-0">
            <div className="font-ui text-[13px] font-medium text-[var(--text-primary)] truncate">
              {row.name ?? '—'}
            </div>
            <div className="font-mono text-[11px] text-[var(--text-tertiary)] truncate tracking-[0]">
              {row.email ?? row.userId}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (row) => (
        <span className="font-ui text-[13px] text-[var(--text-secondary)]">
          {ROLE_LABELS[row.role] ?? row.role}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <StatusPill
          label={row.status === 'active' ? 'Active' : 'Suspended'}
          variant={row.status === 'active' ? 'ok' : 'crit'}
        />
      ),
    },
    {
      key: 'department',
      header: 'Department',
      render: (row) => (
        <span className="font-mono text-[12px] text-[var(--text-tertiary)] tracking-[0]">
          {row.department ?? '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <Link
          to={ROUTES.HOSPITAL_STAFF_PROFILE(slug, row.id)}
          className="font-ui text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          View →
        </Link>
      ),
    },
  ];

  return (
    <Table<StaffRow>
      columns={columns}
      rows={members as StaffRow[]}
      page={page}
      pageCount={pageCount}
      onPageChange={onPageChange}
      totalCount={members.length}
    />
  );
}
