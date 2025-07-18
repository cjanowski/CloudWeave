import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { authService } from '../services/authService';
import { authenticateToken } from '../middleware/auth';
import { LoginRequest, RegisterRequest, ApiResponse } from '../types';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().min(2).max(100).required(),
  organizationId: Joi.string().required(),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

// POST /auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      } as ApiResponse<never>);
    }

    const userData: RegisterRequest = value;
    const result = await authService.register(userData);

    res.status(201).json({
      success: true,
      data: result,
    } as ApiResponse<typeof result>);

  } catch (error) {
    logger.error('Registration error:', error);
    
    res.status(400).json({
      success: false,
      error: {
        code: 'REGISTRATION_FAILED',
        message: error instanceof Error ? error.message : 'Registration failed',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    } as ApiResponse<never>);
  }
});

// POST /auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      } as ApiResponse<never>);
    }

    const credentials: LoginRequest = value;
    const result = await authService.login(credentials);

    res.status(200).json({
      success: true,
      data: result,
    } as ApiResponse<typeof result>);

  } catch (error) {
    logger.error('Login error:', error);
    
    res.status(401).json({
      success: false,
      error: {
        code: 'LOGIN_FAILED',
        message: error instanceof Error ? error.message : 'Login failed',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    } as ApiResponse<never>);
  }
});

// POST /auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const { error, value } = refreshTokenSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      } as ApiResponse<never>);
    }

    const tokens = await authService.refreshToken(value.refreshToken);

    res.status(200).json({
      success: true,
      data: tokens,
    } as ApiResponse<typeof tokens>);

  } catch (error) {
    logger.error('Token refresh error:', error);
    
    res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_REFRESH_FAILED',
        message: error instanceof Error ? error.message : 'Token refresh failed',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    } as ApiResponse<never>);
  }
});

// POST /auth/logout
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const { error, value } = refreshTokenSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      } as ApiResponse<never>);
    }

    await authService.logout(value.refreshToken);

    res.status(200).json({
      success: true,
      data: { message: 'Logged out successfully' },
    } as ApiResponse<{ message: string }>);

  } catch (error) {
    logger.error('Logout error:', error);
    
    res.status(400).json({
      success: false,
      error: {
        code: 'LOGOUT_FAILED',
        message: error instanceof Error ? error.message : 'Logout failed',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    } as ApiResponse<never>);
  }
});

// GET /auth/me - Get current user info
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      } as ApiResponse<never>);
    }

    const user = await authService.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      } as ApiResponse<never>);
    }

    res.status(200).json({
      success: true,
      data: user,
    } as ApiResponse<typeof user>);

  } catch (error) {
    logger.error('Get user error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get user information',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    } as ApiResponse<never>);
  }
});

export default router;