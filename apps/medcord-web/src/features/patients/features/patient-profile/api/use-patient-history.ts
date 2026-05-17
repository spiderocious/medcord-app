import { useQuery } from '@tanstack/react-query';
import { apiClient, EP } from '@medcord/api';
import type { PatientAdmission, CheckInVisit } from '../../../shared/types/patient.ts';

type AdmissionsResponse = { data: { admissions: PatientAdmission[] } };
type CheckInsResponse = { data: { visits: CheckInVisit[] } };

export function usePatientAdmissions(hospitalId: string, patientId: string) {
  return useQuery({
    queryKey: ['patient-admissions', hospitalId, patientId],
    queryFn: async () => {
      const r = await apiClient
        .get(EP.PATIENT_ADMISSIONS(hospitalId, patientId))
        .json<AdmissionsResponse>();
      return r.data.admissions;
    },
    enabled: !!hospitalId && !!patientId,
    staleTime: 1000 * 60 * 5,
  });
}

export function usePatientCheckIns(hospitalId: string, patientId: string) {
  return useQuery({
    queryKey: ['patient-checkins', hospitalId, patientId],
    queryFn: async () => {
      const r = await apiClient
        .get(EP.PATIENT_CHECK_INS(hospitalId, patientId))
        .json<CheckInsResponse>();
      return r.data.visits;
    },
    enabled: !!hospitalId && !!patientId,
    staleTime: 1000 * 60 * 5,
  });
}
