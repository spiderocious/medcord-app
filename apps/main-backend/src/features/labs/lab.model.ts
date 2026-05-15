import mongoose, { Schema, type Document } from 'mongoose';

export type LabOrderStatus =
  | 'awaiting_sample'
  | 'sample_received'
  | 'awaiting_test'
  | 'in_progress'
  | 'awaiting_result'
  | 'result_ready'
  | 'result_released';

export interface ILabStateHistory {
  from: LabOrderStatus;
  to: LabOrderStatus;
  changedBy: string;
  changedAt: Date;
  note?: string | undefined;
}

export interface ILabResult {
  value: string;
  unit?: string | undefined;
  referenceRange?: string | undefined;
  isAbnormal: boolean;
  notes?: string | undefined;
}

export interface ILabOrder {
  id: string;
  hospitalId: string;
  patientId: string;
  orderedBy: string;
  testName: string;
  testCode?: string | undefined;
  category?: string | undefined;
  priority: 'routine' | 'urgent' | 'stat';
  status: LabOrderStatus;
  stateHistory: ILabStateHistory[];
  sampleType?: string | undefined;
  sampleCollectedAt?: Date | undefined;
  sampleCollectedBy?: string | undefined;
  result?: ILabResult | undefined;
  resultReleasedAt?: Date | undefined;
  resultReleasedBy?: string | undefined;
  fileKey?: string | undefined;
  notes?: string | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export type ILabOrderDocument = ILabOrder & Document;

const LabStateHistorySchema = new Schema<ILabStateHistory>(
  {
    from: { type: String, required: true },
    to: { type: String, required: true },
    changedBy: { type: String, required: true },
    changedAt: { type: Date, required: true },
    note: { type: String },
  },
  { _id: false },
);

const LabResultSchema = new Schema<ILabResult>(
  {
    value: { type: String, required: true },
    unit: { type: String },
    referenceRange: { type: String },
    isAbnormal: { type: Boolean, required: true, default: false },
    notes: { type: String },
  },
  { _id: false },
);

const LabOrderSchema = new Schema<ILabOrderDocument>(
  {
    id: { type: String, required: true, unique: true },
    hospitalId: { type: String, required: true, index: true },
    patientId: { type: String, required: true, index: true },
    orderedBy: { type: String, required: true },
    testName: { type: String, required: true },
    testCode: { type: String },
    category: { type: String },
    priority: { type: String, enum: ['routine', 'urgent', 'stat'], default: 'routine' },
    status: {
      type: String,
      enum: [
        'awaiting_sample',
        'sample_received',
        'awaiting_test',
        'in_progress',
        'awaiting_result',
        'result_ready',
        'result_released',
      ],
      default: 'awaiting_sample',
    },
    stateHistory: { type: [LabStateHistorySchema], default: [] },
    sampleType: { type: String },
    sampleCollectedAt: { type: Date },
    sampleCollectedBy: { type: String },
    result: { type: LabResultSchema },
    resultReleasedAt: { type: Date },
    resultReleasedBy: { type: String },
    fileKey: { type: String },
    notes: { type: String },
  },
  { timestamps: true },
);

LabOrderSchema.index({ hospitalId: 1, patientId: 1, status: 1 });
LabOrderSchema.index({ hospitalId: 1, status: 1 });

export const LabOrderModel = mongoose.model<ILabOrderDocument>('LabOrder', LabOrderSchema);
