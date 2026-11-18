import { z } from 'zod';

export const createIncentiveRuleSchema = z.object({
  ruleCode: z.string().min(4, 'Rule code must be at least 4 characters').regex(/^[A-Z_]+$/, 'Must be uppercase with underscores'),
  name: z.string().min(5, 'Name must be at least 5 characters'),
  triggerEvent: z.enum([
    'PROFILE_COMPLETION',
    'VERIFICATION_APPROVED',
    'PRO_BONO_CASE_COMPLETED',
    'FAST_RESPONSE_RATE',
    'BOOKING_COMPLETED',
    'HIGH_RATING_RECEIVED',
    'PROVIDER_REFERRAL_SUCCESS',
    'CITIZEN_FIRST_BOOKING',
  ]),
  pointsAwarded: z.number().int().min(1, 'Points awarded must be at least 1').max(500),
  isActive: z.boolean().default(true),
  validUntil: z.string().datetime().optional(),
});

export const updateIncentiveRuleSchema = z.object({
  name: z.string().min(5).optional(),
  pointsAwarded: z.number().int().min(1).max(500).optional(),
  isActive: z.boolean().optional(),
});

export const applyReferralSchema = z.object({
  referralCode: z.string().min(6, 'Invalid referral code format'),
});

export const redeemPointsSchema = z.object({
  rewardType: z.enum([
    'FEE_WAIVER_VOUCHER_100',
    'ESIGN_CREDITS_PACK_10',
    'CPD_MASTERCLASS_PASS',
    'CASE_MANAGEMENT_PRO_TRIAL',
  ]),
});

export const leaderboardPreferenceSchema = z.object({
  isOptedIn: z.boolean(),
  isAnonymized: z.boolean(),
});

export type CreateIncentiveRuleInput = z.infer<typeof createIncentiveRuleSchema>;
export type UpdateIncentiveRuleInput = z.infer<typeof updateIncentiveRuleSchema>;
export type ApplyReferralInput = z.infer<typeof applyReferralSchema>;
export type RedeemPointsInput = z.infer<typeof redeemPointsSchema>;
export type LeaderboardPreferenceInput = z.infer<typeof leaderboardPreferenceSchema>;

