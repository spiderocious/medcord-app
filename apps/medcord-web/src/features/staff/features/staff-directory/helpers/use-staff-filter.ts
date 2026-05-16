import { useState, useCallback } from 'react';

import type { StaffRole } from '@shared/types/hospital.ts';

export interface StaffFilter {
  readonly q: string;
  readonly role: StaffRole | '';
  readonly status: 'active' | 'suspended' | '';
}

interface UseStaffFilterReturn {
  readonly filter: StaffFilter;
  readonly setSearch: (q: string) => void;
  readonly setRole: (role: StaffRole | '') => void;
  readonly setStatus: (status: 'active' | 'suspended' | '') => void;
  readonly reset: () => void;
}

const DEFAULT_FILTER: StaffFilter = { q: '', role: '', status: '' };

export function useStaffFilter(): UseStaffFilterReturn {
  const [filter, setFilter] = useState<StaffFilter>(DEFAULT_FILTER);

  const setSearch = useCallback((q: string) => setFilter((f) => ({ ...f, q })), []);
  const setRole = useCallback((role: StaffRole | '') => setFilter((f) => ({ ...f, role })), []);
  const setStatus = useCallback(
    (status: 'active' | 'suspended' | '') => setFilter((f) => ({ ...f, status })),
    [],
  );
  const reset = useCallback(() => setFilter(DEFAULT_FILTER), []);

  return { filter, setSearch, setRole, setStatus, reset };
}
