import { Router, type IRouter } from 'express';

import { asyncHandler } from '@lib/http/asyncHandler.js';
import { ResponseUtil } from '@lib/response.js';
import { authenticate } from '@middlewares/auth.middleware.js';
import { hospitalScope } from '@middlewares/hospital-scope.middleware.js';
import { requireRole } from '@middlewares/require-role.middleware.js';

import {
  CreateHospitalBody,
  TransferOwnershipBody,
  UpdateBrandingBody,
  UpdateDomainBody,
  UpdateHospitalBody,
  UpdateModulesBody,
} from './hospital.schema.js';
import { hospitalService } from './hospital.service.js';

const router: IRouter = Router();

router.post(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const body = CreateHospitalBody.parse(req.body);
    const hospital = await hospitalService.create(req.user!.id, body);
    return ResponseUtil.created(res, { hospital });
  }),
);

router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const hospitals = await hospitalService.listMine(req.user!.id);
    return ResponseUtil.ok(res, { hospitals });
  }),
);

router.get(
  '/:hospitalId',
  authenticate,
  hospitalScope,
  asyncHandler(async (req, res) => {
    const hospital = await hospitalService.get(req.params['hospitalId'] as string);
    return ResponseUtil.ok(res, { hospital });
  }),
);

router.patch(
  '/:hospitalId',
  authenticate,
  hospitalScope,
  requireRole('super_admin', 'hospital_admin'),
  asyncHandler(async (req, res) => {
    const body = UpdateHospitalBody.parse(req.body);
    const hospital = await hospitalService.update(req.params['hospitalId'] as string, body);
    return ResponseUtil.ok(res, { hospital });
  }),
);

router.patch(
  '/:hospitalId/branding',
  authenticate,
  hospitalScope,
  requireRole('super_admin'),
  asyncHandler(async (req, res) => {
    const body = UpdateBrandingBody.parse(req.body);
    const hospital = await hospitalService.updateBranding(req.params['hospitalId'] as string, body);
    return ResponseUtil.ok(res, { hospital });
  }),
);

router.patch(
  '/:hospitalId/modules',
  authenticate,
  hospitalScope,
  requireRole('super_admin'),
  asyncHandler(async (req, res) => {
    const body = UpdateModulesBody.parse(req.body);
    const hospital = await hospitalService.updateModules(req.params['hospitalId'] as string, body);
    return ResponseUtil.ok(res, { hospital });
  }),
);

router.get(
  '/:hospitalId/domain',
  authenticate,
  hospitalScope,
  asyncHandler(async (req, res) => {
    const data = await hospitalService.getDomain(req.params['hospitalId'] as string);
    return ResponseUtil.ok(res, data);
  }),
);

router.patch(
  '/:hospitalId/domain',
  authenticate,
  hospitalScope,
  requireRole('super_admin'),
  asyncHandler(async (req, res) => {
    const body = UpdateDomainBody.parse(req.body);
    const hospital = await hospitalService.updateDomain(req.params['hospitalId'] as string, body);
    return ResponseUtil.ok(res, { hospital });
  }),
);

router.get(
  '/:hospitalId/usage',
  authenticate,
  hospitalScope,
  requireRole('super_admin', 'hospital_admin'),
  asyncHandler(async (req, res) => {
    const usage = await hospitalService.getUsage(req.params['hospitalId'] as string);
    return ResponseUtil.ok(res, usage);
  }),
);

router.post(
  '/:hospitalId/transfer-ownership',
  authenticate,
  hospitalScope,
  requireRole('super_admin'),
  asyncHandler(async (req, res) => {
    const body = TransferOwnershipBody.parse(req.body);
    const hospital = await hospitalService.transferOwnership(
      req.params['hospitalId'] as string,
      req.user!.id,
      body,
    );
    return ResponseUtil.ok(res, { hospital });
  }),
);

router.delete(
  '/:hospitalId',
  authenticate,
  hospitalScope,
  requireRole('super_admin'),
  asyncHandler(async (req, res) => {
    await hospitalService.archive(req.params['hospitalId'] as string, req.user!.id);
    return ResponseUtil.noContent(res);
  }),
);

export default router;
