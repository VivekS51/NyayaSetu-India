import { z } from 'zod';
import { AccountStatus, ProviderType } from '../../common/types';

export const updateUserStatusSchema = z.object({
  status: z.nativeEnum(AccountStatus),
  reason: z.string().min(3).max(500),
});

export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;

export const resolveDisputeSchema = z.object({
  action: z.enum(['REFUND_CITIZEN', 'RELEASE_TO_PROVIDER']),
  resolutionNotes: z.string().min(5).max(1000),
});

export type ResolveDisputeInput = z.infer<typeof resolveDisputeSchema>;

export const updateIncentiveRuleSchema = z.object({
  pointsAwarded: z.number().int().min(0).max(2000).optional(),
  isActive: z.boolean().optional(),
  abTestGroup: z.enum(['A', 'B', 'ALL']).optional(),
  name: z.string().min(3).max(200).optional(),
});

export type UpdateIncentiveRuleInput = z.infer<typeof updateIncentiveRuleSchema>;

export const adminUserQuerySchema = z.object({
  role: z.string().optional(),
  status: z.nativeEnum(AccountStatus).optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type AdminUserQuery = z.infer<typeof adminUserQuerySchema>;

export const adminDisputeQuerySchema = z.object({
  status: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type AdminDisputeQuery = z.infer<typeof adminDisputeQuerySchema>;

export const createCategorySchema = z.object({
  code: z
    .string()
    .min(3, 'Code must be at least 3 characters')
    .regex(/^[A-Z_]+$/, 'Code must be uppercase with underscores'),
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  description: z.string().min(5, 'Description must be at least 5 characters').max(500),
  applicableProviderTypes: z.array(z.nativeEnum(ProviderType)).min(1, 'At least one provider type is required'),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().min(5).max(500).optional(),
  applicableProviderTypes: z.array(z.nativeEnum(ProviderType)).optional(),
  isActive: z.boolean().optional(),
});

export const analyticsQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
