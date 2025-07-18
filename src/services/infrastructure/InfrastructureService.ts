import { IInfrastructureService } from './interfaces';
import {
  InfrastructureResource,
  ResourceFilter,
  ResourceOperation,
  ResourceOperationResult,
  ResourceInventory,
  ResourceProvisioningRequest,
  ResourceProvisioningResult
} from './types';
import { ICloudConnector, createCloudConnector } from '../cloud';
import { CloudProviderConfig } from '../cloud/types';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Main infrastructure service implementation
 * Provides CRUD operations for infrastructure resources with state management
 */
export class InfrastructureService implements IInfrastructureService {
  private cloudConnectors: Map<string, ICloudConnector> = new Map();
  private resourceCache: Map<string, InfrastructureResource> = new Map();

  constructor(
    private cloudConfigs: CloudProviderConfig[],
    private driftDetectionService?: any,
    private policyValidationService?: any,
    private resourceStateService?: any
  ) {}

  /**
   * Initialize the service with cloud provider configurations
   */
  async initialize(): Promise<void> {
    try {
      // Initialize cloud connectors for each provider configuration
      for (const config of this.cloudConfigs) {
        const connector = await createCloudConnector(config);
        const key = `${config.provider}-${config.region}`;
        this.cloudConnectors.set(key, connector);
        
        logger.info(`Initialized cloud connector for ${config.provider} in ${config.region}`);
      }

      logger.info('Infrastructure service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize infrastructure service:', error);
      throw error;
    }
  }

  /**
   * Get all infrastructure resources with optional filtering
   */
  async getResources(filter?: ResourceFilter): Promise<InfrastructureResource[]> {
    try {
      const allResources: InfrastructureResource[] = [];

      // Get resources from all cloud providers
      for (const [key, connector] of this.cloudConnectors) {
        try {
          const cloudResources = await connector.listResources(filter);
          
          // Convert cloud resources to infrastructure resources
          const infraResources = await Promise.all(
            cloudResources.map(resource => this.convertToInfrastructureResource(resource))
          );
          
          allResources.push(...infraResources);
        } catch (error) {
          logger.error(`Failed to get resources from ${key}:`, error);
          // Continue with other providers
        }
      }

      // Apply additional infrastructure-specific filters
      const filteredResources = this.applyInfrastructureFilters(allResources, filter);

      logger.info(`Retrieved ${filteredResources.length} infrastructure resources`);
      return filteredResources;
    } catch (error) {
      logger.error('Failed to get infrastructure resources:', error);
      throw error;
    }
  }

  /**
   * Get a specific infrastructure resource by ID
   */
  async getResource(resourceId: string): Promise<InfrastructureResource | null> {
    try {
      // Check cache first
      if (this.resourceCache.has(resourceId)) {
        return this.resourceCache.get(resourceId)!;
      }

      // Search across all cloud providers
      for (const [key, connector] of this.cloudConnectors) {
        try {
          const cloudResource = await connector.getResource(resourceId);
          if (cloudResource) {
            const infraResource = await this.convertToInfrastructureResource(cloudResource);
            this.resourceCache.set(resourceId, infraResource);
            return infraResource;
          }
        } catch (error) {
          logger.warn(`Failed to get resource ${resourceId} from ${key}:`, error);
          // Continue searching other providers
        }
      }

      logger.info(`Resource ${resourceId} not found`);
      return null;
    } catch (error) {
      logger.error(`Failed to get resource ${resourceId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new infrastructure resource
   */
  async createResource(request: ResourceProvisioningRequest): Promise<ResourceProvisioningResult> {
    const requestId = uuidv4();
    
    try {
      logger.info(`Creating resource for request ${requestId}`, { request });

      // Validate the provisioning request
      const validationResult = await this.validateProvisioningRequest(request);
      if (!validationResult.isValid) {
        return {
          success: false,
          requestId,
          error: 'Validation failed',
          validationErrors: validationResult.errors,
          policyViolations: validationResult.policyViolations,
          timestamp: new Date(),
        };
      }

      // Get the appropriate cloud connector
      const connectorKey = `${request.provider}-${request.region}`;
      const connector = this.cloudConnectors.get(connectorKey);
      
      if (!connector) {
        return {
          success: false,
          requestId,
          error: `No connector available for ${request.provider} in ${request.region}`,
          timestamp: new Date(),
        };
      }

      // Execute the resource creation
      const operationResult = await connector.executeOperation({
        operation: 'create',
        configuration: {
          ...request.configuration,
          tags: request.tags,
        },
      });

      if (!operationResult.success) {
        return {
          success: false,
          requestId,
          error: operationResult.error,
          timestamp: new Date(),
        };
      }

      // Create infrastructure resource record
      const infraResource: InfrastructureResource = {
        id: operationResult.resourceId!,
        name: request.configuration.name || `resource-${Date.now()}`,
        type: request.resourceType as any,
        status: 'pending',
        region: request.region,
        provider: request.provider,
        tags: request.tags,
        configuration: request.configuration,
        createdAt: new Date(),
        updatedAt: new Date(),
        organizationId: request.organizationId,
        projectId: request.projectId,
        environmentId: request.environmentId,
        managedBy: 'manual',
        desiredState: {
          configuration: request.configuration,
          tags: request.tags,
          status: 'running',
          version: '1.0.0',
          lastModified: new Date(),
          modifiedBy: request.requestedBy,
        },
        actualState: {
          configuration: {},
          tags: {},
          status: 'pending',
          lastChecked: new Date(),
          healthStatus: 'unknown',
        },
        driftDetected: false,
        lastSyncAt: new Date(),
        policies: [],
        dependencies: [],
      };

      // Cache the resource
      this.resourceCache.set(infraResource.id, infraResource);

      logger.info(`Successfully created resource ${infraResource.id}`);

      return {
        success: true,
        resourceId: infraResource.id,
        requestId,
        message: 'Resource created successfully',
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error(`Failed to create resource for request ${requestId}:`, error);
      return {
        success: false,
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Update an existing infrastructure resource
   */
  async updateResource(resourceId: string, operation: ResourceOperation): Promise<ResourceOperationResult> {
    const operationId = uuidv4();
    
    try {
      logger.info(`Updating resource ${resourceId}`, { operation });

      // Get the current resource
      const resource = await this.getResource(resourceId);
      if (!resource) {
        return {
          success: false,
          operationId,
          error: `Resource ${resourceId} not found`,
          timestamp: new Date(),
        };
      }

      // Get the appropriate cloud connector
      const connectorKey = `${resource.provider}-${resource.region}`;
      const connector = this.cloudConnectors.get(connectorKey);
      
      if (!connector) {
        return {
          success: false,
          operationId,
          error: `No connector available for ${resource.provider} in ${resource.region}`,
          timestamp: new Date(),
        };
      }

      // Execute the operation
      const result = await connector.executeOperation({
        operation: operation.type as any,
        resourceId,
        configuration: operation.configuration || {},
      });

      if (result.success) {
        // Update the cached resource
        resource.updatedAt = new Date();
        resource.desiredState.lastModified = new Date();
        resource.desiredState.modifiedBy = operation.requestedBy;
        
        if (operation.configuration) {
          resource.desiredState.configuration = {
            ...resource.desiredState.configuration,
            ...operation.configuration,
          };
        }
        
        if (operation.tags) {
          resource.desiredState.tags = {
            ...resource.desiredState.tags,
            ...operation.tags,
          };
        }

        this.resourceCache.set(resourceId, resource);
      }

      return {
        success: result.success,
        resourceId,
        operationId,
        message: result.message,
        error: result.error,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error(`Failed to update resource ${resourceId}:`, error);
      return {
        success: false,
        resourceId,
        operationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Delete an infrastructure resource
   */
  async deleteResource(resourceId: string, reason?: string, requestedBy?: string): Promise<ResourceOperationResult> {
    const operationId = uuidv4();
    
    try {
      logger.info(`Deleting resource ${resourceId}`, { reason, requestedBy });

      const resource = await this.getResource(resourceId);
      if (!resource) {
        return {
          success: false,
          operationId,
          error: `Resource ${resourceId} not found`,
          timestamp: new Date(),
        };
      }

      // Check dependencies before deletion
      if (this.resourceStateService) {
        const dependents = await this.resourceStateService.getDependents?.(resourceId);
        if (dependents && dependents.length > 0) {
          return {
            success: false,
            operationId,
            error: `Cannot delete resource ${resourceId}: has ${dependents.length} dependent resources`,
            details: { dependents: dependents.map((r: any) => r.id) },
            timestamp: new Date(),
          };
        }
      }

      const connectorKey = `${resource.provider}-${resource.region}`;
      const connector = this.cloudConnectors.get(connectorKey);
      
      if (!connector) {
        return {
          success: false,
          operationId,
          error: `No connector available for ${resource.provider} in ${resource.region}`,
          timestamp: new Date(),
        };
      }

      const result = await connector.executeOperation({
        operation: 'delete',
        resourceId,
        configuration: {},
      });

      if (result.success) {
        // Remove from cache
        this.resourceCache.delete(resourceId);
      }

      return {
        success: result.success,
        resourceId,
        operationId,
        message: result.message,
        error: result.error,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error(`Failed to delete resource ${resourceId}:`, error);
      return {
        success: false,
        resourceId,
        operationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Sync resource state with cloud provider
   */
  async syncResource(resourceId: string): Promise<ResourceOperationResult> {
    const operationId = uuidv4();
    
    try {
      logger.info(`Syncing resource ${resourceId}`);

      const resource = await this.getResource(resourceId);
      if (!resource) {
        return {
          success: false,
          operationId,
          error: `Resource ${resourceId} not found`,
          timestamp: new Date(),
        };
      }

      const connectorKey = `${resource.provider}-${resource.region}`;
      const connector = this.cloudConnectors.get(connectorKey);
      
      if (!connector) {
        return {
          success: false,
          operationId,
          error: `No connector available for ${resource.provider} in ${resource.region}`,
          timestamp: new Date(),
        };
      }

      // Get current state from cloud provider
      const cloudResource = await connector.getResource(resourceId);
      if (!cloudResource) {
        return {
          success: false,
          operationId,
          error: `Resource ${resourceId} not found in cloud provider`,
          timestamp: new Date(),
        };
      }

      // Update actual state
      resource.actualState = {
        configuration: cloudResource.configuration,
        tags: cloudResource.tags,
        status: cloudResource.status as any,
        lastChecked: new Date(),
        healthStatus: cloudResource.status === 'running' ? 'healthy' : 'unknown',
      };

      resource.lastSyncAt = new Date();
      resource.updatedAt = new Date();

      // Check for drift
      if (this.driftDetectionService) {
        const driftResult = await this.driftDetectionService.detectDrift(resourceId);
        resource.driftDetected = driftResult.hasDrift;
      }

      this.resourceCache.set(resourceId, resource);

      return {
        success: true,
        resourceId,
        operationId,
        message: 'Resource synced successfully',
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error(`Failed to sync resource ${resourceId}:`, error);
      return {
        success: false,
        resourceId,
        operationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Sync all resources for a given filter
   */
  async syncResources(filter?: ResourceFilter): Promise<ResourceOperationResult[]> {
    try {
      const resources = await this.getResources(filter);
      const results = await Promise.all(
        resources.map(resource => this.syncResource(resource.id))
      );

      logger.info(`Synced ${results.length} resources`);
      return results;
    } catch (error) {
      logger.error('Failed to sync resources:', error);
      throw error;
    }
  }

  /**
   * Get resource inventory summary
   */
  async getInventory(filter?: ResourceFilter): Promise<ResourceInventory> {
    try {
      const resources = await this.getResources(filter);

      const inventory: ResourceInventory = {
        totalResources: resources.length,
        resourcesByProvider: {},
        resourcesByType: {},
        resourcesByStatus: {},
        driftedResources: 0,
        nonCompliantResources: 0,
        lastUpdated: new Date(),
      };

      // Calculate statistics
      resources.forEach(resource => {
        // By provider
        inventory.resourcesByProvider[resource.provider] = 
          (inventory.resourcesByProvider[resource.provider] || 0) + 1;

        // By type
        inventory.resourcesByType[resource.type] = 
          (inventory.resourcesByType[resource.type] || 0) + 1;

        // By status
        inventory.resourcesByStatus[resource.actualState.status] = 
          (inventory.resourcesByStatus[resource.actualState.status] || 0) + 1;

        // Drift detection
        if (resource.driftDetected) {
          inventory.driftedResources++;
        }

        // Policy compliance
        const hasViolations = resource.policies.some(p => p.status === 'non-compliant');
        if (hasViolations) {
          inventory.nonCompliantResources++;
        }
      });

      return inventory;
    } catch (error) {
      logger.error('Failed to get resource inventory:', error);
      throw error;
    }
  }

  // Private helper methods
  private async convertToInfrastructureResource(cloudResource: any): Promise<InfrastructureResource> {
    // Convert cloud resource to infrastructure resource
    // In a real implementation, this would fetch additional data from database
    return {
      ...cloudResource,
      organizationId: 'default-org',
      projectId: 'default-project',
      environmentId: 'default-env',
      managedBy: 'manual' as const,
      desiredState: {
        configuration: cloudResource.configuration,
        tags: cloudResource.tags,
        status: cloudResource.status as any,
        version: '1.0.0',
        lastModified: cloudResource.updatedAt,
        modifiedBy: 'system',
      },
      actualState: {
        configuration: cloudResource.configuration,
        tags: cloudResource.tags,
        status: cloudResource.status as any,
        lastChecked: new Date(),
        healthStatus: cloudResource.status === 'running' ? 'healthy' : 'unknown',
      },
      driftDetected: false,
      lastSyncAt: new Date(),
      policies: [],
      dependencies: [],
    };
  }

  private applyInfrastructureFilters(resources: InfrastructureResource[], filter?: ResourceFilter): InfrastructureResource[] {
    if (!filter) return resources;

    return resources.filter(resource => {
      if (filter.organizationId && resource.organizationId !== filter.organizationId) return false;
      if (filter.projectId && resource.projectId !== filter.projectId) return false;
      if (filter.environmentId && resource.environmentId !== filter.environmentId) return false;
      if (filter.managedBy && resource.managedBy !== filter.managedBy) return false;
      if (filter.driftDetected !== undefined && resource.driftDetected !== filter.driftDetected) return false;
      if (filter.healthStatus && resource.actualState.healthStatus !== filter.healthStatus) return false;

      return true;
    });
  }

  private async validateProvisioningRequest(request: ResourceProvisioningRequest): Promise<{
    isValid: boolean;
    errors: string[];
    policyViolations: any[];
  }> {
    const errors: string[] = [];
    const policyViolations: any[] = [];

    // Basic validation
    if (!request.organizationId) errors.push('Organization ID is required');
    if (!request.projectId) errors.push('Project ID is required');
    if (!request.environmentId) errors.push('Environment ID is required');
    if (!request.provider) errors.push('Provider is required');
    if (!request.region) errors.push('Region is required');
    if (!request.resourceType) errors.push('Resource type is required');
    if (!request.configuration) errors.push('Configuration is required');

    // Policy validation
    if (this.policyValidationService) {
      try {
        const violations = await this.policyValidationService.validateProvisioningRequest(request);
        policyViolations.push(...violations);
      } catch (error) {
        logger.warn('Policy validation failed:', error);
      }
    }

    return {
      isValid: errors.length === 0 && policyViolations.length === 0,
      errors,
      policyViolations,
    };
  }
}