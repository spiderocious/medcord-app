import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, EP } from '@medcord/api';
import { DrawerService } from '@medcord/ui';
import type { PatientTransfer } from '@shared/types/patient.ts';

export function useIncomingTransfers(hospitalId: string) {
  return useQuery({
    queryKey: ['incoming-transfers', hospitalId],
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const r = await apiClient
        .get(EP.HOSPITAL_TRANSFERS_INCOMING(hospitalId))
        .json<{ data: { transfers: PatientTransfer[] } }>();
      return r.data.transfers;
    },
    enabled: hospitalId !== '',
    retry: 0,
  });
}

export function useOutgoingTransfers(hospitalId: string) {
  return useQuery({
    queryKey: ['outgoing-transfers', hospitalId],
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const r = await apiClient
        .get(EP.HOSPITAL_TRANSFERS_OUTGOING(hospitalId))
        .json<{ data: { transfers: PatientTransfer[] } }>();
      return r.data.transfers;
    },
    enabled: hospitalId !== '',
    retry: 0,
  });
}

export function useAcceptTransfer(hospitalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (transferId: string) => {
      const r = await apiClient
        .post(EP.HOSPITAL_TRANSFER_ACCEPT(hospitalId, transferId))
        .json<{ data: { transfer: PatientTransfer } }>();
      return r.data.transfer;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['incoming-transfers', hospitalId] });
      DrawerService.toast('Transfer accepted. Patient added to your hospital.', { type: 'success' });
    },
    onError: (err: unknown) => {
      DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', { type: 'error' });
    },
  });
}

export function useDeclineTransfer(hospitalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (transferId: string) => {
      const r = await apiClient
        .post(EP.HOSPITAL_TRANSFER_DECLINE(hospitalId, transferId))
        .json<{ data: { transfer: PatientTransfer } }>();
      return r.data.transfer;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['incoming-transfers', hospitalId] });
      DrawerService.toast('Transfer declined.', { type: 'success' });
    },
    onError: (err: unknown) => {
      DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', { type: 'error' });
    },
  });
}
