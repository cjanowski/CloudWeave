import request from 'supertest';
import express from 'express';
import healthRoutes from './health';

describe('Health Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use('/health', healthRoutes);
  });

  describe('GET /health', () => {
    it('should return 200 and healthy status', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.timestamp).toBeDefined();
      expect(response.body.data.version).toBeDefined();
      expect(response.body.data.environment).toBeDefined();
      expect(response.body.data.uptime).toBeDefined();
    });
  });

  describe('GET /health/services', () => {
    it('should return 200 and service health information', async () => {
      const response = await request(app).get('/health/services');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.services).toBeDefined();
      expect(response.body.data.services.api).toBeDefined();
      expect(response.body.data.services.database).toBeDefined();
      expect(response.body.data.timestamp).toBeDefined();
    });
  });

  describe('GET /health/metrics', () => {
    it('should return 200 and API metrics', async () => {
      const response = await request(app).get('/health/metrics');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.requestCount).toBeDefined();
      expect(response.body.data.errorCount).toBeDefined();
      expect(response.body.data.averageResponseTime).toBeDefined();
      expect(response.body.data.timestamp).toBeDefined();
    });
  });
});