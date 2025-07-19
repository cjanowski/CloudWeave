/**
 * Tests for CostOptimizationService
 */

import { CostOptimizationService } from './CostOptimizationService';
import { CostDataPoint } from '../interfaces';
import { ResourceUtilization } from './interfaces';
import { jest, describe, beforeEach, it, expect } from '@jest/globals';

describe('CostOptimizationService', () => {
  let optimizationService: CostOptimizationService;

  beforeEach(() => {
    optimizationService = new CostOptimizationService();
  });

  describe('analyzeAndOptimize', () => {
    const mockCostData: CostDataPoint[] = [
      {
        id: 'cost-1',
        timestamp: new Date('2023-01-15'),
        amount: 100,
        currency: 'USD',
        resourceId: 'resource-1',
        resourceType: 'instance',
        serviceType: 'EC2',
        region: 'us-east-1',
        usageType: 'BoxUsage',
        usageQuantity: 24,
        usageUnit: 'hours',
        provider: 'aws',
        accountId: 'account-123',
        tags: { environment: 'production' },
        metadata: {}
      },
      {
        id: 'cost-2',
        timestamp: new Date('2023-01-15'),
        amount: 50,
        currency: 'USD',
        resourceId: 'resource-2',
        resourceType: 'instance',
        serviceType: 'EC2',
        region: 'us-east-1',
        usageType: 'BoxUsage',
        usageQuantity: 24,
        usageUnit: 'hours',
        provider: 'aws',
        accountId: 'account-123',
        tags: { environment: 'development' },
        metadata: {}
      }
    ];

    const mockUtilizationData: ResourceUtilization[] = [
      {
        resourceId: 'resource-1',
        resourceType: 'instance',
        metrics: {
          cpu: {
            average: 15,
            peak: 25,
            p95: 20
          },
          memory: {
            average: 18,
            peak: 30,
            p95: 25
          }
        },
        period: {
          startDate: new Date('2023-01-01'),
          endDate: new Date('2023-01-31')
        },
        dataPoints: 744 // 31 days * 24 hours
      },
      {
        resourceId: 'resource-2',
        resourceType: 'instance',
        metrics: {
          cpu: {
            average: 2,
            peak: 5,
            p95: 4
          },
          network: {
            inbound: {
              average: 500,
              peak: 1000
            },
            outbound: {
              average: 300,
              peak: 800
            }
          }
        },
        period: {
          startDate: new Date('2023-01-01'),
          endDate: new Date('2023-01-31')
        },
        dataPoints: 744
      }
    ];

    it('should analyze costs and generate optimization recommendations', async () => {
      const job = await optimizationService.analyzeAndOptimize(
        'org-123',
        mockCostData,
        mockUtilizationData,
        {
          userId: 'user-123'
        }
      );

      expect(job).toBeDefined();
      expect(job.id).toBeDefined();
      expect(job.organizationId).toBe('org-123');
      expect(job.status).toBe('completed');
      expect(job.resourcesAnalyzed).toBe(2);
      expect(job.recommendationsGenerated).toBeGreaterThan(0);
      expect(job.potentialSavings).toBeGreaterThan(0);
    });

    it('should generate rightsizing recommendations for underutilized resources', async () => {
      await optimizationService.analyzeAndOptimize(
        'org-123',
        mockCostData,
        mockUtilizationData,
        {
          includeTypes: ['rightsizing'],
          userId: 'user-123'
        }
      );

      const recommendations = await optimizationService.getRecommendations('org-123', {
        type: 'rightsizing'
      });

      expect(recommendations.length).toBeGreaterThan(0);
      
      const rightsizingRec = recommendations.find(r => r.resourceId === 'resource-1');
      expect(rightsizingRec).toBeDefined();
      expect(rightsizingRec!.recommendationType).toBe('rightsizing');
      expect(rightsizingRec!.savingsAmount).toBeGreaterThan(0);
      expect(rightsizingRec!.confidence).toBe('high');
    });

    it('should generate idle resource recommendations', async () => {
      await optimizationService.analyzeAndOptimize(
        'org-123',
        mockCostData,
        mockUtilizationData,
        {
          includeTypes: ['idle_resource'],
          userId: 'user-123'
        }
      );

      const recommendations = await optimizationService.getRecommendations('org-123', {
        type: 'idle_resource'
      });

      expect(recommendations.length).toBeGreaterThan(0);
      
      const idleRec = recommendations.find(r => r.resourceId === 'resource-2');
      expect(idleRec).toBeDefined();
      expect(idleRec!.recommendationType).toBe('idle_resource');
      expect(idleRec!.savingsPercentage).toBe(100);
    });

    it('should filter recommendations by minimum savings', async () => {
      await optimizationService.analyzeAndOptimize(
        'org-123',
        mockCostData,
        mockUtilizationData,
        {
          minimumSavings: 1000, // High threshold
          userId: 'user-123'
        }
      );

      const recommendations = await optimizationService.getRecommendations('org-123');
      
      // Should have fewer recommendations due to high threshold
      recommendations.forEach(rec => {
        expect(rec.savingsAmount).toBeGreaterThanOrEqual(1000);
      });
    });
  });

  describe('getRecommendations', () => {
    beforeEach(async () => {
      // Generate some test recommendations
      const mockCostData: CostDataPoint[] = [
        {
          id: 'cost-1',
          timestamp: new Date('2023-01-15'),
          amount: 200,
          currency: 'USD',
          resourceId: 'resource-1',
          resourceType: 'instance',
          serviceType: 'EC2',
          region: 'us-east-1',
          usageType: 'BoxUsage',
          usageQuantity: 24,
          usageUnit: 'hours',
          provider: 'aws',
          accountId: 'account-123',
          tags: {},
          metadata: {}
        }
      ];

      const mockUtilizationData: ResourceUtilization[] = [
        {
          resourceId: 'resource-1',
          resourceType: 'instance',
          metrics: {
            cpu: { average: 10, peak: 20, p95: 15 },
            memory: { average: 15, peak: 25, p95: 20 }
          },
          period: {
            startDate: new Date('2023-01-01'),
            endDate: new Date('2023-01-31')
          },
          dataPoints: 744
        }
      ];

      await optimizationService.analyzeAndOptimize(
        'org-123',
        mockCostData,
        mockUtilizationData,
        { userId: 'user-123' }
      );
    });

    it('should return recommendations for an organization', async () => {
      const recommendations = await optimizationService.getRecommendations('org-123');
      
      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].organizationId).toBe('org-123');
    });

    it('should filter recommendations by status', async () => {
      const recommendations = await optimizationService.getRecommendations('org-123', {
        status: 'pending'
      });
      
      recommendations.forEach(rec => {
        expect(rec.status).toBe('pending');
      });
    });

    it('should filter recommendations by type', async () => {
      const recommendations = await optimizationService.getRecommendations('org-123', {
        type: 'rightsizing'
      });
      
      recommendations.forEach(rec => {
        expect(rec.recommendationType).toBe('rightsizing');
      });
    });

    it('should limit the number of recommendations returned', async () => {
      const recommendations = await optimizationService.getRecommendations('org-123', {
        limit: 1
      });
      
      expect(recommendations.length).toBeLessThanOrEqual(1);
    });

    it('should sort recommendations by savings amount', async () => {
      const recommendations = await optimizationService.getRecommendations('org-123');
      
      if (recommendations.length > 1) {
        for (let i = 1; i < recommendations.length; i++) {
          expect(recommendations[i - 1].savingsAmount).toBeGreaterThanOrEqual(
            recommendations[i].savingsAmount
          );
        }
      }
    });
  });

  describe('updateRecommendationStatus', () => {
    let recommendationId: string;

    beforeEach(async () => {
      // Generate a test recommendation
      const mockCostData: CostDataPoint[] = [
        {
          id: 'cost-1',
          timestamp: new Date('2023-01-15'),
          amount: 100,
          currency: 'USD',
          resourceId: 'resource-1',
          resourceType: 'instance',
          serviceType: 'EC2',
          region: 'us-east-1',
          usageType: 'BoxUsage',
          usageQuantity: 24,
          usageUnit: 'hours',
          provider: 'aws',
          accountId: 'account-123',
          tags: {},
          metadata: {}
        }
      ];

      const mockUtilizationData: ResourceUtilization[] = [
        {
          resourceId: 'resource-1',
          resourceType: 'instance',
          metrics: {
            cpu: { average: 10, peak: 20, p95: 15 },
            memory: { average: 15, peak: 25, p95: 20 }
          },
          period: {
            startDate: new Date('2023-01-01'),
            endDate: new Date('2023-01-31')
          },
          dataPoints: 744
        }
      ];

      await optimizationService.analyzeAndOptimize(
        'org-123',
        mockCostData,
        mockUtilizationData,
        { userId: 'user-123' }
      );

      const recommendations = await optimizationService.getRecommendations('org-123');
      recommendationId = recommendations[0].id;
    });

    it('should update recommendation status to implemented', async () => {
      const updatedRec = await optimizationService.updateRecommendationStatus(
        recommendationId,
        'implemented',
        {
          implementedBy: 'user-456',
          notes: 'Successfully implemented the recommendation'
        }
      );

      expect(updatedRec.status).toBe('implemented');
      expect(updatedRec.implementedBy).toBe('user-456');
      expect(updatedRec.implementedAt).toBeInstanceOf(Date);
      expect(updatedRec.metadata.notes).toBe('Successfully implemented the recommendation');
    });

    it('should update recommendation status to dismissed', async () => {
      const updatedRec = await optimizationService.updateRecommendationStatus(
        recommendationId,
        'dismissed',
        {
          implementedBy: 'user-456',
          dismissReason: 'Not applicable for this resource'
        }
      );

      expect(updatedRec.status).toBe('dismissed');
      expect(updatedRec.dismissedBy).toBe('user-456');
      expect(updatedRec.dismissedAt).toBeInstanceOf(Date);
      expect(updatedRec.dismissReason).toBe('Not applicable for this resource');
    });

    it('should throw error for non-existent recommendation', async () => {
      await expect(
        optimizationService.updateRecommendationStatus(
          'non-existent-id',
          'implemented'
        )
      ).rejects.toThrow('Recommendation non-existent-id not found');
    });
  });

  describe('generateAnalysisSummary', () => {
    beforeEach(async () => {
      // Generate test recommendations
      const mockCostData: CostDataPoint[] = [
        {
          id: 'cost-1',
          timestamp: new Date('2023-01-15'),
          amount: 500,
          currency: 'USD',
          resourceId: 'resource-1',
          resourceType: 'instance',
          serviceType: 'EC2',
          region: 'us-east-1',
          usageType: 'BoxUsage',
          usageQuantity: 24,
          usageUnit: 'hours',
          provider: 'aws',
          accountId: 'account-123',
          tags: {},
          metadata: {}
        },
        {
          id: 'cost-2',
          timestamp: new Date('2023-01-15'),
          amount: 300,
          currency: 'USD',
          resourceId: 'resource-2',
          resourceType: 'storage',
          serviceType: 'S3',
          region: 'us-east-1',
          usageType: 'StorageUsage',
          usageQuantity: 100,
          usageUnit: 'GB',
          provider: 'aws',
          accountId: 'account-123',
          tags: {},
          metadata: {}
        }
      ];

      const mockUtilizationData: ResourceUtilization[] = [
        {
          resourceId: 'resource-1',
          resourceType: 'instance',
          metrics: {
            cpu: { average: 10, peak: 20, p95: 15 },
            memory: { average: 15, peak: 25, p95: 20 }
          },
          period: {
            startDate: new Date('2023-01-01'),
            endDate: new Date('2023-01-31')
          },
          dataPoints: 744
        },
        {
          resourceId: 'resource-2',
          resourceType: 'storage',
          metrics: {
            disk: { average: 50, peak: 80, p95: 70 }
          },
          period: {
            startDate: new Date('2023-01-01'),
            endDate: new Date('2023-01-31')
          },
          dataPoints: 744
        }
      ];

      await optimizationService.analyzeAndOptimize(
        'org-123',
        mockCostData,
        mockUtilizationData,
        { userId: 'user-123' }
      );
    });

    it('should generate analysis summary', async () => {
      const summary = await optimizationService.generateAnalysisSummary('org-123');

      expect(summary).toBeDefined();
      expect(summary.organizationId).toBe('org-123');
      expect(summary.totalCost).toBeGreaterThan(0);
      expect(summary.potentialSavings).toBeGreaterThan(0);
      expect(summary.potentialSavingsPercentage).toBeGreaterThan(0);
      expect(summary.currency).toBe('USD');
      expect(summary.recommendations.length).toBeGreaterThan(0);
      expect(summary.savingsByCategory).toBeDefined();
      expect(summary.savingsByType).toBeDefined();
      expect(summary.savingsByConfidence).toBeDefined();
      expect(summary.topWastefulResources.length).toBeGreaterThan(0);
    });

    it('should include top wasteful resources', async () => {
      const summary = await optimizationService.generateAnalysisSummary('org-123');

      expect(summary.topWastefulResources).toBeDefined();
      expect(summary.topWastefulResources.length).toBeGreaterThan(0);
      
      const topResource = summary.topWastefulResources[0];
      expect(topResource.resourceId).toBeDefined();
      expect(topResource.resourceType).toBeDefined();
      expect(topResource.cost).toBeGreaterThan(0);
      expect(topResource.wastedCost).toBeGreaterThan(0);
      expect(topResource.wastedPercentage).toBeGreaterThan(0);
    });
  });
});