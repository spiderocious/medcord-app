import { X } from '@icons';
import { type InputHTMLAttributes, type ReactNode, useId, useRef, useState } from 'react';

/* ============================================================
   Checkbox — drawn ink square with a hand-tick.
   Stance: the state is a MARK, not a coloured fill.
   ============================================================ */

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'children'> {
  readonly label?: ReactNode;
  readonly help?: string;
  readonly indeterminate?: boolean;
}

export function Checkbox({ label, help, indeterminate = false, checked, disabled, className = '', ...rest }: CheckboxProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const boxBase = 'relative inline-flex items-center justify-center w-4 h-4 rounded-sm border-[1.5px] flex-shrink-0 transition-colors duration-[100ms]';
  const boxState = disabled
    ? 'border-[var(--text-tertiary)] opacity-35'
    : checked || indeterminate
    ? 'bg-[var(--text-primary)] border-[var(--text-primary)]'
    : 'border-[var(--text-secondary)] bg-transparent';

  return (
    <label
      htmlFor={id}
      className={`inline-flex items-center gap-2.5 cursor-pointer select-none ${disabled ? 'cursor-not-allowed opacity-60' : ''} ${className}`}
    >
      <span className="relative flex-shrink-0">
        <input
          ref={inputRef}
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          className="sr-only"
          {...rest}
        />
        <span className={`${boxBase} ${boxState}`}>
          {indeterminate && !checked && (
            <span className="w-[7px] h-[1.5px] bg-[var(--neutral-0)]" />
          )}
          {checked && (
            <span
              className="block"
              style={{
                width: 8,
                height: 5,
                borderLeft: '1.5px solid var(--neutral-0)',
                borderBottom: '1.5px solid var(--neutral-0)',
                transform: 'rotate(-45deg) translate(1px,-1px)',
              }}
            />
          )}
        </span>
      </span>
      {label !== null && (
        <span className="flex flex-col gap-0.5">
          <span className="text-[14px] text-[var(--text-primary)] leading-snug">{label}</span>
          {help !== null && <span className="text-[12px] text-[var(--text-tertiary)]">{help}</span>}
        </span>
      )}
    </label>
  );
}

/* ============================================================
   Radio — drawn ink circle with an ink dot.
   Use for short lists (≤4 options); select for longer.
   ============================================================ */

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'children'> {
  readonly label?: ReactNode;
  readonly help?: string;
}

export function Radio({ label, help, checked, disabled, className = '', ...rest }: RadioProps) {
  const id = useId();

  const circleBase = 'inline-flex items-center justify-center w-4 h-4 rounded-full border-[1.5px] flex-shrink-0 transition-colors duration-[100ms]';
  const circleState = disabled
    ? 'border-[var(--text-tertiary)] opacity-35'
    : checked
    ? 'border-[var(--text-primary)]'
    : 'border-[var(--text-secondary)]';

  return (
    <label
      htmlFor={id}
      className={`inline-flex items-center gap-2.5 cursor-pointer select-none ${disabled ? 'cursor-not-allowed opacity-60' : ''} ${className}`}
    >
      <span className="relative flex-shrink-0">
        <input
          id={id}
          type="radio"
          checked={checked}
          disabled={disabled}
          className="sr-only"
          {...rest}
        />
        <span className={`${circleBase} ${circleState}`}>
          {checked && (
            <span className="w-2 h-2 rounded-full bg-[var(--text-primary)]" />
          )}
        </span>
      </span>
      {label !== null && (
        <span className="flex flex-col gap-0.5">
          <span className="text-[14px] text-[var(--text-primary)] leading-snug">{label}</span>
          {help !== null && <span className="text-[12px] text-[var(--text-tertiary)]">{help}</span>}
        </span>
      )}
    </label>
  );
}

/* ============================================================
   RadioGroup — convenience wrapper for a named group
   ============================================================ */

export interface RadioGroupOption {
  readonly value: string;
  readonly label: ReactNode;
  readonly help?: string;
  readonly disabled?: boolean;
}

export interface RadioGroupProps {
  readonly name: string;
  readonly value?: string;
  readonly onChange?: (value: string) => void;
  readonly options: ReadonlyArray<RadioGroupOption>;
  readonly direction?: 'row' | 'col';
  readonly className?: string;
}

export function RadioGroup({ name, value, onChange, options, direction = 'col', className = '' }: RadioGroupProps) {
  return (
    <div className={`flex ${direction === 'row' ? 'flex-row flex-wrap gap-x-6 gap-y-3' : 'flex-col gap-3'} ${className}`}>
      {options.map((opt) => (
        <Radio
          key={opt.value}
          name={name}
          value={opt.value}
          checked={value === opt.value}
          disabled={opt.disabled}
          label={opt.label}
          help={opt.help}
          onChange={() => onChange?.(opt.value)}
        />
      ))}
    </div>
  );
}

/* ============================================================
   PainScale — Wong–Baker pain scale (6 radio cards).
   Selected card carries an ink rule under it, not a fill.
   Faces are drawn in italic serif.
   ============================================================ */

const PAIN_LEVELS = [
  { value: '0', face: ': )', num: '0', word: 'no hurt' },
  { value: '2', face: ': )', num: '2', word: 'hurts a little' },
  { value: '4', face: ': |', num: '4', word: 'hurts a little more' },
  { value: '6', face: ': (', num: '6', word: 'hurts even more' },
  { value: '8', face: '> (', num: '8', word: 'hurts a whole lot' },
  { value: '10', face: '>;(', num: '10', word: 'hurts worst' },
] as const;

export interface PainScaleProps {
  readonly value?: string;
  readonly onChange?: (value: string) => void;
  readonly className?: string;
}

export function PainScale({ value, onChange, className = '' }: PainScaleProps) {
  return (
    <div className={`grid border border-[var(--text-primary)] ${className}`} style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
      {PAIN_LEVELS.map((level, i) => {
        const isSelected = value === level.value;
        const isLast = i === PAIN_LEVELS.length - 1;
        return (
          <button
            key={level.value}
            type="button"
            onClick={() => onChange?.(level.value)}
            className={[
              'flex flex-col items-center gap-0 px-4 py-[18px] cursor-pointer transition-colors duration-[100ms]',
              'bg-transparent border-0 border-r border-[var(--border-default)]',
              isLast ? 'border-r-0' : '',
              isSelected
                ? 'bg-[var(--surface-base)] shadow-[inset_0_-3px_0_var(--text-primary)]'
                : 'bg-[var(--surface-raised)] hover:bg-[var(--surface-base)]',
            ].join(' ')}
          >
            <span
              className="font-serif italic text-[28px] leading-none text-[var(--text-primary)]"
              style={{ transform: isSelected ? 'scale(1.05)' : undefined }}
            >
              {level.face}
            </span>
            <span className="font-mono text-[22px] font-medium text-[var(--text-primary)] mt-2 mb-1 [font-feature-settings:'tnum'_1]">
              {level.num}
            </span>
            <span className={`font-serif italic text-[13px] ${isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}>
              {level.word}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ============================================================
   Switch — tight binary toggle. Ink when on, grey when off.
   For preferences only — never for actions.
   ============================================================ */

export interface SwitchProps {
  readonly checked?: boolean;
  readonly onChange?: (checked: boolean) => void;
  readonly disabled?: boolean;
  readonly label?: string;
  readonly description?: string;
  readonly className?: string;
}

export function Switch({ checked = false, onChange, disabled = false, label, description, className = '' }: SwitchProps) {
  const id = useId();

  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      {(label !== null || description !== null) && (
        <label htmlFor={id} className={`flex-1 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
          {label !== null && <div className="text-[14px] text-[var(--text-primary)]">{label}</div>}
          {description !== null && <div className="text-[12px] text-[var(--text-tertiary)] mt-0.5">{description}</div>}
        </label>
      )}
      <button
        id={id}
        role="switch"
        type="button"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange?.(!checked)}
        className={[
          'relative inline-flex items-center flex-shrink-0',
          'w-8 h-[18px] rounded-full border transition-all duration-[120ms]',
          checked
            ? 'bg-[var(--text-primary)] border-[var(--text-primary)]'
            : 'bg-transparent border-[var(--text-tertiary)]',
          disabled ? 'opacity-35 cursor-not-allowed' : 'cursor-pointer',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-px w-[14px] h-[14px] rounded-full transition-all duration-[120ms]',
            checked ? 'left-[calc(100%-15px)] bg-[var(--neutral-0)]' : 'left-px bg-[var(--text-tertiary)]',
          ].join(' ')}
        />
      </button>
    </div>
  );
}

/* ============================================================
   Chip — filter chips and removable chips.
   Active filter = filled ink. Outline = inactive.
   ============================================================ */

export type ChipVariant = 'default' | 'active' | 'critical';

export interface ChipProps {
  readonly children: ReactNode;
  readonly variant?: ChipVariant;
  readonly onRemove?: () => void;
  readonly onClick?: () => void;
  readonly className?: string;
}

export function Chip({ children, variant = 'default', onRemove, onClick, className = '' }: ChipProps) {
  const chipVariant: Record<ChipVariant, string> = {
    default: 'border-[var(--text-tertiary)] bg-transparent text-[var(--text-secondary)]',
    active: 'bg-[var(--text-primary)] border-[var(--text-primary)] text-[var(--neutral-0)]',
    critical: 'border-[var(--danger-icon)] bg-[var(--danger-bg)] text-[var(--danger-icon)]',
  };

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full border',
        'font-ui text-[12px] cursor-pointer transition-colors duration-[100ms] tracking-[0.005em]',
        chipVariant[variant],
        className,
      ].join(' ')}
      onClick={onClick}
    >
      {children}
      {onRemove !== null && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className={`ml-0.5 flex items-center cursor-pointer bg-transparent border-0 p-0 ${variant === 'active' ? 'text-[var(--neutral-0)] opacity-80' : 'text-[var(--text-tertiary)]'}`}
          aria-label="Remove"
        >
          <X size={10} />
        </button>
      )}
    </span>
  );
}

/* ============================================================
   AllergyInput — multi-chip input for allergies.
   Critical chips (red), warning chips (amber), plain input.
   ============================================================ */

export type AllergyChipSeverity = 'critical' | 'warning';

export interface AllergyChip {
  readonly id: string;
  readonly label: string;
  readonly severity: AllergyChipSeverity;
}

export interface AllergyInputProps {
  readonly chips: ReadonlyArray<AllergyChip>;
  readonly onRemove?: (id: string) => void;
  readonly onAdd?: (label: string) => void;
  readonly placeholder?: string;
  readonly className?: string;
}

const SEVERITY_CHIP: Record<AllergyChipSeverity, string> = {
  critical: 'border-[var(--danger-icon)] bg-[var(--danger-bg)] text-[var(--danger-icon)]',
  warning: 'border-[var(--warning-icon)] bg-[var(--warning-bg)] text-[var(--warning-icon)]',
};

const SEVERITY_X: Record<AllergyChipSeverity, string> = {
  critical: 'text-[var(--danger-icon)]',
  warning: 'text-[var(--warning-icon)]',
};

export function AllergyInput({ chips, onRemove, onAdd, placeholder = 'Add allergy…', className = '' }: AllergyInputProps) {
  const [draft, setDraft] = useState('');

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && draft.trim()) {
      e.preventDefault();
      onAdd?.(draft.trim());
      setDraft('');
    }
  }

  return (
    <div className={[
      'flex flex-wrap gap-1.5 p-2 px-2.5 border border-[var(--text-primary)] bg-[var(--surface-raised)] items-center min-h-[44px] rounded-sm',
      className,
    ].join(' ')}>
      {chips.map((chip) => (
        <span
          key={chip.id}
          className={[
            'inline-flex items-center gap-1.5 px-2.5 py-1 border text-[12px] font-medium rounded-sm',
            SEVERITY_CHIP[chip.severity],
          ].join(' ')}
        >
          {chip.label}
          {onRemove !== null && (
            <button
              type="button"
              onClick={() => onRemove(chip.id)}
              className={`bg-transparent border-0 p-0 cursor-pointer opacity-60 flex items-center ${SEVERITY_X[chip.severity]}`}
              aria-label={`Remove ${chip.label}`}
            >
              <X size={10} />
            </button>
          )}
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="flex-1 min-w-[100px] bg-transparent border-0 outline-none text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] py-1"
      />
    </div>
  );
}

/* ============================================================
   ProviderPicker — combobox for provider selection.
   Groups by department, shows on-shift pulse.
   ============================================================ */

export type ProviderStatus = 'on-shift' | 'off-shift';

export interface Provider {
  readonly id: string;
  readonly initials: string;
  readonly name: string;
  readonly role: string;
  readonly meta?: string;
  readonly status: ProviderStatus;
  readonly statusLabel?: string;
  readonly group: string;
}

export interface ProviderPickerProps {
  readonly providers: ReadonlyArray<Provider>;
  readonly value?: string;
  readonly onChange?: (id: string) => void;
  readonly placeholder?: string;
  readonly prefix?: string;
  readonly className?: string;
}

export function ProviderPicker({ providers, value, onChange, placeholder = '', prefix = 'Pick provider', className = '' }: ProviderPickerProps) {
  const [query, setQuery] = useState('');

  const filtered = query
    ? providers.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.role.toLowerCase().includes(query.toLowerCase())
      )
    : providers;

  const groups = [...new Set(filtered.map((p) => p.group))];

  return (
    <div className={`border border-[var(--text-primary)] bg-[var(--surface-raised)] ${className}`}>
      <div className="flex items-baseline gap-3 px-4 py-3 border-b border-[var(--text-primary)]">
        <span className="font-mono text-[11px] text-[var(--text-tertiary)] uppercase tracking-[0.18em] flex-shrink-0">
          {prefix}
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-0 outline-none font-ui text-[15px] text-[var(--text-primary)] placeholder:text-[var(--text-disabled)]"
        />
      </div>
      {groups.map((group) => (
        <div key={group}>
          <div className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.18em] px-4 py-2.5 bg-[var(--surface-sunken)] border-b border-[var(--border-default)]">
            {group}
          </div>
          {filtered.filter((p) => p.group === group).map((provider) => {
            const isSelected = value === provider.id;
            return (
              <button
                key={provider.id}
                type="button"
                onClick={() => onChange?.(provider.id)}
                className={[
                  'w-full flex items-center gap-3 px-4 py-2.5 text-left cursor-pointer transition-colors duration-[100ms]',
                  'border-0 border-b border-dashed border-[var(--border-default)] last:border-b-0 bg-transparent',
                  isSelected
                    ? 'bg-[var(--surface-base)] border-l-2 border-l-[var(--text-primary)] !pl-[14px]'
                    : 'hover:bg-[var(--surface-sunken)]',
                ].join(' ')}
              >
                <span className="w-8 h-8 rounded-full bg-[var(--staff-100)] text-[var(--staff-700)] flex items-center justify-center text-[11px] font-semibold font-mono flex-shrink-0">
                  {provider.initials}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-serif text-[16px] font-medium text-[var(--text-primary)] tracking-[-0.005em] truncate">
                    {provider.name}
                  </div>
                  <div className="text-[11px] text-[var(--text-tertiary)] mt-0.5 truncate">{provider.role}{provider.meta ? ` · ${provider.meta}` : ''}</div>
                </div>
                <span className="font-mono text-[11px] text-[var(--text-tertiary)] text-right flex-shrink-0 flex items-center gap-1.5">
                  {provider.status === 'on-shift' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--records-600)] inline-block" />
                  )}
                  {provider.statusLabel ?? (provider.status === 'on-shift' ? 'on shift' : 'off shift')}
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   BedStatus type
   ============================================================ */

export type BedStatus = 'occupied' | 'available' | 'cleaning' | 'isolated' | 'offline' | 'selected';

export interface Bed {
  readonly id: string;
  readonly room: string;
  readonly bed: string;
  readonly status: BedStatus;
  readonly patient?: string;
}

export interface BedPickerProps {
  readonly beds: ReadonlyArray<Bed>;
  readonly value?: string;
  readonly onChange?: (id: string) => void;
  readonly columns?: number;
  readonly className?: string;
}

/* ============================================================
   BedPicker — room/bed map widget.
   Same vocabulary as Bed Board: typeset, not coloured.
   Selected bed inverts to ink-on-paper.
   ============================================================ */

export function BedPicker({ beds, value, onChange, columns = 6, className = '' }: BedPickerProps) {
  const statusStyle: Record<BedStatus, string> = {
    occupied: 'bg-[var(--surface-raised)]',
    available: 'bg-[var(--surface-base)]',
    cleaning: 'bg-[var(--warning-bg)]',
    isolated: 'bg-[var(--surface-raised)]',
    offline: '',
    selected: 'bg-[var(--text-primary)]',
  };

  const patientStyle: Record<BedStatus, string> = {
    occupied: 'font-serif text-[15px] font-medium text-[var(--text-primary)] tracking-[-0.005em]',
    available: 'font-serif italic text-[15px] text-[var(--text-tertiary)]',
    cleaning: 'font-serif italic text-[15px] text-[var(--warning-icon)]',
    isolated: 'font-serif text-[15px] font-medium text-[var(--text-primary)] tracking-[-0.005em]',
    offline: 'font-serif italic text-[15px] text-[var(--text-tertiary)] line-through',
    selected: 'font-serif text-[15px] font-medium text-[var(--neutral-0)] tracking-[-0.005em]',
  };

  const numStyle: Record<BedStatus, string> = {
    occupied: 'text-[var(--text-tertiary)]',
    available: 'text-[var(--text-tertiary)]',
    cleaning: 'text-[var(--text-tertiary)]',
    isolated: 'text-[var(--text-tertiary)]',
    offline: 'text-[var(--text-tertiary)]',
    selected: 'text-[rgba(244,239,230,0.7)]',
  };

  const isSelectedBed = (bed: Bed) => value === bed.id || bed.status === 'selected';

  return (
    <div
      className={`grid border border-[var(--text-primary)] bg-[var(--surface-raised)] ${className}`}
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {beds.map((bed, i) => {
        const isSelected = isSelectedBed(bed);
        const effectiveStatus: BedStatus = isSelected ? 'selected' : bed.status;
        const isLastRow = i >= beds.length - columns;
        const isLastCol = (i + 1) % columns === 0;
        const isOffline = bed.status === 'offline';

        return (
          <button
            key={bed.id}
            type="button"
            onClick={() => !isOffline && onChange?.(bed.id)}
            className={[
              'flex flex-col gap-1 p-3 min-h-[84px] text-left border-0 transition-colors duration-[100ms] relative',
              'border-r border-b border-[var(--border-default)]',
              isLastRow ? '!border-b-0' : '',
              isLastCol ? '!border-r-0' : '',
              !isOffline ? 'cursor-pointer' : 'cursor-default',
              isOffline
                ? 'bg-[repeating-linear-gradient(135deg,var(--surface-base)_0_6px,var(--surface-sunken)_6px_12px)]'
                : statusStyle[effectiveStatus],
            ].join(' ')}
          >
            {bed.status === 'isolated' && (
              <span className="absolute top-0 right-0 bg-[var(--consult-600)] text-[var(--neutral-0)] font-mono text-[9px] font-semibold tracking-[0.16em] px-1.5 py-0.5 rounded-bl-sm">
                ISO
              </span>
            )}
            <span className={`font-mono text-[11px] tracking-[0.16em] uppercase ${numStyle[effectiveStatus]}`}>
              {bed.room} · {bed.bed}
            </span>
            <span className={patientStyle[effectiveStatus]}>
              {bed.patient ?? (bed.status === 'available' ? 'Available' : bed.status === 'cleaning' ? 'Cleaning…' : bed.status === 'offline' ? 'Off-line' : '')}
            </span>
          </button>
        );
      })}
    </div>
  );
}
