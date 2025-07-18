import { 
  CloudResource, 
  ResourceFilter, 
  CloudProviderConfig, 
  ResourceOperation, 
  OperationResult,
  CloudProvider 
} from './types';

/**
 * Base interface for all cloud provider connectors
 */
export interface ICloudConnector {
  /**
   * Initialize the connector with configuration
   */
  initialize(config: CloudProviderConfig): Promise<void>;

  /**
   * Test the connection to the cloud provider
   */
  testConnection(): Promise<boolean>;

  /**
   * Get the cloud provider type
   */
  getProvider(): CloudProvider;

  /**
   * Discover and list resources
   */
  listResources(filter?: ResourceFilter): Promise<CloudResource[]>;

  /**
   * Get detailed information about a specific resource
   */
  getResource(resourceId: string): Promise<CloudResource | null>;

  /**
   * Perform operations on resources
   */
  executeOperation(operation: ResourceOperation): Promise<OperationResult>;

  /**
   * Get cost information for resources
   */
  getCostData(resourceIds?: string[]): Promise<Record<string, number>>;

  /**
   * Validate resource configuration
   */
  validateConfiguration(config: Record<string, any>): Promise<boolean>;
}

/**
 * Interface for compute-specific operations
 */
export interface IComputeConnector extends ICloudConnector {
  /**
   * List virtual machines/instances
   */
  listInstances(filter?: ResourceFilter): Promise<CloudResource[]>;

  /**
   * Start an instance
   */
  startInstance(instanceId: string): Promise<OperationResult>;

  /**
   * Stop an instance
   */
  stopInstance(instanceId: string): Promise<OperationResult>;

  /**
   * Restart an instance
   */
  restartInstance(instanceId: string): Promise<OperationResult>;

  /**
   * Get instance metrics
   */
  getInstanceMetrics(instanceId: string, timeRange?: string): Promise<Record<string, any>>;
}

/**
 * Interface for storage-specific operations
 */
export interface IStorageConnector extends ICloudConnector {
  /**
   * List storage resources (buckets, volumes, etc.)
   */
  listStorageResources(filter?: ResourceFilter): Promise<CloudResource[]>;

  /**
   * Create a storage resource
   */
  createStorage(config: Record<string, any>): Promise<OperationResult>;

  /**
   * Delete a storage resource
   */
  deleteStorage(resourceId: string): Promise<OperationResult>;

  /**
   * Get storage usage metrics
   */
  getStorageMetrics(resourceId: string): Promise<Record<string, any>>;
}

/**
 * Interface for network-specific operations
 */
export interface INetworkConnector extends ICloudConnector {
  /**
   * List network resources (VPCs, subnets, security groups, etc.)
   */
  listNetworkResources(filter?: ResourceFilter): Promise<CloudResource[]>;

  /**
   * Create network resource
   */
  createNetworkResource(config: Record<string, any>): Promise<OperationResult>;

  /**
   * Update security group rules
   */
  updateSecurityRules(resourceId: string, rules: any[]): Promise<OperationResult>;

  /**
   * Get network topology
   */
  getNetworkTopology(): Promise<Record<string, any>>;
}

/**
 * Interface for cloud provider factory
 */
export interface ICloudProviderFactory {
  /**
   * Create a connector for the specified provider
   */
  createConnector(provider: CloudProvider): ICloudConnector;

  /**
   * Get list of supported providers
   */
  getSupportedProviders(): CloudProvider[];

  /**
   * Validate provider configuration
   */
  validateProviderConfig(config: CloudProviderConfig): boolean;
}