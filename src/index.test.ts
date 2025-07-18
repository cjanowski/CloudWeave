import request from 'supertest';
import app from './index';

describe('Cloud Platform App', () => {
  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'healthy',
        timestamp: expect.any(String),
        version: expect.any(String),
      });
    });
  });

  describe('API Routes', () => {
    it('should return 404 for non-existent API endpoints', async () => {
      const response = await request(app)
        .get('/api/v1/non-existent')
        .expect(404);

      expect(response.body.error).toEqual({
        code: 'NOT_FOUND',
        message: 'API endpoint not found',
        timestamp: expect.any(String),
        requestId: expect.any(String),
      });
    });
  });
});