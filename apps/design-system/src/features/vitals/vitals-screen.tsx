import { Section } from '@features/shell/parts/preview-canvas';
import { VitalsStrip, VitalsStripRow, VitalsTrace, MARGrid } from '@medcord/ui';

const HR_POINTS = [46, 44, 42, 38, 40, 36, 38, 32, 28, 34, 36, 42, 46];
const BP_SYS_POINTS = [128, 130, 126, 124, 128, 122, 126, 118, 114, 120, 128, 132, 130];
const BP_DIA_POINTS = [82, 84, 82, 80, 82, 78, 80, 76, 74, 80, 82, 84, 82];
const SPO2_POINTS = [98, 98, 98, 99, 98, 99, 98, 99, 99, 99, 98, 98, 99];
const TEMP_POINTS = [98.6, 98.8, 98.6, 98.9, 98.8, 98.6, 98.8, 98.8, 98.6, 98.6, 98.8, 98.6, 98.6];

export function VitalsScreen() {
  return (
    <div>
      <Section
        title="Vital signs strip — 24 hours."
        description="A long horizontal chart. Four traces: HR, BP (systolic + diastolic), SpO₂, temperature. Each row has a label column, chart, and summary column. Green reference band behind each trace."
      >
        <VitalsStrip
          title="Vital signs — 24 h"
          meta="04/30 14:00 → 05/01 14:00 · q15min"
          legend={[
            { label: 'HR', color: 'var(--text-primary)' },
            { label: 'BP sys / dia', color: 'var(--text-secondary)' },
            { label: 'SpO₂', color: 'var(--records-700)' },
            { label: 'Temp', color: 'var(--warning-icon)' },
          ]}
          xLabels={['14:00', '18:00', '22:00', '02:00', '06:00', '10:00', '14:00']}
        >
          <VitalsStripRow
            label="Heart rate"
            currentValue="76"
            unit="bpm"
            reference="target 60–100"
            status="normal"
            summary={[
              <>min · <strong className="text-[var(--text-primary)] font-medium">62</strong></>,
              <>avg · <strong className="text-[var(--text-primary)] font-medium">78</strong></>,
              <>max · <strong className="text-[var(--text-primary)] font-medium">92</strong></>,
            ]}
          >
            <VitalsTrace
              points={HR_POINTS}
              color="var(--text-primary)"
              bandY1Pct={27}
              bandY2Pct={72}
            />
          </VitalsStripRow>

          <VitalsStripRow
            label="Blood pressure"
            currentValue="128/82"
            unit="mmHg"
            reference="target ≤ 140/90"
            status="warn"
            summary={[
              <>sys avg <strong className="text-[var(--text-primary)] font-medium">132</strong></>,
              <>dia avg <strong className="text-[var(--text-primary)] font-medium">84</strong></>,
              <span className="text-[var(--warning-icon)]">peaked 158 / 96</span>,
            ]}
          >
            <div className="relative">
              <VitalsTrace
                points={BP_SYS_POINTS}
                color="var(--text-secondary)"
                bandY1Pct={17}
                bandY2Pct={45}
              />
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
                <VitalsTrace
                  points={BP_DIA_POINTS}
                  color="var(--text-secondary)"
                  dashArray="3 2"
                  bandY1Pct={60}
                  bandY2Pct={88}
                />
              </div>
            </div>
          </VitalsStripRow>

          <VitalsStripRow
            label="SpO₂"
            currentValue="98"
            unit="%"
            reference="target ≥ 95"
            status="normal"
            summary={[
              <>low · <strong className="text-[var(--text-primary)] font-medium">96%</strong></>,
              <>on room air</>,
            ]}
          >
            <VitalsTrace
              points={SPO2_POINTS}
              color="var(--records-700)"
              bandY1Pct={0}
              bandY2Pct={25}
            />
          </VitalsStripRow>

          <VitalsStripRow
            label="Temperature"
            currentValue="98.6"
            unit="°F"
            reference="target ≤ 100.4"
            status="normal"
            summary={[
              <>avg · <strong className="text-[var(--text-primary)] font-medium">98.4</strong></>,
              <>max · <strong className="text-[var(--text-primary)] font-medium">99.1</strong></>,
              <>tympanic</>,
            ]}
          >
            <VitalsTrace
              points={TEMP_POINTS}
              color="var(--warning-icon)"
              dashArray="3 3"
              bandY1Pct={37}
              bandY2Pct={63}
            />
          </VitalsStripRow>
        </VitalsStrip>
      </Section>

      <Section
        title="Medication administration record."
        description="A printed pharmacy roster. Drug names in italic serif on the left, hours across the top. Cells: given (green), held (amber), missed (red), refused (blue), due (ink), future (dash)."
      >
        <MARGrid
          title="Medication administration record — May 1"
          meta="six medications · 06–22h"
          hours={['06', '08', '10', '12', '14', '16', '18', '20']}
          drugs={[
            {
              name: 'Lisinopril',
              dose: '10 mg PO daily',
              indication: '— hypertension',
              cells: [
                { status: 'empty' },
                { status: 'given', initials: 'RP', time: '08:14' },
                { status: 'empty' },
                { status: 'empty' },
                { status: 'empty' },
                { status: 'empty' },
                { status: 'empty' },
                { status: 'future' },
              ],
            },
            {
              name: 'Metformin',
              dose: '500 mg PO BID',
              indication: '— type 2 DM',
              cells: [
                { status: 'empty' },
                { status: 'given', initials: 'AW', time: '08:18' },
                { status: 'empty' },
                { status: 'empty' },
                { status: 'empty' },
                { status: 'empty' },
                { status: 'empty' },
                { status: 'due', text: 'due 20:00' },
              ],
            },
            {
              name: 'Atorvastatin',
              dose: '40 mg PO QHS',
              indication: '— hyperlipidemia · new',
              cells: [
                { status: 'empty' },
                { status: 'empty' },
                { status: 'empty' },
                { status: 'empty' },
                { status: 'empty' },
                { status: 'empty' },
                { status: 'empty' },
                { status: 'due', text: 'due 21:00' },
              ],
            },
            {
              name: 'Heparin',
              dose: '5,000 U SC q8h',
              indication: '— VTE prophylaxis',
              cells: [
                { status: 'given', initials: 'AW', time: '06:02' },
                { status: 'empty' },
                { status: 'empty' },
                { status: 'empty' },
                { status: 'given', initials: 'AW', time: '14:08' },
                { status: 'empty' },
                { status: 'empty' },
                { status: 'future' },
              ],
            },
            {
              name: 'Morphine',
              dose: '2 mg IV PRN pain',
              indication: '— refused once at 10:00',
              cells: [
                { status: 'empty' },
                { status: 'empty' },
                { status: 'refused', text: 'refused' },
                { status: 'given', initials: 'AW', time: '12:42' },
                { status: 'empty' },
                { status: 'empty' },
                { status: 'empty' },
                { status: 'empty' },
              ],
            },
            {
              name: 'Furosemide',
              dose: '40 mg IV STAT × 1',
              indication: '— missed at 08:00 then held: BP',
              cells: [
                { status: 'empty' },
                { status: 'missed', text: 'missed' },
                { status: 'held', text: 'held: BP' },
                { status: 'empty' },
                { status: 'empty' },
                { status: 'empty' },
                { status: 'empty' },
                { status: 'empty' },
              ],
            },
          ]}
        />
      </Section>
    </div>
  );
}
