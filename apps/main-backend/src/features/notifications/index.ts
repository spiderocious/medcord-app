import { z } from 'zod';
import type { Express } from 'express';

import { asyncHandler } from '@lib/http/asyncHandler.js';
import { ResponseUtil } from '@lib/response.js';
import { authenticate } from '@middlewares/auth.middleware.js';
import { hospitalScope } from '@middlewares/hospital-scope.middleware.js';

import { notificationService } from './notification.service.js';

const ListNotificationsQuery = z.object({
  unread: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const register = (app: Express): void => {
  app.get(
    '/api/v1/hospitals/:hospitalId/notifications',
    authenticate,
    hospitalScope,
    asyncHandler(async (req, res) => {
      const query = ListNotificationsQuery.parse(req.query);
      const result = await notificationService.list(
        req.user!.id,
        req.params['hospitalId'] as string,
        query.unread,
        query.page,
        query.limit,
      );
      return ResponseUtil.ok(res, result);
    }),
  );

  app.post(
    '/api/v1/hospitals/:hospitalId/notifications/:notificationId/read',
    authenticate,
    hospitalScope,
    asyncHandler(async (req, res) => {
      const notification = await notificationService.markRead(
        req.user!.id,
        req.params['notificationId'] as string,
      );
      return ResponseUtil.ok(res, { notification });
    }),
  );

  app.post(
    '/api/v1/hospitals/:hospitalId/notifications/read-all',
    authenticate,
    hospitalScope,
    asyncHandler(async (req, res) => {
      await notificationService.markAllRead(req.user!.id, req.params['hospitalId'] as string);
      return ResponseUtil.noContent(res);
    }),
  );
};
