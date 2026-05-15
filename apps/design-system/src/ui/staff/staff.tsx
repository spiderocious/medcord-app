import { useState } from 'react';
import type { ReactNode } from 'react';
import { Check, ChevronLeft, ChevronRight } from '@icons';

/* ============================================================
   Staff — schedule grid, PTO, credentials, shift swap
   ============================================================ */

/* ---------------------------------------------------------- */
/* StaffStatsStrip                                             */
/* ---------------------------------------------------------- */

export interface StatCell {
  readonly label: string;
  readonly title: string;
  readonly sub: string;
  readonly subColor?: string;
}

export interface StaffStatsStripProps {
  readonly cells: readonly [StatCell, StatCell, StatCell, StatCell];
}

export function StaffStatsStrip({ cells }: StaffStatsStripProps) {
  return (
    <div
      className="border border-[var(--text-primary)] mb-7"
      style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: 'var(--surface-raised)' }}
    >
      {cells.map((cell, i) => (
        <div
          key={i}
          className="px-5 py-4"
          style={{ borderRight: i < 3 ? '1px solid var(--border-default)' : 'none' }}
        >
          <div className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.18em] mb-1.5">
            {cell.label}
          </div>
          <div className="font-serif text-[22px] font-medium tracking-[-0.012em] leading-none text-[var(--text-primary)]">
            {cell.title}
          </div>
          <div
            className="font-mono text-[11px] mt-1 tracking-[0]"
            style={{ color: cell.subColor ?? 'var(--text-tertiary)' }}
          >
            {cell.sub}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------- */
/* ScheduleBlock                                               */
/* ---------------------------------------------------------- */

export type ScheduleBlockVariant = 'day' | 'eve' | 'night' | 'oncall' | 'pto' | 'swap';

export interface ScheduleBlockProps {
  readonly variant: ScheduleBlockVariant;
  readonly label: string;
}

const BLOCK_STYLES: Record<ScheduleBlockVariant, string> = {
  day: 'bg-[var(--surface-base)] border border-[var(--text-primary)] text-[var(--text-primary)]',
  eve: 'bg-[var(--surface-sunken)] border border-[var(--text-primary)] text-[var(--text-primary)]',
  night: 'bg-[var(--text-primary)] text-[var(--neutral-0)]',
  oncall: 'bg-[var(--danger-surface)] border border-[var(--danger-icon)] text-[var(--danger-icon)]',
  pto: 'bg-[var(--surface-base)] border border-dashed border-[var(--text-tertiary)] text-[var(--text-tertiary)] italic font-serif',
  swap: 'bg-[var(--warning-surface)] border border-[var(--warning-icon)] text-[var(--warning-icon)]',
};

export function ScheduleBlock({ variant, label }: ScheduleBlockProps) {
  return (
    <span
      className={`inline-block px-2 py-[3px] font-mono text-[10px] rounded-sm font-medium ${BLOCK_STYLES[variant]}`}
    >
      {label}
    </span>
  );
}

/* ---------------------------------------------------------- */
/* StaffCell                                                   */
/* ---------------------------------------------------------- */

export type StaffCellVariant = 'default' | 'rn' | 'tech';

export interface StaffCellProps {
  readonly initials: string;
  readonly role: string;
  readonly name: string;
  readonly roleLabel: string;
  readonly variant?: StaffCellVariant;
}

const AVATAR_STYLES: Record<StaffCellVariant, { bg: string; color: string; border: string }> = {
  default: { bg: '#DEE6D6', color: '#2F4226', border: '#C4D2BC' },
  rn: { bg: '#DDE3D4', color: '#495939', border: '#C2CCB4' },
  tech: { bg: '#ECE3D6', color: '#5C4B30', border: '#D4C4A6' },
};

export function StaffCell({ initials, role, name, roleLabel, variant = 'default' }: StaffCellProps) {
  const av = AVATAR_STYLES[variant];
  return (
    <div
      className="px-5 py-[14px] bg-[var(--surface-raised)]"
      style={{ display: 'grid', gridTemplateColumns: '32px 1fr', gap: 10, alignItems: 'center' }}
    >
      <div
        className="w-8 h-8 rounded flex items-center justify-center font-sans font-semibold text-[11px] relative"
        style={{ background: av.bg, color: av.color, border: `1px solid ${av.border}`, flexShrink: 0 }}
      >
        {initials}
        <span
          className="absolute -right-[3px] -bottom-[3px] font-mono text-[8px] font-semibold bg-[var(--text-primary)] text-[var(--neutral-0)] rounded-[2px] leading-none"
          style={{ padding: '1px 3px', letterSpacing: '0.06em' }}
        >
          {role}
        </span>
      </div>
      <div>
        <div className="font-sans text-[13px] font-medium text-[var(--text-primary)]">{name}</div>
        <div className="font-mono text-[10px] text-[var(--text-tertiary)] mt-[1px] tracking-[0]">{roleLabel}</div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- */
/* ScheduleGrid                                                */
/* ---------------------------------------------------------- */

export interface ScheduleDay {
  readonly label: string;
  readonly date: number;
}

export interface ScheduleRow {
  readonly staffCell: Omit<StaffCellProps, never>;
  readonly days: readonly (ScheduleBlockProps | null)[];
}

export interface ScheduleGridProps {
  readonly title?: string;
  readonly meta?: string;
  readonly days: readonly ScheduleDay[];
  readonly todayIndex: number;
  readonly rows: readonly ScheduleRow[];
}

export function ScheduleGrid({
  title = 'Schedule — week view',
  meta,
  days,
  todayIndex,
  rows,
}: ScheduleGridProps) {
  const [activeDay, setActiveDay] = useState(todayIndex);

  return (
    <div className="bg-[var(--surface-raised)] border border-[var(--text-primary)] mb-7 overflow-hidden">
      {/* Header */}
      <div className="flex items-baseline gap-[14px] px-5 py-[14px] border-b border-[var(--text-primary)] bg-[var(--surface-sunken)]">
        <h2 className="m-0 font-serif text-[20px] font-medium tracking-[-0.012em] text-[var(--text-primary)]">
          {title}
        </h2>
        {meta != null && (
          <span className="ml-auto font-mono text-[11px] text-[var(--text-tertiary)] tracking-[0]">{meta}</span>
        )}
        <div className="flex gap-1.5">
          {(['‹ Prev', 'Today', 'Next ›'] as const).map((label) => (
            <button
              key={label}
              className="bg-transparent border border-[var(--text-primary)] px-[10px] py-1 font-mono text-[10px] cursor-pointer uppercase tracking-[0.16em] text-[var(--text-primary)]"
              onClick={() => { if (label === 'Today') setActiveDay(todayIndex); }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `200px repeat(${days.length}, 1fr)`,
          background: 'var(--text-primary)',
          gap: 1,
        }}
      >
        {/* Column headers */}
        <div className="bg-[var(--surface-sunken)] px-5 py-[10px] font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.18em]">
          Provider
        </div>
        {days.map((day, i) => (
          <button
            key={i}
            onClick={() => setActiveDay(i)}
            className="px-3 py-[10px] font-mono text-[10px] uppercase tracking-[0.18em] text-center cursor-pointer border-0"
            style={{
              background: i === activeDay ? 'var(--text-primary)' : 'var(--surface-sunken)',
              color: i === activeDay ? 'var(--neutral-0)' : 'var(--text-tertiary)',
            }}
          >
            {day.label} · {day.date}
          </button>
        ))}

        {/* Staff rows */}
        {rows.map((row, ri) => (
          <div key={ri} style={{ display: 'contents' }}>
            <StaffCell {...row.staffCell} />
            {row.days.map((block, di) => (
              <div
                key={di}
                className="bg-[var(--surface-raised)] px-[6px] py-2 min-h-[60px] flex flex-col items-center justify-center gap-0.5 text-center"
              >
                {block != null && <ScheduleBlock {...block} />}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- */
/* PTORow                                                      */
/* ---------------------------------------------------------- */

export type PTOStatus = 'pending' | 'approved';

export interface PTORowProps {
  readonly initials: string;
  readonly avatarBg?: string;
  readonly avatarColor?: string;
  readonly avatarBorder?: string;
  readonly name: string;
  readonly reason: string;
  readonly date: string;
  readonly status: PTOStatus;
}

export function PTORow({ initials, avatarBg = '#DDE3D4', avatarColor = '#495939', avatarBorder = '#C2CCB4', name, reason, date, status }: PTORowProps) {
  return (
    <div
      className="px-5 py-[14px] border-b border-dashed border-[var(--border-default)] last:border-b-0"
      style={{ display: 'grid', gridTemplateColumns: '32px 1fr auto', gap: 10, alignItems: 'center' }}
    >
      <div
        className="w-8 h-8 rounded flex items-center justify-center font-sans font-semibold text-[11px] flex-shrink-0"
        style={{ background: avatarBg, color: avatarColor, border: `1px solid ${avatarBorder}` }}
      >
        {initials}
      </div>
      <div>
        <div className="font-sans text-[13px] font-semibold text-[var(--text-primary)]">{name}</div>
        <div className="font-serif italic text-[13px] text-[var(--text-secondary)] mt-[2px] leading-[1.4]">{reason}</div>
        <div className="font-mono text-[11px] text-[var(--text-tertiary)] mt-[2px] tracking-[0]">{date}</div>
      </div>
      <span
        className={`font-mono text-[10px] uppercase tracking-[0.16em] px-2 py-[3px] rounded-full border whitespace-nowrap ${
          status === 'approved'
            ? 'text-[var(--records-800)] border-[var(--records-700)] bg-[var(--records-50)]'
            : 'text-[var(--warning-icon)] border-[var(--warning-icon)] bg-[var(--warning-surface)]'
        }`}
      >
        {status === 'approved' ? 'Approved' : 'Pending'}
      </span>
    </div>
  );
}

/* ---------------------------------------------------------- */
/* CredentialRow                                               */
/* ---------------------------------------------------------- */

export type CredentialSeverity = 'ok' | 'warn' | 'crit';

export interface CredentialRowProps {
  readonly initials: string;
  readonly avatarBg?: string;
  readonly avatarColor?: string;
  readonly avatarBorder?: string;
  readonly name: string;
  readonly credential: string;
  readonly severity: CredentialSeverity;
  readonly dashArray?: string;
}

const RING_COLOR: Record<CredentialSeverity, string> = {
  ok: 'var(--records-700)',
  warn: 'var(--warning-icon)',
  crit: 'var(--danger-icon)',
};

const CRED_LABEL_COLOR: Record<CredentialSeverity, string> = {
  ok: 'var(--text-tertiary)',
  warn: 'var(--warning-icon)',
  crit: 'var(--danger-icon)',
};

export function CredentialRow({
  initials,
  avatarBg = 'var(--surface-sunken)',
  avatarColor = 'var(--text-primary)',
  avatarBorder = 'var(--border-default)',
  name,
  credential,
  severity,
  dashArray = '60 88',
}: CredentialRowProps) {
  return (
    <div
      className="px-5 py-[14px] border-b border-dashed border-[var(--border-default)] last:border-b-0"
      style={{ display: 'grid', gridTemplateColumns: '32px 1fr auto', gap: 10, alignItems: 'center' }}
    >
      <div
        className="w-8 h-8 rounded flex items-center justify-center font-sans font-semibold text-[11px] flex-shrink-0"
        style={{ background: avatarBg, color: avatarColor, border: `1px solid ${avatarBorder}` }}
      >
        {initials}
      </div>
      <div>
        <div className="font-sans text-[13px] font-semibold text-[var(--text-primary)]">{name}</div>
        <div className="font-mono text-[11px] mt-[2px] tracking-[0]" style={{ color: CRED_LABEL_COLOR[severity] }}>
          {credential}
        </div>
      </div>
      <svg width="36" height="36" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="14" fill="none" stroke="var(--surface-sunken)" strokeWidth="3" />
        <circle
          cx="18" cy="18" r="14" fill="none"
          stroke={RING_COLOR[severity]}
          strokeWidth="3"
          strokeDasharray={dashArray}
          transform="rotate(-90 18 18)"
        />
      </svg>
    </div>
  );
}

/* ---------------------------------------------------------- */
/* ShiftSwapCard                                               */
/* ---------------------------------------------------------- */

export interface SwapCandidate {
  readonly initials: string;
  readonly name: string;
  readonly meta: string;
  readonly action: 'accept' | 'muted' | 'secondary';
  readonly actionLabel: string;
}

export interface ShiftSwapCardProps {
  readonly shiftLabel: string;
  readonly when: string;
  readonly reason: string;
  readonly candidates: readonly SwapCandidate[];
}

export function ShiftSwapCard({ shiftLabel, when, reason, candidates }: ShiftSwapCardProps) {
  return (
    <div className="p-[18px_20px]">
      <div className="flex items-baseline gap-[10px] mb-2">
        <span className="font-serif text-[16px] font-medium text-[var(--text-primary)]">{shiftLabel}</span>
        <span className="ml-auto font-mono text-[11px] text-[var(--text-tertiary)] tracking-[0]">{when}</span>
      </div>
      <div
        className="font-serif italic text-[var(--text-secondary)] text-[13px] leading-[1.5] mb-[14px] px-3 py-[10px]"
        style={{ background: 'var(--surface-sunken)', borderLeft: '2px solid var(--text-primary)' }}
      >
        {reason}
      </div>
      <div className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.18em] mb-1.5">
        Eligible candidates · auto-suggested
      </div>
      {candidates.map((c, i) => (
        <div
          key={i}
          className="py-2 border-b border-dashed border-[var(--border-default)] last:border-b-0 text-[12px]"
          style={{ display: 'grid', gridTemplateColumns: '28px 1fr auto', gap: 10, alignItems: 'center' }}
        >
          <div
            className="w-7 h-7 rounded flex items-center justify-center font-sans font-semibold text-[10px] flex-shrink-0"
            style={{ background: '#DDE3D4', color: '#495939', border: '1px solid #C2CCB4' }}
          >
            {c.initials}
          </div>
          <div>
            <div className="font-sans font-semibold text-[var(--text-primary)]">{c.name}</div>
            <div className="font-mono text-[10px] text-[var(--text-tertiary)] tracking-[0]">{c.meta}</div>
          </div>
          <button
            className="font-sans text-[11px] h-[26px] px-[10px] border rounded-[3px] cursor-pointer font-medium"
            style={
              c.action === 'accept'
                ? { background: 'var(--records-700)', color: '#fff', border: 'none' }
                : c.action === 'muted'
                ? { background: 'transparent', color: 'var(--text-tertiary)', borderColor: 'var(--border-default)' }
                : { background: 'transparent', color: 'var(--text-primary)', borderColor: 'var(--text-primary)' }
            }
          >
            {c.actionLabel}
          </button>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------- */
/* StaffPanel                                                  */
/* ---------------------------------------------------------- */

export interface StaffPanelProps {
  readonly title: string;
  readonly meta?: string;
  readonly rightSlot?: ReactNode;
  readonly children: ReactNode;
}

export function StaffPanel({ title, meta, rightSlot, children }: StaffPanelProps) {
  return (
    <div className="bg-[var(--surface-raised)] border border-[var(--text-primary)]">
      <div
        className="px-5 py-[14px] border-b border-[var(--text-primary)] bg-[var(--surface-sunken)] flex items-baseline gap-[14px]"
      >
        <h3 className="m-0 font-serif text-[18px] font-medium tracking-[-0.012em] text-[var(--text-primary)]">
          {title}
        </h3>
        {meta != null && (
          <span className="ml-auto font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.18em]">
            {meta}
          </span>
        )}
        {rightSlot}
      </div>
      {children}
    </div>
  );
}

/* Re-exports for convenience */
export { Check, ChevronLeft, ChevronRight };
