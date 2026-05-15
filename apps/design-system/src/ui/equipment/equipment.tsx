import type { ReactNode } from 'react';

/* ------------------------------------------------------------------ */
/* RecallBanner                                                         */
/* ------------------------------------------------------------------ */

export interface RecallBannerProps {
  readonly stamp: string;
  readonly body: ReactNode;
  readonly acknowledgeLabel: string;
  readonly meta: string;
  readonly onAcknowledge?: () => void;
}

export function RecallBanner({ stamp, body, acknowledgeLabel, meta, onAcknowledge }: RecallBannerProps) {
  return (
    <div
      className="text-[rgba(244,239,230,1)] border-b-4 border-b-[var(--danger-icon)] px-6 py-[14px] mb-7"
      style={{ background: 'var(--text-primary)', display: 'grid', gridTemplateColumns: '12px 1fr auto', gap: 14, alignItems: 'center' }}
    >
      <span />
      <div>
        <span className="bg-[var(--danger-icon)] text-white font-mono text-[10px] font-bold tracking-[0.18em] uppercase px-2.5 py-[3px]">
          {stamp}
        </span>
        <span className="font-serif italic text-[15px] leading-[1.5] text-[rgba(244,239,230,0.92)] ml-3.5">{body}</span>
      </div>
      <button
        type="button"
        onClick={onAcknowledge}
        className="bg-[rgba(244,239,230,1)] text-[var(--text-primary)] border-0 h-8 px-3.5 rounded font-sans text-[12px] font-semibold cursor-pointer hover:bg-[rgba(220,215,206,1)] transition-colors whitespace-nowrap"
      >
        {acknowledgeLabel}
      </button>
      <div
        className="font-mono text-[10px] tracking-[0.16em] uppercase text-[rgba(244,239,230,0.5)] pt-2 border-t border-[rgba(244,239,230,0.15)] mt-1.5"
        style={{ gridColumn: '1 / -1' }}
      >
        {meta}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* EquipmentPill                                                        */
/* ------------------------------------------------------------------ */

export type EquipmentPillVariant = 'ok' | 'warn' | 'crit';

export interface EquipmentPillProps {
  readonly variant: EquipmentPillVariant;
  readonly label: string;
}

const PILL_CLASS: Record<EquipmentPillVariant, string> = {
  ok: 'text-[var(--records-800)] border-[var(--records-700)] bg-[var(--records-50)]',
  warn: 'text-[var(--warning-icon)] border-[var(--warning-icon)] bg-[var(--warning-surface)]',
  crit: 'text-[var(--danger-icon)] border-[var(--danger-icon)] bg-[var(--danger-surface)]',
};

export function EquipmentPill({ variant, label }: EquipmentPillProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 h-[22px] px-2.5 border rounded-full font-sans text-[11px] font-medium whitespace-nowrap',
        PILL_CLASS[variant],
      ].join(' ')}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-85" />
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* EquipmentRosterRow                                                   */
/* ------------------------------------------------------------------ */

export interface EquipmentRosterRowProps {
  readonly icon: ReactNode;
  readonly name: string;
  readonly alt?: string;
  readonly serialNumber: string;
  readonly lastService: string;
  readonly lastServiceMeta?: string;
  readonly nextService: string;
  readonly nextServiceMeta?: string;
  readonly nextServiceVariant?: 'warn' | 'crit';
  readonly location: string;
  readonly locationMeta?: string;
  readonly status: EquipmentPillProps;
  readonly rowVariant?: 'ok' | 'warn' | 'crit';
}

export function EquipmentRosterRow({
  icon, name, alt, serialNumber, lastService, lastServiceMeta, nextService, nextServiceMeta,
  nextServiceVariant, location, locationMeta, status, rowVariant,
}: EquipmentRosterRowProps) {
  const rowClass = rowVariant === 'crit'
    ? 'bg-gradient-to-r from-[var(--danger-surface)] to-transparent shadow-[inset_4px_0_0_var(--danger-icon)]'
    : rowVariant === 'warn'
    ? 'bg-gradient-to-r from-[var(--warning-surface)] to-transparent'
    : '';

  const nextClass = nextServiceVariant === 'crit'
    ? 'font-mono text-[12px] text-[var(--danger-icon)] font-semibold tracking-[0]'
    : nextServiceVariant === 'warn'
    ? 'font-mono text-[12px] text-[var(--warning-icon)] font-medium tracking-[0]'
    : 'font-mono text-[12px] text-[var(--text-primary)] tracking-[0]';

  return (
    <div
      className={['border-b border-dashed border-[var(--border-default)] last:border-b-0 px-3 sm:px-5 py-[14px] items-center flex flex-wrap sm:grid gap-2 sm:gap-[14px]', rowClass].join(' ')}
      style={{ gridTemplateColumns: '40px 2fr 1fr 1fr 1fr 90px' }}
    >
      <div className="w-10 h-10 border border-[var(--text-primary)] bg-[var(--surface-sunken)] rounded flex items-center justify-center text-[var(--text-primary)]">
        {icon}
      </div>

      <div>
        <div className="font-serif text-[16px] font-medium tracking-[-0.005em] text-[var(--text-primary)]">
          {name}
          {alt != null && <span className="text-[var(--text-tertiary)] italic font-normal text-[14px]"> — {alt}</span>}
        </div>
        <div className="font-mono text-[11px] text-[var(--text-tertiary)] mt-0.5 tracking-[0]">{serialNumber}</div>
      </div>

      <div>
        <div className="font-mono text-[12px] text-[var(--text-primary)] tracking-[0]">{lastService}</div>
        {lastServiceMeta != null && <div className="font-mono text-[10px] text-[var(--text-tertiary)] mt-0.5 tracking-[0.04em]">{lastServiceMeta}</div>}
      </div>

      <div>
        <div className={nextClass}>{nextService}</div>
        {nextServiceMeta != null && <div className="font-mono text-[10px] text-[var(--text-tertiary)] mt-0.5 tracking-[0.04em]">{nextServiceMeta}</div>}
      </div>

      <div>
        <div className="font-mono text-[12px] text-[var(--text-primary)] tracking-[0]">{location}</div>
        {locationMeta != null && <div className="font-mono text-[10px] text-[var(--text-tertiary)] mt-0.5 tracking-[0.04em]">{locationMeta}</div>}
      </div>

      <div>
        <EquipmentPill {...status} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* EquipmentRoster                                                      */
/* ------------------------------------------------------------------ */

export interface EquipmentRosterProps {
  readonly title: string;
  readonly meta?: string;
  readonly rows: readonly EquipmentRosterRowProps[];
}

export function EquipmentRoster({ title, meta, rows }: EquipmentRosterProps) {
  return (
    <div className="bg-[var(--surface-raised)] border border-[var(--text-primary)]">
      <div className="px-5 py-[14px] border-b border-[var(--text-primary)] bg-[var(--surface-sunken)] flex items-baseline gap-3.5">
        <h2 className="m-0 font-serif text-[20px] font-medium tracking-[-0.012em] text-[var(--text-primary)]">{title}</h2>
        {meta != null && <span className="ml-auto font-mono text-[11px] text-[var(--text-tertiary)] tracking-[0]">{meta}</span>}
      </div>

      <div
        className="hidden sm:grid bg-[var(--surface-sunken)] font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.18em] border-b border-[var(--text-primary)] px-5 py-2 items-center"
        style={{ gridTemplateColumns: '40px 2fr 1fr 1fr 1fr 90px', gap: 14 }}
      >
        <div />
        <div>Asset</div>
        <div>Last service</div>
        <div>Next</div>
        <div>Location</div>
        <div />
      </div>

      {rows.map((row, i) => (
        <EquipmentRosterRow key={i} {...row} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* EquipmentDetail                                                      */
/* ------------------------------------------------------------------ */

export interface EquipmentDetailRow {
  readonly label: string;
  readonly value: string;
  readonly valueVariant?: 'mono' | 'serif' | 'danger';
}

export interface EquipmentDetailProps {
  readonly name: string;
  readonly alt?: string;
  readonly serialNumber: string;
  readonly icon: ReactNode;
  readonly rows: readonly EquipmentDetailRow[];
}

export function EquipmentDetail({ name, alt, serialNumber, icon, rows }: EquipmentDetailProps) {
  return (
    <aside className="bg-[var(--surface-raised)] border border-[var(--text-primary)] overflow-hidden">
      <div className="px-5 py-[18px] border-b border-[var(--text-primary)] bg-[var(--surface-sunken)]">
        <div className="font-serif text-[22px] font-medium tracking-[-0.018em] text-[var(--text-primary)]">
          {name}
          {alt != null && <span className="text-[var(--text-tertiary)] italic font-normal"> — {alt}</span>}
        </div>
        <div className="font-mono text-[11px] text-[var(--text-tertiary)] mt-1 tracking-[0]">{serialNumber}</div>
      </div>

      <div
        className="h-[140px] border-b border-[var(--text-primary)] flex items-center justify-center text-[rgba(244,239,230,1)]"
        style={{ background: 'var(--text-primary)' }}
      >
        <div className="[&_svg]:w-16 [&_svg]:h-16 [&_svg]:stroke-[rgba(244,239,230,1)] [&_svg]:fill-none [&_svg]:[stroke-width:1.2] [&_svg]:[stroke-linecap:round]">
          {icon}
        </div>
      </div>

      <div className="px-5 py-4">
        {rows.map((row) => (
          <div
            key={row.label}
            className="py-2.5 border-b border-dashed border-[var(--border-default)] last:border-b-0 items-baseline"
            style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 12 }}
          >
            <span className="font-mono text-[10px] text-[var(--text-tertiary)] tracking-[0.18em] uppercase">{row.label}</span>
            <span
              className={
                row.valueVariant === 'danger'
                  ? 'font-mono text-[12px] text-[var(--danger-icon)] font-medium tracking-[0]'
                  : row.valueVariant === 'serif'
                  ? 'font-serif text-[13px] text-[var(--text-primary)] tracking-[0]'
                  : 'font-mono text-[12px] text-[var(--text-primary)] tracking-[0]'
              }
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/* ConsumableRow                                                        */
/* ------------------------------------------------------------------ */

export interface ConsumableRowProps {
  readonly name: string;
  readonly meta?: string;
  readonly qty: string;
  readonly par: string;
  readonly status: EquipmentPillProps;
  readonly rowVariant?: 'ok' | 'warn' | 'crit';
}

export function ConsumableRow({ name, meta, qty, par, status, rowVariant }: ConsumableRowProps) {
  const rowClass = rowVariant === 'crit'
    ? 'bg-gradient-to-r from-[var(--danger-surface)] to-transparent shadow-[inset_4px_0_0_var(--danger-icon)]'
    : '';

  const qtyClass = rowVariant === 'crit'
    ? 'font-mono text-[14px] text-[var(--danger-icon)] font-semibold tracking-[0]'
    : rowVariant === 'warn'
    ? 'font-mono text-[14px] text-[var(--warning-icon)] font-medium tracking-[0]'
    : 'font-mono text-[14px] text-[var(--text-primary)] tracking-[0]';

  return (
    <div
      className={['border-b border-dashed border-[var(--border-default)] last:border-b-0 px-5 py-3 items-center', rowClass].join(' ')}
      style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 14 }}
    >
      <div>
        <div className="font-sans text-[13px] text-[var(--text-primary)]">{name}</div>
        {meta != null && <div className="font-mono text-[10px] text-[var(--text-tertiary)] mt-0.5 tracking-[0]">{meta}</div>}
      </div>
      <div className={qtyClass}>{qty}</div>
      <div className="font-mono text-[11px] text-[var(--text-tertiary)] tracking-[0]">{par}</div>
      <div><EquipmentPill {...status} /></div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SterilizationCard                                                    */
/* ------------------------------------------------------------------ */

export interface SterilizationCell {
  readonly label: string;
  readonly value: string;
  readonly valueOk?: boolean;
}

export interface SterilizationCardProps {
  readonly title: string;
  readonly cycleId: string;
  readonly cells: readonly [SterilizationCell, SterilizationCell, SterilizationCell, SterilizationCell];
  readonly contents: string;
  readonly release: string;
}

export function SterilizationCard({ title, cycleId, cells, contents, release }: SterilizationCardProps) {
  return (
    <div className="bg-[var(--surface-raised)] border border-[var(--text-primary)] px-[22px] py-[18px]">
      <div className="flex items-baseline gap-2.5 mb-3">
        <h3 className="m-0 font-serif text-[18px] font-medium tracking-[-0.012em] text-[var(--text-primary)]">{title}</h3>
        <span className="ml-auto font-mono text-[10px] text-[var(--text-tertiary)] tracking-[0.18em] uppercase">{cycleId}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {cells.map((cell) => (
          <div key={cell.label} className="bg-[var(--surface-sunken)] border border-[var(--border-default)] px-3 py-2.5">
            <div className="font-mono text-[10px] text-[var(--text-tertiary)] tracking-[0.18em] uppercase">{cell.label}</div>
            <div
              className={[
                'font-sans text-[13px] font-medium mt-1',
                cell.valueOk === true ? 'text-[var(--records-800)]' : 'text-[var(--text-primary)]',
              ].join(' ')}
            >
              {cell.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3.5 pt-3 border-t border-[var(--border-default)] font-serif italic text-[14px] text-[var(--text-secondary)] leading-[1.5]">
        <strong className="not-italic text-[var(--text-primary)]">Contents.</strong> {contents}
      </div>

      <div className="mt-3.5 pt-3 border-t border-[var(--border-default)] font-mono text-[11px] text-[var(--text-tertiary)] tracking-[0]">
        {release}
      </div>
    </div>
  );
}
