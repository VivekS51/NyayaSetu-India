import { Request, Response, NextFunction } from 'express';
import { ApiResponseUtils } from '../utils/api-response.utils';
import { RoleType } from '../types';

export const requireRoles = (...allowedRoles: RoleType[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ApiResponseUtils.unauthorized(res, 'Authentication required');
      return;
    }

    const userRoles = req.user.roles || [];
    const hasRole = userRoles.some((role) => allowedRoles.includes(role));

    if (!hasRole) {
      ApiResponseUtils.forbidden(
        res,
        `Forbidden - Access denied. Required role(s): ${allowedRoles.join(', ')}`
      );
      return;
    }

    next();
  };
};

