import { ICloudConnector, ICloudProviderFactory } from './interfaces';
import { CloudProvider, CloudProviderConfig } from './types';
import { AWSConnector } from './AWSConnector';
import { AzureConnector } from './AzureConnector';
import { GCPConnector } from './GCPConnector';
import { logger } from '../../utils/logger';

/**
 * Factory class for creating cloud provider connectors
 * Provides a unified interface for instantiating different cloud provider implementations
 */
export class CloudProviderFactory implements ICloudProviderFactory {
  private static instance: CloudProviderFactory;
  private connectorCache: Map<string, ICloudConnector> = new Map();

  private constructor() {}

  /**
   * Get singleton instance of the factory
   */
  public static getInstance(): CloudProviderFactory {
    if (!CloudProviderFactory.instance) {
      CloudProviderFactory.instance = new CloudProviderFactory();
    }
    return CloudProviderFactory.instance;
  }

  /**
   * Create a connector for the specified provider
   */
  createConnector(provider: CloudProvider): ICloudConnector {
    try {
      let connector: ICloudConnector;

      switch (provider) {
        case 'aws':
          connector = new AWSConnector();
          break;
        case 'azure':
          connector = new AzureConnector();
          break;
        case 'gcp':
          connector = new GCPConnector();
          break;
        default:
          throw new Error(`Unsupported cloud provider: ${provider}`);
      }

      logger.info(`Created ${provider} connector`);
      return connector;
    } catch (error) {
      logger.error(`Failed to create ${provider} connector:`, error);
      throw error;
    }
  }

  /**
   * Create and cache a connector for the specified provider and configuration
   */
  async createAndInitializeConnector(config: CloudProviderConfig): Promise<ICloudConnector> {
    const cacheKey = `${config.provider}-${config.region}`;
    
    // Check if connector is already cached
    if (this.connectorCache.has(cacheKey)) {
      const cachedConnector = this.connectorCache.get(cacheKey)!;
      logger.info(`Using cached ${config.provider} connector`);
      return cachedConnector;
    }

    try {
      // Create new connector
      const connector = this.createConnector(config.provider);
      
      // Initialize the connector
      await connector.initialize(config);
      
      // Cache the initialized connector
      this.connectorCache.set(cacheKey, connector);
      
      logger.info(`Created and cached ${config.provider} connector for region ${config.region}`);
      return connector;
    } catch (error) {
      logger.error(`Failed to create and initialize ${config.provider} connector:`, error);
      throw error;
    }
  }

  /**
   * Get list of supported providers
   */
  getSupportedProviders(): CloudProvider[] {
    return ['aws', 'azure', 'gcp'];
  }

  /**
   * Validate provider configuration
   */
  validateProviderConfig(config: CloudProviderConfig): boolean {
    try {
      // Check if provider is supported
      if (!this.getSupportedProviders().includes(config.provider)) {
        logger.warn(`Unsupported provider: ${config.provider}`);
        return false;
      }

      // Check required fields
      if (!config.region) {
        logger.warn('Region is required in provider configuration');
        return false;
      }

      if (!config.credentials || Object.keys(config.credentials).length === 0) {
        logger.warn('Credentials are required in provider configuration');
        return false;
      }

      // Provider-specific validation
      switch (config.provider) {
        case 'aws':
          return this.validateAWSConfig(config.credentials);
        case 'azure':
          return this.validateAzureConfig(config.credentials);
        case 'gcp':
          return this.validateGCPConfig(config.credentials);
        default:
          return false;
      }
    } catch (error) {
      logger.error('Provider configuration validation failed:', error);
      return false;
    }
  }

  /**
   * Clear cached connectors
   */
  clearCache(): void {
    this.connectorCache.clear();
    logger.info('Cleared connector cache');
  }

  /**
   * Get cached connector if available
   */
  getCachedConnector(provider: CloudProvider, region: string): ICloudConnector | null {
    const cacheKey = `${provider}-${region}`;
    return this.connectorCache.get(cacheKey) || null;
  }

  /**
   * Remove specific connector from cache
   */
  removeCachedConnector(provider: CloudProvider, region: string): void {
    const cacheKey = `${provider}-${region}`;
    if (this.connectorCache.delete(cacheKey)) {
      logger.info(`Removed ${provider} connector for region ${region} from cache`);
    }
  }

  // Private validation methods
  private validateAWSConfig(credentials: Record<string, any>): boolean {
    const requiredFields = ['accessKeyId', 'secretAccessKey'];
    
    for (const field of requiredFields) {
      if (!credentials[field]) {
        logger.warn(`Missing required AWS credential field: ${field}`);
        return false;
      }
    }

    return true;
  }

  private validateAzureConfig(credentials: Record<string, any>): boolean {
    const requiredFields = ['clientId', 'clientSecret', 'tenantId', 'subscriptionId'];
    
    for (const field of requiredFields) {
      if (!credentials[field]) {
        logger.warn(`Missing required Azure credential field: ${field}`);
        return false;
      }
    }

    return true;
  }

  private validateGCPConfig(credentials: Record<string, any>): boolean {
    if (!credentials.projectId) {
      logger.warn('Missing required GCP credential field: projectId');
      return false;
    }

    // Check for service account key or application default credentials
    if (!credentials.keyFilename && !credentials.credentials && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      logger.warn('No GCP credentials found (keyFilename, credentials object, or GOOGLE_APPLICATION_CREDENTIALS)');
      return false;
    }

    return true;
  }
}

// Export singleton instance
export const cloudProviderFactory = CloudProviderFactory.getInstance();