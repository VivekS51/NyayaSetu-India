import { z } from 'zod';

export const getNotificationsQuerySchema = z.object({
  unreadOnly: z.enum(['true', 'false']).optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  page: z.coerce.number().min(1).default(1),
});

export type GetNotificationsQuery = z.infer<typeof getNotificationsQuerySchema>;

export const createNotificationSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1).max(255),
  message: z.string().min(1).max(1000),
  type: z.enum(['VERIFICATION', 'BOOKING', 'ESCROW', 'DISPUTE', 'INCENTIVE', 'SYSTEM']),
  metadata: z.record(z.any()).optional(),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;

