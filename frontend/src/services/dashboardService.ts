import { apiService } from './apiService';

// Dashboard data types
export interface DashboardStats {
  activeResources: number;
  activeResourcesChange: string;
  activeResourcesTrend: 'up' | 'down';
  deployments: number;
  deploymentsChange: string;
  deploymentsTrend: 'up' | 'down';
  costThisMonth: number;
  costThisMonthChange: string;
  costThisMonthTrend: 'up' | 'down';
  uptime: number;
  uptimeChange: string;
  uptimeTrend: 'up' | 'down';
}

export interface DashboardActivity {
  id: string;
  message: string;
  timestamp: string;
  type: 'deployment' | 'infrastructure' | 'security' | 'cost' | 'alert';
}

export interface PerformanceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  networkIO: number;
  responseTime: number;
  timestamp: string;
}

export interface CostMetrics {
  thisMonth: number;
  lastMonth: number;
  projected: number;
  savings: number;
  savingsPercentage: number;
}

export interface SecurityMetrics {
  securityScore: number;
  vulnerabilities: {
    critical: number;
    medium: number;
    low: number;
  };
  lastScan: string;
  compliance: string[];
}

export interface InfrastructureMetrics {
  ec2Instances: number;
  loadBalancers: number;
  databases: {
    rds: number;
    dynamodb: number;
  };
  storageUsed: number; // in TB
}

export interface ReportsMetrics {
  monthlyReportAvailable: boolean;
  costOptimizationRecommendations: number;
  performanceTrend: 'improving' | 'stable' | 'degrading';
  nextSecurityAudit: string;
}

export class DashboardService {
  private static instance: DashboardService;
  private listeners: Map<string, Set<Function>> = new Map();

  public static getInstance(): DashboardService {
    if (!DashboardService.instance) {
      DashboardService.instance = new DashboardService();
    }
    return DashboardService.instance;
  }

  // Event listener management for real-time updates
  public subscribe(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
        if (eventListeners.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  private emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  // Simulate real-time updates (this would normally come from WebSocket)
  public startRealTimeUpdates(): void {
    // Simulate stats updates every 30 seconds
    setInterval(() => {
      this.updateStatsRealTime();
    }, 30000);

    // Simulate activity updates every 60 seconds
    setInterval(() => {
      this.addNewActivity();
    }, 60000);

    // Simulate metrics updates every 15 seconds
    setInterval(() => {
      this.updateMetricsRealTime();
    }, 15000);
  }

  private updateStatsRealTime(): void {
    // Simulate slight changes in stats
    const variation = () => Math.random() * 4 - 2; // -2 to +2
    const stats: DashboardStats = {
      activeResources: Math.max(20, 24 + Math.floor(variation())),
      activeResourcesChange: `${variation() > 0 ? '+' : ''}${variation().toFixed(1)}%`,
      activeResourcesTrend: variation() > 0 ? 'up' : 'down',
      deployments: Math.max(5, 8 + Math.floor(variation())),
      deploymentsChange: `${variation() > 0 ? '+' : ''}${variation().toFixed(1)}%`,
      deploymentsTrend: variation() > 0 ? 'up' : 'down',
      costThisMonth: Math.max(1000, 1234 + Math.floor(variation() * 50)),
      costThisMonthChange: `${variation() > 0 ? '+' : ''}${variation().toFixed(1)}%`,
      costThisMonthTrend: variation() > 0 ? 'up' : 'down',
      uptime: Math.max(99.0, Math.min(100, 99.9 + variation() * 0.1)),
      uptimeChange: `${variation() > 0 ? '+' : ''}${(variation() * 0.1).toFixed(2)}%`,
      uptimeTrend: variation() > 0 ? 'up' : 'down',
    };
    this.emit('stats-updated', stats);
  }

  private addNewActivity(): void {
    const activities = [
      'New deployment started for web-service',
      'Infrastructure scaling event completed',
      'Cost optimization recommendation available',
      'Security scan completed successfully',
      'Performance metrics updated',
      'Database maintenance completed',
      'Load balancer configuration updated',
    ];
    
    const types: Array<'deployment' | 'infrastructure' | 'security' | 'cost' | 'alert'> = [
      'deployment', 'infrastructure', 'security', 'cost', 'alert'
    ];

    const newActivity: DashboardActivity = {
      id: `activity-${Date.now()}`,
      message: activities[Math.floor(Math.random() * activities.length)],
      timestamp: new Date().toISOString(),
      type: types[Math.floor(Math.random() * types.length)]
    };
    
    this.emit('activity-added', newActivity);
  }

  private updateMetricsRealTime(): void {
    const cpuVariation = Math.random() * 10 - 5; // -5 to +5
    const memoryVariation = Math.random() * 8 - 4; // -4 to +4
    const networkVariation = Math.random() * 0.4 - 0.2; // -0.2 to +0.2
    const responseVariation = Math.random() * 20 - 10; // -10 to +10

    const metrics: PerformanceMetrics = {
      cpuUsage: Math.max(0, Math.min(100, 45 + cpuVariation)),
      memoryUsage: Math.max(0, Math.min(100, 62 + memoryVariation)),
      networkIO: Math.max(0, 1.2 + networkVariation),
      responseTime: Math.max(50, 120 + responseVariation),
      timestamp: new Date().toISOString(),
    };
    
    this.emit('performance-updated', metrics);
  }

  // Get dashboard statistics
  async getDashboardStats(): Promise<DashboardStats> {
    return await apiService.get<DashboardStats>('/dashboard/stats');
  }

  // Get recent activity
  async getRecentActivity(): Promise<DashboardActivity[]> {
    return await apiService.get<DashboardActivity[]>('/dashboard/activity');
  }

  // Get performance metrics
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    return await apiService.get<PerformanceMetrics>('/dashboard/performance');
  }

  // Get cost metrics
  async getCostMetrics(): Promise<CostMetrics> {
    return await apiService.get<CostMetrics>('/dashboard/costs');
  }

  // Get security metrics
  async getSecurityMetrics(): Promise<SecurityMetrics> {
    return await apiService.get<SecurityMetrics>('/dashboard/security');
  }

  // Get infrastructure metrics
  async getInfrastructureMetrics(): Promise<InfrastructureMetrics> {
    return await apiService.get<InfrastructureMetrics>('/dashboard/infrastructure');
  }

  // Get reports metrics
  async getReportsMetrics(): Promise<ReportsMetrics> {
    return await apiService.get<ReportsMetrics>('/dashboard/reports');
  }
}

// Export singleton instance
export const dashboardService = DashboardService.getInstance();
export default dashboardService;