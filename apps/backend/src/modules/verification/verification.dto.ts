import { z } from 'zod';

export const verificationDecisionSchema = z
  .object({
    action: z.enum(['APPROVE', 'REJECT', 'SET_UNDER_REVIEW', 'REQUEST_MORE_INFO']),
    reasonCode: z
      .enum([
        'BAR_NO_NOT_FOUND_ON_STATE_ROLL',
        'DOC_BLURRY_OR_ILLEGIBLE',
        'NAME_MISMATCH_WITH_ID',
        'EXPIRED_CERTIFICATE_OF_PRACTICE',
        'NOTARY_COMMISSION_EXPIRED',
        'UNAUTHORIZED_JURISDICTION_CLAIM',
        'OTHER',
      ])
      .optional(),
    reviewNotes: z.string().min(5, 'Review notes must be at least 5 characters'),
  })
  .refine(
    (data) => {
      if (data.action === 'REJECT') {
        return !!data.reasonCode;
      }
      return true;
    },
    {
      message: 'Rejection requires a valid reasonCode to notify the provider.',
      path: ['reasonCode'],
    }
  );

export type VerificationDecisionInput = z.infer<typeof verificationDecisionSchema>;

