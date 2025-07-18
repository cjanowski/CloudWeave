import { createDeploymentService, getDeploymentStrategy } from './index';
import { DeploymentRequest, DeploymentStrategy } from './types';

describe('Deployment Service Integration Tests', () => {
  let services: any;

  beforeEach(async () => {
    services = await createDeploymentService();
  });

  describe('end-to-end deployment workflow', () => {
    it('should create pipeline and execute deployment', async () => {
      // Step 1: Create a deployment pipeline
      const pipelineData = {
        name: 'Web App Deployment',
        description: 'Deploy web application with blue-green strategy',
        organizationId: 'org-1',
        projectId: 'project-1',
        environmentId: 'production',
        applicationId: 'web-app',
        strategy: 'blue-green' as DeploymentStrategy,
        configuration: {
          timeout: 30,
          retryAttempts: 2,
          rollbackOnFailure: true,
          requireApproval: false,
          parallelExecution: false,
          environmentVariables: {
            NODE_ENV: 'production',
            API_URL: 'https://api.example.com',
          },
          secrets: ['DATABASE_PASSWORD', 'API_KEY'],
          healthChecks: [
            {
              id: 'health-1',
              name: 'Application Health Check',
              type: 'http',
              configuration: {
                url: 'https://app.example.com/health',
                expectedStatus: 200,
              },
              timeout: 30,
              interval: 10,
              retries: 3,
              successThreshold: 1,
              failureThreshold: 3,
            },
          ],
          resources: [
            {
              type: 'cpu',
              amount: 2,
              unit: 'cores',
            },
            {
              type: 'memory',
              amount: 4,
              unit: 'GB',
            },
          ],
        },
        stages: [
          {
            id: 'build',
            name: 'Build Application',
            phase: 'pre-deployment' as const,
            order: 1,
            dependsOn: [],
            tasks: [
              {
                id: 'docker-build',
                name: 'Build Docker Image',
                type: 'docker-build' as const,
                configuration: {
                  dockerfile: 'Dockerfile',
                  context: '.',
                  tags: ['web-app:latest', 'web-app:v1.2.3'],
                },
                timeout: 15,
                retryAttempts: 2,
                continueOnError: false,
                runConditions: [],
              },
              {
                id: 'docker-push',
                name: 'Push Docker Image',
                type: 'docker-push' as const,
                configuration: {
                  registry: 'registry.example.com',
                  repository: 'web-app',
                  tags: ['latest', 'v1.2.3'],
                },
                timeout: 10,
                retryAttempts: 3,
                continueOnError: false,
                runConditions: [],
              },
            ],
            conditions: [],
            timeout: 30,
            retryPolicy: {
              maxAttempts: 2,
              backoffStrategy: 'exponential' as const,
              initialDelay: 30,
              maxDelay: 300,
              multiplier: 2,
            },
            rollbackPolicy: {
              enabled: false,
              automatic: false,
              conditions: [],
              strategy: 'previous-version' as const,
            },
          },
          {
            id: 'deploy',
            name: 'Deploy Application',
            phase: 'deployment' as const,
            order: 2,
            dependsOn: ['build'],
            tasks: [
              {
                id: 'k8s-deploy',
                name: 'Deploy to Kubernetes',
                type: 'kubernetes-deploy' as const,
                configuration: {
                  namespace: 'production',
                  manifests: ['deployment.yaml', 'service.yaml', 'ingress.yaml'],
                  strategy: 'blue-green',
                },
                timeout: 20,
                retryAttempts: 3,
                continueOnError: false,
                runConditions: [],
              },
            ],
            conditions: [],
            timeout: 25,
            retryPolicy: {
              maxAttempts: 3,
              backoffStrategy: 'exponential' as const,
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
                  threshold: 10,
                  timeWindow: 300,
                },
              ],
              strategy: 'previous-version' as const,
            },
          },
          {
            id: 'verify',
            name: 'Verify Deployment',
            phase: 'verification' as const,
            order: 3,
            dependsOn: ['deploy'],
            tasks: [
              {
                id: 'health-check',
                name: 'Application Health Check',
                type: 'health-check' as const,
                configuration: {
                  checks: ['health-1'],
                  timeout: 300,
                },
                timeout: 10,
                retryAttempts: 5,
                continueOnError: false,
                runConditions: [],
              },
            ],
            conditions: [],
            timeout: 15,
            retryPolicy: {
              maxAttempts: 3,
              backoffStrategy: 'linear' as const,
              initialDelay: 30,
              maxDelay: 120,
              multiplier: 1,
            },
            rollbackPolicy: {
              enabled: true,
              automatic: true,
              conditions: [
                {
                  type: 'failure-rate',
                  threshold: 50,
                  timeWindow: 180,
                },
              ],
              strategy: 'previous-version' as const,
            },
          },
        ],
        triggers: [
          {
            id: 'manual-trigger',
            type: 'manual',
            configuration: {},
            isActive: true,
          },
          {
            id: 'git-trigger',
            type: 'git-push',
            configuration: {
              repository: 'https://github.com/example/web-app',
              branch: 'main',
              pathFilter: 'src/**',
            },
            isActive: true,
          },
        ],
        approvals: [],
        notifications: [
          {
            id: 'slack-notification',
            type: 'slack',
            recipients: ['#deployments'],
            events: ['deployment-started', 'deployment-completed', 'deployment-failed'],
            configuration: {
              webhook: 'https://hooks.slack.com/services/...',
            },
          },
        ],
        createdBy: 'user-1',
        isActive: true,
      };

      const pipeline = await services.pipelineService.createPipeline(pipelineData);
      expect(pipeline.id).toBeDefined();
      expect(pipeline.name).toBe('Web App Deployment');
      expect(pipeline.strategy).toBe('blue-green');
      expect(pipeline.stages).toHaveLength(3);

      // Step 2: Execute the deployment
      const deploymentRequest: DeploymentRequest = {
        pipelineId: pipeline.id,
        version: 'v1.2.3',
        triggeredBy: 'user-1',
        parameters: {
          environment: 'production',
          replicas: 3,
        },
        reason: 'Deploy new feature release',
      };

      const deploymentResult = await services.executionService.executeDeployment(deploymentRequest);
      expect(deploymentResult.success).toBe(true);
      expect(deploymentResult.executionId).toBeDefined();
      expect(deploymentResult.estimatedDuration).toBeGreaterThan(0);

      // Step 3: Monitor the deployment
      const executionId = deploymentResult.executionId!;
      
      // Wait a bit for execution to start
      await new Promise(resolve => setTimeout(resolve, 100));

      const execution = await services.executionService.getExecution(executionId);
      expect(execution).not.toBeNull();
      expect(execution!.status).toMatch(/pending|running/);
      expect(execution!.pipelineId).toBe(pipeline.id);
      expect(execution!.version).toBe('v1.2.3');
      expect(execution!.triggeredBy).toBe('user-1');

      // Step 4: Get deployment logs
      const logs = await services.executionService.getDeploymentLogs(executionId);
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].message).toContain('Deployment');
    });

    it('should handle deployment with approvals', async () => {
      // Create pipeline with approval requirement
      const pipelineData = {
        name: 'Production Deployment',
        organizationId: 'org-1',
        projectId: 'project-1',
        environmentId: 'production',
        applicationId: 'critical-app',
        strategy: 'canary' as DeploymentStrategy,
        configuration: {
          timeout: 60,
          retryAttempts: 3,
          rollbackOnFailure: true,
          requireApproval: true,
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
                id: 'k8s-deploy',
                name: 'Deploy to Kubernetes',
                type: 'kubernetes-deploy' as const,
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
              backoffStrategy: 'exponential' as const,
              initialDelay: 60,
              maxDelay: 600,
              multiplier: 2,
            },
            rollbackPolicy: {
              enabled: true,
              automatic: true,
              conditions: [],
              strategy: 'previous-version' as const,
            },
          },
        ],
        triggers: [],
        approvals: [
          {
            id: 'prod-approval',
            name: 'Production Deployment Approval',
            stage: 'deploy',
            approvers: ['manager-1', 'lead-dev-1'],
            requiredApprovals: 1,
            timeout: 3600, // 1 hour
            autoApprove: false,
            conditions: [],
          },
        ],
        notifications: [],
        createdBy: 'user-1',
        isActive: true,
      };

      const pipeline = await services.pipelineService.createPipeline(pipelineData);

      // Execute deployment (should succeed even with approval requirement for this test)
      const deploymentRequest: DeploymentRequest = {
        pipelineId: pipeline.id,
        version: 'v2.0.0',
        triggeredBy: 'user-1',
        approvalOverride: true, // Override approval for testing
        reason: 'Critical security update',
      };

      const result = await services.executionService.executeDeployment(deploymentRequest);
      expect(result.success).toBe(true);
    });

    it('should handle deployment cancellation', async () => {
      // Create simple pipeline
      const pipelineData = {
        name: 'Test Pipeline',
        organizationId: 'org-1',
        projectId: 'project-1',
        environmentId: 'test',
        applicationId: 'test-app',
        strategy: 'rolling' as DeploymentStrategy,
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
            phase: 'deployment' as const,
            order: 1,
            dependsOn: [],
            tasks: [
              {
                id: 'deploy-task',
                name: 'Deploy Application',
                type: 'script' as const,
                configuration: {},
                timeout: 30,
                retryAttempts: 2,
                continueOnError: false,
                runConditions: [],
              },
            ],
            conditions: [],
            timeout: 45,
            retryPolicy: {
              maxAttempts: 2,
              backoffStrategy: 'fixed' as const,
              initialDelay: 30,
              maxDelay: 60,
              multiplier: 1,
            },
            rollbackPolicy: {
              enabled: false,
              automatic: false,
              conditions: [],
              strategy: 'previous-version' as const,
            },
          },
        ],
        triggers: [],
        approvals: [],
        notifications: [],
        createdBy: 'user-1',
        isActive: true,
      };

      const pipeline = await services.pipelineService.createPipeline(pipelineData);

      // Start deployment
      const deploymentRequest: DeploymentRequest = {
        pipelineId: pipeline.id,
        version: 'v1.0.0',
        triggeredBy: 'user-1',
      };

      const deploymentResult = await services.executionService.executeDeployment(deploymentRequest);
      expect(deploymentResult.success).toBe(true);

      const executionId = deploymentResult.executionId!;

      // Cancel deployment
      const cancelResult = await services.executionService.cancelDeployment(
        executionId,
        'User requested cancellation'
      );
      expect(cancelResult.success).toBe(true);

      // Verify deployment is cancelled
      const execution = await services.executionService.getExecution(executionId);
      expect(execution!.status).toBe('cancelled');
    });
  });

  describe('deployment strategies', () => {
    it('should validate blue-green strategy configuration', async () => {
      const strategy = getDeploymentStrategy('blue-green');
      expect(strategy).not.toBeNull();

      const validConfig = {
        blueEnvironment: { name: 'blue' },
        greenEnvironment: { name: 'green' },
        loadBalancer: { type: 'nginx' },
        healthCheckTimeout: 60,
        trafficSwitchDelay: 30,
      };

      const errors = await strategy!.validate(validConfig);
      expect(errors).toHaveLength(0);

      const invalidConfig = {
        // Missing required fields
        healthCheckTimeout: 10, // Too low
        trafficSwitchDelay: -5, // Negative
      };

      const invalidErrors = await strategy!.validate(invalidConfig);
      expect(invalidErrors.length).toBeGreaterThan(0);
      expect(invalidErrors).toContain('Blue environment configuration is required');
      expect(invalidErrors).toContain('Green environment configuration is required');
      expect(invalidErrors).toContain('Load balancer configuration is required for traffic switching');
    });

    it('should validate canary strategy configuration', async () => {
      const strategy = getDeploymentStrategy('canary');
      expect(strategy).not.toBeNull();

      const validConfig = {
        canaryPercentage: 10,
        canaryDuration: 600,
        successCriteria: {
          errorRate: 2,
          responseTime: 1000,
          successRate: 98,
        },
        rollbackThreshold: 5,
      };

      const errors = await strategy!.validate(validConfig);
      expect(errors).toHaveLength(0);

      const invalidConfig = {
        canaryPercentage: 60, // Too high
        canaryDuration: 60, // Too low
        successCriteria: {
          errorRate: 150, // Invalid percentage
        },
        rollbackThreshold: -10, // Negative
      };

      const invalidErrors = await strategy!.validate(invalidConfig);
      expect(invalidErrors.length).toBeGreaterThan(0);
      expect(invalidErrors).toContain('Canary percentage must be between 1 and 50');
      expect(invalidErrors).toContain('Canary duration should be at least 5 minutes (300 seconds)');
    });

    it('should execute blue-green deployment', async () => {
      const strategy = getDeploymentStrategy('blue-green');
      expect(strategy).not.toBeNull();
      expect(strategy!.supportsRollback()).toBe(true);

      // Create mock execution
      const mockExecution = {
        id: 'exec-1',
        pipelineId: 'pipeline-1',
        version: 'v1.0.0',
        status: 'running' as const,
        strategy: 'blue-green' as const,
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

      const result = await strategy!.execute(mockExecution);
      expect(result.success).toBe(true);
      expect(result.executionId).toBe('exec-1');
      expect(mockExecution.logs.length).toBeGreaterThan(0);
    });

    it('should execute canary deployment', async () => {
      const strategy = getDeploymentStrategy('canary');
      expect(strategy).not.toBeNull();
      expect(strategy!.supportsRollback()).toBe(true);

      // Create mock execution
      const mockExecution = {
        id: 'exec-2',
        pipelineId: 'pipeline-2',
        version: 'v1.1.0',
        status: 'running' as const,
        strategy: 'canary' as const,
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

      const result = await strategy!.execute(mockExecution);
      expect(result.success).toBe(true);
      expect(result.executionId).toBe('exec-2');
      expect(mockExecution.logs.length).toBeGreaterThan(0);
    });
  });

  describe('deployment filtering and querying', () => {
    it('should filter deployments by various criteria', async () => {
      // Create multiple pipelines
      const pipeline1 = await services.pipelineService.createPipeline({
        name: 'Pipeline 1',
        organizationId: 'org-1',
        projectId: 'project-1',
        environmentId: 'staging',
        applicationId: 'app-1',
        strategy: 'rolling' as DeploymentStrategy,
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
            phase: 'deployment' as const,
            order: 1,
            dependsOn: [],
            tasks: [
              {
                id: 'task-1',
                name: 'Deploy Task',
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
              enabled: false,
              automatic: false,
              conditions: [],
              strategy: 'previous-version' as const,
            },
          },
        ],
        triggers: [],
        approvals: [],
        notifications: [],
        createdBy: 'user-1',
        isActive: true,
      });

      const pipeline2 = await services.pipelineService.createPipeline({
        name: 'Pipeline 2',
        organizationId: 'org-2',
        projectId: 'project-2',
        environmentId: 'production',
        applicationId: 'app-2',
        strategy: 'blue-green' as DeploymentStrategy,
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
            phase: 'deployment' as const,
            order: 1,
            dependsOn: [],
            tasks: [
              {
                id: 'task-1',
                name: 'Deploy Task',
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
              enabled: false,
              automatic: false,
              conditions: [],
              strategy: 'previous-version' as const,
            },
          },
        ],
        triggers: [],
        approvals: [],
        notifications: [],
        createdBy: 'user-2',
        isActive: true,
      });

      // Test filtering by organization
      const org1Pipelines = await services.pipelineService.getPipelines({
        organizationId: 'org-1',
      });
      expect(org1Pipelines).toHaveLength(1);
      expect(org1Pipelines[0].id).toBe(pipeline1.id);

      // Test filtering by strategy
      const blueGreenPipelines = await services.pipelineService.getPipelines({
        strategy: 'blue-green',
      });
      expect(blueGreenPipelines).toHaveLength(1);
      expect(blueGreenPipelines[0].id).toBe(pipeline2.id);

      // Test filtering by environment
      const prodPipelines = await services.pipelineService.getPipelines({
        environmentId: 'production',
      });
      expect(prodPipelines).toHaveLength(1);
      expect(prodPipelines[0].id).toBe(pipeline2.id);
    });
  });
});