/**
 * Integration tests for compliance validation and enforcement services
 */

import { SecurityPolicyEngine } from './SecurityPolicyEngine';
import { ComplianceManager } from './ComplianceManager';
import { DataClassificationService } from './DataClassificationService';
import { ComplianceValidationService } from './ComplianceValidationService';
import { ComplianceEnforcementService } from './ComplianceEnforcementService';
import { createSecurityServices } from './index';
import {
  SecurityPolicy,
  ComplianceFramework,
  ResourceValidationContext,
  ValidationOptions
} from './interfaces';

describe('Compliance Integration Tests', () => {
  let policyEngine: SecurityPolicyEngine;
  let complianceManager: ComplianceManager;
  let dataClassificationService: DataClassificationService;
  let validationService: ComplianceValidationService;
  let enforcementService: ComplianceEnforcementService;

  beforeEach(async () => {
    const services = await createSecurityServices();
    policyEngine = services.policyEngine;
    complianceManager = services.complianceManager;
    dataClassificationService = services.dataClassificationService;
    validationService = services.validationService;
    enforcementService = services.enforcementService;
  });

  describe('End-to-End Compliance Workflow', () => {
    it('should complete a full compliance validation and enforcement workflow', async () => {
      const organizationId = 'org-123';
      const resourceId = 'database-prod-001';
      const resourceType = 'database';

      // Step 1: Set up compliance framework
      await complianceManager.addFramework({
        name: 'SOC2',
        version: '2017',
        description: 'SOC 2 Type II compliance framework',
        requirements: [
          {
            id: 'CC6.1',
            title: 'Logical and Physical Access Controls',
            description: 'The entity implements logical and physical access controls to protect against threats from sources outside its system boundaries.',
            category: 'Access Control',
            priority: 'high',
            testProcedures: [
              'Verify that multi-factor authentication is enabled',
              'Confirm that access controls are properly configured'
            ]
          }
        ],
        controls: [
          {
            id: 'SOC2-AC-001',
            title: 'Multi-Factor Authentication',
            description: 'All user accounts must have MFA enabled',
            category: 'Access Control',
            implementation: 'technical',
            frequency: 'continuous',
            evidence: ['MFA configuration screenshots', 'Authentication logs'],
            owner: 'Security Team',
            status: 'implemented'
          }
        ]
      });

      // Step 2: Create security policy
      const policy: SecurityPolicy = {
        id: 'policy-mfa-required',
        name: 'Multi-Factor Authentication Required',
        description: 'All database access must use multi-factor authentication',
        organizationId,
        category: 'Access Control',
        severity: 'critical',
        complianceFrameworks: ['SOC2'],
        enforcementMode: 'enforce',
        rules: [
          {
            id: 'rule-mfa-check',
            name: 'MFA Enabled Check',
            description: 'Verify that MFA is enabled for database access',
            ruleType: 'access',
            conditions: [
              {
                field: 'access.mfaEnabled',
                operator: 'equals',
                value: false
              }
            ],
            actions: [
              {
                type: 'alert',
                parameters: {
                  severity: 'critical',
                  message: 'Database access without MFA detected'
                },
                priority: 1
              }
            ]
          }
        ],
        metadata: {
          createdBy: 'security-admin',
          lastReviewed: new Date().toISOString()
        },
        version: '1.0',
        effectiveDate: new Date(),
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        tags: ['security', 'access-control', 'mfa'],
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await policyEngine.createPolicy(policy);

      // Step 3: Classify the resource data
      await dataClassificationService.classifyResource(resourceId, {
        classification: 'confidential',
        containsPII: true,
        piiTypes: ['email', 'name', 'phone'],
        dataSubjects: ['customer', 'employee'],
        accessRestrictions: [
          {
            type: 'role_based',
            roles: ['admin', 'developer'],
            conditions: ['mfa_required']
          }
        ],
        retentionPeriod: '7y',
        encryptionRequired: true,
        auditLevel: 'detailed'
      });

      // Step 4: Validate resource compliance
      const validationContext: ResourceValidationContext = {
        organizationId,
        projectId: 'project-123',
        environmentId: 'production',
        userId: 'security-auditor',
        metadata: {
          scanType: 'scheduled',
          scanId: 'scan-001'
        }
      };

      const validationOptions: ValidationOptions = {
        validationMode: 'strict',
        enforcementEnabled: true,
        validateDataClassification: true,
        frameworks: ['SOC2']
      };

      const validationResult = await validationService.validateResource(
        resourceId,
        resourceType,
        validationContext,
        validationOptions
      );

      // Step 5: Verify validation results
      expect(validationResult.compliant).toBe(false);
      expect(validationResult.violations.length).toBeGreaterThan(0);
      expect(validationResult.score).toBeLessThan(100);

      // Should have MFA-related violation
      const mfaViolation = validationResult.violations.find(
        v => v.title.toLowerCase().includes('mfa') || v.description.toLowerCase().includes('authentication')
      );
      expect(mfaViolation).toBeDefined();

      // Step 6: Create remediation plan
      const remediationPlan = await enforcementService.createRemediationPlan(
        validationResult.violations,
        {
          name: `Remediation Plan for ${resourceId}`,
          description: 'Address compliance violations found during security scan',
          organizationId,
          projectId: 'project-123',
          assignTo: 'security-team@example.com',
          createdBy: 'security-auditor'
        }
      );

      expect(remediationPlan.status).toBe('open');
      expect(remediationPlan.steps.length).toBeGreaterThan(0);
      expect(remediationPlan.priority).toBe('critical'); // Due to critical violations

      // Step 7: Execute enforcement actions
      const enforcementActions = validationResult.violations
        .flatMap(v => v.enforcementActions);

      if (enforcementActions.length > 0) {
        const enforcementResult = await enforcementService.executeEnforcementActions(
          enforcementActions,
          {
            resourceId,
            resourceType,
            organizationId,
            violationId: validationResult.violations[0].id,
            userId: 'security-auditor'
          }
        );

        expect(enforcementResult.success).toBe(true);
        expect(enforcementResult.actions.length).toBeGreaterThan(0);
      }

      // Step 8: Simulate remediation progress
      const firstStep = remediationPlan.steps[0];
      
      // Start working on the step
      await enforcementService.updateRemediationStep(
        remediationPlan.id,
        firstStep.id,
        {
          status: 'in_progress',
          assignedTo: 'developer@example.com',
          notes: 'Started implementing MFA for database access'
        }
      );

      // Complete the step
      await enforcementService.updateRemediationStep(
        remediationPlan.id,
        firstStep.id,
        {
          status: 'completed',
          notes: 'MFA has been enabled for all database access points'
        }
      );

      // Verify the step if required
      if (firstStep.verificationRequired) {
        await enforcementService.updateRemediationStep(
          remediationPlan.id,
          firstStep.id,
          {
            verificationResult: true,
            verifiedBy: 'security-team@example.com'
          }
        );
      }

      // Step 9: Re-validate after remediation
      // Clear cache to ensure fresh validation
      validationService.clearResourceCache(resourceId);

      // Mock the policy engine to return no violations (simulating successful remediation)
      jest.spyOn(policyEngine, 'evaluateAllPolicies').mockResolvedValue([
        {
          policyId: policy.id,
          passed: true,
          violations: [],
          evaluationTime: 25,
          metadata: { remediationApplied: true }
        }
      ]);

      const revalidationResult = await validationService.validateResource(
        resourceId,
        resourceType,
        validationContext,
        validationOptions
      );

      expect(revalidationResult.compliant).toBe(true);
      expect(revalidationResult.violations).toHaveLength(0);
      expect(revalidationResult.score).toBe(100);

      // Step 10: Verify statistics and reporting
      const validationStats = await validationService.getValidationStatistics(organizationId);
      expect(validationStats.totalValidations).toBe(2); // Initial + re-validation
      expect(validationStats.compliantCount).toBe(1); // Re-validation passed
      expect(validationStats.nonCompliantCount).toBe(1); // Initial validation failed

      const enforcementStats = await enforcementService.getEnforcementStatistics(organizationId);
      expect(enforcementStats.remediationPlans.total).toBe(1);
      expect(enforcementStats.remediationPlans.completed).toBe(1); // Plan should be completed

      // Step 11: Generate compliance report
      const complianceReport = await complianceManager.generateComplianceReport(
        organizationId,
        'SOC2',
        {
          includeEvidence: true,
          includeRemediation: true,
          format: 'json'
        }
      );

      expect(complianceReport.organizationId).toBe(organizationId);
      expect(complianceReport.framework).toBe('SOC2');
      expect(complianceReport.overallScore).toBeGreaterThan(0);
      expect(complianceReport.controlResults.length).toBeGreaterThan(0);
    });

    it('should handle multiple resources with different compliance requirements', async () => {
      const organizationId = 'org-456';
      const resources = [
        { id: 'database-001', type: 'database' },
        { id: 'storage-001', type: 'storage' },
        { id: 'api-001', type: 'api' }
      ];

      // Create different policies for different resource types
      const policies: SecurityPolicy[] = [
        {
          id: 'policy-database-encryption',
          name: 'Database Encryption Policy',
          description: 'All databases must be encrypted',
          organizationId,
          category: 'Data Protection',
          severity: 'critical',
          complianceFrameworks: ['GDPR', 'SOC2'],
          enforcementMode: 'enforce',
          rules: [
            {
              id: 'rule-db-encryption',
              name: 'Database Encryption Check',
              description: 'Verify database encryption is enabled',
              ruleType: 'encryption',
              conditions: [
                {
                  field: 'resource.type',
                  operator: 'equals',
                  value: 'database'
                },
                {
                  field: 'encryption.enabled',
                  operator: 'equals',
                  value: false,
                  logicalOperator: 'AND'
                }
              ],
              actions: [
                {
                  type: 'alert',
                  parameters: { severity: 'critical' },
                  priority: 1
                }
              ]
            }
          ],
          metadata: {},
          version: '1.0',
          effectiveDate: new Date(),
          expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          tags: ['encryption', 'database'],
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'policy-api-authentication',
          name: 'API Authentication Policy',
          description: 'All APIs must require authentication',
          organizationId,
          category: 'Access Control',
          severity: 'high',
          complianceFrameworks: ['SOC2'],
          enforcementMode: 'monitor',
          rules: [
            {
              id: 'rule-api-auth',
              name: 'API Authentication Check',
              description: 'Verify API requires authentication',
              ruleType: 'access',
              conditions: [
                {
                  field: 'resource.type',
                  operator: 'equals',
                  value: 'api'
                },
                {
                  field: 'authentication.required',
                  operator: 'equals',
                  value: false,
                  logicalOperator: 'AND'
                }
              ],
              actions: [
                {
                  type: 'alert',
                  parameters: { severity: 'high' },
                  priority: 2
                }
              ]
            }
          ],
          metadata: {},
          version: '1.0',
          effectiveDate: new Date(),
          expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          tags: ['authentication', 'api'],
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // Create policies
      for (const policy of policies) {
        await policyEngine.createPolicy(policy);
      }

      // Validate all resources
      const validationContext: ResourceValidationContext = {
        organizationId,
        userId: 'compliance-officer'
      };

      const validationResults = await validationService.validateResources(
        resources,
        validationContext,
        { enforcementEnabled: true }
      );

      expect(validationResults).toHaveLength(3);

      // Create consolidated remediation plan for all violations
      const allViolations = validationResults.flatMap(result => result.violations);
      
      if (allViolations.length > 0) {
        const consolidatedPlan = await enforcementService.createRemediationPlan(
          allViolations,
          {
            name: 'Multi-Resource Compliance Remediation',
            description: 'Address compliance violations across multiple resources',
            organizationId,
            createdBy: 'compliance-officer'
          }
        );

        expect(consolidatedPlan.resources.length).toBeGreaterThan(0);
        expect(consolidatedPlan.steps.length).toBe(allViolations.length);
        
        // Verify resources are grouped correctly
        resources.forEach(resource => {
          const hasViolations = allViolations.some(v => v.resourceId === resource.id);
          if (hasViolations) {
            expect(consolidatedPlan.resources).toContain(resource.id);
          }
        });
      }

      // Generate statistics
      const stats = await validationService.getValidationStatistics(organizationId);
      expect(stats.totalValidations).toBe(3);
      expect(stats.violationsByResourceType).toBeDefined();
    });
  });

  describe('Compliance Framework Integration', () => {
    it('should support multiple compliance frameworks simultaneously', async () => {
      const organizationId = 'org-multi-framework';

      // Add multiple frameworks
      const frameworks: Array<{ name: ComplianceFramework; requirements: any[] }> = [
        {
          name: 'SOC2',
          requirements: [
            {
              id: 'CC6.1',
              title: 'Logical and Physical Access Controls',
              description: 'Access control requirements',
              category: 'Access Control',
              priority: 'high',
              testProcedures: ['Verify MFA implementation']
            }
          ]
        },
        {
          name: 'GDPR',
          requirements: [
            {
              id: 'Art32',
              title: 'Security of Processing',
              description: 'Technical and organizational measures',
              category: 'Data Protection',
              priority: 'critical',
              testProcedures: ['Verify encryption implementation']
            }
          ]
        }
      ];

      for (const framework of frameworks) {
        await complianceManager.addFramework({
          name: framework.name,
          version: '2023',
          description: `${framework.name} compliance framework`,
          requirements: framework.requirements,
          controls: []
        });
      }

      // Create policy that applies to both frameworks
      const multiFrameworkPolicy: SecurityPolicy = {
        id: 'policy-multi-framework',
        name: 'Multi-Framework Security Policy',
        description: 'Policy that addresses both SOC2 and GDPR requirements',
        organizationId,
        category: 'Security',
        severity: 'critical',
        complianceFrameworks: ['SOC2', 'GDPR'],
        enforcementMode: 'enforce',
        rules: [
          {
            id: 'rule-comprehensive-security',
            name: 'Comprehensive Security Check',
            description: 'Check multiple security requirements',
            ruleType: 'security',
            conditions: [
              {
                field: 'security.comprehensive',
                operator: 'equals',
                value: false
              }
            ],
            actions: [
              {
                type: 'alert',
                parameters: { severity: 'critical' },
                priority: 1
              }
            ]
          }
        ],
        metadata: {},
        version: '1.0',
        effectiveDate: new Date(),
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        tags: ['multi-framework'],
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await policyEngine.createPolicy(multiFrameworkPolicy);

      // Validate resource against multiple frameworks
      const validationResult = await validationService.validateResource(
        'resource-multi',
        'database',
        { organizationId, userId: 'auditor' },
        { frameworks: ['SOC2', 'GDPR'] }
      );

      // Generate reports for both frameworks
      const soc2Report = await complianceManager.generateComplianceReport(
        organizationId,
        'SOC2'
      );

      const gdprReport = await complianceManager.generateComplianceReport(
        organizationId,
        'GDPR'
      );

      expect(soc2Report.framework).toBe('SOC2');
      expect(gdprReport.framework).toBe('GDPR');

      // Both reports should reference the same violations if applicable
      if (validationResult.violations.length > 0) {
        const multiFrameworkViolations = validationResult.violations.filter(
          v => v.frameworks.includes('SOC2') && v.frameworks.includes('GDPR')
        );
        expect(multiFrameworkViolations.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle service failures gracefully', async () => {
      const organizationId = 'org-error-test';

      // Mock policy engine to throw error
      jest.spyOn(policyEngine, 'evaluateAllPolicies').mockRejectedValue(
        new Error('Policy engine unavailable')
      );

      await expect(
        validationService.validateResource(
          'resource-error',
          'database',
          { organizationId, userId: 'test-user' }
        )
      ).rejects.toThrow('Policy engine unavailable');

      // Service should recover after error
      jest.spyOn(policyEngine, 'evaluateAllPolicies').mockResolvedValue([]);

      const result = await validationService.validateResource(
        'resource-recovery',
        'database',
        { organizationId, userId: 'test-user' }
      );

      expect(result.compliant).toBe(true);
    });

    it('should handle partial service failures in batch operations', async () => {
      const organizationId = 'org-batch-error';

      // Mock policy engine to fail for specific resource
      jest.spyOn(policyEngine, 'evaluateAllPolicies').mockImplementation(
        async (context) => {
          if (context.resourceId === 'resource-fail') {
            throw new Error('Specific resource error');
          }
          return [];
        }
      );

      const resources = [
        { id: 'resource-success-1', type: 'database' },
        { id: 'resource-fail', type: 'storage' },
        { id: 'resource-success-2', type: 'api' }
      ];

      const results = await validationService.validateResources(
        resources,
        { organizationId, userId: 'test-user' }
      );

      // Should have results for successful resources only
      expect(results).toHaveLength(2);
      expect(results.map(r => r.resourceId)).toEqual([
        'resource-success-1',
        'resource-success-2'
      ]);
    });
  });
});