// Base API response structure
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: 'success' | 'error';
  timestamp: string;
  meta?: {
    pagination?: PaginationMeta;
    filters?: Record<string, any>;
    sort?: SortMeta;
  };
}

// Pagination metadata
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Sort metadata
export interface SortMeta {
  field: string;
  order: 'asc' | 'desc';
}

// Error response structure
export interface ApiErrorResponse {
  message: string;
  code?: string;
  status: 'error';
  timestamp: string;
  details?: {
    field?: string;
    value?: any;
    errors?: Record<string, string[]>;
  };
}

// Request/Response types for different endpoints

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  companyName?: string;
}

export interface RegisterResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
}

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  companyName?: string;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
  };
  dashboard: {
    layout: 'grid' | 'list';
    refreshInterval: number;
  };
}

export interface UpdateUserRequest {
  name?: string;
  avatar?: string;
  companyName?: string;
  preferences?: Partial<UserPreferences>;
}

export interface UpdateUserResponse {
  user: User;
}

// Dashboard types
export interface DashboardData {
  overview: DashboardOverview;
  recentActivity: Activity[];
  alerts: Alert[];
  metrics: DashboardMetrics;
}

export interface DashboardOverview {
  totalProjects: number;
  activeDeployments: number;
  totalCost: number;
  costTrend: number;
  uptime: number;
  lastUpdated: string;
}

export interface Activity {
  id: string;
  type: 'deployment' | 'infrastructure' | 'security' | 'cost';
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'info';
  metadata?: Record<string, any>;
}

export interface Alert {
  id: string;
  type: 'security' | 'cost' | 'performance' | 'infrastructure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  actions?: AlertAction[];
}

export interface AlertAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'danger';
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
}

export interface DashboardMetrics {
  cpu: MetricData;
  memory: MetricData;
  network: MetricData;
  storage: MetricData;
}

export interface MetricData {
  current: number;
  trend: number[];
  unit: string;
  threshold?: {
    warning: number;
    critical: number;
  };
}

// Infrastructure types
export interface Infrastructure {
  id: string;
  name: string;
  type: 'server' | 'database' | 'storage' | 'network' | 'container';
  provider: 'aws' | 'gcp' | 'azure' | 'local';
  status: 'running' | 'stopped' | 'error' | 'pending';
  region: string;
  specifications: InfrastructureSpecs;
  cost: CostInfo;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface InfrastructureSpecs {
  cpu?: string;
  memory?: string;
  storage?: string;
  network?: string;
  os?: string;
  version?: string;
}

export interface CostInfo {
  hourly: number;
  monthly: number;
  currency: string;
}

export interface CreateInfrastructureRequest {
  name: string;
  type: Infrastructure['type'];
  provider: Infrastructure['provider'];
  region: string;
  specifications: InfrastructureSpecs;
  tags?: string[];
}

export interface UpdateInfrastructureRequest {
  name?: string;
  specifications?: Partial<InfrastructureSpecs>;
  tags?: string[];
}

// Deployment types
export interface Deployment {
  id: string;
  name: string;
  application: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  infrastructure: Infrastructure[];
  logs: DeploymentLog[];
  startedAt: string;
  completedAt?: string;
  duration?: number;
}

export interface DeploymentLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  source: string;
}

export interface CreateDeploymentRequest {
  name: string;
  application: string;
  version: string;
  environment: Deployment['environment'];
  infrastructureIds: string[];
  configuration?: Record<string, any>;
}

export interface DeploymentAction {
  action: 'start' | 'stop' | 'restart' | 'rollback';
  deploymentId: string;
  version?: string;
}

// Monitoring types
export interface MonitoringData {
  metrics: MonitoringMetric[];
  alerts: Alert[];
  uptime: UptimeData;
  performance: PerformanceData;
}

export interface MonitoringMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  tags: Record<string, string>;
  history: MetricPoint[];
}

export interface MetricPoint {
  timestamp: string;
  value: number;
}

export interface UptimeData {
  current: number;
  history: UptimePoint[];
  incidents: Incident[];
}

export interface UptimePoint {
  timestamp: string;
  uptime: number;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  startedAt: string;
  resolvedAt?: string;
  affectedServices: string[];
}

export interface PerformanceData {
  responseTime: MetricData;
  throughput: MetricData;
  errorRate: MetricData;
  availability: MetricData;
}

// Cost Management types
export interface CostData {
  overview: CostOverview;
  breakdown: CostBreakdown[];
  trends: CostTrend[];
  budgets: Budget[];
  recommendations: CostRecommendation[];
}

export interface CostOverview {
  totalCost: number;
  monthlyTrend: number;
  projectedCost: number;
  currency: string;
  period: string;
}

export interface CostBreakdown {
  category: string;
  amount: number;
  percentage: number;
  trend: number;
  details: CostDetail[];
}

export interface CostDetail {
  name: string;
  amount: number;
  unit: string;
}

export interface CostTrend {
  date: string;
  amount: number;
  category?: string;
}

export interface Budget {
  id: string;
  name: string;
  amount: number;
  spent: number;
  period: 'monthly' | 'quarterly' | 'yearly';
  alerts: BudgetAlert[];
  status: 'on-track' | 'warning' | 'exceeded';
}

export interface BudgetAlert {
  threshold: number;
  enabled: boolean;
  notified: boolean;
}

export interface CostRecommendation {
  id: string;
  type: 'rightsizing' | 'reserved-instances' | 'unused-resources' | 'scheduling';
  title: string;
  description: string;
  potentialSavings: number;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  actions: RecommendationAction[];
}

export interface RecommendationAction {
  id: string;
  label: string;
  description: string;
  endpoint: string;
  method: string;
}

// Security types
export interface SecurityData {
  overview: SecurityOverview;
  vulnerabilities: Vulnerability[];
  compliance: ComplianceStatus;
  policies: SecurityPolicy[];
  auditLogs: AuditLog[];
}

export interface SecurityOverview {
  securityScore: number;
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  compliance: {
    passed: number;
    failed: number;
    total: number;
  };
  lastScan: string;
}

export interface Vulnerability {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in-progress' | 'resolved' | 'false-positive';
  cve?: string;
  affectedResources: string[];
  remediation: string;
  discoveredAt: string;
  resolvedAt?: string;
}

export interface ComplianceStatus {
  framework: string;
  score: number;
  controls: ComplianceControl[];
  lastAssessment: string;
}

export interface ComplianceControl {
  id: string;
  name: string;
  description: string;
  status: 'compliant' | 'non-compliant' | 'not-applicable';
  evidence?: string;
  lastChecked: string;
}

export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  type: 'access' | 'network' | 'data' | 'compliance';
  status: 'active' | 'inactive' | 'draft';
  rules: PolicyRule[];
  createdAt: string;
  updatedAt: string;
}

export interface PolicyRule {
  id: string;
  condition: string;
  action: 'allow' | 'deny' | 'log';
  priority: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  details: Record<string, any>;
  ip: string;
  userAgent: string;
}

// Settings types
export interface Settings {
  general: GeneralSettings;
  security: SecuritySettings;
  notifications: NotificationSettings;
  integrations: IntegrationSettings;
}

export interface GeneralSettings {
  companyName: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  language: string;
}

export interface SecuritySettings {
  twoFactorAuth: boolean;
  sessionTimeout: number;
  passwordPolicy: PasswordPolicy;
  ipWhitelist: string[];
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  maxAge: number;
}

export interface NotificationSettings {
  email: EmailNotifications;
  push: PushNotifications;
  slack: SlackNotifications;
}

export interface EmailNotifications {
  enabled: boolean;
  alerts: boolean;
  reports: boolean;
  deployments: boolean;
  security: boolean;
}

export interface PushNotifications {
  enabled: boolean;
  alerts: boolean;
  deployments: boolean;
  security: boolean;
}

export interface SlackNotifications {
  enabled: boolean;
  webhook: string;
  channel: string;
  alerts: boolean;
  deployments: boolean;
}

export interface IntegrationSettings {
  aws: AWSIntegration;
  gcp: GCPIntegration;
  azure: AzureIntegration;
}

export interface AWSIntegration {
  enabled: boolean;
  accessKeyId: string;
  region: string;
  services: string[];
}

export interface GCPIntegration {
  enabled: boolean;
  projectId: string;
  serviceAccountKey: string;
  region: string;
  services: string[];
}

export interface AzureIntegration {
  enabled: boolean;
  subscriptionId: string;
  tenantId: string;
  clientId: string;
  region: string;
  services: string[];
}

// Generic list response
export interface ListResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

// Generic request parameters
export interface ListParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
}

export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

// WebSocket message types
export interface WebSocketMessage<T = any> {
  type: string;
  data: T;
  timestamp: string;
  id?: string;
}

export interface WebSocketError {
  type: 'error';
  message: string;
  code?: string;
}

// File upload types
export interface FileUploadResponse {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
}

export interface FileUploadRequest {
  file: File;
  category?: string;
  metadata?: Record<string, any>;
}