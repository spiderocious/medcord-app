import { useLocation } from 'react-router-dom';
import { NAV_ITEMS } from '@shared/nav-items';

export function Topbar() {
  const location = useLocation();
  const current = NAV_ITEMS.find((i) => i.route === location.pathname);

  if (current == null) return null;

  return (
    <header className="h-14 flex-shrink-0 flex items-center justify-between px-8 border-b border-[var(--border-default)] bg-[var(--surface-raised)]">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)] font-mono mb-0.5">
          {current.group}
        </div>
        <h1 className="text-[15px] font-semibold text-[var(--text-primary)] tracking-tight">
          {current.label}
        </h1>
      </div>
    </header>
  );
}
