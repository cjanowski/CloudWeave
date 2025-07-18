import rateLimit from 'express-rate-limit';
import { config } from '../config';
import { logger } from '../utils/logger';

// Create rate limiter with configuration
export const createRateLimit = (options?: {
  windowMs?: number;
  max?: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}) => {
  const {
    windowMs = config.api.rateLimit.windowMs,
    max = config.api.rateLimit.max,
    message = 'Too many requests from this IP, please try again later',
    skipSuccessfulRequests = false,
  } = options || {};

  return rateLimit({
    windowMs,
    max,
    message: {
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message,
        timestamp: new Date().toISOString(),
      },
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skipSuccessfulRequests,
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      });
    },
  });
};

// Default rate limiter for general API endpoints
export const apiRateLimit = createRateLimit();

// Stricter rate limiter for authentication endpoints
export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many authentication attempts, please try again later',
});

// More lenient rate limiter for read-only endpoints
export const readOnlyRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per window
  skipSuccessfulRequests: true,
});