import { createInfrastructureService } from './index';
import { CloudProviderConfig } from '../cloud/types';
import { ResourceProvisioningRequest } from './types';

// Mock the cloud module
jest.mock('../cloud', () => ({
  createCloudConnector: jest.fn(),
}));

describe('Infrastructure Service Integration Tests', () => {
  let services: any;
  let mockConnector: any;

  beforeEach(async () => {
    const cloudConfigs: CloudProviderConfig[] = [
      {
        provider: 'aws',
        region: 'us-east-1',
        credentials: {
          accessKeyId: 'test-key',
          secretAccessKey: 'test-secret',
        },
      },
      {
        provider: 'azure',
        region: 'eastus',
        credentials: {
          clientId: 'test-client',
          clientSecret: 'test-secret',
          tenantId: 'test-tenant',
          subscriptionId: 'test-subscription',
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

    services = await createInfrastructureService(cloudConfigs);
  });

  afterEach(() => {
    services.driftDetectionService.clearScheduledJobs();
    jest.clearAllMocks();
  });

  describe('end-to-end resource management', () => {
    it('should create, validate, and manage resource lifecycle', async () => {
      // Step 1: Create a resource
      const provisioningRequest: ResourceProvisioningRequest = {
        organizationId: 'org-1',
        projectId: 'project-1',
        environmentId: 'prod',
        provider: 'aws',
        region: 'us-east-1',
        resourceType: 'compute',
        configuration: {
          instanceType: 't3.micro',
          name: 'web-server-1',
        },
        tags: {
          Environment: 'production',
          Team: 'web',
          Project: 'main-app',
        },
        policies: [],
        requestedBy: 'user-1',
      };

      mockConnector.executeOperation.mockResolvedValue({
        success: true,
        resourceId: 'i-1234567890abcdef0',
        message: 'Instance created successfully',
      });

      const createResult = await services.infrastructureService.createResource(provisioningRequest);
      
      expect(createResult.success).toBe(true);
      expect(createResult.resourceId).toBe('i-1234567890abcdef0');

      // Step 2: Validate policies
      const mockResource = {
        id: 'i-1234567890abcdef0',
        name: 'web-server-1',
        type: 'compute',
        provider: 'aws',
        region: 'us-east-1',
        tags: {
          Environment: 'production',
          Team: 'web',
          Project: 'main-app',
        },
        configuration: {
          instanceType: 't3.micro',
        },
        organizationId: 'org-1',
        projectId: 'project-1',
        environmentId: 'prod',
      };

      const policyViolations = await services.policyValidationService.validateResource(mockResource);
      
      // Should pass all policies since it has required tags and approved instance type
      expect(policyViolations).toHaveLength(0);

      // Step 3: Sync resource state
      const cloudResource = {
        id: 'i-1234567890abcdef0',
        name: 'web-server-1',
        type: 'compute',
        status: 'running',
        provider: 'aws',
        region: 'us-east-1',
        tags: {
          Environment: 'production',
          Team: 'web',
          Project: 'main-app',
        },
        configuration: {
          instanceType: 't3.micro',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockConnector.getResource.mockResolvedValue(cloudResource);

      const syncResult = await services.infrastructureService.syncResource('i-1234567890abcdef0');
      expect(syncResult.success).toBe(true);

      // Step 4: Detect drift (should be none initially)
      const resource = await services.infrastructureService.getResource('i-1234567890abcdef0');
      expect(resource).not.toBeNull();

      const driftResult = await services.driftDetectionService.detectDrift('i-1234567890abcdef0');
      expect(driftResult.hasDrift).toBe(false);

      // Step 5: Simulate configuration drift
      const driftedCloudResource = {
        ...cloudResource,
        configuration: {
          instanceType: 't3.small', // Changed from t3.micro
        },
        tags: {
          Environment: 'production',
          Team: 'web',
          // Project tag removed
        },
      };

      mockConnector.getResource.mockResolvedValue(driftedCloudResource);
      
      // Sync again to get the drifted state
      await services.infrastructureService.syncResource('i-1234567890abcdef0');
      
      // Detect drift again
      const driftResult2 = await services.driftDetectionService.detectDrift('i-1234567890abcdef0');
      expect(driftResult2.hasDrift).toBe(true);
      expect(driftResult2.driftDetails.length).toBeGreaterThan(0);

      // Step 6: Update resource to fix drift
      mockConnector.executeOperation.mockResolvedValue({
        success: true,
        message: 'Resource updated successfully',
      });

      const updateResult = await services.infrastructureService.updateResource(
        'i-1234567890abcdef0',
        {
          type: 'update',
          configuration: {
            instanceType: 't3.micro', // Revert to desired state
          },
          tags: {
            Project: 'main-app', // Add back missing tag
          },
          requestedBy: 'user-1',
        }
      );

      expect(updateResult.success).toBe(true);
    });

    it('should handle policy violations during provisioning', async () => {
      const violatingRequest: ResourceProvisioningRequest = {
        organizationId: 'org-1',
        projectId: 'project-1',
        environmentId: 'prod',
        provider: 'aws',
        region: 'us-east-1',
        resourceType: 'compute',
        configuration: {
          instanceType: 'c5.24xlarge', // Too large - violates cost policy
          publicAccess: true, // Violates security policy
        },
        tags: {
          // Missing required tags - violates governance policy
        },
        policies: [],
        requestedBy: 'user-1',
      };

      const result = await services.infrastructureService.createResource(violatingRequest);
      
      expect(result.success).toBe(false);
      expect(result.policyViolations).toBeDefined();
      expect(result.policyViolations!.length).toBeGreaterThan(0);
      
      // Should have violations for security, cost, and governance
      const violationTypes = result.policyViolations!.map(v => v.severity);
      expect(violationTypes).toContain('critical'); // Public access
      expect(violationTypes).toContain('medium'); // Missing tags or large instance
    });

    it('should manage resource inventory across multiple providers', async () => {
      // Mock resources from different providers
      const awsResources = [
        {
          id: 'i-aws-1',
          type: 'compute',
          provider: 'aws',
          status: 'running',
          tags: {},
          configuration: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 's3-bucket-1',
          type: 'storage',
          provider: 'aws',
          status: 'running',
          tags: {},
          configuration: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const azureResources = [
        {
          id: 'vm-azure-1',
          type: 'compute',
          provider: 'azure',
          status: 'running',
          tags: {},
          configuration: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockConnector.listResources
        .mockResolvedValueOnce(awsResources)
        .mockResolvedValueOnce(azureResources);

      const inventory = await services.infrastructureService.getInventory();

      expect(inventory.totalResources).toBe(3);
      expect(inventory.resourcesByProvider.aws).toBe(2);
      expect(inventory.resourcesByProvider.azure).toBe(1);
      expect(inventory.resourcesByType.compute).toBe(2);
      expect(inventory.resourcesByType.storage).toBe(1);
    });

    it('should schedule and execute drift detection', async () => {
      const mockResources = [
        {
          id: 'resource-1',
          desiredState: { configuration: {}, tags: {}, status: 'running' },
          actualState: { configuration: {}, tags: {}, status: 'running' },
        },
        {
          id: 'resource-2',
          desiredState: { configuration: { size: 'small' }, tags: {}, status: 'running' },
          actualState: { configuration: { size: 'large' }, tags: {}, status: 'running' },
        },
      ];

      mockConnector.listResources.mockResolvedValue(mockResources);
      mockConnector.getResource
        .mockResolvedValueOnce(mockResources[0] as any)
        .mockResolvedValueOnce(mockResources[1] as any);

      // Schedule drift detection every minute (for testing)
      await services.driftDetectionService.scheduleDriftDetection(
        { organizationId: 'org-1' },
        1
      );

      // Wait a bit to ensure the scheduled job runs
      await new Promise(resolve => setTimeout(resolve, 100));

      const driftResults = await services.driftDetectionService.getDriftResults();
      expect(driftResults.length).toBeGreaterThan(0);

      const stats = services.driftDetectionService.getDriftStatistics();
      expect(stats.totalResources).toBeGreaterThan(0);
      expect(stats.resourcesWithDrift).toBeGreaterThan(0);
    });
  });

  describe('error handling and resilience', () => {
    it('should handle cloud provider failures gracefully', async () => {
      mockConnector.listResources.mockRejectedValue(new Error('Cloud provider unavailable'));

      const resources = await services.infrastructureService.getResources();
      
      // Should return empty array instead of throwing
      expect(resources).toEqual([]);
    });

    it('should handle partial failures in batch operations', async () => {
      mockConnector.getResource
        .mockResolvedValueOnce({ id: 'resource-1' } as any)
        .mockRejectedValueOnce(new Error('Resource not found'))
        .mockResolvedValueOnce({ id: 'resource-3' } as any);

      const results = await services.driftDetectionService.detectDriftBatch([
        'resource-1',
        'resource-2',
        'resource-3',
      ]);

      // Should return results for successful operations
      expect(results.length).toBe(2);
      expect(results.map(r => r.resourceId)).toEqual(['resource-1', 'resource-3']);
    });
  });
});