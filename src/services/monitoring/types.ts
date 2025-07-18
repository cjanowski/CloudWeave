/**
 * Monitoring and observability types
 */

export type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary';

export type MetricUnit = 
  | 'bytes' | 'seconds' | 'milliseconds' | 'percent' | 'count' 
  | 'requests_per_second' | 'errors_per_second' | 'cpu_percent' 
  | 'memory_bytes' | 'disk_bytes' | 'network_bytes';

export type AggregationType = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'rate' | 'percentile';

export type TimeRange = '5m' | '15m' | '1h' | '6h' | '12h' | '24h' | '7d' | '30d';

export interface Metric {
  id: string;
  name: string;
  type: MetricType;
  unit: MetricUnit;
  description: string;
  labels: Record<string, string>;
  value: number;
  timestamp: Date;
  source: string;
  metadata?: Record<string, any>;
}

export interface MetricSeries {
  metric: MetricDefinition;
  dataPoints: DataPoint[];
  aggregation?: AggregationType;
  timeRange: TimeRange;
  resolution: string; // e.g., '1m', '5m', '1h'
}

export interface DataPoint {
  timestamp: Date;
  value: number;
  labels?: Record<string, string>;
}

export interface MetricDefinition {
  name: string;
  type: MetricType;
  unit: MetricUnit;
  description: string;
  defaultLabels: Record<string, string>;
  retention: string; // e.g., '30d', '1y'
}

export interface MetricQuery {
  metric: string;
  labels?: Record<string, string>;
  aggregation?: AggregationType;
  timeRange: TimeRange;
  resolution?: string;
  filters?: MetricFilter[];
  groupBy?: string[];
}

export interface MetricFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'regex';
  value: any;
}

export interface MetricCollector {
  id: string;
  name: string;
  type: CollectorType;
  source: MetricSource;
  configuration: CollectorConfiguration;
  interval: number; // Collection interval in seconds
  enabled: boolean;
  lastCollection?: Date;
  status: CollectorStatus;
  metrics: string[]; // Metric names this collector provides
}

export type CollectorType = 
  | 'prometheus' | 'statsd' | 'custom' | 'application' 
  | 'infrastructure' | 'kubernetes' | 'docker';

export type CollectorStatus = 'active' | 'inactive' | 'error' | 'unknown';

export interface MetricSource {
  type: 'pull' | 'push';
  endpoint?: string;
  credentials?: Record<string, any>;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface CollectorConfiguration {
  scrapeInterval: number;
  scrapeTimeout: number;
  metricsPath: string;
  scheme: 'http' | 'https';
  params?: Record<string, string>;
  relabelConfigs?: RelabelConfig[];
}

export interface RelabelConfig {
  sourceLabels: string[];
  separator?: string;
  targetLabel: string;
  regex?: string;
  replacement?: string;
  action: 'replace' | 'keep' | 'drop' | 'labelmap';
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  projectId?: string;
  tags: string[];
  panels: DashboardPanel[];
  variables: DashboardVariable[];
  timeRange: TimeRange;
  refreshInterval: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
}

export interface DashboardPanel {
  id: string;
  title: string;
  type: PanelType;
  position: PanelPosition;
  queries: MetricQuery[];
  visualization: VisualizationConfig;
  thresholds?: Threshold[];
  alerts?: PanelAlert[];
}

export type PanelType = 
  | 'graph' | 'singlestat' | 'table' | 'heatmap' 
  | 'gauge' | 'bar' | 'pie' | 'text' | 'logs';

export interface PanelPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface VisualizationConfig {
  displayMode: 'lines' | 'bars' | 'points' | 'area';
  yAxis: AxisConfig;
  xAxis: AxisConfig;
  legend: LegendConfig;
  colors: string[];
  fillOpacity?: number;
  lineWidth?: number;
  pointSize?: number;
}

export interface AxisConfig {
  label?: string;
  unit?: MetricUnit;
  min?: number;
  max?: number;
  logScale?: boolean;
}

export interface LegendConfig {
  show: boolean;
  position: 'bottom' | 'right' | 'top';
  values: boolean;
  alignAsTable: boolean;
}

export interface Threshold {
  value: number;
  color: string;
  condition: 'gt' | 'lt';
  fill?: boolean;
  line?: boolean;
}

export interface PanelAlert {
  id: string;
  name: string;
  condition: AlertCondition;
  frequency: string;
  notifications: string[];
}

export interface DashboardVariable {
  name: string;
  type: 'query' | 'constant' | 'interval' | 'datasource';
  query?: string;
  options?: string[];
  defaultValue?: string;
  multiValue?: boolean;
}

export interface AlertRule {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  projectId?: string;
  query: MetricQuery;
  condition: AlertCondition;
  frequency: string; // e.g., '1m', '5m'
  severity: AlertSeverity;
  state: AlertState;
  notifications: NotificationChannel[];
  labels: Record<string, string>;
  annotations: Record<string, string>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  enabled: boolean;
  lastEvaluation?: Date;
  lastStateChange?: Date;
}

export interface AlertCondition {
  aggregation: AggregationType;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'ne';
  threshold: number;
  timeWindow: string; // e.g., '5m', '1h'
  evaluationWindow: string; // e.g., '1m'
}

export type AlertSeverity = 'critical' | 'warning' | 'info';

export type AlertState = 'ok' | 'pending' | 'alerting' | 'no_data' | 'error';

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'email' | 'slack' | 'webhook' | 'pagerduty' | 'opsgenie';
  configuration: Record<string, any>;
  enabled: boolean;
}

export interface AlertInstance {
  id: string;
  ruleId: string;
  state: AlertState;
  value: number;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  startsAt: Date;
  endsAt?: Date;
  generatorURL?: string;
  fingerprint: string;
}

export interface MetricStorage {
  type: 'prometheus' | 'influxdb' | 'elasticsearch' | 'timescaledb';
  configuration: StorageConfiguration;
  retention: RetentionPolicy;
  compression: CompressionConfig;
}

export interface StorageConfiguration {
  host: string;
  port: number;
  database?: string;
  username?: string;
  password?: string;
  ssl?: boolean;
  timeout?: number;
  maxConnections?: number;
}

export interface RetentionPolicy {
  default: string; // e.g., '30d'
  policies: RetentionRule[];
}

export interface RetentionRule {
  metric: string;
  retention: string;
  resolution?: string;
}

export interface CompressionConfig {
  enabled: boolean;
  algorithm?: 'gzip' | 'snappy' | 'lz4';
  level?: number;
}

export interface MetricAggregation {
  metric: string;
  aggregation: AggregationType;
  timeWindow: string;
  groupBy?: string[];
  filters?: MetricFilter[];
}

export interface ServiceLevelObjective {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  serviceId: string;
  type: SLOType;
  target: number; // e.g., 99.9 for 99.9%
  timeWindow: string; // e.g., '30d'
  indicators: ServiceLevelIndicator[];
  errorBudget: ErrorBudget;
  alerts: SLOAlert[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  enabled: boolean;
}

export type SLOType = 'availability' | 'latency' | 'error_rate' | 'throughput';

export interface ServiceLevelIndicator {
  id: string;
  name: string;
  type: SLIType;
  goodQuery: MetricQuery;
  totalQuery: MetricQuery;
  threshold?: number;
  unit: MetricUnit;
}

export type SLIType = 'request_based' | 'window_based' | 'distribution_based';

export interface ErrorBudget {
  total: number;
  consumed: number;
  remaining: number;
  burnRate: number;
  lastCalculated: Date;
}

export interface SLOAlert {
  id: string;
  name: string;
  type: 'burn_rate' | 'error_budget';
  threshold: number;
  timeWindow: string;
  notifications: string[];
}

export interface MonitoringConfiguration {
  collectors: MetricCollector[];
  storage: MetricStorage;
  retention: RetentionPolicy;
  alerting: AlertingConfiguration;
  dashboards: DashboardConfiguration;
}

export interface AlertingConfiguration {
  evaluationInterval: string;
  groupWait: string;
  groupInterval: string;
  repeatInterval: string;
  routes: AlertRoute[];
}

export interface AlertRoute {
  match: Record<string, string>;
  matchRE?: Record<string, string>;
  receiver: string;
  groupBy: string[];
  continue?: boolean;
  routes?: AlertRoute[];
}

export interface DashboardConfiguration {
  defaultTimeRange: TimeRange;
  defaultRefreshInterval: string;
  maxDataPoints: number;
  queryTimeout: string;
}

export interface MetricStatistics {
  totalMetrics: number;
  activeCollectors: number;
  dataPoints: number;
  storageSize: number;
  queryRate: number;
  ingestionRate: number;
  errorRate: number;
  lastUpdated: Date;
}

export interface QueryResult {
  metric: string;
  data: MetricSeries[];
  executionTime: number;
  cached: boolean;
  warnings?: string[];
}

export interface BulkMetricInsert {
  metrics: Metric[];
  timestamp?: Date;
  source: string;
  batchId?: string;
}