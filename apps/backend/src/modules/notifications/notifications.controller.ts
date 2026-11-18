import { Router, Request, Response } from 'express';
import { notificationsService } from './notifications.service';
import { authenticateJwt } from '../../common/middleware/auth.middleware';
import { ApiResponseUtils } from '../../common/utils/api-response.utils';
import { getNotificationsQuerySchema } from './notifications.dto';

const router = Router();

/**
 * GET /api/v1/notifications
 * Fetch user notifications
 */
router.get('/', authenticateJwt, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const query = getNotificationsQuerySchema.parse(req.query);
    const unreadOnly = query.unreadOnly === 'true';

    const result = await notificationsService.getUserNotifications(
      userId,
      unreadOnly,
      query.page,
      query.limit
    );

    return ApiResponseUtils.success(res, result, 'Notifications fetched successfully');
  } catch (error: any) {
    return ApiResponseUtils.badRequest(res, error.message || 'Failed to fetch notifications');
  }
});

/**
 * GET /api/v1/notifications/logs
 * Fetch multi-channel SMS / Email communication audit logs
 */
router.get('/logs', authenticateJwt, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const logs = await notificationsService.getCommunicationLogs(userId);
    return ApiResponseUtils.success(res, logs, 'Communication logs retrieved successfully');
  } catch (error: any) {
    return ApiResponseUtils.badRequest(res, error.message || 'Failed to fetch communication logs');
  }
});

/**
 * PATCH /api/v1/notifications/:id/read
 * Mark notification as read
 */
router.patch('/:id/read', authenticateJwt, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const notificationId = req.params.id;

    const updated = await notificationsService.markAsRead(userId, notificationId);
    return ApiResponseUtils.success(res, updated, 'Notification marked as read');
  } catch (error: any) {
    return ApiResponseUtils.badRequest(res, error.message || 'Failed to update notification');
  }
});

/**
 * PATCH /api/v1/notifications/read-all
 * Mark all user notifications as read
 */
router.patch('/read-all', authenticateJwt, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const result = await notificationsService.markAllAsRead(userId);

    return ApiResponseUtils.success(res, result, 'All notifications marked as read');
  } catch (error: any) {
    return ApiResponseUtils.badRequest(res, error.message || 'Failed to mark all as read');
  }
});

export const notificationsRouter = router;

