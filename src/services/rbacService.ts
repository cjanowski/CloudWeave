import { roleRepository } from '../repositories/roleRepository';
import { userRepository } from '../repositories/userRepository';
import { logger } from '../utils/logger';

export interface RoleData {
  id: string;
  name: string;
  organizationId: string;
  description?: string | undefined;
  permissions: PermissionData[];
}

export interface PermissionData {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string | undefined;
}

export class RBACService {
  /**
   * Create a new role
   */
  async createRole(name: string, organizationId: string, description?: string): Promise<RoleData> {
    try {
      // Check if role already exists
      const existingRole = await roleRepository.findByName(name, organizationId);
      if (existingRole) {
        throw new Error(`Role '${name}' already exists in this organization`);
      }

      // Create role
      const role = await roleRepository.create({
        name,
        organization_id: organizationId,
        description: description || null,
      });

      logger.info(`Role created: ${name} for organization ${organizationId}`);

      return {
        id: role.id,
        name: role.name,
        organizationId: role.organization_id,
        description: role.description || undefined,
        permissions: [],
      };
    } catch (error) {
      logger.error('Failed to create role:', error);
      throw new Error(`Failed to create role: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get role by ID with permissions
   */
  async getRole(roleId: string): Promise<RoleData | null> {
    try {
      const role = await roleRepository.findWithPermissions(roleId);
      if (!role) return null;

      return {
        id: role.id,
        name: role.name,
        organizationId: role.organization_id,
        description: role.description || undefined,
        permissions: role.permissions.map(p => ({
          id: p.id,
          name: p.name,
          resource: p.resource,
          action: p.action,
          description: p.description || undefined,
        })),
      };
    } catch (error) {
      logger.error('Failed to get role:', error);
      return null;
    }
  }

  /**
   * Get all roles for an organization
   */
  async getRolesByOrganization(organizationId: string): Promise<RoleData[]> {
    try {
      const { data: roles } = await roleRepository.findByOrganization(organizationId);
      
      // Get permissions for each role
      const rolesWithPermissions = await Promise.all(
        roles.map(async (role) => {
          const permissions = await roleRepository.getRolePermissions(role.id);
          return {
            id: role.id,
            name: role.name,
            organizationId: role.organization_id,
            description: role.description || undefined,
            permissions: permissions.map(p => ({
              id: p.id,
              name: p.name,
              resource: p.resource,
              action: p.action,
              description: p.description || undefined,
            })),
          };
        })
      );

      return rolesWithPermissions;
    } catch (error) {
      logger.error('Failed to get roles by organization:', error);
      return [];
    }
  }

  /**
   * Update a role
   */
  async updateRole(roleId: string, data: { name?: string; description?: string }): Promise<RoleData | null> {
    try {
      // Create update data object with only defined fields
      const updateData: Record<string, any> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      
      const updatedRole = await roleRepository.update(roleId, updateData);

      if (!updatedRole) return null;

      const permissions = await roleRepository.getRolePermissions(roleId);

      return {
        id: updatedRole.id,
        name: updatedRole.name,
        organizationId: updatedRole.organization_id,
        description: updatedRole.description || undefined,
        permissions: permissions.map(p => ({
          id: p.id,
          name: p.name,
          resource: p.resource,
          action: p.action,
          description: p.description || undefined,
        })),
      };
    } catch (error) {
      logger.error('Failed to update role:', error);
      return null;
    }
  }

  /**
   * Delete a role
   */
  async deleteRole(roleId: string): Promise<boolean> {
    try {
      return await roleRepository.delete(roleId);
    } catch (error) {
      logger.error('Failed to delete role:', error);
      return false;
    }
  }

  /**
   * Assign permission to role
   */
  async assignPermissionToRole(roleId: string, permissionId: string): Promise<boolean> {
    try {
      await roleRepository.assignPermission(roleId, permissionId);
      logger.info(`Permission ${permissionId} assigned to role ${roleId}`);
      return true;
    } catch (error) {
      logger.error('Failed to assign permission to role:', error);
      return false;
    }
  }

  /**
   * Remove permission from role
   */
  async removePermissionFromRole(roleId: string, permissionId: string): Promise<boolean> {
    try {
      await roleRepository.removePermission(roleId, permissionId);
      logger.info(`Permission ${permissionId} removed from role ${roleId}`);
      return true;
    } catch (error) {
      logger.error('Failed to remove permission from role:', error);
      return false;
    }
  }

  /**
   * Assign role to user
   */
  async assignRoleToUser(userId: string, roleId: string): Promise<boolean> {
    try {
      await userRepository.assignRole(userId, roleId);
      logger.info(`Role ${roleId} assigned to user ${userId}`);
      return true;
    } catch (error) {
      logger.error('Failed to assign role to user:', error);
      return false;
    }
  }

  /**
   * Remove role from user
   */
  async removeRoleFromUser(userId: string, roleId: string): Promise<boolean> {
    try {
      await userRepository.removeRole(userId, roleId);
      logger.info(`Role ${roleId} removed from user ${userId}`);
      return true;
    } catch (error) {
      logger.error('Failed to remove role from user:', error);
      return false;
    }
  }

  /**
   * Get all permissions
   */
  async getAllPermissions(): Promise<PermissionData[]> {
    try {
      const permissions = await roleRepository.getAllPermissions();
      return permissions.map(p => ({
        id: p.id,
        name: p.name,
        resource: p.resource,
        action: p.action,
        description: p.description || undefined,
      }));
    } catch (error) {
      logger.error('Failed to get all permissions:', error);
      return [];
    }
  }

  /**
   * Get permissions by resource
   */
  async getPermissionsByResource(resource: string): Promise<PermissionData[]> {
    try {
      const permissions = await roleRepository.getPermissionsByResource(resource);
      return permissions.map(p => ({
        id: p.id,
        name: p.name,
        resource: p.resource,
        action: p.action,
        description: p.description || undefined,
      }));
    } catch (error) {
      logger.error(`Failed to get permissions for resource ${resource}:`, error);
      return [];
    }
  }

  /**
   * Get user permissions
   */
  async getUserPermissions(userId: string): Promise<PermissionData[]> {
    try {
      const permissions = await roleRepository.getUserPermissions(userId);
      return permissions.map(p => ({
        id: p.id,
        name: p.name,
        resource: p.resource,
        action: p.action,
        description: p.description || undefined,
      }));
    } catch (error) {
      logger.error(`Failed to get permissions for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Check if user has permission
   */
  async hasPermission(userId: string, resource: string, action: string): Promise<boolean> {
    try {
      return await roleRepository.hasPermission(userId, resource, action);
    } catch (error) {
      logger.error(`Failed to check permission for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Get user roles
   */
  async getUserRoles(userId: string): Promise<RoleData[]> {
    try {
      const roles = await roleRepository.getUserRoles(userId);
      
      // Get permissions for each role
      const rolesWithPermissions = await Promise.all(
        roles.map(async (role) => {
          const permissions = await roleRepository.getRolePermissions(role.id);
          return {
            id: role.id,
            name: role.name,
            organizationId: role.organization_id,
            description: role.description || undefined,
            permissions: permissions.map(p => ({
              id: p.id,
              name: p.name,
              resource: p.resource,
              action: p.action,
              description: p.description || undefined,
            })),
          };
        })
      );

      return rolesWithPermissions;
    } catch (error) {
      logger.error(`Failed to get roles for user ${userId}:`, error);
      return [];
    }
  }
}

export const rbacService = new RBACService();