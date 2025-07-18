import request from 'supertest';
import express from 'express';
import { configureApiGateway } from './apiGateway';

describe('API Gateway', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use('/api/v1', configureApiGateway());
  });

  describe('Health Endpoints', () => {
    it('should return 200 for health check', async () => {
      const response = await request(app).get('/api/v1/health');
      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('healthy');
    });

    it('should return 200 for service health check', async () => {
      const response = await request(app).get('/api/v1/health/services');
      expect(response.status).toBe(200);
      expect(response.body.data.services).toBeDefined();
    });
  });

  describe('API Status', () => {
    it('should return 200 for status endpoint', async () => {
      const response = await request(app).get('/api/v1/status');
      expect(response.status).toBe(200);
      expect(response.body.data.api.version).toBe('v1');
      expect(response.body.data.api.status).toBe('operational');
    });
  });

  describe('API Documentation', () => {
    it('should return 200 for docs spec endpoint', async () => {
      const response = await request(app).get('/api/v1/docs/spec');
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
    });
  });

  describe('Not Found Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/api/v1/non-existent-route');
      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });
});