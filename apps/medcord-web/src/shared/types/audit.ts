export type AuditAction =
  | 'patient.created'
  | 'patient.updated'
  | 'patient.admitted'
  | 'patient.discharged'
  | 'patient.transferred'
  | 'emr.accessed'
  | 'emr.break_glass'
  | 'lab.created'
  | 'lab.result_recorded'
  | 'lab.result_released'
  | 'member.invited'
  | 'member.suspended'
  | 'member.removed'
  | 'hospital.updated'
  | 'asset.created'
  | 'asset.status_changed'
  | 'review.acted';

export interface AuditLog {
  readonly id: string;
  readonly hospitalId: string;
  readonly actorId: string;
  readonly actorRole?: string;
  readonly action: AuditAction;
  readonly resourceType: string;
  readonly resourceId: string;
  readonly meta?: Record<string, unknown>;
  readonly ipAddress?: string;
  readonly userAgent?: string;
  readonly createdAt: string;
}

export interface AuditLogResult {
  readonly items: readonly AuditLog[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}
