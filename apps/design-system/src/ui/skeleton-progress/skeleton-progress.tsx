import type { ReactNode } from 'react';

/* ============================================================
   Skeleton primitives — paper-grain, not grey shimmer.
   Always mirrors the final layout it replaces.
   ============================================================ */

const SK_BASE = 'bg-gradient-to-r from-[var(--surface-sunken)] via-[var(--border-default)] to-[var(--surface-sunken)] bg-[length:200%_100%] animate-skeleton';

export interface SkLineProps {
  readonly size?: 'sm' | 'md' | 'lg';
  readonly width?: string | number;
  readonly className?: string;
}

export function SkLine({ size = 'md', width, className = '' }: SkLineProps) {
  const height = size === 'sm' ? 'h-[9px]' : size === 'lg' ? 'h-[18px]' : 'h-3';
  return (
    <div
      className={`${SK_BASE} ${height} rounded-sm ${className}`}
      style={width != null ? { width } : undefined}
    />
  );
}

export interface SkCircleProps {
  readonly size?: number;
  readonly className?: string;
}

export function SkCircle({ size = 32, className = '' }: SkCircleProps) {
  return (
    <div
      className={`${SK_BASE} rounded-full flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export interface SkBlockProps {
  readonly height?: number | string;
  readonly className?: string;
}

export function SkBlock({ height = 80, className = '' }: SkBlockProps) {
  return (
    <div
      className={`${SK_BASE} rounded-sm w-full ${className}`}
      style={{ height }}
    />
  );
}

/* ============================================================
   SkPatientRow — skeleton for a patient list row.
   ============================================================ */

export function SkPatientRow({ className = '' }: { readonly className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <SkCircle size={32} />
      <div className="flex-1 flex flex-col gap-1.5">
        <SkLine size="lg" width="62%" />
        <SkLine size="sm" width="34%" />
      </div>
      <SkLine width={60} />
    </div>
  );
}

/* ============================================================
   SkCard — skeleton for a card widget.
   ============================================================ */

export function SkCard({ className = '' }: { readonly className?: string }) {
  return (
    <div className={`flex flex-col gap-2.5 ${className}`}>
      <SkBlock height={60} />
      <SkLine size="lg" width="60%" />
      <SkLine size="sm" width="40%" />
      <div className="flex gap-3.5 mt-2.5">
        <SkLine width={60} />
        <SkLine width={80} />
        <SkLine width={50} />
      </div>
    </div>
  );
}

/* ============================================================
   SkVitalsStrip — skeleton for a vitals chart.
   ============================================================ */

export function SkVitalsStrip({ className = '' }: { readonly className?: string }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex gap-4.5">
        {[60, 60, 60, 60].map((w, i) => <SkLine key={i} width={w} />)}
      </div>
      <SkBlock height={120} />
      <div className="flex justify-between">
        {[42, 42, 42, 42, 42].map((w, i) => <SkLine key={i} size="sm" width={w} />)}
      </div>
    </div>
  );
}

/* ============================================================
   EmptyState — serif italic sentence naming the absence.
   Three variants: empty, error.
   ============================================================ */

export type EmptyStateVariant = 'empty' | 'error';

export interface EmptyAction {
  readonly label: string;
  readonly onClick?: () => void;
  readonly muted?: boolean;
}

export interface EmptyStateProps {
  readonly variant?: EmptyStateVariant;
  readonly glyph?: string;
  readonly title: string;
  readonly description?: string;
  readonly actions?: ReadonlyArray<EmptyAction>;
  readonly className?: string;
}

export function EmptyState({ variant = 'empty', glyph, title, description, actions = [], className = '' }: EmptyStateProps) {
  const isError = variant === 'error';
  const defaultGlyph = isError ? '!' : '—';

  return (
    <div className={`flex flex-col gap-2 pt-6 ${className}`}>
      <div className={`font-serif italic text-[36px] leading-none ${isError ? 'text-[var(--danger-icon)]' : 'text-[var(--text-tertiary)]'}`}>
        {glyph ?? defaultGlyph}
      </div>
      <div className={`font-serif italic text-[16px] tracking-[-0.005em] leading-[1.45] max-w-[36ch] ${isError ? 'text-[var(--danger-icon)]' : 'text-[var(--text-primary)]'}`}>
        {title}
      </div>
      {description != null && (
        <div className={`text-[12px] leading-[1.5] max-w-[38ch] ${isError ? 'text-[var(--danger-icon)] opacity-80' : 'text-[var(--text-tertiary)]'}`}>
          {description}
        </div>
      )}
      {actions.length > 0 && (
        <div className="flex gap-2.5 mt-3">
          {actions.map((action, i) => (
            <button
              key={i}
              type="button"
              onClick={action.onClick}
              className={[
                'font-ui text-[12px] bg-transparent border-0 p-0 border-b pb-[1px] cursor-pointer tracking-[0.005em]',
                isError
                  ? 'text-[var(--danger-icon)] border-[var(--danger-icon)]'
                  : action.muted
                  ? 'text-[var(--text-tertiary)] border-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)]'
                  : 'text-[var(--text-primary)] border-[var(--text-primary)] hover:text-[var(--records-800)] hover:border-[var(--records-800)]',
              ].join(' ')}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   TriadCard — the three states for the same surface:
   loading (skeleton), empty, error.
   ============================================================ */

export type TriadState = 'loading' | 'empty' | 'error';

export interface TriadCardProps {
  readonly state: TriadState;
  readonly children: ReactNode;
  readonly className?: string;
}

export function TriadCard({ state, children, className = '' }: TriadCardProps) {
  const isError = state === 'error';
  return (
    <div
      className={[
        'relative bg-[var(--surface-raised)] border min-h-[220px] p-[18px_20px]',
        isError ? 'border-[var(--danger-icon)]' : 'border-[var(--text-primary)]',
        className,
      ].join(' ')}
    >
      {isError && (
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[var(--danger-icon)] rounded-l-none" />
      )}
      <span
        className={[
          'absolute top-0 left-[18px] -translate-y-1/2 px-2 bg-[var(--surface-base)]',
          'font-mono text-[10px] font-semibold uppercase tracking-[0.18em] border',
          isError ? 'text-[var(--danger-icon)] border-[var(--danger-icon)]' : 'text-[var(--text-primary)] border-[var(--text-primary)]',
        ].join(' ')}
      >
        {state === 'loading' ? 'Loading' : state === 'empty' ? 'Empty' : 'Error'}
      </span>
      {children}
    </div>
  );
}

/* ============================================================
   ModuleEmptyCard — per-module empty states.
   Each module phrases its emptiness in its own voice.
   ============================================================ */

export interface ModuleEmptyCardProps {
  readonly module: string;
  readonly glyph: string;
  readonly title: string;
  readonly description: string;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
  readonly className?: string;
}

export function ModuleEmptyCard({ module, glyph, title, description, actionLabel, onAction, className = '' }: ModuleEmptyCardProps) {
  return (
    <div className={`bg-[var(--surface-raised)] border border-[var(--text-primary)] p-6 min-h-[200px] flex flex-col gap-2 ${className}`}>
      <div className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.18em] mb-1">
        {module}
      </div>
      <div className="font-serif italic text-[28px] text-[var(--text-primary)] mb-1">{glyph}</div>
      <div className="font-serif italic text-[16px] text-[var(--text-primary)] tracking-[-0.005em] leading-[1.45]">
        {title}
      </div>
      <div className="text-[12px] text-[var(--text-tertiary)] leading-[1.55]">{description}</div>
      {actionLabel != null && (
        <button
          type="button"
          onClick={onAction}
          className="mt-auto self-start font-ui text-[12px] text-[var(--text-primary)] border-0 border-b border-[var(--text-primary)] bg-transparent p-0 pb-[1px] cursor-pointer tracking-[0.005em] hover:text-[var(--records-800)] hover:border-[var(--records-800)]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
