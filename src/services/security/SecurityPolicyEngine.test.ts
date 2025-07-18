/**
 * Security Policy Engine Tests
 * Enterprise-grade security policy testing with SOC 2 and GDPR compliance
 */

import { SecurityPolicyEngine } from './SecurityPolicyEngine';
import { SecurityPolicy, ComplianceFramework, SecuritySeverity } from './types';
import { EvaluationContext } from './interfaces';

describe('SecurityPolicyEngine', () => {
  let policyEngine: SecurityPolicyEngine;

  beforeEach(() => {
    policyEngine = new SecurityPolicyEngine();
  });

  describe('Policy Management', () => {
    it('should create a security policy successfully', async () => {
      const policyData = {
        name: 'Test Security Policy',
        description: 'A test policy for unit testing',
        category: 'Access Control',
        severity: 'high' as SecuritySeverity,
        complianceFrameworks: ['SOC2' as ComplianceFramework],
        status: 'draft' as const,
        version: '1.0',
        rules: [
          {
            id: 'test-rule-1',
            name: 'Test Rule',
            description: 'A test rule',
            ruleType: 'access' as const,
            conditions: [
              {
                field: 'user.role',
                operator: 'equals' as const,
                value: 'admin'
              }
            ],
            actions: [
              {
                type: 'alert' as const,
                parameters: { message: 'Test alert' },
                priority: 1
              }
            ],
            evaluationFrequency: '0 */6 * * *',
            enabled: true,
            priority: 1,
            tags: ['test']
          }
        ],
        controlMappings: [
          {
            framework: 'SOC2' as ComplianceFramework,
            controlId: 'CC6.1',
            controlName: 'Test Control',
            controlDescription: 'Test control description',
            requirementLevel: 'mandatory' as const,
            implementationStatus: 'implemented' as const,
            evidenceRequired: true
          }
        ],
        createdBy: 'test-user',
        updatedBy: 'test-user',
        enabled: true,
        enforcementMode: 'monitor' as const,
        autoRemediation: false,
        notificationChannels: []
      };

      const policy = await policyEngine.createPolicy(policyData);

      expect(policy.id).toBeDefined();
      expect(policy.name).toBe('Test Security Policy');
      expect(policy.category).toBe('Access Control');
      expect(policy.severity).toBe('high');
      expect(policy.complianceFrameworks).toContain('SOC2');
      expect(policy.rules).toHaveLength(1);
      expect(policy.controlMappings).toHaveLength(1);
      expect(policy.createdAt).toBeInstanceOf(Date);
      expect(policy.updatedAt).toBeInstanceOf(Date);
      expect(policy.auditTrail).toHaveLength(1);
      expect(policy.auditTrail[0].action).toBe('created');
    });

    it('should validate policy requirements', async () => {
      const invalidPolicyData = {
        name: '', // Invalid - empty name
        description: '',
        category: '',
        severity: 'high' as SecuritySeverity,
        complianceFrameworks: [], // Invalid - empty frameworks
        status: 'draft' as const,
        version: '1.0',
        rules: [], // Invalid - no rules
        controlMappings: [],
        createdBy: 'test-user',
        updatedBy: 'test-user',
        enabled: true,
        enforcementMode: 'monitor' as const,
        autoRemediation: false,
        notificationChannels: []
      };

      await expect(policyEngine.createPolicy(invalidPolicyData)).rejects.toThrow('Policy validation failed');
    });

    it('should get policy by ID', async () => {
      const policyData = {
        name: 'Test Policy',
        description: 'Test description',
        category: 'Test Category',
        severity: 'medium' as SecuritySeverity,
        complianceFrameworks: ['GDPR' as ComplianceFramework],
        status: 'active' as const,
        version: '1.0',
        rules: [
          {
            id: 'test-rule',
            name: 'Test Rule',
            description: 'Test rule description',
            ruleType: 'data' as const,
            conditions: [{ field: 'test', operator: 'exists' as const, value: true }],
            actions: [{ type: 'audit' as const, parameters: {}, priority: 1 }],
            evaluationFrequency: '0 */1 * * *',
            enabled: true,
            priority: 1,
            tags: []
          }
        ],
        controlMappings: [],
        createdBy: 'test-user',
        updatedBy: 'test-user',
        enabled: true,
        enforcementMode: 'enforce' as const,
        autoRemediation: false,
        notificationChannels: []
      };

      const createdPolicy = await policyEngine.createPolicy(policyData);
      const retrievedPolicy = await policyEngine.getPolicy(createdPolicy.id);

      expect(retrievedPolicy).not.toBeNull();
      expect(retrievedPolicy!.id).toBe(createdPolicy.id);
      expect(retrievedPolicy!.name).toBe('Test Policy');
    });

    it('should return null for non-existent policy', async () => {
      const policy = await policyEngine.getPolicy('non-existent-id');
      expect(policy).toBeNull();
    });

    it('should get policies with filtering', async () => {
      // Create policies with different characteristics
      const policy1Data = {
        name: 'SOC2 Policy',
        description: 'SOC2 compliance policy',
        category: 'Access Control',
        severity: 'critical' as SecuritySeverity,
        complianceFrameworks: ['SOC2' as ComplianceFramework],
        status: 'active' as const,
        version: '1.0',
        rules: [
          {
            id: 'soc2-rule',
            name: 'SOC2 Rule',
            description: 'SOC2 rule',
            ruleType: 'access' as const,
            conditions: [{ field: 'test', operator: 'exists' as const, value: true }],
            actions: [{ type: 'block' as const, parameters: {}, priority: 1 }],
            evaluationFrequency: '0 */1 * * *',
            enabled: true,
            priority: 1,
            tags: []
          }
        ],
        controlMappings: [],
        createdBy: 'test-user',
        updatedBy: 'test-user',
        enabled: true,
        enforcementMode: 'enforce' as const,
        autoRemediation: false,
        notificationChannels: []
      };

      const policy2Data = {
        name: 'GDPR Policy',
        description: 'GDPR compliance policy',
        category: 'Data Protection',
        severity: 'high' as SecuritySeverity,
        complianceFrameworks: ['GDPR' as ComplianceFramework],
        status: 'inactive' as const,
        version: '1.0',
        rules: [
          {
            id: 'gdpr-rule',
            name: 'GDPR Rule',
            description: 'GDPR rule',
            ruleType: 'data' as const,
            conditions: [{ field: 'test', operator: 'exists' as const, value: true }],
            actions: [{ type: 'alert' as const, parameters: {}, priority: 1 }],
            evaluationFrequency: '0 */1 * * *',
            enabled: false,
            priority: 1,
            tags: []
          }
        ],
        controlMappings: [],
        createdBy: 'test-user',
        updatedBy: 'test-user',
        enabled: false,
        enforcementMode: 'monitor' as const,
        autoRemediation: false,
        notificationChannels: []
      };

      await policyEngine.createPolicy(policy1Data);
      await policyEngine.createPolicy(policy2Data);

      // Test filtering by framework
      const soc2Policies = await policyEngine.getPolicies('test-org', { framework: 'SOC2' });
      expect(soc2Policies.length).toBeGreaterThanOrEqual(1);
      const testPolicy = soc2Policies.find(p => p.name === 'SOC2 Policy');
      expect(testPolicy).toBeDefined();

      // Test filtering by severity
      const criticalPolicies = await policyEngine.getPolicies('test-org', { severity: 'critical' });
      expect(criticalPolicies.length).toBeGreaterThanOrEqual(1);
      expect(criticalPolicies.every(p => p.severity === 'critical')).toBe(true);

      // Test filtering by enabled status
      const enabledPolicies = await policyEngine.getPolicies('test-org', { enabled: true });
      expect(enabledPolicies.length).toBeGreaterThanOrEqual(1);
      expect(enabledPolicies.every(p => p.enabled === true)).toBe(true);
    });

    it('should update policy successfully', async () => {
      const policyData = {
        name: 'Original Policy',
        description: 'Original description',
        category: 'Test',
        severity: 'low' as SecuritySeverity,
        complianceFrameworks: ['SOC2' as ComplianceFramework],
        status: 'draft' as const,
        version: '1.0',
        rules: [
          {
            id: 'test-rule',
            name: 'Test Rule',
            description: 'Test rule',
            ruleType: 'configuration' as const,
            conditions: [{ field: 'test', operator: 'exists' as const, value: true }],
            actions: [{ type: 'audit' as const, parameters: {}, priority: 1 }],
            evaluationFrequency: '0 */1 * * *',
            enabled: true,
            priority: 1,
            tags: []
          }
        ],
        controlMappings: [],
        createdBy: 'test-user',
        updatedBy: 'test-user',
        enabled: true,
        enforcementMode: 'monitor' as const,
        autoRemediation: false,
        notificationChannels: []
      };

      const policy = await policyEngine.createPolicy(policyData);

      const updates = {
        name: 'Updated Policy',
        severity: 'high' as SecuritySeverity,
        updatedBy: 'update-user'
      };

      const updatedPolicy = await policyEngine.updatePolicy(policy.id, updates);

      expect(updatedPolicy.name).toBe('Updated Policy');
      expect(updatedPolicy.severity).toBe('high');
      expect(updatedPolicy.id).toBe(policy.id);
      expect(updatedPolicy.createdAt).toEqual(policy.createdAt);
      expect(updatedPolicy.updatedAt.getTime()).toBeGreaterThanOrEqual(policy.updatedAt.getTime());
      expect(updatedPolicy.auditTrail).toHaveLength(2);
      expect(updatedPolicy.auditTrail[1].action).toBe('updated');
    });

    it('should delete policy successfully', async () => {
      const policyData = {
        name: 'Policy to Delete',
        description: 'This policy will be deleted',
        category: 'Test',
        severity: 'info' as SecuritySeverity,
        complianceFrameworks: ['SOC2' as ComplianceFramework],
        status: 'draft' as const,
        version: '1.0',
        rules: [
          {
            id: 'test-rule',
            name: 'Test Rule',
            description: 'Test rule',
            ruleType: 'audit' as const,
            conditions: [{ field: 'test', operator: 'exists' as const, value: true }],
            actions: [{ type: 'audit' as const, parameters: {}, priority: 1 }],
            evaluationFrequency: '0 */1 * * *',
            enabled: true,
            priority: 1,
            tags: []
          }
        ],
        controlMappings: [],
        createdBy: 'test-user',
        updatedBy: 'test-user',
        enabled: true,
        enforcementMode: 'monitor' as const,
        autoRemediation: false,
        notificationChannels: []
      };

      const policy = await policyEngine.createPolicy(policyData);

      await policyEngine.deletePolicy(policy.id);

      const deletedPolicy = await policyEngine.getPolicy(policy.id);
      expect(deletedPolicy).toBeNull();
    });

    it('should activate and deactivate policies', async () => {
      const policyData = {
        name: 'Toggle Policy',
        description: 'Policy for testing activation/deactivation',
        category: 'Test',
        severity: 'medium' as SecuritySeverity,
        complianceFrameworks: ['GDPR' as ComplianceFramework],
        status: 'draft' as const,
        version: '1.0',
        rules: [
          {
            id: 'test-rule',
            name: 'Test Rule',
            description: 'Test rule',
            ruleType: 'data' as const,
            conditions: [{ field: 'test', operator: 'exists' as const, value: true }],
            actions: [{ type: 'alert' as const, parameters: {}, priority: 1 }],
            evaluationFrequency: '0 */1 * * *',
            enabled: true,
            priority: 1,
            tags: []
          }
        ],
        controlMappings: [],
        createdBy: 'test-user',
        updatedBy: 'test-user',
        enabled: false,
        enforcementMode: 'monitor' as const,
        autoRemediation: false,
        notificationChannels: []
      };

      const policy = await policyEngine.createPolicy(policyData);

      // Activate policy
      await policyEngine.activatePolicy(policy.id, 'admin-user');
      let updatedPolicy = await policyEngine.getPolicy(policy.id);
      expect(updatedPolicy!.status).toBe('active');
      expect(updatedPolicy!.enabled).toBe(true);

      // Deactivate policy
      await policyEngine.deactivatePolicy(policy.id, 'admin-user');
      updatedPolicy = await policyEngine.getPolicy(policy.id);
      expect(updatedPolicy!.status).toBe('inactive');
      expect(updatedPolicy!.enabled).toBe(false);
    });

    it('should approve policy', async () => {
      const policyData = {
        name: 'Policy for Approval',
        description: 'Policy that needs approval',
        category: 'Test',
        severity: 'high' as SecuritySeverity,
        complianceFrameworks: ['SOC2' as ComplianceFramework],
        status: 'draft' as const,
        version: '1.0',
        rules: [
          {
            id: 'test-rule',
            name: 'Test Rule',
            description: 'Test rule',
            ruleType: 'access' as const,
            conditions: [{ field: 'test', operator: 'exists' as const, value: true }],
            actions: [{ type: 'block' as const, parameters: {}, priority: 1 }],
            evaluationFrequency: '0 */1 * * *',
            enabled: true,
            priority: 1,
            tags: []
          }
        ],
        controlMappings: [],
        createdBy: 'test-user',
        updatedBy: 'test-user',
        enabled: true,
        enforcementMode: 'enforce' as const,
        autoRemediation: false,
        notificationChannels: []
      };

      const policy = await policyEngine.createPolicy(policyData);

      await policyEngine.approvePolicy(policy.id, 'approver-user');

      const approvedPolicy = await policyEngine.getPolicy(policy.id);
      expect(approvedPolicy!.approvedBy).toBe('approver-user');
      expect(approvedPolicy!.approvedAt).toBeInstanceOf(Date);
      expect(approvedPolicy!.auditTrail).toHaveLength(2);
      expect(approvedPolicy!.auditTrail[1].action).toBe('approved');
    });
  });

  describe('Policy Evaluation', () => {
    let testPolicy: SecurityPolicy;

    beforeEach(async () => {
      const policyData = {
        name: 'Evaluation Test Policy',
        description: 'Policy for testing evaluation logic',
        category: 'Access Control',
        severity: 'high' as SecuritySeverity,
        complianceFrameworks: ['SOC2' as ComplianceFramework],
        status: 'active' as const,
        version: '1.0',
        rules: [
          {
            id: 'mfa-rule',
            name: 'MFA Required Rule',
            description: 'Multi-factor authentication must be enabled',
            ruleType: 'access' as const,
            conditions: [
              {
                field: 'user.mfaEnabled',
                operator: 'equals' as const,
                value: false
              }
            ],
            actions: [
              {
                type: 'block' as const,
                parameters: { message: 'MFA is required' },
                priority: 1
              }
            ],
            evaluationFrequency: '0 */6 * * *',
            enabled: true,
            priority: 1,
            tags: ['mfa', 'access']
          }
        ],
        controlMappings: [],
        createdBy: 'test-user',
        updatedBy: 'test-user',
        enabled: true,
        enforcementMode: 'enforce' as const,
        autoRemediation: false,
        notificationChannels: []
      };

      testPolicy = await policyEngine.createPolicy(policyData);
    });

    it('should evaluate policy and detect violations', async () => {
      const context: EvaluationContext = {
        organizationId: 'test-org',
        userId: 'test-user',
        metadata: {
          user: {
            mfaEnabled: false // This should trigger the violation
          }
        }
      };

      const result = await policyEngine.evaluatePolicy(testPolicy.id, context);

      expect(result.policyId).toBe(testPolicy.id);
      expect(result.passed).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].severity).toBe('high');
      expect(result.violations[0].title).toContain('MFA Required Rule');
      expect(result.score).toBe(0);
      expect(result.evaluatedAt).toBeInstanceOf(Date);
      expect(result.evaluationTime).toBeGreaterThanOrEqual(0);
    });

    it('should pass evaluation when conditions are met', async () => {
      const context: EvaluationContext = {
        organizationId: 'test-org',
        userId: 'test-user',
        metadata: {
          user: {
            mfaEnabled: true // This should pass the rule
          }
        }
      };

      const result = await policyEngine.evaluatePolicy(testPolicy.id, context);

      expect(result.policyId).toBe(testPolicy.id);
      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.score).toBe(100);
    });

    it('should skip evaluation for inactive policies', async () => {
      // Deactivate the policy
      await policyEngine.deactivatePolicy(testPolicy.id, 'test-user');

      const context: EvaluationContext = {
        organizationId: 'test-org',
        userId: 'test-user',
        metadata: {
          user: {
            mfaEnabled: false
          }
        }
      };

      const result = await policyEngine.evaluatePolicy(testPolicy.id, context);

      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.score).toBe(100);
    });

    it('should evaluate all active policies', async () => {
      // Create another policy
      const policy2Data = {
        name: 'Data Encryption Policy',
        description: 'Data must be encrypted',
        category: 'Data Protection',
        severity: 'critical' as SecuritySeverity,
        complianceFrameworks: ['GDPR' as ComplianceFramework],
        status: 'active' as const,
        version: '1.0',
        rules: [
          {
            id: 'encryption-rule',
            name: 'Data Encryption Rule',
            description: 'Personal data must be encrypted',
            ruleType: 'encryption' as const,
            conditions: [
              {
                field: 'data.containsPII',
                operator: 'equals' as const,
                value: true
              },
              {
                field: 'data.encrypted',
                operator: 'equals' as const,
                value: false,
                logicalOperator: 'AND' as const
              }
            ],
            actions: [
              {
                type: 'alert' as const,
                parameters: { severity: 'critical' },
                priority: 1
              }
            ],
            evaluationFrequency: '0 */1 * * *',
            enabled: true,
            priority: 1,
            tags: ['encryption', 'gdpr']
          }
        ],
        controlMappings: [],
        createdBy: 'test-user',
        updatedBy: 'test-user',
        enabled: true,
        enforcementMode: 'enforce' as const,
        autoRemediation: true,
        notificationChannels: []
      };

      await policyEngine.createPolicy(policy2Data);

      const context: EvaluationContext = {
        organizationId: 'test-org',
        metadata: {
          user: {
            mfaEnabled: false
          },
          data: {
            containsPII: true,
            encrypted: false
          }
        }
      };

      const results = await policyEngine.evaluateAllPolicies(context);

      expect(results.length).toBeGreaterThanOrEqual(2);
      expect(results.every(r => !r.passed)).toBe(true);
      expect(results.reduce((sum, r) => sum + r.violations.length, 0)).toBeGreaterThanOrEqual(2);
    });

    it('should handle complex rule conditions with logical operators', async () => {
      const complexPolicyData = {
        name: 'Complex Rule Policy',
        description: 'Policy with complex logical conditions',
        category: 'Access Control',
        severity: 'medium' as SecuritySeverity,
        complianceFrameworks: ['SOC2' as ComplianceFramework],
        status: 'active' as const,
        version: '1.0',
        rules: [
          {
            id: 'complex-rule',
            name: 'Complex Access Rule',
            description: 'Complex rule with AND/OR logic',
            ruleType: 'access' as const,
            conditions: [
              {
                field: 'user.role',
                operator: 'equals' as const,
                value: 'admin'
              },
              {
                field: 'user.department',
                operator: 'equals' as const,
                value: 'IT',
                logicalOperator: 'OR' as const
              },
              {
                field: 'access.time',
                operator: 'greater_than' as const,
                value: 9,
                logicalOperator: 'AND' as const
              }
            ],
            actions: [
              {
                type: 'alert' as const,
                parameters: {},
                priority: 1
              }
            ],
            evaluationFrequency: '0 */1 * * *',
            enabled: true,
            priority: 1,
            tags: []
          }
        ],
        controlMappings: [],
        createdBy: 'test-user',
        updatedBy: 'test-user',
        enabled: true,
        enforcementMode: 'monitor' as const,
        autoRemediation: false,
        notificationChannels: []
      };

      const complexPolicy = await policyEngine.createPolicy(complexPolicyData);

      // Test case 1: Admin user during business hours (should trigger violation based on rule conditions)
      const context1: EvaluationContext = {
        organizationId: 'test-org',
        metadata: {
          user: {
            role: 'admin',
            department: 'Engineering'
          },
          access: {
            time: 10
          }
        }
      };

      const result1 = await policyEngine.evaluatePolicy(complexPolicy.id, context1);
      expect(result1.passed).toBe(false); // Admin user triggers the rule

      // Test case 2: IT user during business hours (should trigger violation due to OR condition)
      const context2: EvaluationContext = {
        organizationId: 'test-org',
        metadata: {
          user: {
            role: 'user',
            department: 'IT'
          },
          access: {
            time: 10
          }
        }
      };

      const result2 = await policyEngine.evaluatePolicy(complexPolicy.id, context2);
      expect(result2.passed).toBe(false); // IT user during business hours triggers the rule

      // Test case 3: Regular user outside business hours (should pass - no violation)
      const context3: EvaluationContext = {
        organizationId: 'test-org',
        metadata: {
          user: {
            role: 'user',
            department: 'Sales'
          },
          access: {
            time: 8
          }
        }
      };

      const result3 = await policyEngine.evaluatePolicy(complexPolicy.id, context3);
      expect(result3.passed).toBe(true); // Regular user outside business hours doesn't trigger the rule
      expect(result3.violations).toHaveLength(0);
    });
  });

  describe('Policy Import/Export', () => {
    it('should import policies successfully', async () => {
      const policiesToImport: SecurityPolicy[] = [
        {
          id: 'import-policy-1',
          name: 'Imported Policy 1',
          description: 'First imported policy',
          category: 'Test',
          severity: 'low',
          complianceFrameworks: ['SOC2'],
          status: 'draft',
          version: '1.0',
          rules: [
            {
              id: 'import-rule-1',
              name: 'Import Rule 1',
              description: 'Imported rule',
              ruleType: 'audit',
              conditions: [{ field: 'test', operator: 'exists', value: true }],
              actions: [{ type: 'audit', parameters: {}, priority: 1 }],
              evaluationFrequency: '0 */1 * * *',
              enabled: true,
              priority: 1,
              tags: []
            }
          ],
          controlMappings: [],
          createdBy: 'import-system',
          createdAt: new Date(),
          updatedBy: 'import-system',
          updatedAt: new Date(),
          enabled: true,
          enforcementMode: 'monitor',
          autoRemediation: false,
          notificationChannels: [],
          auditTrail: []
        }
      ];

      const result = await policyEngine.importPolicies(policiesToImport, 'test-org');

      expect(result.imported).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);

      // Verify the policy was imported
      const policies = await policyEngine.getPolicies('test-org');
      const importedPolicy = policies.find(p => p.name === 'Imported Policy 1');
      expect(importedPolicy).toBeDefined();
    });

    it('should handle import errors gracefully', async () => {
      const invalidPolicies: SecurityPolicy[] = [
        {
          id: 'invalid-policy',
          name: '', // Invalid - empty name
          description: '',
          category: '',
          severity: 'low',
          complianceFrameworks: [], // Invalid - empty frameworks
          status: 'draft',
          version: '1.0',
          rules: [], // Invalid - no rules
          controlMappings: [],
          createdBy: 'import-system',
          createdAt: new Date(),
          updatedBy: 'import-system',
          updatedAt: new Date(),
          enabled: true,
          enforcementMode: 'monitor',
          autoRemediation: false,
          notificationChannels: [],
          auditTrail: []
        }
      ];

      const result = await policyEngine.importPolicies(invalidPolicies, 'test-org');

      expect(result.imported).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('Policy validation failed');
    });

    it('should export policies in JSON format', async () => {
      // Create a test policy first
      const policyData = {
        name: 'Export Test Policy',
        description: 'Policy for testing export functionality',
        category: 'Test',
        severity: 'info' as SecuritySeverity,
        complianceFrameworks: ['SOC2' as ComplianceFramework],
        status: 'active' as const,
        version: '1.0',
        rules: [
          {
            id: 'export-rule',
            name: 'Export Rule',
            description: 'Rule for export testing',
            ruleType: 'audit' as const,
            conditions: [{ field: 'test', operator: 'exists' as const, value: true }],
            actions: [{ type: 'audit' as const, parameters: {}, priority: 1 }],
            evaluationFrequency: '0 */1 * * *',
            enabled: true,
            priority: 1,
            tags: []
          }
        ],
        controlMappings: [],
        createdBy: 'test-user',
        updatedBy: 'test-user',
        enabled: true,
        enforcementMode: 'monitor' as const,
        autoRemediation: false,
        notificationChannels: []
      };

      await policyEngine.createPolicy(policyData);

      const exportedData = await policyEngine.exportPolicies('test-org', 'json');

      expect(exportedData).toBeDefined();
      expect(() => JSON.parse(exportedData)).not.toThrow();

      const parsedData = JSON.parse(exportedData);
      expect(Array.isArray(parsedData)).toBe(true);
      expect(parsedData.length).toBeGreaterThan(0);
      
      const exportedPolicy = parsedData.find((p: any) => p.name === 'Export Test Policy');
      expect(exportedPolicy).toBeDefined();
    });

    it('should export policies in CSV format', async () => {
      const exportedData = await policyEngine.exportPolicies('test-org', 'csv');

      expect(exportedData).toBeDefined();
      expect(typeof exportedData).toBe('string');
      expect(exportedData).toContain('ID,Name,Category,Severity,Status,Enabled,Frameworks,Created At');
    });
  });

  describe('Default Policies', () => {
    it('should initialize with default SOC 2 and GDPR policies', async () => {
      const policies = await policyEngine.getPolicies('test-org');
      
      // Should have default policies
      expect(policies.length).toBeGreaterThan(0);
      
      const soc2Policy = policies.find(p => p.complianceFrameworks.includes('SOC2'));
      expect(soc2Policy).toBeDefined();
      expect(soc2Policy!.name).toContain('SOC 2');
      
      const gdprPolicy = policies.find(p => p.complianceFrameworks.includes('GDPR'));
      expect(gdprPolicy).toBeDefined();
      expect(gdprPolicy!.name).toContain('GDPR');
    });

    it('should have properly configured default policy rules', async () => {
      const policies = await policyEngine.getPolicies('test-org');
      const soc2Policy = policies.find(p => p.complianceFrameworks.includes('SOC2'));
      
      expect(soc2Policy).toBeDefined();
      expect(soc2Policy!.rules).toHaveLength(1);
      expect(soc2Policy!.rules[0].name).toContain('Multi-Factor Authentication');
      expect(soc2Policy!.rules[0].enabled).toBe(true);
      expect(soc2Policy!.controlMappings).toHaveLength(1);
      expect(soc2Policy!.controlMappings[0].controlId).toBe('CC6.1');
    });
  });

  describe('Error Handling', () => {
    it('should handle policy not found errors', async () => {
      await expect(policyEngine.updatePolicy('non-existent', {})).rejects.toThrow('not found');
      await expect(policyEngine.deletePolicy('non-existent')).rejects.toThrow('not found');
      await expect(policyEngine.activatePolicy('non-existent', 'user')).rejects.toThrow('not found');
    });

    it('should handle evaluation errors gracefully', async () => {
      await expect(policyEngine.evaluatePolicy('non-existent', {
        organizationId: 'test-org'
      })).rejects.toThrow('not found');
    });
  });
});