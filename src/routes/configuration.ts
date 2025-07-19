import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { ConfigurationService, ConfigurationTemplateService } from '../services/configuration';
import { ConfigurationRepository } from '../repositories/configurationRepository';
import { ConfigurationTemplateRepository } from '../repositories/configurationTemplateRepository';
import { ConfigurationValidator } from '../services/configuration/ConfigurationValidator';
import { ConfigurationEncryption } from '../services/configuration/ConfigurationEncryption';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { db } from '../database/connection';

const router = Router();

// Initialize services
const configRepository = new ConfigurationRepository(db);
const templateRepository = new ConfigurationTemplateRepository(db);
const validator = new ConfigurationValidator();
const encryption = new ConfigurationEncryption();
const configService = new ConfigurationService(configRepository, validator, encryption);
const templateService = new ConfigurationTemplateService(templateRepository, configService, validator);

// Middleware
router.use(authenticateToken);

// Configuration routes
router.post('/configurations',
  requirePermission('configuration:create'),
  [
    body('environmentId').isUUID().withMessage('Environment ID must be a valid UUID'),
    body('name').notEmpty().withMessage('Name is required'),
    body('key').matches(/^[a-zA-Z0-9._-]+$/).withMessage('Key must contain only alphanumeric characters, underscores, dots, and hyphens'),
    body('value').notEmpty().withMessage('Value is required'),
    body('type').isIn(['string', 'number', 'boolean', 'json', 'yaml', 'env']).withMessage('Invalid configuration type'),
    body('isSecret').optional().isBoolean().withMessage('isSecret must be a boolean'),
    body('description').optional().isString(),
    body('tags').optional().isObject()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array(),
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
      }

      const configuration = await configService.createConfiguration({
        ...req.body,
        createdBy: req.user.id
      });

      res.status(201).json(configuration);
    } catch (error) {
      console.error('Error creating configuration:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create configuration',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }
);

router.get('/configurations/:id',
  requirePermission('configuration:read'),
  [
    param('id').isUUID().withMessage('Configuration ID must be a valid UUID')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array(),
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
      }

      const configuration = await configService.getConfiguration(req.params.id);
      if (!configuration) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Configuration not found',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
      }

      res.json(configuration);
    } catch (error) {
      console.error('Error getting configuration:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get configuration',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }
);

router.put('/configurations/:id',
  requirePermission('configuration:update'),
  [
    param('id').isUUID().withMessage('Configuration ID must be a valid UUID'),
    body('value').optional().notEmpty().withMessage('Value cannot be empty'),
    body('changeDescription').optional().isString()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array(),
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
      }

      const configuration = await configService.updateConfiguration(req.params.id, {
        ...req.body,
        updatedBy: req.user.id
      });

      res.json(configuration);
    } catch (error) {
      console.error('Error updating configuration:', error);
      const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        error: {
          code: statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update configuration',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }
);

router.delete('/configurations/:id',
  requirePermission('configuration:delete'),
  [
    param('id').isUUID().withMessage('Configuration ID must be a valid UUID')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array(),
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
      }

      await configService.deleteConfiguration(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting configuration:', error);
      const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        error: {
          code: statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to delete configuration',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }
);

router.get('/configurations',
  requirePermission('configuration:read'),
  [
    query('environmentId').optional().isUUID().withMessage('Environment ID must be a valid UUID'),
    query('name').optional().isString(),
    query('key').optional().isString(),
    query('type').optional().isIn(['string', 'number', 'boolean', 'json', 'yaml', 'env']),
    query('isSecret').optional().isBoolean(),
    query('includeSecrets').optional().isBoolean()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array(),
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
      }

      const { environmentId, includeSecrets, ...filter } = req.query;
      
      let configurations;
      if (environmentId) {
        configurations = await configService.getEnvironmentConfigurations(
          environmentId as string,
          includeSecrets === 'true'
        );
      } else {
        configurations = await configService.listConfigurations(filter as any);
      }

      res.json(configurations);
    } catch (error) {
      console.error('Error listing configurations:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list configurations',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }
);

router.get('/configurations/search',
  requirePermission('configuration:read'),
  [
    query('q').notEmpty().withMessage('Search query is required'),
    query('environmentId').optional().isUUID(),
    query('type').optional().isIn(['string', 'number', 'boolean', 'json', 'yaml', 'env']),
    query('isSecret').optional().isBoolean()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array(),
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
      }

      const { q, ...filter } = req.query;
      const configurations = await configService.searchConfigurations(q as string, filter as any);

      res.json(configurations);
    } catch (error) {
      console.error('Error searching configurations:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to search configurations',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }
);

// Bulk operations
router.post('/configurations/bulk',
  requirePermission('configuration:create'),
  [
    body('configurations').isArray().withMessage('Configurations must be an array'),
    body('configurations.*.key').matches(/^[a-zA-Z0-9._-]+$/).withMessage('Key must contain only alphanumeric characters, underscores, dots, and hyphens'),
    body('configurations.*.value').notEmpty().withMessage('Value is required'),
    body('environmentId').isUUID().withMessage('Environment ID must be a valid UUID'),
    body('changeDescription').optional().isString()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array(),
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
      }

      const configurations = await configService.bulkCreateConfigurations(req.body);
      res.status(201).json(configurations);
    } catch (error) {
      console.error('Error bulk creating configurations:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to bulk create configurations',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }
);

// Export/Import
router.post('/configurations/export',
  requirePermission('configuration:read'),
  [
    body('format').isIn(['json', 'yaml', 'env']).withMessage('Format must be json, yaml, or env'),
    body('includeSecrets').isBoolean().withMessage('includeSecrets must be a boolean'),
    body('environmentId').optional().isUUID()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array(),
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
      }

      const exportData = await configService.exportConfigurations(req.body);
      
      const contentType = req.body.format === 'json' ? 'application/json' : 'text/plain';
      res.setHeader('Content-Type', contentType);
      res.send(exportData);
    } catch (error) {
      console.error('Error exporting configurations:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to export configurations',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }
);

router.post('/configurations/import',
  requirePermission('configuration:create'),
  [
    body('format').isIn(['json', 'yaml', 'env']).withMessage('Format must be json, yaml, or env'),
    body('data').notEmpty().withMessage('Data is required'),
    body('environmentId').isUUID().withMessage('Environment ID must be a valid UUID'),
    body('overwriteExisting').isBoolean().withMessage('overwriteExisting must be a boolean'),
    body('changeDescription').optional().isString()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array(),
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
      }

      const configurations = await configService.importConfigurations(req.body);
      res.status(201).json(configurations);
    } catch (error) {
      console.error('Error importing configurations:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to import configurations',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }
);

// Versioning
router.get('/configurations/:id/versions',
  requirePermission('configuration:read'),
  [
    param('id').isUUID().withMessage('Configuration ID must be a valid UUID')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array(),
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
      }

      const versions = await configService.getConfigurationVersions(req.params.id);
      res.json(versions);
    } catch (error) {
      console.error('Error getting configuration versions:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get configuration versions',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }
);

router.post('/configurations/:id/rollback',
  requirePermission('configuration:update'),
  [
    param('id').isUUID().withMessage('Configuration ID must be a valid UUID'),
    body('targetVersion').isInt({ min: 1 }).withMessage('Target version must be a positive integer'),
    body('reason').notEmpty().withMessage('Reason is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array(),
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
      }

      const configuration = await configService.rollbackConfiguration({
        configurationId: req.params.id,
        targetVersion: req.body.targetVersion,
        reason: req.body.reason
      });

      res.json(configuration);
    } catch (error) {
      console.error('Error rolling back configuration:', error);
      const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        error: {
          code: statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to rollback configuration',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }
);

// Template routes
router.post('/templates',
  requirePermission('configuration:create'),
  [
    body('name').matches(/^[a-zA-Z0-9._-]+$/).withMessage('Name must contain only alphanumeric characters, underscores, dots, and hyphens'),
    body('description').optional().isString(),
    body('schema').isObject().withMessage('Schema must be an object'),
    body('defaultValues').optional().isObject(),
    body('tags').optional().isObject()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array(),
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
      }

      const template = await templateService.createTemplate({
        ...req.body,
        createdBy: req.user.id
      });

      res.status(201).json(template);
    } catch (error) {
      console.error('Error creating template:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create template',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }
);

router.get('/templates',
  requirePermission('configuration:read'),
  async (req, res) => {
    try {
      const templates = await templateService.listTemplates();
      res.json(templates);
    } catch (error) {
      console.error('Error listing templates:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list templates',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }
);

router.post('/templates/:id/apply',
  requirePermission('configuration:create'),
  [
    param('id').isUUID().withMessage('Template ID must be a valid UUID'),
    body('environmentId').isUUID().withMessage('Environment ID must be a valid UUID'),
    body('overrides').optional().isObject()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array(),
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
      }

      const configurations = await templateService.applyTemplate(
        req.params.id,
        req.body.environmentId,
        req.body.overrides
      );

      res.status(201).json(configurations);
    } catch (error) {
      console.error('Error applying template:', error);
      const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        error: {
          code: statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to apply template',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }
);

export default router;