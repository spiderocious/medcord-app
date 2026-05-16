import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { IconUser, IconSettings, IconLogout, IconChevronDown } from '@icons';
import { ROUTES } from '@shared/constants/routes.ts';
import { useAuth } from '@shared/hooks/use-auth.ts';

export function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current !== null && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = user !== null && user !== undefined
    ? user.name
        .split(' ')
        .map((part) => part[0] ?? '')
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '??';

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-charcoal-700 hover:bg-forest-900/5 focus:outline-none"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-forest-900/10 text-xs font-semibold text-forest-900">
          {initials}
        </span>
        <span className="hidden max-w-[140px] truncate sm:block">
          {user?.name ?? 'Account'}
        </span>
        <IconChevronDown size={14} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-lg border border-forest-900/10 bg-white shadow-lg">
          {user !== null && user !== undefined && (
            <div className="border-b border-forest-900/10 px-3 py-2">
              <p className="truncate text-sm font-medium text-charcoal-900">{user.name}</p>
              <p className="truncate text-xs text-charcoal-700">{user.email}</p>
            </div>
          )}
          <ul className="p-1">
            <li>
              <Link
                to={ROUTES.HOSPITALS}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-charcoal-700 hover:bg-forest-900/5"
              >
                <IconUser size={14} />
                My Hospitals
              </Link>
            </li>
            <li>
              <Link
                to={ROUTES.SETUP_2FA}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-charcoal-700 hover:bg-forest-900/5"
              >
                <IconSettings size={14} />
                Security
              </Link>
            </li>
            <li className="mt-1 border-t border-forest-900/10 pt-1">
              <button
                type="button"
                onClick={() => { logout(); setOpen(false); }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-red-600 hover:bg-red-50"
              >
                <IconLogout size={14} />
                Sign out
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
