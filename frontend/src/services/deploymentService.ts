import { apiService } from './apiService';

// Deployment data types
export interface Deployment {
  id: string;
  name: string;
  application: string;
  version: string;
  environment: 'development' | 'staging' | 'production' | 'testing';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'rollback';
  progress: number; // 0-100
  startedAt?: string;
  completedAt?: string;
  duration?: number; // in seconds
  deployedBy: string;
  branch?: string;
  commit?: string;
  configuration?: Record<string, any>;
  logs?: string[];
  rollbackTarget?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeploymentStats {
  activeDeployments: number;
  activeDeploymentsChange: string;
  activeDeploymentsTrend: 'up' | 'down' | 'stable';
  successRate: number;
  successRateChange: string;
  successRateTrend: 'up' | 'down' | 'stable';
  failedDeployments: number;
  failedDeploymentsChange: string;
  failedDeploymentsTrend: 'up' | 'down' | 'stable';
  avgDeployTime: number; // in minutes
  avgDeployTimeChange: string;
  avgDeployTimeTrend: 'up' | 'down' | 'stable';
}

export interface Environment {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'error' | 'maintenance';
  servicesCount: number;
  lastDeployment?: string;
  uptime: number; // percentage
}

export interface Pipeline {
  id: string;
  name: string;
  repository: string;
  branch: string;
  status: 'idle' | 'running' | 'success' | 'failed';
  lastRun?: string;
  nextRun?: string;
  stages: PipelineStage[];
}

export interface PipelineStage {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  duration?: number;
  startedAt?: string;
  completedAt?: string;
}

export interface DeploymentFilters {
  environment?: string;
  status?: string;
  application?: string;
  deployedBy?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface DeploymentListResponse {
  data: Deployment[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface CreateDeploymentRequest {
  name: string;
  application: string;
  version: string;
  environment: string;
  branch?: string;
  commit?: string;
  configuration?: Record<string, any>;
}

export class DeploymentService {
  private static instance: DeploymentService;

  public static getInstance(): DeploymentService {
    if (!DeploymentService.instance) {
      DeploymentService.instance = new DeploymentService();
    }
    return DeploymentService.instance;
  }

  // Get deployment statistics
  async getDeploymentStats(): Promise<DeploymentStats> {
    try {
      // For now, return mock data until backend endpoints are enabled
      // TODO: Replace with real API call once backend is ready
      // return await apiService.get<DeploymentStats>('/deployments/stats');
      
      return {
        activeDeployments: 12,
        activeDeploymentsChange: '+2',
        activeDeploymentsTrend: 'up',
        successRate: 98.5,
        successRateChange: '+1.2%',
        successRateTrend: 'up',
        failedDeployments: 1,
        failedDeploymentsChange: '-3',
        failedDeploymentsTrend: 'down',
        avgDeployTime: 4.2,
        avgDeployTimeChange: '-0.8min',
        avgDeployTimeTrend: 'up',
      };
    } catch (error) {
      console.error('Failed to fetch deployment stats:', error);
      throw error;
    }
  }

  // Get recent deployments
  async getRecentDeployments(limit: number = 10): Promise<Deployment[]> {
    try {
      // For now, return mock data until backend endpoints are enabled
      // TODO: Replace with real API call once backend is ready
      // return await apiService.get<Deployment[]>(`/deployments/recent?limit=${limit}`);
      
      return this.generateMockDeployments().slice(0, limit);
    } catch (error) {
      console.error('Failed to fetch recent deployments:', error);
      throw error;
    }
  }

  // Get environments
  async getEnvironments(): Promise<Environment[]> {
    try {
      // For now, return mock data until backend endpoints are enabled
      // TODO: Replace with real API call once backend is ready
      // return await apiService.get<Environment[]>('/deployments/environments');
      
      return [
        {
          id: 'production',
          name: 'Production',
          status: 'healthy',
          servicesCount: 8,
          lastDeployment: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          uptime: 99.9
        },
        {
          id: 'staging',
          name: 'Staging',
          status: 'healthy',
          servicesCount: 6,
          lastDeployment: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
          uptime: 99.5
        },
        {
          id: 'development',
          name: 'Development',
          status: 'healthy',
          servicesCount: 4,
          lastDeployment: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          uptime: 98.8
        },
        {
          id: 'testing',
          name: 'Testing',
          status: 'maintenance',
          servicesCount: 2,
          lastDeployment: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
          uptime: 95.2
        }
      ];
    } catch (error) {
      console.error('Failed to fetch environments:', error);
      throw error;
    }
  }

  // List deployments with pagination and filtering
  async listDeployments(
    page: number = 1,
    limit: number = 20,
    filters: DeploymentFilters = {}
  ): Promise<DeploymentListResponse> {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filters.environment && { environment: filters.environment }),
        ...(filters.status && { status: filters.status }),
        ...(filters.application && { application: filters.application }),
        ...(filters.deployedBy && { deployedBy: filters.deployedBy }),
      });
      return await apiService.get<DeploymentListResponse>(`/deployments?${queryParams}`);
    } catch (error) {
      console.warn('API not available, using mock data for deployments list');
      const mockData = this.generateMockDeploymentsPage(page, limit, filters);
      return mockData;
    }
  }

  // Get all deployments (alias for listDeployments)
  async getDeployments(): Promise<Deployment[]> {
    try {
      const response = await this.listDeployments(1, 1000);
      return response.data;
    } catch (error) {
      console.warn('API not available, using mock data for deployments');
      return this.generateMockDeployments();
    }
  }

  // Get specific deployment
  async getDeployment(id: string): Promise<Deployment> {
    try {
      return await apiService.get<Deployment>(`/deployments/${id}`);
    } catch (error) {
      console.warn('API not available, using mock data for deployment');
      return this.generateMockDeployment(id);
    }
  }

  // Create new deployment
  async createDeployment(data: CreateDeploymentRequest): Promise<Deployment> {
    try {
      return await apiService.post<Deployment>('/deployments', data);
    } catch (error) {
      console.warn('API not available, using mock data for deployment creation');
      const newDeployment: Deployment = {
        id: `deploy-${Date.now()}`,
        name: data.name,
        application: data.application,
        version: data.version,
        environment: data.environment as any,
        status: 'pending',
        progress: 0,
        deployedBy: 'current-user', // This would come from auth context
        branch: data.branch,
        commit: data.commit,
        configuration: data.configuration,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Simulate deployment progress
      setTimeout(() => this.simulateDeploymentProgress(newDeployment.id), 1000);
      
      return newDeployment;
    }
  }

  // Cancel deployment
  async cancelDeployment(id: string, reason?: string): Promise<void> {
    try {
      // TODO: Replace with real API call once backend is ready
      // await apiService.post(`/deployments/${id}/cancel`, { reason });
      
      console.log(`Deployment ${id} cancelled: ${reason || 'No reason provided'}`);
    } catch (error) {
      console.error('Failed to cancel deployment:', error);
      throw error;
    }
  }

  // Rollback deployment
  async rollbackDeployment(id: string, targetVersion: string, reason?: string): Promise<Deployment> {
    try {
      // TODO: Replace with real API call once backend is ready
      // return await apiService.post<Deployment>(`/deployments/${id}/rollback`, { 
      //   targetVersion, 
      //   reason 
      // });
      
      console.log(`Rollback reason: ${reason || 'No reason provided'}`);
      
      const rollbackDeployment: Deployment = {
        id: `rollback-${Date.now()}`,
        name: `Rollback to ${targetVersion}`,
        application: 'app-name', // This would come from the original deployment
        version: targetVersion,
        environment: 'production', // This would come from the original deployment
        status: 'pending',
        progress: 0,
        deployedBy: 'current-user',
        rollbackTarget: id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      return rollbackDeployment;
    } catch (error) {
      console.error('Failed to rollback deployment:', error);
      throw error;
    }
  }

  // Get deployment logs
  async getDeploymentLogs(_id: string): Promise<string[]> {
    try {
      // TODO: Replace with real API call once backend is ready
      // return await apiService.get<string[]>(`/deployments/${id}/logs`);
      
      return [
        '[2024-01-20 10:00:00] Starting deployment...',
        '[2024-01-20 10:00:01] Pulling latest image...',
        '[2024-01-20 10:00:15] Image pulled successfully',
        '[2024-01-20 10:00:16] Stopping old containers...',
        '[2024-01-20 10:00:20] Starting new containers...',
        '[2024-01-20 10:00:25] Health check passed',
        '[2024-01-20 10:00:26] Deployment completed successfully'
      ];
    } catch (error) {
      console.error('Failed to fetch deployment logs:', error);
      throw error;
    }
  }

  // Get pipelines
  async getPipelines(): Promise<Pipeline[]> {
    try {
      // TODO: Replace with real API call once backend is ready
      // return await apiService.get<Pipeline[]>('/deployments/pipelines');
      
      return [
        {
          id: 'pipeline-1',
          name: 'Web App CI/CD',
          repository: 'github.com/company/web-app',
          branch: 'main',
          status: 'success',
          lastRun: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          stages: [
            { id: 'build', name: 'Build', status: 'success', duration: 120 },
            { id: 'test', name: 'Test', status: 'success', duration: 80 },
            { id: 'deploy', name: 'Deploy', status: 'success', duration: 45 }
          ]
        },
        {
          id: 'pipeline-2',
          name: 'API Service CI/CD',
          repository: 'github.com/company/api-service',
          branch: 'develop',
          status: 'running',
          lastRun: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
          stages: [
            { id: 'build', name: 'Build', status: 'success', duration: 95 },
            { id: 'test', name: 'Test', status: 'running' },
            { id: 'deploy', name: 'Deploy', status: 'pending' }
          ]
        }
      ];
    } catch (error) {
      console.error('Failed to fetch pipelines:', error);
      throw error;
    }
  }

  // Generate mock deployment data for development
  private generateMockDeployments(): Deployment[] {
    const applications = ['web-app', 'api-service', 'worker-service', 'frontend', 'backend'];
    const environments: Array<'development' | 'staging' | 'production' | 'testing'> = 
      ['development', 'staging', 'production', 'testing'];
    const statuses: Array<'pending' | 'running' | 'completed' | 'failed' | 'cancelled'> = 
      ['pending', 'running', 'completed', 'failed', 'cancelled'];
    const users = ['john.doe', 'jane.smith', 'bob.wilson', 'alice.johnson'];

    const deployments: Deployment[] = [];
    
    for (let i = 0; i < 20; i++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const startTime = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
      const duration = Math.floor(Math.random() * 300 + 60); // 1-6 minutes
      
      deployments.push({
        id: `deploy-${i + 1}`,
        name: `${applications[i % applications.length]}-v${Math.floor(Math.random() * 3 + 1)}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`,
        application: applications[i % applications.length],
        version: `v${Math.floor(Math.random() * 3 + 1)}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`,
        environment: environments[i % environments.length],
        status,
        progress: status === 'completed' ? 100 : status === 'running' ? Math.floor(Math.random() * 80 + 10) : 0,
        startedAt: startTime.toISOString(),
        completedAt: status === 'completed' ? new Date(startTime.getTime() + duration * 1000).toISOString() : undefined,
        duration: status === 'completed' ? duration : undefined,
        deployedBy: users[Math.floor(Math.random() * users.length)],
        branch: ['main', 'develop', 'feature/new-ui'][Math.floor(Math.random() * 3)],
        commit: Math.random().toString(36).substring(2, 9),
        createdAt: startTime.toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    return deployments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  private generateMockDeploymentsPage(
    page: number,
    limit: number,
    filters: DeploymentFilters
  ): DeploymentListResponse {
    let allDeployments = this.generateMockDeployments();

    // Apply filters
    if (filters.environment) {
      allDeployments = allDeployments.filter(d => d.environment === filters.environment);
    }
    if (filters.status) {
      allDeployments = allDeployments.filter(d => d.status === filters.status);
    }
    if (filters.application) {
      allDeployments = allDeployments.filter(d => d.application === filters.application);
    }
    if (filters.deployedBy) {
      allDeployments = allDeployments.filter(d => d.deployedBy === filters.deployedBy);
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const data = allDeployments.slice(startIndex, endIndex);

    return {
      data,
      total: allDeployments.length,
      page,
      limit,
      hasMore: endIndex < allDeployments.length,
    };
  }

  private generateMockDeployment(id: string): Deployment {
    const applications = ['web-app', 'api-service', 'worker-service', 'frontend', 'backend'];
    const environments: Array<'development' | 'staging' | 'production' | 'testing'> = 
      ['development', 'staging', 'production', 'testing'];
    const statuses: Array<'pending' | 'running' | 'completed' | 'failed' | 'cancelled'> = 
      ['pending', 'running', 'completed', 'failed', 'cancelled'];

    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const startTime = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000);
    const duration = Math.floor(Math.random() * 300 + 60);

    return {
      id,
      name: `${applications[0]}-v1.2.3`,
      application: applications[0],
      version: 'v1.2.3',
      environment: environments[0],
      status,
      progress: status === 'completed' ? 100 : status === 'running' ? Math.floor(Math.random() * 80 + 10) : 0,
      startedAt: startTime.toISOString(),
      completedAt: status === 'completed' ? new Date(startTime.getTime() + duration * 1000).toISOString() : undefined,
      duration: status === 'completed' ? duration : undefined,
      deployedBy: 'john.doe',
      branch: 'main',
      commit: 'abc1234',
      configuration: {
        replicas: 3,
        memory: '512Mi',
        cpu: '500m'
      },
      logs: [
        '[2024-01-20 10:00:00] Starting deployment...',
        '[2024-01-20 10:00:01] Pulling latest image...',
        '[2024-01-20 10:00:15] Image pulled successfully'
      ],
      createdAt: startTime.toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  private simulateDeploymentProgress(_deploymentId: string): void {
    // This would normally be handled by WebSocket updates
    // console.log(`Simulating progress for deployment ${deploymentId}`);
  }
}

// Export singleton instance
export const deploymentService = DeploymentService.getInstance();
export default deploymentService;