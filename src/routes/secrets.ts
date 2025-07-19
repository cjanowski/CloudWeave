import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { SecretsService, VaultConnector, SecretsRepository } from '../services/configuration';
import { SecretRotationService, SecretAccessControl } from '../services/configuration';
import { authMiddleware } from '../middleware/auth';
import { rbacMiddleware } from '../middleware/rbac';
import { VaultConfig } from '../services/configuration/secrets/types';

const router = Router();

// Initialize services (this would typically be done via dependency injection)
const vaultConfig: VaultConfig = {
  endpoint: process.env.VAULT_ENDPOINT || 'http://localhost:8200',
  token: process.env.VAULT_TOKEN,
  mountPath: process.env.VAULT_MOUNT_PATH || 'secret',
};

const vaultConnector = new VaultConnector(vaultConfig);
const secretsRepository = new SecretsRepository({} as any); // Database connection would be injected
const rotationService = new SecretRotationService({} as any, secretsRepository);
const accessControl = new SecretAccessControl(secretsRepository, vaultConnector);
const secretsService = new SecretsService(vaultConnector, secretsRepository, rotationService, accessControl);

// Apply authentication to all routes
router.use(authMiddleware);

/**
 * @route POST /api/v1/secrets
 * @desc Create a new secret
 * @access Private
 */
router.post(
  '/',
  [
    rbacMiddleware(['secrets:create']),
    body('name').notEmpty().withMessage('Name is required'),
    body('type').isIn(['password', 'api_key', 'certificate', 'private_key', 'database_credential', 'oauth_token', 'custom'])
      .withMessage('Invalid secret type'),
    body('environmentId').isUUID().withMessage('Valid environment ID is required'),
    body('value').notEmpty().withMessage('Secret value is required'),
    body('description').optional().isString(),
    body('rotationConfig').optional().isObject(),
    body('tags').optional().isObject(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array(),
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'],
          },
        });
      }

      const { value, ...secretData } = req.body;
      const userId = (req as any).user.id;

      // Create secret record
      const secret = await secretsService.createSecret({
        ...secretData,
        createdBy: userId,
        accessPolicies: [],
        metadata: {
          size: Buffer.byteLength(value, 'utf8'),
          encoding: 'utf8',
          checksum: '',
        },
      });

      // Set the secret value
      await secretsService.setSecretValue(secret.id, value);

      res.status(201).json({
        data: {
          ...secret,
          // Never return the actual secret value in API responses
          value: undefined,
        },
      });
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create secret',
          details: { error: error.message },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'],
        },
      });
    }
  }
);

/**
 * @route GET /api/v1/secrets
 * @desc List secrets with optional filtering
 * @access Private
 */
router.get(
  '/',
  [
    rbacMiddleware(['secrets:list']),
    query('environmentId').optional().isUUID(),
    query('type').optional().isIn(['password', 'api_key', 'certificate', 'private_key', 'database_credential', 'oauth_token', 'custom']),
    query('search').optional().isString(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: errors.array(),
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'],
          },
        });
      }

      const { environmentId, type, search } = req.query;
      const filter = {
        ...(environmentId && { environmentId: environmentId as string }),
        ...(type && { type: type as any }),
      };

      let secrets;
      if (search) {
        secrets = await secretsService.searchSecrets(search as string, filter);
      } else {
        secrets = await secretsService.listSecrets(filter);
      }

      res.json({
        data: secrets.map(secret => ({
          ...secret,
          // Never return the actual secret value in list responses
          value: undefined,
        })),
      });
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list secrets',
          details: { error: error.message },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'],
        },
      });
    }
  }
);

/**
 * @route GET /api/v1/secrets/:id
 * @desc Get secret metadata (not the value)
 * @access Private
 */
router.get(
  '/:id',
  [
    rbacMiddleware(['secrets:read']),
    param('id').isUUID().withMessage('Valid secret ID is required'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid parameters',
            details: errors.array(),
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'],
          },
        });
      }

      const secret = await secretsService.getSecret(req.params.id);
      if (!secret) {
        return res.status(404).json({
          error: {
            code: 'SECRET_NOT_FOUND',
            message: 'Secret not found',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'],
          },
        });
      }

      res.json({
        data: {
          ...secret,
          // Never return the actual secret value
          value: undefined,
        },
      });
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get secret',
          details: { error: error.message },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'],
        },
      });
    }
  }
);

/**
 * @route GET /api/v1/secrets/:id/value
 * @desc Get secret value (requires special permission)
 * @access Private
 */
router.get(
  '/:id/value',
  [
    rbacMiddleware(['secrets:read_value']),
    param('id').isUUID().withMessage('Valid secret ID is required'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid parameters',
            details: errors.array(),
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'],
          },
        });
      }

      const value = await secretsService.getSecretValue(req.params.id);

      res.json({
        data: { value },
      });
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: {
            code: 'SECRET_NOT_FOUND',
            message: 'Secret not found',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'],
          },
        });
      }

      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get secret value',
          details: { error: error.message },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'],
        },
      });
    }
  }
);

/**
 * @route PUT /api/v1/secrets/:id/value
 * @desc Update secret value
 * @access Private
 */
router.put(
  '/:id/value',
  [
    rbacMiddleware(['secrets:update']),
    param('id').isUUID().withMessage('Valid secret ID is required'),
    body('value').notEmpty().withMessage('Secret value is required'),
    body('metadata').optional().isObject(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array(),
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'],
          },
        });
      }

      const { value, metadata } = req.body;
      const version = await secretsService.setSecretValue(req.params.id, value, metadata);

      res.json({
        data: {
          version: version.version,
          createdAt: version.createdAt,
        },
      });
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: {
            code: 'SECRET_NOT_FOUND',
            message: 'Secret not found',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'],
          },
        });
      }

      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update secret value',
          details: { error: error.message },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'],
        },
      });
    }
  }
);

/**
 * @route POST /api/v1/secrets/:id/rotate
 * @desc Rotate secret value
 * @access Private
 */
router.post(
  '/:id/rotate',
  [
    rbacMiddleware(['secrets:rotate']),
    param('id').isUUID().withMessage('Valid secret ID is required'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid parameters',
            details: errors.array(),
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'],
          },
        });
      }

      const secret = await secretsService.rotateSecret(req.params.id);

      res.json({
        data: {
          id: secret.id,
          version: secret.version,
          lastRotatedAt: secret.lastRotatedAt,
        },
      });
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: {
            code: 'SECRET_NOT_FOUND',
            message: 'Secret not found',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'],
          },
        });
      }

      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to rotate secret',
          details: { error: error.message },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'],
        },
      });
    }
  }
);

/**
 * @route GET /api/v1/secrets/:id/versions
 * @desc Get secret versions
 * @access Private
 */
router.get(
  '/:id/versions',
  [
    rbacMiddleware(['secrets:read']),
    param('id').isUUID().withMessage('Valid secret ID is required'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid parameters',
            details: errors.array(),
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'],
          },
        });
      }

      const versions = await secretsService.getSecretVersions(req.params.id);

      res.json({
        data: versions.map(version => ({
          ...version,
          // Don't include the value hash in the response for security
          valueHash: undefined,
        })),
      });
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get secret versions',
          details: { error: error.message },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'],
        },
      });
    }
  }
);

/**
 * @route POST /api/v1/secrets/:id/rollback
 * @desc Rollback secret to a previous version
 * @access Private
 */
router.post(
  '/:id/rollback',
  [
    rbacMiddleware(['secrets:update']),
    param('id').isUUID().withMessage('Valid secret ID is required'),
    body('targetVersion').isInt({ min: 1 }).withMessage('Valid target version is required'),
    body('reason').notEmpty().withMessage('Rollback reason is required'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array(),
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'],
          },
        });
      }

      const { targetVersion, reason } = req.body;
      const secret = await secretsService.rollbackSecret(req.params.id, targetVersion, reason);

      res.json({
        data: {
          id: secret.id,
          version: secret.version,
          updatedAt: secret.updatedAt,
        },
      });
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: {
            code: 'SECRET_NOT_FOUND',
            message: error.message,
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'],
          },
        });
      }

      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to rollback secret',
          details: { error: error.message },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'],
        },
      });
    }
  }
);

/**
 * @route GET /api/v1/secrets/:id/audit
 * @desc Get secret audit logs
 * @access Private
 */
router.get(
  '/:id/audit',
  [
    rbacMiddleware(['secrets:audit']),
    param('id').isUUID().withMessage('Valid secret ID is required'),
    query('limit').optional().isInt({ min: 1, max: 1000 }),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid parameters',
            details: errors.array(),
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'],
          },
        });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const auditLogs = await secretsService.getAuditLogs(req.params.id, limit);

      res.json({
        data: auditLogs,
      });
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get audit logs',
          details: { error: error.message },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'],
        },
      });
    }
  }
);

/**
 * @route DELETE /api/v1/secrets/:id
 * @desc Delete a secret
 * @access Private
 */
router.delete(
  '/:id',
  [
    rbacMiddleware(['secrets:delete']),
    param('id').isUUID().withMessage('Valid secret ID is required'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid parameters',
            details: errors.array(),
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'],
          },
        });
      }

      await secretsService.deleteSecret(req.params.id);

      res.status(204).send();
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: {
            code: 'SECRET_NOT_FOUND',
            message: 'Secret not found',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'],
          },
        });
      }

      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete secret',
          details: { error: error.message },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'],
        },
      });
    }
  }
);

export default router;