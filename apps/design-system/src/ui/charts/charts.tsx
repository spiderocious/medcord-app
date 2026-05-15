import type { ReactNode } from 'react';

/* ============================================================
   Charts — printed, ink-only.
   Stacked bar, sparkline strip, Gantt, heatmap, donut, funnel.
   Color only for state (warn/crit). No fills, no gradients.
   ============================================================ */

/* ---------------------------------------------------------- */
/* ChartCard                                                   */
/* ---------------------------------------------------------- */

export interface ChartCardProps {
  readonly title: ReactNode;
  readonly meta?: string;
  readonly subtitle?: string;
  readonly children: ReactNode;
  readonly legend?: readonly { readonly label: string; readonly color?: string; readonly stroke?: string; readonly dashed?: boolean }[];
}

export function ChartCard({ title, meta, subtitle, children, legend }: ChartCardProps) {
  return (
    <div className="bg-[var(--surface-raised)] border border-[var(--text-primary)] p-[18px_22px]">
      <h2 className="m-0 mb-1 font-serif text-[18px] font-medium tracking-[-0.012em] text-[var(--text-primary)] flex items-baseline gap-2">
        <span className="flex-1">{title}</span>
        {meta !== null && <span className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.16em] font-normal">{meta}</span>}
      </h2>
      {subtitle !== null && (
        <div className="font-ui text-[12px] text-[var(--text-tertiary)] leading-[1.45] mb-3.5">{subtitle}</div>
      )}
      {children}
      {legend !== null && (
        <div className="flex gap-3.5 mt-3 font-mono text-[10px] text-[var(--text-tertiary)] tracking-[0]">
          {legend.map((l) => (
            <span key={l.label} className="inline-flex items-center gap-1.5">
              <i className="inline-block w-[14px] h-[2px]" style={{
                background: l.color ?? 'var(--text-primary)',
                borderTop: l.dashed ? `2px dashed ${l.color ?? 'var(--text-primary)'}` : undefined,
                height: l.dashed ? 0 : undefined,
              }} />
              {l.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------- */
/* StackedBarChart                                             */
/* ---------------------------------------------------------- */

export interface StackedBarSegment {
  readonly value: number;
  readonly color: string;
}

export interface StackedBarDatum {
  readonly label: string;
  readonly segments: readonly StackedBarSegment[];
}

export interface StackedBarChartProps {
  readonly data: readonly StackedBarDatum[];
  readonly yMax?: number;
  readonly yStep?: number;
  readonly height?: number;
}

export function StackedBarChart({ data, yMax = 40, yStep = 20, height = 200 }: StackedBarChartProps) {
  const W = 480;
  const H = height;
  const padL = 34;
  const padB = 20;
  const padT = 10;
  const chartH = H - padB - padT;
  const barW = Math.floor((W - padL - 20) / data.length) - 12;
  const toY = (v: number) => padT + (1 - v / yMax) * chartH;
  const yLines = Array.from({ length: Math.floor(yMax / yStep) + 1 }, (_, i) => i * yStep);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: 'block' }}>
      {/* grid lines */}
      {yLines.map((v) => (
        <g key={v}>
          <line x1={padL} y1={toY(v)} x2={W} y2={toY(v)} stroke={v === 0 ? 'var(--text-primary)' : 'var(--border-default)'} strokeDasharray={v === 0 ? undefined : '2 3'} />
          <text x={padL - 4} y={toY(v) + 4} textAnchor="end" fontFamily="JetBrains Mono" fontSize={10} fill="var(--text-tertiary)">{v}</text>
        </g>
      ))}
      {/* bars */}
      {data.map((d, di) => {
        const x = padL + 20 + di * (barW + 12);
        let curY = toY(0);
        return (
          <g key={d.label}>
            {d.segments.map((seg, si) => {
              const segH = (seg.value / yMax) * chartH;
              curY -= segH;
              return (
                <rect key={si} x={x} y={curY} width={barW} height={segH} fill={seg.color} />
              );
            })}
            <text x={x + barW / 2} y={H - 4} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={10} fill="var(--text-tertiary)">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ---------------------------------------------------------- */
/* SparklineStrip                                              */
/* ---------------------------------------------------------- */

export interface SparklineStripRow {
  readonly label: string;
  readonly points: readonly number[];
  readonly current: string;
  readonly color?: string;
  readonly status?: 'normal' | 'crit' | 'warn';
}

export interface SparklineStripProps {
  readonly rows: readonly SparklineStripRow[];
}

const SPARK_STATUS_COLOR: Record<string, string> = {
  normal: 'var(--text-primary)',
  warn: 'var(--warning-icon)',
  crit: 'var(--danger-icon)',
};

export function SparklineStrip({ rows }: SparklineStripProps) {
  return (
    <div className="flex flex-col gap-3.5 mt-3.5">
      {rows.map((row) => {
        const min = Math.min(...row.points);
        const max = Math.max(...row.points);
        const range = max - min || 1;
        const pts = row.points.map((v, i) => {
          const x = (i / (row.points.length - 1)) * 240;
          const y = 4 + (1 - (v - min) / range) * 16;
          return `${x},${y}`;
        }).join(' ');
        const color = row.color ?? SPARK_STATUS_COLOR[row.status ?? 'normal'];
        const labelColor = row.status === 'crit' ? 'text-[var(--danger-icon)]' : row.status === 'warn' ? 'text-[var(--warning-icon)]' : 'text-[var(--text-primary)]';
        const valColor = row.status === 'crit' ? 'color: var(--danger-icon); font-weight: 500' : '';
        return (
          <div key={row.label} className="font-mono text-[12px] text-[var(--text-tertiary)]"
            style={{ display: 'grid', gridTemplateColumns: '80px 1fr 60px', gap: 14, alignItems: 'center' }}>
            <span className={labelColor}>{row.label}</span>
            <svg viewBox="0 0 240 24" width="100%" height={24} style={{ display: 'block' }}>
              <polyline points={pts} stroke={color} strokeWidth="1.4" fill="none" />
            </svg>
            <span style={{ textAlign: 'right', ...(valColor ? { color, fontWeight: 500 } : {}) }}>{row.current}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------- */
/* GanttChart                                                  */
/* ---------------------------------------------------------- */

export interface GanttBlock {
  readonly label: string;
  readonly surgeon?: string;
  readonly startHour: number;
  readonly durationHours: number;
  readonly filled?: boolean;
  readonly emergency?: boolean;
}

export interface GanttRow {
  readonly room: string;
  readonly blocks: readonly GanttBlock[];
}

export interface GanttChartProps {
  readonly rows: readonly GanttRow[];
  readonly startHour?: number;
  readonly endHour?: number;
  readonly nowHour?: number;
  readonly nowLabel?: string;
}

export function GanttChart({ rows, startHour = 7, endHour = 19, nowHour, nowLabel }: GanttChartProps) {
  const W = 1080;
  const H = rows.length * 40 + 40;
  const padL = 60;
  const padT = 20;
  const padB = 20;
  const chartW = W - padL - 10;
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);
  const toX = (h: number) => padL + ((h - startHour) / (endHour - startHour)) * chartW;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: 'block' }}>
      {/* vertical hour lines */}
      {hours.map((h) => (
        <g key={h}>
          <line x1={toX(h)} y1={padT} x2={toX(h)} y2={H - padB} stroke="var(--border-default)" strokeDasharray="2 3" />
          <text x={toX(h)} y={padT - 6} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={10} fill="var(--text-tertiary)">{String(h).padStart(2, '0')}</text>
        </g>
      ))}
      {/* rows */}
      {rows.map((row, ri) => {
        const rowY = padT + ri * 40 + 10;
        return (
          <g key={row.room}>
            <text x={0} y={rowY + 14} fontFamily="JetBrains Mono" fontSize={10} fill="var(--text-tertiary)">OR · {row.room}</text>
            {row.blocks.map((block, bi) => {
              const bx = toX(block.startHour);
              const bw = (block.durationHours / (endHour - startHour)) * chartW;
              const fill = block.filled ? 'var(--text-primary)' : 'var(--surface-sunken)';
              const textFill = block.filled ? 'var(--neutral-0)' : 'var(--text-primary)';
              return (
                <g key={bi}>
                  <rect x={bx} y={rowY} width={bw} height={22}
                    fill={fill}
                    stroke={block.emergency ? 'var(--danger-icon)' : block.filled ? undefined : 'var(--text-primary)'}
                    strokeWidth={block.emergency ? 2 : undefined}
                  />
                  <text x={bx + bw / 2} y={rowY + 15} textAnchor="middle"
                    fontFamily="Inter" fontSize={11} fontWeight={block.emergency ? 600 : 500}
                    fill={textFill}>
                    {block.label}{block.surgeon !== null ? ` · ${block.surgeon}` : ''}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
      {/* now line */}
      {nowHour !== null && (
        <>
          <line x1={toX(nowHour)} y1={padT} x2={toX(nowHour)} y2={H - padB} stroke="var(--text-primary)" strokeWidth="1.5" />
          <text x={toX(nowHour)} y={H - 2} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={10} fill="var(--text-primary)">
            {nowLabel ?? `now · ${nowHour}:00`}
          </text>
        </>
      )}
    </svg>
  );
}

/* ---------------------------------------------------------- */
/* Heatmap                                                     */
/* ---------------------------------------------------------- */

export interface HeatmapProps {
  readonly rows: readonly { readonly label: string; readonly cells: readonly string[] }[];
  readonly axisLabels?: readonly string[];
}

export function Heatmap({ rows, axisLabels }: HeatmapProps) {
  const cols = rows[0]?.cells.length ?? 24;
  return (
    <div className="mt-3">
      <div
        className="border border-[var(--text-primary)] p-px gap-px"
        style={{ display: 'grid', gridTemplateColumns: `60px repeat(${cols}, 1fr)`, background: 'var(--text-primary)' }}>
        {rows.map((row) => (
          <div key={row.label} style={{ display: 'contents' }}>
            <div className="bg-[var(--surface-raised)] px-2 py-1.5 flex items-center font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.16em]">
              {row.label}
            </div>
            {row.cells.map((bg, ci) => (
              <div key={ci} className="bg-[var(--surface-raised)]" style={{ background: bg, aspectRatio: '1.6' }} />
            ))}
          </div>
        ))}
      </div>
      {axisLabels !== null && (
        <div className="mt-1.5 font-mono text-[10px] text-[var(--text-tertiary)] tracking-[0]"
          style={{ display: 'grid', gridTemplateColumns: `60px repeat(${cols}, 1fr)`, gap: 1 }}>
          <div />
          {axisLabels.map((l, i) => (
            <div key={i} className="text-center">{l}</div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------- */
/* DonutChart                                                  */
/* ---------------------------------------------------------- */

export interface DonutSegment {
  readonly label: string;
  readonly pct: number;
  readonly count: number | string;
  readonly color: string;
}

export interface DonutChartProps {
  readonly segments: readonly DonutSegment[];
  readonly centerLabel?: string;
  readonly centerSubLabel?: string;
  readonly total?: string;
}

export function DonutChart({ segments, centerLabel, centerSubLabel, total }: DonutChartProps) {
  const r = 46;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 24, alignItems: 'center' }} className="mt-3.5">
      <svg viewBox="0 0 120 120" width={160} height={160} style={{ display: 'block' }}>
        <circle cx={60} cy={60} r={r} fill="none" stroke="var(--surface-sunken)" strokeWidth={14} />
        {segments.map((seg) => {
          const dashArr = (seg.pct / 100) * circ;
          const dashOffset = -offset;
          offset += dashArr;
          return (
            <circle
              key={seg.label}
              cx={60} cy={60} r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={14}
              strokeDasharray={`${dashArr} ${circ}`}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 60 60)"
            />
          );
        })}
        {centerLabel !== null && (
          <text x={60} y={62} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={13} fontWeight={600} fill="var(--text-primary)">{centerLabel}</text>
        )}
        {centerSubLabel !== null && (
          <text x={60} y={76} textAnchor="middle" fontFamily="Inter" fontSize={9} fill="var(--text-tertiary)">{centerSubLabel}</text>
        )}
      </svg>
      <div className="flex flex-col gap-2.5">
        {total !== null && <div className="font-mono text-[11px] text-[var(--text-tertiary)] tracking-[0] mb-1">{total}</div>}
        {segments.map((seg) => (
          <div key={seg.label} className="font-mono text-[12px] tracking-[0] border-b border-dashed border-[var(--border-default)] pb-1.5 last:border-b-0"
            style={{ display: 'grid', gridTemplateColumns: '12px 1fr auto auto', gap: 10, alignItems: 'baseline' }}>
            <span className="w-[10px] h-[10px] rounded-sm inline-block" style={{ background: seg.color, border: seg.color === 'var(--surface-sunken)' ? '1px solid var(--text-tertiary)' : undefined }} />
            <span className="font-ui text-[13px] text-[var(--text-primary)]">{seg.label}</span>
            <span className="text-[var(--text-tertiary)]">{seg.pct}%</span>
            <span className="text-[var(--text-primary)] font-medium">{seg.count.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- */
/* FunnelChart                                                 */
/* ---------------------------------------------------------- */

export interface FunnelStep {
  readonly label: string;
  readonly value: number;
  readonly pct?: string;
  readonly filled?: boolean;
}

export interface FunnelChartProps {
  readonly steps: readonly FunnelStep[];
  readonly height?: number;
}

export function FunnelChart({ steps, height = 200 }: FunnelChartProps) {
  const W = 600;
  const H = height;
  const stepH = Math.floor(H / steps.length) - 4;
  const maxW = W - 40;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: 'block' }}>
      {steps.map((step, i) => {
        const pct = 1 - (i / steps.length) * 0.7;
        const nextPct = 1 - ((i + 1) / steps.length) * 0.7;
        const topW = maxW * pct;
        const botW = maxW * nextPct;
        const topX = (W - topW) / 2;
        const botX = (W - botW) / 2;
        const y = i * (stepH + 4);
        const fill = step.filled ? 'var(--text-primary)' : 'none';
        const textFill = step.filled ? 'var(--neutral-0)' : 'var(--text-primary)';
        const points = `${topX},${y} ${topX + topW},${y} ${botX + botW},${y + stepH} ${botX},${y + stepH}`;
        return (
          <g key={step.label}>
            <polygon points={points} fill={fill} stroke="var(--text-primary)" />
            <text x={W / 2} y={y + stepH / 2 + 5} textAnchor="middle"
              fontFamily="Inter" fontSize={step.filled ? 11 : i === steps.length - 2 ? 12 : 13}
              fontWeight={step.filled ? 500 : 500}
              fill={textFill}>
              {step.label}{step.value !== null ? ` · ${step.value.toLocaleString()}` : ''}
              {step.pct !== null ? ` — ${step.pct}` : ''}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
