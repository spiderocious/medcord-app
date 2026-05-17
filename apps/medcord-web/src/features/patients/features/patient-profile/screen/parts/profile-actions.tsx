import { useState } from 'react';
import { Switch, Case, Repeat, Show } from 'meemaw';
import { AppButton, DrawerService } from '@medcord/ui';
import { ROLES } from '@medcord/rbac';
import { useAuth } from '@shared/hooks/use-auth.ts';
import { useStaff } from '@features/staff/features/staff-directory/api/use-staff.ts';
import { useHospitalUnits } from '@features/workspace/features/hospital-settings/api/use-hospital-units.ts';
import type { StaffMember } from '@features/staff/shared/types/staff.ts';
import type { HospitalUnit } from '@shared/types/hospital.ts';
import type { Patient } from '../../../../shared/types/patient.ts';
import { useCheckin, useCheckout, useAdmit, useDischarge, useTransfer } from '../../api/use-patient.ts';

interface ProfileActionsProps {
  readonly patient: Patient;
  readonly hospitalId: string;
}

export function ProfileActions({ patient, hospitalId }: ProfileActionsProps) {
  const { activeHospitalId } = useAuth();
  const checkinMutation = useCheckin(hospitalId, patient.id, patient.patientCode);
  const checkoutMutation = useCheckout(hospitalId, patient.id, patient.patientCode);
  const admitMutation = useAdmit(hospitalId, patient.id, patient.patientCode);
  const dischargeMutation = useDischarge(hospitalId, patient.id, patient.patientCode);
  const transferMutation = useTransfer(hospitalId, patient.id, patient.patientCode);

  const { data: nurseData } = useStaff(activeHospitalId ?? '', { role: ROLES.NURSE, status: 'active', limit: 100 });
  const { data: npData } = useStaff(activeHospitalId ?? '', { role: ROLES.NURSE_PRACTITIONER, status: 'active', limit: 100 });
  const { data: paData } = useStaff(activeHospitalId ?? '', { role: ROLES.PHYSICIAN_ASSISTANT, status: 'active', limit: 100 });
  const { data: doctorData } = useStaff(activeHospitalId ?? '', { role: ROLES.DOCTOR, status: 'active', limit: 100 });
  const { data: unitsData } = useHospitalUnits(activeHospitalId ?? '');

  const clinicalStaff: StaffMember[] = [
    ...((nurseData?.items ?? []) as StaffMember[]),
    ...((npData?.items ?? []) as StaffMember[]),
    ...((paData?.items ?? []) as StaffMember[]),
    ...((doctorData?.items ?? []) as StaffMember[]),
  ];

  const departments: HospitalUnit[] = (unitsData ?? []).filter(
    (u) => u.type === 'department' && u.isActive,
  );

  function handleCheckin() {
    DrawerService.showCustomModal('Check in patient', () => (
      <CheckinForm
        departments={departments}
        nurses={(nurseData?.items ?? []) as StaffMember[]}
        doctors={(doctorData?.items ?? []) as StaffMember[]}
        onConfirm={(dept, nurseId, doctorId) => {
          checkinMutation.mutate({ department: dept || undefined, assignedNurseId: nurseId || undefined, assignedDoctorId: doctorId || undefined });
        }}
      />
    ));
  }

  function handleCheckout() {
    DrawerService.showConfirmationModal(
      'Check out patient',
      `Check out ${patient.demographics.firstName} ${patient.demographics.lastName}?`,
      {
        confirmButtonText: 'Check out',
        onConfirm: () => { checkoutMutation.mutate(); },
      }
    );
  }

  function handleAdmit() {
    DrawerService.showCustomModal('Admit patient', () => (
      <AdmitForm
        departments={departments}
        staff={clinicalStaff}
        onConfirm={(dept, assigned, notes) => {
          admitMutation.mutate({ department: dept, assignedTo: assigned || undefined, notes: notes || undefined });
          DrawerService.dismissAllModals();
        }}
      />
    ));
  }

  function handleDischarge() {
    DrawerService.showConfirmationModal(
      'Discharge patient',
      `Discharge ${patient.demographics.firstName} ${patient.demographics.lastName}?`,
      {
        destructive: true,
        confirmButtonText: 'Discharge',
        onConfirm: () => { dischargeMutation.mutate({}); },
      }
    );
  }

  function handleTransfer() {
    DrawerService.showCustomModal('Transfer patient', () => (
      <TransferForm onConfirm={(toHospitalId, reason, recordsPackage) => {
        transferMutation.mutate({ toHospitalId, reason, recordsPackage });
        DrawerService.dismissAllModals();
      }} />
    ));
  }

  const { admissionStatus } = patient;

  return (
    <div className="rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Actions</p>
      <div className="flex flex-wrap gap-2">
        <Switch>
          <Case when={admissionStatus === 'outpatient'}>
            <>
              <AppButton variant="secondary" onClick={handleCheckin} loading={checkinMutation.isPending}>Check in</AppButton>
              <AppButton variant="secondary" onClick={handleAdmit} loading={admitMutation.isPending}>Admit</AppButton>
            </>
          </Case>
          <Case when={admissionStatus === 'admitted'}>
            <>
              <AppButton variant="secondary" onClick={handleCheckout} loading={checkoutMutation.isPending}>Check out</AppButton>
              <AppButton variant="secondary" onClick={handleDischarge} loading={dischargeMutation.isPending}>Discharge</AppButton>
              <AppButton variant="ghost" onClick={handleTransfer} loading={transferMutation.isPending}>Transfer</AppButton>
            </>
          </Case>
          <Case when={admissionStatus === 'discharged'}>
            <AppButton variant="secondary" onClick={handleCheckin} loading={checkinMutation.isPending}>Re-admit (check in)</AppButton>
          </Case>
        </Switch>
      </div>
    </div>
  );
}

const INPUT_CLS = 'mt-1 block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 placeholder-charcoal-700/50 focus:border-forest-900 focus:outline-none';

interface CheckinFormProps {
  readonly departments: HospitalUnit[];
  readonly nurses: StaffMember[];
  readonly doctors: StaffMember[];
  readonly onConfirm: (dept: string, nurseId: string, doctorId: string) => void;
}

function CheckinForm({ departments, nurses, doctors, onConfirm }: CheckinFormProps) {
  const [dept, setDept] = useState('');
  const [nurseId, setNurseId] = useState('');
  const [doctorId, setDoctorId] = useState('');

  const hasDepartments = departments.length > 0;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-charcoal-900">Department</label>
        <Show when={hasDepartments}>
          <select value={dept} onChange={(e) => setDept(e.target.value)} className={INPUT_CLS}>
            <option value="">— none —</option>
            <Repeat each={departments}>
              {(d: HospitalUnit) => <option key={d.id} value={d.name}>{d.name}</option>}
            </Repeat>
          </select>
        </Show>
        <Show when={!hasDepartments}>
          <input value={dept} onChange={(e) => setDept(e.target.value)} className={INPUT_CLS} placeholder="e.g. Cardiology" />
        </Show>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-900">Assign nurse</label>
        <select value={nurseId} onChange={(e) => setNurseId(e.target.value)} className={INPUT_CLS}>
          <option value="">— no nurse assigned —</option>
          <Repeat each={nurses}>
            {(n: StaffMember) => <option key={n.id} value={n.id}>{n.name ?? n.id}</option>}
          </Repeat>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-900">Assign doctor</label>
        <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className={INPUT_CLS}>
          <option value="">— no doctor assigned —</option>
          <Repeat each={doctors}>
            {(d: StaffMember) => <option key={d.id} value={d.id}>{d.name ?? d.id}</option>}
          </Repeat>
        </select>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <AppButton variant="ghost" onClick={() => DrawerService.dismissAllModals()}>Cancel</AppButton>
        <AppButton onClick={() => onConfirm(dept, nurseId, doctorId)}>Check in</AppButton>
      </div>
    </div>
  );
}

interface AdmitFormProps {
  readonly departments: HospitalUnit[];
  readonly staff: StaffMember[];
  readonly onConfirm: (dept: string, assigned: string, notes: string) => void;
}

function AdmitForm({ departments, staff, onConfirm }: AdmitFormProps) {
  const [dept, setDept] = useState('');
  const [assigned, setAssigned] = useState('');
  const [notes, setNotes] = useState('');

  const hasDepartments = departments.length > 0;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-charcoal-900">Department <span className="text-red-500">*</span></label>
        <Show when={hasDepartments}>
          <select value={dept} onChange={(e) => setDept(e.target.value)} className={INPUT_CLS}>
            <option value="">— select department —</option>
            <Repeat each={departments}>
              {(d: HospitalUnit) => <option key={d.id} value={d.name}>{d.name}</option>}
            </Repeat>
          </select>
        </Show>
        <Show when={!hasDepartments}>
          <input value={dept} onChange={(e) => setDept(e.target.value)} className={INPUT_CLS} placeholder="e.g. ICU" />
        </Show>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-900">Assigned to</label>
        <select value={assigned} onChange={(e) => setAssigned(e.target.value)} className={INPUT_CLS}>
          <option value="">— unassigned —</option>
          <Repeat each={staff}>
            {(s: StaffMember) => <option key={s.id} value={s.id}>{s.name ?? s.id}</option>}
          </Repeat>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-900">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={INPUT_CLS} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <AppButton variant="ghost" onClick={() => DrawerService.dismissAllModals()}>Cancel</AppButton>
        <AppButton onClick={() => { if (!dept.trim()) return; onConfirm(dept, assigned, notes); }}>Admit</AppButton>
      </div>
    </div>
  );
}

interface RecordsPackage {
  includeVitals: boolean;
  includeMedications: boolean;
  includeHistory: boolean;
  includeLabs: boolean;
  includeDocuments: boolean;
}

function TransferForm({ onConfirm }: { onConfirm: (toHospitalId: string, reason: string, recordsPackage: RecordsPackage) => void }) {
  const [toHospitalId, setToHospitalId] = useState('');
  const [reason, setReason] = useState('');
  const [records, setRecords] = useState<RecordsPackage>({
    includeVitals: true,
    includeMedications: true,
    includeHistory: true,
    includeLabs: true,
    includeDocuments: false,
  });

  function toggleRecord(key: keyof RecordsPackage) {
    setRecords((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const RECORD_LABELS: { key: keyof RecordsPackage; label: string }[] = [
    { key: 'includeVitals', label: 'Vitals' },
    { key: 'includeMedications', label: 'Medications' },
    { key: 'includeHistory', label: 'History' },
    { key: 'includeLabs', label: 'Labs' },
    { key: 'includeDocuments', label: 'Documents' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-charcoal-900">Destination hospital ID <span className="text-red-500">*</span></label>
        <input value={toHospitalId} onChange={(e) => setToHospitalId(e.target.value)} className={INPUT_CLS} placeholder="Hospital ID" />
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-900">Reason <span className="text-red-500">*</span></label>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className={INPUT_CLS} />
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-900 mb-2">Records to include</label>
        <div className="flex flex-wrap gap-2">
          {RECORD_LABELS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleRecord(key)}
              className={[
                'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                records[key]
                  ? 'bg-forest-900 text-white border-forest-900'
                  : 'bg-white text-charcoal-700 border-forest-900/20 hover:border-forest-900/40',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <AppButton variant="ghost" onClick={() => DrawerService.dismissAllModals()}>Cancel</AppButton>
        <AppButton onClick={() => { if (!toHospitalId.trim() || !reason.trim()) return; onConfirm(toHospitalId.trim(), reason.trim(), records); }}>Send transfer request</AppButton>
      </div>
    </div>
  );
}
