import { Router } from 'express';
import { configureApiGateway } from '../apiGateway';
import { notFoundHandler } from '../middleware/errorHandler';

// Create and configure the API gateway
const router = configureApiGateway();

// Catch-all for undefined API routes
router.use('*', notFoundHandler);

export default router;