import { useMutation } from '@tanstack/react-query';
import { apiClient, parseApiError, EP } from '@medcord/api';

import type { ApiResponse, Setup2faResponse } from '@shared/types';

export function useSetup2fa() {
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient
        .post(EP.AUTH_SETUP_2FA, { json: {} })
        .json<ApiResponse<Setup2faResponse>>();
      return res.data;
    },
    onError: (err: unknown) => parseApiError(err),
  });
}
