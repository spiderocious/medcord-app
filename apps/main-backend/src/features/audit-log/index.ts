import { z } from 'zod';
import type { Express } from 'express';

import { asyncHandler } from '@lib/http/asyncHandler.js';
import { ResponseUtil } from '@lib/response.js';
import { authenticate } from '@middlewares/auth.middleware.js';
import { hospitalScope } from '@middlewares/hospital-scope.middleware.js';

import { auditService } from './audit.service.js';
import type { AuditAction } from './audit.model.js';

const ListAuditQuery = z.object({
  action: z.string().optional(),
  actorId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const register = (app: Express): void => {
  app.get(
    '/api/v1/hospitals/:hospitalId/audit-log',
    authenticate,
    hospitalScope,
    asyncHandler(async (req, res) => {
      const query = ListAuditQuery.parse(req.query);
      const result = await auditService.list(
        req.params['hospitalId'] as string,
        { action: query.action as AuditAction | undefined, actorId: query.actorId },
        query.page,
        query.limit,
      );
      return ResponseUtil.ok(res, result);
    }),
  );
};
