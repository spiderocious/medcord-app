import bcrypt from 'bcrypt';
import { generateSecret, generateURI, verify as totpVerify } from 'otplib';

import { ConflictError, InvalidCredentialsError, NotFoundError, UnauthorizedError } from '@lib/errors.js';
import { newId } from '@lib/ids.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@lib/jwt.js';

import { authRepo } from './auth.repo.js';
import type { IUser } from './auth.model.js';
import type {
  ChangePasswordBody,
  LoginBody,
  LogoutBody,
  RefreshBody,
  RegisterBody,
  UpdateMeBody,
  Verify2faBody,
} from './auth.schema.js';

const SALT_ROUNDS = 12;

const buildTokens = (userId: string, email: string, tokenVersion: number) => ({
  accessToken: signAccessToken({ sub: userId, email, tokenVersion }),
  refreshToken: signRefreshToken({ sub: userId, tokenVersion }),
});

export const authService = {
  async register(body: RegisterBody) {
    const existing = await authRepo.findByEmail(body.email);
    if (existing) throw new ConflictError('Email already registered');

    const passwordHash = await bcrypt.hash(body.password, SALT_ROUNDS);
    const user = await authRepo.create({
      id: newId.user(),
      email: body.email,
      passwordHash,
      name: body.name,
      phone: body.phone,
      isEmailVerified: false,
      twoFactorEnabled: false,
      tokenVersion: 0,
    });

    const tokens = buildTokens(user.id, user.email, 0);
    return { user: { id: user.id, email: user.email, name: user.name }, tokens };
  },

  async login(body: LoginBody) {
    const user = await authRepo.findByEmail(body.email);
    if (!user) throw new InvalidCredentialsError();

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) throw new InvalidCredentialsError();

    if (user.twoFactorEnabled) {
      if (!body.totpCode) {
        throw new UnauthorizedError('Two-factor code required');
      }
      const userWithSecret = await authRepo.findByIdWithSecrets(user.id);
      if (!userWithSecret?.twoFactorSecret) throw new UnauthorizedError('2FA not configured');
      const ok = await totpVerify({ token: body.totpCode, secret: userWithSecret.twoFactorSecret });
      if (!ok) throw new UnauthorizedError('Invalid two-factor code');
    }

    const tokens = buildTokens(user.id, user.email, user.tokenVersion);
    return { user: { id: user.id, email: user.email, name: user.name }, tokens };
  },

  async refresh(body: RefreshBody) {
    let payload;
    try {
      payload = verifyRefreshToken(body.refreshToken);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const user = await authRepo.findByIdWithSecrets(payload.sub);
    if (!user) throw new UnauthorizedError('User not found');
    if (user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedError('Token has been revoked');
    }

    const tokens = buildTokens(user.id, user.email, user.tokenVersion);
    return { tokens };
  },

  async logout(userId: string, _body: LogoutBody) {
    await authRepo.bumpTokenVersion(userId);
  },

  async setup2fa(userId: string) {
    const user = await authRepo.findById(userId);
    if (!user) throw new NotFoundError('User');

    const secret = generateSecret();
    const otpauthUrl = generateURI({ issuer: 'Medcord', label: user.email, secret });
    return { secret, otpauthUrl };
  },

  async verify2fa(userId: string, body: Verify2faBody) {
    const ok = await totpVerify({ token: body.totpCode, secret: body.secret });
    if (!ok) throw new UnauthorizedError('Invalid two-factor code');

    await authRepo.updateById(userId, { twoFactorSecret: body.secret, twoFactorEnabled: true });
  },

  async getMe(userId: string) {
    const user = await authRepo.findById(userId);
    if (!user) throw new NotFoundError('User');
    return user;
  },

  async updateMe(userId: string, body: UpdateMeBody) {
    const user = await authRepo.updateById(userId, body as Partial<IUser>);
    if (!user) throw new NotFoundError('User');
    return user;
  },

  async changePassword(userId: string, body: ChangePasswordBody) {
    const user = await authRepo.findByIdWithSecrets(userId);
    if (!user) throw new NotFoundError('User');

    const valid = await bcrypt.compare(body.currentPassword, user.passwordHash);
    if (!valid) throw new InvalidCredentialsError();

    const passwordHash = await bcrypt.hash(body.newPassword, SALT_ROUNDS);
    await authRepo.updateById(userId, { passwordHash });
    await authRepo.bumpTokenVersion(userId);
  },
};
