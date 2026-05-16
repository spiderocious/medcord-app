import { NavLink } from 'react-router-dom';

import {
  IconHome,
  IconUsers,
  IconHeartPulse,
  IconFlask,
  IconPackage,
  IconClipboard,
  IconSearch,
  IconSettings,
} from '@icons';
import { ROUTES } from '@shared/constants/routes.ts';
import type { HospitalModules } from '@shared/types/hospital.ts';

interface SidebarProps {
  readonly slug: string;
  readonly hospitalName: string;
  readonly modules: HospitalModules;
}

interface NavEntry {
  readonly label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly Icon: React.ComponentType<any>;
  readonly to: string;
  readonly moduleKey?: keyof HospitalModules;
}

function buildNavEntries(slug: string, modules: HospitalModules): NavEntry[] {
  const all: NavEntry[] = [
    { label: 'Dashboard', Icon: IconHome, to: ROUTES.HOSPITAL_DASHBOARD(slug) },
    { label: 'Staff', Icon: IconUsers, to: ROUTES.HOSPITAL_STAFF(slug) },
    { label: 'Patients', Icon: IconHeartPulse, to: ROUTES.HOSPITAL_PATIENTS(slug), moduleKey: 'emr' },
    { label: 'Labs', Icon: IconFlask, to: ROUTES.HOSPITAL_LABS(slug), moduleKey: 'labs' },
    { label: 'Assets', Icon: IconPackage, to: ROUTES.HOSPITAL_ASSETS(slug), moduleKey: 'assets' },
    { label: 'Review Queue', Icon: IconClipboard, to: ROUTES.HOSPITAL_REVIEW_QUEUE(slug) },
    { label: 'Search', Icon: IconSearch, to: ROUTES.HOSPITAL_SEARCH(slug) },
    { label: 'Settings', Icon: IconSettings, to: ROUTES.HOSPITAL_SETTINGS(slug) },
  ];

  return all.filter((entry) => {
    if (entry.moduleKey === undefined) return true;
    return modules[entry.moduleKey] === true;
  });
}

const LINK_BASE =
  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-charcoal-700 hover:bg-forest-900/5 hover:text-forest-900';
const LINK_ACTIVE = '!bg-forest-900/10 !text-forest-900';

export function Sidebar({ slug, hospitalName, modules }: SidebarProps) {
  const entries = buildNavEntries(slug, modules);

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-forest-900/10 bg-white">
      <div className="flex h-14 items-center border-b border-forest-900/10 px-4">
        <span className="truncate text-sm font-semibold text-forest-900">{hospitalName}</span>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-0.5">
          {entries.map((entry) => (
            <li key={entry.to}>
              <NavLink
                to={entry.to}
                end={entry.to === ROUTES.HOSPITAL_DASHBOARD(slug)}
                className={({ isActive }) =>
                  [LINK_BASE, isActive ? LINK_ACTIVE : ''].join(' ')
                }
              >
                <entry.Icon size={16} />
                <span>{entry.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
