import { z } from 'zod';
import { ProviderType, ServiceDeliveryMode } from '../../common/types';

const PROHIBITED_PROMOTIONAL_TERMS = [
  'best lawyer',
  'top lawyer',
  'no. 1 advocate',
  'guaranteed win',
  '100% success',
  'cheapest advocate',
  'undefeated counsel',
  'famous attorney',
];

export const providerSearchQuerySchema = z.object({
  q: z.string().optional(),
  query: z.string().optional(),
  providerType: z
    .enum([
      'ALL',
      ProviderType.ADVOCATE,
      ProviderType.NOTARY,
      ProviderType.MEDIATOR,
      ProviderType.ARBITRATOR,
      ProviderType.DOCUMENT_WRITER,
      ProviderType.LEGAL_CONSULTANT,
    ])
    .optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  city: z.string().optional(),
  domain: z.string().optional(),
  practiceArea: z.string().optional(),
  language: z.string().optional(),
  feeMin: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined)),
  feeMax: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined)),
  proBono: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  mode: z
    .enum([
      'ALL',
      ServiceDeliveryMode.ONLINE_VIDEO,
      ServiceDeliveryMode.ONLINE_AUDIO,
      ServiceDeliveryMode.ONLINE_CHAT,
      ServiceDeliveryMode.OFFLINE_IN_PERSON,
      ServiceDeliveryMode.DOCUMENT_REVIEW,
    ])
    .optional(),
  sortBy: z.enum(['experience', 'fee_asc', 'fee_desc', 'rating', 'name']).optional(),
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => Math.max(1, parseInt(val || '1', 10))),
  limit: z
    .string()
    .optional()
    .default('10')
    .transform((val) => Math.min(50, Math.max(1, parseInt(val || '10', 10)))),
});

export const updateProviderProfileSchema = z
  .object({
    bio: z
      .string()
      .max(1000, 'Factual bio cannot exceed 1000 characters')
      .refine(
        (text) => {
          if (!text) return true;
          const lower = text.toLowerCase();
          return !PROHIBITED_PROMOTIONAL_TERMS.some((term) => lower.includes(term));
        },
        {
          message:
            'BCI Rule 36 Violation: Subjective claims, rankings ("best lawyer", "guaranteed win"), and commercial touting are strictly prohibited for advocates.',
        }
      )
      .optional(),
    languagesSpoken: z.array(z.string()).min(1, 'At least one language required').optional(),
    consultationFeeINR: z.number().min(0, 'Fee cannot be negative').optional(),
    isAvailableForProBono: z.boolean().optional(),
    primaryCourt: z.string().min(2, 'Primary court must be specified').optional(),
    practiceAreas: z.array(z.string()).min(1, 'At least one practice area required').optional(),
  });

export type ProviderSearchQueryInput = z.infer<typeof providerSearchQuerySchema>;
export type UpdateProviderProfileInput = z.infer<typeof updateProviderProfileSchema>;

