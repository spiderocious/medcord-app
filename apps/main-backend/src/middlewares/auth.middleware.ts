import type { NextFunction, Request, Response } from 'express';

import { UnauthorizedError } from '@lib/errors.js';
import { verifyAccessToken } from '@lib/jwt.js';

export interface AuthUser {
  id: string;
  email: string;
  tokenVersion: number;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing bearer token'));
  }

  const token = header.slice(7);
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email, tokenVersion: payload.tokenVersion };
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
};
