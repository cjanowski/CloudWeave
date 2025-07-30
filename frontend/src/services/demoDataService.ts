import { apiService } from './apiService';

export interface DemoScenario {
  id: 'startup' | 'enterprise' | 'devops' | 'multicloud';
  name: string;
  description: string;
  features: string[];
  estimatedCost: string;
}

export interface DemoMetadata {
  isDemo: boolean;
  scenario: string;
  realistic: boolean;
  tags: string[];
  description: string;
}

export interface DemoInfrastructure {
  id: string;
  name: string;
  type: string;
  provider: string;
  region: string;
  status: string;
  specifications: Record<string, any>;
  costInfo: Record<string, any>;
  tags: string[];
  demoMetadata: DemoMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface DemoDeployment {
  id: string;
  name: string;
  application: string;
  version: string;
  environment: string;
  status: string;
  progress: number;
  configuration: Record<string, any>;
  demoMetadata: DemoMetadata;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DemoMetric {
  id: string;
  resourceId?: string;
  resourceType: string;
  metricName: string;
  value: number;
  unit: string;
  tags: Record<string, any>;
  timestamp: string;
  demoMetadata: DemoMetadata;
}

export interface DemoAlert {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  resourceId?: string;
  resourceType?: string;
  acknowledged: boolean;
  demoMetadata: DemoMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface CostDataPoint {
  date: string;
  amount: number;
}

export interface CostOptimizationTip {
  type: string;
  title: string;
  description: string;
  savings: number;
  priority: string;
}

export interface DemoCostData {
  totalCost: number;
  currency: string;
  period: string;
  byService: Record<string, number>;
  byRegion: Record<string, number>;
  trend: CostDataPoint[];
  forecast: CostDataPoint[];
  recommendations: CostOptimizationTip[];
  demoMetadata: DemoMetadata;
}

export interface InitializeDemoRequest {
  scenario: 'startup' | 'enterprise' | 'devops' | 'multicloud';
}

export interface CompleteOnboardingRequest {
  demoMode: boolean;
  preferences?: Record<string, any>;
}

export interface TransitionToRealRequest {
  cloudProviders: string[];
  keepSettings: boolean;
}

class DemoDataService {
  private readonly baseUrl = '/api';

  // Demo scenarios configuration
  public readonly scenarios: DemoScenario[] = [
    {
      id: 'startup',
      name: 'Startup',
      description: 'Perfect for small teams and early-stage companies',
      features: [
        'Basic web server and database',
        'Simple deployment pipeline',
        'Cost-effective infrastructure',
        'Essential monitoring and alerts'
      ],
      estimatedCost: '$25-50/month'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'Comprehensive setup for large organizations',
      features: [
        'Multi-region infrastructure',
        'Advanced security and compliance',
        'Complex deployment workflows',
        'Comprehensive monitoring and analytics'
      ],
      estimatedCost: '$5,000-15,000/month'
    },
    {
      id: 'devops',
      name: 'DevOps',
      description: 'Optimized for development and operations teams',
      features: [
        'CI/CD pipeline infrastructure',
        'Container orchestration',
        'Development and staging environments',
        'Advanced deployment strategies'
      ],
      estimatedCost: '$500-2,000/month'
    },
    {
      id: 'multicloud',
      name: 'Multi-Cloud',
      description: 'Distributed across multiple cloud providers',
      features: [
        'AWS, Azure, and GCP resources',
        'Cross-cloud networking',
        'Unified monitoring and management',
        'Disaster recovery and redundancy'
      ],
      estimatedCost: '$2,000-8,000/month'
    }
  ];

  // Initialize demo data for a user
  async initializeDemoData(scenario: 'startup' | 'enterprise' | 'devops' | 'multicloud'): Promise<void> {
    await apiService.post('/user/initialize-demo', { scenario });
  }

  // Complete user onboarding
  async completeOnboarding(request: CompleteOnboardingRequest): Promise<void> {
    await apiService.post('/user/complete-onboarding', request);
  }

  // Transition from demo to real data
  async transitionToReal(request: TransitionToRealRequest): Promise<void> {
    await apiService.post('/user/transition-to-real', request);
  }

  // Get demo infrastructure data
  async getDemoInfrastructure(): Promise<DemoInfrastructure[]> {
    const response = await apiService.get('/demo/infrastructure');
    return response.data || [];
  }

  // Get demo deployment data
  async getDemoDeployments(): Promise<DemoDeployment[]> {
    const response = await apiService.get('/demo/deployments');
    return response.data || [];
  }

  // Get demo metrics data
  async getDemoMetrics(start?: string, end?: string): Promise<DemoMetric[]> {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    
    const url = `/demo/metrics${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await apiService.get(url);
    return response.data || [];
  }

  // Get demo alert data
  async getDemoAlerts(): Promise<DemoAlert[]> {
    const response = await apiService.get('/demo/alerts');
    return response.data || [];
  }

  // Get demo cost data
  async getDemoCostData(): Promise<DemoCostData> {
    const response = await apiService.get('/demo/cost');
    return response.data;
  }

  // Check if data is demo data
  isDemoData(data: any): boolean {
    return data?.demoMetadata?.isDemo === true;
  }

  // Get demo scenario by ID
  getScenarioById(id: string): DemoScenario | undefined {
    return this.scenarios.find(scenario => scenario.id === id);
  }

  // Get demo indicator text
  getDemoIndicatorText(scenario?: string): string {
    const scenarioData = scenario ? this.getScenarioById(scenario) : null;
    return scenarioData 
      ? `Demo Data (${scenarioData.name} Scenario)`
      : 'Demo Data';
  }

  // Generate demo data locally (fallback when API is not available)
  generateLocalDemoData(type: string, scenario: string = 'startup'): any {
    switch (type) {
      case 'infrastructure':
        return this.generateLocalInfrastructure(scenario);
      case 'deployments':
        return this.generateLocalDeployments(scenario);
      case 'metrics':
        return this.generateLocalMetrics(scenario);
      case 'alerts':
        return this.generateLocalAlerts(scenario);
      case 'cost':
        return this.generateLocalCostData(scenario);
      default:
        return [];
    }
  }

  private generateLocalInfrastructure(scenario: string): DemoInfrastructure[] {
    const baseInfrastructure: DemoInfrastructure[] = [
      {
        id: 'demo-web-server-1',
        name: 'demo-web-server-1',
        type: 'server',
        provider: 'aws',
        region: 'us-east-1',
        status: 'running',
        specifications: {
          instanceType: 't3.micro',
          cpu: 1,
          memory: 1,
          storage: 8
        },
        costInfo: {
          hourlyRate: 0.0104,
          monthlyRate: 7.59
        },
        tags: ['web', 'frontend', 'demo'],
        demoMetadata: {
          isDemo: true,
          scenario,
          realistic: true,
          tags: ['startup', 'web-server'],
          description: 'Demo web server for startup scenario'
        },
        createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString()
      },
      {
        id: 'demo-database-1',
        name: 'demo-database-1',
        type: 'database',
        provider: 'aws',
        region: 'us-east-1',
        status: 'running',
        specifications: {
          engine: 'postgresql',
          version: '13.7',
          instanceType: 'db.t3.micro',
          storage: 20
        },
        costInfo: {
          hourlyRate: 0.017,
          monthlyRate: 12.41
        },
        tags: ['database', 'postgresql', 'demo'],
        demoMetadata: {
          isDemo: true,
          scenario,
          realistic: true,
          tags: ['startup', 'database'],
          description: 'Demo PostgreSQL database for startup scenario'
        },
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      }
    ];

    return baseInfrastructure;
  }

  private generateLocalDeployments(scenario: string): DemoDeployment[] {
    return [
      {
        id: 'demo-deployment-1',
        name: 'demo-web-app-v1.2.0',
        application: 'web-app',
        version: '1.2.0',
        environment: 'production',
        status: 'completed',
        progress: 100,
        configuration: {
          replicas: 2,
          cpu: '100m',
          memory: '128Mi',
          healthCheck: '/health'
        },
        demoMetadata: {
          isDemo: true,
          scenario,
          realistic: true,
          tags: ['startup', 'web-app', 'production'],
          description: 'Demo web application deployment'
        },
        startedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 5.5 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5.5 * 60 * 60 * 1000).toISOString()
      }
    ];
  }

  private generateLocalMetrics(scenario: string): DemoMetric[] {
    const metrics: DemoMetric[] = [];
    const now = new Date();

    // Generate CPU metrics for the last 24 hours
    for (let i = 0; i < 24; i++) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      const cpuValue = 15 + Math.random() * 20; // 15-35% CPU usage

      metrics.push({
        id: `demo-cpu-metric-${i}`,
        resourceId: 'demo-web-server-1',
        resourceType: 'server',
        metricName: 'cpu_utilization',
        value: cpuValue,
        unit: 'percent',
        tags: {
          instance: 'demo-web-server-1',
          region: 'us-east-1'
        },
        timestamp: timestamp.toISOString(),
        demoMetadata: {
          isDemo: true,
          scenario,
          realistic: true,
          tags: ['startup', 'cpu', 'monitoring'],
          description: 'Demo CPU utilization metrics'
        }
      });
    }

    return metrics;
  }

  private generateLocalAlerts(scenario: string): DemoAlert[] {
    return [
      {
        id: 'demo-alert-1',
        type: 'performance',
        severity: 'warning',
        title: 'High Memory Usage',
        message: 'Memory usage on demo-web-server-1 has exceeded 80% for the last 15 minutes',
        resourceId: 'demo-web-server-1',
        resourceType: 'server',
        acknowledged: false,
        demoMetadata: {
          isDemo: true,
          scenario,
          realistic: true,
          tags: ['startup', 'performance', 'memory'],
          description: 'Demo high memory usage alert'
        },
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      }
    ];
  }

  private generateLocalCostData(scenario: string): DemoCostData {
    const now = new Date();
    
    // Generate cost trend for the last 30 days
    const trend: CostDataPoint[] = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
      const baseCost = 25.0;
      const variation = Math.random() * 10.0 - 5.0; // ±5 variation
      trend.push({
        date: date.toISOString().split('T')[0],
        amount: baseCost + variation
      });
    }

    // Generate forecast for next 30 days
    const forecast: CostDataPoint[] = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(now.getTime() + (i + 1) * 24 * 60 * 60 * 1000);
      const baseCost = 28.0; // Slight increase in forecast
      const variation = Math.random() * 8.0 - 4.0; // ±4 variation
      forecast.push({
        date: date.toISOString().split('T')[0],
        amount: baseCost + variation
      });
    }

    return {
      totalCost: 742.50,
      currency: 'USD',
      period: 'monthly',
      byService: {
        'EC2': 420.30,
        'RDS': 186.75,
        'S3': 45.20,
        'CloudWatch': 25.15,
        'Route53': 15.10,
        'Other': 50.00
      },
      byRegion: {
        'us-east-1': 650.25,
        'us-west-2': 92.25
      },
      trend,
      forecast,
      recommendations: [
        {
          type: 'rightsizing',
          title: 'Rightsize EC2 Instances',
          description: 'Your t3.micro instances are underutilized. Consider switching to t3.nano to save costs.',
          savings: 45.30,
          priority: 'medium'
        },
        {
          type: 'storage',
          title: 'Optimize S3 Storage Class',
          description: 'Move infrequently accessed data to S3 Intelligent-Tiering to reduce storage costs.',
          savings: 12.50,
          priority: 'low'
        }
      ],
      demoMetadata: {
        isDemo: true,
        scenario,
        realistic: true,
        tags: ['startup', 'cost', 'optimization'],
        description: 'Demo cost data for startup scenario'
      }
    };
  }
}

export const demoDataService = new DemoDataService();