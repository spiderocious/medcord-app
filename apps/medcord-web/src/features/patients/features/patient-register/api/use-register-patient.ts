import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@medcord/api';
import { DrawerService } from '@medcord/ui';
import type { Patient } from '../../../shared/types/patient.ts';

type RegisterResponse = { data: { patient: Patient; possibleDuplicates: readonly Patient[] } };

export interface RegisterPatientPayload {
  demographics: {
    firstName: string;
    lastName: string;
    preferredName?: string;
    dateOfBirth: string;
    sex: 'male' | 'female' | 'other';
    gender?: string;
    address?: string;
    phone?: string;
    email?: string;
    religion?: string;
    culturalPreferences?: string;
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  guarantor?: {
    name: string;
    relationship: string;
    phone?: string;
    address?: string;
  };
  photoKey?: string;
}

export function useRegisterPatient(hospitalId: string) {
  return useMutation({
    mutationFn: async (payload: RegisterPatientPayload) => {
      const r = await apiClient
        .post(`api/v1/hospitals/${hospitalId}/patients`, { json: payload })
        .json<RegisterResponse>();
      return r.data;
    },
    onError: (err: unknown) => {
      DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', { type: 'error' });
    },
  });
}
