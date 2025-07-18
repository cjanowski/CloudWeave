/**
 * Security Services Module
 * Enterprise-grade security with SOC 2 and GDPR compliance
 */

// Types and interfaces
export * from './types';
export * from './interfaces';

// Core services
export { SecurityPolicyEngine } from './SecurityPolicyEngine';
export { ComplianceManager } from './ComplianceManager';
export { DataClassificationService } from './DataClassificationService';

// Convenience functions for creating and configuring services
import { SecurityPolicyEngine } from './SecurityPolicyEngine';
import { ComplianceManager } from './ComplianceManager';
import { DataClassificationService } from './DataClassificationService';

/**
 * Create a fully configured security service suite
 */
export async function createSecurityServices(): Promise<{
  policyEngine: SecurityPolicyEngine;
  complianceManager: ComplianceManager;
  dataClassificationService: DataClassificationService;
}> {
  // Create policy engine
  const policyEngine = new SecurityPolicyEngine();

  // Create compliance manager
  const complianceManager = new ComplianceManager();

  // Create data classification service
  const dataClassificationService = new DataClassificationService();

  return {
    policyEngine,
    complianceManager,
    dataClassificationService,
  };
}

/**
 * Default security configuration for enterprise environments
 */
export const defaultSecurityConfig = {
  // Policy Engine Configuration
  policyEngine: {
    evaluationInterval: '*/30 * * * *', // Every 30 minutes
    cacheTimeout: 300000, // 5 minutes
    maxPoliciesPerOrganization: 1000,
    auditRetention: '7y', // 7 years for compliance
  },

  // Compliance Configuration
  compliance: {
    assessmentFrequency: 'quarterly',
    evidenceRetention: '7y',
    reportFormats: ['pdf', 'html', 'json'],
    autoAssessment: true,
    frameworkPriority: ['SOC2', 'GDPR', 'ISO27001', 'NIST'],
  },

  // Data Classification Configuration
  dataClassification: {
    autoClassification: true,
    piiDetectionThreshold: 0.8,
    retentionPolicies: {
      personal_data: '6y', // GDPR requirement
      financial_data: '7y', // SOX requirement
      health_data: '6y', // HIPAA requirement
      technical_data: '3y',
      usage_data: '2y',
    },
    sensitivityLevels: {
      public: {
        encryption: false,
        accessControl: 'none',
        auditLevel: 'basic',
      },
      internal: {
        encryption: false,
        accessControl: 'role_based',
        auditLevel: 'standard',
      },
      confidential: {
        encryption: true,
        accessControl: 'strict',
        auditLevel: 'detailed',
      },
      restricted: {
        encryption: true,
        accessControl: 'multi_factor',
        auditLevel: 'comprehensive',
      },
    },
  },

  // GDPR Specific Configuration
  gdpr: {
    dataSubjectRights: {
      accessRequestTimeout: '30d', // 30 days as per GDPR
      erasureRequestTimeout: '30d',
      portabilityRequestTimeout: '30d',
      rectificationRequestTimeout: '30d',
    },
    consentManagement: {
      consentExpiry: '2y',
      consentRenewalNotice: '30d',
      withdrawalProcessing: '24h',
    },
    breachNotification: {
      supervisoryAuthorityDeadline: '72h',
      dataSubjectNotificationDeadline: '72h',
      riskAssessmentRequired: true,
    },
  },

  // SOC 2 Specific Configuration
  soc2: {
    controlCategories: [
      'security',
      'availability',
      'processing_integrity',
      'confidentiality',
      'privacy',
    ],
    auditFrequency: 'annual',
    continuousMonitoring: true,
    evidenceCollection: 'automated',
    reportingPeriod: 'quarterly',
  },

  // Security Monitoring
  monitoring: {
    realTimeAlerts: true,
    alertThresholds: {
      critical: 0, // Immediate
      high: 300, // 5 minutes
      medium: 1800, // 30 minutes
      low: 3600, // 1 hour
    },
    dashboardRefresh: 60, // 1 minute
    metricsRetention: '2y',
  },

  // Audit Configuration
  audit: {
    logRetention: '7y',
    logEncryption: true,
    logIntegrity: true,
    realTimeLogging: true,
    logForwarding: true,
    complianceReporting: true,
  },
};

/**
 * Security utilities for common operations
 */
export const SecurityUtils = {
  /**
   * Generate compliance report filename
   */
  generateReportFilename(organizationId: string, framework: string, date: Date): string {
    const dateStr = date.toISOString().split('T')[0];
    return `compliance-report-${framework.toLowerCase()}-${organizationId}-${dateStr}`;
  },

  /**
   * Validate data retention period format
   */
  isValidRetentionPeriod(period: string): boolean {
    return /^(\d+)([ymwd])$/.test(period);
  },

  /**
   * Parse retention period to milliseconds
   */
  parseRetentionPeriod(period: string): number {
    const match = period.match(/^(\d+)([ymwd])$/);
    if (!match) return 0;

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 'd': return value * 24 * 60 * 60 * 1000;
      case 'w': return value * 7 * 24 * 60 * 60 * 1000;
      case 'm': return value * 30 * 24 * 60 * 60 * 1000;
      case 'y': return value * 365 * 24 * 60 * 60 * 1000;
      default: return 0;
    }
  },

  /**
   * Calculate compliance score
   */
  calculateComplianceScore(
    totalControls: number,
    implementedControls: number,
    partialControls: number
  ): number {
    if (totalControls === 0) return 100;
    
    const weightedScore = (implementedControls * 1.0) + (partialControls * 0.5);
    return Math.round((weightedScore / totalControls) * 100);
  },

  /**
   * Determine risk level based on severity and business impact
   */
  calculateRiskLevel(
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info',
    businessImpact: 'critical' | 'high' | 'medium' | 'low'
  ): 'critical' | 'high' | 'medium' | 'low' {
    const severityScore = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };
    const impactScore = { critical: 4, high: 3, medium: 2, low: 1 };
    
    const totalScore = severityScore[severity] + impactScore[businessImpact];
    
    if (totalScore >= 7) return 'critical';
    if (totalScore >= 5) return 'high';
    if (totalScore >= 3) return 'medium';
    return 'low';
  },

  /**
   * Generate security event fingerprint
   */
  generateEventFingerprint(
    eventType: string,
    resourceId: string,
    userId?: string
  ): string {
    const data = `${eventType}-${resourceId}-${userId || 'system'}`;
    // Simple hash function for demonstration
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  },

  /**
   * Validate PII detection confidence
   */
  isHighConfidencePII(confidence: number, threshold: number = 0.8): boolean {
    return confidence >= threshold;
  },

  /**
   * Format compliance framework name
   */
  formatFrameworkName(framework: string): string {
    const nameMap: Record<string, string> = {
      SOC2: 'SOC 2',
      GDPR: 'GDPR',
      HIPAA: 'HIPAA',
      PCI_DSS: 'PCI DSS',
      ISO27001: 'ISO 27001',
      NIST: 'NIST Cybersecurity Framework',
      CIS: 'CIS Controls',
    };
    return nameMap[framework] || framework;
  },

  /**
   * Get framework color for UI
   */
  getFrameworkColor(framework: string): string {
    const colorMap: Record<string, string> = {
      SOC2: '#2563eb', // Blue
      GDPR: '#dc2626', // Red
      HIPAA: '#059669', // Green
      PCI_DSS: '#7c3aed', // Purple
      ISO27001: '#ea580c', // Orange
      NIST: '#0891b2', // Cyan
      CIS: '#4338ca', // Indigo
    };
    return colorMap[framework] || '#6b7280'; // Gray default
  },

  /**
   * Validate email format for notifications
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Sanitize user input for security
   */
  sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/['"]/g, '') // Remove quotes
      .trim();
  },

  /**
   * Generate secure random ID
   */
  generateSecureId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
};

/**
 * Pre-configured policy templates for common compliance scenarios
 */
export const PolicyTemplates = {
  /**
   * SOC 2 Access Control Policy Template
   */
  soc2AccessControl: {
    name: 'SOC 2 Access Control Policy',
    description: 'Comprehensive access control policy for SOC 2 compliance',
    category: 'Access Control',
    severity: 'critical' as const,
    complianceFrameworks: ['SOC2' as const],
    enforcementMode: 'enforce' as const,
    rules: [
      {
        name: 'Multi-Factor Authentication Required',
        description: 'All user accounts must have MFA enabled',
        ruleType: 'access' as const,
        conditions: [
          {
            field: 'user.mfaEnabled',
            operator: 'equals' as const,
            value: false,
          },
        ],
        actions: [
          {
            type: 'block' as const,
            parameters: { message: 'MFA is required for access' },
            priority: 1,
          },
        ],
      },
    ],
  },

  /**
   * GDPR Data Protection Policy Template
   */
  gdprDataProtection: {
    name: 'GDPR Data Protection Policy',
    description: 'Data protection policy for GDPR compliance',
    category: 'Data Protection',
    severity: 'critical' as const,
    complianceFrameworks: ['GDPR' as const],
    enforcementMode: 'enforce' as const,
    rules: [
      {
        name: 'Personal Data Encryption',
        description: 'All personal data must be encrypted',
        ruleType: 'encryption' as const,
        conditions: [
          {
            field: 'data.containsPII',
            operator: 'equals' as const,
            value: true,
          },
          {
            field: 'data.encrypted',
            operator: 'equals' as const,
            value: false,
            logicalOperator: 'AND' as const,
          },
        ],
        actions: [
          {
            type: 'alert' as const,
            parameters: { severity: 'critical' },
            priority: 1,
          },
        ],
      },
    ],
  },

  /**
   * Generic Security Baseline Policy Template
   */
  securityBaseline: {
    name: 'Security Baseline Policy',
    description: 'Basic security requirements for all systems',
    category: 'Security Baseline',
    severity: 'high' as const,
    complianceFrameworks: ['SOC2' as const, 'ISO27001' as const],
    enforcementMode: 'monitor' as const,
    rules: [
      {
        name: 'Password Complexity',
        description: 'Passwords must meet complexity requirements',
        ruleType: 'access' as const,
        conditions: [
          {
            field: 'password.complexity',
            operator: 'less_than' as const,
            value: 8,
          },
        ],
        actions: [
          {
            type: 'alert' as const,
            parameters: { message: 'Password does not meet complexity requirements' },
            priority: 2,
          },
        ],
      },
    ],
  },
};