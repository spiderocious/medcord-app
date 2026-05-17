import type { IPatient, ITransfer, ICheckInVisit, IPatientAdmission } from './patient.model.js';
import {
  HospitalPatientModel,
  PatientFavoriteModel,
  PatientModel,
  PatientRecentModel,
  TransferModel,
  CheckInVisitModel,
  DailyQueueCounterModel,
  PatientAdmissionModel,
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

  searchByHospital: async (hospitalId: string, q: string | undefined, skip: number, limit: number, admissionStatus?: string): Promise<IPatient[]> => {
    const linkedIds = await HospitalPatientModel.find({ hospitalId, isActive: true })
      .select('patientId')
      .lean();
    const ids = linkedIds.map((r) => r.patientId);
    const filter: Record<string, unknown> = { id: { $in: ids } };
    if (admissionStatus !== undefined) filter['admissionStatus'] = admissionStatus;
    if (q) {
      filter['$or'] = [
        { 'demographics.firstName': new RegExp(q, 'i') },
        { 'demographics.lastName': new RegExp(q, 'i') },
        { patientCode: new RegExp(q, 'i') },
      ];
    }
    return PatientModel.find(filter).skip(skip).limit(limit).lean() as Promise<IPatient[]>;
  },

  countSearchByHospital: async (hospitalId: string, q: string | undefined, admissionStatus?: string): Promise<number> => {
    const linkedIds = await HospitalPatientModel.find({ hospitalId, isActive: true })
      .select('patientId')
      .lean();
    const ids = linkedIds.map((r) => r.patientId);
    const filter: Record<string, unknown> = { id: { $in: ids } };
    if (admissionStatus !== undefined) filter['admissionStatus'] = admissionStatus;
    if (q) {
      filter['$or'] = [
        { 'demographics.firstName': new RegExp(q, 'i') },
        { 'demographics.lastName': new RegExp(q, 'i') },
        { patientCode: new RegExp(q, 'i') },
      ];
    }
    return PatientModel.countDocuments(filter);
  },

  countByAdmissionStatus: (hospitalId: string, admissionStatus: string) =>
    PatientModel.countDocuments({ currentHospitalId: hospitalId, admissionStatus } as Record<string, unknown>),

  countActiveVisits: (hospitalId: string) =>
    CheckInVisitModel.countDocuments({ hospitalId, checkedOutAt: { $exists: false } }),

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

  findOutgoingTransfers: (fromHospitalId: string) =>
    TransferModel.find({ fromHospitalId }).sort({ createdAt: -1 }).lean(),

  updateTransfer: (id: string, data: Partial<ITransfer>) =>
    TransferModel.findOneAndUpdate({ id }, { $set: data }, { new: true }).lean(),

  // ── Check-in visits ────────────────────────────────────────────────────────

  nextQueueNumber: async (hospitalId: string): Promise<number> => {
    const today = new Date().toISOString().slice(0, 10);
    const counter = await DailyQueueCounterModel.findOneAndUpdate(
      { hospitalId, date: today },
      { $inc: { lastNumber: 1 } },
      { upsert: true, new: true },
    ).lean();
    return counter!.lastNumber;
  },

  createVisit: (data: Omit<ICheckInVisit, 'createdAt' | 'updatedAt'>) =>
    CheckInVisitModel.create(data),

  findVisitById: (id: string) => CheckInVisitModel.findOne({ id }).lean(),

  findActiveVisitByPatient: (hospitalId: string, patientId: string) =>
    CheckInVisitModel.findOne({ hospitalId, patientId, checkedOutAt: { $exists: false } }).lean(),

  listActiveVisits: (hospitalId: string) =>
    CheckInVisitModel.find({ hospitalId, checkedOutAt: { $exists: false } })
      .sort({ queueNumber: 1 })
      .lean(),

  updateVisit: (id: string, data: Partial<ICheckInVisit>) =>
    CheckInVisitModel.findOneAndUpdate({ id }, { $set: data }, { new: true }).lean(),

  findVisitsByPatient: (patientId: string, hospitalId: string) =>
    CheckInVisitModel.find({ patientId, hospitalId }).sort({ checkedInAt: -1 }).lean(),

  // ── Admissions ─────────────────────────────────────────────────────────────

  createAdmission: (data: Omit<IPatientAdmission, 'createdAt' | 'updatedAt'>) =>
    PatientAdmissionModel.create(data),

  closeAdmission: (patientId: string, hospitalId: string, patch: Pick<IPatientAdmission, 'dischargedAt' | 'dischargedBy' | 'dischargeNotes'>) =>
    PatientAdmissionModel.findOneAndUpdate(
      { patientId, hospitalId, dischargedAt: { $exists: false } },
      { $set: patch },
      { new: true },
    ).lean(),

  findAdmissionsByPatient: (patientId: string, hospitalId: string) =>
    PatientAdmissionModel.find({ patientId, hospitalId }).sort({ admittedAt: -1 }).lean(),
};
