/**
 * Tests for ComplianceValidationService
 */

import { ComplianceValidationService } from './ComplianceValidationService';
import { SecurityPolicyEngine } from './SecurityPolicyEngine';
import { ComplianceManager } from './ComplianceManager';
import { DataClassificationService } from './DataClassificationService';
import {
  ResourceValidationContext,
  ValidationOptions,
  ComplianceValidationResult,
  ValidationSeverity
} from './interfaces';

// Mock dependencies
jest.mock('./SecurityPolicyEngine');
jest.mock('./ComplianceManager');
jest.mock('./DataClassificationService');

describe('ComplianceValidationService', () => {
  let validationService: ComplianceValidationService;
  let mockPolicyEngine: jest.Mocked<SecurityPolicyEngine>;
  let mockComplianceManager: jest.Mocked<ComplianceManager>;
  let mockDataClassificationService: jest.Mocked<DataClassificationService>;

  beforeEach(() => {
    mockPolicyEngine = new SecurityPolicyEngine() as jest.Mocked<SecurityPolicyEngine>;
    mockComplianceManager = new ComplianceManager() as jest.Mocked<ComplianceManager>;
    mockDataClassificationService = new DataClassificationService() as jest.Mocked<DataClassificationService>;

    validationService = new ComplianceValidationService(
      mockPolicyEngine,
      mockComplianceManager,
      mockDataClassificationService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateResource', () => {
    const mockContext: ResourceValidationContext = {
      organizationId: 'org-123',
      projectId: 'project-456',
      environmentId: 'env-789',
      userId: 'user-123',
      metadata: { source: 'test' }
    };

    it('should validate a compliant resource successfully', async () => {
      // Mock policy engine to return no violations
      mockPolicyEngine.evaluateAllPolicies.mockResolvedValue([
        {
          policyId: 'policy-1',
          passed: true,
          violations: [],
          evaluationTime: 50,
          metadata: {}
        }
      ]);

      const result = await validationService.validateResource(
        'resource-123',
        'database',
        mockContext
      );

      expect(result).toMatchObject({
        resourceId: 'resource-123',
        resourceType: 'database',
        organizationId: 'org-123',
        compliant: true,
        violations: [],
        score: 100
      });

      expect(mockPolicyEngine.evaluateAllPolicies).toHaveBeenCalledWith({
        organizationId: 'org-123',
        projectId: 'project-456',
        environmentId: 'env-789',
        resourceId: 'resource-123',
        resourceType: 'database',
        userId: 'user-123',
        metadata: { source: 'test' }
      });
    });

    it('should detect and report compliance violations', async () => {
      // Mock policy engine to return violations
      mockPolicyEngine.evaluateAllPolicies.mockResolvedValue([
        {
          policyId: 'policy-1',
          passed: false,
          violations: [
            {
              id: 'violation-1',
              policyId: 'policy-1',
              ruleId: 'rule-1',
              severity: 'high' as ValidationSeverity,
              title: 'Missing Encryption',
              description: 'Database is not encrypted',
              complianceImpact: [
                { framework: 'GDPR', requirement: 'Article 32' }
              ],
              auditTrail: [
                {
                  timestamp: new Date(),
                  action: 'violation_detected',
                  userId: 'system',
                  details: { reason: 'encryption_missing' }
                }
              ]
            }
          ],
          evaluationTime: 75,
          metadata: {}
        }
      ]);

      const result = await validationService.validateResource(
        'resource-123',
        'database',
        mockContext
      );

      expect(result.compliant).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0]).toMatchObject({
        policyId: 'policy-1',
        ruleId: 'rule-1',
        severity: 'high',
        title: 'Missing Encryption',
        resourceId: 'resource-123',
        resourceType: 'database',
        frameworks: ['GDPR']
      });
      expect(result.score).toBeLessThan(100);
    });

    it('should validate data classification when enabled', async () => {
      // Mock policy engine to return no violations
      mockPolicyEngine.evaluateAllPolicies.mockResolvedValue([]);

      // Mock data classification service
      mockDataClassificationService.getClassification.mockResolvedValue({
        resourceId: 'resource-123',
        classification: 'confidential',
        containsPII: true,
        piiTypes: ['email', 'name'],
        dataSubjects: ['customer'],
        accessRestrictions: [],
        retentionPeriod: undefined, // Missing retention policy
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const options: ValidationOptions = {
        validateDataClassification: true
      };

      const result = await validationService.validateResource(
        'resource-123',
        'database',
        mockContext,
        options
      );

      expect(result.compliant).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      
      // Should have violations for missing retention policy and unprotected PII
      const retentionViolation = result.violations.find(v => v.ruleId === 'missing-retention');
      const piiViolation = result.violations.find(v => v.ruleId === 'unprotected-pii');
      
      expect(retentionViolation).toBeDefined();
      expect(piiViolation).toBeDefined();
    });

    it('should use cache when available and not expired', async () => {
      // First call
      mockPolicyEngine.evaluateAllPolicies.mockResolvedValue([]);
      
      const result1 = await validationService.validateResource(
        'resource-123',
        'database',
        mockContext
      );

      // Second call should use cache
      const result2 = await validationService.validateResource(
        'resource-123',
        'database',
        mockContext
      );

      expect(mockPolicyEngine.evaluateAllPolicies).toHaveBeenCalledTimes(1);
      expect(result1.id).toBe(result2.id); // Same cached result
    });

    it('should skip cache when requested', async () => {
      mockPolicyEngine.evaluateAllPolicies.mockResolvedValue([]);
      
      const options: ValidationOptions = {
        skipCache: true
      };

      await validationService.validateResource('resource-123', 'database', mockContext, options);
      await validationService.validateResource('resource-123', 'database', mockContext, options);

      expect(mockPolicyEngine.evaluateAllPolicies).toHaveBeenCalledTimes(2);
    });

    it('should execute enforcement actions when enabled', async () => {
      // Mock policy engine to return violations with enforcement actions
      mockPolicyEngine.evaluateAllPolicies.mockResolvedValue([
        {
          policyId: 'policy-1',
          passed: false,
          violations: [
            {
              id: 'violation-1',
              policyId: 'policy-1',
              ruleId: 'rule-1',
              severity: 'critical' as ValidationSeverity,
              title: 'Critical Security Issue',
              description: 'Critical security violation detected',
              complianceImpact: [
                { framework: 'SOC2', requirement: 'CC6.1' }
              ],
              auditTrail: [
                {
                  timestamp: new Date(),
                  action: 'violation_detected',
                  userId: 'system',
                  details: {}
                }
              ]
            }
          ],
          evaluationTime: 100,
          metadata: {}
        }
      ]);

      const result = await validationService.validateResource(
        'resource-123',
        'database',
        mockContext,
        { enforcementEnabled: true }
      );

      expect(result.enforcementEnabled).toBe(true);
      expect(result.violations[0].enforcementActions.length).toBeGreaterThan(0);
      
      // Should have blocking action for critical violations
      const blockAction = result.violations[0].enforcementActions.find(a => a.type === 'block');
      expect(blockAction).toBeDefined();
    });

    it('should calculate compliance score correctly', async () => {
      // Mock multiple violations with different severities
      mockPolicyEngine.evaluateAllPolicies.mockResolvedValue([
        {
          policyId: 'policy-1',
          passed: false,
          violations: [
            {
              id: 'violation-1',
              policyId: 'policy-1',
              ruleId: 'rule-1',
              severity: 'critical' as ValidationSeverity,
              title: 'Critical Issue',
              description: 'Critical violation',
              complianceImpact: [],
              auditTrail: []
            },
            {
              id: 'violation-2',
              policyId: 'policy-1',
              ruleId: 'rule-2',
              severity: 'medium' as ValidationSeverity,
              title: 'Medium Issue',
              description: 'Medium violation',
              complianceImpact: [],
              auditTrail: []
            }
          ],
          evaluationTime: 100,
          metadata: {}
        }
      ]);

      const result = await validationService.validateResource(
        'resource-123',
        'database',
        mockContext
      );

      // Score should be reduced based on violation severities
      // Critical = 30 points, Medium = 7 points, so score should be 100 - 37 = 63
      expect(result.score).toBe(63);
    });
  });

  describe('validateResources', () => {
    const mockContext: ResourceValidationContext = {
      organizationId: 'org-123',
      userId: 'user-123'
    };

    it('should validate multiple resources in batch', async () => {
      mockPolicyEngine.evaluateAllPolicies.mockResolvedValue([]);

      const resources = [
        { id: 'resource-1', type: 'database' },
        { id: 'resource-2', type: 'storage' },
        { id: 'resource-3', type: 'api' }
      ];

      const results = await validationService.validateResources(
        resources,
        mockContext
      );

      expect(results).toHaveLength(3);
      expect(mockPolicyEngine.evaluateAllPolicies).toHaveBeenCalledTimes(3);
      
      results.forEach((result, index) => {
        expect(result.resourceId).toBe(resources[index].id);
        expect(result.resourceType).toBe(resources[index].type);
      });
    });

    it('should continue validation even if one resource fails', async () => {
      mockPolicyEngine.evaluateAllPolicies
        .mockResolvedValueOnce([]) // First resource succeeds
        .mockRejectedValueOnce(new Error('Validation failed')) // Second resource fails
        .mockResolvedValueOnce([]); // Third resource succeeds

      const resources = [
        { id: 'resource-1', type: 'database' },
        { id: 'resource-2', type: 'storage' },
        { id: 'resource-3', type: 'api' }
      ];

      const results = await validationService.validateResources(
        resources,
        mockContext
      );

      // Should have results for resources 1 and 3 (resource 2 failed)
      expect(results).toHaveLength(2);
      expect(results[0].resourceId).toBe('resource-1');
      expect(results[1].resourceId).toBe('resource-3');
    });
  });

  describe('getValidationStatistics', () => {
    beforeEach(() => {
      // Add some mock validation history
      const mockValidations: ComplianceValidationResult[] = [
        {
          id: 'val-1',
          resourceId: 'resource-1',
          resourceType: 'database',
          organizationId: 'org-123',
          timestamp: new Date(),
          compliant: true,
          violations: [],
          validationTime: 50,
          validatedBy: 'user-1',
          validationMode: 'standard',
          enforcementEnabled: true,
          score: 100,
          metadata: {}
        },
        {
          id: 'val-2',
          resourceId: 'resource-2',
          resourceType: 'storage',
          organizationId: 'org-123',
          timestamp: new Date(),
          compliant: false,
          violations: [
            {
              id: 'violation-1',
              policyId: 'policy-1',
              ruleId: 'rule-1',
              severity: 'high',
              title: 'High Severity Issue',
              description: 'High severity violation',
              resourceId: 'resource-2',
              resourceType: 'storage',
              frameworks: ['GDPR', 'SOC2'],
              remediationSteps: [],
              enforcementActions: [],
              metadata: {}
            }
          ],
          validationTime: 75,
          validatedBy: 'user-2',
          validationMode: 'standard',
          enforcementEnabled: true,
          score: 85,
          metadata: {}
        }
      ];

      // Mock the validation history
      (validationService as any).validationHistory = mockValidations;
    });

    it('should calculate validation statistics correctly', async () => {
      const stats = await validationService.getValidationStatistics('org-123');

      expect(stats).toMatchObject({
        organizationId: 'org-123',
        totalValidations: 2,
        compliantCount: 1,
        nonCompliantCount: 1,
        complianceRate: 50,
        averageScore: 92.5
      });

      expect(stats.violationsBySeverity.high).toBe(1);
      expect(stats.violationsByFramework.GDPR).toBe(1);
      expect(stats.violationsByFramework.SOC2).toBe(1);
      expect(stats.violationsByResourceType.storage).toBe(1);
    });

    it('should filter by time range when provided', async () => {
      const timeRange = {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
        end: new Date()
      };

      const stats = await validationService.getValidationStatistics('org-123', timeRange);

      expect(stats.timeRange).toEqual(timeRange);
      // Should still include both validations as they're recent
      expect(stats.totalValidations).toBe(2);
    });

    it('should return empty statistics for organization with no validations', async () => {
      const stats = await validationService.getValidationStatistics('org-999');

      expect(stats).toMatchObject({
        organizationId: 'org-999',
        totalValidations: 0,
        compliantCount: 0,
        nonCompliantCount: 0,
        complianceRate: 100,
        averageScore: 100
      });
    });
  });

  describe('cache management', () => {
    const mockContext: ResourceValidationContext = {
      organizationId: 'org-123',
      userId: 'user-123'
    };

    it('should clear resource cache correctly', async () => {
      mockPolicyEngine.evaluateAllPolicies.mockResolvedValue([]);

      // Create cached entry
      await validationService.validateResource('resource-123', 'database', mockContext);
      
      // Clear cache for the resource
      validationService.clearResourceCache('resource-123');

      // Next validation should call policy engine again (not use cache)
      await validationService.validateResource('resource-123', 'database', mockContext);

      expect(mockPolicyEngine.evaluateAllPolicies).toHaveBeenCalledTimes(2);
    });

    it('should clear all cache correctly', async () => {
      mockPolicyEngine.evaluateAllPolicies.mockResolvedValue([]);

      // Create multiple cached entries
      await validationService.validateResource('resource-1', 'database', mockContext);
      await validationService.validateResource('resource-2', 'storage', mockContext);
      
      // Clear all cache
      validationService.clearAllCache();

      // Next validations should call policy engine again
      await validationService.validateResource('resource-1', 'database', mockContext);
      await validationService.validateResource('resource-2', 'storage', mockContext);

      expect(mockPolicyEngine.evaluateAllPolicies).toHaveBeenCalledTimes(4);
    });
  });

  describe('error handling', () => {
    const mockContext: ResourceValidationContext = {
      organizationId: 'org-123',
      userId: 'user-123'
    };

    it('should handle policy engine errors gracefully', async () => {
      mockPolicyEngine.evaluateAllPolicies.mockRejectedValue(new Error('Policy engine error'));

      await expect(
        validationService.validateResource('resource-123', 'database', mockContext)
      ).rejects.toThrow('Policy engine error');
    });

    it('should handle data classification service errors gracefully', async () => {
      mockPolicyEngine.evaluateAllPolicies.mockResolvedValue([]);
      mockDataClassificationService.getClassification.mockRejectedValue(
        new Error('Classification service error')
      );

      const options: ValidationOptions = {
        validateDataClassification: true
      };

      // Should not throw error, but should not include data classification violations
      const result = await validationService.validateResource(
        'resource-123',
        'database',
        mockContext,
        options
      );

      expect(result.compliant).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });
});