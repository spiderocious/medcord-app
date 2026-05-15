import { type ReactNode, useState, useRef, useEffect } from 'react';
import { Search, Bell, HelpCircle, ChevronDown, X } from '@icons';

/* ============================================================
   Navigation — the global app shell.
   Topbar, Sidebar (left rail), Breadcrumb, CommandPalette, Drawer.
   ============================================================ */

/* ---------------------------------------------------------- */
/* Topbar                                                      */
/* ---------------------------------------------------------- */

export interface NavUser {
  readonly initials: string;
  readonly name: string;
  readonly role: string;
}

export interface TopbarProps {
  readonly tenantName?: string;
  readonly tenantSub?: string;
  readonly onSearch?: (query: string) => void;
  readonly roleLabel?: string;
  readonly notificationCount?: number;
  readonly user?: NavUser;
  readonly onNotificationsClick?: () => void;
  readonly onHelpClick?: () => void;
  readonly onCommandPalette?: () => void;
}

export function Topbar({
  tenantName = 'St. Catherine\'s General', tenantSub = '2,418 staff · multi-tenant',
  onSearch, roleLabel, notificationCount = 0, user, onNotificationsClick, onHelpClick, onCommandPalette,
}: TopbarProps) {
  const [query, setQuery] = useState('');

  return (
    <div className="grid items-center gap-4 px-4 py-0 bg-[var(--surface-base)] border-b border-[var(--text-primary)] h-[52px]"
      style={{ gridTemplateColumns: '220px 1fr auto auto auto auto auto' }}>
      {/* Tenant */}
      <div className="flex items-center gap-2.5 cursor-pointer">
        <span className="w-8 h-8 bg-[var(--text-primary)] text-[var(--neutral-0)] flex items-center justify-center font-serif text-[16px] font-bold rounded-[4px] tracking-[-0.04em]">
          M
        </span>
        <div>
          <div className="font-serif text-[14px] font-medium tracking-[-0.005em] leading-none text-[var(--text-primary)]">{tenantName}</div>
          <div className="font-mono text-[9px] text-[var(--text-tertiary)] mt-0.5 tracking-[0.18em] uppercase">{tenantSub}</div>
        </div>
      </div>

      {/* Search */}
      <div
        className="flex items-center gap-2.5 border border-[var(--border-default)] bg-[var(--surface-base)] px-3 h-8 rounded-[6px] cursor-text"
        onClick={onCommandPalette}
      >
        <Search size={14} className="text-[var(--text-tertiary)] flex-shrink-0" />
        <input
          className="bg-transparent border-0 outline-none flex-1 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
          placeholder="Search patient by name, MRN, DOB, or phone…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); onSearch?.(e.target.value); }}
          onFocus={onCommandPalette}
        />
        <span className="font-mono text-[10px] text-[var(--text-tertiary)] border border-[var(--border-default)] px-1.5 py-px rounded-[2px]">/</span>
      </div>

      {/* Spacer */}
      <div />

      {/* Role pill */}
      {roleLabel != null && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-[var(--text-primary)] rounded-full font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-primary)]">
          {roleLabel}
        </span>
      )}

      {/* Notifications */}
      <button
        type="button"
        onClick={onNotificationsClick}
        className="relative w-8 h-8 rounded-[4px] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-primary)] cursor-pointer bg-transparent border-0 transition-colors"
      >
        <Bell size={16} />
        {notificationCount > 0 && (
          <span className="absolute top-0 right-0 min-w-[14px] h-[14px] bg-[var(--danger-icon)] text-[var(--neutral-0)] border-[1.5px] border-[var(--surface-base)] rounded-full font-mono text-[9px] font-semibold flex items-center justify-center px-px leading-none">
            {notificationCount > 99 ? '99+' : notificationCount}
          </span>
        )}
      </button>

      {/* Help */}
      <button
        type="button"
        onClick={onHelpClick}
        className="w-8 h-8 rounded-[4px] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-primary)] cursor-pointer bg-transparent border-0 transition-colors"
      >
        <HelpCircle size={16} />
      </button>

      {/* Profile */}
      {user != null && (
        <div className="flex items-center gap-2 cursor-pointer px-1.5">
          <span className="w-7 h-7 rounded-[4px] flex items-center justify-center font-ui font-semibold text-[11px]"
            style={{ background: '#DEE6D6', color: '#2F4226', border: '1px solid #C4D2BC' }}>
            {user.initials}
          </span>
          <div>
            <div className="font-ui text-[12px] font-medium leading-none text-[var(--text-primary)]">{user.name}</div>
            <div className="font-mono text-[9px] text-[var(--text-tertiary)] mt-0.5 uppercase tracking-[0.16em]">{user.role}</div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------- */
/* Sidebar                                                     */
/* ---------------------------------------------------------- */

export interface SidebarNavItem {
  readonly id: string;
  readonly label: string;
  readonly ordinal?: string;
  readonly count?: string | number;
  readonly alert?: boolean;
}

export interface SidebarSection {
  readonly label: string;
  readonly items: SidebarNavItem[];
}

export interface SidebarProps {
  readonly sections: SidebarSection[];
  readonly activeId?: string;
  readonly onItemClick?: (id: string) => void;
}

export function Sidebar({ sections, activeId, onItemClick }: SidebarProps) {
  return (
    <aside className="bg-[var(--surface-base)] border-r border-[var(--text-primary)] py-4.5 min-h-full">
      {sections.map((section) => (
        <div key={section.label}>
          <div className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.18em] px-4 pt-4 pb-1">
            {section.label}
          </div>
          {section.items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onItemClick?.(item.id)}
              className={[
                'w-full grid items-baseline gap-2 px-4 py-[7px] text-left cursor-pointer bg-transparent border-0',
                'border-l-2 transition-colors font-ui text-[13px]',
                activeId === item.id
                  ? 'bg-[var(--surface-sunken)] text-[var(--text-primary)] font-medium border-l-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)] border-l-transparent hover:bg-[var(--surface-sunken)] hover:text-[var(--text-primary)]',
              ].join(' ')}
              style={{ gridTemplateColumns: '22px 1fr auto' }}
            >
              <span className="font-mono text-[10px] tracking-[0] text-[var(--text-tertiary)]">{item.ordinal}</span>
              <span>{item.label}</span>
              <span className={['font-mono text-[10px] tracking-[0]', item.alert === true ? 'text-[var(--danger-icon)] font-semibold' : 'text-[var(--text-tertiary)]'].join(' ')}>
                {item.count}
              </span>
            </button>
          ))}
        </div>
      ))}
    </aside>
  );
}

/* ---------------------------------------------------------- */
/* Breadcrumb                                                  */
/* ---------------------------------------------------------- */

export interface BreadcrumbProps {
  readonly items: Array<{ label: string; href?: string }>;
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="font-mono text-[11px] text-[var(--text-tertiary)] uppercase tracking-[0.16em] flex items-center gap-2">
      {items.map((item, i) => (
        <span key={item.label} className="flex items-center gap-2">
          {i > 0 && <span className="text-[var(--border-default)]">·</span>}
          <span className={i === items.length - 1 ? 'text-[var(--text-primary)]' : 'cursor-pointer hover:text-[var(--text-primary)]'}>
            {item.label}
          </span>
        </span>
      ))}
    </nav>
  );
}

/* ---------------------------------------------------------- */
/* CommandPalette                                              */
/* ---------------------------------------------------------- */

export interface PaletteGroup {
  readonly label: string;
  readonly items: Array<{
    readonly id: string;
    readonly glyph: string;
    readonly name: string;
    readonly meta?: string;
    readonly shortcut?: string;
  }>;
}

export interface CommandPaletteProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly groups: PaletteGroup[];
  readonly activeId?: string;
  readonly onSelect?: (id: string) => void;
}

export function CommandPalette({ open, onClose, groups, activeId, onSelect }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9000] flex items-start justify-center pt-24 bg-black/18"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[var(--surface-raised)] border border-[var(--text-primary)] shadow-[0_24px_48px_rgba(24,22,19,0.24)] w-[560px] rounded-[4px]">
        {/* Find bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--text-primary)]">
          <span className="font-mono text-[11px] text-[var(--text-tertiary)] uppercase tracking-[0.18em]">Find</span>
          <input
            ref={inputRef}
            className="flex-1 border-0 bg-transparent outline-none font-serif italic text-[17px] text-[var(--text-primary)] tracking-[-0.005em] placeholder:text-[var(--text-tertiary)]"
            placeholder="patient, order, or command…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className="font-mono text-[10px] text-[var(--text-tertiary)] border border-[var(--border-default)] px-1.5 py-px rounded-[2px]">Esc</span>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {groups.map((group) => (
            <div key={group.label}>
              <div className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.18em] px-4 py-2.5 bg-[var(--surface-sunken)]">
                {group.label}
              </div>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { onSelect?.(item.id); onClose(); }}
                  className={[
                    'w-full grid items-center gap-3 px-4 py-2.5 cursor-pointer bg-transparent border-0 border-b border-dashed border-[var(--border-default)/40] text-left',
                    'hover:bg-[var(--surface-sunken)] transition-colors',
                    activeId === item.id ? 'bg-[var(--surface-base)] border-l-2 border-l-[var(--text-primary)] pl-[14px]' : '',
                  ].join(' ')}
                  style={{ gridTemplateColumns: '24px 1fr auto' }}
                >
                  <span className="font-serif italic text-[18px] text-[var(--text-tertiary)] text-center leading-none">{item.glyph}</span>
                  <div>
                    <div className="font-serif text-[15px] font-medium tracking-[-0.005em] text-[var(--text-primary)]">{item.name}</div>
                    {item.meta != null && <div className="font-mono text-[11px] text-[var(--text-tertiary)] tracking-[0] mt-0.5">{item.meta}</div>}
                  </div>
                  {item.shortcut != null && (
                    <span className="font-mono text-[10px] text-[var(--text-tertiary)] border border-[var(--border-default)] px-1.5 py-px rounded-[2px]">{item.shortcut}</span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- */
/* Drawer                                                      */
/* ---------------------------------------------------------- */

export interface DrawerProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly subtitle?: string;
  readonly avatarInitials?: string;
  readonly footer?: ReactNode;
  readonly children: ReactNode;
  readonly allergyText?: string;
  readonly width?: number;
}

export function Drawer({ open, onClose, title, subtitle, avatarInitials, footer, children, allergyText, width = 420 }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[8000]">
      {/* Scrim */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      {/* Panel */}
      <div
        className="absolute right-0 top-0 bottom-0 bg-[var(--surface-raised)] border-l border-[var(--text-primary)] shadow-[-16px_0_36px_rgba(24,22,19,0.18)] flex flex-col"
        style={{ width }}
      >
        {/* Header */}
        <div className="grid items-center gap-2.5 px-5 py-3.5 border-b border-[var(--text-primary)] bg-[var(--surface-base)]"
          style={{ gridTemplateColumns: avatarInitials != null ? '36px 1fr auto' : '1fr auto' }}>
          {avatarInitials != null && (
            <span className="w-9 h-9 rounded-full flex items-center justify-center font-ui font-semibold text-[13px]"
              style={{ background: '#ECE3D6', color: '#5C4B30', border: '1px solid #D4C4A6' }}>
              {avatarInitials}
            </span>
          )}
          <div>
            <div className="font-serif text-[18px] font-medium tracking-[-0.012em] leading-[1.1] text-[var(--text-primary)]">{title}</div>
            {subtitle != null && <div className="font-mono text-[10px] text-[var(--text-tertiary)] tracking-[0] mt-0.5">{subtitle}</div>}
          </div>
          <button type="button" onClick={onClose} className="text-[var(--text-tertiary)] cursor-pointer bg-transparent border-0 hover:text-[var(--text-primary)]">
            <X size={16} />
          </button>
        </div>

        {/* Allergy band */}
        {allergyText != null && (
          <div className="px-5 py-2 bg-[var(--danger-icon)] font-serif italic text-[12px] text-[var(--neutral-0)] border-b border-[var(--text-primary)]">
            <span className="font-mono not-italic font-semibold tracking-[0.22em] text-[9px] mr-1">ALLERGY ·</span>
            {allergyText}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-auto px-5 py-4">
          {children}
        </div>

        {/* Footer */}
        {footer != null && (
          <div className="px-4 py-3 border-t border-[var(--text-primary)] bg-[var(--surface-base)] flex items-center gap-2 justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- */
/* ModuleLauncher                                              */
/* ---------------------------------------------------------- */

export interface ModuleTile {
  readonly id: string;
  readonly label: string;
  readonly icon: ReactNode;
  readonly count?: string | number;
  readonly active?: boolean;
  readonly onClick?: () => void;
}

export interface ModuleLauncherProps {
  readonly tiles: ModuleTile[];
}

export function ModuleLauncher({ tiles }: ModuleLauncherProps) {
  return (
    <div className="bg-[var(--surface-raised)] border border-[var(--text-primary)] p-4 shadow-[0_16px_36px_rgba(24,22,19,0.18)]"
      style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(tiles.length, 5)}, 1fr)`, gap: 12 }}>
      {tiles.map((tile) => (
        <button
          key={tile.id}
          type="button"
          onClick={tile.onClick}
          className={[
            'flex flex-col gap-1.5 p-3.5 border rounded-[4px] cursor-pointer text-left transition-colors aspect-[1.05]',
            tile.active === true
              ? 'border-[var(--text-primary)] bg-[var(--surface-sunken)]'
              : 'border-[var(--border-default)] bg-[var(--surface-base)] hover:border-[var(--text-primary)] hover:bg-[var(--surface-raised)]',
          ].join(' ')}
        >
          <span className={[
            'w-8 h-8 border border-[var(--text-primary)] rounded-[4px] flex items-center justify-center',
            tile.active === true ? 'bg-[var(--text-primary)] text-[var(--neutral-0)]' : 'bg-[var(--surface-raised)] text-[var(--text-primary)]',
          ].join(' ')}>
            {tile.icon}
          </span>
          <div className="font-serif text-[16px] font-medium tracking-[-0.005em] text-[var(--text-primary)]">{tile.label}</div>
          {tile.count != null && (
            <div className={['font-mono text-[10px] tracking-[0] mt-auto', tile.active === true ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'].join(' ')}>
              {tile.count}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

/* suppress unused import warning */
void ChevronDown;
