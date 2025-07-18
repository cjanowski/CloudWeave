/**
 * Enterprise Security Policy Engine
 * SOC 2 and GDPR Compliant Security Policy Management
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';
import {
  ISecurityPolicyEngine,
  PolicyFilters,
  EvaluationContext,
  PolicyEvaluationResult,
  ImportResult
} from './interfaces';
import {
  SecurityPolicy,
  SecurityRule,
  SecurityViolation,
  SecuritySeverity,
  RuleCondition
} from './types';

/**
 * Enterprise Security Policy Engine
 * Implements comprehensive security policy management with SOC 2 and GDPR compliance
 */
export class SecurityPolicyEngine implements ISecurityPolicyEngine {
  private policies: Map<string, SecurityPolicy> = new Map();
  private policyEvaluationCache: Map<string, PolicyEvaluationResult> = new Map();
  private readonly CACHE_TTL = 300000; // 5 minutes

  constructor() {
    this.initializeDefaultPolicies();
  }

  /**
   * Create a new security policy
   */
  async createPolicy(policyData: Omit<SecurityPolicy, 'id' | 'createdAt' | 'updatedAt' | 'auditTrail'>): Promise<SecurityPolicy> {
    try {
      const policyId = uuidv4();
      const now = new Date();

      const policy: SecurityPolicy = {
        ...policyData,
        id: policyId,
        createdAt: now,
        updatedAt: now,
        auditTrail: [{
          id: uuidv4(),
          timestamp: now,
          action: 'created',
          performedBy: policyData.createdBy,
          details: { policyName: policyData.name, version: policyData.version }
        }]
      };

      // Validate policy
      const validationErrors = await this.validatePolicy(policy);
      if (validationErrors.length > 0) {
        throw new Error(`Policy validation failed: ${validationErrors.join(', ')}`);
      }

      this.policies.set(policyId, policy);

      logger.info(`Created security policy ${policyId}`, {
        policyId,
        name: policy.name,
        category: policy.category,
        severity: policy.severity,
        frameworks: policy.complianceFrameworks
      });

      return policy;
    } catch (error) {
      logger.error('Failed to create security policy:', error);
      throw error;
    }
  }

  /**
   * Get security policy by ID
   */
  async getPolicy(policyId: string): Promise<SecurityPolicy | null> {
    return this.policies.get(policyId) || null;
  }

  /**
   * Get security policies with filtering
   */
  async getPolicies(organizationId: string, filters?: PolicyFilters): Promise<SecurityPolicy[]> {
    try {
      let policies = Array.from(this.policies.values());

      // Apply filters
      if (filters) {
        if (filters.category) {
          policies = policies.filter(p => p.category === filters.category);
        }
        if (filters.severity) {
          policies = policies.filter(p => p.severity === filters.severity);
        }
        if (filters.framework) {
          policies = policies.filter(p => p.complianceFrameworks.includes(filters.framework!));
        }
        if (filters.status) {
          policies = policies.filter(p => p.status === filters.status);
        }
        if (filters.enabled !== undefined) {
          policies = policies.filter(p => p.enabled === filters.enabled);
        }
      }

      logger.info(`Retrieved ${policies.length} security policies`, {
        organizationId,
        filters
      });

      return policies;
    } catch (error) {
      logger.error('Failed to get security policies:', error);
      throw error;
    }
  }

  /**
   * Update security policy
   */
  async updatePolicy(policyId: string, updates: Partial<SecurityPolicy>): Promise<SecurityPolicy> {
    try {
      const policy = this.policies.get(policyId);
      if (!policy) {
        throw new Error(`Security policy ${policyId} not found`);
      }

      const now = new Date();
      const updatedPolicy: SecurityPolicy = {
        ...policy,
        ...updates,
        id: policyId, // Ensure ID cannot be changed
        createdAt: policy.createdAt, // Preserve creation date
        updatedAt: now,
        auditTrail: [
          ...policy.auditTrail,
          {
            id: uuidv4(),
            timestamp: now,
            action: 'updated',
            performedBy: updates.updatedBy || 'system',
            details: { updatedFields: Object.keys(updates) }
          }
        ]
      };

      // Validate updated policy
      const validationErrors = await this.validatePolicy(updatedPolicy);
      if (validationErrors.length > 0) {
        throw new Error(`Policy validation failed: ${validationErrors.join(', ')}`);
      }

      this.policies.set(policyId, updatedPolicy);

      // Clear evaluation cache for this policy
      this.clearPolicyCache(policyId);

      logger.info(`Updated security policy ${policyId}`, {
        policyId,
        updatedFields: Object.keys(updates)
      });

      return updatedPolicy;
    } catch (error) {
      logger.error(`Failed to update security policy ${policyId}:`, error);
      throw error;
    }
  }

  /**
   * Delete security policy
   */
  async deletePolicy(policyId: string): Promise<void> {
    try {
      const policy = this.policies.get(policyId);
      if (!policy) {
        throw new Error(`Security policy ${policyId} not found`);
      }

      this.policies.delete(policyId);
      this.clearPolicyCache(policyId);

      logger.info(`Deleted security policy ${policyId}`, {
        policyId,
        name: policy.name
      });
    } catch (error) {
      logger.error(`Failed to delete security policy ${policyId}:`, error);
      throw error;
    }
  }

  /**
   * Activate security policy
   */
  async activatePolicy(policyId: string, activatedBy: string): Promise<void> {
    try {
      const policy = this.policies.get(policyId);
      if (!policy) {
        throw new Error(`Security policy ${policyId} not found`);
      }

      const now = new Date();
      policy.status = 'active';
      policy.enabled = true;
      policy.updatedAt = now;
      policy.auditTrail.push({
        id: uuidv4(),
        timestamp: now,
        action: 'activated',
        performedBy: activatedBy,
        details: { previousStatus: policy.status }
      });

      this.clearPolicyCache(policyId);

      logger.info(`Activated security policy ${policyId}`, {
        policyId,
        activatedBy
      });
    } catch (error) {
      logger.error(`Failed to activate security policy ${policyId}:`, error);
      throw error;
    }
  }

  /**
   * Deactivate security policy
   */
  async deactivatePolicy(policyId: string, deactivatedBy: string): Promise<void> {
    try {
      const policy = this.policies.get(policyId);
      if (!policy) {
        throw new Error(`Security policy ${policyId} not found`);
      }

      const now = new Date();
      policy.status = 'inactive';
      policy.enabled = false;
      policy.updatedAt = now;
      policy.auditTrail.push({
        id: uuidv4(),
        timestamp: now,
        action: 'deactivated',
        performedBy: deactivatedBy,
        details: { previousStatus: policy.status }
      });

      this.clearPolicyCache(policyId);

      logger.info(`Deactivated security policy ${policyId}`, {
        policyId,
        deactivatedBy
      });
    } catch (error) {
      logger.error(`Failed to deactivate security policy ${policyId}:`, error);
      throw error;
    }
  }

  /**
   * Approve security policy
   */
  async approvePolicy(policyId: string, approvedBy: string): Promise<void> {
    try {
      const policy = this.policies.get(policyId);
      if (!policy) {
        throw new Error(`Security policy ${policyId} not found`);
      }

      const now = new Date();
      policy.approvedBy = approvedBy;
      policy.approvedAt = now;
      policy.updatedAt = now;
      policy.auditTrail.push({
        id: uuidv4(),
        timestamp: now,
        action: 'approved',
        performedBy: approvedBy,
        details: { policyVersion: policy.version }
      });

      logger.info(`Approved security policy ${policyId}`, {
        policyId,
        approvedBy
      });
    } catch (error) {
      logger.error(`Failed to approve security policy ${policyId}:`, error);
      throw error;
    }
  }

  /**
   * Evaluate a single policy against context
   */
  async evaluatePolicy(policyId: string, context: EvaluationContext): Promise<PolicyEvaluationResult> {
    try {
      const startTime = Date.now();
      
      // Check cache
      const cacheKey = `${policyId}-${JSON.stringify(context)}`;
      const cached = this.policyEvaluationCache.get(cacheKey);
      if (cached && Date.now() - cached.evaluatedAt.getTime() < this.CACHE_TTL) {
        return cached;
      }

      const policy = this.policies.get(policyId);
      if (!policy) {
        throw new Error(`Security policy ${policyId} not found`);
      }

      if (!policy.enabled || policy.status !== 'active') {
        return {
          policyId,
          passed: true,
          violations: [],
          score: 100,
          evaluatedAt: new Date(),
          evaluationTime: Date.now() - startTime
        };
      }

      const violations: SecurityViolation[] = [];
      let totalRules = policy.rules.length;
      let passedRules = 0;

      // Evaluate each rule
      for (const rule of policy.rules) {
        if (!rule.enabled) {
          totalRules--;
          continue;
        }

        const ruleResult = await this.evaluateRule(rule, context, policy);
        if (ruleResult.passed) {
          passedRules++;
        } else {
          violations.push(...ruleResult.violations);
        }
      }

      const score = totalRules > 0 ? (passedRules / totalRules) * 100 : 100;
      const result: PolicyEvaluationResult = {
        policyId,
        passed: violations.length === 0,
        violations,
        score,
        evaluatedAt: new Date(),
        evaluationTime: Date.now() - startTime
      };

      // Cache result
      this.policyEvaluationCache.set(cacheKey, result);

      logger.debug(`Evaluated policy ${policyId}`, {
        policyId,
        passed: result.passed,
        violationsCount: violations.length,
        score: result.score,
        evaluationTime: result.evaluationTime
      });

      return result;
    } catch (error) {
      logger.error(`Failed to evaluate policy ${policyId}:`, error);
      throw error;
    }
  }

  /**
   * Evaluate all active policies against context
   */
  async evaluateAllPolicies(context: EvaluationContext): Promise<PolicyEvaluationResult[]> {
    try {
      const activePolicies = Array.from(this.policies.values())
        .filter(p => p.enabled && p.status === 'active');

      const results = await Promise.all(
        activePolicies.map(policy => this.evaluatePolicy(policy.id, context))
      );

      logger.info(`Evaluated ${activePolicies.length} policies`, {
        organizationId: context.organizationId,
        totalViolations: results.reduce((sum, r) => sum + r.violations.length, 0),
        averageScore: results.reduce((sum, r) => sum + r.score, 0) / results.length
      });

      return results;
    } catch (error) {
      logger.error('Failed to evaluate all policies:', error);
      throw error;
    }
  }

  /**
   * Import policies from external source
   */
  async importPolicies(policies: SecurityPolicy[], organizationId: string): Promise<ImportResult> {
    const result: ImportResult = {
      imported: 0,
      failed: 0,
      errors: []
    };

    for (const policy of policies) {
      try {
        await this.createPolicy({
          ...policy,
          createdBy: 'import-system',
          updatedBy: 'import-system'
        });
        result.imported++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          policyName: policy.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    logger.info(`Imported policies for organization ${organizationId}`, {
      organizationId,
      imported: result.imported,
      failed: result.failed
    });

    return result;
  }

  /**
   * Export policies to specified format
   */
  async exportPolicies(organizationId: string, format: 'json' | 'yaml' | 'csv'): Promise<string> {
    try {
      const policies = await this.getPolicies(organizationId);

      switch (format) {
        case 'json':
          return JSON.stringify(policies, null, 2);
        case 'yaml':
          // In a real implementation, use a YAML library
          return JSON.stringify(policies, null, 2); // Placeholder
        case 'csv':
          return this.policiesToCSV(policies);
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      logger.error(`Failed to export policies for organization ${organizationId}:`, error);
      throw error;
    }
  }

  // Private helper methods

  private async validatePolicy(policy: SecurityPolicy): Promise<string[]> {
    const errors: string[] = [];

    if (!policy.name) {
      errors.push('Policy name is required');
    }

    if (!policy.description) {
      errors.push('Policy description is required');
    }

    if (!policy.category) {
      errors.push('Policy category is required');
    }

    if (!policy.severity) {
      errors.push('Policy severity is required');
    }

    if (!policy.complianceFrameworks || policy.complianceFrameworks.length === 0) {
      errors.push('At least one compliance framework must be specified');
    }

    if (!policy.rules || policy.rules.length === 0) {
      errors.push('Policy must have at least one rule');
    }

    // Validate rules
    if (policy.rules) {
      for (let i = 0; i < policy.rules.length; i++) {
        const rule = policy.rules[i];
        const ruleErrors = this.validateRule(rule, i);
        errors.push(...ruleErrors);
      }
    }

    return errors;
  }

  private validateRule(rule: SecurityRule, index: number): string[] {
    const errors: string[] = [];
    const prefix = `Rule ${index + 1}:`;

    if (!rule.name) {
      errors.push(`${prefix} Rule name is required`);
    }

    if (!rule.ruleType) {
      errors.push(`${prefix} Rule type is required`);
    }

    if (!rule.conditions || rule.conditions.length === 0) {
      errors.push(`${prefix} Rule must have at least one condition`);
    }

    if (!rule.actions || rule.actions.length === 0) {
      errors.push(`${prefix} Rule must have at least one action`);
    }

    return errors;
  }

  private async evaluateRule(rule: SecurityRule, context: EvaluationContext, policy: SecurityPolicy): Promise<{ passed: boolean; violations: SecurityViolation[] }> {
    try {
      // Evaluate conditions - if conditions are met, it means a violation occurred
      const violationConditionsMet = await this.evaluateConditions(rule.conditions, context);
      
      if (violationConditionsMet) {
        // Create violation
        const violation: SecurityViolation = {
          id: uuidv4(),
          policyId: policy.id,
          ruleId: rule.id,
          severity: policy.severity,
          title: `${policy.name} - ${rule.name}`,
          description: rule.description,
          category: policy.category,
          resourceId: context.resourceId || '',
          resourceType: context.resourceType || '',
          organizationId: context.organizationId,
          projectId: context.projectId || '',
          environmentId: context.environmentId || '',
          status: 'open',
          detectedAt: new Date(),
          detectedBy: 'system',
          detectionMethod: 'automated',
          evidence: [],
          remediationActions: [],
          riskScore: this.calculateRiskScore(policy.severity),
          businessImpact: this.mapSeverityToBusinessImpact(policy.severity),
          complianceImpact: policy.complianceFrameworks.map(framework => ({
            framework,
            controlId: 'TBD', // Would be mapped from policy
            impactLevel: policy.severity === 'info' ? 'low' : policy.severity,
            description: `Violation of ${framework} compliance requirements`,
            requiresReporting: framework === 'SOC2' || framework === 'GDPR'
          })),
          auditTrail: [{
            id: uuidv4(),
            timestamp: new Date(),
            action: 'detected',
            performedBy: 'system',
            details: { ruleId: rule.id, policyId: policy.id }
          }]
        };

        return { passed: false, violations: [violation] };
      }

      return { passed: true, violations: [] };
    } catch (error) {
      logger.error(`Failed to evaluate rule ${rule.id}:`, error);
      return { passed: false, violations: [] };
    }
  }

  private async evaluateConditions(conditions: RuleCondition[], context: EvaluationContext): Promise<boolean> {
    if (conditions.length === 0) return true;
    if (conditions.length === 1) return this.evaluateCondition(conditions[0], context);

    // Evaluate conditions left to right with proper operator precedence
    let result = this.evaluateCondition(conditions[0], context);

    for (let i = 1; i < conditions.length; i++) {
      const condition = conditions[i];
      const conditionResult = this.evaluateCondition(condition, context);
      
      // The logical operator on the current condition determines how it combines with the previous result
      const operator = condition.logicalOperator || 'AND';
      
      if (operator === 'AND') {
        result = result && conditionResult;
      } else { // OR
        result = result || conditionResult;
      }
    }

    return result;
  }

  private evaluateCondition(condition: RuleCondition, context: EvaluationContext): boolean {
    const contextValue = this.getContextValue(condition.field, context);
    
    switch (condition.operator) {
      case 'equals':
        return contextValue === condition.value;
      case 'not_equals':
        return contextValue !== condition.value;
      case 'contains':
        return String(contextValue).includes(String(condition.value));
      case 'not_contains':
        return !String(contextValue).includes(String(condition.value));
      case 'regex':
        return new RegExp(condition.value).test(String(contextValue));
      case 'exists':
        return contextValue !== undefined && contextValue !== null;
      case 'not_exists':
        return contextValue === undefined || contextValue === null;
      case 'greater_than':
        return Number(contextValue) > Number(condition.value);
      case 'less_than':
        return Number(contextValue) < Number(condition.value);
      default:
        return false;
    }
  }

  private getContextValue(field: string, context: EvaluationContext): any {
    const fieldParts = field.split('.');
    
    // First try to get from metadata if it exists
    if (context.metadata) {
      let value: any = context.metadata;
      let found = true;
      
      for (const part of fieldParts) {
        if (value && typeof value === 'object' && part in value) {
          value = value[part];
        } else {
          found = false;
          break;
        }
      }
      
      if (found) {
        return value;
      }
    }
    
    // Fallback to direct context access
    let value: any = context;
    for (const part of fieldParts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  private calculateRiskScore(severity: SecuritySeverity): number {
    const scoreMap = {
      critical: 90,
      high: 70,
      medium: 50,
      low: 30,
      info: 10
    };
    return scoreMap[severity] || 50;
  }

  private mapSeverityToBusinessImpact(severity: SecuritySeverity): 'critical' | 'high' | 'medium' | 'low' {
    const impactMap = {
      critical: 'critical' as const,
      high: 'high' as const,
      medium: 'medium' as const,
      low: 'low' as const,
      info: 'low' as const
    };
    return impactMap[severity] || 'medium';
  }

  private clearPolicyCache(policyId: string): void {
    const keysToDelete = Array.from(this.policyEvaluationCache.keys())
      .filter(key => key.startsWith(policyId));
    
    keysToDelete.forEach(key => this.policyEvaluationCache.delete(key));
  }

  private policiesToCSV(policies: SecurityPolicy[]): string {
    const headers = ['ID', 'Name', 'Category', 'Severity', 'Status', 'Enabled', 'Frameworks', 'Created At'];
    const rows = policies.map(p => [
      p.id,
      p.name,
      p.category,
      p.severity,
      p.status,
      p.enabled.toString(),
      p.complianceFrameworks.join(';'),
      p.createdAt.toISOString()
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private initializeDefaultPolicies(): void {
    // Initialize with enterprise-grade default policies for SOC 2 and GDPR
    const defaultPolicies = this.getDefaultSecurityPolicies();
    
    defaultPolicies.forEach(policy => {
      this.policies.set(policy.id, policy);
    });

    logger.info(`Initialized ${defaultPolicies.length} default security policies`);
  }

  private getDefaultSecurityPolicies(): SecurityPolicy[] {
    const now = new Date();
    
    return [
      // SOC 2 - Access Control Policy
      {
        id: 'soc2-access-control',
        name: 'SOC 2 Access Control Policy',
        description: 'Ensures proper access controls are in place for SOC 2 compliance',
        category: 'Access Control',
        severity: 'critical',
        complianceFrameworks: ['SOC2'],
        status: 'active',
        version: '1.0',
        rules: [
          {
            id: 'soc2-mfa-required',
            name: 'Multi-Factor Authentication Required',
            description: 'All user accounts must have MFA enabled',
            ruleType: 'access',
            conditions: [
              {
                field: 'user.mfaEnabled',
                operator: 'equals',
                value: false
              }
            ],
            actions: [
              {
                type: 'block',
                parameters: { message: 'MFA is required for access' },
                priority: 1
              }
            ],
            evaluationFrequency: '0 */6 * * *', // Every 6 hours
            enabled: true,
            priority: 1,
            tags: ['soc2', 'mfa', 'access']
          }
        ],
        controlMappings: [
          {
            framework: 'SOC2',
            controlId: 'CC6.1',
            controlName: 'Logical and Physical Access Controls',
            controlDescription: 'The entity implements logical access security software, infrastructure, and architectures over protected information assets to protect them from security events to meet the entity\'s objectives.',
            requirementLevel: 'mandatory',
            implementationStatus: 'implemented',
            evidenceRequired: true
          }
        ],
        createdBy: 'system',
        createdAt: now,
        updatedBy: 'system',
        updatedAt: now,
        enabled: true,
        enforcementMode: 'enforce',
        autoRemediation: false,
        notificationChannels: [],
        auditTrail: []
      },

      // GDPR - Data Protection Policy
      {
        id: 'gdpr-data-protection',
        name: 'GDPR Data Protection Policy',
        description: 'Ensures personal data is processed in compliance with GDPR requirements',
        category: 'Data Protection',
        severity: 'critical',
        complianceFrameworks: ['GDPR'],
        status: 'active',
        version: '1.0',
        rules: [
          {
            id: 'gdpr-data-encryption',
            name: 'Personal Data Encryption',
            description: 'All personal data must be encrypted at rest and in transit',
            ruleType: 'encryption',
            conditions: [
              {
                field: 'data.containsPII',
                operator: 'equals',
                value: true
              },
              {
                field: 'data.encrypted',
                operator: 'equals',
                value: false,
                logicalOperator: 'AND'
              }
            ],
            actions: [
              {
                type: 'alert',
                parameters: { 
                  severity: 'critical',
                  message: 'Unencrypted personal data detected - GDPR violation'
                },
                priority: 1
              }
            ],
            evaluationFrequency: '0 */1 * * *', // Every hour
            enabled: true,
            priority: 1,
            tags: ['gdpr', 'encryption', 'pii']
          }
        ],
        controlMappings: [
          {
            framework: 'GDPR',
            controlId: 'Art32',
            controlName: 'Security of Processing',
            controlDescription: 'Taking into account the state of the art, the costs of implementation and the nature, scope, context and purposes of processing as well as the risk of varying likelihood and severity for the rights and freedoms of natural persons, the controller and the processor shall implement appropriate technical and organisational measures to ensure a level of security appropriate to the risk.',
            requirementLevel: 'mandatory',
            implementationStatus: 'implemented',
            evidenceRequired: true
          }
        ],
        createdBy: 'system',
        createdAt: now,
        updatedBy: 'system',
        updatedAt: now,
        enabled: true,
        enforcementMode: 'enforce',
        autoRemediation: true,
        notificationChannels: [],
        auditTrail: []
      }
    ];
  }
}