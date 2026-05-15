import { NotFoundError } from '@lib/errors.js';
import { newId } from '@lib/ids.js';
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
import { emrRepo } from './emr.repo.js';
import type {
  AddChartDocumentBody,
  AddImmunizationBody,
  AddMedicalHistoryBody,
  AddMedicationBody,
  AddProcedureBody,
  RecordVitalsBody,
  UpdateChartDocumentBody,
  UpdateMedicationBody,
} from './emr.schema.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeBmi(weight: number, height: number): number {
  const heightM = height / 100;
  return Math.round((weight / (heightM * heightM)) * 10) / 10;
}

function detectOutOfRange(data: RecordVitalsBody): string[] {
  const flags: string[] = [];

  if (data.bp_systolic !== undefined && (data.bp_systolic > 140 || data.bp_systolic < 90)) {
    flags.push('bp_systolic');
  }
  if (data.bp_diastolic !== undefined && (data.bp_diastolic > 90 || data.bp_diastolic < 60)) {
    flags.push('bp_diastolic');
  }
  if (data.hr !== undefined && (data.hr > 100 || data.hr < 60)) {
    flags.push('hr');
  }
  if (data.spo2 !== undefined && data.spo2 < 95) {
    flags.push('spo2');
  }
  if (data.temp !== undefined && (data.temp > 38.5 || data.temp < 36)) {
    flags.push('temp');
  }
  if (data.rr !== undefined && (data.rr > 20 || data.rr < 12)) {
    flags.push('rr');
  }

  return flags;
}

type AppendLogArgs = {
  hospitalId: string;
  patientId: string;
  userId: string;
  action: IChartAccessLog['action'];
  section: string;
  isBreakGlass?: boolean | undefined;
  reason?: string | undefined;
  ip?: string | undefined;
  userAgent?: string | undefined;
};

async function logAccess(args: AppendLogArgs): Promise<void> {
  await emrRepo.appendLog({
    hospitalId: args.hospitalId,
    patientId: args.patientId,
    accessedBy: args.userId,
    action: args.action,
    section: args.section,
    isBreakGlass: args.isBreakGlass ?? false,
    reason: args.reason,
    ip: args.ip,
    userAgent: args.userAgent,
    accessedAt: new Date(),
  });
}

// ── Chart Summary ─────────────────────────────────────────────────────────────

export interface ChartSummary {
  lastVitals: IVitals | null;
  activeMedicationsCount: number;
  diagnosesCount: number;
  recentProcedures: IProcedure[];
}

async function getChartSummary(
  hospitalId: string,
  patientId: string,
  userId: string,
): Promise<ChartSummary> {
  await logAccess({ hospitalId, patientId, userId, action: 'view_chart', section: 'summary' });

  const [vitals, medications, history, procedures] = await Promise.all([
    emrRepo.listVitals(patientId, hospitalId, 1),
    emrRepo.listMedications(patientId, hospitalId),
    emrRepo.getHistory(patientId, hospitalId),
    emrRepo.listProcedures(patientId, hospitalId),
  ]);

  const activeMedications = medications.filter((m) => m.status === 'active');
  const recentProcedures = (procedures as IProcedure[]).slice(0, 5);

  return {
    lastVitals: (vitals[0] as IVitals) ?? null,
    activeMedicationsCount: activeMedications.length,
    diagnosesCount: history?.diagnoses?.length ?? 0,
    recentProcedures,
  };
}

// ── Vitals ────────────────────────────────────────────────────────────────────

async function listVitals(
  hospitalId: string,
  patientId: string,
  userId: string,
  limit?: number,
): Promise<IVitals[]> {
  await logAccess({ hospitalId, patientId, userId, action: 'view_vitals', section: 'vitals' });
  return emrRepo.listVitals(patientId, hospitalId, limit) as Promise<IVitals[]>;
}

async function recordVitals(
  hospitalId: string,
  patientId: string,
  userId: string,
  body: RecordVitalsBody,
): Promise<IVitals> {
  const outOfRangeFields = detectOutOfRange(body);
  const isOutOfRange = outOfRangeFields.length > 0;

  let bmi: number | undefined;
  if (body.weight !== undefined && body.height !== undefined) {
    bmi = computeBmi(body.weight, body.height);
  }

  const vitals = await emrRepo.createVitals({
    id: newId.vitals(),
    hospitalId,
    patientId,
    recordedBy: userId,
    ...body,
    bmi,
    isOutOfRange,
    outOfRangeFields,
  });

  return vitals as unknown as IVitals;
}

// ── Medications ───────────────────────────────────────────────────────────────

async function listMedications(
  hospitalId: string,
  patientId: string,
  userId: string,
): Promise<IMedication[]> {
  await logAccess({
    hospitalId,
    patientId,
    userId,
    action: 'view_medications',
    section: 'medications',
  });
  return emrRepo.listMedications(patientId, hospitalId) as Promise<IMedication[]>;
}

async function addMedication(
  hospitalId: string,
  patientId: string,
  userId: string,
  body: AddMedicationBody,
): Promise<IMedication> {
  const medication = await emrRepo.createMedication({
    id: newId.medication(),
    hospitalId,
    patientId,
    recordedBy: userId,
    drug: body.drug,
    strength: body.strength,
    route: body.route,
    frequency: body.frequency,
    indication: body.indication,
    duration: body.duration,
    status: 'active',
    prescribedBy: userId,
    drugInteractionWarnings: body.drugInteractionWarnings,
    allergyWarnings: body.allergyWarnings,
  });

  return medication as unknown as IMedication;
}

async function updateMedication(
  hospitalId: string,
  patientId: string,
  userId: string,
  medId: string,
  body: UpdateMedicationBody,
): Promise<IMedication> {
  const existing = await emrRepo.findMedicationById(medId);
  if (!existing || existing.hospitalId !== hospitalId || existing.patientId !== patientId) {
    throw new NotFoundError('Medication');
  }

  const updateData: Partial<IMedication> = { status: body.status };

  if (body.status === 'discontinued' || body.status === 'on_hold') {
    updateData.discontinuedBy = userId;
    updateData.discontinuedAt = new Date();
    if (body.reason) {
      updateData.discontinuedReason = body.reason;
    }
  }

  const updated = await emrRepo.updateMedication(medId, updateData);
  if (!updated) throw new NotFoundError('Medication');

  return updated as unknown as IMedication;
}

// ── Medical History ───────────────────────────────────────────────────────────

async function getHistory(
  hospitalId: string,
  patientId: string,
  userId: string,
): Promise<IMedicalHistory | null> {
  await logAccess({ hospitalId, patientId, userId, action: 'view_history', section: 'history' });
  return emrRepo.getHistory(patientId, hospitalId) as Promise<IMedicalHistory | null>;
}

async function updateHistory(
  hospitalId: string,
  patientId: string,
  userId: string,
  body: AddMedicalHistoryBody,
): Promise<IMedicalHistory> {
  const updated = await emrRepo.upsertHistory(patientId, hospitalId, {
    recordedBy: userId,
    diagnoses: body.diagnoses as IMedicalHistory['diagnoses'],
    procedures: body.procedures as IMedicalHistory['procedures'],
    familyHistory: body.familyHistory,
    socialHistory: body.socialHistory as IMedicalHistory['socialHistory'],
    notes: body.notes,
  });

  return updated as unknown as IMedicalHistory;
}

// ── Procedures ────────────────────────────────────────────────────────────────

async function listProcedures(
  hospitalId: string,
  patientId: string,
  userId: string,
): Promise<IProcedure[]> {
  await logAccess({
    hospitalId,
    patientId,
    userId,
    action: 'view_procedures',
    section: 'procedures',
  });
  return emrRepo.listProcedures(patientId, hospitalId) as Promise<IProcedure[]>;
}

async function addProcedure(
  hospitalId: string,
  patientId: string,
  userId: string,
  body: AddProcedureBody,
): Promise<IProcedure> {
  const procedure = await emrRepo.createProcedure({
    id: newId.procedure(),
    hospitalId,
    patientId,
    recordedBy: userId,
    name: body.name,
    cptCode: body.cptCode,
    performedBy: body.performedBy,
    performedAt: body.performedAt,
    location: body.location,
    notes: body.notes,
    operativeNoteKey: body.operativeNoteKey,
    preOpChecklist: body.preOpChecklist,
    followUpDate: body.followUpDate,
  });

  return procedure as unknown as IProcedure;
}

// ── Immunizations ─────────────────────────────────────────────────────────────

async function listImmunizations(
  hospitalId: string,
  patientId: string,
  userId: string,
): Promise<IImmunization[]> {
  await logAccess({
    hospitalId,
    patientId,
    userId,
    action: 'view_immunizations',
    section: 'immunizations',
  });
  return emrRepo.listImmunizations(patientId, hospitalId) as Promise<IImmunization[]>;
}

async function addImmunization(
  hospitalId: string,
  patientId: string,
  userId: string,
  body: AddImmunizationBody,
): Promise<IImmunization> {
  const immunization = await emrRepo.createImmunization({
    id: newId.immunization(),
    hospitalId,
    patientId,
    recordedBy: userId,
    vaccine: body.vaccine,
    dose: body.dose,
    administeredAt: body.administeredAt,
    lotNumber: body.lotNumber,
    administrator: body.administrator,
    nextDueDate: body.nextDueDate,
  });

  return immunization as unknown as IImmunization;
}

// ── Chart Documents ───────────────────────────────────────────────────────────

async function listDocuments(
  hospitalId: string,
  patientId: string,
  userId: string,
): Promise<IChartDocument[]> {
  await logAccess({
    hospitalId,
    patientId,
    userId,
    action: 'view_documents',
    section: 'documents',
  });
  return emrRepo.listDocuments(patientId, hospitalId) as Promise<IChartDocument[]>;
}

async function addDocument(
  hospitalId: string,
  patientId: string,
  userId: string,
  body: AddChartDocumentBody,
): Promise<IChartDocument> {
  const doc = await emrRepo.createDocument({
    id: newId.chartDoc(),
    hospitalId,
    patientId,
    recordedBy: userId,
    title: body.title,
    category: body.category,
    fileKey: body.fileKey,
    uploadedBy: userId,
    isSensitive: body.isSensitive,
  });

  return doc as unknown as IChartDocument;
}

async function updateDocument(
  hospitalId: string,
  patientId: string,
  userId: string,
  docId: string,
  body: UpdateChartDocumentBody,
): Promise<IChartDocument> {
  const existing = await emrRepo.findDocumentById(docId);
  if (!existing || existing.hospitalId !== hospitalId || existing.patientId !== patientId) {
    throw new NotFoundError('Chart document');
  }

  const updated = await emrRepo.updateDocument(docId, body as Partial<IChartDocument>);
  if (!updated) throw new NotFoundError('Chart document');

  return updated as unknown as IChartDocument;
}

// ── Access Log ────────────────────────────────────────────────────────────────

async function getAccessLog(
  hospitalId: string,
  patientId: string,
  userId: string,
  page: number,
  limit: number,
): Promise<PaginatedResult<IChartAccessLog>> {
  return emrRepo.listAccessLogs(patientId, hospitalId, { page, limit });
}

// ── Break Glass ───────────────────────────────────────────────────────────────

async function breakGlass(
  hospitalId: string,
  patientId: string,
  userId: string,
  reason: string,
  ip?: string,
  userAgent?: string,
): Promise<void> {
  await logAccess({
    hospitalId,
    patientId,
    userId,
    action: 'break_glass',
    section: 'chart',
    isBreakGlass: true,
    reason,
    ip,
    userAgent,
  });
}

// ── Export ────────────────────────────────────────────────────────────────────

export const emrService = {
  getChartSummary,
  listVitals,
  recordVitals,
  listMedications,
  addMedication,
  updateMedication,
  getHistory,
  updateHistory,
  listProcedures,
  addProcedure,
  listImmunizations,
  addImmunization,
  listDocuments,
  addDocument,
  updateDocument,
  getAccessLog,
  breakGlass,
};
