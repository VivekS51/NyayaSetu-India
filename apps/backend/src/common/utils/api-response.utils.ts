import { Response } from 'express';
import { ApiResponse } from '../types';

export class ApiResponseUtils {
  public static success<T>(
    res: Response,
    data: T,
    message: string = 'Operation completed successfully',
    statusCode: number = 200,
    meta?: ApiResponse['meta']
  ): Response {
    const payload: ApiResponse<T> = {
      success: true,
      message,
      data,
      meta: {
        ...meta,
        timestamp: new Date().toISOString(),
      },
    };
    return res.status(statusCode).json(payload);
  }

  public static created<T>(
    res: Response,
    data: T,
    message: string = 'Resource created successfully'
  ): Response {
    return this.success(res, data, message, 201);
  }

  public static error(
    res: Response,
    message: string = 'An error occurred during processing',
    statusCode: number = 500,
    errors?: any
  ): Response {
    const payload: ApiResponse = {
      success: false,
      message,
      errors: errors || null,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
    return res.status(statusCode).json(payload);
  }

  public static badRequest(res: Response, message: string = 'Bad request', errors?: any): Response {
    return this.error(res, message, 400, errors);
  }

  public static unauthorized(res: Response, message: string = 'Unauthorized access'): Response {
    return this.error(res, message, 401);
  }

  public static forbidden(res: Response, message: string = 'Forbidden - Insufficient permissions'): Response {
    return this.error(res, message, 403);
  }

  public static notFound(res: Response, message: string = 'Requested resource not found'): Response {
    return this.error(res, message, 404);
  }
}

