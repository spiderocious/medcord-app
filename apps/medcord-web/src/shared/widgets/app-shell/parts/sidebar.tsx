import { NavLink } from 'react-router-dom';
import { Repeat } from 'meemaw';

import {
  IconHome,
  IconUsers,
  IconHeartPulse,
  IconFlask,
  IconPackage,
  IconClipboard,
  IconSearch,
  IconSettings,
  IconRefresh,
  IconStethoscope,
  IconUserCheck,
  IconActivity,
  IconClose,
} from '@icons';
import { PERMISSIONS } from '@medcord/rbac';
import { ROUTES } from '@shared/constants/routes.ts';
import { usePermissions } from '@shared/hooks/use-permissions.ts';
import type { HospitalModules } from '@shared/types/hospital.ts';

interface SidebarProps {
  readonly slug: string;
  readonly hospitalName: string;
  readonly modules: HospitalModules;
  readonly onClose?: () => void;
}

interface NavEntry {
  readonly label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly Icon: React.ComponentType<any>;
  readonly to: string;
  readonly moduleKey?: keyof HospitalModules;
}

const LINK_BASE =
  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-charcoal-700 hover:bg-forest-900/5 hover:text-forest-900';
const LINK_ACTIVE = '!bg-forest-900/10 !text-forest-900';

export function Sidebar({ slug, hospitalName, modules, onClose }: SidebarProps) {
  const { can } = usePermissions();

  const entries: NavEntry[] = [
    { label: 'Dashboard', Icon: IconHome, to: ROUTES.HOSPITAL_DASHBOARD(slug) },
    ...(can(PERMISSIONS.STAFF_VIEW) ? [{ label: 'Staff', Icon: IconUsers, to: ROUTES.HOSPITAL_STAFF(slug) }] : []),
    ...(can(PERMISSIONS.SETTINGS_UPDATE) ? [{ label: 'Roles', Icon: IconUsers, to: ROUTES.HOSPITAL_ROLES(slug) }] : []),
    ...(can(PERMISSIONS.PATIENT_VIEW) ? [{ label: 'Patients', Icon: IconHeartPulse, to: ROUTES.HOSPITAL_PATIENTS(slug), moduleKey: 'emr' as keyof HospitalModules }] : []),
    ...(can(PERMISSIONS.PATIENT_VIEW) ? [{ label: 'Admitted', Icon: IconStethoscope, to: ROUTES.HOSPITAL_PATIENTS_ADMITTED(slug), moduleKey: 'emr' as keyof HospitalModules }] : []),
    ...(can(PERMISSIONS.PATIENT_VIEW) ? [{ label: 'Checked In', Icon: IconUserCheck, to: ROUTES.HOSPITAL_PATIENTS_CHECKEDIN(slug), moduleKey: 'emr' as keyof HospitalModules }] : []),
    ...(can(PERMISSIONS.PATIENT_VIEW) ? [{ label: 'Queue', Icon: IconActivity, to: ROUTES.HOSPITAL_QUEUE(slug), moduleKey: 'emr' as keyof HospitalModules }] : []),
    ...(can(PERMISSIONS.PATIENT_TRANSFER) ? [{ label: 'Transfers', Icon: IconRefresh, to: ROUTES.HOSPITAL_TRANSFERS(slug), moduleKey: 'emr' as keyof HospitalModules }] : []),
    ...(can(PERMISSIONS.LAB_VIEW) ? [{ label: 'Labs', Icon: IconFlask, to: ROUTES.HOSPITAL_LABS(slug), moduleKey: 'labs' as keyof HospitalModules }] : []),
    ...(can(PERMISSIONS.ASSET_VIEW) ? [{ label: 'Assets', Icon: IconPackage, to: ROUTES.HOSPITAL_ASSETS(slug), moduleKey: 'assets' as keyof HospitalModules }] : []),
    ...(can(PERMISSIONS.REVIEW_VIEW) ? [{ label: 'Review Queue', Icon: IconClipboard, to: ROUTES.HOSPITAL_REVIEW_QUEUE(slug) }] : []),
    ...(can(PERMISSIONS.SEARCH_USE) ? [{ label: 'Search', Icon: IconSearch, to: ROUTES.HOSPITAL_SEARCH(slug) }] : []),
    ...(can(PERMISSIONS.SETTINGS_VIEW) ? [{ label: 'Settings', Icon: IconSettings, to: ROUTES.HOSPITAL_SETTINGS(slug) }] : []),
  ].filter((entry) => {
    if (entry.moduleKey === undefined) return true;
    return modules[entry.moduleKey] === true;
  });

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-forest-900/10 bg-white">
      <div className="flex h-14 items-center justify-between border-b border-forest-900/10 px-4">
        <span className="truncate text-sm font-semibold text-forest-900">{hospitalName}</span>
        <button
          type="button"
          onClick={onClose}
          className="ml-2 rounded-lg p-1 text-charcoal-700 hover:bg-forest-900/5 md:hidden"
          aria-label="Close menu"
        >
          <IconClose size={18} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-0.5">
          <Repeat each={entries as NavEntry[]}>
            {(entry: NavEntry) => (
              <li key={entry.to}>
                <NavLink
                  to={entry.to}
                  end={entry.to === ROUTES.HOSPITAL_DASHBOARD(slug)}
                  onClick={onClose}
                  className={({ isActive }) =>
                    [LINK_BASE, isActive ? LINK_ACTIVE : ''].join(' ')
                  }
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
