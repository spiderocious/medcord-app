import { Router, type IRouter } from 'express';

import { asyncHandler } from '@lib/http/asyncHandler.js';
import { ResponseUtil } from '@lib/response.js';
import { authenticate } from '@middlewares/auth.middleware.js';
import { hospitalScope } from '@middlewares/hospital-scope.middleware.js';
import { requirePermission } from '@middlewares/require-permission.middleware.js';
import { PERMISSIONS } from '@medcord/rbac';

import {
  AddAssetPhotoBody,
  CreateAssetBody,
  ListAssetsQuery,
  MoveAssetBody,
  UpdateAssetBody,
  UpdateAssetStatusBody,
} from './asset.schema.js';
import { assetService } from './asset.service.js';

const router: IRouter = Router({ mergeParams: true });

router.get(
  '/',
  authenticate,
  hospitalScope,
  requirePermission(PERMISSIONS.ASSET_VIEW),
  asyncHandler(async (req, res) => {
    const query = ListAssetsQuery.parse(req.query);
    const result = await assetService.list(req.params['hospitalId'] as string, query);
    return ResponseUtil.ok(res, result);
  }),
);

router.post(
  '/',
  authenticate,
  hospitalScope,
  requirePermission(PERMISSIONS.ASSET_CREATE),
  asyncHandler(async (req, res) => {
    const body = CreateAssetBody.parse(req.body);
    const asset = await assetService.create(req.params['hospitalId'] as string, body);
    return ResponseUtil.created(res, { asset });
  }),
);

router.get(
  '/:assetId',
  authenticate,
  hospitalScope,
  requirePermission(PERMISSIONS.ASSET_VIEW),
  asyncHandler(async (req, res) => {
    const asset = await assetService.get(req.params['hospitalId'] as string, req.params['assetId'] as string);
    return ResponseUtil.ok(res, { asset });
  }),
);

router.patch(
  '/:assetId',
  authenticate,
  hospitalScope,
  requirePermission(PERMISSIONS.ASSET_UPDATE),
  asyncHandler(async (req, res) => {
    const body = UpdateAssetBody.parse(req.body);
    const asset = await assetService.update(
      req.params['hospitalId'] as string,
      req.params['assetId'] as string,
      body,
    );
    return ResponseUtil.ok(res, { asset });
  }),
);

router.patch(
  '/:assetId/status',
  authenticate,
  hospitalScope,
  requirePermission(PERMISSIONS.ASSET_STATUS),
  asyncHandler(async (req, res) => {
    const body = UpdateAssetStatusBody.parse(req.body);
    const asset = await assetService.updateStatus(
      req.params['hospitalId'] as string,
      req.params['assetId'] as string,
      body,
    );
    return ResponseUtil.ok(res, { asset });
  }),
);

router.post(
  '/:assetId/move',
  authenticate,
  hospitalScope,
  requirePermission(PERMISSIONS.ASSET_MOVE),
  asyncHandler(async (req, res) => {
    const body = MoveAssetBody.parse(req.body);
    const asset = await assetService.move(
      req.params['hospitalId'] as string,
      req.params['assetId'] as string,
      req.user!.id,
      body,
    );
    return ResponseUtil.ok(res, { asset });
  }),
);

router.post(
  '/:assetId/photos',
  authenticate,
  hospitalScope,
  requirePermission(PERMISSIONS.ASSET_UPDATE),
  asyncHandler(async (req, res) => {
    const body = AddAssetPhotoBody.parse(req.body);
    const asset = await assetService.addPhoto(
      req.params['hospitalId'] as string,
      req.params['assetId'] as string,
      body,
    );
    return ResponseUtil.ok(res, { asset });
  }),
);

router.delete(
  '/:assetId/photos/:fileKey',
  authenticate,
  hospitalScope,
  requirePermission(PERMISSIONS.ASSET_UPDATE),
  asyncHandler(async (req, res) => {
    const asset = await assetService.removePhoto(
      req.params['hospitalId'] as string,
      req.params['assetId'] as string,
      req.params['fileKey'] as string,
    );
    return ResponseUtil.ok(res, { asset });
  }),
);

router.delete(
  '/:assetId',
  authenticate,
  hospitalScope,
  requirePermission(PERMISSIONS.ASSET_DELETE),
  asyncHandler(async (req, res) => {
    await assetService.delete(req.params['hospitalId'] as string, req.params['assetId'] as string);
    return ResponseUtil.noContent(res);
  }),
);

export default router;
