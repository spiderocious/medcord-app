import type { AuditAction, IAuditLog } from './audit.model.js';
import { AuditLogModel } from './audit.model.js';

export const auditRepo = {
  append: (data: Omit<IAuditLog, 'createdAt'>) => AuditLogModel.create(data),

  findByHospital: (
    hospitalId: string,
    filters: { action?: AuditAction | undefined; actorId?: string | undefined },
    skip: number,
    limit: number,
  ) => {
    const q: Record<string, unknown> = { hospitalId };
    if (filters.action) q['action'] = filters.action;
    if (filters.actorId) q['actorId'] = filters.actorId;
    return AuditLogModel.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
  },

  countByHospital: (
    hospitalId: string,
    filters: { action?: AuditAction | undefined; actorId?: string | undefined },
  ) => {
    const q: Record<string, unknown> = { hospitalId };
    if (filters.action) q['action'] = filters.action;
    if (filters.actorId) q['actorId'] = filters.actorId;
    return AuditLogModel.countDocuments(q);
  },
};
