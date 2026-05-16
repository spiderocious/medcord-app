import { Show } from 'meemaw';
import { AppButton } from '@medcord/ui';
import { IconSearch, IconClose } from '@icons';

interface PatientFiltersProps {
  readonly q: string;
  readonly onQChange: (v: string) => void;
  readonly onClear: () => void;
}

export function PatientFilters({ q, onQChange, onClear }: PatientFiltersProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1 max-w-sm">
        <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-700/40" />
        <input
          value={q}
          onChange={(e) => onQChange(e.target.value)}
          placeholder="Search by name or code…"
          className="w-full rounded-lg border border-forest-900/20 bg-white py-2 pl-8 pr-3 text-sm text-charcoal-900 placeholder-charcoal-700/40 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900"
        />
      </div>
      <Show when={q !== ''}>
        <AppButton variant="ghost" leadingIcon={<IconClose size={14} />} onClick={onClear}>
          Clear
        </AppButton>
      </Show>
    </div>
  );
}
