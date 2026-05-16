import { Outlet } from 'react-router-dom';

import { Sidebar } from './parts/sidebar.tsx';
import { Topbar } from './parts/topbar.tsx';

export function AdminShell() {
  return (
    <div className="flex h-full overflow-hidden bg-cream-50">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
