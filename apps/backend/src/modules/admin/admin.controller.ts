import { Router, Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { adminService } from './admin.service';
import {
  updateUserStatusSchema,
  resolveDisputeSchema,
  updateIncentiveRuleSchema,
  adminUserQuerySchema,
  adminDisputeQuerySchema,
  createCategorySchema,
  updateCategorySchema,
  analyticsQuerySchema,
} from './admin.dto';
import { authenticateJwt } from '../../common/middleware/auth.middleware';
import { requireRoles } from '../../common/middleware/roles.middleware';
import { RoleType } from '../../common/types';
import { ApiResponseUtils } from '../../common/utils/api-response.utils';

export const adminRouter = Router();

// Guard all admin routes with authentication and RBAC checks
adminRouter.use(authenticateJwt);
adminRouter.use(requireRoles(RoleType.ADMIN, RoleType.VERIFIER));

/**
 * @route   GET /api/v1/admin/analytics/overview
 * @desc    Comprehensive GovTech analytics & platform telemetry with date range filtering
 * @access  Protected (Admin / Verifier)
 */
adminRouter.get('/analytics/overview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = analyticsQuerySchema.parse(req.query);
    const analytics = await adminService.getAnalyticsOverview(query);
    return ApiResponseUtils.success(res, analytics, 'Platform analytics retrieved successfully');
  } catch (error: any) {
    if (error instanceof ZodError) return next(error);
    return ApiResponseUtils.error(res, error.message || 'Failed to retrieve analytics', 500);
  }
});

/**
 * @route   GET /api/v1/admin/users
 * @desc    Paginated directory of platform users with role/status filters & search
 * @access  Protected (Admin / Verifier)
 */
adminRouter.get('/users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = adminUserQuerySchema.parse(req.query);
    const users = await adminService.getUsers(query);
    return ApiResponseUtils.success(res, users, 'Users retrieved successfully');
  } catch (error: any) {
    if (error instanceof ZodError) return next(error);
    return ApiResponseUtils.badRequest(res, error.message || 'Invalid user query parameters');
  }
});

/**
 * @route   PATCH /api/v1/admin/users/:id/status
 * @desc    Suspend or activate user account with statutory audit logging
 * @access  Protected (Admin only)
 */
adminRouter.patch(
  '/users/:id/status',
  requireRoles(RoleType.ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const targetUserId = req.params.id;
      const adminUserId = req.user!.userId;
      const input = updateUserStatusSchema.parse(req.body);

      const result = await adminService.updateUserStatus(
        targetUserId,
        input,
        adminUserId,
        req.ip || '127.0.0.1'
      );
      return ApiResponseUtils.success(res, result, 'User account status updated successfully');
    } catch (error: any) {
      if (error instanceof ZodError) return next(error);
      return ApiResponseUtils.badRequest(res, error.message || 'Failed to update user status');
    }
  }
);

/**
 * @route   GET /api/v1/admin/categories
 * @desc    Get all statutory legal categories
 * @access  Protected (Admin / Verifier)
 */
adminRouter.get('/categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activeOnly = req.query.activeOnly === 'true';
    const categories = await adminService.getCategories(activeOnly);
    return ApiResponseUtils.success(res, categories, 'Legal categories retrieved successfully');
  } catch (error: any) {
    return ApiResponseUtils.error(res, error.message || 'Failed to retrieve categories', 500);
  }
});

/**
 * @route   POST /api/v1/admin/categories
 * @desc    Create new statutory legal practice category
 * @access  Protected (Admin only)
 */
adminRouter.post(
  '/categories',
  requireRoles(RoleType.ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminUserId = req.user!.userId;
      const input = createCategorySchema.parse(req.body);
      const newCategory = await adminService.createCategory(input, adminUserId);
      return ApiResponseUtils.created(res, newCategory, 'Legal category created successfully');
    } catch (error: any) {
      if (error instanceof ZodError) return next(error);
      return ApiResponseUtils.badRequest(res, error.message || 'Failed to create category');
    }
  }
);

/**
 * @route   PATCH /api/v1/admin/categories/:id
 * @desc    Update statutory legal category
 * @access  Protected (Admin only)
 */
adminRouter.patch(
  '/categories/:id',
  requireRoles(RoleType.ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminUserId = req.user!.userId;
      const input = updateCategorySchema.parse(req.body);
      const updated = await adminService.updateCategory(req.params.id, input, adminUserId);
      return ApiResponseUtils.success(res, updated, 'Legal category updated successfully');
    } catch (error: any) {
      if (error instanceof ZodError) return next(error);
      return ApiResponseUtils.badRequest(res, error.message || 'Failed to update category');
    }
  }
);

/**
 * @route   DELETE /api/v1/admin/categories/:id
 * @desc    Delete statutory legal category
 * @access  Protected (Admin only)
 */
adminRouter.delete(
  '/categories/:id',
  requireRoles(RoleType.ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminUserId = req.user!.userId;
      const result = await adminService.deleteCategory(req.params.id, adminUserId);
      return ApiResponseUtils.success(res, result, result.message);
    } catch (error: any) {
      return ApiResponseUtils.badRequest(res, error.message || 'Failed to delete category');
    }
  }
);

/**
 * @route   GET /api/v1/admin/disputes
 * @desc    Get list of citizen escrow disputes
 * @access  Protected (Admin / Verifier)
 */
adminRouter.get('/disputes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = adminDisputeQuerySchema.parse(req.query);
    const disputes = await adminService.getDisputes(query);
    return ApiResponseUtils.success(res, disputes, 'Disputes retrieved successfully');
  } catch (error: any) {
    if (error instanceof ZodError) return next(error);
    return ApiResponseUtils.badRequest(res, error.message || 'Invalid dispute query parameters');
  }
});

/**
 * @route   POST /api/v1/admin/disputes/:id/resolve
 * @desc    Resolve escrow dispute (Refund Citizen or Release to Provider)
 * @access  Protected (Admin / Verifier)
 */
adminRouter.post('/disputes/:id/resolve', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const disputeId = req.params.id;
    const adminUserId = req.user!.userId;
    const input = resolveDisputeSchema.parse(req.body);

    const resolved = await adminService.resolveDispute(
      disputeId,
      input,
      adminUserId,
      req.ip || '127.0.0.1'
    );
    return ApiResponseUtils.success(res, resolved, 'Dispute resolved successfully');
  } catch (error: any) {
    if (error instanceof ZodError) return next(error);
    return ApiResponseUtils.badRequest(res, error.message || 'Failed to resolve dispute');
  }
});

/**
 * @route   GET /api/v1/admin/incentive-rules
 * @desc    Get all configurable incentive rules with trigger counts and A/B status
 * @access  Protected (Admin / Verifier)
 */
adminRouter.get('/incentive-rules', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rules = await adminService.getIncentiveRules();
    return ApiResponseUtils.success(res, rules, 'Incentive rules retrieved successfully');
  } catch (error: any) {
    return ApiResponseUtils.error(res, error.message || 'Failed to retrieve incentive rules', 500);
  }
});

/**
 * @route   PATCH /api/v1/admin/incentive-rules/:id
 * @desc    Update rule points, active state, or A/B group
 * @access  Protected (Admin only)
 */
adminRouter.patch(
  '/incentive-rules/:id',
  requireRoles(RoleType.ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ruleId = req.params.id;
      const adminUserId = req.user!.userId;
      const input = updateIncentiveRuleSchema.parse(req.body);

      const updated = await adminService.updateIncentiveRule(ruleId, input, adminUserId);
      return ApiResponseUtils.success(res, updated, 'Incentive rule updated successfully');
    } catch (error: any) {
      if (error instanceof ZodError) return next(error);
      return ApiResponseUtils.badRequest(res, error.message || 'Failed to update incentive rule');
    }
  }
);

/**
 * @route   GET /api/v1/admin/audit-logs
 * @desc    Get immutable statutory audit trail (DPDP Act & IT Act 2000)
 * @access  Protected (Admin / Verifier)
 */
adminRouter.get('/audit-logs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '25', 10);
    const action = req.query.action as string | undefined;

    const logs = await adminService.getAuditLogs(page, limit, action);
    return ApiResponseUtils.success(res, logs, 'Statutory audit logs retrieved successfully');
  } catch (error: any) {
    return ApiResponseUtils.error(res, error.message || 'Failed to retrieve audit logs', 500);
  }
});

/**
 * @route   GET /api/v1/admin/export/users
 * @desc    Export platform users as CSV
 * @access  Protected (Admin only)
 */
adminRouter.get(
  '/export/users',
  requireRoles(RoleType.ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const csv = adminService.exportUsersCSV();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="users-export.csv"');
      return res.status(200).send(csv);
    } catch (error: any) {
      return ApiResponseUtils.error(res, error.message || 'Failed to export users CSV', 500);
    }
  }
);

/**
 * @route   GET /api/v1/admin/export/audit-logs
 * @desc    Export statutory audit logs as CSV
 * @access  Protected (Admin only)
 */
adminRouter.get(
  '/export/audit-logs',
  requireRoles(RoleType.ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const csv = adminService.exportAuditLogsCSV();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="audit-logs-export.csv"');
      return res.status(200).send(csv);
    } catch (error: any) {
      return ApiResponseUtils.error(res, error.message || 'Failed to export audit logs CSV', 500);
    }
  }
);
