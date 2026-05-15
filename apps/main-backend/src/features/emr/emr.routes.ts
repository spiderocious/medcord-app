import { Router, type IRouter } from 'express';

import { asyncHandler } from '@lib/http/asyncHandler.js';
import { ResponseUtil } from '@lib/response.js';
import { authenticate } from '@middlewares/auth.middleware.js';
import { hospitalScope } from '@middlewares/hospital-scope.middleware.js';
import { requireRole } from '@middlewares/require-role.middleware.js';
import { CLINICAL_ROLES, PRESCRIBER_ROLES } from '@shared/types/roles.types.js';

import {
  AddChartDocumentBody,
  AddImmunizationBody,
  AddMedicalHistoryBody,
  AddMedicationBody,
  AddProcedureBody,
  BreakGlassBody,
  RecordVitalsBody,
  UpdateChartDocumentBody,
  UpdateMedicationBody,
} from './emr.schema.js';
import { emrService } from './emr.service.js';

const router: IRouter = Router({ mergeParams: true });

// All EMR routes require authentication + hospital membership
router.use(authenticate, hospitalScope);

// ── Chart Summary ─────────────────────────────────────────────────────────────

router.get(
  '/chart',
  asyncHandler(async (req, res) => {
    const summary = await emrService.getChartSummary(
      req.params['hospitalId'] as string,
      req.params['patientId'] as string,
      req.user!.id,
    );
    return ResponseUtil.ok(res, { summary });
  }),
);

// ── Vitals ────────────────────────────────────────────────────────────────────

router.get(
  '/chart/vitals',
  asyncHandler(async (req, res) => {
    const limit = req.query['limit'] ? Number(req.query['limit']) : undefined;
    const vitals = await emrService.listVitals(
      req.params['hospitalId'] as string,
      req.params['patientId'] as string,
      req.user!.id,
      limit,
    );
    return ResponseUtil.ok(res, { vitals });
  }),
);

router.post(
  '/chart/vitals',
  asyncHandler(async (req, res) => {
    const body = RecordVitalsBody.parse(req.body);
    const vitals = await emrService.recordVitals(
      req.params['hospitalId'] as string,
      req.params['patientId'] as string,
      req.user!.id,
      body,
    );
    return ResponseUtil.created(res, { vitals });
  }),
);

// ── Medications ───────────────────────────────────────────────────────────────

router.get(
  '/chart/medications',
  asyncHandler(async (req, res) => {
    const medications = await emrService.listMedications(
      req.params['hospitalId'] as string,
      req.params['patientId'] as string,
      req.user!.id,
    );
    return ResponseUtil.ok(res, { medications });
  }),
);

router.post(
  '/chart/medications',
  requireRole(...PRESCRIBER_ROLES),
  asyncHandler(async (req, res) => {
    const body = AddMedicationBody.parse(req.body);
    const medication = await emrService.addMedication(
      req.params['hospitalId'] as string,
      req.params['patientId'] as string,
      req.user!.id,
      body,
    );
    return ResponseUtil.created(res, { medication });
  }),
);

router.patch(
  '/chart/medications/:medId',
  requireRole(...PRESCRIBER_ROLES),
  asyncHandler(async (req, res) => {
    const body = UpdateMedicationBody.parse(req.body);
    const medication = await emrService.updateMedication(
      req.params['hospitalId'] as string,
      req.params['patientId'] as string,
      req.user!.id,
      req.params['medId'] as string,
      body,
    );
    return ResponseUtil.ok(res, { medication });
  }),
);

// ── Medical History ───────────────────────────────────────────────────────────

router.get(
  '/chart/history',
  asyncHandler(async (req, res) => {
    const history = await emrService.getHistory(
      req.params['hospitalId'] as string,
      req.params['patientId'] as string,
      req.user!.id,
    );
    return ResponseUtil.ok(res, { history });
  }),
);

router.patch(
  '/chart/history',
  requireRole(...CLINICAL_ROLES),
  asyncHandler(async (req, res) => {
    const body = AddMedicalHistoryBody.parse(req.body);
    const history = await emrService.updateHistory(
      req.params['hospitalId'] as string,
      req.params['patientId'] as string,
      req.user!.id,
      body,
    );
    return ResponseUtil.ok(res, { history });
  }),
);

// ── Procedures ────────────────────────────────────────────────────────────────

router.get(
  '/chart/procedures',
  asyncHandler(async (req, res) => {
    const procedures = await emrService.listProcedures(
      req.params['hospitalId'] as string,
      req.params['patientId'] as string,
      req.user!.id,
    );
    return ResponseUtil.ok(res, { procedures });
  }),
);

router.post(
  '/chart/procedures',
  requireRole(...CLINICAL_ROLES),
  asyncHandler(async (req, res) => {
    const body = AddProcedureBody.parse(req.body);
    const procedure = await emrService.addProcedure(
      req.params['hospitalId'] as string,
      req.params['patientId'] as string,
      req.user!.id,
      body,
    );
    return ResponseUtil.created(res, { procedure });
  }),
);

// ── Immunizations ─────────────────────────────────────────────────────────────

router.get(
  '/chart/immunizations',
  asyncHandler(async (req, res) => {
    const immunizations = await emrService.listImmunizations(
      req.params['hospitalId'] as string,
      req.params['patientId'] as string,
      req.user!.id,
    );
    return ResponseUtil.ok(res, { immunizations });
  }),
);

router.post(
  '/chart/immunizations',
  requireRole(...CLINICAL_ROLES),
  asyncHandler(async (req, res) => {
    const body = AddImmunizationBody.parse(req.body);
    const immunization = await emrService.addImmunization(
      req.params['hospitalId'] as string,
      req.params['patientId'] as string,
      req.user!.id,
      body,
    );
    return ResponseUtil.created(res, { immunization });
  }),
);

// ── Chart Documents ───────────────────────────────────────────────────────────

router.get(
  '/chart/documents',
  asyncHandler(async (req, res) => {
    const documents = await emrService.listDocuments(
      req.params['hospitalId'] as string,
      req.params['patientId'] as string,
      req.user!.id,
    );
    return ResponseUtil.ok(res, { documents });
  }),
);

router.post(
  '/chart/documents',
  asyncHandler(async (req, res) => {
    const body = AddChartDocumentBody.parse(req.body);
    const document = await emrService.addDocument(
      req.params['hospitalId'] as string,
      req.params['patientId'] as string,
      req.user!.id,
      body,
    );
    return ResponseUtil.created(res, { document });
  }),
);

router.patch(
  '/chart/documents/:docId',
  asyncHandler(async (req, res) => {
    const body = UpdateChartDocumentBody.parse(req.body);
    const document = await emrService.updateDocument(
      req.params['hospitalId'] as string,
      req.params['patientId'] as string,
      req.user!.id,
      req.params['docId'] as string,
      body,
    );
    return ResponseUtil.ok(res, { document });
  }),
);

// ── Access Log ────────────────────────────────────────────────────────────────

router.get(
  '/chart/access-log',
  requireRole('super_admin', 'hospital_admin'),
  asyncHandler(async (req, res) => {
    const page = req.query['page'] ? Number(req.query['page']) : 1;
    const limit = req.query['limit'] ? Number(req.query['limit']) : 20;
    const result = await emrService.getAccessLog(
      req.params['hospitalId'] as string,
      req.params['patientId'] as string,
      req.user!.id,
      page,
      limit,
    );
    return ResponseUtil.ok(res, result);
  }),
);

// ── Break Glass ───────────────────────────────────────────────────────────────

router.post(
  '/chart/break-glass',
  asyncHandler(async (req, res) => {
    const body = BreakGlassBody.parse(req.body);
    await emrService.breakGlass(
      req.params['hospitalId'] as string,
      req.params['patientId'] as string,
      req.user!.id,
      body.reason,
      req.ip,
      req.headers['user-agent'],
    );
    return ResponseUtil.noContent(res);
  }),
);

export default router;
