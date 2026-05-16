import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@medcord/api';
import { DrawerService } from '@medcord/ui';
import type { Immunization } from '../../../shared/types/emr.ts';

type ImmunizationListResponse = { data: { immunizations: readonly Immunization[] } };
type ImmunizationResponse = { data: { immunization: Immunization } };

export function useImmunizations(hospitalId: string, patientId: string) {
  return useQuery({
    queryKey: ['immunizations', hospitalId, patientId],
    queryFn: async () => {
      const r = await apiClient
        .get(`api/v1/hospitals/${hospitalId}/patients/${patientId}/chart/immunizations`)
        .json<ImmunizationListResponse>();
      return r.data.immunizations;
    },
    enabled: !!hospitalId && !!patientId,
  });
}

export interface AddImmunizationPayload {
  vaccine: string;
  dose?: string;
  administeredAt: string;
  lotNumber?: string;
  administrator: string;
  nextDueDate?: string;
}

export function useAddImmunization(hospitalId: string, patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AddImmunizationPayload) => {
      const r = await apiClient
        .post(`api/v1/hospitals/${hospitalId}/patients/${patientId}/chart/immunizations`, { json: payload })
        .json<ImmunizationResponse>();
      return r.data.immunization;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['immunizations', hospitalId, patientId] });
      DrawerService.toast('Immunization recorded.', { type: 'success' });
    },
    onError: (err: unknown) => {
      DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', { type: 'error' });
    },
  });
}
