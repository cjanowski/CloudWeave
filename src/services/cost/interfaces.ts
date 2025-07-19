/**
 * Cost Management Service Interfaces
 * Provides interfaces for cost tracking, allocation, and optimization
 */

/**
 * Cost data point from a cloud provider
 */
export interface CostDataPoint {
  id: string;
  timestamp: Date;
  amount: number;
  currency: string;
  resourceId: string;
  resourceType: string;
  serviceType: string;
  region: string;
  usageType: string;
  usageQuantity: number;
  usageUnit: string;
  provider: string;
  accountId: string;
  tags: Record<string, string>;
  metadata: Record<string, any>;
}

/**
 * Cost allocation entity (project, team, etc.)
 */
export interface CostAllocationEntity {
  id: string;
  name: string;
  type: 'organization' | 'project' | 'team' | 'environment' | 'custom';
  parentId?: string;
  tags: Record<string, string>;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Cost allocation rule
 */
export interface CostAllocationRule {
  id: string;
  name: string;
  description: string;
  priority: number;
  targetEntityId: string;
  conditions: CostAllocationCondition[];
  percentage?: number; // For split allocations
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/**
 * Cost allocation condition
 */
export interface CostAllocationCondition {
  field: 'resourceId' | 'resourceType' | 'serviceType' | 'region' | 'tag' | 'accountId';
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex' | 'exists';
  value?: string | string[];
  tagKey?: string; // Only used when field is 'tag'
  negate?: boolean;
}

/**
 * Cost allocation result
 */
export interface CostAllocation {
  id: string;
  entityId: string;
  entityType: string;
  entityName: string;
  costAmount: number;
  currency: string;
  percentage: number;
  startDate: Date;
  endDate: Date;
  ruleId?: string;
  metadata: Record<string, any>;
}

/**
 * Cost report configuration
 */
export interface CostReportConfig {
  id: string;
  name: string;
  description: string;
  organizationId: string;
  groupBy: ('service' | 'region' | 'account' | 'resourceType' | 'tag' | 'entity')[];
  filters: CostReportFilter[];
  timeRange: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  customTimeRange?: {
    startDate: Date;
    endDate: Date;
  };
  compareWithPrevious: boolean;
  includeForecasting: boolean;
  format: 'json' | 'csv' | 'pdf' | 'html';
  scheduledDelivery?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
  };
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/**
 * Cost report filter
 */
export interface CostReportFilter {
  field: 'service' | 'region' | 'account' | 'resourceType' | 'tag' | 'entity';
  operator: 'equals' | 'contains' | 'in' | 'notIn';
  value: string | string[];
  tagKey?: string; // Only used when field is 'tag'
}

/**
 * Cost report result
 */
export interface CostReport {
  id: string;
  configId: string;
  name: string;
  organizationId: string;
  timeRange: {
    startDate: Date;
    endDate: Date;
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  };
  totalCost: number;
  currency: string;
  previousPeriodCost?: number;
  percentageChange?: number;
  forecastedCost?: number;
  groupedCosts: CostGrouping[];
  generatedAt: Date;
  metadata: Record<string, any>;
}

/**
 * Cost grouping for reports
 */
export interface CostGrouping {
  name: string;
  key: string;
  type: 'service' | 'region' | 'account' | 'resourceType' | 'tag' | 'entity';
  cost: number;
  percentage: number;
  previousPeriodCost?: number;
  percentageChange?: number;
  children?: CostGrouping[];
}

/**
 * Cost data import job
 */
export interface CostImportJob {
  id: string;
  organizationId: string;
  provider: string;
  accountId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startDate: Date;
  endDate: Date;
  recordsProcessed: number;
  recordsImported: number;
  errors: string[];
  startedAt: Date;
  completedAt?: Date;
  createdBy: string;
  metadata: Record<string, any>;
}

/**
 * Cost data source configuration
 */
export interface CostDataSource {
  id: string;
  organizationId: string;
  name: string;
  provider: string;
  accountId: string;
  credentials: Record<string, any>;
  importFrequency: 'daily' | 'weekly' | 'monthly';
  lastImportAt?: Date;
  status: 'active' | 'inactive' | 'error';
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  metadata: Record<string, any>;
}

/**
 * Cost anomaly detection configuration
 */
export interface CostAnomalyConfig {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  thresholdPercentage: number;
  thresholdAmount?: number;
  currency?: string;
  evaluationPeriod: 'daily' | 'weekly' | 'monthly';
  comparisonPeriod: 'previousPeriod' | 'sameWeekLastMonth' | 'sameMonthLastYear';
  scope: {
    entityIds?: string[];
    services?: string[];
    regions?: string[];
    tags?: Record<string, string>;
  };
  notifications: {
    enabled: boolean;
    channels: string[];
    recipients: string[];
  };
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/**
 * Cost anomaly detection result
 */
export interface CostAnomaly {
  id: string;
  configId: string;
  organizationId: string;
  entityId?: string;
  entityName?: string;
  service?: string;
  region?: string;
  resourceId?: string;
  resourceType?: string;
  currentCost: number;
  expectedCost: number;
  deviation: number;
  deviationPercentage: number;
  currency: string;
  startDate: Date;
  endDate: Date;
  status: 'detected' | 'acknowledged' | 'resolved' | 'false_positive';
  rootCause?: string;
  remediation?: string;
  detectedAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  metadata: Record<string, any>;
}

/**
 * Budget configuration
 */
export interface Budget {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  period: 'monthly' | 'quarterly' | 'yearly' | 'custom';
  customPeriod?: {
    startDate: Date;
    endDate: Date;
  };
  scope: {
    entityIds?: string[];
    services?: string[];
    regions?: string[];
    tags?: Record<string, string>;
  };
  alerts: BudgetAlert[];
  startDate: Date;
  endDate?: Date;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  metadata: Record<string, any>;
}

/**
 * Budget alert configuration
 */
export interface BudgetAlert {
  id: string;
  thresholdPercentage: number;
  thresholdType: 'actual' | 'forecasted';
  notifications: {
    enabled: boolean;
    channels: string[];
    recipients: string[];
  };
  status: 'pending' | 'triggered' | 'reset';
  lastTriggeredAt?: Date;
  enabled: boolean;
}

/**
 * Budget status
 */
export interface BudgetStatus {
  id: string;
  budgetId: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  budgetAmount: number;
  actualCost: number;
  forecastedCost: number;
  actualPercentage: number;
  forecastedPercentage: number;
  remainingAmount: number;
  currency: string;
  status: 'under_budget' | 'near_limit' | 'over_budget';
  alertsTriggered: {
    alertId: string;
    thresholdPercentage: number;
    triggeredAt: Date;
  }[];
  lastUpdatedAt: Date;
}

/**
 * Cost optimization recommendation
 */
export interface CostOptimizationRecommendation {
  id: string;
  organizationId: string;
  resourceId: string;
  resourceType: string;
  recommendationType: 'rightsizing' | 'reserved_instance' | 'savings_plan' | 'idle_resource' | 'storage_optimization';
  title: string;
  description: string;
  currentCost: number;
  projectedCost: number;
  potentialSavings: number;
  potentialSavingsPercentage: number;
  currency: string;
  confidence: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'implemented' | 'dismissed';
  implementationSteps: string[];
  createdAt: Date;
  updatedAt: Date;
  implementedAt?: Date;
  implementedBy?: string;
  dismissedAt?: Date;
  dismissedBy?: string;
  dismissReason?: string;
  metadata: Record<string, any>;
}

/**
 * Cost forecast configuration
 */
export interface CostForecastConfig {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  forecastPeriod: 'month' | 'quarter' | 'year';
  forecastHorizon: number; // Number of periods to forecast
  algorithm: 'linear_regression' | 'moving_average' | 'exponential_smoothing' | 'auto';
  scope: {
    entityIds?: string[];
    services?: string[];
    regions?: string[];
    tags?: Record<string, string>;
  };
  includeAnomalies: boolean;
  confidenceInterval: number; // e.g., 95 for 95% confidence interval
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  enabled: boolean;
}

/**
 * Cost forecast result
 */
export interface CostForecast {
  id: string;
  configId: string;
  organizationId: string;
  forecastPeriod: 'month' | 'quarter' | 'year';
  forecastHorizon: number;
  algorithm: string;
  periods: {
    period: string; // e.g., "2023-01", "Q1-2023"
    startDate: Date;
    endDate: Date;
    forecastedCost: number;
    lowerBound: number;
    upperBound: number;
    currency: string;
  }[];
  totalForecastedCost: number;
  currency: string;
  accuracy?: number; // MAPE (Mean Absolute Percentage Error) of the forecast
  generatedAt: Date;
  metadata: Record<string, any>;
}

/**
 * Cost center
 */
export interface CostCenter {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  code: string;
  parentId?: string;
  budgetId?: string;
  manager?: string;
  tags: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
}

/**
 * Cost center allocation
 */
export interface CostCenterAllocation {
  id: string;
  costCenterId: string;
  entityId: string;
  entityType: string;
  percentage: number;
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/**
 * Cost query parameters
 */
export interface CostQueryParams {
  startDate: Date;
  endDate: Date;
  groupBy?: ('service' | 'region' | 'account' | 'resourceType' | 'tag' | 'entity')[];
  filters?: {
    services?: string[];
    regions?: string[];
    accounts?: string[];
    resourceTypes?: string[];
    tags?: Record<string, string>;
    entities?: string[];
  };
  granularity?: 'daily' | 'weekly' | 'monthly';
  includeMetrics?: boolean;
  includeResourceDetails?: boolean;
}

/**
 * Cost query result
 */
export interface CostQueryResult {
  totalCost: number;
  currency: string;
  startDate: Date;
  endDate: Date;
  groupedCosts: CostGrouping[];
  timeSeries?: {
    timestamp: Date;
    cost: number;
  }[];
  metrics?: {
    averageDailyCost: number;
    peakDailyCost: number;
    costTrend: number; // Percentage increase/decrease
  };
  resourceDetails?: {
    resourceId: string;
    resourceType: string;
    cost: number;
    percentage: number;
  }[];
}