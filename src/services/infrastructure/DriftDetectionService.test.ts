import { DriftDetectionService } from './DriftDetectionService';
import { IInfrastructureService } from './interfaces';
import { InfrastructureResource } from './types';

describe('DriftDetectionService', () => {
  let service: DriftDetectionService;
  let mockInfrastructureService: jest.Mocked<IInfrastructureService>;

  beforeEach(() => {
    mockInfrastructureService = {
      getResource: jest.fn(),
      getResources: jest.fn(),
      createResource: jest.fn(),
      updateResource: jest.fn(),
      deleteResource: jest.fn(),
      syncResource: jest.fn(),
      syncResources: jest.fn(),
      getInventory: jest.fn(),
    };

    service = new DriftDetectionService(mockInfrastructureService);
  });

  afterEach(() => {
    service.clearScheduledJobs();
    jest.clearAllMocks();
  });

  describe('drift detection', () => {
    it('should detect no drift when states match', async () => {
      const mockResource: InfrastructureResource = {
        id: 'resource-1',
        name: 'test-resource',
        type: 'compute',
        status: 'running',
        region: 'us-east-1',
        provider: 'aws',
        tags: { Environment: 'test' },
        configuration: { instanceType: 't3.micro' },
        createdAt: new Date(),
        updatedAt: new Date(),
        organizationId: 'org-1',
        projectId: 'project-1',
        environmentId: 'env-1',
        managedBy: 'terraform',
        desiredState: {
          configuration: { instanceType: 't3.micro' },
          tags: { Environment: 'test' },
          status: 'running',
          version: '1.0.0',
          lastModified: new Date(),
          modifiedBy: 'user-1',
        },
        actualState: {
          configuration: { instanceType: 't3.micro' },
          tags: { Environment: 'test' },
          status: 'running',
          lastChecked: new Date(),
          healthStatus: 'healthy',
        },
        driftDetected: false,
        lastSyncAt: new Date(),
        policies: [],
        dependencies: [],
      };

      mockInfrastructureService.getResource.mockResolvedValue(mockResource);

      const result = await service.detectDrift('resource-1');

      expect(result.hasDrift).toBe(false);
      expect(result.driftDetails).toHaveLength(0);
      expect(result.severity).toBe('low');
    });

    it('should detect configuration drift', async () => {
      const mockResource: InfrastructureResource = {
        id: 'resource-1',
        name: 'test-resource',
        type: 'compute',
        status: 'running',
        region: 'us-east-1',
        provider: 'aws',
        tags: {},
        configuration: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        organizationId: 'org-1',
        projectId: 'project-1',
        environmentId: 'env-1',
        managedBy: 'terraform',
        desiredState: {
          configuration: { instanceType: 't3.micro' },
          tags: { Environment: 'test' },
          status: 'running',
          version: '1.0.0',
          lastModified: new Date(),
          modifiedBy: 'user-1',
        },
        actualState: {
          configuration: { instanceType: 't3.small' }, // Different from desired
          tags: { Environment: 'production' }, // Different from desired
          status: 'running',
          lastChecked: new Date(),
          healthStatus: 'healthy',
        },
        driftDetected: false,
        lastSyncAt: new Date(),
        policies: [],
        dependencies: [],
      };

      mockInfrastructureService.getResource.mockResolvedValue(mockResource);

      const result = await service.detectDrift('resource-1');

      expect(result.hasDrift).toBe(true);
      expect(result.driftDetails.length).toBeGreaterThan(0);
      
      // Check for specific drift details
      const configDrift = result.driftDetails.find(d => d.property === 'configuration.instanceType');
      expect(configDrift).toBeDefined();
      expect(configDrift!.desiredValue).toBe('t3.micro');
      expect(configDrift!.actualValue).toBe('t3.small');
      expect(configDrift!.changeType).toBe('modified');

      const tagDrift = result.driftDetails.find(d => d.property === 'tags.Environment');
      expect(tagDrift).toBeDefined();
      expect(tagDrift!.desiredValue).toBe('test');
      expect(tagDrift!.actualValue).toBe('production');
    });

    it('should detect status drift', async () => {
      const mockResource: InfrastructureResource = {
        id: 'resource-1',
        name: 'test-resource',
        type: 'compute',
        status: 'running',
        region: 'us-east-1',
        provider: 'aws',
        tags: {},
        configuration: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        organizationId: 'org-1',
        projectId: 'project-1',
        environmentId: 'env-1',
        managedBy: 'terraform',
        desiredState: {
          configuration: {},
          tags: {},
          status: 'running',
          version: '1.0.0',
          lastModified: new Date(),
          modifiedBy: 'user-1',
        },
        actualState: {
          configuration: {},
          tags: {},
          status: 'stopped', // Different from desired
          lastChecked: new Date(),
          healthStatus: 'unhealthy',
        },
        driftDetected: false,
        lastSyncAt: new Date(),
        policies: [],
        dependencies: [],
      };

      mockInfrastructureService.getResource.mockResolvedValue(mockResource);

      const result = await service.detectDrift('resource-1');

      expect(result.hasDrift).toBe(true);
      
      const statusDrift = result.driftDetails.find(d => d.property === 'status');
      expect(statusDrift).toBeDefined();
      expect(statusDrift!.desiredValue).toBe('running');
      expect(statusDrift!.actualValue).toBe('stopped');
      expect(statusDrift!.changeType).toBe('modified');
      expect(result.severity).toBe('high'); // Status changes are high severity
    });

    it('should detect added and removed properties', async () => {
      const mockResource: InfrastructureResource = {
        id: 'resource-1',
        name: 'test-resource',
        type: 'compute',
        status: 'running',
        region: 'us-east-1',
        provider: 'aws',
        tags: {},
        configuration: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        organizationId: 'org-1',
        projectId: 'project-1',
        environmentId: 'env-1',
        managedBy: 'terraform',
        desiredState: {
          configuration: { instanceType: 't3.micro' },
          tags: { Environment: 'test', Team: 'engineering' },
          status: 'running',
          version: '1.0.0',
          lastModified: new Date(),
          modifiedBy: 'user-1',
        },
        actualState: {
          configuration: { 
            instanceType: 't3.micro',
            monitoring: true, // Added property
          },
          tags: { Environment: 'test' }, // Removed Team tag
          status: 'running',
          lastChecked: new Date(),
          healthStatus: 'healthy',
        },
        driftDetected: false,
        lastSyncAt: new Date(),
        policies: [],
        dependencies: [],
      };

      mockInfrastructureService.getResource.mockResolvedValue(mockResource);

      const result = await service.detectDrift('resource-1');

      expect(result.hasDrift).toBe(true);
      
      const addedProperty = result.driftDetails.find(d => 
        d.property === 'configuration.monitoring' && d.changeType === 'added'
      );
      expect(addedProperty).toBeDefined();
      expect(addedProperty!.actualValue).toBe(true);
      expect(addedProperty!.desiredValue).toBeUndefined();

      const removedProperty = result.driftDetails.find(d => 
        d.property === 'tags.Team' && d.changeType === 'removed'
      );
      expect(removedProperty).toBeDefined();
      expect(removedProperty!.desiredValue).toBe('engineering');
      expect(removedProperty!.actualValue).toBeUndefined();
    });

    it('should handle resource not found', async () => {
      mockInfrastructureService.getResource.mockResolvedValue(null);

      await expect(service.detectDrift('non-existent')).rejects.toThrow('Resource non-existent not found');
    });
  });

  describe('batch drift detection', () => {
    it('should detect drift for multiple resources', async () => {
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

      mockInfrastructureService.getResource
        .mockResolvedValueOnce(mockResources[0] as any)
        .mockResolvedValueOnce(mockResources[1] as any);

      const results = await service.detectDriftBatch(['resource-1', 'resource-2']);

      expect(results).toHaveLength(2);
      expect(results[0].hasDrift).toBe(false);
      expect(results[1].hasDrift).toBe(true);
    });

    it('should handle partial failures in batch detection', async () => {
      mockInfrastructureService.getResource
        .mockResolvedValueOnce({ id: 'resource-1' } as any)
        .mockRejectedValueOnce(new Error('Resource not found'));

      const results = await service.detectDriftBatch(['resource-1', 'resource-2']);

      expect(results).toHaveLength(1);
      expect(results[0].resourceId).toBe('resource-1');
    });
  });

  describe('scheduled drift detection', () => {
    it('should schedule drift detection', async () => {
      const mockResources = [
        { id: 'resource-1' },
        { id: 'resource-2' },
      ];

      mockInfrastructureService.getResources.mockResolvedValue(mockResources as any);
      mockInfrastructureService.getResource.mockResolvedValue({
        id: 'resource-1',
        desiredState: { configuration: {}, tags: {}, status: 'running' },
        actualState: { configuration: {}, tags: {}, status: 'running' },
      } as any);

      await service.scheduleDriftDetection({ organizationId: 'org-1' }, 60);

      // Verify that resources were fetched
      expect(mockInfrastructureService.getResources).toHaveBeenCalledWith({ organizationId: 'org-1' });
    });
  });

  describe('drift statistics', () => {
    it('should calculate drift statistics', async () => {
      // First, detect drift for some resources to populate the cache
      const mockResource1 = {
        id: 'resource-1',
        desiredState: { configuration: {}, tags: {}, status: 'running' },
        actualState: { configuration: {}, tags: {}, status: 'running' },
      };

      const mockResource2 = {
        id: 'resource-2',
        desiredState: { configuration: { size: 'small' }, tags: {}, status: 'running' },
        actualState: { configuration: { size: 'large' }, tags: {}, status: 'running' },
      };

      mockInfrastructureService.getResource
        .mockResolvedValueOnce(mockResource1 as any)
        .mockResolvedValueOnce(mockResource2 as any);

      await service.detectDrift('resource-1');
      await service.detectDrift('resource-2');

      const stats = service.getDriftStatistics();

      expect(stats.totalResources).toBe(2);
      expect(stats.resourcesWithDrift).toBe(1);
      expect(stats.driftPercentage).toBe(50);
      expect(stats.severityBreakdown.medium).toBe(1);
    });
  });
});