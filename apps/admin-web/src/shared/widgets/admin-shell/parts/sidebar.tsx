import { NavLink } from 'react-router-dom';
import { Repeat } from 'meemaw';

import { IconHome, IconBuilding, IconUsers } from '@icons';
import { ADMIN_ROUTES } from '@shared/constants/routes.ts';

interface NavEntry {
  readonly label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly Icon: React.ComponentType<any>;
  readonly to: string;
}

const NAV_ENTRIES: NavEntry[] = [
  { label: 'Dashboard', Icon: IconHome,     to: ADMIN_ROUTES.DASHBOARD },
  { label: 'Hospitals', Icon: IconBuilding, to: ADMIN_ROUTES.HOSPITALS },
  { label: 'Users',     Icon: IconUsers,    to: ADMIN_ROUTES.USERS },
];

const LINK_BASE =
  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-charcoal-700 hover:bg-forest-900/5 hover:text-forest-900';
const LINK_ACTIVE = '!bg-forest-900/10 !text-forest-900';

export function Sidebar() {
  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-forest-900/10 bg-white">
      <div className="flex h-14 items-center border-b border-forest-900/10 px-4">
        <span className="truncate text-sm font-semibold text-forest-900">Medcord Admin</span>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-0.5">
          <Repeat each={NAV_ENTRIES as NavEntry[]}>
            {(entry: NavEntry) => (
              <li key={entry.to}>
                <NavLink
                  to={entry.to}
                  end={entry.to === ADMIN_ROUTES.DASHBOARD}
                  className={({ isActive }) => [LINK_BASE, isActive ? LINK_ACTIVE : ''].join(' ')}
                >
                  <entry.Icon size={16} />
                  <span>{entry.label}</span>
                </NavLink>
              </li>
            )}
          </Repeat>
        </ul>
      </nav>
    </aside>
  );
}
