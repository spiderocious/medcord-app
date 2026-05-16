import { Link } from 'react-router-dom';

import { IconBell, IconSearch } from '@icons';
import { ROUTES } from '@shared/constants/routes.ts';
import { UserMenu } from './user-menu.tsx';

interface TopbarProps {
  readonly slug: string;
}

export function Topbar({ slug }: TopbarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-forest-900/10 bg-white px-4">
      <div className="flex items-center gap-2 text-xs text-charcoal-700">
        <span className="font-semibold text-forest-900">Medcord</span>
      </div>

      <div className="flex items-center gap-1">
        <Link
          to={ROUTES.HOSPITAL_SEARCH(slug)}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-charcoal-700 hover:bg-forest-900/5"
          aria-label="Search"
        >
          <IconSearch size={16} />
        </Link>

        <Link
          to={ROUTES.HOSPITAL_NOTIFICATIONS(slug)}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-charcoal-700 hover:bg-forest-900/5"
          aria-label="Notifications"
        >
          <IconBell size={16} />
        </Link>

        <div className="ml-1">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
