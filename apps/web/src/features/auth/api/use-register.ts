import { useMutation } from '@tanstack/react-query';
import { apiClient, parseApiError, EP } from '@medcord/api';

import type { ApiResponse, RegisterResponse } from '@shared/types';

export interface RegisterPayload {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly phone?: string;
}

export function useRegister() {
  return useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      const res = await apiClient
        .post(EP.AUTH_REGISTER, { json: payload })
        .json<ApiResponse<RegisterResponse>>();
      return res.data;
    },
    onError: (err: unknown) => parseApiError(err),
  });
}
