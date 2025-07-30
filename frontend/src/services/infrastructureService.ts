import { apiService } from './apiService';

// Infrastructure data types
export interface Infrastructure {
  id: string;
  name: string;
  provider: 'aws' | 'azure' | 'gcp';
  type: 'compute' | 'storage' | 'database' | 'network' | 'security';
  status: 'running' | 'stopped' | 'pending' | 'error' | 'terminated';
  region: string;
  instanceType?: string;
  size?: string;
  cost: {
    daily: number;
    monthly: number;
    currency: string;
  };
  tags: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  metrics?: {
    cpuUtilization?: number;
    memoryUtilization?: number;
    networkIn?: number;
    networkOut?: number;
    storageUsed?: number;
  };
}

export interface InfrastructureStats {
  totalResources: number;
  totalResourcesChange: string;
  totalResourcesTrend: 'up' | 'down' | 'stable';
  activeInstances: number;
  activeInstancesChange: string;
  activeInstancesTrend: 'up' | 'down' | 'stable';
  networks: number;
  networksChange: string;
  networksTrend: 'up' | 'down' | 'stable';
  complianceScore: number;
  complianceScoreChange: string;
  complianceScoreTrend: 'up' | 'down' | 'stable';
}

export interface ResourceDistribution {
  ec2Instances: number;
  s3Buckets: number;
  rdsDatabases: number;
  lambdaFunctions: number;
  totalCount: number;
}

export interface RecentChange {
  id: string;
  message: string;
  timestamp: string;
  type: 'created' | 'updated' | 'deleted' | 'deployed';
  resourceId?: string;
  resourceName?: string;
}

export interface InfrastructureFilters {
  provider?: string;
  type?: string;
  status?: string;
  region?: string;
  search?: string;
}

export interface InfrastructureListResponse {
  data: Infrastructure[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export class InfrastructureService {
  private static instance: InfrastructureService;

  public static getInstance(): InfrastructureService {
    if (!InfrastructureService.instance) {
      InfrastructureService.instance = new InfrastructureService();
    }
    return InfrastructureService.instance;
  }

  // Get infrastructure statistics for overview
  async getInfrastructureStats(): Promise<InfrastructureStats> {
    return await apiService.get<InfrastructureStats>('/infrastructure/stats');
  }

  // Get resource distribution
  async getResourceDistribution(): Promise<ResourceDistribution> {
    return await apiService.get<ResourceDistribution>('/infrastructure/distribution');
  }

  // Get recent changes
  async getRecentChanges(): Promise<RecentChange[]> {
    return await apiService.get<RecentChange[]>('/infrastructure/recent-changes');
  }

  // List infrastructure resources with pagination and filtering
  async listInfrastructure(
    page: number = 1,
    limit: number = 20,
    filters: InfrastructureFilters = {}
  ): Promise<InfrastructureListResponse> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });
    return await apiService.get<InfrastructureListResponse>(`/infrastructure?${queryParams}`);
  }

  // Get specific infrastructure resource
  async getInfrastructure(id: string): Promise<Infrastructure> {
    return await apiService.get<Infrastructure>(`/infrastructure/${id}`);
  }

  // Create new infrastructure resource
  async createInfrastructure(data: Partial<Infrastructure>): Promise<Infrastructure> {
    return await apiService.post<Infrastructure>('/infrastructure', data);
  }

  // Update infrastructure resource
  async updateInfrastructure(id: string, data: Partial<Infrastructure>): Promise<Infrastructure> {
    return await apiService.put<Infrastructure>(`/infrastructure/${id}`, data);
  }

  // Delete infrastructure resource
  async deleteInfrastructure(id: string): Promise<void> {
    await apiService.delete(`/infrastructure/${id}`);
  }

  // Generate mock infrastructure data for development
  private generateMockInfrastructure(
    page: number,
    limit: number,
    filters: InfrastructureFilters
  ): InfrastructureListResponse {
    const providers = ['aws', 'azure', 'gcp'] as const;
    const types = ['compute', 'storage', 'database', 'network', 'security'] as const;
    const statuses = ['running', 'stopped', 'pending', 'error'] as const;
    const regions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'];

    const totalItems = 156;
    const startIndex = (page - 1) * limit;
    
    const data: Infrastructure[] = [];
    for (let i = 0; i < Math.min(limit, totalItems - startIndex); i++) {
      const index = startIndex + i;
      const provider = providers[index % providers.length];
      const type = types[index % types.length];
      const status = statuses[index % statuses.length];
      
      // Apply filters
      if (filters.provider && provider !== filters.provider) continue;
      if (filters.type && type !== filters.type) continue;
      if (filters.status && status !== filters.status) continue;
      
      data.push(this.generateMockInfrastructureItem(`infra-${index}`, {
        provider,
        type,
        status,
        region: regions[index % regions.length]
      }));
    }

    return {
      data,
      total: totalItems,
      page,
      limit,
      hasMore: startIndex + limit < totalItems,
    };
  }

  private generateMockInfrastructureItem(
    id: string,
    overrides: Partial<Infrastructure> = {}
  ): Infrastructure {
    const providers = ['aws', 'azure', 'gcp'] as const;
    const types = ['compute', 'storage', 'database', 'network', 'security'] as const;
    const statuses = ['running', 'stopped', 'pending', 'error'] as const;
    
    const baseItem: Infrastructure = {
      id,
      name: `Resource ${id}`,
      provider: providers[Math.floor(Math.random() * providers.length)],
      type: types[Math.floor(Math.random() * types.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      region: 'us-east-1',
      instanceType: 't3.medium',
      cost: {
        daily: Math.round((Math.random() * 50 + 5) * 100) / 100,
        monthly: Math.round((Math.random() * 1500 + 150) * 100) / 100,
        currency: 'USD'
      },
      tags: {
        Environment: ['development', 'staging', 'production'][Math.floor(Math.random() * 3)],
        Project: ['web-app', 'api-service', 'data-pipeline'][Math.floor(Math.random() * 3)]
      },
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      metrics: {
        cpuUtilization: Math.round(Math.random() * 100),
        memoryUtilization: Math.round(Math.random() * 100),
        networkIn: Math.round(Math.random() * 1000),
        networkOut: Math.round(Math.random() * 1000),
        storageUsed: Math.round(Math.random() * 100),
      }
    };

    return { ...baseItem, ...overrides };
  }
}

// Export singleton instance
export const infrastructureService = InfrastructureService.getInstance();
export default infrastructureService;