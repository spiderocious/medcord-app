import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient, EP } from '@medcord/api';
import type { HospitalType, Hospital } from '@shared/types/hospital.ts';

export interface CreateHospitalInput {
  readonly name: string;
  readonly type: HospitalType;
  readonly location: string;
  readonly subdomain: string;
  readonly contact?: {
    readonly phone?: string;
    readonly email?: string;
    readonly address?: string;
  };
  readonly timezone?: string;
  readonly locale?: string;
}

interface CreateHospitalResponse {
  readonly data: {
    readonly hospital: Hospital;
  };
}

export function useCreateHospital() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateHospitalInput) =>
      apiClient.post(EP.HOSPITALS, { json: input }).json<CreateHospitalResponse>(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['hospitals', 'mine'] });
    },
  });
}
