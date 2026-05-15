import type { ReactNode } from 'react';

/* ============================================================
   PatientAvatar — round, paper-tinted, initials.
   Critical patient overrides border with arterial red ring.
   ============================================================ */

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface PatientAvatarProps {
  readonly initials: string;
  readonly size?: AvatarSize;
  readonly critical?: boolean;
  readonly badge?: number | string;
  readonly className?: string;
}

const PATIENT_SIZE: Record<AvatarSize, string> = {
  xs: 'w-[18px] h-[18px] text-[8px]',
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-[11px]',
  lg: 'w-12 h-12 text-[16px]',
  xl: 'w-20 h-20 text-[24px]',
};

export function PatientAvatar({ initials, size = 'md', critical = false, badge, className = '' }: PatientAvatarProps) {
  return (
    <span className={`relative inline-flex flex-shrink-0 ${className}`}>
      <span
        className={[
          'inline-flex items-center justify-center rounded-full font-ui font-semibold tracking-[0.02em] flex-shrink-0',
          'bg-[#ECE3D6] text-[#5C4B30]',
          critical
            ? 'border-2 border-[var(--danger-icon)] shadow-[0_0_0_2px_var(--danger-icon)]'
            : 'border border-[#D4C4A6]',
          PATIENT_SIZE[size],
        ].join(' ')}
      >
        {initials}
      </span>
      {badge !== null && (
        <NotificationBadge count={badge} />
      )}
    </span>
  );
}

/* ============================================================
   StaffAvatar — square with 4px radius. The badge.
   Role tag at bottom-right. On-shift dot at top-right.
   ============================================================ */

export type StaffRole = 'md' | 'rn' | 'tech' | 'pharm' | 'admin' | 'other';

const STAFF_ROLE_STYLE: Record<StaffRole, string> = {
  md: 'bg-[#DEE6D6] text-[#2F4226] border-[#C4D2BC]',
  rn: 'bg-[#DDE3D4] text-[#495939] border-[#C2CCB4]',
  tech: 'bg-[#ECE3D6] text-[#5C4B30] border-[#D4C4A6]',
  pharm: 'bg-[#DEDAE8] text-[#3A3349] border-[#BCB7CB]',
  admin: 'bg-[var(--surface-sunken)] text-[var(--text-secondary)] border-[var(--border-default)]',
  other: 'bg-[var(--surface-sunken)] text-[var(--text-tertiary)] border-[var(--border-default)]',
};

const STAFF_ROLE_LABEL: Record<StaffRole, string> = {
  md: 'MD',
  rn: 'RN',
  tech: 'TC',
  pharm: 'RX',
  admin: 'AD',
  other: '',
};

export interface StaffAvatarProps {
  readonly initials: string;
  readonly size?: Exclude<AvatarSize, 'xs'>;
  readonly role?: StaffRole;
  readonly onShift?: boolean;
  readonly badge?: number | string;
  readonly className?: string;
}

const STAFF_SIZE: Record<Exclude<AvatarSize, 'xs'>, string> = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-[11px]',
  lg: 'w-12 h-12 text-[16px]',
  xl: 'w-20 h-20 text-[24px]',
};

export function StaffAvatar({ initials, size = 'md', role = 'other', onShift = false, badge, className = '' }: StaffAvatarProps) {
  const roleLabel = STAFF_ROLE_LABEL[role];
  return (
    <span className={`relative inline-flex flex-shrink-0 ${className}`}>
      <span
        className={[
          'inline-flex items-center justify-center rounded-[4px] font-ui font-semibold tracking-[0.02em] border flex-shrink-0 relative',
          STAFF_ROLE_STYLE[role],
          STAFF_SIZE[size],
        ].join(' ')}
      >
        {initials}
        {roleLabel && (
          <span className="absolute -right-[3px] -bottom-[3px] font-mono text-[8px] font-semibold bg-[var(--text-primary)] text-[var(--neutral-0)] px-[3px] py-[1px] rounded-[2px] leading-none tracking-[0.06em]">
            {roleLabel}
          </span>
        )}
      </span>
      {onShift && (
        <span className="absolute -top-[2px] -right-[2px] w-2 h-2 rounded-full bg-[var(--records-600)] border-2 border-[var(--surface-base)]" />
      )}
      {badge !== null && (
        <NotificationBadge count={badge} />
      )}
    </span>
  );
}

/* ============================================================
   AvatarStack — overlapping avatars with overflow count.
   ============================================================ */

export interface AvatarStackProps {
  readonly children: ReactNode;
  readonly overflow?: number;
  readonly className?: string;
}

export function AvatarStack({ children, overflow, className = '' }: AvatarStackProps) {
  return (
    <span className={`inline-flex ${className}`}>
      <span className="inline-flex [&>*+*]:-ml-2.5 [&>*]:shadow-[0_0_0_2px_var(--surface-base)]">
        {children}
      </span>
      {overflow !== null && overflow > 0 && (
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[var(--surface-base)] text-[var(--text-tertiary)] font-mono text-[11px] tracking-[0] border border-[var(--border-default)] shadow-[0_0_0_2px_var(--surface-base)] -ml-2.5">
          +{overflow}
        </span>
      )}
    </span>
  );
}

/* ============================================================
   NotificationBadge — red number on any anchor element.
   ============================================================ */

export interface NotificationBadgeProps {
  readonly count: number | string;
  readonly variant?: 'danger' | 'ink';
  readonly className?: string;
}

export function NotificationBadge({ count, variant = 'danger', className = '' }: NotificationBadgeProps) {
  const display = typeof count === 'number' && count > 99 ? '99+' : count;
  return (
    <span
      className={[
        'absolute -top-1 -right-1.5 min-w-[14px] h-[14px] px-[3px]',
        'flex items-center justify-center rounded-full border-2 border-[var(--surface-base)]',
        'font-mono text-[9px] font-semibold leading-none tracking-[0]',
        variant === 'danger'
          ? 'bg-[var(--danger-icon)] text-[var(--neutral-0)]'
          : 'bg-[var(--text-primary)] text-[var(--neutral-0)]',
        className,
      ].join(' ')}
    >
      {display}
    </span>
  );
}

/* ============================================================
   Pill — hairline outline, never coloured fills except when
   carrying real clinical state.
   ============================================================ */

export type PillVariant = 'default' | 'ok' | 'warn' | 'crit' | 'low' | 'ink' | 'outline';

export interface PillProps {
  readonly children: ReactNode;
  readonly variant?: PillVariant;
  readonly dot?: boolean;
  readonly className?: string;
}

const PILL_VARIANT: Record<PillVariant, string> = {
  default: 'border-[var(--text-tertiary)] bg-transparent text-[var(--text-secondary)]',
  ok: 'border-[var(--records-200)] bg-[var(--records-50)] text-[var(--records-800)]',
  warn: 'border-[var(--warning-icon)] bg-[var(--warning-bg)] text-[var(--warning-icon)]',
  crit: 'border-[var(--danger-icon)] bg-[var(--danger-bg)] text-[var(--danger-icon)]',
  low: 'border-[var(--consult-600)] bg-[var(--consult-50)] text-[var(--consult-700)]',
  ink: 'border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--neutral-0)]',
  outline: 'border-[var(--text-primary)] bg-transparent text-[var(--text-primary)]',
};

export function Pill({ children, variant = 'default', dot = false, className = '' }: PillProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 h-[22px] px-2.5 rounded-full border',
        'font-ui text-[11px] font-medium tracking-[0.005em]',
        PILL_VARIANT[variant],
        className,
      ].join(' ')}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-85" />}
      {children}
    </span>
  );
}

/* ============================================================
   StampMark — inverted mono stamp for code status / NPO.
   ============================================================ */

export type StampVariant = 'default' | 'dnr' | 'cmo' | 'npo';

export interface StampMarkProps {
  readonly children: ReactNode;
  readonly variant?: StampVariant;
  readonly className?: string;
}

const STAMP_VARIANT: Record<StampVariant, string> = {
  default: 'bg-[var(--text-primary)] text-[var(--neutral-0)]',
  dnr: 'bg-[var(--text-primary)] text-[var(--neutral-0)] border border-[var(--danger-icon)] shadow-[inset_0_-2px_0_var(--danger-icon)]',
  cmo: 'bg-[var(--text-primary)] text-[#FCE5A6]',
  npo: 'bg-transparent text-[var(--text-primary)] border border-[var(--text-primary)]',
};

export function StampMark({ children, variant = 'default', className = '' }: StampMarkProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 h-[22px] px-2',
        'font-mono text-[10px] font-semibold uppercase tracking-[0.18em]',
        STAMP_VARIANT[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}

/* ============================================================
   IsoTape — isolation level stamp.
   ============================================================ */

export type IsoVariant = 'contact' | 'droplet' | 'airborne' | 'neutropenic';

export interface IsoTapeProps {
  readonly variant: IsoVariant;
  readonly children?: ReactNode;
  readonly className?: string;
}

const ISO_BG: Record<IsoVariant, string> = {
  contact: 'bg-[var(--warning-icon)]',
  droplet: 'bg-[var(--consult-600)]',
  airborne: 'bg-[var(--consult-600)]',
  neutropenic: 'bg-[var(--danger-icon)]',
};

const ISO_LABEL: Record<IsoVariant, string> = {
  contact: 'Contact',
  droplet: 'Droplet',
  airborne: 'Airborne',
  neutropenic: 'Neutropenic',
};

export function IsoTape({ variant, children, className = '' }: IsoTapeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-[1px]',
        'font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--neutral-0)]',
        ISO_BG[variant],
        className,
      ].join(' ')}
    >
      {children ?? ISO_LABEL[variant]}
    </span>
  );
}

/* ============================================================
   EsiPill — ESI acuity 1–5.
   ESI-1 is ink with critical underbar. Others step down.
   ============================================================ */

export type EsiLevel = 1 | 2 | 3 | 4 | 5;

const ESI_LABEL: Record<EsiLevel, string> = {
  1: 'Resuscitation',
  2: 'Emergent',
  3: 'Urgent',
  4: 'Less urgent',
  5: 'Non-urgent',
};

const ESI_STYLE: Record<EsiLevel, string> = {
  1: 'bg-[var(--text-primary)] text-[var(--neutral-0)] border-[var(--text-primary)] shadow-[inset_0_-3px_0_var(--danger-icon)]',
  2: 'bg-[var(--danger-bg)] text-[var(--danger-icon)] border-[var(--danger-icon)]',
  3: 'bg-[var(--warning-bg)] text-[var(--warning-icon)] border-[var(--warning-icon)]',
  4: 'bg-[var(--records-50)] text-[var(--records-800)] border-[var(--records-200)]',
  5: 'bg-[var(--surface-sunken)] text-[var(--text-secondary)] border-[var(--border-default)]',
};

export interface EsiPillProps {
  readonly level: EsiLevel;
  readonly className?: string;
}

export function EsiPill({ level, className = '' }: EsiPillProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-2 h-6 px-2.5 rounded-full border',
        'font-ui text-[11px] font-semibold tracking-[0.04em]',
        ESI_STYLE[level],
        className,
      ].join(' ')}
    >
      <span className="font-mono text-[13px] tracking-[0]">{level}</span>
      {ESI_LABEL[level]}
    </span>
  );
}

/* ============================================================
   AllergyBand — never dismissible.
   Ink + serif italic. ALLERGY mono stamp inside.
   ============================================================ */

export type AllergyBandSeverity = 'anaphylactic' | 'moderate' | 'advisory';

const ALLERGY_BG: Record<AllergyBandSeverity, string> = {
  anaphylactic: 'bg-[var(--danger-icon)]',
  moderate: 'bg-[var(--warning-icon)]',
  advisory: 'bg-[#8C6E1D]',
};

export interface AllergyBandProps {
  readonly children: ReactNode;
  readonly severity?: AllergyBandSeverity;
  readonly meta?: string;
  readonly className?: string;
}

export function AllergyBand({ children, severity = 'anaphylactic', meta, className = '' }: AllergyBandProps) {
  return (
    <div
      className={[
        'flex items-center gap-3.5 px-[18px] py-2 border border-[var(--text-primary)]',
        'font-serif italic text-[14px] text-[var(--neutral-0)]',
        ALLERGY_BG[severity],
        className,
      ].join(' ')}
    >
      <span className="font-mono not-italic text-[10px] font-semibold tracking-[0.22em] bg-black/30 px-[7px] py-[3px] rounded-[1px] flex-shrink-0">
        ALLERGY
      </span>
      <span className="flex-1">{children}</span>
      {meta !== null && (
        <span className="font-mono not-italic text-[11px] text-white/70 tracking-[0] flex-shrink-0">{meta}</span>
      )}
    </div>
  );
}
