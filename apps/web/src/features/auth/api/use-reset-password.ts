import { useMutation } from '@tanstack/react-query';
import { apiClient, parseApiError, EP } from '@medcord/api';

export interface ResetPasswordPayload {
  readonly token: string;
  readonly newPassword: string;
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (payload: ResetPasswordPayload) => {
      await apiClient.post(EP.AUTH_RESET_PASSWORD, { json: payload });
    },
    onError: (err: unknown) => parseApiError(err),
  });
}
