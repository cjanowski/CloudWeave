/**
 * Tests for ComplianceEnforcementService
 */

import { ComplianceEnforcementService } from './ComplianceEnforcementService';
import {
  ComplianceViolation,
  EnforcementAction,
  EnforcementOptions,
  RemediationPlan,
  RemediationStep
} from './interfaces';

describe('ComplianceEnforcementService', () => {
  let enforcementService: ComplianceEnforcementService;

  beforeEach(() => {
    enforcementService = new ComplianceEnforcementService();
  });

  describe('createRemediationPlan', () => {
    const mockViolations: ComplianceViolation[] = [
      {
        id: 'violation-1',
        policyId: 'policy-1',
        ruleId: 'rule-1',
        severity: 'critical',
        title: 'Critical Security Issue',
        description: 'Critical security violation detected',
        resourceId: 'resource-1',
        resourceType: 'database',
        frameworks: ['SOC2', 'GDPR'],
        remediationSteps: [
          'Enable encryption for the database',
          'Configure access controls',
          'Set up audit logging'
        ],
        enforcementActions: [],
        metadata: { source: 'automated_scan' }
      },
      {
        id: 'violation-2',
        policyId: 'policy-2',
        ruleId: 'rule-2',
        severity: 'high',
        title: 'Missing MFA',
        description: 'Multi-factor authentication not enabled',
        resourceId: 'resource-2',
        resourceType: 'user-account',
        frameworks: ['SOC2'],
        remediationSteps: [
          'Enable MFA for all user accounts',
          'Update authentication policies'
        ],
        enforcementActions: [],
        metadata: {}
      },
      {
        id: 'violation-3',
        policyId: 'policy-1',
        ruleId: 'rule-3',
        severity: 'medium',
        title: 'Weak Password Policy',
        description: 'Password policy does not meet requirements',
        resourceId: 'resource-1',
        resourceType: 'database',
        frameworks: ['SOC2'],
        remediationSteps: [
          'Update password complexity requirements',
          'Implement password rotation policy'
        ],
        enforcementActions: [],
        metadata: {}
      }
    ];

    it('should create a remediation plan with correct structure', async () => {
      const options: EnforcementOptions = {
        name: 'Test Remediation Plan',
        description: 'Test plan for security violations',
        organizationId: 'org-123',
        assignTo: 'security-team@example.com',
        createdBy: 'admin-user'
      };

      const plan = await enforcementService.createRemediationPlan(mockViolations, options);

      expect(plan).toMatchObject({
        name: 'Test Remediation Plan',
        description: 'Test plan for security violations',
        organizationId: 'org-123',
        status: 'open',
        priority: 'critical', // Should be critical due to critical violation
        createdBy: 'admin-user',
        progress: 0
      });

      expect(plan.id).toBeDefined();
      expect(plan.createdAt).toBeInstanceOf(Date);
      expect(plan.updatedAt).toBeInstanceOf(Date);
      expect(plan.dueDate).toBeInstanceOf(Date);
    });

    it('should create remediation steps for each violation', async () => {
      const plan = await enforcementService.createRemediationPlan(mockViolations);

      expect(plan.steps).toHaveLength(3);
      
      // Steps should be sorted by severity (critical first)
      expect(plan.steps[0].severity).toBe('critical');
      expect(plan.steps[1].severity).toBe('high');
      expect(plan.steps[2].severity).toBe('medium');

      // Each step should have correct structure
      plan.steps.forEach(step => {
        expect(step.id).toBeDefined();
        expect(step.resourceId).toBeDefined();
        expect(step.violationId).toBeDefined();
        expect(step.status).toBe('pending');
        expect(step.actions).toBeInstanceOf(Array);
        expect(step.actions.length).toBeGreaterThan(0);
        expect(step.createdAt).toBeInstanceOf(Date);
        expect(step.dueDate).toBeInstanceOf(Date);
      });
    });

    it('should set appropriate due dates based on severity', async () => {
      const plan = await enforcementService.createRemediationPlan(mockViolations);

      const criticalStep = plan.steps.find(s => s.severity === 'critical');
      const highStep = plan.steps.find(s => s.severity === 'high');
      const mediumStep = plan.steps.find(s => s.severity === 'medium');

      expect(criticalStep?.dueDate).toBeDefined();
      expect(highStep?.dueDate).toBeDefined();
      expect(mediumStep?.dueDate).toBeDefined();

      // Critical should have shortest due date
      expect(criticalStep!.dueDate.getTime()).toBeLessThan(highStep!.dueDate.getTime());
      expect(highStep!.dueDate.getTime()).toBeLessThan(mediumStep!.dueDate.getTime());
    });

    it('should group resources and frameworks correctly', async () => {
      const plan = await enforcementService.createRemediationPlan(mockViolations);

      expect(plan.resources).toContain('resource-1');
      expect(plan.resources).toContain('resource-2');
      expect(plan.resources).toHaveLength(2); // Unique resources only

      expect(plan.frameworks).toContain('SOC2');
      expect(plan.frameworks).toContain('GDPR');
      expect(plan.frameworks).toHaveLength(2); // Unique frameworks only
    });

    it('should set verification requirements for critical and high severity violations', async () => {
      const plan = await enforcementService.createRemediationPlan(mockViolations);

      const criticalStep = plan.steps.find(s => s.severity === 'critical');
      const highStep = plan.steps.find(s => s.severity === 'high');
      const mediumStep = plan.steps.find(s => s.severity === 'medium');

      expect(criticalStep?.verificationRequired).toBe(true);
      expect(highStep?.verificationRequired).toBe(true);
      expect(mediumStep?.verificationRequired).toBe(false);

      expect(criticalStep?.verificationSteps.length).toBeGreaterThan(0);
      expect(highStep?.verificationSteps.length).toBeGreaterThan(0);
    });
  });

  describe('updateRemediationStep', () => {
    let testPlan: RemediationPlan;

    beforeEach(async () => {
      const mockViolations: ComplianceViolation[] = [
        {
          id: 'violation-1',
          policyId: 'policy-1',
          ruleId: 'rule-1',
          severity: 'high',
          title: 'Test Violation',
          description: 'Test violation for step updates',
          resourceId: 'resource-1',
          resourceType: 'database',
          frameworks: ['SOC2'],
          remediationSteps: ['Fix the issue'],
          enforcementActions: [],
          metadata: {}
        }
      ];

      testPlan = await enforcementService.createRemediationPlan(mockViolations);
    });

    it('should update step status correctly', async () => {
      const stepId = testPlan.steps[0].id;

      const updatedStep = await enforcementService.updateRemediationStep(
        testPlan.id,
        stepId,
        { status: 'in_progress', assignedTo: 'developer@example.com' }
      );

      expect(updatedStep.status).toBe('in_progress');
      expect(updatedStep.assignedTo).toBe('developer@example.com');
      expect(updatedStep.updatedAt.getTime()).toBeGreaterThan(updatedStep.createdAt.getTime());
    });

    it('should set completedAt when status is completed', async () => {
      const stepId = testPlan.steps[0].id;

      const updatedStep = await enforcementService.updateRemediationStep(
        testPlan.id,
        stepId,
        { status: 'completed' }
      );

      expect(updatedStep.status).toBe('completed');
      expect(updatedStep.completedAt).toBeInstanceOf(Date);
    });

    it('should handle verification for steps that require it', async () => {
      const stepId = testPlan.steps[0].id;

      // First complete the step
      await enforcementService.updateRemediationStep(
        testPlan.id,
        stepId,
        { status: 'completed' }
      );

      // Then verify it
      const verifiedStep = await enforcementService.updateRemediationStep(
        testPlan.id,
        stepId,
        { 
          verificationResult: true,
          verifiedBy: 'security-team@example.com'
        }
      );

      expect(verifiedStep.verified).toBe(true);
      expect(verifiedStep.verifiedBy).toBe('security-team@example.com');
      expect(verifiedStep.verifiedAt).toBeInstanceOf(Date);
    });

    it('should revert status if verification fails', async () => {
      const stepId = testPlan.steps[0].id;

      // Complete the step
      await enforcementService.updateRemediationStep(
        testPlan.id,
        stepId,
        { status: 'completed' }
      );

      // Fail verification
      const failedStep = await enforcementService.updateRemediationStep(
        testPlan.id,
        stepId,
        { 
          verificationResult: false,
          verifiedBy: 'security-team@example.com'
        }
      );

      expect(failedStep.verified).toBe(false);
      expect(failedStep.status).toBe('in_progress'); // Should revert from completed
      expect(failedStep.completedAt).toBeUndefined();
    });

    it('should update plan progress when steps are completed', async () => {
      const stepId = testPlan.steps[0].id;

      // Complete the step
      await enforcementService.updateRemediationStep(
        testPlan.id,
        stepId,
        { status: 'completed' }
      );

      const updatedPlan = await enforcementService.getRemediationPlan(testPlan.id);
      expect(updatedPlan?.progress).toBe(100); // Only one step, so 100%
    });

    it('should throw error for non-existent plan', async () => {
      await expect(
        enforcementService.updateRemediationStep(
          'non-existent-plan',
          'step-id',
          { status: 'completed' }
        )
      ).rejects.toThrow('Remediation plan non-existent-plan not found');
    });

    it('should throw error for non-existent step', async () => {
      await expect(
        enforcementService.updateRemediationStep(
          testPlan.id,
          'non-existent-step',
          { status: 'completed' }
        )
      ).rejects.toThrow('Remediation step non-existent-step not found');
    });
  });

  describe('updateRemediationPlan', () => {
    let testPlan: RemediationPlan;

    beforeEach(async () => {
      const mockViolations: ComplianceViolation[] = [
        {
          id: 'violation-1',
          policyId: 'policy-1',
          ruleId: 'rule-1',
          severity: 'medium',
          title: 'Test Violation',
          description: 'Test violation',
          resourceId: 'resource-1',
          resourceType: 'database',
          frameworks: ['SOC2'],
          remediationSteps: ['Fix the issue'],
          enforcementActions: [],
          metadata: {}
        }
      ];

      testPlan = await enforcementService.createRemediationPlan(mockViolations);
    });

    it('should update plan properties correctly', async () => {
      const updates = {
        name: 'Updated Plan Name',
        description: 'Updated description',
        priority: 'high' as const,
        status: 'completed' as const
      };

      const updatedPlan = await enforcementService.updateRemediationPlan(
        testPlan.id,
        updates
      );

      expect(updatedPlan.name).toBe('Updated Plan Name');
      expect(updatedPlan.description).toBe('Updated description');
      expect(updatedPlan.priority).toBe('high');
      expect(updatedPlan.status).toBe('completed');
      expect(updatedPlan.completedAt).toBeInstanceOf(Date);
    });

    it('should update metadata correctly', async () => {
      const updates = {
        metadata: { customField: 'customValue', source: 'manual' }
      };

      const updatedPlan = await enforcementService.updateRemediationPlan(
        testPlan.id,
        updates
      );

      expect(updatedPlan.metadata.customField).toBe('customValue');
      expect(updatedPlan.metadata.source).toBe('manual');
    });

    it('should throw error for non-existent plan', async () => {
      await expect(
        enforcementService.updateRemediationPlan(
          'non-existent-plan',
          { name: 'New Name' }
        )
      ).rejects.toThrow('Remediation plan non-existent-plan not found');
    });
  });

  describe('executeEnforcementActions', () => {
    const mockActions: EnforcementAction[] = [
      {
        type: 'notify',
        parameters: {
          recipients: ['security@example.com'],
          channels: ['email'],
          message: 'Security violation detected'
        }
      },
      {
        type: 'tag',
        parameters: {
          tags: {
            'compliance-status': 'non-compliant',
            'violation-severity': 'high'
          }
        }
      },
      {
        type: 'block',
        parameters: {
          reason: 'Security policy violation',
          until: 'remediated'
        }
      }
    ];

    const mockContext = {
      resourceId: 'resource-123',
      resourceType: 'database',
      organizationId: 'org-123',
      violationId: 'violation-123',
      userId: 'user-123'
    };

    it('should execute all enforcement actions successfully', async () => {
      const result = await enforcementService.executeEnforcementActions(
        mockActions,
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.actions).toHaveLength(3);
      expect(result.resourceId).toBe('resource-123');
      expect(result.organizationId).toBe('org-123');
      expect(result.executedBy).toBe('user-123');

      // All actions should be successful
      result.actions.forEach(action => {
        expect(action.success).toBe(true);
        expect(action.error).toBeUndefined();
      });
    });

    it('should handle action execution failures gracefully', async () => {
      // Mock an action that will fail (invalid action type)
      const invalidActions: EnforcementAction[] = [
        {
          type: 'notify',
          parameters: { recipients: ['test@example.com'] }
        },
        {
          type: 'invalid_action' as any,
          parameters: {}
        }
      ];

      const result = await enforcementService.executeEnforcementActions(
        invalidActions,
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.actions).toHaveLength(2);
      
      // First action should succeed, second should fail
      expect(result.actions[0].success).toBe(true);
      expect(result.actions[1].success).toBe(false);
      expect(result.actions[1].error).toBeDefined();
    });

    it('should record enforcement actions in history', async () => {
      await enforcementService.executeEnforcementActions(mockActions, mockContext);

      const history = await enforcementService.getEnforcementHistory({
        organizationId: 'org-123',
        limit: 10
      });

      expect(history).toHaveLength(1);
      expect(history[0].resourceId).toBe('resource-123');
      expect(history[0].actions).toHaveLength(3);
    });
  });

  describe('getRemediationPlans', () => {
    beforeEach(async () => {
      // Create test plans
      const violations1: ComplianceViolation[] = [
        {
          id: 'violation-1',
          policyId: 'policy-1',
          ruleId: 'rule-1',
          severity: 'critical',
          title: 'Critical Issue',
          description: 'Critical security issue',
          resourceId: 'resource-1',
          resourceType: 'database',
          frameworks: ['SOC2'],
          remediationSteps: ['Fix critical issue'],
          enforcementActions: [],
          metadata: {}
        }
      ];

      const violations2: ComplianceViolation[] = [
        {
          id: 'violation-2',
          policyId: 'policy-2',
          ruleId: 'rule-2',
          severity: 'medium',
          title: 'Medium Issue',
          description: 'Medium security issue',
          resourceId: 'resource-2',
          resourceType: 'storage',
          frameworks: ['GDPR'],
          remediationSteps: ['Fix medium issue'],
          enforcementActions: [],
          metadata: {}
        }
      ];

      await enforcementService.createRemediationPlan(violations1, {
        organizationId: 'org-123',
        name: 'Critical Plan'
      });

      await enforcementService.createRemediationPlan(violations2, {
        organizationId: 'org-123',
        name: 'Medium Plan'
      });

      await enforcementService.createRemediationPlan(violations1, {
        organizationId: 'org-456',
        name: 'Other Org Plan'
      });
    });

    it('should return plans for specific organization', async () => {
      const plans = await enforcementService.getRemediationPlans('org-123');

      expect(plans).toHaveLength(2);
      plans.forEach(plan => {
        expect(plan.organizationId).toBe('org-123');
      });
    });

    it('should filter plans by status', async () => {
      const plans = await enforcementService.getRemediationPlans('org-123', {
        status: 'open'
      });

      expect(plans).toHaveLength(2);
      plans.forEach(plan => {
        expect(plan.status).toBe('open');
      });
    });

    it('should filter plans by priority', async () => {
      const plans = await enforcementService.getRemediationPlans('org-123', {
        priority: 'critical'
      });

      expect(plans).toHaveLength(1);
      expect(plans[0].priority).toBe('critical');
    });

    it('should filter plans by resource', async () => {
      const plans = await enforcementService.getRemediationPlans('org-123', {
        resourceId: 'resource-1'
      });

      expect(plans).toHaveLength(1);
      expect(plans[0].resources).toContain('resource-1');
    });

    it('should filter plans by framework', async () => {
      const plans = await enforcementService.getRemediationPlans('org-123', {
        framework: 'GDPR'
      });

      expect(plans).toHaveLength(1);
      expect(plans[0].frameworks).toContain('GDPR');
    });
  });

  describe('getEnforcementStatistics', () => {
    beforeEach(async () => {
      // Create some enforcement history
      const mockActions: EnforcementAction[] = [
        { type: 'notify', parameters: { recipients: ['test@example.com'] } },
        { type: 'tag', parameters: { tags: { status: 'non-compliant' } } }
      ];

      const context1 = {
        resourceId: 'resource-1',
        resourceType: 'database',
        organizationId: 'org-123',
        userId: 'user-1'
      };

      const context2 = {
        resourceId: 'resource-2',
        resourceType: 'storage',
        organizationId: 'org-123',
        userId: 'user-2'
      };

      await enforcementService.executeEnforcementActions(mockActions, context1);
      await enforcementService.executeEnforcementActions(mockActions, context2);

      // Create remediation plans
      const violations: ComplianceViolation[] = [
        {
          id: 'violation-1',
          policyId: 'policy-1',
          ruleId: 'rule-1',
          severity: 'high',
          title: 'Test Violation',
          description: 'Test violation',
          resourceId: 'resource-1',
          resourceType: 'database',
          frameworks: ['SOC2'],
          remediationSteps: ['Fix issue'],
          enforcementActions: [],
          metadata: {}
        }
      ];

      await enforcementService.createRemediationPlan(violations, {
        organizationId: 'org-123'
      });
    });

    it('should calculate enforcement statistics correctly', async () => {
      const stats = await enforcementService.getEnforcementStatistics('org-123');

      expect(stats.organizationId).toBe('org-123');
      expect(stats.totalEnforcements).toBe(2);
      expect(stats.successfulActions).toBe(4); // 2 actions × 2 executions
      expect(stats.failedActions).toBe(0);
      expect(stats.successRate).toBe(100);

      expect(stats.actionsByType.notify).toBe(2);
      expect(stats.actionsByType.tag).toBe(2);

      expect(stats.actionsByResourceType.database).toBe(1);
      expect(stats.actionsByResourceType.storage).toBe(1);

      expect(stats.remediationPlans.total).toBe(1);
      expect(stats.remediationPlans.open).toBe(1);
      expect(stats.remediationPlans.completed).toBe(0);
    });

    it('should return empty statistics for organization with no data', async () => {
      const stats = await enforcementService.getEnforcementStatistics('org-999');

      expect(stats.organizationId).toBe('org-999');
      expect(stats.totalEnforcements).toBe(0);
      expect(stats.successfulActions).toBe(0);
      expect(stats.failedActions).toBe(0);
      expect(stats.successRate).toBe(100);
      expect(stats.remediationPlans.total).toBe(0);
    });
  });
});