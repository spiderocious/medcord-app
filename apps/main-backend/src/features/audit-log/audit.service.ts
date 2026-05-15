import { newId } from '@lib/ids.js';
import type { PaginatedResult } from '@shared/types/service.types.js';

import { auditRepo } from './audit.repo.js';
import type { AuditAction, IAuditLog } from './audit.model.js';

export interface AppendAuditParams {
  hospitalId: string;
  actorId: string;
  actorRole?: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  meta?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export const auditService = {
  async append(params: AppendAuditParams): Promise<void> {
    await auditRepo.append({
      id: newId.auditLog(),
      ...params,
    });
  },

  async list(
    hospitalId: string,
    filters: { action?: AuditAction | undefined; actorId?: string | undefined },
    page: number,
    limit: number,
  ): Promise<PaginatedResult<IAuditLog>> {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      auditRepo.findByHospital(hospitalId, filters, skip, limit),
      auditRepo.countByHospital(hospitalId, filters),
    ]);
    return {
      items: items as IAuditLog[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },
};
