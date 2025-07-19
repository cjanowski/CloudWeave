/**
 * Cost Optimization Interfaces
 * Defines types for cost optimization recommendations and analysis
 */

import { CostDataPoint } from '../interfaces';

/**
 * Resource utilization metrics
 */
export interface ResourceUtilization {
  resourceId: string;
  resourceType: string;
  metrics: {
    cpu?: {
      average: number;
      peak: number;
      p95: number;
    };
    memory?: {
      average: number;
      peak: number;
      p95: number;
    };
    disk?: {
      average: number;
      peak: number;
      p95: number;
    };
    network?: {
      inbound: {
        average: number;
        peak: number;
      };
      outbound: {
        average: number;
        peak: number;
      };
    };
    iops?: {
      read: {
        average: number;
        peak: number;
      };
      write: {
        average: number;
        peak: number;
      };
    };
  };
  period: {
    startDate: Date;
    endDate: Date;
  };
  dataPoints: number;
}

/**
 * Resource pricing information
 */
export interface ResourcePricing {
  resourceType: string;
  provider: string;
  region: string;
  attributes: Record<string, string>;
  onDemandPrice: number;
  reservedPrice?: number;
  savingsPlanPrice?: number;
  spotPrice?: number;
  currency: string;
  unit: string;
  effectiveDate: Date;
}

/**
 * Cost optimization recommendation
 */
export interface CostOptimizationRecommendation {
  id: string;
  organizationId: string;
  resourceId: string;
  resourceType: string;
  recommendationType: RecommendationType;
  title: string;
  description: string;
  currentConfiguration: ResourceConfiguration;
  recommendedConfiguration: ResourceConfiguration;
  currentCost: number;
  recommendedCost: number;
  savingsAmount: number;
  savingsPercentage: number;
  currency: string;
  annualSavings: number;
  confidence: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  status: RecommendationStatus;
  category: RecommendationCategory;
  implementationSteps: string[];
  justification: string;
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
 * Resource configuration
 */
export interface ResourceConfiguration {
  provider: string;
  region: string;
  instanceType?: string;
  storageType?: string;
  storageSize?: number;
  iops?: number;
  throughput?: number;
  vcpus?: number;
  memory?: number;
  networkPerformance?: string;
  operatingSystem?: string;
  tenancy?: string;
  paymentOption?: 'on_demand' | 'reserved' | 'savings_plan' | 'spot';
  term?: number; // in months
  attributes: Record<string, any>;
}

/**
 * Recommendation type
 */
export type RecommendationType = 
  | 'rightsizing'
  | 'reserved_instance'
  | 'savings_plan'
  | 'idle_resource'
  | 'storage_optimization'
  | 'modernization'
  | 'region_transfer'
  | 'license_optimization'
  | 'instance_family_upgrade'
  | 'graviton_migration';

/**
 * Recommendation status
 */
export type RecommendationStatus = 
  | 'pending'
  | 'in_progress'
  | 'implemented'
  | 'dismissed'
  | 'expired';

/**
 * Recommendation category
 */
export type RecommendationCategory =
  | 'compute'
  | 'storage'
  | 'database'
  | 'network'
  | 'licensing'
  | 'reservation'
  | 'modernization';

/**
 * Cost anomaly
 */
export interface CostAnomaly {
  id: string;
  organizationId: string;
  resourceId?: string;
  resourceType?: string;
  serviceType?: string;
  region?: string;
  accountId?: string;
  detectedAt: Date;
  startDate: Date;
  endDate: Date;
  expectedCost: number;
  actualCost: number;
  deviation: number;
  deviationPercentage: number;
  currency: string;
  status: 'detected' | 'investigating' | 'resolved' | 'false_positive';
  severity: 'critical' | 'high' | 'medium' | 'low';
  rootCause?: string;
  impact: number;
  pattern: 'spike' | 'trend' | 'recurring' | 'step_change';
  assignedTo?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionSummary?: string;
  metadata: Record<string, any>;
}

/**
 * Cost optimization analysis
 */
export interface CostOptimizationAnalysis {
  organizationId: string;
  generatedAt: Date;
  period: {
    startDate: Date;
    endDate: Date;
  };
  totalCost: number;
  potentialSavings: number;
  potentialSavingsPercentage: number;
  currency: string;
  recommendations: CostOptimizationRecommendation[];
  savingsByCategory: Record<RecommendationCategory, number>;
  savingsByType: Record<RecommendationType, number>;
  savingsByConfidence: Record<'high' | 'medium' | 'low', number>;
  topWastefulResources: {
    resourceId: string;
    resourceType: string;
    cost: number;
    wastedCost: number;
    wastedPercentage: number;
  }[];
  reservationCoverage?: {
    eligible: number;
    covered: number;
    percentage: number;
  };
  reservationUtilization?: {
    purchased: number;
    utilized: number;
    percentage: number;
  };
  metadata: Record<string, any>;
}

/**
 * Cost optimization rule
 */
export interface CostOptimizationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  type: RecommendationType;
  category: RecommendationCategory;
  providers: string[];
  resourceTypes: string[];
  parameters: Record<string, any>;
  minimumSavingsAmount: number;
  minimumSavingsPercentage: number;
  confidence: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  implementationSteps: string[];
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
}

/**
 * Cost optimization job
 */
export interface CostOptimizationJob {
  id: string;
  organizationId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  resourcesAnalyzed: number;
  recommendationsGenerated: number;
  potentialSavings: number;
  currency: string;
  error?: string;
  createdBy: string;
  metadata: Record<string, any>;
}

/**
 * Resource usage pattern
 */
export interface ResourceUsagePattern {
  resourceId: string;
  resourceType: string;
  pattern: 'steady' | 'variable' | 'cyclical' | 'spiky' | 'growing' | 'declining';
  confidence: number;
  periodicity?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  peakTimes?: {
    dayOfWeek?: number[];
    hourOfDay?: number[];
    dayOfMonth?: number[];
    monthOfYear?: number[];
  };
  utilizationStats: {
    min: number;
    max: number;
    avg: number;
    p95: number;
    stdDev: number;
  };
  metadata: Record<string, any>;
}

/**
 * Cost optimization settings
 */
export interface CostOptimizationSettings {
  organizationId: string;
  enabled: boolean;
  analysisFrequency: 'daily' | 'weekly' | 'monthly';
  minimumSavingsThreshold: number;
  confidenceThreshold: 'high' | 'medium' | 'low';
  includedResourceTypes: string[];
  excludedResourceTypes: string[];
  includedAccounts: string[];
  excludedAccounts: string[];
  includedRegions: string[];
  excludedRegions: string[];
  includedTags: Record<string, string>;
  excludedTags: Record<string, string>;
  notifications: {
    enabled: boolean;
    minimumSavingsToNotify: number;
    recipients: string[];
    channels: string[];
  };
  autoImplementation: {
    enabled: boolean;
    requiresApproval: boolean;
    approvers: string[];
    minimumConfidence: 'high' | 'medium' | 'low';
    maximumImpact: number;
  };
  updatedAt: Date;
  updatedBy: string;
  metadata: Record<string, any>;
}