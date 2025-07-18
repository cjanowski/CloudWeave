import { CloudProviderFactory } from './CloudProviderFactory';
import { CloudProviderConfig } from './types';
import { AWSConnector } from './AWSConnector';
import { AzureConnector } from './AzureConnector';
import { GCPConnector } from './GCPConnector';

describe('CloudProviderFactory', () => {
  let factory: CloudProviderFactory;

  beforeEach(() => {
    factory = CloudProviderFactory.getInstance();
    factory.clearCache();
  });

  describe('createConnector', () => {
    it('should create AWS connector', () => {
      const connector = factory.createConnector('aws');
      expect(connector).toBeInstanceOf(AWSConnector);
      expect(connector.getProvider()).toBe('aws');
    });

    it('should create Azure connector', () => {
      const connector = factory.createConnector('azure');
      expect(connector).toBeInstanceOf(AzureConnector);
      expect(connector.getProvider()).toBe('azure');
    });

    it('should create GCP connector', () => {
      const connector = factory.createConnector('gcp');
      expect(connector).toBeInstanceOf(GCPConnector);
      expect(connector.getProvider()).toBe('gcp');
    });

    it('should throw error for unsupported provider', () => {
      expect(() => {
        factory.createConnector('unsupported' as any);
      }).toThrow('Unsupported cloud provider: unsupported');
    });
  });

  describe('createAndInitializeConnector', () => {
    it('should create and initialize AWS connector', async () => {
      const config: CloudProviderConfig = {
        provider: 'aws',
        region: 'us-east-1',
        credentials: {
          accessKeyId: 'test-key',
          secretAccessKey: 'test-secret',
        },
      };

      const connector = await factory.createAndInitializeConnector(config);
      expect(connector).toBeInstanceOf(AWSConnector);
      expect(connector.getProvider()).toBe('aws');
    });

    it('should cache initialized connectors', async () => {
      const config: CloudProviderConfig = {
        provider: 'aws',
        region: 'us-east-1',
        credentials: {
          accessKeyId: 'test-key',
          secretAccessKey: 'test-secret',
        },
      };

      const connector1 = await factory.createAndInitializeConnector(config);
      const connector2 = await factory.createAndInitializeConnector(config);
      
      expect(connector1).toBe(connector2);
    });

    it('should create different connectors for different regions', async () => {
      const config1: CloudProviderConfig = {
        provider: 'aws',
        region: 'us-east-1',
        credentials: {
          accessKeyId: 'test-key',
          secretAccessKey: 'test-secret',
        },
      };

      const config2: CloudProviderConfig = {
        provider: 'aws',
        region: 'us-west-2',
        credentials: {
          accessKeyId: 'test-key',
          secretAccessKey: 'test-secret',
        },
      };

      const connector1 = await factory.createAndInitializeConnector(config1);
      const connector2 = await factory.createAndInitializeConnector(config2);
      
      expect(connector1).not.toBe(connector2);
    });
  });

  describe('getSupportedProviders', () => {
    it('should return list of supported providers', () => {
      const providers = factory.getSupportedProviders();
      expect(providers).toEqual(['aws', 'azure', 'gcp']);
    });
  });

  describe('validateProviderConfig', () => {
    it('should validate AWS configuration', () => {
      const validConfig: CloudProviderConfig = {
        provider: 'aws',
        region: 'us-east-1',
        credentials: {
          accessKeyId: 'test-key',
          secretAccessKey: 'test-secret',
        },
      };

      expect(factory.validateProviderConfig(validConfig)).toBe(true);
    });

    it('should reject AWS configuration with missing credentials', () => {
      const invalidConfig: CloudProviderConfig = {
        provider: 'aws',
        region: 'us-east-1',
        credentials: {
          accessKeyId: 'test-key',
          // Missing secretAccessKey
        },
      };

      expect(factory.validateProviderConfig(invalidConfig)).toBe(false);
    });

    it('should validate Azure configuration', () => {
      const validConfig: CloudProviderConfig = {
        provider: 'azure',
        region: 'eastus',
        credentials: {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          tenantId: 'test-tenant-id',
          subscriptionId: 'test-subscription-id',
        },
      };

      expect(factory.validateProviderConfig(validConfig)).toBe(true);
    });

    it('should validate GCP configuration', () => {
      const validConfig: CloudProviderConfig = {
        provider: 'gcp',
        region: 'us-central1',
        credentials: {
          projectId: 'test-project',
          keyFilename: '/path/to/service-account.json',
        },
      };

      expect(factory.validateProviderConfig(validConfig)).toBe(true);
    });

    it('should reject configuration with unsupported provider', () => {
      const invalidConfig: CloudProviderConfig = {
        provider: 'unsupported' as any,
        region: 'us-east-1',
        credentials: {},
      };

      expect(factory.validateProviderConfig(invalidConfig)).toBe(false);
    });

    it('should reject configuration without region', () => {
      const invalidConfig: CloudProviderConfig = {
        provider: 'aws',
        region: '',
        credentials: {
          accessKeyId: 'test-key',
          secretAccessKey: 'test-secret',
        },
      };

      expect(factory.validateProviderConfig(invalidConfig)).toBe(false);
    });
  });

  describe('cache management', () => {
    it('should clear cache', async () => {
      const config: CloudProviderConfig = {
        provider: 'aws',
        region: 'us-east-1',
        credentials: {
          accessKeyId: 'test-key',
          secretAccessKey: 'test-secret',
        },
      };

      await factory.createAndInitializeConnector(config);
      expect(factory.getCachedConnector('aws', 'us-east-1')).not.toBeNull();

      factory.clearCache();
      expect(factory.getCachedConnector('aws', 'us-east-1')).toBeNull();
    });

    it('should remove specific connector from cache', async () => {
      const config: CloudProviderConfig = {
        provider: 'aws',
        region: 'us-east-1',
        credentials: {
          accessKeyId: 'test-key',
          secretAccessKey: 'test-secret',
        },
      };

      await factory.createAndInitializeConnector(config);
      expect(factory.getCachedConnector('aws', 'us-east-1')).not.toBeNull();

      factory.removeCachedConnector('aws', 'us-east-1');
      expect(factory.getCachedConnector('aws', 'us-east-1')).toBeNull();
    });
  });
});