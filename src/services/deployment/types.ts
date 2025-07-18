/**
 * Deployment automation types and interfaces
 */

export type DeploymentStrategy = 'blue-green' | 'canary' | 'rolling' | 'recreate';

export type DeploymentStatus = 
  | 'pending' 
  | 'running' 
  | 'success' 
  | 'failed' 
  | 'cancelled' 
  | 'rolled_back'
  | 'paused';

export type DeploymentPhase = 
  | 'validation' 
  | 'pre-deployment' 
  | 'deployment' 
  | 'verification' 
  | 'post-deployment' 
  | 'cleanup';

export interface DeploymentPipeline {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  projectId: string;
  environmentId: string;
  applicationId: string;
  strategy: DeploymentStrategy;
  configuration: DeploymentConfiguration;
  stages: DeploymentStage[];
  triggers: DeploymentTrigger[];
  approvals: ApprovalConfiguration[];
  notifications: NotificationConfiguration[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface DeploymentConfiguration {
  timeout: number; // in minutes
  retryAttempts: number;
  rollbackOnFailure: boolean;
  requireApproval: boolean;
  parallelExecution: boolean;
  environmentVariables: Record<string, string>;
  secrets: string[];
  healthChecks: HealthCheckConfiguration[];
  resources: ResourceRequirement[];
}

export interface DeploymentStage {
  id: string;
  name: string;
  description?: string;
  phase: DeploymentPhase;
  order: number;
  dependsOn: string[];
  tasks: DeploymentTask[];
  conditions: StageCondition[];
  timeout: number;
  retryPolicy: RetryPolicy;
  rollbackPolicy: RollbackPolicy;
}

export interface DeploymentTask {
  id: string;
  name: string;
  type: TaskType;
  configuration: Record<string, any>;
  timeout: number;
  retryAttempts: number;
  continueOnError: boolean;
  runConditions: TaskCondition[];
}

export type TaskType = 
  | 'script' 
  | 'docker-build' 
  | 'docker-push' 
  | 'kubernetes-deploy' 
  | 'terraform-apply' 
  | 'health-check' 
  | 'notification' 
  | 'approval' 
  | 'custom';

export interface DeploymentExecution {
  id: string;
  pipelineId: string;
  version: string;
  status: DeploymentStatus;
  strategy: DeploymentStrategy;
  triggeredBy: string;
  triggeredAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  stages: StageExecution[];
  logs: DeploymentLog[];
  artifacts: DeploymentArtifact[];
  metrics: DeploymentMetrics;
  rollbackInfo?: RollbackInfo;
  approvals: ApprovalExecution[];
}

export interface StageExecution {
  id: string;
  stageId: string;
  name: string;
  status: DeploymentStatus;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  tasks: TaskExecution[];
  logs: DeploymentLog[];
  error?: string;
}

export interface TaskExecution {
  id: string;
  taskId: string;
  name: string;
  type: TaskType;
  status: DeploymentStatus;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  logs: DeploymentLog[];
  output?: Record<string, any>;
  error?: string;
  retryCount: number;
}

export interface DeploymentLog {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  source: string;
  metadata?: Record<string, any>;
}

export interface DeploymentArtifact {
  id: string;
  name: string;
  type: 'image' | 'package' | 'config' | 'report';
  url: string;
  size: number;
  checksum: string;
  createdAt: Date;
}

export interface DeploymentMetrics {
  totalDuration: number;
  stageMetrics: Record<string, number>;
  resourceUsage: ResourceUsage;
  successRate: number;
  errorCount: number;
  warningCount: number;
}

export interface ResourceUsage {
  cpu: number;
  memory: number;
  storage: number;
  network: number;
}

export interface DeploymentTrigger {
  id: string;
  type: 'manual' | 'webhook' | 'schedule' | 'git-push' | 'image-push';
  configuration: Record<string, any>;
  isActive: boolean;
}

export interface ApprovalConfiguration {
  id: string;
  name: string;
  stage: string;
  approvers: string[];
  requiredApprovals: number;
  timeout: number;
  autoApprove: boolean;
  conditions: ApprovalCondition[];
}

export interface ApprovalExecution {
  id: string;
  configurationId: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  requestedAt: Date;
  respondedAt?: Date;
  approver?: string;
  comment?: string;
}

export interface NotificationConfiguration {
  id: string;
  type: 'email' | 'slack' | 'webhook' | 'sms';
  recipients: string[];
  events: NotificationEvent[];
  configuration: Record<string, any>;
}

export type NotificationEvent = 
  | 'deployment-started' 
  | 'deployment-completed' 
  | 'deployment-failed' 
  | 'approval-required' 
  | 'rollback-initiated';

export interface HealthCheckConfiguration {
  id: string;
  name: string;
  type: 'http' | 'tcp' | 'command' | 'kubernetes';
  configuration: Record<string, any>;
  timeout: number;
  interval: number;
  retries: number;
  successThreshold: number;
  failureThreshold: number;
}

export interface ResourceRequirement {
  type: 'cpu' | 'memory' | 'storage' | 'network';
  amount: number;
  unit: string;
}

export interface StageCondition {
  type: 'always' | 'on-success' | 'on-failure' | 'manual';
  expression?: string;
}

export interface TaskCondition {
  type: 'always' | 'on-success' | 'on-failure' | 'expression';
  expression?: string;
}

export interface ApprovalCondition {
  type: 'environment' | 'time' | 'user' | 'expression';
  expression?: string;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffStrategy: 'fixed' | 'exponential' | 'linear';
  initialDelay: number;
  maxDelay: number;
  multiplier: number;
}

export interface RollbackPolicy {
  enabled: boolean;
  automatic: boolean;
  conditions: RollbackCondition[];
  strategy: 'previous-version' | 'snapshot' | 'custom';
}

export interface RollbackCondition {
  type: 'failure-rate' | 'error-count' | 'timeout' | 'manual';
  threshold?: number;
  timeWindow?: number;
}

export interface RollbackInfo {
  id: string;
  reason: string;
  triggeredBy: string;
  triggeredAt: Date;
  strategy: string;
  previousVersion: string;
  status: DeploymentStatus;
  completedAt?: Date;
}

export interface DeploymentFilter {
  organizationId?: string;
  projectId?: string;
  environmentId?: string;
  applicationId?: string;
  pipelineId?: string;
  status?: DeploymentStatus;
  strategy?: DeploymentStrategy;
  triggeredBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

export interface DeploymentRequest {
  pipelineId: string;
  version: string;
  triggeredBy: string;
  parameters?: Record<string, any>;
  approvalOverride?: boolean;
  reason?: string;
}

export interface DeploymentResult {
  success: boolean;
  executionId?: string;
  message?: string;
  error?: string;
  validationErrors?: string[];
  estimatedDuration?: number;
  timestamp: Date;
}

export interface PipelineStatistics {
  totalPipelines: number;
  activePipelines: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageDuration: number;
  successRate: number;
  executionsByStrategy: Record<DeploymentStrategy, number>;
  executionsByStatus: Record<DeploymentStatus, number>;
  lastUpdated: Date;
}