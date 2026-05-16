import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppButton, AppText, DrawerService } from '@medcord/ui';
import { IconArrowLeft } from '@icons';
import { ROUTES } from '@shared/constants/routes.ts';
import { useHospitalSlug } from '@shared/hooks/use-hospital-slug.ts';
import { useAuth } from '@shared/hooks/use-auth.ts';
import { useRegisterPatient, type RegisterPatientPayload } from '../api/use-register-patient.ts';
import { DemographicsForm } from './parts/demographics-form.tsx';
import { EmergencyContactForm } from './parts/emergency-contact-form.tsx';
import { DuplicateWarning } from './parts/duplicate-warning.tsx';

type DemographicsValues = RegisterPatientPayload['demographics'];

const INITIAL_DEMOGRAPHICS: DemographicsValues = {
  firstName: '',
  lastName: '',
  preferredName: undefined,
  dateOfBirth: '',
  sex: 'other',
  gender: undefined,
  address: undefined,
  phone: undefined,
  email: undefined,
  religion: undefined,
  culturalPreferences: undefined,
};

const INITIAL_EMERGENCY = { name: '', relationship: '', phone: '' };

export function PatientRegisterScreen() {
  const slug = useHospitalSlug();
  const { activeHospitalId } = useAuth();
  const navigate = useNavigate();
  const mutation = useRegisterPatient(activeHospitalId ?? '');

  const [demographics, setDemographics] = useState(INITIAL_DEMOGRAPHICS);
  const [emergency, setEmergency] = useState(INITIAL_EMERGENCY);

  function buildPayload() {
    return {
      demographics: {
        ...demographics,
        firstName: demographics.firstName.trim(),
        lastName: demographics.lastName.trim(),
      },
      emergencyContact: emergency.name.trim()
        ? { name: emergency.name.trim(), relationship: emergency.relationship.trim(), phone: emergency.phone.trim() }
        : undefined,
    };
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate(buildPayload(), {
      onSuccess: ({ patient, possibleDuplicates }) => {
        if (possibleDuplicates.length > 0) {
          DrawerService.showCustomModal('Possible duplicates found', () => (
            <DuplicateWarning
              duplicates={possibleDuplicates}
              onConfirm={() => {
                DrawerService.dismissAllModals();
                navigate(ROUTES.HOSPITAL_PATIENT_PROFILE(slug, patient.patientCode));
              }}
              onCancel={() => {
                DrawerService.dismissAllModals();
              }}
            />
          ));
        } else {
          DrawerService.toast('Patient registered successfully.', { type: 'success' });
          navigate(ROUTES.HOSPITAL_PATIENT_PROFILE(slug, patient.patientCode));
        }
      },
      onError: (err: unknown) => {
        const message = err instanceof Error ? err.message : 'Registration failed.';
        DrawerService.toast(message, { type: 'error' });
      },
    });
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <AppButton
          variant="ghost"
          leadingIcon={<IconArrowLeft size={14} />}
          onClick={() => navigate(ROUTES.HOSPITAL_PATIENTS(slug))}
        >
          Patients
        </AppButton>
      </div>

      <div>
        <AppText variant="heading-2" className="text-charcoal-900">Register patient</AppText>
        <AppText variant="body-sm" className="mt-1 text-charcoal-700">
          Create a new patient record.
        </AppText>
      </div>

      <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-6 max-w-3xl">
        <DemographicsForm values={demographics} onChange={setDemographics} disabled={mutation.isPending} />
        <EmergencyContactForm values={emergency} onChange={setEmergency} disabled={mutation.isPending} />

        <div className="flex gap-3">
          <AppButton type="submit" loading={mutation.isPending}>Register patient</AppButton>
          <AppButton type="button" variant="ghost" onClick={() => navigate(ROUTES.HOSPITAL_PATIENTS(slug))} disabled={mutation.isPending}>Cancel</AppButton>
        </div>
      </form>
    </div>
  );
}
