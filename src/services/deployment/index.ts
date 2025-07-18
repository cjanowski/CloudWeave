/**
 * Deployment Automation Module
 * 
 * This module provides comprehensive deployment pipeline management and execution
 * capabilities including multiple deployment strategies, orchestration, and monitoring.
 */

// Types and interfaces
export * from './types';
export * from './interfaces';

// Core services
export { DeploymentPipelineService } from './DeploymentPipelineService';
export { DeploymentExecutionService } from './DeploymentExecutionService';
export { RollbackService } from './RollbackService';
export { NotificationService } from './NotificationService';

// Deployment strategies
export { BlueGreenStrategy } from './strategies/BlueGreenStrategy';
export { CanaryStrategy } from './strategies/CanaryStrategy';

// Convenience functions for creating and configuring services
import { DeploymentPipelineService } from './DeploymentPipelineService';
import { DeploymentExecutionService } from './DeploymentExecutionService';
import { RollbackService } from './RollbackService';
import { NotificationService } from './NotificationService';
import { BlueGreenStrategy } from './strategies/BlueGreenStrategy';
import { CanaryStrategy } from './strategies/CanaryStrategy';
import { IDeploymentStrategy } from './interfaces';
import { DeploymentStrategy } from './types';

/**
 * Create a fully configured deployment service with all dependencies
 */
export async function createDeploymentService(): Promise<{
  pipelineService: DeploymentPipelineService;
  executionService: DeploymentExecutionService;
  rollbackService: RollbackService;
  notificationService: NotificationService;
  strategies: Map<DeploymentStrategy, IDeploymentStrategy>;
}> {
  // Create pipeline service
  const pipelineService = new DeploymentPipelineService();

  // Create execution service
  const executionService = new DeploymentExecutionService(pipelineService);

  // Create rollback service
  const rollbackService = new RollbackService(executionService, pipelineService);

  // Create notification service
  const notificationService = new NotificationService(executionService, pipelineService);

  // Create deployment strategies
  const strategies = new Map<DeploymentStrategy, IDeploymentStrategy>();
  strategies.set('blue-green', new BlueGreenStrategy());
  strategies.set('canary', new CanaryStrategy());

  return {
    pipelineService,
    executionService,
    rollbackService,
    notificationService,
    strategies,
  };
}

/**
 * Get deployment strategy by name
 */
export function getDeploymentStrategy(strategyName: DeploymentStrategy): IDeploymentStrategy | null {
  switch (strategyName) {
    case 'blue-green':
      return new BlueGreenStrategy();
    case 'canary':
      return new CanaryStrategy();
    default:
      return null;
  }
}

/**
 * Get all available deployment strategies
 */
export function getAvailableStrategies(): DeploymentStrategy[] {
  return ['blue-green', 'canary', 'rolling', 'recreate'];
}

/**
 * Validate deployment strategy configuration
 */
export async function validateStrategyConfiguration(
  strategy: DeploymentStrategy,
  configuration: Record<string, any>
): Promise<string[]> {
  const strategyImpl = getDeploymentStrategy(strategy);
  if (!strategyImpl) {
    return [`Unsupported deployment strategy: ${strategy}`];
  }

  return await strategyImpl.validate(configuration);
}

/**
 * Default configuration for deployment services
 */
export const defaultDeploymentConfig = {
  pipeline: {
    defaultTimeout: 60, // minutes
    defaultRetryAttempts: 3,
    maxStages: 20,
    maxTasksPerStage: 50,
  },
  execution: {
    logRetentionDays: 30,
    maxConcurrentExecutions: 10,
    healthCheckInterval: 30, // seconds
  },
  strategies: {
    'blue-green': {
      defaultHealthCheckTimeout: 300, // seconds
      defaultTrafficSwitchDelay: 60, // seconds
    },
    'canary': {
      defaultCanaryPercentage: 5,
      defaultCanaryDuration: 600, // seconds
      defaultSuccessCriteria: {
        errorRate: 1, // percent
        responseTime: 1000, // milliseconds
        successRate: 99, // percent
      },
    },
  },
};