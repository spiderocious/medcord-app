import { Section } from '@features/shell/parts/preview-canvas';
import {
  RecallBanner,
  EquipmentRoster,
  EquipmentDetail,
  ConsumableRow,
  SterilizationCard,
} from '@ui/equipment';

function IconDefibrillator() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
    </svg>
  );
}

function IconPump() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

function IconBed() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M3 18v-6a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function IconMonitor() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

function IconMicroscope() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="9" cy="11" r="4" />
      <line x1="9" y1="2" x2="9" y2="7" />
      <line x1="9" y1="15" x2="9" y2="22" />
    </svg>
  );
}

function IconPyxis() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-30 12 12)" />
    </svg>
  );
}

function IconUltrasound() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M9 2h6" />
      <path d="M10 2v3l-3 7v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-9l-3-7V2" />
    </svg>
  );
}

function IconDefibrillatorLarge() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="rgba(244,239,230,1)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
    </svg>
  );
}

export function EquipmentScreen() {
  return (
    <div>
      <RecallBanner
        stamp="FDA Class I"
        body={
          <>
            <strong className="font-sans not-italic font-medium">Alaris 8100 infusion pump</strong>
            {' '}· firmware ≤ 9.18 may deliver inaccurate flow rates at low volumes. Take affected units offline; apply firmware patch v9.19. Four units in this hospital are affected.
          </>
        }
        acknowledgeLabel="Acknowledge · 4 affected"
        meta="recall Z-2026-1183 · posted 22 Apr · BD support 1-800-555-0148"
      />

      <Section
        title="Equipment · biomed log."
        description="Asset maintenance roster with status pills and an asset detail sidebar. Critical/warning rows use colour-coded left borders."
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
          <EquipmentRoster
            title="Maintenance roster — May 1"
            meta="10 of 38 assets · sorted by next service"
            rows={[
              {
                icon: <IconDefibrillator />,
                name: 'Defibrillator',
                alt: 'Lifepak 20e',
                serialNumber: 'SN LP20-77451 · code-cart unit',
                lastService: '04 Dec 2025',
                lastServiceMeta: 'pass · last cycle',
                nextService: '04 Apr · 28 d overdue',
                nextServiceMeta: 'battery fault open',
                nextServiceVariant: 'crit',
                location: '3-N · biomed',
                locationMeta: 'held by P. Reyes',
                status: { variant: 'crit', label: 'Out of service' },
                rowVariant: 'crit',
              },
              {
                icon: <IconPump />,
                name: 'Infusion pump',
                alt: 'Alaris 8100',
                serialNumber: 'SN ALR-8100-39482 · BD Medical · recall affected',
                lastService: '12 Feb 2026',
                lastServiceMeta: 'pass',
                nextService: '12 May · 11 d',
                nextServiceMeta: 'firmware update due',
                nextServiceVariant: 'warn',
                location: '3-N · 312A',
                locationMeta: 'in use · NS infusion',
                status: { variant: 'warn', label: 'In use' },
                rowVariant: 'warn',
              },
              {
                icon: <IconBed />,
                name: 'Hospital bed',
                alt: 'Hill-Rom Versacare',
                serialNumber: 'SN HR-VC-29384',
                lastService: '08 Apr 2026',
                lastServiceMeta: 'pass',
                nextService: '08 Oct · 160 d',
                nextServiceMeta: 'on schedule',
                location: '3-N · 313A',
                locationMeta: 'cleaning',
                status: { variant: 'ok', label: 'OK' },
              },
              {
                icon: <IconMonitor />,
                name: 'Vital signs monitor',
                alt: 'Welch Allyn 6000',
                serialNumber: 'SN WA6000-18372',
                lastService: '14 Mar 2026',
                lastServiceMeta: 'pass · with note',
                nextService: '14 Sep · 137 d',
                nextServiceMeta: 'on schedule',
                location: '3-N · 312B',
                status: { variant: 'ok', label: 'In use' },
              },
              {
                icon: <IconMicroscope />,
                name: 'Microscope',
                alt: 'Olympus CX23',
                serialNumber: 'SN OL-CX23-44829',
                lastService: '22 Feb 2026',
                lastServiceMeta: 'pass',
                nextService: '22 Aug · 113 d',
                nextServiceMeta: 'on schedule',
                location: 'Lab',
                status: { variant: 'ok', label: 'In use' },
              },
              {
                icon: <IconPyxis />,
                name: 'Pyxis station',
                alt: 'ES medication',
                serialNumber: 'SN PYX-ES-29483 · biomed-managed',
                lastService: '04 Apr 2026',
                lastServiceMeta: 'pass',
                nextService: '04 Oct · 156 d',
                nextServiceMeta: 'on schedule',
                location: '3-N · medication room',
                status: { variant: 'ok', label: 'In use' },
              },
              {
                icon: <IconUltrasound />,
                name: 'Ultrasound',
                alt: 'Sonosite Edge II',
                serialNumber: 'SN SS-E2-19384 · portable bedside',
                lastService: '10 Apr 2026',
                lastServiceMeta: 'pass',
                nextService: '10 Oct · 162 d',
                nextServiceMeta: 'on schedule',
                location: '3-N · cart',
                locationMeta: 'missing — last seen ED',
                status: { variant: 'warn', label: 'Missing' },
              },
            ]}
          />

          <EquipmentDetail
            name="Defibrillator"
            alt="Lifepak 20e"
            serialNumber="SN LP20-77451 · Stryker Medical · acquired 2019"
            icon={<IconDefibrillatorLarge />}
            rows={[
              { label: 'Status', value: 'Out of service · battery fault', valueVariant: 'danger' },
              { label: 'Ticket', value: 'SVC-1042 · opened 29 Apr' },
              { label: 'Assigned', value: 'Reyes, Pat · biomed', valueVariant: 'serif' },
              { label: 'Last cal.', value: '04 Dec 2025 · pass' },
              { label: 'Calibrations', value: '7 cycles · 4 yr' },
              { label: 'Acquired', value: '14 Sep 2019 · $14,200' },
              { label: 'Useful life', value: '3 of 7 yr left' },
              { label: 'UDI', value: '(01)003827193847·(11)190914' },
            ]}
          />
        </div>
      </Section>

      <Section
        title="Consumables + sterilization."
        description="End-of-shift par check and the most recent sterilization cycle log."
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
          <div className="bg-[var(--surface-raised)] border border-[var(--text-primary)]">
            <div className="px-5 py-[14px] border-b border-[var(--text-primary)] bg-[var(--surface-sunken)] flex items-baseline gap-3.5">
              <h2 className="m-0 font-serif text-[20px] font-medium tracking-[-0.012em] text-[var(--text-primary)]">Consumables — par check</h2>
              <span className="ml-auto font-mono text-[11px] text-[var(--text-tertiary)] tracking-[0]">end-of-shift · 7 items</span>
            </div>

            <div
              className="bg-[var(--surface-sunken)] font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.18em] border-b border-[var(--text-primary)] px-5 py-2 items-center"
              style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 14 }}
            >
              <div>Item</div>
              <div>On hand</div>
              <div>Par</div>
              <div>Expiry</div>
            </div>

            <ConsumableRow
              name="10 mL syringe — sterile"
              meta="BD · NDC 8290-XX"
              qty="412"
              par="par 300"
              status={{ variant: 'ok', label: '2027-04' }}
            />
            <ConsumableRow
              name="0.9% NaCl — 1 L bag"
              meta="Baxter · reorder ↓"
              qty="42"
              par="par 120"
              status={{ variant: 'warn', label: '2026-06 · 36 d' }}
              rowVariant="warn"
            />
            <ConsumableRow
              name="Lidocaine 1% — 50 mL vial"
              meta="Pfizer · expired"
              qty="8"
              par="par 20"
              status={{ variant: 'crit', label: 'EXPIRED 22 Apr' }}
              rowVariant="crit"
            />
            <ConsumableRow
              name="Sterile gauze 4×4"
              meta="Cardinal"
              qty="1,840"
              par="par 2,000"
              status={{ variant: 'ok', label: '2028-09' }}
            />
          </div>

          <SterilizationCard
            title="Sterilization cycle"
            cycleId="CSP-2026-0218"
            cells={[
              { label: 'Load', value: '218 · 04/30' },
              { label: 'Cycle', value: 'Steam · 134 °C · 4 min' },
              { label: 'Bowie–Dick', value: 'Pass', valueOk: true },
              { label: 'Biological indicator', value: 'Negative · 04/30', valueOk: true },
            ]}
            contents="18 instrument trays · OR-2 set · cardiac cath set."
            release="Released by P. Reyes · biomed · 14:42 · workstation BIO-04"
          />
        </div>
      </Section>
    </div>
  );
}
