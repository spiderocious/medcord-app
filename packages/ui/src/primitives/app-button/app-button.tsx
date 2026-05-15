import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

import { cn } from '../../utils/cn.js';

export type AppButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: AppButtonVariant;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

const VARIANT_CLASSES: Record<AppButtonVariant, string> = {
  primary:
    'bg-[#1B4332] text-[#F5EFE0] hover:bg-[#2D5A3D] focus-visible:ring-[#2D5A3D] disabled:opacity-60',
  secondary:
    'bg-[#F5EFE0] text-[#1B4332] hover:bg-[#EBE2CC] focus-visible:ring-[#1B4332] disabled:opacity-60',
  ghost:
    'bg-transparent text-[#1B4332] hover:bg-[#1B4332]/5 focus-visible:ring-[#1B4332] disabled:opacity-60',
  danger:
    'bg-[#C7522A] text-white hover:bg-[#A8421F] focus-visible:ring-[#C7522A] disabled:opacity-60',
};

export const AppButton = forwardRef<HTMLButtonElement, AppButtonProps>(function AppButton(
  { variant = 'primary', className, loading, leadingIcon, trailingIcon, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2',
        'text-sm font-medium transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed',
        VARIANT_CLASSES[variant],
        className,
      )}
      {...rest}
    >
      {leadingIcon ? <span className="-ml-0.5">{leadingIcon}</span> : null}
      <span>{loading ? 'Loading…' : children}</span>
      {trailingIcon ? <span className="-mr-0.5">{trailingIcon}</span> : null}
    </button>
  );
});
