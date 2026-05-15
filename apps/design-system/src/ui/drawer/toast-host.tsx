import { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { X } from '@icons';
import { drawerStore } from './drawer-store';
import type { ToastEntry, ToastType } from './drawer-store';

/* ============================================================
   ToastHost — renders imperative toasts queued via DrawerService.
   Mount once at app root.
   ============================================================ */

const TYPE_RULE: Record<ToastType, string> = {
  info: 'bg-[var(--text-primary)]',
  success: 'bg-[var(--records-700)]',
  warning: 'bg-[var(--warning-icon)]',
  error: 'bg-[var(--danger-icon)]',
};

const TYPE_GLYPH: Record<ToastType, string> = {
  info: '·',
  success: '✓',
  warning: '!',
  error: '!',
};

const TYPE_GLYPH_COLOR: Record<ToastType, string> = {
  info: 'text-[var(--text-primary)]',
  success: 'text-[var(--records-700)]',
  warning: 'text-[var(--warning-icon)]',
  error: 'text-[var(--danger-icon)]',
};

function ToastItem({ entry }: { readonly entry: ToastEntry }) {
  return (
    <div
      className="relative bg-[var(--surface-raised)] border border-[var(--text-primary)] shadow-[0_8px_16px_rgba(24,22,19,0.16)] w-[360px] px-4 py-3 overflow-hidden"
      style={{ display: 'grid', gridTemplateColumns: '18px 1fr auto', gap: '0 12px', alignItems: 'start' }}
    >
      <span className={`absolute left-0 top-0 bottom-0 w-[3px] ${TYPE_RULE[entry.type]}`} />
      <span className={`font-mono text-[16px] font-semibold mt-[1px] ${TYPE_GLYPH_COLOR[entry.type]}`}>
        {TYPE_GLYPH[entry.type]}
      </span>
      <p className="m-0 font-serif text-[14px] leading-[1.5] text-[var(--text-primary)]">{entry.message}</p>
      <button
        type="button"
        onClick={() => drawerStore.dismissToast(entry.id)}
        className="bg-transparent border-0 cursor-pointer text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-0 mt-[2px] transition-colors"
        aria-label="Dismiss"
      >
        <X size={13} />
      </button>
    </div>
  );
}

function ToastStack({ entries, position }: { readonly entries: ReadonlyArray<ToastEntry>; readonly position: 'top' | 'bottom' }) {
  if (entries.length === 0) return null;
  const posClass = position === 'top'
    ? 'top-4 left-1/2 -translate-x-1/2 flex-col'
    : 'bottom-4 left-1/2 -translate-x-1/2 flex-col-reverse';

  return (
    <div className={`fixed z-[9500] flex gap-2 ${posClass}`}>
      {entries.map((e) => <ToastItem key={e.id} entry={e} />)}
    </div>
  );
}

export function ToastHost() {
  const toasts = useSyncExternalStore(
    (cb) => drawerStore.subscribe(cb),
    () => drawerStore.getState().toasts,
  );

  const bottom = toasts.filter((t) => t.position === 'bottom');
  const top = toasts.filter((t) => t.position === 'top');

  return createPortal(
    <>
      <ToastStack entries={top} position="top" />
      <ToastStack entries={bottom} position="bottom" />
    </>,
    document.body,
  );
}
