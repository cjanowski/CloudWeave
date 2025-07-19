import { ConfigurationService, ConfigurationTemplateService } from './ConfigurationService';
import { ConfigurationValidator } from './ConfigurationValidator';
import { ConfigurationEncryption } from './ConfigurationEncryption';
import {
  Configuration,
  ConfigurationTemplate,
  ConfigurationUpdate,
  ConfigurationBulkOperation
} from './types';
import {
  IConfigurationRepository,
  IConfigurationTemplateRepository
} from './interfaces';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

// Mock repositories
const mockConfigRepository: jest.Mocked<IConfigurationRepository> = {
  create: jest.fn(),
  findById: jest.fn(),
  findByKey: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findMany: jest.fn(),
  findByEnvironment: jest.fn(),
  search: jest.fn(),
  createVersion: jest.fn(),
  findVersions: jest.fn(),
  findVersion: jest.fn()
};

const mockTemplateRepository: jest.Mocked<IConfigurationTemplateRepository> = {
  create: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findMany: jest.fn()
};

describe('ConfigurationService', () => {
  let configService: ConfigurationService;
  let validator: ConfigurationValidator;
  let encryption: ConfigurationEncryption;

  beforeEach(() => {
    jest.clearAllMocks();
    validator = new ConfigurationValidator();
    encryption = new ConfigurationEncryption('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef');
    configService = new ConfigurationService(mockConfigRepository, validator, encryption);
  });

  describe('createConfiguration', () => {
    it('should create a configuration successfully', async () => {
      const configData = {
        environmentId: 'env-1',
        name: 'Database URL',
        key: 'DATABASE_URL',
        value: 'postgresql://localhost:5432/mydb',
        type: 'string' as const,
        isSecret: false,
        description: 'Database connection URL',
        tags: { component: 'database' },
        createdBy: 'user-1'
      };

      const expectedConfig: Configuration = {
        id: 'config-1',
        ...configData,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockConfigRepository.findByKey.mockResolvedValue(null);
      mockConfigRepository.create.mockResolvedValue(expectedConfig);

      const result = await configService.createConfiguration(configData);

      expect(mockConfigRepository.findByKey).toHaveBeenCalledWith('env-1', 'DATABASE_URL');
      expect(mockConfigRepository.create).toHaveBeenCalledWith({
        ...configData,
        value: 'postgresql://localhost:5432/mydb',
        version: 1
      });
      expect(result).toEqual(expectedConfig);
    });

    it('should encrypt secret configurations', async () => {
      const configData = {
        environmentId: 'env-1',
        name: 'API Key',
        key: 'API_KEY',
        value: 'secret-api-key',
        type: 'string' as const,
        isSecret: true,
        description: 'API key for external service',
        tags: {},
        createdBy: 'user-1'
      };

      mockConfigRepository.findByKey.mockResolvedValue(null);
      mockConfigRepository.create.mockImplementation(async (config) => ({
        id: 'config-1',
        ...config,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Configuration));

      await configService.createConfiguration(configData);

      expect(mockConfigRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          value: expect.stringMatching(/^enc:/)
        })
      );
    });

    it('should throw error for duplicate key', async () => {
      const configData = {
        environmentId: 'env-1',
        name: 'Database URL',
        key: 'DATABASE_URL',
        value: 'postgresql://localhost:5432/mydb',
        type: 'string' as const,
        isSecret: false,
        description: 'Database connection URL',
        tags: {},
        createdBy: 'user-1'
      };

      const existingConfig: Configuration = {
        id: 'existing-config',
        ...configData,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockConfigRepository.findByKey.mockResolvedValue(existingConfig);

      await expect(configService.createConfiguration(configData))
        .rejects.toThrow("Configuration with key 'DATABASE_URL' already exists");
    });

    it('should validate configuration before creation', async () => {
      const invalidConfigData = {
        environmentId: '',
        name: '',
        key: 'invalid key!',
        value: 'test',
        type: 'string' as const,
        isSecret: false,
        description: '',
        tags: {},
        createdBy: 'user-1'
      };

      await expect(configService.createConfiguration(invalidConfigData))
        .rejects.toThrow('Configuration validation failed');
    });
  });

  describe('getConfiguration', () => {
    it('should return configuration with decrypted secret', async () => {
      const encryptedValue = await encryption.encrypt('secret-value');
      const config: Configuration = {
        id: 'config-1',
        environmentId: 'env-1',
        name: 'Secret Config',
        key: 'SECRET_KEY',
        value: encryptedValue,
        type: 'string',
        isSecret: true,
        version: 1,
        description: 'A secret configuration',
        tags: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-1'
      };

      mockConfigRepository.findById.mockResolvedValue(config);

      const result = await configService.getConfiguration('config-1');

      expect(result).toBeTruthy();
      expect(result!.value).toBe('secret-value');
      expect(result!.isSecret).toBe(true);
    });

    it('should return null for non-existent configuration', async () => {
      mockConfigRepository.findById.mockResolvedValue(null);

      const result = await configService.getConfiguration('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateConfiguration', () => {
    it('should update configuration and create new version', async () => {
      const existingConfig: Configuration = {
        id: 'config-1',
        environmentId: 'env-1',
        name: 'Database URL',
        key: 'DATABASE_URL',
        value: 'old-value',
        type: 'string',
        isSecret: false,
        version: 1,
        description: 'Database connection URL',
        tags: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-1'
      };

      const update: ConfigurationUpdate = {
        value: 'new-value',
        changeDescription: 'Updated database URL'
      };

      const updatedConfig: Configuration = {
        ...existingConfig,
        value: 'new-value',
        version: 2,
        updatedAt: new Date()
      };

      mockConfigRepository.findById.mockResolvedValue(existingConfig);
      mockConfigRepository.update.mockResolvedValue(updatedConfig);

      const result = await configService.updateConfiguration('config-1', update);

      expect(mockConfigRepository.update).toHaveBeenCalledWith('config-1', {
        value: 'new-value',
        changeDescription: 'Updated database URL'
      });
      expect(result).toEqual(updatedConfig);
    });

    it('should throw error for non-existent configuration', async () => {
      mockConfigRepository.findById.mockResolvedValue(null);

      const update: ConfigurationUpdate = {
        value: 'new-value'
      };

      await expect(configService.updateConfiguration('non-existent', update))
        .rejects.toThrow('Configuration with id non-existent not found');
    });
  });

  describe('bulkCreateConfigurations', () => {
    it('should create multiple configurations', async () => {
      const bulkOperation: ConfigurationBulkOperation = {
        configurations: [
          { key: 'KEY1', value: 'value1', type: 'string', isSecret: false },
          { key: 'KEY2', value: 'value2', type: 'string', isSecret: false }
        ],
        environmentId: 'env-1',
        changeDescription: 'Bulk import'
      };

      mockConfigRepository.findByKey.mockResolvedValue(null);
      mockConfigRepository.create
        .mockResolvedValueOnce({
          id: 'config-1',
          environmentId: 'env-1',
          name: 'KEY1',
          key: 'KEY1',
          value: 'value1',
          type: 'string',
          isSecret: false,
          version: 1,
          description: 'Bulk import configuration',
          tags: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system'
        })
        .mockResolvedValueOnce({
          id: 'config-2',
          environmentId: 'env-1',
          name: 'KEY2',
          key: 'KEY2',
          value: 'value2',
          type: 'string',
          isSecret: false,
          version: 1,
          description: 'Bulk import configuration',
          tags: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system'
        });

      const result = await configService.bulkCreateConfigurations(bulkOperation);

      expect(result).toHaveLength(2);
      expect(result[0].key).toBe('KEY1');
      expect(result[1].key).toBe('KEY2');
    });
  });

  describe('exportConfigurations', () => {
    it('should export configurations as JSON', async () => {
      const configs: Configuration[] = [
        {
          id: 'config-1',
          environmentId: 'env-1',
          name: 'Config 1',
          key: 'KEY1',
          value: 'value1',
          type: 'string',
          isSecret: false,
          version: 1,
          description: 'First config',
          tags: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'user-1'
        }
      ];

      mockConfigRepository.findByEnvironment.mockResolvedValue(configs);

      const result = await configService.exportConfigurations({
        format: 'json',
        includeSecrets: true,
        environmentId: 'env-1'
      });

      expect(result).toContain('"key": "KEY1"');
      expect(result).toContain('"value": "value1"');
    });

    it('should export configurations as env format', async () => {
      const configs: Configuration[] = [
        {
          id: 'config-1',
          environmentId: 'env-1',
          name: 'Config 1',
          key: 'KEY1',
          value: 'value1',
          type: 'string',
          isSecret: false,
          version: 1,
          description: 'First config',
          tags: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'user-1'
        }
      ];

      mockConfigRepository.findByEnvironment.mockResolvedValue(configs);

      const result = await configService.exportConfigurations({
        format: 'env',
        includeSecrets: true,
        environmentId: 'env-1'
      });

      expect(result).toBe('KEY1=value1');
    });
  });
});

describe('ConfigurationTemplateService', () => {
  let templateService: ConfigurationTemplateService;
  let configService: ConfigurationService;
  let validator: ConfigurationValidator;

  beforeEach(() => {
    jest.clearAllMocks();
    validator = new ConfigurationValidator();
    const encryption = new ConfigurationEncryption('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef');
    configService = new ConfigurationService(mockConfigRepository, validator, encryption);
    templateService = new ConfigurationTemplateService(mockTemplateRepository, configService, validator);
  });

  describe('createTemplate', () => {
    it('should create a template successfully', async () => {
      const templateData = {
        name: 'database-config',
        description: 'Database configuration template',
        schema: {
          type: 'object' as const,
          properties: {
            host: { type: 'string' as const, default: 'localhost' },
            port: { type: 'number' as const, default: 5432 },
            database: { type: 'string' as const }
          },
          required: ['database']
        },
        defaultValues: {
          host: 'localhost',
          port: 5432,
          database: 'myapp'
        },
        tags: { category: 'database' },
        createdBy: 'user-1'
      };

      const expectedTemplate: ConfigurationTemplate = {
        id: 'template-1',
        ...templateData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockTemplateRepository.create.mockResolvedValue(expectedTemplate);

      const result = await templateService.createTemplate(templateData);

      expect(mockTemplateRepository.create).toHaveBeenCalledWith(templateData);
      expect(result).toEqual(expectedTemplate);
    });

    it('should validate template before creation', async () => {
      const invalidTemplateData = {
        name: '',
        description: 'Invalid template',
        schema: {
          type: 'object' as const,
          properties: {}
        },
        defaultValues: {},
        tags: {},
        createdBy: 'user-1'
      };

      await expect(templateService.createTemplate(invalidTemplateData))
        .rejects.toThrow('Template validation failed');
    });
  });

  describe('applyTemplate', () => {
    it('should apply template to environment', async () => {
      const template: ConfigurationTemplate = {
        id: 'template-1',
        name: 'database-config',
        description: 'Database configuration template',
        schema: {
          type: 'object',
          properties: {
            host: { type: 'string', default: 'localhost' },
            port: { type: 'number', default: 5432 },
            database: { type: 'string' }
          },
          required: ['database']
        },
        defaultValues: {
          host: 'localhost',
          port: 5432,
          database: 'myapp'
        },
        tags: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-1'
      };

      mockTemplateRepository.findById.mockResolvedValue(template);
      mockConfigRepository.findByKey.mockResolvedValue(null);
      mockConfigRepository.create
        .mockResolvedValueOnce({
          id: 'config-1',
          environmentId: 'env-1',
          name: 'host',
          key: 'host',
          value: 'localhost',
          type: 'string',
          isSecret: false,
          version: 1,
          description: 'Generated from template: database-config',
          tags: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system'
        })
        .mockResolvedValueOnce({
          id: 'config-2',
          environmentId: 'env-1',
          name: 'port',
          key: 'port',
          value: 5432,
          type: 'number',
          isSecret: false,
          version: 1,
          description: 'Generated from template: database-config',
          tags: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system'
        })
        .mockResolvedValueOnce({
          id: 'config-3',
          environmentId: 'env-1',
          name: 'database',
          key: 'database',
          value: 'myapp',
          type: 'string',
          isSecret: false,
          version: 1,
          description: 'Generated from template: database-config',
          tags: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system'
        });

      const result = await templateService.applyTemplate('template-1', 'env-1');

      expect(result).toHaveLength(3);
      expect(result.find(c => c.key === 'host')?.value).toBe('localhost');
      expect(result.find(c => c.key === 'port')?.value).toBe(5432);
      expect(result.find(c => c.key === 'database')?.value).toBe('myapp');
    });

    it('should apply template with overrides', async () => {
      const template: ConfigurationTemplate = {
        id: 'template-1',
        name: 'database-config',
        description: 'Database configuration template',
        schema: {
          type: 'object',
          properties: {
            host: { type: 'string', default: 'localhost' },
            port: { type: 'number', default: 5432 }
          }
        },
        defaultValues: {
          host: 'localhost',
          port: 5432
        },
        tags: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-1'
      };

      const overrides = {
        host: 'production-db.example.com',
        port: 3306
      };

      mockTemplateRepository.findById.mockResolvedValue(template);
      mockConfigRepository.findByKey.mockResolvedValue(null);
      mockConfigRepository.create
        .mockResolvedValueOnce({
          id: 'config-1',
          environmentId: 'env-1',
          name: 'host',
          key: 'host',
          value: 'production-db.example.com',
          type: 'string',
          isSecret: false,
          version: 1,
          description: 'Generated from template: database-config',
          tags: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system'
        })
        .mockResolvedValueOnce({
          id: 'config-2',
          environmentId: 'env-1',
          name: 'port',
          key: 'port',
          value: 3306,
          type: 'number',
          isSecret: false,
          version: 1,
          description: 'Generated from template: database-config',
          tags: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system'
        });

      const result = await templateService.applyTemplate('template-1', 'env-1', overrides);

      expect(result).toHaveLength(2);
      expect(result.find(c => c.key === 'host')?.value).toBe('production-db.example.com');
      expect(result.find(c => c.key === 'port')?.value).toBe(3306);
    });
  });
});