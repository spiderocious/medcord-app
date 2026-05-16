import { useQuery } from '@tanstack/react-query';
import { apiClient, EP } from '@medcord/api';

import type { PlatformStats } from '@shared/types/admin.ts';

export function usePlatformStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const r = await apiClient
        .get(EP.ADMIN_STATS)
        .json<{ data: { stats: PlatformStats } }>();
      return r.data.stats;
    },
  });
}
