import { useState } from 'react';
import { Section } from '@features/shell/parts/preview-canvas';
import {
  Topbar, Sidebar, Breadcrumb, CommandPalette, Drawer, ModuleLauncher,
} from '@medcord/ui';
import { Button } from '@medcord/ui';
import {
  Users, CalendarDays, Grid2x2, FlaskConical, Pill, Inbox,
  BookUser, Clock, Settings, FileSearch,
  LayoutDashboard, Stethoscope, ActivitySquare,
} from '@icons';

const SIDEBAR_SECTIONS = [
  {
    label: 'Today',
    items: [
      { id: 'patients', label: 'Patients', ordinal: '01', count: 42 },
      { id: 'schedule', label: 'Schedule', ordinal: '02', count: 18 },
      { id: 'bedboard', label: 'Bed board', ordinal: '03', count: '3-N' },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { id: 'lab', label: 'Lab orders', ordinal: '04', count: 5 },
      { id: 'meds', label: 'Medications', ordinal: '05' },
      { id: 'inbox', label: 'Inbox', ordinal: '06', count: 3, alert: true },
    ],
  },
  {
    label: 'Team',
    items: [
      { id: 'staff', label: 'Staff directory', ordinal: '07' },
      { id: 'shifts', label: 'Shifts', ordinal: '08' },
    ],
  },
  {
    label: 'Hospital',
    items: [
      { id: 'settings', label: 'Settings', ordinal: '09' },
      { id: 'audit', label: 'Audit log', ordinal: '10' },
    ],
  },
];

const PALETTE_GROUPS = [
  {
    label: 'Recent patients',
    items: [
      { id: 'oa', glyph: '∿', name: 'Adebayo, Olumide', meta: 'MRN 10458291 · 3-N · 312A', shortcut: '↵' },
      { id: 'sh', glyph: '∿', name: 'Hadi, Samira', meta: 'MRN 10778123 · CCU 207A · STAT' },
      { id: 'cw', glyph: '∿', name: 'Chen, Wei-Lin', meta: 'MRN 10293874 · 3-N · 312B' },
    ],
  },
  {
    label: 'Commands',
    items: [
      { id: 'note', glyph: '+', name: 'New note', meta: 'Open the note composer', shortcut: '⌘N' },
      { id: 'order', glyph: '✓', name: 'New order', meta: 'Open the order entry panel', shortcut: '⌘O' },
      { id: 'search', glyph: '/', name: 'Advanced search', meta: 'Search across all patients and charts' },
    ],
  },
];

const MODULE_TILES = [
  { id: 'patients', label: 'Patients', icon: <Users size={16} />, count: '42 today', active: true },
  { id: 'schedule', label: 'Schedule', icon: <CalendarDays size={16} />, count: '18 visits' },
  { id: 'bedboard', label: 'Bed board', icon: <Grid2x2 size={16} />, count: '3-North' },
  { id: 'lab', label: 'Lab', icon: <FlaskConical size={16} />, count: '5 pending' },
  { id: 'meds', label: 'Medications', icon: <Pill size={16} />, count: '' },
];

export function NavigationScreen() {
  const [activeNav, setActiveNav] = useState('patients');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerAllergyOpen, setDrawerAllergyOpen] = useState(false);

  return (
    <div>
      {/* Shell — topbar + sidebar */}
      <Section
        title="The shell — top bar &amp; left rail."
        description="A printed letterhead at the top, a binder spine at the left, the work in the middle."
      >
        <div className="border border-[var(--text-primary)] overflow-hidden" style={{ display: 'grid', gridTemplateRows: 'auto 1fr' }}>
          <Topbar
            notificationCount={7}
            roleLabel="Acting · MD"
            user={{ initials: 'RP', name: 'Patel, R MD', role: 'Cardiology' }}
            onCommandPalette={() => setPaletteOpen(true)}
          />
          <div className="grid min-h-[500px]" style={{ gridTemplateColumns: '220px 1fr' }}>
            <Sidebar
              sections={SIDEBAR_SECTIONS}
              activeId={activeNav}
              onItemClick={setActiveNav}
            />
            <main className="px-8 py-7 flex flex-col gap-4">
              <Breadcrumb items={[{ label: 'Patients' }, { label: '3-North' }, { label: 'Worklist' }]} />
              <h2 className="m-0 font-serif text-[22px] font-medium tracking-[-0.005em] text-[var(--text-primary)]">42 patients · day shift</h2>
              <p className="m-0 font-serif italic text-[var(--text-tertiary)] text-[14px] leading-[1.55] max-w-[48ch]">
                &quot;Three new admits since 10:00. One critical in CCU. Discharge planning meeting at 14:30.&quot;
              </p>
            </main>
          </div>
        </div>
      </Section>

      {/* Module launcher */}
      <Section
        title="Module launcher — five tiles."
        description="A grid of module tiles: icon, serif name, live count. Active tile has an inked icon background."
      >
        <div className="bg-[var(--surface-sunken)] border border-[var(--border-default)] p-12 flex items-center justify-center">
          <ModuleLauncher tiles={MODULE_TILES} />
        </div>
      </Section>

      {/* Command palette */}
      <Section
        title="Command palette — ⌘K search slip."
        description="A serif italic input, two groups: recent patients and commands. Arrow-key navigation."
      >
        <div className="flex gap-3">
          <Button variant="secondary" size="sm" onClick={() => setPaletteOpen(true)}>
            Open palette ⌘K
          </Button>
        </div>
        <CommandPalette
          open={paletteOpen}
          onClose={() => setPaletteOpen(false)}
          groups={PALETTE_GROUPS}
          activeId="oa"
        />
      </Section>

      {/* Drawers */}
      <Section
        title="Drawer — right edge."
        description="A panel that slides from the right edge. Patient header, optional allergy band, scrollable body, footer actions."
      >
        <div className="flex gap-3">
          <Button variant="secondary" size="sm" onClick={() => setDrawerOpen(true)}>
            Open chart drawer
          </Button>
          <Button variant="quiet" size="sm" onClick={() => setDrawerAllergyOpen(true)}>
            Open with allergy band
          </Button>
        </div>

        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title="Adebayo, Olumide"
          subtitle="64 M · MRN 10458291 · 3-N · 312A"
          avatarInitials="OA"
          footer={
            <>
              <Button variant="quiet" size="sm" onClick={() => setDrawerOpen(false)}>Close</Button>
              <Button variant="secondary" size="sm">Transfer bed</Button>
              <Button variant="primary" size="sm">Open full chart →</Button>
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)] mb-2">Vitals · 14:08</div>
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                {[
                  { lbl: 'HR', v: '76' }, { lbl: 'BP', v: '128/82' },
                  { lbl: 'SpO₂', v: '98%' }, { lbl: 'Temp', v: '98.6°F' },
                ].map((vital) => (
                  <div key={vital.lbl} className="bg-[var(--surface-sunken)] border border-[var(--border-default)] px-3 py-2.5 text-center">
                    <div className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.16em] mb-1">{vital.lbl}</div>
                    <div className="font-mono text-[18px] font-medium tracking-[-0.015em] text-[var(--text-primary)]">{vital.v}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)] mb-2">Active medications</div>
              <div className="flex flex-col">
                {[
                  { nm: 'Lisinopril 10 mg PO', code: 'QD' },
                  { nm: 'Metoprolol 25 mg PO', code: 'BID' },
                  { nm: 'Atorvastatin 40 mg PO', code: 'QHS' },
                ].map((med) => (
                  <div key={med.nm} className="grid py-2 border-b border-dashed border-[var(--border-default)] last:border-b-0 font-ui text-[13px] text-[var(--text-primary)]" style={{ gridTemplateColumns: '1fr auto' }}>
                    <span>{med.nm}</span>
                    <span className="font-mono text-[11px] text-[var(--text-tertiary)] tracking-[0]">{med.code}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Drawer>

        <Drawer
          open={drawerAllergyOpen}
          onClose={() => setDrawerAllergyOpen(false)}
          title="Adebayo, Olumide"
          subtitle="64 M · MRN 10458291 · 3-N · 312A"
          avatarInitials="OA"
          allergyText="Penicillin causes anaphylaxis. Sulfa drugs cause rash."
          footer={
            <>
              <Button variant="quiet" size="sm" onClick={() => setDrawerAllergyOpen(false)}>Close</Button>
              <Button variant="primary" size="sm">Open full chart →</Button>
            </>
          }
        >
          <p className="font-serif italic text-[14px] text-[var(--text-tertiary)] leading-[1.55] m-0">
            Allergy band is shown below the drawer header, above the scrollable body. It is never dismissible.
          </p>
        </Drawer>
      </Section>

      {/* suppress unused icons */}
      {false && <><Inbox /><BookUser /><Clock /><Settings /><FileSearch /><LayoutDashboard /><Stethoscope /><ActivitySquare /></>}
    </div>
  );
}
