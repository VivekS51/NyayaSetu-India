import { z } from 'zod';
import { ServiceDeliveryMode } from '../../common/types';

export const createBookingSchema = z.object({
  providerProfileId: z.string().min(1, 'Provider ID is required'),
  serviceTitle: z.string().min(3, 'Service title must be at least 3 characters'),
  deliveryMode: z.enum([
    ServiceDeliveryMode.ONLINE_VIDEO,
    ServiceDeliveryMode.ONLINE_AUDIO,
    ServiceDeliveryMode.ONLINE_CHAT,
    ServiceDeliveryMode.OFFLINE_IN_PERSON,
    ServiceDeliveryMode.DOCUMENT_REVIEW,
  ]),
  scheduledStartTime: z.string().datetime('Must be valid ISO-8601 date time string'),
  durationMinutes: z.number().int().min(15).max(180).default(30),
});

export const cancelBookingSchema = z.object({
  reason: z.string().min(5, 'Cancellation reason is required (min 5 characters)'),
});

export const rescheduleBookingSchema = z.object({
  newStartTime: z.string().datetime('Must be valid ISO-8601 date time string'),
  durationMinutes: z.number().int().min(15).max(180).optional(),
});

export const disputeBookingSchema = z.object({
  reasonCode: z.enum([
    'PROVIDER_NO_SHOW',
    'INCOMPLETE_SERVICE',
    'MISLEADING_ADVICE',
    'TECHNICAL_DISRUPTION',
    'BREACH_OF_CONFIDENTIALITY',
    'OTHER',
  ]),
  description: z.string().min(10, 'Please describe the dispute issue with details (min 10 characters)'),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
export type RescheduleBookingInput = z.infer<typeof rescheduleBookingSchema>;
export type DisputeBookingInput = z.infer<typeof disputeBookingSchema>;

