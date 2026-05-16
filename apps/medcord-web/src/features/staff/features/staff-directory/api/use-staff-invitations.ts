import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient, EP } from '@medcord/api';
import type { ApiResponse } from '@shared/types/api.ts';
import type { Invitation } from '../../../shared/types/staff.ts';

interface InvitationsResponse {
  readonly data: {
    readonly invitations: readonly Invitation[];
  };
}

export function useStaffInvitations(hospitalId: string) {
  return useQuery({
    queryKey: ['staff-invitations', hospitalId],
    queryFn: () =>
      apiClient
        .get(EP.HOSPITAL_INVITATIONS(hospitalId))
        .json<InvitationsResponse>()
        .then((r) => r.data.invitations),
    enabled: hospitalId !== '',
  });
}

type ResendResponse = ApiResponse<{ invitation: Invitation }>

export function useResendInvitation(hospitalId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) =>
      apiClient
        .post(EP.HOSPITAL_INVITATION_RESEND(hospitalId, invitationId))
        .json<ResendResponse>(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['staff-invitations', hospitalId] });
    },
  });
}

export function useRevokeInvitation(hospitalId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) =>
      apiClient.delete(EP.HOSPITAL_INVITATION(hospitalId, invitationId)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['staff-invitations', hospitalId] });
    },
  });
}
