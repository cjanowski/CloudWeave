import { ConfigurationValidator } from './ConfigurationValidator';
import { Configuration, ConfigurationTemplate } from './types';

describe('ConfigurationValidator', () => {
  let validator: ConfigurationValidator;

  beforeEach(() => {
    validator = new ConfigurationValidator();
  });

  describe('validateConfiguration', () => {
    it('should validate a valid configuration', async () => {
      const config: Partial<Configuration> = {
        environmentId: 'env-1',
        name: 'Database URL',
        key: 'DATABASE_URL',
        value: 'postgresql://localhost:5432/mydb',
        type: 'string'
      };

      const result = await validator.validateConfiguration(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject configuration with missing required fields', async () => {
      const config: Partial<Configuration> = {
        name: 'Database URL'
      };

      const result = await validator.validateConfiguration(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Environment ID is required');
      expect(result.errors).toContain('Configuration key is required');
      expect(result.errors).toContain('Configuration value is required');
      expect(result.errors).toContain('Configuration type is required');
    });

    it('should reject configuration with invalid key format', async () => {
      const config: Partial<Configuration> = {
        environmentId: 'env-1',
        name: 'Invalid Config',
        key: 'invalid key!',
        value: 'test',
        type: 'string'
      };

      const result = await validator.validateConfiguration(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Configuration key must contain only alphanumeric characters, underscores, dots, and hyphens');
    });

    it('should reject configuration with invalid tag keys', async () => {
      const config: Partial<Configuration> = {
        environmentId: 'env-1',
        name: 'Test Config',
        key: 'TEST_KEY',
        value: 'test',
        type: 'string',
        tags: {
          'invalid tag!': 'value'
        }
      };

      const result = await validator.validateConfiguration(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Tag key 'invalid tag!' must contain only alphanumeric characters, underscores, dots, and hyphens");
    });
  });

  describe('validateValue', () => {
    it('should validate string values', () => {
      expect(validator.validateValue('string', 'test')).toBe(true);
      expect(validator.validateValue('string', 123)).toBe(false);
      expect(validator.validateValue('string', true)).toBe(false);
    });

    it('should validate number values', () => {
      expect(validator.validateValue('number', 123)).toBe(true);
      expect(validator.validateValue('number', 123.45)).toBe(true);
      expect(validator.validateValue('number', 'test')).toBe(false);
      expect(validator.validateValue('number', NaN)).toBe(false);
    });

    it('should validate boolean values', () => {
      expect(validator.validateValue('boolean', true)).toBe(true);
      expect(validator.validateValue('boolean', false)).toBe(true);
      expect(validator.validateValue('boolean', 'true')).toBe(false);
      expect(validator.validateValue('boolean', 1)).toBe(false);
    });

    it('should validate JSON values', () => {
      expect(validator.validateValue('json', { key: 'value' })).toBe(true);
      expect(validator.validateValue('json', '{"key": "value"}')).toBe(true);
      expect(validator.validateValue('json', 'invalid json')).toBe(false);
    });

    it('should validate YAML values', () => {
      expect(validator.validateValue('yaml', 'key: value')).toBe(true);
      expect(validator.validateValue('yaml', 123)).toBe(false);
    });

    it('should validate env values', () => {
      expect(validator.validateValue('env', 'KEY=value')).toBe(true);
      expect(validator.validateValue('env', 123)).toBe(false);
    });
  });

  describe('validateSchema', () => {
    it('should validate a valid JSON schema', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' }
        },
        required: ['name']
      };

      const result = validator.validateSchema(schema);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid JSON schema', () => {
      const schema = {
        type: 'invalid-type',
        properties: 'not-an-object'
      };

      const result = validator.validateSchema(schema);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateTemplate', () => {
    it('should validate a valid template', async () => {
      const template: Partial<ConfigurationTemplate> = {
        name: 'database-config',
        schema: {
          type: 'object',
          properties: {
            host: { type: 'string' },
            port: { type: 'number' }
          },
          required: ['host']
        },
        defaultValues: {
          host: 'localhost',
          port: 5432
        }
      };

      const result = await validator.validateTemplate(template);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject template with missing required fields', async () => {
      const template: Partial<ConfigurationTemplate> = {
        description: 'A template without name or schema'
      };

      const result = await validator.validateTemplate(template);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Template name is required');
      expect(result.errors).toContain('Template schema is required');
    });

    it('should reject template with invalid name format', async () => {
      const template: Partial<ConfigurationTemplate> = {
        name: 'invalid name!',
        schema: {
          type: 'object',
          properties: {}
        }
      };

      const result = await validator.validateTemplate(template);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Template name must contain only alphanumeric characters, underscores, dots, and hyphens');
    });

    it('should reject template with default values that do not match schema', async () => {
      const template: Partial<ConfigurationTemplate> = {
        name: 'test-template',
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' }
          },
          required: ['name', 'age']
        },
        defaultValues: {
          name: 'John',
          age: 'not-a-number' // Invalid type
        }
      };

      const result = await validator.validateTemplate(template);

      expect(result.valid).toBe(false);
      expect(result.errors.some(error => error.includes('Default value error'))).toBe(true);
    });
  });

  describe('validateConfigurationAgainstSchema', () => {
    it('should validate value against schema', () => {
      const schema = {
        type: 'object' as const,
        properties: {
          name: { type: 'string' as const },
          age: { type: 'number' as const }
        },
        required: ['name']
      };

      const validValue = { name: 'John', age: 30 };
      const result = validator.validateConfigurationAgainstSchema(validValue, schema);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject value that does not match schema', () => {
      const schema = {
        type: 'object' as const,
        properties: {
          name: { type: 'string' as const },
          age: { type: 'number' as const }
        },
        required: ['name']
      };

      const invalidValue = { age: 30 }; // Missing required 'name'
      const result = validator.validateConfigurationAgainstSchema(invalidValue, schema);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});