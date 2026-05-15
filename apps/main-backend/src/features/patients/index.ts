import type { Express } from 'express';

import { asyncHandler } from '@lib/http/asyncHandler.js';
import { ResponseUtil } from '@lib/response.js';
import { authenticate } from '@middlewares/auth.middleware.js';
import { hospitalScope } from '@middlewares/hospital-scope.middleware.js';

import patientRoutes from './patient.routes.js';
import { patientService } from './patient.service.js';

export const register = (app: Express): void => {
  app.use('/api/v1/hospitals/:hospitalId/patients', patientRoutes);

  // Transfers queue + accept/decline
  app.get(
    '/api/v1/hospitals/:hospitalId/transfers/incoming',
    authenticate,
    hospitalScope,
    asyncHandler(async (req, res) => {
      const transfers = await patientService.getIncomingTransfers(req.params['hospitalId'] as string);
      return ResponseUtil.ok(res, { transfers });
    }),
  );

  app.post(
    '/api/v1/hospitals/:hospitalId/transfers/:transferId/accept',
    authenticate,
    hospitalScope,
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
