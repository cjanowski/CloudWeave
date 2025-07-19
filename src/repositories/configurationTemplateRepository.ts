import { BaseRepository } from './base';
import { ConfigurationTemplate } from '../services/configuration/types';
import { IConfigurationTemplateRepository } from '../services/configuration/interfaces';

export class ConfigurationTemplateRepository extends BaseRepository implements IConfigurationTemplateRepository {
  protected tableName = 'configuration_templates';

  async create(template: Omit<ConfigurationTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<ConfigurationTemplate> {
    const [result] = await this.db(this.tableName)
      .insert({
        ...template,
        schema: JSON.stringify(template.schema),
        default_values: JSON.stringify(template.defaultValues),
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');

    return this.mapToTemplate(result);
  }

  async findById(id: string): Promise<ConfigurationTemplate | null> {
    const result = await this.db(this.tableName)
      .where({ id })
      .first();

    return result ? this.mapToTemplate(result) : null;
  }

  async update(id: string, updates: Partial<ConfigurationTemplate>): Promise<ConfigurationTemplate> {
    const updateData: any = {
      ...updates,
      updated_at: new Date()
    };

    if (updates.schema) {
      updateData.schema = JSON.stringify(updates.schema);
    }
    if (updates.defaultValues) {
      updateData.default_values = JSON.stringify(updates.defaultValues);
    }

    const [result] = await this.db(this.tableName)
      .where({ id })
      .update(updateData)
      .returning('*');

    return this.mapToTemplate(result);
  }

  async delete(id: string): Promise<void> {
    await this.db(this.tableName)
      .where({ id })
      .del();
  }

  async findMany(): Promise<ConfigurationTemplate[]> {
    const results = await this.db(this.tableName)
      .orderBy('created_at', 'desc');

    return results.map(this.mapToTemplate);
  }

  private mapToTemplate(row: any): ConfigurationTemplate {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      schema: typeof row.schema === 'string' ? JSON.parse(row.schema) : row.schema,
      defaultValues: typeof row.default_values === 'string' ? JSON.parse(row.default_values) : row.default_values,
      tags: row.tags || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by
    };
  }
}