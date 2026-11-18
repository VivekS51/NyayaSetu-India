import { Router, Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { OnboardingService } from './onboarding.service';
import {
  step1BasicDetailsSchema,
  step2ProfessionalDetailsSchema,
  step3DocumentUploadSchema,
  step4StatutoryComplianceSchema,
  uploadUrlRequestSchema,
} from './onboarding.dto';
import { authenticateJwt } from '../../common/middleware/auth.middleware';
import { requireRoles } from '../../common/middleware/roles.middleware';
import { RoleType } from '../../common/types';
import { ApiResponseUtils } from '../../common/utils/api-response.utils';

export const onboardingRouter = Router();
const onboardingService = new OnboardingService();

// All onboarding endpoints require authentication as an LSP
onboardingRouter.use(authenticateJwt);
onboardingRouter.use(requireRoles(RoleType.LSP, RoleType.ADMIN));

/**
 * @route   GET /api/v1/onboarding/status
 * @desc    Fetch current wizard completion status, save-and-resume progress, and documents
 * @access  Protected (LSP)
 */
onboardingRouter.get('/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const status = await onboardingService.getOnboardingStatus(userId);
    ApiResponseUtils.success(res, status, 'Onboarding workflow state retrieved');
  } catch (error: any) {
    if (error instanceof ZodError) return next(error);
    ApiResponseUtils.badRequest(res, error.message || 'Failed to retrieve onboarding status');
  }
});

/**
 * @route   POST /api/v1/onboarding/step-1
 * @desc    Save Step 1 (Basic Details & Geographic Jurisdiction)
 * @access  Protected (LSP)
 */
onboardingRouter.post('/step-1', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const validatedData = step1BasicDetailsSchema.parse(req.body);
    const result = await onboardingService.saveStep1(userId, validatedData);
    ApiResponseUtils.success(res, result, 'Step 1 saved successfully');
  } catch (error: any) {
    if (error instanceof ZodError) return next(error);
    ApiResponseUtils.badRequest(res, error.message || 'Failed to save Step 1 details');
  }
});

/**
 * @route   POST /api/v1/onboarding/step-2
 * @desc    Save Step 2 (Professional Credentials & Practice Jurisdiction)
 * @access  Protected (LSP)
 */
onboardingRouter.post('/step-2', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const validatedData = step2ProfessionalDetailsSchema.parse(req.body);
    const result = await onboardingService.saveStep2(userId, validatedData);
    ApiResponseUtils.success(res, result, 'Step 2 saved successfully');
  } catch (error: any) {
    if (error instanceof ZodError) return next(error);
    ApiResponseUtils.badRequest(res, error.message || 'Failed to save Step 2 details');
  }
});

/**
 * @route   POST /api/v1/onboarding/step-3/upload-url
 * @desc    Generate secure S3 presigned upload URL for credential document
 * @access  Protected (LSP)
 */
onboardingRouter.post('/step-3/upload-url', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const validatedData = uploadUrlRequestSchema.parse(req.body);
    const result = await onboardingService.generatePresignedUploadUrl(
      userId,
      validatedData.fileName,
      validatedData.mimeType,
      validatedData.fileSizeBytes
    );
    ApiResponseUtils.success(res, result, 'Presigned secure upload URL generated');
  } catch (error: any) {
    if (error instanceof ZodError) return next(error);
    ApiResponseUtils.badRequest(res, error.message || 'Failed to generate presigned upload URL');
  }
});

/**
 * @route   POST /api/v1/onboarding/step-3/confirm-document
 * @desc    Confirm document upload and attach to provider credentials
 * @access  Protected (LSP)
 */
onboardingRouter.post('/step-3/confirm-document', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const validatedData = step3DocumentUploadSchema.parse(req.body);
    const result = await onboardingService.saveStep3Document(userId, validatedData);
    ApiResponseUtils.created(res, result, 'Credential document recorded');
  } catch (error: any) {
    if (error instanceof ZodError) return next(error);
    ApiResponseUtils.badRequest(res, error.message || 'Failed to record credential document');
  }
});

/**
 * @route   POST /api/v1/onboarding/step-4/submit
 * @desc    Sign statutory compliance declarations (BCI Rule 36, DPDP Act) and submit for verification
 * @access  Protected (LSP)
 */
onboardingRouter.post('/step-4/submit', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const clientIp = req.ip || (req.socket.remoteAddress as string);
    const validatedData = step4StatutoryComplianceSchema.parse(req.body);
    const result = await onboardingService.saveStep4AndSubmit(userId, validatedData, clientIp);
    ApiResponseUtils.success(res, result, 'Profile submitted for verification queue');
  } catch (error: any) {
    if (error instanceof ZodError) return next(error);
    ApiResponseUtils.badRequest(res, error.message || 'Failed to submit profile for verification');
  }
});
