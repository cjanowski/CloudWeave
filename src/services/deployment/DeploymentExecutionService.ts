import { IDeploymentExecutionService } from './interfaces';
import {
  DeploymentExecution,
  DeploymentRequest,
  DeploymentResult,
  DeploymentFilter,
  DeploymentStatus,
  StageExecution,
  TaskExecution,
  DeploymentLog
} from './types';
import { IDeploymentPipelineService } from './interfaces';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service for executing deployment pipelines
 * Handles deployment orchestration, monitoring, and control
 */
export class DeploymentExecutionService implements IDeploymentExecutionService {
  private executions: Map<string, DeploymentExecution> = new Map();
  private logStreams: Map<string, ((log: DeploymentLog) => void)[]> = new Map();

  constructor(
    private pipelineService: IDeploymentPipelineService,
    private orchestrator?: any,
    private approvalService?: any,
    private notificationService?: any
  ) {}

  /**
   * Execute a deployment pipeline
   */
  async executeDeployment(request: DeploymentRequest): Promise<DeploymentResult> {
    const executionId = uuidv4();
    
    try {
      logger.info(`Starting deployment execution ${executionId}`, {
        executionId,
        pipelineId: request.pipelineId,
        version: request.version,
        triggeredBy: request.triggeredBy,
      });

      // Get pipeline configuration
      const pipeline = await this.pipelineService.getPipeline(request.pipelineId);
      if (!pipeline) {
        return {
          success: false,
          error: `Pipeline ${request.pipelineId} not found`,
          timestamp: new Date(),
        };
      }

      if (!pipeline.isActive) {
        return {
          success: false,
          error: `Pipeline ${request.pipelineId} is not active`,
          timestamp: new Date(),
        };
      }

      // Validate deployment request
      const validationErrors = await this.validateDeploymentRequest(request, pipeline);
      if (validationErrors.length > 0) {
        return {
          success: false,
          error: 'Deployment validation failed',
          validationErrors,
          timestamp: new Date(),
        };
      }

      // Create deployment execution
      const execution = await this.createExecution(executionId, request, pipeline);
      this.executions.set(executionId, execution);

      // Send notification
      if (this.notificationService) {
        await this.notificationService.sendNotification(
          executionId,
          'deployment-started',
          { pipeline: pipeline.name, version: request.version }
        );
      }

      // Start orchestration (async)
      this.orchestrateDeployment(execution).catch(error => {
        logger.error(`Deployment orchestration failed for ${executionId}:`, error);
        this.handleDeploymentFailure(execution, error);
      });

      return {
        success: true,
        executionId,
        message: 'Deployment started successfully',
        estimatedDuration: this.estimateDeploymentDuration(pipeline),
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error(`Failed to start deployment ${executionId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get deployment execution by ID
   */
  async getExecution(executionId: string): Promise<DeploymentExecution | null> {
    try {
      const execution = this.executions.get(executionId);
      if (execution) {
        logger.debug(`Retrieved execution ${executionId}`);
      } else {
        logger.warn(`Execution ${executionId} not found`);
      }
      return execution || null;
    } catch (error) {
      logger.error(`Failed to get execution ${executionId}:`, error);
      throw error;
    }
  }

  /**
   * Get deployment executions with filtering
   */
  async getExecutions(filter?: DeploymentFilter): Promise<DeploymentExecution[]> {
    try {
      let executions = Array.from(this.executions.values());

      if (filter) {
        executions = this.applyExecutionFilters(executions, filter);
      }

      // Apply pagination
      if (filter?.offset) {
        executions = executions.slice(filter.offset);
      }
      if (filter?.limit) {
        executions = executions.slice(0, filter.limit);
      }

      logger.info(`Retrieved ${executions.length} executions`);
      return executions;
    } catch (error) {
      logger.error('Failed to get executions:', error);
      throw error;
    }
  }

  /**
   * Cancel a running deployment
   */
  async cancelDeployment(executionId: string, reason?: string): Promise<DeploymentResult> {
    try {
      const execution = this.executions.get(executionId);
      if (!execution) {
        return {
          success: false,
          error: `Execution ${executionId} not found`,
          timestamp: new Date(),
        };
      }

      if (!['pending', 'running', 'paused'].includes(execution.status)) {
        return {
          success: false,
          error: `Cannot cancel deployment in status: ${execution.status}`,
          timestamp: new Date(),
        };
      }

      // Update execution status
      execution.status = 'cancelled';
      execution.completedAt = new Date();
      execution.duration = execution.completedAt.getTime() - (execution.startedAt?.getTime() || execution.triggeredAt.getTime());

      // Add cancellation log
      this.addLog(execution, 'info', `Deployment cancelled: ${reason || 'No reason provided'}`);

      // Send notification
      if (this.notificationService) {
        await this.notificationService.sendNotification(
          executionId,
          'deployment-cancelled',
          { reason }
        );
      }

      logger.info(`Cancelled deployment ${executionId}`, { reason });

      return {
        success: true,
        executionId,
        message: 'Deployment cancelled successfully',
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error(`Failed to cancel deployment ${executionId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Pause a running deployment
   */
  async pauseDeployment(executionId: string): Promise<DeploymentResult> {
    try {
      const execution = this.executions.get(executionId);
      if (!execution) {
        return {
          success: false,
          error: `Execution ${executionId} not found`,
          timestamp: new Date(),
        };
      }

      if (execution.status !== 'running') {
        return {
          success: false,
          error: `Cannot pause deployment in status: ${execution.status}`,
          timestamp: new Date(),
        };
      }

      execution.status = 'paused';
      this.addLog(execution, 'info', 'Deployment paused');

      logger.info(`Paused deployment ${executionId}`);

      return {
        success: true,
        executionId,
        message: 'Deployment paused successfully',
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error(`Failed to pause deployment ${executionId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Resume a paused deployment
   */
  async resumeDeployment(executionId: string): Promise<DeploymentResult> {
    try {
      const execution = this.executions.get(executionId);
      if (!execution) {
        return {
          success: false,
          error: `Execution ${executionId} not found`,
          timestamp: new Date(),
        };
      }

      if (execution.status !== 'paused') {
        return {
          success: false,
          error: `Cannot resume deployment in status: ${execution.status}`,
          timestamp: new Date(),
        };
      }

      execution.status = 'running';
      this.addLog(execution, 'info', 'Deployment resumed');

      // Continue orchestration
      this.orchestrateDeployment(execution).catch(error => {
        logger.error(`Deployment orchestration failed after resume for ${executionId}:`, error);
        this.handleDeploymentFailure(execution, error);
      });

      logger.info(`Resumed deployment ${executionId}`);

      return {
        success: true,
        executionId,
        message: 'Deployment resumed successfully',
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error(`Failed to resume deployment ${executionId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get real-time deployment status
   */
  async getDeploymentStatus(executionId: string): Promise<DeploymentStatus> {
    try {
      const execution = this.executions.get(executionId);
      if (!execution) {
        throw new Error(`Execution ${executionId} not found`);
      }

      return execution.status;
    } catch (error) {
      logger.error(`Failed to get deployment status for ${executionId}:`, error);
      throw error;
    }
  }

  /**
   * Get deployment logs
   */
  async getDeploymentLogs(executionId: string, stageId?: string, taskId?: string): Promise<DeploymentLog[]> {
    try {
      const execution = this.executions.get(executionId);
      if (!execution) {
        throw new Error(`Execution ${executionId} not found`);
      }

      let logs = execution.logs;

      if (stageId) {
        const stage = execution.stages.find(s => s.id === stageId);
        if (stage) {
          logs = [...logs, ...stage.logs];
          
          if (taskId) {
            const task = stage.tasks.find(t => t.id === taskId);
            if (task) {
              logs = [...logs, ...task.logs];
            }
          }
        }
      }

      // Sort logs by timestamp
      logs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      return logs;
    } catch (error) {
      logger.error(`Failed to get deployment logs for ${executionId}:`, error);
      throw error;
    }
  }

  /**
   * Stream deployment logs in real-time
   */
  async streamDeploymentLogs(executionId: string, callback: (log: DeploymentLog) => void): Promise<void> {
    try {
      if (!this.logStreams.has(executionId)) {
        this.logStreams.set(executionId, []);
      }

      this.logStreams.get(executionId)!.push(callback);

      logger.info(`Started log streaming for deployment ${executionId}`);
    } catch (error) {
      logger.error(`Failed to start log streaming for ${executionId}:`, error);
      throw error;
    }
  }

  // Private helper methods
  private async validateDeploymentRequest(request: DeploymentRequest, pipeline: any): Promise<string[]> {
    const errors: string[] = [];

    if (!request.version) {
      errors.push('Version is required');
    }

    if (!request.triggeredBy) {
      errors.push('TriggeredBy is required');
    }

    // Check if approval is required and not overridden
    if (pipeline.configuration?.requireApproval && !request.approvalOverride) {
      // In a real implementation, we would check if there are pending approvals
      // For now, we'll just validate that the user has permission to override
    }

    return errors;
  }

  private async createExecution(executionId: string, request: DeploymentRequest, pipeline: any): Promise<DeploymentExecution> {
    const now = new Date();

    const execution: DeploymentExecution = {
      id: executionId,
      pipelineId: request.pipelineId,
      version: request.version,
      status: 'pending',
      strategy: pipeline.strategy,
      triggeredBy: request.triggeredBy,
      triggeredAt: now,
      stages: pipeline.stages.map((stage: any) => this.createStageExecution(stage)),
      logs: [],
      artifacts: [],
      metrics: {
        totalDuration: 0,
        stageMetrics: {},
        resourceUsage: {
          cpu: 0,
          memory: 0,
          storage: 0,
          network: 0,
        },
        successRate: 0,
        errorCount: 0,
        warningCount: 0,
      },
      approvals: [],
    };

    this.addLog(execution, 'info', `Deployment ${executionId} created for pipeline ${pipeline.name}`);

    return execution;
  }

  private createStageExecution(stage: any): StageExecution {
    return {
      id: uuidv4(),
      stageId: stage.id,
      name: stage.name,
      status: 'pending',
      tasks: stage.tasks.map((task: any) => this.createTaskExecution(task)),
      logs: [],
    };
  }

  private createTaskExecution(task: any): TaskExecution {
    return {
      id: uuidv4(),
      taskId: task.id,
      name: task.name,
      type: task.type,
      status: 'pending',
      logs: [],
      retryCount: 0,
    };
  }

  private async orchestrateDeployment(execution: DeploymentExecution): Promise<void> {
    try {
      execution.status = 'running';
      execution.startedAt = new Date();

      this.addLog(execution, 'info', 'Starting deployment orchestration');

      // Execute stages in order
      for (const stage of execution.stages) {
        if (execution.status === 'cancelled' || execution.status === 'paused') {
          break;
        }

        await this.executeStage(execution, stage);

        if (stage.status === 'failed') {
          execution.status = 'failed';
          break;
        }
      }

      // Complete deployment if all stages succeeded
      if (execution.status === 'running') {
        execution.status = 'success';
        execution.completedAt = new Date();
        execution.duration = execution.completedAt.getTime() - (execution.startedAt?.getTime() || execution.triggeredAt.getTime());

        this.addLog(execution, 'info', 'Deployment completed successfully');

        // Send success notification
        if (this.notificationService) {
          await this.notificationService.sendNotification(
            execution.id,
            'deployment-completed',
            { status: 'success', duration: execution.duration }
          );
        }
      }
    } catch (error) {
      logger.error(`Deployment orchestration failed for ${execution.id}:`, error);
      await this.handleDeploymentFailure(execution, error);
    }
  }

  private async executeStage(execution: DeploymentExecution, stage: StageExecution): Promise<void> {
    try {
      stage.status = 'running';
      stage.startedAt = new Date();

      this.addLog(execution, 'info', `Starting stage: ${stage.name}`, 'stage', { stageId: stage.id });

      // Execute tasks in parallel or sequence based on configuration
      for (const task of stage.tasks) {
        if (execution.status === 'cancelled' || execution.status === 'paused') {
          break;
        }

        await this.executeTask(execution, stage, task);

        if (task.status === 'failed') {
          stage.status = 'failed';
          stage.error = `Task ${task.name} failed`;
          break;
        }
      }

      // Complete stage if all tasks succeeded
      if (stage.status === 'running') {
        stage.status = 'success';
        stage.completedAt = new Date();
        stage.duration = stage.completedAt.getTime() - (stage.startedAt?.getTime() || 0);

        this.addLog(execution, 'info', `Stage completed: ${stage.name}`, 'stage', { 
          stageId: stage.id, 
          duration: stage.duration 
        });
      }
    } catch (error) {
      stage.status = 'failed';
      stage.error = error instanceof Error ? error.message : 'Unknown error';
      this.addLog(execution, 'error', `Stage failed: ${stage.name} - ${stage.error}`, 'stage', { stageId: stage.id });
      throw error;
    }
  }

  private async executeTask(execution: DeploymentExecution, stage: StageExecution, task: TaskExecution): Promise<void> {
    try {
      task.status = 'running';
      task.startedAt = new Date();

      this.addLog(execution, 'info', `Starting task: ${task.name}`, 'task', { 
        stageId: stage.id, 
        taskId: task.id 
      });

      // Simulate task execution (in real implementation, this would call actual task executors)
      await this.simulateTaskExecution(task);

      task.status = 'success';
      task.completedAt = new Date();
      task.duration = task.completedAt.getTime() - (task.startedAt?.getTime() || 0);

      this.addLog(execution, 'info', `Task completed: ${task.name}`, 'task', { 
        stageId: stage.id, 
        taskId: task.id, 
        duration: task.duration 
      });
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      this.addLog(execution, 'error', `Task failed: ${task.name} - ${task.error}`, 'task', { 
        stageId: stage.id, 
        taskId: task.id 
      });
      throw error;
    }
  }

  private async simulateTaskExecution(task: TaskExecution): Promise<void> {
    // Simulate different task types with different execution times
    const executionTime = this.getTaskExecutionTime(task.type);
    
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate occasional failures (5% failure rate)
        if (Math.random() < 0.05) {
          reject(new Error(`Simulated failure for task ${task.name}`));
        } else {
          resolve();
        }
      }, executionTime);
    });
  }

  private getTaskExecutionTime(taskType: string): number {
    const executionTimes: Record<string, number> = {
      'script': 1000,
      'docker-build': 5000,
      'docker-push': 3000,
      'kubernetes-deploy': 4000,
      'terraform-apply': 6000,
      'health-check': 2000,
      'notification': 500,
      'approval': 0, // Approvals don't have execution time
      'custom': 2000,
    };

    return executionTimes[taskType] || 2000;
  }

  private async handleDeploymentFailure(execution: DeploymentExecution, error: Error): Promise<void> {
    execution.status = 'failed';
    execution.completedAt = new Date();
    execution.duration = execution.completedAt.getTime() - (execution.startedAt?.getTime() || execution.triggeredAt.getTime());

    this.addLog(execution, 'error', `Deployment failed: ${error.message}`);

    // Send failure notification
    if (this.notificationService) {
      await this.notificationService.sendNotification(
        execution.id,
        'deployment-failed',
        { error: error.message, duration: execution.duration }
      );
    }
  }

  private addLog(execution: DeploymentExecution, level: 'debug' | 'info' | 'warn' | 'error', message: string, source: string = 'orchestrator', metadata?: Record<string, any>): void {
    const log: DeploymentLog = {
      id: uuidv4(),
      timestamp: new Date(),
      level,
      message,
      source,
      metadata,
    };

    execution.logs.push(log);

    // Stream log to subscribers
    const callbacks = this.logStreams.get(execution.id);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(log);
        } catch (error) {
          logger.error('Error in log stream callback:', error);
        }
      });
    }
  }

  private applyExecutionFilters(executions: DeploymentExecution[], filter: DeploymentFilter): DeploymentExecution[] {
    return executions.filter(execution => {
      if (filter.pipelineId && execution.pipelineId !== filter.pipelineId) return false;
      if (filter.status && execution.status !== filter.status) return false;
      if (filter.strategy && execution.strategy !== filter.strategy) return false;
      if (filter.triggeredBy && execution.triggeredBy !== filter.triggeredBy) return false;
      if (filter.dateFrom && execution.triggeredAt < filter.dateFrom) return false;
      if (filter.dateTo && execution.triggeredAt > filter.dateTo) return false;

      return true;
    });
  }

  private estimateDeploymentDuration(pipeline: any): number {
    // Simple estimation based on stage timeouts
    return pipeline.stages.reduce((total: number, stage: any) => {
      return total + (stage.timeout || 30) * 60 * 1000; // Convert minutes to milliseconds
    }, 0);
  }
}