import type { NextFunction, Request, Response } from 'express';

import { UnauthorizedError } from '@lib/errors.js';
import { verifyAccessToken } from '@lib/jwt.js';
import { authRepo } from '@features/auth/auth.repo.js';

export interface AuthUser {
  id: string;
  email: string;
  tokenVersion: number;
  hospitalPermissions: Record<string, string[]>;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authenticate = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing bearer token'));
  }

  const token = header.slice(7);
  try {
    const payload = verifyAccessToken(token);
    const dbUser = await authRepo.findByIdTokenVersion(payload.sub);
    if (!dbUser || dbUser.tokenVersion !== payload.tokenVersion) {
      return next(new UnauthorizedError('Token has been revoked'));
    }
    req.user = {
      id: payload.sub,
      email: payload.email,
      tokenVersion: payload.tokenVersion,
      hospitalPermissions: payload.hospitalPermissions ?? {},
    };
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
};
