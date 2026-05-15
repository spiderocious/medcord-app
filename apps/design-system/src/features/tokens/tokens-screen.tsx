import { Section, ComponentRow } from '@features/shell/parts/preview-canvas';

interface SwatchProps {
  readonly name: string;
  readonly value: string;
  readonly textClass?: string;
}

function Swatch({ name, value, textClass = 'text-white' }: SwatchProps) {
  return (
    <div className="flex flex-col gap-1 min-w-[72px]">
      <div
        className={`h-12 w-full rounded-md border border-black/5 flex items-end p-1.5`}
        style={{ backgroundColor: value }}
      >
        <span className={`text-[9px] font-mono ${textClass} opacity-70`}>{value}</span>
      </div>
      <span className="text-[10px] font-mono text-[var(--text-secondary)]">{name}</span>
    </div>
  );
}

function ColorRamp({ label, prefix, shades, darkShades = [] }: {
  readonly label: string;
  readonly prefix: string;
  readonly shades: number[];
  readonly darkShades?: number[];
}) {
  return (
    <div className="mb-6">
      <div className="text-[11px] font-mono text-[var(--text-tertiary)] uppercase tracking-[0.08em] mb-3">{label}</div>
      <div className="flex flex-wrap gap-2">
        {shades.map((shade) => (
          <Swatch
            key={shade}
            name={`${prefix}-${shade}`}
            value={`var(--${prefix}-${shade})`}
            textClass={shade <= 300 ? 'text-black' : 'text-white'}
          />
        ))}
      </div>
    </div>
  );
}

function ShadowSwatch({ name, value }: { readonly name: string; readonly value: string }) {
  return (
    <div className="flex flex-col gap-2 items-center">
      <div
        className="w-20 h-20 bg-[var(--surface-raised)] rounded-lg"
        style={{ boxShadow: value }}
      />
      <span className="text-[10px] font-mono text-[var(--text-secondary)]">{name}</span>
    </div>
  );
}

function RadiusSwatch({ name, px }: { readonly name: string; readonly px: string }) {
  return (
    <div className="flex flex-col gap-2 items-center">
      <div
        className="w-16 h-16 bg-[var(--surface-sunken)] border border-[var(--border-default)]"
        style={{ borderRadius: px }}
      />
      <div className="text-center">
        <div className="text-[10px] font-mono text-[var(--text-secondary)]">{name}</div>
        <div className="text-[10px] font-mono text-[var(--text-tertiary)]">{px}</div>
      </div>
    </div>
  );
}

function MotionBar({ name, durationMs, easing }: { readonly name: string; readonly durationMs: number; readonly easing: string }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-[var(--border-subtle)] last:border-0">
      <div className="w-28 text-[12px] font-mono text-[var(--text-primary)]">
        {name}<span className="text-[var(--text-tertiary)]"> {durationMs}ms</span>
      </div>
      <div className="text-[11px] text-[var(--text-tertiary)] w-64">{easing}</div>
      <div className="flex-1 h-1.5 bg-[var(--surface-sunken)] rounded-full relative overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full w-2 bg-[var(--brand-500)] rounded-full"
          style={{
            animation: `slide-right ${durationMs * 3}ms ${easing} infinite alternate`,
          }}
        />
      </div>
    </div>
  );
}

export function TokensScreen() {
  return (
    <div>
      <Section title="Brand Teal" description="Primary interactive color — buttons, links, focus rings.">
        <ColorRamp label="Brand" prefix="brand" shades={[50, 100, 200, 300, 400, 500, 600, 700, 800, 900]} darkShades={[50, 100, 200]} />
      </Section>

      <Section title="Neutral Scale" description="12-step cool/clinical neutral. Powers all surfaces, text and borders.">
        <ColorRamp label="Neutral" prefix="neutral" shades={[0, 25, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900]} />
      </Section>

      <Section title="Module Accents">
        <ColorRamp label="Patient (Blue)" prefix="patient" shades={[50, 100, 200, 300, 400, 500, 600, 700, 800, 900]} />
        <ColorRamp label="Staff (Violet)" prefix="staff" shades={[50, 100, 200, 300, 400, 500, 600, 700, 800, 900]} />
        <ColorRamp label="Consult (Teal)" prefix="consult" shades={[50, 100, 200, 300, 400, 500, 600, 700, 800, 900]} />
        <ColorRamp label="Records (Green)" prefix="records" shades={[50, 100, 200, 300, 400, 500, 600, 700, 800, 900]} />
        <ColorRamp label="Equipment (Amber)" prefix="equipment" shades={[50, 100, 200, 300, 400, 500, 600, 700, 800, 900]} />
      </Section>

      <Section title="Semantic Colors">
        <ComponentRow label="Success">
          <div className="px-3 py-2 rounded-md text-[12px] font-medium" style={{ background: 'var(--success-bg)', color: 'var(--success-fg)', border: '1px solid var(--success-border)' }}>Success</div>
        </ComponentRow>
        <ComponentRow label="Warning">
          <div className="px-3 py-2 rounded-md text-[12px] font-medium" style={{ background: 'var(--warning-bg)', color: 'var(--warning-fg)', border: '1px solid var(--warning-border)' }}>Warning</div>
        </ComponentRow>
        <ComponentRow label="Danger">
          <div className="px-3 py-2 rounded-md text-[12px] font-medium" style={{ background: 'var(--danger-bg)', color: 'var(--danger-fg)', border: '1px solid var(--danger-border)' }}>Danger</div>
        </ComponentRow>
        <ComponentRow label="Info">
          <div className="px-3 py-2 rounded-md text-[12px] font-medium" style={{ background: 'var(--info-bg)', color: 'var(--info-fg)', border: '1px solid var(--info-border)' }}>Info</div>
        </ComponentRow>
      </Section>

      <Section title="Typography">
        <div className="bg-[var(--surface-raised)] border border-[var(--border-default)] rounded-lg overflow-hidden">
          {[
            { label: 'display-md', size: '2.25rem', weight: '700', sample: 'Patient Dashboard' },
            { label: 'h1', size: '1.875rem', weight: '600', sample: 'Ward Overview' },
            { label: 'h2', size: '1.5rem', weight: '600', sample: 'Lab Results' },
            { label: 'h3', size: '1.25rem', weight: '600', sample: 'Vital Signs' },
            { label: 'h4', size: '1.125rem', weight: '500', sample: 'Medications' },
            { label: 'body', size: '1rem', weight: '400', sample: 'Patient presented with shortness of breath and chest pain.' },
            { label: 'body-sm', size: '0.875rem', weight: '400', sample: 'Last updated 3 minutes ago by Dr. Adeyemi' },
            { label: 'caption', size: '0.75rem', weight: '400', sample: 'MRN-2094 · DOB 1988-03-14' },
            { label: 'overline', size: '0.6875rem', weight: '600', sample: 'PATIENT INFORMATION' },
            { label: 'mono / code', size: '0.875rem', weight: '400', sample: 'CAE-3F8K-2P9X', mono: true },
          ].map(({ label, size, weight, sample, mono }) => (
            <div key={label} className="flex items-baseline gap-6 px-5 py-3.5 border-b border-[var(--border-subtle)] last:border-0">
              <div className="w-28 flex-shrink-0 text-[10px] font-mono text-[var(--text-tertiary)] uppercase tracking-[0.06em]">{label}</div>
              <div
                style={{
                  fontSize: size,
                  fontWeight: weight,
                  fontFamily: mono ? 'var(--font-mono)' : 'var(--font-ui)',
                  letterSpacing: weight === '700' ? '-0.025em' : weight === '600' ? '-0.015em' : '0',
                  textTransform: label === 'overline' ? 'uppercase' : 'none',
                  letterSpacing: label === 'overline' ? '0.1em' : undefined,
                  fontFeatureSettings: mono ? '"tnum" 1, "lnum" 1' : undefined,
                }}
                className="text-[var(--text-primary)] leading-tight"
              >
                {sample}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Spacing Scale">
        <div className="flex items-end gap-3 flex-wrap">
          {[0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24].map((step) => {
            const px = [0,4,8,12,16,20,24,32,40,48,64,80,96][step > 6 ? [8,10,12,16,20,24].indexOf(step) + 7 : step] ?? 0;
            return (
              <div key={step} className="flex flex-col items-center gap-1">
                <div
                  className="bg-[var(--brand-200)] border-t-2 border-[var(--brand-500)]"
                  style={{ width: 16, height: `var(--space-${step})` || '2px', minHeight: 2 }}
                />
                <span className="text-[9px] font-mono text-[var(--text-tertiary)]">{step}</span>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Border Radius">
        <div className="flex flex-wrap gap-6 items-end">
          <RadiusSwatch name="none" px="0px" />
          <RadiusSwatch name="sm" px="4px" />
          <RadiusSwatch name="md" px="6px" />
          <RadiusSwatch name="lg" px="8px" />
          <RadiusSwatch name="xl" px="12px" />
          <RadiusSwatch name="2xl" px="16px" />
          <RadiusSwatch name="full" px="9999px" />
        </div>
      </Section>

      <Section title="Elevation / Shadow">
        <div className="flex flex-wrap gap-8 items-end">
          {[1,2,3,4,5].map((level) => (
            <ShadowSwatch key={level} name={`shadow-${level}`} value={`var(--shadow-${level})`} />
          ))}
        </div>
      </Section>

      <Section title="Motion">
        <div className="bg-[var(--surface-raised)] border border-[var(--border-default)] rounded-lg px-5 py-2">
          <MotionBar name="fast" durationMs={100} easing="cubic-bezier(0.4, 0, 0.2, 1)" />
          <MotionBar name="normal" durationMs={200} easing="cubic-bezier(0.4, 0, 0.2, 1)" />
          <MotionBar name="slow" durationMs={350} easing="cubic-bezier(0, 0, 0.2, 1)" />
          <MotionBar name="slower" durationMs={500} easing="cubic-bezier(0, 0, 0.2, 1)" />
          <MotionBar name="spring" durationMs={350} easing="cubic-bezier(0.34, 1.4, 0.64, 1)" />
        </div>
      </Section>

      <style>{`
        @keyframes slide-right {
          from { left: 0; }
          to { left: calc(100% - 8px); }
        }
      `}</style>
    </div>
  );
}
