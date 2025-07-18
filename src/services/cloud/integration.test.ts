import { 
  createCloudConnector, 
  validateCloudConfig, 
  getSupportedProviders,
  cloudProviderFactory 
} from './index';
import { CloudProviderConfig, ResourceFilter } from './types';

describe('Cloud Provider Integration Tests', () => {
  beforeEach(() => {
    // Clear cache before each test
    cloudProviderFactory.clearCache();
  });

  describe('Multi-provider resource discovery', () => {
    it('should discover resources from AWS', async () => {
      const awsConfig: CloudProviderConfig = {
        provider: 'aws',
        region: 'us-east-1',
        credentials: {
          accessKeyId: 'test-key',
          secretAccessKey: 'test-secret',
        },
      };

      const connector = await createCloudConnector(awsConfig);
      const resources = await connector.listResources();

      expect(resources.length).toBeGreaterThan(0);
      expect(resources.every(r => r.provider === 'aws')).toBe(true);
      expect(resources.some(r => r.type === 'compute')).toBe(true);
      expect(resources.some(r => r.type === 'storage')).toBe(true);
    });

    it('should discover resources from Azure', async () => {
      const azureConfig: CloudProviderConfig = {
        provider: 'azure',
        region: 'eastus',
        credentials: {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          tenantId: 'test-tenant-id',
          subscriptionId: 'test-subscription-id',
        },
      };

      const connector = await createCloudConnector(azureConfig);
      const resources = await connector.listResources();

      expect(resources.length).toBeGreaterThan(0);
      expect(resources.every(r => r.provider === 'azure')).toBe(true);
    });

    it('should discover resources from GCP', async () => {
      const gcpConfig: CloudProviderConfig = {
        provider: 'gcp',
        region: 'us-central1',
        credentials: {
          projectId: 'test-project',
          keyFilename: '/path/to/service-account.json',
        },
      };

      const connector = await createCloudConnector(gcpConfig);
      const resources = await connector.listResources();

      expect(resources.length).toBeGreaterThan(0);
      expect(resources.every(r => r.provider === 'gcp')).toBe(true);
    });
  });

  describe('Cross-provider resource filtering', () => {
    it('should filter compute resources across providers', async () => {
      const providers = [
        {
          provider: 'aws' as const,
          region: 'us-east-1',
          credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
        },
        {
          provider: 'azure' as const,
          region: 'eastus',
          credentials: { 
            clientId: 'test', 
            clientSecret: 'test', 
            tenantId: 'test', 
            subscriptionId: 'test' 
          },
        },
        {
          provider: 'gcp' as const,
          region: 'us-central1',
          credentials: { projectId: 'test', keyFilename: '/path/to/key.json' },
        },
      ];

      const filter: ResourceFilter = { type: 'compute' };
      const allComputeResources = [];

      for (const config of providers) {
        const connector = await createCloudConnector(config);
        const resources = await connector.listResources(filter);
        allComputeResources.push(...resources);
      }

      expect(allComputeResources.length).toBeGreaterThan(0);
      expect(allComputeResources.every(r => r.type === 'compute')).toBe(true);
      
      // Verify we have resources from different providers
      const uniqueProviders = new Set(allComputeResources.map(r => r.provider));
      expect(uniqueProviders.size).toBe(3);
    });
  });

  describe('Resource operations across providers', () => {
    it('should perform operations on AWS resources', async () => {
      const config: CloudProviderConfig = {
        provider: 'aws',
        region: 'us-east-1',
        credentials: {
          accessKeyId: 'test-key',
          secretAccessKey: 'test-secret',
        },
      };

      const connector = await createCloudConnector(config);
      
      // Test create operation
      const createResult = await connector.executeOperation({
        operation: 'create',
        configuration: { instanceType: 't3.micro' },
      });
      expect(createResult.success).toBe(true);

      // Test start operation
      const startResult = await connector.executeOperation({
        operation: 'start',
        resourceId: 'i-1234567890abcdef0',
        configuration: {},
      });
      expect(startResult.success).toBe(true);
    });

    it('should perform operations on Azure resources', async () => {
      const config: CloudProviderConfig = {
        provider: 'azure',
        region: 'eastus',
        credentials: {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          tenantId: 'test-tenant-id',
          subscriptionId: 'test-subscription-id',
        },
      };

      const connector = await createCloudConnector(config);
      
      const result = await connector.executeOperation({
        operation: 'start',
        resourceId: '/subscriptions/12345/resourceGroups/rg1/providers/Microsoft.Compute/virtualMachines/vm1',
        configuration: {},
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Cost data aggregation', () => {
    it('should aggregate cost data across providers', async () => {
      const providers = [
        {
          provider: 'aws' as const,
          region: 'us-east-1',
          credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
        },
        {
          provider: 'azure' as const,
          region: 'eastus',
          credentials: { 
            clientId: 'test', 
            clientSecret: 'test', 
            tenantId: 'test', 
            subscriptionId: 'test' 
          },
        },
      ];

      const totalCosts: Record<string, number> = {};

      for (const config of providers) {
        const connector = await createCloudConnector(config);
        const resources = await connector.listResources();
        const resourceIds = resources.map(r => r.id);
        const costs = await connector.getCostData(resourceIds);
        
        Object.assign(totalCosts, costs);
      }

      expect(Object.keys(totalCosts).length).toBeGreaterThan(0);
      expect(Object.values(totalCosts).every(cost => typeof cost === 'number')).toBe(true);
    });
  });

  describe('Configuration validation', () => {
    it('should validate configurations for all providers', () => {
      const configs = [
        {
          provider: 'aws' as const,
          region: 'us-east-1',
          credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
        },
        {
          provider: 'azure' as const,
          region: 'eastus',
          credentials: { 
            clientId: 'test', 
            clientSecret: 'test', 
            tenantId: 'test', 
            subscriptionId: 'test' 
          },
        },
        {
          provider: 'gcp' as const,
          region: 'us-central1',
          credentials: { projectId: 'test', keyFilename: '/path/to/key.json' },
        },
      ];

      configs.forEach(config => {
        expect(validateCloudConfig(config)).toBe(true);
      });
    });

    it('should reject invalid configurations', () => {
      const invalidConfigs = [
        {
          provider: 'aws' as const,
          region: 'us-east-1',
          credentials: { accessKeyId: 'test' }, // Missing secretAccessKey
        },
        {
          provider: 'azure' as const,
          region: 'eastus',
          credentials: { clientId: 'test' }, // Missing other required fields
        },
        {
          provider: 'gcp' as const,
          region: 'us-central1',
          credentials: {}, // Missing projectId
        },
      ];

      invalidConfigs.forEach(config => {
        expect(validateCloudConfig(config)).toBe(false);
      });
    });
  });

  describe('Provider support', () => {
    it('should return correct list of supported providers', () => {
      const providers = getSupportedProviders();
      expect(providers).toEqual(['aws', 'azure', 'gcp']);
    });
  });

  describe('Connection testing', () => {
    it('should test connections for all providers', async () => {
      const configs = [
        {
          provider: 'aws' as const,
          region: 'us-east-1',
          credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
        },
        {
          provider: 'azure' as const,
          region: 'eastus',
          credentials: { 
            clientId: 'test', 
            clientSecret: 'test', 
            tenantId: 'test', 
            subscriptionId: 'test' 
          },
        },
        {
          provider: 'gcp' as const,
          region: 'us-central1',
          credentials: { projectId: 'test', keyFilename: '/path/to/key.json' },
        },
      ];

      for (const config of configs) {
        const connector = await createCloudConnector(config);
        const connectionResult = await connector.testConnection();
        expect(connectionResult).toBe(true);
      }
    });
  });
});