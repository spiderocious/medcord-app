import type { ReactNode } from 'react';

/* ============================================================
   Vitals — VitalsStrip (24-hour traces) + MAR grid
   ============================================================ */

/* ---------------------------------------------------------- */
/* VitalsTrace                                                 */
/* ---------------------------------------------------------- */

export type VitalsTraceStatus = 'normal' | 'warn' | 'crit';

export interface VitalsTraceProps {
  readonly points: readonly number[];
  readonly color?: string;
  readonly dashArray?: string;
  readonly bandY1Pct?: number;
  readonly bandY2Pct?: number;
  readonly height?: number;
}

function VitalsTrace({ points, color = 'var(--text-primary)', dashArray, bandY1Pct, bandY2Pct, height = 80 }: VitalsTraceProps) {
  const W = 720;
  const H = height;
  const padX = 0;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const xs = points.map((_, i) => padX + (i / (points.length - 1)) * (W - padX * 2));
  const toY = (v: number) => 4 + (1 - (v - min) / range) * (H - 8);
  const polyline = xs.map((x, i) => `${x},${toY(points[i] ?? 0)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{ display: 'block' }}>
      {bandY1Pct !== null && bandY2Pct !== null && (
        <rect
          x={0} y={bandY1Pct * H / 100}
          width={W} height={(bandY2Pct - bandY1Pct) * H / 100}
          fill="var(--records-50)" stroke="var(--records-200)" strokeDasharray="2 3"
        />
      )}
      <polyline points={polyline} stroke={color} strokeWidth="1.4" fill="none"
        strokeDasharray={dashArray} />
    </svg>
  );
}

/* ---------------------------------------------------------- */
/* VitalsStripRow                                              */
/* ---------------------------------------------------------- */

export interface VitalsStripRowProps {
  readonly label: string;
  readonly currentValue: string;
  readonly unit: string;
  readonly reference: string;
  readonly status?: VitalsTraceStatus;
  readonly summary: readonly ReactNode[];
  readonly children: ReactNode;
}

const STATUS_VAL_COLOR: Record<VitalsTraceStatus, string> = {
  normal: 'text-[var(--text-primary)]',
  warn: 'text-[var(--warning-icon)]',
  crit: 'text-[var(--danger-icon)]',
};

export function VitalsStripRow({ label, currentValue, unit, reference, status = 'normal', summary, children }: VitalsStripRowProps) {
  return (
    <div className="border-b border-[var(--border-default)] last:border-b-0"
      style={{ display: 'grid', gridTemplateColumns: '140px 1fr 100px', alignItems: 'stretch' }}>
      {/* Label column */}
      <div className="flex flex-col gap-1 justify-center px-5 py-[18px] border-r border-[var(--border-default)]">
        <span className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.18em]">{label}</span>
        <span className={['font-mono font-medium leading-none tracking-[-0.02em] mt-0.5', STATUS_VAL_COLOR[status]].join(' ')}
          style={{ fontSize: 28, fontFeatureSettings: '"tnum" 1' }}>
          {currentValue}<span className="font-ui text-[11px] text-[var(--text-tertiary)] ml-1">{unit}</span>
        </span>
        <span className="font-mono text-[10px] text-[var(--text-tertiary)] tracking-[0]">{reference}</span>
      </div>
      {/* Chart */}
      <div className="px-5 py-2">{children}</div>
      {/* Summary */}
      <div className="flex flex-col gap-1 justify-center px-5 py-[18px] border-l border-[var(--border-default)]">
        {summary.map((s, i) => (
          <span key={i} className="font-mono text-[11px] text-[var(--text-tertiary)] tracking-[0]">{s}</span>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- */
/* VitalsStrip                                                 */
/* ---------------------------------------------------------- */

export interface VitalsStripProps {
  readonly title?: string;
  readonly meta?: string;
  readonly xLabels?: readonly string[];
  readonly legend?: readonly { readonly label: string; readonly color: string }[];
  readonly children: ReactNode;
}

export function VitalsStrip({ title = 'Vital signs — 24 h', meta, xLabels, legend, children }: VitalsStripProps) {
  return (
    <div className="bg-[var(--surface-raised)] border border-[var(--text-primary)] mb-9">
      {/* Header */}
      <div className="flex items-baseline gap-[18px] px-5 py-[14px] border-b border-[var(--text-primary)] bg-[var(--surface-sunken)]">
        <h2 className="m-0 font-serif text-[20px] font-medium tracking-[-0.012em] text-[var(--text-primary)]">{title}</h2>
        {legend !== null && (
          <div className="flex gap-[14px] items-center font-mono text-[10px] text-[var(--text-tertiary)] tracking-[0]">
            {legend.map((l) => (
              <span key={l.label} className="inline-flex items-center gap-1.5">
                <i className="inline-block w-[14px] h-[2px] rounded-[1px]" style={{ background: l.color }} />
                {l.label}
              </span>
            ))}
          </div>
        )}
        {meta !== null && <span className="ml-auto font-mono text-[11px] text-[var(--text-tertiary)] tracking-[0]">{meta}</span>}
      </div>
      {/* Rows */}
      {children}
      {/* X-axis */}
      {xLabels !== null && (
        <div className="flex justify-between px-5 pt-1.5 pb-3 border-t border-[var(--border-default)] font-mono text-[10px] text-[var(--text-tertiary)] tracking-[0]"
          style={{ marginLeft: 140 }}>
          {xLabels.map((l) => <span key={l}>{l}</span>)}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------- */
/* MAR — Medication Administration Record                     */
/* ---------------------------------------------------------- */

export type MARCellStatus = 'given' | 'held' | 'missed' | 'refused' | 'due' | 'future' | 'empty';

export interface MARCellData {
  readonly status: MARCellStatus;
  readonly text?: string;
  readonly initials?: string;
  readonly time?: string;
}

export interface MARDrug {
  readonly name: string;
  readonly dose: string;
  readonly indication?: string;
  readonly cells: readonly MARCellData[];
}

export interface MARProps {
  readonly title?: string;
  readonly meta?: string;
  readonly hours: readonly string[];
  readonly drugs: readonly MARDrug[];
}

const CELL_STYLE: Record<MARCellStatus, string> = {
  given: 'bg-[var(--records-50)] text-[var(--records-800)]',
  held: 'bg-[var(--warning-surface)] text-[var(--warning-icon)]',
  missed: 'bg-[var(--danger-surface)] text-[var(--danger-icon)] font-semibold',
  refused: 'bg-[#eff6ff] text-[#3b82f6]',
  due: 'bg-[var(--text-primary)] text-[var(--neutral-0)] font-semibold',
  future: 'text-[var(--text-disabled)]',
  empty: 'text-[var(--text-disabled)]',
};

export function MARGrid({ title = 'Medication administration record', meta, hours, drugs }: MARProps) {
  return (
    <div className="bg-[var(--surface-raised)] border border-[var(--text-primary)] mb-9">
      {/* Header */}
      <div className="flex items-baseline gap-[18px] px-5 py-[14px] border-b border-[var(--text-primary)] bg-[var(--surface-sunken)]">
        <h2 className="m-0 font-serif text-[20px] font-medium tracking-[-0.012em] text-[var(--text-primary)] flex-1">{title}</h2>
        {meta !== null && <span className="font-mono text-[11px] text-[var(--text-tertiary)] tracking-[0]">{meta}</span>}
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: `240px repeat(${hours.length}, 1fr)` }}>
        {/* Column headers */}
        <div className="px-5 py-2 border-b border-r border-[var(--text-primary)] bg-[var(--surface-sunken)] font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.16em]">
          Drug · dose
        </div>
        {hours.map((h) => (
          <div key={h}
            className="py-2 text-center border-b border-r border-[var(--text-primary)] last:border-r-0 bg-[var(--surface-sunken)] font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.16em]">
            {h}
          </div>
        ))}

        {/* Drug rows */}
        {drugs.map((drug, di) => (
          <div key={drug.name} style={{ display: 'contents' }}>
            {/* Drug name cell */}
            <div className={['px-5 py-[14px] border-r border-[var(--border-default)]', di === drugs.length - 1 ? '' : 'border-b border-dashed border-[var(--border-default)]'].join(' ')}
              style={{ borderBottomStyle: 'dashed' }}>
              <div className="font-serif italic text-[16px] font-medium text-[var(--text-primary)] tracking-[-0.005em]">{drug.name}</div>
              <div className="font-mono text-[11px] text-[var(--text-secondary)] mt-0.5 tracking-[0]">{drug.dose}</div>
              {drug.indication !== null && (
                <div className="font-ui text-[11px] text-[var(--text-tertiary)] mt-0.5">{drug.indication}</div>
              )}
            </div>
            {/* Time cells */}
            {drug.cells.map((cell, ci) => (
              <div key={ci}
                className={[
                  'flex flex-col items-center justify-center gap-0.5 min-h-[60px] px-1 py-2 text-center',
                  'border-r border-[var(--border-default)] last:border-r-0 font-mono text-[10px] tracking-[0]',
                  di === drugs.length - 1 ? '' : 'border-b border-dashed',
                  CELL_STYLE[cell.status],
                ].join(' ')}
                style={{ borderBottomStyle: 'dashed' }}>
                {cell.status === 'future' ? (
                  <span>—</span>
                ) : cell.status === 'given' && cell.initials !== null ? (
                  <>
                    <strong className="font-semibold">{cell.initials}</strong>
                    {cell.time !== null && <span>·{cell.time}</span>}
                  </>
                ) : cell.text !== null ? (
                  <span>{cell.text}</span>
                ) : null}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-4 flex-wrap px-5 py-3 border-t border-[var(--text-primary)] bg-[var(--surface-sunken)] font-mono text-[10px] text-[var(--text-tertiary)] tracking-[0]">
        {[
          { label: 'given · initials & time', bg: 'var(--records-50)', border: '1px solid var(--records-200)' },
          { label: 'held · with reason', bg: 'var(--warning-surface)', border: '1px solid var(--warning-icon)' },
          { label: 'missed', bg: 'var(--danger-surface)', border: '1px solid var(--danger-icon)' },
          { label: 'refused', bg: '#eff6ff', border: '1px solid #93c5fd' },
          { label: 'due', bg: 'var(--text-primary)', border: 'none' },
        ].map((item) => (
          <span key={item.label} className="inline-flex items-center gap-1.5">
            <i className="inline-block w-[14px] h-[14px] rounded-sm"
              style={{ background: item.bg, border: item.border }} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- */
/* Re-export VitalsTrace for use in screens                   */
/* ---------------------------------------------------------- */
export { VitalsTrace };
