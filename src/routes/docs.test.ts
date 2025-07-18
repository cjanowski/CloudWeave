import request from 'supertest';
import express from 'express';
import docsRoutes from './docs';

describe('Documentation Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use('/docs', docsRoutes);
  });

  describe('GET /docs/spec', () => {
    it('should return 200 and OpenAPI specification', async () => {
      const response = await request(app).get('/docs/spec');
      
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
      expect(response.body.openapi).toBe('3.0.0');
      expect(response.body.info).toBeDefined();
      expect(response.body.paths).toBeDefined();
    });
  });

  // We can't easily test the Swagger UI endpoint since it returns HTML,
  // but we can at least check that it doesn't error out
  describe('GET /docs', () => {
    it('should return 200 for Swagger UI', async () => {
      const response = await request(app).get('/docs');
      
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/html');
    });
  });
});