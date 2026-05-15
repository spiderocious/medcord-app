import { Section, ComponentRow } from '@features/shell/parts/preview-canvas';
import {
  PatientAvatar,
  StaffAvatar,
  AvatarStack,
  NotificationBadge,
  Pill,
  StampMark,
  IsoTape,
  EsiPill,
  AllergyBand,
} from '@ui/avatar-pill';
import type { StaffRole } from '@ui/avatar-pill';
import { Bell, Menu } from '@icons';

const STAFF: Array<{ initials: string; role: StaffRole; label: string; onShift?: boolean }> = [
  { initials: 'RP', role: 'md', label: 'MD', onShift: true },
  { initials: 'AW', role: 'rn', label: 'RN', onShift: true },
  { initials: 'TJ', role: 'tech', label: 'Tech' },
  { initials: 'SH', role: 'pharm', label: 'Pharm' },
  { initials: 'MK', role: 'admin', label: 'Admin' },
  { initials: 'HJ', role: 'other', label: 'off-shift' },
];

const WORKFLOW_STATUSES: Array<{ label: string; desc: string; variant: 'default' | 'ok' | 'warn' | 'crit' | 'ink' | 'outline' }> = [
  { label: 'Scheduled',      desc: '"on the books, not yet here"',                    variant: 'outline' },
  { label: 'Checked in',     desc: '"arrived, before triage"',                        variant: 'ok' },
  { label: 'In triage',      desc: '"being assessed at the desk"',                    variant: 'warn' },
  { label: 'In room',        desc: '"placed, awaiting provider"',                     variant: 'outline' },
  { label: 'With provider',  desc: '"being seen now"',                                variant: 'ink' },
  { label: 'Awaiting labs',  desc: '"work pending in the LIS"',                       variant: 'warn' },
  { label: 'Awaiting DC',    desc: '"medically ready, paperwork in flight"',          variant: 'outline' },
  { label: 'Admitted',       desc: '"on a bed, on the floor"',                        variant: 'ok' },
  { label: 'Discharged',     desc: '"left the building"',                             variant: 'default' },
  { label: 'Transferred',    desc: '"moved to another unit or hospital"',             variant: 'outline' },
  { label: 'No-show',        desc: '"didn\'t arrive"',                                variant: 'crit' },
  { label: 'Cancelled',      desc: '"called off, before arrival"',                    variant: 'crit' },
];

export function AvatarsPillsScreen() {
  return (
    <div>
      {/* Patient avatars */}
      <Section
        title="Patient — round."
        description="Round, paper-tinted. Initials only. The critical-patient ring overrides the regular border with arterial red."
      >
        <ComponentRow>
          {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
            <PatientAvatar key={size} initials="OA" size={size} />
          ))}
          <span className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.16em] ml-8">
            xs · sm · md · lg · xl
          </span>
        </ComponentRow>
        <ComponentRow label="States">
          <PatientAvatar initials="OA" size="md" />
          <PatientAvatar initials="SH" size="md" critical />
          <span className="font-mono text-[11px] text-[var(--text-tertiary)] tracking-[0]">regular · critical-ring</span>
        </ComponentRow>
      </Section>

      {/* Staff avatars */}
      <Section
        title="Staff — square. The badge."
        description={'Squared with a tight 4-px radius. A small mono tag at the bottom-right names the role; an ink-green dot at the top-right marks "on shift."'}
      >
        <ComponentRow>
          {STAFF.map((s) => (
            <StaffAvatar key={s.initials} initials={s.initials} role={s.role} onShift={s.onShift} size="md" />
          ))}
          <span className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.16em] ml-8">
            MD · RN · Tech · Pharm · Admin · off-shift
          </span>
        </ComponentRow>

        <ComponentRow label="Stack with overflow">
          <AvatarStack overflow={8}>
            <StaffAvatar initials="RP" role="md" />
            <StaffAvatar initials="AW" role="rn" />
            <StaffAvatar initials="TJ" role="tech" />
            <StaffAvatar initials="SH" role="pharm" />
          </AvatarStack>
          <span className="font-mono text-[11px] text-[var(--text-tertiary)] tracking-[0] ml-6">
            team-of-twelve · stack with overflow
          </span>
        </ComponentRow>
      </Section>

      {/* Pills — workflow status */}
      <Section
        title="Workflow status — the full taxonomy."
        description={'Twelve workflow states, each with its own pill. Colour is reserved: green for “good,” amber for “waiting,” red for “wrong,” ink for “ended.”'}
      >
        <div className="grid border border-[var(--text-primary)] bg-[var(--surface-raised)]" style={{ gridTemplateColumns: '200px 1fr 120px' }}>
          {WORKFLOW_STATUSES.map((s, i) => {
            const isLast = i >= WORKFLOW_STATUSES.length - 3;
            const rowBorder = isLast ? '' : 'border-b border-dashed border-[var(--border-default)]';
            return (
              <>
                <div key={`name-${i}`} className={`flex items-center px-4 py-3 text-[13px] text-[var(--text-primary)] border-r border-[var(--border-default)] ${rowBorder}`}>
                  {s.label}
                </div>
                <div key={`desc-${i}`} className={`flex items-center px-4 py-3 font-serif italic text-[13px] text-[var(--text-tertiary)] border-r border-[var(--border-default)] ${rowBorder}`}>
                  {s.desc}
                </div>
                <div key={`pill-${i}`} className={`flex items-center justify-end px-4 py-3 ${rowBorder}`}>
                  <Pill variant={s.variant} dot>{s.label}</Pill>
                </div>
              </>
            );
          })}
        </div>
      </Section>

      {/* ESI acuity */}
      <Section
        title="Acuity — ESI 1 through 5."
        description="Five levels, mono numerals. ESI-1 is ink with a critical underbar; the others step down into amber, green, paper."
      >
        <ComponentRow>
          {([1, 2, 3, 4, 5] as const).map((level) => (
            <EsiPill key={level} level={level} />
          ))}
        </ComponentRow>
      </Section>

      {/* Stamps */}
      <Section
        title="Code status, isolation, risk — stamped marks."
        description="These are not pills; they are stamps. Mono caps with generous tracking, often inverted. The kind of mark you'd find pressed onto a chart cover."
      >
        <div className="flex flex-col gap-4">
          <ComponentRow label="Code status">
            <StampMark>FULL CODE</StampMark>
            <StampMark variant="dnr">DNR</StampMark>
            <StampMark variant="dnr">DNR · DNI</StampMark>
            <StampMark variant="cmo">CMO</StampMark>
            <StampMark variant="npo">NPO</StampMark>
          </ComponentRow>

          <ComponentRow label="Isolation">
            <IsoTape variant="contact" />
            <IsoTape variant="droplet" />
            <IsoTape variant="airborne" />
            <IsoTape variant="neutropenic" />
          </ComponentRow>

          <ComponentRow label="Risk">
            <Pill variant="warn">Fall risk</Pill>
            <Pill variant="crit">Aspiration</Pill>
            <Pill dot>Seizure precautions</Pill>
            <Pill variant="crit">Bleeding</Pill>
            <Pill variant="crit">Sepsis bundle</Pill>
          </ComponentRow>
        </div>
      </Section>

      {/* Allergy band */}
      <Section
        title="Allergy band — never dismissible."
        description={'A red mark across the chart, set in serif italic. The "ALLERGY" label is a mono stamp inside it. Different shades for advisory, precaution, anaphylactic.'}
      >
        <div className="flex flex-col gap-2">
          <AllergyBand severity="anaphylactic" meta="documented Apr 2018 · R. Patel MD">
            Penicillin causes anaphylaxis. Sulfa drugs cause rash.
          </AllergyBand>
          <AllergyBand severity="moderate" meta="moderate · Mar 2022">
            Latex causes contact dermatitis. Use non-latex gloves and tape.
          </AllergyBand>
          <AllergyBand severity="advisory" meta="advisory · Feb 2024">
            Adhesive tape — mild reaction documented previously.
          </AllergyBand>
        </div>
      </Section>

      {/* Notification badges */}
      <Section
        title="Badges — small numbers on small things."
        description={'A red mark with a small mono numeral. Two-digit max; "99+" beyond that. Always paper-bordered so it can sit on any background.'}
      >
        <div className="flex gap-9 flex-wrap items-center">
          <span className="relative inline-flex">
            <StaffAvatar initials="RP" role="md" />
            <NotificationBadge count={3} />
          </span>
          <span className="relative inline-flex">
            <PatientAvatar initials="OA" size="md" />
            <NotificationBadge count={12} />
          </span>
          <span className="relative inline-flex">
            <span className="flex items-center justify-center w-8 h-8 border border-[var(--text-primary)] rounded-sm bg-[var(--surface-raised)] text-[var(--text-primary)] font-mono text-[14px]">
              <Menu size={14} />
            </span>
            <NotificationBadge count={100} />
          </span>
          <span className="relative inline-flex">
            <span className="flex items-center justify-center w-8 h-8 border border-[var(--text-primary)] rounded-sm bg-[var(--surface-raised)] text-[var(--text-primary)] font-serif text-[18px]">
              <Bell size={14} />
            </span>
            <NotificationBadge count={7} variant="ink" />
          </span>
        </div>
      </Section>
    </div>
  );
}
