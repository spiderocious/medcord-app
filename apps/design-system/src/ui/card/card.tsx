import { type ReactNode } from 'react';
import { AlertTriangle, Clock, Wifi, WifiOff } from '@icons';

/* ============================================================
   Card components — patient summary, staff profile, equipment,
   and summary stat tiles.
   ============================================================ */

/* ---------------------------------------------------------- */
/* PatientCardCompact                                          */
/* ---------------------------------------------------------- */

export interface PatientCardCompactProps {
  readonly initials: string;
  readonly avatarBg?: string;
  readonly avatarColor?: string;
  readonly avatarBorder?: string;
  readonly name: string;
  readonly meta: string;
  readonly critical?: boolean;
  readonly statLabel?: string;
}

export function PatientCardCompact({
  initials, avatarBg = '#ECE3D6', avatarColor = '#5C4B30', avatarBorder = '#D4C4A6',
  name, meta, critical = false, statLabel,
}: PatientCardCompactProps) {
  return (
    <div className={[
      'relative bg-[var(--surface-raised)] border border-[var(--text-primary)]',
      'flex items-center gap-2.5 px-3.5 py-2.5 overflow-hidden',
      critical ? 'pl-5' : '',
    ].join(' ')}>
      {critical && (
        <span className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--danger-icon)]" />
      )}
      <span
        className="w-7 h-7 rounded-full border flex items-center justify-center font-ui font-semibold text-[10px] flex-shrink-0"
        style={{ background: avatarBg, color: avatarColor, borderColor: avatarBorder }}
      >
        {initials}
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-ui text-[13px] font-semibold text-[var(--text-primary)] truncate">{name}</div>
        <div className="font-mono text-[10px] text-[var(--text-tertiary)] tracking-[0] mt-0.5">{meta}</div>
      </div>
      {statLabel !== null && (
        <span className="font-mono text-[10px] text-[var(--danger-icon)] tracking-[0.16em] uppercase flex-shrink-0">{statLabel}</span>
      )}
    </div>
  );
}

/* ---------------------------------------------------------- */
/* PatientCardDefault                                          */
/* ---------------------------------------------------------- */

export interface PatientCardMark {
  readonly type: 'stamp' | 'pill';
  readonly label: string;
  readonly variant?: 'warn' | 'muted' | 'default';
  readonly dot?: boolean;
}

export interface PatientCardDefaultProps {
  readonly initials: string;
  readonly name: string;
  readonly demo: string;
  readonly marks?: PatientCardMark[];
  readonly allergy?: string;
  readonly critical?: boolean;
}

export function PatientCardDefault({
  initials, name, demo, marks = [], allergy, critical = false,
}: PatientCardDefaultProps) {
  return (
    <div className={[
      'relative bg-[var(--surface-raised)] border border-[var(--text-primary)] overflow-hidden',
      critical ? 'pl-1' : '',
    ].join(' ')}>
      {critical && (
        <span className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--danger-icon)]" />
      )}
      <div className="grid gap-3 p-3.5 pb-3.5" style={{ gridTemplateColumns: '40px 1fr' }}>
        <span
          className="w-10 h-10 rounded-full flex items-center justify-center font-ui font-semibold text-[13px]"
          style={{ background: '#ECE3D6', color: '#5C4B30', border: '1px solid #D4C4A6' }}
        >
          {initials}
        </span>
        <div>
          <h3 className="m-0 font-serif text-[19px] font-medium tracking-[-0.012em] leading-[1.1] text-[var(--text-primary)]">
            {name}
          </h3>
          <div className="font-mono text-[10px] text-[var(--text-tertiary)] tracking-[0] mt-1">{demo}</div>
          {marks.length > 0 && (
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {marks.map((m) => m.type === 'stamp' ? (
                <span key={m.label} className="inline-flex items-center px-[7px] py-0.5 font-mono text-[9px] font-semibold tracking-[0.18em] uppercase bg-[var(--text-primary)] text-[var(--neutral-0)] rounded-[1px]">
                  {m.label}
                </span>
              ) : (
                <span key={m.label} className={[
                  'inline-flex items-center gap-1 px-2 py-0.5 border rounded-full font-ui text-[11px]',
                  m.variant === 'warn'
                    ? 'text-[var(--warning-icon)] border-[var(--warning-border)] bg-[var(--warning-surface)]'
                    : m.variant === 'muted'
                    ? 'text-[var(--text-secondary)] border-[var(--border-default)] bg-[var(--surface-sunken)]'
                    : 'text-[var(--text-secondary)] border-[var(--border-default)]',
                ].join(' ')}>
                  {m.dot === true && (
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-85" />
                  )}
                  {m.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      {allergy !== null && (
        <div className="px-3.5 py-[7px] bg-[var(--danger-icon)] font-serif italic text-[12px] text-[var(--neutral-0)] leading-[1.45]">
          <span className="font-mono not-italic font-semibold tracking-[0.22em] text-[9px] mr-1">ALLERGY ·</span>
          {allergy}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------- */
/* PatientCardExpanded                                         */
/* ---------------------------------------------------------- */

export interface PatientVital {
  readonly label: string;
  readonly value: string;
  readonly mono?: boolean;
}

export interface PatientCardExpandedProps {
  readonly initials: string;
  readonly name: string;
  readonly nickname?: string;
  readonly demo: string;
  readonly ids: Array<{ label: string; value: string }>;
  readonly marks?: PatientCardMark[];
  readonly allergy?: string;
  readonly vitals?: PatientVital[];
  readonly critical?: boolean;
}

export function PatientCardExpanded({
  initials, name, nickname, demo, ids, marks = [], allergy, vitals = [], critical = false,
}: PatientCardExpandedProps) {
  return (
    <div className={[
      'relative bg-[var(--surface-raised)] border border-[var(--text-primary)] overflow-hidden',
      critical ? 'pl-1' : '',
    ].join(' ')}>
      {critical && (
        <span className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--danger-icon)]" />
      )}
      <div className="grid gap-4 p-[18px_20px]" style={{ gridTemplateColumns: '56px 1fr' }}>
        <span
          className="w-14 h-14 rounded-full flex items-center justify-center font-ui font-semibold text-[19px]"
          style={{ background: '#ECE3D6', color: '#5C4B30', border: '1px solid #D4C4A6' }}
        >
          {initials}
        </span>
        <div>
          <h3 className="m-0 font-serif text-[24px] font-medium tracking-[-0.018em] leading-[1.05] text-[var(--text-primary)]">
            {name}
            {nickname !== null && (
              <span className="text-[var(--text-tertiary)] italic font-normal"> &quot;{nickname}&quot;</span>
            )}
          </h3>
          <div className="font-mono text-[11px] text-[var(--text-tertiary)] tracking-[0] mt-1">{demo}</div>
          {ids.length > 0 && (
            <div className="flex gap-3 flex-wrap mt-1 font-mono text-[11px] text-[var(--text-tertiary)] tracking-[0]">
              {ids.map((id) => (
                <span key={id.label}>{id.label} <strong className="text-[var(--text-primary)] font-medium">{id.value}</strong></span>
              ))}
            </div>
          )}
          {marks.length > 0 && (
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {marks.map((m) => m.type === 'stamp' ? (
                <span key={m.label} className="inline-flex items-center px-[7px] py-0.5 font-mono text-[9px] font-semibold tracking-[0.18em] uppercase bg-[var(--text-primary)] text-[var(--neutral-0)] rounded-[1px]">
                  {m.label}
                </span>
              ) : (
                <span key={m.label} className={[
                  'inline-flex items-center gap-1 px-2 py-0.5 border rounded-full font-ui text-[11px]',
                  m.variant === 'muted'
                    ? 'text-[var(--text-secondary)] border-[var(--border-default)] bg-[var(--surface-sunken)]'
                    : 'text-[var(--text-secondary)] border-[var(--border-default)]',
                ].join(' ')}>
                  {m.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      {allergy !== null && (
        <div className="px-5 py-[9px] bg-[var(--danger-icon)] font-serif italic text-[13px] text-[var(--neutral-0)] leading-[1.45] flex items-center gap-2.5">
          <span className="font-mono not-italic font-semibold tracking-[0.22em] text-[10px] px-[7px] py-0.5 rounded-[1px] bg-black/30">ALLERGY</span>
          {allergy}
        </div>
      )}
      {vitals.length > 0 && (
        <div className="grid gap-3 p-[14px_20px] border-t border-[var(--border-default)]" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {vitals.map((v) => (
            <div key={v.label}>
              <div className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.16em] mb-0.5">{v.label}</div>
              <div className={['text-[13px] text-[var(--text-primary)]', v.mono === true ? 'font-mono tracking-[0]' : 'font-ui'].join(' ')}>{v.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------- */
/* StaffCard                                                   */
/* ---------------------------------------------------------- */

export interface StaffCardMetaRow {
  readonly label: string;
  readonly value: string;
  readonly variant?: 'default' | 'warn';
}

export interface StaffCardProps {
  readonly initials: string;
  readonly avatarBg?: string;
  readonly avatarColor?: string;
  readonly avatarBorder?: string;
  readonly role: string;
  readonly name: string;
  readonly credentials?: string;
  readonly department: string;
  readonly onShift?: boolean;
  readonly shiftLabel?: string;
  readonly meta?: StaffCardMetaRow[];
}

export function StaffCard({
  initials, avatarBg = '#DEE6D6', avatarColor = '#2F4226', avatarBorder = '#C4D2BC',
  role, name, credentials, department, onShift = false, shiftLabel = 'On shift',
  meta = [],
}: StaffCardProps) {
  return (
    <div className="bg-[var(--surface-raised)] border border-[var(--text-primary)] p-[18px_20px] grid gap-4" style={{ gridTemplateColumns: '56px 1fr' }}>
      <div className="relative w-14 h-14 rounded-[4px] flex items-center justify-center font-ui font-semibold text-[19px] flex-shrink-0"
        style={{ background: avatarBg, color: avatarColor, border: `1px solid ${avatarBorder}` }}
      >
        {initials}
        <span className="absolute -right-0.5 -bottom-0.5 font-mono text-[8px] font-semibold bg-[var(--text-primary)] text-[var(--neutral-0)] px-1 py-px rounded-[2px] tracking-[0.06em] leading-none">
          {role}
        </span>
        {onShift && (
          <span className="absolute -right-0.5 -top-0.5 w-2 h-2 rounded-full bg-[var(--records-600)] border-2 border-[var(--surface-raised)]" />
        )}
      </div>
      <div>
        <h3 className="m-0 font-serif text-[19px] font-medium tracking-[-0.012em] text-[var(--text-primary)]">
          {name}
          {credentials !== null && <span className="text-[var(--text-tertiary)] italic font-normal"> — {credentials}</span>}
        </h3>
        <div className="font-mono text-[11px] text-[var(--text-tertiary)] tracking-[0] mt-0.5">{department}</div>
        <span className={[
          'inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded-full text-[11px] font-medium border',
          onShift
            ? 'bg-[var(--records-50)] border-[var(--records-300)] text-[var(--records-800)]'
            : 'bg-[var(--surface-sunken)] border-[var(--border-default)] text-[var(--text-tertiary)]',
        ].join(' ')}>
          <span className={['w-1.5 h-1.5 rounded-full', onShift ? 'bg-[var(--records-600)]' : 'bg-[var(--text-tertiary)]'].join(' ')} />
          {shiftLabel}
        </span>
      </div>
      {meta.length > 0 && (
        <div className="col-span-2 mt-2.5 pt-3 border-t border-[var(--border-default)] grid gap-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {meta.map((row) => (
            <div key={row.label} className="flex gap-2.5 font-mono text-[11px] tracking-[0]">
              <span className="text-[var(--text-tertiary)] uppercase tracking-[0.16em] text-[10px] pt-px w-20 flex-shrink-0">{row.label}</span>
              <span className={row.variant === 'warn' ? 'text-[var(--warning-icon)]' : 'text-[var(--text-primary)]'}>{row.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------- */
/* EquipmentCard                                               */
/* ---------------------------------------------------------- */

export interface EquipmentCardProps {
  readonly icon: ReactNode;
  readonly name: string;
  readonly model?: string;
  readonly serialNumber: string;
  readonly status: 'in-use' | 'available' | 'out-of-service' | 'maintenance';
  readonly statusLabel?: string;
  readonly meta?: StaffCardMetaRow[];
  readonly alarm?: string;
}

const EQUIP_STATUS_STYLE: Record<EquipmentCardProps['status'], string> = {
  'in-use': 'bg-[var(--records-50)] border-[var(--records-300)] text-[var(--records-800)]',
  available: 'bg-[var(--surface-sunken)] border-[var(--border-default)] text-[var(--text-secondary)]',
  'out-of-service': 'bg-[var(--danger-surface)] border-[var(--danger-border)] text-[var(--danger-icon)]',
  maintenance: 'bg-[var(--warning-surface)] border-[var(--warning-border)] text-[var(--warning-icon)]',
};

export function EquipmentCard({
  icon, name, model, serialNumber, status, statusLabel, meta = [], alarm,
}: EquipmentCardProps) {
  const isCrit = status === 'out-of-service';
  return (
    <div className={[
      'relative bg-[var(--surface-raised)] border border-[var(--text-primary)]',
      'p-[18px_20px] grid gap-4 overflow-hidden',
      isCrit ? 'pl-5' : '',
    ].join(' ')} style={{ gridTemplateColumns: '56px 1fr' }}>
      {isCrit && (
        <span className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--danger-icon)]" />
      )}
      <div className="w-14 h-14 rounded-[4px] border border-[var(--text-primary)] bg-[var(--surface-sunken)] flex items-center justify-center text-[var(--text-primary)] flex-shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="m-0 font-serif text-[18px] font-medium tracking-[-0.012em] text-[var(--text-primary)]">
          {name}
          {model !== null && <span className="text-[var(--text-tertiary)] italic font-normal"> — {model}</span>}
        </h3>
        <div className="font-mono text-[11px] text-[var(--text-tertiary)] tracking-[0] mt-0.5">{serialNumber}</div>
        <span className={['inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded-full text-[11px] font-medium border', EQUIP_STATUS_STYLE[status]].join(' ')}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {statusLabel ?? status}
        </span>
      </div>
      {meta.length > 0 && (
        <div className="col-span-2 mt-2.5 pt-3 border-t border-[var(--border-default)] grid gap-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {meta.map((row) => (
            <div key={row.label} className="flex gap-2.5 font-mono text-[11px] tracking-[0]">
              <span className="text-[var(--text-tertiary)] uppercase tracking-[0.16em] text-[10px] pt-px w-24 flex-shrink-0">{row.label}</span>
              <span className={
                row.variant === 'warn'
                  ? 'text-[var(--warning-icon)]'
                  : isCrit
                  ? 'text-[var(--danger-icon)]'
                  : 'text-[var(--text-primary)]'
              }>{row.value}</span>
            </div>
          ))}
        </div>
      )}
      {alarm !== null && (
        <div className="col-span-2 mt-2.5 bg-[var(--danger-surface)] border border-[var(--danger-border)] text-[var(--danger-icon)] px-3 py-2 font-serif italic text-[13px] leading-[1.45] flex items-start gap-2">
          <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
          <span>{alarm}</span>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------- */
/* StatTile                                                    */
/* ---------------------------------------------------------- */

export interface StatTileProps {
  readonly label: string;
  readonly value: string | number;
  readonly unit?: string;
  readonly delta?: string;
  readonly deltaDirection?: 'up' | 'down' | 'neutral';
  readonly valueVariant?: 'default' | 'warn' | 'crit';
}

export function StatTile({ label, value, unit, delta, deltaDirection = 'neutral', valueVariant = 'default' }: StatTileProps) {
  return (
    <div className="bg-[var(--surface-raised)] border border-[var(--text-primary)] px-5 py-4">
      <div className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.18em]">{label}</div>
      <div className={[
        'font-serif text-[36px] font-medium leading-none tracking-[-0.022em] mt-2',
        valueVariant === 'warn' ? 'text-[var(--warning-icon)]' : valueVariant === 'crit' ? 'text-[var(--danger-icon)]' : 'text-[var(--text-primary)]',
      ].join(' ')}>
        {value}
        {unit !== null && <span className="font-ui text-[13px] text-[var(--text-tertiary)] ml-1 font-normal">{unit}</span>}
      </div>
      {delta !== null && (
        <div className={[
          'font-mono text-[11px] tracking-[0] mt-1.5',
          deltaDirection === 'up' ? 'text-[var(--warning-icon)]' : deltaDirection === 'down' ? 'text-[var(--records-700)]' : 'text-[var(--text-tertiary)]',
        ].join(' ')}>
          {delta}
        </div>
      )}
    </div>
  );
}

/* suppress unused import warning — icons used inline below */
void Clock; void Wifi; void WifiOff;
