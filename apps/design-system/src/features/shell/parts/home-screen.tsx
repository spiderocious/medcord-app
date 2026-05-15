import { Link } from 'react-router-dom';
import { NAV_ITEMS, NAV_GROUPS } from '@shared/nav-items';

function GroupCard({ group }: { readonly group: string }) {
  const items = NAV_ITEMS.filter((i) => i.group === group);
  return (
    <div className="bg-[var(--surface-raised)] border border-[var(--border-default)] rounded-lg p-5 hover:shadow-2 transition-shadow duration-200">
      <div className="text-[10px] font-mono font-semibold uppercase tracking-[0.1em] text-[var(--brand-600)] mb-3">
        {group}
      </div>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.route}>
            <Link
              to={item.route}
              className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--brand-600)] transition-colors duration-100"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HomeScreen() {
  return (
    <div>
      <div className="mb-10">
        <div className="text-[11px] font-mono font-semibold uppercase tracking-[0.1em] text-[var(--brand-500)] mb-2">
          Medcord Design System
        </div>
        <h1 className="text-[28px] font-semibold text-[var(--text-primary)] tracking-tight mb-3">
          Component Library
        </h1>
        <p className="text-[14px] text-[var(--text-secondary)] max-w-xl leading-relaxed">
          Clinical-modern enterprise components for the Medcord hospital management platform.
          Built in React with TypeScript and Tailwind. Every component is a faithful translation of the design spec.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {NAV_GROUPS.map((group) => (
          <GroupCard key={group} group={group} />
        ))}
      </div>

      <div className="mt-10 pt-8 border-t border-[var(--border-subtle)]">
        <div className="flex items-center gap-6 text-[12px] text-[var(--text-tertiary)]">
          <span className="font-mono">{NAV_ITEMS.length - 1} components</span>
          <span className="font-mono">{NAV_GROUPS.length} groups</span>
          <span className="font-mono">Light + Dark</span>
        </div>
      </div>
    </div>
  );
}
