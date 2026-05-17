import { ConflictError, NotFoundError } from '@lib/errors.js';
import { newId } from '@lib/ids.js';
import { hospitalRepo } from '@features/hospitals/hospital.repo.js';
import type { PaginatedResult } from '@shared/types/service.types.js';

import { patientRepo } from './patient.repo.js';
import type { IPatient } from './patient.model.js';
import type {
  AdmitBody,
  CheckInBody,
  DischargeBody,
  RegisterPatientBody,
  SearchPatientsQuery,
  TransferBody,
  UpdateAdmissionBody,
  UpdatePatientBody,
  UpdateVisitBody,
} from './patient.schema.js';
import type { ICheckInVisit, IPatientAdmission, VisitStage } from './patient.model.js';

const VALID_TRANSITIONS: Record<VisitStage, readonly VisitStage[]> = {
  waiting_nurse:  ['with_nurse', 'waiting_doctor'],
  with_nurse:     ['waiting_doctor'],
  waiting_doctor: ['with_doctor'],
  with_doctor:    ['done'],
  done:           [],
};

async function resolvePatientId(param: string): Promise<string> {
  if (param.startsWith('CAE-')) {
    const patient = await patientRepo.findByCode(param);
    if (!patient) throw new NotFoundError('Patient');
    return patient.id;
  }
  return param;
}

export const patientService = {
  async resolvePatient(hospitalId: string, patientId: string): Promise<string> {
    const id = await resolvePatientId(patientId);
    const link = await patientRepo.findHospitalPatient(hospitalId, id);
    if (!link) throw new NotFoundError('Patient');
    return id;
  },

  async register(
    hospitalId: string,
    userId: string,
    body: RegisterPatientBody,
  ) {
    const { firstName, lastName, dateOfBirth } = body.demographics;
    const dupes = await patientRepo.findDuplicates(firstName, lastName, dateOfBirth);

    const patient = await patientRepo.create({
      id: newId.patient(),
      patientCode: newId.patientCode(),
      registeredByHospitalId: hospitalId,
      registeredByUserId: userId,
      demographics: body.demographics,
      emergencyContact: body.emergencyContact,
      guarantor: body.guarantor,
      photoKey: body.photoKey,
      documentKeys: body.documentKeys,
      idCard: { isActive: false },
      admissionStatus: 'outpatient',
      currentHospitalId: hospitalId,
    });

    await patientRepo.linkToHospital(hospitalId, patient.id, patient.patientCode, userId);
    await patientRepo.recordAccess(userId, hospitalId, patient.id);

    return { patient, possibleDuplicates: dupes };
  },

  async search(
    hospitalId: string,
    userId: string,
    query: SearchPatientsQuery,
  ): Promise<PaginatedResult<IPatient>> {
    const skip = (query.page - 1) * query.limit;
    const [patients, total] = await Promise.all([
      patientRepo.searchByHospital(hospitalId, query.q, skip, query.limit, query.admissionStatus),
      patientRepo.countSearchByHospital(hospitalId, query.q, query.admissionStatus),
    ]);
    await Promise.all(patients.map((p: IPatient) => patientRepo.recordAccess(userId, hospitalId, p.id)));
    return { items: patients, total, page: query.page, limit: query.limit, totalPages: Math.ceil(total / query.limit) };
  },

  async get(hospitalId: string, patientId: string, userId: string) {
    const id = await resolvePatientId(patientId);
    const link = await patientRepo.findHospitalPatient(hospitalId, id);
    if (!link) throw new NotFoundError('Patient');
    const patient = await patientRepo.findById(id);
    if (!patient) throw new NotFoundError('Patient');
    await patientRepo.recordAccess(userId, hospitalId, id);
    return patient;
  },

  async lookupByCode(patientCode: string) {
    const patient = await patientRepo.findByCode(patientCode);
    if (!patient) throw new NotFoundError('Patient');
    return patient;
  },

  async update(hospitalId: string, patientId: string, body: UpdatePatientBody) {
    const id = await resolvePatientId(patientId);
    const link = await patientRepo.findHospitalPatient(hospitalId, id);
    if (!link) throw new NotFoundError('Patient');
    const updated = await patientRepo.updateById(id, body as Partial<IPatient>);
    if (!updated) throw new NotFoundError('Patient');
    return updated;
  },

  async getIdCard(hospitalId: string, patientId: string) {
    const id = await resolvePatientId(patientId);
    const link = await patientRepo.findHospitalPatient(hospitalId, id);
    if (!link) throw new NotFoundError('Patient');
    const patient = await patientRepo.findById(id);
    if (!patient) throw new NotFoundError('Patient');
    return { patient, idCard: patient.idCard };
  },

  async issueIdCard(hospitalId: string, patientId: string) {
    const id = await resolvePatientId(patientId);
    const link = await patientRepo.findHospitalPatient(hospitalId, id);
    if (!link) throw new NotFoundError('Patient');
    const now = new Date();
    const patient = await patientRepo.findById(id);
    const update = patient?.idCard.isActive
      ? { 'idCard.reissuedAt': now }
      : { 'idCard.isActive': true, 'idCard.issuedAt': now };
    const updated = await patientRepo.updateById(id, update as never);
    return updated;
  },

  async deactivateIdCard(hospitalId: string, patientId: string) {
    const id = await resolvePatientId(patientId);
    const link = await patientRepo.findHospitalPatient(hospitalId, id);
    if (!link) throw new NotFoundError('Patient');
    return patientRepo.updateById(id, { 'idCard.isActive': false } as never);
  },

  async checkIn(hospitalId: string, patientId: string, checkedInBy: string, body: CheckInBody) {
    const id = await resolvePatientId(patientId);
    const link = await patientRepo.findHospitalPatient(hospitalId, id);
    if (!link) throw new NotFoundError('Patient');

    const patient = await patientRepo.findById(id);
    if (!patient) throw new NotFoundError('Patient');

    const queueNumber = await patientRepo.nextQueueNumber(hospitalId);
    const stage: VisitStage = body.assignedNurseId !== undefined ? 'waiting_nurse' : 'waiting_doctor';

    await patientRepo.createVisit({
      id: newId.visit(),
      hospitalId,
      patientId: id,
      patientCode: patient.patientCode,
      queueNumber,
      checkedInAt: new Date(),
      checkedInBy,
      assignedNurseId: body.assignedNurseId,
      nurseAssignedAt: body.assignedNurseId !== undefined ? new Date() : undefined,
      assignedDoctorId: body.assignedDoctorId,
      doctorAssignedAt: body.assignedDoctorId !== undefined ? new Date() : undefined,
      stage,
      department: body.department,
      notes: body.notes,
    });

    return patientRepo.updateById(id, { currentHospitalId: hospitalId, admissionStatus: 'outpatient' });
  },

  async checkOut(hospitalId: string, patientId: string) {
    const id = await resolvePatientId(patientId);
    const link = await patientRepo.findHospitalPatient(hospitalId, id);
    if (!link) throw new NotFoundError('Patient');
    return patientRepo.updateById(id, { admissionStatus: 'outpatient', currentHospitalId: undefined });
  },

  async admit(hospitalId: string, patientId: string, admittedBy: string, body: AdmitBody) {
    const id = await resolvePatientId(patientId);
    const link = await patientRepo.findHospitalPatient(hospitalId, id);
    if (!link) throw new NotFoundError('Patient');

    await patientRepo.createAdmission({
      id: newId.admission(),
      patientId: id,
      hospitalId,
      admittedAt: new Date(),
      admittedBy,
      department: body.department,
      assignedTo: body.assignedTo,
      notes: body.notes,
    });

    return patientRepo.updateById(id, {
      admissionStatus: 'admitted',
      currentHospitalId: hospitalId,
      assignedDoctorId: body.assignedTo,
    });
  },

  async updateAdmission(hospitalId: string, patientId: string, body: UpdateAdmissionBody) {
    const id = await resolvePatientId(patientId);
    const link = await patientRepo.findHospitalPatient(hospitalId, id);
    if (!link) throw new NotFoundError('Patient');
    const patch: Partial<IPatient> = {};
    if (body.assignedDoctorId !== undefined) patch.assignedDoctorId = body.assignedDoctorId;
    if (body.department !== undefined) (patch as Record<string, unknown>)['department'] = body.department;
    return patientRepo.updateById(id, patch);
  },

  async discharge(hospitalId: string, patientId: string, dischargedBy: string, body: DischargeBody) {
    const id = await resolvePatientId(patientId);
    const link = await patientRepo.findHospitalPatient(hospitalId, id);
    if (!link) throw new NotFoundError('Patient');

    await patientRepo.closeAdmission(id, hospitalId, {
      dischargedAt: new Date(),
      dischargedBy,
      dischargeNotes: body.notes,
    });

    return patientRepo.updateById(id, { admissionStatus: 'discharged' });
  },

  async requestTransfer(hospitalId: string, patientId: string, userId: string, body: TransferBody) {
    const id = await resolvePatientId(patientId);
    const link = await patientRepo.findHospitalPatient(hospitalId, id);
    if (!link) throw new NotFoundError('Patient');

    const toHospital = await hospitalRepo.findById(body.toHospitalId);
    if (!toHospital) throw new NotFoundError('Receiving hospital');

    const transfer = await patientRepo.createTransfer({
      id: newId.transfer(),
      patientId: id,
      fromHospitalId: hospitalId,
      toHospitalId: body.toHospitalId,
      reason: body.reason,
      department: body.department,
      recordsPackage: body.recordsPackage,
      status: 'pending',
      requestedBy: userId,
    });

    return transfer;
  },

  async getIncomingTransfers(hospitalId: string) {
    return patientRepo.findIncomingTransfers(hospitalId);
  },

  async getOutgoingTransfers(hospitalId: string) {
    return patientRepo.findOutgoingTransfers(hospitalId);
  },

  async acceptTransfer(hospitalId: string, transferId: string, userId: string) {
    const transfer = await patientRepo.findTransferById(transferId);
    if (!transfer || transfer.toHospitalId !== hospitalId) throw new NotFoundError('Transfer');
    if (transfer.status !== 'pending') throw new ConflictError('Transfer is no longer pending');

    const patient = await patientRepo.findById(transfer.patientId);
    if (!patient) throw new NotFoundError('Patient');
    await patientRepo.linkToHospital(hospitalId, transfer.patientId, patient.patientCode, userId);

    return patientRepo.updateTransfer(transferId, {
      status: 'accepted',
      respondedBy: userId,
      respondedAt: new Date(),
    });
  },

  async declineTransfer(hospitalId: string, transferId: string, userId: string) {
    const transfer = await patientRepo.findTransferById(transferId);
    if (!transfer || transfer.toHospitalId !== hospitalId) throw new NotFoundError('Transfer');
    if (transfer.status !== 'pending') throw new ConflictError('Transfer is no longer pending');

    return patientRepo.updateTransfer(transferId, {
      status: 'declined',
      respondedBy: userId,
      respondedAt: new Date(),
    });
  },

  async getRecent(userId: string, hospitalId: string) {
    const records = await patientRepo.getRecent(userId, hospitalId, 10);
    const patients = await Promise.all(
      records.map((r) => patientRepo.findById(r.patientId as string)),
    );
    return patients.filter(Boolean);
  },

  async addFavorite(userId: string, hospitalId: string, patientId: string) {
    const id = await resolvePatientId(patientId);
    const link = await patientRepo.findHospitalPatient(hospitalId, id);
    if (!link) throw new NotFoundError('Patient');
    await patientRepo.addFavorite(userId, hospitalId, id);
  },

  async removeFavorite(userId: string, hospitalId: string, patientId: string) {
    const id = await resolvePatientId(patientId);
    await patientRepo.removeFavorite(userId, hospitalId, id);
  },

  async getFavorites(userId: string, hospitalId: string) {
    const favs = await patientRepo.getFavorites(userId, hospitalId);
    const patients = await Promise.all(favs.map((f) => patientRepo.findById(f.patientId as string)));
    return patients.filter(Boolean);
  },

  // ── Visit / queue management ───────────────────────────────────────────────

  async listActiveVisits(hospitalId: string) {
    const visits = await patientRepo.listActiveVisits(hospitalId);
    const patients = await Promise.all(
      visits.map((v) => patientRepo.findById(v.patientId)),
    );
    return visits.map((v, i) => ({
      ...v,
      patient: patients[i]
        ? {
            id: patients[i]!.id,
            patientCode: patients[i]!.patientCode,
            firstName: patients[i]!.demographics.firstName,
            lastName: patients[i]!.demographics.lastName,
            photoKey: patients[i]!.photoKey,
          }
        : null,
    }));
  },

  async updateVisit(hospitalId: string, visitId: string, body: UpdateVisitBody) {
    const visit = await patientRepo.findVisitById(visitId);
    if (!visit || visit.hospitalId !== hospitalId) throw new NotFoundError('Visit');
    if (visit.checkedOutAt !== undefined) throw new ConflictError('Visit is already checked out');

    const patch: Partial<ICheckInVisit> = {};
    if (body.stage !== undefined) {
      if (!VALID_TRANSITIONS[visit.stage].includes(body.stage)) {
        throw new ConflictError(`Cannot transition visit from '${visit.stage}' to '${body.stage}'`);
      }
      patch.stage = body.stage;
    }
    if (body.assignedNurseId !== undefined) {
      patch.assignedNurseId = body.assignedNurseId;
      patch.nurseAssignedAt = new Date();
    }
    if (body.assignedDoctorId !== undefined) {
      patch.assignedDoctorId = body.assignedDoctorId;
      patch.doctorAssignedAt = new Date();
    }
    if (body.notes !== undefined) patch.notes = body.notes;
    if (body.department !== undefined) patch.department = body.department;

    return patientRepo.updateVisit(visitId, patch);
  },

  async checkoutVisit(hospitalId: string, visitId: string, checkedOutBy: string) {
    const visit = await patientRepo.findVisitById(visitId);
    if (!visit || visit.hospitalId !== hospitalId) throw new NotFoundError('Visit');
    if (visit.checkedOutAt !== undefined) throw new ConflictError('Visit is already checked out');

    await patientRepo.updateVisit(visitId, {
      checkedOutAt: new Date(),
      checkedOutBy,
      stage: 'done',
    });

    await patientRepo.updateById(visit.patientId, { admissionStatus: 'outpatient', currentHospitalId: undefined });

    return patientRepo.findVisitById(visitId);
  },

  async getAdmissions(hospitalId: string, patientId: string): Promise<IPatientAdmission[]> {
    const id = await resolvePatientId(patientId);
    const link = await patientRepo.findHospitalPatient(hospitalId, id);
    if (!link) throw new NotFoundError('Patient');
    return patientRepo.findAdmissionsByPatient(id, hospitalId) as Promise<IPatientAdmission[]>;
  },

  async getCheckIns(hospitalId: string, patientId: string): Promise<ICheckInVisit[]> {
    const id = await resolvePatientId(patientId);
    const link = await patientRepo.findHospitalPatient(hospitalId, id);
    if (!link) throw new NotFoundError('Patient');
    return patientRepo.findVisitsByPatient(id, hospitalId) as Promise<ICheckInVisit[]>;
  },

};
