import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@medcord/api';
import type { ChartSummary } from '../../../shared/types/emr.ts';

type ChartSummaryResponse = { data: { summary: ChartSummary } };

export function useChartSummary(hospitalId: string, patientId: string) {
  return useQuery({
    queryKey: ['chart-summary', hospitalId, patientId],
    queryFn: async () => {
      const r = await apiClient
        .get(`api/v1/hospitals/${hospitalId}/patients/${patientId}/chart`)
        .json<ChartSummaryResponse>();
      return r.data.summary;
    },
    enabled: !!hospitalId && !!patientId,
  });
}
