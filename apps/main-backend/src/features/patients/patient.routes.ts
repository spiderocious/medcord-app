import { Router, type IRouter } from 'express';

import { asyncHandler } from '@lib/http/asyncHandler.js';
import { ResponseUtil } from '@lib/response.js';
import { authenticate } from '@middlewares/auth.middleware.js';
import { hospitalScope } from '@middlewares/hospital-scope.middleware.js';
import { requirePermission } from '@middlewares/require-permission.middleware.js';
import { PERMISSIONS } from '@medcord/rbac';

import {
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
import { patientService } from './patient.service.js';

const router: IRouter = Router({ mergeParams: true });

router.post(
  '/',
  authenticate,
  hospitalScope,
  requirePermission(PERMISSIONS.PATIENT_CREATE),
  asyncHandler(async (req, res) => {
    const body = RegisterPatientBody.parse(req.body);
    const result = await patientService.register(
      req.params['hospitalId'] as string,
      req.user!.id,
      body,
    );
    return ResponseUtil.created(res, result);
  }),
);

router.get(
  '/',
  authenticate,
  hospitalScope,
  requirePermission(PERMISSIONS.PATIENT_VIEW),
  asyncHandler(async (req, res) => {
    const query = SearchPatientsQuery.parse(req.query);
    const result = await patientService.search(
      req.params['hospitalId'] as string,
      req.user!.id,
      query,
    );
    return ResponseUtil.ok(res, result);
  }),
);

router.get(
  '/recent',
  authenticate,
  hospitalScope,
  requirePermission(PERMISSIONS.PATIENT_VIEW),
  asyncHandler(async (req, res) => {
    const patients = await patientService.getRecent(req.user!.id, req.params['hospitalId'] as string);
    return ResponseUtil.ok(res, { patients });
  }),
);

router.get(
  '/:patientId',
  authenticate,
  hospitalScope,
  requirePermission(PERMISSIONS.PATIENT_VIEW),
  asyncHandler(async (req, res) => {
    const patient = await patientService.get(
      req.params['hospitalId'] as string,
      req.params['patientId'] as string,
      req.user!.id,
    );
    return ResponseUtil.ok(res, { patient });
  }),
);

router.patch(
  '/:patientId',
  authenticate,
  hospitalScope,
  requirePermission(PERMISSIONS.PATIENT_UPDATE),
  asyncHandler(async (req, res) => {
    const body = UpdatePatientBody.parse(req.body);
    const patient = await patientService.update(
      req.params['hospitalId'] as string,
      req.params['patientId'] as string,
      body,
    );
    return ResponseUtil.ok(res, { patient });
  }),
);

router.get(
  '/:patientId/id-card',
  authenticate,
  hospitalScope,
  requirePermission(PERMISSIONS.PATIENT_VIEW),
  asyncHandler(async (req, res) => {
    const data = await patientService.getIdCard(
      req.params['hospitalId'] as string,
      req.params['patientId'] as string,
    );
    return ResponseUtil.ok(res, data);
  }),
);

router.post(
  '/:patientId/id-card',
  authenticate,
  hospitalScope,
  requirePermission(PERMISSIONS.PATIENT_UPDATE),
  asyncHandler(async (req, res) => {
    const patient = await patientService.issueIdCard(
      req.params['hospitalId'] as string,
      req.params['patientId'] as string,
    );
    return ResponseUtil.ok(res, { patient });
  }),
);

router.delete(
  '/:patientId/id-card',
  authenticate,
  hospitalScope,
  requirePermission(PERMISSIONS.PATIENT_UPDATE),
  asyncHandler(async (req, res) => {
    await patientService.deactivateIdCard(
      req.params['hospitalId'] as string,
      req.params['patientId'] as string,
    );
    return ResponseUtil.noContent(res);
  }),
);

router.post(
  '/:patientId/checkin',
  authenticate,
  hospitalScope,
  requirePermission(PERMISSIONS.PATIENT_ADMIT),
  asyncHandler(async (req, res) => {
    const body = CheckInBody.parse(req.body);
    const patient = await patientService.checkIn(
      req.params['hospitalId'] as string,
      req.params['patientId'] as string,
      req.user!.id,
      body,
    );
    return ResponseUtil.ok(res, { patient });
  }),
);

router.patch(
  '/:patientId/admission',
  authenticate,
  hospitalScope,
  requirePermission(PERMISSIONS.PATIENT_ADMIT),
  asyncHandler(async (req, res) => {
    const body = UpdateAdmissionBody.parse(req.body);
    const patient = await patientService.updateAdmission(
      req.params['hospitalId'] as string,
      req.params['patientId'] as string,
      body,
    );
    return ResponseUtil.ok(res, { patient });
  }),
);

router.post(
  '/:patientId/checkout',
  authenticate,
  hospitalScope,
  requirePermission(PERMISSIONS.PATIENT_ADMIT),
  asyncHandler(async (req, res) => {
    const patient = await patientService.checkOut(
      req.params['hospitalId'] as string,
      req.params['patientId'] as string,
    );
    return ResponseUtil.ok(res, { patient });
  }),
);

router.post(
  '/:patientId/admit',
  authenticate,
  hospitalScope,
  requirePermission(PERMISSIONS.PATIENT_ADMIT),
  asyncHandler(async (req, res) => {
    const body = AdmitBody.parse(req.body);
    const patient = await patientService.admit(
      req.params['hospitalId'] as string,
      req.params['patientId'] as string,
      body,
    );
    return ResponseUtil.ok(res, { patient });
  }),
);

router.post(
  '/:patientId/discharge',
  authenticate,
  hospitalScope,
  requirePermission(PERMISSIONS.PATIENT_ADMIT),
  asyncHandler(async (req, res) => {
    const body = DischargeBody.parse(req.body);
    const patient = await patientService.discharge(
      req.params['hospitalId'] as string,
      req.params['patientId'] as string,
      body,
    );
    return ResponseUtil.ok(res, { patient });
  }),
);

router.post(
  '/:patientId/transfer',
  authenticate,
  hospitalScope,
  requirePermission(PERMISSIONS.PATIENT_TRANSFER),
  asyncHandler(async (req, res) => {
    const body = TransferBody.parse(req.body);
    const transfer = await patientService.requestTransfer(
      req.params['hospitalId'] as string,
      req.params['patientId'] as string,
      req.user!.id,
      body,
    );
    return ResponseUtil.created(res, { transfer });
  }),
);

router.post(
  '/:patientId/favorite',
  authenticate,
  hospitalScope,
  requirePermission(PERMISSIONS.PATIENT_VIEW),
  asyncHandler(async (req, res) => {
    await patientService.addFavorite(
      req.user!.id,
      req.params['hospitalId'] as string,
      req.params['patientId'] as string,
    );
    return ResponseUtil.noContent(res);
  }),
);

router.delete(
  '/:patientId/favorite',
  authenticate,
  hospitalScope,
  requirePermission(PERMISSIONS.PATIENT_VIEW),
  asyncHandler(async (req, res) => {
    await patientService.removeFavorite(
      req.user!.id,
      req.params['hospitalId'] as string,
      req.params['patientId'] as string,
    );
    return ResponseUtil.noContent(res);
  }),
);

export default router;
