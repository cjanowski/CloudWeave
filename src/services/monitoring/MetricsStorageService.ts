import { IMetricsStorageService } from './interfaces';
import {
  Metric,
  MetricQuery,
  MetricSeries,
  QueryResult,
  BulkMetricInsert,
  MetricDefinition,
  DataPoint,
  AggregationType
} from './types';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service for storing and querying metrics data
 * Provides abstraction over time series database operations
 */
export class MetricsStorageService implements IMetricsStorageService {
  private metrics: Map<string, Metric[]> = new Map(); // In-memory storage for demo
  private metricDefinitions: Map<string, MetricDefinition> = new Map();
  private queryCache: Map<string, { result: QueryResult; timestamp: Date }> = new Map();
  private readonly CACHE_TTL = 60000; // 1 minute cache TTL

  constructor() {
    this.initializeDefaultMetrics();
  }

  /**
   * Store a single metric
   */
  async storeMetric(metric: Metric): Promise<void> {
    try {
      // Validate metric
      const validationErrors = this.validateMetric(metric);
      if (validationErrors.length > 0) {
        throw new Error(`Metric validation failed: ${validationErrors.join(', ')}`);
      }

      // Store metric
      if (!this.metrics.has(metric.name)) {
        this.metrics.set(metric.name, []);
      }

      this.metrics.get(metric.name)!.push(metric);

      // Update metric definition
      await this.updateMetricDefinition(metric);

      // Cleanup old data (keep last 1000 points per metric for demo)
      const metricData = this.metrics.get(metric.name)!;
      if (metricData.length > 1000) {
        this.metrics.set(metric.name, metricData.slice(-1000));
      }

      logger.debug(`Stored metric ${metric.name}`, {
        metricName: metric.name,
        value: metric.value,
        timestamp: metric.timestamp,
      });
    } catch (error) {
      logger.error(`Failed to store metric ${metric.name}:`, error);
      throw error;
    }
  }

  /**
   * Store multiple metrics in bulk
   */
  async storeMetrics(insert: BulkMetricInsert): Promise<void> {
    try {
      logger.debug(`Storing ${insert.metrics.length} metrics in bulk`, {
        source: insert.source,
        batchId: insert.batchId,
      });

      // Store each metric
      for (const metric of insert.metrics) {
        await this.storeMetric(metric);
      }

      logger.info(`Successfully stored ${insert.metrics.length} metrics from ${insert.source}`);
    } catch (error) {
      logger.error(`Failed to store metrics in bulk:`, error);
      throw error;
    }
  }

  /**
   * Query metrics
   */
  async queryMetrics(query: MetricQuery): Promise<QueryResult> {
    try {
      const startTime = Date.now();
      
      // Check cache
      const cacheKey = this.generateCacheKey(query);
      const cached = this.queryCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp.getTime() < this.CACHE_TTL) {
        logger.debug(`Returning cached result for query ${query.metric}`);
        return { ...cached.result, cached: true };
      }

      logger.debug(`Querying metrics for ${query.metric}`, query);

      // Get metric data
      const metricData = this.metrics.get(query.metric) || [];
      
      // Apply filters
      let filteredData = this.applyFilters(metricData, query);

      // Apply time range filter
      filteredData = this.applyTimeRangeFilter(filteredData, query.timeRange);

      // Create metric series
      const series = await this.createMetricSeries(query.metric, filteredData, query);

      const result: QueryResult = {
        metric: query.metric,
        data: [series],
        executionTime: Date.now() - startTime,
        cached: false,
        warnings: [],
      };

      // Add warnings
      if (filteredData.length === 0) {
        result.warnings = ['No data found for the specified query'];
      }

      // Cache result
      this.queryCache.set(cacheKey, {
        result: { ...result },
        timestamp: new Date(),
      });

      // Cleanup cache (keep last 100 entries)
      if (this.queryCache.size > 100) {
        const oldestKey = Array.from(this.queryCache.keys())[0];
        this.queryCache.delete(oldestKey);
      }

      logger.debug(`Query completed for ${query.metric}`, {
        dataPoints: filteredData.length,
        executionTime: result.executionTime,
      });

      return result;
    } catch (error) {
      logger.error(`Failed to query metrics for ${query.metric}:`, error);
      throw error;
    }
  }

  /**
   * Get metric series data
   */
  async getMetricSeries(metricName: string, query: MetricQuery): Promise<MetricSeries> {
    try {
      const metricData = this.metrics.get(metricName) || [];
      const filteredData = this.applyFilters(metricData, query);
      const timeFilteredData = this.applyTimeRangeFilter(filteredData, query.timeRange);

      return await this.createMetricSeries(metricName, timeFilteredData, query);
    } catch (error) {
      logger.error(`Failed to get metric series for ${metricName}:`, error);
      throw error;
    }
  }

  /**
   * Get available metrics
   */
  async getAvailableMetrics(): Promise<MetricDefinition[]> {
    return Array.from(this.metricDefinitions.values());
  }

  /**
   * Get metric metadata
   */
  async getMetricMetadata(metricName: string): Promise<MetricDefinition | null> {
    return this.metricDefinitions.get(metricName) || null;
  }

  /**
   * Delete metrics
   */
  async deleteMetrics(metricName: string, filters?: Record<string, string>): Promise<void> {
    try {
      if (!filters) {
        // Delete all data for metric
        this.metrics.delete(metricName);
        this.metricDefinitions.delete(metricName);
        logger.info(`Deleted all data for metric ${metricName}`);
      } else {
        // Delete filtered data
        const metricData = this.metrics.get(metricName) || [];
        const filteredData = metricData.filter(metric => {
          return !this.matchesFilters(metric, filters);
        });
        
        this.metrics.set(metricName, filteredData);
        logger.info(`Deleted filtered data for metric ${metricName}`, { filters });
      }
    } catch (error) {
      logger.error(`Failed to delete metrics for ${metricName}:`, error);
      throw error;
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStatistics(): Promise<{
    totalMetrics: number;
    totalDataPoints: number;
    storageSize: number;
    oldestDataPoint: Date;
    newestDataPoint: Date;
  }> {
    try {
      let totalDataPoints = 0;
      let oldestDataPoint = new Date();
      let newestDataPoint = new Date(0);

      for (const [metricName, data] of this.metrics) {
        totalDataPoints += data.length;
        
        if (data.length > 0) {
          const oldest = data[0].timestamp;
          const newest = data[data.length - 1].timestamp;
          
          if (oldest < oldestDataPoint) {
            oldestDataPoint = oldest;
          }
          if (newest > newestDataPoint) {
            newestDataPoint = newest;
          }
        }
      }

      // Estimate storage size (rough calculation)
      const storageSize = totalDataPoints * 100; // ~100 bytes per data point

      return {
        totalMetrics: this.metrics.size,
        totalDataPoints,
        storageSize,
        oldestDataPoint,
        newestDataPoint,
      };
    } catch (error) {
      logger.error('Failed to get storage statistics:', error);
      throw error;
    }
  }

  /**
   * Compact storage (remove old data based on retention policies)
   */
  async compactStorage(): Promise<void> {
    try {
      const now = new Date();
      const defaultRetention = 30 * 24 * 60 * 60 * 1000; // 30 days
      let compactedPoints = 0;

      for (const [metricName, data] of this.metrics) {
        const cutoffTime = new Date(now.getTime() - defaultRetention);
        const filteredData = data.filter(metric => metric.timestamp >= cutoffTime);
        
        const removedPoints = data.length - filteredData.length;
        if (removedPoints > 0) {
          this.metrics.set(metricName, filteredData);
          compactedPoints += removedPoints;
        }
      }

      logger.info(`Storage compaction completed`, {
        compactedPoints,
        remainingMetrics: this.metrics.size,
      });
    } catch (error) {
      logger.error('Failed to compact storage:', error);
      throw error;
    }
  }

  /**
   * Health check for storage backend
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Simple health check - verify we can read/write
      const testMetric: Metric = {
        id: uuidv4(),
        name: 'health_check_test',
        type: 'gauge',
        unit: 'count',
        description: 'Health check test metric',
        labels: { test: 'true' },
        value: 1,
        timestamp: new Date(),
        source: 'health_check',
      };

      await this.storeMetric(testMetric);
      
      const query: MetricQuery = {
        metric: 'health_check_test',
        timeRange: '5m',
      };
      
      const result = await this.queryMetrics(query);
      
      // Cleanup test metric
      await this.deleteMetrics('health_check_test');

      return result.data.length > 0;
    } catch (error) {
      logger.error('Storage health check failed:', error);
      return false;
    }
  }

  // Private helper methods
  private validateMetric(metric: Metric): string[] {
    const errors: string[] = [];

    if (!metric.name) {
      errors.push('Metric name is required');
    }

    if (!metric.type) {
      errors.push('Metric type is required');
    }

    if (typeof metric.value !== 'number' || isNaN(metric.value)) {
      errors.push('Metric value must be a valid number');
    }

    if (!metric.timestamp) {
      errors.push('Metric timestamp is required');
    }

    if (!metric.source) {
      errors.push('Metric source is required');
    }

    return errors;
  }

  private async updateMetricDefinition(metric: Metric): Promise<void> {
    if (!this.metricDefinitions.has(metric.name)) {
      const definition: MetricDefinition = {
        name: metric.name,
        type: metric.type,
        unit: metric.unit,
        description: metric.description,
        defaultLabels: metric.labels,
        retention: '30d',
      };

      this.metricDefinitions.set(metric.name, definition);
    }
  }

  private applyFilters(data: Metric[], query: MetricQuery): Metric[] {
    let filtered = data;

    // Apply label filters
    if (query.labels) {
      filtered = filtered.filter(metric => {
        return Object.entries(query.labels!).every(([key, value]) => {
          return metric.labels[key] === value;
        });
      });
    }

    // Apply additional filters
    if (query.filters) {
      filtered = filtered.filter(metric => {
        return query.filters!.every(filter => {
          return this.evaluateFilter(metric, filter);
        });
      });
    }

    return filtered;
  }

  private applyTimeRangeFilter(data: Metric[], timeRange: string): Metric[] {
    const now = new Date();
    const timeRangeMs = this.parseTimeRange(timeRange);
    const cutoffTime = new Date(now.getTime() - timeRangeMs);

    return data.filter(metric => metric.timestamp >= cutoffTime);
  }

  private parseTimeRange(timeRange: string): number {
    const timeRangeMap: Record<string, number> = {
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '12h': 12 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };

    return timeRangeMap[timeRange] || timeRangeMap['1h'];
  }

  private async createMetricSeries(metricName: string, data: Metric[], query: MetricQuery): Promise<MetricSeries> {
    // Convert metrics to data points
    let dataPoints: DataPoint[] = data.map(metric => ({
      timestamp: metric.timestamp,
      value: metric.value,
      labels: metric.labels,
    }));

    // Sort by timestamp
    dataPoints.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Apply aggregation if specified
    if (query.aggregation) {
      dataPoints = this.aggregateDataPoints(dataPoints, query.aggregation, query.resolution || '1m');
    }

    // Group by labels if specified
    if (query.groupBy && query.groupBy.length > 0) {
      // For simplicity, just return the data as-is for now
      // In a real implementation, this would group data points by specified labels
    }

    const metricDefinition = this.metricDefinitions.get(metricName) || {
      name: metricName,
      type: 'gauge',
      unit: 'count',
      description: `Metric: ${metricName}`,
      defaultLabels: {},
      retention: '30d',
    };

    return {
      metric: metricDefinition,
      dataPoints,
      aggregation: query.aggregation,
      timeRange: query.timeRange,
      resolution: query.resolution || '1m',
    };
  }

  private aggregateDataPoints(dataPoints: DataPoint[], aggregation: AggregationType, resolution: string): DataPoint[] {
    if (dataPoints.length === 0) return [];

    const resolutionMs = this.parseResolution(resolution);
    const aggregated: DataPoint[] = [];

    // Group data points by time buckets
    const buckets: Map<number, DataPoint[]> = new Map();

    for (const point of dataPoints) {
      const bucketTime = Math.floor(point.timestamp.getTime() / resolutionMs) * resolutionMs;
      if (!buckets.has(bucketTime)) {
        buckets.set(bucketTime, []);
      }
      buckets.get(bucketTime)!.push(point);
    }

    // Aggregate each bucket
    for (const [bucketTime, points] of buckets) {
      const aggregatedValue = this.calculateAggregation(points.map(p => p.value), aggregation);
      aggregated.push({
        timestamp: new Date(bucketTime),
        value: aggregatedValue,
        labels: points[0].labels, // Use labels from first point
      });
    }

    return aggregated.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private parseResolution(resolution: string): number {
    const resolutionMap: Record<string, number> = {
      '1s': 1000,
      '10s': 10 * 1000,
      '30s': 30 * 1000,
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
    };

    return resolutionMap[resolution] || resolutionMap['1m'];
  }

  private calculateAggregation(values: number[], aggregation: AggregationType): number {
    if (values.length === 0) return 0;

    switch (aggregation) {
      case 'sum':
        return values.reduce((sum, val) => sum + val, 0);
      case 'avg':
        return values.reduce((sum, val) => sum + val, 0) / values.length;
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      case 'count':
        return values.length;
      case 'rate':
        // Simple rate calculation (last - first) / time_diff
        return values.length > 1 ? values[values.length - 1] - values[0] : 0;
      case 'percentile':
        // 95th percentile for simplicity
        const sorted = [...values].sort((a, b) => a - b);
        const index = Math.floor(sorted.length * 0.95);
        return sorted[index] || 0;
      default:
        return values[values.length - 1] || 0;
    }
  }

  private evaluateFilter(metric: Metric, filter: any): boolean {
    const value = this.getFilterValue(metric, filter.field);
    
    switch (filter.operator) {
      case 'eq':
        return value === filter.value;
      case 'ne':
        return value !== filter.value;
      case 'gt':
        return value > filter.value;
      case 'gte':
        return value >= filter.value;
      case 'lt':
        return value < filter.value;
      case 'lte':
        return value <= filter.value;
      case 'in':
        return Array.isArray(filter.value) && filter.value.includes(value);
      case 'nin':
        return Array.isArray(filter.value) && !filter.value.includes(value);
      case 'regex':
        return new RegExp(filter.value).test(String(value));
      default:
        return true;
    }
  }

  private getFilterValue(metric: Metric, field: string): any {
    switch (field) {
      case 'value':
        return metric.value;
      case 'source':
        return metric.source;
      case 'timestamp':
        return metric.timestamp;
      default:
        return metric.labels[field];
    }
  }

  private matchesFilters(metric: Metric, filters: Record<string, string>): boolean {
    return Object.entries(filters).every(([key, value]) => {
      if (key === 'source') return metric.source === value;
      return metric.labels[key] === value;
    });
  }

  private generateCacheKey(query: MetricQuery): string {
    return JSON.stringify({
      metric: query.metric,
      labels: query.labels,
      aggregation: query.aggregation,
      timeRange: query.timeRange,
      resolution: query.resolution,
      filters: query.filters,
      groupBy: query.groupBy,
    });
  }

  private initializeDefaultMetrics(): void {
    // Initialize some default metric definitions
    const defaultMetrics = [
      {
        name: 'http_requests_total',
        type: 'counter' as const,
        unit: 'count' as const,
        description: 'Total number of HTTP requests',
        defaultLabels: { method: 'GET', status: '200' },
        retention: '30d',
      },
      {
        name: 'cpu_usage_percent',
        type: 'gauge' as const,
        unit: 'percent' as const,
        description: 'CPU usage percentage',
        defaultLabels: { instance: 'default' },
        retention: '30d',
      },
      {
        name: 'memory_usage_bytes',
        type: 'gauge' as const,
        unit: 'bytes' as const,
        description: 'Memory usage in bytes',
        defaultLabels: { instance: 'default' },
        retention: '30d',
      },
    ];

    defaultMetrics.forEach(metric => {
      this.metricDefinitions.set(metric.name, metric);
    });
  }
}