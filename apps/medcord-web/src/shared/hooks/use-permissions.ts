import { useMemo } from 'react';

import type { Permission } from '@medcord/rbac';
import { useMyMembership } from '@features/staff/features/staff-profile/api/use-my-membership.ts';
import { useAuth } from './use-auth.ts';

interface UsePermissionsResult {
  can: (permission: Permission) => boolean;
  isSuperAdmin: boolean;
  isLoaded: boolean;
}

export function usePermissions(): UsePermissionsResult {
  const { activeHospitalId } = useAuth();
  const { data: membership, isSuccess } = useMyMembership(activeHospitalId ?? '');

  return useMemo(() => {
    const isSuperAdmin = membership?.permissions === null;
    const permSet = new Set(membership?.permissions ?? []);

    return {
      can: (permission: Permission) => isSuperAdmin || permSet.has(permission),
      isSuperAdmin,
      isLoaded: isSuccess,
    };
  }, [membership, isSuccess]);
}
