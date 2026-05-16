import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@medcord/api';
import { DrawerService } from '@medcord/ui';
import type { MedicalHistory, SocialHistory } from '../../../shared/types/emr.ts';

type HistoryResponse = { data: { history: MedicalHistory } };

export function useHistory(hospitalId: string, patientId: string) {
  return useQuery({
    queryKey: ['history', hospitalId, patientId],
    queryFn: async () => {
      const r = await apiClient
        .get(`api/v1/hospitals/${hospitalId}/patients/${patientId}/chart/history`)
        .json<HistoryResponse>();
      return r.data.history;
    },
    enabled: !!hospitalId && !!patientId,
  });
}

export interface UpdateHistoryPayload {
  diagnoses?: Array<{ icd10Code: string; description: string; diagnosedAt?: string }>;
  procedures?: Array<{ cptCode: string; description: string; performedAt?: string }>;
  familyHistory?: string[];
  socialHistory?: Partial<SocialHistory>;
  notes?: string;
}

export function useUpdateHistory(hospitalId: string, patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateHistoryPayload) => {
      const r = await apiClient
        .patch(`api/v1/hospitals/${hospitalId}/patients/${patientId}/chart/history`, { json: payload })
        .json<HistoryResponse>();
      return r.data.history;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['history', hospitalId, patientId] });
      void qc.invalidateQueries({ queryKey: ['chart-summary', hospitalId, patientId] });
      DrawerService.toast('Medical history updated.', { type: 'success' });
    },
    onError: (err: unknown) => {
      DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', { type: 'error' });
    },
  });
}
