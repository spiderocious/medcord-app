import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@medcord/api';
import { DrawerService } from '@medcord/ui';
import type { ChartAccessLog } from '../../../shared/types/emr.ts';

type AccessLogResponse = { data: { items: readonly ChartAccessLog[]; total: number; page: number; limit: number; totalPages: number } };

export function useAccessLog(hospitalId: string, patientId: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: ['access-log', hospitalId, patientId, page],
    queryFn: async () => {
      const r = await apiClient
        .get(`api/v1/hospitals/${hospitalId}/patients/${patientId}/chart/access-log?page=${page}&limit=${limit}`)
        .json<AccessLogResponse>();
      return r.data;
    },
    enabled: !!hospitalId && !!patientId,
  });
}

export function useBreakGlass(hospitalId: string, patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (reason: string) => {
      await apiClient.post(
        `api/v1/hospitals/${hospitalId}/patients/${patientId}/chart/break-glass`,
        { json: { reason } }
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['access-log', hospitalId, patientId] });
      DrawerService.toast('Emergency access logged.', { type: 'warning' });
    },
    onError: (err: unknown) => {
      DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', { type: 'error' });
    },
  });
}
