import { z } from 'zod';

export const CreateAssetBody = z.object({
  name: z.string().min(1, 'Asset name is required').max(200, 'Asset name is too long').trim(),
  assetTag: z.string().max(100, 'Asset tag is too long').optional(),
  category: z.string().min(1, 'Category is required').max(100, 'Category is too long').trim(),
  manufacturer: z.string().max(200, 'Manufacturer name is too long').optional(),
  modelName: z.string().max(200, 'Model name is too long').optional(),
  serialNumber: z.string().max(100, 'Serial number is too long').optional(),
  purchaseDate: z.coerce.date({ errorMap: () => ({ message: 'Purchase date must be a valid date' }) }).optional(),
  purchasePrice: z.number().min(0, 'Purchase price cannot be negative').optional(),
  warrantyExpiresAt: z.coerce.date({ errorMap: () => ({ message: 'Warranty expiry must be a valid date' }) }).optional(),
  status: z.enum(['available', 'in_use', 'maintenance', 'retired'], {
    errorMap: () => ({ message: 'Status must be one of: available, in_use, maintenance, retired' }),
  }).default('available'),
  condition: z.enum(['excellent', 'good', 'fair', 'poor'], {
    errorMap: () => ({ message: 'Condition must be one of: excellent, good, fair, poor' }),
  }).default('good'),
  currentLocation: z.string().max(200, 'Location is too long').optional(),
  notes: z.string().max(1000, 'Notes are too long').optional(),
  photos: z
    .array(
      z.object({
        fileKey: z.string().min(1, 'File key is required'),
        caption: z.string().max(200, 'Caption is too long').optional(),
      }),
    )
    .default([]),
});
export type CreateAssetBody = z.infer<typeof CreateAssetBody>;

export const UpdateAssetBody = z.object({
  name: z.string().min(1, 'Asset name is required').max(200, 'Asset name is too long').trim().optional(),
  assetTag: z.string().max(100, 'Asset tag is too long').optional(),
  category: z.string().min(1, 'Category is required').max(100, 'Category is too long').trim().optional(),
  manufacturer: z.string().max(200, 'Manufacturer name is too long').optional(),
  modelName: z.string().max(200, 'Model name is too long').optional(),
  serialNumber: z.string().max(100, 'Serial number is too long').optional(),
  purchaseDate: z.coerce.date({ errorMap: () => ({ message: 'Purchase date must be a valid date' }) }).optional(),
  purchasePrice: z.number().min(0, 'Purchase price cannot be negative').optional(),
  warrantyExpiresAt: z.coerce.date({ errorMap: () => ({ message: 'Warranty expiry must be a valid date' }) }).optional(),
  condition: z.enum(['excellent', 'good', 'fair', 'poor'], {
    errorMap: () => ({ message: 'Condition must be one of: excellent, good, fair, poor' }),
  }).optional(),
  notes: z.string().max(1000, 'Notes are too long').optional(),
  lastMaintenanceAt: z.coerce.date({ errorMap: () => ({ message: 'Last maintenance date must be a valid date' }) }).optional(),
  nextMaintenanceDue: z.coerce.date({ errorMap: () => ({ message: 'Next maintenance date must be a valid date' }) }).optional(),
});
export type UpdateAssetBody = z.infer<typeof UpdateAssetBody>;

export const UpdateAssetStatusBody = z.object({
  status: z.enum(['available', 'in_use', 'maintenance', 'retired'], {
    errorMap: () => ({ message: 'Status must be one of: available, in_use, maintenance, retired' }),
  }),
  assignedTo: z.string().optional(),
});
export type UpdateAssetStatusBody = z.infer<typeof UpdateAssetStatusBody>;

export const MoveAssetBody = z.object({
  location: z.string().min(1, 'Location is required').max(200, 'Location is too long').trim(),
  note: z.string().max(500, 'Note is too long').optional(),
});
export type MoveAssetBody = z.infer<typeof MoveAssetBody>;

export const AddAssetPhotoBody = z.object({
  fileKey: z.string().min(1, 'File key is required'),
  caption: z.string().max(200, 'Caption is too long').optional(),
});
export type AddAssetPhotoBody = z.infer<typeof AddAssetPhotoBody>;

export const ListAssetsQuery = z.object({
  status: z.enum(['available', 'in_use', 'maintenance', 'retired'], {
    errorMap: () => ({ message: 'Status must be one of: available, in_use, maintenance, retired' }),
  }).optional(),
  category: z.string().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListAssetsQuery = z.infer<typeof ListAssetsQuery>;
