import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, EP } from '@medcord/api';
import { DrawerService } from '@medcord/ui';
import type { Permission, PermissionGroup } from '@medcord/rbac';
import type { CustomRole } from '@shared/types/staff.ts';

interface RolesPayload {
  roles: CustomRole[];
  permissionDescriptions: Record<Permission, string>;
  permissionGroups: PermissionGroup[];
}

export function useRoles(hospitalId: string) {
  return useQuery({
    queryKey: ['roles', hospitalId],
    staleTime: 60_000,
    queryFn: async () => {
      const r = await apiClient
        .get(EP.HOSPITAL_ROLES(hospitalId))
        .json<{ data: RolesPayload }>();
      return r.data;
    },
    enabled: hospitalId !== '',
  });
}

export function useCreateRole(hospitalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; slug: string; permissions: string[] }) => {
      const r = await apiClient
        .post(EP.HOSPITAL_ROLES(hospitalId), { json: payload })
        .json<{ data: { role: CustomRole } }>();
      return r.data.role;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['roles', hospitalId] });
      DrawerService.toast('Role created.', { type: 'success' });
    },
    onError: (err: unknown) => {
      DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', { type: 'error' });
    },
  });
}

export function useUpdateRole(hospitalId: string, roleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name?: string; permissions?: string[] }) => {
      const r = await apiClient
        .patch(EP.HOSPITAL_ROLE(hospitalId, roleId), { json: payload })
        .json<{ data: { role: CustomRole } }>();
      return r.data.role;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['roles', hospitalId] });
      DrawerService.toast('Role updated.', { type: 'success' });
    },
    onError: (err: unknown) => {
      DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', { type: 'error' });
    },
  });
}

export function useDeleteRole(hospitalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (roleId: string) => {
      await apiClient.delete(EP.HOSPITAL_ROLE(hospitalId, roleId)).json();
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['roles', hospitalId] });
      DrawerService.toast('Role deleted.', { type: 'success' });
    },
    onError: (err: unknown) => {
      DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', { type: 'error' });
    },
  });
}
