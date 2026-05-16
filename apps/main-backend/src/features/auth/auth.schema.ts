import { z } from 'zod';

export const RegisterBody = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password is too long'),
  name: z.string().min(1, 'Name is required').max(120, 'Name is too long').trim(),
  phone: z.string().min(7, 'Phone number is too short').max(20, 'Phone number is too long').trim().optional(),
});
export type RegisterBody = z.infer<typeof RegisterBody>;

export const LoginBody = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
  totpCode: z.string().length(6, 'TOTP code must be 6 digits').optional(),
});
export type LoginBody = z.infer<typeof LoginBody>;

export const RefreshBody = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});
export type RefreshBody = z.infer<typeof RefreshBody>;

export const LogoutBody = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});
export type LogoutBody = z.infer<typeof LogoutBody>;

export const Setup2faBody = z.object({});
export type Setup2faBody = z.infer<typeof Setup2faBody>;

export const Verify2faBody = z.object({
  totpCode: z.string().length(6, 'TOTP code must be 6 digits'),
});
export type Verify2faBody = z.infer<typeof Verify2faBody>;

export const UpdateMeBody = z.object({
  name: z.string().min(1, 'Name is required').max(120, 'Name is too long').trim().optional(),
  phone: z.string().min(7, 'Phone number is too short').max(20, 'Phone number is too long').trim().optional(),
  photoKey: z.string().min(1, 'Photo key is required').optional(),
});
export type UpdateMeBody = z.infer<typeof UpdateMeBody>;

export const ChangePasswordBody = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters').max(128, 'New password is too long'),
});
export type ChangePasswordBody = z.infer<typeof ChangePasswordBody>;
