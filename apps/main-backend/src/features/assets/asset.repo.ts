import type { IAsset, IAssetLocationHistory, AssetStatus } from './asset.model.js';
import { AssetModel } from './asset.model.js';

export const assetRepo = {
  create: (data: Omit<IAsset, 'createdAt' | 'updatedAt'>) => AssetModel.create(data),

  findById: (id: string) => AssetModel.findOne({ id }).lean(),

  findByHospital: (
    hospitalId: string,
    filters: { status?: AssetStatus | undefined; category?: string | undefined; q?: string | undefined },
    skip: number,
    limit: number,
  ) => {
    const q: Record<string, unknown> = { hospitalId };
    if (filters.status) q['status'] = filters.status;
    if (filters.category) q['category'] = new RegExp(filters.category, 'i');
    if (filters.q) {
      q['$or'] = [
        { name: new RegExp(filters.q, 'i') },
        { assetTag: new RegExp(filters.q, 'i') },
        { serialNumber: new RegExp(filters.q, 'i') },
      ];
    }
    return AssetModel.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
  },

  countByHospital: (
    hospitalId: string,
    filters: { status?: AssetStatus | undefined; category?: string | undefined; q?: string | undefined },
  ) => {
    const q: Record<string, unknown> = { hospitalId };
    if (filters.status) q['status'] = filters.status;
    if (filters.category) q['category'] = new RegExp(filters.category, 'i');
    if (filters.q) {
      q['$or'] = [
        { name: new RegExp(filters.q, 'i') },
        { assetTag: new RegExp(filters.q, 'i') },
        { serialNumber: new RegExp(filters.q, 'i') },
      ];
    }
    return AssetModel.countDocuments(q);
  },

  updateById: (id: string, data: Partial<IAsset>) =>
    AssetModel.findOneAndUpdate({ id }, { $set: data }, { new: true }).lean(),

  pushLocationHistory: (id: string, entry: IAssetLocationHistory) =>
    AssetModel.findOneAndUpdate(
      { id },
      { $push: { locationHistory: entry } },
      { new: true },
    ).lean(),

  pushPhoto: (id: string, photo: { fileKey: string; caption?: string }) =>
    AssetModel.findOneAndUpdate(
      { id },
      { $push: { photos: photo } },
      { new: true },
    ).lean(),

  removePhoto: (id: string, fileKey: string) =>
    AssetModel.findOneAndUpdate(
      { id },
      { $pull: { photos: { fileKey } } },
      { new: true },
    ).lean(),

  deleteById: (id: string) => AssetModel.deleteOne({ id }),
};
