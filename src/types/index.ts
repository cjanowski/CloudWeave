// Core data model interfaces based on design document

export interface Organization {
  id: string;
  name: string;
  settings: OrganizationSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationSettings {
  defaultCloudProvider: CloudProvider;
  costCenter: string;
  complianceFrameworks: string[];
  notificationChannels: NotificationChannel[];
}

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  environments: Environment[];
  costCenter: string;
  tags: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Environment {
  id: string;
  projectId: string;
  name: string;
  type: EnvironmentType;
  cloudProvider: CloudProvider;
  region: string;
  resources: Resource[];
  configurations: Configuration[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Resource {
  id: string;
  environmentId: string;
  type: string;
  name: string;
  cloudResourceId: string;
  status: ResourceStatus;
  configuration: Record<string, any>;
  cost: CostData;
  tags: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Deployment {
  id: string;
  applicationId: string;
  environmentId: string;
  version: string;
  status: DeploymentStatus;
  strategy: DeploymentStrategy;
  configuration: DeploymentConfig;
  logs: DeploymentLog[];
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  organizationId: string;
  roles: Role[];
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Configuration {
  id: string;
  environmentId: string;
  key: string;
  value: string;
  isSecret: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CostData {
  amount: number;
  currency: string;
  period: string;
  lastUpdated: Date;
}

export interface DeploymentConfig {
  image: string;
  replicas: number;
  resources: {
    cpu: string;
    memory: string;
  };
  environment: Record<string, string>;
}

export interface DeploymentLog {
  id: string;
  deploymentId: string;
  level: LogLevel;
  message: string;
  timestamp: Date;
}

export interface NotificationChannel {
  type: 'email' | 'slack' | 'webhook';
  config: Record<string, any>;
}

// Enums and Union Types
export type CloudProvider = 'aws' | 'azure' | 'gcp';
export type EnvironmentType = 'development' | 'staging' | 'production';
export type ResourceStatus = 'active' | 'inactive' | 'error';
export type DeploymentStatus = 'pending' | 'running' | 'success' | 'failed' | 'rolled_back';
export type DeploymentStrategy = 'blue_green' | 'canary' | 'rolling';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ErrorResponse;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface ErrorResponse {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  requestId: string;
}

// Authentication Types
export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface JwtPayload {
  userId: string;
  organizationId: string;
  roles: string[];
  iat: number;
  exp: number;
}

// Request/Response Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  organizationId: string;
}

export interface CreateProjectRequest {
  name: string;
  description: string;
  costCenter: string;
  tags?: Record<string, string>;
}

export interface CreateEnvironmentRequest {
  name: string;
  type: EnvironmentType;
  cloudProvider: CloudProvider;
  region: string;
}

export interface CreateDeploymentRequest {
  applicationId: string;
  environmentId: string;
  version: string;
  strategy: DeploymentStrategy;
  configuration: DeploymentConfig;
}