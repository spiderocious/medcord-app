import { z } from 'zod';

export const RegisterBody = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(120).trim(),
  phone: z.string().min(7).max(20).trim().optional(),
});
export type RegisterBody = z.infer<typeof RegisterBody>;

export const LoginBody = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1),
  totpCode: z.string().length(6).optional(),
});
export type LoginBody = z.infer<typeof LoginBody>;

export const RefreshBody = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshBody = z.infer<typeof RefreshBody>;

export const LogoutBody = z.object({
  refreshToken: z.string().min(1),
});
export type LogoutBody = z.infer<typeof LogoutBody>;

export const Setup2faBody = z.object({});
export type Setup2faBody = z.infer<typeof Setup2faBody>;

export const Verify2faBody = z.object({
  totpCode: z.string().length(6),
  secret: z.string().min(1),
});
export type Verify2faBody = z.infer<typeof Verify2faBody>;

export const UpdateMeBody = z.object({
  name: z.string().min(1).max(120).trim().optional(),
  phone: z.string().min(7).max(20).trim().optional(),
  photoKey: z.string().min(1).optional(),
});
export type UpdateMeBody = z.infer<typeof UpdateMeBody>;

export const ChangePasswordBody = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});
export type ChangePasswordBody = z.infer<typeof ChangePasswordBody>;
