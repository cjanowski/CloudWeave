/**
 * Infrastructure Resource Management Module
 * 
 * This module provides comprehensive infrastructure resource management capabilities
 * including CRUD operations, drift detection, policy validation, and state tracking.
 */

// Types and interfaces
export * from './types';
export * from './interfaces';

// Core services
export { InfrastructureService } from './InfrastructureService';
export { DriftDetectionService } from './DriftDetectionService';
export { PolicyValidationService } from './PolicyValidationService';

// Convenience functions for creating and configuring services
import { InfrastructureService } from './InfrastructureService';
import { DriftDetectionService } from './DriftDetectionService';
import { PolicyValidationService } from './PolicyValidationService';
import { CloudProviderConfig } from '../cloud/types';

/**
 * Create a fully configured infrastructure service with all dependencies
 */
export async function createInfrastructureService(
  cloudConfigs: CloudProviderConfig[]
): Promise<{
  infrastructureService: InfrastructureService;
  driftDetectionService: DriftDetectionService;
  policyValidationService: PolicyValidationService;
}> {
  // Create policy validation service
  const policyValidationService = new PolicyValidationService();

  // Create infrastructure service
  const infrastructureService = new InfrastructureService(
    cloudConfigs,
    undefined, // Will be set after drift service is created
    policyValidationService
  );

  // Create drift detection service
  const driftDetectionService = new DriftDetectionService(infrastructureService);

  // Initialize infrastructure service
  await infrastructureService.initialize();

  return {
    infrastructureService,
    driftDetectionService,
    policyValidationService,
  };
}

/**
 * Default configuration for infrastructure services
 */
export const defaultInfrastructureConfig = {
  driftDetection: {
    defaultIntervalMinutes: 60,
    batchSize: 50,
  },
  policyValidation: {
    enabledByDefault: true,
    strictMode: false,
  },
  resourceSync: {
    defaultIntervalMinutes: 30,
    maxRetries: 3,
  },
};