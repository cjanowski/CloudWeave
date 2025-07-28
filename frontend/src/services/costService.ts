import { apiService } from './apiService';

// Cost Management Types
export interface CostBreakdown {
  totalCost: number;
  currency: string;
  period: string;
  breakdown: Record<string, ResourceCost>;
  trends: CostTrend[];
  recommendations: CostRecommendation[];
}

export interface ResourceCost {
  resourceId: string;
  resourceName: string;
  resourceType: string;
  provider: string;
  hourlyCost: number;
  dailyCost: number;
  monthlyCost: number;
  tags: Record<string, string>;
  usage: ResourceUsage;
}

export interface ResourceUsage {
  cpuUtilization: number;
  memoryUtilization: number;
  storageUsage: number;
  networkUsage: number;
}

export interface CostTrend {
  date: string;
  cost: number;
  usage: number;
}

export interface CostRecommendation {
  type: string;
  description: string;
  potentialSavings: number;
  priority: string;
  action: string;
}

export interface BudgetAlert {
  type: string;
  message: string;
  severity: string;
  currentCost: number;
  budget: number;
  timestamp: string;
}

export interface CostForecast {
  date: string;
  projectedCost: number;
  confidence: number;
}

export interface CostByTags {
  [tag: string]: number;
}

export interface RealTimeCostData {
  currentCost: number;
  dailySpend: number;
  monthlyBudget: number;
  budgetRemaining: number;
  budgetUsed: number;
  alerts: BudgetAlert[];
  lastUpdated: string;
}

export interface CostAllocationData {
  totalCost: number;
  allocationByTag: Record<string, TagAllocation>;
  projects: Record<string, ProjectAllocation>;
}

export interface TagAllocation {
  tagName: string;
  totalCost: number;
  resources: string[];
}

export interface ProjectAllocation {
  projectName: string;
  totalCost: number;
  resources: string[];
}

// Cost Management Service
class CostService {
  private baseUrl = '/costs';

  // Get cost overview
  async getCostOverview(period: string = 'month'): Promise<CostBreakdown> {
    try {
      const response = await apiService.get(`${this.baseUrl}/overview?period=${period}`);
      return response?.data || response || this.getMockCostData();
    } catch (error) {
      console.error('Failed to get cost overview:', error);
      return this.getMockCostData();
    }
  }

  // Get detailed cost breakdown
  async getCostBreakdown(period: string = 'month'): Promise<CostBreakdown> {
    try {
      const response = await apiService.get(`${this.baseUrl}/breakdown?period=${period}`);
      return response?.data || response || this.getMockCostData();
    } catch (error) {
      console.error('Failed to get cost breakdown:', error);
      return this.getMockCostData();
    }
  }

  // Get cost optimization recommendations
  async getCostOptimization(period: string = 'month'): Promise<CostRecommendation[]> {
    try {
      const response = await apiService.get(`${this.baseUrl}/optimization?period=${period}`);
      return response?.data?.recommendations || response?.recommendations || [];
    } catch (error) {
      console.error('Failed to get cost optimization:', error);
      return [];
    }
  }

  // Get billing history
  async getBillingHistory(): Promise<CostForecast[]> {
    try {
      const response = await apiService.get(`${this.baseUrl}/billing`);
      return response?.data?.history || response?.history || [];
    } catch (error) {
      console.error('Failed to get billing history:', error);
      return [];
    }
  }

  // Get budget alerts
  async getBudgetAlerts(): Promise<BudgetAlert[]> {
    try {
      const response = await apiService.get(`${this.baseUrl}/alerts`);
      return response?.data || response || [];
    } catch (error) {
      console.error('Failed to get budget alerts:', error);
      return [];
    }
  }

  // Get cost by tags
  async getCostByTags(tags: Record<string, string>): Promise<CostByTags> {
    try {
      const response = await apiService.post(`${this.baseUrl}/by-tags`, tags);
      return response?.data?.costByTags || response?.costByTags || {};
    } catch (error) {
      console.error('Failed to get cost by tags:', error);
      return {};
    }
  }

  // Get real-time cost monitoring
  async getRealTimeCostMonitoring(): Promise<RealTimeCostData> {
    try {
      const response = await apiService.get(`${this.baseUrl}/real-time`);
      return response?.data || response || {
        currentCost: 0,
        dailySpend: 0,
        monthlyBudget: 20000,
        budgetRemaining: 20000,
        budgetUsed: 0,
        alerts: [],
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get real-time cost monitoring:', error);
      return {
        currentCost: 0,
        dailySpend: 0,
        monthlyBudget: 20000,
        budgetRemaining: 20000,
        budgetUsed: 0,
        alerts: [],
        lastUpdated: new Date().toISOString()
      };
    }
  }

  // Get cost allocation by tags
  async getCostAllocationByTags(): Promise<CostAllocationData> {
    try {
      const response = await apiService.get(`${this.baseUrl}/allocation`);
      return response?.data || response || {
        totalCost: 0,
        allocationByTag: {},
        projects: {}
      };
    } catch (error) {
      console.error('Failed to get cost allocation by tags:', error);
      return {
        totalCost: 0,
        allocationByTag: {},
        projects: {}
      };
    }
  }

  // Get enhanced cost optimization recommendations
  async getCostOptimizationRecommendations(): Promise<CostRecommendation[]> {
    try {
      const response = await apiService.get(`${this.baseUrl}/recommendations`);
      return response?.data?.recommendations || response?.recommendations || [];
    } catch (error) {
      console.error('Failed to get cost optimization recommendations:', error);
      return [];
    }
  }

  // Create budget (placeholder for future implementation)
  async createBudget(budgetData: any): Promise<any> {
    try {
      const response = await apiService.post(`${this.baseUrl}/budgets`, budgetData);
      return response?.data || response || null;
    } catch (error) {
      console.error('Failed to create budget:', error);
      return null;
    }
  }

  // Get budgets (placeholder for future implementation)
  async getBudgets(): Promise<any[]> {
    try {
      const response = await apiService.get(`${this.baseUrl}/budgets`);
      return response?.data || response || [];
    } catch (error) {
      console.error('Failed to get budgets:', error);
      return [];
    }
  }

  // Mock data for development/testing
  getMockCostData(): CostBreakdown {
    return {
      totalCost: 12450,
      currency: 'USD',
      period: 'month',
      breakdown: {
        'compute-1': {
          resourceId: 'compute-1',
          resourceName: 'Production EC2 Instance',
          resourceType: 'compute',
          provider: 'aws',
          hourlyCost: 0.0832,
          dailyCost: 2.0,
          monthlyCost: 2400,
          tags: { environment: 'production', team: 'backend' },
          usage: { cpuUtilization: 65, memoryUtilization: 70, storageUsage: 80, networkUsage: 45 }
        },
        'storage-1': {
          resourceId: 'storage-1',
          resourceName: 'S3 Storage Bucket',
          resourceType: 'storage',
          provider: 'aws',
          hourlyCost: 0.023,
          dailyCost: 0.55,
          monthlyCost: 2800,
          tags: { environment: 'production', team: 'data' },
          usage: { cpuUtilization: 0, memoryUtilization: 0, storageUsage: 85, networkUsage: 30 }
        },
        'database-1': {
          resourceId: 'database-1',
          resourceName: 'RDS Multi-AZ Instance',
          resourceType: 'database',
          provider: 'aws',
          hourlyCost: 0.096,
          dailyCost: 2.3,
          monthlyCost: 2100,
          tags: { environment: 'production', team: 'backend' },
          usage: { cpuUtilization: 45, memoryUtilization: 60, storageUsage: 70, networkUsage: 25 }
        }
      },
      trends: this.generateMockTrends(),
      recommendations: this.generateMockRecommendations()
    };
  }

  private generateMockTrends(): CostTrend[] {
    const trends: CostTrend[] = [];
    const now = new Date();
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Simulate realistic cost trends
      const baseCost = 400;
      const variation = Math.sin(i * 0.2) * 50 + Math.random() * 20;
      const cost = Math.max(0, baseCost + variation);
      
      trends.push({
        date: date.toISOString().split('T')[0],
        cost: Math.round(cost * 100) / 100,
        usage: Math.min(100, Math.max(0, (cost / 500) * 100))
      });
    }
    
    return trends;
  }

  private generateMockRecommendations(): CostRecommendation[] {
    return [
      {
        type: 'underutilized_resource',
        description: 'Production EC2 Instance is underutilized (CPU: 25%, Memory: 30%)',
        potentialSavings: 1200,
        priority: 'medium',
        action: 'Consider downsizing or stopping the resource'
      },
      {
        type: 'expensive_resource',
        description: 'RDS Multi-AZ Instance accounts for 17% of total cost',
        potentialSavings: 630,
        priority: 'high',
        action: 'Review resource specifications and consider optimization'
      },
      {
        type: 'resource_consolidation',
        description: 'Consider consolidating multiple small resources into larger, more cost-effective instances',
        potentialSavings: 1867.5,
        priority: 'medium',
        action: 'Review resource consolidation opportunities'
      }
    ];
  }
}

export const costService = new CostService(); 