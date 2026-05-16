import { UserMenu } from './user-menu.tsx';

export function Topbar() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-forest-900/10 bg-white px-4">
      <div className="flex items-center gap-2 text-xs text-charcoal-700">
        <span className="font-semibold text-forest-900">Medcord</span>
        <span className="text-charcoal-700/50">·</span>
        <span className="text-charcoal-700">Admin</span>
      </div>

      <UserMenu />
    </header>
  );
}
