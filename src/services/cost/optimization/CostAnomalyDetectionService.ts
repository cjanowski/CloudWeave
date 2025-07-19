/**
 * Cost Anomaly Detection Service
 * Detects unusual spending patterns and cost anomalies
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../../utils/logger';
import { CostDataPoint } from '../interfaces';
import { CostAnomaly } from './interfaces';

/**
 * Service for detecting cost anomalies
 */
export class CostAnomalyDetectionService {
  private anomalies: Map<string, CostAnomaly> = new Map();

  /**
   * Detect cost anomalies in the provided data
   */
  async detectAnomalies(
    organizationId: string,
    costData: CostDataPoint[],
    options: {
      sensitivityThreshold?: number;
      minimumAnomalyAmount?: number;
      lookbackDays?: number;
    } = {}
  ): Promise<CostAnomaly[]> {
    try {
      logger.info(`Detecting cost anomalies for organization ${organizationId}`, {
        organizationId,
        dataPoints: costData.length
      });

      const sensitivityThreshold = options.sensitivityThreshold || 2.0; // Standard deviations
      const minimumAnomalyAmount = options.minimumAnomalyAmount || 100; // Minimum $100 anomaly
      const lookbackDays = options.lookbackDays || 30;

      // Group data by resource and time periods
      const resourceData = this.groupDataByResource(costData);
      const detectedAnomalies: CostAnomaly[] = [];

      for (const [resourceId, data] of resourceData.entries()) {
        const resourceAnomalies = await this.detectResourceAnomalies(
          organizationId,
          resourceId,
          data,
          sensitivityThreshold,
          minimumAnomalyAmount,
          lookbackDays
        );
        detectedAnomalies.push(...resourceAnomalies);
      }

      // Store anomalies
      for (const anomaly of detectedAnomalies) {
        this.anomalies.set(anomaly.id, anomaly);
      }

      logger.info(`Detected ${detectedAnomalies.length} cost anomalies for organization ${organizationId}`, {
        organizationId,
        anomaliesDetected: detectedAnomalies.length
      });

      return detectedAnomalies;
    } catch (error) {
      logger.error(`Failed to detect cost anomalies for organization ${organizationId}`, { error });
      throw error;
    }
  }

  /**
   * Group cost data by resource
   */
  private groupDataByResource(costData: CostDataPoint[]): Map<string, CostDataPoint[]> {
    const resourceData = new Map<string, CostDataPoint[]>();

    for (const dataPoint of costData) {
      if (!resourceData.has(dataPoint.resourceId)) {
        resourceData.set(dataPoint.resourceId, []);
      }
      resourceData.get(dataPoint.resourceId)!.push(dataPoint);
    }

    // Sort data by timestamp for each resource
    for (const [resourceId, data] of resourceData.entries()) {
      data.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }

    return resourceData;
  }
}  /**
  
 * Detect anomalies for a specific resource
   */
  private async detectResourceAnomalies(
    organizationId: string,
    resourceId: string,
    data: CostDataPoint[],
    sensitivityThreshold: number,
    minimumAnomalyAmount: number,
    lookbackDays: number
  ): Promise<CostAnomaly[]> {
    if (data.length < 7) {
      // Need at least a week of data for meaningful anomaly detection
      return [];
    }

    const anomalies: CostAnomaly[] = [];
    
    // Group data by day
    const dailyCosts = this.groupDataByDay(data);
    const dailyAmounts = Array.from(dailyCosts.values());

    if (dailyAmounts.length < 7) {
      return [];
    }

    // Calculate baseline statistics (excluding recent days to avoid bias)
    const baselineData = dailyAmounts.slice(0, -3); // Exclude last 3 days
    const mean = this.calculateMean(baselineData);
    const stdDev = this.calculateStandardDeviation(baselineData, mean);

    // Check recent days for anomalies
    const recentData = dailyAmounts.slice(-3);
    const recentDates = Array.from(dailyCosts.keys()).slice(-3);

    for (let i = 0; i < recentData.length; i++) {
      const amount = recentData[i];
      const date = recentDates[i];
      const deviation = Math.abs(amount - mean);
      const deviationInStdDevs = stdDev > 0 ? deviation / stdDev : 0;

      if (deviationInStdDevs >= sensitivityThreshold && deviation >= minimumAnomalyAmount) {
        const anomaly = this.createAnomaly(
          organizationId,
          resourceId,
          data[0], // Use first data point for resource info
          date,
          amount,
          mean,
          deviation,
          deviationInStdDevs
        );
        anomalies.push(anomaly);
      }
    }

    return anomalies;
  }

  /**
   * Group cost data by day
   */
  private groupDataByDay(data: CostDataPoint[]): Map<string, number> {
    const dailyCosts = new Map<string, number>();

    for (const dataPoint of data) {
      const dateKey = dataPoint.timestamp.toISOString().split('T')[0];
      const currentAmount = dailyCosts.get(dateKey) || 0;
      dailyCosts.set(dateKey, currentAmount + dataPoint.amount);
    }

    return dailyCosts;
  }

  /**
   * Calculate mean of an array
   */
  private calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  /**
   * Calculate standard deviation
   */
  private calculateStandardDeviation(values: number[], mean: number): number {
    if (values.length === 0) return 0;
    const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Create an anomaly object
   */
  private createAnomaly(
    organizationId: string,
    resourceId: string,
    sampleDataPoint: CostDataPoint,
    date: string,
    actualCost: number,
    expectedCost: number,
    deviation: number,
    deviationInStdDevs: number
  ): CostAnomaly {
    const deviationPercentage = expectedCost > 0 ? (deviation / expectedCost) * 100 : 0;
    
    // Determine severity based on deviation
    let severity: 'critical' | 'high' | 'medium' | 'low';
    if (deviationInStdDevs >= 4) {
      severity = 'critical';
    } else if (deviationInStdDevs >= 3) {
      severity = 'high';
    } else if (deviationInStdDevs >= 2.5) {
      severity = 'medium';
    } else {
      severity = 'low';
    }

    // Determine pattern
    let pattern: 'spike' | 'trend' | 'recurring' | 'step_change';
    if (actualCost > expectedCost * 2) {
      pattern = 'spike';
    } else if (actualCost > expectedCost * 1.5) {
      pattern = 'step_change';
    } else {
      pattern = 'trend';
    }

    return {
      id: uuidv4(),
      organizationId,
      resourceId,
      resourceType: sampleDataPoint.resourceType,
      serviceType: sampleDataPoint.serviceType,
      region: sampleDataPoint.region,
      accountId: sampleDataPoint.accountId,
      detectedAt: new Date(),
      startDate: new Date(date),
      endDate: new Date(date),
      expectedCost,
      actualCost,
      deviation,
      deviationPercentage,
      currency: sampleDataPoint.currency,
      status: 'detected',
      severity,
      impact: deviation,
      pattern,
      metadata: {
        deviationInStdDevs,
        detectionMethod: 'statistical',
        baselineDataPoints: 0 // Would be calculated in real implementation
      }
    };
  }

  /**
   * Get anomalies for an organization
   */
  async getAnomalies(
    organizationId: string,
    options: {
      status?: 'detected' | 'investigating' | 'resolved' | 'false_positive';
      severity?: 'critical' | 'high' | 'medium' | 'low';
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    } = {}
  ): Promise<CostAnomaly[]> {
    let anomalies = Array.from(this.anomalies.values()).filter(
      anomaly => anomaly.organizationId === organizationId
    );

    // Apply filters
    if (options.status) {
      anomalies = anomalies.filter(anomaly => anomaly.status === options.status);
    }

    if (options.severity) {
      anomalies = anomalies.filter(anomaly => anomaly.severity === options.severity);
    }

    if (options.startDate) {
      anomalies = anomalies.filter(anomaly => anomaly.startDate >= options.startDate!);
    }

    if (options.endDate) {
      anomalies = anomalies.filter(anomaly => anomaly.endDate <= options.endDate!);
    }

    // Sort by detection date (newest first)
    anomalies.sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());

    // Apply limit
    if (options.limit && options.limit > 0) {
      anomalies = anomalies.slice(0, options.limit);
    }

    return anomalies;
  }

  /**
   * Update anomaly status
   */
  async updateAnomalyStatus(
    anomalyId: string,
    status: 'detected' | 'investigating' | 'resolved' | 'false_positive',
    options: {
      assignedTo?: string;
      rootCause?: string;
      resolutionSummary?: string;
      resolvedBy?: string;
    } = {}
  ): Promise<CostAnomaly> {
    const anomaly = this.anomalies.get(anomalyId);
    if (!anomaly) {
      throw new Error(`Anomaly ${anomalyId} not found`);
    }

    anomaly.status = status;

    if (status === 'resolved') {
      anomaly.resolvedAt = new Date();
      anomaly.resolvedBy = options.resolvedBy;
      anomaly.resolutionSummary = options.resolutionSummary;
    }

    if (options.assignedTo) {
      anomaly.assignedTo = options.assignedTo;
    }

    if (options.rootCause) {
      anomaly.rootCause = options.rootCause;
    }

    this.anomalies.set(anomalyId, anomaly);

    logger.info(`Updated anomaly ${anomalyId} status to ${status}`, {
      anomalyId,
      status,
      resourceId: anomaly.resourceId
    });

    return anomaly;
  }

  /**
   * Get a specific anomaly
   */
  async getAnomaly(anomalyId: string): Promise<CostAnomaly | null> {
    return this.anomalies.get(anomalyId) || null;
  }
}