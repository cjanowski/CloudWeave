import { apiService } from './apiService';

export interface MetricData {
  id: string;
  resourceId: string;
  resourceType: string;
  metricName: string;
  value: number;
  unit: string;
  timestamp: string;
  tags: Record<string, string>;
  metadata: Record<string, any>;
}

export interface MetricStats {
  current: number;
  average: number;
  min: number;
  max: number;
  trend: 'up' | 'down' | 'stable';
  lastUpdate: string;
}

export interface MetricsAggregation {
  resourceId: string;
  resourceName: string;
  resourceType: string;
  provider: string;
  metrics: Record<string, MetricStats>;
  lastUpdated: string;
  status: string;
}

export interface ResourceMetrics {
  resourceId: string;
  resourceName: string;
  resourceType: string;
  provider: string;
  status: string;
  cpuUsage: number;
  memoryUsage: number;
  networkIn: number;
  networkOut: number;
  cost: number;
  lastUpdated: string;
}

export interface DashboardMetrics {
  totalResources: number;
  runningResources: number;
  stoppedResources: number;
  errorResources: number;
  totalCost: number;
  averageCpuUsage: number;
  averageMemoryUsage: number;
  resourceBreakdown: Record<string, number>;
  providerBreakdown: Record<string, number>;
  topResources: ResourceMetrics[];
  recentAlerts: any[];
}

export interface MetricDefinition {
  id: string;
  name: string;
  description: string;
  metricName: string;
  unit: string;
  resourceType: string;
  provider: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MetricsFilters {
  resourceId?: string;
  resourceType?: string;
  metricName?: string;
  provider?: string;
  startTime?: string;
  endTime?: string;
  duration?: string;
  limit?: number;
  offset?: number;
}

// Mock data for when API is not available
const mockDashboardMetrics: DashboardMetrics = {
  totalResources: 24,
  runningResources: 20,
  stoppedResources: 3,
  errorResources: 1,
  totalCost: 1247.50,
  averageCpuUsage: 65.2,
  averageMemoryUsage: 78.5,
  resourceBreakdown: {
    'compute': 12,
    'storage': 6,
    'network': 4,
    'database': 2
  },
  providerBreakdown: {
    'aws': 14,
    'gcp': 6,
    'azure': 4
  },
  topResources: [
    {
      resourceId: 'res-001',
      resourceName: 'Web Server 1',
      resourceType: 'compute',
      provider: 'aws',
      status: 'running',
      cpuUsage: 85.2,
      memoryUsage: 92.1,
      networkIn: 1024,
      networkOut: 2048,
      cost: 156.75,
      lastUpdated: new Date().toISOString()
    },
    {
      resourceId: 'res-002',
      resourceName: 'Database Server',
      resourceType: 'database',
      provider: 'aws',
      status: 'running',
      cpuUsage: 45.8,
      memoryUsage: 67.3,
      networkIn: 512,
      networkOut: 1024,
      cost: 89.50,
      lastUpdated: new Date().toISOString()
    }
  ],
  recentAlerts: []
};

const mockAggregatedMetrics: MetricsAggregation[] = [
  {
    resourceId: 'res-001',
    resourceName: 'Web Server 1',
    resourceType: 'compute',
    provider: 'aws',
    status: 'running',
    lastUpdated: new Date().toISOString(),
    metrics: {
      cpu_usage: {
        current: 85.2,
        average: 78.5,
        min: 45.2,
        max: 95.8,
        trend: 'up',
        lastUpdate: new Date().toISOString()
      },
      memory_usage: {
        current: 92.1,
        average: 88.3,
        min: 65.4,
        max: 98.2,
        trend: 'up',
        lastUpdate: new Date().toISOString()
      },
      network_traffic: {
        current: 1024,
        average: 956,
        min: 512,
        max: 2048,
        trend: 'stable',
        lastUpdate: new Date().toISOString()
      }
    }
  },
  {
    resourceId: 'res-002',
    resourceName: 'Database Server',
    resourceType: 'database',
    provider: 'aws',
    status: 'running',
    lastUpdated: new Date().toISOString(),
    metrics: {
      cpu_usage: {
        current: 45.8,
        average: 42.1,
        min: 25.6,
        max: 68.9,
        trend: 'stable',
        lastUpdate: new Date().toISOString()
      },
      memory_usage: {
        current: 67.3,
        average: 64.8,
        min: 45.2,
        max: 82.1,
        trend: 'down',
        lastUpdate: new Date().toISOString()
      },
      disk_io: {
        current: 256,
        average: 234,
        min: 128,
        max: 512,
        trend: 'up',
        lastUpdate: new Date().toISOString()
      }
    }
  }
];

class MetricsService {
  // Get dashboard metrics
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      return await apiService.get('/metrics/dashboard');
    } catch (error) {
      console.warn('API not available, using mock data for dashboard metrics');
      return mockDashboardMetrics;
    }
  }

  // Get aggregated metrics for an organization
  async getAggregatedMetrics(): Promise<MetricsAggregation[]> {
    try {
      const response = await apiService.get('/metrics/aggregated');
      return response.metrics || [];
    } catch (error) {
      console.warn('API not available, using mock data for aggregated metrics');
      return mockAggregatedMetrics;
    }
  }

  // Get metrics for a specific resource
  async getResourceMetrics(resourceId: string, duration: string = '24h'): Promise<MetricData[]> {
    try {
      const response = await apiService.get(`/metrics/resources/${resourceId}`, {
        params: { duration }
      });
      return response.metrics || [];
    } catch (error) {
      console.warn('API not available, using mock data for resource metrics');
      return [];
    }
  }

  // Get metric definitions
  async getMetricDefinitions(): Promise<MetricDefinition[]> {
    try {
      const response = await apiService.get('/metrics/definitions');
      return response.definitions || [];
    } catch (error) {
      console.warn('API not available, using mock data for metric definitions');
      return [];
    }
  }

  // Trigger metrics collection
  async collectMetrics(): Promise<void> {
    try {
      await apiService.post('/metrics/collect');
    } catch (error) {
      console.warn('API not available, metrics collection skipped');
    }
  }

  // Get real-time metrics (WebSocket endpoint)
  async getMetricsStream(): Promise<string> {
    try {
      const response = await apiService.get('/metrics/stream');
      return response.message || '';
    } catch (error) {
      console.warn('API not available, metrics stream not available');
      return 'Mock metrics stream';
    }
  }

  // Transform raw metrics data for charts
  transformMetricsForChart(metrics: MetricData[], metricName: string) {
    return metrics
      .filter(m => m.metricName === metricName)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(metric => ({
        x: new Date(metric.timestamp).toISOString(),
        y: metric.value,
        unit: metric.unit
      }));
  }

  // Calculate metric trends
  calculateTrend(metrics: MetricData[]): 'up' | 'down' | 'stable' {
    if (metrics.length < 2) return 'stable';

    const recent = metrics.slice(-5); // Last 5 data points
    const first = recent[0]?.value || 0;
    const last = recent[recent.length - 1]?.value || 0;
    const threshold = 0.05; // 5% threshold

    const change = (last - first) / first;
    
    if (change > threshold) return 'up';
    if (change < -threshold) return 'down';
    return 'stable';
  }

  // Group metrics by resource
  groupMetricsByResource(metrics: MetricData[]): Record<string, MetricData[]> {
    return metrics.reduce((acc, metric) => {
      if (!acc[metric.resourceId]) {
        acc[metric.resourceId] = [];
      }
      acc[metric.resourceId].push(metric);
      return acc;
    }, {} as Record<string, MetricData[]>);
  }

  // Get metric summary statistics
  getMetricStats(metrics: MetricData[]): MetricStats {
    if (metrics.length === 0) {
      return {
        current: 0,
        average: 0,
        min: 0,
        max: 0,
        trend: 'stable',
        lastUpdate: new Date().toISOString()
      };
    }

    const values = metrics.map(m => m.value);
    const current = values[values.length - 1] || 0;
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const trend = this.calculateTrend(metrics);
    const lastUpdate = metrics[metrics.length - 1]?.timestamp || new Date().toISOString();

    return {
      current,
      average,
      min,
      max,
      trend,
      lastUpdate
    };
  }
}

export const metricsService = new MetricsService();
export default metricsService;