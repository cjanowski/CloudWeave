import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { authenticateToken } from '../middleware/auth';
import { requirePermission, requireSameOrganization } from '../middleware/rbac';
import { rbacService } from '../services/rbacService';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types';

const router = Router();

// Validation schemas
const createRoleSchema = Joi.object({
  name: Joi.string().required().min(2).max(50),
  organizationId: Joi.string().required().uuid(),
  description: Joi.string().optional().max(200),
});

const updateRoleSchema = Joi.object({
  name: Joi.string().optional().min(2).max(50),
  description: Joi.string().optional().max(200),
});

const assignPermissionSchema = Joi.object({
  permissionId: Joi.string().required().uuid(),
});

const assignRoleSchema = Joi.object({
  roleId: Joi.string().required().uuid(),
});

// Get all roles for organization
router.get(
  '/organizations/:organizationId/roles',
  authenticateToken,
  requireSameOrganization('organizationId'),
  requirePermission('role', 'read'),
  async (req: Request, res: Response) => {
    try {
      const organizationId = req.params.organizationId;
      const roles = await rbacService.getRolesByOrganization(organizationId);

      res.status(200).json({
        success: true,
        data: roles,
      } as ApiResponse<typeof roles>);
    } catch (error) {
      logger.error('Failed to get roles:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get roles',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      } as ApiResponse<never>);
    }
  }
);

// Create a new role
router.post(
  '/organizations/:organizationId/roles',
  authenticateToken,
  requireSameOrganization('organizationId'),
  requirePermission('role', 'write'),
  async (req: Request, res: Response) => {
    try {
      // Validate request body
      const { error, value } = createRoleSchema.validate({
        ...req.body,
        organizationId: req.params.organizationId,
      });

      if (error) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.details[0].message,
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        } as ApiResponse<never>);
      }

      const role = await rbacService.createRole(
        value.name,
        value.organizationId,
        value.description
      );

      res.status(201).json({
        success: true,
        data: role,
      } as ApiResponse<typeof role>);
    } catch (error) {
      logger.error('Failed to create role:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'ROLE_CREATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to create role',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      } as ApiResponse<never>);
    }
  }
);

// Get a specific role
router.get(
  '/roles/:roleId',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const roleId = req.params.roleId;
      const role = await rbacService.getRole(roleId);

      if (!role) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ROLE_NOT_FOUND',
            message: 'Role not found',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        } as ApiResponse<never>);
      }

      // Check if user belongs to the same organization
      if (req.user?.organizationId !== role.organizationId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You don\'t have permission to access this role',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        } as ApiResponse<never>);
      }

      // Check if user has permission to read roles
      // Ensure userId is defined
      if (!req.user?.userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        } as ApiResponse<never>);
      }
      
      const hasPermission = await rbacService.hasPermission(req.user.userId, 'role', 'read');
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You don\'t have permission to read roles',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        } as ApiResponse<never>);
      }

      res.status(200).json({
        success: true,
        data: role,
      } as ApiResponse<typeof role>);
    } catch (error) {
      logger.error('Failed to get role:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get role',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      } as ApiResponse<never>);
    }
  }
);

// Update a role
router.put(
  '/roles/:roleId',
  authenticateToken,
  requirePermission('role', 'write'),
  async (req: Request, res: Response) => {
    try {
      const roleId = req.params.roleId;
      
      // Get the role to check organization
      const existingRole = await rbacService.getRole(roleId);
      if (!existingRole) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ROLE_NOT_FOUND',
            message: 'Role not found',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        } as ApiResponse<never>);
      }

      // Check if user belongs to the same organization
      if (req.user?.organizationId !== existingRole.organizationId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You don\'t have permission to update this role',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        } as ApiResponse<never>);
      }

      // Validate request body
      const { error, value } = updateRoleSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.details[0].message,
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        } as ApiResponse<never>);
      }

      const updatedRole = await rbacService.updateRole(roleId, value);
      if (!updatedRole) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ROLE_UPDATE_FAILED',
            message: 'Failed to update role',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        } as ApiResponse<never>);
      }

      res.status(200).json({
        success: true,
        data: updatedRole,
      } as ApiResponse<typeof updatedRole>);
    } catch (error) {
      logger.error('Failed to update role:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update role',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      } as ApiResponse<never>);
    }
  }
);

// Delete a role
router.delete(
  '/roles/:roleId',
  authenticateToken,
  requirePermission('role', 'delete'),
  async (req: Request, res: Response) => {
    try {
      const roleId = req.params.roleId;
      
      // Get the role to check organization
      const existingRole = await rbacService.getRole(roleId);
      if (!existingRole) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ROLE_NOT_FOUND',
            message: 'Role not found',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        } as ApiResponse<never>);
      }

      // Check if user belongs to the same organization
      if (req.user?.organizationId !== existingRole.organizationId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You don\'t have permission to delete this role',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        } as ApiResponse<never>);
      }

      const deleted = await rbacService.deleteRole(roleId);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ROLE_DELETE_FAILED',
            message: 'Failed to delete role',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        } as ApiResponse<never>);
      }

      res.status(200).json({
        success: true,
        data: { message: 'Role deleted successfully' },
      } as ApiResponse<{ message: string }>);
    } catch (error) {
      logger.error('Failed to delete role:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete role',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      } as ApiResponse<never>);
    }
  }
);

// Assign permission to role
router.post(
  '/roles/:roleId/permissions',
  authenticateToken,
  requirePermission('role', 'write'),
  async (req: Request, res: Response) => {
    try {
      const roleId = req.params.roleId;
      
      // Get the role to check organization
      const existingRole = await rbacService.getRole(roleId);
      if (!existingRole) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ROLE_NOT_FOUND',
            message: 'Role not found',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        } as ApiResponse<never>);
      }

      // Check if user belongs to the same organization
      if (req.user?.organizationId !== existingRole.organizationId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You don\'t have permission to modify this role',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        } as ApiResponse<never>);
      }

      // Validate request body
      const { error, value } = assignPermissionSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.details[0].message,
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        } as ApiResponse<never>);
      }

      const success = await rbacService.assignPermissionToRole(roleId, value.permissionId);
      if (!success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'PERMISSION_ASSIGNMENT_FAILED',
            message: 'Failed to assign permission to role',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        } as ApiResponse<never>);
      }

      // Get updated role with permissions
      const updatedRole = await rbacService.getRole(roleId);

      res.status(200).json({
        success: true,
        data: updatedRole,
      } as ApiResponse<typeof updatedRole>);
    } catch (error) {
      logger.error('Failed to assign permission to role:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to assign permission to role',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      } as ApiResponse<never>);
    }
  }
);

// Remove permission from role
router.delete(
  '/roles/:roleId/permissions/:permissionId',
  authenticateToken,
  requirePermission('role', 'write'),
  async (req: Request, res: Response) => {
    try {
      const { roleId, permissionId } = req.params;
      
      // Get the role to check organization
      const existingRole = await rbacService.getRole(roleId);
      if (!existingRole) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ROLE_NOT_FOUND',
            message: 'Role not found',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        } as ApiResponse<never>);
      }

      // Check if user belongs to the same organization
      if (req.user?.organizationId !== existingRole.organizationId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You don\'t have permission to modify this role',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        } as ApiResponse<never>);
      }

      const success = await rbacService.removePermissionFromRole(roleId, permissionId);
      if (!success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'PERMISSION_REMOVAL_FAILED',
            message: 'Failed to remove permission from role',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        } as ApiResponse<never>);
      }

      // Get updated role with permissions
      const updatedRole = await rbacService.getRole(roleId);

      res.status(200).json({
        success: true,
        data: updatedRole,
      } as ApiResponse<typeof updatedRole>);
    } catch (error) {
      logger.error('Failed to remove permission from role:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to remove permission from role',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      } as ApiResponse<never>);
    }
  }
);

// Get all permissions
router.get(
  '/permissions',
  authenticateToken,
  requirePermission('permission', 'read'),
  async (req: Request, res: Response) => {
    try {
      const permissions = await rbacService.getAllPermissions();

      res.status(200).json({
        success: true,
        data: permissions,
      } as ApiResponse<typeof permissions>);
    } catch (error) {
      logger.error('Failed to get permissions:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get permissions',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      } as ApiResponse<never>);
    }
  }
);

// Get permissions by resource
router.get(
  '/permissions/resources/:resource',
  authenticateToken,
  requirePermission('permission', 'read'),
  async (req: Request, res: Response) => {
    try {
      const resource = req.params.resource;
      const permissions = await rbacService.getPermissionsByResource(resource);

      res.status(200).json({
        success: true,
        data: permissions,
      } as ApiResponse<typeof permissions>);
    } catch (error) {
      logger.error('Failed to get permissions by resource:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get permissions by resource',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      } as ApiResponse<never>);
    }
  }
);

// Assign role to user
router.post(
  '/users/:userId/roles',
  authenticateToken,
  requirePermission('user', 'write'),
  async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      
      // Validate request body
      const { error, value } = assignRoleSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.details[0].message,
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        } as ApiResponse<never>);
      }

      const success = await rbacService.assignRoleToUser(userId, value.roleId);
      if (!success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'ROLE_ASSIGNMENT_FAILED',
            message: 'Failed to assign role to user',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        } as ApiResponse<never>);
      }

      // Get user roles
      const roles = await rbacService.getUserRoles(userId);

      res.status(200).json({
        success: true,
        data: roles,
      } as ApiResponse<typeof roles>);
    } catch (error) {
      logger.error('Failed to assign role to user:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to assign role to user',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      } as ApiResponse<never>);
    }
  }
);

// Remove role from user
router.delete(
  '/users/:userId/roles/:roleId',
  authenticateToken,
  requirePermission('user', 'write'),
  async (req: Request, res: Response) => {
    try {
      const { userId, roleId } = req.params;
      
      const success = await rbacService.removeRoleFromUser(userId, roleId);
      if (!success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'ROLE_REMOVAL_FAILED',
            message: 'Failed to remove role from user',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        } as ApiResponse<never>);
      }

      // Get user roles
      const roles = await rbacService.getUserRoles(userId);

      res.status(200).json({
        success: true,
        data: roles,
      } as ApiResponse<typeof roles>);
    } catch (error) {
      logger.error('Failed to remove role from user:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to remove role from user',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      } as ApiResponse<never>);
    }
  }
);

// Get user roles
router.get(
  '/users/:userId/roles',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      
      // Only allow users to view their own roles or if they have permission
      if (req.user?.userId !== userId) {
        // Ensure userId is defined
        if (!req.user?.userId) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required',
              timestamp: new Date().toISOString(),
              requestId: req.headers['x-request-id'] || 'unknown',
            },
          } as ApiResponse<never>);
        }
        
        const hasPermission = await rbacService.hasPermission(req.user.userId, 'user', 'read');
        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'You don\'t have permission to view this user\'s roles',
              timestamp: new Date().toISOString(),
              requestId: req.headers['x-request-id'] || 'unknown',
            },
          } as ApiResponse<never>);
        }
      }

      const roles = await rbacService.getUserRoles(userId);

      res.status(200).json({
        success: true,
        data: roles,
      } as ApiResponse<typeof roles>);
    } catch (error) {
      logger.error('Failed to get user roles:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get user roles',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      } as ApiResponse<never>);
    }
  }
);

// Get user permissions
router.get(
  '/users/:userId/permissions',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      
      // Only allow users to view their own permissions or if they have permission
      if (req.user?.userId !== userId) {
        // Ensure userId is defined
        if (!req.user?.userId) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required',
              timestamp: new Date().toISOString(),
              requestId: req.headers['x-request-id'] || 'unknown',
            },
          } as ApiResponse<never>);
        }
        
        const hasPermission = await rbacService.hasPermission(req.user.userId, 'user', 'read');
        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'You don\'t have permission to view this user\'s permissions',
              timestamp: new Date().toISOString(),
              requestId: req.headers['x-request-id'] || 'unknown',
            },
          } as ApiResponse<never>);
        }
      }

      const permissions = await rbacService.getUserPermissions(userId);

      res.status(200).json({
        success: true,
        data: permissions,
      } as ApiResponse<typeof permissions>);
    } catch (error) {
      logger.error('Failed to get user permissions:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get user permissions',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      } as ApiResponse<never>);
    }
  }
);

// Check if user has permission
router.get(
  '/users/:userId/permissions/check',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      const { resource, action } = req.query as { resource: string; action: string };
      
      if (!resource || !action) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Resource and action are required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        } as ApiResponse<never>);
      }

      // Only allow users to check their own permissions or if they have permission
      if (req.user?.userId !== userId) {
        // Ensure userId is defined
        if (!req.user?.userId) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required',
              timestamp: new Date().toISOString(),
              requestId: req.headers['x-request-id'] || 'unknown',
            },
          } as ApiResponse<never>);
        }
        
        const hasPermission = await rbacService.hasPermission(req.user.userId, 'user', 'read');
        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'You don\'t have permission to check this user\'s permissions',
              timestamp: new Date().toISOString(),
              requestId: req.headers['x-request-id'] || 'unknown',
            },
          } as ApiResponse<never>);
        }
      }

      const hasPermission = await rbacService.hasPermission(userId, resource, action);

      res.status(200).json({
        success: true,
        data: { hasPermission },
      } as ApiResponse<{ hasPermission: boolean }>);
    } catch (error) {
      logger.error('Failed to check user permission:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to check user permission',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      } as ApiResponse<never>);
    }
  }
);

export default router;