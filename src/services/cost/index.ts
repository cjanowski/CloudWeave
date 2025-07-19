/**
 * Cost Management Services Module
 * Provides cost tracking, allocation, reporting, and optimization
 */

// Types and interfaces
export * from './interfaces';

// Core services
export { CostTrackingService } from './CostTrackingService';
export { CostAllocationService } from './CostAllocationService';
export { CostReportingService } from './CostReportingService';

// Optimization services
export * from './optimization';

// Convenience functions for creating and configuring services
import { CostTrackingService } from './CostTrackingService';
import { CostAllocationService } from './CostAllocationService';
import { CostReportingService } from './CostReportingService';
import { createCostOptimizationServices } from './optimization';

/**
 * Create a fully configured cost management service suite
 */
export async function createCostManagementServices(): Promise<{
  trackingService: CostTrackingService;
  allocationService: CostAllocationService;
  reportingService: CostReportingService;
  optimizationServices: {
    optimizationService: any;
    anomalyDetectionService: any;
  };
}> {
  // Create services
  const trackingService = new CostTrackingService();
  const allocationService = new CostAllocationService();
  const reportingService = new CostReportingService();
  const optimizationServices = await createCostOptimizationServices();

  return {
    trackingService,
    allocationService,
    reportingService,
    optimizationServices,
  };
}

/**
 * Default cost management configuration for enterprise environments
 */
export const defaultCostConfig = {
  // Cost Tracking Configuration
  tracking: {
    importFrequency: 'daily', // daily, weekly, monthly
    dataRetention: '7y', // 7 years for compliance
    cacheTimeout: 300000, // 5 minutes
    batchSize: 1000, // Number of records per batch
  },

  // Cost Allocation Configuration
  allocation: {
    defaultEntityTypes: ['organization', 'project', 'team', 'environment'],
    unallocatedBehavior: 'organization', // Allocate unmatched costs to organization
    maxRulesPerEntity: 100,
    maxConditionsPerRule: 10,
  },

  // Cost Reporting Configuration
  reporting: {
    defaultTimeRange: 'monthly',
    defaultGroupBy: ['service', 'region'],
    maxReportsPerOrganization: 100,
    maxScheduledReports: 20,
    reportFormats: ['json', 'csv', 'pdf', 'html'],
    maxReportSize: 10000, // Maximum number of data points per report
  },

  // Budget Configuration
  budgets: {
    alertThresholds: [50, 80, 90, 100],
    maxBudgetsPerOrganization: 50,
    maxAlertsPerBudget: 5,
    notificationChannels: ['email', 'slack', 'webhook'],
  },

  // Forecast Configuration
  forecasting: {
    defaultAlgorithm: 'auto',
    defaultConfidenceInterval: 95,
    maxForecastHorizon: 12, // months
    refreshFrequency: 'daily',
  },

  // Cost Optimization Configuration
  optimization: {
    recommendationThreshold: 5, // Minimum $ savings to recommend
    recommendationConfidence: 'high',
    refreshFrequency: 'weekly',
    maxRecommendationsPerResource: 3,
  },
};

/**
 * Cost management utilities for common operations
 */
export const CostUtils = {
  /**
   * Format currency amount
   */
  formatCurrency(amount: number, currency: string = 'USD', locale: string = 'en-US'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  },

  /**
   * Format percentage
   */
  formatPercentage(value: number, decimals: number = 1): string {
    return `${value.toFixed(decimals)}%`;
  },

  /**
   * Calculate percentage change
   */
  calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  },

  /**
   * Get date range for a period
   */
  getDateRangeForPeriod(
    period: 'day' | 'week' | 'month' | 'quarter' | 'year',
    date: Date = new Date()
  ): { startDate: Date; endDate: Date } {
    const now = new Date(date);
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        break;
      case 'week':
        const day = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - day);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0, 23, 59, 59, 999);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    return { startDate, endDate };
  },

  /**
   * Get previous period
   */
  getPreviousPeriod(
    period: 'day' | 'week' | 'month' | 'quarter' | 'year',
    date: Date = new Date()
  ): { startDate: Date; endDate: Date } {
    const now = new Date(date);
    
    switch (period) {
      case 'day':
        now.setDate(now.getDate() - 1);
        break;
      case 'week':
        now.setDate(now.getDate() - 7);
        break;
      case 'month':
        now.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        now.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        now.setFullYear(now.getFullYear() - 1);
        break;
    }

    return this.getDateRangeForPeriod(period, now);
  },

  /**
   * Format date range as string
   */
  formatDateRange(startDate: Date, endDate: Date, locale: string = 'en-US'): string {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    
    const start = startDate.toLocaleDateString(locale, options);
    const end = endDate.toLocaleDateString(locale, options);
    
    return `${start} - ${end}`;
  },

  /**
   * Calculate daily average cost
   */
  calculateDailyAverage(totalCost: number, startDate: Date, endDate: Date): number {
    const days = Math.max(1, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return totalCost / days;
  },

  /**
   * Determine cost trend
   */
  determineCostTrend(
    currentCost: number,
    previousCost: number
  ): 'increasing' | 'decreasing' | 'stable' {
    if (previousCost === 0) return currentCost > 0 ? 'increasing' : 'stable';
    
    const percentageChange = this.calculatePercentageChange(currentCost, previousCost);
    
    if (percentageChange > 5) return 'increasing';
    if (percentageChange < -5) return 'decreasing';
    return 'stable';
  },

  /**
   * Generate cost report filename
   */
  generateReportFilename(
    organizationId: string,
    reportName: string,
    format: string,
    date: Date = new Date()
  ): string {
    const dateStr = date.toISOString().split('T')[0];
    const sanitizedName = reportName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    return `cost-report-${sanitizedName}-${organizationId}-${dateStr}.${format}`;
  },

  /**
   * Parse cost allocation rule condition
   */
  parseCondition(
    condition: string
  ): { field: string; operator: string; value: string } | null {
    const regex = /^(\w+)\s+(equals|contains|startsWith|endsWith|regex|exists)\s*(.*)$/;
    const match = condition.match(regex);
    
    if (!match) return null;
    
    return {
      field: match[1],
      operator: match[2],
      value: match[3].trim(),
    };
  },

  /**
   * Validate budget alert threshold
   */
  isValidAlertThreshold(threshold: number): boolean {
    return threshold > 0 && threshold <= 1000;
  },

  /**
   * Calculate remaining budget
   */
  calculateRemainingBudget(
    budgetAmount: number,
    actualCost: number
  ): { amount: number; percentage: number } {
    const remaining = Math.max(0, budgetAmount - actualCost);
    const percentage = budgetAmount > 0 ? (remaining / budgetAmount) * 100 : 0;
    
    return { amount: remaining, percentage };
  },

  /**
   * Determine budget status color
   */
  getBudgetStatusColor(
    actualPercentage: number
  ): 'green' | 'yellow' | 'orange' | 'red' {
    if (actualPercentage >= 100) return 'red';
    if (actualPercentage >= 90) return 'orange';
    if (actualPercentage >= 75) return 'yellow';
    return 'green';
  },
};