import { useMutation } from '@tanstack/react-query';
import { apiClient, parseApiError, EP } from '@medcord/api';

export interface ForgotPasswordPayload {
  readonly email: string;
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (payload: ForgotPasswordPayload) => {
      await apiClient.post(EP.AUTH_FORGOT_PASSWORD, { json: payload });
    },
    onError: (err: unknown) => parseApiError(err),
  });
}
