import { useQuery } from '@tanstack/react-query';

import { apiClient, EP } from '@medcord/api';
import type { Hospital } from '@shared/types/hospital.ts';

interface MyHospitalsResponse {
  readonly data: {
    readonly hospitals: readonly Hospital[];
  };
}

export function useMyHospitals() {
  return useQuery({
    queryKey: ['hospitals', 'mine'],
    queryFn: () => apiClient.get(EP.HOSPITALS).json<MyHospitalsResponse>(),
    select: (res) => res.data.hospitals,
  });
}
