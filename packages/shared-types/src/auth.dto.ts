import { z } from 'zod';

export const sendOtpSchema = z.object({
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number format invalid')
    .regex(/^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/, 'Invalid Indian mobile number (+91 format)'),
  purpose: z.enum(['LOGIN', 'REGISTER', 'VERIFY_PHONE']).default('LOGIN'),
});

export const verifyOtpSchema = z.object({
  phone: z.string().min(10, 'Phone number required'),
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
});

export const registerUserSchema = z.object({
  fullName: z.string().min(3, 'Full name must be at least 3 characters'),
  phone: z.string().regex(/^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/, 'Invalid Indian mobile number'),
  email: z.string().email().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['CITIZEN', 'LSP']).default('CITIZEN'),
  preferredLanguage: z.enum(['en', 'hi', 'pa']).default('en'),
  dpdpConsentAcknowledged: z.boolean(),
});

