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
  UpdatePatientBody,
} from './patient.schema.js';

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
      patientRepo.searchByHospital(hospitalId, query.q, skip, query.limit),
      patientRepo.countSearchByHospital(hospitalId, query.q),
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

  async checkIn(hospitalId: string, patientId: string, body: CheckInBody) {
    const id = await resolvePatientId(patientId);
    const link = await patientRepo.findHospitalPatient(hospitalId, id);
    if (!link) throw new NotFoundError('Patient');
    const update: Partial<IPatient> = { currentHospitalId: hospitalId, admissionStatus: 'outpatient' };
    if (body.department !== undefined) (update as Record<string, unknown>)['checkInDepartment'] = body.department;
    if (body.assignedTo !== undefined) (update as Record<string, unknown>)['assignedTo'] = body.assignedTo;
    return patientRepo.updateById(id, update as never);
  },

  async checkOut(hospitalId: string, patientId: string) {
    const id = await resolvePatientId(patientId);
    const link = await patientRepo.findHospitalPatient(hospitalId, id);
    if (!link) throw new NotFoundError('Patient');
    return patientRepo.updateById(id, { admissionStatus: 'outpatient' });
  },

  async admit(hospitalId: string, patientId: string, _body: AdmitBody) {
    const id = await resolvePatientId(patientId);
    const link = await patientRepo.findHospitalPatient(hospitalId, id);
    if (!link) throw new NotFoundError('Patient');
    return patientRepo.updateById(id, {
      admissionStatus: 'admitted',
      currentHospitalId: hospitalId,
    });
  },

  async discharge(hospitalId: string, patientId: string, _body: DischargeBody) {
    const id = await resolvePatientId(patientId);
    const link = await patientRepo.findHospitalPatient(hospitalId, id);
    if (!link) throw new NotFoundError('Patient');
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
};
