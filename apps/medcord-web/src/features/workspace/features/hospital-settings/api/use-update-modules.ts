import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient, EP } from '@medcord/api';
import type { Hospital, HospitalModules } from '@shared/types/hospital.ts';
import type { ApiResponse } from '@shared/types/api.ts';

type UpdateModulesPayload = Partial<HospitalModules>;

type UpdateModulesResponse = ApiResponse<{ hospital: Hospital }>

export function useUpdateModules(hospitalId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateModulesPayload) =>
      apiClient
        .patch(EP.HOSPITAL_MODULES(hospitalId), { json: payload })
        .json<UpdateModulesResponse>()
        .then((r) => r.data.hospital),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['hospital'] });
    },
  });
}
