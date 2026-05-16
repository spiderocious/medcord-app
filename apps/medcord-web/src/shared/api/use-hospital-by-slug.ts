import { useQuery } from '@tanstack/react-query';

import { apiClient, EP } from '@medcord/api';
import type { Hospital } from '@shared/types/hospital.ts';

interface HospitalsResponse {
  readonly data: {
    readonly hospitals: readonly Hospital[];
  };
}

export function useHospitalBySlug(slug: string) {
  return useQuery({
    queryKey: ['hospital', 'slug', slug],
    queryFn: async () => {
      const res = await apiClient.get(EP.HOSPITALS).json<HospitalsResponse>();
      const found = res.data.hospitals.find((h) => h.subdomain === slug);
      if (found === undefined) throw new Error('Hospital not found');
      return found;
    },
    enabled: slug !== '',
    staleTime: 1000 * 60 * 5,
  });
}
