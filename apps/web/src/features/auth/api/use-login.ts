import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@medcord/api';
import { parseApiError } from '@medcord/api';
import { EP } from '@medcord/api';

import type { ApiResponse, LoginResponse } from '@shared/types';

export interface LoginPayload {
  readonly email: string;
  readonly password: string;
  readonly totpCode?: string;
}

export function useLogin() {
  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const res = await apiClient
        .post(EP.AUTH_LOGIN, { json: payload })
        .json<ApiResponse<LoginResponse>>();
      return res.data;
    },
    onError: (err: unknown) => parseApiError(err),
  });
}
