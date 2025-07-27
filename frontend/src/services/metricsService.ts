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

class MetricsService {
  // Get dashboard metrics
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    return await apiService.get('/metrics/dashboard');
  }

  // Get aggregated metrics for an organization
  async getAggregatedMetrics(): Promise<MetricsAggregation[]> {
    const response = await apiService.get('/metrics/aggregated');
    return response.metrics || [];
  }

  // Get metrics for a specific resource
  async getResourceMetrics(resourceId: string, duration: string = '24h'): Promise<MetricData[]> {
    const response = await apiService.get(`/metrics/resources/${resourceId}`, {
      params: { duration }
    });
    return response.metrics || [];
  }

  // Get metric definitions
  async getMetricDefinitions(): Promise<MetricDefinition[]> {
    const response = await apiService.get('/metrics/definitions');
    return response.definitions || [];
  }

  // Trigger metrics collection
  async collectMetrics(): Promise<void> {
    await apiService.post('/metrics/collect');
  }

  // Get real-time metrics (WebSocket endpoint)
  async getMetricsStream(): Promise<string> {
    const response = await apiService.get('/metrics/stream');
    return response.message || '';
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