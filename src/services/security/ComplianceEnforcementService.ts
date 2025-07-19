/**
 * Compliance Enforcement Service
 * Enforces compliance with security policies and regulatory frameworks
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';
import {
  EnforcementAction,
  EnforcementResult,
  RemediationPlan,
  RemediationStep,
  RemediationStatus,
  EnforcementStatistics,
  ComplianceViolation,
  EnforcementOptions
} from './interfaces';

/**
 * Service for enforcing compliance with security policies
 * Handles remediation actions, enforcement workflows, and compliance tracking
 */
export class ComplianceEnforcementService {
  private remediationPlans: Map<string, RemediationPlan> = new Map();
  private enforcementHistory: EnforcementResult[] = [];
  private readonly MAX_HISTORY_SIZE = 1000;

  /**
   * Create a remediation plan for compliance violations
   */
  async createRemediationPlan(
    violations: ComplianceViolation[],
    options: EnforcementOptions = {}
  ): Promise<RemediationPlan> {
    try {
      const planId = uuidv4();
      const now = new Date();

      // Group violations by resource
      const violationsByResource: Record<string, ComplianceViolation[]> = {};
      for (const violation of violations) {
        if (!violationsByResource[violation.resourceId]) {
          violationsByResource[violation.resourceId] = [];
        }
        violationsByResource[violation.resourceId].push(violation);
      }

      // Generate remediation steps for each resource
      const steps: RemediationStep[] = [];
      const resources: string[] = [];
      const frameworks = new Set<string>();

      for (const [resourceId, resourceViolations] of Object.entries(violationsByResource)) {
        resources.push(resourceId);

        // Sort violations by severity (critical first)
        const sortedViolations = [...resourceViolations].sort((a, b) => {
          const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
          return severityOrder[a.severity] - severityOrder[b.severity];
        });

        // Create steps for each violation
        for (const violation of sortedViolations) {
          // Add frameworks
          violation.frameworks.forEach(framework => frameworks.add(framework));

          // Create remediation step
          steps.push({
            id: uuidv4(),
            resourceId: violation.resourceId,
            resourceType: violation.resourceType,
            violationId: violation.id,
            policyId: violation.policyId,
            title: `Remediate: ${violation.title}`,
            description: violation.description,
            severity: violation.severity,
            actions: violation.remediationSteps,
            status: 'pending',
            assignedTo: options.assignTo,
            createdAt: now,
            updatedAt: now,
            dueDate: options.dueDate || this.calculateDueDate(violation.severity),
            dependencies: [],
            verificationRequired: violation.severity === 'critical' || violation.severity === 'high',
            verificationSteps: this.generateVerificationSteps(violation),
            metadata: violation.metadata || {}
          });
        }
      }

      // Create the remediation plan
      const plan: RemediationPlan = {
        id: planId,
        name: options.name || `Remediation Plan ${now.toISOString().split('T')[0]}`,
        description: options.description || `Remediation plan for ${violations.length} compliance violations`,
        organizationId: options.organizationId || violations[0]?.resourceId.split('/')[0] || '',
        projectId: options.projectId,
        environmentId: options.environmentId,
        resources,
        frameworks: Array.from(frameworks),
        steps,
        status: 'open',
        priority: this.determinePlanPriority(violations),
        createdBy: options.createdBy || 'system',
        createdAt: now,
        updatedAt: now,
        dueDate: options.dueDate || this.calculatePlanDueDate(violations),
        completedAt: null,
        progress: 0,
        metadata: options.metadata || {}
      };

      // Store the plan
      this.remediationPlans.set(planId, plan);

      logger.info(`Created remediation plan ${planId}`, {
        planId,
        violations: violations.length,
        resources: resources.length,
        steps: steps.length,
        priority: plan.priority
      });

      return plan;
    } catch (error) {
      logger.error('Failed to create remediation plan:', error);
      throw error;
    }
  }

  /**
   * Get a remediation plan by ID
   */
  async getRemediationPlan(planId: string): Promise<RemediationPlan | null> {
    return this.remediationPlans.get(planId) || null;
  }

  /**
   * Get remediation plans with filtering
   */
  async getRemediationPlans(
    organizationId: string,
    filters: {
      status?: string;
      priority?: string;
      resourceId?: string;
      framework?: string;
    } = {}
  ): Promise<RemediationPlan[]> {
    try {
      let plans = Array.from(this.remediationPlans.values())
        .filter(plan => plan.organizationId === organizationId);

      // Apply filters
      if (filters.status) {
        plans = plans.filter(plan => plan.status === filters.status);
      }

      if (filters.priority) {
        plans = plans.filter(plan => plan.priority === filters.priority);
      }

      if (filters.resourceId) {
        plans = plans.filter(plan => plan.resources.includes(filters.resourceId));
      }

      if (filters.framework) {
        plans = plans.filter(plan => plan.frameworks.includes(filters.framework));
      }

      return plans;
    } catch (error) {
      logger.error(`Failed to get remediation plans for organization ${organizationId}:`, error);
      throw error;
    }
  }

  /**
   * Update remediation step status
   */
  async updateRemediationStep(
    planId: string,
    stepId: string,
    updates: {
      status?: RemediationStatus;
      assignedTo?: string;
      notes?: string;
      verificationResult?: boolean;
      verifiedBy?: string;
    }
  ): Promise<RemediationStep> {
    try {
      const plan = this.remediationPlans.get(planId);
      if (!plan) {
        throw new Error(`Remediation plan ${planId} not found`);
      }

      const stepIndex = plan.steps.findIndex(step => step.id === stepId);
      if (stepIndex === -1) {
        throw new Error(`Remediation step ${stepId} not found in plan ${planId}`);
      }

      const step = plan.steps[stepIndex];
      const now = new Date();

      // Update step properties
      if (updates.status) {
        step.status = updates.status;

        // If completed, set completedAt
        if (updates.status === 'completed') {
          step.completedAt = now;
        } else {
          step.completedAt = undefined;
        }
      }

      if (updates.assignedTo) {
        step.assignedTo = updates.assignedTo;
      }

      if (updates.notes) {
        step.notes = updates.notes;
      }

      if (updates.verificationResult !== undefined && step.verificationRequired) {
        step.verified = updates.verificationResult;
        step.verifiedBy = updates.verifiedBy;
        step.verifiedAt = now;

        // If verification failed, set status back to in_progress
        if (!updates.verificationResult && step.status === 'completed') {
          step.status = 'in_progress';
          step.completedAt = undefined;
        }
      }

      step.updatedAt = now;
      plan.updatedAt = now;

      // Update plan progress
      this.updatePlanProgress(plan);

      logger.info(`Updated remediation step ${stepId} in plan ${planId}`, {
        planId,
        stepId,
        status: step.status,
        assignedTo: step.assignedTo,
        verified: step.verified
      });

      return step;
    } catch (error) {
      logger.error(`Failed to update remediation step ${stepId} in plan ${planId}:`, error);
      throw error;
    }
  }

  /**
   * Update remediation plan status
   */
  async updateRemediationPlan(
    planId: string,
    updates: {
      status?: string;
      name?: string;
      description?: string;
      priority?: string;
      dueDate?: Date;
      metadata?: Record<string, any>;
    }
  ): Promise<RemediationPlan> {
    try {
      const plan = this.remediationPlans.get(planId);
      if (!plan) {
        throw new Error(`Remediation plan ${planId} not found`);
      }

      const now = new Date();

      // Update plan properties
      if (updates.status) {
        plan.status = updates.status;

        // If closed or completed, set completedAt
        if (updates.status === 'closed' || updates.status === 'completed') {
          plan.completedAt = now;
        } else {
          plan.completedAt = null;
        }
      }

      if (updates.name) {
        plan.name = updates.name;
      }

      if (updates.description) {
        plan.description = updates.description;
      }

      if (updates.priority) {
        plan.priority = updates.priority as any;
      }

      if (updates.dueDate) {
        plan.dueDate = updates.dueDate;
      }

      if (updates.metadata) {
        plan.metadata = { ...plan.metadata, ...updates.metadata };
      }

      plan.updatedAt = now;

      logger.info(`Updated remediation plan ${planId}`, {
        planId,
        status: plan.status,
        priority: plan.priority,
        progress: plan.progress
      });

      return plan;
    } catch (error) {
      logger.error(`Failed to update remediation plan ${planId}:`, error);
      throw error;
    }
  }

  /**
   * Execute enforcement actions
   */
  async executeEnforcementActions(
    actions: EnforcementAction[],
    context: {
      resourceId: string;
      resourceType: string;
      organizationId: string;
      violationId?: string;
      userId?: string;
    }
  ): Promise<EnforcementResult> {
    try {
      const resultId = uuidv4();
      const now = new Date();
      const executedActions: Array<EnforcementAction & { success: boolean; error?: string }> = [];

      for (const action of actions) {
        try {
          // Execute the action based on type
          await this.executeAction(action, context);

          executedActions.push({
            ...action,
            success: true
          });
        } catch (error) {
          executedActions.push({
            ...action,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });

          logger.error(`Failed to execute enforcement action for resource ${context.resourceId}:`, error);
        }
      }

      const result: EnforcementResult = {
        id: resultId,
        resourceId: context.resourceId,
        resourceType: context.resourceType,
        organizationId: context.organizationId,
        violationId: context.violationId,
        timestamp: now,
        actions: executedActions,
        success: executedActions.every(a => a.success),
        executedBy: context.userId || 'system'
      };

      // Add to history
      this.enforcementHistory.push(result);
      this.trimEnforcementHistory();

      logger.info(`Executed ${actions.length} enforcement actions for resource ${context.resourceId}`, {
        resourceId: context.resourceId,
        actionsExecuted: actions.length,
        successful: executedActions.filter(a => a.success).length,
        failed: executedActions.filter(a => !a.success).length
      });

      return result;
    } catch (error) {
      logger.error(`Failed to execute enforcement actions for resource ${context.resourceId}:`, error);
      throw error;
    }
  }

  /**
   * Get enforcement history
   */
  async getEnforcementHistory(
    filters: {
      organizationId?: string;
      resourceId?: string;
      violationId?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    } = {}
  ): Promise<EnforcementResult[]> {
    try {
      let history = [...this.enforcementHistory];

      // Apply filters
      if (filters.organizationId) {
        history = history.filter(h => h.organizationId === filters.organizationId);
      }

      if (filters.resourceId) {
        history = history.filter(h => h.resourceId === filters.resourceId);
      }

      if (filters.violationId) {
        history = history.filter(h => h.violationId === filters.violationId);
      }

      if (filters.startDate) {
        history = history.filter(h => h.timestamp >= filters.startDate!);
      }

      if (filters.endDate) {
        history = history.filter(h => h.timestamp <= filters.endDate!);
      }

      // Sort by timestamp (newest first)
      history.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Apply limit
      if (filters.limit && filters.limit > 0) {
        history = history.slice(0, filters.limit);
      }

      return history;
    } catch (error) {
      logger.error('Failed to get enforcement history:', error);
      throw error;
    }
  }

  /**
   * Get enforcement statistics
   */
  async getEnforcementStatistics(organizationId: string): Promise<EnforcementStatistics> {
    try {
      const history = this.enforcementHistory.filter(h => h.organizationId === organizationId);

      // Count actions by type
      const actionsByType: Record<string, number> = {};
      // Count actions by resource type
      const actionsByResourceType: Record<string, number> = {};
      // Count success/failure
      let successfulActions = 0;
      let failedActions = 0;

      for (const result of history) {
        // Count by resource type
        if (!actionsByResourceType[result.resourceType]) {
          actionsByResourceType[result.resourceType] = 0;
        }
        actionsByResourceType[result.resourceType]++;

        // Count by action type and success/failure
        for (const action of result.actions) {
          if (!actionsByType[action.type]) {
            actionsByType[action.type] = 0;
          }
          actionsByType[action.type]++;

          if (action.success) {
            successfulActions++;
          } else {
            failedActions++;
          }
        }
      }

      // Calculate success rate
      const totalActions = successfulActions + failedActions;
      const successRate = totalActions > 0 ? (successfulActions / totalActions) * 100 : 100;

      // Get remediation plans for this organization
      const plans = Array.from(this.remediationPlans.values())
        .filter(plan => plan.organizationId === organizationId);

      // Calculate remediation statistics
      const openPlans = plans.filter(p => p.status === 'open').length;
      const completedPlans = plans.filter(p => p.status === 'completed').length;
      const overduePlans = plans.filter(p => p.status === 'open' && p.dueDate && p.dueDate < new Date()).length;

      // Calculate average remediation time (for completed plans)
      let avgRemediationTime = 0;
      const completedPlansWithTime = plans.filter(p => p.status === 'completed' && p.completedAt);
      if (completedPlansWithTime.length > 0) {
        const totalTime = completedPlansWithTime.reduce((sum, p) => {
          return sum + (p.completedAt!.getTime() - p.createdAt.getTime());
        }, 0);
        avgRemediationTime = totalTime / completedPlansWithTime.length;
      }

      return {
        organizationId,
        totalEnforcements: history.length,
        actionsByType,
        actionsByResourceType,
        successfulActions,
        failedActions,
        successRate,
        remediationPlans: {
          total: plans.length,
          open: openPlans,
          completed: completedPlans,
          overdue: overduePlans,
          avgRemediationTime
        },
        lastUpdated: new Date()
      };
    } catch (error) {
      logger.error(`Failed to get enforcement statistics for organization ${organizationId}:`, error);
      throw error;
    }
  }

  /**
   * Execute a specific enforcement action
   */
  private async executeAction(
    action: EnforcementAction,
    context: {
      resourceId: string;
      resourceType: string;
      organizationId: string;
      violationId?: string;
      userId?: string;
    }
  ): Promise<void> {
    switch (action.type) {
      case 'block':
        await this.executeBlockAction(action, context);
        break;

      case 'notify':
        await this.executeNotifyAction(action, context);
        break;

      case 'tag':
        await this.executeTagAction(action, context);
        break;

      case 'quarantine':
        await this.executeQuarantineAction(action, context);
        break;

      case 'remediate':
        await this.executeRemediateAction(action, context);
        break;

      default:
        throw new Error(`Unknown enforcement action type: ${(action as any).type}`);
    }
  }

  /**
   * Execute block action
   */
  private async executeBlockAction(
    action: EnforcementAction,
    context: { resourceId: string; resourceType: string }
  ): Promise<void> {
    logger.warn(`Blocking resource ${context.resourceId} (${context.resourceType})`, {
      resourceId: context.resourceId,
      reason: action.parameters.reason,
      until: action.parameters.until
    });
  }

  /**
   * Execute notify action
   */
  private async executeNotifyAction(
    action: EnforcementAction,
    context: { resourceId: string; resourceType: string }
  ): Promise<void> {
    logger.info(`Sending notification for resource ${context.resourceId}`, {
      resourceId: context.resourceId,
      recipients: action.parameters.recipients,
      channels: action.parameters.channels,
      message: action.parameters.message
    });
  }

  /**
   * Execute tag action
   */
  private async executeTagAction(
    action: EnforcementAction,
    context: { resourceId: string; resourceType: string }
  ): Promise<void> {
    logger.info(`Tagging resource ${context.resourceId}`, {
      resourceId: context.resourceId,
      tags: action.parameters.tags
    });
  }

  /**
   * Execute quarantine action
   */
  private async executeQuarantineAction(
    action: EnforcementAction,
    context: { resourceId: string; resourceType: string }
  ): Promise<void> {
    logger.warn(`Quarantining resource ${context.resourceId}`, {
      resourceId: context.resourceId,
      reason: action.parameters.reason,
      duration: action.parameters.duration
    });
  }

  /**
   * Execute remediate action
   */
  private async executeRemediateAction(
    action: EnforcementAction,
    context: { resourceId: string; resourceType: string }
  ): Promise<void> {
    if (!action.parameters.autoRemediate) {
      logger.info(`Skipping auto-remediation for resource ${context.resourceId} (not enabled)`);
      return;
    }

    logger.info(`Auto-remediating resource ${context.resourceId}`, {
      resourceId: context.resourceId,
      remediationAction: action.parameters.remediationAction
    });
  }

  /**
   * Update plan progress based on step statuses
   */
  private updatePlanProgress(plan: RemediationPlan): void {
    const totalSteps = plan.steps.length;
    if (totalSteps === 0) {
      plan.progress = 100;
      return;
    }

    // Count completed steps
    const completedSteps = plan.steps.filter(step => step.status === 'completed').length;
    const progress = Math.round((completedSteps / totalSteps) * 100);

    plan.progress = progress;

    // Update plan status if all steps are completed
    if (progress === 100 && plan.status === 'open') {
      plan.status = 'completed';
      plan.completedAt = new Date();
    }
  }

  /**
   * Calculate due date based on violation severity
   */
  private calculateDueDate(severity: string): Date {
    const now = new Date();
    let daysToAdd = 30; // Default: 30 days

    switch (severity) {
      case 'critical':
        daysToAdd = 1; // 24 hours
        break;
      case 'high':
        daysToAdd = 7; // 1 week
        break;
      case 'medium':
        daysToAdd = 14; // 2 weeks
        break;
      case 'low':
        daysToAdd = 30; // 30 days
        break;
    }

    return new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  }

  /**
   * Calculate plan due date based on most severe violation
   */
  private calculatePlanDueDate(violations: ComplianceViolation[]): Date {
    // Find the most severe violation
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    let highestSeverity = 'low';

    for (const violation of violations) {
      if (severityOrder[violation.severity] < severityOrder[highestSeverity as keyof typeof severityOrder]) {
        highestSeverity = violation.severity;
      }
    }

    return this.calculateDueDate(highestSeverity);
  }

  /**
   * Determine plan priority based on violations
   */
  private determinePlanPriority(violations: ComplianceViolation[]): 'critical' | 'high' | 'medium' | 'low' {
    // Count violations by severity
    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;

    for (const violation of violations) {
      switch (violation.severity) {
        case 'critical':
          criticalCount++;
          break;
        case 'high':
          highCount++;
          break;
        case 'medium':
          mediumCount++;
          break;
      }
    }

    // Determine priority based on counts
    if (criticalCount > 0) {
      return 'critical';
    } else if (highCount > 0) {
      return 'high';
    } else if (mediumCount > 0) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Generate verification steps for a violation
   */
  private generateVerificationSteps(violation: ComplianceViolation): string[] {
    const steps: string[] = [];

    switch (violation.policyId) {
      case 'data-protection-policy':
        steps.push('Verify that encryption is enabled for all data storage');
        steps.push('Confirm that access controls are properly configured');
        steps.push('Validate that data retention policies are in place');
        break;

      case 'access-control-policy':
        steps.push('Verify that MFA is enabled for all user accounts');
        steps.push('Confirm that authentication policies are properly enforced');
        steps.push('Validate that access logs show MFA usage');
        break;

      default:
        steps.push('Verify that the remediation steps have been completed');
        steps.push('Confirm that the resource now passes compliance validation');
        steps.push('Document the changes made for audit purposes');
    }

    return steps;
  }

  /**
   * Trim enforcement history to prevent memory issues
   */
  private trimEnforcementHistory(): void {
    if (this.enforcementHistory.length > this.MAX_HISTORY_SIZE) {
      this.enforcementHistory = this.enforcementHistory.slice(-this.MAX_HISTORY_SIZE);
    }
  }
}