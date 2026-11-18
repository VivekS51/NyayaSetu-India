import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiResponseUtils } from '../utils/api-response.utils';

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Handle Zod Schema Validation Errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
      rule: e.code,
    }));

    const primaryMessage = err.errors[0]?.message || 'Request validation failed';
    ApiResponseUtils.badRequest(res, primaryMessage, formattedErrors);
    return;
  }

  // Handle Syntax Errors (e.g. malformed JSON body)
  if (err instanceof SyntaxError && 'body' in err) {
    ApiResponseUtils.badRequest(res, 'Malformed JSON payload in request body');
    return;
  }

  console.error('[API Error Uncaught]', {
    path: req.path,
    method: req.method,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  ApiResponseUtils.error(
    res,
    err.message || 'Internal server error occurred',
    err.statusCode || 500
  );
};

