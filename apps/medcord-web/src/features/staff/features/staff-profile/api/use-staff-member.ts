import { useQuery } from '@tanstack/react-query';

import { apiClient, EP } from '@medcord/api';
import type { ApiResponse } from '@shared/types/api.ts';
import type { StaffMember } from '../../../shared/types/staff.ts';

type StaffMemberResponse = ApiResponse<{ member: StaffMember }>

export function useStaffMember(hospitalId: string, memberId: string) {
  return useQuery({
    queryKey: ['staff-member', hospitalId, memberId],
    queryFn: () =>
      apiClient
        .get(EP.HOSPITAL_STAFF_MEMBER(hospitalId, memberId))
        .json<StaffMemberResponse>()
        .then((r) => r.data.member),
    enabled: hospitalId !== '' && memberId !== '',
  });
}
