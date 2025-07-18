import { createDeploymentService } from './index';
import { RollbackService } from './RollbackService';
import { NotificationService } from './NotificationService';
import { DeploymentRequest, DeploymentStrategy } from './types';

describe('Rollback and Recovery Integration Tests', () => {
  let services: any;
  let rollbackService: RollbackService;
  let notificationService: NotificationService;

  beforeEach(async () => {
    services = await createDeploymentService();
    rollbackService = new RollbackService(services.executionService, services.pipelineService);
    notificationService = new NotificationService(services.executionService, services.pipelineService);
  });

  describe('end-to-end rollback scenarios', () => {
    it('should handle complete rollback workflow', async () => {
      // Step 1: Create a pipeline with rollback enabled
      const pipelineData = {
        name: 'Production API Deployment',
        description: 'Critical API deployment with automatic rollback',
        organizationId: 'org-1',
        projectId: 'api-project',
        environmentId: 'production',
        applicationId: 'api-service',
        strategy: 'blue-green' as DeploymentStrategy,
        configuration: {
          timeout: 45,
          retryAttempts: 2,
          rollbackOnFailure: true,
          requireApproval: false,
          parallelExecution: false,
          environmentVariables: {
            NODE_ENV: 'production',
            DATABASE_URL: 'postgresql://prod-db:5432/api',
          },
          secrets: ['DATABASE_PASSWORD', 'JWT_SECRET'],
          healthChecks: [
            {
              id: 'api-health',
              name: 'API Health Check',
              type: 'http',
              configuration: {
                url: 'https://api.example.com/health',
                expectedStatus: 200,
                timeout: 10,
              },
              timeout: 10,
              interval: 5,
              retries: 3,
              successThreshold: 2,
              failureThreshold: 3,
            },
          ],
          resources: [],
        },
        stages: [
          {
            id: 'deploy',
            name: 'Deploy to Production',
            phase: 'deployment' as const,
            order: 1,
            dependsOn: [],
            tasks: [
              {
                id: 'blue-green-deploy',
                name: 'Blue-Green Deployment',
                type: 'kubernetes-deploy' as const,
                configuration: {
                  strategy: 'blue-green',
                  namespace: 'production',
                  healthCheckUrl: 'https://api.example.com/health',
                },
                timeout: 20,
                retryAttempts: 2,
                continueOnError: false,
                runConditions: [],
              },
            ],
            conditions: [],
            timeout: 30,
            retryPolicy: {
              maxAttempts: 2,
              backoffStrategy: 'exponential' as const,
              initialDelay: 60,
              maxDelay: 300,
              multiplier: 2,
            },
            rollbackPolicy: {
              enabled: true,
              automatic: true,
              conditions: [
                {
                  type: 'failure-rate',
                  threshold: 5, // 5% failure rate threshold
                  timeWindow: 300, // 5 minutes
                },
                {
                  type: 'error-count',
                  threshold: 10, // Max 10 errors
                },
              ],
              strategy: 'previous-version' as const,
            },
          },
          {
            id: 'verify',
            name: 'Verify Deployment',
            phase: 'verification' as const,
            order: 2,
            dependsOn: ['deploy'],
            tasks: [
              {
                id: 'health-check',
                name: 'Production Health Check',
                type: 'health-check' as const,
                configuration: {
                  checks: ['api-health'],
                  timeout: 120,
                },
                timeout: 5,
                retryAttempts: 3,
                continueOnError: false,
                runConditions: [],
              },
            ],
            conditions: [],
            timeout: 10,
            retryPolicy: {
              maxAttempts: 3,
              backoffStrategy: 'linear' as const,
              initialDelay: 30,
              maxDelay: 90,
              multiplier: 1,
            },
            rollbackPolicy: {
              enabled: true,
              automatic: true,
              conditions: [
                {
                  type: 'failure-rate',
                  threshold: 1, // Very strict for verification
                },
              ],
              strategy: 'previous-version' as const,
            },
          },
        ],
        triggers: [],
        approvals: [],
        notifications: [
          {
            id: 'slack-prod-alerts',
            type: 'slack',
            recipients: ['#production-alerts'],
            events: ['deployment-started', 'deployment-failed', 'rollback-initiated'],
            configuration: {
              webhook: 'https://hooks.slack.com/services/prod-alerts',
            },
          },
          {
            id: 'email-oncall',
            type: 'email',
            recipients: ['oncall@example.com'],
            events: ['deployment-failed', 'rollback-initiated'],
            configuration: {},
          },
        ],
        createdBy: 'devops-team',
        isActive: true,
      };

      const pipeline = await services.pipelineService.createPipeline(pipelineData);
      expect(pipeline.id).toBeDefined();

      // Step 2: Execute successful deployment (v1.0.0)
      const firstDeployment: DeploymentRequest = {
        pipelineId: pipeline.id,
        version: 'v1.0.0',
        triggeredBy: 'ci-cd-system',
        reason: 'Initial production deployment',
      };

      const firstResult = await services.executionService.executeDeployment(firstDeployment);
      expect(firstResult.success).toBe(true);

      const firstExecutionId = firstResult.executionId!;

      // Wait for first deployment to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Create snapshot of successful deployment
      await rollbackService.createDeploymentSnapshot(firstExecutionId);

      // Step 3: Execute problematic deployment (v2.0.0)
      const secondDeployment: DeploymentRequest = {
        pipelineId: pipeline.id,
        version: 'v2.0.0',
        triggeredBy: 'developer-1',
        reason: 'Feature release with potential issues',
      };

      const secondResult = await services.executionService.executeDeployment(secondDeployment);
      expect(secondResult.success).toBe(true);

      const secondExecutionId = secondResult.executionId!;

      // Step 4: Simulate deployment failure and initiate rollback
      const rollbackResult = await rollbackService.initiateRollback(
        secondExecutionId,
        'High error rate detected in production - automatic rollback triggered',
        'monitoring-system'
      );

      expect(rollbackResult.success).toBe(true);

      // Step 5: Verify rollback history
      const rollbackHistory = await rollbackService.getRollbackHistory(secondExecutionId);
      expect(rollbackHistory).toHaveLength(1);
      expect(rollbackHistory[0].reason).toContain('High error rate detected');
      expect(rollbackHistory[0].triggeredBy).toBe('monitoring-system');
      expect(rollbackHistory[0].previousVersion).toBe('v1.0.0');

      // Step 6: Verify rollback targets are available
      const rollbackTargets = await rollbackService.getRollbackTargets(secondExecutionId);
      expect(rollbackTargets).toContain('v1.0.0');

      // Step 7: Test notification system
      await notificationService.sendNotification(
        secondExecutionId,
        'rollback-initiated',
        {
          reason: 'High error rate detected',
          targetVersion: 'v1.0.0',
          initiatedBy: 'monitoring-system',
        }
      );

      const notificationHistory = await notificationService.getNotificationHistory(secondExecutionId);
      expect(notificationHistory.length).toBeGreaterThan(0);
    });

    it('should handle manual rollback with approval', async () => {
      // Create pipeline with manual rollback approval
      const pipelineData = {
        name: 'Critical System Deployment',
        organizationId: 'org-1',
        projectId: 'critical-project',
        environmentId: 'production',
        applicationId: 'critical-system',
        strategy: 'canary' as DeploymentStrategy,
        configuration: {
          timeout: 60,
          retryAttempts: 3,
          rollbackOnFailure: false, // Manual rollback only
          requireApproval: true,
          parallelExecution: false,
          environmentVariables: {},
          secrets: [],
          healthChecks: [],
          resources: [],
        },
        stages: [
          {
            id: 'canary-deploy',
            name: 'Canary Deployment',
            phase: 'deployment' as const,
            order: 1,
            dependsOn: [],
            tasks: [
              {
                id: 'canary-task',
                name: 'Deploy Canary Version',
                type: 'kubernetes-deploy' as const,
                configuration: {
                  strategy: 'canary',
                  percentage: 10,
                },
                timeout: 15,
                retryAttempts: 2,
                continueOnError: false,
                runConditions: [],
              },
            ],
            conditions: [],
            timeout: 20,
            retryPolicy: {
              maxAttempts: 2,
              backoffStrategy: 'fixed' as const,
              initialDelay: 30,
              maxDelay: 30,
              multiplier: 1,
            },
            rollbackPolicy: {
              enabled: true,
              automatic: false, // Manual rollback only
              conditions: [
                {
                  type: 'manual',
                },
              ],
              strategy: 'previous-version' as const,
            },
          },
        ],
        triggers: [],
        approvals: [
          {
            id: 'rollback-approval',
            name: 'Rollback Approval',
            stage: 'canary-deploy',
            approvers: ['senior-engineer-1', 'team-lead-1'],
            requiredApprovals: 1,
            timeout: 1800, // 30 minutes
            autoApprove: false,
            conditions: [],
          },
        ],
        notifications: [],
        createdBy: 'senior-engineer',
        isActive: true,
      };

      const pipeline = await services.pipelineService.createPipeline(pipelineData);

      // Deploy stable version first
      const stableDeployment: DeploymentRequest = {
        pipelineId: pipeline.id,
        version: 'v1.5.0',
        triggeredBy: 'release-manager',
        reason: 'Stable release',
      };

      const stableResult = await services.executionService.executeDeployment(stableDeployment);
      expect(stableResult.success).toBe(true);

      // Deploy canary version
      const canaryDeployment: DeploymentRequest = {
        pipelineId: pipeline.id,
        version: 'v1.6.0-canary',
        triggeredBy: 'developer-2',
        reason: 'Canary release for testing',
      };

      const canaryResult = await services.executionService.executeDeployment(canaryDeployment);
      expect(canaryResult.success).toBe(true);

      const canaryExecutionId = canaryResult.executionId!;

      // Check if rollback is possible
      const canRollback = await rollbackService.canRollback(canaryExecutionId);
      expect(canRollback).toBe(true);

      // Initiate manual rollback
      const rollbackResult = await rollbackService.initiateRollback(
        canaryExecutionId,
        'Canary showing increased latency - manual rollback requested',
        'senior-engineer-1'
      );

      expect(rollbackResult.success).toBe(true);

      // Verify rollback was recorded
      const rollbackHistory = await rollbackService.getRollbackHistory(canaryExecutionId);
      expect(rollbackHistory).toHaveLength(1);
      expect(rollbackHistory[0].triggeredBy).toBe('senior-engineer-1');
    });

    it('should handle rollback validation failures', async () => {
      // Create pipeline without rollback enabled
      const pipelineData = {
        name: 'No Rollback Pipeline',
        organizationId: 'org-1',
        projectId: 'test-project',
        environmentId: 'development',
        applicationId: 'test-app',
        strategy: 'recreate' as DeploymentStrategy,
        configuration: {
          timeout: 30,
          retryAttempts: 1,
          rollbackOnFailure: false,
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
            phase: 'deployment' as const,
            order: 1,
            dependsOn: [],
            tasks: [
              {
                id: 'deploy-task',
                name: 'Deploy Application',
                type: 'script' as const,
                configuration: {},
                timeout: 10,
                retryAttempts: 1,
                continueOnError: false,
                runConditions: [],
              },
            ],
            conditions: [],
            timeout: 15,
            retryPolicy: {
              maxAttempts: 1,
              backoffStrategy: 'fixed' as const,
              initialDelay: 30,
              maxDelay: 30,
              multiplier: 1,
            },
            rollbackPolicy: {
              enabled: false, // Rollback disabled
              automatic: false,
              conditions: [],
              strategy: 'previous-version' as const,
            },
          },
        ],
        triggers: [],
        approvals: [],
        notifications: [],
        createdBy: 'developer',
        isActive: true,
      };

      const pipeline = await services.pipelineService.createPipeline(pipelineData);

      const deployment: DeploymentRequest = {
        pipelineId: pipeline.id,
        version: 'v1.0.0',
        triggeredBy: 'developer',
        reason: 'Test deployment',
      };

      const result = await services.executionService.executeDeployment(deployment);
      expect(result.success).toBe(true);

      const executionId = result.executionId!;

      // Try to rollback - should fail
      const canRollback = await rollbackService.canRollback(executionId);
      expect(canRollback).toBe(false);

      const rollbackResult = await rollbackService.initiateRollback(
        executionId,
        'Attempting rollback',
        'developer'
      );

      expect(rollbackResult.success).toBe(false);
      expect(rollbackResult.error).toContain('not possible');
    });

    it('should handle snapshot-based recovery', async () => {
      // Create pipeline for snapshot testing
      const pipelineData = {
        name: 'Snapshot Recovery Pipeline',
        organizationId: 'org-1',
        projectId: 'snapshot-project',
        environmentId: 'production',
        applicationId: 'snapshot-app',
        strategy: 'rolling' as DeploymentStrategy,
        configuration: {
          timeout: 40,
          retryAttempts: 2,
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
            name: 'Rolling Deploy',
            phase: 'deployment' as const,
            order: 1,
            dependsOn: [],
            tasks: [
              {
                id: 'rolling-update',
                name: 'Rolling Update',
                type: 'kubernetes-deploy' as const,
                configuration: {
                  strategy: 'rolling',
                  maxUnavailable: '25%',
                  maxSurge: '25%',
                },
                timeout: 20,
                retryAttempts: 2,
                continueOnError: false,
                runConditions: [],
              },
            ],
            conditions: [],
            timeout: 25,
            retryPolicy: {
              maxAttempts: 2,
              backoffStrategy: 'exponential' as const,
              initialDelay: 45,
              maxDelay: 180,
              multiplier: 2,
            },
            rollbackPolicy: {
              enabled: true,
              automatic: true,
              conditions: [
                {
                  type: 'timeout',
                  timeWindow: 1800, // 30 minutes
                },
              ],
              strategy: 'snapshot-restore' as const,
            },
          },
        ],
        triggers: [],
        approvals: [],
        notifications: [],
        createdBy: 'devops',
        isActive: true,
      };

      const pipeline = await services.pipelineService.createPipeline(pipelineData);

      // Deploy and create snapshot
      const deployment: DeploymentRequest = {
        pipelineId: pipeline.id,
        version: 'v2.1.0',
        triggeredBy: 'ci-system',
        reason: 'Automated deployment',
      };

      const result = await services.executionService.executeDeployment(deployment);
      expect(result.success).toBe(true);

      const executionId = result.executionId!;

      // Create deployment snapshot
      await rollbackService.createDeploymentSnapshot(executionId);

      // Simulate recovery from snapshot
      const recoveryResult = await rollbackService.restoreFromSnapshot(executionId);
      expect(recoveryResult.success).toBe(true);
      expect(recoveryResult.executionId).toBeDefined();
    });
  });

  describe('notification integration', () => {
    it('should send notifications for rollback events', async () => {
      // Test notification configuration
      const notificationConfig = [
        {
          id: 'rollback-alerts',
          type: 'slack',
          recipients: ['#deployments', '#alerts'],
          events: ['rollback-initiated', 'deployment-failed'],
          configuration: {
            webhook: 'https://hooks.slack.com/test',
          },
        },
        {
          id: 'email-alerts',
          type: 'email',
          recipients: ['team@example.com', 'oncall@example.com'],
          events: ['rollback-initiated'],
          configuration: {},
        },
      ];

      // Test notification configuration
      const testResult = await notificationService.testNotification(notificationConfig[0]);
      expect(testResult).toBe(true);

      // Test notification statistics
      const stats = await notificationService.getNotificationStatistics();
      expect(stats.totalSent).toBeGreaterThanOrEqual(0);
      expect(stats.lastUpdated).toBeInstanceOf(Date);
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle rollback of non-existent deployment', async () => {
      const result = await rollbackService.initiateRollback(
        'non-existent-deployment',
        'Test rollback',
        'user'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should handle rollback condition validation errors', async () => {
      const errors = await rollbackService.validateRollbackConditions('non-existent');
      expect(errors).toContain('Deployment execution not found');
    });

    it('should handle notification failures gracefully', async () => {
      // This should not throw even if notification fails
      await expect(
        notificationService.sendNotification('non-existent', 'test-event')
      ).resolves.not.toThrow();
    });
  });
});