import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@medcord/api';
import type { Patient, PatientListResult } from '../../../shared/types/patient.ts';

interface PatientFilters {
  readonly q?: string;
  readonly page?: number;
  readonly limit?: number;
  readonly admissionStatus?: 'outpatient' | 'admitted' | 'discharged';
}

type PatientListResponse = { data: PatientListResult };
type RecentResponse = { data: { patients: readonly Patient[] } };
type FavoritesResponse = { data: { patients: readonly Patient[] } };

export function usePatients(hospitalId: string, filters: PatientFilters = {}) {
  return useQuery({
    queryKey: ['patients', hospitalId, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.q) params.set('q', filters.q);
      if (filters.page) params.set('page', String(filters.page));
      if (filters.limit) params.set('limit', String(filters.limit));
      if (filters.admissionStatus !== undefined) params.set('admissionStatus', filters.admissionStatus);
      const qs = params.toString();
      const r = await apiClient
        .get(`api/v1/hospitals/${hospitalId}/patients${qs ? `?${qs}` : ''}`)
        .json<PatientListResponse>();
      return r.data;
    },
    enabled: !!hospitalId,
  });
}

export function useRecentPatients(hospitalId: string) {
  return useQuery({
    queryKey: ['patients', 'recent', hospitalId],
    queryFn: async () => {
      const r = await apiClient
        .get(`api/v1/hospitals/${hospitalId}/patients/recent`)
        .json<RecentResponse>();
      return r.data.patients;
    },
    enabled: !!hospitalId,
  });
}

export function useFavoritePatients(hospitalId: string) {
  return useQuery({
    queryKey: ['patients', 'favorites', hospitalId],
    queryFn: async () => {
      const r = await apiClient
        .get(`api/v1/hospitals/${hospitalId}/patients-favorites`)
        .json<FavoritesResponse>();
      return r.data.patients;
    },
    enabled: !!hospitalId,
  });
}
