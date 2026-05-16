import { useQuery } from '@tanstack/react-query';

import { apiClient, EP } from '@medcord/api';
import type { StaffMember } from '../../../shared/types/staff.ts';

interface StaffQuery {
  readonly page?: number;
  readonly limit?: number;
  readonly role?: string;
  readonly status?: 'active' | 'suspended';
  readonly q?: string;
}

interface StaffListResult {
  readonly items: readonly StaffMember[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}

type StaffResponse = { readonly data: StaffListResult };

export function useStaff(hospitalId: string, query: StaffQuery = {}) {
  const params = new URLSearchParams();
  if (query.page !== undefined) params.set('page', String(query.page));
  if (query.limit !== undefined) params.set('limit', String(query.limit));
  if (query.role !== undefined) params.set('role', query.role);
  if (query.status !== undefined) params.set('status', query.status);
  if (query.q !== undefined && query.q !== '') params.set('q', query.q);

  const qs = params.toString();
  const url = qs !== '' ? `${EP.HOSPITAL_STAFF(hospitalId)}?${qs}` : EP.HOSPITAL_STAFF(hospitalId);

  return useQuery({
    queryKey: ['staff', hospitalId, query],
    queryFn: () =>
      apiClient.get(url).json<StaffResponse>().then((r) => r.data),
    enabled: hospitalId !== '',
  });
}
