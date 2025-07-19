import yaml from 'js-yaml';
import {
  Configuration,
  ConfigurationTemplate,
  ConfigurationFilter,
  ConfigurationUpdate,
  ConfigurationBulkOperation,
  ConfigurationRollback,
  ConfigurationExport,
  ConfigurationImport,
  ConfigurationVersion,
  ConfigurationSchema,
  ConfigurationType
} from './types';
import {
  IConfigurationService,
  IConfigurationTemplateService,
  IConfigurationRepository,
  IConfigurationTemplateRepository,
  IConfigurationValidator,
  IConfigurationEncryption
} from './interfaces';

export class ConfigurationService implements IConfigurationService {
  constructor(
    private repository: IConfigurationRepository,
    private validator: IConfigurationValidator,
    private encryption: IConfigurationEncryption
  ) {}

  async createConfiguration(config: Omit<Configuration, 'id' | 'version' | 'createdAt' | 'updatedAt'>): Promise<Configuration> {
    // Validate configuration
    const validation = await this.validator.validateConfiguration(config);
    if (!validation.valid) {
      throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
    }

    // Check if configuration with same key already exists
    const existing = await this.repository.findByKey(config.environmentId, config.key);
    if (existing) {
      throw new Error(`Configuration with key '${config.key}' already exists in environment '${config.environmentId}'`);
    }

    // Encrypt value if it's a secret
    let processedValue = config.value;
    if (config.isSecret && typeof config.value === 'string') {
      processedValue = await this.encryption.encrypt(config.value);
    }

    const configToCreate = {
      ...config,
      value: processedValue,
      version: 1
    };

    return this.repository.create(configToCreate);
  }

  async getConfiguration(id: string): Promise<Configuration | null> {
    const config = await this.repository.findById(id);
    if (!config) {
      return null;
    }

    // Decrypt value if it's a secret
    if (config.isSecret && typeof config.value === 'string') {
      try {
        config.value = await this.encryption.decrypt(config.value);
      } catch (error) {
        console.error(`Failed to decrypt configuration ${id}:`, error);
        // Return configuration with encrypted value rather than failing
      }
    }

    return config;
  }

  async getConfigurationByKey(environmentId: string, key: string): Promise<Configuration | null> {
    const config = await this.repository.findByKey(environmentId, key);
    if (!config) {
      return null;
    }

    // Decrypt value if it's a secret
    if (config.isSecret && typeof config.value === 'string') {
      try {
        config.value = await this.encryption.decrypt(config.value);
      } catch (error) {
        console.error(`Failed to decrypt configuration ${config.id}:`, error);
      }
    }

    return config;
  }

  async updateConfiguration(id: string, update: ConfigurationUpdate): Promise<Configuration> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error(`Configuration with id ${id} not found`);
    }

    // Validate the updated configuration
    const updatedConfig = { ...existing, ...update };
    const validation = await this.validator.validateConfiguration(updatedConfig);
    if (!validation.valid) {
      throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
    }

    // Encrypt value if it's a secret
    let processedValue = update.value;
    if (existing.isSecret && typeof update.value === 'string') {
      processedValue = await this.encryption.encrypt(update.value);
    }

    const updateData = {
      ...update,
      value: processedValue
    };

    return this.repository.update(id, updateData);
  }

  async deleteConfiguration(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error(`Configuration with id ${id} not found`);
    }

    await this.repository.delete(id);
  }

  async listConfigurations(filter?: ConfigurationFilter): Promise<Configuration[]> {
    const configs = await this.repository.findMany(filter);
    
    // Decrypt secret values
    return Promise.all(configs.map(async (config) => {
      if (config.isSecret && typeof config.value === 'string') {
        try {
          config.value = await this.encryption.decrypt(config.value);
        } catch (error) {
          console.error(`Failed to decrypt configuration ${config.id}:`, error);
        }
      }
      return config;
    }));
  }

  async getEnvironmentConfigurations(environmentId: string, includeSecrets: boolean = true): Promise<Configuration[]> {
    const configs = await this.repository.findByEnvironment(environmentId);
    
    return Promise.all(configs.map(async (config) => {
      if (config.isSecret) {
        if (includeSecrets && typeof config.value === 'string') {
          try {
            config.value = await this.encryption.decrypt(config.value);
          } catch (error) {
            console.error(`Failed to decrypt configuration ${config.id}:`, error);
          }
        } else if (!includeSecrets) {
          config.value = '[REDACTED]';
        }
      }
      return config;
    }));
  }

  async searchConfigurations(query: string, filter?: ConfigurationFilter): Promise<Configuration[]> {
    const configs = await this.repository.search(query, filter);
    
    // Decrypt secret values
    return Promise.all(configs.map(async (config) => {
      if (config.isSecret && typeof config.value === 'string') {
        try {
          config.value = await this.encryption.decrypt(config.value);
        } catch (error) {
          console.error(`Failed to decrypt configuration ${config.id}:`, error);
        }
      }
      return config;
    }));
  }

  async bulkCreateConfigurations(operation: ConfigurationBulkOperation): Promise<Configuration[]> {
    const results: Configuration[] = [];
    
    for (const configData of operation.configurations) {
      const config = {
        environmentId: operation.environmentId,
        name: configData.key, // Use key as name if not provided
        key: configData.key,
        value: configData.value,
        type: configData.type || 'string',
        isSecret: configData.isSecret || false,
        description: configData.description || 'Bulk import configuration',
        tags: {},
        createdBy: 'system' // Should be passed from auth context
      };

      try {
        const created = await this.createConfiguration(config);
        results.push(created);
      } catch (error) {
        console.error(`Failed to create configuration ${configData.key}:`, error);
        // Continue with other configurations
      }
    }

    return results;
  }

  async bulkUpdateConfigurations(updates: Array<{ id: string; update: ConfigurationUpdate }>): Promise<Configuration[]> {
    const results: Configuration[] = [];
    
    for (const { id, update } of updates) {
      try {
        const updated = await this.updateConfiguration(id, update);
        results.push(updated);
      } catch (error) {
        console.error(`Failed to update configuration ${id}:`, error);
        // Continue with other configurations
      }
    }

    return results;
  }

  async bulkDeleteConfigurations(ids: string[]): Promise<void> {
    for (const id of ids) {
      try {
        await this.deleteConfiguration(id);
      } catch (error) {
        console.error(`Failed to delete configuration ${id}:`, error);
        // Continue with other configurations
      }
    }
  }

  async getConfigurationVersions(configurationId: string): Promise<ConfigurationVersion[]> {
    return this.repository.findVersions(configurationId);
  }

  async getConfigurationVersion(configurationId: string, version: number): Promise<ConfigurationVersion | null> {
    return this.repository.findVersion(configurationId, version);
  }

  async rollbackConfiguration(rollback: ConfigurationRollback): Promise<Configuration> {
    const targetVersion = await this.repository.findVersion(rollback.configurationId, rollback.targetVersion);
    if (!targetVersion) {
      throw new Error(`Version ${rollback.targetVersion} not found for configuration ${rollback.configurationId}`);
    }

    const update: ConfigurationUpdate = {
      value: targetVersion.value,
      changeDescription: `Rollback to version ${rollback.targetVersion}: ${rollback.reason}`
    };

    return this.updateConfiguration(rollback.configurationId, update);
  }

  async exportConfigurations(exportConfig: ConfigurationExport): Promise<string> {
    const filter = exportConfig.filter || {};
    if (exportConfig.environmentId) {
      filter.environmentId = exportConfig.environmentId;
    }

    const configs = await this.getEnvironmentConfigurations(
      exportConfig.environmentId || '',
      exportConfig.includeSecrets
    );

    switch (exportConfig.format) {
      case 'json':
        return JSON.stringify(configs, null, 2);
      
      case 'yaml':
        return yaml.dump(configs);
      
      case 'env':
        return configs
          .map(config => `${config.key}=${config.value}`)
          .join('\n');
      
      default:
        throw new Error(`Unsupported export format: ${exportConfig.format}`);
    }
  }

  async importConfigurations(importConfig: ConfigurationImport): Promise<Configuration[]> {
    let data: any;

    try {
      switch (importConfig.format) {
        case 'json':
          data = JSON.parse(importConfig.data);
          break;
        
        case 'yaml':
          data = yaml.load(importConfig.data);
          break;
        
        case 'env':
          data = {};
          importConfig.data.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
              data[key.trim()] = valueParts.join('=').trim();
            }
          });
          break;
        
        default:
          throw new Error(`Unsupported import format: ${importConfig.format}`);
      }
    } catch (error) {
      throw new Error(`Failed to parse import data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const configurations = Array.isArray(data) ? data : Object.entries(data).map(([key, value]) => ({
      key,
      value,
      type: 'string',
      isSecret: false
    }));

    const bulkOperation: ConfigurationBulkOperation = {
      configurations,
      environmentId: importConfig.environmentId,
      changeDescription: importConfig.changeDescription || 'Bulk import'
    };

    return this.bulkCreateConfigurations(bulkOperation);
  }

  async validateConfiguration(config: Partial<Configuration>): Promise<{ valid: boolean; errors: string[] }> {
    return this.validator.validateConfiguration(config);
  }

  validateConfigurationValue(type: string, value: any): boolean {
    return this.validator.validateValue(type as any, value);
  }
}

export class ConfigurationTemplateService implements IConfigurationTemplateService {
  constructor(
    private templateRepository: IConfigurationTemplateRepository,
    private configurationService: IConfigurationService,
    private validator: IConfigurationValidator
  ) {}

  async createTemplate(template: Omit<ConfigurationTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<ConfigurationTemplate> {
    // Validate template
    const validation = await this.validator.validateTemplate(template);
    if (!validation.valid) {
      throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
    }

    return this.templateRepository.create(template);
  }

  async getTemplate(id: string): Promise<ConfigurationTemplate | null> {
    return this.templateRepository.findById(id);
  }

  async updateTemplate(id: string, updates: Partial<ConfigurationTemplate>): Promise<ConfigurationTemplate> {
    const existing = await this.templateRepository.findById(id);
    if (!existing) {
      throw new Error(`Template with id ${id} not found`);
    }

    // Validate updated template
    const updatedTemplate = { ...existing, ...updates };
    const validation = await this.validator.validateTemplate(updatedTemplate);
    if (!validation.valid) {
      throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
    }

    return this.templateRepository.update(id, updates);
  }

  async deleteTemplate(id: string): Promise<void> {
    const existing = await this.templateRepository.findById(id);
    if (!existing) {
      throw new Error(`Template with id ${id} not found`);
    }

    await this.templateRepository.delete(id);
  }

  async listTemplates(): Promise<ConfigurationTemplate[]> {
    return this.templateRepository.findMany();
  }

  async applyTemplate(templateId: string, environmentId: string, overrides?: Record<string, any>): Promise<Configuration[]> {
    const template = await this.templateRepository.findById(templateId);
    if (!template) {
      throw new Error(`Template with id ${templateId} not found`);
    }

    // Merge default values with overrides
    const values = { ...template.defaultValues, ...overrides };

    // Validate values against schema
    const schemaValidation = this.validator.validateConfigurationAgainstSchema(values, template.schema);
    if (!schemaValidation.valid) {
      throw new Error(`Template values validation failed: ${schemaValidation.errors.join(', ')}`);
    }

    // Create configurations from template
    const configurations = this.extractConfigurationsFromValues(values, template.schema);
    
    const bulkOperation: ConfigurationBulkOperation = {
      configurations: configurations.map(config => ({
        key: config.key,
        value: config.value,
        type: config.type,
        isSecret: config.isSecret,
        description: `Generated from template: ${template.name}`
      })),
      environmentId,
      changeDescription: `Applied template: ${template.name}`
    };

    return this.configurationService.bulkCreateConfigurations(bulkOperation);
  }

  async validateTemplate(template: Partial<ConfigurationTemplate>): Promise<{ valid: boolean; errors: string[] }> {
    return this.validator.validateTemplate(template);
  }

  private extractConfigurationsFromValues(values: any, schema: ConfigurationSchema, prefix: string = ''): Array<{
    key: string;
    value: any;
    type: ConfigurationType;
    isSecret: boolean;
  }> {
    const configurations: Array<{
      key: string;
      value: any;
      type: ConfigurationType;
      isSecret: boolean;
    }> = [];

    Object.entries(values).forEach(([key, value]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const property = schema.properties[key];
      
      if (!property) {
        return;
      }

      if (property.type === 'object' && property.properties && typeof value === 'object') {
        // Recursively handle nested objects
        const nestedConfigs = this.extractConfigurationsFromValues(
          value,
          { type: 'object', properties: property.properties },
          fullKey
        );
        configurations.push(...nestedConfigs);
      } else {
        // Create configuration for primitive values
        configurations.push({
          key: fullKey,
          value,
          type: this.mapSchemaTypeToConfigurationType(property.type),
          isSecret: property.format === 'password' || key.toLowerCase().includes('secret') || key.toLowerCase().includes('password')
        });
      }
    });

    return configurations;
  }

  private mapSchemaTypeToConfigurationType(schemaType: string): ConfigurationType {
    switch (schemaType) {
      case 'string':
        return 'string';
      case 'number':
      case 'integer':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'object':
      case 'array':
        return 'json';
      default:
        return 'string';
    }
  }
}