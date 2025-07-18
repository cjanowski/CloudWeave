import { IDeploymentPipelineService } from './interfaces';
import {
  DeploymentPipeline,
  DeploymentFilter,
  DeploymentStrategy,
  DeploymentPhase,
  TaskType
} from './types';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service for managing deployment pipelines
 * Handles CRUD operations and validation for deployment pipelines
 */
export class DeploymentPipelineService implements IDeploymentPipelineService {
  private pipelines: Map<string, DeploymentPipeline> = new Map();

  /**
   * Create a new deployment pipeline
   */
  async createPipeline(pipelineData: Omit<DeploymentPipeline, 'id' | 'createdAt' | 'updatedAt'>): Promise<DeploymentPipeline> {
    try {
      const pipelineId = uuidv4();
      const now = new Date();

      const pipeline: DeploymentPipeline = {
        ...pipelineData,
        id: pipelineId,
        createdAt: now,
        updatedAt: now,
      };

      // Validate pipeline configuration
      const validationErrors = await this.validatePipeline(pipeline);
      if (validationErrors.length > 0) {
        throw new Error(`Pipeline validation failed: ${validationErrors.join(', ')}`);
      }

      // Ensure stage IDs and ordering
      pipeline.stages = pipeline.stages.map((stage, index) => ({
        ...stage,
        id: stage.id || uuidv4(),
        order: stage.order || index,
        tasks: stage.tasks.map(task => ({
          ...task,
          id: task.id || uuidv4(),
        })),
      }));

      // Sort stages by order
      pipeline.stages.sort((a, b) => a.order - b.order);

      this.pipelines.set(pipelineId, pipeline);

      logger.info(`Created deployment pipeline ${pipelineId}`, {
        pipelineId,
        name: pipeline.name,
        strategy: pipeline.strategy,
        stageCount: pipeline.stages.length,
      });

      return pipeline;
    } catch (error) {
      logger.error('Failed to create deployment pipeline:', error);
      throw error;
    }
  }

  /**
   * Get deployment pipeline by ID
   */
  async getPipeline(pipelineId: string): Promise<DeploymentPipeline | null> {
    try {
      const pipeline = this.pipelines.get(pipelineId);
      if (pipeline) {
        logger.info(`Retrieved pipeline ${pipelineId}`);
      } else {
        logger.warn(`Pipeline ${pipelineId} not found`);
      }
      return pipeline || null;
    } catch (error) {
      logger.error(`Failed to get pipeline ${pipelineId}:`, error);
      throw error;
    }
  }

  /**
   * Get all deployment pipelines with optional filtering
   */
  async getPipelines(filter?: DeploymentFilter): Promise<DeploymentPipeline[]> {
    try {
      let pipelines = Array.from(this.pipelines.values());

      if (filter) {
        pipelines = this.applyPipelineFilters(pipelines, filter);
      }

      logger.info(`Retrieved ${pipelines.length} pipelines`);
      return pipelines;
    } catch (error) {
      logger.error('Failed to get pipelines:', error);
      throw error;
    }
  }

  /**
   * Update deployment pipeline
   */
  async updatePipeline(pipelineId: string, updates: Partial<DeploymentPipeline>): Promise<DeploymentPipeline> {
    try {
      const existingPipeline = this.pipelines.get(pipelineId);
      if (!existingPipeline) {
        throw new Error(`Pipeline ${pipelineId} not found`);
      }

      const updatedPipeline: DeploymentPipeline = {
        ...existingPipeline,
        ...updates,
        id: pipelineId, // Ensure ID cannot be changed
        createdAt: existingPipeline.createdAt, // Preserve creation date
        updatedAt: new Date(),
      };

      // Validate updated pipeline
      const validationErrors = await this.validatePipeline(updatedPipeline);
      if (validationErrors.length > 0) {
        throw new Error(`Pipeline validation failed: ${validationErrors.join(', ')}`);
      }

      this.pipelines.set(pipelineId, updatedPipeline);

      logger.info(`Updated pipeline ${pipelineId}`, {
        pipelineId,
        updatedFields: Object.keys(updates),
      });

      return updatedPipeline;
    } catch (error) {
      logger.error(`Failed to update pipeline ${pipelineId}:`, error);
      throw error;
    }
  }

  /**
   * Delete deployment pipeline
   */
  async deletePipeline(pipelineId: string): Promise<void> {
    try {
      const pipeline = this.pipelines.get(pipelineId);
      if (!pipeline) {
        throw new Error(`Pipeline ${pipelineId} not found`);
      }

      this.pipelines.delete(pipelineId);

      logger.info(`Deleted pipeline ${pipelineId}`, {
        pipelineId,
        name: pipeline.name,
      });
    } catch (error) {
      logger.error(`Failed to delete pipeline ${pipelineId}:`, error);
      throw error;
    }
  }

  /**
   * Activate or deactivate pipeline
   */
  async setPipelineActive(pipelineId: string, isActive: boolean): Promise<void> {
    try {
      const pipeline = this.pipelines.get(pipelineId);
      if (!pipeline) {
        throw new Error(`Pipeline ${pipelineId} not found`);
      }

      pipeline.isActive = isActive;
      pipeline.updatedAt = new Date();

      logger.info(`${isActive ? 'Activated' : 'Deactivated'} pipeline ${pipelineId}`);
    } catch (error) {
      logger.error(`Failed to set pipeline ${pipelineId} active status:`, error);
      throw error;
    }
  }

  /**
   * Validate pipeline configuration
   */
  async validatePipeline(pipeline: DeploymentPipeline): Promise<string[]> {
    const errors: string[] = [];

    try {
      // Basic validation
      if (!pipeline.name) {
        errors.push('Pipeline name is required');
      }

      if (!pipeline.organizationId) {
        errors.push('Organization ID is required');
      }

      if (!pipeline.projectId) {
        errors.push('Project ID is required');
      }

      if (!pipeline.environmentId) {
        errors.push('Environment ID is required');
      }

      if (!pipeline.applicationId) {
        errors.push('Application ID is required');
      }

      if (!pipeline.strategy) {
        errors.push('Deployment strategy is required');
      }

      // Validate strategy
      if (pipeline.strategy && !this.isValidStrategy(pipeline.strategy)) {
        errors.push(`Invalid deployment strategy: ${pipeline.strategy}`);
      }

      // Validate stages
      if (!pipeline.stages || pipeline.stages.length === 0) {
        errors.push('At least one stage is required');
      } else {
        const stageErrors = this.validateStages(pipeline.stages);
        errors.push(...stageErrors);
      }

      // Validate configuration
      if (pipeline.configuration) {
        const configErrors = this.validateConfiguration(pipeline.configuration);
        errors.push(...configErrors);
      }

      // Validate triggers
      if (pipeline.triggers && pipeline.triggers.length > 0) {
        const triggerErrors = this.validateTriggers(pipeline.triggers);
        errors.push(...triggerErrors);
      }

      // Validate approvals
      if (pipeline.approvals && pipeline.approvals.length > 0) {
        const approvalErrors = this.validateApprovals(pipeline.approvals);
        errors.push(...approvalErrors);
      }

      logger.info(`Pipeline validation completed`, {
        pipelineId: pipeline.id,
        errors: errors.length,
      });

      return errors;
    } catch (error) {
      logger.error('Pipeline validation failed:', error);
      errors.push('Validation process failed');
      return errors;
    }
  }

  /**
   * Get pipeline templates
   */
  async getPipelineTemplates(): Promise<Partial<DeploymentPipeline>[]> {
    return [
      {
        name: 'Basic Web Application',
        strategy: 'rolling',
        stages: [
          {
            id: 'build',
            name: 'Build',
            phase: 'pre-deployment',
            order: 1,
            dependsOn: [],
            tasks: [
              {
                id: 'docker-build',
                name: 'Build Docker Image',
                type: 'docker-build',
                configuration: {},
                timeout: 10,
                retryAttempts: 2,
                continueOnError: false,
                runConditions: [],
              },
            ],
            conditions: [],
            timeout: 15,
            retryPolicy: {
              maxAttempts: 2,
              backoffStrategy: 'exponential',
              initialDelay: 30,
              maxDelay: 300,
              multiplier: 2,
            },
            rollbackPolicy: {
              enabled: false,
              automatic: false,
              conditions: [],
              strategy: 'previous-version',
            },
          },
          {
            id: 'deploy',
            name: 'Deploy',
            phase: 'deployment',
            order: 2,
            dependsOn: ['build'],
            tasks: [
              {
                id: 'k8s-deploy',
                name: 'Deploy to Kubernetes',
                type: 'kubernetes-deploy',
                configuration: {},
                timeout: 20,
                retryAttempts: 3,
                continueOnError: false,
                runConditions: [],
              },
            ],
            conditions: [],
            timeout: 30,
            retryPolicy: {
              maxAttempts: 3,
              backoffStrategy: 'exponential',
              initialDelay: 60,
              maxDelay: 600,
              multiplier: 2,
            },
            rollbackPolicy: {
              enabled: true,
              automatic: true,
              conditions: [
                {
                  type: 'failure-rate',
                  threshold: 50,
                  timeWindow: 300,
                },
              ],
              strategy: 'previous-version',
            },
          },
        ],
        configuration: {
          timeout: 60,
          retryAttempts: 3,
          rollbackOnFailure: true,
          requireApproval: false,
          parallelExecution: false,
          environmentVariables: {},
          secrets: [],
          healthChecks: [],
          resources: [],
        },
      },
    ];
  }

  // Private helper methods
  private applyPipelineFilters(pipelines: DeploymentPipeline[], filter: DeploymentFilter): DeploymentPipeline[] {
    return pipelines.filter(pipeline => {
      if (filter.organizationId && pipeline.organizationId !== filter.organizationId) return false;
      if (filter.projectId && pipeline.projectId !== filter.projectId) return false;
      if (filter.environmentId && pipeline.environmentId !== filter.environmentId) return false;
      if (filter.applicationId && pipeline.applicationId !== filter.applicationId) return false;
      if (filter.strategy && pipeline.strategy !== filter.strategy) return false;

      return true;
    });
  }

  private isValidStrategy(strategy: DeploymentStrategy): boolean {
    const validStrategies: DeploymentStrategy[] = ['blue-green', 'canary', 'rolling', 'recreate'];
    return validStrategies.includes(strategy);
  }

  private validateStages(stages: any[]): string[] {
    const errors: string[] = [];
    const stageIds = new Set<string>();
    const stageNames = new Set<string>();

    stages.forEach((stage, index) => {
      // Check for duplicate IDs
      if (stage.id && stageIds.has(stage.id)) {
        errors.push(`Duplicate stage ID: ${stage.id}`);
      } else if (stage.id) {
        stageIds.add(stage.id);
      }

      // Check for duplicate names
      if (stage.name && stageNames.has(stage.name)) {
        errors.push(`Duplicate stage name: ${stage.name}`);
      } else if (stage.name) {
        stageNames.add(stage.name);
      }

      // Validate required fields
      if (!stage.name) {
        errors.push(`Stage ${index + 1}: name is required`);
      }

      if (!stage.phase) {
        errors.push(`Stage ${stage.name || index + 1}: phase is required`);
      }

      // Validate phase
      const validPhases: DeploymentPhase[] = [
        'validation', 'pre-deployment', 'deployment', 'verification', 'post-deployment', 'cleanup'
      ];
      if (stage.phase && !validPhases.includes(stage.phase)) {
        errors.push(`Stage ${stage.name}: invalid phase ${stage.phase}`);
      }

      // Validate tasks
      if (!stage.tasks || stage.tasks.length === 0) {
        errors.push(`Stage ${stage.name}: at least one task is required`);
      } else {
        const taskErrors = this.validateTasks(stage.tasks, stage.name);
        errors.push(...taskErrors);
      }

      // Validate dependencies
      if (stage.dependsOn && stage.dependsOn.length > 0) {
        stage.dependsOn.forEach((depId: string) => {
          if (!stages.some(s => s.id === depId)) {
            errors.push(`Stage ${stage.name}: dependency ${depId} not found`);
          }
        });
      }
    });

    return errors;
  }

  private validateTasks(tasks: any[], stageName: string): string[] {
    const errors: string[] = [];
    const taskIds = new Set<string>();

    tasks.forEach((task, index) => {
      // Check for duplicate IDs
      if (task.id && taskIds.has(task.id)) {
        errors.push(`Stage ${stageName}, duplicate task ID: ${task.id}`);
      } else if (task.id) {
        taskIds.add(task.id);
      }

      // Validate required fields
      if (!task.name) {
        errors.push(`Stage ${stageName}, task ${index + 1}: name is required`);
      }

      if (!task.type) {
        errors.push(`Stage ${stageName}, task ${task.name || index + 1}: type is required`);
      }

      // Validate task type
      const validTypes: TaskType[] = [
        'script', 'docker-build', 'docker-push', 'kubernetes-deploy', 
        'terraform-apply', 'health-check', 'notification', 'approval', 'custom'
      ];
      if (task.type && !validTypes.includes(task.type)) {
        errors.push(`Stage ${stageName}, task ${task.name}: invalid type ${task.type}`);
      }

      // Validate timeout
      if (task.timeout && (typeof task.timeout !== 'number' || task.timeout <= 0)) {
        errors.push(`Stage ${stageName}, task ${task.name}: timeout must be a positive number`);
      }

      // Validate retry attempts
      if (task.retryAttempts && (typeof task.retryAttempts !== 'number' || task.retryAttempts < 0)) {
        errors.push(`Stage ${stageName}, task ${task.name}: retryAttempts must be a non-negative number`);
      }
    });

    return errors;
  }

  private validateConfiguration(config: any): string[] {
    const errors: string[] = [];

    if (config.timeout && (typeof config.timeout !== 'number' || config.timeout <= 0)) {
      errors.push('Configuration timeout must be a positive number');
    }

    if (config.retryAttempts && (typeof config.retryAttempts !== 'number' || config.retryAttempts < 0)) {
      errors.push('Configuration retryAttempts must be a non-negative number');
    }

    return errors;
  }

  private validateTriggers(triggers: any[]): string[] {
    const errors: string[] = [];

    triggers.forEach((trigger, index) => {
      if (!trigger.type) {
        errors.push(`Trigger ${index + 1}: type is required`);
      }

      const validTypes = ['manual', 'webhook', 'schedule', 'git-push', 'image-push'];
      if (trigger.type && !validTypes.includes(trigger.type)) {
        errors.push(`Trigger ${index + 1}: invalid type ${trigger.type}`);
      }
    });

    return errors;
  }

  private validateApprovals(approvals: any[]): string[] {
    const errors: string[] = [];

    approvals.forEach((approval, index) => {
      if (!approval.name) {
        errors.push(`Approval ${index + 1}: name is required`);
      }

      if (!approval.stage) {
        errors.push(`Approval ${approval.name || index + 1}: stage is required`);
      }

      if (!approval.approvers || approval.approvers.length === 0) {
        errors.push(`Approval ${approval.name || index + 1}: at least one approver is required`);
      }

      if (approval.requiredApprovals && approval.requiredApprovals > approval.approvers?.length) {
        errors.push(`Approval ${approval.name || index + 1}: requiredApprovals cannot exceed number of approvers`);
      }
    });

    return errors;
  }
}