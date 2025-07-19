import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import {
  Configuration,
  ConfigurationTemplate,
  ConfigurationSchema,
  ConfigurationType
} from './types';
import { IConfigurationValidator } from './interfaces';

export class ConfigurationValidator implements IConfigurationValidator {
  private ajv: Ajv;

  constructor() {
    this.ajv = new Ajv({ allErrors: true });
    addFormats(this.ajv);
  }

  async validateConfiguration(config: Partial<Configuration>): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validate required fields
    if (!config.environmentId) {
      errors.push('Environment ID is required');
    }
    if (!config.key) {
      errors.push('Configuration key is required');
    }
    if (!config.name) {
      errors.push('Configuration name is required');
    }
    if (config.value === undefined || config.value === null) {
      errors.push('Configuration value is required');
    }
    if (!config.type) {
      errors.push('Configuration type is required');
    }

    // Validate key format (alphanumeric, underscores, dots, hyphens)
    if (config.key && !/^[a-zA-Z0-9._-]+$/.test(config.key)) {
      errors.push('Configuration key must contain only alphanumeric characters, underscores, dots, and hyphens');
    }

    // Validate value based on type
    if (config.type && config.value !== undefined) {
      if (!this.validateValue(config.type, config.value)) {
        errors.push(`Configuration value is not valid for type ${config.type}`);
      }
    }

    // Validate tags
    if (config.tags) {
      Object.keys(config.tags).forEach(key => {
        if (!/^[a-zA-Z0-9._-]+$/.test(key)) {
          errors.push(`Tag key '${key}' must contain only alphanumeric characters, underscores, dots, and hyphens`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  validateValue(type: ConfigurationType, value: any): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      
      case 'boolean':
        return typeof value === 'boolean';
      
      case 'json':
        if (typeof value === 'string') {
          try {
            JSON.parse(value);
            return true;
          } catch {
            return false;
          }
        }
        return typeof value === 'object';
      
      case 'yaml':
        return typeof value === 'string';
      
      case 'env':
        return typeof value === 'string';
      
      default:
        return false;
    }
  }

  validateSchema(schema: any): { valid: boolean; errors: string[] } {
    try {
      this.ajv.compile(schema);
      return { valid: true, errors: [] };
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Invalid schema']
      };
    }
  }

  async validateTemplate(template: Partial<ConfigurationTemplate>): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validate required fields
    if (!template.name) {
      errors.push('Template name is required');
    }
    if (!template.schema) {
      errors.push('Template schema is required');
    }

    // Validate name format
    if (template.name && !/^[a-zA-Z0-9._-]+$/.test(template.name)) {
      errors.push('Template name must contain only alphanumeric characters, underscores, dots, and hyphens');
    }

    // Validate schema
    if (template.schema) {
      const schemaValidation = this.validateSchema(template.schema);
      if (!schemaValidation.valid) {
        errors.push(...schemaValidation.errors.map(err => `Schema validation error: ${err}`));
      }
    }

    // Validate default values against schema
    if (template.schema && template.defaultValues) {
      try {
        const validate = this.ajv.compile(template.schema);
        if (!validate(template.defaultValues)) {
          const validationErrors = validate.errors?.map((err: any) => 
            `Default value error at ${err.instancePath}: ${err.message}`
          ) || ['Default values do not match schema'];
          errors.push(...validationErrors);
        }
      } catch (error) {
        errors.push('Error validating default values against schema');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  validateConfigurationAgainstSchema(value: any, schema: ConfigurationSchema): { valid: boolean; errors: string[] } {
    try {
      const validate = this.ajv.compile(schema);
      const valid = validate(value);
      
      if (!valid) {
        const errors = validate.errors?.map((err: any) => 
          `Validation error at ${err.instancePath}: ${err.message}`
        ) || ['Validation failed'];
        
        return { valid: false, errors };
      }
      
      return { valid: true, errors: [] };
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Validation error']
      };
    }
  }
}