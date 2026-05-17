import type { NextFunction, Request, Response } from 'express';

import { ForbiddenError, UnauthorizedError } from '@lib/errors.js';
import type { StaffRole } from '@shared/types/roles.types.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      hospitalMember?: {
        memberId: string;
        hospitalId: string;
        role: string;
        status: 'active' | 'suspended';
        isSuperAdmin: boolean;
        permissions: Set<string>;
      };
    }
  }
}

export const requireRole = (...roles: StaffRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new UnauthorizedError());
    if (!req.hospitalMember) return next(new ForbiddenError('Not a member of this hospital'));
    if (!(roles as string[]).includes(req.hospitalMember.role)) {
      return next(new ForbiddenError('Insufficient role'));
    }
    next();
  };
