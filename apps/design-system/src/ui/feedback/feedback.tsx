import { type ReactNode, useState, useEffect, useRef } from 'react';
import { X } from '@icons';

/* ============================================================
   Feedback — toasts, page banners, inline alerts, context menus,
   optimistic indicator.
   ============================================================ */

export type FeedbackVariant = 'info' | 'ok' | 'warn' | 'crit';

/* ---------------------------------------------------------- */
/* Toast                                                       */
/* ---------------------------------------------------------- */

export interface ToastAction {
  readonly label: string;
  readonly variant?: 'default' | 'danger';
  readonly onClick: () => void;
}

export interface ToastProps {
  readonly variant?: FeedbackVariant;
  readonly title: string;
  readonly description?: string;
  readonly actions?: ToastAction[];
  readonly progress?: number;
  readonly onDismiss?: () => void;
  readonly autoDismissMs?: number;
}

const TOAST_GLYPH: Record<FeedbackVariant, string> = {
  info: '·', ok: '✓', warn: '!', crit: '!',
};

const TOAST_RULE: Record<FeedbackVariant, string> = {
  info: 'bg-[var(--text-primary)]',
  ok: 'bg-[var(--records-700)]',
  warn: 'bg-[var(--warning-icon)]',
  crit: 'bg-[var(--danger-icon)]',
};

const TOAST_GLYPH_COLOR: Record<FeedbackVariant, string> = {
  info: 'text-[var(--text-primary)]',
  ok: 'text-[var(--records-700)]',
  warn: 'text-[var(--warning-icon)]',
  crit: 'text-[var(--danger-icon)]',
};

export function Toast({ variant = 'info', title, description, actions = [], progress, onDismiss, autoDismissMs }: ToastProps) {
  useEffect(() => {
    if (autoDismissMs === null || onDismiss === null) return;
    const t = setTimeout(onDismiss, autoDismissMs);
    return () => clearTimeout(t);
  }, [autoDismissMs, onDismiss]);

  return (
    <div className="relative bg-[var(--surface-raised)] border border-[var(--text-primary)] shadow-[0_8px_16px_rgba(24,22,19,0.16)] w-[360px] px-4 py-3 overflow-hidden"
      style={{ display: 'grid', gridTemplateColumns: '18px 1fr auto', gap: '0 12px', alignItems: 'start' }}>
      {/* Left rule */}
      <span className={['absolute left-0 top-0 bottom-0 w-[3px]', TOAST_RULE[variant]].join(' ')} />
      {/* Glyph */}
      <span className={['font-serif italic text-[18px] leading-none pt-0.5 text-center', TOAST_GLYPH_COLOR[variant]].join(' ')}>
        {TOAST_GLYPH[variant]}
      </span>
      {/* Body */}
      <div>
        <div className="font-ui text-[13px] font-semibold text-[var(--text-primary)]">{title}</div>
        {description !== null && (
          <div className="font-serif italic text-[13px] text-[var(--text-tertiary)] mt-0.5 leading-[1.45]">{description}</div>
        )}
        {actions.length > 0 && (
          <div className="flex items-center gap-3 mt-2">
            {actions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                className={[
                  'font-ui text-[12px] cursor-pointer bg-transparent border-0 pb-px border-b transition-colors',
                  action.variant === 'danger'
                    ? 'text-[var(--danger-icon)] border-[var(--danger-icon)]'
                    : 'text-[var(--text-primary)] border-[var(--text-primary)]',
                ].join(' ')}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
        {progress !== null && (
          <div className="mt-2 h-[3px] bg-[var(--surface-sunken)]">
            <span className="block h-full bg-[var(--text-primary)]" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
      {/* Dismiss */}
      {onDismiss !== null && (
        <button type="button" onClick={onDismiss} className="text-[var(--text-tertiary)] cursor-pointer bg-transparent border-0 font-ui text-[16px] leading-none hover:text-[var(--text-primary)]">
          <X size={14} />
        </button>
      )}
    </div>
  );
}

/* Undo strip */
export interface UndoStripProps {
  readonly message: string;
  readonly onUndo: () => void;
}

export function UndoStrip({ message, onUndo }: UndoStripProps) {
  return (
    <div className="bg-[var(--text-primary)] text-[var(--neutral-0)] px-4 py-2.5 w-[360px] flex items-center gap-3 shadow-[0_8px_16px_rgba(24,22,19,0.16)]">
      <span className="font-serif italic text-[16px]">⤺</span>
      <span className="flex-1 font-ui text-[13px]">{message}</span>
      <button type="button" onClick={onUndo} className="font-ui text-[12px] text-[var(--neutral-0)] cursor-pointer bg-transparent border-0 border-b border-[var(--neutral-0)] pb-px">
        Undo
      </button>
    </div>
  );
}

/* Optimistic indicator */
export interface OptimisticProps {
  readonly label?: string;
}

export function OptimisticIndicator({ label = 'Saving…' }: OptimisticProps) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-[11px] text-[var(--text-tertiary)] tracking-[0]">
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)] animate-pulse" />
      {label}
    </span>
  );
}

/* Toast manager */
export interface ToastItem extends ToastProps {
  readonly id: string;
}

export interface ToastManagerProps {
  readonly toasts: ToastItem[];
  readonly onDismiss: (id: string) => void;
}

export function ToastManager({ toasts, onDismiss }: ToastManagerProps) {
  return (
    <div className="fixed bottom-6 right-6 z-[9900] flex flex-col gap-3 items-end pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            {...toast}
            onDismiss={() => onDismiss(toast.id)}
            autoDismissMs={toast.autoDismissMs ?? (toast.actions !== null && toast.actions.length > 0 ? undefined : 5000)}
          />
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------- */
/* useToast hook                                               */
/* ---------------------------------------------------------- */

export interface UseToastReturn {
  readonly toasts: ToastItem[];
  readonly toast: (props: Omit<ToastItem, 'id'>) => string;
  readonly dismiss: (id: string) => void;
}

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counterRef = useRef(0);

  function toast(props: Omit<ToastItem, 'id'>): string {
    const id = `toast-${++counterRef.current}`;
    setToasts((prev) => [...prev, { ...props, id }]);
    return id;
  }

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return { toasts, toast, dismiss };
}

/* ---------------------------------------------------------- */
/* PageBanner                                                  */
/* ---------------------------------------------------------- */

export interface PageBannerProps {
  readonly variant?: FeedbackVariant | 'system';
  readonly stamp: string;
  readonly message: ReactNode;
  readonly action?: { label: string; onClick: () => void };
  readonly onDismiss?: () => void;
}

const PAGE_BANNER_BG: Record<string, string> = {
  info: 'bg-[var(--surface-raised)]',
  ok: 'bg-[var(--records-50)]',
  warn: 'bg-[var(--warning-surface)]',
  crit: 'bg-[var(--danger-surface)]',
  system: 'bg-[var(--text-primary)]',
};

const PAGE_BANNER_STAMP: Record<string, string> = {
  info: 'bg-[var(--text-primary)] text-[var(--neutral-0)]',
  ok: 'bg-[var(--records-700)] text-[var(--neutral-0)]',
  warn: 'bg-[var(--warning-icon)] text-[var(--neutral-0)]',
  crit: 'bg-[var(--danger-icon)] text-[var(--neutral-0)]',
  system: 'bg-[var(--surface-base)] text-[var(--text-primary)]',
};

const PAGE_BANNER_TEXT: Record<string, string> = {
  info: 'text-[var(--text-primary)]',
  ok: 'text-[var(--text-primary)]',
  warn: 'text-[var(--text-primary)]',
  crit: 'text-[var(--text-primary)]',
  system: 'text-[var(--neutral-0)]',
};

export function PageBanner({ variant = 'info', stamp, message, action, onDismiss }: PageBannerProps) {
  return (
    <div className={[
      'flex items-center gap-3.5 px-6 py-3.5 border-b border-[var(--border-default)]',
      PAGE_BANNER_BG[variant],
    ].join(' ')} style={{ display: 'grid', gridTemplateColumns: '18px 110px 1fr auto', gap: 14, alignItems: 'center' }}>
      <span />
      <span className={['font-mono text-[9px] font-bold tracking-[0.18em] uppercase px-2 py-[3px] text-center', PAGE_BANNER_STAMP[variant]].join(' ')}>
        {stamp}
      </span>
      <div className={['font-ui text-[13px] leading-[1.5]', PAGE_BANNER_TEXT[variant]].join(' ')}>
        {message}
      </div>
      <div className="flex items-center gap-3">
        {action !== null && (
          <button type="button" onClick={action.onClick} className={['font-ui text-[12px] cursor-pointer bg-transparent border-0 pb-px border-b transition-colors', PAGE_BANNER_TEXT[variant], variant === 'system' ? 'border-[var(--neutral-0)]' : 'border-[var(--text-primary)]'].join(' ')}>
            {action.label}
          </button>
        )}
        {onDismiss !== null && (
          <button type="button" onClick={onDismiss} className={['bg-transparent border-0 cursor-pointer', PAGE_BANNER_TEXT[variant]].join(' ')}>
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- */
/* Alert / Callout                                             */
/* ---------------------------------------------------------- */

export interface AlertProps {
  readonly variant?: 'default' | 'warn' | 'crit' | 'ok';
  readonly label: string;
  readonly title: string;
  readonly description: string;
}

const ALERT_STYLE: Record<NonNullable<AlertProps['variant']>, { border: string; bg: string; label: string; title: string; body: string }> = {
  default: {
    border: 'border-l-[var(--text-primary)]', bg: 'bg-[var(--surface-raised)]',
    label: 'text-[var(--text-primary)] border-[var(--text-primary)]',
    title: 'text-[var(--text-primary)]', body: 'text-[var(--text-secondary)]',
  },
  warn: {
    border: 'border-l-[var(--warning-icon)]', bg: 'bg-[var(--warning-surface)]',
    label: 'text-[var(--warning-icon)] border-[var(--warning-icon)]',
    title: 'text-[var(--warning-icon)]', body: 'text-[var(--warning-icon)]',
  },
  crit: {
    border: 'border-l-[var(--danger-icon)]', bg: 'bg-[var(--danger-surface)]',
    label: 'text-[var(--danger-icon)] border-[var(--danger-icon)]',
    title: 'text-[var(--danger-icon)]', body: 'text-[var(--danger-icon)]',
  },
  ok: {
    border: 'border-l-[var(--records-700)]', bg: 'bg-[var(--records-50)]',
    label: 'text-[var(--records-800)] border-[var(--records-800)]',
    title: 'text-[var(--records-800)]', body: 'text-[var(--records-800)]',
  },
};

export function Alert({ variant = 'default', label, title, description }: AlertProps) {
  const s = ALERT_STYLE[variant];
  return (
    <div className={['border border-[var(--border-default)] border-l-[3px] px-4 pt-3.5 pb-4', s.border, s.bg].join(' ')}>
      <div className="flex items-baseline gap-2.5 mb-1">
        <span className={['font-mono text-[9px] tracking-[0.18em] uppercase px-1.5 py-0.5 border', s.label].join(' ')}>{label}</span>
        <span className={['font-serif text-[16px] font-medium tracking-[-0.005em]', s.title].join(' ')}>{title}</span>
      </div>
      <p className={['m-0 font-serif italic text-[14px] leading-[1.5]', s.body].join(' ')}>{description}</p>
    </div>
  );
}

/* ---------------------------------------------------------- */
/* ContextMenu                                                 */
/* ---------------------------------------------------------- */

export interface ContextMenuItem {
  readonly id: string;
  readonly glyph?: string;
  readonly label?: string;
  readonly shortcut?: string;
  readonly variant?: 'default' | 'danger';
  readonly divider?: boolean;
  readonly groupLabel?: string;
  readonly onClick?: () => void;
}

export interface ContextMenuProps {
  readonly items: ContextMenuItem[];
  readonly open: boolean;
  readonly onClose: () => void;
  readonly anchorRef?: React.RefObject<HTMLElement | null>;
}

export function ContextMenu({ items, open, onClose }: ContextMenuProps) {
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      void e;
      onClose();
    }
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="bg-[var(--surface-raised)] border border-[var(--text-primary)] shadow-[0_12px_32px_rgba(24,22,19,0.18)] w-60 py-1" onClick={(e) => e.stopPropagation()}>
      {items.map((item) => (
        item.divider === true ? (
          <div key={item.id} className="h-px bg-[var(--border-default)] my-1 mx-2" />
        ) : item.groupLabel !== null ? (
          <div key={item.id} className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.18em] px-3.5 pt-2 pb-1">
            {item.groupLabel}
          </div>
        ) : (
          <button
            key={item.id}
            type="button"
            onClick={() => { item.onClick?.(); onClose(); }}
            className={[
              'w-full grid items-center gap-2.5 px-3.5 py-[7px] text-left cursor-pointer bg-transparent border-0',
              'hover:bg-[var(--surface-sunken)] transition-colors font-ui text-[13px]',
              item.variant === 'danger' ? 'text-[var(--danger-icon)]' : 'text-[var(--text-primary)]',
            ].join(' ')}
            style={{ gridTemplateColumns: '16px 1fr auto' }}
          >
            <span className="font-serif italic text-[16px] text-[var(--text-tertiary)] text-center leading-none">{item.glyph ?? ''}</span>
            <span>{item.label ?? ''}</span>
            {item.shortcut !== null && (
              <span className="font-mono text-[10px] text-[var(--text-tertiary)] tracking-[0]">{item.shortcut}</span>
            )}
          </button>
        )
      ))}
    </div>
  );
}
