import { useQuery } from '@tanstack/react-query';

import { apiClient, EP } from '@medcord/api';
import type { ApiResponse } from '@shared/types/api.ts';
import type { StaffMember } from '../../../shared/types/staff.ts';

type StaffMemberResponse = ApiResponse<{ member: StaffMember }>;

export function useMyMembership(hospitalId: string) {
  return useQuery({
    queryKey: ['staff-member-me', hospitalId],
    queryFn: () =>
      apiClient
        .get(EP.HOSPITAL_STAFF_ME(hospitalId))
        .json<StaffMemberResponse>()
        .then((r) => r.data.member),
    enabled: hospitalId !== '',
  });
}
