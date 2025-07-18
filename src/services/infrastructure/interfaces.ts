import {
  InfrastructureResource,
  ResourceFilter,
  ResourceOperation,
  ResourceOperationResult,
  DriftDetectionResult,
  ResourceInventory,
  ResourceProvisioningRequest,
  ResourceProvisioningResult,
  PolicyViolation
} from './types';

/**
 * Interface for infrastructure resource management
 */
export interface IInfrastructureService {
  /**
   * Get all infrastructure resources with optional filtering
   */
  getResources(filter?: ResourceFilter): Promise<InfrastructureResource[]>;

  /**
   * Get a specific infrastructure resource by ID
   */
  getResource(resourceId: string): Promise<InfrastructureResource | null>;

  /**
   * Create a new infrastructure resource
   */
  createResource(request: ResourceProvisioningRequest): Promise<ResourceProvisioningResult>;

  /**
   * Update an existing infrastructure resource
   */
  updateResource(resourceId: string, operation: ResourceOperation): Promise<ResourceOperationResult>;

  /**
   * Delete an infrastructure resource
   */
  deleteResource(resourceId: string, reason?: string, requestedBy?: string): Promise<ResourceOperationResult>;

  /**
   * Sync resource state with cloud provider
   */
  syncResource(resourceId: string): Promise<ResourceOperationResult>;

  /**
   * Sync all resources for a given filter
   */
  syncResources(filter?: ResourceFilter): Promise<ResourceOperationResult[]>;

  /**
   * Get resource inventory summary
   */
  getInventory(filter?: ResourceFilter): Promise<ResourceInventory>;
}

/**
 * Interface for drift detection service
 */
export interface IDriftDetectionService {
  /**
   * Detect drift for a specific resource
   */
  detectDrift(resourceId: string): Promise<DriftDetectionResult>;

  /**
   * Detect drift for multiple resources
   */
  detectDriftBatch(resourceIds: string[]): Promise<DriftDetectionResult[]>;

  /**
   * Schedule drift detection for resources matching filter
   */
  scheduleDriftDetection(filter: ResourceFilter, intervalMinutes: number): Promise<void>;

  /**
   * Get drift detection results
   */
  getDriftResults(filter?: ResourceFilter): Promise<DriftDetectionResult[]>;
}

/**
 * Interface for policy validation service
 */
export interface IPolicyValidationService {
  /**
   * Validate resource configuration against policies
   */
  validateResource(resource: InfrastructureResource): Promise<PolicyViolation[]>;

  /**
   * Validate resource provisioning request against policies
   */
  validateProvisioningRequest(request: ResourceProvisioningRequest): Promise<PolicyViolation[]>;

  /**
   * Get policy violations for resources
   */
  getPolicyViolations(filter?: ResourceFilter): Promise<PolicyViolation[]>;

  /**
   * Apply policy remediation
   */
  applyRemediation(resourceId: string, violationId: string): Promise<ResourceOperationResult>;
}

/**
 * Interface for resource state management
 */
export interface IResourceStateService {
  /**
   * Get current state of a resource
   */
  getResourceState(resourceId: string): Promise<InfrastructureResource | null>;

  /**
   * Update resource desired state
   */
  updateDesiredState(resourceId: string, desiredState: Record<string, any>): Promise<void>;

  /**
   * Update resource actual state
   */
  updateActualState(resourceId: string, actualState: Record<string, any>): Promise<void>;

  /**
   * Compare desired vs actual state
   */
  compareStates(resourceId: string): Promise<DriftDetectionResult>;

  /**
   * Get state history for a resource
   */
  getStateHistory(resourceId: string, limit?: number): Promise<any[]>;
}

/**
 * Interface for resource dependency management
 */
export interface IResourceDependencyService {
  /**
   * Get dependencies for a resource
   */
  getDependencies(resourceId: string): Promise<InfrastructureResource[]>;

  /**
   * Get dependents of a resource
   */
  getDependents(resourceId: string): Promise<InfrastructureResource[]>;

  /**
   * Add dependency relationship
   */
  addDependency(resourceId: string, dependsOnResourceId: string, relationship: string): Promise<void>;

  /**
   * Remove dependency relationship
   */
  removeDependency(resourceId: string, dependsOnResourceId: string): Promise<void>;

  /**
   * Get dependency graph
   */
  getDependencyGraph(filter?: ResourceFilter): Promise<any>;

  /**
   * Validate dependency changes
   */
  validateDependencyChange(resourceId: string, operation: ResourceOperation): Promise<string[]>;
}