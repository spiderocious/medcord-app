import type { Express } from 'express';

import { asyncHandler } from '@lib/http/asyncHandler.js';
import { ResponseUtil } from '@lib/response.js';

import staffRoutes from './staff.routes.js';
import { AcceptInvitationBody } from './staff.schema.js';
import { staffService } from './staff.service.js';

export const register = (app: Express): void => {
  app.use('/api/v1/hospitals/:hospitalId', staffRoutes);

  // Public — validate invitation token, return page-render data
  app.get(
    '/api/v1/invitations/:token',
    asyncHandler(async (req, res) => {
      const data = await staffService.getInvitationByToken(req.params['token'] as string);
      return ResponseUtil.ok(res, data);
    }),
  );

  // Public — token in URL is the auth mechanism
  app.post(
    '/api/v1/invitations/:token/accept',
    asyncHandler(async (req, res) => {
      const body = AcceptInvitationBody.parse(req.body);
      const result = await staffService.acceptInvitation(req.params['token'] as string, body);
      return ResponseUtil.ok(res, result);
    }),
  );

  app.post(
    '/api/v1/invitations/:token/decline',
    asyncHandler(async (req, res) => {
      await staffService.declineInvitation(req.params['token'] as string);
      return ResponseUtil.noContent(res);
    }),
  );
};
