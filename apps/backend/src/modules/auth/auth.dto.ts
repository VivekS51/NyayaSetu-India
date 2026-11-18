import { z } from 'zod';
import { RoleType } from '../../common/types';

export const sendOtpSchema = z.object({
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number format invalid')
    .regex(/^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/, 'Invalid Indian mobile number (+91 format)'),
  purpose: z.enum(['LOGIN', 'REGISTER', 'VERIFY_PHONE']).default('LOGIN'),
});

export const verifyOtpSchema = z.object({
  phone: z
    .string()
    .min(10, 'Phone number required')
    .regex(/^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/, 'Invalid Indian mobile number'),
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must be numeric'),
});

export const registerSchema = z.object({
  fullName: z
    .string()
    .min(3, 'Full name must be at least 3 characters')
    .max(100, 'Full name cannot exceed 100 characters'),
  phone: z
    .string()
    .regex(/^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/, 'Invalid Indian mobile number'),
  email: z.string().email('Invalid email address').optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
  role: z.enum([RoleType.CITIZEN, RoleType.LSP]).default(RoleType.CITIZEN),
  preferredLanguage: z.enum(['en', 'hi', 'pa']).default('en'),
  dpdpConsentAcknowledged: z.boolean().refine((val) => val === true, {
    message: 'Explicit consent under DPDP Act 2023 is mandatory to create an account.',
  }),
});

export const loginWithPasswordSchema = z.object({
  identifier: z.string().min(3, 'Email or phone required'),
  password: z.string().min(1, 'Password required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(10, 'Refresh token required'),
});

export const logoutSchema = z.object({
  refreshToken: z.string().optional(),
});

export const passwordResetRequestSchema = z.object({
  identifier: z.string().min(3, 'Email or mobile number required'),
});

export const passwordResetConfirmSchema = z.object({
  phone: z.string().regex(/^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/, 'Invalid Indian mobile number'),
  otp: z.string().length(6, 'OTP must be exactly 6 digits').regex(/^\d{6}$/, 'OTP must be numeric'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginWithPasswordInput = z.infer<typeof loginWithPasswordSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetConfirmInput = z.infer<typeof passwordResetConfirmSchema>;

