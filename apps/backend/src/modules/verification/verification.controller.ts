import { Router, Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { VerificationService } from './verification.service';
import { verificationDecisionSchema } from './verification.dto';
import { authenticateJwt } from '../../common/middleware/auth.middleware';
import { requireRoles } from '../../common/middleware/roles.middleware';
import { RoleType, VerificationStatus } from '../../common/types';
import { ApiResponseUtils } from '../../common/utils/api-response.utils';

export const verificationRouter = Router();
const verificationService = new VerificationService();

// Require Admin or Verifier privileges
verificationRouter.use(authenticateJwt);
verificationRouter.use(requireRoles(RoleType.ADMIN, RoleType.VERIFIER));

/**
 * @route   GET /api/v1/admin/verification/queue
 * @desc    Fetch pending provider verification queue with pagination
 * @access  Protected (Admin / Verifier)
 */
verificationRouter.get('/queue', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status as VerificationStatus | undefined;
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '10', 10);

    const queue = await verificationService.getQueue(status, page, limit);
    ApiResponseUtils.success(res, queue.items, 'Verification queue fetched', 200, {
      page: queue.page,
      limit: queue.limit,
      total: queue.total,
      totalPages: queue.totalPages,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    if (error instanceof ZodError) return next(error);
    ApiResponseUtils.badRequest(res, error.message || 'Failed to fetch verification queue');
  }
});

/**
 * @route   GET /api/v1/admin/verification/:providerProfileId/dossier
 * @desc    Inspect full provider verification dossier, credentials, and OCR checks
 * @access  Protected (Admin / Verifier)
 */
verificationRouter.get('/:providerProfileId/dossier', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { providerProfileId } = req.params;
    const dossier = await verificationService.getDossier(providerProfileId);
    ApiResponseUtils.success(res, dossier, 'Provider dossier retrieved');
  } catch (error: any) {
    if (error instanceof ZodError) return next(error);
    ApiResponseUtils.badRequest(res, error.message || 'Failed to retrieve provider dossier');
  }
});

/**
 * @route   POST /api/v1/admin/verification/:providerProfileId/decide
 * @desc    Approve or reject provider credentials with statutory reason code
 * @access  Protected (Admin / Verifier)
 */
verificationRouter.post('/:providerProfileId/decide', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminUserId = req.user!.userId;
    const { providerProfileId } = req.params;
    const clientIp = req.ip || (req.socket.remoteAddress as string);
    const validatedData = verificationDecisionSchema.parse(req.body);

    const result = await verificationService.processDecision(
      adminUserId,
      providerProfileId,
      validatedData,
      clientIp
    );

    ApiResponseUtils.success(res, result, result.message);
  } catch (error: any) {
    if (error instanceof ZodError) return next(error);
    ApiResponseUtils.badRequest(res, error.message || 'Failed to process verification decision');
  }
});
