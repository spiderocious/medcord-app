import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Search, Layers, ChevronRight, Moon, Sun } from '@icons';
import { NAV_GROUPS, NAV_ITEMS } from '@shared/nav-items';
import type { NavGroup } from '@shared/nav-items';

interface SidebarProps {
  readonly isDark: boolean;
  readonly onToggleDark: () => void;
  readonly className?: string;
}

function Logo() {
  return (
    <div className="flex items-center gap-2.5 px-4 h-14 border-b border-[var(--border-default)]">
      <div className="w-7 h-7 rounded-lg bg-[var(--brand-500)] flex items-center justify-center flex-shrink-0">
        <Layers size={14} className="text-white" />
      </div>
      <div className="leading-none">
        <div className="text-[13px] font-semibold text-[var(--text-primary)] tracking-tight">Medcord</div>
        <div className="text-[10px] text-[var(--text-tertiary)] font-mono uppercase tracking-[0.08em] mt-0.5">Design System</div>
      </div>
    </div>
  );
}

function SearchBar({ value, onChange }: { readonly value: string; readonly onChange: (v: string) => void }) {
  return (
    <div className="px-3 py-2.5">
      <div className="flex items-center gap-2 h-8 px-2.5 rounded-md bg-[var(--surface-sunken)] border border-[var(--border-subtle)] focus-within:border-[var(--border-focus)] focus-within:ring-2 focus-within:ring-[var(--border-focus)]/20 transition-all duration-100">
        <Search size={13} className="text-[var(--text-tertiary)] flex-shrink-0" />
        <input
          type="text"
          placeholder="Search components…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none font-ui"
        />
      </div>
    </div>
  );
}

function NavSection({ group, isOpen, onToggle, items }: {
  readonly group: NavGroup;
  readonly isOpen: boolean;
  readonly onToggle: () => void;
  readonly items: typeof NAV_ITEMS;
}) {
  const location = useLocation();
  const hasActive = items.some((i) => i.route === location.pathname);

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-1.5 group"
      >
        <span className={`text-[10px] font-semibold uppercase tracking-[0.1em] transition-colors ${hasActive ? 'text-[var(--brand-600)]' : 'text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]'}`}>
          {group}
        </span>
        <ChevronRight
          size={11}
          className={`text-[var(--text-tertiary)] transition-transform duration-150 ${isOpen ? 'rotate-90' : ''}`}
        />
      </button>

      {isOpen && (
        <ul className="mb-1">
          {items.map((item) => (
            <li key={item.route}>
              <NavLink
                to={item.route}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-1.5 text-[13px] transition-colors duration-100 rounded-none ${
                    isActive
                      ? 'bg-[var(--brand-50)] text-[var(--brand-700)] font-medium border-r-2 border-[var(--brand-500)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-sunken)]'
                  }`
                }
              >
                {item.label}
                {item.badge != null && (
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--brand-100)] text-[var(--brand-700)] font-medium">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Sidebar({ isDark, onToggleDark, className = '' }: SidebarProps) {
  const [search, setSearch] = useState('');
  const location = useLocation();

  const initialOpen = NAV_GROUPS.reduce<Record<NavGroup, boolean>>(
    (acc, g) => ({ ...acc, [g]: true }),
    {} as Record<NavGroup, boolean>,
  );
  const [openGroups, setOpenGroups] = useState<Record<NavGroup, boolean>>(initialOpen);

  function toggleGroup(group: NavGroup) {
    setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  }

  const filtered = search.trim()
    ? NAV_ITEMS.filter((i) => i.label.toLowerCase().includes(search.toLowerCase()))
    : null;

  const totalComponents = NAV_ITEMS.length - 1; // exclude Tokens

  return (
    <aside className={['hidden sm:flex w-56 flex-shrink-0 flex-col h-full border-r border-[var(--border-default)] bg-[var(--surface-raised)] overflow-hidden', className].join(' ')}>
      <Logo />
      <SearchBar value={search} onChange={setSearch} />

      <nav className="flex-1 overflow-y-auto py-1">
        {filtered != null ? (
          <ul>
            {filtered.length === 0 && (
              <li className="px-4 py-6 text-center text-[12px] text-[var(--text-tertiary)]">No results</li>
            )}
            {filtered.map((item) => (
              <li key={item.route}>
                <NavLink
                  to={item.route}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-1.5 text-[13px] transition-colors duration-100 ${
                      isActive
                        ? 'bg-[var(--brand-50)] text-[var(--brand-700)] font-medium border-r-2 border-[var(--brand-500)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-sunken)]'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        ) : (
          NAV_GROUPS.map((group) => {
            const groupItems = NAV_ITEMS.filter((i) => i.group === group);
            return (
              <NavSection
                key={group}
                group={group}
                isOpen={openGroups[group] ?? true}
                onToggle={() => toggleGroup(group)}
                items={groupItems}
              />
            );
          })
        )}
      </nav>

      <div className="border-t border-[var(--border-default)] px-4 py-3 flex items-center justify-between">
        <span className="text-[11px] text-[var(--text-tertiary)] font-mono">
          {totalComponents} components
        </span>
        <button
          type="button"
          onClick={onToggleDark}
          className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-sunken)] transition-colors duration-100"
          aria-label="Toggle dark mode"
        >
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>
    </aside>
  );
}
