import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient, EP } from '@medcord/api';

import type { AdminUser } from '@shared/types/admin.ts';
import { tokenStorage } from '@shared/helpers/token-storage.ts';

interface LoginPayload {
  readonly email: string;
  readonly password: string;
}

interface LoginResponseData {
  readonly user: { readonly id: string; readonly email: string; readonly name: string };
  readonly tokens: { readonly accessToken: string; readonly refreshToken: string };
}

export function useAdminLogin() {
  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const r = await apiClient
        .post(EP.AUTH_LOGIN, { json: payload })
        .json<{ data: LoginResponseData }>();
      return r.data;
    },
  });
}

export function useAdminMe() {
  const hasToken = tokenStorage.getAccess() !== null;

  return useQuery({
    queryKey: ['admin', 'me'],
    enabled: hasToken,
    queryFn: async () => {
      const r = await apiClient
        .get(EP.AUTH_ME)
        .json<{ data: { user: AdminUser } }>();
      return r.data.user;
    },
  });
}
