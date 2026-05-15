import { Router, type IRouter } from 'express';

import { asyncHandler } from '@lib/http/asyncHandler.js';
import { ResponseUtil } from '@lib/response.js';
import { authenticate } from '@middlewares/auth.middleware.js';
import { hospitalScope } from '@middlewares/hospital-scope.middleware.js';
import { requireRole } from '@middlewares/require-role.middleware.js';

import {
  BulkInviteBody,
  CreateRoleBody,
  InviteBody,
  ListStaffQuery,
  UpdateMemberBody,
  UpdateRoleBody,
} from './staff.schema.js';
import { staffService } from './staff.service.js';

const router: IRouter = Router({ mergeParams: true });

// ── Invitations ────────────────────────────────────────────────────────────────

router.post(
  '/invitations',
  authenticate,
  hospitalScope,
  requireRole('super_admin', 'hospital_admin'),
  asyncHandler(async (req, res) => {
    const body = InviteBody.parse(req.body);
    const inv = await staffService.invite(req.params['hospitalId'] as string, req.user!.id, body);
    return ResponseUtil.created(res, { invitation: inv });
  }),
);

router.post(
  '/invitations/bulk',
  authenticate,
  hospitalScope,
  requireRole('super_admin', 'hospital_admin'),
  asyncHandler(async (req, res) => {
    const body = BulkInviteBody.parse(req.body);
    const results = await staffService.bulkInvite(req.params['hospitalId'] as string, req.user!.id, body);
    return ResponseUtil.created(res, { invitations: results });
  }),
);

router.get(
  '/invitations',
  authenticate,
  hospitalScope,
  requireRole('super_admin', 'hospital_admin'),
  asyncHandler(async (req, res) => {
    const invitations = await staffService.listInvitations(req.params['hospitalId'] as string);
    return ResponseUtil.ok(res, { invitations });
  }),
);

router.delete(
  '/invitations/:invitationId',
  authenticate,
  hospitalScope,
  requireRole('super_admin', 'hospital_admin'),
  asyncHandler(async (req, res) => {
    await staffService.revokeInvitation(req.params['hospitalId'] as string, req.params['invitationId'] as string);
    return ResponseUtil.noContent(res);
  }),
);

router.post(
  '/invitations/:invitationId/resend',
  authenticate,
  hospitalScope,
  requireRole('super_admin', 'hospital_admin'),
  asyncHandler(async (req, res) => {
    const inv = await staffService.resendInvitation(
      req.params['hospitalId'] as string,
      req.params['invitationId'] as string,
    );
    return ResponseUtil.ok(res, { invitation: inv });
  }),
);

// ── Staff directory ────────────────────────────────────────────────────────────

router.get(
  '/staff',
  authenticate,
  hospitalScope,
  asyncHandler(async (req, res) => {
    const query = ListStaffQuery.parse(req.query);
    const result = await staffService.listStaff(req.params['hospitalId'] as string, query);
    return ResponseUtil.ok(res, result);
  }),
);

router.get(
  '/staff/:memberId',
  authenticate,
  hospitalScope,
  asyncHandler(async (req, res) => {
    const member = await staffService.getMember(
      req.params['hospitalId'] as string,
      req.params['memberId'] as string,
    );
    return ResponseUtil.ok(res, { member });
  }),
);

router.patch(
  '/staff/:memberId',
  authenticate,
  hospitalScope,
  requireRole('super_admin', 'hospital_admin'),
  asyncHandler(async (req, res) => {
    const body = UpdateMemberBody.parse(req.body);
    const member = await staffService.updateMember(
      req.params['hospitalId'] as string,
      req.params['memberId'] as string,
      body,
    );
    return ResponseUtil.ok(res, { member });
  }),
);

router.post(
  '/staff/:memberId/suspend',
  authenticate,
  hospitalScope,
  requireRole('super_admin', 'hospital_admin'),
  asyncHandler(async (req, res) => {
    await staffService.suspendMember(
      req.params['hospitalId'] as string,
      req.params['memberId'] as string,
      req.user!.id,
    );
    return ResponseUtil.noContent(res);
  }),
);

router.post(
  '/staff/:memberId/activate',
  authenticate,
  hospitalScope,
  requireRole('super_admin', 'hospital_admin'),
  asyncHandler(async (req, res) => {
    await staffService.activateMember(req.params['hospitalId'] as string, req.params['memberId'] as string);
    return ResponseUtil.noContent(res);
  }),
);

router.delete(
  '/staff/:memberId',
  authenticate,
  hospitalScope,
  requireRole('super_admin', 'hospital_admin'),
  asyncHandler(async (req, res) => {
    await staffService.removeMember(
      req.params['hospitalId'] as string,
      req.params['memberId'] as string,
      req.user!.id,
    );
    return ResponseUtil.noContent(res);
  }),
);

// ── Roles ─────────────────────────────────────────────────────────────────────

router.get(
  '/roles',
  authenticate,
  hospitalScope,
  asyncHandler(async (req, res) => {
    const roles = await staffService.listRoles(req.params['hospitalId'] as string);
    return ResponseUtil.ok(res, { roles });
  }),
);

router.post(
  '/roles',
  authenticate,
  hospitalScope,
  requireRole('super_admin'),
  asyncHandler(async (req, res) => {
    const body = CreateRoleBody.parse(req.body);
    const role = await staffService.createRole(req.params['hospitalId'] as string, body);
    return ResponseUtil.created(res, { role });
  }),
);

router.patch(
  '/roles/:roleId',
  authenticate,
  hospitalScope,
  requireRole('super_admin'),
  asyncHandler(async (req, res) => {
    const body = UpdateRoleBody.parse(req.body);
    const role = await staffService.updateRole(
      req.params['hospitalId'] as string,
      req.params['roleId'] as string,
      body,
    );
    return ResponseUtil.ok(res, { role });
  }),
);

// ── Org chart & share ─────────────────────────────────────────────────────────

router.get(
  '/org-chart',
  authenticate,
  hospitalScope,
  asyncHandler(async (req, res) => {
    const chart = await staffService.getOrgChart(req.params['hospitalId'] as string);
    return ResponseUtil.ok(res, { chart });
  }),
);

router.get(
  '/share',
  authenticate,
  hospitalScope,
  asyncHandler(async (req, res) => {
    const info = staffService.getShareInfo(req.params['hospitalId'] as string);
    return ResponseUtil.ok(res, info);
  }),
);

export default router;
