import type { NextFunction, Request, Response } from 'express';

import { ForbiddenError, NotFoundError, UnauthorizedError } from '@lib/errors.js';
import { HospitalMemberModel } from '@features/hospitals/hospital.model.js';

export const hospitalScope = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) return next(new UnauthorizedError());

  const hospitalId = req.params['hospitalId'];
  if (!hospitalId) return next(new NotFoundError('Hospital'));

  const member = await HospitalMemberModel.findOne({
    hospitalId,
    userId: req.user.id,
    status: 'active',
  }).lean();

  if (!member) return next(new ForbiddenError('Not an active member of this hospital'));

  req.hospitalMember = {
    memberId: member.id,
    hospitalId: member.hospitalId,
    role: member.role,
    status: member.status,
  };

  next();
};
