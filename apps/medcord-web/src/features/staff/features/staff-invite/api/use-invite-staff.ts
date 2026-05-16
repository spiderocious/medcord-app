import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient, EP } from '@medcord/api';
import type { StaffRole } from '@shared/types/hospital.ts';
import type { ApiResponse } from '@shared/types/api.ts';
import type { Invitation } from '../../../shared/types/staff.ts';

export interface InvitePayload {
  readonly email: string;
  readonly role: StaffRole;
  readonly department?: string;
  readonly unit?: string;
}

type InviteResponse = ApiResponse<{ invitation: Invitation }>

export function useInviteStaff(hospitalId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: InvitePayload) =>
      apiClient
        .post(EP.HOSPITAL_INVITATIONS(hospitalId), { json: payload })
        .json<InviteResponse>()
        .then((r) => r.data.invitation),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['staff-invitations', hospitalId] });
    },
  });
}

export interface BulkInviteEntry {
  readonly email: string;
  readonly role: StaffRole;
  readonly department?: string;
  readonly unit?: string;
}

type BulkInviteResponse = ApiResponse<{ invitations: readonly Invitation[] }>

export function useBulkInviteStaff(hospitalId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitations: ReadonlyArray<BulkInviteEntry>) =>
      apiClient
        .post(EP.HOSPITAL_INVITATIONS_BULK(hospitalId), { json: { invitations } })
        .json<BulkInviteResponse>()
        .then((r) => r.data.invitations),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['staff-invitations', hospitalId] });
    },
  });
}
