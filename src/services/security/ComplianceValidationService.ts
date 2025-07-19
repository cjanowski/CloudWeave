/**
 * Compliance Validation Service
 * Validates and enforces compliance with security policies and regulatory frameworks
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';
import { SecurityPolicyEngine } from './SecurityPolicyEngine';
import { ComplianceManager } from './ComplianceManager';
import { DataClassificationService } from './DataClassificationService';
import {
  ComplianceValidationResult,
  ResourceValidationContext,
  ValidationSeverity,
  ComplianceViolation,
  EnforcementAction,
  ValidationOptions,
  ComplianceFramework,
  ValidationStatistics
} from './interfaces';

/**
 * Service for validating and enforcing compliance with security policies
 * Provides real-time validation, remediation recommendations, and enforcement actions
 */
export class ComplianceValidationService {
  private validationCache: Map<string, ComplianceValidationResult> = new Map();
  private readonly CACHE_TTL = 300000; // 5 minutes
  private validationHistory: ComplianceValidationResult[] = [];
  private readonly MAX_HISTORY_SIZE = 1000;

  constructor(
    private policyEngine: SecurityPolicyEngine,
    private complianceManager: ComplianceManager,
    private dataClassificationService: DataClassificationService
  ) {}

  /**
   * Validate a resource against applicable security policies and compliance frameworks
   */
  async validateResource(
    resourceId: string,
    resourceType: string,
    context: ResourceValidationContext,
    options: ValidationOptions = {}
  ): Promise<ComplianceValidationResult> {
    try {
      const validationId = uuidv4();
      const startTime = Date.now();
      const cacheKey = this.generateCacheKey(resourceId, resourceType, context);

      // Check cache if caching is enabled
      if (!options.skipCache) {
        const cachedResult = this.validationCache.get(cacheKey);
        if (cachedResult && Date.now() - cachedResult.timestamp.getTime() < this.CACHE_TTL) {
          return cachedResult;
        }
      }

      // Prepare evaluation context
      const evaluationContext = {
        organizationId: context.organizationId,
        projectId: context.projectId,
        environmentId: context.environmentId,
        resourceId,
        resourceType,
        userId: context.userId,
        metadata: context.metadata || {}
      };

      // Evaluate all applicable policies
      const policyResults = await this.policyEngine.evaluateAllPolicies(evaluationContext);

      // Collect violations
      const violations: ComplianceViolation[] = [];
      let compliant = true;

      for (const result of policyResults) {
        if (!result.passed) {
          compliant = false;
          for (const violation of result.violations) {
            violations.push({
              id: violation.id,
              policyId: violation.policyId,
              ruleId: violation.ruleId,
              severity: violation.severity as ValidationSeverity,
              title: violation.title,
              description: violation.description,
              resourceId,
              resourceType,
              frameworks: this.getViolationFrameworks(violation),
              remediationSteps: this.generateRemediationSteps(violation, resourceType),
              enforcementActions: this.determineEnforcementActions(violation, options),
              metadata: violation.auditTrail[0]?.details || {}
            });
          }
        }
      }

      // Check for data classification requirements if applicable
      if (options.validateDataClassification) {
        const classificationViolations = await this.validateDataClassification(resourceId, resourceType, context);
        if (classificationViolations.length > 0) {
          violations.push(...classificationViolations);
          compliant = false;
        }
      }

      // Generate validation result
      const validationResult: ComplianceValidationResult = {
        id: validationId,
        resourceId,
        resourceType,
        organizationId: context.organizationId,
        projectId: context.projectId,
        environmentId: context.environmentId,
        timestamp: new Date(),
        compliant,
        violations,
        validationTime: Date.now() - startTime,
        validatedBy: context.userId || 'system',
        validationMode: options.validationMode || 'standard',
        enforcementEnabled: options.enforcementEnabled !== false,
        score: this.calculateComplianceScore(violations),
        metadata: context.metadata || {}
      };

      // Cache result
      this.validationCache.set(cacheKey, validationResult);

      // Add to history
      this.validationHistory.push(validationResult);
      this.trimValidationHistory();

      // Execute enforcement actions if enabled
      if (options.enforcementEnabled !== false && violations.length > 0) {
        await this.enforceCompliance(validationResult);
      }

      logger.info(`Validated resource ${resourceId} (${resourceType})`, {
        resourceId,
        resourceType,
        organizationId: context.organizationId,
        compliant,
        violationsCount: violations.length,
        score: validationResult.score,
        validationTime: validationResult.validationTime
      });

      return validationResult;
    } catch (error) {
      logger.error(`Failed to validate resource ${resourceId}:`, error);
      throw error;
    }
  }

  /**
   * Validate multiple resources in batch
   */
  async validateResources(
    resources: Array<{ id: string; type: string }>,
    context: ResourceValidationContext,
    options: ValidationOptions = {}
  ): Promise<ComplianceValidationResult[]> {
    try {
      const results: ComplianceValidationResult[] = [];

      for (const resource of resources) {
        try {
          const result = await this.validateResource(resource.id, resource.type, context, options);
          results.push(result);
        } catch (error) {
          logger.error(`Failed to validate resource ${resource.id}:`, error);
          // Continue with other resources even if one fails
        }
      }

      logger.info(`Validated ${results.length} resources in batch`, {
        organizationId: context.organizationId,
        resourceCount: resources.length,
        compliantCount: results.filter(r => r.compliant).length,
        nonCompliantCount: results.filter(r => !r.compliant).length
      });

      return results;
    } catch (error) {
      logger.error('Failed to validate resources in batch:', error);
      throw error;
    }
  }

  /**
   * Get validation history for a resource
   */
  async getResourceValidationHistory(
    resourceId: string,
    limit: number = 10
  ): Promise<ComplianceValidationResult[]> {
    const history = this.validationHistory
      .filter(result => result.resourceId === resourceId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);

    return history;
  }

  /**
   * Get validation statistics
   */
  async getValidationStatistics(
    organizationId: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<ValidationStatistics> {
    try {
      // Filter validations by organization and time range
      let validations = this.validationHistory.filter(v => v.organizationId === organizationId);

      if (timeRange) {
        validations = validations.filter(
          v => v.timestamp >= timeRange.start && v.timestamp <= timeRange.end
        );
      }

      // Calculate statistics
      const totalValidations = validations.length;
      const compliantCount = validations.filter(v => v.compliant).length;
      const nonCompliantCount = validations.filter(v => !v.compliant).length;
      const complianceRate = totalValidations > 0 ? (compliantCount / totalValidations) * 100 : 100;

      // Count violations by severity
      const violationsBySeverity: Record<ValidationSeverity, number> = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        info: 0
      };

      // Count violations by framework
      const violationsByFramework: Record<string, number> = {};

      // Count violations by resource type
      const violationsByResourceType: Record<string, number> = {};

      // Process all violations
      for (const validation of validations) {
        for (const violation of validation.violations) {
          // Count by severity
          violationsBySeverity[violation.severity]++;

          // Count by framework
          for (const framework of violation.frameworks) {
            if (!violationsByFramework[framework]) {
              violationsByFramework[framework] = 0;
            }
            violationsByFramework[framework]++;
          }

          // Count by resource type
          if (!violationsByResourceType[validation.resourceType]) {
            violationsByResourceType[validation.resourceType] = 0;
          }
          violationsByResourceType[validation.resourceType]++;
        }
      }

      // Calculate average compliance score
      const averageScore = validations.length > 0
        ? validations.reduce((sum, v) => sum + v.score, 0) / validations.length
        : 100;

      return {
        organizationId,
        timeRange,
        totalValidations,
        compliantCount,
        nonCompliantCount,
        complianceRate,
        violationsBySeverity,
        violationsByFramework,
        violationsByResourceType,
        averageScore,
        lastUpdated: new Date()
      };
    } catch (error) {
      logger.error(`Failed to get validation statistics for organization ${organizationId}:`, error);
      throw error;
    }
  }

  /**
   * Clear validation cache for a resource
   */
  clearResourceCache(resourceId: string): void {
    const keysToDelete = Array.from(this.validationCache.keys())
      .filter(key => key.includes(resourceId));

    keysToDelete.forEach(key => this.validationCache.delete(key));

    logger.debug(`Cleared validation cache for resource ${resourceId}`, {
      resourceId,
      entriesCleared: keysToDelete.length
    });
  }

  /**
   * Clear all validation cache
   */
  clearAllCache(): void {
    const count = this.validationCache.size;
    this.validationCache.clear();

    logger.info(`Cleared all validation cache entries`, {
      entriesCleared: count
    });
  }

  /**
   * Enforce compliance based on validation result
   */
  private async enforceCompliance(validationResult: ComplianceValidationResult): Promise<void> {
    try {
      if (validationResult.compliant) return;

      const criticalViolations = validationResult.violations.filter(v => v.severity === 'critical');
      const highViolations = validationResult.violations.filter(v => v.severity === 'high');

      // Log enforcement actions
      logger.info(`Enforcing compliance for resource ${validationResult.resourceId}`, {
        resourceId: validationResult.resourceId,
        resourceType: validationResult.resourceType,
        criticalViolations: criticalViolations.length,
        highViolations: highViolations.length
      });

      // Execute enforcement actions
      for (const violation of validationResult.violations) {
        for (const action of violation.enforcementActions) {
          await this.executeEnforcementAction(action, validationResult, violation);
        }
      }
    } catch (error) {
      logger.error(`Failed to enforce compliance for resource ${validationResult.resourceId}:`, error);
    }
  }

  /**
   * Execute a specific enforcement action
   */
  private async executeEnforcementAction(
    action: EnforcementAction,
    validationResult: ComplianceValidationResult,
    violation: ComplianceViolation
  ): Promise<void> {
    try {
      switch (action.type) {
        case 'block':
          logger.warn(`Blocking operation on resource ${validationResult.resourceId} due to compliance violation`, {
            resourceId: validationResult.resourceId,
            violationId: violation.id,
            policyId: violation.policyId,
            severity: violation.severity
          });
          break;

        case 'notify':
          logger.info(`Sending compliance violation notification for resource ${validationResult.resourceId}`, {
            resourceId: validationResult.resourceId,
            violationId: violation.id,
            recipients: action.parameters.recipients,
            channels: action.parameters.channels
          });
          break;

        case 'tag':
          logger.info(`Tagging resource ${validationResult.resourceId} for compliance violation`, {
            resourceId: validationResult.resourceId,
            violationId: violation.id,
            tags: action.parameters.tags
          });
          break;

        case 'quarantine':
          logger.warn(`Quarantining resource ${validationResult.resourceId} due to compliance violation`, {
            resourceId: validationResult.resourceId,
            violationId: violation.id,
            policyId: violation.policyId,
            severity: violation.severity
          });
          break;

        case 'remediate':
          if (action.parameters.autoRemediate) {
            logger.info(`Auto-remediating compliance violation for resource ${validationResult.resourceId}`, {
              resourceId: validationResult.resourceId,
              violationId: violation.id,
              remediationAction: action.parameters.remediationAction
            });
          }
          break;

        default:
          logger.warn(`Unknown enforcement action type: ${(action as any).type}`);
      }
    } catch (error) {
      logger.error(`Failed to execute enforcement action for resource ${validationResult.resourceId}:`, error);
    }
  }

  /**
   * Validate data classification requirements
   */
  private async validateDataClassification(
    resourceId: string,
    resourceType: string,
    context: ResourceValidationContext
  ): Promise<ComplianceViolation[]> {
    try {
      const violations: ComplianceViolation[] = [];

      // Get current classification if it exists
      const classification = await this.dataClassificationService.getClassification(resourceId);

      // Check if classification is required but missing
      if (!classification && this.isClassificationRequired(resourceType)) {
        violations.push({
          id: uuidv4(),
          policyId: 'data-classification-policy',
          ruleId: 'missing-classification',
          severity: 'high',
          title: 'Missing Data Classification',
          description: `Resource ${resourceId} requires data classification but none is defined`,
          resourceId,
          resourceType,
          frameworks: ['GDPR', 'SOC2'],
          remediationSteps: [
            'Classify the resource using the data classification service',
            'Identify if the resource contains any personal or sensitive data',
            'Apply appropriate data protection controls based on classification'
          ],
          enforcementActions: [
            {
              type: 'notify',
              parameters: {
                recipients: ['security@example.com'],
                channels: ['email'],
                message: `Resource ${resourceId} is missing required data classification`
              }
            }
          ],
          metadata: {}
        });
      }

      return violations;
    } catch (error) {
      logger.error(`Failed to validate data classification for resource ${resourceId}:`, error);
      return [];
    }
  }

  /**
   * Check if classification is required for a resource type
   */
  private isClassificationRequired(resourceType: string): boolean {
    const classificationRequiredTypes = [
      'database',
      'table',
      'storage',
      'file',
      'api',
      'user-data',
      'customer-data',
      'analytics-data'
    ];

    return classificationRequiredTypes.includes(resourceType);
  }

  /**
   * Generate remediation steps for a violation
   */
  private generateRemediationSteps(violation: any, resourceType: string): string[] {
    const steps: string[] = [];

    switch (violation.ruleId) {
      case 'soc2-mfa-required':
        steps.push('Enable multi-factor authentication for all user accounts');
        steps.push('Update authentication policies to require MFA');
        steps.push('Implement MFA enforcement at the identity provider level');
        break;

      case 'gdpr-data-encryption':
        steps.push('Enable encryption for all personal data at rest');
        steps.push('Implement TLS for data in transit');
        steps.push('Verify encryption key management practices');
        break;

      default:
        steps.push('Review the policy violation details');
        steps.push('Implement required controls based on the policy requirements');
        steps.push('Validate changes and re-run compliance validation');
    }

    return steps;
  }

  /**
   * Determine enforcement actions for a violation
   */
  private determineEnforcementActions(violation: any, options: ValidationOptions): EnforcementAction[] {
    const actions: EnforcementAction[] = [];

    // If enforcement is disabled, return empty actions
    if (options.enforcementEnabled === false) {
      return [];
    }

    // Determine actions based on severity
    switch (violation.severity) {
      case 'critical':
        actions.push({
          type: 'block',
          parameters: {
            reason: `Critical compliance violation: ${violation.title}`,
            until: 'remediated'
          }
        });
        actions.push({
          type: 'notify',
          parameters: {
            recipients: ['security@example.com', 'compliance@example.com'],
            channels: ['email', 'slack'],
            message: `CRITICAL: Compliance violation detected for policy ${violation.policyId}`
          }
        });
        break;

      case 'high':
        actions.push({
          type: 'notify',
          parameters: {
            recipients: ['security@example.com'],
            channels: ['email'],
            message: `HIGH: Compliance violation detected for policy ${violation.policyId}`
          }
        });
        actions.push({
          type: 'tag',
          parameters: {
            tags: {
              'compliance-status': 'non-compliant',
              'violation-severity': 'high'
            }
          }
        });
        break;

      case 'medium':
      case 'low':
        actions.push({
          type: 'notify',
          parameters: {
            recipients: ['compliance@example.com'],
            channels: ['email'],
            message: `${violation.severity.toUpperCase()}: Compliance violation detected for policy ${violation.policyId}`
          }
        });
        break;
    }

    return actions;
  }

  /**
   * Get compliance frameworks affected by a violation
   */
  private getViolationFrameworks(violation: any): ComplianceFramework[] {
    // Extract frameworks from violation's compliance impact
    if (violation.complianceImpact && Array.isArray(violation.complianceImpact)) {
      return violation.complianceImpact.map((impact: any) => impact.framework);
    }

    // Fallback to empty array if not found
    return [];
  }

  /**
   * Calculate compliance score based on violations
   */
  private calculateComplianceScore(violations: ComplianceViolation[]): number {
    if (violations.length === 0) return 100;

    // Calculate score based on violation severity
    const severityWeights = {
      critical: 30,
      high: 15,
      medium: 7,
      low: 3,
      info: 1
    };

    // Calculate total penalty
    let totalPenalty = 0;
    for (const violation of violations) {
      totalPenalty += severityWeights[violation.severity] || 0;
    }

    // Cap the penalty at 100
    totalPenalty = Math.min(totalPenalty, 100);

    // Calculate final score
    return 100 - totalPenalty;
  }

  /**
   * Generate cache key for validation results
   */
  private generateCacheKey(resourceId: string, resourceType: string, context: ResourceValidationContext): string {
    return `${resourceId}-${resourceType}-${context.organizationId}-${context.projectId || ''}-${context.environmentId || ''}`;
  }

  /**
   * Trim validation history to prevent memory issues
   */
  private trimValidationHistory(): void {
    if (this.validationHistory.length > this.MAX_HISTORY_SIZE) {
      this.validationHistory = this.validationHistory.slice(-this.MAX_HISTORY_SIZE);
    }
  }
}