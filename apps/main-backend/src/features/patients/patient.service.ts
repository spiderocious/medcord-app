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

export const patientService = {
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
    const rows = await patientRepo.findPatientIdsByHospital(hospitalId, skip, query.limit);
    const total = await patientRepo.countInHospital(hospitalId);
    const patients = await Promise.all(rows.map((r) => patientRepo.findById(r.patientId as string)));
    const valid = patients.filter(Boolean) as IPatient[];

    if (query.q) {
      const q = query.q.toLowerCase();
      const filtered = valid.filter(
        (p) =>
          p.demographics.firstName.toLowerCase().includes(q) ||
          p.demographics.lastName.toLowerCase().includes(q) ||
          p.patientCode.toLowerCase().includes(q),
      );
      await Promise.all(valid.map((p) => patientRepo.recordAccess(userId, hospitalId, p.id)));
      return { items: filtered, total, page: query.page, limit: query.limit, totalPages: Math.ceil(total / query.limit) };
    }

    await Promise.all(valid.map((p) => patientRepo.recordAccess(userId, hospitalId, p.id)));
    return { items: valid, total, page: query.page, limit: query.limit, totalPages: Math.ceil(total / query.limit) };
  },

  async get(hospitalId: string, patientId: string, userId: string) {
    const link = await patientRepo.findHospitalPatient(hospitalId, patientId);
    if (!link) throw new NotFoundError('Patient');
    const patient = await patientRepo.findById(patientId);
    if (!patient) throw new NotFoundError('Patient');
    await patientRepo.recordAccess(userId, hospitalId, patientId);
    return patient;
  },

  async lookupByCode(patientCode: string) {
    const patient = await patientRepo.findByCode(patientCode);
    if (!patient) throw new NotFoundError('Patient');
    return patient;
  },

  async update(hospitalId: string, patientId: string, body: UpdatePatientBody) {
    const link = await patientRepo.findHospitalPatient(hospitalId, patientId);
    if (!link) throw new NotFoundError('Patient');
    const updated = await patientRepo.updateById(patientId, body as Partial<IPatient>);
    if (!updated) throw new NotFoundError('Patient');
    return updated;
  },

  async getIdCard(hospitalId: string, patientId: string) {
    const link = await patientRepo.findHospitalPatient(hospitalId, patientId);
    if (!link) throw new NotFoundError('Patient');
    const patient = await patientRepo.findById(patientId);
    if (!patient) throw new NotFoundError('Patient');
    return { patient, idCard: patient.idCard };
  },

  async issueIdCard(hospitalId: string, patientId: string) {
    const link = await patientRepo.findHospitalPatient(hospitalId, patientId);
    if (!link) throw new NotFoundError('Patient');
    const now = new Date();
    const patient = await patientRepo.findById(patientId);
    const update = patient?.idCard.isActive
      ? { 'idCard.reissuedAt': now }
      : { 'idCard.isActive': true, 'idCard.issuedAt': now };
    const updated = await patientRepo.updateById(patientId, update as never);
    return updated;
  },

  async deactivateIdCard(hospitalId: string, patientId: string) {
    const link = await patientRepo.findHospitalPatient(hospitalId, patientId);
    if (!link) throw new NotFoundError('Patient');
    return patientRepo.updateById(patientId, { 'idCard.isActive': false } as never);
  },

  async checkIn(hospitalId: string, patientId: string, _body: CheckInBody) {
    const link = await patientRepo.findHospitalPatient(hospitalId, patientId);
    if (!link) throw new NotFoundError('Patient');
    return patientRepo.updateById(patientId, { currentHospitalId: hospitalId });
  },

  async checkOut(hospitalId: string, patientId: string) {
    const link = await patientRepo.findHospitalPatient(hospitalId, patientId);
    if (!link) throw new NotFoundError('Patient');
    return patientRepo.updateById(patientId, { admissionStatus: 'outpatient' });
  },

  async admit(hospitalId: string, patientId: string, _body: AdmitBody) {
    const link = await patientRepo.findHospitalPatient(hospitalId, patientId);
    if (!link) throw new NotFoundError('Patient');
    return patientRepo.updateById(patientId, {
      admissionStatus: 'admitted',
      currentHospitalId: hospitalId,
    });
  },

  async discharge(hospitalId: string, patientId: string, _body: DischargeBody) {
    const link = await patientRepo.findHospitalPatient(hospitalId, patientId);
    if (!link) throw new NotFoundError('Patient');
    return patientRepo.updateById(patientId, { admissionStatus: 'discharged' });
  },

  async requestTransfer(hospitalId: string, patientId: string, userId: string, body: TransferBody) {
    const link = await patientRepo.findHospitalPatient(hospitalId, patientId);
    if (!link) throw new NotFoundError('Patient');

    const toHospital = await hospitalRepo.findById(body.toHospitalId);
    if (!toHospital) throw new NotFoundError('Receiving hospital');

    const transfer = await patientRepo.createTransfer({
      id: newId.transfer(),
      patientId,
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

    await patientRepo.linkToHospital(hospitalId, transfer.patientId, '', userId);

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
    const link = await patientRepo.findHospitalPatient(hospitalId, patientId);
    if (!link) throw new NotFoundError('Patient');
    await patientRepo.addFavorite(userId, hospitalId, patientId);
  },

  async removeFavorite(userId: string, hospitalId: string, patientId: string) {
    await patientRepo.removeFavorite(userId, hospitalId, patientId);
  },

  async getFavorites(userId: string, hospitalId: string) {
    const favs = await patientRepo.getFavorites(userId, hospitalId);
    const patients = await Promise.all(favs.map((f) => patientRepo.findById(f.patientId as string)));
    return patients.filter(Boolean);
  },
};
