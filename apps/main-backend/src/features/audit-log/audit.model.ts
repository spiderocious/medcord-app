import mongoose, { Schema, type Document } from 'mongoose';

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

export interface IAuditLog {
  id: string;
  hospitalId: string;
  actorId: string;
  actorRole?: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  meta?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export type IAuditLogDocument = IAuditLog & Document;

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    id: { type: String, required: true, unique: true },
    hospitalId: { type: String, required: true, index: true },
    actorId: { type: String, required: true },
    actorRole: { type: String },
    action: { type: String, required: true },
    resourceType: { type: String, required: true },
    resourceId: { type: String, required: true },
    meta: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

AuditLogSchema.index({ hospitalId: 1, createdAt: -1 });
AuditLogSchema.index({ hospitalId: 1, actorId: 1 });
AuditLogSchema.index({ hospitalId: 1, action: 1 });

export const AuditLogModel = mongoose.model<IAuditLogDocument>('AuditLog', AuditLogSchema);
