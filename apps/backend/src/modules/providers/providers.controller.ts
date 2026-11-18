import { Router, Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ProvidersService } from './providers.service';
import { providerSearchQuerySchema, updateProviderProfileSchema } from './providers.dto';
import { ApiResponseUtils } from '../../common/utils/api-response.utils';
import { authenticateJwt } from '../../common/middleware/auth.middleware';
import { requireRoles } from '../../common/middleware/roles.middleware';
import { RoleType } from '../../common/types';

export const providersRouter = Router();
const providersService = new ProvidersService();

/**
 * @route   GET /api/v1/providers
 * @desc    Search and filter verified legal service providers (BCI Rule 36 compliant)
 * @access  Public
 */
providersRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedQuery = providerSearchQuerySchema.parse(req.query);
    const result = await providersService.searchProviders(validatedQuery);
    ApiResponseUtils.success(res, result.items, 'Verified legal service providers directory retrieved', 200, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      disclaimer: result.disclaimer,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    if (error instanceof ZodError) return next(error);
    ApiResponseUtils.badRequest(res, error.message || 'Failed to search providers');
  }
});

/**
 * @route   GET /api/v1/providers/me/profile
 * @desc    Fetch active provider's own full unmasked profile
 * @access  Protected (LSP / Admin)
 */
providersRouter.get(
  '/me/profile',
  authenticateJwt,
  requireRoles(RoleType.LSP, RoleType.ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const profile = await providersService.getMyProfile(userId);
      ApiResponseUtils.success(res, profile, 'Own provider profile retrieved');
    } catch (error: any) {
      if (error instanceof ZodError) return next(error);
      ApiResponseUtils.badRequest(res, error.message || 'Failed to fetch provider profile');
    }
  }
);

/**
 * @route   PUT /api/v1/providers/me
 * @desc    Update factual profile information (bio, fees, languages, practice areas)
 * @access  Protected (LSP / Admin)
 */
providersRouter.put(
  '/me',
  authenticateJwt,
  requireRoles(RoleType.LSP, RoleType.ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const validatedData = updateProviderProfileSchema.parse(req.body);
      const result = await providersService.updateProfile(userId, validatedData);
      ApiResponseUtils.success(res, result.profile, result.message);
    } catch (error: any) {
      if (error instanceof ZodError) return next(error);
      ApiResponseUtils.badRequest(res, error.message || 'Failed to update provider profile');
    }
  }
);

/**
 * @route   GET /api/v1/providers/:id
 * @desc    Fetch public factual profile of a verified provider (with PII masking)
 * @access  Public
 */
providersRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const viewerUserId = (req as any).user?.userId;
    const profile = await providersService.getProviderById(id, viewerUserId);
    ApiResponseUtils.success(res, profile, 'Legal service provider profile retrieved');
  } catch (error: any) {
    if (error instanceof ZodError) return next(error);
    ApiResponseUtils.error(res, error.message || 'Provider profile not found', 404);
  }
});

