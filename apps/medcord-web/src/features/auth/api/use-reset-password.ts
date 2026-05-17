import { useMutation } from '@tanstack/react-query';
import { apiClient, EP } from '@medcord/api';

export interface ResetPasswordPayload {
  readonly code: string;
  readonly password: string;
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (payload: ResetPasswordPayload) => {
      await apiClient.post(EP.AUTH_RESET_PASSWORD, { json: payload });
    },
  });
}
