/**
 * Cost Optimization Service
 * Analyzes resource usage and generates cost optimization recommendations
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../../utils/logger';
import { CostDataPoint } from '../interfaces';
import {
  CostOptimizationRecommendation,
  CostOptimizationAnalysis,
  ResourceUtilization,
  CostOptimizationJob,
  RecommendationType,
  RecommendationStatus
} from './interfaces';

/**
 * Service for generating cost optimization recommendations
 */
export class CostOptimizationService {
  private recommendations: Map<string, CostOptimizationRecommendation> = new Map();
  private jobs: Map<string, CostOptimizationJob> = new Map();

  /**
   * Analyze costs and generate optimization recommendations
   */
  async analyzeAndOptimize(
    organizationId: string,
    costData: CostDataPoint[],
    utilizationData: ResourceUtilization[],
    options: {
      minimumSavings?: number;
      includeTypes?: RecommendationType[];
      userId: string;
    }
  ): Promise<CostOptimizationJob> {
    try {
      const jobId = uuidv4();
      const job: CostOptimizationJob = {
        id: jobId,
        organizationId,
        status: 'running',
        startedAt: new Date(),
        resourcesAnalyzed: 0,
        recommendationsGenerated: 0,
        potentialSavings: 0,
        currency: 'USD',
        createdBy: options.userId,
        metadata: {}
      };

      this.jobs.set(jobId, job);

      logger.info(`Starting cost optimization analysis for organization ${organizationId}`, {
        organizationId,
        jobId,
        costDataPoints: costData.length,
        utilizationDataPoints: utilizationData.length
      });

      // Generate recommendations
      const recommendations = await this.generateRecommendations(
        organizationId,
        costData,
        utilizationData,
        options
      );

      // Update job status
      job.status = 'completed';
      job.completedAt = new Date();
      job.resourcesAnalyzed = utilizationData.length;
      job.recommendationsGenerated = recommendations.length;
      job.potentialSavings = recommendations.reduce((sum, rec) => sum + rec.savingsAmount, 0);

      logger.info(`Completed cost optimization analysis for organization ${organizationId}`, {
        organizationId,
        jobId,
        recommendationsGenerated: recommendations.length,
        potentialSavings: job.potentialSavings
      });

      return job;
    } catch (error) {
      logger.error(`Failed to analyze costs for organization ${organizationId}`, { error });
      throw error;
    }
  }
}  /*
*
   * Generate cost optimization recommendations
   */
  private async generateRecommendations(
    organizationId: string,
    costData: CostDataPoint[],
    utilizationData: ResourceUtilization[],
    options: {
      minimumSavings?: number;
      includeTypes?: RecommendationType[];
    }
  ): Promise<CostOptimizationRecommendation[]> {
    const recommendations: CostOptimizationRecommendation[] = [];

    // Group cost data by resource
    const costByResource = new Map<string, CostDataPoint[]>();
    for (const cost of costData) {
      if (!costByResource.has(cost.resourceId)) {
        costByResource.set(cost.resourceId, []);
      }
      costByResource.get(cost.resourceId)!.push(cost);
    }

    // Analyze each resource
    for (const utilization of utilizationData) {
      const resourceCosts = costByResource.get(utilization.resourceId) || [];
      const resourceRecommendations = await this.analyzeResource(
        organizationId,
        utilization,
        resourceCosts,
        options
      );
      recommendations.push(...resourceRecommendations);
    }

    // Filter by minimum savings
    const filteredRecommendations = recommendations.filter(
      rec => rec.savingsAmount >= (options.minimumSavings || 0)
    );

    // Store recommendations
    for (const recommendation of filteredRecommendations) {
      this.recommendations.set(recommendation.id, recommendation);
    }

    return filteredRecommendations;
  }

  /**
   * Analyze a single resource for optimization opportunities
   */
  private async analyzeResource(
    organizationId: string,
    utilization: ResourceUtilization,
    costs: CostDataPoint[],
    options: {
      includeTypes?: RecommendationType[];
    }
  ): Promise<CostOptimizationRecommendation[]> {
    const recommendations: CostOptimizationRecommendation[] = [];
    const currentCost = costs.reduce((sum, cost) => sum + cost.amount, 0);

    if (currentCost === 0) return recommendations;

    // Check for rightsizing opportunities
    if (!options.includeTypes || options.includeTypes.includes('rightsizing')) {
      const rightsizingRec = this.analyzeRightsizing(organizationId, utilization, currentCost);
      if (rightsizingRec) recommendations.push(rightsizingRec);
    }

    // Check for idle resources
    if (!options.includeTypes || options.includeTypes.includes('idle_resource')) {
      const idleRec = this.analyzeIdleResource(organizationId, utilization, currentCost);
      if (idleRec) recommendations.push(idleRec);
    }

    // Check for reserved instance opportunities
    if (!options.includeTypes || options.includeTypes.includes('reserved_instance')) {
      const reservedRec = this.analyzeReservedInstance(organizationId, utilization, currentCost);
      if (reservedRec) recommendations.push(reservedRec);
    }

    return recommendations;
  }
}  /**
  
 * Analyze rightsizing opportunities
   */
  private analyzeRightsizing(
    organizationId: string,
    utilization: ResourceUtilization,
    currentCost: number
  ): CostOptimizationRecommendation | null {
    const { metrics } = utilization;
    
    // Check CPU utilization
    const cpuUtilization = metrics.cpu?.average || 0;
    const memoryUtilization = metrics.memory?.average || 0;
    
    // If both CPU and memory are under 20%, recommend downsizing
    if (cpuUtilization < 20 && memoryUtilization < 20) {
      const savingsPercentage = 30; // Estimate 30% savings from downsizing
      const savingsAmount = (currentCost * savingsPercentage) / 100;
      
      return {
        id: uuidv4(),
        organizationId,
        resourceId: utilization.resourceId,
        resourceType: utilization.resourceType,
        recommendationType: 'rightsizing',
        title: 'Downsize Underutilized Resource',
        description: `Resource is underutilized with ${cpuUtilization.toFixed(1)}% CPU and ${memoryUtilization.toFixed(1)}% memory usage`,
        currentConfiguration: {
          provider: 'aws', // This would come from actual resource data
          region: 'us-east-1',
          instanceType: 'm5.large', // This would come from actual resource data
          attributes: {}
        },
        recommendedConfiguration: {
          provider: 'aws',
          region: 'us-east-1',
          instanceType: 'm5.medium', // Smaller instance
          attributes: {}
        },
        currentCost,
        recommendedCost: currentCost - savingsAmount,
        savingsAmount,
        savingsPercentage,
        currency: 'USD',
        annualSavings: savingsAmount * 12,
        confidence: 'high',
        effort: 'medium',
        impact: 'medium',
        status: 'pending',
        category: 'compute',
        implementationSteps: [
          'Stop the current instance',
          'Create a snapshot of the instance',
          'Launch a new smaller instance',
          'Test the application performance',
          'Update DNS/load balancer configuration'
        ],
        justification: `Low resource utilization indicates the instance is oversized for current workload`,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          cpuUtilization,
          memoryUtilization,
          analysisMethod: 'utilization_based'
        }
      };
    }
    
    return null;
  }

  /**
   * Analyze idle resource opportunities
   */
  private analyzeIdleResource(
    organizationId: string,
    utilization: ResourceUtilization,
    currentCost: number
  ): CostOptimizationRecommendation | null {
    const { metrics } = utilization;
    
    // Check if resource is completely idle
    const cpuUtilization = metrics.cpu?.average || 0;
    const networkIn = metrics.network?.inbound?.average || 0;
    const networkOut = metrics.network?.outbound?.average || 0;
    
    if (cpuUtilization < 5 && networkIn < 1000 && networkOut < 1000) {
      const savingsAmount = currentCost; // 100% savings by terminating
      
      return {
        id: uuidv4(),
        organizationId,
        resourceId: utilization.resourceId,
        resourceType: utilization.resourceType,
        recommendationType: 'idle_resource',
        title: 'Terminate Idle Resource',
        description: `Resource appears to be idle with minimal CPU (${cpuUtilization.toFixed(1)}%) and network activity`,
        currentConfiguration: {
          provider: 'aws',
          region: 'us-east-1',
          attributes: {}
        },
        recommendedConfiguration: {
          provider: 'aws',
          region: 'us-east-1',
          attributes: { action: 'terminate' }
        },
        currentCost,
        recommendedCost: 0,
        savingsAmount,
        savingsPercentage: 100,
        currency: 'USD',
        annualSavings: savingsAmount * 12,
        confidence: 'medium',
        effort: 'low',
        impact: 'high',
        status: 'pending',
        category: 'compute',
        implementationSteps: [
          'Verify the resource is not needed',
          'Create a backup if necessary',
          'Terminate the resource',
          'Update any dependent configurations'
        ],
        justification: 'Resource shows no significant activity and may be safely terminated',
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          cpuUtilization,
          networkIn,
          networkOut,
          analysisMethod: 'idle_detection'
        }
      };
    }
    
    return null;
  }
}  /
**
   * Analyze reserved instance opportunities
   */
  private analyzeReservedInstance(
    organizationId: string,
    utilization: ResourceUtilization,
    currentCost: number
  ): CostOptimizationRecommendation | null {
    // For resources running consistently, recommend reserved instances
    // This is a simplified analysis - in practice would need historical usage patterns
    
    const savingsPercentage = 40; // Typical RI savings
    const savingsAmount = (currentCost * savingsPercentage) / 100;
    
    return {
      id: uuidv4(),
      organizationId,
      resourceId: utilization.resourceId,
      resourceType: utilization.resourceType,
      recommendationType: 'reserved_instance',
      title: 'Purchase Reserved Instance',
      description: 'Resource runs consistently and would benefit from reserved instance pricing',
      currentConfiguration: {
        provider: 'aws',
        region: 'us-east-1',
        paymentOption: 'on_demand',
        attributes: {}
      },
      recommendedConfiguration: {
        provider: 'aws',
        region: 'us-east-1',
        paymentOption: 'reserved',
        term: 12,
        attributes: {}
      },
      currentCost,
      recommendedCost: currentCost - savingsAmount,
      savingsAmount,
      savingsPercentage,
      currency: 'USD',
      annualSavings: savingsAmount * 12,
      confidence: 'high',
      effort: 'low',
      impact: 'high',
      status: 'pending',
      category: 'reservation',
      implementationSteps: [
        'Review usage patterns to confirm consistent usage',
        'Purchase appropriate reserved instance',
        'Apply reservation to the resource',
        'Monitor savings realization'
      ],
      justification: 'Consistent usage pattern makes this resource a good candidate for reserved pricing',
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        analysisMethod: 'usage_pattern_based',
        recommendedTerm: 12
      }
    };
  }

  /**
   * Get recommendations for an organization
   */
  async getRecommendations(
    organizationId: string,
    options: {
      status?: RecommendationStatus;
      type?: RecommendationType;
      limit?: number;
    } = {}
  ): Promise<CostOptimizationRecommendation[]> {
    let recommendations = Array.from(this.recommendations.values()).filter(
      rec => rec.organizationId === organizationId
    );

    // Apply filters
    if (options.status) {
      recommendations = recommendations.filter(rec => rec.status === options.status);
    }

    if (options.type) {
      recommendations = recommendations.filter(rec => rec.recommendationType === options.type);
    }

    // Sort by savings amount (highest first)
    recommendations.sort((a, b) => b.savingsAmount - a.savingsAmount);

    // Apply limit
    if (options.limit && options.limit > 0) {
      recommendations = recommendations.slice(0, options.limit);
    }

    return recommendations;
  }

  /**
   * Get a specific recommendation
   */
  async getRecommendation(recommendationId: string): Promise<CostOptimizationRecommendation | null> {
    return this.recommendations.get(recommendationId) || null;
  }

  /**
   * Update recommendation status
   */
  async updateRecommendationStatus(
    recommendationId: string,
    status: RecommendationStatus,
    options: {
      implementedBy?: string;
      dismissReason?: string;
      notes?: string;
    } = {}
  ): Promise<CostOptimizationRecommendation> {
    const recommendation = this.recommendations.get(recommendationId);
    if (!recommendation) {
      throw new Error(`Recommendation ${recommendationId} not found`);
    }

    recommendation.status = status;
    recommendation.updatedAt = new Date();

    if (status === 'implemented') {
      recommendation.implementedAt = new Date();
      recommendation.implementedBy = options.implementedBy;
    } else if (status === 'dismissed') {
      recommendation.dismissedAt = new Date();
      recommendation.dismissedBy = options.implementedBy;
      recommendation.dismissReason = options.dismissReason;
    }

    if (options.notes) {
      recommendation.metadata.notes = options.notes;
    }

    this.recommendations.set(recommendationId, recommendation);

    logger.info(`Updated recommendation ${recommendationId} status to ${status}`, {
      recommendationId,
      status,
      resourceId: recommendation.resourceId
    });

    return recommendation;
  }

  /**
   * Get optimization job status
   */
  async getOptimizationJob(jobId: string): Promise<CostOptimizationJob | null> {
    return this.jobs.get(jobId) || null;
  }

  /**
   * Generate optimization analysis summary
   */
  async generateAnalysisSummary(organizationId: string): Promise<CostOptimizationAnalysis> {
    const recommendations = await this.getRecommendations(organizationId);
    
    const totalCost = recommendations.reduce((sum, rec) => sum + rec.currentCost, 0);
    const potentialSavings = recommendations.reduce((sum, rec) => sum + rec.savingsAmount, 0);
    const potentialSavingsPercentage = totalCost > 0 ? (potentialSavings / totalCost) * 100 : 0;

    // Group savings by category and type
    const savingsByCategory: Record<string, number> = {};
    const savingsByType: Record<string, number> = {};
    const savingsByConfidence: Record<string, number> = { high: 0, medium: 0, low: 0 };

    for (const rec of recommendations) {
      savingsByCategory[rec.category] = (savingsByCategory[rec.category] || 0) + rec.savingsAmount;
      savingsByType[rec.recommendationType] = (savingsByType[rec.recommendationType] || 0) + rec.savingsAmount;
      savingsByConfidence[rec.confidence] += rec.savingsAmount;
    }

    // Find top wasteful resources
    const topWastefulResources = recommendations
      .map(rec => ({
        resourceId: rec.resourceId,
        resourceType: rec.resourceType,
        cost: rec.currentCost,
        wastedCost: rec.savingsAmount,
        wastedPercentage: rec.currentCost > 0 ? (rec.savingsAmount / rec.currentCost) * 100 : 0
      }))
      .sort((a, b) => b.wastedCost - a.wastedCost)
      .slice(0, 10);

    return {
      organizationId,
      generatedAt: new Date(),
      period: {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        endDate: new Date()
      },
      totalCost,
      potentialSavings,
      potentialSavingsPercentage,
      currency: 'USD',
      recommendations,
      savingsByCategory: savingsByCategory as any,
      savingsByType: savingsByType as any,
      savingsByConfidence: savingsByConfidence as any,
      topWastefulResources,
      metadata: {
        analysisMethod: 'utilization_based',
        recommendationsCount: recommendations.length
      }
    };
  }
}