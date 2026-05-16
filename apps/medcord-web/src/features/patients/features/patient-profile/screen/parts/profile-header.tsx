import { Show } from 'meemaw';
import { AppButton } from '@medcord/ui';
import { IconStar, IconUser } from '@icons';
import type { Patient } from '../../../../shared/types/patient.ts';
import { useFavoritePatient } from '../../api/use-patient.ts';

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

interface ProfileHeaderProps {
  readonly patient: Patient;
  readonly hospitalId: string;
  readonly isFavorited: boolean;
}

export function ProfileHeader({ patient, hospitalId, isFavorited }: ProfileHeaderProps) {
  const favMutation = useFavoritePatient(hospitalId, patient.id);
  const { firstName, lastName, preferredName } = patient.demographics;

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-forest-900/10 text-forest-900">
          <IconUser size={24} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-charcoal-900">
              {firstName} {lastName}
            </h1>
            <Show when={preferredName !== undefined}>
              <span className="text-sm text-charcoal-700/60">"{preferredName}"</span>
            </Show>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-mono text-xs text-charcoal-700/60">{patient.patientCode}</span>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${ADMISSION_STYLE[patient.admissionStatus] ?? ''}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
              {ADMISSION_LABEL[patient.admissionStatus] ?? patient.admissionStatus}
            </span>
          </div>
        </div>
      </div>

      <AppButton
        variant="ghost"
        leadingIcon={<IconStar size={14} />}
        loading={favMutation.isPending}
        onClick={() => favMutation.mutate({ favorite: !isFavorited })}
      >
        {isFavorited ? 'Unfavorite' : 'Favorite'}
      </AppButton>
    </div>
  );
}
