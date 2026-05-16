import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient, EP } from '@medcord/api';
import type { StaffRole } from '@shared/types/hospital.ts';
import type { ApiResponse } from '@shared/types/api.ts';
import type { StaffMember } from '../../../shared/types/staff.ts';

interface UpdateStaffPayload {
  readonly role?: StaffRole;
  readonly department?: string;
  readonly unit?: string;
  readonly specialty?: string;
  readonly managerId?: string;
}

type UpdateStaffResponse = ApiResponse<{ member: StaffMember }>

export function useUpdateStaff(hospitalId: string, memberId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateStaffPayload) =>
      apiClient
        .patch(EP.HOSPITAL_STAFF_MEMBER(hospitalId, memberId), { json: payload })
        .json<UpdateStaffResponse>()
        .then((r) => r.data.member),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['staff', hospitalId] });
      void queryClient.invalidateQueries({ queryKey: ['staff-member', hospitalId, memberId] });
    },
  });
}

export function useSuspendStaff(hospitalId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) =>
      apiClient.post(EP.HOSPITAL_STAFF_SUSPEND(hospitalId, memberId)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['staff', hospitalId] });
      void queryClient.invalidateQueries({ queryKey: ['staff-member', hospitalId] });
    },
  });
}

export function useActivateStaff(hospitalId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) =>
      apiClient.post(EP.HOSPITAL_STAFF_ACTIVATE(hospitalId, memberId)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['staff', hospitalId] });
      void queryClient.invalidateQueries({ queryKey: ['staff-member', hospitalId] });
    },
  });
}

export function useRemoveStaff(hospitalId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) =>
      apiClient.delete(EP.HOSPITAL_STAFF_MEMBER(hospitalId, memberId)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['staff', hospitalId] });
    },
  });
}
