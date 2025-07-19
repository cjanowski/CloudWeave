import request from 'supertest';
import { app } from '../../src/index';
import { setupTestDatabase, cleanupTestDatabase } from '../helpers/database';

describe('API Integration Tests', () => {
  let authToken: string;
  let organizationId: string;
  let projectId: string;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('Authentication API', () => {
    test('POST /api/v1/auth/register - should register new organization and admin user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          organizationName: 'Test Organization',
          adminEmail: 'admin@test.com',
          adminPassword: 'TestPassword123!',
          adminPasswordConfirm: 'TestPassword123!'
        })
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('organization');
      
      authToken = response.body.token;
      organizationId = response.body.organization.id;
    });

    test('POST /api/v1/auth/login - should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'TestPassword123!'
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
    });

    test('POST /api/v1/auth/login - should reject invalid credentials', async () => {
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'wrongpassword'
        })
        .expect(401);
    });

    test('GET /api/v1/auth/me - should return current user info', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email', 'admin@test.com');
    });

    test('POST /api/v1/auth/logout - should logout user', async () => {
      await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('Infrastructure API', () => {
    beforeEach(async () => {
      // Re-login to get fresh token
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'TestPassword123!'
        });
      authToken = loginResponse.body.token;
    });

    test('GET /api/v1/infrastructure/resources - should list infrastructure resources', async () => {
      const response = await request(app)
        .get('/api/v1/infrastructure/resources')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('resources');
      expect(Array.isArray(response.body.resources)).toBe(true);
    });

    test('POST /api/v1/infrastructure/resources - should create new resource', async () => {
      const resourceData = {
        name: 'test-server',
        type: 'ec2-instance',
        cloudProvider: 'aws',
        region: 'us-east-1',
        configuration: {
          instanceType: 't3.micro',
          imageId: 'ami-12345678'
        },
        tags: {
          environment: 'test',
          project: 'cloudweave'
        }
      };

      const response = await request(app)
        .post('/api/v1/infrastructure/resources')
        .set('Authorization', `Bearer ${authToken}`)
        .send(resourceData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'test-server');
      expect(response.body).toHaveProperty('status', 'pending');
    });

    test('GET /api/v1/infrastructure/resources/:id - should get resource by ID', async () => {
      // First create a resource
      const createResponse = await request(app)
        .post('/api/v1/infrastructure/resources')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'test-resource',
          type: 'ec2-instance',
          cloudProvider: 'aws',
          region: 'us-east-1',
          configuration: {}
        });

      const resourceId = createResponse.body.id;

      // Then get it by ID
      const response = await request(app)
        .get(`/api/v1/infrastructure/resources/${resourceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', resourceId);
      expect(response.body).toHaveProperty('name', 'test-resource');
    });

    test('PUT /api/v1/infrastructure/resources/:id - should update resource', async () => {
      // First create a resource
      const createResponse = await request(app)
        .post('/api/v1/infrastructure/resources')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'test-resource',
          type: 'ec2-instance',
          cloudProvider: 'aws',
          region: 'us-east-1',
          configuration: {}
        });

      const resourceId = createResponse.body.id;

      // Then update it
      const updateData = {
        name: 'updated-resource',
        configuration: {
          instanceType: 't3.small'
        }
      };

      const response = await request(app)
        .put(`/api/v1/infrastructure/resources/${resourceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('name', 'updated-resource');
    });

    test('DELETE /api/v1/infrastructure/resources/:id - should delete resource', async () => {
      // First create a resource
      const createResponse = await request(app)
        .post('/api/v1/infrastructure/resources')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'test-resource',
          type: 'ec2-instance',
          cloudProvider: 'aws',
          region: 'us-east-1',
          configuration: {}
        });

      const resourceId = createResponse.body.id;

      // Then delete it
      await request(app)
        .delete(`/api/v1/infrastructure/resources/${resourceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Verify it's deleted
      await request(app)
        .get(`/api/v1/infrastructure/resources/${resourceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Deployment API', () => {
    beforeEach(async () => {
      // Re-login to get fresh token
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'TestPassword123!'
        });
      authToken = loginResponse.body.token;
    });

    test('GET /api/v1/deployments/pipelines - should list deployment pipelines', async () => {
      const response = await request(app)
        .get('/api/v1/deployments/pipelines')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('pipelines');
      expect(Array.isArray(response.body.pipelines)).toBe(true);
    });

    test('POST /api/v1/deployments/pipelines - should create deployment pipeline', async () => {
      const pipelineData = {
        name: 'test-pipeline',
        description: 'Test deployment pipeline',
        sourceRepository: 'https://github.com/test/repo',
        branch: 'main',
        deploymentStrategy: 'blue-green',
        targetEnvironment: 'staging',
        configuration: {
          buildCommand: 'npm run build',
          testCommand: 'npm test'
        }
      };

      const response = await request(app)
        .post('/api/v1/deployments/pipelines')
        .set('Authorization', `Bearer ${authToken}`)
        .send(pipelineData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'test-pipeline');
      expect(response.body).toHaveProperty('status', 'active');
    });

    test('POST /api/v1/deployments/pipelines/:id/trigger - should trigger deployment', async () => {
      // First create a pipeline
      const createResponse = await request(app)
        .post('/api/v1/deployments/pipelines')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'test-pipeline',
          sourceRepository: 'https://github.com/test/repo',
          deploymentStrategy: 'rolling',
          targetEnvironment: 'staging'
        });

      const pipelineId = createResponse.body.id;

      // Then trigger deployment
      const triggerData = {
        branch: 'main',
        commitSha: 'abc123',
        notes: 'Test deployment'
      };

      const response = await request(app)
        .post(`/api/v1/deployments/pipelines/${pipelineId}/trigger`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(triggerData)
        .expect(201);

      expect(response.body).toHaveProperty('deploymentId');
      expect(response.body).toHaveProperty('status', 'pending');
    });

    test('GET /api/v1/deployments/history - should list deployment history', async () => {
      const response = await request(app)
        .get('/api/v1/deployments/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('deployments');
      expect(Array.isArray(response.body.deployments)).toBe(true);
    });
  });

  describe('Monitoring API', () => {
    beforeEach(async () => {
      // Re-login to get fresh token
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'TestPassword123!'
        });
      authToken = loginResponse.body.token;
    });

    test('GET /api/v1/monitoring/metrics - should get system metrics', async () => {
      const response = await request(app)
        .get('/api/v1/monitoring/metrics')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          timeRange: '1h',
          metrics: 'cpu,memory,network'
        })
        .expect(200);

      expect(response.body).toHaveProperty('metrics');
      expect(response.body.metrics).toHaveProperty('cpu');
      expect(response.body.metrics).toHaveProperty('memory');
      expect(response.body.metrics).toHaveProperty('network');
    });

    test('GET /api/v1/monitoring/alerts - should list alerts', async () => {
      const response = await request(app)
        .get('/api/v1/monitoring/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('alerts');
      expect(Array.isArray(response.body.alerts)).toBe(true);
    });

    test('POST /api/v1/monitoring/alerts - should create alert rule', async () => {
      const alertData = {
        name: 'High CPU Alert',
        description: 'Alert when CPU usage exceeds 80%',
        metric: 'cpu_usage',
        condition: 'greater_than',
        threshold: 80,
        severity: 'warning',
        notifications: {
          email: ['alerts@test.com'],
          webhook: ['https://hooks.slack.com/test']
        }
      };

      const response = await request(app)
        .post('/api/v1/monitoring/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(alertData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'High CPU Alert');
      expect(response.body).toHaveProperty('status', 'active');
    });
  });

  describe('Error Handling', () => {
    test('should return 401 for requests without authentication', async () => {
      await request(app)
        .get('/api/v1/infrastructure/resources')
        .expect(401);
    });

    test('should return 403 for insufficient permissions', async () => {
      // Create a user with limited permissions
      const limitedUserResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          organizationName: 'Limited Org',
          adminEmail: 'limited@test.com',
          adminPassword: 'TestPassword123!',
          adminPasswordConfirm: 'TestPassword123!'
        });

      const limitedToken = limitedUserResponse.body.token;

      // Try to access admin-only endpoint
      await request(app)
        .delete('/api/v1/infrastructure/resources/123')
        .set('Authorization', `Bearer ${limitedToken}`)
        .expect(403);
    });

    test('should return 404 for non-existent resources', async () => {
      await request(app)
        .get('/api/v1/infrastructure/resources/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    test('should return 400 for invalid request data', async () => {
      await request(app)
        .post('/api/v1/infrastructure/resources')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing required fields
          name: '',
          type: 'invalid-type'
        })
        .expect(400);
    });

    test('should return 429 for rate limit exceeded', async () => {
      // Make multiple rapid requests to trigger rate limiting
      const requests = Array(20).fill(null).map(() =>
        request(app)
          .get('/api/v1/infrastructure/resources')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});