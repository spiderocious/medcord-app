import type { ReactNode } from 'react';

export type LabFlag = 'normal' | 'h' | 'l' | 'crit';

/* ---------------------------------------------------------- */
/* RangeBar                                                    */
/* ---------------------------------------------------------- */

export interface RangeBarProps {
  readonly low: number;
  readonly high: number;
  readonly markerPct: number;
  readonly okLeft?: string;
  readonly okRight?: string;
  readonly flag: LabFlag;
}

const MARKER_COLOR: Record<LabFlag, string> = {
  normal: 'bg-[var(--text-primary)]',
  h: 'bg-[var(--warning-icon)]',
  l: 'bg-[#3b82f6]',
  crit: 'bg-[var(--danger-icon)] w-[3px]',
};

export function RangeBar({ low, high, markerPct, okLeft = '0%', okRight = '0%', flag }: RangeBarProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between font-mono text-[10px] text-[var(--text-tertiary)] tracking-[0]">
        <span>{low}</span>
        <span>{high}</span>
      </div>
      <div className="relative h-[10px] bg-[var(--surface-sunken)] border-t border-b border-[var(--border-default)]">
        <span
          className="absolute top-0 bottom-0 bg-[var(--records-50)] border-l border-r border-[var(--records-300)]"
          style={{ left: okLeft, right: okRight }}
        />
        <span
          className={['absolute top-[-3px] bottom-[-3px] w-[2px]', MARKER_COLOR[flag]].join(' ')}
          style={{ left: `${markerPct}%` }}
        />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- */
/* LabSparkline                                                */
/* ---------------------------------------------------------- */

export interface LabSparklineProps {
  readonly points: readonly number[];
  readonly flag?: LabFlag;
  readonly width?: number;
  readonly height?: number;
}

const SPARK_STROKE: Record<LabFlag, string> = {
  normal: 'var(--text-primary)',
  h: 'var(--warning-icon)',
  l: '#3b82f6',
  crit: 'var(--danger-icon)',
};

export function LabSparkline({ points, flag = 'normal', width = 120, height = 36 }: LabSparklineProps) {
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const pad = 4;
  const xs = points.map((_, i) => pad + (i / (points.length - 1)) * (width - pad * 2));
  const ys = points.map((v) => pad + (1 - (v - min) / range) * (height - pad * 2));
  const d = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x},${ys[i]}`).join(' ');
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} style={{ display: 'block' }}>
      <path d={d} stroke={SPARK_STROKE[flag]} strokeWidth="1.4" fill="none" />
    </svg>
  );
}

/* ---------------------------------------------------------- */
/* LabSpotlightChart                                          */
/* ---------------------------------------------------------- */

export interface SpotlightPoint {
  readonly time: string;
  readonly value: number;
  readonly flag: LabFlag;
  readonly label?: string;
}

export interface LabSpotlightChartProps {
  readonly points: readonly SpotlightPoint[];
  readonly refLine?: number;
  readonly width?: number;
  readonly height?: number;
}

export function LabSpotlightChart({ points, refLine, width = 240, height = 60 }: LabSpotlightChartProps) {
  if (points.length < 2) return null;
  const values = points.map((p) => p.value);
  const min = 0;
  const max = Math.max(...values) * 1.1;
  const range = max - min || 1;
  const padX = 20;
  const padY = 8;
  const xs = points.map((_, i) => padX + (i / (points.length - 1)) * (width - padX * 2));
  const toY = (v: number) => padY + (1 - (v - min) / range) * (height - padY * 2);
  const polyline = xs.map((x, i) => `${x},${toY(points[i]?.value ?? 0)}`).join(' ');
  const refY = refLine != null ? toY(refLine) : null;

  const DOT_COLOR: Record<LabFlag, string> = {
    normal: 'var(--records-700)',
    h: 'var(--warning-icon)',
    l: '#3b82f6',
    crit: 'var(--danger-icon)',
  };

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ display: 'block' }}>
      <line x1={0} y1={height - padY / 2} x2={width} y2={height - padY / 2} stroke="var(--border-default)" />
      {refY != null && (
        <line x1={0} y1={refY} x2={width} y2={refY} stroke="var(--records-300)" strokeDasharray="2 3" />
      )}
      <polyline points={polyline} stroke="var(--danger-icon)" strokeWidth="1.6" fill="none" />
      {points.map((p, i) => {
        const x = xs[i] ?? 0;
        const y = toY(p.value);
        const isLast = i === points.length - 1;
        return (
          <circle
            key={i}
            cx={x} cy={y}
            r={isLast ? 4 : 3}
            fill={DOT_COLOR[p.flag]}
            stroke={isLast ? 'var(--surface-raised)' : undefined}
            strokeWidth={isLast ? 2 : undefined}
          />
        );
      })}
    </svg>
  );
}

/* ---------------------------------------------------------- */
/* LabSpotlight                                               */
/* ---------------------------------------------------------- */

export interface SpotlightEntry {
  readonly label: string;
  readonly value: string;
  readonly flag: LabFlag;
}

export interface LabSpotlightProps {
  readonly name: string;
  readonly subtitle?: string;
  readonly value: string;
  readonly unit: string;
  readonly refRange: string;
  readonly criticalNote?: ReactNode;
  readonly entries?: readonly SpotlightEntry[];
  readonly chartPoints?: readonly SpotlightPoint[];
  readonly refLine?: number;
  readonly acknowledged?: boolean;
  readonly onAcknowledge?: () => void;
}

export function LabSpotlight({
  name, subtitle, value, unit, refRange, criticalNote,
  entries = [], chartPoints, refLine,
  acknowledged = false, onAcknowledge,
}: LabSpotlightProps) {
  return (
    <div className="relative bg-[var(--surface-raised)] border border-[var(--text-primary)] grid gap-6 px-6 sm:px-10 pt-9 pb-7"
      style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,280px)', alignItems: 'start' }}
      >
      {/* 6px left bleed */}
      <span className="absolute left-0 top-0 bottom-0 w-[6px] bg-[var(--danger-icon)]" />
      {/* stamp — sits above the top border; parent must NOT have overflow-hidden */}
      <span className="absolute font-mono text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--danger-icon)] border border-[var(--danger-icon)] bg-[var(--surface-raised)] px-2.5 py-[1px]"
        style={{ top: 0, left: 42, transform: 'translateY(-50%)' }}>
        Critical · acknowledge required
      </span>

      {/* Left column */}
      <div>
        <div className="font-serif text-[22px] font-medium tracking-[-0.012em] text-[var(--text-primary)] mb-1">{name}</div>
        {subtitle != null && (
          <div className="font-serif italic text-[14px] text-[var(--text-tertiary)] mb-[18px]">{subtitle}</div>
        )}
        <div className="flex items-baseline gap-3 font-mono font-medium leading-[0.9] tracking-[-0.04em] text-[var(--danger-icon)]"
          style={{ fontSize: 96, fontFeatureSettings: '"tnum" 1' }}>
          {value}
          <span className="font-ui text-[18px] text-[var(--text-tertiary)] font-medium">{unit}</span>
        </div>
        <div className="font-mono text-[12px] text-[var(--text-tertiary)] mt-2 tracking-[0]">{refRange}</div>
        {criticalNote != null && <div className="mt-1 font-mono text-[12px] text-[var(--danger-icon)]">{criticalNote}</div>}

        {onAcknowledge != null && !acknowledged && (
          <div className="mt-[18px] bg-[var(--text-primary)] text-[var(--neutral-0)] px-[14px] py-3 flex items-center gap-2.5 font-ui text-[12px]">
            <span className="font-semibold">Awaiting acknowledgement</span>
            <span className="text-[rgba(244,239,230,0.7)] flex-1">auto-page sent at 14:42</span>
            <button
              type="button"
              onClick={onAcknowledge}
              className="bg-[var(--danger-icon)] text-white border-0 h-[26px] px-3 font-ui text-[11px] font-semibold tracking-[0.04em] uppercase cursor-pointer rounded-sm"
            >
              Acknowledge
            </button>
          </div>
        )}
        {acknowledged && (
          <div className="mt-[18px] bg-[var(--records-50)] border border-[var(--records-300)] px-[14px] py-3 flex items-center gap-2.5 font-ui text-[12px] text-[var(--records-700)]">
            <span className="font-semibold">Acknowledged</span>
          </div>
        )}
      </div>

      {/* Right column */}
      <div>
        {entries.map((entry) => (
          <div key={entry.label} className="mb-3">
            <div className="font-mono text-[10px] text-[var(--text-tertiary)] tracking-[0.18em] uppercase mb-1.5">{entry.label}</div>
            <div className="font-mono text-[13px] text-[var(--text-primary)] tracking-[0]">
              {entry.flag === 'crit' ? (
                <strong className="font-serif italic font-medium text-[var(--danger-icon)] text-[16px]">{entry.value}</strong>
              ) : entry.flag === 'h' ? (
                <span>{entry.value}</span>
              ) : (
                <span>{entry.value}</span>
              )}
            </div>
          </div>
        ))}
        {chartPoints != null && (
          <>
            <div className="font-mono text-[10px] text-[var(--text-tertiary)] tracking-[0.18em] uppercase mb-1.5">Trend</div>
            <LabSpotlightChart points={chartPoints} refLine={refLine} />
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- */
/* LabRow                                                      */
/* ---------------------------------------------------------- */

export interface LabRowProps {
  readonly name: string;
  readonly alt?: string;
  readonly ordinal?: string;
  readonly value: string;
  readonly unit: string;
  readonly flag?: LabFlag;
  readonly rangeBar?: RangeBarProps;
  readonly trend?: {
    readonly points: readonly number[];
    readonly arrow?: 'up' | 'down' | 'stable';
    readonly delta?: string;
  };
}

const ROW_BG: Record<LabFlag, string> = {
  normal: '',
  h: 'bg-gradient-to-r from-[var(--warning-surface)] to-transparent shadow-[inset_0px_0px_0px_0px]',
  l: 'bg-gradient-to-r from-[#eff6ff] to-transparent',
  crit: 'bg-gradient-to-r from-[var(--danger-surface)] to-transparent shadow-[inset_4px_0_0_var(--danger-icon)]',
};

const VAL_COLOR: Record<LabFlag, string> = {
  normal: 'text-[var(--text-primary)]',
  h: 'text-[var(--warning-icon)]',
  l: 'text-[#3b82f6]',
  crit: 'text-[var(--danger-icon)]',
};

export function LabRow({ name, alt, ordinal, value, unit, flag = 'normal', rangeBar, trend }: LabRowProps) {
  return (
    <div
      className={['border-b border-[var(--border-default)] last:border-b-0 px-4 sm:px-5 py-[14px] items-center', ROW_BG[flag]].join(' ')}
      style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', columnGap: 16 }}
    >
      {/* Name column */}
      <div>
        <div className="font-serif text-[17px] font-medium tracking-[-0.005em]">
          <span className="text-[var(--text-primary)]">{name}</span>
          {alt != null && <span className="text-[var(--text-tertiary)] italic font-normal text-[14px]"> — {alt}</span>}
        </div>
        {ordinal != null && <div className="font-mono text-[10px] text-[var(--text-tertiary)] mt-0.5 tracking-[0]">{ordinal}</div>}
        {trend != null && (
          <div className="flex items-center gap-3.5 mt-1">
            <LabSparkline points={trend.points} flag={flag} />
            {trend.arrow != null && (
              <span className={[
                'font-mono text-[13px]',
                trend.arrow === 'up' ? (flag === 'crit' ? 'text-[var(--danger-icon)]' : 'text-[var(--warning-icon)]') :
                trend.arrow === 'down' ? 'text-[#3b82f6]' : 'text-[var(--text-tertiary)]',
              ].join(' ')}>
                {trend.arrow === 'up' ? '↑' : trend.arrow === 'down' ? '↓' : '→'}
              </span>
            )}
            {trend.delta != null && <span className="font-mono text-[11px] text-[var(--text-tertiary)] tracking-[0]">{trend.delta}</span>}
          </div>
        )}
      </div>

      {/* Value column */}
      <div className={['flex items-baseline gap-2 font-mono font-medium leading-none tracking-[-0.025em]', VAL_COLOR[flag]].join(' ')}
        style={{ fontSize: 36, fontFeatureSettings: '"tnum" 1' }}>
        {value}
        <span className="font-ui text-[12px] text-[var(--text-tertiary)] font-medium tracking-[0.02em]">{unit}</span>
      </div>

      {/* Range bar column */}
      {rangeBar != null && <RangeBar {...rangeBar} flag={flag} />}
    </div>
  );
}

/* ---------------------------------------------------------- */
/* LabTrendChart                                               */
/* ---------------------------------------------------------- */

export interface TrendPoint {
  readonly label: string;
  readonly value: number;
  readonly flag: LabFlag;
}

export interface LabTrendChartProps {
  readonly points: readonly TrendPoint[];
  readonly targetLow: number;
  readonly targetHigh: number;
  readonly targetLabel?: string;
  readonly yLabels?: readonly { readonly value: number; readonly label: string }[];
  readonly unit?: string;
}

export function LabTrendChart({ points, targetLow, targetHigh, targetLabel, yLabels = [], unit }: LabTrendChartProps) {
  const values = points.map((p) => p.value);
  const allValues = [...values, targetLow, targetHigh];
  const minVal = Math.min(...allValues) * 0.85;
  const maxVal = Math.max(...allValues) * 1.15;
  const range = maxVal - minVal || 1;
  const W = 720;
  const H = 200;
  const padX = 40;
  const padTop = 20;
  const padBot = 20;
  const chartH = H - padTop - padBot;
  const toY = (v: number) => padTop + (1 - (v - minVal) / range) * chartH;
  const xs = points.map((_, i) => padX + (i / (points.length - 1)) * (W - padX * 2));
  const polyline = xs.map((x, i) => `${x},${toY(points[i]?.value ?? 0)}`).join(' ');
  const bandY1 = toY(targetHigh);
  const bandY2 = toY(targetLow);
  const bandH = bandY2 - bandY1;

  const DOT_FILL: Record<LabFlag, string> = {
    normal: 'var(--records-700)',
    h: 'var(--warning-icon)',
    l: '#3b82f6',
    crit: 'var(--danger-icon)',
  };

  return (
    <div className="px-6 py-[22px]">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: 'block' }}>
        {/* target band */}
        <rect x={padX} y={bandY1} width={W - padX * 2} height={bandH}
          fill="var(--records-50)" stroke="var(--records-200)" strokeDasharray="2 3" />
        {targetLabel != null && (
          <text x={padX + 8} y={bandY1 + 14} fontFamily="JetBrains Mono" fontSize={10} fill="var(--records-800)">{targetLabel}</text>
        )}
        {/* y labels */}
        {yLabels.map((yl) => (
          <g key={yl.label}>
            <line x1={padX} y1={toY(yl.value)} x2={W - padX} y2={toY(yl.value)} stroke="var(--border-default)" strokeWidth={0.5} />
            <text x={4} y={toY(yl.value) + 4} fontFamily="JetBrains Mono" fontSize={10} fill="var(--text-tertiary)">{yl.label}</text>
          </g>
        ))}
        {/* baseline */}
        <line x1={padX} y1={H - padBot} x2={W - padX} y2={H - padBot} stroke="var(--text-primary)" />
        {/* trace */}
        <polyline points={polyline} stroke="var(--text-primary)" strokeWidth="1.6" fill="none" />
        {/* dots */}
        {points.map((p, i) => {
          const x = xs[i] ?? 0;
          const y = toY(p.value);
          const isLast = i === points.length - 1;
          const isCrit = p.flag === 'crit';
          return (
            <circle key={i} cx={x} cy={y}
              r={isLast || isCrit ? 5 : 3.5}
              fill={DOT_FILL[p.flag]}
              stroke={isLast ? 'var(--surface-raised)' : undefined}
              strokeWidth={isLast ? 2 : undefined}
            />
          );
        })}
        {/* x labels */}
        {points.map((p, i) => {
          const x = xs[i] ?? 0;
          const isLast = i === points.length - 1;
          return (
            <text key={i} x={x} y={H - 2} textAnchor="middle"
              fontFamily="JetBrains Mono" fontSize={10}
              fill={isLast && points[i]?.flag === 'crit' ? 'var(--danger-icon)' : 'var(--text-tertiary)'}
              fontWeight={isLast && points[i]?.flag === 'crit' ? 600 : undefined}>
              {p.label}{isLast && points[i]?.flag === 'crit' ? ' ↑↑' : ''}
            </text>
          );
        })}
      </svg>
      {/* legend */}
      <div className="flex gap-[18px] mt-[14px] font-mono text-[11px] text-[var(--text-tertiary)] tracking-[0]">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-[var(--records-700)]" />within target{unit != null ? ` (${unit})` : ''}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-[var(--warning-icon)]" />flagged H
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-[var(--danger-icon)]" />critical
        </span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- */
/* LabPanel                                                    */
/* ---------------------------------------------------------- */

export interface LabPanelProps {
  readonly title: ReactNode;
  readonly lot?: string;
  readonly meta?: string;
  readonly children: ReactNode;
}

export function LabPanel({ title, lot, meta, children }: LabPanelProps) {
  return (
    <div className="bg-[var(--surface-raised)] border border-[var(--text-primary)] mb-9">
      <div className="flex items-baseline gap-4 px-5 py-[14px] border-b border-[var(--text-primary)] bg-[var(--surface-sunken)]">
        <h2 className="m-0 font-serif text-[20px] font-medium tracking-[-0.012em] text-[var(--text-primary)] flex-1">{title}</h2>
        {lot != null && <span className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.16em]">{lot}</span>}
        {meta != null && <span className="font-mono text-[11px] text-[var(--text-tertiary)] tracking-[0] ml-auto">{meta}</span>}
      </div>
      {children}
    </div>
  );
}
