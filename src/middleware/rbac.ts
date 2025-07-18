import { Request, Response, NextFunction } from 'express';
import { rbacService } from '../services/rbacService';
import { logger } from '../utils/logger';

/**
 * Middleware to check if user has required permission
 * @param resource The resource to check permission for
 * @param action The action to check permission for
 */
export const requirePermission = (resource: string, action: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
        return;
      }

      // Check if user has permission
      const hasPermission = await rbacService.hasPermission(
        req.user.userId,
        resource,
        action
      );

      if (!hasPermission) {
        logger.warn(`Permission denied: ${req.user.userId} tried to ${action} ${resource}`);
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: `You don't have permission to ${action} ${resource}`,
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Error checking permission:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while checking permissions',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      });
    }
  };
};

/**
 * Middleware to check if user has any of the required permissions
 * @param permissions Array of {resource, action} pairs
 */
export const requireAnyPermission = (permissions: Array<{ resource: string; action: string }>) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
        return;
      }

      // Check if user has any of the permissions
      for (const { resource, action } of permissions) {
        const hasPermission = await rbacService.hasPermission(
          req.user.userId,
          resource,
          action
        );

        if (hasPermission) {
          return next();
        }
      }

      // If we get here, user doesn't have any of the required permissions
      logger.warn(`Permission denied: ${req.user.userId} lacks required permissions`);
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You don\'t have permission to access this resource',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      });
    } catch (error) {
      logger.error('Error checking permissions:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while checking permissions',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      });
    }
  };
};

/**
 * Middleware to check if user belongs to the same organization
 * @param paramName The parameter name containing the organization ID
 */
export const requireSameOrganization = (paramName: string = 'organizationId') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
        return;
      }

      // Get organization ID from params or body
      const organizationId = req.params[paramName] || req.body[paramName];

      if (!organizationId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: `Organization ID is required (${paramName})`,
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
        return;
      }

      // Check if user belongs to the organization
      if (req.user.organizationId !== organizationId) {
        logger.warn(`Organization mismatch: ${req.user.userId} tried to access ${organizationId}`);
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You don\'t have permission to access this organization',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Error checking organization:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while checking organization',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      });
    }
  };
};