import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@medcord/api';
import { DrawerService } from '@medcord/ui';
import type { Patient, Transfer, IdCard } from '../../../shared/types/patient.ts';

type PatientResponse = { data: { patient: Patient } };
type TransferResponse = { data: { transfer: Transfer } };
type IdCardResponse = { data: { patient: Patient; idCard: IdCard } };

export function usePatient(hospitalId: string, patientId: string) {
  return useQuery({
    queryKey: ['patient', hospitalId, patientId],
    queryFn: async () => {
      const r = await apiClient
        .get(`api/v1/hospitals/${hospitalId}/patients/${patientId}`)
        .json<PatientResponse>();
      return r.data.patient;
    },
    enabled: !!hospitalId && !!patientId,
  });
}

export function useUpdatePatient(hospitalId: string, patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const r = await apiClient
        .patch(`api/v1/hospitals/${hospitalId}/patients/${patientId}`, { json: payload })
        .json<PatientResponse>();
      return r.data.patient;
    },
    onSuccess: (patient) => {
      void qc.invalidateQueries({ queryKey: ['patient', hospitalId, patientId] });
      void qc.invalidateQueries({ queryKey: ['patients', hospitalId] });
      DrawerService.toast(`${patient.demographics.firstName}'s record updated.`, { type: 'success' });
    },
    onError: (err: unknown) => {
      DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', { type: 'error' });
    },
  });
}

export function useCheckin(hospitalId: string, patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { department?: string; assignedNurseId?: string; assignedDoctorId?: string; notes?: string }) => {
      const r = await apiClient
        .post(`api/v1/hospitals/${hospitalId}/patients/${patientId}/checkin`, { json: payload })
        .json<PatientResponse>();
      return r.data.patient;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['patient', hospitalId, patientId] });
      DrawerService.toast('Patient checked in.', { type: 'success' });
    },
    onError: (err: unknown) => {
      DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', { type: 'error' });
    },
  });
}

export function useCheckout(hospitalId: string, patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const r = await apiClient
        .post(`api/v1/hospitals/${hospitalId}/patients/${patientId}/checkout`, { json: {} })
        .json<PatientResponse>();
      return r.data.patient;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['patient', hospitalId, patientId] });
      DrawerService.toast('Patient checked out.', { type: 'success' });
    },
    onError: (err: unknown) => {
      DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', { type: 'error' });
    },
  });
}

export function useAdmit(hospitalId: string, patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { department: string; assignedTo?: string; notes?: string }) => {
      const r = await apiClient
        .post(`api/v1/hospitals/${hospitalId}/patients/${patientId}/admit`, { json: payload })
        .json<PatientResponse>();
      return r.data.patient;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['patient', hospitalId, patientId] });
      DrawerService.toast('Patient admitted.', { type: 'success' });
    },
    onError: (err: unknown) => {
      DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', { type: 'error' });
    },
  });
}

export function useDischarge(hospitalId: string, patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { notes?: string; followUpDate?: string }) => {
      const r = await apiClient
        .post(`api/v1/hospitals/${hospitalId}/patients/${patientId}/discharge`, { json: payload })
        .json<PatientResponse>();
      return r.data.patient;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['patient', hospitalId, patientId] });
      DrawerService.toast('Patient discharged.', { type: 'success' });
    },
    onError: (err: unknown) => {
      DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', { type: 'error' });
    },
  });
}

export function useTransfer(hospitalId: string, patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      toHospitalId: string;
      reason: string;
      department?: string;
      recordsPackage?: {
        includeVitals: boolean;
        includeMedications: boolean;
        includeHistory: boolean;
        includeLabs: boolean;
        includeDocuments: boolean;
      };
    }) => {
      const r = await apiClient
        .post(`api/v1/hospitals/${hospitalId}/patients/${patientId}/transfer`, { json: payload })
        .json<TransferResponse>();
      return r.data.transfer;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['patient', hospitalId, patientId] });
      DrawerService.toast('Transfer request sent.', { type: 'success' });
    },
    onError: (err: unknown) => {
      DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', { type: 'error' });
    },
  });
}

export function useFavoritePatient(hospitalId: string, patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ favorite }: { favorite: boolean }) => {
      if (favorite) {
        await apiClient.post(`api/v1/hospitals/${hospitalId}/patients/${patientId}/favorite`, { json: {} });
      } else {
        await apiClient.delete(`api/v1/hospitals/${hospitalId}/patients/${patientId}/favorite`);
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['patients', 'favorites', hospitalId] });
    },
    onError: (err: unknown) => {
      DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', { type: 'error' });
    },
  });
}

export function useIdCard(hospitalId: string, patientId: string) {
  return useQuery({
    queryKey: ['patient-id-card', hospitalId, patientId],
    queryFn: async () => {
      const r = await apiClient
        .get(`api/v1/hospitals/${hospitalId}/patients/${patientId}/id-card`)
        .json<IdCardResponse>();
      return r.data;
    },
    enabled: !!hospitalId && !!patientId,
  });
}

export function useIssueIdCard(hospitalId: string, patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const r = await apiClient
        .post(`api/v1/hospitals/${hospitalId}/patients/${patientId}/id-card`, { json: {} })
        .json<PatientResponse>();
      return r.data.patient;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['patient-id-card', hospitalId, patientId] });
      DrawerService.toast('ID card issued.', { type: 'success' });
    },
    onError: (err: unknown) => {
      DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', { type: 'error' });
    },
  });
}

export function useDeactivateIdCard(hospitalId: string, patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiClient.delete(`api/v1/hospitals/${hospitalId}/patients/${patientId}/id-card`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['patient-id-card', hospitalId, patientId] });
      DrawerService.toast('ID card deactivated.', { type: 'success' });
    },
    onError: (err: unknown) => {
      DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', { type: 'error' });
    },
  });
}
