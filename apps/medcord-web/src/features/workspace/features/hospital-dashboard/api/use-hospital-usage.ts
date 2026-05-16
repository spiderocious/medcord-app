import { useQuery } from '@tanstack/react-query';

import { apiClient, EP } from '@medcord/api';
import type { ApiResponse } from '@shared/types/api.ts';

interface HospitalUsage {
  readonly members: number;
}

type HospitalUsageResponse = ApiResponse<HospitalUsage>

export function useHospitalUsage(hospitalId: string) {
  return useQuery({
    queryKey: ['hospital', hospitalId, 'usage'],
    queryFn: () =>
      apiClient
        .get(EP.HOSPITAL_USAGE(hospitalId))
        .json<HospitalUsageResponse>()
        .then((r) => r.data),
    enabled: hospitalId !== '',
    staleTime: 1000 * 60 * 2,
  });
}
