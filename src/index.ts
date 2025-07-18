import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config';
import { logger } from './utils/logger';
import { testConnection } from './database/connection';
import { apiVersioning } from './middleware/versioning';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import apiRoutes from './routes';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.security.corsOrigin,
  credentials: true,
}));

// General middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API versioning middleware
app.use('/api', apiVersioning);

// API routes with proper gateway
app.use(config.api.prefix, apiRoutes);

// 404 handler for unmatched routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(config.port, async () => {
    logger.info(`CloudWeave started on port ${config.port}`);
    logger.info(`Environment: ${config.nodeEnv}`);
    logger.info(`API prefix: ${config.api.prefix}`);
    
    // Test database connection
    const dbConnected = await testConnection();
    if (dbConnected) {
      logger.info('✅ Database connection established');
    } else {
      logger.warn('⚠️  Database connection failed - some features may not work');
    }
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
      logger.info('Process terminated');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    server.close(() => {
      logger.info('Process terminated');
      process.exit(0);
    });
  });
}

export default app;