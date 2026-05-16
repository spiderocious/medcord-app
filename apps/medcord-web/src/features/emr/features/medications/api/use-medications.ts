import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@medcord/api';
import { DrawerService } from '@medcord/ui';
import type { Medication, MedicationStatus } from '../../../shared/types/emr.ts';

type MedListResponse = { data: { medications: readonly Medication[] } };
type MedResponse = { data: { medication: Medication } };

export function useMedications(hospitalId: string, patientId: string) {
  return useQuery({
    queryKey: ['medications', hospitalId, patientId],
    queryFn: async () => {
      const r = await apiClient
        .get(`api/v1/hospitals/${hospitalId}/patients/${patientId}/chart/medications`)
        .json<MedListResponse>();
      return r.data.medications;
    },
    enabled: !!hospitalId && !!patientId,
  });
}

export interface AddMedicationPayload {
  drug: string;
  strength?: string;
  route?: string;
  frequency?: string;
  indication?: string;
  duration?: string;
  drugInteractionWarnings?: string[];
  allergyWarnings?: string[];
}

export function useAddMedication(hospitalId: string, patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AddMedicationPayload) => {
      const r = await apiClient
        .post(`api/v1/hospitals/${hospitalId}/patients/${patientId}/chart/medications`, { json: payload })
        .json<MedResponse>();
      return r.data.medication;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['medications', hospitalId, patientId] });
      void qc.invalidateQueries({ queryKey: ['chart-summary', hospitalId, patientId] });
      DrawerService.toast('Medication added.', { type: 'success' });
    },
    onError: (err: unknown) => {
      DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', { type: 'error' });
    },
  });
}

export function useUpdateMedication(hospitalId: string, patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ medId, status, reason }: { medId: string; status: MedicationStatus; reason?: string }) => {
      const r = await apiClient
        .patch(`api/v1/hospitals/${hospitalId}/patients/${patientId}/chart/medications/${medId}`, { json: { status, reason } })
        .json<MedResponse>();
      return r.data.medication;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['medications', hospitalId, patientId] });
      DrawerService.toast('Medication updated.', { type: 'success' });
    },
    onError: (err: unknown) => {
      DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', { type: 'error' });
    },
  });
}
