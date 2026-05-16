import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient, EP } from '@medcord/api';
import type { Hospital } from '@shared/types/hospital.ts';
import type { ApiResponse } from '@shared/types/api.ts';

interface DomainInfo {
  readonly subdomain: string;
  readonly subdomainUrl: string;
  readonly customDomain?: string;
  readonly customDomainVerified: boolean;
}

type DomainResponse = ApiResponse<DomainInfo>
type UpdateDomainResponse = ApiResponse<{ hospital: Hospital }>

export function useHospitalDomain(hospitalId: string) {
  return useQuery({
    queryKey: ['hospital', hospitalId, 'domain'],
    queryFn: () =>
      apiClient
        .get(EP.HOSPITAL_DOMAIN(hospitalId))
        .json<DomainResponse>()
        .then((r) => r.data),
    enabled: hospitalId !== '',
  });
}

interface UpdateDomainPayload {
  readonly customDomain?: string;
  readonly customDomainVerified?: boolean;
}

export function useUpdateDomain(hospitalId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateDomainPayload) =>
      apiClient
        .patch(EP.HOSPITAL_DOMAIN(hospitalId), { json: payload })
        .json<UpdateDomainResponse>()
        .then((r) => r.data.hospital),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['hospital', hospitalId, 'domain'] });
      void queryClient.invalidateQueries({ queryKey: ['hospital'] });
    },
  });
}
