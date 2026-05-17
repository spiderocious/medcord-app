import { Repeat, Show } from 'meemaw';
import { useNavigate } from 'react-router-dom';
import { IconUser } from '@icons';
import { AppText } from '@medcord/ui';
import { ROUTES } from '@shared/constants/routes.ts';
import type { Patient } from '../../../../shared/types/patient.ts';

const ADMISSION_STYLE: Record<string, string> = {
  outpatient: 'text-records-800 border-records-200 bg-records-50',
  admitted: 'text-patient-800 border-patient-200 bg-patient-50',
  discharged: 'text-charcoal-700 border-forest-900/10 bg-cream-50',
};

const ADMISSION_LABEL: Record<string, string> = {
  outpatient: 'Outpatient',
  admitted: 'Admitted',
  discharged: 'Discharged',
};

interface PatientTableProps {
  readonly patients: readonly Patient[];
  readonly slug: string;
}

export function PatientTable({ patients, slug }: PatientTableProps) {
  const navigate = useNavigate();

  return (
    <Show
      when={patients.length > 0}
      fallback={
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <IconUser size={32} className="text-charcoal-700/30" />
          <AppText variant="body-sm" className="text-charcoal-700">No patients found.</AppText>
        </div>
      }
    >
      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl border border-forest-900/10 md:block">
        <table className="min-w-full divide-y divide-forest-900/10 bg-white">
          <thead>
            <tr className="bg-cream-50">
              <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-charcoal-700/60">Patient</th>
              <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-charcoal-700/60">Code</th>
              <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-charcoal-700/60">Date of birth</th>
              <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-charcoal-700/60">Status</th>
              <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-charcoal-700/60">Contact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-forest-900/10">
            <Repeat each={patients as Patient[]}>
              {(patient: Patient) => (
                <tr
                  key={patient.id}
                  className="cursor-pointer hover:bg-cream-50/60 transition-colors"
                  onClick={() => navigate(ROUTES.HOSPITAL_PATIENT_PROFILE(slug, patient.patientCode))}
                >
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-charcoal-900">
                      {patient.demographics.firstName} {patient.demographics.lastName}
                    </p>
                    <Show when={patient.demographics.preferredName !== undefined}>
                      <p className="text-xs text-charcoal-700/60">"{patient.demographics.preferredName}"</p>
                    </Show>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-charcoal-700/60">{patient.patientCode}</td>
                  <td className="px-4 py-3 text-sm text-charcoal-700">
                    {new Date(patient.demographics.dateOfBirth).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${ADMISSION_STYLE[patient.admissionStatus] ?? ''}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                      {ADMISSION_LABEL[patient.admissionStatus] ?? patient.admissionStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-charcoal-700">
                    {patient.demographics.phone ?? <span className="text-charcoal-700/40">—</span>}
                  </td>
                </tr>
              )}
            </Repeat>
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-2 md:hidden">
        <Repeat each={patients as Patient[]}>
          {(patient: Patient) => (
            <button
              key={patient.id}
              type="button"
              className="w-full rounded-xl border border-forest-900/10 bg-white p-4 text-left transition-colors hover:bg-cream-50/60 active:bg-cream-50"
              onClick={() => navigate(ROUTES.HOSPITAL_PATIENT_PROFILE(slug, patient.patientCode))}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-charcoal-900">
                    {patient.demographics.firstName} {patient.demographics.lastName}
                  </p>
                  <p className="font-mono text-xs text-charcoal-700/60">{patient.patientCode}</p>
                </div>
                <span className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${ADMISSION_STYLE[patient.admissionStatus] ?? ''}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                  {ADMISSION_LABEL[patient.admissionStatus] ?? patient.admissionStatus}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-charcoal-700/60">
                <span>DOB {new Date(patient.demographics.dateOfBirth).toLocaleDateString()}</span>
                <Show when={patient.demographics.phone !== undefined}>
                  <span>{patient.demographics.phone}</span>
                </Show>
              </div>
            </button>
          )}
        </Repeat>
      </div>
    </Show>
  );
}
