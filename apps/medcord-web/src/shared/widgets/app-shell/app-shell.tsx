import { Outlet } from 'react-router-dom';

import type { Hospital } from '@shared/types';
import { Sidebar } from './parts/sidebar.tsx';
import { Topbar } from './parts/topbar.tsx';

interface AppShellProps {
  readonly hospital: Hospital;
}

export function AppShell({ hospital }: AppShellProps) {
  return (
    <div className="flex h-full overflow-hidden bg-cream-50">
      <Sidebar
        slug={hospital.subdomain}
        hospitalName={hospital.name}
        modules={hospital.modules}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar slug={hospital.subdomain} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
