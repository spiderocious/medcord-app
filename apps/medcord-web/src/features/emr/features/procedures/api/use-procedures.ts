import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@medcord/api';
import { DrawerService } from '@medcord/ui';
import type { Procedure } from '../../../shared/types/emr.ts';

type ProcedureListResponse = { data: { procedures: readonly Procedure[] } };
type ProcedureResponse = { data: { procedure: Procedure } };

export function useProcedures(hospitalId: string, patientId: string) {
  return useQuery({
    queryKey: ['procedures', hospitalId, patientId],
    queryFn: async () => {
      const r = await apiClient
        .get(`api/v1/hospitals/${hospitalId}/patients/${patientId}/chart/procedures`)
        .json<ProcedureListResponse>();
      return r.data.procedures;
    },
    enabled: !!hospitalId && !!patientId,
  });
}

export interface AddProcedurePayload {
  name: string;
  cptCode?: string;
  performedBy: string;
  performedAt: string;
  location?: string;
  notes?: string;
  operativeNoteKey?: string;
  preOpChecklist: {
    consentObtained: boolean;
    npoStatus: boolean;
    allergiesConfirmed: boolean;
    siteMarked: boolean;
  };
  followUpDate?: string;
}

export function useAddProcedure(hospitalId: string, patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AddProcedurePayload) => {
      const r = await apiClient
        .post(`api/v1/hospitals/${hospitalId}/patients/${patientId}/chart/procedures`, { json: payload })
        .json<ProcedureResponse>();
      return r.data.procedure;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['procedures', hospitalId, patientId] });
      void qc.invalidateQueries({ queryKey: ['chart-summary', hospitalId, patientId] });
      DrawerService.toast('Procedure recorded.', { type: 'success' });
    },
    onError: (err: unknown) => {
      DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', { type: 'error' });
    },
  });
}
