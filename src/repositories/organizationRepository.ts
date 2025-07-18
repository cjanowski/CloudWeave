import { BaseRepository } from './base';
import { OrganizationSettings } from '../types';

export interface OrganizationEntity {
  id: string;
  name: string;
  settings: OrganizationSettings;
  created_at: Date;
  updated_at: Date;
}

export interface CreateOrganizationData {
  name: string;
  settings?: OrganizationSettings;
}

export interface UpdateOrganizationData {
  name?: string;
  settings?: OrganizationSettings;
}

export class OrganizationRepository extends BaseRepository<OrganizationEntity> {
  constructor() {
    super('organizations');
  }

  async findByName(name: string): Promise<OrganizationEntity | null> {
    const result = await this.db(this.tableName)
      .where({ name })
      .first();
    
    return result || null;
  }

  async updateSettings(id: string, settings: Partial<OrganizationSettings>): Promise<OrganizationEntity | null> {
    const current = await this.findById(id);
    if (!current) return null;

    const updatedSettings = {
      ...current.settings,
      ...settings
    };

    return this.update(id, { settings: updatedSettings });
  }

  async getOrganizationStats(id: string): Promise<{
    userCount: number;
    projectCount: number;
    activeEnvironments: number;
  }> {
    const [userCount, projectCount, activeEnvironments] = await Promise.all([
      this.db('users').where({ organization_id: id, is_active: true }).count('* as count').first(),
      this.db('projects').where({ organization_id: id }).count('* as count').first(),
      this.db('environments')
        .join('projects', 'environments.project_id', 'projects.id')
        .where('projects.organization_id', id)
        .count('* as count')
        .first()
    ]);

    return {
      userCount: parseInt(userCount?.count as string) || 0,
      projectCount: parseInt(projectCount?.count as string) || 0,
      activeEnvironments: parseInt(activeEnvironments?.count as string) || 0
    };
  }
}

export const organizationRepository = new OrganizationRepository();