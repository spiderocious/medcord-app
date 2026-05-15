import type { ReactNode } from 'react';

interface PreviewCanvasProps {
  readonly children: ReactNode;
}

export function PreviewCanvas({ children }: PreviewCanvasProps) {
  return (
    <main className="flex-1 overflow-y-auto bg-[var(--surface-canvas)]">
      <div className="max-w-5xl mx-auto px-8 py-10">
        {children}
      </div>
    </main>
  );
}

interface SectionProps {
  readonly title: string;
  readonly description?: string;
  readonly children: ReactNode;
}

export function Section({ title, description, children }: SectionProps) {
  return (
    <section className="mb-12">
      <div className="mb-6">
        <h2 className="text-[15px] font-semibold text-[var(--text-primary)] tracking-tight">{title}</h2>
        {description != null && (
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

interface ComponentRowProps {
  readonly label?: string;
  readonly children: ReactNode;
  readonly background?: 'default' | 'dark' | 'sunken';
}

export function ComponentRow({ label, children, background = 'default' }: ComponentRowProps) {
  const bg = {
    default: 'bg-[var(--surface-raised)]',
    dark: 'bg-[var(--neutral-800)]',
    sunken: 'bg-[var(--surface-sunken)]',
  }[background];

  return (
    <div className="mb-4">
      {label != null && (
        <div className="text-[11px] font-mono text-[var(--text-tertiary)] uppercase tracking-[0.08em] mb-2">
          {label}
        </div>
      )}
      <div className={`${bg} rounded-lg border border-[var(--border-default)] p-6 flex flex-wrap items-center gap-3`}>
        {children}
      </div>
    </div>
  );
}

interface ComponentGridProps {
  readonly label?: string;
  readonly children: ReactNode;
  readonly cols?: 2 | 3 | 4;
}

export function ComponentGrid({ label, children, cols = 3 }: ComponentGridProps) {
  const colClass = { 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' }[cols];
  return (
    <div className="mb-4">
      {label != null && (
        <div className="text-[11px] font-mono text-[var(--text-tertiary)] uppercase tracking-[0.08em] mb-2">
          {label}
        </div>
      )}
      <div className={`grid ${colClass} gap-4`}>
        {children}
      </div>
    </div>
  );
}
