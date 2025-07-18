/**
 * Security Service Interfaces
 * Enterprise-grade security with SOC 2 and GDPR compliance
 */

import {
  SecurityPolicy,
  SecurityViolation,
  SecurityScanConfig,
  SecurityScanResult,
  DataClassification,
  SecurityMetrics,
  SecurityEvent,
  ComplianceFramework,
  SecuritySeverity,
  RemediationAction,
  ComplianceScore
} from './types';

/**
 * Security Policy Engine Interface
 */
export interface ISecurityPolicyEngine {
  // Policy Management
  createPolicy(policy: Omit<SecurityPolicy, 'id' | 'createdAt' | 'updatedAt' | 'auditTrail'>): Promise<SecurityPolicy>;
  getPolicy(policyId: string): Promise<SecurityPolicy | null>;
  getPolicies(organizationId: string, filters?: PolicyFilters): Promise<SecurityPolicy[]>;
  updatePolicy(policyId: string, updates: Partial<SecurityPolicy>): Promise<SecurityPolicy>;
  deletePolicy(policyId: string): Promise<void>;
  
  // Policy Lifecycle
  activatePolicy(policyId: string, activatedBy: string): Promise<void>;
  deactivatePolicy(policyId: string, deactivatedBy: string): Promise<void>;
  approvePolicy(policyId: string, approvedBy: string): Promise<void>;
  
  // Policy Evaluation
  evaluatePolicy(policyId: string, context: EvaluationContext): Promise<PolicyEvaluationResult>;
  evaluateAllPolicies(context: EvaluationContext): Promise<PolicyEvaluationResult[]>;
  
  // Bulk Operations
  importPolicies(policies: SecurityPolicy[], organizationId: string): Promise<ImportResult>;
  exportPolicies(organizationId: string, format: 'json' | 'yaml' | 'csv'): Promise<string>;
}

/**
 * Security Scanner Interface
 */
export interface ISecurityScanner {
  // Scan Configuration
  createScanConfig(config: Omit<SecurityScanConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<SecurityScanConfig>;
  getScanConfig(configId: string): Promise<SecurityScanConfig | null>;
  getScanConfigs(organizationId: string): Promise<SecurityScanConfig[]>;
  updateScanConfig(configId: string, updates: Partial<SecurityScanConfig>): Promise<SecurityScanConfig>;
  deleteScanConfig(configId: string): Promise<void>;
  
  // Scan Execution
  executeScan(configId: string, triggeredBy: string): Promise<SecurityScanResult>;
  getScansResults(configId?: string, limit?: number): Promise<SecurityScanResult[]>;
  getScanResult(resultId: string): Promise<SecurityScanResult | null>;
  
  // Scheduled Scans
  enableScheduledScan(configId: string): Promise<void>;
  disableScheduledScan(configId: string): Promise<void>;
  getScheduledScans(): Promise<SecurityScanConfig[]>;
}

/**
 * Violation Management Interface
 */
export interface IViolationManager {
  // Violation CRUD
  createViolation(violation: Omit<SecurityViolation, 'id' | 'detectedAt' | 'auditTrail'>): Promise<SecurityViolation>;
  getViolation(violationId: string): Promise<SecurityViolation | null>;
  getViolations(organizationId: string, filters?: ViolationFilters): Promise<SecurityViolation[]>;
  updateViolation(violationId: string, updates: Partial<SecurityViolation>): Promise<SecurityViolation>;
  
  // Violation Lifecycle
  acknowledgeViolation(violationId: string, acknowledgedBy: string, reason: string): Promise<void>;
  resolveViolation(violationId: string, resolvedBy: string, resolution: string): Promise<void>;
  reopenViolation(violationId: string, reopenedBy: string, reason: string): Promise<void>;
  
  // Remediation
  createRemediationAction(violationId: string, action: Omit<RemediationAction, 'id'>): Promise<RemediationAction>;
  updateRemediationAction(actionId: string, updates: Partial<RemediationAction>): Promise<RemediationAction>;
  executeAutomatedRemediation(violationId: string): Promise<RemediationResult>;
  
  // Bulk Operations
  bulkAcknowledge(violationIds: string[], acknowledgedBy: string, reason: string): Promise<BulkOperationResult>;
  bulkResolve(violationIds: string[], resolvedBy: string, resolution: string): Promise<BulkOperationResult>;
}

/**
 * Compliance Manager Interface
 */
export interface IComplianceManager {
  // Framework Management
  getSupportedFrameworks(): ComplianceFramework[];
  getFrameworkControls(framework: ComplianceFramework): Promise<FrameworkControl[]>;
  
  // Compliance Assessment
  assessCompliance(organizationId: string, framework: ComplianceFramework): Promise<ComplianceAssessment>;
  getComplianceScore(organizationId: string, framework?: ComplianceFramework): Promise<ComplianceScore[]>;
  
  // Evidence Management
  uploadEvidence(controlId: string, evidence: EvidenceUpload): Promise<Evidence>;
  getEvidence(controlId: string): Promise<Evidence[]>;
  deleteEvidence(evidenceId: string): Promise<void>;
  
  // Reporting
  generateComplianceReport(organizationId: string, framework: ComplianceFramework, format: 'pdf' | 'html' | 'json'): Promise<string>;
  scheduleComplianceReport(config: ReportScheduleConfig): Promise<void>;
}

/**
 * Data Classification Interface
 */
export interface IDataClassificationService {
  // Classification
  classifyData(resourceId: string, resourceType: string, classificationData: Partial<DataClassification>): Promise<DataClassification>;
  getClassification(resourceId: string): Promise<DataClassification | null>;
  getClassifications(organizationId: string, filters?: ClassificationFilters): Promise<DataClassification[]>;
  updateClassification(classificationId: string, updates: Partial<DataClassification>): Promise<DataClassification>;
  
  // Automated Classification
  autoClassifyResource(resourceId: string, resourceType: string): Promise<DataClassification>;
  bulkAutoClassify(organizationId: string, resourceType?: string): Promise<ClassificationResult[]>;
  
  // GDPR Specific
  identifyPII(resourceId: string): Promise<PIIIdentificationResult>;
  trackDataSubject(dataSubjectId: string): Promise<DataSubjectRecord>;
  processDataSubjectRequest(request: DataSubjectRequest): Promise<DataSubjectRequestResult>;
  
  // Data Retention
  applyRetentionPolicy(classificationId: string, policy: RetentionPolicy): Promise<void>;
  getExpiredData(organizationId: string): Promise<DataClassification[]>;
  executeDataDisposal(classificationIds: string[]): Promise<DisposalResult>;
}

/**
 * Security Audit Interface
 */
export interface ISecurityAuditService {
  // Event Logging
  logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<SecurityEvent>;
  getSecurityEvents(organizationId: string, filters?: AuditFilters): Promise<SecurityEvent[]>;
  
  // Audit Trail
  getAuditTrail(resourceId: string, resourceType: string): Promise<SecurityEvent[]>;
  searchAuditLogs(query: AuditQuery): Promise<SecurityEvent[]>;
  
  // Compliance Auditing
  generateAuditReport(organizationId: string, timeRange: TimeRange, format: 'pdf' | 'csv' | 'json'): Promise<string>;
  exportAuditLogs(organizationId: string, timeRange: TimeRange, format: 'json' | 'csv'): Promise<string>;
  
  // Retention Management
  applyRetentionPolicy(organizationId: string): Promise<void>;
  purgeExpiredLogs(organizationId: string): Promise<PurgeResult>;
}

/**
 * Security Metrics Interface
 */
export interface ISecurityMetricsService {
  // Metrics Collection
  getSecurityMetrics(organizationId: string): Promise<SecurityMetrics>;
  getMetricsTrends(organizationId: string, timeRange: TimeRange): Promise<MetricsTrends>;
  
  // Dashboard Data
  getDashboardData(organizationId: string): Promise<SecurityDashboardData>;
  getComplianceDashboard(organizationId: string, framework?: ComplianceFramework): Promise<ComplianceDashboardData>;
  
  // Alerting
  checkMetricThresholds(organizationId: string): Promise<MetricAlert[]>;
  configureMetricAlert(config: MetricAlertConfig): Promise<void>;
}

// Supporting Types and Interfaces

export interface PolicyFilters {
  category?: string;
  severity?: SecuritySeverity;
  framework?: ComplianceFramework;
  status?: string;
  enabled?: boolean;
}

export interface EvaluationContext {
  organizationId: string;
  projectId?: string;
  environmentId?: string;
  resourceId?: string;
  resourceType?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface PolicyEvaluationResult {
  policyId: string;
  passed: boolean;
  violations: SecurityViolation[];
  score: number;
  evaluatedAt: Date;
  evaluationTime: number;
}

export interface ImportResult {
  imported: number;
  failed: number;
  errors: ImportError[];
}

export interface ImportError {
  policyName: string;
  error: string;
  lineNumber?: number;
}

export interface ViolationFilters {
  severity?: SecuritySeverity;
  status?: string;
  category?: string;
  resourceType?: string;
  dateRange?: TimeRange;
}

export interface RemediationResult {
  success: boolean;
  actionsExecuted: number;
  actionsFailed: number;
  details: string;
}

export interface BulkOperationResult {
  processed: number;
  successful: number;
  failed: number;
  errors: BulkOperationError[];
}

export interface BulkOperationError {
  id: string;
  error: string;
}

export interface FrameworkControl {
  id: string;
  name: string;
  description: string;
  category: string;
  mandatory: boolean;
  implementationGuidance: string;
}

export interface ComplianceAssessment {
  framework: ComplianceFramework;
  organizationId: string;
  assessmentDate: Date;
  assessedBy: string;
  overallScore: number;
  controlAssessments: ControlAssessment[];
  recommendations: string[];
  nextAssessmentDue: Date;
}

export interface ControlAssessment {
  controlId: string;
  status: 'compliant' | 'non_compliant' | 'partial' | 'not_applicable';
  score: number;
  evidence: string[];
  gaps: string[];
  recommendations: string[];
}

export interface Evidence {
  id: string;
  controlId: string;
  type: 'document' | 'screenshot' | 'configuration' | 'log' | 'certificate';
  name: string;
  description: string;
  uploadedBy: string;
  uploadedAt: Date;
  fileUrl?: string;
  metadata: Record<string, any>;
}

export interface EvidenceUpload {
  type: 'document' | 'screenshot' | 'configuration' | 'log' | 'certificate';
  name: string;
  description: string;
  file?: Buffer;
  metadata?: Record<string, any>;
}

export interface ReportScheduleConfig {
  organizationId: string;
  framework: ComplianceFramework;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  recipients: string[];
  format: 'pdf' | 'html' | 'json';
}

export interface ClassificationFilters {
  sensitivityLevel?: string;
  dataType?: string;
  containsPII?: boolean;
  retentionStatus?: string;
}

export interface ClassificationResult {
  resourceId: string;
  success: boolean;
  classification?: DataClassification;
  error?: string;
}

export interface PIIIdentificationResult {
  resourceId: string;
  containsPII: boolean;
  piiTypes: string[];
  confidence: number;
  locations: PIILocation[];
}

export interface PIILocation {
  field: string;
  type: string;
  confidence: number;
  sample?: string;
}

export interface DataSubjectRecord {
  dataSubjectId: string;
  resources: string[];
  dataTypes: string[];
  processingPurposes: string[];
  legalBases: string[];
  consentStatus: 'given' | 'withdrawn' | 'not_required';
  lastUpdated: Date;
}

export interface DataSubjectRequest {
  type: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction';
  dataSubjectId: string;
  requestedBy: string;
  requestDate: Date;
  description: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
}

export interface DataSubjectRequestResult {
  requestId: string;
  status: 'completed' | 'partial' | 'failed';
  data?: any;
  actions: string[];
  completedAt: Date;
}

export interface RetentionPolicy {
  retentionPeriod: string;
  disposalMethod: 'delete' | 'anonymize' | 'archive';
  approvalRequired: boolean;
  notificationRequired: boolean;
}

export interface DisposalResult {
  processed: number;
  successful: number;
  failed: number;
  details: DisposalDetail[];
}

export interface DisposalDetail {
  classificationId: string;
  status: 'success' | 'failed';
  method: string;
  error?: string;
}

export interface AuditFilters {
  eventType?: string;
  severity?: SecuritySeverity;
  userId?: string;
  resourceType?: string;
  timeRange?: TimeRange;
}

export interface AuditQuery {
  organizationId: string;
  query: string;
  filters?: AuditFilters;
  limit?: number;
  offset?: number;
}

export interface TimeRange {
  startDate: Date;
  endDate: Date;
}

export interface PurgeResult {
  purged: number;
  errors: number;
  details: string;
}

export interface MetricsTrends {
  violationTrends: Array<{ date: Date; count: number; severity: SecuritySeverity }>;
  complianceTrends: Array<{ date: Date; score: number; framework: ComplianceFramework }>;
  remediationTrends: Array<{ date: Date; completed: number; pending: number }>;
}

export interface SecurityDashboardData {
  metrics: SecurityMetrics;
  recentViolations: SecurityViolation[];
  pendingRemediations: RemediationAction[];
  complianceStatus: ComplianceScore[];
  riskIndicators: RiskIndicator[];
}

export interface ComplianceDashboardData {
  framework: ComplianceFramework;
  overallScore: number;
  controlStatus: ControlStatus[];
  recentAssessments: ComplianceAssessment[];
  upcomingDeadlines: ComplianceDeadline[];
}

export interface RiskIndicator {
  category: string;
  level: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface ControlStatus {
  controlId: string;
  name: string;
  status: 'compliant' | 'non_compliant' | 'partial' | 'not_applicable';
  lastAssessed: Date;
  nextDue: Date;
}

export interface ComplianceDeadline {
  controlId: string;
  name: string;
  dueDate: Date;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface MetricAlert {
  metric: string;
  threshold: number;
  currentValue: number;
  severity: SecuritySeverity;
  message: string;
}

export interface MetricAlertConfig {
  organizationId: string;
  metric: string;
  threshold: number;
  operator: 'greater_than' | 'less_than' | 'equals';
  severity: SecuritySeverity;
  enabled: boolean;
  notificationChannels: string[];
}