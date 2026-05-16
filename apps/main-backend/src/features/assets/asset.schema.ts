import { z } from 'zod';

export const CreateAssetBody = z.object({
  name: z.string().min(1).max(200).trim(),
  assetTag: z.string().max(100).optional(),
  category: z.string().min(1).max(100).trim(),
  manufacturer: z.string().max(200).optional(),
  modelName: z.string().max(200).optional(),
  serialNumber: z.string().max(100).optional(),
  purchaseDate: z.coerce.date().optional(),
  purchasePrice: z.number().min(0).optional(),
  warrantyExpiresAt: z.coerce.date().optional(),
  status: z.enum(['available', 'in_use', 'maintenance', 'retired']).default('available'),
  condition: z.enum(['excellent', 'good', 'fair', 'poor']).default('good'),
  currentLocation: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
  photos: z
    .array(
      z.object({
        fileKey: z.string().min(1),
        caption: z.string().max(200).optional(),
      }),
    )
    .default([]),
});
export type CreateAssetBody = z.infer<typeof CreateAssetBody>;

export const UpdateAssetBody = z.object({
  name: z.string().min(1).max(200).trim().optional(),
  assetTag: z.string().max(100).optional(),
  category: z.string().min(1).max(100).trim().optional(),
  manufacturer: z.string().max(200).optional(),
  modelName: z.string().max(200).optional(),
  serialNumber: z.string().max(100).optional(),
  purchaseDate: z.coerce.date().optional(),
  purchasePrice: z.number().min(0).optional(),
  warrantyExpiresAt: z.coerce.date().optional(),
  condition: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
  notes: z.string().max(1000).optional(),
  lastMaintenanceAt: z.coerce.date().optional(),
  nextMaintenanceDue: z.coerce.date().optional(),
});
export type UpdateAssetBody = z.infer<typeof UpdateAssetBody>;

export const UpdateAssetStatusBody = z.object({
  status: z.enum(['available', 'in_use', 'maintenance', 'retired']),
  assignedTo: z.string().optional(),
});
export type UpdateAssetStatusBody = z.infer<typeof UpdateAssetStatusBody>;

export const MoveAssetBody = z.object({
  location: z.string().min(1).max(200).trim(),
  note: z.string().max(500).optional(),
});
export type MoveAssetBody = z.infer<typeof MoveAssetBody>;

export const AddAssetPhotoBody = z.object({
  fileKey: z.string().min(1),
  caption: z.string().max(200).optional(),
});
export type AddAssetPhotoBody = z.infer<typeof AddAssetPhotoBody>;

export const ListAssetsQuery = z.object({
  status: z.enum(['available', 'in_use', 'maintenance', 'retired']).optional(),
  category: z.string().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListAssetsQuery = z.infer<typeof ListAssetsQuery>;
