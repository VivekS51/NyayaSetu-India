import { Router, Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { IncentivesService } from './incentives.service';
import {
  createIncentiveRuleSchema,
  updateIncentiveRuleSchema,
  redeemPointsSchema,
  applyReferralSchema,
} from './incentives.dto';
import { authenticateJwt } from '../../common/middleware/auth.middleware';
import { requireRoles } from '../../common/middleware/roles.middleware';
import { RoleType } from '../../common/types';
import { ApiResponseUtils } from '../../common/utils/api-response.utils';
import { dbStore } from '../../config/database';

export const incentivesRouter = Router();
const incentivesService = new IncentivesService();

/**
 * @route   GET /api/v1/incentives/leaderboard
 * @desc    Fetch opt-in monthly impact leaderboard (pro-bono and verified consultations)
 * @access  Public
 */
incentivesRouter.get('/leaderboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const list = await incentivesService.getLeaderboard();
    ApiResponseUtils.success(res, list, 'Impact leaderboard fetched');
  } catch (error: any) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/incentives/rules
 * @desc    Fetch active dynamic incentive rules
 * @access  Public / Authenticated
 */
incentivesRouter.get('/rules', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rules = await incentivesService.getRules();
    ApiResponseUtils.success(res, rules, 'Active incentive rules fetched');
  } catch (error: any) {
    next(error);
  }
});

// Protect all remaining routes below with JWT authentication
incentivesRouter.use(authenticateJwt);

/**
 * @route   GET /api/v1/incentives/wallet
 * @desc    Get user monetary & reward points balance, current tier, and unlocked perks
 * @access  Protected
 */
incentivesRouter.get('/wallet', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const details = await incentivesService.getWalletDetails(userId);
    ApiResponseUtils.success(res, details, 'Wallet details fetched');
  } catch (error: any) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/incentives/ledger
 * @desc    Fetch immutable transaction log of points credits, debits, and expirations
 * @access  Protected
 */
incentivesRouter.get('/ledger', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '15', 10);
    const result = await incentivesService.getPointsLedger(userId, page, limit);
    ApiResponseUtils.success(res, result.items, 'Points ledger fetched', 200, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/incentives/referral
 * @desc    Fetch provider's unique referral link, code, and invited colleagues stats
 * @access  Protected (LSP)
 */
incentivesRouter.get('/referral', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const referralDetails = await incentivesService.getReferralDetails(userId);
    ApiResponseUtils.success(res, referralDetails, 'Referral details retrieved');
  } catch (error: any) {
    if (error.message?.includes('registered Legal Service Providers')) {
      return ApiResponseUtils.forbidden(res, error.message);
    }
    ApiResponseUtils.badRequest(res, error.message || 'Failed to retrieve referral details');
  }
});

/**
 * @route   POST /api/v1/incentives/referral/apply
 * @desc    Link colleague referral code during onboarding
 * @access  Protected (LSP)
 */
incentivesRouter.post('/referral/apply', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const profile = dbStore.providerProfiles.find((p) => p.userId === userId);
    if (!profile) {
      return ApiResponseUtils.badRequest(res, 'Provider profile required to link referral code.');
    }
    const validatedData = applyReferralSchema.parse(req.body);
    const result = await incentivesService.applyReferralCode(profile.id, validatedData.referralCode);
    ApiResponseUtils.success(res, result, result.message);
  } catch (error: any) {
    if (error instanceof ZodError) return next(error);
    ApiResponseUtils.badRequest(res, error.message || 'Failed to apply referral code');
  }
});

/**
 * @route   POST /api/v1/incentives/redeem
 * @desc    Redeem points for tech fee waivers, eSign packs, or CPD masterclass passes
 * @access  Protected
 */
incentivesRouter.post('/redeem', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const validatedData = redeemPointsSchema.parse(req.body);
    const result = await incentivesService.redeemPoints(userId, validatedData);
    ApiResponseUtils.success(res, result, result.message);
  } catch (error: any) {
    if (error instanceof ZodError) return next(error);
    ApiResponseUtils.badRequest(res, error.message || 'Failed to redeem points');
  }
});

/**
 * @route   POST /api/v1/incentives/citizen/first-discount
 * @desc    Apply one-time statutory first consultation discount for citizens
 * @access  Protected (Citizen)
 */
incentivesRouter.post('/citizen/first-discount', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const citizenId = req.user!.userId;
    const { bookingId } = req.body;
    if (!bookingId) {
      return ApiResponseUtils.badRequest(res, 'Booking ID is required');
    }
    const result = await incentivesService.applyFirstConsultationDiscount(citizenId, bookingId);
    ApiResponseUtils.success(res, result, result.message);
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return ApiResponseUtils.forbidden(res, error.message);
    }
    ApiResponseUtils.badRequest(res, error.message || 'Failed to apply discount');
  }
});

/**
 * @route   GET /api/v1/incentives/impact-report
 * @desc    Generate monthly pro-bono, DLSA legal aid, and citizen outreach impact report
 * @access  Protected (LSP)
 */
incentivesRouter.get('/impact-report', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const report = await incentivesService.generateImpactReport(userId);
    ApiResponseUtils.success(res, report, 'Monthly impact report generated');
  } catch (error: any) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/admin/incentives/rules
 * @desc    Admin: Create new dynamic incentive rule
 * @access  Protected (Admin)
 */
incentivesRouter.post('/admin/rules', requireRoles(RoleType.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createIncentiveRuleSchema.parse(req.body);
    const newRule = await incentivesService.createRule(validatedData);
    ApiResponseUtils.created(res, newRule, 'Incentive rule created');
  } catch (error: any) {
    if (error instanceof ZodError) return next(error);
    ApiResponseUtils.badRequest(res, error.message || 'Failed to create rule');
  }
});

/**
 * @route   PATCH /api/v1/admin/incentives/rules/:id
 * @desc    Admin: Update rule points or toggle active status
 * @access  Protected (Admin)
 */
incentivesRouter.patch('/admin/rules/:id', requireRoles(RoleType.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = updateIncentiveRuleSchema.parse(req.body);
    const updated = await incentivesService.updateRule(req.params.id, validatedData);
    ApiResponseUtils.success(res, updated, 'Incentive rule updated');
  } catch (error: any) {
    if (error instanceof ZodError) return next(error);
    ApiResponseUtils.badRequest(res, error.message || 'Failed to update rule');
  }
});
