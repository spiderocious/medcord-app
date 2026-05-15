import { type ReactNode, useState } from 'react';
import { Plus, ClipboardCheck, ArrowLeftRight, LogOut } from '@icons';

/* ============================================================
   Patient Banner — the single most important object in Medcord.
   Full-bleed chart header present on every patient-context page.
   ============================================================ */

export type CodeStatus = 'full-code' | 'dnr' | 'dnr-dni' | 'cmo' | 'comfort';
export type AllergyBandVariant = 'allergy' | 'no-known' | 'advisory';

export interface BannerFlag {
  readonly label: string;
  readonly variant: 'fall' | 'npo' | 'iso' | 'aspir' | 'default';
}

export interface BannerVital {
  readonly label: string;
  readonly value: string;
  readonly unit?: string;
  readonly status?: 'normal' | 'flagged' | 'critical';
  readonly meta?: string;
  readonly spark?: Array<{ x: number; y: number }>;
}

export interface BannerAction {
  readonly label: string;
  readonly variant?: 'quiet' | 'secondary' | 'primary' | 'danger';
  readonly icon?: ReactNode;
  readonly onClick?: () => void;
}

export interface BannerTabItem {
  readonly label: string;
  readonly active?: boolean;
  readonly onClick?: () => void;
}

export interface PatientBannerProps {
  /* Identity */
  readonly initials: string;
  readonly avatarBg?: string;
  readonly avatarColor?: string;
  readonly avatarBorder?: string;
  readonly name: string;
  readonly nickname?: string;
  readonly age: string;
  readonly sex: string;
  readonly dob: string;
  readonly languages?: string;
  readonly ids: Array<{ label: string; value: string; variant?: 'default' | 'crit' }>;
  /* Right column */
  readonly attending?: string;
  readonly service?: string;
  readonly bed?: string;
  readonly insurance?: string;
  readonly rightRows?: Array<{ label: string; value: string }>;
  /* Code status */
  readonly codeStatus?: CodeStatus;
  /* Flags */
  readonly flags?: BannerFlag[];
  /* Allergy band */
  readonly allergyVariant?: AllergyBandVariant;
  readonly allergyText?: string;
  readonly allergySrc?: string;
  /* Vitals */
  readonly vitals?: BannerVital[];
  /* Tabs */
  readonly tabs?: BannerTabItem[];
  /* Actions */
  readonly actions?: BannerAction[];
}

const CODE_LABEL: Record<CodeStatus, string> = {
  'full-code': 'Full code',
  dnr: 'DNR',
  'dnr-dni': 'DNR · DNI',
  cmo: 'CMO',
  comfort: 'Comfort',
};

const FLAG_STYLE: Record<BannerFlag['variant'], string> = {
  fall: 'text-[var(--warning-icon)] border-[var(--warning-icon)]',
  npo: 'bg-[var(--text-primary)] text-[var(--neutral-0)] border-[var(--text-primary)]',
  iso: 'text-[var(--records-700)] border-[var(--records-700)]',
  aspir: 'text-[var(--danger-icon)] border-[var(--danger-icon)]',
  default: 'text-[var(--text-secondary)] border-[var(--border-default)]',
};

const ACTION_STYLE: Record<NonNullable<BannerAction['variant']>, string> = {
  quiet: 'text-[var(--text-secondary)] hover:bg-black/5 hover:text-[var(--text-primary)]',
  secondary: 'border border-[var(--text-primary)] text-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--neutral-0)]',
  primary: 'bg-[var(--records-700)] text-[var(--neutral-0)] border border-[var(--records-700)] hover:bg-[var(--records-800)]',
  danger: 'text-[var(--danger-icon)] hover:bg-[var(--danger-surface)]',
};

function VitalSparkline({ points, color = '#3C3833' }: { readonly points?: Array<{ x: number; y: number }>; readonly color?: string }) {
  if (!points || points.length < 2) return null;
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const w = 80;
  const h = 14;
  const toSvg = (p: { x: number; y: number }) => {
    const sx = maxX === minX ? 0 : ((p.x - minX) / (maxX - minX)) * w;
    const sy = maxY === minY ? h / 2 : h - ((p.y - minY) / (maxY - minY)) * h;
    return `${sx},${sy}`;
  };
  const d = points.map(toSvg).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-3.5">
      <polyline points={d} stroke={color} strokeWidth="1.2" fill="none" />
    </svg>
  );
}

export function PatientBanner({
  initials, avatarBg = '#ECE3D6', avatarColor = '#5C4B30', avatarBorder = '#D4C4A6',
  name, nickname, age, sex, dob, languages,
  ids, attending, service, bed, insurance, rightRows = [],
  codeStatus = 'full-code', flags = [],
  allergyVariant = 'no-known', allergyText, allergySrc,
  vitals = [], tabs = [], actions = [],
}: PatientBannerProps) {
  const [activeTab, setActiveTab] = useState<string | null>(tabs.find((t) => t.active)?.label ?? (tabs[0]?.label ?? null));

  const codeLabel = CODE_LABEL[codeStatus];
  const codeDnr = codeStatus === 'dnr' || codeStatus === 'dnr-dni' || codeStatus === 'cmo';

  const mergedRight: Array<{ label: string; value: string }> = [
    ...(attending ? [{ label: 'Attending', value: attending }] : []),
    ...(service ? [{ label: 'Service', value: service }] : []),
    ...(bed ? [{ label: 'Bed', value: bed }] : []),
    ...(insurance ? [{ label: 'Insurance', value: insurance }] : []),
    ...rightRows,
  ];

  return (
    <div className="bg-[var(--surface-raised)] border-t-2 border-b border-[var(--text-primary)] relative">
      {/* Code status stamp — etched into the top rule */}
      <span className={[
        'absolute top-0 left-7 -translate-y-1/2',
        'font-mono text-[11px] font-semibold tracking-[0.18em] uppercase',
        'px-2.5 py-px border rounded-[1px]',
        codeDnr
          ? 'bg-[var(--text-primary)] text-[var(--neutral-0)] border-[var(--text-primary)]'
          : 'bg-[var(--surface-raised)] text-[var(--text-primary)] border-[var(--text-primary)]',
      ].join(' ')}>
        {codeLabel}
      </span>

      {/* Precaution flags — top-right */}
      {flags.length > 0 && (
        <div className="absolute top-3.5 right-7 flex gap-1.5">
          {flags.map((f) => (
            <span key={f.label} className={['font-mono text-[9px] font-semibold tracking-[0.16em] uppercase px-1.5 py-0.5 rounded-[2px] border', FLAG_STYLE[f.variant]].join(' ')}>
              {f.label}
            </span>
          ))}
        </div>
      )}

      {/* Main grid */}
      <div className="grid gap-4 sm:gap-6 px-4 sm:px-7 pt-6 pb-4" style={{ gridTemplateColumns: '56px minmax(0,1fr)' }} data-grid="banner">
        {/* Avatar */}
        <div
          className="w-16 h-16 rounded-[4px] flex items-center justify-center font-ui font-semibold text-[22px] tracking-[0.02em] flex-shrink-0"
          style={{ background: avatarBg, color: avatarColor, border: `1px solid ${avatarBorder}` }}
        >
          {initials}
        </div>

        {/* Who */}
        <div>
          <h1 className="m-0 mb-1 font-serif text-[30px] font-medium leading-none tracking-[-0.022em] text-[var(--text-primary)]">
            {name}
            {nickname != null && <span className="text-[var(--text-tertiary)] italic font-normal"> &quot;{nickname}&quot;</span>}
          </h1>
          <div className="flex gap-3.5 items-baseline flex-wrap mt-1.5 font-ui text-[13px] text-[var(--text-secondary)]">
            <span><strong className="text-[var(--text-primary)] font-semibold">{age}</strong></span>
            <span className="text-[var(--border-default)]">·</span>
            <span>{sex}</span>
            <span className="text-[var(--border-default)]">·</span>
            <span>DOB <span className="font-mono tracking-[0]">{dob}</span></span>
            {languages != null && (
              <>
                <span className="text-[var(--border-default)]">·</span>
                <span className="text-[var(--text-tertiary)]">{languages}</span>
              </>
            )}
          </div>
          <div className="flex gap-3.5 mt-2 font-mono text-[11px] text-[var(--text-tertiary)] tracking-[0] flex-wrap">
            {ids.map((id) => (
              <span key={id.label} className={id.variant === 'crit' ? 'text-[var(--danger-icon)] font-medium' : ''}>
                {id.label} <strong className={['font-medium', id.variant === 'crit' ? '' : 'text-[var(--text-primary)]'].join(' ')}>{id.value}</strong>
              </span>
            ))}
          </div>
        </div>

        {/* Right column — spans full width on mobile, normal column on sm+ */}
        {mergedRight.length > 0 && (
          <div className="col-span-2 sm:col-span-1 flex flex-col gap-2 sm:gap-2.5 border-t sm:border-t-0 sm:border-l border-[var(--border-default)] pt-3 sm:pt-0 sm:pl-6">
            {mergedRight.map((row) => (
              <div key={row.label} className="flex items-baseline gap-3">
                <span className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.14em] w-20 flex-shrink-0">{row.label}</span>
                <span className="font-ui text-[13px] text-[var(--text-primary)] font-medium">{row.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Allergy band */}
      {allergyVariant === 'allergy' && allergyText != null ? (
        <div className="bg-[var(--danger-icon)] text-[var(--neutral-0)] px-7 py-[9px] font-serif italic text-[14px] leading-[1.4] border-b-2 border-[var(--text-primary)] flex items-center gap-3.5">
          <span className="font-mono not-italic font-semibold tracking-[0.22em] text-[10px] bg-black/30 px-2 py-[3px] rounded-[2px] flex-shrink-0">ALLERGY</span>
          <span>{allergyText}</span>
          {allergySrc != null && (
            <span className="ml-auto font-mono not-italic text-[11px] text-white/75 tracking-[0] flex-shrink-0">{allergySrc}</span>
          )}
        </div>
      ) : (
        <div className="px-7 py-2 bg-[var(--surface-sunken)] border-b border-[var(--text-primary)] font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)] flex items-center gap-3.5">
          <span className="font-serif not-uppercase italic text-[18px] tracking-normal text-[var(--text-tertiary)] leading-none">—</span>
          {allergyText ?? 'No known allergies'}
          {allergySrc != null && (
            <span className="ml-auto font-mono text-[10px] text-[var(--text-tertiary)] tracking-[0.16em] normal-case">{allergySrc}</span>
          )}
        </div>
      )}

      {/* Action shelf */}
      {(tabs.length > 0 || actions.length > 0) && (
        <div className="flex items-center gap-1.5 px-7 py-2.5 bg-[var(--surface-base)] border-b border-[var(--border-default)]">
          {tabs.length > 0 && (
            <nav className="flex items-center gap-2 font-mono text-[11px] text-[var(--text-tertiary)]">
              {tabs.map((tab) => (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => { setActiveTab(tab.label); tab.onClick?.(); }}
                  className={[
                    'cursor-pointer bg-transparent border-0 p-0 font-mono text-[11px]',
                    'hover:text-[var(--text-primary)] transition-colors',
                    activeTab === tab.label
                      ? 'text-[var(--text-primary)] font-medium border-b border-[var(--text-primary)] pb-px'
                      : 'text-[var(--text-tertiary)]',
                  ].join(' ')}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          )}
          <span className="flex-1" />
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className={[
                'inline-flex items-center gap-1.5 h-[30px] px-3 rounded-[6px] border border-transparent',
                'font-ui text-[12px] font-medium cursor-pointer transition-colors',
                ACTION_STYLE[action.variant ?? 'quiet'],
              ].join(' ')}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Vitals rail */}
      {vitals.length > 0 && (
        <div
          className="grid bg-[var(--surface-raised)] border-t border-b border-[var(--border-default)] overflow-x-auto"
          style={{ gridTemplateColumns: `repeat(${vitals.length}, minmax(100px, 1fr))` }}
        >
          {vitals.map((v, i) => (
            <div
              key={v.label}
              className={[
                'flex flex-col gap-1 px-6 py-3.5',
                i < vitals.length - 1 ? 'border-r border-[var(--border-default)]' : '',
              ].join(' ')}
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">{v.label}</div>
              <div className={[
                'font-mono font-medium text-[26px] leading-none tracking-[-0.02em] [font-feature-settings:\'tnum\'_1,\'lnum\'_1]',
                v.status === 'flagged' ? 'text-[var(--warning-icon)]' : v.status === 'critical' ? 'text-[var(--danger-icon)]' : 'text-[var(--text-primary)]',
              ].join(' ')}>
                {v.value}
                {v.unit != null && <span className="font-ui text-[11px] text-[var(--text-tertiary)] ml-1 font-medium tracking-[0.02em]">{v.unit}</span>}
              </div>
              <div className={[
                'flex items-center gap-1.5 font-mono text-[10px] tracking-[0] mt-1',
                v.status === 'critical' ? 'text-[var(--danger-icon)]' : 'text-[var(--text-tertiary)]',
              ].join(' ')}>
                {v.spark ? (
                  <VitalSparkline
                    points={v.spark}
                    color={v.status === 'flagged' ? '#B25E09' : v.status === 'critical' ? 'var(--danger-icon)' : '#3C3833'}
                  />
                ) : v.meta != null ? (
                  <span>{v.meta}</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Suppress unused import warning — icons used inline below
   ============================================================ */
void Plus; void ClipboardCheck; void ArrowLeftRight; void LogOut;
