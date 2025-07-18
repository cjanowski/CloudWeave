import { BaseRepository, QueryOptions, PaginatedResult } from './base';
// No imports from types needed

export interface RoleEntity {
  id: string;
  name: string;
  organization_id: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface PermissionEntity {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface RolePermissionEntity {
  id: string;
  role_id: string;
  permission_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateRoleData {
  name: string;
  organization_id: string;
  description?: string;
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
}

export interface RoleWithPermissions extends RoleEntity {
  permissions: PermissionEntity[];
}

export class RoleRepository extends BaseRepository<RoleEntity> {
  constructor() {
    super('roles');
  }

  async findByName(name: string, organizationId: string): Promise<RoleEntity | null> {
    const result = await this.db(this.tableName)
      .where({ name, organization_id: organizationId })
      .first();
    
    return result || null;
  }

  async findByOrganization(organizationId: string, options: QueryOptions = {}): Promise<PaginatedResult<RoleEntity>> {
    return this.findAll({
      ...options,
      filters: { ...options.filters, organization_id: organizationId }
    });
  }

  async findWithPermissions(roleId: string): Promise<RoleWithPermissions | null> {
    const role = await this.findById(roleId);
    if (!role) return null;

    const permissions = await this.db('permissions')
      .join('role_permissions', 'permissions.id', 'role_permissions.permission_id')
      .where('role_permissions.role_id', roleId)
      .select('permissions.*');

    return {
      ...role,
      permissions
    };
  }

  async assignPermission(roleId: string, permissionId: string): Promise<void> {
    // Check if already assigned
    const existing = await this.db('role_permissions')
      .where({ role_id: roleId, permission_id: permissionId })
      .first();
    
    if (!existing) {
      await this.db('role_permissions').insert({
        role_id: roleId,
        permission_id: permissionId
      });
    }
  }

  async removePermission(roleId: string, permissionId: string): Promise<void> {
    await this.db('role_permissions')
      .where({ role_id: roleId, permission_id: permissionId })
      .del();
  }

  async getRolePermissions(roleId: string): Promise<PermissionEntity[]> {
    return this.db('permissions')
      .join('role_permissions', 'permissions.id', 'role_permissions.permission_id')
      .where('role_permissions.role_id', roleId)
      .select('permissions.*');
  }

  async getUserRoles(userId: string): Promise<RoleEntity[]> {
    return this.db('roles')
      .join('user_roles', 'roles.id', 'user_roles.role_id')
      .where('user_roles.user_id', userId)
      .select('roles.*');
  }

  async getUserPermissions(userId: string): Promise<PermissionEntity[]> {
    return this.db('permissions')
      .join('role_permissions', 'permissions.id', 'role_permissions.permission_id')
      .join('user_roles', 'role_permissions.role_id', 'user_roles.role_id')
      .where('user_roles.user_id', userId)
      .distinct('permissions.*');
  }

  async hasPermission(userId: string, resource: string, action: string): Promise<boolean> {
    const count = await this.db('permissions')
      .join('role_permissions', 'permissions.id', 'role_permissions.permission_id')
      .join('user_roles', 'role_permissions.role_id', 'user_roles.role_id')
      .where('user_roles.user_id', userId)
      .where('permissions.resource', resource)
      .where('permissions.action', action)
      .count('* as count')
      .first();
    
    return parseInt(count?.count as string) > 0;
  }

  async getAllPermissions(): Promise<PermissionEntity[]> {
    return this.db('permissions').orderBy('resource').orderBy('action');
  }

  async getPermissionsByResource(resource: string): Promise<PermissionEntity[]> {
    return this.db('permissions').where({ resource }).orderBy('action');
  }

  async findPermissionByName(name: string): Promise<PermissionEntity | null> {
    const result = await this.db('permissions').where({ name }).first();
    return result || null;
  }

  async createPermission(data: {
    name: string;
    resource: string;
    action: string;
    description?: string;
  }): Promise<PermissionEntity> {
    const [result] = await this.db('permissions')
      .insert(data)
      .returning('*');
    
    return result;
  }
}

export const roleRepository = new RoleRepository();