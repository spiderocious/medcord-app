import { useMutation } from '@tanstack/react-query';
import { apiClient, EP } from '@medcord/api';

export interface ResetPasswordPayload {
  readonly code: string;
  readonly password: string;
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (payload: ResetPasswordPayload) => {
      const res = await apiClient.post(EP.AUTH_RESET_PASSWORD, {
        json: payload,
        throwHttpErrors: false,
      });
      if (!res.ok) {
        const body = await res.json() as { error?: { message?: string } };
        throw new Error(body?.error?.message ?? 'Something went wrong');
      }
    },
  });
}
