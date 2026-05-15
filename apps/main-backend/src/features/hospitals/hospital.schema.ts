import { z } from 'zod';

export const CreateHospitalBody = z.object({
  name: z.string().min(1).max(200).trim(),
  type: z.enum(['general', 'specialty', 'clinic', 'teaching', 'other']),
  location: z.string().min(1).max(300).trim(),
  contact: z
    .object({
      phone: z.string().optional(),
      email: z.string().email().optional(),
      address: z.string().optional(),
    })
    .optional(),
  subdomain: z
    .string()
    .min(3)
    .max(63)
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens')
    .trim(),
  timezone: z.string().default('UTC'),
  locale: z.string().default('en'),
});
export type CreateHospitalBody = z.infer<typeof CreateHospitalBody>;

export const UpdateHospitalBody = z.object({
  name: z.string().min(1).max(200).trim().optional(),
  type: z.enum(['general', 'specialty', 'clinic', 'teaching', 'other']).optional(),
  location: z.string().min(1).max(300).trim().optional(),
  contact: z
    .object({
      phone: z.string().optional(),
      email: z.string().email().optional(),
      address: z.string().optional(),
    })
    .optional(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
  businessHours: z.string().optional(),
});
export type UpdateHospitalBody = z.infer<typeof UpdateHospitalBody>;

export const UpdateBrandingBody = z.object({
  logoKey: z.string().min(1).optional(),
  primaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  idCardLogoPosition: z.enum(['left', 'center', 'right']).optional(),
  idCardColorScheme: z.string().optional(),
});
export type UpdateBrandingBody = z.infer<typeof UpdateBrandingBody>;

export const UpdateModulesBody = z.object({
  emr: z.boolean().optional(),
  labs: z.boolean().optional(),
  assets: z.boolean().optional(),
  onlineConsultation: z.boolean().optional(),
});
export type UpdateModulesBody = z.infer<typeof UpdateModulesBody>;

export const UpdateDomainBody = z.object({
  customDomain: z.string().min(3).optional(),
  customDomainVerified: z.boolean().optional(),
});
export type UpdateDomainBody = z.infer<typeof UpdateDomainBody>;

export const TransferOwnershipBody = z.object({
  newOwnerId: z.string().min(1),
});
export type TransferOwnershipBody = z.infer<typeof TransferOwnershipBody>;
