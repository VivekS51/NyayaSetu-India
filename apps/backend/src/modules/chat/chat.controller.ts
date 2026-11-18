import { Router, Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ChatService } from './chat.service';
import { sendMessageSchema } from './chat.dto';
import { authenticateJwt } from '../../common/middleware/auth.middleware';
import { ApiResponseUtils } from '../../common/utils/api-response.utils';

export const chatRouter = Router();
const chatService = new ChatService();

chatRouter.use(authenticateJwt);

/**
 * @route   GET /api/v1/chat/:bookingId
 * @desc    Fetch encrypted conversation history and shared documents for booking
 * @access  Protected (Participants)
 */
chatRouter.get('/:bookingId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const history = await chatService.getConversationHistory(req.params.bookingId, userId);
    ApiResponseUtils.success(res, history, 'Chat messages retrieved');
  } catch (error: any) {
    if (error?.message?.includes('Access denied') || error?.message?.includes('Unauthorized')) {
      ApiResponseUtils.forbidden(res, error.message);
      return;
    }
    if (error instanceof ZodError) return next(error);
    ApiResponseUtils.badRequest(res, error.message || 'Failed to retrieve chat messages');
  }
});

/**
 * @route   POST /api/v1/chat/:bookingId/messages
 * @desc    Send secure message or attach case document in consultation room
 * @access  Protected (Participants)
 */
chatRouter.post('/:bookingId/messages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const validatedData = sendMessageSchema.parse(req.body);
    const message = await chatService.postMessage(req.params.bookingId, userId, validatedData);
    ApiResponseUtils.created(res, message, 'Message dispatched');
  } catch (error: any) {
    if (error?.message?.includes('Unauthorized') || error?.message?.includes('Access denied')) {
      ApiResponseUtils.forbidden(res, error.message);
      return;
    }
    if (error instanceof ZodError) return next(error);
    ApiResponseUtils.badRequest(res, error.message || 'Failed to dispatch message');
  }
});
