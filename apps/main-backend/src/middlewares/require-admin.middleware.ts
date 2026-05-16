import type { NextFunction, Request, Response } from 'express';

import { ForbiddenError, UnauthorizedError } from '@lib/errors.js';
import { authRepo } from '@features/auth/auth.repo.js';

export const requireAdmin = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) return next(new UnauthorizedError());

  const user = await authRepo.findById(req.user.id);
  if (!user?.isAdmin) return next(new ForbiddenError('Platform admin access required'));

  next();
};
