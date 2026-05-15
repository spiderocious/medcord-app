import { type ReactNode, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

/* ============================================================
   Tooltip — ink chip, paper letters. A small triangle points
   to the anchor. Shortcuts are mono and quiet inside the chip.
   ============================================================ */

export type TooltipPlacement = 'top' | 'right' | 'bottom' | 'left';

export interface TooltipProps {
  readonly children: ReactNode;
  readonly content: ReactNode;
  readonly placement?: TooltipPlacement;
  readonly shortcut?: string;
  readonly disabled?: boolean;
}

const ARROW_CLASS: Record<TooltipPlacement, string> = {
  top: 'bottom-[-8px] left-1/2 -translate-x-1/2 border-t-[var(--text-primary)] border-[4px] border-transparent border-t-[4px]',
  bottom: 'top-[-8px] left-1/2 -translate-x-1/2 border-b-[var(--text-primary)] border-[4px] border-transparent border-b-[4px]',
  left: 'right-[-8px] top-1/2 -translate-y-1/2 border-l-[var(--text-primary)] border-[4px] border-transparent border-l-[4px]',
  right: 'left-[-8px] top-1/2 -translate-y-1/2 border-r-[var(--text-primary)] border-[4px] border-transparent border-r-[4px]',
};

export function Tooltip({ children, content, placement = 'bottom', shortcut, disabled = false }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const anchorRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  function updatePosition() {
    if (!anchorRef.current || !tooltipRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const ttRect = tooltipRef.current.getBoundingClientRect();
    const gap = 8;
    let top = 0;
    let left = 0;

    switch (placement) {
      case 'top':
        top = rect.top - ttRect.height - gap + window.scrollY;
        left = rect.left + rect.width / 2 - ttRect.width / 2 + window.scrollX;
        break;
      case 'bottom':
        top = rect.bottom + gap + window.scrollY;
        left = rect.left + rect.width / 2 - ttRect.width / 2 + window.scrollX;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - ttRect.height / 2 + window.scrollY;
        left = rect.left - ttRect.width - gap + window.scrollX;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - ttRect.height / 2 + window.scrollY;
        left = rect.right + gap + window.scrollX;
        break;
    }
    setPos({ top, left });
  }

  useEffect(() => {
    if (visible) updatePosition();
  }, [visible]);

  if (disabled) return <>{children}</>;

  return (
    <>
      <span
        ref={anchorRef}
        className="inline-flex"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
      >
        {children}
      </span>
      {visible && createPortal(
        <div
          ref={tooltipRef}
          className="fixed z-[9999] pointer-events-none"
          style={{ top: pos.top, left: pos.left }}
        >
          <div className="relative inline-flex items-center gap-2 bg-[var(--text-primary)] text-[var(--neutral-0)] px-2.5 py-[5px] rounded-sm text-[12px] font-ui tracking-[0.005em] shadow-[0_4px_8px_rgba(24,22,19,0.16)] whitespace-nowrap">
            {content}
            {shortcut !== null && (
              <span className="font-mono text-[10px] bg-white/18 px-[5px] py-[1px] rounded-sm tracking-[0]">
                {shortcut}
              </span>
            )}
            <span className={`absolute w-0 h-0 ${ARROW_CLASS[placement]}`} />
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

/* ============================================================
   Popover — sheet with hairline edge and soft shadow.
   Has header, body, footer slots.
   ============================================================ */

export interface PopoverProps {
  readonly children: ReactNode;
  readonly trigger: ReactNode;
  readonly placement?: TooltipPlacement;
  readonly width?: number;
}

export function Popover({ children, trigger, placement = 'bottom', width = 280 }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={wrapRef} className="relative inline-flex">
      <span onClick={() => setOpen(o => !o)} className="cursor-pointer inline-flex">
        {trigger}
      </span>
      {open && (
        <div
          className={[
            'absolute z-50 bg-[var(--surface-raised)] border border-[var(--text-primary)] rounded-sm',
            'shadow-[0_12px_32px_rgba(24,22,19,0.18)]',
            placement === 'bottom' ? 'top-full mt-2' : '',
            placement === 'top' ? 'bottom-full mb-2' : '',
            placement === 'left' ? 'right-full mr-2 top-0' : '',
            placement === 'right' ? 'left-full ml-2 top-0' : '',
          ].join(' ')}
          style={{ width }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export interface PopoverHeaderProps {
  readonly title: string;
  readonly meta?: string;
}

export function PopoverHeader({ title, meta }: PopoverHeaderProps) {
  return (
    <div className="flex items-baseline gap-2 px-4 py-3 border-b border-[var(--border-default)]">
      <h4 className="m-0 font-serif text-[16px] font-medium tracking-[-0.005em] text-[var(--text-primary)]">{title}</h4>
      {meta !== null && <span className="ml-auto font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.16em]">{meta}</span>}
    </div>
  );
}

export function PopoverBody({ children }: { readonly children: ReactNode }) {
  return <div className="px-4 py-3 text-[13px] text-[var(--text-secondary)] leading-[1.55]">{children}</div>;
}

export function PopoverFooter({ children }: { readonly children: ReactNode }) {
  return (
    <div className="flex justify-end gap-2 px-4 py-2.5 border-t border-[var(--border-default)] bg-[var(--surface-sunken)]">
      {children}
    </div>
  );
}

/* ============================================================
   ContextMenu — menu items inside a popover.
   ============================================================ */

export interface MenuItemProps {
  readonly icon?: ReactNode;
  readonly label: string;
  readonly shortcut?: string;
  readonly variant?: 'default' | 'danger';
  readonly onClick?: () => void;
}

export function MenuItem({ icon, label, shortcut, variant = 'default', onClick }: MenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full grid items-center gap-2.5 px-4 py-1.5 text-left cursor-pointer',
        'bg-transparent border-0 hover:bg-[var(--surface-sunken)] transition-colors duration-[100ms]',
        variant === 'danger' ? 'text-[var(--danger-icon)]' : 'text-[var(--text-primary)]',
        'text-[13px]',
      ].join(' ')}
      style={{ gridTemplateColumns: '16px 1fr auto' }}
    >
      <span className="text-[var(--text-tertiary)] font-serif italic text-[16px] flex items-center justify-center leading-none">
        {icon ?? ''}
      </span>
      <span>{label}</span>
      {shortcut !== null && (
        <span className="font-mono text-[10px] text-[var(--text-tertiary)] tracking-[0]">{shortcut}</span>
      )}
    </button>
  );
}

export function MenuDivider() {
  return <div className="h-px bg-[var(--border-default)] my-1" />;
}

export function MenuLabel({ children }: { readonly children: ReactNode }) {
  return (
    <div className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.18em] px-4 pt-1.5 pb-0.5">
      {children}
    </div>
  );
}

/* ============================================================
   Hovercard — richer popover with patient/staff/med/room specimens.
   ============================================================ */

export interface HovercardProps {
  readonly children: ReactNode;
  readonly card: ReactNode;
  readonly placement?: TooltipPlacement;
}

export function Hovercard({ children, card, placement = 'bottom' }: HovercardProps) {
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleEnter() {
    timerRef.current = setTimeout(() => setOpen(true), 300);
  }

  function handleLeave() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setOpen(false);
  }

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {children}
      {open && (
        <div
          className={[
            'absolute z-50',
            placement === 'bottom' ? 'top-full mt-2 left-0' : '',
            placement === 'top' ? 'bottom-full mb-2 left-0' : '',
            placement === 'right' ? 'left-full ml-2 top-0' : '',
            placement === 'left' ? 'right-full mr-2 top-0' : '',
          ].join(' ')}
        >
          <div className="bg-[var(--surface-raised)] border border-[var(--text-primary)] rounded-sm shadow-[0_12px_32px_rgba(24,22,19,0.18)] w-80 animate-[fade-in_150ms_ease-out]">
            {card}
          </div>
        </div>
      )}
    </span>
  );
}
