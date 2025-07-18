import { Router } from 'express';
import { readOnlyRateLimit } from '../middleware/rateLimit';
import { config } from '../config';

const router = Router();

/**
 * @swagger
 * /api/v1/status:
 *   get:
 *     summary: Get API status
 *     description: Returns the status of the API and available endpoints
 *     tags: [Status]
 *     responses:
 *       200:
 *         description: API status information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     api:
 *                       type: object
 *                       properties:
 *                         version:
 *                           type: string
 *                         status:
 *                           type: string
 *                         endpoints:
 *                           type: object
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 */
router.get('/', readOnlyRateLimit, (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      api: {
        version: 'v1',
        status: 'operational',
        endpoints: {
          auth: '/auth',
          rbac: '/rbac',
          health: '/health',
          status: '/status',
          docs: '/docs',
        },
      },
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * @swagger
 * /api/v1/status/version:
 *   get:
 *     summary: Get API version
 *     description: Returns detailed version information about the API
 *     tags: [Status]
 *     responses:
 *       200:
 *         description: API version information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     version:
 *                       type: string
 *                     apiVersion:
 *                       type: string
 *                     nodeVersion:
 *                       type: string
 *                     environment:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 */
router.get('/version', readOnlyRateLimit, (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      version: process.env.npm_package_version || '1.0.0',
      apiVersion: 'v1',
      nodeVersion: process.version,
      environment: config.nodeEnv,
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;