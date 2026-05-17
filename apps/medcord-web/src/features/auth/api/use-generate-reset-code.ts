import { useMutation } from '@tanstack/react-query';
import { apiClient, EP } from '@medcord/api';
import { DrawerService } from '@medcord/ui';

export function useGenerateResetCode() {
  return useMutation({
    mutationFn: async (payload: { userId: string }) => {
      const r = await apiClient
        .post(EP.AUTH_GENERATE_RESET_CODE, { json: payload })
        .json<{ data: { code: string } }>();
      return r.data.code;
    },
    onError: (err: unknown) => {
      DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', { type: 'error' });
    },
  });
}
