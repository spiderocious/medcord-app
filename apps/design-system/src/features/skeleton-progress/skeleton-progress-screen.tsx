import { Section } from '@features/shell/parts/preview-canvas';
import {
  SkPatientRow,
  SkCard,
  SkVitalsStrip,
  EmptyState,
  TriadCard,
  ModuleEmptyCard,
} from '@ui/skeleton-progress';

const MODULE_EMPTIES = [
  { module: 'Patients', glyph: '∅', title: '"No patients on this worklist."', description: 'Adjust filters or add patients from the floor map.', actionLabel: 'Open floor map →' },
  { module: 'Schedule', glyph: '—', title: '"Your schedule for today is clear."', description: 'Check tomorrow, or open the master template to add ad-hoc visits.', actionLabel: 'View tomorrow →' },
  { module: 'Consults', glyph: '—', title: '"No active consultations."', description: 'Patients in your queue will appear here in arrival order.', actionLabel: 'Configure auto-routing →' },
  { module: 'Chart', glyph: '∅', title: '"This chart is blank."', description: 'No notes, problems, medications, or labs documented yet. Begin with the chief complaint.', actionLabel: 'Start H&P note →' },
  { module: 'Equipment', glyph: '∅', title: '"No equipment registered."', description: 'Track infusion pumps, monitors, and durable equipment by importing from CSV or scanning each tag.', actionLabel: 'Scan asset →' },
  { module: 'Staff', glyph: '—', title: '"No shifts scheduled today."', description: 'Pull from a template or build a custom block.', actionLabel: 'Apply weekly template →' },
  { module: 'Telehealth', glyph: '—', title: '"No incoming calls."', description: 'The next patient will appear when they connect from the waiting room.' },
  { module: 'Labs', glyph: '∅', title: '"All ordered labs have resulted."', description: 'New results will appear here automatically.', actionLabel: 'View resulted labs →' },
  { module: 'Meds', glyph: '—', title: '"No medications due in the next four hours."', description: 'Next dose: 20:00 — Metformin 500 mg.' },
] as const;

export function SkeletonProgressScreen() {
  return (
    <div>
      {/* The Triad */}
      <Section
        title="The patient list — three states."
        description="The skeleton mirrors the final layout. The empty state names the absence in serif italic. The error carries arterial red on its leading edge."
      >
        <div className="grid gap-[18px]" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <TriadCard state="loading">
            <div className="mt-[18px] flex flex-col gap-3.5">
              <SkPatientRow />
              <SkPatientRow />
              <SkPatientRow />
            </div>
          </TriadCard>

          <TriadCard state="empty">
            <EmptyState
              title='"No patients match this filter."'
              description="Adjust filters to widen the view, or add patients to your team's worklist from the floor map."
              actions={[
                { label: 'Clear filters' },
                { label: 'Open floor map', muted: true },
              ]}
            />
          </TriadCard>

          <TriadCard state="error">
            <EmptyState
              variant="error"
              title='"The worklist could not be loaded."'
              description="The EMR connection timed out at 14:42. Cached data may be available offline; live changes will not sync until the connection is restored."
              actions={[
                { label: 'Retry' },
                { label: 'Open offline', muted: true },
              ]}
            />
          </TriadCard>
        </div>
      </Section>

      {/* Skeleton parts */}
      <Section
        title="Skeleton parts — text, avatar, card, vitals strip."
        description="A skeleton always mirrors the layout it replaces. No generic boxes; no greyed-out pills."
      >
        <div className="grid gap-[18px]" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="relative bg-[var(--surface-raised)] border border-[var(--text-primary)] min-h-[220px] p-[18px_20px]">
            <span className="absolute top-0 left-[18px] -translate-y-1/2 px-2 bg-[var(--surface-base)] font-mono text-[10px] font-semibold uppercase tracking-[0.18em] border border-[var(--text-primary)]">
              Card
            </span>
            <div className="mt-6">
              <SkCard />
            </div>
          </div>

          <div className="relative bg-[var(--surface-raised)] border border-[var(--text-primary)] min-h-[220px] p-[18px_20px]">
            <span className="absolute top-0 left-[18px] -translate-y-1/2 px-2 bg-[var(--surface-base)] font-mono text-[10px] font-semibold uppercase tracking-[0.18em] border border-[var(--text-primary)]">
              Vitals strip
            </span>
            <div className="mt-6">
              <SkVitalsStrip />
            </div>
          </div>
        </div>
      </Section>

      {/* Per-module empty states */}
      <Section
        title="Empty, by module."
        description={'Each module phrases its emptiness in its own voice — "no patients today" reads differently than "the chart is blank."'}
      >
        <div className="grid gap-[18px]" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {MODULE_EMPTIES.map((m) => (
            <ModuleEmptyCard
              key={m.module}
              module={m.module}
              glyph={m.glyph}
              title={m.title}
              description={m.description}
              actionLabel={'actionLabel' in m ? m.actionLabel : undefined}
            />
          ))}
        </div>
      </Section>
    </div>
  );
}
