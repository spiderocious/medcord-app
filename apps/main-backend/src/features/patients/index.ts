import type { Express } from 'express';

import { asyncHandler } from '@lib/http/asyncHandler.js';
import { ResponseUtil } from '@lib/response.js';
import { authenticate } from '@middlewares/auth.middleware.js';
import { hospitalScope } from '@middlewares/hospital-scope.middleware.js';
import { requirePermission } from '@middlewares/require-permission.middleware.js';
import { PERMISSIONS } from '@medcord/rbac';

import { UpdateVisitBody } from './patient.schema.js';
import patientRoutes from './patient.routes.js';
import { patientService } from './patient.service.js';

export const register = (app: Express): void => {
  app.use('/api/v1/hospitals/:hospitalId/patients', patientRoutes);

  // Transfers queue + accept/decline
  app.get(
    '/api/v1/hospitals/:hospitalId/transfers/incoming',
    authenticate,
    hospitalScope,
    requirePermission(PERMISSIONS.PATIENT_TRANSFER),
    asyncHandler(async (req, res) => {
      const transfers = await patientService.getIncomingTransfers(req.params['hospitalId'] as string);
      return ResponseUtil.ok(res, { transfers });
    }),
  );

  app.get(
    '/api/v1/hospitals/:hospitalId/transfers/outgoing',
    authenticate,
    hospitalScope,
    requirePermission(PERMISSIONS.PATIENT_TRANSFER),
    asyncHandler(async (req, res) => {
      const transfers = await patientService.getOutgoingTransfers(req.params['hospitalId'] as string);
      return ResponseUtil.ok(res, { transfers });
    }),
  );

  app.post(
    '/api/v1/hospitals/:hospitalId/transfers/:transferId/accept',
    authenticate,
    hospitalScope,
    requirePermission(PERMISSIONS.PATIENT_TRANSFER),
    asyncHandler(async (req, res) => {
      const transfer = await patientService.acceptTransfer(
        req.params['hospitalId'] as string,
        req.params['transferId'] as string,
        req.user!.id,
      );
      return ResponseUtil.ok(res, { transfer });
    }),
  );

  app.post(
    '/api/v1/hospitals/:hospitalId/transfers/:transferId/decline',
    authenticate,
    hospitalScope,
    requirePermission(PERMISSIONS.PATIENT_TRANSFER),
    asyncHandler(async (req, res) => {
      const transfer = await patientService.declineTransfer(
        req.params['hospitalId'] as string,
        req.params['transferId'] as string,
        req.user!.id,
      );
      return ResponseUtil.ok(res, { transfer });
    }),
  );

  // Platform-global patient code lookup
  app.get(
    '/api/v1/patients/lookup/:patientCode',
    authenticate,
    asyncHandler(async (req, res) => {
      const patient = await patientService.lookupByCode(req.params['patientCode'] as string);
      return ResponseUtil.ok(res, { patient });
    }),
  );

  // Visits (check-in queue)
  app.get(
    '/api/v1/hospitals/:hospitalId/visits',
    authenticate,
    hospitalScope,
    requirePermission(PERMISSIONS.PATIENT_VIEW),
    asyncHandler(async (req, res) => {
      const visits = await patientService.listActiveVisits(req.params['hospitalId'] as string);
      return ResponseUtil.ok(res, { visits });
    }),
  );

  app.patch(
    '/api/v1/hospitals/:hospitalId/visits/:visitId',
    authenticate,
    hospitalScope,
    requirePermission(PERMISSIONS.PATIENT_ADMIT),
    asyncHandler(async (req, res) => {
      const body = UpdateVisitBody.parse(req.body);
      const visit = await patientService.updateVisit(
        req.params['hospitalId'] as string,
        req.params['visitId'] as string,
        body,
      );
      return ResponseUtil.ok(res, { visit });
    }),
  );

  app.post(
    '/api/v1/hospitals/:hospitalId/visits/:visitId/checkout',
    authenticate,
    hospitalScope,
    requirePermission(PERMISSIONS.PATIENT_ADMIT),
    asyncHandler(async (req, res) => {
      const visit = await patientService.checkoutVisit(
        req.params['hospitalId'] as string,
        req.params['visitId'] as string,
        req.user!.id,
      );
      return ResponseUtil.ok(res, { visit });
    }),
  );

  // Favorites list
  app.get(
    '/api/v1/hospitals/:hospitalId/patients-favorites',
    authenticate,
    hospitalScope,
    asyncHandler(async (req, res) => {
      const patients = await patientService.getFavorites(
        req.user!.id,
        req.params['hospitalId'] as string,
      );
      return ResponseUtil.ok(res, { patients });
    }),
  );
};
