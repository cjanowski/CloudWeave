import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types';

/**
 * Middleware factory for request validation using Joi schemas
 */
export const validateRequest = (schema: {
  body?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  headers?: Joi.ObjectSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    // Validate request body
    if (schema.body) {
      const { error } = schema.body.validate(req.body);
      if (error) {
        errors.push(`Body: ${error.details[0].message}`);
      }
    }

    // Validate request parameters
    if (schema.params) {
      const { error } = schema.params.validate(req.params);
      if (error) {
        errors.push(`Params: ${error.details[0].message}`);
      }
    }

    // Validate query parameters
    if (schema.query) {
      const { error } = schema.query.validate(req.query);
      if (error) {
        errors.push(`Query: ${error.details[0].message}`);
      }
    }

    // Validate headers
    if (schema.headers) {
      const { error } = schema.headers.validate(req.headers);
      if (error) {
        errors.push(`Headers: ${error.details[0].message}`);
      }
    }

    if (errors.length > 0) {
      logger.warn(`Validation failed for ${req.method} ${req.path}:`, errors);
      
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: errors,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      } as ApiResponse<never>);
      return;
    }

    next();
  };
};

/**
 * Common validation schemas
 */
export const commonSchemas = {
  // UUID parameter validation
  uuidParam: Joi.object({
    id: Joi.string().uuid().required(),
  }),

  // Organization ID parameter validation
  organizationParam: Joi.object({
    organizationId: Joi.string().uuid().required(),
  }),

  // Pagination query validation
  paginationQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(50),
    orderBy: Joi.string().optional(),
    orderDirection: Joi.string().valid('asc', 'desc').default('desc'),
  }),

  // Search query validation
  searchQuery: Joi.object({
    q: Joi.string().min(1).max(100).optional(),
    filters: Joi.object().optional(),
  }),

  // Common headers validation
  apiHeaders: Joi.object({
    'content-type': Joi.string().valid('application/json').when('$method', {
      is: Joi.string().valid('POST', 'PUT', 'PATCH'),
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    'authorization': Joi.string().pattern(/^Bearer .+$/).optional(),
    'x-request-id': Joi.string().uuid().optional(),
  }).unknown(true),
};

/**
 * Middleware to add request ID if not present
 */
export const addRequestId = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.headers['x-request-id']) {
    req.headers['x-request-id'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Add request ID to response headers
  res.setHeader('x-request-id', req.headers['x-request-id']);
  
  next();
};

/**
 * Middleware to log requests
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  // Log request
  logger.info(`${req.method} ${req.path}`, {
    requestId: req.headers['x-request-id'],
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    body: req.method !== 'GET' ? req.body : undefined,
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} - ${res.statusCode}`, {
      requestId: req.headers['x-request-id'],
      duration: `${duration}ms`,
      statusCode: res.statusCode,
    });
  });

  next();
};