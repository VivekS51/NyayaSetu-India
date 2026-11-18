import { Router, Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { PaymentsService } from './payments.service';
import { createPaymentOrderSchema, verifyCaptureSchema, failPaymentSchema } from './payments.dto';
import { authenticateJwt } from '../../common/middleware/auth.middleware';
import { ApiResponseUtils } from '../../common/utils/api-response.utils';

export const paymentsRouter = Router();
const paymentsService = new PaymentsService();

/**
 * @route   POST /api/v1/payments/webhook
 * @desc    Receive Razorpay server-to-server webhook notifications (HMAC signed)
 * @access  Public (Signature verified via x-razorpay-signature)
 */
paymentsRouter.post('/webhook', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string | undefined;
    const rawBody = (req as any).rawBody || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
    const result = await paymentsService.handleWebhook(req.body, signature, rawBody);
    ApiResponseUtils.success(res, result, 'Webhook processed successfully');
  } catch (error: any) {
    ApiResponseUtils.badRequest(res, error.message || 'Webhook processing failed');
  }
});

// Protect all remaining payments routes with JWT authentication
paymentsRouter.use(authenticateJwt);

/**
 * @route   POST /api/v1/payments/create-order
 * @desc    Generate Razorpay/UPI sandbox payment order for locked booking
 * @access  Protected (Citizen)
 */
paymentsRouter.post('/create-order', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const citizenId = req.user!.userId;
    const validatedData = createPaymentOrderSchema.parse(req.body);
    const order = await paymentsService.createPaymentOrder(citizenId, validatedData);
    ApiResponseUtils.created(res, order, 'Payment order created');
  } catch (error: any) {
    if (error instanceof ZodError) return next(error);
    if (error.message?.includes('Unauthorized')) {
      return ApiResponseUtils.forbidden(res, error.message);
    }
    ApiResponseUtils.badRequest(res, error.message || 'Payment order creation failed');
  }
});

/**
 * @route   POST /api/v1/payments/verify-capture
 * @desc    Verify payment capture, lock in escrow, confirm appointment & open chat
 * @access  Protected (Citizen)
 */
paymentsRouter.post('/verify-capture', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const citizenId = req.user!.userId;
    const validatedData = verifyCaptureSchema.parse(req.body);
    const result = await paymentsService.verifyAndCapture(citizenId, validatedData);
    ApiResponseUtils.success(res, result, result.message);
  } catch (error: any) {
    if (error instanceof ZodError) return next(error);
    if (error.message?.includes('Unauthorized')) {
      return ApiResponseUtils.forbidden(res, error.message);
    }
    ApiResponseUtils.badRequest(res, error.message || 'Payment verification failed');
  }
});

/**
 * @route   POST /api/v1/payments/fail
 * @desc    Record client-side payment failure (modal closed, bank decline, network drop)
 * @access  Protected (Citizen)
 */
paymentsRouter.post('/fail', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const citizenId = req.user!.userId;
    const validatedData = failPaymentSchema.parse(req.body);
    const result = await paymentsService.recordPaymentFailure(citizenId, validatedData);
    ApiResponseUtils.success(res, result, result.message);
  } catch (error: any) {
    if (error instanceof ZodError) return next(error);
    if (error.message?.includes('Unauthorized')) {
      return ApiResponseUtils.forbidden(res, error.message);
    }
    ApiResponseUtils.badRequest(res, error.message || 'Payment failure recording failed');
  }
});

/**
 * @route   GET /api/v1/payments/:bookingId/invoice
 * @desc    Retrieve GST tax invoice with SAC code and Advocates Act statutory breakdown
 * @access  Protected (Citizen, Provider, Admin)
 */
paymentsRouter.get('/:bookingId/invoice', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { bookingId } = req.params;
    const invoiceData = await paymentsService.getInvoiceByBookingId(bookingId, userId);
    ApiResponseUtils.success(res, invoiceData, 'Tax invoice retrieved successfully');
  } catch (error: any) {
    if (error.message?.includes('Unauthorized') || error.message?.includes('Access denied')) {
      return ApiResponseUtils.forbidden(res, error.message);
    }
    if (error.message?.includes('not found') || error.message?.includes('not generated')) {
      return ApiResponseUtils.error(res, error.message, 404);
    }
    ApiResponseUtils.badRequest(res, error.message || 'Failed to retrieve invoice');
  }
});
