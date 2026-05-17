import mongoose, { type Document, Schema } from 'mongoose';

export type HospitalUnitType = 'department' | 'unit' | 'ward';

export interface IHospitalUnit {
  id: string;
  hospitalId: string;
  name: string;
  type: HospitalUnitType;
  parentId?: string | undefined;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IHospitalUnitDocument extends IHospitalUnit, Document {}

const hospitalUnitSchema = new Schema<IHospitalUnitDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    hospitalId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['department', 'unit', 'ward'], required: true },
    parentId: String,
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, collection: 'hospital_units' },
);

hospitalUnitSchema.index({ hospitalId: 1, isActive: 1 });
hospitalUnitSchema.index({ hospitalId: 1, name: 1 }, { unique: true });

export const HospitalUnitModel = mongoose.model<IHospitalUnitDocument>('HospitalUnit', hospitalUnitSchema);
