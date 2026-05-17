import { type ReactNode, useState } from 'react';
import { X, MoreHorizontal, ChevronUp, ChevronDown } from '@icons';

/* ============================================================
   Table — a printed roster.
   Headers: mono-caps. Rows: hairline-separated.
   Selected rows: 2px ink leading rule (never blue fill).
   Critical rows: arterial-red bleed from left.
   ============================================================ */

export type TableDensity = 'compact' | 'regular' | 'comfy';
export type TableSortDir = 'asc' | 'desc' | null;

export interface TableColumn<T> {
  readonly key: string;
  readonly header: string;
  readonly sortable?: boolean;
  readonly align?: 'left' | 'right';
  readonly mono?: boolean;
  readonly render?: (row: T) => ReactNode;
  readonly width?: string | number;
}

export type TableRow = {
  readonly id: string;
  readonly critical?: boolean;
} & Record<string, unknown>;

export interface TableFilterChip {
  readonly label: string;
  readonly key: string;
  readonly variant?: 'default' | 'crit';
}

export interface TableBulkAction {
  readonly label: string;
  readonly variant?: 'default' | 'danger';
  readonly onClick: (selectedIds: string[]) => void;
}

export interface TableProps<T extends TableRow> {
  readonly columns: Array<TableColumn<T>>;
  readonly rows: T[];
  readonly totalCount?: number;
  readonly density?: TableDensity;
  readonly onDensityChange?: (d: TableDensity) => void;
  readonly sortKey?: string;
  readonly sortDir?: TableSortDir;
  readonly onSort?: (key: string) => void;
  readonly selectable?: boolean;
  readonly selectedIds?: string[];
  readonly onSelectChange?: (ids: string[]) => void;
  readonly bulkActions?: TableBulkAction[];
  readonly filterChips?: TableFilterChip[];
  readonly activeFilter?: string;
  readonly onFilterChange?: (key: string) => void;
  readonly expandedRow?: (row: T) => ReactNode;
  readonly page?: number;
  readonly pageCount?: number;
  readonly onPageChange?: (page: number) => void;
  readonly groupLabel?: string;
  readonly groupAfterIndex?: number;
}

const DENSITY_PAD: Record<TableDensity, string> = {
  compact: 'py-1.5 px-3.5 text-[12px]',
  regular: 'py-3 px-3.5 text-[13px]',
  comfy: 'py-4 px-3.5 text-[14px]',
};

const STATUS_PILL: Record<string, string> = {
  ok: 'text-[var(--records-800)] border-[var(--records-200)] bg-[var(--records-50)]',
  warn: 'text-[var(--warning-icon)] border-[var(--warning-border)] bg-[var(--warning-surface)]',
  crit: 'text-[var(--danger-icon)] border-[var(--danger-border)] bg-[var(--danger-surface)]',
  default: 'text-[var(--text-secondary)] border-[var(--border-default)]',
};

export function StatusPill({ label, variant = 'default' }: { readonly label: string; readonly variant?: 'ok' | 'warn' | 'crit' | 'default' }) {
  return (
    <span className={['inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-ui text-[11px] font-medium border', STATUS_PILL[variant]].join(' ')}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-85" />
      {label}
    </span>
  );
}

export function Table<T extends TableRow>({
  columns, rows, totalCount, density = 'regular', onDensityChange,
  sortKey, sortDir, onSort,
  selectable = false, selectedIds = [], onSelectChange,
  bulkActions = [], filterChips = [], activeFilter, onFilterChange,
  expandedRow, page = 1, pageCount = 1, onPageChange,
  groupLabel, groupAfterIndex,
}: TableProps<T>) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const allSelected = rows.length > 0 && rows.every((r) => selectedIds.includes(r.id));
  const someSelected = selectedIds.length > 0 && !allSelected;

  function toggleAll() {
    if (!onSelectChange) return;
    onSelectChange(allSelected ? [] : rows.map((r) => r.id));
  }

  function toggleRow(id: string) {
    if (!onSelectChange) return;
    onSelectChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  }

  const cellPad = DENSITY_PAD[density];

  return (
    <div>
      {/* Toolbar / selection bar */}
      {selectedIds.length > 0 ? (
        <div className="flex items-center gap-4 px-4 py-3 bg-[var(--text-primary)] text-[var(--neutral-0)] border border-[var(--text-primary)] border-b-0">
          <span className="font-mono text-[11px] text-white/70 tracking-[0]">{selectedIds.length} selected</span>
          <span className="text-white/40 font-mono">·</span>
          <div className="flex items-center gap-4 ml-auto">
            {bulkActions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => action.onClick(selectedIds)}
                className={[
                  'font-ui text-[12px] cursor-pointer bg-transparent border-0 pb-0.5 border-b border-transparent hover:border-current transition-colors',
                  action.variant === 'danger' ? 'text-[#FCA5A5]' : 'text-[var(--neutral-0)]',
                ].join(' ')}
              >
                {action.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onSelectChange?.([])}
            className="font-mono text-[18px] text-white/70 hover:text-white cursor-pointer bg-transparent border-0 leading-none"
          >
            <X size={14} />
          </button>
        </div>
      ) : filterChips.length > 0 ? (
        <div className="flex items-center gap-3.5 px-4 py-3 bg-[var(--surface-raised)] border border-[var(--text-primary)] border-b-0">
          <span className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.18em]">Filter</span>
          {filterChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => onFilterChange?.(chip.key)}
              className={[
                'h-[22px] px-2 border rounded-full font-ui text-[12px] cursor-pointer transition-colors',
                activeFilter === chip.key
                  ? 'bg-[var(--text-primary)] text-[var(--neutral-0)] border-[var(--text-primary)]'
                  : chip.variant === 'crit'
                  ? 'text-[var(--danger-icon)] border-[var(--danger-border)] bg-[var(--danger-surface)]'
                  : 'text-[var(--text-secondary)] border-[var(--border-default)] bg-transparent',
              ].join(' ')}
            >
              {chip.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-3.5">
            {totalCount != null && (
              <span className="font-mono text-[11px] text-[var(--text-tertiary)] tracking-[0]">{totalCount} patients</span>
            )}
            <div className="inline-flex items-center border border-[var(--border-default)] rounded-full overflow-hidden font-mono text-[11px]">
              {(['compact', 'regular', 'comfy'] as TableDensity[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onDensityChange?.(d)}
                  className={[
                    'px-2 py-0.5 cursor-pointer border-0 capitalize transition-colors',
                    density === d
                      ? 'bg-[var(--text-primary)] text-[var(--neutral-0)]'
                      : 'bg-transparent text-[var(--text-tertiary)]',
                  ].join(' ')}
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Table */}
      <div className="overflow-x-auto">
      <table className="min-w-full border-collapse bg-[var(--surface-raised)] border border-[var(--text-primary)] border-t-0">
        <thead>
          <tr>
            {selectable && (
              <th className="text-left px-3.5 py-2.5 bg-[var(--surface-sunken)] border-b border-[var(--text-primary)] w-8">
                <span
                  className="inline-flex items-center justify-center w-3.5 h-3.5 border-[1.5px] border-[var(--neutral-0)] cursor-pointer"
                  style={{
                    background: allSelected || someSelected ? 'var(--text-primary)' : 'transparent',
                    borderColor: allSelected || someSelected ? 'var(--text-primary)' : 'var(--border-default)',
                  }}
                  onClick={toggleAll}
                >
                  {someSelected && <span className="block w-1.5 h-px bg-[var(--neutral-0)]" />}
                  {allSelected && <span className="block w-2 h-2 text-[var(--neutral-0)] text-[10px] leading-none">✓</span>}
                </span>
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                className={[
                  'text-left px-3.5 py-2.5 bg-[var(--surface-sunken)] border-b border-[var(--text-primary)]',
                  'font-mono text-[10px] font-semibold uppercase tracking-[0.18em] whitespace-nowrap',
                  sortKey === col.key ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]',
                  col.align === 'right' ? 'text-right' : '',
                  col.sortable === true ? 'cursor-pointer select-none hover:text-[var(--text-primary)]' : '',
                ].join(' ')}
                style={col.width != null ? { width: col.width } : {}}
                onClick={col.sortable === true ? () => onSort?.(col.key) : undefined}
              >
                {col.header}
                {col.sortable === true && (
                  <span className={['ml-1 inline-flex', sortKey === col.key ? 'text-[var(--text-primary)]' : 'text-[var(--border-default)]'].join(' ')}>
                    {sortKey === col.key && sortDir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                  </span>
                )}
              </th>
            ))}
            {expandedRow != null && <th className="w-8 bg-[var(--surface-sunken)] border-b border-[var(--text-primary)]" />}
            <th className="w-8 bg-[var(--surface-sunken)] border-b border-[var(--text-primary)]" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const isSelected = selectedIds.includes(row.id);
            const isCrit = row.critical === true;
            const isExpanded = expandedId === row.id;
            return (
              <>
                {groupLabel != null && groupAfterIndex != null && i === groupAfterIndex && (
                  <tr key={`group-${i}`}>
                    <td
                      colSpan={columns.length + (selectable ? 1 : 0) + (expandedRow != null ? 1 : 0) + 1}
                      className="px-3.5 py-2 bg-[var(--surface-sunken)] font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)] border-t border-[var(--border-default)]"
                    >
                      {groupLabel}
                    </td>
                  </tr>
                )}
                <tr
                  key={row.id}
                  className={[
                    'group/row transition-colors',
                    isCrit
                      ? 'bg-gradient-to-r from-[var(--danger-surface)] to-transparent'
                      : 'hover:bg-[var(--surface-sunken)]',
                    isSelected ? 'shadow-[inset_2px_0_0_var(--text-primary)]' : '',
                    isCrit && isSelected ? 'shadow-[inset_2px_0_0_var(--text-primary),inset_4px_0_0_var(--danger-icon)]' : '',
                  ].join(' ')}
                >
                  {selectable && (
                    <td className={['border-b border-[var(--border-default)/30] px-3.5', cellPad].join(' ')}>
                      <span
                        className="inline-flex items-center justify-center w-3.5 h-3.5 border-[1.5px] cursor-pointer rounded-[2px] transition-colors"
                        style={{
                          background: isSelected ? 'var(--text-primary)' : 'transparent',
                          borderColor: isSelected ? 'var(--text-primary)' : 'var(--border-default)',
                        }}
                        onClick={() => toggleRow(row.id)}
                      >
                        {isSelected && <span className="text-[var(--neutral-0)] text-[9px] leading-none">✓</span>}
                      </span>
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={[
                        'border-b border-[var(--border-default)/30] align-middle',
                        col.mono === true ? 'font-mono text-[12px] tracking-[0] text-[var(--text-secondary)]' : 'font-ui text-[var(--text-primary)]',
                        col.align === 'right' ? 'text-right' : '',
                        cellPad,
                      ].join(' ')}
                    >
                      {col.render != null ? col.render(row) : String(row[col.key] ?? '')}
                    </td>
                  ))}
                  {expandedRow != null && (
                    <td className={['border-b border-[var(--border-default)/30] text-center', cellPad].join(' ')}>
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : row.id)}
                        className="text-[var(--text-tertiary)] cursor-pointer bg-transparent border-0 font-mono text-[14px] leading-none"
                      >
                        {isExpanded ? '▴' : '▾'}
                      </button>
                    </td>
                  )}
                  <td className={['border-b border-[var(--border-default)/30] text-center text-[var(--text-tertiary)]', cellPad].join(' ')}>
                    <MoreHorizontal size={16} className="inline opacity-0 group-hover/row:opacity-100 cursor-pointer transition-opacity" />
                  </td>
                </tr>
                {isExpanded && expandedRow != null && (
                  <tr key={`${row.id}-exp`} className="bg-[var(--surface-sunken)]">
                    <td
                      colSpan={columns.length + (selectable ? 1 : 0) + 2}
                      className="p-0 border-b border-[var(--border-default)]"
                    >
                      <div className="px-6 py-4.5 border-t border-[var(--border-default)]">
                        {expandedRow(row)}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center gap-4 px-4 py-3 bg-[var(--surface-sunken)] border border-[var(--text-primary)] border-t-0 font-mono text-[11px] text-[var(--text-tertiary)] tracking-[0]">
          <span>{totalCount != null ? `${totalCount} records` : ''}</span>
          <div className="ml-auto flex items-center gap-2">
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange?.(p)}
                className={[
                  'font-ui text-[12px] px-2 py-0.5 cursor-pointer border border-transparent rounded-[3px] transition-colors',
                  page === p ? 'bg-[var(--text-primary)] text-[var(--neutral-0)]' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-raised)]',
                ].join(' ')}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
