/**
 * Tests for CostTrackingService
 */

import { CostTrackingService } from './CostTrackingService';
import { CostDataPoint, CostDataSource, CostQueryParams } from './interfaces';
import { jest, describe, beforeEach, it, expect } from '@jest/globals';

describe('CostTrackingService', () => {
  let trackingService: CostTrackingService;

  beforeEach(() => {
    trackingService = new CostTrackingService();
  });

  describe('registerDataSource', () => {
    it('should register a new data source', async () => {
      const dataSource = await trackingService.registerDataSource(
        'org-123',
        'AWS Production',
        'aws',
        'account-123',
        {
          accessKeyId: 'test-key',
          secretAccessKey: 'test-secret'
        },
        {
          userId: 'user-123'
        }
      );

      expect(dataSource).toBeDefined();
      expect(dataSource.id).toBeDefined();
      expect(dataSource.name).toBe('AWS Production');
      expect(dataSource.provider).toBe('aws');
      expect(dataSource.accountId).toBe('account-123');
      expect(dataSource.status).toBe('active');
    });

    it('should throw error for duplicate data source', async () => {
      await trackingService.registerDataSource(
        'org-123',
        'AWS Production',
        'aws',
        'account-123',
        {
          accessKeyId: 'test-key',
          secretAccessKey: 'test-secret'
        },
        {
          userId: 'user-123'
        }
      );

      await expect(
        trackingService.registerDataSource(
          'org-123',
          'AWS Production Duplicate',
          'aws',
          'account-123',
          {
            accessKeyId: 'test-key-2',
            secretAccessKey: 'test-secret-2'
          },
          {
            userId: 'user-123'
          }
        )
      ).rejects.toThrow('Data source for aws:account-123 already exists');
    });

    it('should throw error for invalid credentials', async () => {
      await expect(
        trackingService.registerDataSource(
          'org-123',
          'AWS Production',
          'aws',
          'account-123',
          {
            // Missing secretAccessKey
            accessKeyId: 'test-key'
          },
          {
            userId: 'user-123'
          }
        )
      ).rejects.toThrow('AWS credentials must include accessKeyId and secretAccessKey');
    });
  });

  describe('updateDataSource', () => {
    let dataSourceId: string;

    beforeEach(async () => {
      const dataSource = await trackingService.registerDataSource(
        'org-123',
        'AWS Production',
        'aws',
        'account-123',
        {
          accessKeyId: 'test-key',
          secretAccessKey: 'test-secret'
        },
        {
          userId: 'user-123'
        }
      );
      dataSourceId = dataSource.id;
    });

    it('should update data source properties', async () => {
      const updatedDataSource = await trackingService.updateDataSource(dataSourceId, {
        name: 'AWS Production Updated',
        importFrequency: 'weekly',
        status: 'inactive'
      });

      expect(updatedDataSource.name).toBe('AWS Production Updated');
      expect(updatedDataSource.importFrequency).toBe('weekly');
      expect(updatedDataSource.status).toBe('inactive');
    });

    it('should throw error for non-existent data source', async () => {
      await expect(
        trackingService.updateDataSource('non-existent-id', {
          name: 'Updated Name'
        })
      ).rejects.toThrow('Data source non-existent-id not found');
    });
  });

  describe('getDataSources', () => {
    beforeEach(async () => {
      await trackingService.registerDataSource(
        'org-123',
        'AWS Production',
        'aws',
        'account-123',
        {
          accessKeyId: 'test-key',
          secretAccessKey: 'test-secret'
        },
        {
          userId: 'user-123'
        }
      );

      await trackingService.registerDataSource(
        'org-123',
        'Azure Production',
        'azure',
        'subscription-123',
        {
          clientId: 'test-client',
          clientSecret: 'test-secret',
          tenantId: 'test-tenant'
        },
        {
          userId: 'user-123'
        }
      );

      await trackingService.registerDataSource(
        'org-456',
        'GCP Production',
        'gcp',
        'project-123',
        {
          serviceAccountKey: 'test-key'
        },
        {
          userId: 'user-123'
        }
      );
    });

    it('should get all data sources for an organization', async () => {
      const dataSources = await trackingService.getDataSources('org-123');
      expect(dataSources).toHaveLength(2);
      expect(dataSources[0].name).toBe('AWS Production');
      expect(dataSources[1].name).toBe('Azure Production');
    });

    it('should return empty array for organization with no data sources', async () => {
      const dataSources = await trackingService.getDataSources('org-999');
      expect(dataSources).toHaveLength(0);
    });
  });

  describe('importCostData', () => {
    let dataSourceId: string;

    beforeEach(async () => {
      const dataSource = await trackingService.registerDataSource(
        'org-123',
        'AWS Production',
        'aws',
        'account-123',
        {
          accessKeyId: 'test-key',
          secretAccessKey: 'test-secret'
        },
        {
          userId: 'user-123'
        }
      );
      dataSourceId = dataSource.id;
    });

    it('should import cost data successfully', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');

      const job = await trackingService.importCostData(
        'org-123',
        'aws',
        'account-123',
        startDate,
        endDate,
        {
          dataSourceId,
          userId: 'user-123'
        }
      );

      expect(job).toBeDefined();
      expect(job.status).toBe('completed');
      expect(job.recordsProcessed).toBeGreaterThan(0);
      expect(job.recordsImported).toBeGreaterThan(0);
    });

    it('should throw error for non-existent data source', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');

      await expect(
        trackingService.importCostData(
          'org-123',
          'aws',
          'account-123',
          startDate,
          endDate,
          {
            dataSourceId: 'non-existent-id',
            userId: 'user-123'
          }
        )
      ).rejects.toThrow('Data source non-existent-id not found');
    });
  });

  describe('queryCosts', () => {
    beforeEach(async () => {
      // Register data source
      const dataSource = await trackingService.registerDataSource(
        'org-123',
        'AWS Production',
        'aws',
        'account-123',
        {
          accessKeyId: 'test-key',
          secretAccessKey: 'test-secret'
        },
        {
          userId: 'user-123'
        }
      );

      // Import cost data
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');

      await trackingService.importCostData(
        'org-123',
        'aws',
        'account-123',
        startDate,
        endDate,
        {
          dataSourceId: dataSource.id,
          userId: 'user-123'
        }
      );
    });

    it('should query costs with basic parameters', async () => {
      const params: CostQueryParams = {
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-31')
      };

      const result = await trackingService.queryCosts('org-123', params);

      expect(result).toBeDefined();
      expect(result.totalCost).toBeGreaterThan(0);
      expect(result.currency).toBe('USD');
      expect(result.startDate).toEqual(params.startDate);
      expect(result.endDate).toEqual(params.endDate);
    });

    it('should query costs with grouping', async () => {
      const params: CostQueryParams = {
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-31'),
        groupBy: ['service', 'region']
      };

      const result = await trackingService.queryCosts('org-123', params);

      expect(result.groupedCosts).toBeDefined();
      expect(result.groupedCosts.length).toBeGreaterThan(0);
      
      // First level grouping should be by service
      expect(result.groupedCosts[0].type).toBe('service');
      
      // Second level grouping should be by region
      if (result.groupedCosts[0].children) {
        expect(result.groupedCosts[0].children[0].type).toBe('region');
      }
    });

    it('should query costs with filters', async () => {
      const params: CostQueryParams = {
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-31'),
        filters: {
          services: ['EC2']
        }
      };

      const result = await trackingService.queryCosts('org-123', params);

      expect(result).toBeDefined();
      // All costs should be for EC2 service
    });

    it('should query costs with time series', async () => {
      const params: CostQueryParams = {
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-31'),
        granularity: 'daily'
      };

      const result = await trackingService.queryCosts('org-123', params);

      expect(result.timeSeries).toBeDefined();
      expect(result.timeSeries!.length).toBeGreaterThan(0);
      expect(result.timeSeries![0].timestamp).toBeInstanceOf(Date);
      expect(result.timeSeries![0].cost).toBeGreaterThanOrEqual(0);
    });

    it('should query costs with metrics', async () => {
      const params: CostQueryParams = {
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-31'),
        includeMetrics: true
      };

      const result = await trackingService.queryCosts('org-123', params);

      expect(result.metrics).toBeDefined();
      expect(result.metrics!.averageDailyCost).toBeGreaterThan(0);
      expect(result.metrics!.peakDailyCost).toBeGreaterThan(0);
    });

    it('should query costs with resource details', async () => {
      const params: CostQueryParams = {
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-31'),
        includeResourceDetails: true
      };

      const result = await trackingService.queryCosts('org-123', params);

      expect(result.resourceDetails).toBeDefined();
      expect(result.resourceDetails!.length).toBeGreaterThan(0);
      expect(result.resourceDetails![0].resourceId).toBeDefined();
      expect(result.resourceDetails![0].cost).toBeGreaterThan(0);
    });
  });

  describe('getResourceCosts', () => {
    let resourceId: string;

    beforeEach(async () => {
      // Register data source
      const dataSource = await trackingService.registerDataSource(
        'org-123',
        'AWS Production',
        'aws',
        'account-123',
        {
          accessKeyId: 'test-key',
          secretAccessKey: 'test-secret'
        },
        {
          userId: 'user-123'
        }
      );

      // Import cost data
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');

      await trackingService.importCostData(
        'org-123',
        'aws',
        'account-123',
        startDate,
        endDate,
        {
          dataSourceId: dataSource.id,
          userId: 'user-123'
        }
      );

      // Get a resource ID from the imported data
      const params: CostQueryParams = {
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-31'),
        includeResourceDetails: true
      };

      const result = await trackingService.queryCosts('org-123', params);
      resourceId = result.resourceDetails![0].resourceId;
    });

    it('should get costs for a specific resource', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');

      const costs = await trackingService.getResourceCosts(resourceId, startDate, endDate);

      expect(costs).toBeDefined();
      expect(costs.length).toBeGreaterThan(0);
      expect(costs[0].resourceId).toBe(resourceId);
    });
  });
});