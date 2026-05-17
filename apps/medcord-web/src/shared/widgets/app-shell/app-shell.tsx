import { useState } from 'react';
import { Outlet } from 'react-router-dom';

import { Show } from 'meemaw';
import type { Hospital } from '@shared/types';
import { Sidebar } from './parts/sidebar.tsx';
import { Topbar } from './parts/topbar.tsx';

interface AppShellProps {
  readonly hospital: Hospital;
}

export function AppShell({ hospital }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-full overflow-hidden bg-cream-50">
      {/* Mobile backdrop */}
      <Show when={sidebarOpen}>
        <div
          className="fixed inset-0 z-20 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      </Show>

      {/* Sidebar — off-canvas on mobile, always visible on md+ */}
      <div
        className={[
          'fixed inset-y-0 left-0 z-30 transition-transform duration-200 ease-in-out',
          'md:static md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <Sidebar
          slug={hospital.subdomain}
          hospitalName={hospital.name}
          modules={hospital.modules}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar
          slug={hospital.subdomain}
          hospitalId={hospital.id}
          onMenuClick={() => setSidebarOpen((o) => !o)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
