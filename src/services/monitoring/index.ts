/**
 * Monitoring and Observability Module
 * 
 * This module provides comprehensive monitoring capabilities including
 * metrics collection, storage, querying, and alerting functionality.
 */

// Types and interfaces
export * from './types';
export * from './interfaces';

// Core services
export { MetricsCollectionService } from './MetricsCollectionService';
export { MetricsStorageService } from './MetricsStorageService';
export { AlertingService } from './AlertingService';
export { AlertNotificationService } from './AlertNotificationService';

// Convenience functions for creating and configuring services
import { MetricsCollectionService } from './MetricsCollectionService';
import { MetricsStorageService } from './MetricsStorageService';
import { AlertingService } from './AlertingService';
import { AlertNotificationService } from './AlertNotificationService';
import { MetricCollector, MonitoringConfiguration } from './types';

/**
 * Create a fully configured monitoring service with all dependencies
 */
export async function createMonitoringService(): Promise<{
  collectionService: MetricsCollectionService;
  storageService: MetricsStorageService;
  alertingService: AlertingService;
  notificationService: AlertNotificationService;
}> {
  // Create storage service
  const storageService = new MetricsStorageService();

  // Create collection service
  const collectionService = new MetricsCollectionService(storageService);

  // Create notification service
  const notificationService = new AlertNotificationService();

  // Create alerting service
  const alertingService = new AlertingService(storageService, notificationService);

  return {
    collectionService,
    storageService,
    alertingService,
    notificationService,
  };
}

/**
 * Create default metric collectors for common monitoring scenarios
 */
export function createDefaultCollectors(): Omit<MetricCollector, 'id' | 'lastCollection' | 'status'>[] {
  return [
    {
      name: 'System Metrics',
      type: 'infrastructure',
      source: {
        type: 'pull',
        endpoint: 'http://localhost:9100/metrics',
        timeout: 5000,
      },
      configuration: {
        scrapeInterval: 30,
        scrapeTimeout: 10,
        metricsPath: '/metrics',
        scheme: 'http',
      },
      interval: 30,
      enabled: true,
      metrics: [
        'system.cpu.usage',
        'system.memory.usage',
        'system.disk.usage',
        'system.network.bytes_in',
        'system.network.bytes_out',
      ],
    },
    {
      name: 'Application Metrics',
      type: 'application',
      source: {
        type: 'pull',
        endpoint: 'http://localhost:8080/metrics',
        timeout: 5000,
      },
      configuration: {
        scrapeInterval: 15,
        scrapeTimeout: 5,
        metricsPath: '/metrics',
        scheme: 'http',
      },
      interval: 15,
      enabled: true,
      metrics: [
        'app.requests.total',
        'app.requests.duration',
        'app.errors.rate',
        'app.users.active',
      ],
    },
    {
      name: 'Kubernetes Metrics',
      type: 'kubernetes',
      source: {
        type: 'pull',
        endpoint: 'https://kubernetes.default.svc:443/metrics',
        timeout: 10000,
      },
      configuration: {
        scrapeInterval: 60,
        scrapeTimeout: 30,
        metricsPath: '/metrics',
        scheme: 'https',
      },
      interval: 60,
      enabled: false, // Disabled by default
      metrics: [
        'k8s.pod.cpu.usage',
        'k8s.pod.memory.usage',
        'k8s.node.ready',
        'k8s.deployment.replicas',
      ],
    },
  ];
}

/**
 * Default monitoring configuration
 */
export const defaultMonitoringConfig: Partial<MonitoringConfiguration> = {
  retention: {
    default: '30d',
    policies: [
      {
        metric: 'system.*',
        retention: '90d',
        resolution: '1m',
      },
      {
        metric: 'app.*',
        retention: '30d',
        resolution: '30s',
      },
      {
        metric: 'k8s.*',
        retention: '7d',
        resolution: '1m',
      },
    ],
  },
  alerting: {
    evaluationInterval: '30s',
    groupWait: '10s',
    groupInterval: '5m',
    repeatInterval: '12h',
    routes: [
      {
        match: { severity: 'critical' },
        receiver: 'critical-alerts',
        groupBy: ['alertname', 'instance'],
        routes: [],
      },
      {
        match: { severity: 'warning' },
        receiver: 'warning-alerts',
        groupBy: ['alertname'],
        routes: [],
      },
    ],
  },
  dashboards: {
    defaultTimeRange: '1h',
    defaultRefreshInterval: '30s',
    maxDataPoints: 1000,
    queryTimeout: '30s',
  },
};

/**
 * Utility functions for metric operations
 */
export const MetricUtils = {
  /**
   * Generate metric name with proper naming convention
   */
  generateMetricName(namespace: string, subsystem: string, name: string): string {
    return [namespace, subsystem, name].filter(Boolean).join('.');
  },

  /**
   * Validate metric name format
   */
  isValidMetricName(name: string): boolean {
    // Basic validation - alphanumeric, dots, underscores
    return /^[a-zA-Z][a-zA-Z0-9._]*$/.test(name);
  },

  /**
   * Parse time range string to milliseconds
   */
  parseTimeRange(timeRange: string): number {
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
  },

  /**
   * Format metric value for display
   */
  formatMetricValue(value: number, unit: string): string {
    switch (unit) {
      case 'bytes':
        return this.formatBytes(value);
      case 'seconds':
        return `${value.toFixed(2)}s`;
      case 'milliseconds':
        return `${value.toFixed(0)}ms`;
      case 'percent':
        return `${value.toFixed(1)}%`;
      case 'requests_per_second':
        return `${value.toFixed(2)} req/s`;
      default:
        return value.toFixed(2);
    }
  },

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = bytes / Math.pow(1024, i);
    
    return `${size.toFixed(1)} ${sizes[i]}`;
  },

  /**
   * Calculate rate of change between two data points
   */
  calculateRate(current: number, previous: number, timeDiff: number): number {
    if (timeDiff <= 0) return 0;
    return (current - previous) / (timeDiff / 1000); // per second
  },

  /**
   * Calculate percentage change
   */
  calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  },
};