import { 
  ICloudConnector, 
  CloudResource, 
  ResourceFilter, 
  CloudProviderConfig, 
  ResourceOperation, 
  OperationResult,
  CloudProvider 
} from './interfaces';
import { logger } from '../../utils/logger';

/**
 * Base class for cloud provider connectors
 * Provides common functionality and enforces interface compliance
 */
export abstract class BaseCloudConnector implements ICloudConnector {
  protected config: CloudProviderConfig | null = null;
  protected initialized = false;

  constructor(protected provider: CloudProvider) {}

  /**
   * Initialize the connector with configuration
   */
  async initialize(config: CloudProviderConfig): Promise<void> {
    try {
      this.validateConfig(config);
      this.config = config;
      await this.setupClient();
      this.initialized = true;
      
      logger.info(`${this.provider} connector initialized successfully`, {
        provider: this.provider,
        region: config.region,
      });
    } catch (error) {
      logger.error(`Failed to initialize ${this.provider} connector:`, error);
      throw error;
    }
  }

  /**
   * Test the connection to the cloud provider
   */
  async testConnection(): Promise<boolean> {
    this.ensureInitialized();
    
    try {
      const result = await this.performConnectionTest();
      logger.info(`${this.provider} connection test result:`, { success: result });
      return result;
    } catch (error) {
      logger.error(`${this.provider} connection test failed:`, error);
      return false;
    }
  }

  /**
   * Get the cloud provider type
   */
  getProvider(): CloudProvider {
    return this.provider;
  }

  /**
   * Discover and list resources
   */
  async listResources(filter?: ResourceFilter): Promise<CloudResource[]> {
    this.ensureInitialized();
    
    try {
      const resources = await this.fetchResources(filter);
      logger.info(`Listed ${resources.length} resources from ${this.provider}`, {
        provider: this.provider,
        filter,
      });
      return resources;
    } catch (error) {
      logger.error(`Failed to list resources from ${this.provider}:`, error);
      throw error;
    }
  }

  /**
   * Get detailed information about a specific resource
   */
  async getResource(resourceId: string): Promise<CloudResource | null> {
    this.ensureInitialized();
    
    try {
      const resource = await this.fetchResource(resourceId);
      logger.info(`Retrieved resource ${resourceId} from ${this.provider}`, {
        provider: this.provider,
        resourceId,
        found: !!resource,
      });
      return resource;
    } catch (error) {
      logger.error(`Failed to get resource ${resourceId} from ${this.provider}:`, error);
      throw error;
    }
  }

  /**
   * Perform operations on resources
   */
  async executeOperation(operation: ResourceOperation): Promise<OperationResult> {
    this.ensureInitialized();
    
    try {
      const result = await this.performOperation(operation);
      logger.info(`Executed ${operation.operation} operation on ${this.provider}`, {
        provider: this.provider,
        operation: operation.operation,
        resourceId: operation.resourceId,
        success: result.success,
      });
      return result;
    } catch (error) {
      logger.error(`Failed to execute operation on ${this.provider}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get cost information for resources
   */
  async getCostData(resourceIds?: string[]): Promise<Record<string, number>> {
    this.ensureInitialized();
    
    try {
      const costData = await this.fetchCostData(resourceIds);
      logger.info(`Retrieved cost data from ${this.provider}`, {
        provider: this.provider,
        resourceCount: resourceIds?.length || 'all',
      });
      return costData;
    } catch (error) {
      logger.error(`Failed to get cost data from ${this.provider}:`, error);
      return {};
    }
  }

  /**
   * Validate resource configuration
   */
  async validateConfiguration(config: Record<string, any>): Promise<boolean> {
    try {
      const isValid = await this.performConfigValidation(config);
      logger.info(`Configuration validation result for ${this.provider}:`, {
        provider: this.provider,
        valid: isValid,
      });
      return isValid;
    } catch (error) {
      logger.error(`Configuration validation failed for ${this.provider}:`, error);
      return false;
    }
  }

  // Protected helper methods
  protected ensureInitialized(): void {
    if (!this.initialized || !this.config) {
      throw new Error(`${this.provider} connector is not initialized`);
    }
  }

  protected validateConfig(config: CloudProviderConfig): void {
    if (!config.provider || config.provider !== this.provider) {
      throw new Error(`Invalid provider configuration for ${this.provider}`);
    }
    
    if (!config.region) {
      throw new Error('Region is required in configuration');
    }
    
    if (!config.credentials || Object.keys(config.credentials).length === 0) {
      throw new Error('Credentials are required in configuration');
    }
  }

  // Abstract methods that must be implemented by concrete classes
  protected abstract setupClient(): Promise<void>;
  protected abstract performConnectionTest(): Promise<boolean>;
  protected abstract fetchResources(filter?: ResourceFilter): Promise<CloudResource[]>;
  protected abstract fetchResource(resourceId: string): Promise<CloudResource | null>;
  protected abstract performOperation(operation: ResourceOperation): Promise<OperationResult>;
  protected abstract fetchCostData(resourceIds?: string[]): Promise<Record<string, number>>;
  protected abstract performConfigValidation(config: Record<string, any>): Promise<boolean>;
}