import { useRef, useState, useCallback } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Check } from '@icons';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly loading?: boolean;
  readonly confirmed?: boolean;
  readonly iconOnly?: boolean;
  readonly children?: ReactNode;
  readonly leftIcon?: ReactNode;
  readonly rightIcon?: ReactNode;
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-7 px-3 text-[12px]',
  md: 'h-[34px] px-4 text-[13px]',
  lg: 'h-10 px-5 text-[14px]',
};

const ICON_ONLY_SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-7 w-7 px-0',
  md: 'h-[34px] w-[34px] px-0',
  lg: 'h-10 w-10 px-0',
};

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: [
    'bg-[var(--records-700)] text-white border-[var(--records-700)]',
    'hover:bg-[var(--records-800)] hover:border-[var(--records-800)]',
    'focus-visible:shadow-[0_0_0_3px_rgba(22,163,74,0.28)]',
  ].join(' '),
  secondary: [
    'bg-transparent border-[var(--text-primary)] text-[var(--text-primary)]',
    'hover:bg-[var(--text-primary)] hover:text-[var(--surface-raised)]',
    'focus-visible:shadow-[0_0_0_3px_rgba(22,163,74,0.28)]',
  ].join(' '),
  quiet: [
    'border-transparent text-[var(--text-secondary)] px-[10px]',
    'hover:bg-black/5 hover:text-[var(--text-primary)]',
    'focus-visible:shadow-[0_0_0_3px_rgba(22,163,74,0.28)]',
  ].join(' '),
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  confirmed = false,
  iconOnly = false,
  disabled,
  children,
  leftIcon,
  rightIcon,
  className = '',
  ...rest
}: ButtonProps) {
  const sizeClass = iconOnly ? ICON_ONLY_SIZE_CLASSES[size] : SIZE_CLASSES[size];
  const isDisabled = disabled === true || loading;

  const confirmedClasses = 'bg-[var(--records-50)] text-[var(--records-800)] border-[var(--records-300)]';
  const variantClass = confirmed ? confirmedClasses : VARIANT_CLASSES[variant];

  return (
    <button
      type="button"
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center gap-2',
        'rounded-md border font-ui font-medium tracking-[0.005em]',
        'transition-[background,border-color,color] duration-[100ms] ease-in-out',
        'cursor-pointer outline-none focus-visible:outline-none',
        'disabled:opacity-[0.38] disabled:pointer-events-none',
        sizeClass,
        variantClass,
        className,
      ].join(' ')}
      {...rest}
    >
      {loading && (
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50 animate-pulse-dot flex-shrink-0" />
      )}
      {!loading && leftIcon != null && (
        <span className="flex-shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5 [&>svg]:stroke-current [&>svg]:fill-none [&>svg]:stroke-[1.7]">
          {leftIcon}
        </span>
      )}
      {confirmed === true ? (
        <>
          <Check size={14} className="flex-shrink-0" />
          {children}
        </>
      ) : (
        children
      )}
      {rightIcon != null && !loading && (
        <span className="flex-shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5 [&>svg]:stroke-current [&>svg]:fill-none [&>svg]:stroke-[1.7]">
          {rightIcon}
        </span>
      )}
    </button>
  );
}

/* ============================================================
   IrreversibleButton — hold to confirm, red fill rises left-to-right
   ============================================================ */

export interface IrreversibleButtonProps {
  readonly size?: ButtonSize;
  readonly children: ReactNode;
  readonly holdDuration?: number;
  readonly onConfirm?: () => void;
  readonly disabled?: boolean;
  readonly className?: string;
}

export function IrreversibleButton({
  size = 'md',
  children,
  holdDuration = 1500,
  onConfirm,
  disabled = false,
  className = '',
}: IrreversibleButtonProps) {
  const [progress, setProgress] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const sizeClass = SIZE_CLASSES[size];

  const startHold = useCallback(() => {
    if (disabled || confirmed) return;
    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - (startTimeRef.current ?? Date.now());
      const pct = Math.min((elapsed / holdDuration) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(intervalRef.current ?? undefined);
        setConfirmed(true);
        onConfirm?.();
      }
    }, 16);
  }, [disabled, confirmed, holdDuration, onConfirm]);

  const stopHold = useCallback(() => {
    if (intervalRef.current != null) clearInterval(intervalRef.current);
    if (!confirmed) setProgress(0);
  }, [confirmed]);

  return (
    <button
      type="button"
      disabled={disabled}
      onMouseDown={startHold}
      onMouseUp={stopHold}
      onMouseLeave={stopHold}
      onTouchStart={startHold}
      onTouchEnd={stopHold}
      className={[
        'relative inline-flex items-center justify-center gap-2 overflow-hidden',
        'rounded-md border font-ui font-medium tracking-[0.005em]',
        'bg-[var(--text-primary)] text-[var(--neutral-0)] border-[var(--text-primary)]',
        'cursor-pointer select-none outline-none',
        'focus-visible:shadow-[0_0_0_3px_rgba(220,38,38,0.28)]',
        'disabled:opacity-[0.38] disabled:pointer-events-none',
        sizeClass,
        className,
      ].join(' ')}
      style={{ paddingLeft: 18, paddingRight: 18 }}
    >
      {/* Red rule at bottom */}
      <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--danger-icon)]" />
      {/* Red fill rising from left */}
      <span
        className="absolute left-0 top-0 bottom-0 bg-[var(--danger-icon)] transition-none"
        style={{ width: `${progress}%`, transitionProperty: 'none' }}
      />
      {/* Label sits above fill via z-index */}
      <span className="relative z-[1]">
        {confirmed ? 'Confirmed' : children}
      </span>
    </button>
  );
}

/* ============================================================
   SplitButton — primary action + dropdown chevron
   ============================================================ */

export interface SplitButtonProps {
  readonly label: string;
  readonly size?: ButtonSize;
  readonly onPrimary?: () => void;
  readonly onDropdown?: () => void;
  readonly disabled?: boolean;
}

export function SplitButton({
  label,
  size = 'md',
  onPrimary,
  onDropdown,
  disabled = false,
}: SplitButtonProps) {
  const heightClass = { sm: 'h-7', md: 'h-[34px]', lg: 'h-10' }[size];
  const textClass = { sm: 'text-[12px] px-3', md: 'text-[13px] px-4', lg: 'text-[14px] px-5' }[size];
  const iconPad = { sm: 'px-2', md: 'px-3', lg: 'px-3' }[size];

  return (
    <div className="inline-flex rounded-md overflow-hidden">
      <button
        type="button"
        disabled={disabled}
        onClick={onPrimary}
        className={[
          'inline-flex items-center gap-2 font-ui font-medium tracking-[0.005em]',
          'bg-[var(--records-700)] text-white border border-[var(--records-700)]',
          'hover:bg-[var(--records-800)] border-r-white/20',
          'disabled:opacity-[0.38] disabled:pointer-events-none',
          'outline-none transition-colors duration-[100ms]',
          'rounded-none border-r border-r-white/20',
          heightClass,
          textClass,
        ].join(' ')}
      >
        {label}
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onDropdown}
        aria-label="More options"
        className={[
          'inline-flex items-center justify-center',
          'bg-[var(--records-700)] text-white border border-[var(--records-700)] border-l-0',
          'hover:bg-[var(--records-800)]',
          'disabled:opacity-[0.38] disabled:pointer-events-none',
          'outline-none transition-colors duration-[100ms] rounded-none',
          heightClass,
          iconPad,
        ].join(' ')}
      >
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-current fill-none stroke-[1.7]">
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
