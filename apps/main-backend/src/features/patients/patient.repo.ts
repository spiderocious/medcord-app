import type { IPatient, ITransfer } from './patient.model.js';
import {
  HospitalPatientModel,
  PatientFavoriteModel,
  PatientModel,
  PatientRecentModel,
  TransferModel,
} from './patient.model.js';

export const patientRepo = {
  // ── Patients ───────────────────────────────────────────────────────────────

  create: (data: Omit<IPatient, 'createdAt' | 'updatedAt'>) => PatientModel.create(data),

  findById: (id: string) => PatientModel.findOne({ id }).lean(),

  findByCode: (patientCode: string) => PatientModel.findOne({ patientCode }).lean(),

  findDuplicates: (firstName: string, lastName: string, dateOfBirth: Date) =>
    PatientModel.find({
      'demographics.firstName': new RegExp(`^${firstName}$`, 'i'),
      'demographics.lastName': new RegExp(`^${lastName}$`, 'i'),
      'demographics.dateOfBirth': dateOfBirth,
    })
      .limit(5)
      .lean(),

  updateById: (id: string, data: Partial<IPatient>) =>
    PatientModel.findOneAndUpdate({ id }, { $set: data }, { new: true }).lean(),

  // ── Hospital-scoped patient roster ─────────────────────────────────────────

  linkToHospital: (hospitalId: string, patientId: string, patientCode: string, addedBy: string) =>
    HospitalPatientModel.create({
      id: `HP-${patientId}-${hospitalId}`,
      hospitalId,
      patientId,
      patientCode,
      addedAt: new Date(),
      addedBy,
      isActive: true,
    }),

  findHospitalPatient: (hospitalId: string, patientId: string) =>
    HospitalPatientModel.findOne({ hospitalId, patientId }).lean(),

  searchInHospital: (
    hospitalId: string,
    q: string | undefined,
    skip: number,
    limit: number,
  ) => {
    const baseQuery = HospitalPatientModel.find({ hospitalId, isActive: true });
    if (q) {
      return baseQuery
        .populate({
          path: 'patientId',
          match: { $text: { $search: q } },
        })
        .skip(skip)
        .limit(limit)
        .lean();
    }
    return baseQuery.skip(skip).limit(limit).lean();
  },

  countInHospital: (hospitalId: string) =>
    HospitalPatientModel.countDocuments({ hospitalId, isActive: true }),

  findPatientIdsByHospital: (hospitalId: string, skip: number, limit: number) =>
    HospitalPatientModel.find({ hospitalId, isActive: true })
      .skip(skip)
      .limit(limit)
      .select('patientId patientCode')
      .lean(),

  // ── Recent access ──────────────────────────────────────────────────────────

  recordAccess: async (userId: string, hospitalId: string, patientId: string) => {
    await PatientRecentModel.findOneAndUpdate(
      { userId, hospitalId, patientId },
      { $set: { accessedAt: new Date() } },
      { upsert: true },
    );
  },

  getRecent: (userId: string, hospitalId: string, limit = 10) =>
    PatientRecentModel.find({ userId, hospitalId })
      .sort({ accessedAt: -1 })
      .limit(limit)
      .lean(),

  // ── Favorites ─────────────────────────────────────────────────────────────

  addFavorite: (userId: string, hospitalId: string, patientId: string) =>
    PatientFavoriteModel.create({ userId, hospitalId, patientId }).catch(() => null),

  removeFavorite: (userId: string, hospitalId: string, patientId: string) =>
    PatientFavoriteModel.deleteOne({ userId, hospitalId, patientId }),

  getFavorites: (userId: string, hospitalId: string) =>
    PatientFavoriteModel.find({ userId, hospitalId }).lean(),

  // ── Transfers ─────────────────────────────────────────────────────────────

  createTransfer: (data: Omit<ITransfer, 'createdAt' | 'updatedAt'>) =>
    TransferModel.create(data),

  findTransferById: (id: string) => TransferModel.findOne({ id }).lean(),

  findIncomingTransfers: (toHospitalId: string) =>
    TransferModel.find({ toHospitalId, status: 'pending' }).lean(),

  updateTransfer: (id: string, data: Partial<ITransfer>) =>
    TransferModel.findOneAndUpdate({ id }, { $set: data }, { new: true }).lean(),
};
