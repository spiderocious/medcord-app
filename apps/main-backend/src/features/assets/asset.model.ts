import mongoose, { Schema, type Document } from 'mongoose';

export type AssetStatus = 'available' | 'in_use' | 'maintenance' | 'retired';
export type AssetCondition = 'excellent' | 'good' | 'fair' | 'poor';

export interface IAssetPhoto {
  fileKey: string;
  caption?: string | undefined;
}

export interface IAssetLocationHistory {
  location: string;
  movedAt: Date;
  movedBy: string;
  note?: string | undefined;
}

export interface IAsset {
  id: string;
  hospitalId: string;
  name: string;
  assetTag?: string | undefined;
  category: string;
  manufacturer?: string | undefined;
  modelName?: string | undefined;
  serialNumber?: string | undefined;
  purchaseDate?: Date | undefined;
  purchasePrice?: number | undefined;
  warrantyExpiresAt?: Date | undefined;
  status: AssetStatus;
  condition: AssetCondition;
  currentLocation?: string | undefined;
  locationHistory: IAssetLocationHistory[];
  assignedTo?: string | undefined;
  photos: IAssetPhoto[];
  notes?: string | undefined;
  lastMaintenanceAt?: Date | undefined;
  nextMaintenanceDue?: Date | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export type IAssetDocument = IAsset & Document;

const AssetPhotoSchema = new Schema<IAssetPhoto>(
  {
    fileKey: { type: String, required: true },
    caption: { type: String },
  },
  { _id: false },
);

const AssetLocationHistorySchema = new Schema<IAssetLocationHistory>(
  {
    location: { type: String, required: true },
    movedAt: { type: Date, required: true },
    movedBy: { type: String, required: true },
    note: { type: String },
  },
  { _id: false },
);

const AssetSchema = new Schema<IAssetDocument>(
  {
    id: { type: String, required: true, unique: true },
    hospitalId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    assetTag: { type: String },
    category: { type: String, required: true },
    manufacturer: { type: String },
    modelName: { type: String },
    serialNumber: { type: String },
    purchaseDate: { type: Date },
    purchasePrice: { type: Number },
    warrantyExpiresAt: { type: Date },
    status: {
      type: String,
      enum: ['available', 'in_use', 'maintenance', 'retired'],
      default: 'available',
    },
    condition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'good',
    },
    currentLocation: { type: String },
    locationHistory: { type: [AssetLocationHistorySchema], default: [] },
    assignedTo: { type: String },
    photos: { type: [AssetPhotoSchema], default: [] },
    notes: { type: String },
    lastMaintenanceAt: { type: Date },
    nextMaintenanceDue: { type: Date },
  },
  { timestamps: true },
);

AssetSchema.index({ hospitalId: 1, status: 1 });
AssetSchema.index({ hospitalId: 1, category: 1 });
AssetSchema.index({ hospitalId: 1, assetTag: 1 }, { sparse: true });

export const AssetModel = mongoose.model<IAssetDocument>('Asset', AssetSchema);
