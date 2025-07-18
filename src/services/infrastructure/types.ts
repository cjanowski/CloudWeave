import { CloudProvider, CloudResource } from '../cloud/types';

/**
 * Infrastructure resource management types
 */

export interface InfrastructureResource extends CloudResource {
  // Additional fields for infrastructure management
  organizationId: string;
  projectId: string;
  environmentId: string;
  managedBy: 'terraform' | 'manual' | 'cloudformation' | 'arm' | 'deployment-manager';
  desiredState: ResourceDesiredState;
  actualState: ResourceActualState;
  driftDetected: boolean;
  lastSyncAt: Date;
  policies: PolicyAssignment[];
  dependencies: ResourceDependency[];
}

export interface ResourceDesiredState {
  configuration: Record<string, any>;
  tags: Record<string, string>;
  status: 'running' | 'stopped' | 'terminated';
  version: string;
  lastModified: Date;
  modifiedBy: string;
}

export interface ResourceActualState {
  configuration: Record<string, any>;
  tags: Record<string, string>;
  status: 'running' | 'stopped' | 'pending' | 'error' | 'terminated' | 'unknown';
  lastChecked: Date;
  healthStatus: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  metrics?: ResourceMetrics;
}

export interface ResourceMetrics {
  cpu?: number;
  memory?: number;
  disk?: number;
  network?: number;
  customMetrics?: Record<string, number>;
}

export interface PolicyAssignment {
  policyId: string;
  policyName: string;
  policyType: 'security' | 'compliance' | 'cost' | 'governance';
  status: 'compliant' | 'non-compliant' | 'unknown';
  lastEvaluated: Date;
  violations?: PolicyViolation[];
}

export interface PolicyViolation {
  rule: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  remediation?: string;
  detectedAt: Date;
}

export interface ResourceDependency {
  resourceId: string;
  dependencyType: 'requires' | 'provides' | 'connects_to';
  relationship: string;
}

export interface ResourceFilter {
  organizationId?: string;
  projectId?: string;
  environmentId?: string;
  provider?: CloudProvider;
  type?: string;
  status?: string;
  tags?: Record<string, string>;
  managedBy?: string;
  driftDetected?: boolean;
  healthStatus?: string;
  namePattern?: string;
}

export interface ResourceOperation {
  type: 'create' | 'update' | 'delete' | 'start' | 'stop' | 'restart' | 'sync';
  resourceId?: string;
  configuration?: Record<string, any>;
  tags?: Record<string, string>;
  reason?: string;
  requestedBy: string;
}

export interface ResourceOperationResult {
  success: boolean;
  resourceId?: string;
  operationId: string;
  message?: string;
  error?: string;
  details?: Record<string, any>;
  timestamp: Date;
}

export interface DriftDetectionResult {
  resourceId: string;
  hasDrift: boolean;
  driftDetails: DriftDetail[];
  detectedAt: Date;
  severity: 'low' | 'medium' | 'high';
}

export interface DriftDetail {
  property: string;
  desiredValue: any;
  actualValue: any;
  changeType: 'added' | 'removed' | 'modified';
}

export interface ResourceInventory {
  totalResources: number;
  resourcesByProvider: Record<CloudProvider, number>;
  resourcesByType: Record<string, number>;
  resourcesByStatus: Record<string, number>;
  driftedResources: number;
  nonCompliantResources: number;
  lastUpdated: Date;
}

export interface ResourceProvisioningRequest {
  organizationId: string;
  projectId: string;
  environmentId: string;
  provider: CloudProvider;
  region: string;
  resourceType: string;
  configuration: Record<string, any>;
  tags: Record<string, string>;
  policies: string[];
  requestedBy: string;
  reason?: string;
}

export interface ResourceProvisioningResult {
  success: boolean;
  resourceId?: string;
  requestId: string;
  message?: string;
  error?: string;
  validationErrors?: string[];
  policyViolations?: PolicyViolation[];
  estimatedCost?: number;
  timestamp: Date;
}