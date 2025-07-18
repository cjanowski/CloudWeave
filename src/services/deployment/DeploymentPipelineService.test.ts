import { DeploymentPipelineService } from './DeploymentPipelineService';
import { DeploymentPipeline, DeploymentStrategy } from './types';

describe('DeploymentPipelineService', () => {
  let service: DeploymentPipelineService;

  beforeEach(() => {
    service = new DeploymentPipelineService();
  });

  describe('pipeline creation', () => {
    it('should create a valid pipeline', async () => {
      const pipelineData = {
        name: 'Test Pipeline',
        description: 'A test deployment pipeline',
        organizationId: 'org-1',
        projectId: 'project-1',
        environmentId: 'env-1',
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
            id: 'build',
            name: 'Build',
            phase: 'pre-deployment' as const,
            order: 1,
            dependsOn: [],
            tasks: [
              {
                id: 'docker-build',
                name: 'Build Docker Image',
                type: 'docker-build' as const,
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
        ],
        triggers: [],
        approvals: [],
        notifications: [],
        createdBy: 'user-1',
        isActive: true,
      };

      const pipeline = await service.createPipeline(pipelineData);

      expect(pipeline.id).toBeDefined();
      expect(pipeline.name).toBe('Test Pipeline');
      expect(pipeline.strategy).toBe('rolling');
      expect(pipeline.stages).toHaveLength(1);
      expect(pipeline.stages[0].id).toBeDefined();
      expect(pipeline.stages[0].tasks[0].id).toBeDefined();
      expect(pipeline.createdAt).toBeDefined();
      expect(pipeline.updatedAt).toBeDefined();
    });

    it('should validate pipeline configuration', async () => {
      const invalidPipelineData = {
        name: '', // Invalid - empty name
        organizationId: 'org-1',
        projectId: 'project-1',
        environmentId: 'env-1',
        applicationId: 'app-1',
        strategy: 'invalid-strategy' as DeploymentStrategy, // Invalid strategy
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
        stages: [], // Invalid - no stages
        triggers: [],
        approvals: [],
        notifications: [],
        createdBy: 'user-1',
        isActive: true,
      };

      await expect(service.createPipeline(invalidPipelineData)).rejects.toThrow('Pipeline validation failed');
    });

    it('should sort stages by order', async () => {
      const pipelineData = {
        name: 'Test Pipeline',
        organizationId: 'org-1',
        projectId: 'project-1',
        environmentId: 'env-1',
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
            order: 2,
            dependsOn: ['build'],
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
          {
            id: 'build',
            name: 'Build',
            phase: 'pre-deployment' as const,
            order: 1,
            dependsOn: [],
            tasks: [
              {
                id: 'docker-build',
                name: 'Build Docker Image',
                type: 'docker-build' as const,
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
        ],
        triggers: [],
        approvals: [],
        notifications: [],
        createdBy: 'user-1',
        isActive: true,
      };

      const pipeline = await service.createPipeline(pipelineData);

      expect(pipeline.stages[0].name).toBe('Build'); // Should be first due to order: 1
      expect(pipeline.stages[1].name).toBe('Deploy'); // Should be second due to order: 2
    });
  });

  describe('pipeline retrieval', () => {
    let testPipeline: DeploymentPipeline;

    beforeEach(async () => {
      const pipelineData = {
        name: 'Test Pipeline',
        organizationId: 'org-1',
        projectId: 'project-1',
        environmentId: 'env-1',
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
            id: 'build',
            name: 'Build',
            phase: 'pre-deployment' as const,
            order: 1,
            dependsOn: [],
            tasks: [
              {
                id: 'docker-build',
                name: 'Build Docker Image',
                type: 'docker-build' as const,
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
        ],
        triggers: [],
        approvals: [],
        notifications: [],
        createdBy: 'user-1',
        isActive: true,
      };

      testPipeline = await service.createPipeline(pipelineData);
    });

    it('should get pipeline by ID', async () => {
      const pipeline = await service.getPipeline(testPipeline.id);
      
      expect(pipeline).not.toBeNull();
      expect(pipeline!.id).toBe(testPipeline.id);
      expect(pipeline!.name).toBe('Test Pipeline');
    });

    it('should return null for non-existent pipeline', async () => {
      const pipeline = await service.getPipeline('non-existent-id');
      expect(pipeline).toBeNull();
    });

    it('should get all pipelines', async () => {
      const pipelines = await service.getPipelines();
      
      expect(pipelines).toHaveLength(1);
      expect(pipelines[0].id).toBe(testPipeline.id);
    });

    it('should filter pipelines by organization', async () => {
      const pipelines = await service.getPipelines({
        organizationId: 'org-1',
      });
      
      expect(pipelines).toHaveLength(1);
      expect(pipelines[0].organizationId).toBe('org-1');
    });

    it('should filter pipelines by strategy', async () => {
      const pipelines = await service.getPipelines({
        strategy: 'rolling',
      });
      
      expect(pipelines).toHaveLength(1);
      expect(pipelines[0].strategy).toBe('rolling');
    });
  });

  describe('pipeline updates', () => {
    let testPipeline: DeploymentPipeline;

    beforeEach(async () => {
      const pipelineData = {
        name: 'Test Pipeline',
        organizationId: 'org-1',
        projectId: 'project-1',
        environmentId: 'env-1',
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
            id: 'build',
            name: 'Build',
            phase: 'pre-deployment' as const,
            order: 1,
            dependsOn: [],
            tasks: [
              {
                id: 'docker-build',
                name: 'Build Docker Image',
                type: 'docker-build' as const,
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
        ],
        triggers: [],
        approvals: [],
        notifications: [],
        createdBy: 'user-1',
        isActive: true,
      };

      testPipeline = await service.createPipeline(pipelineData);
    });

    it('should update pipeline successfully', async () => {
      const updates = {
        name: 'Updated Pipeline',
        description: 'Updated description',
      };

      const updatedPipeline = await service.updatePipeline(testPipeline.id, updates);

      expect(updatedPipeline.name).toBe('Updated Pipeline');
      expect(updatedPipeline.description).toBe('Updated description');
      expect(updatedPipeline.id).toBe(testPipeline.id); // ID should not change
      expect(updatedPipeline.createdAt).toEqual(testPipeline.createdAt); // Created date should not change
      expect(updatedPipeline.updatedAt.getTime()).toBeGreaterThan(testPipeline.updatedAt.getTime());
    });

    it('should validate updates', async () => {
      const invalidUpdates = {
        name: '', // Invalid - empty name
      };

      await expect(service.updatePipeline(testPipeline.id, invalidUpdates)).rejects.toThrow('Pipeline validation failed');
    });

    it('should handle non-existent pipeline updates', async () => {
      const updates = { name: 'Updated Pipeline' };

      await expect(service.updatePipeline('non-existent-id', updates)).rejects.toThrow('Pipeline non-existent-id not found');
    });
  });

  describe('pipeline activation', () => {
    let testPipeline: DeploymentPipeline;

    beforeEach(async () => {
      const pipelineData = {
        name: 'Test Pipeline',
        organizationId: 'org-1',
        projectId: 'project-1',
        environmentId: 'env-1',
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
            id: 'build',
            name: 'Build',
            phase: 'pre-deployment' as const,
            order: 1,
            dependsOn: [],
            tasks: [
              {
                id: 'docker-build',
                name: 'Build Docker Image',
                type: 'docker-build' as const,
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
        ],
        triggers: [],
        approvals: [],
        notifications: [],
        createdBy: 'user-1',
        isActive: true,
      };

      testPipeline = await service.createPipeline(pipelineData);
    });

    it('should deactivate pipeline', async () => {
      await service.setPipelineActive(testPipeline.id, false);
      
      const pipeline = await service.getPipeline(testPipeline.id);
      expect(pipeline!.isActive).toBe(false);
    });

    it('should activate pipeline', async () => {
      await service.setPipelineActive(testPipeline.id, false);
      await service.setPipelineActive(testPipeline.id, true);
      
      const pipeline = await service.getPipeline(testPipeline.id);
      expect(pipeline!.isActive).toBe(true);
    });
  });

  describe('pipeline deletion', () => {
    let testPipeline: DeploymentPipeline;

    beforeEach(async () => {
      const pipelineData = {
        name: 'Test Pipeline',
        organizationId: 'org-1',
        projectId: 'project-1',
        environmentId: 'env-1',
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
            id: 'build',
            name: 'Build',
            phase: 'pre-deployment' as const,
            order: 1,
            dependsOn: [],
            tasks: [
              {
                id: 'docker-build',
                name: 'Build Docker Image',
                type: 'docker-build' as const,
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
        ],
        triggers: [],
        approvals: [],
        notifications: [],
        createdBy: 'user-1',
        isActive: true,
      };

      testPipeline = await service.createPipeline(pipelineData);
    });

    it('should delete pipeline successfully', async () => {
      await service.deletePipeline(testPipeline.id);
      
      const pipeline = await service.getPipeline(testPipeline.id);
      expect(pipeline).toBeNull();
    });

    it('should handle non-existent pipeline deletion', async () => {
      await expect(service.deletePipeline('non-existent-id')).rejects.toThrow('Pipeline non-existent-id not found');
    });
  });

  describe('pipeline templates', () => {
    it('should return pipeline templates', async () => {
      const templates = await service.getPipelineTemplates();
      
      expect(templates).toHaveLength(1);
      expect(templates[0].name).toBe('Basic Web Application');
      expect(templates[0].strategy).toBe('rolling');
      expect(templates[0].stages).toHaveLength(2);
    });
  });
});