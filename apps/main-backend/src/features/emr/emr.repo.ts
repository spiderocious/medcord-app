import type { PaginatedResult } from '@shared/types/service.types.js';

import type {
  IChartAccessLog,
  IChartDocument,
  IImmunization,
  IMedicalHistory,
  IMedication,
  IProcedure,
  IVitals,
} from './emr.model.js';
import {
  ChartAccessLogModel,
  ChartDocumentModel,
  ImmunizationModel,
  MedicalHistoryModel,
  MedicationModel,
  ProcedureModel,
  VitalsModel,
} from './emr.model.js';

// ── Vitals ────────────────────────────────────────────────────────────────────

const createVitals = (data: Omit<IVitals, 'createdAt' | 'updatedAt'>) =>
  VitalsModel.create(data);

const listVitals = (patientId: string, hospitalId: string, limit = 20) =>
  VitalsModel.find({ patientId, hospitalId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

const findVitalsById = (id: string) => VitalsModel.findOne({ id }).lean();

// ── Medications ───────────────────────────────────────────────────────────────

const createMedication = (data: Omit<IMedication, 'createdAt' | 'updatedAt'>) =>
  MedicationModel.create(data);

const listMedications = (patientId: string, hospitalId: string) =>
  MedicationModel.find({ patientId, hospitalId }).sort({ createdAt: -1 }).lean();

const updateMedication = (id: string, data: Partial<IMedication>) =>
  MedicationModel.findOneAndUpdate({ id }, { $set: data }, { new: true }).lean();

const findMedicationById = (id: string) => MedicationModel.findOne({ id }).lean();

// ── Medical History ───────────────────────────────────────────────────────────

const upsertHistory = (
  patientId: string,
  hospitalId: string,
  data: Partial<Omit<IMedicalHistory, 'id' | 'hospitalId' | 'patientId' | 'createdAt' | 'updatedAt'>>,
) =>
  MedicalHistoryModel.findOneAndUpdate(
    { patientId, hospitalId },
    { $set: data },
    { upsert: true, new: true },
  ).lean();

const getHistory = (patientId: string, hospitalId: string) =>
  MedicalHistoryModel.findOne({ patientId, hospitalId }).lean();

// ── Procedures ────────────────────────────────────────────────────────────────

const createProcedure = (data: Omit<IProcedure, 'createdAt' | 'updatedAt'>) =>
  ProcedureModel.create(data);

const listProcedures = (patientId: string, hospitalId: string) =>
  ProcedureModel.find({ patientId, hospitalId }).sort({ performedAt: -1 }).lean();

// ── Immunizations ─────────────────────────────────────────────────────────────

const createImmunization = (data: Omit<IImmunization, 'createdAt' | 'updatedAt'>) =>
  ImmunizationModel.create(data);

const listImmunizations = (patientId: string, hospitalId: string) =>
  ImmunizationModel.find({ patientId, hospitalId }).sort({ administeredAt: -1 }).lean();

// ── Chart Documents ───────────────────────────────────────────────────────────

const createDocument = (data: Omit<IChartDocument, 'createdAt' | 'updatedAt'>) =>
  ChartDocumentModel.create(data);

const listDocuments = (patientId: string, hospitalId: string) =>
  ChartDocumentModel.find({ patientId, hospitalId }).sort({ createdAt: -1 }).lean();

const findDocumentById = (id: string) => ChartDocumentModel.findOne({ id }).lean();

const updateDocument = (id: string, data: Partial<IChartDocument>) =>
  ChartDocumentModel.findOneAndUpdate({ id }, { $set: data }, { new: true }).lean();

// ── Access Log ────────────────────────────────────────────────────────────────

const appendLog = (data: IChartAccessLog) => ChartAccessLogModel.create(data);

const listAccessLogs = async (
  patientId: string,
  hospitalId: string,
  filters: { page: number; limit: number },
): Promise<PaginatedResult<IChartAccessLog>> => {
  const skip = (filters.page - 1) * filters.limit;
  const query = { patientId, hospitalId };

  const [items, total] = await Promise.all([
    ChartAccessLogModel.find(query)
      .sort({ accessedAt: -1 })
      .skip(skip)
      .limit(filters.limit)
      .lean(),
    ChartAccessLogModel.countDocuments(query),
  ]);

  return {
    items: items as IChartAccessLog[],
    total,
    page: filters.page,
    limit: filters.limit,
    totalPages: Math.ceil(total / filters.limit),
  };
};

export const emrRepo = {
  // Vitals
  createVitals,
  listVitals,
  findVitalsById,
  // Medications
  createMedication,
  listMedications,
  updateMedication,
  findMedicationById,
  // History
  upsertHistory,
  getHistory,
  // Procedures
  createProcedure,
  listProcedures,
  // Immunizations
  createImmunization,
  listImmunizations,
  // Documents
  createDocument,
  listDocuments,
  findDocumentById,
  updateDocument,
  // Access log
  appendLog,
  listAccessLogs,
};
