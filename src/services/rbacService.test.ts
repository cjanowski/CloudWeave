import { rbacService } from './rbacService';
import { roleRepository } from '../repositories/roleRepository';
import { userRepository } from '../repositories/userRepository';

// Mock repositories
jest.mock('../repositories/roleRepository');
jest.mock('../repositories/userRepository');

describe('RBACService', () => {
  const mockOrganizationId = '550e8400-e29b-41d4-a716-446655440000';
  const mockRoleId = '660e8400-e29b-41d4-a716-446655440001';
  const mockUserId = '770e8400-e29b-41d4-a716-446655440001';
  const mockPermissionId = '880e8400-e29b-41d4-a716-446655440001';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createRole', () => {
    it('should create a new role successfully', async () => {
      // Mock repository responses
      (roleRepository.findByName as jest.Mock).mockResolvedValue(null);
      (roleRepository.create as jest.Mock).mockResolvedValue({
        id: mockRoleId,
        name: 'TestRole',
        organization_id: mockOrganizationId,
        description: 'Test role description',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const result = await rbacService.createRole(
        'TestRole',
        mockOrganizationId,
        'Test role description'
      );

      expect(result).toMatchObject({
        id: mockRoleId,
        name: 'TestRole',
        organizationId: mockOrganizationId,
        description: 'Test role description',
        permissions: [],
      });
      expect(roleRepository.findByName).toHaveBeenCalledWith('TestRole', mockOrganizationId);
      expect(roleRepository.create).toHaveBeenCalledWith({
        name: 'TestRole',
        organization_id: mockOrganizationId,
        description: 'Test role description',
      });
    });

    it('should throw error if role already exists', async () => {
      // Mock repository responses
      (roleRepository.findByName as jest.Mock).mockResolvedValue({
        id: mockRoleId,
        name: 'TestRole',
        organization_id: mockOrganizationId,
      });

      await expect(
        rbacService.createRole('TestRole', mockOrganizationId)
      ).rejects.toThrow("Failed to create role: Role 'TestRole' already exists in this organization");
      
      expect(roleRepository.findByName).toHaveBeenCalledWith('TestRole', mockOrganizationId);
      expect(roleRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('getRole', () => {
    it('should get role with permissions', async () => {
      // Mock repository responses
      (roleRepository.findWithPermissions as jest.Mock).mockResolvedValue({
        id: mockRoleId,
        name: 'TestRole',
        organization_id: mockOrganizationId,
        description: 'Test role description',
        created_at: new Date(),
        updated_at: new Date(),
        permissions: [
          {
            id: mockPermissionId,
            name: 'test:read',
            resource: 'test',
            action: 'read',
            description: 'Test permission',
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      });

      const result = await rbacService.getRole(mockRoleId);

      expect(result).toMatchObject({
        id: mockRoleId,
        name: 'TestRole',
        organizationId: mockOrganizationId,
        description: 'Test role description',
        permissions: [
          {
            id: mockPermissionId,
            name: 'test:read',
            resource: 'test',
            action: 'read',
            description: 'Test permission',
          },
        ],
      });
      expect(roleRepository.findWithPermissions).toHaveBeenCalledWith(mockRoleId);
    });

    it('should return null if role not found', async () => {
      // Mock repository responses
      (roleRepository.findWithPermissions as jest.Mock).mockResolvedValue(null);

      const result = await rbacService.getRole('non-existent-id');

      expect(result).toBeNull();
      expect(roleRepository.findWithPermissions).toHaveBeenCalledWith('non-existent-id');
    });
  });

  describe('getRolesByOrganization', () => {
    it('should get all roles for an organization', async () => {
      // Mock repository responses
      (roleRepository.findByOrganization as jest.Mock).mockResolvedValue({
        data: [
          {
            id: mockRoleId,
            name: 'TestRole',
            organization_id: mockOrganizationId,
            description: 'Test role description',
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
      });
      (roleRepository.getRolePermissions as jest.Mock).mockResolvedValue([
        {
          id: mockPermissionId,
          name: 'test:read',
          resource: 'test',
          action: 'read',
          description: 'Test permission',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      const result = await rbacService.getRolesByOrganization(mockOrganizationId);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: mockRoleId,
        name: 'TestRole',
        organizationId: mockOrganizationId,
        description: 'Test role description',
        permissions: [
          {
            id: mockPermissionId,
            name: 'test:read',
            resource: 'test',
            action: 'read',
            description: 'Test permission',
          },
        ],
      });
      expect(roleRepository.findByOrganization).toHaveBeenCalledWith(mockOrganizationId);
      expect(roleRepository.getRolePermissions).toHaveBeenCalledWith(mockRoleId);
    });
  });

  describe('updateRole', () => {
    it('should update role successfully', async () => {
      // Mock repository responses
      (roleRepository.update as jest.Mock).mockResolvedValue({
        id: mockRoleId,
        name: 'UpdatedRole',
        organization_id: mockOrganizationId,
        description: 'Updated description',
        created_at: new Date(),
        updated_at: new Date(),
      });
      (roleRepository.getRolePermissions as jest.Mock).mockResolvedValue([]);

      const result = await rbacService.updateRole(mockRoleId, {
        name: 'UpdatedRole',
        description: 'Updated description',
      });

      expect(result).toMatchObject({
        id: mockRoleId,
        name: 'UpdatedRole',
        organizationId: mockOrganizationId,
        description: 'Updated description',
        permissions: [],
      });
      expect(roleRepository.update).toHaveBeenCalledWith(mockRoleId, {
        name: 'UpdatedRole',
        description: 'Updated description',
      });
      expect(roleRepository.getRolePermissions).toHaveBeenCalledWith(mockRoleId);
    });

    it('should return null if role not found', async () => {
      // Mock repository responses
      (roleRepository.update as jest.Mock).mockResolvedValue(null);

      const result = await rbacService.updateRole('non-existent-id', {
        name: 'UpdatedRole',
      });

      expect(result).toBeNull();
      expect(roleRepository.update).toHaveBeenCalledWith('non-existent-id', {
        name: 'UpdatedRole',
      });
      expect(roleRepository.getRolePermissions).not.toHaveBeenCalled();
    });
  });

  describe('deleteRole', () => {
    it('should delete role successfully', async () => {
      // Mock repository responses
      (roleRepository.delete as jest.Mock).mockResolvedValue(true);

      const result = await rbacService.deleteRole(mockRoleId);

      expect(result).toBe(true);
      expect(roleRepository.delete).toHaveBeenCalledWith(mockRoleId);
    });

    it('should return false if role not found', async () => {
      // Mock repository responses
      (roleRepository.delete as jest.Mock).mockResolvedValue(false);

      const result = await rbacService.deleteRole('non-existent-id');

      expect(result).toBe(false);
      expect(roleRepository.delete).toHaveBeenCalledWith('non-existent-id');
    });
  });

  describe('assignPermissionToRole', () => {
    it('should assign permission to role successfully', async () => {
      // Mock repository responses
      (roleRepository.assignPermission as jest.Mock).mockResolvedValue(undefined);

      const result = await rbacService.assignPermissionToRole(mockRoleId, mockPermissionId);

      expect(result).toBe(true);
      expect(roleRepository.assignPermission).toHaveBeenCalledWith(mockRoleId, mockPermissionId);
    });

    it('should return false if assignment fails', async () => {
      // Mock repository responses
      (roleRepository.assignPermission as jest.Mock).mockRejectedValue(new Error('Assignment failed'));

      const result = await rbacService.assignPermissionToRole(mockRoleId, mockPermissionId);

      expect(result).toBe(false);
      expect(roleRepository.assignPermission).toHaveBeenCalledWith(mockRoleId, mockPermissionId);
    });
  });

  describe('removePermissionFromRole', () => {
    it('should remove permission from role successfully', async () => {
      // Mock repository responses
      (roleRepository.removePermission as jest.Mock).mockResolvedValue(undefined);

      const result = await rbacService.removePermissionFromRole(mockRoleId, mockPermissionId);

      expect(result).toBe(true);
      expect(roleRepository.removePermission).toHaveBeenCalledWith(mockRoleId, mockPermissionId);
    });

    it('should return false if removal fails', async () => {
      // Mock repository responses
      (roleRepository.removePermission as jest.Mock).mockRejectedValue(new Error('Removal failed'));

      const result = await rbacService.removePermissionFromRole(mockRoleId, mockPermissionId);

      expect(result).toBe(false);
      expect(roleRepository.removePermission).toHaveBeenCalledWith(mockRoleId, mockPermissionId);
    });
  });

  describe('assignRoleToUser', () => {
    it('should assign role to user successfully', async () => {
      // Mock repository responses
      (userRepository.assignRole as jest.Mock).mockResolvedValue(undefined);

      const result = await rbacService.assignRoleToUser(mockUserId, mockRoleId);

      expect(result).toBe(true);
      expect(userRepository.assignRole).toHaveBeenCalledWith(mockUserId, mockRoleId);
    });

    it('should return false if assignment fails', async () => {
      // Mock repository responses
      (userRepository.assignRole as jest.Mock).mockRejectedValue(new Error('Assignment failed'));

      const result = await rbacService.assignRoleToUser(mockUserId, mockRoleId);

      expect(result).toBe(false);
      expect(userRepository.assignRole).toHaveBeenCalledWith(mockUserId, mockRoleId);
    });
  });

  describe('removeRoleFromUser', () => {
    it('should remove role from user successfully', async () => {
      // Mock repository responses
      (userRepository.removeRole as jest.Mock).mockResolvedValue(undefined);

      const result = await rbacService.removeRoleFromUser(mockUserId, mockRoleId);

      expect(result).toBe(true);
      expect(userRepository.removeRole).toHaveBeenCalledWith(mockUserId, mockRoleId);
    });

    it('should return false if removal fails', async () => {
      // Mock repository responses
      (userRepository.removeRole as jest.Mock).mockRejectedValue(new Error('Removal failed'));

      const result = await rbacService.removeRoleFromUser(mockUserId, mockRoleId);

      expect(result).toBe(false);
      expect(userRepository.removeRole).toHaveBeenCalledWith(mockUserId, mockRoleId);
    });
  });

  describe('hasPermission', () => {
    it('should return true if user has permission', async () => {
      // Mock repository responses
      (roleRepository.hasPermission as jest.Mock).mockResolvedValue(true);

      const result = await rbacService.hasPermission(mockUserId, 'test', 'read');

      expect(result).toBe(true);
      expect(roleRepository.hasPermission).toHaveBeenCalledWith(mockUserId, 'test', 'read');
    });

    it('should return false if user does not have permission', async () => {
      // Mock repository responses
      (roleRepository.hasPermission as jest.Mock).mockResolvedValue(false);

      const result = await rbacService.hasPermission(mockUserId, 'test', 'write');

      expect(result).toBe(false);
      expect(roleRepository.hasPermission).toHaveBeenCalledWith(mockUserId, 'test', 'write');
    });
  });

  describe('getUserPermissions', () => {
    it('should get user permissions successfully', async () => {
      // Mock repository responses
      (roleRepository.getUserPermissions as jest.Mock).mockResolvedValue([
        {
          id: mockPermissionId,
          name: 'test:read',
          resource: 'test',
          action: 'read',
          description: 'Test permission',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      const result = await rbacService.getUserPermissions(mockUserId);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: mockPermissionId,
        name: 'test:read',
        resource: 'test',
        action: 'read',
        description: 'Test permission',
      });
      expect(roleRepository.getUserPermissions).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('getUserRoles', () => {
    it('should get user roles with permissions successfully', async () => {
      // Mock repository responses
      (roleRepository.getUserRoles as jest.Mock).mockResolvedValue([
        {
          id: mockRoleId,
          name: 'TestRole',
          organization_id: mockOrganizationId,
          description: 'Test role description',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
      (roleRepository.getRolePermissions as jest.Mock).mockResolvedValue([
        {
          id: mockPermissionId,
          name: 'test:read',
          resource: 'test',
          action: 'read',
          description: 'Test permission',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      const result = await rbacService.getUserRoles(mockUserId);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: mockRoleId,
        name: 'TestRole',
        organizationId: mockOrganizationId,
        description: 'Test role description',
        permissions: [
          {
            id: mockPermissionId,
            name: 'test:read',
            resource: 'test',
            action: 'read',
            description: 'Test permission',
          },
        ],
      });
      expect(roleRepository.getUserRoles).toHaveBeenCalledWith(mockUserId);
      expect(roleRepository.getRolePermissions).toHaveBeenCalledWith(mockRoleId);
    });
  });
});