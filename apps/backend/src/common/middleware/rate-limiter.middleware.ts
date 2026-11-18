import { Request, Response, NextFunction } from 'express';
import { ApiResponseUtils } from '../utils/api-response.utils';

interface RateLimitStore {
  [key: string]: {
    tokens: number;
    lastRefill: number;
  };
}

const activeStores: RateLimitStore[] = [];

export const resetAllRateLimiters = (): void => {
  for (const s of activeStores) {
    for (const key of Object.keys(s)) {
      delete s[key];
    }
  }
};

export const createRateLimiter = (options: {
  windowMs: number;
  maxRequests: number;
  message?: string;
}) => {
  const store: RateLimitStore = {};
  activeStores.push(store);

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const routeKey = `${ip}:${req.baseUrl}${req.path}`;
    const now = Date.now();

    if (!store[routeKey]) {
      store[routeKey] = {
        tokens: options.maxRequests - 1,
        lastRefill: now,
      };
      next();
      return;
    }

    const record = store[routeKey];
    const elapsedTime = now - record.lastRefill;

    if (elapsedTime > options.windowMs) {
      record.tokens = options.maxRequests - 1;
      record.lastRefill = now;
      next();
      return;
    }

    if (record.tokens > 0) {
      record.tokens--;
      next();
      return;
    }

    const waitSeconds = Math.ceil((options.windowMs - elapsedTime) / 1000);
    res.setHeader('Retry-After', waitSeconds.toString());
    ApiResponseUtils.error(
      res,
      options.message || `Too many requests. Please try again in ${waitSeconds} seconds.`,
      429
    );
  };
};

export const otpRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  message: 'Exceeded maximum OTP requests. Please wait 15 minutes before requesting a new OTP.',
});

