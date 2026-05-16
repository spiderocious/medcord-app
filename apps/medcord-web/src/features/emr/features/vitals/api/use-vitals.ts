import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@medcord/api';
import { DrawerService } from '@medcord/ui';
import type { Vitals } from '../../../shared/types/emr.ts';

type VitalsListResponse = { data: { vitals: readonly Vitals[] } };
type VitalsResponse = { data: { vitals: Vitals } };

export function useVitals(hospitalId: string, patientId: string) {
  return useQuery({
    queryKey: ['vitals', hospitalId, patientId],
    queryFn: async () => {
      const r = await apiClient
        .get(`api/v1/hospitals/${hospitalId}/patients/${patientId}/chart/vitals`)
        .json<VitalsListResponse>();
      return r.data.vitals;
    },
    enabled: !!hospitalId && !!patientId,
  });
}

export interface RecordVitalsPayload {
  bp_systolic?: number;
  bp_diastolic?: number;
  hr?: number;
  rr?: number;
  temp?: number;
  spo2?: number;
  weight?: number;
  height?: number;
  painScore?: number;
}

export function useRecordVitals(hospitalId: string, patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: RecordVitalsPayload) => {
      const r = await apiClient
        .post(`api/v1/hospitals/${hospitalId}/patients/${patientId}/chart/vitals`, { json: payload })
        .json<VitalsResponse>();
      return r.data.vitals;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['vitals', hospitalId, patientId] });
      void qc.invalidateQueries({ queryKey: ['chart-summary', hospitalId, patientId] });
      DrawerService.toast('Vitals recorded.', { type: 'success' });
    },
    onError: (err: unknown) => {
      DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', { type: 'error' });
    },
  });
}
