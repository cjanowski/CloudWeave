import { BaseRepository, QueryOptions, PaginatedResult } from './base';
import { Role } from '../types';

export interface UserEntity {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  organization_id: string;
  is_active: boolean;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserData {
  email: string;
  password_hash: string;
  name: string;
  organization_id: string;
  is_active?: boolean;
}

export interface UpdateUserData {
  email?: string;
  password_hash?: string;
  name?: string;
  is_active?: boolean;
  last_login_at?: Date;
}

export class UserRepository extends BaseRepository<UserEntity> {
  constructor() {
    super('users');
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const result = await this.db(this.tableName)
      .where({ email })
      .first();
    
    return result || null;
  }

  async findByOrganization(organizationId: string, options: QueryOptions = {}): Promise<PaginatedResult<UserEntity>> {
    return this.findAll({
      ...options,
      filters: { ...options.filters, organization_id: organizationId }
    });
  }

  async findWithRoles(userId: string): Promise<(UserEntity & { roles: Role[] }) | null> {
    const user = await this.findById(userId);
    if (!user) return null;

    const roles = await this.db('roles')
      .join('user_roles', 'roles.id', 'user_roles.role_id')
      .where('user_roles.user_id', userId)
      .select('roles.*');

    return {
      ...user,
      roles: roles.map(role => ({
        id: role.id,
        name: role.name,
        permissions: [], // Will be populated by role repository if needed
        organizationId: role.organization_id,
        createdAt: role.created_at,
        updatedAt: role.updated_at
      }))
    };
  }

  async assignRole(userId: string, roleId: string): Promise<void> {
    await this.db('user_roles').insert({
      user_id: userId,
      role_id: roleId
    });
  }

  async removeRole(userId: string, roleId: string): Promise<void> {
    await this.db('user_roles')
      .where({
        user_id: userId,
        role_id: roleId
      })
      .del();
  }

  async getUserRoles(userId: string): Promise<string[]> {
    const roles = await this.db('user_roles')
      .where({ user_id: userId })
      .pluck('role_id');
    
    return roles;
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.db(this.tableName)
      .where({ id: userId })
      .update({
        last_login_at: new Date(),
        updated_at: new Date()
      });
  }

  async findActiveUsers(organizationId?: string): Promise<UserEntity[]> {
    let query = this.db(this.tableName)
      .where({ is_active: true });

    if (organizationId) {
      query = query.where({ organization_id: organizationId });
    }

    return query.orderBy('name');
  }

  async deactivateUser(userId: string): Promise<boolean> {
    const result = await this.update(userId, { is_active: false });
    return !!result;
  }

  async activateUser(userId: string): Promise<boolean> {
    const result = await this.update(userId, { is_active: true });
    return !!result;
  }
}

export const userRepository = new UserRepository();