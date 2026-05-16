import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, EP } from '@medcord/api';
import { DrawerService } from '@medcord/ui';
import type { LabOrder, LabOrderListResult, LabOrderStatus } from '../../../shared/types/lab.ts';

type LabListResponse = { data: LabOrderListResult };
type LabOrderResponse = { data: { order: LabOrder } };

interface LabFilters {
  status?: LabOrderStatus;
  priority?: string;
  page?: number;
  limit?: number;
}

export function usePatientLabOrders(hospitalId: string, patientId: string, filters: LabFilters = {}) {
  return useQuery({
    queryKey: ['lab-orders', 'patient', hospitalId, patientId, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.priority) params.set('priority', filters.priority);
      if (filters.page) params.set('page', String(filters.page));
      if (filters.limit) params.set('limit', String(filters.limit));
      const qs = params.toString();
      const r = await apiClient
        .get(`api/v1/hospitals/${hospitalId}/patients/${patientId}/labs${qs ? `?${qs}` : ''}`)
        .json<LabListResponse>();
      return r.data;
    },
    enabled: !!hospitalId && !!patientId,
  });
}

export function useHospitalLabOrders(hospitalId: string, filters: LabFilters = {}) {
  return useQuery({
    queryKey: ['lab-orders', 'hospital', hospitalId, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.priority) params.set('priority', filters.priority);
      if (filters.page) params.set('page', String(filters.page));
      if (filters.limit) params.set('limit', String(filters.limit));
      const qs = params.toString();
      const r = await apiClient
        .get(`api/v1/hospitals/${hospitalId}/labs${qs ? `?${qs}` : ''}`)
        .json<LabListResponse>();
      return r.data;
    },
    enabled: !!hospitalId,
  });
}

export function useGetLabOrder(hospitalId: string, patientId: string, orderId: string) {
  return useQuery({
    queryKey: ['lab-order', hospitalId, patientId, orderId],
    queryFn: async () => {
      const r = await apiClient
        .get(EP.PATIENT_LAB_ORDER(hospitalId, patientId, orderId))
        .json<LabOrderResponse>();
      return r.data.order;
    },
    enabled: !!hospitalId && !!patientId && !!orderId,
  });
}

export function useCreateLabOrder(hospitalId: string, patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      testName: string;
      testCode?: string;
      category?: string;
      priority?: 'routine' | 'urgent' | 'stat';
      sampleType?: string;
      notes?: string;
    }) => {
      const r = await apiClient
        .post(`api/v1/hospitals/${hospitalId}/patients/${patientId}/labs`, { json: payload })
        .json<LabOrderResponse>();
      return r.data.order;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['lab-orders', 'patient', hospitalId, patientId] });
      void qc.invalidateQueries({ queryKey: ['lab-orders', 'hospital', hospitalId] });
      DrawerService.toast('Lab order created.', { type: 'success' });
    },
    onError: (err: unknown) => {
      DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', { type: 'error' });
    },
  });
}

export function useAdvanceLabStatus(hospitalId: string, patientId: string, orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { note?: string; sampleType?: string; sampleCollectedAt?: string }) => {
      const r = await apiClient
        .post(`api/v1/hospitals/${hospitalId}/patients/${patientId}/labs/${orderId}/advance`, { json: payload })
        .json<LabOrderResponse>();
      return r.data.order;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['lab-orders', 'patient', hospitalId, patientId] });
      void qc.invalidateQueries({ queryKey: ['lab-orders', 'hospital', hospitalId] });
      DrawerService.toast('Lab status advanced.', { type: 'success' });
    },
    onError: (err: unknown) => {
      DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', { type: 'error' });
    },
  });
}

export function useRecordLabResult(hospitalId: string, patientId: string, orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      value: string;
      unit?: string;
      referenceRange?: string;
      isAbnormal?: boolean;
      notes?: string;
      fileKey?: string;
    }) => {
      const r = await apiClient
        .post(`api/v1/hospitals/${hospitalId}/patients/${patientId}/labs/${orderId}/result`, { json: payload })
        .json<LabOrderResponse>();
      return r.data.order;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['lab-orders', 'patient', hospitalId, patientId] });
      void qc.invalidateQueries({ queryKey: ['lab-orders', 'hospital', hospitalId] });
      DrawerService.toast('Lab result recorded.', { type: 'success' });
    },
    onError: (err: unknown) => {
      DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', { type: 'error' });
    },
  });
}
