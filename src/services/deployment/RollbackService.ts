import { IRollbackService } from './interfaces';
import {
  DeploymentExecution,
  DeploymentResult,
  RollbackInfo,
  DeploymentStatus,
  RollbackCondition
} from './types';
import { IDeploymentExecutionService, IDeploymentPipelineService } from './interfaces';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service for managing deployment rollbacks and recovery
 * Handles automatic and manual rollback scenarios with state preservation
 */
export class RollbackService implements IRollbackService {
  private rollbackHistory: Map<string, RollbackInfo[]> = new Map();
  private rollbackSnapshots: Map<string, DeploymentSnapshot> = new Map();

  constructor(
    private executionService: IDeploymentExecutionService,
    private pipelineService: IDeploymentPipelineService,
    private infrastructureService?: any
  ) {}

  /**
   * Initiate rollback for deployment
   */
  async initiateRollback(executionId: string, reason: string, triggeredBy: string): Promise<DeploymentResult> {
    const rollbackId = uuidv4();
    
    try {
      logger.info(`Initiating rollback for deployment ${executionId}`, {
        rollbackId,
        reason,
        triggeredBy,
      });

      // Get the deployment execution
      const execution = await this.executionService.getExecution(executionId);
      if (!execution) {
        return {
          success: false,
          error: `Deployment execution ${executionId} not found`,
          timestamp: new Date(),
        };
      }

      // Validate rollback is possible
      const canRollback = await this.canRollback(executionId);
      if (!canRollback) {
        return {
          success: false,
          error: `Rollback not possible for deployment ${executionId}`,
          timestamp: new Date(),
        };
      }

      // Get rollback targets
      const targets = await this.getRollbackTargets(executionId);
      if (targets.length === 0) {
        return {
          success: false,
          error: `No rollback targets available for deployment ${executionId}`,
          timestamp: new Date(),
        };
      }

      // Create rollback info
      const rollbackInfo: RollbackInfo = {
        id: rollbackId,
        reason,
        triggeredBy,
        triggeredAt: new Date(),
        strategy: this.determineRollbackStrategy(execution),
        previousVersion: targets[0], // Use the most recent target
        status: 'running',
      };

      // Store rollback info
      if (!this.rollbackHistory.has(executionId)) {
        this.rollbackHistory.set(executionId, []);
      }
      this.rollbackHistory.get(executionId)!.push(rollbackInfo);

      // Update execution with rollback info
      execution.rollbackInfo = rollbackInfo;
      execution.status = 'rolled_back';

      // Execute the rollback
      const rollbackResult = await this.executeRollback(execution, rollbackInfo);

      if (rollbackResult.success) {
        rollbackInfo.status = 'success';
        rollbackInfo.completedAt = new Date();
        
        logger.info(`Rollback completed successfully for deployment ${executionId}`, {
          rollbackId,
          duration: rollbackInfo.completedAt.getTime() - rollbackInfo.triggeredAt.getTime(),
        });
      } else {
        rollbackInfo.status = 'failed';
        rollbackInfo.completedAt = new Date();
        
        logger.error(`Rollback failed for deployment ${executionId}`, {
          rollbackId,
          error: rollbackResult.error,
        });
      }

      return rollbackResult;
    } catch (error) {
      logger.error(`Failed to initiate rollback for deployment ${executionId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get rollback history for deployment
   */
  async getRollbackHistory(executionId: string): Promise<RollbackInfo[]> {
    try {
      const history = this.rollbackHistory.get(executionId) || [];
      logger.info(`Retrieved rollback history for deployment ${executionId}`, {
        rollbackCount: history.length,
      });
      return history;
    } catch (error) {
      logger.error(`Failed to get rollback history for deployment ${executionId}:`, error);
      throw error;
    }
  }

  /**
   * Check if rollback is possible
   */
  async canRollback(executionId: string): Promise<boolean> {
    try {
      const execution = await this.executionService.getExecution(executionId);
      if (!execution) {
        return false;
      }

      // Check execution status
      const rollbackableStatuses: DeploymentStatus[] = ['success', 'failed', 'running'];
      if (!rollbackableStatuses.includes(execution.status)) {
        logger.info(`Cannot rollback deployment ${executionId} - invalid status: ${execution.status}`);
        return false;
      }

      // Check if pipeline supports rollback
      const pipeline = await this.pipelineService.getPipeline(execution.pipelineId);
      if (!pipeline) {
        return false;
      }

      // Check if any stage has rollback enabled
      const hasRollbackEnabled = pipeline.stages.some(stage => stage.rollbackPolicy?.enabled);
      if (!hasRollbackEnabled) {
        logger.info(`Cannot rollback deployment ${executionId} - no stages have rollback enabled`);
        return false;
      }

      // Check if there are available rollback targets
      const targets = await this.getRollbackTargets(executionId);
      if (targets.length === 0) {
        logger.info(`Cannot rollback deployment ${executionId} - no rollback targets available`);
        return false;
      }

      // Check rollback conditions
      const conditionErrors = await this.validateRollbackConditions(executionId);
      if (conditionErrors.length > 0) {
        logger.info(`Cannot rollback deployment ${executionId} - conditions not met:`, conditionErrors);
        return false;
      }

      return true;
    } catch (error) {
      logger.error(`Failed to check rollback possibility for deployment ${executionId}:`, error);
      return false;
    }
  }

  /**
   * Get available rollback targets
   */
  async getRollbackTargets(executionId: string): Promise<string[]> {
    try {
      const execution = await this.executionService.getExecution(executionId);
      if (!execution) {
        return [];
      }

      // Get previous successful deployments for the same pipeline
      const previousExecutions = await this.executionService.getExecutions({
        pipelineId: execution.pipelineId,
        status: 'success',
        dateTo: execution.triggeredAt,
      });

      // Sort by date (most recent first) and get versions
      const targets = previousExecutions
        .filter(exec => exec.id !== executionId)
        .sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime())
        .map(exec => exec.version)
        .slice(0, 5); // Limit to 5 most recent targets

      logger.info(`Found ${targets.length} rollback targets for deployment ${executionId}`, {
        targets,
      });

      return targets;
    } catch (error) {
      logger.error(`Failed to get rollback targets for deployment ${executionId}:`, error);
      return [];
    }
  }

  /**
   * Validate rollback conditions
   */
  async validateRollbackConditions(executionId: string): Promise<string[]> {
    const errors: string[] = [];

    try {
      const execution = await this.executionService.getExecution(executionId);
      if (!execution) {
        errors.push('Deployment execution not found');
        return errors;
      }

      const pipeline = await this.pipelineService.getPipeline(execution.pipelineId);
      if (!pipeline) {
        errors.push('Pipeline not found');
        return errors;
      }

      // Check each stage's rollback conditions
      for (const stage of pipeline.stages) {
        if (!stage.rollbackPolicy?.enabled) {
          continue;
        }

        for (const condition of stage.rollbackPolicy.conditions) {
          const conditionMet = await this.evaluateRollbackCondition(execution, condition);
          if (!conditionMet) {
            errors.push(`Stage ${stage.name}: rollback condition not met - ${condition.type}`);
          }
        }
      }

      // Check global rollback conditions
      if (execution.status === 'running') {
        // Check if deployment has been running too long
        const runningTime = Date.now() - (execution.startedAt?.getTime() || execution.triggeredAt.getTime());
        const maxRunningTime = 2 * 60 * 60 * 1000; // 2 hours
        
        if (runningTime > maxRunningTime) {
          errors.push('Deployment has been running too long');
        }
      }

      // Check if there are dependent deployments
      const dependentDeployments = await this.findDependentDeployments(executionId);
      if (dependentDeployments.length > 0) {
        errors.push(`Cannot rollback - ${dependentDeployments.length} dependent deployments found`);
      }

      logger.info(`Validated rollback conditions for deployment ${executionId}`, {
        errors: errors.length,
      });

      return errors;
    } catch (error) {
      logger.error(`Failed to validate rollback conditions for deployment ${executionId}:`, error);
      errors.push('Failed to validate rollback conditions');
      return errors;
    }
  }

  /**
   * Create deployment snapshot for rollback
   */
  async createDeploymentSnapshot(executionId: string): Promise<void> {
    try {
      const execution = await this.executionService.getExecution(executionId);
      if (!execution) {
        throw new Error(`Deployment execution ${executionId} not found`);
      }

      const snapshot: DeploymentSnapshot = {
        id: uuidv4(),
        executionId,
        version: execution.version,
        createdAt: new Date(),
        configuration: {
          pipeline: await this.pipelineService.getPipeline(execution.pipelineId),
          execution: execution,
          infrastructure: await this.captureInfrastructureState(execution),
        },
        metadata: {
          triggeredBy: execution.triggeredBy,
          strategy: execution.strategy,
          environment: this.extractEnvironmentFromExecution(execution),
        },
      };

      this.rollbackSnapshots.set(executionId, snapshot);

      logger.info(`Created deployment snapshot for ${executionId}`, {
        snapshotId: snapshot.id,
        version: snapshot.version,
      });
    } catch (error) {
      logger.error(`Failed to create deployment snapshot for ${executionId}:`, error);
      throw error;
    }
  }

  /**
   * Restore from deployment snapshot
   */
  async restoreFromSnapshot(executionId: string, snapshotId?: string): Promise<DeploymentResult> {
    try {
      const snapshot = this.rollbackSnapshots.get(executionId);
      if (!snapshot) {
        return {
          success: false,
          error: `No snapshot found for deployment ${executionId}`,
          timestamp: new Date(),
        };
      }

      logger.info(`Restoring deployment from snapshot`, {
        executionId,
        snapshotId: snapshot.id,
        version: snapshot.version,
      });

      // Restore infrastructure state
      if (this.infrastructureService && snapshot.configuration.infrastructure) {
        await this.restoreInfrastructureState(snapshot.configuration.infrastructure);
      }

      // Create new deployment execution for rollback
      const rollbackExecution = await this.createRollbackExecution(snapshot);

      return {
        success: true,
        executionId: rollbackExecution.id,
        message: `Successfully restored from snapshot ${snapshot.id}`,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error(`Failed to restore from snapshot for ${executionId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Monitor deployment for automatic rollback conditions
   */
  async monitorForAutoRollback(executionId: string): Promise<void> {
    try {
      const execution = await this.executionService.getExecution(executionId);
      if (!execution) {
        return;
      }

      const pipeline = await this.pipelineService.getPipeline(execution.pipelineId);
      if (!pipeline) {
        return;
      }

      // Check each stage for automatic rollback conditions
      for (const stage of pipeline.stages) {
        if (!stage.rollbackPolicy?.automatic) {
          continue;
        }

        const shouldRollback = await this.checkAutoRollbackConditions(execution, stage.rollbackPolicy.conditions);
        if (shouldRollback) {
          logger.warn(`Auto-rollback triggered for deployment ${executionId} at stage ${stage.name}`);
          
          await this.initiateRollback(
            executionId,
            `Automatic rollback triggered by stage ${stage.name}`,
            'system'
          );
          break;
        }
      }
    } catch (error) {
      logger.error(`Failed to monitor auto-rollback for deployment ${executionId}:`, error);
    }
  }

  // Private helper methods
  private determineRollbackStrategy(execution: DeploymentExecution): string {
    // Determine rollback strategy based on deployment strategy
    switch (execution.strategy) {
      case 'blue-green':
        return 'traffic-switch';
      case 'canary':
        return 'traffic-removal';
      case 'rolling':
        return 'previous-version';
      default:
        return 'snapshot-restore';
    }
  }

  private async executeRollback(execution: DeploymentExecution, rollbackInfo: RollbackInfo): Promise<DeploymentResult> {
    try {
      logger.info(`Executing rollback for deployment ${execution.id}`, {
        strategy: rollbackInfo.strategy,
        previousVersion: rollbackInfo.previousVersion,
      });

      // Execute rollback based on strategy
      switch (rollbackInfo.strategy) {
        case 'traffic-switch':
          return await this.executeTrafficSwitchRollback(execution, rollbackInfo);
        case 'traffic-removal':
          return await this.executeTrafficRemovalRollback(execution, rollbackInfo);
        case 'previous-version':
          return await this.executePreviousVersionRollback(execution, rollbackInfo);
        case 'snapshot-restore':
          return await this.restoreFromSnapshot(execution.id);
        default:
          throw new Error(`Unsupported rollback strategy: ${rollbackInfo.strategy}`);
      }
    } catch (error) {
      logger.error(`Failed to execute rollback for deployment ${execution.id}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Rollback execution failed',
        timestamp: new Date(),
      };
    }
  }

  private async executeTrafficSwitchRollback(execution: DeploymentExecution, rollbackInfo: RollbackInfo): Promise<DeploymentResult> {
    // Simulate blue-green traffic switch rollback
    await this.simulateRollbackStep('switch-traffic-back', 3000);
    await this.simulateRollbackStep('validate-blue-environment', 2000);
    await this.simulateRollbackStep('cleanup-green-environment', 1500);

    return {
      success: true,
      executionId: execution.id,
      message: 'Traffic switch rollback completed successfully',
      timestamp: new Date(),
    };
  }

  private async executeTrafficRemovalRollback(execution: DeploymentExecution, rollbackInfo: RollbackInfo): Promise<DeploymentResult> {
    // Simulate canary traffic removal rollback
    await this.simulateRollbackStep('remove-canary-traffic', 2000);
    await this.simulateRollbackStep('stop-canary-instances', 2500);
    await this.simulateRollbackStep('validate-stable-version', 1500);

    return {
      success: true,
      executionId: execution.id,
      message: 'Canary rollback completed successfully',
      timestamp: new Date(),
    };
  }

  private async executePreviousVersionRollback(execution: DeploymentExecution, rollbackInfo: RollbackInfo): Promise<DeploymentResult> {
    // Simulate rolling update rollback
    await this.simulateRollbackStep('rollback-to-previous-version', 4000);
    await this.simulateRollbackStep('validate-rollback', 2000);
    await this.simulateRollbackStep('cleanup-failed-version', 1000);

    return {
      success: true,
      executionId: execution.id,
      message: `Rollback to version ${rollbackInfo.previousVersion} completed successfully`,
      timestamp: new Date(),
    };
  }

  private async evaluateRollbackCondition(execution: DeploymentExecution, condition: RollbackCondition): Promise<boolean> {
    switch (condition.type) {
      case 'failure-rate':
        return await this.checkFailureRate(execution, condition.threshold!, condition.timeWindow!);
      case 'error-count':
        return await this.checkErrorCount(execution, condition.threshold!);
      case 'timeout':
        return await this.checkTimeout(execution, condition.timeWindow!);
      case 'manual':
        return true; // Manual conditions are always met for validation
      default:
        return false;
    }
  }

  private async checkFailureRate(execution: DeploymentExecution, threshold: number, timeWindow: number): Promise<boolean> {
    // Simulate failure rate check
    const mockFailureRate = Math.random() * 10; // 0-10% failure rate
    return mockFailureRate <= threshold;
  }

  private async checkErrorCount(execution: DeploymentExecution, threshold: number): Promise<boolean> {
    // Check if error count is below threshold
    return execution.metrics.errorCount <= threshold;
  }

  private async checkTimeout(execution: DeploymentExecution, timeWindow: number): Promise<boolean> {
    const runningTime = Date.now() - (execution.startedAt?.getTime() || execution.triggeredAt.getTime());
    return runningTime <= timeWindow * 1000;
  }

  private async checkAutoRollbackConditions(execution: DeploymentExecution, conditions: RollbackCondition[]): Promise<boolean> {
    for (const condition of conditions) {
      const conditionMet = await this.evaluateRollbackCondition(execution, condition);
      if (!conditionMet) {
        return true; // Should rollback if any condition is not met
      }
    }
    return false;
  }

  private async findDependentDeployments(executionId: string): Promise<string[]> {
    // In a real implementation, this would check for deployments that depend on this one
    // For now, return empty array
    return [];
  }

  private async captureInfrastructureState(execution: DeploymentExecution): Promise<any> {
    // Capture current infrastructure state for rollback
    if (this.infrastructureService) {
      try {
        return await this.infrastructureService.getResources({
          projectId: execution.pipelineId, // Simplified mapping
        });
      } catch (error) {
        logger.warn('Failed to capture infrastructure state:', error);
        return null;
      }
    }
    return null;
  }

  private async restoreInfrastructureState(infrastructureState: any): Promise<void> {
    // Restore infrastructure to previous state
    if (this.infrastructureService && infrastructureState) {
      try {
        // This would restore the infrastructure state
        logger.info('Infrastructure state restoration simulated');
      } catch (error) {
        logger.error('Failed to restore infrastructure state:', error);
        throw error;
      }
    }
  }

  private extractEnvironmentFromExecution(execution: DeploymentExecution): string {
    // Extract environment information from execution
    return 'production'; // Simplified for demo
  }

  private async createRollbackExecution(snapshot: DeploymentSnapshot): Promise<DeploymentExecution> {
    // Create a new execution for rollback
    const rollbackExecution: DeploymentExecution = {
      id: uuidv4(),
      pipelineId: snapshot.configuration.execution.pipelineId,
      version: snapshot.version,
      status: 'pending',
      strategy: snapshot.configuration.execution.strategy,
      triggeredBy: 'rollback-system',
      triggeredAt: new Date(),
      stages: [],
      logs: [],
      artifacts: [],
      metrics: {
        totalDuration: 0,
        stageMetrics: {},
        resourceUsage: { cpu: 0, memory: 0, storage: 0, network: 0 },
        successRate: 0,
        errorCount: 0,
        warningCount: 0,
      },
      approvals: [],
    };

    return rollbackExecution;
  }

  private async simulateRollbackStep(step: string, duration: number): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate occasional failures (1% failure rate)
        if (Math.random() < 0.01) {
          reject(new Error(`Simulated failure in rollback step: ${step}`));
        } else {
          resolve();
        }
      }, duration);
    });
  }
}

/**
 * Interface for deployment snapshots
 */
interface DeploymentSnapshot {
  id: string;
  executionId: string;
  version: string;
  createdAt: Date;
  configuration: {
    pipeline: any;
    execution: DeploymentExecution;
    infrastructure: any;
  };
  metadata: {
    triggeredBy: string;
    strategy: string;
    environment: string;
  };
}