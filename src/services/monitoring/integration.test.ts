import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { createMonitoringService, createDefaultCollectors, MetricUtils } from './index';
import { MetricQuery, BulkMetricInsert, Metric } from './types';

describe('Monitoring Service Integration Tests', () => {
  let services: any;

  beforeEach(async () => {
    services = await createMonitoringService();
  });

  describe('end-to-end monitoring workflow', () => {
    it('should collect, store, query metrics, and handle alerts', async () => {
      // Step 1: Register collectors
      const defaultCollectors = createDefaultCollectors();
      const registeredCollectors = [];

      for (const collectorData of defaultCollectors) {
        const collector = await services.collectionService.registerCollector(collectorData);
        registeredCollectors.push(collector);
      }

      expect(registeredCollectors).toHaveLength(3);
      expect(registeredCollectors[0].name).toBe('System Metrics');
      expect(registeredCollectors[1].name).toBe('Application Metrics');
      expect(registeredCollectors[2].name).toBe('Kubernetes Metrics');

      // Step 2: Collect metrics from one collector
      const systemCollector = registeredCollectors[0];
      const collectedMetrics = await services.collectionService.collectFromSource(systemCollector.id);

      expect(collectedMetrics.length).toBeGreaterThan(0);
      expect(collectedMetrics[0]).toHaveProperty('name');
      expect(collectedMetrics[0]).toHaveProperty('value');
      expect(collectedMetrics[0]).toHaveProperty('timestamp');

      // Step 3: Query the stored metrics
      const query: MetricQuery = {
        metric: 'system.cpu.usage',
        timeRange: '1h',
        aggregation: 'avg',
        resolution: '1m',
      };

      const queryResult = await services.storageService.queryMetrics(query);

      expect(queryResult.metric).toBe('system.cpu.usage');
      expect(queryResult.data).toHaveLength(1);
      expect(queryResult.executionTime).toBeGreaterThanOrEqual(0);
      expect(queryResult.cached).toBe(false);

      // Step 4: Query with different aggregations
      const aggregations = ['sum', 'avg', 'min', 'max', 'count'];
      
      for (const aggregation of aggregations) {
        const aggQuery: MetricQuery = {
          metric: 'system.cpu.usage',
          timeRange: '1h',
          aggregation: aggregation as any,
        };

        const result = await services.storageService.queryMetrics(aggQuery);
        expect(result.data[0].aggregation).toBe(aggregation);
      }

      // Step 5: Test metric series retrieval
      const series = await services.storageService.getMetricSeries('system.cpu.usage', query);
      expect(series.metric.name).toBe('system.cpu.usage');
      expect(series.dataPoints).toBeDefined();
      expect(series.timeRange).toBe('1h');

      // Step 6: Test alerting functionality
      const alertRule = await services.alertingService.createAlertRule({
        name: 'High CPU Usage Alert',
        description: 'Alert when CPU usage exceeds 80%',
        organizationId: 'test-org',
        query: {
          metric: 'system.cpu.usage',
          timeRange: '5m',
          aggregation: 'avg',
        },
        condition: {
          aggregation: 'avg',
          operator: 'gt',
          threshold: 80,
          timeWindow: '5m',
          evaluationWindow: '1m',
        },
        frequency: '1m',
        severity: 'warning',
        notifications: [],
        labels: { team: 'platform' },
        annotations: { runbook: 'https://wiki.example.com/cpu-alerts' },
        createdBy: 'integration-test',
        enabled: true,
      });

      expect(alertRule.id).toBeDefined();
      expect(alertRule.name).toBe('High CPU Usage Alert');
      expect(alertRule.state).toBe('ok');

      // Test alert rule evaluation
      const testResult = await services.alertingService.testAlertRule(alertRule);
      expect(testResult).toHaveProperty('triggered');
      expect(testResult).toHaveProperty('value');

      // Test notification service
      const supportedTypes = services.notificationService.getSupportedTypes();
      expect(supportedTypes).toContain('email');
      expect(supportedTypes).toContain('slack');
    });

    it('should handle bulk metric insertion and querying', async () => {
      // Create bulk metrics
      const bulkMetrics: Metric[] = [];
      const metricNames = ['test.counter', 'test.gauge', 'test.histogram'];
      const now = new Date();

      for (let i = 0; i < 100; i++) {
        for (const metricName of metricNames) {
          bulkMetrics.push({
            id: `metric-${i}-${metricName}`,
            name: metricName,
            type: 'gauge',
            unit: 'count',
            description: `Test metric ${metricName}`,
            labels: { 
              instance: `instance-${i % 5}`,
              environment: i % 2 === 0 ? 'production' : 'staging',
            },
            value: Math.random() * 100,
            timestamp: new Date(now.getTime() - (i * 60000)), // 1 minute intervals
            source: 'integration-test',
          });
        }
      }

      const bulkInsert: BulkMetricInsert = {
        metrics: bulkMetrics,
        source: 'integration-test',
        timestamp: now,
        batchId: 'test-batch-1',
      };

      // Store bulk metrics
      await services.storageService.storeMetrics(bulkInsert);

      // Query with label filters
      const labelQuery: MetricQuery = {
        metric: 'test.counter',
        labels: { environment: 'production' },
        timeRange: '24h',
        aggregation: 'avg',
      };

      const labelResult = await services.storageService.queryMetrics(labelQuery);
      expect(labelResult.data[0].dataPoints.length).toBeGreaterThan(0);

      // Query with time range
      const timeQuery: MetricQuery = {
        metric: 'test.gauge',
        timeRange: '1h',
        resolution: '5m',
      };

      const timeResult = await services.storageService.queryMetrics(timeQuery);
      expect(timeResult.data[0].resolution).toBe('5m');

      // Test aggregation
      const aggQuery: MetricQuery = {
        metric: 'test.histogram',
        timeRange: '6h',
        aggregation: 'percentile',
        resolution: '10m',
      };

      const aggResult = await services.storageService.queryMetrics(aggQuery);
      expect(aggResult.data[0].aggregation).toBe('percentile');
    });

    it('should manage collector lifecycle', async () => {
      // Register collector
      const collectorData = {
        name: 'Lifecycle Test Collector',
        type: 'custom' as const,
        source: {
          type: 'pull' as const,
        },
        configuration: {
          scrapeInterval: 30,
          scrapeTimeout: 10,
          metricsPath: '/metrics',
          scheme: 'http' as const,
        },
        interval: 30,
        enabled: true,
        metrics: ['lifecycle.test.metric'],
      };

      const collector = await services.collectionService.registerCollector(collectorData);
      expect(collector.status).toBe('inactive');

      // Start collection
      await services.collectionService.startCollection();

      // Wait for collection to happen
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check collector status
      const status = await services.collectionService.getCollectorStatus(collector.id);
      expect(['active', 'error']).toContain(status);

      // Update collector
      const updatedCollector = await services.collectionService.updateCollector(collector.id, {
        interval: 60,
        enabled: false,
      });

      expect(updatedCollector.interval).toBe(60);
      expect(updatedCollector.enabled).toBe(false);

      // Stop collection
      await services.collectionService.stopCollection();

      // Remove collector
      await services.collectionService.removeCollector(collector.id);
      const removedCollector = await services.collectionService.getCollector(collector.id);
      expect(removedCollector).toBeNull();
    });

    it('should provide storage statistics and health checks', async () => {
      // Add some test data
      const testMetrics: Metric[] = [];
      for (let i = 0; i < 50; i++) {
        testMetrics.push({
          id: `test-${i}`,
          name: 'storage.test.metric',
          type: 'gauge',
          unit: 'count',
          description: 'Storage test metric',
          labels: { test: 'true' },
          value: Math.random() * 100,
          timestamp: new Date(),
          source: 'storage-test',
        });
      }

      for (const metric of testMetrics) {
        await services.storageService.storeMetric(metric);
      }

      // Get storage statistics
      const stats = await services.storageService.getStorageStatistics();
      expect(stats.totalMetrics).toBeGreaterThan(0);
      expect(stats.totalDataPoints).toBeGreaterThan(0);
      expect(stats.storageSize).toBeGreaterThan(0);
      expect(stats.oldestDataPoint).toBeInstanceOf(Date);
      expect(stats.newestDataPoint).toBeInstanceOf(Date);

      // Health check
      const isHealthy = await services.storageService.healthCheck();
      expect(isHealthy).toBe(true);

      // Get available metrics
      const availableMetrics = await services.storageService.getAvailableMetrics();
      expect(availableMetrics.length).toBeGreaterThan(0);

      // Get metric metadata
      const metadata = await services.storageService.getMetricMetadata('storage.test.metric');
      expect(metadata).not.toBeNull();
      expect(metadata!.name).toBe('storage.test.metric');

      // Test storage compaction
      await services.storageService.compactStorage();

      // Get collection statistics
      const collectionStats = await services.collectionService.getCollectionStatistics();
      expect(collectionStats).toHaveProperty('totalMetrics');
      expect(collectionStats).toHaveProperty('activeCollectors');
      expect(collectionStats).toHaveProperty('dataPoints');
      expect(collectionStats).toHaveProperty('ingestionRate');
      expect(collectionStats.lastUpdated).toBeInstanceOf(Date);
    });
  });

  describe('metric utilities', () => {
    it('should generate proper metric names', () => {
      const metricName = MetricUtils.generateMetricName('app', 'http', 'requests_total');
      expect(metricName).toBe('app.http.requests_total');

      const simpleMetricName = MetricUtils.generateMetricName('', '', 'cpu_usage');
      expect(simpleMetricName).toBe('cpu_usage');
    });

    it('should validate metric names', () => {
      expect(MetricUtils.isValidMetricName('valid_metric_name')).toBe(true);
      expect(MetricUtils.isValidMetricName('app.http.requests_total')).toBe(true);
      expect(MetricUtils.isValidMetricName('123invalid')).toBe(false);
      expect(MetricUtils.isValidMetricName('invalid-metric')).toBe(false);
    });

    it('should parse time ranges correctly', () => {
      expect(MetricUtils.parseTimeRange('5m')).toBe(5 * 60 * 1000);
      expect(MetricUtils.parseTimeRange('1h')).toBe(60 * 60 * 1000);
      expect(MetricUtils.parseTimeRange('24h')).toBe(24 * 60 * 60 * 1000);
      expect(MetricUtils.parseTimeRange('7d')).toBe(7 * 24 * 60 * 60 * 1000);
      expect(MetricUtils.parseTimeRange('invalid')).toBe(60 * 60 * 1000); // Default to 1h
    });

    it('should format metric values correctly', () => {
      expect(MetricUtils.formatMetricValue(1024, 'bytes')).toBe('1.0 KB');
      expect(MetricUtils.formatMetricValue(1.5, 'seconds')).toBe('1.50s');
      expect(MetricUtils.formatMetricValue(250, 'milliseconds')).toBe('250ms');
      expect(MetricUtils.formatMetricValue(85.7, 'percent')).toBe('85.7%');
      expect(MetricUtils.formatMetricValue(12.34, 'requests_per_second')).toBe('12.34 req/s');
    });

    it('should format bytes correctly', () => {
      expect(MetricUtils.formatBytes(0)).toBe('0 B');
      expect(MetricUtils.formatBytes(1024)).toBe('1.0 KB');
      expect(MetricUtils.formatBytes(1048576)).toBe('1.0 MB');
      expect(MetricUtils.formatBytes(1073741824)).toBe('1.0 GB');
    });

    it('should calculate rates and percentage changes', () => {
      expect(MetricUtils.calculateRate(100, 50, 10000)).toBe(5); // 5 per second
      expect(MetricUtils.calculateRate(100, 100, 10000)).toBe(0);
      expect(MetricUtils.calculateRate(50, 100, 0)).toBe(0); // No time diff

      expect(MetricUtils.calculatePercentageChange(120, 100)).toBe(20);
      expect(MetricUtils.calculatePercentageChange(80, 100)).toBe(-20);
      expect(MetricUtils.calculatePercentageChange(100, 0)).toBe(100);
      expect(MetricUtils.calculatePercentageChange(0, 0)).toBe(0);
    });
  });

  describe('query caching and performance', () => {
    it('should cache query results', async () => {
      // Add test data
      const testMetric: Metric = {
        id: 'cache-test',
        name: 'cache.test.metric',
        type: 'gauge',
        unit: 'count',
        description: 'Cache test metric',
        labels: { cache: 'test' },
        value: 42,
        timestamp: new Date(),
        source: 'cache-test',
      };

      await services.storageService.storeMetric(testMetric);

      const query: MetricQuery = {
        metric: 'cache.test.metric',
        timeRange: '1h',
      };

      // First query - should not be cached
      const result1 = await services.storageService.queryMetrics(query);
      expect(result1.cached).toBe(false);

      // Second query - should be cached
      const result2 = await services.storageService.queryMetrics(query);
      expect(result2.cached).toBe(true);
      expect(result2.executionTime).toBeLessThanOrEqual(result1.executionTime);
    });

    it('should handle complex queries with filters', async () => {
      // Add test data with various labels
      const testMetrics: Metric[] = [];
      const environments = ['prod', 'staging', 'dev'];
      const services_list = ['web', 'api', 'db'];

      for (let i = 0; i < 30; i++) {
        testMetrics.push({
          id: `complex-${i}`,
          name: 'complex.test.metric',
          type: 'counter',
          unit: 'count',
          description: 'Complex test metric',
          labels: {
            environment: environments[i % 3],
            service: services_list[i % 3],
            instance: `instance-${i}`,
          },
          value: Math.random() * 1000,
          timestamp: new Date(Date.now() - (i * 60000)),
          source: 'complex-test',
        });
      }

      for (const metric of testMetrics) {
        await services.storageService.storeMetric(metric);
      }

      // Query with multiple filters
      const complexQuery: MetricQuery = {
        metric: 'complex.test.metric',
        labels: { environment: 'prod' },
        timeRange: '1h',
        aggregation: 'sum',
        resolution: '5m',
        filters: [
          {
            field: 'service',
            operator: 'in',
            value: ['web', 'api'],
          },
        ],
      };

      const result = await services.storageService.queryMetrics(complexQuery);
      expect(result.data[0].dataPoints.length).toBeGreaterThan(0);
      expect(result.data[0].aggregation).toBe('sum');
    });
  });

  describe('alerting and notification integration', () => {
    it('should create alert rules and handle notifications', async () => {
      // Create alert rule
      const alertRule = await services.alertingService.createAlertRule({
        name: 'Integration Test Alert',
        description: 'Test alert for integration testing',
        organizationId: 'test-org',
        projectId: 'test-project',
        query: {
          metric: 'test.integration.metric',
          timeRange: '5m',
          aggregation: 'avg',
        },
        condition: {
          aggregation: 'avg',
          operator: 'gt',
          threshold: 50,
          timeWindow: '5m',
          evaluationWindow: '1m',
        },
        frequency: '1m',
        severity: 'critical',
        notifications: [],
        labels: { test: 'integration' },
        annotations: { description: 'Integration test alert' },
        createdBy: 'integration-test',
        enabled: true,
      });

      expect(alertRule.id).toBeDefined();
      expect(alertRule.name).toBe('Integration Test Alert');

      // Add test metric that will trigger the alert
      const triggerMetric = {
        id: 'trigger-metric',
        name: 'test.integration.metric',
        type: 'gauge' as const,
        unit: 'count',
        description: 'Integration test metric',
        labels: { test: 'true' },
        value: 75, // Above threshold of 50
        timestamp: new Date(),
        source: 'integration-test',
      };

      await services.storageService.storeMetric(triggerMetric);

      // Test alert rule evaluation
      const testResult = await services.alertingService.testAlertRule(alertRule);
      expect(testResult.triggered).toBe(true);
      expect(testResult.value).toBe(75);

      // Get alert statistics
      const stats = await services.alertingService.getAlertStatistics();
      expect(stats.totalRules).toBeGreaterThan(0);
    });

    it('should handle notification service functionality', async () => {
      // Test notification service capabilities
      const supportedTypes = services.notificationService.getSupportedTypes();
      expect(supportedTypes).toContain('email');
      expect(supportedTypes).toContain('slack');
      expect(supportedTypes).toContain('webhook');

      // Test notification channel creation (mock)
      const testChannel = {
        id: 'test-channel',
        name: 'Test Channel',
        type: 'email' as const,
        configuration: {
          recipients: ['test@example.com'],
        },
        enabled: true,
      };

      // Test channel functionality
      const channelTest = await services.notificationService.testChannel(testChannel);
      expect(channelTest).toBe(true);

      // Test notification sending
      const testData = {
        alertId: 'test-alert',
        ruleName: 'Test Rule',
        severity: 'warning' as const,
        value: 85,
        threshold: 80,
        labels: { test: 'notification' },
        annotations: { description: 'Test notification' },
        startsAt: new Date(),
        generatorURL: 'http://localhost:3000/alerts/test',
      };

      await services.notificationService.sendNotification(testChannel, testData);
      
      // Test passes if no errors are thrown
      expect(true).toBe(true);
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle invalid metric data gracefully', async () => {
      const invalidMetric = {
        id: 'invalid',
        name: '', // Invalid - empty name
        type: 'gauge',
        unit: 'count',
        description: 'Invalid metric',
        labels: {},
        value: NaN, // Invalid - NaN value
        timestamp: new Date(),
        source: 'error-test',
      } as Metric;

      await expect(services.storageService.storeMetric(invalidMetric)).rejects.toThrow();
    });

    it('should handle queries for non-existent metrics', async () => {
      const query: MetricQuery = {
        metric: 'non.existent.metric',
        timeRange: '1h',
      };

      const result = await services.storageService.queryMetrics(query);
      expect(result.data[0].dataPoints).toHaveLength(0);
      expect(result.warnings).toContain('No data found for the specified query');
    });

    it('should handle collector registration errors', async () => {
      const invalidCollector = {
        name: '', // Invalid - empty name
        type: 'prometheus' as const,
        source: {
          type: 'pull' as const,
        },
        configuration: {
          scrapeInterval: 30,
          scrapeTimeout: 10,
          metricsPath: '/metrics',
          scheme: 'http' as const,
        },
        interval: 5, // Invalid - too short
        enabled: true,
        metrics: [],
      };

      await expect(services.collectionService.registerCollector(invalidCollector)).rejects.toThrow();
    });

    it('should handle storage operations when storage is unavailable', async () => {
      // This test would be more meaningful with a real storage backend
      // For now, we test that the health check can detect issues
      const isHealthy = await services.storageService.healthCheck();
      expect(typeof isHealthy).toBe('boolean');
    });
  });
});