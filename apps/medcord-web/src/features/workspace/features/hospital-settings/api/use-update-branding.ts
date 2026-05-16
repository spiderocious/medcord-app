import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient, EP } from '@medcord/api';
import type { Hospital } from '@shared/types/hospital.ts';
import type { ApiResponse } from '@shared/types/api.ts';

interface UpdateBrandingPayload {
  readonly logoKey?: string;
  readonly primaryColor?: string;
  readonly accentColor?: string;
  readonly idCardLogoPosition?: 'left' | 'center' | 'right';
  readonly idCardColorScheme?: string;
}

type UpdateBrandingResponse = ApiResponse<{ hospital: Hospital }>

export function useUpdateBranding(hospitalId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateBrandingPayload) =>
      apiClient
        .patch(EP.HOSPITAL_BRANDING(hospitalId), { json: payload })
        .json<UpdateBrandingResponse>()
        .then((r) => r.data.hospital),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['hospital'] });
    },
  });
}
