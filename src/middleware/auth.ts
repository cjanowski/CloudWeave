import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JwtPayload } from '../types';
import { logger } from '../utils/logger';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Access token is required',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret as string) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Token verification failed:', error);
    
    res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'Invalid or expired token',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
  }
};

export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret as string) as JwtPayload;
    req.user = decoded;
  } catch (error) {
    logger.warn('Optional auth token verification failed:', error);
    // Continue without user for optional auth
  }
  
  next();
};

// RBAC middleware has been moved to src/middleware/rbac.ts