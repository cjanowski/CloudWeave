import { IDeploymentStrategy } from '../interfaces';
import { DeploymentExecution, DeploymentResult, RollbackInfo } from '../types';
import { logger } from '../../../utils/logger';

/**
 * Canary deployment strategy implementation
 * Gradually rolls out to a small subset of users before full deployment
 */
export class CanaryStrategy implements IDeploymentStrategy {
  getName(): string {
    return 'canary';
  }

  async validate(configuration: Record<string, any>): Promise<string[]> {
    const errors: string[] = [];

    // Validate canary specific configuration
    if (!configuration.canaryPercentage) {
      errors.push('Canary percentage is required');
    } else if (configuration.canaryPercentage < 1 || configuration.canaryPercentage > 50) {
      errors.push('Canary percentage must be between 1 and 50');
    }

    if (!configuration.canaryDuration) {
      errors.push('Canary duration is required');
    } else if (configuration.canaryDuration < 300) {
      errors.push('Canary duration should be at least 5 minutes (300 seconds)');
    }

    if (!configuration.successCriteria) {
      errors.push('Success criteria configuration is required');
    } else {
      const criteria = configuration.successCriteria;
      
      if (!criteria.errorRate && !criteria.responseTime && !criteria.successRate) {
        errors.push('At least one success criteria must be defined (errorRate, responseTime, or successRate)');
      }

      if (criteria.errorRate && (criteria.errorRate < 0 || criteria.errorRate > 100)) {
        errors.push('Error rate threshold must be between 0 and 100');
      }

      if (criteria.successRate && (criteria.successRate < 0 || criteria.successRate > 100)) {
        errors.push('Success rate threshold must be between 0 and 100');
      }
    }

    if (configuration.rollbackThreshold && (configuration.rollbackThreshold < 0 || configuration.rollbackThreshold > 100)) {
      errors.push('Rollback threshold must be between 0 and 100');
    }

    return errors;
  }

  async execute(execution: DeploymentExecution): Promise<DeploymentResult> {
    try {
      logger.info(`Executing canary deployment for ${execution.id}`);

      // Phase 1: Deploy canary version
      await this.deployCanaryVersion(execution);

      // Phase 2: Route canary traffic
      await this.routeCanaryTraffic(execution);

      // Phase 3: Monitor canary metrics
      const canarySuccess = await this.monitorCanaryMetrics(execution);

      if (!canarySuccess) {
        // Canary failed, rollback
        await this.rollbackCanary(execution);
        throw new Error('Canary deployment failed metrics validation');
      }

      // Phase 4: Promote canary to full deployment
      await this.promoteCanaryToFull(execution);

      // Phase 5: Final validation
      await this.validateFullDeployment(execution);

      // Phase 6: Cleanup old version
      await this.cleanupOldVersion(execution);

      logger.info(`Canary deployment completed successfully for ${execution.id}`);

      return {
        success: true,
        executionId: execution.id,
        message: 'Canary deployment completed successfully',
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error(`Canary deployment failed for ${execution.id}:`, error);
      
      // Attempt automatic rollback
      try {
        await this.rollbackCanary(execution);
      } catch (rollbackError) {
        logger.error(`Canary rollback failed for ${execution.id}:`, rollbackError);
      }

      return {
        success: false,
        executionId: execution.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  supportsRollback(): boolean {
    return true;
  }

  async rollback(execution: DeploymentExecution, rollbackInfo: RollbackInfo): Promise<DeploymentResult> {
    try {
      logger.info(`Rolling back canary deployment for ${execution.id}`, {
        reason: rollbackInfo.reason,
        strategy: rollbackInfo.strategy,
      });

      // Remove canary traffic routing
      await this.removeCanaryTraffic(execution);

      // Stop canary instances
      await this.stopCanaryInstances(execution);

      // Validate stable version is healthy
      await this.validateStableVersion(execution);

      logger.info(`Canary rollback completed for ${execution.id}`);

      return {
        success: true,
        executionId: execution.id,
        message: 'Canary rollback completed successfully',
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error(`Canary rollback failed for ${execution.id}:`, error);
      return {
        success: false,
        executionId: execution.id,
        error: error instanceof Error ? error.message : 'Rollback failed',
        timestamp: new Date(),
      };
    }
  }

  // Private implementation methods
  private async deployCanaryVersion(execution: DeploymentExecution): Promise<void> {
    logger.info(`Deploying canary version for ${execution.id}`);
    
    // Simulate canary deployment
    await this.simulateDeploymentStep('canary-deploy', 4000);
    
    this.addExecutionLog(execution, 'info', 'Canary version deployed successfully');
  }

  private async routeCanaryTraffic(execution: DeploymentExecution): Promise<void> {
    logger.info(`Routing canary traffic for ${execution.id}`);
    
    // Simulate traffic routing configuration
    await this.simulateDeploymentStep('traffic-routing', 2000);
    
    this.addExecutionLog(execution, 'info', 'Canary traffic routing configured (5% of traffic)');
  }

  private async monitorCanaryMetrics(execution: DeploymentExecution): Promise<boolean> {
    logger.info(`Monitoring canary metrics for ${execution.id}`);
    
    const monitoringDuration = 30000; // 30 seconds for demo
    const checkInterval = 5000; // Check every 5 seconds
    const checks = monitoringDuration / checkInterval;
    
    for (let i = 0; i < checks; i++) {
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      
      // Simulate metric collection
      const metrics = this.generateMockMetrics();
      
      this.addExecutionLog(execution, 'info', 
        `Canary metrics check ${i + 1}/${checks}: ` +
        `Error rate: ${metrics.errorRate}%, ` +
        `Response time: ${metrics.responseTime}ms, ` +
        `Success rate: ${metrics.successRate}%`
      );
      
      // Check if metrics exceed failure thresholds
      if (metrics.errorRate > 5 || metrics.responseTime > 2000 || metrics.successRate < 95) {
        this.addExecutionLog(execution, 'error', 
          `Canary metrics exceeded failure thresholds - initiating rollback`
        );
        return false;
      }
    }
    
    this.addExecutionLog(execution, 'info', 'Canary metrics validation passed');
    return true;
  }

  private async promoteCanaryToFull(execution: DeploymentExecution): Promise<void> {
    logger.info(`Promoting canary to full deployment for ${execution.id}`);
    
    // Simulate gradual traffic increase
    const trafficSteps = [10, 25, 50, 75, 100];
    
    for (const percentage of trafficSteps) {
      await this.simulateDeploymentStep(`promote-${percentage}`, 1500);
      this.addExecutionLog(execution, 'info', `Promoted to ${percentage}% traffic`);
      
      // Brief monitoring between steps
      await new Promise(resolve => setTimeout(resolve, 1000));
      const metrics = this.generateMockMetrics();
      
      if (metrics.errorRate > 3) {
        throw new Error(`High error rate detected during promotion: ${metrics.errorRate}%`);
      }
    }
    
    this.addExecutionLog(execution, 'info', 'Canary promoted to full deployment');
  }

  private async validateFullDeployment(execution: DeploymentExecution): Promise<void> {
    logger.info(`Validating full deployment for ${execution.id}`);
    
    // Simulate full deployment validation
    await this.simulateDeploymentStep('validate-full', 3000);
    
    this.addExecutionLog(execution, 'info', 'Full deployment validation completed');
  }

  private async cleanupOldVersion(execution: DeploymentExecution): Promise<void> {
    logger.info(`Cleaning up old version for ${execution.id}`);
    
    // Simulate cleanup
    await this.simulateDeploymentStep('cleanup-old', 2000);
    
    this.addExecutionLog(execution, 'info', 'Old version cleanup completed');
  }

  private async rollbackCanary(execution: DeploymentExecution): Promise<void> {
    logger.info(`Rolling back canary for ${execution.id}`);
    
    // Remove canary traffic
    await this.removeCanaryTraffic(execution);
    
    // Stop canary instances
    await this.stopCanaryInstances(execution);
    
    this.addExecutionLog(execution, 'warn', 'Canary deployment rolled back');
  }

  private async removeCanaryTraffic(execution: DeploymentExecution): Promise<void> {
    logger.info(`Removing canary traffic for ${execution.id}`);
    
    // Simulate traffic removal
    await this.simulateDeploymentStep('remove-traffic', 1500);
    
    this.addExecutionLog(execution, 'info', 'Canary traffic routing removed');
  }

  private async stopCanaryInstances(execution: DeploymentExecution): Promise<void> {
    logger.info(`Stopping canary instances for ${execution.id}`);
    
    // Simulate instance termination
    await this.simulateDeploymentStep('stop-instances', 2000);
    
    this.addExecutionLog(execution, 'info', 'Canary instances stopped');
  }

  private async validateStableVersion(execution: DeploymentExecution): Promise<void> {
    logger.info(`Validating stable version for ${execution.id}`);
    
    // Simulate stable version validation
    await this.simulateDeploymentStep('validate-stable', 2000);
    
    this.addExecutionLog(execution, 'info', 'Stable version validation completed');
  }

  private generateMockMetrics(): { errorRate: number; responseTime: number; successRate: number } {
    return {
      errorRate: Math.random() * 2, // 0-2% error rate
      responseTime: 200 + Math.random() * 300, // 200-500ms response time
      successRate: 98 + Math.random() * 2, // 98-100% success rate
    };
  }

  private async simulateDeploymentStep(step: string, duration: number): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate occasional failures (3% failure rate)
        if (Math.random() < 0.03) {
          reject(new Error(`Simulated failure in ${step}`));
        } else {
          resolve();
        }
      }, duration);
    });
  }

  private addExecutionLog(execution: DeploymentExecution, level: 'info' | 'warn' | 'error', message: string): void {
    execution.logs.push({
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level,
      message,
      source: 'canary-strategy',
    });
  }
}