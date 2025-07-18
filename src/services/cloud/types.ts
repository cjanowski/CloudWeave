/**
 * Common types and interfaces for cloud provider abstraction
 */

export interface CloudCredentials {
  provider: CloudProvider;
  region: string;
  credentials: Record<string, any>;
}

export type CloudProvider = 'aws' | 'azure' | 'gcp';

export type ResourceType = 
  | 'compute' 
  | 'storage' 
  | 'network' 
  | 'database' 
  | 'security' 
  | 'monitoring'
  | 'other';

export type ResourceStatus = 
  | 'running' 
  | 'stopped' 
  | 'pending' 
  | 'error' 
  | 'terminated' 
  | 'unknown';

export interface CloudResource {
  id: string;
  name: string;
  type: ResourceType;
  status: ResourceStatus;
  region: string;
  provider: CloudProvider;
  tags: Record<string, string>;
  configuration: Record<string, any>;
  cost?: CostInfo;
  createdAt: Date;
  updatedAt: Date;
}

export interface CostInfo {
  dailyCost: number;
  monthlyCost: number;
  currency: string;
  lastUpdated: Date;
}

export interface ResourceFilter {
  type?: ResourceType;
  status?: ResourceStatus;
  region?: string;
  tags?: Record<string, string>;
  namePattern?: string;
}

export interface CloudProviderConfig {
  provider: CloudProvider;
  region: string;
  credentials: Record<string, any>;
  options?: Record<string, any>;
}

export interface ResourceOperation {
  operation: 'create' | 'update' | 'delete' | 'start' | 'stop';
  resourceId?: string;
  configuration: Record<string, any>;
}

export interface OperationResult {
  success: boolean;
  resourceId?: string;
  message?: string;
  error?: string;
  details?: Record<string, any>;
}