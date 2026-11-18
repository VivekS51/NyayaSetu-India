import { z } from 'zod';

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(5000, 'Message cannot exceed 5000 characters'),
  attachmentUrl: z.string().url('Attachment must be a valid URL').optional(),
  attachmentName: z.string().optional(),
  isAadhaarSigned: z.boolean().default(false),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

