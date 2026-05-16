import { useMutation } from '@tanstack/react-query';
import { apiClient, EP } from '@medcord/api';

export interface AcceptInvitationPayload {
  readonly name: string;
  readonly password: string;
}

export interface AcceptInvitationResult {
  readonly hospitalId: string;
  readonly hospitalSlug: string;
  readonly accessToken: string;
  readonly refreshToken: string;
}

interface AcceptInvitationResponse {
  readonly data: AcceptInvitationResult;
}

export function useAcceptInvitation(token: string) {
  return useMutation({
    mutationFn: (payload: AcceptInvitationPayload) =>
      apiClient
        .post(EP.INVITATION_ACCEPT(token), { json: payload })
        .json<AcceptInvitationResponse>()
        .then((r) => r.data),
  });
}
