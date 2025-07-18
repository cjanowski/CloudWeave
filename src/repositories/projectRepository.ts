import { BaseRepository, QueryOptions, PaginatedResult } from './base';
import { CloudProvider, EnvironmentType } from '../types';

export interface ProjectEntity {
  id: string;
  name: string;
  description: string | null;
  organization_id: string;
  cost_center: string | null;
  tags: Record<string, string>;
  created_at: Date;
  updated_at: Date;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  organization_id: string;
  cost_center?: string;
  tags?: Record<string, string>;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  cost_center?: string;
  tags?: Record<string, string>;
}

export interface ProjectWithEnvironments extends ProjectEntity {
  environments: {
    id: string;
    name: string;
    type: EnvironmentType;
    cloud_provider: CloudProvider;
    region: string;
  }[];
}

export class ProjectRepository extends BaseRepository<ProjectEntity> {
  constructor() {
    super('projects');
  }

  async findByOrganization(organizationId: string, options: QueryOptions = {}): Promise<PaginatedResult<ProjectEntity>> {
    return this.findAll({
      ...options,
      filters: { ...options.filters, organization_id: organizationId }
    });
  }

  async findByName(name: string, organizationId: string): Promise<ProjectEntity | null> {
    const result = await this.db(this.tableName)
      .where({ name, organization_id: organizationId })
      .first();
    
    return result || null;
  }

  async findWithEnvironments(projectId: string): Promise<ProjectWithEnvironments | null> {
    const project = await this.findById(projectId);
    if (!project) return null;

    const environments = await this.db('environments')
      .where({ project_id: projectId })
      .select('id', 'name', 'type', 'cloud_provider', 'region')
      .orderBy('type');

    return {
      ...project,
      environments
    };
  }

  async getProjectStats(projectId: string): Promise<{
    environmentCount: number;
    resourceCount: number;
    deploymentCount: number;
    lastDeployment: Date | null;
  }> {
    const [environmentCount, resourceCount, deploymentCount, lastDeployment] = await Promise.all([
      this.db('environments').where({ project_id: projectId }).count('* as count').first(),
      this.db('resources')
        .join('environments', 'resources.environment_id', 'environments.id')
        .where('environments.project_id', projectId)
        .count('* as count')
        .first(),
      this.db('deployments')
        .join('environments', 'deployments.environment_id', 'environments.id')
        .where('environments.project_id', projectId)
        .count('* as count')
        .first(),
      this.db('deployments')
        .join('environments', 'deployments.environment_id', 'environments.id')
        .where('environments.project_id', projectId)
        .orderBy('deployments.created_at', 'desc')
        .first('deployments.created_at')
    ]);

    return {
      environmentCount: parseInt(environmentCount?.count as string) || 0,
      resourceCount: parseInt(resourceCount?.count as string) || 0,
      deploymentCount: parseInt(deploymentCount?.count as string) || 0,
      lastDeployment: lastDeployment?.created_at || null
    };
  }

  async findByCostCenter(costCenter: string, organizationId: string): Promise<ProjectEntity[]> {
    return this.db(this.tableName)
      .where({ cost_center: costCenter, organization_id: organizationId })
      .orderBy('name');
  }

  async updateTags(projectId: string, tags: Record<string, string>): Promise<ProjectEntity | null> {
    const current = await this.findById(projectId);
    if (!current) return null;

    const updatedTags = {
      ...current.tags,
      ...tags
    };

    return this.update(projectId, { tags: updatedTags });
  }
}

export const projectRepository = new ProjectRepository();