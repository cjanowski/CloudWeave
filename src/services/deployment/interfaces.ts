import {
  DeploymentPipeline,
  DeploymentExecution,
  DeploymentRequest,
  DeploymentResult,
  DeploymentFilter,
  PipelineStatistics,
  DeploymentStatus,
  ApprovalExecution,
  RollbackInfo
} from './types';

/**
 * Interface for deployment pipeline management
 */
export interface IDeploymentPipelineService {
  /**
   * Create a new deployment pipeline
   */
  createPipeline(pipeline: Omit<DeploymentPipeline, 'id' | 'createdAt' | 'updatedAt'>): Promise<DeploymentPipeline>;

  /**
   * Get deployment pipeline by ID
   */
  getPipeline(pipelineId: string): Promise<DeploymentPipeline | null>;

  /**
   * Get all deployment pipelines with optional filtering
   */
  getPipelines(filter?: DeploymentFilter): Promise<DeploymentPipeline[]>;

  /**
   * Update deployment pipeline
   */
  updatePipeline(pipelineId: string, updates: Partial<DeploymentPipeline>): Promise<DeploymentPipeline>;

  /**
   * Delete deployment pipeline
   */
  deletePipeline(pipelineId: string): Promise<void>;

  /**
   * Activate or deactivate pipeline
   */
  setPipelineActive(pipelineId: string, isActive: boolean): Promise<void>;

  /**
   * Validate pipeline configuration
   */
  validatePipeline(pipeline: DeploymentPipeline): Promise<string[]>;
}

/**
 * Interface for deployment execution engine
 */
export interface IDeploymentExecutionService {
  /**
   * Execute a deployment pipeline
   */
  executeDeployment(request: DeploymentRequest): Promise<DeploymentResult>;

  /**
   * Get deployment execution by ID
   */
  getExecution(executionId: string): Promise<DeploymentExecution | null>;

  /**
   * Get deployment executions with filtering
   */
  getExecutions(filter?: DeploymentFilter): Promise<DeploymentExecution[]>;

  /**
   * Cancel a running deployment
   */
  cancelDeployment(executionId: string, reason?: string): Promise<DeploymentResult>;

  /**
   * Pause a running deployment
   */
  pauseDeployment(executionId: string): Promise<DeploymentResult>;

  /**
   * Resume a paused deployment
   */
  resumeDeployment(executionId: string): Promise<DeploymentResult>;

  /**
   * Get real-time deployment status
   */
  getDeploymentStatus(executionId: string): Promise<DeploymentStatus>;

  /**
   * Get deployment logs
   */
  getDeploymentLogs(executionId: string, stageId?: string, taskId?: string): Promise<any[]>;

  /**
   * Stream deployment logs in real-time
   */
  streamDeploymentLogs(executionId: string, callback: (log: any) => void): Promise<void>;
}

/**
 * Interface for deployment strategy implementations
 */
export interface IDeploymentStrategy {
  /**
   * Get strategy name
   */
  getName(): string;

  /**
   * Validate strategy configuration
   */
  validate(configuration: Record<string, any>): Promise<string[]>;

  /**
   * Execute deployment using this strategy
   */
  execute(execution: DeploymentExecution): Promise<DeploymentResult>;

  /**
   * Check if rollback is supported
   */
  supportsRollback(): boolean;

  /**
   * Perform rollback using this strategy
   */
  rollback(execution: DeploymentExecution, rollbackInfo: RollbackInfo): Promise<DeploymentResult>;
}

/**
 * Interface for deployment orchestration
 */
export interface IDeploymentOrchestrator {
  /**
   * Orchestrate deployment execution across stages
   */
  orchestrateDeployment(execution: DeploymentExecution): Promise<DeploymentResult>;

  /**
   * Execute a specific stage
   */
  executeStage(execution: DeploymentExecution, stageId: string): Promise<DeploymentResult>;

  /**
   * Execute a specific task
   */
  executeTask(execution: DeploymentExecution, stageId: string, taskId: string): Promise<DeploymentResult>;

  /**
   * Handle stage failure
   */
  handleStageFailure(execution: DeploymentExecution, stageId: string, error: Error): Promise<void>;

  /**
   * Check stage conditions
   */
  checkStageConditions(execution: DeploymentExecution, stageId: string): Promise<boolean>;
}

/**
 * Interface for approval management
 */
export interface IApprovalService {
  /**
   * Request approval for deployment
   */
  requestApproval(executionId: string, stageId: string): Promise<ApprovalExecution>;

  /**
   * Approve deployment
   */
  approveDeployment(approvalId: string, approverId: string, comment?: string): Promise<void>;

  /**
   * Reject deployment
   */
  rejectDeployment(approvalId: string, approverId: string, comment?: string): Promise<void>;

  /**
   * Get pending approvals for user
   */
  getPendingApprovals(userId: string): Promise<ApprovalExecution[]>;

  /**
   * Check if user can approve
   */
  canApprove(approvalId: string, userId: string): Promise<boolean>;

  /**
   * Auto-approve based on conditions
   */
  checkAutoApproval(approvalId: string): Promise<boolean>;
}

/**
 * Interface for rollback management
 */
export interface IRollbackService {
  /**
   * Initiate rollback for deployment
   */
  initiateRollback(executionId: string, reason: string, triggeredBy: string): Promise<DeploymentResult>;

  /**
   * Get rollback history for deployment
   */
  getRollbackHistory(executionId: string): Promise<RollbackInfo[]>;

  /**
   * Check if rollback is possible
   */
  canRollback(executionId: string): Promise<boolean>;

  /**
   * Get available rollback targets
   */
  getRollbackTargets(executionId: string): Promise<string[]>;

  /**
   * Validate rollback conditions
   */
  validateRollbackConditions(executionId: string): Promise<string[]>;
}

/**
 * Interface for deployment notifications
 */
export interface INotificationService {
  /**
   * Send deployment notification
   */
  sendNotification(executionId: string, event: string, data?: Record<string, any>): Promise<void>;

  /**
   * Configure notification channels
   */
  configureNotifications(pipelineId: string, configurations: any[]): Promise<void>;

  /**
   * Test notification configuration
   */
  testNotification(configuration: any): Promise<boolean>;
}

/**
 * Interface for deployment health checks
 */
export interface IHealthCheckService {
  /**
   * Execute health check
   */
  executeHealthCheck(checkId: string, configuration: any): Promise<boolean>;

  /**
   * Execute multiple health checks
   */
  executeHealthChecks(checks: any[]): Promise<Record<string, boolean>>;

  /**
   * Monitor deployment health
   */
  monitorDeploymentHealth(executionId: string): Promise<void>;

  /**
   * Get health check results
   */
  getHealthCheckResults(executionId: string): Promise<any[]>;
}

/**
 * Interface for deployment statistics and reporting
 */
export interface IDeploymentReportingService {
  /**
   * Get pipeline statistics
   */
  getPipelineStatistics(filter?: DeploymentFilter): Promise<PipelineStatistics>;

  /**
   * Get deployment trends
   */
  getDeploymentTrends(timeRange: string, granularity: string): Promise<any[]>;

  /**
   * Get failure analysis
   */
  getFailureAnalysis(filter?: DeploymentFilter): Promise<any>;

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(pipelineId?: string): Promise<any>;

  /**
   * Generate deployment report
   */
  generateReport(filter: DeploymentFilter, format: 'json' | 'csv' | 'pdf'): Promise<any>;
}