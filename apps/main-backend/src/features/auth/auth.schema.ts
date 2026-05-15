import { z } from 'zod';

export const LoginBody = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
export type LoginBody = z.infer<typeof LoginBody>;

export const RegisterBody = z.object({
  email: z.string().email(),
  phone: z.string().min(10),
  password: z.string().min(8),
  user_type: z.enum(['aspirant', 'strategist', 'consultancy', 'journalist', 'researcher', 'party_office']),
});
export type RegisterBody = z.infer<typeof RegisterBody>;
