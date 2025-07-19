import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import { config } from './config';
import { logger } from './utils/logger';
import { 
  addRequestId, 
  requestLogger 
} from './middleware/validation';
import { 
  apiVersioning 
} from './middleware/versioning';
import { 
  errorHandler, 
  notFoundHandler 
} from './middleware/errorHandler';
import { 
  apiRateLimit, 
  readOnlyRateLimit 
} from './middleware/rateLimit';

// Import route modules
import authRoutes from './routes/auth';
import rbacRoutes from './routes/rbac';
import healthRoutes from './routes/health';
import configurationRoutes from './routes/configuration';
import docsRoutes from './routes/docs';
import statusRoutes from './routes/status';

/**
 * Configure and return the API gateway router
 */
export const configureApiGateway = (): Router => {
  const router = Router();

  // Add common middleware
  router.use(addRequestId);
  router.use(requestLogger);
  router.use(apiVersioning);
  
  // API documentation routes
  router.use('/docs', docsRoutes);

  // Health check routes
  router.use('/health', healthRoutes);

  // API status routes
  router.use('/status', statusRoutes);

  // Authentication routes (with stricter rate limiting)
  router.use('/auth', apiRateLimit, authRoutes);

  // RBAC routes (with standard rate limiting)
  router.use('/rbac', apiRateLimit, rbacRoutes);

  // Configuration routes
  router.use('/config', apiRateLimit, configurationRoutes);

  // Future routes will be added here:
  // router.use('/infrastructure', apiRateLimit, infrastructureRoutes);
  // router.use('/deployments', apiRateLimit, deploymentRoutes);
  // router.use('/monitoring', readOnlyRateLimit, monitoringRoutes);
  // router.use('/security', apiRateLimit, securityRoutes);
  // router.use('/cost', readOnlyRateLimit, costRoutes);

  return router;
};