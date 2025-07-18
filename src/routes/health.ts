import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { readOnlyRateLimit } from '../middleware/rateLimit';
import { logger } from '../utils/logger';
import { config } from '../config';
import { testConnection } from '../database/connection';

const router = Router();

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     summary: Get API health status
 *     description: Returns the health status of the API
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is healthy
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
 *                     status:
 *                       type: string
 *                       example: healthy
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     version:
 *                       type: string
 *                     environment:
 *                       type: string
 *                     uptime:
 *                       type: number
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: config.nodeEnv,
      uptime: process.uptime(),
    },
  });
});

/**
 * @swagger
 * /api/v1/health/services:
 *   get:
 *     summary: Get detailed service health status
 *     description: Returns the health status of all services in the system
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service health information
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
 *                     services:
 *                       type: object
 *                       additionalProperties:
 *                         type: object
 *                         properties:
 *                           status:
 *                             type: string
 *                             enum: [healthy, degraded, unhealthy]
 *                           details:
 *                             type: object
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 */
router.get('/services', readOnlyRateLimit, asyncHandler(async (req, res) => {
  try {
    // Check database connection
    const dbConnected = await testConnection();
    
    // In a real implementation, we would check the health of all services
    // For now, we'll just return a mock response with the database status
    res.status(200).json({
      success: true,
      data: {
        services: {
          api: { 
            status: 'healthy',
            details: {
              uptime: process.uptime(),
              memory: process.memoryUsage(),
            }
          },
          database: { 
            status: dbConnected ? 'healthy' : 'unhealthy',
            details: {
              connection: dbConnected ? 'connected' : 'disconnected',
            }
          },
          auth: { 
            status: 'healthy',
            details: {
              provider: 'jwt',
            }
          },
          // Add more services as they are implemented
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Error checking service health:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: 'Failed to check service health',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
  }
}));

/**
 * @swagger
 * /api/v1/health/metrics:
 *   get:
 *     summary: Get API metrics
 *     description: Returns metrics about API usage and performance
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API metrics
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
 *                     requestCount:
 *                       type: number
 *                     errorCount:
 *                       type: number
 *                     averageResponseTime:
 *                       type: number
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 */
router.get('/metrics', readOnlyRateLimit, asyncHandler(async (req, res) => {
  // In a real implementation, we would collect metrics from a monitoring system
  // For now, we'll just return mock data
  res.status(200).json({
    success: true,
    data: {
      requestCount: 1000,
      errorCount: 5,
      averageResponseTime: 120,
      timestamp: new Date().toISOString(),
    },
  });
}));

export default router;