import type { NextFunction, Request, Response } from 'express';

import { ForbiddenError, UnauthorizedError } from '@lib/errors.js';
import type { Permission } from '@medcord/rbac';

export const requirePermission = (permission: Permission) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new UnauthorizedError());
    if (!req.hospitalMember) return next(new ForbiddenError('Not a member of this hospital'));
    if (req.hospitalMember.isSuperAdmin) return next();
    if (!req.hospitalMember.permissions.has(permission)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }
    next();
  };
