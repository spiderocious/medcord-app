import type { Express } from 'express';

import { asyncHandler } from '@lib/http/asyncHandler.js';
import { ResponseUtil } from '@lib/response.js';
import { authenticate } from '@middlewares/auth.middleware.js';
import { hospitalScope } from '@middlewares/hospital-scope.middleware.js';
import { patientService } from '@features/patients/patient.service.js';

import labRoutes from './lab.routes.js';
import { labService } from './lab.service.js';
import { CreateLabOrderFromHospitalBody, ListLabOrdersQuery } from './lab.schema.js';

export const register = (app: Express): void => {
  // Patient-scoped lab orders
  app.use(
    '/api/v1/hospitals/:hospitalId/patients/:patientId/labs',
    labRoutes,
  );

  // Hospital-wide lab orders list
  app.get(
    '/api/v1/hospitals/:hospitalId/labs',
    authenticate,
    hospitalScope,
    asyncHandler(async (req, res) => {
      const query = ListLabOrdersQuery.parse(req.query);
      const result = await labService.listByHospital(req.params['hospitalId'] as string, query);
      return ResponseUtil.ok(res, result);
    }),
  );

  // Hospital-wide lab order create (resolves CAE- or PAT- patient param)
  app.post(
    '/api/v1/hospitals/:hospitalId/labs',
    authenticate,
    hospitalScope,
    asyncHandler(async (req, res) => {
      const hospitalId = req.params['hospitalId'] as string;
      const body = CreateLabOrderFromHospitalBody.parse(req.body);
      const resolvedPatientId = await patientService.resolvePatient(hospitalId, body.patientId);
      const order = await labService.create(hospitalId, resolvedPatientId, req.user!.id, body);
      return ResponseUtil.created(res, { order });
    }),
  );
};
