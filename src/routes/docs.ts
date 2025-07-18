import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import { config } from '../config';
import { readOnlyRateLimit } from '../middleware/rateLimit';

const router = Router();

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CloudWeave API',
      version: '1.0.0',
      description: 'API documentation for the CloudWeave platform',
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
      contact: {
        name: 'API Support',
        url: 'https://cloudweave.example.com/support',
        email: 'support@example.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}${config.api.prefix}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/types/*.ts'],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

/**
 * @swagger
 * /api/v1/docs:
 *   get:
 *     summary: API Documentation
 *     description: Interactive API documentation using Swagger UI
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: HTML page with Swagger UI
 */
router.use('/', readOnlyRateLimit, swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
}));

/**
 * @swagger
 * /api/v1/docs/spec:
 *   get:
 *     summary: OpenAPI Specification
 *     description: Returns the OpenAPI specification as JSON
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: OpenAPI specification in JSON format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/spec', readOnlyRateLimit, (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

export default router;