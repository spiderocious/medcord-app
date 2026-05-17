import type { NextFunction, Request, Response } from 'express';

import { ForbiddenError, NotFoundError, UnauthorizedError } from '@lib/errors.js';
import { SUPER_ADMIN_SENTINEL } from '@medcord/rbac';
import { HospitalMemberModel, HospitalModel } from '@features/hospitals/hospital.model.js';

export const hospitalScope = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) return next(new UnauthorizedError());

  const rawHospitalId = req.params['hospitalId'];
  if (!rawHospitalId || Array.isArray(rawHospitalId)) return next(new NotFoundError('Hospital'));
  const hospitalId: string = rawHospitalId;

  const hospital = await HospitalModel.findOne({ id: hospitalId }).lean();
  if (!hospital) return next(new NotFoundError('Hospital'));
  if (hospital.isArchived) return next(new ForbiddenError('This hospital has been archived'));

  const member = await HospitalMemberModel.findOne({
    hospitalId,
    userId: req.user.id,
    status: 'active',
  }).lean();

  if (!member) return next(new ForbiddenError('Not an active member of this hospital'));

  const hospitalPermissions: Record<string, string[] | undefined> = req.user?.hospitalPermissions ?? {};
  const tokenPerms: string[] = hospitalPermissions[hospitalId] ?? [];
  const isSuperAdmin = tokenPerms.includes(SUPER_ADMIN_SENTINEL);

  req.hospitalMember = {
    memberId: member.id,
    hospitalId: member.hospitalId,
    role: member.role,
    status: member.status,
    isSuperAdmin,
    permissions: new Set(isSuperAdmin ? [] : tokenPerms),
  };

  next();
};
