import { useMutation } from '@tanstack/react-query';

import { apiClient, EP } from '@medcord/api';

export function useArchiveHospital(hospitalId: string) {
  return useMutation({
    mutationFn: () =>
      apiClient.delete(EP.HOSPITAL(hospitalId)),
  });
}
