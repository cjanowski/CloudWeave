import request from 'supertest';
import app from '../index';
import { rbacService } from '../services/rbacService';

// Mock the RBAC service
jest.mock('../services/rbacService');

describe('RBAC Routes', () => {
  let adminToken: string;
  const mockOrganizationId = '550e8400-e29b-41d4-a716-446655440000';
  const mockRoleId = '660e8400-e29b-41d4-a716-446655440001';
  const mockPermissionId = '880e8400-e29b-41d4-a716-446655440001';
  const mockUserId = '770e8400-e29b-41d4-a716-446655440001';

  beforeAll(async () => {
    // Login as admin to get token
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@cloudweave.com',
        password: 'admin123',
      });

    adminToken = response.body.data.tokens.accessToken;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/rbac/organizations/:organizationId/roles', () => {
    it('should get roles for organization', async () => {
      // Mock the service response
      (rbacService.hasPermission as jest.Mock).mockResolvedValue(true);
      (rbacService.getRolesByOrganization as jest.Mock).mockResolvedValue([
        {
          id: mockRoleId,
          name: 'Admin',
          organizationId: mockOrganizationId,
          description: 'Administrator role',
          permissions: [
            {
              id: mockPermissionId,
              name: 'role:read',
              resource: 'role',
              action: 'read',
              description: 'Read roles',
            },
          ],
        },
      ]);

      const response = await request(app)
        .get(`/api/v1/rbac/organizations/${mockOrganizationId}/roles`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Admin');
      expect(rbacService.hasPermission).toHaveBeenCalledWith(expect.any(String), 'role', 'read');
      expect(rbacService.getRolesByOrganization).toHaveBeenCalledWith(mockOrganizationId);
    });

    it('should return 403 if user does not have permission', async () => {
      // Mock the service response
      (rbacService.hasPermission as jest.Mock).mockResolvedValue(false);

      const response = await request(app)
        .get(`/api/v1/rbac/organizations/${mockOrganizationId}/roles`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
      expect(rbacService.hasPermission).toHaveBeenCalledWith(expect.any(String), 'role', 'read');
      expect(rbacService.getRolesByOrganization).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/v1/rbac/organizations/:organizationId/roles', () => {
    it('should create a new role', async () => {
      // Mock the service response
      (rbacService.hasPermission as jest.Mock).mockResolvedValue(true);
      (rbacService.createRole as jest.Mock).mockResolvedValue({
        id: mockRoleId,
        name: 'Developer',
        organizationId: mockOrganizationId,
        description: 'Developer role',
        permissions: [],
      });

      const response = await request(app)
        .post(`/api/v1/rbac/organizations/${mockOrganizationId}/roles`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Developer',
          description: 'Developer role',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Developer');
      expect(rbacService.hasPermission).toHaveBeenCalledWith(expect.any(String), 'role', 'write');
      expect(rbacService.createRole).toHaveBeenCalledWith(
        'Developer',
        mockOrganizationId,
        'Developer role'
      );
    });

    it('should return 400 for invalid input', async () => {
      // Mock the service response
      (rbacService.hasPermission as jest.Mock).mockResolvedValue(true);

      const response = await request(app)
        .post(`/api/v1/rbac/organizations/${mockOrganizationId}/roles`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          // Missing name
          description: 'Developer role',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(rbacService.createRole).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/rbac/roles/:roleId', () => {
    it('should get a role by ID', async () => {
      // Mock the service response
      (rbacService.getRole as jest.Mock).mockResolvedValue({
        id: mockRoleId,
        name: 'Admin',
        organizationId: mockOrganizationId,
        description: 'Administrator role',
        permissions: [
          {
            id: mockPermissionId,
            name: 'role:read',
            resource: 'role',
            action: 'read',
            description: 'Read roles',
          },
        ],
      });
      (rbacService.hasPermission as jest.Mock).mockResolvedValue(true);

      const response = await request(app)
        .get(`/api/v1/rbac/roles/${mockRoleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Admin');
      expect(rbacService.getRole).toHaveBeenCalledWith(mockRoleId);
      expect(rbacService.hasPermission).toHaveBeenCalledWith(expect.any(String), 'role', 'read');
    });

    it('should return 404 if role not found', async () => {
      // Mock the service response
      (rbacService.getRole as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/v1/rbac/roles/non-existent-id`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ROLE_NOT_FOUND');
      expect(rbacService.getRole).toHaveBeenCalledWith('non-existent-id');
    });
  });

  describe('PUT /api/v1/rbac/roles/:roleId', () => {
    it('should update a role', async () => {
      // Mock the service response
      (rbacService.hasPermission as jest.Mock).mockResolvedValue(true);
      (rbacService.getRole as jest.Mock).mockResolvedValue({
        id: mockRoleId,
        name: 'Admin',
        organizationId: mockOrganizationId,
        description: 'Administrator role',
        permissions: [],
      });
      (rbacService.updateRole as jest.Mock).mockResolvedValue({
        id: mockRoleId,
        name: 'Super Admin',
        organizationId: mockOrganizationId,
        description: 'Updated description',
        permissions: [],
      });

      const response = await request(app)
        .put(`/api/v1/rbac/roles/${mockRoleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Super Admin',
          description: 'Updated description',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Super Admin');
      expect(response.body.data.description).toBe('Updated description');
      expect(rbacService.hasPermission).toHaveBeenCalledWith(expect.any(String), 'role', 'write');
      expect(rbacService.updateRole).toHaveBeenCalledWith(mockRoleId, {
        name: 'Super Admin',
        description: 'Updated description',
      });
    });
  });

  describe('POST /api/v1/rbac/roles/:roleId/permissions', () => {
    it('should assign permission to role', async () => {
      // Mock the service response
      (rbacService.hasPermission as jest.Mock).mockResolvedValue(true);
      (rbacService.getRole as jest.Mock).mockImplementation((id) => {
        if (id === mockRoleId) {
          return Promise.resolve({
            id: mockRoleId,
            name: 'Admin',
            organizationId: mockOrganizationId,
            description: 'Administrator role',
            permissions: [],
          });
        }
        return Promise.resolve(null);
      });
      (rbacService.assignPermissionToRole as jest.Mock).mockResolvedValue(true);

      const response = await request(app)
        .post(`/api/v1/rbac/roles/${mockRoleId}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          permissionId: mockPermissionId,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(rbacService.hasPermission).toHaveBeenCalledWith(expect.any(String), 'role', 'write');
      expect(rbacService.assignPermissionToRole).toHaveBeenCalledWith(mockRoleId, mockPermissionId);
    });
  });

  describe('GET /api/v1/rbac/permissions', () => {
    it('should get all permissions', async () => {
      // Mock the service response
      (rbacService.hasPermission as jest.Mock).mockResolvedValue(true);
      (rbacService.getAllPermissions as jest.Mock).mockResolvedValue([
        {
          id: mockPermissionId,
          name: 'role:read',
          resource: 'role',
          action: 'read',
          description: 'Read roles',
        },
      ]);

      const response = await request(app)
        .get(`/api/v1/rbac/permissions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('role:read');
      expect(rbacService.hasPermission).toHaveBeenCalledWith(expect.any(String), 'permission', 'read');
      expect(rbacService.getAllPermissions).toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/rbac/users/:userId/permissions', () => {
    it('should get user permissions', async () => {
      // Mock the service response
      (rbacService.getUserPermissions as jest.Mock).mockResolvedValue([
        {
          id: mockPermissionId,
          name: 'role:read',
          resource: 'role',
          action: 'read',
          description: 'Read roles',
        },
      ]);

      const response = await request(app)
        .get(`/api/v1/rbac/users/${mockUserId}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('role:read');
      expect(rbacService.getUserPermissions).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('GET /api/v1/rbac/users/:userId/permissions/check', () => {
    it('should check if user has permission', async () => {
      // Mock the service response
      (rbacService.hasPermission as jest.Mock).mockImplementation((userId, resource, action) => {
        if (userId === mockUserId && resource === 'role' && action === 'read') {
          return Promise.resolve(true);
        }
        return Promise.resolve(false);
      });

      const response = await request(app)
        .get(`/api/v1/rbac/users/${mockUserId}/permissions/check?resource=role&action=read`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.hasPermission).toBe(true);
      expect(rbacService.hasPermission).toHaveBeenCalledWith(mockUserId, 'role', 'read');
    });
  });
});