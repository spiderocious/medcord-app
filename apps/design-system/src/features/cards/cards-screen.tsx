import { Section } from '@features/shell/parts/preview-canvas';
import {
  PatientCardCompact,
  PatientCardDefault,
  PatientCardExpanded,
  StaffCard,
  EquipmentCard,
  StatTile,
} from '@medcord/ui';
import { Clock, TriangleAlert } from '@icons';

export function CardsScreen() {
  return (
    <div>
      {/* Patient Summary — three sizes */}
      <Section
        title="Patient summary — three readings."
        description="Compact for the worklist row, default for the team panel, expanded for the chart-open header."
      >
        <div className="grid gap-[18px]" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          {/* Compact */}
          <div>
            <div className="font-mono text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.18em] mb-2.5">Compact</div>
            <PatientCardCompact
              initials="SH"
              avatarBg="#F2DCD8"
              avatarColor="#7F1D1D"
              avatarBorder="#E5BAB3"
              name="Hadi, Samira"
              meta="10778123 · 38 F · CCU 207A"
              critical
              statLabel="STAT"
            />
            <div className="mt-1.5">
              <PatientCardCompact
                initials="OA"
                name="Adebayo, Olumide"
                meta="10458291 · 64 M · 312A"
              />
            </div>
          </div>

          {/* Default */}
          <div>
            <div className="font-mono text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.18em] mb-2.5">Default</div>
            <PatientCardDefault
              initials="OA"
              name="Adebayo, Olumide"
              demo="64 M · DOB 14 Mar 1962 · MRN 10458291"
              marks={[
                { type: 'stamp', label: 'Full code' },
                { type: 'pill', label: '3-N · 312A', dot: true },
                { type: 'pill', label: 'Fall risk', variant: 'warn' },
              ]}
              allergy="Penicillin causes anaphylaxis. Sulfa drugs cause rash."
            />
          </div>

          {/* Expanded */}
          <div>
            <div className="font-mono text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.18em] mb-2.5">Expanded · chart-open</div>
            <PatientCardExpanded
              initials="OA"
              name="Adebayo, Olumide"
              nickname="Olu"
              demo="64 years · Male · DOB 14 Mar 1962"
              ids={[
                { label: 'MRN', value: '10458291' },
                { label: 'ENC', value: '2026-04-29-1184' },
                { label: 'Day', value: '3' },
              ]}
              marks={[
                { type: 'stamp', label: 'Full code' },
                { type: 'pill', label: 'Insurance · BCBS · verified', variant: 'muted' },
                { type: 'pill', label: '3-N · 312A · Patel R MD' },
              ]}
              allergy="Penicillin causes anaphylaxis. Sulfa drugs cause rash."
              vitals={[
                { label: 'HR', value: '76 bpm', mono: true },
                { label: 'BP', value: '128 / 82 mmHg', mono: true },
                { label: 'SpO₂', value: '98%', mono: true },
                { label: 'Temp', value: '98.6 °F', mono: true },
                { label: 'Anticipated DC', value: '02 May 2026' },
                { label: 'Last note', value: '14:08 · Patel, R MD' },
              ]}
            />
          </div>
        </div>
      </Section>

      {/* Staff Profile */}
      <Section
        title="Staff profile — the badge made big."
        description="Same square avatar as the worklist; expanded with credentials, NPI, license number, pager. Off-shift quiets the live indicator."
      >
        <div className="grid gap-[18px]" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <StaffCard
            initials="RP"
            role="MD"
            name="Patel, Reema MD"
            credentials="FACC"
            department="cardiology · attending physician"
            onShift
            shiftLabel="On shift · 07:00 → 19:00"
            meta={[
              { label: 'NPI', value: '1093847562' },
              { label: 'License', value: 'IL · 036-018392' },
              { label: 'Pager', value: '×4187' },
              { label: 'Mobile', value: '+1 (312) 555-0148' },
              { label: 'Hire', value: '04 Aug 2014' },
              { label: 'ACLS', value: 'expires Jun 2026', variant: 'warn' },
            ]}
          />
          <StaffCard
            initials="AW"
            avatarBg="#DDE3D4"
            avatarColor="#495939"
            avatarBorder="#C2CCB4"
            role="RN"
            name="Williams, Aiyana RN"
            credentials="BSN"
            department="3-North · charge nurse"
            onShift={false}
            shiftLabel="Off shift · returns 19:00"
            meta={[
              { label: 'License', value: 'IL · 029-738291' },
              { label: 'Ratio', value: '1 : 4 patients' },
              { label: 'Pager', value: '×3214' },
              { label: 'BLS', value: 'exp Feb 2027' },
              { label: 'Hire', value: '14 Sep 2018' },
              { label: 'ACLS', value: 'expires Aug 2026', variant: 'warn' },
            ]}
          />
        </div>
      </Section>

      {/* Equipment */}
      <Section
        title="Equipment — like a luggage tag."
        description={'A small icon, the model name in serif, the serial in mono. Out-of-service equipment carries a critical bar; warnings stay amber.'}
      >
        <div className="grid gap-[18px]" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <EquipmentCard
            icon={<Clock size={28} />}
            name="Infusion pump"
            model="Alaris 8100"
            serialNumber="SN ALR-8100-39482 · BD Medical"
            status="in-use"
            statusLabel="In use · 3-N 312A"
            meta={[
              { label: 'Last cal.', value: '12 Feb 2026 · pass' },
              { label: 'Next service', value: '12 May · 11 d', variant: 'warn' },
              { label: 'Useful life', value: '4 of 7 yr left' },
              { label: 'UDI', value: '(01)003882…' },
            ]}
          />
          <EquipmentCard
            icon={<TriangleAlert size={28} className="text-[var(--danger-icon)]" />}
            name="Defibrillator"
            model="Lifepak 20e"
            serialNumber="SN LP20-77451"
            status="out-of-service"
            statusLabel="Out of service"
            meta={[
              { label: 'Reason', value: 'Battery fault' },
              { label: 'Ticket', value: 'SVC-1042' },
              { label: 'Since', value: '29 Apr 2026' },
              { label: 'Expected', value: '~ 08 May' },
            ]}
            alarm={'"Battery does not hold charge after full cycle. Code-cart unit — replace before end of shift."'}
          />
        </div>
      </Section>

      {/* Summary stat tiles */}
      <Section
        title="Summary stat — the dashboard tile."
        description="A single number in serif. Delta below in mono. The colour follows whether the trend favours the target."
      >
        <div className="grid gap-[18px]" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <StatTile
            label="House census"
            value={312}
            delta="↑ 8 since 12:00"
            deltaDirection="up"
          />
          <StatTile
            label="Avg LOS"
            value="4.2"
            unit="days"
            delta="↓ 0.3 d · target ≤ 4.5"
            deltaDirection="down"
          />
          <StatTile
            label="30-day readmit"
            value="11.4"
            unit="%"
            delta="↑ 0.8 pp · target ≤ 9"
            deltaDirection="up"
            valueVariant="warn"
          />
          <StatTile
            label="ED door-to-doc"
            value={14}
            unit="min"
            delta="↓ 3 min vs target"
            deltaDirection="down"
          />
        </div>
      </Section>
    </div>
  );
}
