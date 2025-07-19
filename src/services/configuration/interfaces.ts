import {
  Configuration,
  ConfigurationTemplate,
  ConfigurationVersion,
  ConfigurationFilter,
  ConfigurationUpdate,
  ConfigurationBulkOperation,
  ConfigurationRollback,
  ConfigurationExport,
  ConfigurationImport
} from './types';

export interface IConfigurationService {
  // Configuration CRUD operations
  createConfiguration(config: Omit<Configuration, 'id' | 'version' | 'createdAt' | 'updatedAt'>): Promise<Configuration>;
  getConfiguration(id: string): Promise<Configuration | null>;
  getConfigurationByKey(environmentId: string, key: string): Promise<Configuration | null>;
  updateConfiguration(id: string, update: ConfigurationUpdate): Promise<Configuration>;
  deleteConfiguration(id: string): Promise<void>;
  
  // Configuration querying
  listConfigurations(filter?: ConfigurationFilter): Promise<Configuration[]>;
  getEnvironmentConfigurations(environmentId: string, includeSecrets?: boolean): Promise<Configuration[]>;
  searchConfigurations(query: string, filter?: ConfigurationFilter): Promise<Configuration[]>;
  
  // Bulk operations
  bulkCreateConfigurations(operation: ConfigurationBulkOperation): Promise<Configuration[]>;
  bulkUpdateConfigurations(updates: Array<{ id: string; update: ConfigurationUpdate }>): Promise<Configuration[]>;
  bulkDeleteConfigurations(ids: string[]): Promise<void>;
  
  // Versioning
  getConfigurationVersions(configurationId: string): Promise<ConfigurationVersion[]>;
  getConfigurationVersion(configurationId: string, version: number): Promise<ConfigurationVersion | null>;
  rollbackConfiguration(rollback: ConfigurationRollback): Promise<Configuration>;
  
  // Import/Export
  exportConfigurations(exportConfig: ConfigurationExport): Promise<string>;
  importConfigurations(importConfig: ConfigurationImport): Promise<Configuration[]>;
  
  // Validation
  validateConfiguration(config: Partial<Configuration>): Promise<{ valid: boolean; errors: string[] }>;
  validateConfigurationValue(type: string, value: any): boolean;
}

export interface IConfigurationTemplateService {
  // Template CRUD operations
  createTemplate(template: Omit<ConfigurationTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<ConfigurationTemplate>;
  getTemplate(id: string): Promise<ConfigurationTemplate | null>;
  updateTemplate(id: string, updates: Partial<ConfigurationTemplate>): Promise<ConfigurationTemplate>;
  deleteTemplate(id: string): Promise<void>;
  
  // Template operations
  listTemplates(): Promise<ConfigurationTemplate[]>;
  applyTemplate(templateId: string, environmentId: string, overrides?: Record<string, any>): Promise<Configuration[]>;
  validateTemplate(template: Partial<ConfigurationTemplate>): Promise<{ valid: boolean; errors: string[] }>;
}

export interface IConfigurationRepository {
  // Configuration persistence
  create(config: Omit<Configuration, 'id' | 'createdAt' | 'updatedAt'>): Promise<Configuration>;
  findById(id: string): Promise<Configuration | null>;
  findByKey(environmentId: string, key: string): Promise<Configuration | null>;
  update(id: string, updates: Partial<Configuration>): Promise<Configuration>;
  delete(id: string): Promise<void>;
  
  // Querying
  findMany(filter?: ConfigurationFilter): Promise<Configuration[]>;
  findByEnvironment(environmentId: string): Promise<Configuration[]>;
  search(query: string, filter?: ConfigurationFilter): Promise<Configuration[]>;
  
  // Versioning
  createVersion(version: Omit<ConfigurationVersion, 'id' | 'createdAt'>): Promise<ConfigurationVersion>;
  findVersions(configurationId: string): Promise<ConfigurationVersion[]>;
  findVersion(configurationId: string, version: number): Promise<ConfigurationVersion | null>;
}

export interface IConfigurationTemplateRepository {
  create(template: Omit<ConfigurationTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<ConfigurationTemplate>;
  findById(id: string): Promise<ConfigurationTemplate | null>;
  update(id: string, updates: Partial<ConfigurationTemplate>): Promise<ConfigurationTemplate>;
  delete(id: string): Promise<void>;
  findMany(): Promise<ConfigurationTemplate[]>;
}

export interface IConfigurationValidator {
  validateConfiguration(config: Partial<Configuration>): Promise<{ valid: boolean; errors: string[] }>;
  validateValue(type: string, value: any): boolean;
  validateSchema(schema: any): { valid: boolean; errors: string[] };
  validateTemplate(template: Partial<ConfigurationTemplate>): Promise<{ valid: boolean; errors: string[] }>;
}

export interface IConfigurationEncryption {
  encrypt(value: string): Promise<string>;
  decrypt(encryptedValue: string): Promise<string>;
  isEncrypted(value: string): boolean;
}