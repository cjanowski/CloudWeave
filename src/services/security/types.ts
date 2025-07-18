/**
 * Security Policy Engine Types
 * Enterprise-grade security with SOC 2 and GDPR compliance
 */

export type ComplianceFramework = 'SOC2' | 'GDPR' | 'HIPAA' | 'PCI_DSS' | 'ISO27001' | 'NIST' | 'CIS';

export type SecuritySeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type PolicyStatus = 'active' | 'inactive' | 'draft' | 'deprecated';

export type ViolationStatus = 'open' | 'acknowledged' | 'remediated' | 'false_positive' | 'accepted_risk';

export type RemediationStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

/**
 * Security Policy Definition
 */
export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  category: string;
  severity: SecuritySeverity;
  complianceFrameworks: ComplianceFramework[];
  status: PolicyStatus;
  version: string;
  
  // Policy Rules
  rules: SecurityRule[];
  
  // Compliance Mapping
  controlMappings: ComplianceControlMapping[];
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedBy: string;
  updatedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  
  // Configuration
  enabled: boolean;
  enforcementMode: 'monitor' | 'enforce' | 'block';
  autoRemediation: boolean;
  notificationChannels: string[];
  
  // Audit Trail
  auditTrail: PolicyAuditEntry[];
}

/**
 * Security Rule within a Policy
 */
export interface SecurityRule {
  id: string;
  name: string;
  description: string;
  ruleType: 'configuration' | 'access' | 'data' | 'network' | 'encryption' | 'audit';
  
  // Rule Logic
  conditions: RuleCondition[];
  actions: RuleAction[];
  
  // Evaluation
  evaluationFrequency: string; // cron expression
  lastEvaluated?: Date;
  nextEvaluation?: Date;
  
  // Metadata
  enabled: boolean;
  priority: number;
  tags: string[];
}

/**
 * Rule Condition
 */
export interface RuleCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'regex' | 'exists' | 'not_exists' | 'greater_than' | 'less_than';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

/**
 * Rule Action
 */
export interface RuleAction {
  type: 'alert' | 'block' | 'remediate' | 'audit' | 'notify';
  parameters: Record<string, any>;
  priority: number;
}

/**
 * Compliance Control Mapping
 */
export interface ComplianceControlMapping {
  framework: ComplianceFramework;
  controlId: string;
  controlName: string;
  controlDescription: string;
  requirementLevel: 'mandatory' | 'recommended' | 'optional';
  implementationStatus: 'implemented' | 'partial' | 'not_implemented' | 'not_applicable';
  evidenceRequired: boolean;
  lastAssessed?: Date;
  assessedBy?: string;
  assessmentNotes?: string;
}

/**
 * Security Policy Violation
 */
export interface SecurityViolation {
  id: string;
  policyId: string;
  ruleId: string;
  
  // Violation Details
  severity: SecuritySeverity;
  title: string;
  description: string;
  category: string;
  
  // Context
  resourceId?: string;
  resourceType?: string;
  resourceName?: string;
  organizationId: string;
  projectId?: string;
  environmentId?: string;
  
  // Status
  status: ViolationStatus;
  
  // Detection
  detectedAt: Date;
  detectedBy: string; // system or user
  detectionMethod: 'automated' | 'manual' | 'external';
  
  // Evidence
  evidence: ViolationEvidence[];
  
  // Response
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  acknowledgmentReason?: string;
  
  remediationActions: RemediationAction[];
  
  // Risk Assessment
  riskScore: number;
  businessImpact: 'critical' | 'high' | 'medium' | 'low';
  
  // Compliance Impact
  complianceImpact: ComplianceImpact[];
  
  // Audit Trail
  auditTrail: ViolationAuditEntry[];
}

/**
 * Violation Evidence
 */
export interface ViolationEvidence {
  id: string;
  type: 'configuration' | 'log' | 'screenshot' | 'document' | 'api_response';
  description: string;
  data: any;
  collectedAt: Date;
  collectedBy: string;
  hash?: string; // for integrity verification
}

/**
 * Remediation Action
 */
export interface RemediationAction {
  id: string;
  type: 'automated' | 'manual';
  title: string;
  description: string;
  instructions?: string;
  
  // Status
  status: RemediationStatus;
  
  // Assignment
  assignedTo?: string;
  assignedAt?: Date;
  dueDate?: Date;
  
  // Execution
  startedAt?: Date;
  completedAt?: Date;
  executedBy?: string;
  
  // Results
  result?: 'success' | 'failure' | 'partial';
  resultDetails?: string;
  
  // Verification
  verificationRequired: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  verificationNotes?: string;
}

/**
 * Compliance Impact
 */
export interface ComplianceImpact {
  framework: ComplianceFramework;
  controlId: string;
  impactLevel: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  requiresReporting: boolean;
  reportingDeadline?: Date;
}

/**
 * Policy Audit Entry
 */
export interface PolicyAuditEntry {
  id: string;
  timestamp: Date;
  action: 'created' | 'updated' | 'activated' | 'deactivated' | 'approved' | 'deprecated';
  performedBy: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Violation Audit Entry
 */
export interface ViolationAuditEntry {
  id: string;
  timestamp: Date;
  action: 'detected' | 'acknowledged' | 'remediated' | 'status_changed' | 'evidence_added';
  performedBy: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Security Scan Configuration
 */
export interface SecurityScanConfig {
  id: string;
  name: string;
  description: string;
  scanType: 'vulnerability' | 'configuration' | 'compliance' | 'access_review' | 'data_classification';
  
  // Scope
  scope: {
    organizationIds?: string[];
    projectIds?: string[];
    environmentIds?: string[];
    resourceTypes?: string[];
    tags?: Record<string, string>;
  };
  
  // Schedule
  schedule: {
    enabled: boolean;
    cronExpression: string;
    timezone: string;
  };
  
  // Configuration
  policies: string[]; // Policy IDs to evaluate
  parameters: Record<string, any>;
  
  // Notifications
  notifications: {
    onStart: boolean;
    onComplete: boolean;
    onViolation: boolean;
    channels: string[];
  };
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedBy: string;
  updatedAt: Date;
  
  // Status
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

/**
 * Security Scan Result
 */
export interface SecurityScanResult {
  id: string;
  scanConfigId: string;
  
  // Execution Details
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  
  // Results
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  skippedChecks: number;
  
  // Violations
  violations: SecurityViolation[];
  violationsBySeverity: Record<SecuritySeverity, number>;
  
  // Compliance
  complianceScore: number;
  complianceByFramework: Record<ComplianceFramework, ComplianceScore>;
  
  // Metadata
  executedBy: string;
  scanVersion: string;
  
  // Error Details
  errors?: ScanError[];
}

/**
 * Compliance Score
 */
export interface ComplianceScore {
  framework: ComplianceFramework;
  totalControls: number;
  implementedControls: number;
  partialControls: number;
  notImplementedControls: number;
  score: number; // percentage
  lastAssessed: Date;
}

/**
 * Scan Error
 */
export interface ScanError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

/**
 * Data Classification
 */
export interface DataClassification {
  id: string;
  resourceId: string;
  resourceType: string;
  
  // Classification
  dataTypes: DataType[];
  sensitivityLevel: 'public' | 'internal' | 'confidential' | 'restricted';
  
  // GDPR Specific
  containsPII: boolean;
  piiTypes?: PIIType[];
  dataSubjects?: string[];
  processingPurpose?: string[];
  legalBasis?: GDPRLegalBasis[];
  
  // Retention
  retentionPeriod?: string;
  retentionReason?: string;
  disposalMethod?: string;
  
  // Access Controls
  accessRestrictions: AccessRestriction[];
  
  // Audit
  classifiedBy: string;
  classifiedAt: Date;
  lastReviewed?: Date;
  reviewedBy?: string;
  
  // Compliance
  complianceRequirements: ComplianceRequirement[];
}

/**
 * Data Types
 */
export type DataType = 
  | 'personal_data'
  | 'financial_data'
  | 'health_data'
  | 'biometric_data'
  | 'location_data'
  | 'behavioral_data'
  | 'technical_data'
  | 'usage_data'
  | 'communication_data'
  | 'transaction_data';

/**
 * PII Types for GDPR
 */
export type PIIType =
  | 'name'
  | 'email'
  | 'phone'
  | 'address'
  | 'ssn'
  | 'passport'
  | 'drivers_license'
  | 'credit_card'
  | 'bank_account'
  | 'ip_address'
  | 'device_id'
  | 'biometric'
  | 'genetic'
  | 'health'
  | 'sexual_orientation'
  | 'political_opinion'
  | 'religious_belief';

/**
 * GDPR Legal Basis
 */
export type GDPRLegalBasis =
  | 'consent'
  | 'contract'
  | 'legal_obligation'
  | 'vital_interests'
  | 'public_task'
  | 'legitimate_interests';

/**
 * Access Restriction
 */
export interface AccessRestriction {
  type: 'role' | 'user' | 'group' | 'attribute';
  value: string;
  permissions: string[];
  conditions?: Record<string, any>;
}

/**
 * Compliance Requirement
 */
export interface ComplianceRequirement {
  framework: ComplianceFramework;
  requirement: string;
  description: string;
  mandatory: boolean;
  implementationStatus: 'compliant' | 'non_compliant' | 'partial' | 'not_applicable';
  evidence?: string[];
}

/**
 * Security Dashboard Metrics
 */
export interface SecurityMetrics {
  // Policy Metrics
  totalPolicies: number;
  activePolicies: number;
  policyViolations: number;
  
  // Violation Metrics
  openViolations: number;
  violationsBySeverity: Record<SecuritySeverity, number>;
  violationTrends: ViolationTrend[];
  
  // Compliance Metrics
  overallComplianceScore: number;
  complianceByFramework: Record<ComplianceFramework, number>;
  
  // Remediation Metrics
  pendingRemediations: number;
  averageRemediationTime: number;
  remediationSuccessRate: number;
  
  // Risk Metrics
  riskScore: number;
  riskTrends: RiskTrend[];
  
  // Data Protection Metrics (GDPR)
  dataSubjectsCount: number;
  dataRetentionCompliance: number;
  consentManagementScore: number;
  
  // Audit Metrics
  auditEventsCount: number;
  failedAudits: number;
  auditCoverage: number;
  
  // Last Updated
  lastUpdated: Date;
}

/**
 * Violation Trend
 */
export interface ViolationTrend {
  date: Date;
  count: number;
  severity: SecuritySeverity;
}

/**
 * Risk Trend
 */
export interface RiskTrend {
  date: Date;
  score: number;
  category: string;
}

/**
 * Security Event for Audit Trail
 */
export interface SecurityEvent {
  id: string;
  timestamp: Date;
  eventType: 'policy_violation' | 'access_denied' | 'data_access' | 'configuration_change' | 'user_action';
  severity: SecuritySeverity;
  
  // Context
  userId?: string;
  resourceId?: string;
  resourceType?: string;
  organizationId: string;
  projectId?: string;
  
  // Details
  description: string;
  details: Record<string, any>;
  
  // Network Context
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  
  // Compliance
  complianceRelevant: boolean;
  retentionPeriod: string;
  
  // Processing
  processed: boolean;
  processedAt?: Date;
  processedBy?: string;
}