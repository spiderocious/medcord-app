import type { ReactNode } from 'react';

/* ============================================================
   EMRBanner
   ============================================================ */

export interface EMRBannerRightRow {
  readonly label: string;
  readonly value: string;
}

export interface EMRBannerProps {
  readonly initials: string;
  readonly name: string;
  readonly nickname?: string;
  readonly demo: string;
  readonly ids: string;
  readonly codeStamp?: string;
  readonly rightRows?: readonly EMRBannerRightRow[];
  readonly allergyText?: string;
}

export function EMRBanner({
  initials,
  name,
  nickname,
  demo,
  ids,
  codeStamp = 'Full code',
  rightRows = [],
  allergyText,
}: EMRBannerProps) {
  return (
    <div
      className="relative"
      style={{
        background: 'var(--surface-raised)',
        borderTop: '2px solid var(--text-primary)',
        borderBottom: '1px solid var(--text-primary)',
      }}
    >
      {/* Code stamp — floats above the top border */}
      <span
        className="absolute font-mono text-[11px] font-semibold tracking-[0.18em] uppercase px-2.5 py-px border rounded-[1px]"
        style={{
          top: 0,
          left: 24,
          transform: 'translateY(-50%)',
          background: 'var(--surface-raised)',
          color: 'var(--text-primary)',
          borderColor: 'var(--text-primary)',
        }}
      >
        {codeStamp}
      </span>

      {/* Main row */}
      <div
        className="grid gap-[22px] px-6 py-5 pb-[14px]"
        style={{ gridTemplateColumns: '56px 1fr auto' }}
      >
        {/* Avatar */}
        <div
          className="w-14 h-14 rounded-[4px] flex items-center justify-center font-ui font-semibold text-[18px] flex-shrink-0"
          style={{
            background: '#ECE3D6',
            color: '#5C4B30',
            border: '1px solid #D4C4A6',
          }}
        >
          {initials}
        </div>

        {/* Identity */}
        <div>
          <h2
            className="m-0 font-serif text-[26px] font-medium tracking-[-0.022em]"
            style={{ color: 'var(--text-primary)' }}
          >
            {name}
            {nickname != null && (
              <span
                className="italic font-normal"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {' '}
                &quot;{nickname}&quot;
              </span>
            )}
          </h2>
          <div
            className="text-[13px] mt-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            {demo}
          </div>
          <div
            className="font-mono text-[11px] mt-1 tracking-[0]"
            style={{ color: 'var(--text-tertiary)' }}
            dangerouslySetInnerHTML={{ __html: ids }}
          />
        </div>

        {/* Right column */}
        {rightRows.length > 0 && (
          <div className="flex flex-col gap-[2px] text-right text-[12px]" style={{ color: 'var(--text-secondary)' }}>
            {rightRows.map((row) => (
              <div key={row.label}>
                <span
                  className="font-mono text-[10px] uppercase tracking-[0.16em] mr-2"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {row.label}
                </span>
                {row.value}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Allergy band */}
      {allergyText != null && (
        <div
          className="px-6 py-[8px] font-serif italic text-[13px] flex items-center gap-[14px] border-b-2"
          style={{
            background: 'var(--danger-icon)',
            color: '#fff',
            borderBottomColor: 'var(--text-primary)',
          }}
        >
          <span
            className="font-mono not-italic font-semibold text-[10px] tracking-[0.22em] px-2 py-[3px] rounded-[2px] flex-shrink-0"
            style={{ background: 'rgba(0,0,0,0.30)' }}
          >
            ALLERGY
          </span>
          {allergyText}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   EMRTab
   ============================================================ */

export interface EMRTabProps {
  readonly ordinal: string;
  readonly label: string;
  readonly count?: string;
  readonly active?: boolean;
  readonly alert?: boolean;
  readonly onClick?: () => void;
}

export function EMRTab({ ordinal, label, count, active = false, alert = false, onClick }: EMRTabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left grid gap-2 px-4 py-2 font-ui text-[13px] cursor-pointer border-0 bg-transparent transition-colors"
      style={{
        gridTemplateColumns: '22px 1fr auto',
        alignItems: 'baseline',
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        fontWeight: active ? 500 : 400,
        borderLeft: active ? '2px solid var(--text-primary)' : '2px solid transparent',
        background: active ? 'var(--surface-raised)' : 'transparent',
      }}
    >
      <span
        className="font-mono text-[10px] tracking-[0]"
        style={{ color: active ? 'var(--text-primary)' : 'var(--text-disabled)' }}
      >
        {ordinal}
      </span>
      <span>{label}</span>
      <span
        className="font-mono text-[10px] tracking-[0]"
        style={{
          color: alert
            ? 'var(--danger-icon)'
            : active
            ? 'var(--text-primary)'
            : 'var(--text-disabled)',
          fontWeight: alert ? 600 : undefined,
        }}
      >
        {count}
      </span>
    </button>
  );
}

/* ============================================================
   EMRSidebar
   ============================================================ */

export interface EMRSidebarSection {
  readonly label: string;
  readonly tabs: readonly EMRTabProps[];
}

export interface EMRSidebarProps {
  readonly sections: readonly EMRSidebarSection[];
  readonly activeTab: string;
  readonly onTabChange: (label: string) => void;
}

export function EMRSidebar({ sections, activeTab, onTabChange }: EMRSidebarProps) {
  return (
    <aside
      className="py-[18px]"
      style={{
        borderRight: '1px solid var(--text-primary)',
        background: 'var(--surface-sunken)',
      }}
    >
      {sections.map((section, si) => (
        <div key={section.label}>
          {si > 0 && (
            <div
              className="mx-4 my-[14px]"
              style={{ height: 1, background: 'var(--border-default)' }}
            />
          )}
          <div
            className="px-4 pb-[6px] font-mono text-[10px] uppercase tracking-[0.18em]"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {section.label}
          </div>
          {section.tabs.map((tab) => (
            <EMRTab
              key={tab.label}
              {...tab}
              active={activeTab === tab.label}
              onClick={() => onTabChange(tab.label)}
            />
          ))}
        </div>
      ))}
    </aside>
  );
}

/* ============================================================
   EMREntry
   ============================================================ */

export interface EMREntryProps {
  readonly title: ReactNode;
  readonly when?: ReactNode;
  readonly signed?: boolean;
  readonly children: ReactNode;
  readonly first?: boolean;
  readonly last?: boolean;
}

export function EMREntry({ title, when, signed = false, children, first = false, last = false }: EMREntryProps) {
  return (
    <article
      className="py-5"
      style={{
        paddingTop: first ? 0 : undefined,
        borderBottom: last ? 0 : '1px solid var(--border-default)',
      }}
    >
      <header className="flex items-baseline gap-3 mb-3">
        <h3
          className="m-0 flex-1 font-serif text-[20px] font-medium tracking-[-0.012em]"
          style={{ color: 'var(--text-primary)' }}
        >
          {title}
        </h3>
        {when != null && (
          <span className="font-mono text-[11px] tracking-[0]" style={{ color: 'var(--text-tertiary)' }}>
            {when}
            {signed && (
              <span className="font-medium ml-1" style={{ color: '#166534' }}>
                {' '}· signed
              </span>
            )}
          </span>
        )}
      </header>
      {children}
    </article>
  );
}

/* ============================================================
   ProblemList
   ============================================================ */

export interface Problem {
  readonly name: string;
  readonly icd: string;
  readonly since: string;
  readonly by: string;
}

export interface ProblemListProps {
  readonly problems: readonly Problem[];
}

export function ProblemList({ problems }: ProblemListProps) {
  return (
    <div className="flex flex-col">
      {problems.map((p, i) => (
        <div
          key={p.icd}
          className="grid gap-4 py-2 text-[13px]"
          style={{
            gridTemplateColumns: '1fr 80px 100px 70px',
            alignItems: 'baseline',
            borderBottom: i < problems.length - 1 ? '1px dashed var(--border-default)' : undefined,
          }}
        >
          <span style={{ color: 'var(--text-primary)' }}>{p.name}</span>
          <span className="font-mono text-[11px] tracking-[0]" style={{ color: 'var(--text-tertiary)' }}>{p.icd}</span>
          <span className="font-mono text-[11px] tracking-[0]" style={{ color: 'var(--text-tertiary)' }}>{p.since}</span>
          <span className="text-[12px] text-right" style={{ color: 'var(--text-tertiary)' }}>{p.by}</span>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   MedsList
   ============================================================ */

export interface Med {
  readonly name: string;
  readonly dose: string;
  readonly sig: string;
  readonly indication: string;
  readonly whenLines: readonly string[];
  readonly held?: boolean;
}

export interface MedsListProps {
  readonly meds: readonly Med[];
}

export function MedsList({ meds }: MedsListProps) {
  return (
    <div>
      {meds.map((med, i) => (
        <div
          key={med.name}
          className="grid py-[10px] gap-x-4"
          style={{
            gridTemplateColumns: '1fr auto',
            alignItems: 'baseline',
            borderBottom: i < meds.length - 1 ? '1px dashed var(--border-default)' : undefined,
          }}
        >
          <div>
            <span
              className="font-serif italic text-[16px] font-medium tracking-[-0.005em]"
              style={{ color: med.held ? 'var(--warning-icon)' : 'var(--text-primary)' }}
            >
              {med.name}
            </span>
            <span
              className="font-mono text-[13px] ml-1.5 tracking-[0]"
              style={{ color: 'var(--text-primary)' }}
            >
              {med.dose}
            </span>
            <div className="text-[13px] mt-[2px]" style={{ color: 'var(--text-secondary)' }}>{med.sig}</div>
            <div
              className="text-[12px] mt-[2px]"
              style={{ color: med.held ? 'var(--warning-icon)' : 'var(--text-tertiary)' }}
            >
              {med.indication}
            </div>
          </div>
          <div
            className="font-mono text-[11px] text-right tracking-[0] leading-[1.6]"
            style={{ color: med.held ? 'var(--warning-icon)' : 'var(--text-tertiary)' }}
          >
            {med.whenLines.map((line, li) => (
              <div
                key={li}
                style={line.startsWith('due') ? { color: '#166534', fontWeight: 500 } : undefined}
              >
                {line}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   LabsList
   ============================================================ */

export type LabFlag = 'normal' | 'h' | 'l' | 'crit';

export interface LabEntry {
  readonly name: ReactNode;
  readonly value: string;
  readonly unit: string;
  readonly range: string;
  readonly flag?: LabFlag;
}

export interface LabsListProps {
  readonly labs: readonly LabEntry[];
  readonly onAcknowledge?: () => void;
  readonly acknowledged?: boolean;
}

const VAL_COLOR: Record<LabFlag, string> = {
  normal: 'var(--text-primary)',
  h: 'var(--warning-icon)',
  l: '#3b82f6',
  crit: 'var(--danger-icon)',
};

const ROW_BG: Record<LabFlag, string | undefined> = {
  normal: undefined,
  h: undefined,
  l: undefined,
  crit: 'linear-gradient(to right, var(--danger-surface) 0%, transparent 65%)',
};

export function LabsList({ labs, onAcknowledge, acknowledged = false }: LabsListProps) {
  return (
    <div>
      <div className="flex flex-col">
        {labs.map((lab, i) => {
          const flag = lab.flag ?? 'normal';
          return (
            <div
              key={i}
              className="grid gap-[14px] py-3"
              style={{
                gridTemplateColumns: '1fr auto 110px 70px',
                alignItems: 'center',
                borderBottom: i < labs.length - 1 ? '1px solid var(--border-default)' : undefined,
                background: ROW_BG[flag],
              }}
            >
              <span className="font-ui text-[13px]" style={{ color: 'var(--text-primary)' }}>
                {lab.name}
              </span>
              <span
                className="font-mono font-medium text-[22px] tracking-[-0.015em] leading-none whitespace-nowrap"
                style={{ color: VAL_COLOR[flag], fontFeatureSettings: '"tnum" 1' }}
              >
                {lab.value}
                <span className="font-ui text-[11px] ml-1 font-medium" style={{ color: 'var(--text-tertiary)' }}>
                  {lab.unit}
                </span>
              </span>
              <span
                className="font-mono text-[11px] tracking-[0] text-right"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {lab.range}
              </span>
              <div className="flex justify-end">
                {flag === 'h' && (
                  <span
                    className="font-mono text-[10px] font-semibold px-1.5 py-[2px] rounded-[2px] tracking-[0.04em]"
                    style={{
                      color: 'var(--warning-icon)',
                      border: '1px solid var(--warning-icon)',
                      background: 'var(--warning-surface)',
                    }}
                  >
                    H
                  </span>
                )}
                {flag === 'l' && (
                  <span
                    className="font-mono text-[10px] font-semibold px-1.5 py-[2px] rounded-[2px] tracking-[0.04em]"
                    style={{
                      color: '#3b82f6',
                      border: '1px solid #93c5fd',
                      background: '#eff6ff',
                    }}
                  >
                    L
                  </span>
                )}
                {flag === 'crit' && (
                  <span
                    className="font-mono text-[10px] font-semibold px-1.5 py-[2px] rounded-[2px] tracking-[0.04em] text-white"
                    style={{ background: 'var(--danger-icon)', border: '1px solid var(--danger-icon)' }}
                  >
                    CRIT ↑↑
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {onAcknowledge != null && !acknowledged && (
        <div
          className="mt-3 px-[14px] py-3 flex items-center gap-[10px] font-ui text-[12px] rounded-[4px]"
          style={{ background: 'var(--text-primary)', color: 'var(--neutral-0)' }}
        >
          <span className="font-semibold">Critical value awaits acknowledgement.</span>
          <span style={{ color: 'rgba(244,239,230,0.65)' }}>
            Troponin 2.10 ng/mL · resulted 14:42 · auto-page sent
          </span>
          <button
            type="button"
            onClick={onAcknowledge}
            className="ml-auto font-ui text-[11px] font-semibold tracking-[0.04em] uppercase cursor-pointer text-white h-[26px] px-[10px] rounded-[3px] border-0"
            style={{ background: 'var(--danger-icon)' }}
          >
            Acknowledge
          </button>
        </div>
      )}
      {acknowledged && (
        <div
          className="mt-3 px-[14px] py-3 flex items-center gap-[10px] font-ui text-[12px] rounded-[4px]"
          style={{
            background: 'var(--records-50)',
            border: '1px solid var(--records-700)',
            color: 'var(--records-700)',
          }}
        >
          <span className="font-semibold">Critical value acknowledged.</span>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   ProgressNote
   ============================================================ */

export interface NoteBlock {
  readonly heading: string;
  readonly body: ReactNode;
}

export interface ProgressNoteProps {
  readonly blocks: readonly NoteBlock[];
  readonly signedBy: ReactNode;
  readonly signedStamp?: string;
}

export function ProgressNote({ blocks, signedBy, signedStamp }: ProgressNoteProps) {
  return (
    <div
      className="font-serif text-[16px] leading-[1.6] tracking-[-0.005em]"
      style={{ color: 'var(--text-primary)' }}
    >
      {blocks.map((blk) => (
        <div key={blk.heading} className="block mb-[14px]">
          <div
            className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] mb-1"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {blk.heading}
          </div>
          {blk.body}
        </div>
      ))}

      <div
        className="flex items-baseline gap-3 mt-[18px] pt-3 font-serif italic text-[16px]"
        style={{
          borderTop: '1px solid var(--border-default)',
          color: 'var(--text-secondary)',
        }}
      >
        Signed,
        <span className="not-italic font-medium" style={{ color: 'var(--text-primary)' }}>
          {signedBy}
        </span>
        {signedStamp != null && (
          <span
            className="ml-auto font-mono not-italic text-[10px] tracking-[0.18em] uppercase px-2 py-[3px] rounded-[1px]"
            style={{
              color: '#166534',
              border: '1px solid #86efac',
              background: '#f0fdf4',
            }}
          >
            {signedStamp}
          </span>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   AuditMargin
   ============================================================ */

export interface AuditEvent {
  readonly time: string;
  readonly body: ReactNode;
  readonly flagged?: boolean;
}

export interface WatchingEntry {
  readonly name: string;
  readonly role: string;
  readonly active?: boolean;
}

export interface ProvenanceEntry {
  readonly year: string;
  readonly body: string;
}

export interface AuditMarginProps {
  readonly events: readonly AuditEvent[];
  readonly watching: readonly WatchingEntry[];
  readonly provenance: readonly ProvenanceEntry[];
}

export function AuditMargin({ events, watching, provenance }: AuditMarginProps) {
  return (
    <aside
      className="px-[22px] py-7 font-mono text-[11px] tracking-[0]"
      style={{
        borderLeft: '1px solid var(--text-primary)',
        background: 'var(--surface-sunken)',
        color: 'var(--text-secondary)',
      }}
    >
      <h4
        className="m-0 mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em]"
        style={{ color: 'var(--text-tertiary)' }}
      >
        Margin · audit · access
      </h4>

      {events.map((ev, i) => (
        <div
          key={i}
          className="grid gap-2 py-[6px]"
          style={{
            gridTemplateColumns: '36px 1fr',
            borderBottom: i < events.length - 1 ? '1px dashed var(--border-default)' : undefined,
            background: ev.flagged ? 'var(--danger-surface)' : undefined,
            margin: ev.flagged ? '0 -22px' : undefined,
            padding: ev.flagged ? '6px 22px' : undefined,
          }}
        >
          <span style={{ color: 'var(--text-tertiary)' }}>{ev.time}</span>
          <span
            className="leading-[1.5]"
            style={{ color: ev.flagged ? 'var(--danger-icon)' : 'var(--text-primary)' }}
          >
            {ev.body}
          </span>
        </div>
      ))}

      <div
        className="mt-4 mb-3 pt-3"
        style={{ borderTop: '1px solid var(--border-default)' }}
      >
        <h4
          className="m-0 mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Watching this chart
        </h4>
        {watching.map((w) => (
          <div key={w.name} className="flex items-baseline gap-1.5 py-1" style={{ opacity: w.active === false ? 0.6 : 1 }}>
            <span
              className="w-[6px] h-[6px] rounded-full flex-shrink-0"
              style={{
                background: w.active !== false ? '#16a34a' : 'var(--text-disabled)',
                transform: 'translateY(-1px)',
              }}
            />
            <span style={{ color: w.active !== false ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
              {w.name}
            </span>
            <span style={{ color: 'var(--text-tertiary)' }}>— {w.role}</span>
          </div>
        ))}
      </div>

      <div
        className="mt-4 pt-3"
        style={{ borderTop: '1px solid var(--border-default)' }}
      >
        <h4
          className="m-0 mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Provenance
        </h4>
        {provenance.map((p, i) => (
          <div
            key={p.year}
            className="grid gap-2 py-[6px]"
            style={{
              gridTemplateColumns: '36px 1fr',
              borderBottom: i < provenance.length - 1 ? '1px dashed var(--border-default)' : undefined,
            }}
          >
            <span style={{ color: 'var(--text-tertiary)' }}>{p.year}</span>
            <span className="leading-[1.5]" style={{ color: 'var(--text-primary)' }}>{p.body}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}

/* ============================================================
   EMRChart — full binder layout
   ============================================================ */

export interface EMRChartProps {
  readonly banner: ReactNode;
  readonly sidebar: ReactNode;
  readonly record: ReactNode;
  readonly margin: ReactNode;
}

export function EMRChart({ banner, sidebar, record, margin }: EMRChartProps) {
  return (
    <div>
      {banner}
      <div
        className="min-h-[720px]"
        style={{
          display: 'grid',
          gridTemplateColumns: '156px 1fr 220px',
          border: '1px solid var(--text-primary)',
          borderTop: 0,
          background: 'var(--surface-base)',
        }}
      >
        {sidebar}
        <main className="px-9 py-7 min-w-0">{record}</main>
        {margin}
      </div>
    </div>
  );
}
