import { Section } from '@features/shell/parts/preview-canvas';
import {
  ChartCard, StackedBarChart, SparklineStrip,
  GanttChart, Heatmap, DonutChart, FunnelChart,
} from '@medcord/ui';

/* heatmap cell shades from HTML reference */
const HEATMAP_SHADES = ['#F4EFE6', '#ECE5D6', '#D9D0BB', '#A39A8A', '#6E665B', '#3C3833', '#181613'];

const MON_CELLS = [0, 0, 1, 2, 3, 4, 5, 6, 6, 5, 5, 4, 4, 5, 5, 4, 4, 5, 5, 4, 3, 2, 1, 0];
const TUE_CELLS = [0, 1, 2, 3, 4, 5, 6, 6, 6, 5, 5, 4, 4, 5, 5, 4, 4, 5, 5, 3, 2, 1, 0, 0];
const WED_CELLS = [1, 2, 3, 4, 5, 6, 6, 6, 6, 5, 5, 4, 4, 4, 5, 5, 4, 3, 3, 2, 2, 1, 0, 0];
const THU_CELLS = [2, 3, 4, 5, 6, 6, 6, 6, 6, 5, 5, 4, 4, 4, 5, 4, 3, 2, 3, 3, 2, 1, 0, 0];
const FRI_CELLS  = [2, 3, 4, 5, 6, 6, 6, 6, 6, 6, 5, 5, 4, 5, 6, 6, 5, 4, 3, 3, 2, 1, 0, 0];
const SAT_CELLS  = [3, 4, 4, 5, 5, 6, 6, 6, 5, 6, 5, 6, 5, 4, 5, 6, 5, 4, 5, 4, 3, 2, 1, 0];
const SUN_CELLS  = [0, 1, 2, 3, 3, 4, 3, 2, 3, 4, 3, 2, 3, 4, 3, 2, 1, 0, 0, 1, 2, 1, 0, 0];

function toShade(idx: number): string {
  return HEATMAP_SHADES[idx] ?? HEATMAP_SHADES[0] ?? '#F4EFE6';
}

const HEATMAP_ROWS = [
  { label: 'Mon', cells: MON_CELLS.map(toShade) },
  { label: 'Tue', cells: TUE_CELLS.map(toShade) },
  { label: 'Wed', cells: WED_CELLS.map(toShade) },
  { label: 'Thu', cells: THU_CELLS.map(toShade) },
  { label: 'Fri', cells: FRI_CELLS.map(toShade) },
  { label: 'Sat', cells: SAT_CELLS.map(toShade) },
  { label: 'Sun', cells: SUN_CELLS.map(toShade) },
];

const AXIS_LABELS = Array.from({ length: 24 }, (_, i) => i % 2 === 0 ? String(i) : '');

export function ChartsScreen() {
  return (
    <div>
      <Section
        title="Charts — printed, ink-only."
        description="No coloured fills, no gradients. The chart is the bones: hairline grid, ink lines, mono labels. Color only for state (warn/crit)."
      >
        <div className="grid gap-6 mb-9 grid-cols-1 sm:grid-cols-2">
          {/* Stacked bar */}
          <ChartCard
            title="Admissions · last 7 days"
            meta="stacked by service"
            subtitle="A printed bar — outline only, with the segments hairline-separated. Service legend reads under."
            legend={[
              { label: 'Cardiology', color: 'var(--text-primary)' },
              { label: 'Internal med', color: 'var(--text-secondary)' },
              { label: 'Surgery', color: 'var(--text-tertiary)' },
            ]}
          >
            <StackedBarChart
              yMax={40}
              yStep={20}
              data={[
                { label: 'Mon', segments: [{ value: 26, color: 'var(--text-primary)' }, { value: 9, color: 'var(--text-secondary)' }, { value: 8, color: 'var(--text-tertiary)' }] },
                { label: 'Tue', segments: [{ value: 32, color: 'var(--text-primary)' }, { value: 11, color: 'var(--text-secondary)' }, { value: 8, color: 'var(--text-tertiary)' }] },
                { label: 'Wed', segments: [{ value: 27, color: 'var(--text-primary)' }, { value: 12, color: 'var(--text-secondary)' }, { value: 8, color: 'var(--text-tertiary)' }] },
                { label: 'Thu', segments: [{ value: 39, color: 'var(--text-primary)' }, { value: 12, color: 'var(--text-secondary)' }, { value: 9, color: 'var(--text-tertiary)' }] },
                { label: 'Fri', segments: [{ value: 46, color: 'var(--text-primary)' }, { value: 12, color: 'var(--text-secondary)' }, { value: 8, color: 'var(--text-tertiary)' }] },
                { label: 'Sat', segments: [{ value: 25, color: 'var(--text-primary)' }, { value: 10, color: 'var(--text-secondary)' }, { value: 7, color: 'var(--text-tertiary)' }] },
                { label: 'Sun', segments: [{ value: 21, color: 'var(--text-primary)' }, { value: 8, color: 'var(--text-secondary)' }, { value: 6, color: 'var(--text-tertiary)' }] },
              ]}
            />
          </ChartCard>

          {/* Sparkline strip */}
          <ChartCard
            title="Per-floor census"
            meta="sparkline · 24 h"
            subtitle="A small specimen used inside the bed-board strip. One line per floor; full at 100% bleeds critical."
          >
            <SparklineStrip
              rows={[
                {
                  label: '3-North',
                  points: [38, 36, 34, 35, 32, 30, 29, 28, 26],
                  current: '42 / 48',
                  status: 'normal',
                },
                {
                  label: 'CCU',
                  points: [4, 4, 4, 4, 4, 4, 4, 4, 4],
                  current: '8 / 8',
                  status: 'crit',
                },
                {
                  label: 'Surgery',
                  points: [12, 11, 13, 10, 11, 10, 9, 11, 9],
                  current: '14 / 24',
                  status: 'normal',
                },
                {
                  label: 'L&D',
                  points: [14, 12, 14, 11, 13, 12, 12, 11, 13],
                  current: '6 / 12',
                  status: 'normal',
                },
              ]}
            />
          </ChartCard>
        </div>

        {/* Gantt */}
        <div className="mb-6">
          <ChartCard
            title="Operating room schedule — today"
            meta="07:00 — 19:00 · four rooms"
            subtitle="Gantt is hairline rules and labelled blocks. Emergency cases are filled ink with arterial-red hair on the leading edge."
            legend={[
              { label: 'in progress', color: 'var(--text-primary)' },
              { label: 'scheduled', color: 'var(--surface-sunken)', stroke: 'var(--text-primary)' },
              { label: 'emergency', color: 'var(--danger-icon)' },
            ]}
          >
            <GanttChart
              startHour={7}
              endHour={19}
              nowHour={14.7}
              nowLabel="now · 14:42"
              rows={[
                {
                  room: '1',
                  blocks: [
                    { label: 'Lap chole', surgeon: 'Patel', startHour: 7.33, durationHours: 1.6, filled: true },
                    { label: 'CABG', surgeon: 'Okafor', startHour: 9.17, durationHours: 2.2, filled: false },
                    { label: 'D&C', surgeon: 'Kim', startHour: 11.5, durationHours: 1.2, filled: false },
                  ],
                },
                {
                  room: '2',
                  blocks: [
                    { label: 'TKA', surgeon: 'Park', startHour: 7.67, durationHours: 2.0, filled: true },
                    { label: 'Appendectomy', surgeon: 'Iqbal', startHour: 9.83, durationHours: 1.8, filled: false },
                  ],
                },
                {
                  room: '3',
                  blocks: [
                    { label: 'CABG', surgeon: 'Patel', startHour: 7.33, durationHours: 2.8, filled: false },
                    { label: 'Lap chole', surgeon: 'Kim', startHour: 10.5, durationHours: 2.2, filled: true },
                    { label: 'D&C', surgeon: 'Reed', startHour: 13.17, durationHours: 1.6, filled: false },
                  ],
                },
                {
                  room: '4',
                  blocks: [
                    { label: 'Emergency', surgeon: 'Patel', startHour: 8, durationHours: 2.6, filled: true, emergency: true },
                    { label: 'Lap chole', surgeon: 'Park', startHour: 11.17, durationHours: 1.8, filled: false },
                  ],
                },
              ]}
            />
          </ChartCard>
        </div>

        <div className="grid gap-6 mb-6 grid-cols-1 sm:grid-cols-2">
          {/* Heatmap */}
          <ChartCard
            title="ED arrivals — heatmap"
            meta="7 d × 24 h"
            subtitle="Density of arrivals by hour of day. Darker is busier; the wall is plotted in shades of ink only."
          >
            <Heatmap rows={HEATMAP_ROWS} axisLabels={AXIS_LABELS} />
          </ChartCard>

          {/* Donut */}
          <ChartCard
            title="Patient demographics"
            meta="12,418 records"
            subtitle="Donut as a printed pie chart, ink-shaded segments. Lined up with a printed legend, mono numbers right-aligned."
          >
            <DonutChart
              centerLabel="12,418"
              centerSubLabel="patients"
              segments={[
                { label: '0–17', pct: 32, count: 3974, color: 'var(--text-primary)' },
                { label: '18–44', pct: 24, count: 2981, color: 'var(--text-secondary)' },
                { label: '45–64', pct: 16, count: 1987, color: 'var(--text-tertiary)' },
                { label: '65+', pct: 28, count: 3476, color: 'var(--surface-sunken)' },
              ]}
            />
          </ChartCard>
        </div>

        {/* Funnel */}
        <ChartCard
          title="Referral funnel — last quarter"
          meta="cardiology · 1,824 referrals"
          subtitle="A printed funnel — outlined trapezoids, mono percentages on each step."
        >
          <FunnelChart
            steps={[
              { label: 'Referrals', value: 1824 },
              { label: 'Consults scheduled', value: 1402, pct: '76.9%' },
              { label: 'Procedures', value: 1038, pct: '56.9%' },
              { label: 'Follow-up scheduled', value: 612, pct: '33.5%', filled: true },
            ]}
          />
        </ChartCard>
      </Section>
    </div>
  );
}
