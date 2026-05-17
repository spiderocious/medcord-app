import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@medcord/api';
import { DrawerService } from '@medcord/ui';
import type { CheckInVisit, VisitStage } from '../../../shared/types/patient.ts';

type VisitsResponse = { data: { visits: CheckInVisit[] } };
type VisitResponse = { data: { visit: CheckInVisit | null } };

export function useVisits(hospitalId: string) {
  return useQuery({
    queryKey: ['visits', hospitalId],
    queryFn: async () => {
      const r = await apiClient
        .get(`api/v1/hospitals/${hospitalId}/visits`)
        .json<VisitsResponse>();
      return r.data.visits;
    },
    enabled: hospitalId !== '',
    refetchInterval: 15_000,
  });
}

interface UpdateVisitPayload {
  readonly assignedNurseId?: string;
  readonly assignedDoctorId?: string;
  readonly stage?: VisitStage;
  readonly notes?: string;
  readonly department?: string;
}

export function useUpdateVisit(hospitalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ visitId, ...payload }: UpdateVisitPayload & { visitId: string }) => {
      const r = await apiClient
        .patch(`api/v1/hospitals/${hospitalId}/visits/${visitId}`, { json: payload })
        .json<VisitResponse>();
      return r.data.visit;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['visits', hospitalId] });
    },
    onError: (err: unknown) => {
      DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', { type: 'error' });
    },
  });
}

export function useCheckoutVisit(hospitalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (visitId: string) => {
      const r = await apiClient
        .post(`api/v1/hospitals/${hospitalId}/visits/${visitId}/checkout`, { json: {} })
        .json<VisitResponse>();
      return r.data.visit;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['visits', hospitalId] });
      void qc.invalidateQueries({ queryKey: ['patients', hospitalId] });
      DrawerService.toast('Patient checked out of queue.', { type: 'success' });
    },
    onError: (err: unknown) => {
      DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', { type: 'error' });
    },
  });
}
