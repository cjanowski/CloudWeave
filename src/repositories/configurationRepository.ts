import { BaseRepository } from './base';
import {
  Configuration,
  ConfigurationVersion,
  ConfigurationFilter
} from '../services/configuration/types';
import { IConfigurationRepository } from '../services/configuration/interfaces';

export class ConfigurationRepository extends BaseRepository implements IConfigurationRepository {
  protected tableName = 'configurations';
  protected versionTableName = 'configuration_versions';

  async create(config: Omit<Configuration, 'id' | 'createdAt' | 'updatedAt'>): Promise<Configuration> {
    const [result] = await this.db(this.tableName)
      .insert({
        ...config,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');

    // Create initial version
    await this.createVersion({
      configurationId: result.id,
      version: 1,
      value: config.value,
      changeDescription: 'Initial configuration',
      createdBy: config.createdBy
    });

    return this.mapToConfiguration(result);
  }

  async findById(id: string): Promise<Configuration | null> {
    const result = await this.db(this.tableName)
      .where({ id })
      .first();

    return result ? this.mapToConfiguration(result) : null;
  }

  async findByKey(environmentId: string, key: string): Promise<Configuration | null> {
    const result = await this.db(this.tableName)
      .where({ environment_id: environmentId, key })
      .first();

    return result ? this.mapToConfiguration(result) : null;
  }

  async update(id: string, updates: Partial<Configuration>): Promise<Configuration> {
    // Get current configuration to create version
    const current = await this.findById(id);
    if (!current) {
      throw new Error(`Configuration with id ${id} not found`);
    }

    const newVersion = current.version + 1;
    const updateData = {
      ...updates,
      version: newVersion,
      updated_at: new Date()
    };

    const [result] = await this.db(this.tableName)
      .where({ id })
      .update(updateData)
      .returning('*');

    // Create version record if value changed
    if (updates.value !== undefined) {
      await this.createVersion({
        configurationId: id,
        version: newVersion,
        value: updates.value,
        changeDescription: (updates as any).changeDescription || 'Configuration updated',
        createdBy: (updates as any).updatedBy || 'system'
      });
    }

    return this.mapToConfiguration(result);
  }

  async delete(id: string): Promise<void> {
    await this.db.transaction(async (trx) => {
      // Delete versions first
      await trx(this.versionTableName)
        .where({ configuration_id: id })
        .del();

      // Delete configuration
      await trx(this.tableName)
        .where({ id })
        .del();
    });
  }

  async findMany(filter?: ConfigurationFilter): Promise<Configuration[]> {
    let query = this.db(this.tableName);

    if (filter) {
      if (filter.environmentId) {
        query = query.where('environment_id', filter.environmentId);
      }
      if (filter.name) {
        query = query.where('name', 'ilike', `%${filter.name}%`);
      }
      if (filter.key) {
        query = query.where('key', 'ilike', `%${filter.key}%`);
      }
      if (filter.type) {
        query = query.where('type', filter.type);
      }
      if (filter.isSecret !== undefined) {
        query = query.where('is_secret', filter.isSecret);
      }
      if (filter.tags) {
        Object.entries(filter.tags).forEach(([key, value]) => {
          query = query.whereRaw('tags->>? = ?', [key, value]);
        });
      }
    }

    const results = await query.orderBy('created_at', 'desc');
    return results.map(this.mapToConfiguration);
  }

  async findByEnvironment(environmentId: string): Promise<Configuration[]> {
    const results = await this.db(this.tableName)
      .where({ environment_id: environmentId })
      .orderBy('key');

    return results.map(this.mapToConfiguration);
  }

  async search(query: string, filter?: ConfigurationFilter): Promise<Configuration[]> {
    let dbQuery = this.db(this.tableName)
      .where(function() {
        this.where('name', 'ilike', `%${query}%`)
          .orWhere('key', 'ilike', `%${query}%`)
          .orWhere('description', 'ilike', `%${query}%`);
      });

    if (filter) {
      if (filter.environmentId) {
        dbQuery = dbQuery.where('environment_id', filter.environmentId);
      }
      if (filter.type) {
        dbQuery = dbQuery.where('type', filter.type);
      }
      if (filter.isSecret !== undefined) {
        dbQuery = dbQuery.where('is_secret', filter.isSecret);
      }
    }

    const results = await dbQuery.orderBy('created_at', 'desc');
    return results.map(this.mapToConfiguration);
  }

  async createVersion(version: Omit<ConfigurationVersion, 'id' | 'createdAt'>): Promise<ConfigurationVersion> {
    const [result] = await this.db(this.versionTableName)
      .insert({
        configuration_id: version.configurationId,
        version: version.version,
        value: JSON.stringify(version.value),
        change_description: version.changeDescription,
        created_by: version.createdBy,
        created_at: new Date()
      })
      .returning('*');

    return this.mapToConfigurationVersion(result);
  }

  async findVersions(configurationId: string): Promise<ConfigurationVersion[]> {
    const results = await this.db(this.versionTableName)
      .where({ configuration_id: configurationId })
      .orderBy('version', 'desc');

    return results.map(this.mapToConfigurationVersion);
  }

  async findVersion(configurationId: string, version: number): Promise<ConfigurationVersion | null> {
    const result = await this.db(this.versionTableName)
      .where({ configuration_id: configurationId, version })
      .first();

    return result ? this.mapToConfigurationVersion(result) : null;
  }

  private mapToConfiguration(row: any): Configuration {
    return {
      id: row.id,
      environmentId: row.environment_id,
      name: row.name,
      key: row.key,
      value: typeof row.value === 'string' ? JSON.parse(row.value) : row.value,
      type: row.type,
      isSecret: row.is_secret,
      version: row.version,
      description: row.description,
      tags: row.tags || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by
    };
  }

  private mapToConfigurationVersion(row: any): ConfigurationVersion {
    return {
      id: row.id,
      configurationId: row.configuration_id,
      version: row.version,
      value: typeof row.value === 'string' ? JSON.parse(row.value) : row.value,
      changeDescription: row.change_description,
      createdAt: row.created_at,
      createdBy: row.created_by
    };
  }
}