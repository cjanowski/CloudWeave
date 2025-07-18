import { BaseRepository, QueryOptions, PaginatedResult } from './base';
import { CloudProvider, EnvironmentType } from '../types';

export interface EnvironmentEntity {
  id: string;
  name: string;
  project_id: string;
  type: EnvironmentType;
  cloud_provider: CloudProvider;
  region: string;
  configuration: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface CreateEnvironmentData {
  name: string;
  project_id: string;
  type: EnvironmentType;
  cloud_provider: CloudProvider;
  region: string;
  configuration?: Record<string, any>;
}

export interface UpdateEnvironmentData {
  name?: string;
  type?: EnvironmentType;
  cloud_provider?: CloudProvider;
  region?: string;
  configuration?: Record<string, any>;
}

export interface EnvironmentWithResources extends EnvironmentEntity {
  resources: {
    id: string;
    name: string;
    type: string;
    status: string;
    cloud_resource_id: string;
  }[];
}

export class EnvironmentRepository extends BaseRepository<EnvironmentEntity> {
  constructor() {
    super('environments');
  }

  async findByProject(projectId: string, options: QueryOptions = {}): Promise<PaginatedResult<EnvironmentEntity>> {
    return this.findAll({
      ...options,
      filters: { ...options.filters, project_id: projectId }
    });
  }

  async findByName(name: string, projectId: string): Promise<EnvironmentEntity | null> {
    const result = await this.db(this.tableName)
      .where({ name, project_id: projectId })
      .first();
    
    return result || null;
  }

  async findByCloudProvider(cloudProvider: CloudProvider): Promise<EnvironmentEntity[]> {
    return this.db(this.tableName)
      .where({ cloud_provider: cloudProvider })
      .orderBy('name');
  }

  async findByType(type: EnvironmentType): Promise<EnvironmentEntity[]> {
    return this.db(this.tableName)
      .where({ type })
      .orderBy('name');
  }

  async findWithResources(environmentId: string): Promise<EnvironmentWithResources | null> {
    const environment = await this.findById(environmentId);
    if (!environment) return null;

    const resources = await this.db('resources')
      .where({ environment_id: environmentId })
      .select('id', 'name', 'type', 'status', 'cloud_resource_id')
      .orderBy('name');

    return {
      ...environment,
      resources
    };
  }

  async getEnvironmentStats(environmentId: string): Promise<{
    resourceCount: number;
    activeResources: number;
    deploymentCount: number;
    configurationCount: number;
  }> {
    const [resourceCount, activeResources, deploymentCount, configurationCount] = await Promise.all([
      this.db('resources').where({ environment_id: environmentId }).count('* as count').first(),
      this.db('resources').where({ environment_id: environmentId, status: 'active' }).count('* as count').first(),
      this.db('deployments').where({ environment_id: environmentId }).count('* as count').first(),
      this.db('configurations').where({ environment_id: environmentId }).count('* as count').first()
    ]);

    return {
      resourceCount: parseInt(resourceCount?.count as string) || 0,
      activeResources: parseInt(activeResources?.count as string) || 0,
      deploymentCount: parseInt(deploymentCount?.count as string) || 0,
      configurationCount: parseInt(configurationCount?.count as string) || 0
    };
  }

  async updateConfiguration(environmentId: string, configuration: Record<string, any>): Promise<EnvironmentEntity | null> {
    const current = await this.findById(environmentId);
    if (!current) return null;

    const updatedConfiguration = {
      ...current.configuration,
      ...configuration
    };

    return this.update(environmentId, { configuration: updatedConfiguration });
  }

  async findByRegion(region: string, cloudProvider?: CloudProvider): Promise<EnvironmentEntity[]> {
    let query = this.db(this.tableName).where({ region });
    
    if (cloudProvider) {
      query = query.where({ cloud_provider: cloudProvider });
    }

    return query.orderBy('name');
  }
}

export const environmentRepository = new EnvironmentRepository();