import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, EP } from '@medcord/api';
import { DrawerService } from '@medcord/ui';
import type { HospitalUnit, HospitalUnitType } from '@shared/types/hospital.ts';

type UnitsResponse = { data: { units: HospitalUnit[] } };
type UnitResponse = { data: { unit: HospitalUnit } };

export function useHospitalUnits(hospitalId: string) {
  return useQuery({
    queryKey: ['hospital-units', hospitalId],
    queryFn: async () => {
      const r = await apiClient.get(EP.HOSPITAL_UNITS(hospitalId)).json<UnitsResponse>();
      return r.data.units;
    },
    enabled: hospitalId !== '',
    staleTime: 1000 * 60,
  });
}

interface CreateUnitPayload {
  readonly name: string;
  readonly type: HospitalUnitType;
  readonly parentId?: string;
}

export function useCreateUnit(hospitalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateUnitPayload) => {
      const r = await apiClient
        .post(EP.HOSPITAL_UNITS(hospitalId), { json: payload })
        .json<UnitResponse>();
      return r.data.unit;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['hospital-units', hospitalId] });
      DrawerService.toast('Unit created.', { type: 'success' });
    },
    onError: (err: unknown) => {
      DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', { type: 'error' });
    },
  });
}

interface UpdateUnitPayload {
  readonly name?: string;
  readonly type?: HospitalUnitType;
  readonly parentId?: string;
  readonly isActive?: boolean;
}

export function useUpdateUnit(hospitalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ unitId, ...payload }: UpdateUnitPayload & { unitId: string }) => {
      const r = await apiClient
        .patch(EP.HOSPITAL_UNIT(hospitalId, unitId), { json: payload })
        .json<UnitResponse>();
      return r.data.unit;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['hospital-units', hospitalId] });
      DrawerService.toast('Unit updated.', { type: 'success' });
    },
    onError: (err: unknown) => {
      DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', { type: 'error' });
    },
  });
}

export function useDeleteUnit(hospitalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (unitId: string) => {
      await apiClient.delete(EP.HOSPITAL_UNIT(hospitalId, unitId));
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['hospital-units', hospitalId] });
      DrawerService.toast('Unit removed.', { type: 'success' });
    },
    onError: (err: unknown) => {
      DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', { type: 'error' });
    },
  });
}
