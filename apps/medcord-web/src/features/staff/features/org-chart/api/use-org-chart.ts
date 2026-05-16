import { useQuery } from '@tanstack/react-query';

import { apiClient, EP } from '@medcord/api';
import type { ApiResponse } from '@shared/types/api.ts';
import type { OrgChartNode } from '../../../shared/types/staff.ts';

type OrgChartResponse = ApiResponse<{ chart: readonly OrgChartNode[] }>

export function useOrgChart(hospitalId: string) {
  return useQuery({
    queryKey: ['org-chart', hospitalId],
    queryFn: () =>
      apiClient
        .get(EP.HOSPITAL_ORG_CHART(hospitalId))
        .json<OrgChartResponse>()
        .then((r) => r.data.chart),
    enabled: hospitalId !== '',
  });
}
