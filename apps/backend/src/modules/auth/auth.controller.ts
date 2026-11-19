import { Router, Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AuthService } from './auth.service';
import {
  sendOtpSchema,
  verifyOtpSchema,
  registerSchema,
  loginWithPasswordSchema,
  refreshTokenSchema,
  googleAuthSchema,
} from './auth.dto';
import { ApiResponseUtils } from '../../common/utils/api-response.utils';
import { authenticateJwt } from '../../common/middleware/auth.middleware';
import { otpRateLimiter } from '../../common/middleware/rate-limiter.middleware';

export const authRouter = Router();
const authService = new AuthService();

/**
 * @route   POST /api/v1/auth/otp/send
 * @desc    Dispatch 6-digit verification code to mobile (simulated SMS / Twilio / MSG91)
 * @access  Public
 */
authRouter.post('/otp/send', otpRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = sendOtpSchema.parse(req.body);
    const result = await authService.sendOtp(validatedData);
    ApiResponseUtils.success(res, result, 'OTP dispatched successfully');
  } catch (error: any) {
    if (error instanceof ZodError) return next(error);
    ApiResponseUtils.badRequest(res, error.message || 'Failed to dispatch OTP');
  }
});

/**
 * @route   POST /api/v1/auth/otp/verify
 * @desc    Verify OTP and issue session tokens (auto-creates Citizen if not found)
 * @access  Public
 */
authRouter.post('/otp/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = verifyOtpSchema.parse(req.body);
    const result = await authService.verifyOtp(validatedData);
    ApiResponseUtils.success(res, result, 'Mobile number verified and session established');
  } catch (error: any) {
    if (error instanceof ZodError) return next(error);
    ApiResponseUtils.badRequest(res, error.message || 'OTP verification failed');
  }
});

/**
 * @route   POST /api/v1/auth/register
 * @desc    Complete profile registration for Citizen or Legal Service Provider
 * @access  Public
 */
authRouter.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const result = await authService.register(validatedData);
    ApiResponseUtils.created(res, result, 'Registration completed successfully');
  } catch (error: any) {
    if (error instanceof ZodError) return next(error);
    ApiResponseUtils.badRequest(res, error.message || 'Registration failed');
  }
});

/**
 * @route   POST /api/v1/auth/login
 * @desc    Password-based login with identifier (phone or email)
 * @access  Public
 */
authRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = loginWithPasswordSchema.parse(req.body);
    const result = await authService.loginWithPassword(validatedData);
    ApiResponseUtils.success(res, result, 'Login successful');
  } catch (error: any) {
    if (error instanceof ZodError) return next(error);
    ApiResponseUtils.badRequest(res, error.message || 'Login failed');
  }
});

/**
 * @route   POST /api/v1/auth/google
 * @desc    Authenticate with Google Sign-In (Citizen or LSP)
 * @access  Public
 */
authRouter.post('/google', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = googleAuthSchema.parse(req.body);
    const result = await authService.googleAuth(validatedData);
    ApiResponseUtils.success(res, result, 'Google authentication successful');
  } catch (error: any) {
    if (error instanceof ZodError) return next(error);
    ApiResponseUtils.badRequest(res, error.message || 'Google authentication failed');
  }
});

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh session access token
 * @access  Public
 */
authRouter.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = refreshTokenSchema.parse(req.body);
    const result = await authService.refreshTokens(validatedData.refreshToken);
    ApiResponseUtils.success(res, result, 'Tokens refreshed successfully');
  } catch (error: any) {
    if (error instanceof ZodError) return next(error);
    ApiResponseUtils.badRequest(res, error.message || 'Token refresh failed');
  }
});

/**
 * @route   GET /api/v1/auth/me
 * @desc    Fetch active user profile, permissions, tier status, and wallet balance
 * @access  Protected
 */
authRouter.get('/me', authenticateJwt, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const me = await authService.getMe(userId);
    ApiResponseUtils.success(res, me, 'User identity details retrieved');
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Revoke session and sign out
 * @access  Protected
 */
authRouter.post('/logout', authenticateJwt, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const accessToken = req.token;
    const refreshToken = req.body?.refreshToken;
    const result = await authService.logout(userId, accessToken, refreshToken);
    ApiResponseUtils.success(res, result, 'Logged out successfully');
  } catch (error: any) {
    if (error instanceof ZodError) return next(error);
    ApiResponseUtils.badRequest(res, error.message || 'Logout failed');
  }
});

/**
 * @route   POST /api/v1/auth/password-reset/request
 * @desc    Request password reset OTP
 * @access  Public
 */
authRouter.post('/password-reset/request', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const identifier = req.body?.identifier;
    if (!identifier) {
      ApiResponseUtils.badRequest(res, 'Identifier (email or mobile) required');
      return;
    }
    const result = await authService.requestPasswordReset(identifier);
    ApiResponseUtils.success(res, result, 'Password reset OTP dispatched');
  } catch (error: any) {
    if (error instanceof ZodError) return next(error);
    ApiResponseUtils.badRequest(res, error.message || 'Password reset request failed');
  }
});

/**
 * @route   POST /api/v1/auth/password-reset/confirm
 * @desc    Confirm password reset with OTP
 * @access  Public
 */
authRouter.post('/password-reset/confirm', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, otp, newPassword } = req.body || {};
    if (!phone || !otp || !newPassword) {
      ApiResponseUtils.badRequest(res, 'Phone, OTP, and newPassword are required');
      return;
    }
    const result = await authService.confirmPasswordReset(phone, otp, newPassword);
    ApiResponseUtils.success(res, result, result.message || 'Password reset confirmed');
  } catch (error: any) {
    if (error instanceof ZodError) return next(error);
    ApiResponseUtils.badRequest(res, error.message || 'Password reset confirmation failed');
  }
});
