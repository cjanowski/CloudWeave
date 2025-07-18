import { IPolicyValidationService } from './interfaces';
import {
  InfrastructureResource,
  ResourceProvisioningRequest,
  PolicyViolation,
  ResourceFilter,
  ResourceOperationResult
} from './types';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Policy definition interface
 */
interface PolicyRule {
  id: string;
  name: string;
  type: 'security' | 'compliance' | 'cost' | 'governance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  condition: (resource: any) => boolean;
  remediation?: string;
  enabled: boolean;
}

/**
 * Service for validating resources against organizational policies
 */
export class PolicyValidationService implements IPolicyValidationService {
  private policies: Map<string, PolicyRule> = new Map();

  constructor() {
    this.initializeDefaultPolicies();
  }

  /**
   * Validate resource configuration against policies
   */
  async validateResource(resource: InfrastructureResource): Promise<PolicyViolation[]> {
    try {
      logger.info(`Validating resource ${resource.id} against policies`);

      const violations: PolicyViolation[] = [];
      const enabledPolicies = Array.from(this.policies.values()).filter(p => p.enabled);

      for (const policy of enabledPolicies) {
        try {
          if (!policy.condition(resource)) {
            violations.push({
              rule: policy.name,
              severity: policy.severity,
              message: `Policy violation: ${policy.description}`,
              remediation: policy.remediation,
              detectedAt: new Date(),
            });
          }
        } catch (error) {
          logger.warn(`Failed to evaluate policy ${policy.id} for resource ${resource.id}:`, error);
        }
      }

      logger.info(`Policy validation completed for resource ${resource.id}`, {
        violations: violations.length,
        criticalViolations: violations.filter(v => v.severity === 'critical').length,
      });

      return violations;
    } catch (error) {
      logger.error(`Failed to validate resource ${resource.id}:`, error);
      throw error;
    }
  }

  /**
   * Validate resource provisioning request against policies
   */
  async validateProvisioningRequest(request: ResourceProvisioningRequest): Promise<PolicyViolation[]> {
    try {
      logger.info(`Validating provisioning request against policies`, { request });

      const violations: PolicyViolation[] = [];
      const enabledPolicies = Array.from(this.policies.values()).filter(p => p.enabled);

      // Create a mock resource object for policy evaluation
      const mockResource = {
        id: 'pending',
        name: request.configuration.name || 'unnamed',
        type: request.resourceType,
        provider: request.provider,
        region: request.region,
        tags: request.tags,
        configuration: request.configuration,
        organizationId: request.organizationId,
        projectId: request.projectId,
        environmentId: request.environmentId,
      };

      for (const policy of enabledPolicies) {
        try {
          if (!policy.condition(mockResource)) {
            violations.push({
              rule: policy.name,
              severity: policy.severity,
              message: `Policy violation: ${policy.description}`,
              remediation: policy.remediation,
              detectedAt: new Date(),
            });
          }
        } catch (error) {
          logger.warn(`Failed to evaluate policy ${policy.id} for provisioning request:`, error);
        }
      }

      logger.info(`Provisioning request validation completed`, {
        violations: violations.length,
        criticalViolations: violations.filter(v => v.severity === 'critical').length,
      });

      return violations;
    } catch (error) {
      logger.error('Failed to validate provisioning request:', error);
      throw error;
    }
  }

  /**
   * Get policy violations for resources
   */
  async getPolicyViolations(filter?: ResourceFilter): Promise<PolicyViolation[]> {
    try {
      // In a real implementation, this would query a database for stored violations
      // For now, we'll return an empty array as violations are calculated on-demand
      logger.info('Getting policy violations', { filter });
      return [];
    } catch (error) {
      logger.error('Failed to get policy violations:', error);
      throw error;
    }
  }

  /**
   * Apply policy remediation
   */
  async applyRemediation(resourceId: string, violationId: string): Promise<ResourceOperationResult> {
    const operationId = uuidv4();
    
    try {
      logger.info(`Applying remediation for violation ${violationId} on resource ${resourceId}`);

      // In a real implementation, this would:
      // 1. Look up the specific violation and its remediation steps
      // 2. Execute the remediation actions
      // 3. Validate that the violation is resolved

      // For now, we'll return a mock success response
      return {
        success: true,
        resourceId,
        operationId,
        message: `Remediation applied for violation ${violationId}`,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error(`Failed to apply remediation for violation ${violationId}:`, error);
      return {
        success: false,
        resourceId,
        operationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Add a new policy rule
   */
  addPolicy(policy: PolicyRule): void {
    this.policies.set(policy.id, policy);
    logger.info(`Added policy ${policy.id}: ${policy.name}`);
  }

  /**
   * Remove a policy rule
   */
  removePolicy(policyId: string): void {
    if (this.policies.delete(policyId)) {
      logger.info(`Removed policy ${policyId}`);
    }
  }

  /**
   * Enable or disable a policy
   */
  setPolicyEnabled(policyId: string, enabled: boolean): void {
    const policy = this.policies.get(policyId);
    if (policy) {
      policy.enabled = enabled;
      logger.info(`Policy ${policyId} ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Get all policies
   */
  getPolicies(): PolicyRule[] {
    return Array.from(this.policies.values());
  }

  /**
   * Get policy statistics
   */
  getPolicyStatistics(): {
    totalPolicies: number;
    enabledPolicies: number;
    policiesByType: Record<string, number>;
    policiesBySeverity: Record<string, number>;
  } {
    const policies = Array.from(this.policies.values());
    const enabled = policies.filter(p => p.enabled);

    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    policies.forEach(policy => {
      byType[policy.type] = (byType[policy.type] || 0) + 1;
      bySeverity[policy.severity] = (bySeverity[policy.severity] || 0) + 1;
    });

    return {
      totalPolicies: policies.length,
      enabledPolicies: enabled.length,
      policiesByType: byType,
      policiesBySeverity: bySeverity,
    };
  }

  // Private helper methods
  private initializeDefaultPolicies(): void {
    const defaultPolicies: PolicyRule[] = [
      {
        id: 'security-001',
        name: 'Require Encryption at Rest',
        type: 'security',
        severity: 'high',
        description: 'All storage resources must have encryption at rest enabled',
        condition: (resource: any) => {
          if (resource.type === 'storage') {
            return resource.configuration?.encryption === true ||
                   resource.configuration?.encryption === 'AES256' ||
                   resource.configuration?.encryption === 'aws:kms';
          }
          return true; // Policy doesn't apply to non-storage resources
        },
        remediation: 'Enable encryption at rest in the storage configuration',
        enabled: true,
      },
      {
        id: 'security-002',
        name: 'No Public Access',
        type: 'security',
        severity: 'critical',
        description: 'Resources should not allow public access unless explicitly approved',
        condition: (resource: any) => {
          return resource.configuration?.publicAccess !== true &&
                 resource.configuration?.public !== true;
        },
        remediation: 'Disable public access or add explicit approval tag',
        enabled: true,
      },
      {
        id: 'governance-001',
        name: 'Required Tags',
        type: 'governance',
        severity: 'medium',
        description: 'All resources must have required tags: Environment, Team, Project',
        condition: (resource: any) => {
          const requiredTags = ['Environment', 'Team', 'Project'];
          return requiredTags.every(tag => resource.tags && resource.tags[tag]);
        },
        remediation: 'Add missing required tags: Environment, Team, Project',
        enabled: true,
      },
      {
        id: 'cost-001',
        name: 'Instance Size Limits',
        type: 'cost',
        severity: 'medium',
        description: 'Compute instances should not exceed approved size limits',
        condition: (resource: any) => {
          if (resource.type === 'compute') {
            const instanceType = resource.configuration?.instanceType || 
                               resource.configuration?.vmSize ||
                               resource.configuration?.machineType;
            
            // Define allowed instance types (this would come from configuration)
            const allowedTypes = [
              't3.micro', 't3.small', 't3.medium',
              'Standard_B1s', 'Standard_B2s',
              'e2-micro', 'e2-small', 'e2-medium'
            ];
            
            return !instanceType || allowedTypes.includes(instanceType);
          }
          return true;
        },
        remediation: 'Use an approved instance size or request exception approval',
        enabled: true,
      },
      {
        id: 'compliance-001',
        name: 'Data Residency',
        type: 'compliance',
        severity: 'high',
        description: 'Resources must be deployed in approved regions for data residency compliance',
        condition: (resource: any) => {
          // Define approved regions (this would come from configuration)
          const approvedRegions = [
            'us-east-1', 'us-west-2', 'eu-west-1',
            'eastus', 'westus2', 'westeurope',
            'us-central1', 'europe-west1'
          ];
          
          return approvedRegions.includes(resource.region);
        },
        remediation: 'Deploy resource in an approved region',
        enabled: true,
      },
      {
        id: 'security-003',
        name: 'Network Security Groups',
        type: 'security',
        severity: 'high',
        description: 'Compute resources must have network security groups configured',
        condition: (resource: any) => {
          if (resource.type === 'compute') {
            return resource.configuration?.securityGroups ||
                   resource.configuration?.networkSecurityGroup ||
                   resource.configuration?.firewallRules;
          }
          return true;
        },
        remediation: 'Configure appropriate network security groups',
        enabled: true,
      },
    ];

    defaultPolicies.forEach(policy => {
      this.policies.set(policy.id, policy);
    });

    logger.info(`Initialized ${defaultPolicies.length} default policies`);
  }
}