import { IDriftDetectionService } from './interfaces';
import {
  DriftDetectionResult,
  DriftDetail,
  ResourceFilter,
  InfrastructureResource
} from './types';
import { IInfrastructureService } from './interfaces';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service for detecting configuration drift between desired and actual resource states
 */
export class DriftDetectionService implements IDriftDetectionService {
  private scheduledJobs: Map<string, NodeJS.Timeout> = new Map();
  private driftResults: Map<string, DriftDetectionResult> = new Map();

  constructor(private infrastructureService: IInfrastructureService) {}

  /**
   * Detect drift for a specific resource
   */
  async detectDrift(resourceId: string): Promise<DriftDetectionResult> {
    try {
      logger.info(`Detecting drift for resource ${resourceId}`);

      const resource = await this.infrastructureService.getResource(resourceId);
      if (!resource) {
        throw new Error(`Resource ${resourceId} not found`);
      }

      const driftDetails = this.compareStates(resource);
      const hasDrift = driftDetails.length > 0;
      const severity = this.calculateDriftSeverity(driftDetails);

      const result: DriftDetectionResult = {
        resourceId,
        hasDrift,
        driftDetails,
        detectedAt: new Date(),
        severity,
      };

      // Cache the result
      this.driftResults.set(resourceId, result);

      logger.info(`Drift detection completed for ${resourceId}`, {
        hasDrift,
        driftCount: driftDetails.length,
        severity,
      });

      return result;
    } catch (error) {
      logger.error(`Failed to detect drift for resource ${resourceId}:`, error);
      throw error;
    }
  }

  /**
   * Detect drift for multiple resources
   */
  async detectDriftBatch(resourceIds: string[]): Promise<DriftDetectionResult[]> {
    try {
      logger.info(`Detecting drift for ${resourceIds.length} resources`);

      const results = await Promise.allSettled(
        resourceIds.map(id => this.detectDrift(id))
      );

      const driftResults: DriftDetectionResult[] = [];
      const errors: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          driftResults.push(result.value);
        } else {
          errors.push(`${resourceIds[index]}: ${result.reason.message}`);
        }
      });

      if (errors.length > 0) {
        logger.warn(`Drift detection failed for some resources:`, errors);
      }

      logger.info(`Drift detection batch completed`, {
        total: resourceIds.length,
        successful: driftResults.length,
        failed: errors.length,
      });

      return driftResults;
    } catch (error) {
      logger.error('Failed to detect drift for batch:', error);
      throw error;
    }
  }

  /**
   * Schedule drift detection for resources matching filter
   */
  async scheduleDriftDetection(filter: ResourceFilter, intervalMinutes: number): Promise<void> {
    try {
      const scheduleId = uuidv4();
      logger.info(`Scheduling drift detection with interval ${intervalMinutes} minutes`, {
        scheduleId,
        filter,
      });

      const runDriftDetection = async () => {
        try {
          const resources = await this.infrastructureService.getResources(filter);
          const resourceIds = resources.map(r => r.id);
          
          if (resourceIds.length > 0) {
            await this.detectDriftBatch(resourceIds);
            logger.info(`Scheduled drift detection completed for ${resourceIds.length} resources`);
          }
        } catch (error) {
          logger.error('Scheduled drift detection failed:', error);
        }
      };

      // Run immediately
      await runDriftDetection();

      // Schedule recurring execution
      const intervalMs = intervalMinutes * 60 * 1000;
      const timer = setInterval(runDriftDetection, intervalMs);
      
      this.scheduledJobs.set(scheduleId, timer);

      logger.info(`Drift detection scheduled successfully`, { scheduleId, intervalMinutes });
    } catch (error) {
      logger.error('Failed to schedule drift detection:', error);
      throw error;
    }
  }

  /**
   * Get drift detection results
   */
  async getDriftResults(filter?: ResourceFilter): Promise<DriftDetectionResult[]> {
    try {
      let results = Array.from(this.driftResults.values());

      if (filter) {
        // Apply filtering to drift results
        results = results.filter(result => {
          // For now, we'll just filter by basic criteria
          // In a real implementation, we'd need to fetch resource details to apply complex filters
          return true;
        });
      }

      logger.info(`Retrieved ${results.length} drift detection results`);
      return results;
    } catch (error) {
      logger.error('Failed to get drift results:', error);
      throw error;
    }
  }

  /**
   * Clear scheduled drift detection jobs
   */
  clearScheduledJobs(): void {
    this.scheduledJobs.forEach((timer, scheduleId) => {
      clearInterval(timer);
      logger.info(`Cleared scheduled drift detection job ${scheduleId}`);
    });
    this.scheduledJobs.clear();
  }

  /**
   * Get drift statistics
   */
  getDriftStatistics(): {
    totalResources: number;
    resourcesWithDrift: number;
    driftPercentage: number;
    severityBreakdown: Record<string, number>;
  } {
    const results = Array.from(this.driftResults.values());
    const resourcesWithDrift = results.filter(r => r.hasDrift);
    
    const severityBreakdown = {
      low: 0,
      medium: 0,
      high: 0,
    };

    resourcesWithDrift.forEach(result => {
      severityBreakdown[result.severity]++;
    });

    return {
      totalResources: results.length,
      resourcesWithDrift: resourcesWithDrift.length,
      driftPercentage: results.length > 0 ? (resourcesWithDrift.length / results.length) * 100 : 0,
      severityBreakdown,
    };
  }

  // Private helper methods
  private compareStates(resource: InfrastructureResource): DriftDetail[] {
    const driftDetails: DriftDetail[] = [];
    const desired = resource.desiredState;
    const actual = resource.actualState;

    // Compare configuration
    const configDrift = this.compareObjects(
      desired.configuration,
      actual.configuration,
      'configuration'
    );
    driftDetails.push(...configDrift);

    // Compare tags
    const tagDrift = this.compareObjects(
      desired.tags,
      actual.tags,
      'tags'
    );
    driftDetails.push(...tagDrift);

    // Compare status
    if (desired.status !== actual.status) {
      driftDetails.push({
        property: 'status',
        desiredValue: desired.status,
        actualValue: actual.status,
        changeType: 'modified',
      });
    }

    return driftDetails;
  }

  private compareObjects(
    desired: Record<string, any>,
    actual: Record<string, any>,
    prefix: string
  ): DriftDetail[] {
    const driftDetails: DriftDetail[] = [];
    const allKeys = new Set([...Object.keys(desired), ...Object.keys(actual)]);

    for (const key of allKeys) {
      const propertyPath = `${prefix}.${key}`;
      const desiredValue = desired[key];
      const actualValue = actual[key];

      if (desiredValue === undefined && actualValue !== undefined) {
        // Property was added
        driftDetails.push({
          property: propertyPath,
          desiredValue: undefined,
          actualValue,
          changeType: 'added',
        });
      } else if (desiredValue !== undefined && actualValue === undefined) {
        // Property was removed
        driftDetails.push({
          property: propertyPath,
          desiredValue,
          actualValue: undefined,
          changeType: 'removed',
        });
      } else if (desiredValue !== actualValue) {
        // Property was modified
        if (typeof desiredValue === 'object' && typeof actualValue === 'object') {
          // Recursively compare nested objects
          const nestedDrift = this.compareObjects(desiredValue, actualValue, propertyPath);
          driftDetails.push(...nestedDrift);
        } else {
          driftDetails.push({
            property: propertyPath,
            desiredValue,
            actualValue,
            changeType: 'modified',
          });
        }
      }
    }

    return driftDetails;
  }

  private calculateDriftSeverity(driftDetails: DriftDetail[]): 'low' | 'medium' | 'high' {
    if (driftDetails.length === 0) return 'low';

    // Define critical properties that indicate high severity drift
    const criticalProperties = [
      'configuration.securityGroups',
      'configuration.iamRole',
      'configuration.encryption',
      'configuration.publicAccess',
      'status',
    ];

    const hasCriticalDrift = driftDetails.some(detail =>
      criticalProperties.some(critical => detail.property.includes(critical))
    );

    if (hasCriticalDrift) return 'high';
    if (driftDetails.length > 5) return 'medium';
    return 'low';
  }
}