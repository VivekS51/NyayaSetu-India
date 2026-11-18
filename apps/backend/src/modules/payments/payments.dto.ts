import { z } from 'zod';
import { PaymentGateway } from '../../common/types';

export const createPaymentOrderSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  gateway: z
    .enum([
      PaymentGateway.RAZORPAY,
      PaymentGateway.PHONEPE,
      PaymentGateway.UPI_DIRECT,
      PaymentGateway.SYSTEM_MOCK,
    ])
    .default(PaymentGateway.RAZORPAY),
});

export const verifyCaptureSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  gatewayOrderId: z.string().min(3, 'Order ID required'),
  gatewayPaymentId: z.string().min(3, 'Payment ID required'),
  signature: z.string().optional(),
  submittedAmountINR: z.number().optional(),
});

export const failPaymentSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  reason: z.string().min(3, 'Failure reason is required'),
});

export type CreatePaymentOrderInput = z.infer<typeof createPaymentOrderSchema>;
export type VerifyCaptureInput = z.infer<typeof verifyCaptureSchema>;
export type FailPaymentInput = z.infer<typeof failPaymentSchema>;
