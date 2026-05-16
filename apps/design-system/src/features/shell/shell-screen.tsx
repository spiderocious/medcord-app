import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './parts/sidebar';
import { Topbar } from './parts/topbar';
import { PreviewCanvas } from './parts/preview-canvas';
import { ModalHost, ToastHost } from '@medcord/ui';

export function ShellScreen() {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('medcord-ds-theme') === 'dark';
  });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
      {/* Mobile overlay */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 sm:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-y-0 left-0 z-50 w-64 sm:hidden overflow-y-auto">
          <Sidebar isDark={isDark} onToggleDark={handleToggleDark} className="!flex w-full h-screen" />
        </div>
      )}

      {/* Desktop sidebar */}
      <Sidebar isDark={isDark} onToggleDark={handleToggleDark} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile topbar with hamburger */}
        <div className="flex sm:hidden items-center gap-3 h-12 px-4 border-b border-[var(--border-default)] bg-[var(--surface-raised)] flex-shrink-0">
          <button
            type="button"
            onClick={() => setMobileNavOpen((v) => !v)}
            className="flex flex-col gap-[5px] p-1 cursor-pointer bg-transparent border-0"
            aria-label="Open navigation"
          >
            <span className="w-5 h-[1.5px] bg-[var(--text-primary)] block" />
            <span className="w-5 h-[1.5px] bg-[var(--text-primary)] block" />
            <span className="w-5 h-[1.5px] bg-[var(--text-primary)] block" />
          </button>
          <span className="font-serif text-[15px] font-medium text-[var(--text-primary)]">Medcord DS</span>
        </div>

        <Topbar />
        <PreviewCanvas>
          <Outlet />
        </PreviewCanvas>
      </div>
      <ModalHost />
      <ToastHost />
    </div>
  );
}
