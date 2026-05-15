import jwt from 'jsonwebtoken';

import { env } from '../env.js';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  tokenVersion: number;
}

export interface RefreshTokenPayload {
  sub: string;
  tokenVersion: number;
}

// env values are valid ms duration strings at runtime; cast bypasses branded-type check
const accessExpiry = env.JWT_ACCESS_EXPIRES_IN as Parameters<typeof jwt.sign>[2] extends
  | { expiresIn?: infer E }
  | undefined
  ? E
  : never;
const refreshExpiry = env.JWT_REFRESH_EXPIRES_IN as typeof accessExpiry;

export const signAccessToken = (payload: AccessTokenPayload): string =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: accessExpiry });

export const signRefreshToken = (payload: RefreshTokenPayload): string =>
  jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: refreshExpiry });

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
  return decoded as AccessTokenPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
  return decoded as RefreshTokenPayload;
};
