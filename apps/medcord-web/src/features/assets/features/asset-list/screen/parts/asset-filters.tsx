import { Show, Repeat } from 'meemaw';
import { IconClose, IconSearch } from '@icons';
import { AppButton } from '@medcord/ui';
import type { AssetStatus } from '../../../../shared/types/asset.ts';

const STATUS_OPTIONS: ReadonlyArray<{ readonly value: AssetStatus; readonly label: string }> = [
  { value: 'available', label: 'Available' },
  { value: 'in_use', label: 'In Use' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'retired', label: 'Retired' },
];

interface AssetFiltersProps {
  readonly q: string;
  readonly status: AssetStatus | '';
  readonly onQChange: (v: string) => void;
  readonly onStatusChange: (v: AssetStatus | '') => void;
  readonly onClear: () => void;
}

export function AssetFilters({ q, status, onQChange, onStatusChange, onClear }: AssetFiltersProps) {
  const hasFilters = q !== '' || status !== '';

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-700/50" />
        <input
          value={q}
          onChange={(e) => onQChange(e.target.value)}
          placeholder="Search assets…"
          className="w-full rounded-lg border border-forest-900/20 bg-white py-2 pl-9 pr-3 text-sm text-charcoal-900 placeholder-charcoal-700/50 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900"
        />
      </div>

      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value as AssetStatus | '')}
        className="rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900"
      >
        <option value="">All statuses</option>
        <Repeat each={STATUS_OPTIONS as Array<{ value: AssetStatus; label: string }>}>
          {(opt: { value: AssetStatus; label: string }) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          )}
        </Repeat>
      </select>

      <Show when={hasFilters}>
        <AppButton variant="ghost" leadingIcon={<IconClose size={14} />} onClick={onClear}>
          Clear
        </AppButton>
      </Show>
    </div>
  );
}
