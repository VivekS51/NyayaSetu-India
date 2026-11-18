import { Router, Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ReviewsService } from './reviews.service';
import {
  createReviewSchema,
  respondReviewSchema,
  flagReviewSchema,
  moderateReviewSchema,
} from './reviews.dto';
import { authenticateJwt } from '../../common/middleware/auth.middleware';
import { requireRoles } from '../../common/middleware/roles.middleware';
import { RoleType } from '../../common/types';
import { ApiResponseUtils } from '../../common/utils/api-response.utils';

export const reviewsRouter = Router();
const reviewsService = new ReviewsService();

/**
 * @route   GET /api/v1/reviews/provider/:providerProfileId
 * @desc    Fetch verified reviews for a provider's factual profile
 * @access  Public
 */
reviewsRouter.get('/provider/:providerProfileId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { providerProfileId } = req.params;
    const result = await reviewsService.getProviderReviews(providerProfileId);
    ApiResponseUtils.success(res, result, 'Provider reviews fetched');
  } catch (error: any) {
    if (error instanceof ZodError) return next(error);
    ApiResponseUtils.badRequest(res, error.message || 'Failed to fetch reviews');
  }
});

// Protect all remaining routes below with JWT authentication
reviewsRouter.use(authenticateJwt);

/**
 * @route   POST /api/v1/reviews
 * @desc    Submit verified client review for completed booking
 * @access  Protected (Citizen)
 */
reviewsRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const citizenId = req.user!.userId;
    const validatedData = createReviewSchema.parse(req.body);
    const review = await reviewsService.createReview(citizenId, validatedData);
    ApiResponseUtils.created(res, review, 'Verified review submitted successfully');
  } catch (error: any) {
    if (error instanceof ZodError) return next(error);
    if (error.message?.includes('Unauthorized')) {
      return ApiResponseUtils.forbidden(res, error.message);
    }
    ApiResponseUtils.badRequest(res, error.message || 'Failed to submit review');
  }
});

/**
 * @route   POST /api/v1/reviews/:id/respond
 * @desc    Provider response to client feedback
 * @access  Protected (LSP)
 */
reviewsRouter.post('/:id/respond', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const providerUserId = req.user!.userId;
    const validatedData = respondReviewSchema.parse(req.body);
    const updatedReview = await reviewsService.respondToReview(providerUserId, req.params.id, validatedData);
    ApiResponseUtils.success(res, updatedReview, 'Response recorded');
  } catch (error: any) {
    if (error instanceof ZodError) return next(error);
    if (error.message?.includes('Unauthorized')) {
      return ApiResponseUtils.forbidden(res, error.message);
    }
    ApiResponseUtils.badRequest(res, error.message || 'Failed to record response');
  }
});

/**
 * @route   POST /api/v1/reviews/:id/flag
 * @desc    Flag abusive or defamatory review for content moderation
 * @access  Protected
 */
reviewsRouter.post('/:id/flag', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const validatedData = flagReviewSchema.parse(req.body);
    const result = await reviewsService.flagReview(userId, req.params.id, validatedData);
    ApiResponseUtils.success(res, result, result.message);
  } catch (error: any) {
    if (error instanceof ZodError) return next(error);
    ApiResponseUtils.badRequest(res, error.message || 'Failed to flag review');
  }
});

/**
 * @route   GET /api/v1/reviews/admin/flagged
 * @desc    Get queue of flagged reviews awaiting moderation
 * @access  Protected (Admin only)
 */
reviewsRouter.get(
  '/admin/flagged',
  requireRoles(RoleType.ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const list = await reviewsService.getFlaggedReviews();
      ApiResponseUtils.success(res, list, 'Flagged reviews retrieved for moderation');
    } catch (error: any) {
      if (error instanceof ZodError) return next(error);
      ApiResponseUtils.badRequest(res, error.message || 'Failed to retrieve flagged reviews');
    }
  }
);

/**
 * @route   POST /api/v1/reviews/admin/:id/moderate
 * @desc    Administrative decision on flagged review (RESTORE or REMOVE)
 * @access  Protected (Admin only)
 */
reviewsRouter.post(
  '/admin/:id/moderate',
  requireRoles(RoleType.ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminUserId = req.user!.userId;
      const validatedData = moderateReviewSchema.parse(req.body);
      const result = await reviewsService.moderateReview(adminUserId, req.params.id, validatedData);
      ApiResponseUtils.success(res, result, result.message);
    } catch (error: any) {
      if (error instanceof ZodError) return next(error);
      ApiResponseUtils.badRequest(res, error.message || 'Review moderation failed');
    }
  }
);
