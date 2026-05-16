import { Router, type IRouter } from 'express';
import { z } from 'zod';

import { asyncHandler } from '@lib/http/asyncHandler.js';
import { ResponseUtil } from '@lib/response.js';
import { authenticate } from '@middlewares/auth.middleware.js';
import { requireAdmin } from '@middlewares/require-admin.middleware.js';

import { adminService } from './admin.service.js';

const router: IRouter = Router();

// All admin routes require authentication + platform admin flag
router.use(authenticate, requireAdmin);

// ── Stats ─────────────────────────────────────────────────────────────────────

router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const stats = await adminService.getStats();
    return ResponseUtil.ok(res, { stats });
  }),
);

// ── Hospitals ─────────────────────────────────────────────────────────────────

const ListHospitalsQuery = z.object({
  q: z.string().trim().optional(),
  isArchived: z
    .string()
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

router.get(
  '/hospitals',
  asyncHandler(async (req, res) => {
    const query = ListHospitalsQuery.parse(req.query);
    const result = await adminService.listHospitals(query.q, query.isArchived, query.page, query.limit);
    return ResponseUtil.ok(res, result);
  }),
);

router.get(
  '/hospitals/:hospitalId',
  asyncHandler(async (req, res) => {
    const data = await adminService.getHospital(req.params['hospitalId'] as string);
    return ResponseUtil.ok(res, data);
  }),
);

const UpdateHospitalBody = z.object({
  isArchived: z.boolean().optional(),
  modules: z
    .object({
      emr: z.boolean().optional(),
      labs: z.boolean().optional(),
      assets: z.boolean().optional(),
      onlineConsultation: z.boolean().optional(),
    })
    .optional(),
});

router.patch(
  '/hospitals/:hospitalId',
  asyncHandler(async (req, res) => {
    const body = UpdateHospitalBody.parse(req.body);
    const update: Record<string, unknown> = {};
    if (body.isArchived !== undefined) update['isArchived'] = body.isArchived;
    if (body.modules) {
      Object.entries(body.modules).forEach(([k, v]) => {
        if (v !== undefined) update[`modules.${k}`] = v;
      });
    }
    const hospital = await adminService.updateHospital(req.params['hospitalId'] as string, update);
    return ResponseUtil.ok(res, { hospital });
  }),
);

router.delete(
  '/hospitals/:hospitalId',
  asyncHandler(async (req, res) => {
    await adminService.deleteHospital(req.params['hospitalId'] as string);
    return ResponseUtil.noContent(res);
  }),
);

// ── Users ─────────────────────────────────────────────────────────────────────

const ListUsersQuery = z.object({
  q: z.string().trim().optional(),
  isAdmin: z
    .string()
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const query = ListUsersQuery.parse(req.query);
    const result = await adminService.listUsers(query.q, query.isAdmin, query.page, query.limit);
    return ResponseUtil.ok(res, result);
  }),
);

router.get(
  '/users/:userId',
  asyncHandler(async (req, res) => {
    const data = await adminService.getUser(req.params['userId'] as string);
    return ResponseUtil.ok(res, data);
  }),
);

const UpdateUserBody = z.object({
  isAdmin: z.boolean().optional(),
  isEmailVerified: z.boolean().optional(),
});

router.patch(
  '/users/:userId',
  asyncHandler(async (req, res) => {
    const body = UpdateUserBody.parse(req.body);
    const user = await adminService.updateUser(req.params['userId'] as string, body);
    return ResponseUtil.ok(res, { user });
  }),
);

router.post(
  '/users/:userId/disable',
  asyncHandler(async (req, res) => {
    await adminService.disableUser(req.params['userId'] as string);
    return ResponseUtil.noContent(res);
  }),
);

export default router;
