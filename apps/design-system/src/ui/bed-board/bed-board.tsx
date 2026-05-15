import type { ReactNode } from 'react';
import { Droplets, Hand, Wind, Shield } from '@icons';

/* ============================================================
   Bed Board — BedStatusStrip, BedCell, BedFloor, QueueItem,
   BedQueue, BedBoard
   ============================================================ */

/* ---------------------------------------------------------- */
/* Avatar                                                      */
/* ---------------------------------------------------------- */

interface AvatarProps {
  readonly initials: string;
  readonly variant?: 'crit' | 'adm' | 'dc' | 'default';
  readonly size?: 'sm' | 'md';
}

function Avatar({ initials, variant = 'default', size = 'md' }: AvatarProps) {
  const sizeClass = size === 'sm' ? 'w-[26px] h-[26px] text-[9px]' : 'w-[30px] h-[30px] text-[10px]';

  const colorClass = {
    crit: 'bg-[#F2DCD8] text-[#7F1D1D] border-[#E5BAB3]',
    adm: 'bg-[#ECE3D6] text-[#5C4B30] border-[#D4C4A6]',
    dc: 'bg-[#DCE6D6] text-[#2F4226] border-[#C4D2BC]',
    default: 'bg-[var(--surface-sunken)] text-[var(--text-primary)] border-[var(--border-default)]',
  }[variant];

  return (
    <span
      className={`${sizeClass} ${colorClass} inline-flex items-center justify-center rounded border font-semibold shrink-0`}
    >
      {initials}
    </span>
  );
}

/* ---------------------------------------------------------- */
/* BedStatusStrip                                              */
/* ---------------------------------------------------------- */

interface StripStaffMember {
  readonly initials: string;
  readonly role: 'md' | 'rn' | 'other';
}

interface BedStatusStripProps {
  readonly chargeNurse: string;
  readonly chargeNurseDetail: string;
  readonly staffCount: number;
  readonly staffAvatars: readonly StripStaffMember[];
  readonly staffExtra: number;
  readonly census: string;
  readonly censusDetail: string;
  readonly nextShift: string;
  readonly nextShiftDetail: string;
}

export function BedStatusStrip({
  chargeNurse,
  chargeNurseDetail,
  staffCount,
  staffAvatars,
  staffExtra,
  census,
  censusDetail,
  nextShift,
  nextShiftDetail,
}: BedStatusStripProps) {
  return (
    <div
      className="grid border border-[var(--text-primary)] mb-7 bg-[var(--surface-raised)]"
      style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}
    >
      <StripCell label="Charge nurse">
        <p className="font-serif text-[22px] font-medium tracking-[-0.012em] leading-[1.1] text-[var(--text-primary)]">
          {chargeNurse}
        </p>
        <p className="text-[12px] text-[var(--text-tertiary)] mt-1">{chargeNurseDetail}</p>
      </StripCell>

      <StripCell label="On the floor now">
        <p className="font-serif text-[22px] font-medium tracking-[-0.012em] leading-[1.1] text-[var(--text-primary)]">
          {staffCount} staff
        </p>
        <div className="flex mt-2">
          {staffAvatars.map((s, i) => (
            <span
              key={i}
              className={`${i === 0 ? 'ml-0' : '-ml-2'} w-[26px] h-[26px] inline-flex items-center justify-center rounded-full border-2 border-[var(--surface-raised)] bg-[var(--surface-sunken)] text-[var(--text-primary)] text-[9px] font-semibold`}
            >
              {s.initials}
            </span>
          ))}
          {staffExtra > 0 && (
            <span className="-ml-2 w-[26px] h-[26px] inline-flex items-center justify-center rounded-full border-2 border-[var(--surface-raised)] bg-[var(--surface-sunken)] text-[var(--text-secondary)] text-[9px] font-semibold">
              +{staffExtra}
            </span>
          )}
        </div>
      </StripCell>

      <StripCell label="Census">
        <p className="font-serif text-[22px] font-medium tracking-[-0.012em] leading-[1.1] text-[var(--text-primary)]">
          {census}
        </p>
        <p className="text-[12px] text-[var(--text-tertiary)] mt-1">{censusDetail}</p>
      </StripCell>

      <StripCell label="Next shift change" isLast>
        <p className="font-serif text-[22px] font-medium tracking-[-0.012em] leading-[1.1] text-[var(--text-primary)]">
          {nextShift}
        </p>
        <p className="text-[12px] text-[var(--text-tertiary)] mt-1">{nextShiftDetail}</p>
      </StripCell>
    </div>
  );
}

interface StripCellProps {
  readonly label: string;
  readonly children: ReactNode;
  readonly isLast?: boolean;
}

function StripCell({ label, children, isLast = false }: StripCellProps) {
  return (
    <div className={`px-5 py-4 ${isLast ? '' : 'border-r border-[var(--border-default)]'}`}>
      <p className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.18em] mb-1.5">{label}</p>
      {children}
    </div>
  );
}

/* ---------------------------------------------------------- */
/* BedCell                                                     */
/* ---------------------------------------------------------- */

export type BedStatus = 'normal' | 'crit' | 'adm' | 'dc' | 'empty' | 'clean' | 'offline';
export type IsolationVariant = 'droplet' | 'contact' | 'airborne' | 'neutro';

export interface BedCellProps {
  readonly bedNumber: string;
  readonly status: BedStatus;
  readonly patientInitials?: string;
  readonly patientName?: string;
  readonly patientDemo?: string;
  readonly acuity: string;
  readonly nextAction?: string;
  readonly isolation?: IsolationVariant;
  readonly isRoomEnd?: boolean;
  readonly isLastRow?: boolean;
  readonly isLastCol?: boolean;
}

export function BedCell({
  bedNumber,
  status,
  patientInitials,
  patientName,
  patientDemo,
  acuity,
  nextAction,
  isolation,
  isRoomEnd = false,
  isLastRow = false,
  isLastCol = false,
}: BedCellProps) {
  const isOccupied = status === 'normal' || status === 'crit' || status === 'adm' || status === 'dc';

  const borderRight = isLastCol
    ? 'border-r-0'
    : isRoomEnd
      ? 'border-r border-r-[var(--text-primary)]'
      : 'border-r border-r-[var(--border-default)]';

  const borderBottom = isLastRow ? 'border-b-0' : 'border-b border-b-[var(--border-default)]';

  const bgClass = status === 'empty'
    ? 'bg-[var(--surface-sunken)]'
    : status === 'offline'
      ? ''
      : 'bg-[var(--surface-raised)]';

  const offlineStyle = status === 'offline'
    ? {
        backgroundImage: 'repeating-linear-gradient(135deg, var(--surface-sunken) 0 8px, var(--surface-base) 8px 16px)',
      }
    : {};

  const acuityColor = {
    crit: 'text-[var(--danger-icon)]',
    dc: 'text-[#2F6B1F]',
    clean: 'text-[var(--warning-icon)]',
    empty: 'text-[var(--text-tertiary)]',
    offline: 'text-[var(--text-disabled)]',
    normal: 'text-[var(--text-primary)]',
    adm: 'text-[var(--text-primary)]',
  }[status];

  const acuityStyle =
    status === 'empty' || status === 'clean' || status === 'offline'
      ? 'italic font-normal'
      : 'font-medium';

  const acuityDecoration = status === 'offline' ? 'line-through decoration-[var(--text-tertiary)] decoration-[1px]' : '';

  const dotColor = {
    crit: 'bg-[var(--danger-icon)]',
    dc: 'bg-[#2F6B1F]',
    clean: 'bg-[var(--warning-icon)]',
    normal: 'bg-[var(--text-tertiary)]',
    adm: 'bg-[var(--text-tertiary)]',
    empty: 'bg-[var(--text-disabled)]',
    offline: 'bg-[var(--text-disabled)]',
  }[status];

  const nextActionColor = {
    crit: 'text-[var(--text-secondary)]',
    dc: 'text-[var(--text-secondary)]',
    clean: 'text-[var(--warning-icon)]',
    normal: 'text-[var(--text-secondary)]',
    adm: 'text-[var(--text-secondary)]',
    empty: 'text-[var(--text-tertiary)]',
    offline: 'text-[var(--text-disabled)] italic',
  }[status];

  return (
    <div
      className={`relative flex flex-col gap-2 px-[14px] py-[14px] pl-4 min-h-[132px] ${bgClass} ${borderRight} ${borderBottom}`}
      style={offlineStyle}
    >
      {status === 'crit' && (
        <span className="absolute top-0 left-0 w-1 h-full bg-[var(--danger-icon)]" />
      )}

      {isolation != null && <IsolationBadge variant={isolation} />}

      <span className="absolute top-2.5 right-3 font-mono text-[10px] text-[var(--text-tertiary)] tracking-[0.16em] uppercase">
        {bedNumber}
      </span>

      {isOccupied && patientName != null && (
        <div className="flex items-center gap-2.5 mt-0.5">
          <Avatar
            initials={patientInitials ?? '??'}
            variant={status === 'crit' ? 'crit' : status === 'adm' ? 'adm' : status === 'dc' ? 'dc' : 'default'}
          />
          <div>
            <p className="text-[13px] font-semibold text-[var(--text-primary)] tracking-[0.005em] leading-[1.15]">
              {patientName}
            </p>
            {patientDemo != null && (
              <p className="font-mono text-[10px] text-[var(--text-tertiary)] mt-px">{patientDemo}</p>
            )}
          </div>
        </div>
      )}

      <p
        className={`font-serif text-[22px] leading-none tracking-[-0.018em] mt-auto ${acuityColor} ${acuityStyle} ${acuityDecoration}`}
      >
        {acuity}
      </p>

      {nextAction != null && (
        <div className={`inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.005em] ${nextActionColor}`}>
          {isOccupied && <span className={`w-[5px] h-[5px] rounded-full shrink-0 ${dotColor}`} />}
          {nextAction}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------- */
/* IsolationBadge                                              */
/* ---------------------------------------------------------- */

interface IsolationBadgeProps {
  readonly variant: IsolationVariant;
}

function IsolationBadge({ variant }: IsolationBadgeProps) {
  const label = {
    droplet: 'Droplet',
    contact: 'Contact',
    airborne: 'Airborne',
    neutro: 'Neutro',
  }[variant];

  const colorClass = {
    droplet: 'bg-[var(--records-700)]',
    contact: 'bg-[var(--warning-icon)]',
    airborne: 'bg-[var(--records-700)]',
    neutro: 'bg-[var(--danger-icon)]',
  }[variant];

  const Icon = {
    droplet: Droplets,
    contact: Hand,
    airborne: Wind,
    neutro: Shield,
  }[variant];

  return (
    <span
      className={`absolute top-0 left-0 ${colorClass} text-[var(--neutral-0)] font-mono text-[9px] font-semibold tracking-[0.16em] uppercase px-2 py-0.5 rounded-br flex items-center gap-1`}
    >
      <Icon size={9} strokeWidth={2.5} />
      {label}
    </span>
  );
}

/* ---------------------------------------------------------- */
/* BedFloor                                                    */
/* ---------------------------------------------------------- */

export interface BedFloorProps {
  readonly beds: readonly BedCellProps[];
}

export function BedFloor({ beds }: BedFloorProps) {
  return (
    <div
      className="grid border border-[var(--text-primary)] bg-[var(--surface-raised)] overflow-x-auto"
      style={{ gridTemplateColumns: 'repeat(6, minmax(160px, 1fr))' }}
    >
      {beds.map((bed) => (
        <BedCell key={bed.bedNumber} {...bed} />
      ))}
    </div>
  );
}

/* ---------------------------------------------------------- */
/* QueueItem                                                   */
/* ---------------------------------------------------------- */

export interface QueueItemProps {
  readonly name: string;
  readonly age: string;
  readonly when: string;
  readonly reason?: string;
  readonly meta?: string;
  readonly urgent?: boolean;
  readonly isLast?: boolean;
}

export function QueueItem({ name, age, when, reason, meta, urgent = false, isLast = false }: QueueItemProps) {
  return (
    <div className={`py-2.5 ${isLast ? '' : 'border-b border-dashed border-[var(--border-default)]'}`}>
      <div className="flex items-baseline gap-2">
        <span
          className={`text-[13px] font-semibold text-[var(--text-primary)] ${urgent ? 'underline underline-offset-[2px] decoration-[var(--danger-icon)] decoration-[2px]' : ''}`}
        >
          {name}
        </span>
        <span className="font-mono text-[11px] text-[var(--text-tertiary)]">{age}</span>
        <span className="ml-auto font-mono text-[11px] text-[var(--text-tertiary)] whitespace-nowrap">{when}</span>
      </div>
      {reason != null && (
        <p className="font-serif italic text-[13px] text-[var(--text-secondary)] mt-1 tracking-[-0.005em]">
          &ldquo;{reason}&rdquo;
        </p>
      )}
      {meta != null && (
        <p className="text-[11px] text-[var(--text-tertiary)] mt-1">{meta}</p>
      )}
    </div>
  );
}

/* ---------------------------------------------------------- */
/* BedQueue                                                    */
/* ---------------------------------------------------------- */

export interface BedQueueCountsProps {
  readonly census: number;
  readonly open: number;
  readonly avgLOS: string;
  readonly censusDelta?: string;
  readonly openDetail?: string;
  readonly losDelta?: string;
}

export interface BedQueueProps {
  readonly incoming: readonly QueueItemProps[];
  readonly outgoing: readonly QueueItemProps[];
  readonly counts: BedQueueCountsProps;
}

export function BedQueue({ incoming, outgoing, counts }: BedQueueProps) {
  return (
    <aside className="border border-[var(--text-primary)] bg-[var(--surface-raised)]">
      <div className="px-4 py-3.5 border-b border-[var(--text-primary)]">
        <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)] flex items-baseline gap-2">
          Incoming · admits{' '}
          <span className="text-[var(--text-primary)]">{incoming.length}</span>
        </h3>
        <div className="mt-2">
          {incoming.map((item, i) => (
            <QueueItem key={i} {...item} isLast={i === incoming.length - 1} />
          ))}
        </div>
      </div>

      <div className="px-4 py-3.5 border-b border-[var(--text-primary)]">
        <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)] flex items-baseline gap-2">
          Outgoing · discharges{' '}
          <span className="text-[var(--text-primary)]">{outgoing.length}</span>
        </h3>
        <div className="mt-2">
          {outgoing.map((item, i) => (
            <QueueItem key={i} {...item} isLast={i === outgoing.length - 1} />
          ))}
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        <CountCell
          value={String(counts.census)}
          label="Census"
          delta={counts.censusDelta}
          deltaVariant="up"
        />
        <CountCell
          value={String(counts.open)}
          label="Open"
          delta={counts.openDetail}
        />
        <CountCell
          value={counts.avgLOS}
          label="Avg LOS"
          delta={counts.losDelta}
          deltaVariant="down"
          isLast
        />
      </div>
    </aside>
  );
}

interface CountCellProps {
  readonly value: string;
  readonly label: string;
  readonly delta?: string;
  readonly deltaVariant?: 'up' | 'down' | 'neutral';
  readonly isLast?: boolean;
}

function CountCell({ value, label, delta, deltaVariant = 'neutral', isLast = false }: CountCellProps) {
  const deltaColor = {
    up: 'text-[var(--warning-icon)]',
    down: 'text-[#2F6B1F]',
    neutral: 'text-[var(--text-tertiary)]',
  }[deltaVariant];

  return (
    <div className={`px-3.5 py-3 border-t border-[var(--border-default)] ${isLast ? '' : 'border-r border-r-[var(--border-default)]'}`}>
      <p
        className="font-mono text-2xl font-medium leading-none tracking-[-0.02em]"
        style={{ fontFeatureSettings: '"tnum" 1' }}
      >
        {value}
      </p>
      <p className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.16em] mt-1.5">{label}</p>
      {delta != null && (
        <p className={`font-mono text-[11px] mt-1 ${deltaColor}`}>{delta}</p>
      )}
    </div>
  );
}

/* ---------------------------------------------------------- */
/* BedBoard                                                    */
/* ---------------------------------------------------------- */

export interface BedBoardProps {
  readonly strip: BedStatusStripProps;
  readonly floor: BedFloorProps;
  readonly queue: BedQueueProps;
}

export function BedBoard({ strip, floor, queue }: BedBoardProps) {
  return (
    <div>
      <BedStatusStrip {...strip} />
      <div className="grid gap-6 items-start grid-cols-1 lg:grid-cols-[1fr_280px]">
        <BedFloor {...floor} />
        <BedQueue {...queue} />
      </div>
    </div>
  );
}
