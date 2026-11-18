import { z } from 'zod';

export const createReviewSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  rating: z
    .number({ required_error: 'Rating is required' })
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot exceed 5'),
  feedbackText: z
    .string()
    .min(5, 'Feedback must be at least 5 characters')
    .max(1000, 'Feedback cannot exceed 1000 characters')
    .optional(),
});

export const respondReviewSchema = z.object({
  response: z.string().min(3, 'Response must be at least 3 characters').max(1000),
});

export const flagReviewSchema = z.object({
  reason: z.string().min(5, 'Please provide reason for flagging'),
});

export const moderateReviewSchema = z.object({
  action: z.enum(['RESTORE', 'REMOVE', 'DISMISS_FLAG']),
  moderationNotes: z.string().min(3, 'Moderation notes required').optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type RespondReviewInput = z.infer<typeof respondReviewSchema>;
export type FlagReviewInput = z.infer<typeof flagReviewSchema>;
export type ModerateReviewInput = z.infer<typeof moderateReviewSchema>;
