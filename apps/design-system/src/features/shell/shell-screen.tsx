import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './parts/sidebar';
import { Topbar } from './parts/topbar';
import { PreviewCanvas } from './parts/preview-canvas';

export function ShellScreen() {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('medcord-ds-theme') === 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.setAttribute('data-theme', 'dark');
      root.classList.add('dark');
    } else {
      root.removeAttribute('data-theme');
      root.classList.remove('dark');
    }
    localStorage.setItem('medcord-ds-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  function handleToggleDark() {
    setIsDark((prev) => !prev);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--surface-canvas)]">
      <Sidebar isDark={isDark} onToggleDark={handleToggleDark} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />
        <PreviewCanvas>
          <Outlet />
        </PreviewCanvas>
      </div>
    </div>
  );
}
