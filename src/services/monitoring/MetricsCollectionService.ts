import { IMetricsCollectionService } from './interfaces';
import {
  Metric,
  MetricCollector,
  CollectorStatus,
  MetricStatistics,
  BulkMetricInsert
} from './types';
import { IMetricsStorageService } from './interfaces';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service for collecting metrics from various sources
 * Handles metric collection orchestration, scheduling, and data ingestion
 */
export class MetricsCollectionService implements IMetricsCollectionService {
  private collectors: Map<string, MetricCollector> = new Map();
  private collectionIntervals: Map<string, NodeJS.Timeout> = new Map();
  private isCollecting = false;
  private collectionStats: MetricStatistics = {
    totalMetrics: 0,
    activeCollectors: 0,
    dataPoints: 0,
    storageSize: 0,
    queryRate: 0,
    ingestionRate: 0,
    errorRate: 0,
    lastUpdated: new Date(),
  };

  constructor(private storageService: IMetricsStorageService) {}

  /**
   * Register a new metric collector
   */
  async registerCollector(collectorData: Omit<MetricCollector, 'id' | 'lastCollection' | 'status'>): Promise<MetricCollector> {
    try {
      const collector: MetricCollector = {
        ...collectorData,
        id: uuidv4(),
        status: 'inactive',
      };

      // Validate collector configuration
      const validationErrors = await this.validateCollector(collector);
      if (validationErrors.length > 0) {
        throw new Error(`Collector validation failed: ${validationErrors.join(', ')}`);
      }

      this.collectors.set(collector.id, collector);

      logger.info(`Registered metric collector ${collector.id}`, {
        collectorId: collector.id,
        name: collector.name,
        type: collector.type,
        interval: collector.interval,
      });

      // Start collection if enabled and system is collecting
      if (collector.enabled && this.isCollecting) {
        await this.startCollectorCollection(collector.id);
      }

      return collector;
    } catch (error) {
      logger.error('Failed to register metric collector:', error);
      throw error;
    }
  }

  /**
   * Get all registered collectors
   */
  async getCollectors(): Promise<MetricCollector[]> {
    return Array.from(this.collectors.values());
  }

  /**
   * Get collector by ID
   */
  async getCollector(collectorId: string): Promise<MetricCollector | null> {
    return this.collectors.get(collectorId) || null;
  }

  /**
   * Update collector configuration
   */
  async updateCollector(collectorId: string, updates: Partial<MetricCollector>): Promise<MetricCollector> {
    try {
      const collector = this.collectors.get(collectorId);
      if (!collector) {
        throw new Error(`Collector ${collectorId} not found`);
      }

      const updatedCollector = { ...collector, ...updates };

      // Validate updated collector
      const validationErrors = await this.validateCollector(updatedCollector);
      if (validationErrors.length > 0) {
        throw new Error(`Collector validation failed: ${validationErrors.join(', ')}`);
      }

      this.collectors.set(collectorId, updatedCollector);

      // Restart collection if interval or configuration changed
      if (updates.interval || updates.configuration || updates.enabled !== undefined) {
        await this.restartCollectorCollection(collectorId);
      }

      logger.info(`Updated metric collector ${collectorId}`, {
        collectorId,
        updates: Object.keys(updates),
      });

      return updatedCollector;
    } catch (error) {
      logger.error(`Failed to update collector ${collectorId}:`, error);
      throw error;
    }
  }

  /**
   * Enable or disable collector
   */
  async setCollectorEnabled(collectorId: string, enabled: boolean): Promise<void> {
    try {
      const collector = this.collectors.get(collectorId);
      if (!collector) {
        throw new Error(`Collector ${collectorId} not found`);
      }

      collector.enabled = enabled;

      if (enabled && this.isCollecting) {
        await this.startCollectorCollection(collectorId);
      } else {
        await this.stopCollectorCollection(collectorId);
      }

      logger.info(`${enabled ? 'Enabled' : 'Disabled'} collector ${collectorId}`);
    } catch (error) {
      logger.error(`Failed to set collector ${collectorId} enabled status:`, error);
      throw error;
    }
  }

  /**
   * Remove collector
   */
  async removeCollector(collectorId: string): Promise<void> {
    try {
      const collector = this.collectors.get(collectorId);
      if (!collector) {
        throw new Error(`Collector ${collectorId} not found`);
      }

      // Stop collection
      await this.stopCollectorCollection(collectorId);

      // Remove from registry
      this.collectors.delete(collectorId);

      logger.info(`Removed collector ${collectorId}`);
    } catch (error) {
      logger.error(`Failed to remove collector ${collectorId}:`, error);
      throw error;
    }
  }

  /**
   * Start metric collection for all enabled collectors
   */
  async startCollection(): Promise<void> {
    try {
      if (this.isCollecting) {
        logger.warn('Metric collection is already running');
        return;
      }

      this.isCollecting = true;

      // Start collection for all enabled collectors
      const enabledCollectors = Array.from(this.collectors.values()).filter(c => c.enabled);
      
      for (const collector of enabledCollectors) {
        await this.startCollectorCollection(collector.id);
      }

      logger.info(`Started metric collection for ${enabledCollectors.length} collectors`);
    } catch (error) {
      logger.error('Failed to start metric collection:', error);
      this.isCollecting = false;
      throw error;
    }
  }

  /**
   * Stop metric collection
   */
  async stopCollection(): Promise<void> {
    try {
      this.isCollecting = false;

      // Stop all collection intervals
      for (const [collectorId] of this.collectionIntervals) {
        await this.stopCollectorCollection(collectorId);
      }

      logger.info('Stopped metric collection');
    } catch (error) {
      logger.error('Failed to stop metric collection:', error);
      throw error;
    }
  }

  /**
   * Collect metrics from a specific collector
   */
  async collectFromSource(collectorId: string): Promise<Metric[]> {
    try {
      const collector = this.collectors.get(collectorId);
      if (!collector) {
        throw new Error(`Collector ${collectorId} not found`);
      }

      logger.debug(`Collecting metrics from ${collector.name}`);

      const metrics = await this.executeCollection(collector);
      
      // Store metrics
      if (metrics.length > 0) {
        const bulkInsert: BulkMetricInsert = {
          metrics,
          source: collector.name,
          timestamp: new Date(),
        };
        
        await this.storageService.storeMetrics(bulkInsert);
      }

      // Update collector status
      collector.lastCollection = new Date();
      collector.status = 'active';

      // Update statistics
      this.updateCollectionStats(metrics.length);

      logger.debug(`Collected ${metrics.length} metrics from ${collector.name}`);

      return metrics;
    } catch (error) {
      logger.error(`Failed to collect from source ${collectorId}:`, error);
      
      // Update collector status
      const collector = this.collectors.get(collectorId);
      if (collector) {
        collector.status = 'error';
      }

      throw error;
    }
  }

  /**
   * Get collector status
   */
  async getCollectorStatus(collectorId: string): Promise<CollectorStatus> {
    const collector = this.collectors.get(collectorId);
    if (!collector) {
      throw new Error(`Collector ${collectorId} not found`);
    }

    return collector.status;
  }

  /**
   * Get collection statistics
   */
  async getCollectionStatistics(): Promise<MetricStatistics> {
    try {
      // Update active collectors count
      this.collectionStats.activeCollectors = Array.from(this.collectors.values())
        .filter(c => c.enabled && c.status === 'active').length;

      // Get storage statistics
      const storageStats = await this.storageService.getStorageStatistics();
      this.collectionStats.totalMetrics = storageStats.totalMetrics;
      this.collectionStats.dataPoints = storageStats.totalDataPoints;
      this.collectionStats.storageSize = storageStats.storageSize;

      this.collectionStats.lastUpdated = new Date();

      return { ...this.collectionStats };
    } catch (error) {
      logger.error('Failed to get collection statistics:', error);
      throw error;
    }
  }

  // Private helper methods
  private async startCollectorCollection(collectorId: string): Promise<void> {
    const collector = this.collectors.get(collectorId);
    if (!collector || !collector.enabled) {
      return;
    }

    // Stop existing interval if any
    await this.stopCollectorCollection(collectorId);

    // Start new collection interval
    const interval = setInterval(async () => {
      try {
        await this.collectFromSource(collectorId);
      } catch (error) {
        logger.error(`Collection failed for collector ${collectorId}:`, error);
      }
    }, collector.interval * 1000);

    this.collectionIntervals.set(collectorId, interval);

    // Initial collection
    try {
      await this.collectFromSource(collectorId);
    } catch (error) {
      logger.error(`Initial collection failed for collector ${collectorId}:`, error);
    }

    logger.debug(`Started collection for collector ${collectorId} with interval ${collector.interval}s`);
  }

  private async stopCollectorCollection(collectorId: string): Promise<void> {
    const interval = this.collectionIntervals.get(collectorId);
    if (interval) {
      clearInterval(interval);
      this.collectionIntervals.delete(collectorId);
    }

    const collector = this.collectors.get(collectorId);
    if (collector) {
      collector.status = 'inactive';
    }

    logger.debug(`Stopped collection for collector ${collectorId}`);
  }

  private async restartCollectorCollection(collectorId: string): Promise<void> {
    await this.stopCollectorCollection(collectorId);
    if (this.isCollecting) {
      await this.startCollectorCollection(collectorId);
    }
  }

  private async executeCollection(collector: MetricCollector): Promise<Metric[]> {
    switch (collector.type) {
      case 'prometheus':
        return await this.collectPrometheusMetrics(collector);
      case 'statsd':
        return await this.collectStatsDMetrics(collector);
      case 'application':
        return await this.collectApplicationMetrics(collector);
      case 'infrastructure':
        return await this.collectInfrastructureMetrics(collector);
      case 'kubernetes':
        return await this.collectKubernetesMetrics(collector);
      case 'docker':
        return await this.collectDockerMetrics(collector);
      case 'custom':
        return await this.collectCustomMetrics(collector);
      default:
        throw new Error(`Unsupported collector type: ${collector.type}`);
    }
  }

  private async collectPrometheusMetrics(collector: MetricCollector): Promise<Metric[]> {
    // Simulate Prometheus metrics collection
    const metrics: Metric[] = [];
    const timestamp = new Date();

    // Generate mock Prometheus metrics
    const prometheusMetrics = [
      { name: 'http_requests_total', value: Math.floor(Math.random() * 1000), labels: { method: 'GET', status: '200' } },
      { name: 'http_request_duration_seconds', value: Math.random() * 2, labels: { method: 'GET' } },
      { name: 'cpu_usage_percent', value: Math.random() * 100, labels: { instance: 'web-1' } },
      { name: 'memory_usage_bytes', value: Math.random() * 1000000000, labels: { instance: 'web-1' } },
    ];

    for (const metric of prometheusMetrics) {
      metrics.push({
        id: uuidv4(),
        name: metric.name,
        type: 'gauge',
        unit: metric.name.includes('bytes') ? 'bytes' : 
              metric.name.includes('seconds') ? 'seconds' : 
              metric.name.includes('percent') ? 'percent' : 'count',
        description: `Prometheus metric: ${metric.name}`,
        labels: metric.labels,
        value: metric.value,
        timestamp,
        source: collector.name,
      });
    }

    return metrics;
  }

  private async collectStatsDMetrics(collector: MetricCollector): Promise<Metric[]> {
    // Simulate StatsD metrics collection
    const metrics: Metric[] = [];
    const timestamp = new Date();

    const statsdMetrics = [
      { name: 'api.requests', value: Math.floor(Math.random() * 100), type: 'counter' },
      { name: 'api.response_time', value: Math.random() * 500, type: 'histogram' },
      { name: 'queue.size', value: Math.floor(Math.random() * 50), type: 'gauge' },
    ];

    for (const metric of statsdMetrics) {
      metrics.push({
        id: uuidv4(),
        name: metric.name,
        type: metric.type as any,
        unit: metric.name.includes('time') ? 'milliseconds' : 'count',
        description: `StatsD metric: ${metric.name}`,
        labels: { collector: 'statsd' },
        value: metric.value,
        timestamp,
        source: collector.name,
      });
    }

    return metrics;
  }

  private async collectApplicationMetrics(collector: MetricCollector): Promise<Metric[]> {
    // Simulate application-specific metrics
    const metrics: Metric[] = [];
    const timestamp = new Date();

    const appMetrics = [
      { name: 'app.users.active', value: Math.floor(Math.random() * 1000) },
      { name: 'app.database.connections', value: Math.floor(Math.random() * 20) },
      { name: 'app.cache.hit_rate', value: Math.random() * 100 },
      { name: 'app.errors.rate', value: Math.random() * 5 },
    ];

    for (const metric of appMetrics) {
      metrics.push({
        id: uuidv4(),
        name: metric.name,
        type: 'gauge',
        unit: metric.name.includes('rate') ? 'percent' : 'count',
        description: `Application metric: ${metric.name}`,
        labels: { app: 'cloudweave' },
        value: metric.value,
        timestamp,
        source: collector.name,
      });
    }

    return metrics;
  }

  private async collectInfrastructureMetrics(collector: MetricCollector): Promise<Metric[]> {
    // Simulate infrastructure metrics
    const metrics: Metric[] = [];
    const timestamp = new Date();

    const infraMetrics = [
      { name: 'system.cpu.usage', value: Math.random() * 100 },
      { name: 'system.memory.usage', value: Math.random() * 8000000000 },
      { name: 'system.disk.usage', value: Math.random() * 100000000000 },
      { name: 'system.network.bytes_in', value: Math.random() * 1000000 },
      { name: 'system.network.bytes_out', value: Math.random() * 1000000 },
    ];

    for (const metric of infraMetrics) {
      metrics.push({
        id: uuidv4(),
        name: metric.name,
        type: 'gauge',
        unit: metric.name.includes('bytes') ? 'bytes' : 
              metric.name.includes('usage') && !metric.name.includes('cpu') ? 'bytes' : 'percent',
        description: `Infrastructure metric: ${metric.name}`,
        labels: { host: 'server-1' },
        value: metric.value,
        timestamp,
        source: collector.name,
      });
    }

    return metrics;
  }

  private async collectKubernetesMetrics(collector: MetricCollector): Promise<Metric[]> {
    // Simulate Kubernetes metrics
    const metrics: Metric[] = [];
    const timestamp = new Date();

    const k8sMetrics = [
      { name: 'k8s.pod.cpu.usage', value: Math.random() * 100 },
      { name: 'k8s.pod.memory.usage', value: Math.random() * 1000000000 },
      { name: 'k8s.node.ready', value: Math.random() > 0.1 ? 1 : 0 },
      { name: 'k8s.deployment.replicas', value: Math.floor(Math.random() * 10) + 1 },
    ];

    for (const metric of k8sMetrics) {
      metrics.push({
        id: uuidv4(),
        name: metric.name,
        type: 'gauge',
        unit: metric.name.includes('cpu') ? 'percent' : 
              metric.name.includes('memory') ? 'bytes' : 'count',
        description: `Kubernetes metric: ${metric.name}`,
        labels: { 
          namespace: 'default',
          pod: 'web-pod-1',
          node: 'node-1'
        },
        value: metric.value,
        timestamp,
        source: collector.name,
      });
    }

    return metrics;
  }

  private async collectDockerMetrics(collector: MetricCollector): Promise<Metric[]> {
    // Simulate Docker metrics
    const metrics: Metric[] = [];
    const timestamp = new Date();

    const dockerMetrics = [
      { name: 'docker.container.cpu.usage', value: Math.random() * 100 },
      { name: 'docker.container.memory.usage', value: Math.random() * 500000000 },
      { name: 'docker.container.network.rx_bytes', value: Math.random() * 1000000 },
      { name: 'docker.container.network.tx_bytes', value: Math.random() * 1000000 },
    ];

    for (const metric of dockerMetrics) {
      metrics.push({
        id: uuidv4(),
        name: metric.name,
        type: 'gauge',
        unit: metric.name.includes('bytes') ? 'bytes' : 
              metric.name.includes('cpu') ? 'percent' : 'count',
        description: `Docker metric: ${metric.name}`,
        labels: { 
          container: 'web-container',
          image: 'nginx:latest'
        },
        value: metric.value,
        timestamp,
        source: collector.name,
      });
    }

    return metrics;
  }

  private async collectCustomMetrics(collector: MetricCollector): Promise<Metric[]> {
    // Simulate custom metrics collection
    const metrics: Metric[] = [];
    const timestamp = new Date();

    // Generate random custom metrics based on collector configuration
    const customMetrics = collector.metrics.map(metricName => ({
      name: metricName,
      value: Math.random() * 100,
    }));

    for (const metric of customMetrics) {
      metrics.push({
        id: uuidv4(),
        name: metric.name,
        type: 'gauge',
        unit: 'count',
        description: `Custom metric: ${metric.name}`,
        labels: { custom: 'true' },
        value: metric.value,
        timestamp,
        source: collector.name,
      });
    }

    return metrics;
  }

  private async validateCollector(collector: MetricCollector): Promise<string[]> {
    const errors: string[] = [];

    if (!collector.name) {
      errors.push('Collector name is required');
    }

    if (!collector.type) {
      errors.push('Collector type is required');
    }

    if (!collector.source) {
      errors.push('Collector source is required');
    }

    if (collector.interval <= 0) {
      errors.push('Collector interval must be positive');
    }

    if (collector.interval < 10) {
      errors.push('Collector interval must be at least 10 seconds');
    }

    // Type-specific validation
    switch (collector.type) {
      case 'prometheus':
        if (!collector.source.endpoint) {
          errors.push('Prometheus collector requires endpoint');
        }
        break;
      case 'custom':
        if (!collector.metrics || collector.metrics.length === 0) {
          errors.push('Custom collector requires metric names');
        }
        break;
    }

    return errors;
  }

  private updateCollectionStats(metricsCount: number): void {
    this.collectionStats.dataPoints += metricsCount;
    this.collectionStats.ingestionRate = metricsCount / 60; // per minute
    this.collectionStats.lastUpdated = new Date();
  }
}