import request from 'supertest';
import express from 'express';
import statusRoutes from './status';

describe('Status Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use('/status', statusRoutes);
  });

  describe('GET /status', () => {
    it('should return 200 and API status information', async () => {
      const response = await request(app).get('/status');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.api).toBeDefined();
      expect(response.body.data.api.version).toBe('v1');
      expect(response.body.data.api.status).toBe('operational');
      expect(response.body.data.api.endpoints).toBeDefined();
      expect(response.body.data.timestamp).toBeDefined();
    });
  });

  describe('GET /status/version', () => {
    it('should return 200 and API version information', async () => {
      const response = await request(app).get('/status/version');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.version).toBeDefined();
      expect(response.body.data.apiVersion).toBe('v1');
      expect(response.body.data.nodeVersion).toBeDefined();
      expect(response.body.data.environment).toBeDefined();
      expect(response.body.data.timestamp).toBeDefined();
    });
  });
});