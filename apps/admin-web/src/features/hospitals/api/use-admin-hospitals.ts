import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, EP } from '@medcord/api';
import { DrawerService } from '@medcord/ui';

import type { AdminHospital, AdminPaginatedResult, HospitalModules } from '@shared/types/admin.ts';

export interface HospitalsFilters {
  readonly q: string;
  readonly isArchived: 'all' | 'true' | 'false';
  readonly page: number;
}

export function useAdminHospitals(filters: HospitalsFilters) {
  return useQuery({
    queryKey: ['admin-hospitals', filters],
    staleTime: 30_000,
    queryFn: async () => {
      const searchParams: Record<string, string> = {
        page: String(filters.page),
        limit: '20',
      };
      if (filters.q.trim()) searchParams['q'] = filters.q.trim();
      if (filters.isArchived !== 'all') searchParams['isArchived'] = filters.isArchived;

      const r = await apiClient
        .get(EP.ADMIN_HOSPITALS, { searchParams })
        .json<{ data: AdminPaginatedResult<AdminHospital> }>();
      return r.data;
    },
  });
}

export function useAdminHospital(hospitalId: string) {
  return useQuery({
    queryKey: ['admin-hospital', hospitalId],
    queryFn: async () => {
      const r = await apiClient
        .get(EP.ADMIN_HOSPITAL(hospitalId))
        .json<{ data: { hospital: AdminHospital; memberCount: number } }>();
      return r.data;
    },
  });
}

export function useUpdateAdminHospital(hospitalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { isArchived?: boolean; modules?: Partial<HospitalModules> }) => {
      const r = await apiClient
        .patch(EP.ADMIN_HOSPITAL_UPDATE(hospitalId), { json: payload })
        .json<{ data: { hospital: AdminHospital } }>();
      return r.data.hospital;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-hospital', hospitalId] });
      void qc.invalidateQueries({ queryKey: ['admin-hospitals'] });
    },
    onError: (err: unknown) => {
      DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', {
        type: 'error',
      });
    },
  });
}

export function useDeleteAdminHospital(hospitalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiClient.delete(EP.ADMIN_HOSPITAL_DELETE(hospitalId));
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-hospitals'] });
    },
    onError: (err: unknown) => {
      DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', {
        type: 'error',
      });
    },
  });
}
