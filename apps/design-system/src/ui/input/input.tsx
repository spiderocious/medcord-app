import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

/* ============================================================
   LineField — the default: underline, mono label above, sans value below.
   This is the "chart paper" field. Used everywhere a value is recorded.
   ============================================================ */

export type InputStatus = 'default' | 'error' | 'ok';

export interface LineFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'children'> {
  readonly label: string;
  readonly help?: string;
  readonly status?: InputStatus;
  readonly mono?: boolean;
}

const STATUS_BORDER: Record<InputStatus, string> = {
  default: 'border-[var(--text-tertiary)] focus:border-[var(--text-primary)]',
  error: 'border-[var(--danger-icon)]',
  ok: 'border-[var(--records-700)]',
};

const STATUS_HELP: Record<InputStatus, string> = {
  default: 'text-[var(--text-tertiary)]',
  error: 'text-[var(--danger-icon)]',
  ok: 'text-[var(--records-800)]',
};

export function LineField({ label, help, status = 'default', mono = false, disabled, readOnly, className = '', ...rest }: LineFieldProps) {
  const borderClass = disabled === true || readOnly === true
    ? 'border-dashed border-[var(--text-tertiary)]'
    : STATUS_BORDER[status];

  return (
    <div className="flex flex-col gap-1">
      <label className="font-mono text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.18em]">
        {label}
      </label>
      <input
        disabled={disabled}
        readOnly={readOnly}
        className={[
          'bg-transparent border-0 border-b pb-1.5 pt-1',
          'font-ui text-[14px] text-[var(--text-primary)]',
          'placeholder:text-[var(--text-disabled)]',
          'outline-none transition-colors duration-[100ms]',
          'disabled:text-[var(--text-tertiary)] disabled:cursor-not-allowed',
          'read-only:text-[var(--text-secondary)]',
          'w-full',
          mono ? 'font-mono [font-feature-settings:"tnum"_1]' : '',
          borderClass,
          className,
        ].join(' ')}
        {...rest}
      />
      {help != null && (
        <span className={`text-[12px] ${STATUS_HELP[status]}`}>{help}</span>
      )}
    </div>
  );
}

/* ============================================================
   LineTextarea — multi-line variant of LineField
   ============================================================ */

export interface LineTextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'children'> {
  readonly label: string;
  readonly help?: string;
  readonly status?: InputStatus;
}

export function LineTextarea({ label, help, status = 'default', disabled, className = '', ...rest }: LineTextareaProps) {
  const borderClass = disabled === true ? 'border-dashed border-[var(--text-tertiary)]' : STATUS_BORDER[status];

  return (
    <div className="flex flex-col gap-1">
      <label className="font-mono text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.18em]">
        {label}
      </label>
      <textarea
        disabled={disabled}
        rows={3}
        className={[
          'bg-transparent border-0 border-b pb-1.5 pt-1 resize-none',
          'font-ui text-[14px] text-[var(--text-primary)]',
          'placeholder:text-[var(--text-disabled)]',
          'outline-none transition-colors duration-[100ms]',
          'disabled:text-[var(--text-tertiary)] disabled:cursor-not-allowed',
          'w-full',
          borderClass,
          className,
        ].join(' ')}
        {...rest}
      />
      {help != null && (
        <span className={`text-[12px] ${STATUS_HELP[status]}`}>{help}</span>
      )}
    </div>
  );
}

/* ============================================================
   LineSelect — underline select. Same idiom as LineField.
   ============================================================ */

export interface LineSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  readonly label: string;
  readonly help?: string;
  readonly status?: InputStatus;
  readonly options: ReadonlyArray<{ readonly value: string; readonly label: string }>;
  readonly mono?: boolean;
}

export function LineSelect({ label, help, status = 'default', options, mono = false, disabled, className = '', ...rest }: LineSelectProps) {
  const borderClass = disabled === true ? 'border-dashed border-[var(--text-tertiary)]' : STATUS_BORDER[status];

  return (
    <div className="flex flex-col gap-1">
      <label className="font-mono text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.18em]">
        {label}
      </label>
      <select
        disabled={disabled}
        className={[
          'bg-transparent border-0 border-b pb-1.5 pt-1',
          'font-ui text-[14px] text-[var(--text-primary)]',
          'outline-none transition-colors duration-[100ms] cursor-pointer',
          'disabled:text-[var(--text-tertiary)] disabled:cursor-not-allowed',
          'w-full',
          mono ? 'font-mono [font-feature-settings:"tnum"_1]' : '',
          borderClass,
          className,
        ].join(' ')}
        {...rest}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {help != null && (
        <span className={`text-[12px] ${STATUS_HELP[status]}`}>{help}</span>
      )}
    </div>
  );
}

/* ============================================================
   BlockInput — boxed field for alignment with siblings.
   Used in tables, forms that need visual grid alignment.
   ============================================================ */

export interface BlockInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'children' | 'prefix'> {
  readonly label?: string;
  readonly help?: string;
  readonly status?: InputStatus;
  readonly mono?: boolean;
  readonly prefix?: ReactNode;
  readonly suffix?: ReactNode;
}

const BLOCK_STATUS_RING: Record<InputStatus, string> = {
  default: 'border-[var(--border-default)] focus-within:border-[var(--text-primary)] focus-within:bg-[var(--surface-raised)]',
  error: 'border-[var(--danger-icon)] bg-[var(--danger-bg)]',
  ok: 'border-[var(--records-700)] bg-[var(--records-50)]',
};

export function BlockInput({ label, help, status = 'default', mono = false, prefix, suffix, disabled, className = '', ...rest }: BlockInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label != null && (
        <label className="font-mono text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.18em]">
          {label}
        </label>
      )}
      <div className={[
        'flex items-center gap-2 px-3 py-2 rounded-sm border',
        'transition-colors duration-[100ms] bg-[var(--surface-sunken)]',
        'disabled:opacity-50',
        BLOCK_STATUS_RING[status],
        className,
      ].join(' ')}>
        {prefix != null && <span className="text-[var(--text-tertiary)] flex-shrink-0 text-[12px]">{prefix}</span>}
        <input
          disabled={disabled}
          className={[
            'flex-1 bg-transparent outline-none min-w-0',
            'text-[13px] text-[var(--text-primary)]',
            'placeholder:text-[var(--text-disabled)]',
            'disabled:text-[var(--text-tertiary)] disabled:cursor-not-allowed',
            mono ? 'font-mono [font-feature-settings:"tnum"_1]' : 'font-ui',
          ].join(' ')}
          {...rest}
        />
        {suffix != null && <span className="text-[var(--text-tertiary)] flex-shrink-0 text-[12px]">{suffix}</span>}
      </div>
      {help != null && (
        <span className={`text-[12px] ${STATUS_HELP[status]}`}>{help}</span>
      )}
    </div>
  );
}

/* ============================================================
   SearchInput — ICD-10 / Drug / Patient code style search
   with a prefix label (ICD-10, Rx, MRN) and a keyboard hint.
   ============================================================ */

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'children'> {
  readonly prefix?: string;
  readonly hint?: string;
}

export function SearchInput({ prefix, hint, className = '', ...rest }: SearchInputProps) {
  return (
    <div className={`flex items-baseline gap-3 px-[18px] py-[14px] border border-[var(--text-primary)] bg-[var(--surface-raised)] ${className}`}>
      {prefix != null && (
        <span className="font-mono text-[11px] text-[var(--text-tertiary)] uppercase tracking-[0.18em] flex-shrink-0">
          {prefix}
        </span>
      )}
      <input
        className="flex-1 bg-transparent border-0 outline-none font-ui text-[16px] text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] min-w-0"
        {...rest}
      />
      {hint != null && (
        <span className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.16em] flex-shrink-0 hidden sm:block">
          {hint}
        </span>
      )}
    </div>
  );
}

/* ============================================================
   UnitToggle — inline °F/°C, lb/kg, ft/cm switcher
   ============================================================ */

export interface UnitToggleProps {
  readonly options: readonly [string, string];
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly size?: 'sm' | 'md';
}

export function UnitToggle({ options, value, onChange, size = 'sm' }: UnitToggleProps) {
  const textClass = size === 'sm' ? 'text-[11px]' : 'text-[13px]';
  return (
    <span className={`inline-flex items-center font-mono ${textClass}`}>
      <button
        type="button"
        onClick={() => onChange(options[0])}
        className={`bg-none border-0 cursor-pointer px-1 py-0.5 transition-colors ${value === options[0] ? 'text-[var(--text-primary)] font-semibold' : 'text-[var(--text-tertiary)]'}`}
      >
        {options[0]}
      </button>
      <span className="text-[var(--text-disabled)] px-0.5">/</span>
      <button
        type="button"
        onClick={() => onChange(options[1])}
        className={`bg-none border-0 cursor-pointer px-1 py-0.5 transition-colors ${value === options[1] ? 'text-[var(--text-primary)] font-semibold' : 'text-[var(--text-tertiary)]'}`}
      >
        {options[1]}
      </button>
    </span>
  );
}
