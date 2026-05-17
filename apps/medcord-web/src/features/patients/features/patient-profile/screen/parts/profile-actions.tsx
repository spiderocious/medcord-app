import { useState } from 'react';
import { Switch, Case, Repeat } from 'meemaw';
import { AppButton, DrawerService } from '@medcord/ui';
import { useAuth } from '@shared/hooks/use-auth.ts';
import { useStaff } from '@features/staff/features/staff-directory/api/use-staff.ts';
import type { StaffMember } from '@features/staff/shared/types/staff.ts';
import type { Patient } from '../../../../shared/types/patient.ts';
import { useCheckin, useCheckout, useAdmit, useDischarge, useTransfer } from '../../api/use-patient.ts';

interface ProfileActionsProps {
  readonly patient: Patient;
  readonly hospitalId: string;
}

export function ProfileActions({ patient, hospitalId }: ProfileActionsProps) {
  const { activeHospitalId } = useAuth();
  const checkinMutation = useCheckin(hospitalId, patient.id);
  const checkoutMutation = useCheckout(hospitalId, patient.id);
  const admitMutation = useAdmit(hospitalId, patient.id);
  const dischargeMutation = useDischarge(hospitalId, patient.id);
  const transferMutation = useTransfer(hospitalId, patient.id);

  const { data: nurseData } = useStaff(activeHospitalId ?? '', { role: 'nurse', status: 'active', limit: 100 });
  const { data: doctorData } = useStaff(activeHospitalId ?? '', { role: 'doctor', status: 'active', limit: 100 });

  function handleCheckin() {
    DrawerService.showCustomModal('Check in patient', () => (
      <CheckinForm
        nurses={(nurseData?.items ?? []) as StaffMember[]}
        doctors={(doctorData?.items ?? []) as StaffMember[]}
        onConfirm={(dept, nurseId, doctorId) => {
          checkinMutation.mutate({ department: dept || undefined, assignedNurseId: nurseId || undefined, assignedDoctorId: doctorId || undefined });
          DrawerService.dismissAllModals();
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
      <AdmitForm onConfirm={(dept, assigned, notes) => {
        admitMutation.mutate({ department: dept, assignedTo: assigned || undefined, notes: notes || undefined });
        DrawerService.dismissAllModals();
      }} />
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
      <TransferForm onConfirm={(toHospitalId, reason) => {
        transferMutation.mutate({ toHospitalId, reason });
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

function CheckinForm({
  nurses,
  doctors,
  onConfirm,
}: {
  nurses: StaffMember[];
  doctors: StaffMember[];
  onConfirm: (dept: string, nurseId: string, doctorId: string) => void;
}) {
  const [dept, setDept] = useState('');
  const [nurseId, setNurseId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-charcoal-900">Department</label>
        <input value={dept} onChange={(e) => setDept(e.target.value)} className={INPUT_CLS} placeholder="e.g. Cardiology" />
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-900">Assign nurse</label>
        <select value={nurseId} onChange={(e) => setNurseId(e.target.value)} className={INPUT_CLS}>
          <option value="">— no nurse assigned —</option>
          <Repeat each={nurses}>
            {(n: StaffMember) => <option key={n.id} value={n.id}>{n.name}</option>}
          </Repeat>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-900">Assign doctor</label>
        <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className={INPUT_CLS}>
          <option value="">— no doctor assigned —</option>
          <Repeat each={doctors}>
            {(d: StaffMember) => <option key={d.id} value={d.id}>{d.name}</option>}
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

function AdmitForm({ onConfirm }: { onConfirm: (dept: string, assigned: string, notes: string) => void }) {
  const [dept, setDept] = useState('');
  const [assigned, setAssigned] = useState('');
  const [notes, setNotes] = useState('');
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-charcoal-900">Department <span className="text-red-500">*</span></label>
        <input value={dept} onChange={(e) => setDept(e.target.value)} className={INPUT_CLS} placeholder="e.g. ICU" />
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-900">Assigned to</label>
        <input value={assigned} onChange={(e) => setAssigned(e.target.value)} className={INPUT_CLS} placeholder="Staff name" />
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

function TransferForm({ onConfirm }: { onConfirm: (toHospitalId: string, reason: string) => void }) {
  const [toHospitalId, setToHospitalId] = useState('');
  const [reason, setReason] = useState('');
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
      <div className="flex justify-end gap-2 pt-2">
        <AppButton variant="ghost" onClick={() => DrawerService.dismissAllModals()}>Cancel</AppButton>
        <AppButton onClick={() => { if (!toHospitalId.trim() || !reason.trim()) return; onConfirm(toHospitalId.trim(), reason.trim()); }}>Send transfer request</AppButton>
      </div>
    </div>
  );
}
