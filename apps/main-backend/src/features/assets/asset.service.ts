import { NotFoundError } from '@lib/errors.js';
import { newId } from '@lib/ids.js';
import type { PaginatedResult } from '@shared/types/service.types.js';

import { assetRepo } from './asset.repo.js';
import type { IAsset, IAssetLocationHistory } from './asset.model.js';
import type {
  AddAssetPhotoBody,
  CreateAssetBody,
  ListAssetsQuery,
  MoveAssetBody,
  UpdateAssetBody,
  UpdateAssetStatusBody,
} from './asset.schema.js';

export const assetService = {
  async create(hospitalId: string, body: CreateAssetBody): Promise<IAsset> {
    const asset = await assetRepo.create({
      id: newId.asset(),
      hospitalId,
      name: body.name,
      ...(body.assetTag !== undefined && { assetTag: body.assetTag }),
      category: body.category,
      ...(body.manufacturer !== undefined && { manufacturer: body.manufacturer }),
      ...(body.modelName !== undefined && { modelName: body.modelName }),
      ...(body.serialNumber !== undefined && { serialNumber: body.serialNumber }),
      ...(body.purchaseDate !== undefined && { purchaseDate: body.purchaseDate }),
      ...(body.purchasePrice !== undefined && { purchasePrice: body.purchasePrice }),
      ...(body.warrantyExpiresAt !== undefined && { warrantyExpiresAt: body.warrantyExpiresAt }),
      status: body.status ?? 'available',
      condition: body.condition,
      ...(body.currentLocation !== undefined && { currentLocation: body.currentLocation }),
      locationHistory: [],
      photos: body.photos as IAsset['photos'],
      ...(body.notes !== undefined && { notes: body.notes }),
    });
    return asset as unknown as IAsset;
  },

  async list(hospitalId: string, query: ListAssetsQuery): Promise<PaginatedResult<IAsset>> {
    const skip = (query.page - 1) * query.limit;
    const filters = {
      ...(query.status !== undefined && { status: query.status }),
      ...(query.category !== undefined && { category: query.category }),
      ...(query.q !== undefined && { q: query.q }),
    };
    const [items, total] = await Promise.all([
      assetRepo.findByHospital(hospitalId, filters, skip, query.limit),
      assetRepo.countByHospital(hospitalId, filters),
    ]);
    return {
      items: items as IAsset[],
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  },

  async get(hospitalId: string, assetId: string): Promise<IAsset> {
    const asset = await assetRepo.findById(assetId);
    if (!asset || asset.hospitalId !== hospitalId) throw new NotFoundError('Asset');
    return asset as IAsset;
  },

  async update(hospitalId: string, assetId: string, body: UpdateAssetBody): Promise<IAsset> {
    const asset = await assetRepo.findById(assetId);
    if (!asset || asset.hospitalId !== hospitalId) throw new NotFoundError('Asset');
    const updated = await assetRepo.updateById(assetId, body as Partial<IAsset>);
    if (!updated) throw new NotFoundError('Asset');
    return updated as IAsset;
  },

  async updateStatus(
    hospitalId: string,
    assetId: string,
    body: UpdateAssetStatusBody,
  ): Promise<IAsset> {
    const asset = await assetRepo.findById(assetId);
    if (!asset || asset.hospitalId !== hospitalId) throw new NotFoundError('Asset');
    const update: Partial<IAsset> = { status: body.status };
    if (body.assignedTo !== undefined) update.assignedTo = body.assignedTo;
    const updated = await assetRepo.updateById(assetId, update);
    if (!updated) throw new NotFoundError('Asset');
    return updated as IAsset;
  },

  async move(
    hospitalId: string,
    assetId: string,
    userId: string,
    body: MoveAssetBody,
  ): Promise<IAsset> {
    const asset = await assetRepo.findById(assetId);
    if (!asset || asset.hospitalId !== hospitalId) throw new NotFoundError('Asset');

    await assetRepo.updateById(assetId, { currentLocation: body.location });
    const entry: IAssetLocationHistory = {
      location: body.location,
      movedAt: new Date(),
      movedBy: userId,
      ...(body.note !== undefined && { note: body.note }),
    };
    const updated = await assetRepo.pushLocationHistory(assetId, entry);
    if (!updated) throw new NotFoundError('Asset');
    return updated as IAsset;
  },

  async addPhoto(
    hospitalId: string,
    assetId: string,
    body: AddAssetPhotoBody,
  ): Promise<IAsset> {
    const asset = await assetRepo.findById(assetId);
    if (!asset || asset.hospitalId !== hospitalId) throw new NotFoundError('Asset');
    const photo = {
      fileKey: body.fileKey,
      ...(body.caption !== undefined && { caption: body.caption }),
    };
    const updated = await assetRepo.pushPhoto(assetId, photo);
    if (!updated) throw new NotFoundError('Asset');
    return updated as IAsset;
  },

  async removePhoto(
    hospitalId: string,
    assetId: string,
    fileKey: string,
  ): Promise<IAsset> {
    const asset = await assetRepo.findById(assetId);
    if (!asset || asset.hospitalId !== hospitalId) throw new NotFoundError('Asset');
    const updated = await assetRepo.removePhoto(assetId, fileKey);
    if (!updated) throw new NotFoundError('Asset');
    return updated as IAsset;
  },

  async delete(hospitalId: string, assetId: string): Promise<void> {
    const asset = await assetRepo.findById(assetId);
    if (!asset || asset.hospitalId !== hospitalId) throw new NotFoundError('Asset');
    await assetRepo.deleteById(assetId);
  },
};
