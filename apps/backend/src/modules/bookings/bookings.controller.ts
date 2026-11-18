import { Router, Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { BookingsService } from './bookings.service';
import {
  createBookingSchema,
  cancelBookingSchema,
  disputeBookingSchema,
  rescheduleBookingSchema,
} from './bookings.dto';
import { authenticateJwt } from '../../common/middleware/auth.middleware';
import { ApiResponseUtils } from '../../common/utils/api-response.utils';

export const bookingsRouter = Router();
const bookingsService = new BookingsService();

bookingsRouter.use(authenticateJwt);

/**
 * @route   POST /api/v1/bookings
 * @desc    Create appointment booking and atomically lock calendar slot
 * @access  Protected (Citizen)
 */
bookingsRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const citizenId = req.user!.userId;
    const validatedData = createBookingSchema.parse(req.body);
    const booking = await bookingsService.createBooking(citizenId, validatedData);
    ApiResponseUtils.created(res, booking, 'Booking created and slot locked for payment');
  } catch (error: any) {
    if (error instanceof ZodError) return next(error);
    ApiResponseUtils.badRequest(res, error.message || 'Failed to create booking');
  }
});

/**
 * @route   GET /api/v1/bookings
 * @desc    List bookings for current authenticated citizen or provider
 * @access  Protected
 */
bookingsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const role = req.user!.roles.includes('LSP' as any) ? 'LSP' : 'CITIZEN';
    const list = await bookingsService.getUserBookings(userId, role);
    ApiResponseUtils.success(res, list, 'User bookings retrieved');
  } catch (error: any) {
    if (error instanceof ZodError) return next(error);
    ApiResponseUtils.badRequest(res, error.message || 'Failed to retrieve bookings');
  }
});

/**
 * @route   GET /api/v1/bookings/:id
 * @desc    Get detailed booking dossier including payment, invoice, and conversation
 * @access  Protected (Participants / Admin)
 */
bookingsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const bookingDossier = await bookingsService.getBookingById(req.params.id, userId);
    ApiResponseUtils.success(res, bookingDossier, 'Booking details fetched');
  } catch (error: any) {
    if (error?.message?.includes('Unauthorized') || error?.message?.includes('Access denied')) {
      ApiResponseUtils.forbidden(res, error.message);
      return;
    }
    if (error instanceof ZodError) return next(error);
    ApiResponseUtils.badRequest(res, error.message || 'Booking not found');
  }
});

/**
 * @route   POST /api/v1/bookings/:id/reschedule
 * @desc    Reschedule confirmed/pending booking to a new time slot
 * @access  Protected (Participants / Admin)
 */
bookingsRouter.post('/:id/reschedule', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const validatedData = rescheduleBookingSchema.parse(req.body);
    const result = await bookingsService.rescheduleBooking(req.params.id, userId, validatedData);
    ApiResponseUtils.success(res, result.booking, result.message);
  } catch (error: any) {
    if (error?.message?.includes('Unauthorized') || error?.message?.includes('Access denied')) {
      ApiResponseUtils.forbidden(res, error.message);
      return;
    }
    if (error instanceof ZodError) return next(error);
    ApiResponseUtils.badRequest(res, error.message || 'Failed to reschedule booking');
  }
});

/**
 * @route   GET /api/v1/bookings/:id/video-room
 * @desc    Generate secure video room token (Only for confirmed consultations & participants)
 * @access  Protected (Participants)
 */
bookingsRouter.get('/:id/video-room', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const videoData = await bookingsService.getVideoRoomToken(req.params.id, userId);
    ApiResponseUtils.success(res, videoData, 'Consultation video room access token generated');
  } catch (error: any) {
    if (error?.message?.includes('Unauthorized') || error?.message?.includes('Access denied')) {
      ApiResponseUtils.forbidden(res, error.message);
      return;
    }
    if (error instanceof ZodError) return next(error);
    ApiResponseUtils.badRequest(res, error.message || 'Failed to generate video room token');
  }
});

/**
 * @route   POST /api/v1/bookings/:id/complete
 * @desc    Mark booking complete and release escrow to provider wallet
 * @access  Protected
 */
bookingsRouter.post('/:id/complete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const result = await bookingsService.completeBooking(req.params.id, userId);
    ApiResponseUtils.success(res, result, result.message);
  } catch (error: any) {
    if (error?.message?.includes('Unauthorized')) {
      ApiResponseUtils.forbidden(res, error.message);
      return;
    }
    if (error instanceof ZodError) return next(error);
    ApiResponseUtils.badRequest(res, error.message || 'Failed to complete booking');
  }
});

/**
 * @route   POST /api/v1/bookings/:id/cancel
 * @desc    Cancel booking and trigger policy refund
 * @access  Protected
 */
bookingsRouter.post('/:id/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const validatedData = cancelBookingSchema.parse(req.body);
    const result = await bookingsService.cancelBooking(req.params.id, userId, validatedData);
    ApiResponseUtils.success(res, result, result.message);
  } catch (error: any) {
    if (error?.message?.includes('authorized')) {
      ApiResponseUtils.forbidden(res, error.message);
      return;
    }
    if (error instanceof ZodError) return next(error);
    ApiResponseUtils.badRequest(res, error.message || 'Failed to cancel booking');
  }
});

/**
 * @route   POST /api/v1/bookings/:id/dispute
 * @desc    Raise dispute and freeze escrow funds
 * @access  Protected (Citizen)
 */
bookingsRouter.post('/:id/dispute', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const citizenId = req.user!.userId;
    const validatedData = disputeBookingSchema.parse(req.body);
    const result = await bookingsService.raiseDispute(req.params.id, citizenId, validatedData);
    ApiResponseUtils.success(res, result, result.message);
  } catch (error: any) {
    if (error?.message?.includes('Only the citizen')) {
      ApiResponseUtils.forbidden(res, error.message);
      return;
    }
    if (error instanceof ZodError) return next(error);
    ApiResponseUtils.badRequest(res, error.message || 'Failed to raise dispute');
  }
});
