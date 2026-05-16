import { Repeat, Show } from 'meemaw';

import { AppButton } from '@medcord/ui';
import { IconSearch, IconClose } from '@icons';
import type { StaffRole } from '@shared/types/hospital.ts';
import type { StaffFilter } from '../../helpers/use-staff-filter.ts';

const INPUT_CLS =
  'block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 placeholder-charcoal-700/50 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900';

interface RoleOption {
  readonly value: StaffRole | '';
  readonly label: string;
}

interface StatusOption {
  readonly value: 'active' | 'suspended' | '';
  readonly label: string;
}

const ROLE_OPTIONS: ReadonlyArray<RoleOption> = [
  { value: '', label: 'All roles' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'nurse_practitioner', label: 'Nurse Practitioner' },
  { value: 'physician_assistant', label: 'Physician Assistant' },
  { value: 'lab_tech', label: 'Lab Tech' },
  { value: 'pharmacist', label: 'Pharmacist' },
  { value: 'reception', label: 'Reception' },
  { value: 'hospital_admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'tech', label: 'Tech' },
];

const STATUS_OPTIONS: ReadonlyArray<StatusOption> = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
];

interface StaffFiltersProps {
  readonly filter: StaffFilter;
  readonly onSearch: (q: string) => void;
  readonly onRole: (role: StaffRole | '') => void;
  readonly onStatus: (status: 'active' | 'suspended' | '') => void;
  readonly onReset: () => void;
}

export function StaffFilters({ filter, onSearch, onRole, onStatus, onReset }: StaffFiltersProps) {
  const hasFilters = filter.q !== '' || filter.role !== '' || filter.status !== '';

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Search */}
      <div className="relative flex-1">
        <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-700/50" />
        <input
          type="search"
          value={filter.q}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search by name or email…"
          className={`${INPUT_CLS} pl-9`}
        />
      </div>

      {/* Role filter */}
      <select
        value={filter.role}
        onChange={(e) => onRole(e.target.value as StaffRole | '')}
        className="rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900 sm:w-44"
      >
        <Repeat each={ROLE_OPTIONS as RoleOption[]}>
          {(o: RoleOption) => <option key={o.value} value={o.value}>{o.label}</option>}
        </Repeat>
      </select>

      {/* Status filter */}
      <select
        value={filter.status}
        onChange={(e) => onStatus(e.target.value as 'active' | 'suspended' | '')}
        className="rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900 sm:w-36"
      >
        <Repeat each={STATUS_OPTIONS as StatusOption[]}>
          {(o: StatusOption) => <option key={o.value} value={o.value}>{o.label}</option>}
        </Repeat>
      </select>

      <Show when={hasFilters}>
        <AppButton variant="ghost" leadingIcon={<IconClose size={14} />} onClick={onReset}>
          Clear
        </AppButton>
      </Show>
    </div>
  );
}
