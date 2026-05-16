import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, EP } from '@medcord/api';

import { useAuth } from '@shared/hooks/use-auth.ts';
import { tokenStorage } from '@shared/helpers/token-storage.ts';

export function useLogout() {
  const { logout } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const refreshToken = tokenStorage.getRefresh();
      if (refreshToken !== null) {
        await apiClient.post(EP.AUTH_LOGOUT, { json: { refreshToken } });
      }
    },
    onSettled: () => {
      logout();
      qc.clear();
    },
  });
}
