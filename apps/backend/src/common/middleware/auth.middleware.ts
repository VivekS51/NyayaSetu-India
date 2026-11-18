import { Request, Response, NextFunction } from 'express';
import { SecurityUtils } from '../utils/security.utils';
import { ApiResponseUtils } from '../utils/api-response.utils';
import { UserSessionPayload } from '../types';
import { dbStore } from '../../config/database';

declare global {
  namespace Express {
    interface Request {
      user?: UserSessionPayload;
      token?: string;
    }
  }
}

export const authenticateJwt = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    ApiResponseUtils.unauthorized(res, 'Authentication token missing or invalid');
    return;
  }

  const token = authHeader.split(' ')[1];

  if (dbStore.revokedTokens.has(token)) {
    ApiResponseUtils.unauthorized(res, 'Token has been revoked. Please sign in again.');
    return;
  }

  try {
    const decoded = SecurityUtils.verifyAccessToken(token);

    if (dbStore.revokedTokens.has(decoded.userId)) {
      ApiResponseUtils.unauthorized(res, 'Session revoked: account decommissioned or logged out.');
      return;
    }

    const user = dbStore.users.find((u) => u.id === decoded.userId);
    if (user && user.status === 'SUSPENDED') {
      ApiResponseUtils.unauthorized(res, 'Account has been decommissioned pursuant to DPDP Act 2023.');
      return;
    }

    req.user = decoded;
    req.token = token;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      ApiResponseUtils.unauthorized(res, 'Session token expired. Please refresh your token.');
      return;
    }
    ApiResponseUtils.unauthorized(res, 'Invalid token authorization');
  }
};

