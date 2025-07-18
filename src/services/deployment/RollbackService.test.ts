import { RollbackService } from './RollbackService';
import { IDeploymentExecutionService, IDeploymentPipelineService } from './interfaces';
import { DeploymentExecution, DeploymentPipeline, DeploymentStatus } from './types';

describe('RollbackService', () => {
  let rollbackService: RollbackService;
  let mockExecutionService: jest.Mocked<IDeploymentExecutionService>;
  let mockPipelineService: jest.Mocked<IDeploymentPipelineService>;

  beforeEach(() => {
    mockExecutionService = {
      executeDeployment: jest.fn(),
      getExecution: jest.fn(),
      getExecutions: jest.fn(),
      cancelDeployment: jest.fn(),
      pauseDeployment: jest.fn(),
      resumeDeployment: jest.fn(),
      getDeploymentStatus: jest.fn(),
      getDeploymentLogs: jest.fn(),
      streamDeploymentLogs: jest.fn(),
    };

    mockPipelineService = {
      createPipeline: jest.fn(),
      getPipeline: jest.fn(),
      getPipelines: jest.fn(),
      updatePipeline: jest.fn(),
      deletePipeline: jest.fn(),
      setPipelineActive: jest.fn(),
      validatePipeline: jest.fn(),
    };

    rollbackService = new RollbackService(mockExecutionService, mockPipelineService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('rollback initiation', () => {
    it('should initiate rollback successfully', async () => {
      const mockExecution: DeploymentExecution = {
        id: 'exec-1',
        pipelineId: 'pipeline-1',
        version: 'v2.0.0',
        status: 'failed',
        strategy: 'blue-green',
        triggeredBy: 'user-1',
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

      const mockPipeline: DeploymentPipeline = {
        id: 'pipeline-1',
        name: 'Test Pipeline',
        organizationId: 'org-1',
        projectId: 'project-1',
        environmentId: 'env-1',
        applicationId: 'app-1',
        strategy: 'blue-green',
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
        stages: [
          {
            id: 'deploy',
            name: 'Deploy',
            phase: 'deployment',
            order: 1,
            dependsOn: [],
            tasks: [],
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
              automatic: false,
              conditions: [],
              strategy: 'previous-version',
            },
          },
        ],
        triggers: [],
        approvals: [],
        notifications: [],
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      const mockPreviousExecution: DeploymentExecution = {
        id: 'exec-0',
        pipelineId: 'pipeline-1',
        version: 'v1.0.0',
        status: 'success',
        strategy: 'blue-green',
        triggeredBy: 'user-1',
        triggeredAt: new Date(Date.now() - 86400000), // 1 day ago
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

      mockExecutionService.getExecution.mockResolvedValue(mockExecution);
      mockPipelineService.getPipeline.mockResolvedValue(mockPipeline);
      mockExecutionService.getExecutions.mockResolvedValue([mockPreviousExecution]);

      const result = await rollbackService.initiateRollback(
        'exec-1',
        'Deployment failed - rolling back',
        'user-1'
      );

      expect(result.success).toBe(true);
      expect(mockExecutionService.getExecution).toHaveBeenCalledWith('exec-1');
      expect(mockPipelineService.getPipeline).toHaveBeenCalledWith('pipeline-1');
      expect(mockExecutionService.getExecutions).toHaveBeenCalledWith({
        pipelineId: 'pipeline-1',
        status: 'success',
        dateTo: mockExecution.triggeredAt,
      });
    });

    it('should fail rollback for non-existent execution', async () => {
      mockExecutionService.getExecution.mockResolvedValue(null);

      const result = await rollbackService.initiateRollback(
        'non-existent',
        'Test rollback',
        'user-1'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should fail rollback when no rollback targets available', async () => {
      const mockExecution: DeploymentExecution = {
        id: 'exec-1',
        pipelineId: 'pipeline-1',
        version: 'v1.0.0',
        status: 'failed',
        strategy: 'blue-green',
        triggeredBy: 'user-1',
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

      const mockPipeline: DeploymentPipeline = {
        id: 'pipeline-1',
        name: 'Test Pipeline',
        organizationId: 'org-1',
        projectId: 'project-1',
        environmentId: 'env-1',
        applicationId: 'app-1',
        strategy: 'blue-green',
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
        stages: [
          {
            id: 'deploy',
            name: 'Deploy',
            phase: 'deployment',
            order: 1,
            dependsOn: [],
            tasks: [],
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
              automatic: false,
              conditions: [],
              strategy: 'previous-version',
            },
          },
        ],
        triggers: [],
        approvals: [],
        notifications: [],
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      mockExecutionService.getExecution.mockResolvedValue(mockExecution);
      mockPipelineService.getPipeline.mockResolvedValue(mockPipeline);
      mockExecutionService.getExecutions.mockResolvedValue([]); // No previous executions

      const result = await rollbackService.initiateRollback(
        'exec-1',
        'Test rollback',
        'user-1'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('No rollback targets available');
    });
  });

  describe('rollback validation', () => {
    it('should validate rollback is possible', async () => {
      const mockExecution: DeploymentExecution = {
        id: 'exec-1',
        pipelineId: 'pipeline-1',
        version: 'v2.0.0',
        status: 'success',
        strategy: 'blue-green',
        triggeredBy: 'user-1',
        triggeredAt: new Date(),
        stages: [],
        logs: [],
        artifacts: [],
        metrics: {
          totalDuration: 0,
          stageMetrics: {},
          resourceUsage: { cpu: 0, memory: 0, storage: 0, network: 0 },
          successRate: 0,
          errorCount: 5, // Within acceptable range
          warningCount: 0,
        },
        approvals: [],
      };

      const mockPipeline: DeploymentPipeline = {
        id: 'pipeline-1',
        name: 'Test Pipeline',
        organizationId: 'org-1',
        projectId: 'project-1',
        environmentId: 'env-1',
        applicationId: 'app-1',
        strategy: 'blue-green',
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
        stages: [
          {
            id: 'deploy',
            name: 'Deploy',
            phase: 'deployment',
            order: 1,
            dependsOn: [],
            tasks: [],
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
              automatic: false,
              conditions: [
                {
                  type: 'error-count',
                  threshold: 10,
                },
              ],
              strategy: 'previous-version',
            },
          },
        ],
        triggers: [],
        approvals: [],
        notifications: [],
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      const mockPreviousExecution: DeploymentExecution = {
        id: 'exec-0',
        pipelineId: 'pipeline-1',
        version: 'v1.0.0',
        status: 'success',
        strategy: 'blue-green',
        triggeredBy: 'user-1',
        triggeredAt: new Date(Date.now() - 86400000),
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

      mockExecutionService.getExecution.mockResolvedValue(mockExecution);
      mockPipelineService.getPipeline.mockResolvedValue(mockPipeline);
      mockExecutionService.getExecutions.mockResolvedValue([mockPreviousExecution]);

      const canRollback = await rollbackService.canRollback('exec-1');

      expect(canRollback).toBe(true);
    });

    it('should reject rollback for cancelled deployment', async () => {
      const mockExecution: DeploymentExecution = {
        id: 'exec-1',
        pipelineId: 'pipeline-1',
        version: 'v2.0.0',
        status: 'cancelled', // Not rollbackable status
        strategy: 'blue-green',
        triggeredBy: 'user-1',
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

      mockExecutionService.getExecution.mockResolvedValue(mockExecution);

      const canRollback = await rollbackService.canRollback('exec-1');

      expect(canRollback).toBe(false);
    });

    it('should reject rollback when no stages have rollback enabled', async () => {
      const mockExecution: DeploymentExecution = {
        id: 'exec-1',
        pipelineId: 'pipeline-1',
        version: 'v2.0.0',
        status: 'success',
        strategy: 'blue-green',
        triggeredBy: 'user-1',
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

      const mockPipeline: DeploymentPipeline = {
        id: 'pipeline-1',
        name: 'Test Pipeline',
        organizationId: 'org-1',
        projectId: 'project-1',
        environmentId: 'env-1',
        applicationId: 'app-1',
        strategy: 'blue-green',
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
        stages: [
          {
            id: 'deploy',
            name: 'Deploy',
            phase: 'deployment',
            order: 1,
            dependsOn: [],
            tasks: [],
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
              enabled: false, // Rollback disabled
              automatic: false,
              conditions: [],
              strategy: 'previous-version',
            },
          },
        ],
        triggers: [],
        approvals: [],
        notifications: [],
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      mockExecutionService.getExecution.mockResolvedValue(mockExecution);
      mockPipelineService.getPipeline.mockResolvedValue(mockPipeline);

      const canRollback = await rollbackService.canRollback('exec-1');

      expect(canRollback).toBe(false);
    });
  });

  describe('rollback targets', () => {
    it('should get available rollback targets', async () => {
      const mockExecution: DeploymentExecution = {
        id: 'exec-3',
        pipelineId: 'pipeline-1',
        version: 'v3.0.0',
        status: 'failed',
        strategy: 'blue-green',
        triggeredBy: 'user-1',
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

      const mockPreviousExecutions: DeploymentExecution[] = [
        {
          id: 'exec-2',
          pipelineId: 'pipeline-1',
          version: 'v2.0.0',
          status: 'success',
          strategy: 'blue-green',
          triggeredBy: 'user-1',
          triggeredAt: new Date(Date.now() - 3600000), // 1 hour ago
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
        },
        {
          id: 'exec-1',
          pipelineId: 'pipeline-1',
          version: 'v1.0.0',
          status: 'success',
          strategy: 'blue-green',
          triggeredBy: 'user-1',
          triggeredAt: new Date(Date.now() - 86400000), // 1 day ago
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
        },
      ];

      mockExecutionService.getExecution.mockResolvedValue(mockExecution);
      mockExecutionService.getExecutions.mockResolvedValue(mockPreviousExecutions);

      const targets = await rollbackService.getRollbackTargets('exec-3');

      expect(targets).toEqual(['v2.0.0', 'v1.0.0']);
      expect(mockExecutionService.getExecutions).toHaveBeenCalledWith({
        pipelineId: 'pipeline-1',
        status: 'success',
        dateTo: mockExecution.triggeredAt,
      });
    });

    it('should return empty array when no targets available', async () => {
      const mockExecution: DeploymentExecution = {
        id: 'exec-1',
        pipelineId: 'pipeline-1',
        version: 'v1.0.0',
        status: 'failed',
        strategy: 'blue-green',
        triggeredBy: 'user-1',
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

      mockExecutionService.getExecution.mockResolvedValue(mockExecution);
      mockExecutionService.getExecutions.mockResolvedValue([]);

      const targets = await rollbackService.getRollbackTargets('exec-1');

      expect(targets).toEqual([]);
    });
  });

  describe('rollback history', () => {
    it('should track rollback history', async () => {
      const mockExecution: DeploymentExecution = {
        id: 'exec-1',
        pipelineId: 'pipeline-1',
        version: 'v2.0.0',
        status: 'failed',
        strategy: 'blue-green',
        triggeredBy: 'user-1',
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

      const mockPipeline: DeploymentPipeline = {
        id: 'pipeline-1',
        name: 'Test Pipeline',
        organizationId: 'org-1',
        projectId: 'project-1',
        environmentId: 'env-1',
        applicationId: 'app-1',
        strategy: 'blue-green',
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
        stages: [
          {
            id: 'deploy',
            name: 'Deploy',
            phase: 'deployment',
            order: 1,
            dependsOn: [],
            tasks: [],
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
              automatic: false,
              conditions: [],
              strategy: 'previous-version',
            },
          },
        ],
        triggers: [],
        approvals: [],
        notifications: [],
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      const mockPreviousExecution: DeploymentExecution = {
        id: 'exec-0',
        pipelineId: 'pipeline-1',
        version: 'v1.0.0',
        status: 'success',
        strategy: 'blue-green',
        triggeredBy: 'user-1',
        triggeredAt: new Date(Date.now() - 86400000),
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

      mockExecutionService.getExecution.mockResolvedValue(mockExecution);
      mockPipelineService.getPipeline.mockResolvedValue(mockPipeline);
      mockExecutionService.getExecutions.mockResolvedValue([mockPreviousExecution]);

      // Initiate rollback
      await rollbackService.initiateRollback('exec-1', 'Test rollback', 'user-1');

      // Get rollback history
      const history = await rollbackService.getRollbackHistory('exec-1');

      expect(history).toHaveLength(1);
      expect(history[0].reason).toBe('Test rollback');
      expect(history[0].triggeredBy).toBe('user-1');
      expect(history[0].previousVersion).toBe('v1.0.0');
    });

    it('should return empty history for deployment without rollbacks', async () => {
      const history = await rollbackService.getRollbackHistory('exec-never-rolled-back');

      expect(history).toEqual([]);
    });
  });

  describe('snapshot management', () => {
    it('should create deployment snapshot', async () => {
      const mockExecution: DeploymentExecution = {
        id: 'exec-1',
        pipelineId: 'pipeline-1',
        version: 'v1.0.0',
        status: 'success',
        strategy: 'blue-green',
        triggeredBy: 'user-1',
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

      const mockPipeline: DeploymentPipeline = {
        id: 'pipeline-1',
        name: 'Test Pipeline',
        organizationId: 'org-1',
        projectId: 'project-1',
        environmentId: 'env-1',
        applicationId: 'app-1',
        strategy: 'blue-green',
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
        stages: [],
        triggers: [],
        approvals: [],
        notifications: [],
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      mockExecutionService.getExecution.mockResolvedValue(mockExecution);
      mockPipelineService.getPipeline.mockResolvedValue(mockPipeline);

      await expect(rollbackService.createDeploymentSnapshot('exec-1')).resolves.not.toThrow();
    });

    it('should restore from snapshot', async () => {
      const mockExecution: DeploymentExecution = {
        id: 'exec-1',
        pipelineId: 'pipeline-1',
        version: 'v1.0.0',
        status: 'success',
        strategy: 'blue-green',
        triggeredBy: 'user-1',
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

      const mockPipeline: DeploymentPipeline = {
        id: 'pipeline-1',
        name: 'Test Pipeline',
        organizationId: 'org-1',
        projectId: 'project-1',
        environmentId: 'env-1',
        applicationId: 'app-1',
        strategy: 'blue-green',
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
        stages: [],
        triggers: [],
        approvals: [],
        notifications: [],
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      mockExecutionService.getExecution.mockResolvedValue(mockExecution);
      mockPipelineService.getPipeline.mockResolvedValue(mockPipeline);

      // Create snapshot first
      await rollbackService.createDeploymentSnapshot('exec-1');

      // Restore from snapshot
      const result = await rollbackService.restoreFromSnapshot('exec-1');

      expect(result.success).toBe(true);
      expect(result.executionId).toBeDefined();
    });

    it('should fail to restore from non-existent snapshot', async () => {
      const result = await rollbackService.restoreFromSnapshot('non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('No snapshot found');
    });
  });
});