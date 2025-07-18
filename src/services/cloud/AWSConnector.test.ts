import { AWSConnector } from './AWSConnector';
import { CloudProviderConfig, ResourceFilter, ResourceOperation } from './types';

describe('AWSConnector', () => {
  let connector: AWSConnector;
  let mockConfig: CloudProviderConfig;

  beforeEach(() => {
    connector = new AWSConnector();
    mockConfig = {
      provider: 'aws',
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'test-access-key',
        secretAccessKey: 'test-secret-key',
      },
    };
  });

  describe('initialization', () => {
    it('should initialize successfully with valid config', async () => {
      await expect(connector.initialize(mockConfig)).resolves.not.toThrow();
      expect(connector.getProvider()).toBe('aws');
    });

    it('should throw error with invalid config', async () => {
      const invalidConfig = {
        ...mockConfig,
        credentials: {},
      };

      await expect(connector.initialize(invalidConfig)).rejects.toThrow();
    });
  });

  describe('connection test', () => {
    beforeEach(async () => {
      await connector.initialize(mockConfig);
    });

    it('should test connection successfully', async () => {
      const result = await connector.testConnection();
      expect(result).toBe(true);
    });

    it('should throw error if not initialized', async () => {
      const uninitializedConnector = new AWSConnector();
      await expect(uninitializedConnector.testConnection()).rejects.toThrow('aws connector is not initialized');
    });
  });

  describe('resource listing', () => {
    beforeEach(async () => {
      await connector.initialize(mockConfig);
    });

    it('should list all resources without filter', async () => {
      const resources = await connector.listResources();
      expect(Array.isArray(resources)).toBe(true);
      expect(resources.length).toBeGreaterThan(0);
      
      // Check that we have both compute and storage resources
      const computeResources = resources.filter(r => r.type === 'compute');
      const storageResources = resources.filter(r => r.type === 'storage');
      expect(computeResources.length).toBeGreaterThan(0);
      expect(storageResources.length).toBeGreaterThan(0);
    });

    it('should filter resources by type', async () => {
      const filter: ResourceFilter = { type: 'compute' };
      const resources = await connector.listResources(filter);
      
      expect(resources.every(r => r.type === 'compute')).toBe(true);
    });

    it('should filter resources by status', async () => {
      const filter: ResourceFilter = { status: 'running' };
      const resources = await connector.listResources(filter);
      
      expect(resources.every(r => r.status === 'running')).toBe(true);
    });

    it('should filter resources by tags', async () => {
      const filter: ResourceFilter = { 
        tags: { Environment: 'production' } 
      };
      const resources = await connector.listResources(filter);
      
      expect(resources.every(r => r.tags.Environment === 'production')).toBe(true);
    });

    it('should filter resources by name pattern', async () => {
      const filter: ResourceFilter = { namePattern: 'web' };
      const resources = await connector.listResources(filter);
      
      expect(resources.every(r => r.name.includes('web'))).toBe(true);
    });
  });

  describe('individual resource retrieval', () => {
    beforeEach(async () => {
      await connector.initialize(mockConfig);
    });

    it('should get existing resource', async () => {
      const resource = await connector.getResource('i-1234567890abcdef0');
      expect(resource).not.toBeNull();
      expect(resource?.id).toBe('i-1234567890abcdef0');
      expect(resource?.provider).toBe('aws');
    });

    it('should return null for non-existent resource', async () => {
      const resource = await connector.getResource('non-existent-id');
      expect(resource).toBeNull();
    });
  });

  describe('resource operations', () => {
    beforeEach(async () => {
      await connector.initialize(mockConfig);
    });

    it('should create resource successfully', async () => {
      const operation: ResourceOperation = {
        operation: 'create',
        configuration: {
          instanceType: 't3.micro',
          imageId: 'ami-12345678',
        },
      };

      const result = await connector.executeOperation(operation);
      expect(result.success).toBe(true);
      expect(result.resourceId).toBeDefined();
      expect(result.message).toContain('created successfully');
    });

    it('should update resource successfully', async () => {
      const operation: ResourceOperation = {
        operation: 'update',
        resourceId: 'i-1234567890abcdef0',
        configuration: {
          instanceType: 't3.small',
        },
      };

      const result = await connector.executeOperation(operation);
      expect(result.success).toBe(true);
      expect(result.resourceId).toBe('i-1234567890abcdef0');
    });

    it('should start resource successfully', async () => {
      const operation: ResourceOperation = {
        operation: 'start',
        resourceId: 'i-1234567890abcdef0',
        configuration: {},
      };

      const result = await connector.executeOperation(operation);
      expect(result.success).toBe(true);
      expect(result.message).toContain('started successfully');
    });

    it('should stop resource successfully', async () => {
      const operation: ResourceOperation = {
        operation: 'stop',
        resourceId: 'i-1234567890abcdef0',
        configuration: {},
      };

      const result = await connector.executeOperation(operation);
      expect(result.success).toBe(true);
      expect(result.message).toContain('stopped successfully');
    });

    it('should delete resource successfully', async () => {
      const operation: ResourceOperation = {
        operation: 'delete',
        resourceId: 'i-1234567890abcdef0',
        configuration: {},
      };

      const result = await connector.executeOperation(operation);
      expect(result.success).toBe(true);
      expect(result.message).toContain('deleted successfully');
    });

    it('should handle unsupported operations', async () => {
      const operation: ResourceOperation = {
        operation: 'unsupported' as any,
        configuration: {},
      };

      const result = await connector.executeOperation(operation);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported operation');
    });
  });

  describe('cost data retrieval', () => {
    beforeEach(async () => {
      await connector.initialize(mockConfig);
    });

    it('should get cost data for specific resources', async () => {
      const resourceIds = ['i-1234567890abcdef0', 'my-app-assets-bucket'];
      const costData = await connector.getCostData(resourceIds);
      
      expect(Object.keys(costData)).toEqual(resourceIds);
      expect(typeof costData['i-1234567890abcdef0']).toBe('number');
      expect(typeof costData['my-app-assets-bucket']).toBe('number');
    });

    it('should handle empty resource list', async () => {
      const costData = await connector.getCostData([]);
      expect(Object.keys(costData)).toHaveLength(0);
    });
  });

  describe('configuration validation', () => {
    beforeEach(async () => {
      await connector.initialize(mockConfig);
    });

    it('should validate valid configuration', async () => {
      const validConfig = {
        accessKeyId: 'test-key',
        secretAccessKey: 'test-secret',
        region: 'us-east-1',
      };

      const isValid = await connector.validateConfiguration(validConfig);
      expect(isValid).toBe(true);
    });

    it('should reject invalid configuration', async () => {
      const invalidConfig = {
        accessKeyId: 'test-key',
        // Missing secretAccessKey
      };

      const isValid = await connector.validateConfiguration(invalidConfig);
      expect(isValid).toBe(false);
    });
  });
});