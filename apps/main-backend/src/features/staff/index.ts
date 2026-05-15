import type { Express } from 'express';

import { asyncHandler } from '@lib/http/asyncHandler.js';
import { ResponseUtil } from '@lib/response.js';
import { authenticate } from '@middlewares/auth.middleware.js';

import staffRoutes from './staff.routes.js';
import { staffService } from './staff.service.js';

export const register = (app: Express): void => {
  app.use('/api/v1/hospitals/:hospitalId', staffRoutes);

  // Accept/decline invitation — no hospital membership required
  app.post(
    '/api/v1/invitations/:token/accept',
    authenticate,
    asyncHandler(async (req, res) => {
      const result = await staffService.acceptInvitation(req.params['token'] as string, req.user!.id);
      return ResponseUtil.ok(res, result);
    }),
  );

  app.post(
    '/api/v1/invitations/:token/decline',
    authenticate,
    asyncHandler(async (req, res) => {
      await staffService.declineInvitation(req.params['token'] as string);
      return ResponseUtil.noContent(res);
    }),
  );
};
