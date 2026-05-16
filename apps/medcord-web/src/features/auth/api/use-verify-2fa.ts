import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, parseApiError, EP } from '@medcord/api';

export interface Verify2faPayload {
  readonly totpCode: string;
}

export function useVerify2fa() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Verify2faPayload) => {
      await apiClient.post(EP.AUTH_VERIFY_2FA, { json: payload });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
    onError: (err: unknown) => parseApiError(err),
  });
}
