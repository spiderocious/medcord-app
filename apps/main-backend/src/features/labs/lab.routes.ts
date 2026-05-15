import { Router, type IRouter } from 'express';

import { asyncHandler } from '@lib/http/asyncHandler.js';
import { ResponseUtil } from '@lib/response.js';
import { authenticate } from '@middlewares/auth.middleware.js';
import { hospitalScope } from '@middlewares/hospital-scope.middleware.js';

import {
  AdvanceStatusBody,
  CreateLabOrderBody,
  ListLabOrdersQuery,
  RecordResultBody,
  UpdateLabOrderBody,
} from './lab.schema.js';
import { labService } from './lab.service.js';

const router: IRouter = Router({ mergeParams: true });

// List all lab orders for a patient
router.get(
  '/',
  authenticate,
  hospitalScope,
  asyncHandler(async (req, res) => {
    const query = ListLabOrdersQuery.parse(req.query);
    const result = await labService.list(
      req.params['hospitalId'] as string,
      req.params['patientId'] as string,
      req.user!.id,
      query,
    );
    return ResponseUtil.ok(res, result);
  }),
);

// Create a lab order
router.post(
  '/',
  authenticate,
  hospitalScope,
  asyncHandler(async (req, res) => {
    const body = CreateLabOrderBody.parse(req.body);
    const order = await labService.create(
      req.params['hospitalId'] as string,
      req.params['patientId'] as string,
      req.user!.id,
      body,
    );
    return ResponseUtil.created(res, { order });
  }),
);

// Get a single lab order
router.get(
  '/:orderId',
  authenticate,
  hospitalScope,
  asyncHandler(async (req, res) => {
    const order = await labService.get(
      req.params['hospitalId'] as string,
      req.params['patientId'] as string,
      req.params['orderId'] as string,
    );
    return ResponseUtil.ok(res, { order });
  }),
);

// Update a lab order (before release)
router.patch(
  '/:orderId',
  authenticate,
  hospitalScope,
  asyncHandler(async (req, res) => {
    const body = UpdateLabOrderBody.parse(req.body);
    const order = await labService.update(
      req.params['hospitalId'] as string,
      req.params['patientId'] as string,
      req.params['orderId'] as string,
      body,
    );
    return ResponseUtil.ok(res, { order });
  }),
);

// Advance status through the state machine
router.post(
  '/:orderId/advance',
  authenticate,
  hospitalScope,
  asyncHandler(async (req, res) => {
    const body = AdvanceStatusBody.parse(req.body);
    const order = await labService.advanceStatus(
      req.params['hospitalId'] as string,
      req.params['patientId'] as string,
      req.params['orderId'] as string,
      req.user!.id,
      body,
    );
    return ResponseUtil.ok(res, { order });
  }),
);

// Record test result
router.post(
  '/:orderId/result',
  authenticate,
  hospitalScope,
  asyncHandler(async (req, res) => {
    const body = RecordResultBody.parse(req.body);
    const order = await labService.recordResult(
      req.params['hospitalId'] as string,
      req.params['patientId'] as string,
      req.params['orderId'] as string,
      body,
    );
    return ResponseUtil.ok(res, { order });
  }),
);

export default router;
