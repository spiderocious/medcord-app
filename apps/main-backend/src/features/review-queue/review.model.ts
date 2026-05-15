import mongoose, { Schema, type Document } from 'mongoose';

export type ReviewItemType =
  | 'lab_result'
  | 'vitals'
  | 'medication'
  | 'document'
  | 'discharge'
  | 'transfer';

export type ReviewItemStatus = 'pending' | 'approved' | 'rejected' | 'escalated';

export interface IReviewItem {
  id: string;
  hospitalId: string;
  patientId: string;
  type: ReviewItemType;
  referenceId: string;
  title: string;
  summary?: string | undefined;
  priority: 'routine' | 'urgent' | 'stat';
  status: ReviewItemStatus;
  submittedBy: string;
  reviewedBy?: string | undefined;
  reviewedAt?: Date | undefined;
  reviewNote?: string | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export type IReviewItemDocument = IReviewItem & Document;

const ReviewItemSchema = new Schema<IReviewItemDocument>(
  {
    id: { type: String, required: true, unique: true },
    hospitalId: { type: String, required: true, index: true },
    patientId: { type: String, required: true },
    type: {
      type: String,
      enum: ['lab_result', 'vitals', 'medication', 'document', 'discharge', 'transfer'],
      required: true,
    },
    referenceId: { type: String, required: true },
    title: { type: String, required: true },
    summary: { type: String },
    priority: { type: String, enum: ['routine', 'urgent', 'stat'], default: 'routine' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'escalated'],
      default: 'pending',
    },
    submittedBy: { type: String, required: true },
    reviewedBy: { type: String },
    reviewedAt: { type: Date },
    reviewNote: { type: String },
  },
  { timestamps: true },
);

ReviewItemSchema.index({ hospitalId: 1, status: 1 });
ReviewItemSchema.index({ hospitalId: 1, patientId: 1 });

export const ReviewItemModel = mongoose.model<IReviewItemDocument>('ReviewItem', ReviewItemSchema);
