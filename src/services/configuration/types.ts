export interface Configuration {
  id: string;
  environmentId: string;
  name: string;
  key: string;
  value: any;
  type: ConfigurationType;
  isSecret: boolean;
  version: number;
  description?: string;
  tags: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface ConfigurationTemplate {
  id: string;
  name: string;
  description: string;
  schema: ConfigurationSchema;
  defaultValues: Record<string, any>;
  tags: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface ConfigurationVersion {
  id: string;
  configurationId: string;
  version: number;
  value: any;
  changeDescription?: string;
  createdAt: Date;
  createdBy: string;
}

export interface ConfigurationSchema {
  type: 'object';
  properties: Record<string, ConfigurationProperty>;
  required?: string[];
}

export interface ConfigurationProperty {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  default?: any;
  enum?: any[];
  format?: string;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  items?: ConfigurationProperty;
  properties?: Record<string, ConfigurationProperty>;
}

export type ConfigurationType = 
  | 'string' 
  | 'number' 
  | 'boolean' 
  | 'json' 
  | 'yaml' 
  | 'env';

export interface ConfigurationFilter {
  environmentId?: string;
  name?: string;
  key?: string;
  type?: ConfigurationType;
  isSecret?: boolean;
  tags?: Record<string, string>;
}

export interface ConfigurationUpdate {
  value: any;
  changeDescription?: string;
}

export interface ConfigurationBulkOperation {
  configurations: Array<{
    key: string;
    value: any;
    type?: ConfigurationType;
    isSecret?: boolean;
    description?: string;
  }>;
  environmentId: string;
  changeDescription?: string;
}

export interface ConfigurationRollback {
  configurationId: string;
  targetVersion: number;
  reason: string;
}

export interface ConfigurationExport {
  format: 'json' | 'yaml' | 'env';
  includeSecrets: boolean;
  environmentId?: string;
  filter?: ConfigurationFilter;
}

export interface ConfigurationImport {
  format: 'json' | 'yaml' | 'env';
  data: string;
  environmentId: string;
  overwriteExisting: boolean;
  changeDescription?: string;
}