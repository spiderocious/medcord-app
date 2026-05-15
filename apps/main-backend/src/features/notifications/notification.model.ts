import mongoose, { Schema, type Document } from 'mongoose';

export type NotificationType =
  | 'lab_result_ready'
  | 'lab_result_abnormal'
  | 'transfer_request'
  | 'transfer_accepted'
  | 'transfer_declined'
  | 'review_item_submitted'
  | 'review_item_acted'
  | 'patient_admitted'
  | 'patient_discharged'
  | 'vitals_out_of_range'
  | 'general';

export interface INotification {
  id: string;
  hospitalId: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  body: string;
  resourceType?: string | undefined;
  resourceId?: string | undefined;
  isRead: boolean;
  readAt?: Date | undefined;
  createdAt: Date;
}

export type INotificationDocument = INotification & Document;

const NotificationSchema = new Schema<INotificationDocument>(
  {
    id: { type: String, required: true, unique: true },
    hospitalId: { type: String, required: true, index: true },
    recipientId: { type: String, required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    resourceType: { type: String },
    resourceId: { type: String },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

NotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

export const NotificationModel = mongoose.model<INotificationDocument>(
  'Notification',
  NotificationSchema,
);
