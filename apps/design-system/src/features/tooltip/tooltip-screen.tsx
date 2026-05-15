import { Section } from '@features/shell/parts/preview-canvas';
import {
  Tooltip,
  Popover,
  PopoverHeader,
  PopoverBody,
  PopoverFooter,
  MenuItem,
  MenuDivider,
  MenuLabel,
  Hovercard,
} from '@ui/tooltip';
import { Button } from '@ui/button';
import { PatientAvatar, StaffAvatar } from '@ui/avatar-pill';
import { Pill } from '@ui/avatar-pill';
import { Checkbox } from '@ui/selection';
import { Pill as PillComp } from '@ui/avatar-pill';

/* ============================================================
   Hovercard specimens
   ============================================================ */

function PatientHoverCard() {
  return (
    <div>
      <div className="grid items-start gap-2.5 p-3 pb-3 border-b border-[var(--border-default)]" style={{ gridTemplateColumns: '36px 1fr' }}>
        <PatientAvatar initials="OA" size="md" />
        <div>
          <div className="font-serif text-[17px] font-medium tracking-[-0.01em] leading-[1.1] text-[var(--text-primary)]">
            Adebayo, Olumide <span className="text-[var(--text-tertiary)] italic font-normal">&quot;Olu&quot;</span>
          </div>
          <div className="font-mono text-[10px] text-[var(--text-tertiary)] mt-0.5 tracking-[0]">Male · 64 y · DOB 14 Mar 1962</div>
        </div>
      </div>
      <div className="px-4 py-2 bg-[var(--danger-icon)] border-t border-b border-[var(--border-default)] font-serif italic text-[12px] text-[var(--neutral-0)]">
        <span className="font-mono not-italic text-[9px] font-semibold tracking-[0.22em] mr-1">ALLERGY ·</span>
        Penicillin causes anaphylaxis. Sulfa drugs cause rash.
      </div>
      <div className="p-[10px_16px_12px] grid gap-1 text-[11px]" style={{ gridTemplateColumns: '80px 1fr' }}>
        <span className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.16em] pt-0.5">MRN</span>
        <span className="font-mono tracking-[0] text-[var(--text-primary)]">10458291</span>
        <span className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.16em] pt-0.5">Bed</span>
        <span className="font-mono tracking-[0] text-[var(--text-primary)]">3-N · 312A</span>
        <span className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.16em] pt-0.5">Code</span>
        <span className="font-mono tracking-[0] text-[var(--text-primary)]">FULL CODE</span>
        <span className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.16em] pt-0.5">Attending</span>
        <span className="font-serif text-[13px] text-[var(--text-primary)]">Patel, Reema MD</span>
      </div>
    </div>
  );
}

function StaffHoverCard() {
  return (
    <div>
      <div className="grid items-start gap-2.5 p-3 pb-3 border-b border-[var(--border-default)]" style={{ gridTemplateColumns: '36px 1fr' }}>
        <StaffAvatar initials="RP" role="md" onShift size="sm" />
        <div>
          <div className="font-serif text-[17px] font-medium tracking-[-0.01em] leading-[1.1] text-[var(--text-primary)]">
            Patel, Reema MD <span className="text-[var(--text-tertiary)] italic font-normal">— FACC</span>
          </div>
          <div className="font-mono text-[10px] text-[var(--text-tertiary)] mt-0.5 tracking-[0]">Cardiology · attending · NPI 1093847562</div>
        </div>
      </div>
      <div className="p-[10px_16px_12px] grid gap-1 text-[11px]" style={{ gridTemplateColumns: '80px 1fr' }}>
        <span className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.16em] pt-0.5">Status</span>
        <span className="flex items-center gap-1.5 font-mono tracking-[0] text-[var(--text-primary)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--records-600)]" />On shift · ends 19:00
        </span>
        <span className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.16em] pt-0.5">Pager</span>
        <span className="font-mono tracking-[0] text-[var(--text-primary)]">×4187</span>
        <span className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.16em] pt-0.5">Mobile</span>
        <span className="font-mono tracking-[0] text-[var(--text-primary)]">+1 (312) 555-0148</span>
        <span className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.16em] pt-0.5">License</span>
        <span className="font-mono tracking-[0] text-[var(--text-primary)]">IL 036-018392 · exp 2027</span>
      </div>
    </div>
  );
}

function MedHoverCard() {
  return (
    <div>
      <div className="grid items-start gap-2.5 p-3 pb-3 border-b border-[var(--border-default)]" style={{ gridTemplateColumns: '36px 1fr' }}>
        <div className="w-9 h-9 bg-[var(--surface-sunken)] border border-[var(--border-default)] rounded-sm flex items-center justify-center text-[var(--text-primary)]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M5 9 14 18l5-5L10 4z" /><path d="M11 7l5 5" />
          </svg>
        </div>
        <div>
          <div className="font-serif italic text-[17px] font-medium tracking-[-0.01em] leading-[1.1] text-[var(--text-primary)]">
            Lisinopril <span className="not-italic font-mono text-[13px] text-[var(--text-secondary)] tracking-[0]">10 mg PO</span>
          </div>
          <div className="font-mono text-[10px] text-[var(--text-tertiary)] mt-0.5 tracking-[0]">ACE inhibitor · generic for Prinivil, Zestril</div>
        </div>
      </div>
      <div className="p-[10px_16px_12px] grid gap-1 text-[11px]" style={{ gridTemplateColumns: '80px 1fr' }}>
        <span className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.16em] pt-0.5">Sig</span>
        <span className="font-serif text-[13px] text-[var(--text-primary)]">1 tab by mouth, once daily</span>
        <span className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.16em] pt-0.5">For</span>
        <span className="font-serif text-[13px] text-[var(--text-primary)]">Hypertension · I10</span>
        <span className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.16em] pt-0.5">Last given</span>
        <span className="font-mono tracking-[0] text-[var(--text-primary)]">04/30 · 08:14</span>
        <span className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.16em] pt-0.5">Next due</span>
        <span className="font-mono tracking-[0] font-medium text-[var(--records-700)]">05/01 · 08:00</span>
        <span className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.16em] pt-0.5">By</span>
        <span className="font-serif text-[13px] text-[var(--text-primary)]">Patel, R MD</span>
      </div>
    </div>
  );
}

function BedHoverCard() {
  return (
    <div>
      <div className="grid items-start gap-2.5 p-3 pb-3 border-b border-[var(--border-default)]" style={{ gridTemplateColumns: '36px 1fr' }}>
        <div className="w-9 h-9 bg-[var(--surface-sunken)] border border-[var(--border-default)] rounded-sm flex items-center justify-center font-mono text-[11px] tracking-[0.06em] text-[var(--text-primary)]">
          312A
        </div>
        <div>
          <div className="font-serif text-[17px] font-medium tracking-[-0.01em] leading-[1.1] text-[var(--text-primary)]">
            Room 312 · Bed A
          </div>
          <div className="font-mono text-[10px] text-[var(--text-tertiary)] mt-0.5 tracking-[0]">3-North · cardiac step-down</div>
        </div>
      </div>
      <div className="p-[10px_16px_12px] grid gap-1 text-[11px]" style={{ gridTemplateColumns: '80px 1fr' }}>
        <span className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.16em] pt-0.5">Occupant</span>
        <span className="font-serif text-[13px] text-[var(--text-primary)]">Adebayo, Olumide</span>
        <span className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.16em] pt-0.5">Admitted</span>
        <span className="font-mono tracking-[0] text-[var(--text-primary)]">29 Apr · 08:32</span>
        <span className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.16em] pt-0.5">Isolation</span>
        <span className="font-serif italic text-[13px] text-[var(--text-tertiary)]">— none —</span>
        <span className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.16em] pt-0.5">Cleaning</span>
        <span className="font-mono tracking-[0] font-medium text-[var(--records-700)]">Clean</span>
      </div>
    </div>
  );
}

export function TooltipScreen() {
  return (
    <div>
      {/* Tooltips */}
      <Section
        title="Tooltip — a single line of paper."
        description="Ink chip, paper letters. A small triangle points to the anchor; shortcuts are mono and quiet inside the chip."
      >
        <div className="bg-[var(--surface-sunken)] border border-[var(--border-default)] p-16 grid gap-8 place-items-center" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <Tooltip content="Sign & submit note" shortcut="↵" placement="bottom">
            <Button variant="primary" size="sm">Sign</Button>
          </Tooltip>
          <Tooltip content="Open chart" shortcut="⌘ ↵" placement="right">
            <Button variant="secondary" size="sm">Open chart</Button>
          </Tooltip>
          <Tooltip content="Discharge against advice" placement="top">
            <Button variant="quiet" size="sm">AMA</Button>
          </Tooltip>
          <Tooltip content="Search" shortcut="/" placement="left">
            <Button variant="quiet" size="sm">Search</Button>
          </Tooltip>
        </div>
      </Section>

      {/* Popovers */}
      <Section
        title="Popover — a small sheet."
        description="A title, a body, and (sometimes) a footer with two actions. Forms and menus inherit the same chrome."
      >
        <div className="bg-[var(--surface-sunken)] border border-[var(--border-default)] p-16 grid gap-8 place-items-start" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {/* Form popover */}
          <Popover
            trigger={<Button variant="quiet" size="sm">Add note</Button>}
            placement="bottom"
            width={280}
          >
            <PopoverHeader title="Add note" meta="⌘N" />
            <PopoverBody>
              <textarea
                className="w-full h-[72px] p-2 border border-[var(--border-default)] bg-[var(--surface-base)] font-serif text-[13px] italic text-[var(--text-primary)] outline-none resize-none"
                defaultValue={'"Quick note to chart…"'}
              />
            </PopoverBody>
            <PopoverFooter>
              <Button variant="quiet" size="sm">Cancel</Button>
              <Button variant="primary" size="sm">Post</Button>
            </PopoverFooter>
          </Popover>

          {/* Menu popover */}
          <Popover
            trigger={<Button variant="quiet" size="sm">Options ···</Button>}
            placement="bottom"
            width={240}
          >
            <div className="py-1">
              <MenuLabel>Patient</MenuLabel>
              <MenuItem icon="→" label="Open chart" shortcut="↵" />
              <MenuItem icon="+" label="Add note" shortcut="N" />
              <MenuItem icon="›" label="More…" shortcut="›" />
              <MenuDivider />
              <MenuLabel>Workflow</MenuLabel>
              <MenuItem icon="⇄" label="Transfer bed" />
              <MenuItem icon="✓" label="Mark seen" />
              <MenuDivider />
              <MenuItem icon="×" label="Discharge AMA" shortcut="⌫" variant="danger" />
            </div>
          </Popover>

          {/* Filter popover */}
          <Popover
            trigger={<Button variant="secondary" size="sm">Filter status</Button>}
            placement="bottom"
            width={240}
          >
            <PopoverHeader title="Filter status" />
            <PopoverBody>
              <div className="flex flex-col gap-1">
                <Checkbox label="In room" checked readOnly />
                <Checkbox label="Awaiting labs" checked readOnly />
                <Checkbox label="Discharged" />
                <Checkbox label="No-show" />
              </div>
            </PopoverBody>
            <PopoverFooter>
              <Button variant="quiet" size="sm">Reset</Button>
              <Button variant="primary" size="sm">Apply</Button>
            </PopoverFooter>
          </Popover>
        </div>
      </Section>

      {/* Hovercards */}
      <Section
        title="Hovercards — four specimens."
        description="Patient, staff, medication, bed. Each one shows the smallest set of facts a clinician would need at a glance, before navigating in."
      >
        <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div>
            <div className="font-mono text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.18em] mb-3">Patient</div>
            <Hovercard card={<PatientHoverCard />}>
              <span className="font-serif text-[17px] font-medium underline decoration-dotted cursor-pointer text-[var(--text-primary)]">
                Adebayo, Olumide
              </span>
            </Hovercard>
            <p className="text-[12px] text-[var(--text-tertiary)] mt-2">Hover over the name</p>
          </div>
          <div>
            <div className="font-mono text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.18em] mb-3">Staff</div>
            <Hovercard card={<StaffHoverCard />}>
              <StaffAvatar initials="RP" role="md" onShift size="md" />
            </Hovercard>
          </div>
          <div>
            <div className="font-mono text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.18em] mb-3">Medication</div>
            <Hovercard card={<MedHoverCard />}>
              <span className="font-mono text-[13px] underline decoration-dotted cursor-pointer text-[var(--text-primary)]">
                Lisinopril 10 mg PO QD
              </span>
            </Hovercard>
          </div>
          <div>
            <div className="font-mono text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.18em] mb-3">Bed</div>
            <Hovercard card={<BedHoverCard />}>
              <span className="inline-flex items-center justify-center w-14 h-8 bg-[var(--surface-raised)] border border-[var(--text-primary)] rounded-sm font-mono text-[11px] tracking-[0.06em] cursor-pointer text-[var(--text-primary)]">
                312A
              </span>
            </Hovercard>
          </div>
        </div>
      </Section>
    </div>
  );
}
