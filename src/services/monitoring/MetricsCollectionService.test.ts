import { MetricsCollectionService } from './MetricsCollectionService';
import { IMetricsStorageService } from './interfaces';
import { MetricCollector, CollectorStatus } from './types';

describe('MetricsCollectionService', () => {
  let collectionService: MetricsCollectionService;
  let mockStorageService: jest.Mocked<IMetricsStorageService>;

  beforeEach(() => {
    mockStorageService = {
      storeMetric: jest.fn(),
      storeMetrics: jest.fn(),
      queryMetrics: jest.fn(),
      getMetricSeries: jest.fn(),
      getAvailableMetrics: jest.fn(),
      getMetricMetadata: jest.fn(),
      deleteMetrics: jest.fn(),
      getStorageStatistics: jest.fn(),
      compactStorage: jest.fn(),
      healthCheck: jest.fn(),
    };

    mockStorageService.getStorageStatistics.mockResolvedValue({
      totalMetrics: 10,
      totalDataPoints: 1000,
      storageSize: 100000,
      oldestDataPoint: new Date(),
      newestDataPoint: new Date(),
    });

    collectionService = new MetricsCollectionService(mockStorageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('collector registration', () => {
    it('should register a new collector successfully', async () => {
      const collectorData = {
        name: 'Test Prometheus Collector',
        type: 'prometheus' as const,
        source: {
          type: 'pull' as const,
          endpoint: 'http://localhost:9090/metrics',
          timeout: 5000,
        },
        configuration: {
          scrapeInterval: 30,
          scrapeTimeout: 10,
          metricsPath: '/metrics',
          scheme: 'http' as const,
        },
        interval: 30,
        enabled: true,
        metrics: ['http_requests_total', 'cpu_usage_percent'],
      };

      const collector = await collectionService.registerCollector(collectorData);

      expect(collector.id).toBeDefined();
      expect(collector.name).toBe('Test Prometheus Collector');
      expect(collector.type).toBe('prometheus');
      expect(collector.status).toBe('inactive');
      expect(collector.enabled).toBe(true);
    });

    it('should validate collector configuration', async () => {
      const invalidCollectorData = {
        name: '', // Invalid - empty name
        type: 'prometheus' as const,
        source: {
          type: 'pull' as const,
          // Missing endpoint for prometheus
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

      await expect(collectionService.registerCollector(invalidCollectorData)).rejects.toThrow('Collector validation failed');
    });

    it('should get all registered collectors', async () => {
      const collectorData = {
        name: 'Test Collector',
        type: 'application' as const,
        source: {
          type: 'push' as const,
        },
        configuration: {
          scrapeInterval: 60,
          scrapeTimeout: 10,
          metricsPath: '/metrics',
          scheme: 'http' as const,
        },
        interval: 60,
        enabled: true,
        metrics: ['app_requests'],
      };

      await collectionService.registerCollector(collectorData);

      const collectors = await collectionService.getCollectors();
      expect(collectors).toHaveLength(1);
      expect(collectors[0].name).toBe('Test Collector');
    });

    it('should get collector by ID', async () => {
      const collectorData = {
        name: 'Test Collector',
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
        metrics: ['custom_metric'],
      };

      const collector = await collectionService.registerCollector(collectorData);
      const retrieved = await collectionService.getCollector(collector.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(collector.id);
      expect(retrieved!.name).toBe('Test Collector');
    });

    it('should return null for non-existent collector', async () => {
      const collector = await collectionService.getCollector('non-existent-id');
      expect(collector).toBeNull();
    });
  });

  describe('collector management', () => {
    let testCollector: MetricCollector;

    beforeEach(async () => {
      const collectorData = {
        name: 'Test Collector',
        type: 'application' as const,
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
        metrics: ['test_metric'],
      };

      testCollector = await collectionService.registerCollector(collectorData);
    });

    it('should update collector configuration', async () => {
      const updates = {
        name: 'Updated Test Collector',
        interval: 60,
        enabled: false,
      };

      const updatedCollector = await collectionService.updateCollector(testCollector.id, updates);

      expect(updatedCollector.name).toBe('Updated Test Collector');
      expect(updatedCollector.interval).toBe(60);
      expect(updatedCollector.enabled).toBe(false);
    });

    it('should enable and disable collector', async () => {
      await collectionService.setCollectorEnabled(testCollector.id, false);
      let collector = await collectionService.getCollector(testCollector.id);
      expect(collector!.enabled).toBe(false);

      await collectionService.setCollectorEnabled(testCollector.id, true);
      collector = await collectionService.getCollector(testCollector.id);
      expect(collector!.enabled).toBe(true);
    });

    it('should remove collector', async () => {
      await collectionService.removeCollector(testCollector.id);
      const collector = await collectionService.getCollector(testCollector.id);
      expect(collector).toBeNull();
    });

    it('should get collector status', async () => {
      const status = await collectionService.getCollectorStatus(testCollector.id);
      expect(['active', 'inactive', 'error', 'unknown']).toContain(status);
    });
  });

  describe('metric collection', () => {
    let testCollector: MetricCollector;

    beforeEach(async () => {
      const collectorData = {
        name: 'Prometheus Collector',
        type: 'prometheus' as const,
        source: {
          type: 'pull' as const,
          endpoint: 'http://localhost:9090/metrics',
        },
        configuration: {
          scrapeInterval: 30,
          scrapeTimeout: 10,
          metricsPath: '/metrics',
          scheme: 'http' as const,
        },
        interval: 30,
        enabled: true,
        metrics: ['http_requests_total', 'cpu_usage_percent'],
      };

      testCollector = await collectionService.registerCollector(collectorData);
    });

    it('should collect metrics from prometheus source', async () => {
      const metrics = await collectionService.collectFromSource(testCollector.id);

      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics[0]).toHaveProperty('id');
      expect(metrics[0]).toHaveProperty('name');
      expect(metrics[0]).toHaveProperty('value');
      expect(metrics[0]).toHaveProperty('timestamp');
      expect(metrics[0].source).toBe(testCollector.name);

      // Verify storage was called
      expect(mockStorageService.storeMetrics).toHaveBeenCalledWith({
        metrics,
        source: testCollector.name,
        timestamp: expect.any(Date),
      });
    });

    it('should collect metrics from different collector types', async () => {
      const collectorTypes = ['statsd', 'application', 'infrastructure', 'kubernetes', 'docker', 'custom'];

      for (const type of collectorTypes) {
        const collectorData = {
          name: `${type} Collector`,
          type: type as any,
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
          metrics: ['test_metric'],
        };

        const collector = await collectionService.registerCollector(collectorData);
        const metrics = await collectionService.collectFromSource(collector.id);

        expect(metrics.length).toBeGreaterThan(0);
        expect(metrics[0].source).toBe(collector.name);
      }
    });

    it('should handle collection errors gracefully', async () => {
      // Create a collector that will fail
      const failingCollectorData = {
        name: 'Failing Collector',
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
        metrics: [], // Empty metrics will cause validation to fail in some cases
      };

      const failingCollector = await collectionService.registerCollector(failingCollectorData);

      // Collection should handle errors gracefully
      await expect(collectionService.collectFromSource(failingCollector.id)).rejects.toThrow();

      // Collector status should be updated to error
      const status = await collectionService.getCollectorStatus(failingCollector.id);
      expect(status).toBe('error');
    });
  });

  describe('collection orchestration', () => {
    it('should start and stop collection for all collectors', async () => {
      // Register multiple collectors
      const collectors = [];
      for (let i = 0; i < 3; i++) {
        const collectorData = {
          name: `Collector ${i}`,
          type: 'application' as const,
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
          metrics: [`metric_${i}`],
        };

        const collector = await collectionService.registerCollector(collectorData);
        collectors.push(collector);
      }

      // Start collection
      await collectionService.startCollection();

      // Wait a bit for collection to happen
      await new Promise(resolve => setTimeout(resolve, 100));

      // Stop collection
      await collectionService.stopCollection();

      // Verify metrics were collected and stored
      expect(mockStorageService.storeMetrics).toHaveBeenCalled();
    });

    it('should get collection statistics', async () => {
      const stats = await collectionService.getCollectionStatistics();

      expect(stats).toHaveProperty('totalMetrics');
      expect(stats).toHaveProperty('activeCollectors');
      expect(stats).toHaveProperty('dataPoints');
      expect(stats).toHaveProperty('storageSize');
      expect(stats).toHaveProperty('ingestionRate');
      expect(stats).toHaveProperty('lastUpdated');
      expect(stats.lastUpdated).toBeInstanceOf(Date);
    });
  });

  describe('collector validation', () => {
    it('should validate prometheus collector configuration', async () => {
      const validPrometheusCollector = {
        name: 'Valid Prometheus',
        type: 'prometheus' as const,
        source: {
          type: 'pull' as const,
          endpoint: 'http://localhost:9090/metrics',
        },
        configuration: {
          scrapeInterval: 30,
          scrapeTimeout: 10,
          metricsPath: '/metrics',
          scheme: 'http' as const,
        },
        interval: 30,
        enabled: true,
        metrics: ['test_metric'],
      };

      await expect(collectionService.registerCollector(validPrometheusCollector)).resolves.not.toThrow();

      const invalidPrometheusCollector = {
        name: 'Invalid Prometheus',
        type: 'prometheus' as const,
        source: {
          type: 'pull' as const,
          // Missing endpoint
        },
        configuration: {
          scrapeInterval: 30,
          scrapeTimeout: 10,
          metricsPath: '/metrics',
          scheme: 'http' as const,
        },
        interval: 30,
        enabled: true,
        metrics: ['test_metric'],
      };

      await expect(collectionService.registerCollector(invalidPrometheusCollector)).rejects.toThrow();
    });

    it('should validate custom collector configuration', async () => {
      const validCustomCollector = {
        name: 'Valid Custom',
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
        metrics: ['custom_metric_1', 'custom_metric_2'],
      };

      await expect(collectionService.registerCollector(validCustomCollector)).resolves.not.toThrow();

      const invalidCustomCollector = {
        name: 'Invalid Custom',
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
        metrics: [], // Empty metrics array
      };

      await expect(collectionService.registerCollector(invalidCustomCollector)).rejects.toThrow();
    });

    it('should validate collector interval', async () => {
      const invalidIntervalCollector = {
        name: 'Invalid Interval',
        type: 'application' as const,
        source: {
          type: 'pull' as const,
        },
        configuration: {
          scrapeInterval: 30,
          scrapeTimeout: 10,
          metricsPath: '/metrics',
          scheme: 'http' as const,
        },
        interval: 5, // Too short
        enabled: true,
        metrics: ['test_metric'],
      };

      await expect(collectionService.registerCollector(invalidIntervalCollector)).rejects.toThrow('Collector interval must be at least 10 seconds');
    });
  });
});