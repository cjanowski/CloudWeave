/**
 * Cost Optimization Services Module
 * Provides cost optimization recommendations and anomaly detection
 */

// Types and interfaces
export * from './interfaces';

// Core services
export { CostOptimizationService } from './CostOptimizationService';
export { CostAnomalyDetectionService } from './CostAnomalyDetectionService';

// Convenience functions for creating and configuring services
import { CostOptimizationService } from './CostOptimizationService';
import { CostAnomalyDetectionService } from './CostAnomalyDetectionService';

/**
 * Create a fully configured cost optimization service suite
 */
export async function createCostOptimizationServices(): Promise<{
  optimizationService: CostOptimizationService;
  anomalyDetectionService: CostAnomalyDetectionService;
}> {
  // Create services
  const optimizationService = new CostOptimizationService();
  const anomalyDetectionService = new CostAnomalyDetectionService();

  return {
    optimizationService,
    anomalyDetectionService,
  };
}

/**
 * Default cost optimization configuration
 */
export const defaultOptimizationConfig = {
  // Optimization Analysis Configuration
  analysis: {
    minimumSavingsThreshold: 50, // Minimum $50 savings to recommend
    confidenceThreshold: 'medium', // Minimum confidence level
    analysisFrequency: 'weekly', // How often to run analysis
    lookbackPeriod: 30, // Days of historical data to analyze
  },

  // Rightsizing Configuration
  rightsizing: {
    cpuThreshold: 20, // CPU utilization threshold for downsizing
    memoryThreshold: 20, // Memory utilization threshold for downsizing
    minimumObservationPeriod: 7, // Days of data required
    savingsEstimate: 30, // Estimated savings percentage
  },

  // Idle Resource Detection
  idleDetection: {
    cpuThreshold: 5, // CPU utilization threshold for idle detection
    networkThreshold: 1000, // Network bytes threshold
    minimumObservationPeriod: 7, // Days of data required
    savingsEstimate: 100, // 100% savings by terminating
  },

  // Reserved Instance Recommendations
  reservedInstances: {
    minimumUsageThreshold: 80, // Minimum usage percentage to recommend RI
    savingsEstimate: 40, // Typical RI savings percentage
    recommendedTerm: 12, // Months
    paymentOption: 'partial_upfront',
  },

  // Anomaly Detection Configuration
  anomalyDetection: {
    sensitivityThreshold: 2.0, // Standard deviations for anomaly detection
    minimumAnomalyAmount: 100, // Minimum $100 anomaly
    lookbackDays: 30, // Days of historical data for baseline
    alertThresholds: {
      critical: 4.0, // Standard deviations
      high: 3.0,
      medium: 2.5,
      low: 2.0,
    },
  },

  // Notification Configuration
  notifications: {
    enabled: true,
    channels: ['email', 'slack'],
    recipients: [],
    minimumSavingsToNotify: 500, // Minimum $500 savings to notify
    anomalyNotifications: true,
    dailyDigest: true,
    weeklyReport: true,
  },
};

/**
 * Cost optimization utilities
 */
export const OptimizationUtils = {
  /**
   * Calculate potential annual savings
   */
  calculateAnnualSavings(monthlySavings: number): number {
    return monthlySavings * 12;
  },

  /**
   * Calculate savings percentage
   */
  calculateSavingsPercentage(currentCost: number, newCost: number): number {
    if (currentCost === 0) return 0;
    return ((currentCost - newCost) / currentCost) * 100;
  },

  /**
   * Determine recommendation priority
   */
  determineRecommendationPriority(
    savingsAmount: number,
    confidence: 'high' | 'medium' | 'low',
    effort: 'high' | 'medium' | 'low'
  ): 'critical' | 'high' | 'medium' | 'low' {
    const confidenceScore = { high: 3, medium: 2, low: 1 }[confidence];
    const effortScore = { low: 3, medium: 2, high: 1 }[effort];
    const savingsScore = savingsAmount >= 1000 ? 3 : savingsAmount >= 500 ? 2 : 1;

    const totalScore = confidenceScore + effortScore + savingsScore;

    if (totalScore >= 8) return 'critical';
    if (totalScore >= 6) return 'high';
    if (totalScore >= 4) return 'medium';
    return 'low';
  },

  /**
   * Format recommendation title
   */
  formatRecommendationTitle(type: string, resourceType: string): string {
    const titles: Record<string, string> = {
      rightsizing: `Rightsize ${resourceType}`,
      idle_resource: `Terminate Idle ${resourceType}`,
      reserved_instance: `Purchase Reserved Instance for ${resourceType}`,
      savings_plan: `Apply Savings Plan to ${resourceType}`,
      storage_optimization: `Optimize ${resourceType} Storage`,
      modernization: `Modernize ${resourceType}`,
    };

    return titles[type] || `Optimize ${resourceType}`;
  },

  /**
   * Get recommendation icon
   */
  getRecommendationIcon(type: string): string {
    const icons: Record<string, string> = {
      rightsizing: '📏',
      idle_resource: '🗑️',
      reserved_instance: '💰',
      savings_plan: '💳',
      storage_optimization: '💾',
      modernization: '🚀',
    };

    return icons[type] || '💡';
  },

  /**
   * Calculate confidence score
   */
  calculateConfidenceScore(
    dataPoints: number,
    observationPeriod: number,
    utilizationVariance: number
  ): 'high' | 'medium' | 'low' {
    let score = 0;

    // More data points = higher confidence
    if (dataPoints >= 100) score += 3;
    else if (dataPoints >= 50) score += 2;
    else if (dataPoints >= 20) score += 1;

    // Longer observation period = higher confidence
    if (observationPeriod >= 30) score += 3;
    else if (observationPeriod >= 14) score += 2;
    else if (observationPeriod >= 7) score += 1;

    // Lower variance = higher confidence
    if (utilizationVariance <= 0.1) score += 3;
    else if (utilizationVariance <= 0.2) score += 2;
    else if (utilizationVariance <= 0.3) score += 1;

    if (score >= 7) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
  },

  /**
   * Validate optimization parameters
   */
  validateOptimizationParameters(params: {
    minimumSavings?: number;
    confidenceThreshold?: string;
    lookbackDays?: number;
  }): boolean {
    if (params.minimumSavings !== undefined && params.minimumSavings < 0) {
      return false;
    }

    if (params.confidenceThreshold && !['high', 'medium', 'low'].includes(params.confidenceThreshold)) {
      return false;
    }

    if (params.lookbackDays !== undefined && (params.lookbackDays < 1 || params.lookbackDays > 365)) {
      return false;
    }

    return true;
  },
};