import { useMutation } from '@tanstack/react-query';
import { apiClient, EP } from '@medcord/api';

export function useVerifyResetCode() {
  return useMutation({
    mutationFn: async (payload: { code: string }) => {
      const r = await apiClient
        .post(EP.AUTH_VERIFY_RESET_CODE, { json: payload })
        .json<{ data: { valid: boolean } }>();
      return r.data;
    },
  });
}
