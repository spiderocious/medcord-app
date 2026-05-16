import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, EP } from '@medcord/api';
import { DrawerService } from '@medcord/ui';

import type { AdminUser, AdminPaginatedResult, MembershipSummary } from '@shared/types/admin.ts';

export interface UsersFilters {
  readonly q: string;
  readonly isAdmin: 'all' | 'true' | 'false';
  readonly page: number;
}

export function useAdminUsers(filters: UsersFilters) {
  return useQuery({
    queryKey: ['admin-users', filters],
    staleTime: 30_000,
    queryFn: async () => {
      const searchParams: Record<string, string> = {
        page: String(filters.page),
        limit: '20',
      };
      if (filters.q.trim()) searchParams['q'] = filters.q.trim();
      if (filters.isAdmin !== 'all') searchParams['isAdmin'] = filters.isAdmin;

      const r = await apiClient
        .get(EP.ADMIN_USERS, { searchParams })
        .json<{ data: AdminPaginatedResult<AdminUser> }>();
      return r.data;
    },
  });
}

export function useAdminUser(userId: string) {
  return useQuery({
    queryKey: ['admin-user', userId],
    queryFn: async () => {
      const r = await apiClient
        .get(EP.ADMIN_USER(userId))
        .json<{ data: { user: AdminUser; memberships: MembershipSummary[] } }>();
      return r.data;
    },
  });
}

export function useUpdateAdminUser(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { isAdmin?: boolean; isEmailVerified?: boolean }) => {
      const r = await apiClient
        .patch(EP.ADMIN_USER_UPDATE(userId), { json: payload })
        .json<{ data: { user: AdminUser } }>();
      return r.data.user;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-user', userId] });
      void qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err: unknown) => {
      DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', {
        type: 'error',
      });
    },
  });
}

export function useDisableAdminUser(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiClient.post(EP.ADMIN_USER_DISABLE(userId));
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-user', userId] });
      DrawerService.toast('All sessions disabled.', { type: 'success' });
    },
    onError: (err: unknown) => {
      DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', {
        type: 'error',
      });
    },
  });
}
