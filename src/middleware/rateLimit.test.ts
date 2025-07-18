import request from 'supertest';
import express from 'express';
import { createRateLimit, apiRateLimit, authRateLimit } from './rateLimit';

describe('Rate Limiting Middleware', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('createRateLimit', () => {
    it('should create rate limiter with default options', async () => {
      const rateLimiter = createRateLimit({
        windowMs: 1000, // 1 second
        max: 2, // 2 requests
      });

      app.use('/test', rateLimiter);
      app.get('/test', (req, res) => {
        res.json({ success: true });
      });

      // First request should succeed
      await request(app)
        .get('/test')
        .expect(200);

      // Second request should succeed
      await request(app)
        .get('/test')
        .expect(200);

      // Third request should be rate limited
      const response = await request(app)
        .get('/test')
        .expect(429);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should include rate limit headers', async () => {
      const rateLimiter = createRateLimit({
        windowMs: 1000,
        max: 5,
      });

      app.use('/test', rateLimiter);
      app.get('/test', (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/test')
        .expect(200);

      expect(response.headers['ratelimit-limit']).toBeDefined();
      expect(response.headers['ratelimit-remaining']).toBeDefined();
      expect(response.headers['ratelimit-reset']).toBeDefined();
    });
  });

  describe('authRateLimit', () => {
    it('should have stricter limits for auth endpoints', async () => {
      app.use('/auth', authRateLimit);
      app.post('/auth/login', (req, res) => {
        res.json({ success: true });
      });

      // Make requests up to the limit
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/auth/login')
          .send({ email: 'test@example.com', password: 'password' })
          .expect(200);
      }

      // Next request should be rate limited
      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'password' })
        .expect(429);

      expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });

  describe('apiRateLimit', () => {
    it('should allow more requests for general API endpoints', async () => {
      app.use('/api', apiRateLimit);
      app.get('/api/test', (req, res) => {
        res.json({ success: true });
      });

      // Should allow many more requests than auth endpoints
      for (let i = 0; i < 10; i++) {
        await request(app)
          .get('/api/test')
          .expect(200);
      }
    });
  });
});