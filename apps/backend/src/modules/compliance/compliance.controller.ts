import { Router, Request, Response } from 'express';
import { complianceService } from './compliance.service';
import { authenticateJwt } from '../../common/middleware/auth.middleware';
import { ApiResponseUtils } from '../../common/utils/api-response.utils';

const router = Router();

/**
 * GET /api/v1/compliance/terms (and /api/v1/terms)
 * Statutory Terms of Service under BCI Rule 36 and IT Act 2000
 */
router.get('/terms', (_req: Request, res: Response) => {
  const terms = complianceService.getTermsOfService();
  return ApiResponseUtils.success(res, terms, 'Terms of service retrieved successfully');
});

/**
 * GET /api/v1/compliance/privacy-policy (and /api/v1/privacy-policy)
 * DPDP Act 2023 Statutory Privacy Notice
 */
router.get('/privacy-policy', (_req: Request, res: Response) => {
  const policy = complianceService.getPrivacyPolicy();
  return ApiResponseUtils.success(res, policy, 'Privacy policy retrieved successfully');
});

/**
 * GET /api/v1/compliance/refund-policy (and /api/v1/refund-policy)
 * Sovereign Escrow & Citizen Refund Policy
 */
router.get('/refund-policy', (_req: Request, res: Response) => {
  const policy = complianceService.getRefundPolicy();
  return ApiResponseUtils.success(res, policy, 'Refund policy retrieved successfully');
});

/**
 * GET /api/v1/compliance/grievance (and /api/v1/grievance)
 * Rule 3(2) IT Rules 2021 & DPDP Act 2023 Grievance Redressal Officer details
 */
router.get('/grievance', (_req: Request, res: Response) => {
  const grievance = complianceService.getGrievanceDetails();
  return ApiResponseUtils.success(res, grievance, 'Grievance redressal details retrieved successfully');
});

/**
 * GET /api/v1/compliance/dpdp/export
 * DPDP Act 2023 Section 11: Machine-readable data export for authenticated user
 */
router.get('/dpdp/export', authenticateJwt, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const exportData = await complianceService.exportUserData(userId);
    return ApiResponseUtils.success(res, exportData, 'Personal data exported successfully pursuant to DPDP Act 2023');
  } catch (error: any) {
    return ApiResponseUtils.badRequest(res, error.message || 'Failed to export personal data');
  }
});

/**
 * POST /api/v1/compliance/dpdp/erase
 * DPDP Act 2023 Section 12: Right to Erasure / Account Decommissioning
 */
router.post('/dpdp/erase', authenticateJwt, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const result = await complianceService.eraseUserData(userId);
    return ApiResponseUtils.success(res, result, 'Account decommissioned and PII erased pursuant to Section 12 DPDP Act 2023');
  } catch (error: any) {
    return ApiResponseUtils.badRequest(res, error.message || 'Failed to decommission account');
  }
});

export const complianceRouter = router;
