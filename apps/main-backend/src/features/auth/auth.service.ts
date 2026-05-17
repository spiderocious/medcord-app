import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { generateSecret, generateURI, verify as totpVerify } from 'otplib';

import { BadRequestError, ConflictError, ForbiddenError, InvalidCredentialsError, NotFoundError, UnauthorizedError } from '@lib/errors.js';
import { newId } from '@lib/ids.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@lib/jwt.js';
import { resolveAllPermissions } from '@lib/permissions.js';
import { staffRepo } from '@features/staff/staff.repo.js';
import { HospitalMemberModel } from '@features/hospitals/hospital.model.js';

import { authRepo } from './auth.repo.js';
import type { IUser } from './auth.model.js';
import type {
  ChangePasswordBody,
  GenerateResetCodeBody,
  LoginBody,
  LogoutBody,
  RefreshBody,
  RegisterBody,
  ResetPasswordBody,
  UpdateMeBody,
  Verify2faBody,
  VerifyResetCodeBody,
} from './auth.schema.js';

const SALT_ROUNDS = 12;

const buildTokens = (
  userId: string,
  email: string,
  tokenVersion: number,
  hospitalPermissions: Record<string, string[]> = {},
) => ({
  accessToken: signAccessToken({ sub: userId, email, tokenVersion, hospitalPermissions }),
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
      isAdmin: false,
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
      const { valid } = await totpVerify({ token: body.totpCode, secret: userWithSecret.twoFactorSecret });
      if (!valid) throw new UnauthorizedError('Invalid two-factor code');
    }

    const memberships = await HospitalMemberModel.find({ userId: user.id, status: 'active' }).lean();
    const hospitalPermissions = await resolveAllPermissions(memberships as Parameters<typeof resolveAllPermissions>[0]);
    const tokens = buildTokens(user.id, user.email, user.tokenVersion, hospitalPermissions);
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

    const memberships = await HospitalMemberModel.find({ userId: user.id, status: 'active' }).lean();
    const hospitalPermissions = await resolveAllPermissions(memberships as Parameters<typeof resolveAllPermissions>[0]);
    const tokens = buildTokens(user.id, user.email, user.tokenVersion, hospitalPermissions);
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
    await authRepo.updateById(userId, { pendingTwoFactorSecret: secret } as never);
    return { otpauthUrl };
  },

  async verify2fa(userId: string, body: Verify2faBody) {
    const user = await authRepo.findByIdWithSecrets(userId);
    if (!user) throw new NotFoundError('User');
    if (!user.pendingTwoFactorSecret) throw new UnauthorizedError('No 2FA setup in progress — call setup-2fa first');

    const { valid } = await totpVerify({ token: body.totpCode, secret: user.pendingTwoFactorSecret });
    if (!valid) throw new UnauthorizedError('Invalid two-factor code');

    await authRepo.updateById(userId, {
      twoFactorSecret: user.pendingTwoFactorSecret,
      twoFactorEnabled: true,
      pendingTwoFactorSecret: undefined,
    } as never);
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

  async generateResetCode(requesterId: string, body: GenerateResetCodeBody) {
    const requesterMemberships = await staffRepo.findMembershipsByUserId(requesterId);
    const superAdminHospitalIds = requesterMemberships
      .filter((m) => m.role === 'super_admin')
      .map((m) => m.hospitalId);
    if (superAdminHospitalIds.length === 0) {
      throw new ForbiddenError('Only super admins can generate reset codes');
    }

    const targetMemberships = await staffRepo.findMembershipsByUserId(body.userId);
    const sharedHospital = targetMemberships.some((m) => superAdminHospitalIds.includes(m.hospitalId));
    if (!sharedHospital) throw new ForbiddenError('User is not a member of your hospital');

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    const bytes = crypto.randomBytes(7);
    for (const byte of bytes) {
      code += chars[byte % chars.length];
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await authRepo.updateById(body.userId, {
      passwordResetCode: code,
      passwordResetCodeExpiresAt: expiresAt,
    } as Partial<IUser>);

    return { code };
  },

  async verifyResetCode(body: VerifyResetCodeBody) {
    const user = await authRepo.findByResetCode(body.code);
    if (!user) throw new BadRequestError('Invalid or expired reset code');
    return { valid: true };
  },

  async resetPassword(body: ResetPasswordBody) {
    const user = await authRepo.findByResetCode(body.code);
    if (!user) throw new BadRequestError('Invalid or expired reset code');

    const passwordHash = await bcrypt.hash(body.password, SALT_ROUNDS);
    await authRepo.updateById(user.id, { passwordHash } as Partial<IUser>);
    await authRepo.clearResetCode(user.id);
  },
};
