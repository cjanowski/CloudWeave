import { InfrastructureService } from './InfrastructureService';
import { CloudProviderConfig } from '../cloud/types';
import { ResourceProvisioningRequest, ResourceOperation } from './types';

// Mock the cloud module
jest.mock('../cloud', () => ({
  createCloudConnector: jest.fn(),
}));

describe('InfrastructureService', () => {
  let service: InfrastructureService;
  let mockCloudConfigs: CloudProviderConfig[];
  let mockConnector: any;

  beforeEach(() => {
    mockCloudConfigs = [
      {
        provider: 'aws',
        region: 'us-east-1',
        credentials: {
          accessKeyId: 'test-key',
          secretAccessKey: 'test-secret',
        },
      },
    ];

    mockConnector = {
      listResources: jest.fn(),
      getResource: jest.fn(),
      executeOperation: jest.fn(),
      getCostData: jest.fn(),
    };

    const { createCloudConnector } = require('../cloud');
    createCloudConnector.mockResolvedValue(mockConnector);

    service = new InfrastructureService(mockCloudConfigs);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize successfully with valid configurations', async () => {
      await expect(service.initialize()).resolves.not.toThrow();
    });

    it('should handle initialization errors gracefully', async () => {
      const { createCloudConnector } = require('../cloud');
      createCloudConnector.mockRejectedValue(new Error('Connection failed'));

      await expect(service.initialize()).rejects.toThrow('Connection failed');
    });
  });

  describe('resource retrieval', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should get all resources without filter', async () => {
      const mockCloudResources = [
        {
          id: 'resource-1',
          name: 'test-resource-1',
          type: 'compute',
          status: 'running',
          provider: 'aws',
          region: 'us-east-1',
          tags: { Environment: 'test' },
          configuration: { instanceType: 't3.micro' },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockConnector.listResources.mockResolvedValue(mockCloudResources);

      const resources = await service.getResources();

      expect(resources).toHaveLength(1);
      expect(resources[0].id).toBe('resource-1');
      expect(resources[0].organizationId).toBeDefined();
      expect(resources[0].desiredState).toBeDefined();
      expect(resources[0].actualState).toBeDefined();
    });

    it('should get specific resource by ID', async () => {
      const mockCloudResource = {
        id: 'resource-1',
        name: 'test-resource-1',
        type: 'compute',
        status: 'running',
        provider: 'aws',
        region: 'us-east-1',
        tags: { Environment: 'test' },
        configuration: { instanceType: 't3.micro' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockConnector.getResource.mockResolvedValue(mockCloudResource);

      const resource = await service.getResource('resource-1');

      expect(resource).not.toBeNull();
      expect(resource!.id).toBe('resource-1');
      expect(mockConnector.getResource).toHaveBeenCalledWith('resource-1');
    });

    it('should return null for non-existent resource', async () => {
      mockConnector.getResource.mockResolvedValue(null);

      const resource = await service.getResource('non-existent');

      expect(resource).toBeNull();
    });

    it('should filter resources by organization', async () => {
      const mockCloudResources = [
        {
          id: 'resource-1',
          name: 'test-resource-1',
          type: 'compute',
          status: 'running',
          provider: 'aws',
          region: 'us-east-1',
          tags: {},
          configuration: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockConnector.listResources.mockResolvedValue(mockCloudResources);

      const resources = await service.getResources({
        organizationId: 'org-1',
      });

      // Should return empty since mock resources have default-org
      expect(resources).toHaveLength(0);
    });
  });

  describe('resource creation', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should create resource successfully', async () => {
      const request: ResourceProvisioningRequest = {
        organizationId: 'org-1',
        projectId: 'project-1',
        environmentId: 'env-1',
        provider: 'aws',
        region: 'us-east-1',
        resourceType: 'compute',
        configuration: {
          instanceType: 't3.micro',
          name: 'test-instance',
        },
        tags: { Environment: 'test' },
        policies: [],
        requestedBy: 'user-1',
      };

      mockConnector.executeOperation.mockResolvedValue({
        success: true,
        resourceId: 'new-resource-id',
        message: 'Resource created successfully',
      });

      const result = await service.createResource(request);

      expect(result.success).toBe(true);
      expect(result.resourceId).toBe('new-resource-id');
      expect(mockConnector.executeOperation).toHaveBeenCalledWith({
        operation: 'create',
        configuration: {
          instanceType: 't3.micro',
          name: 'test-instance',
          tags: { Environment: 'test' },
        },
      });
    });

    it('should handle validation errors', async () => {
      const invalidRequest: ResourceProvisioningRequest = {
        organizationId: '', // Invalid - empty
        projectId: 'project-1',
        environmentId: 'env-1',
        provider: 'aws',
        region: 'us-east-1',
        resourceType: 'compute',
        configuration: {},
        tags: {},
        policies: [],
        requestedBy: 'user-1',
      };

      const result = await service.createResource(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.validationErrors).toContain('Organization ID is required');
    });

    it('should handle cloud provider errors', async () => {
      const request: ResourceProvisioningRequest = {
        organizationId: 'org-1',
        projectId: 'project-1',
        environmentId: 'env-1',
        provider: 'aws',
        region: 'us-east-1',
        resourceType: 'compute',
        configuration: { instanceType: 't3.micro' },
        tags: {},
        policies: [],
        requestedBy: 'user-1',
      };

      mockConnector.executeOperation.mockResolvedValue({
        success: false,
        error: 'Insufficient permissions',
      });

      const result = await service.createResource(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient permissions');
    });
  });

  describe('resource operations', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should update resource successfully', async () => {
      const mockResource = {
        id: 'resource-1',
        name: 'test-resource',
        type: 'compute',
        status: 'running',
        provider: 'aws',
        region: 'us-east-1',
        tags: {},
        configuration: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        organizationId: 'org-1',
        projectId: 'project-1',
        environmentId: 'env-1',
        managedBy: 'manual' as const,
        desiredState: {
          configuration: {},
          tags: {},
          status: 'running' as const,
          version: '1.0.0',
          lastModified: new Date(),
          modifiedBy: 'user-1',
        },
        actualState: {
          configuration: {},
          tags: {},
          status: 'running' as const,
          lastChecked: new Date(),
          healthStatus: 'healthy' as const,
        },
        driftDetected: false,
        lastSyncAt: new Date(),
        policies: [],
        dependencies: [],
      };

      mockConnector.getResource.mockResolvedValue(mockResource);
      mockConnector.executeOperation.mockResolvedValue({
        success: true,
        message: 'Resource updated successfully',
      });

      const operation: ResourceOperation = {
        type: 'update',
        configuration: { instanceType: 't3.small' },
        requestedBy: 'user-1',
      };

      const result = await service.updateResource('resource-1', operation);

      expect(result.success).toBe(true);
      expect(result.resourceId).toBe('resource-1');
    });

    it('should delete resource successfully', async () => {
      const mockResource = {
        id: 'resource-1',
        provider: 'aws',
        region: 'us-east-1',
      };

      mockConnector.getResource.mockResolvedValue(mockResource);
      mockConnector.executeOperation.mockResolvedValue({
        success: true,
        message: 'Resource deleted successfully',
      });

      const result = await service.deleteResource('resource-1', 'cleanup', 'user-1');

      expect(result.success).toBe(true);
      expect(mockConnector.executeOperation).toHaveBeenCalledWith({
        operation: 'delete',
        resourceId: 'resource-1',
        configuration: {},
      });
    });

    it('should sync resource state', async () => {
      const mockResource = {
        id: 'resource-1',
        provider: 'aws',
        region: 'us-east-1',
        actualState: {
          configuration: {},
          tags: {},
          status: 'running',
          lastChecked: new Date(),
          healthStatus: 'healthy',
        },
      };

      const updatedCloudResource = {
        id: 'resource-1',
        configuration: { instanceType: 't3.small' },
        tags: { Environment: 'production' },
        status: 'running',
      };

      mockConnector.getResource
        .mockResolvedValueOnce(mockResource)
        .mockResolvedValueOnce(updatedCloudResource);

      const result = await service.syncResource('resource-1');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Resource synced successfully');
    });
  });

  describe('inventory management', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should get resource inventory', async () => {
      const mockResources = [
        {
          id: 'resource-1',
          type: 'compute',
          provider: 'aws',
          actualState: { status: 'running' },
          driftDetected: false,
          policies: [],
        },
        {
          id: 'resource-2',
          type: 'storage',
          provider: 'aws',
          actualState: { status: 'running' },
          driftDetected: true,
          policies: [{ status: 'non-compliant' }],
        },
      ];

      mockConnector.listResources.mockResolvedValue(mockResources);

      const inventory = await service.getInventory();

      expect(inventory.totalResources).toBe(2);
      expect(inventory.resourcesByProvider.aws).toBe(2);
      expect(inventory.resourcesByType.compute).toBe(1);
      expect(inventory.resourcesByType.storage).toBe(1);
      expect(inventory.driftedResources).toBe(1);
      expect(inventory.nonCompliantResources).toBe(1);
    });
  });
});