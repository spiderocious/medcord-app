import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient, EP } from '@medcord/api';
import type { Hospital } from '@shared/types/hospital.ts';
import type { ApiResponse } from '@shared/types/api.ts';

interface UpdateHospitalPayload {
  readonly name?: string;
  readonly type?: Hospital['type'];
  readonly location?: string;
  readonly contact?: {
    readonly phone?: string;
    readonly email?: string;
    readonly address?: string;
  };
  readonly timezone?: string;
  readonly locale?: string;
  readonly businessHours?: string;
}

type UpdateHospitalResponse = ApiResponse<{ hospital: Hospital }>

export function useUpdateHospital(hospitalId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateHospitalPayload) =>
      apiClient
        .patch(EP.HOSPITAL(hospitalId), { json: payload })
        .json<UpdateHospitalResponse>()
        .then((r) => r.data.hospital),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['hospital'] });
    },
  });
}
