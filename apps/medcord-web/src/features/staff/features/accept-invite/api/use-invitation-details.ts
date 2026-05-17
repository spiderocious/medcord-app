import { useQuery } from '@tanstack/react-query';
import { apiClient, EP } from '@medcord/api';

export interface InvitationDetails {
  readonly invitation: {
    readonly email: string;
    readonly role: string;
    readonly department?: string;
    readonly expiresAt: string;
  };
  readonly hospital: {
    readonly name: string;
    readonly slug: string;
    readonly logoKey?: string;
    readonly location: string;
  };
  readonly invitedBy: {
    readonly name?: string;
  };
}

interface InvitationDetailsResponse {
  readonly data: InvitationDetails;
}

export function useInvitationDetails(token: string) {
  return useQuery({
    queryKey: ['invitation-details', token],
    queryFn: () =>
      apiClient
        .get(EP.INVITATION_GET(token))
        .json<InvitationDetailsResponse>()
        .then((r) => r.data),
    enabled: token !== '',
    retry: 0,
    retryOnMount: false,
  });
}
