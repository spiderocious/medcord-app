import { useQuery } from '@tanstack/react-query';
import { apiClient, EP } from '@medcord/api';

import type { ApiResponse, User } from '@shared/types';
import { tokenStorage } from '@shared/helpers/token-storage.ts';

export function useMe() {
  const hasToken = tokenStorage.getAccess() !== null;

  return useQuery({
    queryKey: ['auth', 'me'],
    enabled: hasToken,
    queryFn: async () => {
      const res = await apiClient.get(EP.AUTH_ME).json<ApiResponse<{ user: User }>>();
      return res.data.user;
    },
  });
}
