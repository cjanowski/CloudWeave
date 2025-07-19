import request from 'supertest';
import express from 'express';
import Joi from 'joi';
import { validateRequest, commonSchemas, addRequestId, requestLogger } from './validation';
import { jest, describe, beforeEach, it, expect } from '@jest/globals';

describe('Validation Middleware', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('validateRequest', () => {
    it('should validate request body successfully', async () => {
      const schema = {
        body: Joi.object({
          name: Joi.string().required(),
          email: Joi.string().email().required(),
        }),
      };

      app.post('/test', validateRequest(schema), (req, res) => {
        res.json({ success: true, data: req.body });
      });

      const response = await request(app)
        .post('/test')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('John Doe');
    });

    it('should return validation error for invalid body', async () => {
      const schema = {
        body: Joi.object({
          name: Joi.string().required(),
          email: Joi.string().email().required(),
        }),
      };

      app.post('/test', validateRequest(schema), (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .post('/test')
        .send({
          name: 'John Doe',
          // Missing email
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toContain('Body: "email" is required');
    });

    it('should validate request parameters', async () => {
      const schema = {
        params: Joi.object({
          id: Joi.string().uuid().required(),
        }),
      };

      app.get('/test/:id', validateRequest(schema), (req, res) => {
        res.json({ success: true, id: req.params.id });
      });

      const response = await request(app)
        .get('/test/invalid-uuid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toContain('Params: "id" must be a valid GUID');
    });

    it('should validate query parameters', async () => {
      const schema = {
        query: Joi.object({
          page: Joi.number().integer().min(1).required(),
          limit: Joi.number().integer().min(1).max(100).required(),
        }),
      };

      app.get('/test', validateRequest(schema), (req, res) => {
        res.json({ success: true, query: req.query });
      });

      const response = await request(app)
        .get('/test?page=0&limit=200')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('commonSchemas', () => {
    it('should validate UUID parameters correctly', async () => {
      app.get('/test/:id', validateRequest({ params: commonSchemas.uuidParam }), (req, res) => {
        res.json({ success: true });
      });

      // Valid UUID should pass
      await request(app)
        .get('/test/550e8400-e29b-41d4-a716-446655440000')
        .expect(200);

      // Invalid UUID should fail
      await request(app)
        .get('/test/invalid-uuid')
        .expect(400);
    });

    it('should validate pagination query correctly', async () => {
      app.get('/test', validateRequest({ query: commonSchemas.paginationQuery }), (req, res) => {
        res.json({ success: true, query: req.query });
      });

      // Valid pagination should pass
      const response = await request(app)
        .get('/test?page=2&limit=25')
        .expect(200);

      expect(response.body.query.page).toBe('2');
      expect(response.body.query.limit).toBe('25');

      // Invalid pagination should fail
      await request(app)
        .get('/test?page=0&limit=200')
        .expect(400);
    });
  });

  describe('addRequestId', () => {
    it('should add request ID if not present', async () => {
      app.use(addRequestId);
      app.get('/test', (req, res) => {
        res.json({
          success: true,
          requestId: req.headers['x-request-id']
        });
      });

      const response = await request(app)
        .get('/test')
        .expect(200);

      expect(response.body.requestId).toBeDefined();
      expect(response.headers['x-request-id']).toBeDefined();
    });

    it('should preserve existing request ID', async () => {
      app.use(addRequestId);
      app.get('/test', (req, res) => {
        res.json({
          success: true,
          requestId: req.headers['x-request-id']
        });
      });

      const customRequestId = 'custom-request-id';
      const response = await request(app)
        .get('/test')
        .set('x-request-id', customRequestId)
        .expect(200);

      expect(response.body.requestId).toBe(customRequestId);
      expect(response.headers['x-request-id']).toBe(customRequestId);
    });
  });

  describe('requestLogger', () => {
    it('should log requests without errors', async () => {
      app.use(requestLogger);
      app.get('/test', (req, res) => {
        res.json({ success: true });
      });

      await request(app)
        .get('/test')
        .expect(200);

      // Test passes if no errors are thrown
    });
  });
});