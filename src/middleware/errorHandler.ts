import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
  isOperational?: boolean;
}

/**
 * Custom error class for application errors
 */
export class ApplicationError extends Error implements AppError {
  public statusCode: number;
  public code: string;
  public details?: any;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: any
  ) {
    super(message);
    this.name = 'ApplicationError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Predefined error types
 */
export class ValidationError extends ApplicationError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends ApplicationError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class AuthorizationError extends ApplicationError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends ApplicationError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends ApplicationError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class RateLimitError extends ApplicationError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Default error values
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'An unexpected error occurred';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = 'Invalid ID format';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  }

  // Log error
  const logLevel = statusCode >= 500 ? 'error' : 'warn';
  logger[logLevel](`${req.method} ${req.path} - ${statusCode}`, {
    error: {
      name: err.name,
      message: err.message,
      code,
      stack: err.stack,
    },
    requestId: req.headers['x-request-id'],
    userId: req.user?.userId,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  // Send error response
  const errorResponse: ApiResponse<never> = {
    success: false,
    error: {
      code,
      message,
      ...(err.details && { details: err.details }),
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown',
    },
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development' && statusCode >= 500) {
    errorResponse.error.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Async error wrapper to catch async errors in route handlers
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 handler for unmatched routes
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route not found: ${req.method} ${req.originalUrl}`,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown',
    },
  } as ApiResponse<never>);
};