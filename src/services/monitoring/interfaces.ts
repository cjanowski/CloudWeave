import {
  Metric,
  MetricQuery,
  MetricSeries,
  QueryResult,
  MetricCollector,
  Dashboard,
  AlertRule,
  AlertInstance,
  ServiceLevelObjective,
  MetricStatistics,
  BulkMetricInsert,
  MetricDefinition,
  CollectorStatus
} from './types';

/**
 * Interface for metrics collection service
 */
export interface IMetricsCollectionService {
  /**
   * Register a new metric collector
   */
  registerCollector(collector: Omit<MetricCollector, 'id' | 'lastCollection' | 'status'>): Promise<MetricCollector>;

  /**
   * Get all registered collectors
   */
  getCollectors(): Promise<MetricCollector[]>;

  /**
   * Get collector by ID
   */
  getCollector(collectorId: string): Promise<MetricCollector | null>;

  /**
   * Update collector configuration
   */
  updateCollector(collectorId: string, updates: Partial<MetricCollector>): Promise<MetricCollector>;

  /**
   * Enable or disable collector
   */
  setCollectorEnabled(collectorId: string, enabled: boolean): Promise<void>;

  /**
   * Remove collector
   */
  removeCollector(collectorId: string): Promise<void>;

  /**
   * Start metric collection for all enabled collectors
   */
  startCollection(): Promise<void>;

  /**
   * Stop metric collection
   */
  stopCollection(): Promise<void>;

  /**
   * Collect metrics from a specific collector
   */
  collectFromSource(collectorId: string): Promise<Metric[]>;

  /**
   * Get collector status
   */
  getCollectorStatus(collectorId: string): Promise<CollectorStatus>;

  /**
   * Get collection statistics
   */
  getCollectionStatistics(): Promise<MetricStatistics>;
}

/**
 * Interface for metrics storage service
 */
export interface IMetricsStorageService {
  /**
   * Store a single metric
   */
  storeMetric(metric: Metric): Promise<void>;

  /**
   * Store multiple metrics in bulk
   */
  storeMetrics(insert: BulkMetricInsert): Promise<void>;

  /**
   * Query metrics
   */
  queryMetrics(query: MetricQuery): Promise<QueryResult>;

  /**
   * Get metric series data
   */
  getMetricSeries(metricName: string, query: MetricQuery): Promise<MetricSeries>;

  /**
   * Get available metrics
   */
  getAvailableMetrics(): Promise<MetricDefinition[]>;

  /**
   * Get metric metadata
   */
  getMetricMetadata(metricName: string): Promise<MetricDefinition | null>;

  /**
   * Delete metrics
   */
  deleteMetrics(metricName: string, filters?: Record<string, string>): Promise<void>;

  /**
   * Get storage statistics
   */
  getStorageStatistics(): Promise<{
    totalMetrics: number;
    totalDataPoints: number;
    storageSize: number;
    oldestDataPoint: Date;
    newestDataPoint: Date;
  }>;

  /**
   * Compact storage (remove old data based on retention policies)
   */
  compactStorage(): Promise<void>;

  /**
   * Health check for storage backend
   */
  healthCheck(): Promise<boolean>;
}

/**
 * Interface for dashboard service
 */
export interface IDashboardService {
  /**
   * Create a new dashboard
   */
  createDashboard(dashboard: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>): Promise<Dashboard>;

  /**
   * Get dashboard by ID
   */
  getDashboard(dashboardId: string): Promise<Dashboard | null>;

  /**
   * Get dashboards with filtering
   */
  getDashboards(organizationId: string, projectId?: string, tags?: string[]): Promise<Dashboard[]>;

  /**
   * Update dashboard
   */
  updateDashboard(dashboardId: string, updates: Partial<Dashboard>): Promise<Dashboard>;

  /**
   * Delete dashboard
   */
  deleteDashboard(dashboardId: string): Promise<void>;

  /**
   * Clone dashboard
   */
  cloneDashboard(dashboardId: string, name: string, organizationId: string): Promise<Dashboard>;

  /**
   * Get dashboard data (execute all panel queries)
   */
  getDashboardData(dashboardId: string, timeRange?: string): Promise<Record<string, QueryResult>>;

  /**
   * Export dashboard configuration
   */
  exportDashboard(dashboardId: string): Promise<any>;

  /**
   * Import dashboard configuration
   */
  importDashboard(config: any, organizationId: string): Promise<Dashboard>;
}

/**
 * Interface for alerting service
 */
export interface IAlertingService {
  /**
   * Create alert rule
   */
  createAlertRule(rule: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt' | 'state' | 'lastEvaluation' | 'lastStateChange'>): Promise<AlertRule>;

  /**
   * Get alert rule by ID
   */
  getAlertRule(ruleId: string): Promise<AlertRule | null>;

  /**
   * Get alert rules with filtering
   */
  getAlertRules(organizationId: string, projectId?: string): Promise<AlertRule[]>;

  /**
   * Update alert rule
   */
  updateAlertRule(ruleId: string, updates: Partial<AlertRule>): Promise<AlertRule>;

  /**
   * Delete alert rule
   */
  deleteAlertRule(ruleId: string): Promise<void>;

  /**
   * Enable or disable alert rule
   */
  setAlertRuleEnabled(ruleId: string, enabled: boolean): Promise<void>;

  /**
   * Evaluate alert rules
   */
  evaluateAlertRules(): Promise<void>;

  /**
   * Get active alert instances
   */
  getActiveAlerts(organizationId?: string): Promise<AlertInstance[]>;

  /**
   * Get alert history
   */
  getAlertHistory(ruleId?: string, limit?: number): Promise<AlertInstance[]>;

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(instanceId: string, acknowledgedBy: string): Promise<void>;

  /**
   * Silence alert
   */
  silenceAlert(instanceId: string, duration: string, silencedBy: string): Promise<void>;

  /**
   * Test alert rule
   */
  testAlertRule(rule: AlertRule): Promise<{ triggered: boolean; value: number; message?: string }>;
}

/**
 * Interface for SLO service
 */
export interface ISLOService {
  /**
   * Create SLO
   */
  createSLO(slo: Omit<ServiceLevelObjective, 'id' | 'createdAt' | 'updatedAt' | 'errorBudget'>): Promise<ServiceLevelObjective>;

  /**
   * Get SLO by ID
   */
  getSLO(sloId: string): Promise<ServiceLevelObjective | null>;

  /**
   * Get SLOs for organization/service
   */
  getSLOs(organizationId: string, serviceId?: string): Promise<ServiceLevelObjective[]>;

  /**
   * Update SLO
   */
  updateSLO(sloId: string, updates: Partial<ServiceLevelObjective>): Promise<ServiceLevelObjective>;

  /**
   * Delete SLO
   */
  deleteSLO(sloId: string): Promise<void>;

  /**
   * Calculate SLO compliance
   */
  calculateSLOCompliance(sloId: string, timeRange?: string): Promise<{
    compliance: number;
    errorBudget: any;
    incidents: number;
    availability: number;
  }>;

  /**
   * Get error budget status
   */
  getErrorBudgetStatus(sloId: string): Promise<any>;

  /**
   * Get SLO burn rate
   */
  getSLOBurnRate(sloId: string, timeWindow: string): Promise<number>;
}

/**
 * Interface for monitoring orchestration
 */
export interface IMonitoringOrchestrator {
  /**
   * Initialize monitoring system
   */
  initialize(): Promise<void>;

  /**
   * Start all monitoring services
   */
  start(): Promise<void>;

  /**
   * Stop all monitoring services
   */
  stop(): Promise<void>;

  /**
   * Get overall system health
   */
  getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, any>;
    metrics: MetricStatistics;
    alerts: number;
    lastCheck: Date;
  }>;

  /**
   * Reload configuration
   */
  reloadConfiguration(): Promise<void>;

  /**
   * Get monitoring configuration
   */
  getConfiguration(): Promise<any>;

  /**
   * Update monitoring configuration
   */
  updateConfiguration(config: any): Promise<void>;
}

/**
 * Interface for metric aggregation service
 */
export interface IMetricAggregationService {
  /**
   * Create aggregation rule
   */
  createAggregationRule(rule: any): Promise<any>;

  /**
   * Get aggregation rules
   */
  getAggregationRules(): Promise<any[]>;

  /**
   * Update aggregation rule
   */
  updateAggregationRule(ruleId: string, updates: any): Promise<any>;

  /**
   * Delete aggregation rule
   */
  deleteAggregationRule(ruleId: string): Promise<void>;

  /**
   * Execute aggregations
   */
  executeAggregations(): Promise<void>;

  /**
   * Get aggregated metrics
   */
  getAggregatedMetrics(query: MetricQuery): Promise<QueryResult>;
}

/**
 * Interface for time series database abstraction
 */
export interface ITimeSeriesDatabase {
  /**
   * Connect to database
   */
  connect(): Promise<void>;

  /**
   * Disconnect from database
   */
  disconnect(): Promise<void>;

  /**
   * Insert time series data
   */
  insert(data: any[]): Promise<void>;

  /**
   * Query time series data
   */
  query(query: string, params?: any): Promise<any>;

  /**
   * Create index
   */
  createIndex(indexName: string, fields: string[]): Promise<void>;

  /**
   * Drop index
   */
  dropIndex(indexName: string): Promise<void>;

  /**
   * Get database statistics
   */
  getStatistics(): Promise<any>;

  /**
   * Health check
   */
  ping(): Promise<boolean>;
}