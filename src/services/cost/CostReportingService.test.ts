/**
 * Tests for CostReportingService
 */

import { CostReportingService } from './CostReportingService';
import { CostDataPoint } from './interfaces';
import { jest, describe, beforeEach, it, expect } from '@jest/globals';

describe('CostReportingService', () => {
  let reportingService: CostReportingService;

  beforeEach(() => {
    reportingService = new CostReportingService();
  });

  describe('createReportConfig', () => {
    it('should create a new report configuration', async () => {
      const config = await reportingService.createReportConfig(
        'Monthly AWS Costs',
        'Monthly cost report for AWS services',
        'org-123',
        ['service', 'region'],
        {
          timeRange: 'monthly',
          compareWithPrevious: true,
          includeForecasting: false,
          format: 'json',
          createdBy: 'user-123'
        }
      );

      expect(config).toBeDefined();
      expect(config.id).toBeDefined();
      expect(config.name).toBe('Monthly AWS Costs');
      expect(config.organizationId).toBe('org-123');
      expect(config.groupBy).toEqual(['service', 'region']);
      expect(config.timeRange).toBe('monthly');
      expect(config.compareWithPrevious).toBe(true);
      expect(config.includeForecasting).toBe(false);
      expect(config.format).toBe('json');
    });

    it('should create a report config with custom time range', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');

      const config = await reportingService.createReportConfig(
        'Custom Date Range Report',
        'Report with custom date range',
        'org-123',
        ['service'],
        {
          timeRange: 'custom',
          customTimeRange: {
            startDate,
            endDate
          },
          createdBy: 'user-123'
        }
      );

      expect(config.timeRange).toBe('custom');
      expect(config.customTimeRange).toBeDefined();
      expect(config.customTimeRange!.startDate).toEqual(startDate);
      expect(config.customTimeRange!.endDate).toEqual(endDate);
    });

    it('should create a report config with scheduled delivery', async () => {
      const config = await reportingService.createReportConfig(
        'Weekly Report',
        'Weekly cost report with email delivery',
        'org-123',
        ['service'],
        {
          timeRange: 'weekly',
          scheduledDelivery: {
            enabled: true,
            frequency: 'weekly',
            recipients: ['user@example.com']
          },
          createdBy: 'user-123'
        }
      );

      expect(config.scheduledDelivery).toBeDefined();
      expect(config.scheduledDelivery!.enabled).toBe(true);
      expect(config.scheduledDelivery!.frequency).toBe('weekly');
      expect(config.scheduledDelivery!.recipients).toContain('user@example.com');
    });
  });

  describe('updateReportConfig', () => {
    let configId: string;

    beforeEach(async () => {
      const config = await reportingService.createReportConfig(
        'Monthly AWS Costs',
        'Monthly cost report for AWS services',
        'org-123',
        ['service'],
        {
          createdBy: 'user-123'
        }
      );
      configId = config.id;
    });

    it('should update report config properties', async () => {
      const updatedConfig = await reportingService.updateReportConfig(
        configId,
        {
          name: 'Updated Report Name',
          description: 'Updated description',
          groupBy: ['service', 'region', 'account'],
          timeRange: 'quarterly'
        }
      );

      expect(updatedConfig.name).toBe('Updated Report Name');
      expect(updatedConfig.description).toBe('Updated description');
      expect(updatedConfig.groupBy).toEqual(['service', 'region', 'account']);
      expect(updatedConfig.timeRange).toBe('quarterly');
    });

    it('should throw error for non-existent config', async () => {
      await expect(
        reportingService.updateReportConfig(
          'non-existent-id',
          { name: 'Updated Name' }
        )
      ).rejects.toThrow('Report configuration non-existent-id not found');
    });
  });

  describe('generateReport', () => {
    let configId: string;
    const costData: CostDataPoint[] = [];

    beforeEach(async () => {
      // Create sample cost data
      for (let i = 1; i <= 30; i++) {
        costData.push({
          id: `cost-${i}`,
          timestamp: new Date(`2023-01-${i}`),
          amount: 10 * i,
          currency: 'USD',
          resourceId: `org-123/project-1/resource-${i % 5}`,
          resourceType: i % 2 === 0 ? 'instance' : 'storage',
          serviceType: i % 3 === 0 ? 'EC2' : (i % 3 === 1 ? 'S3' : 'RDS'),
          region: i % 2 === 0 ? 'us-east-1' : 'us-west-2',
          usageType: 'Standard',
          usageQuantity: 10 * i,
          usageUnit: 'hours',
          provider: 'aws',
          accountId: 'account-123',
          tags: {
            environment: i % 3 === 0 ? 'production' : (i % 3 === 1 ? 'staging' : 'development'),
            project: `project-${i % 5}`
          },
          metadata: {}
        });
      }

      // Create report config
      const config = await reportingService.createReportConfig(
        'Monthly AWS Costs',
        'Monthly cost report for AWS services',
        'org-123',
        ['service', 'region'],
        {
          timeRange: 'monthly',
          compareWithPrevious: true,
          createdBy: 'user-123'
        }
      );
      configId = config.id;
    });

    it('should generate a report based on configuration', async () => {
      const report = await reportingService.generateReport(configId, costData);

      expect(report).toBeDefined();
      expect(report.configId).toBe(configId);
      expect(report.organizationId).toBe('org-123');
      expect(report.totalCost).toBeGreaterThan(0);
      expect(report.currency).toBe('USD');
      expect(report.groupedCosts).toBeDefined();
      expect(report.groupedCosts.length).toBeGreaterThan(0);
    });

    it('should group costs correctly', async () => {
      const report = await reportingService.generateReport(configId, costData);

      // First level grouping should be by service
      expect(report.groupedCosts[0].type).toBe('service');
      
      // Should have EC2, S3, and RDS service groups
      const serviceNames = report.groupedCosts.map(g => g.name);
      expect(serviceNames).toContain('EC2');
      expect(serviceNames).toContain('S3');
      expect(serviceNames).toContain('RDS');
      
      // Second level grouping should be by region
      if (report.groupedCosts[0].children) {
        expect(report.groupedCosts[0].children[0].type).toBe('region');
      }
    });

    it('should calculate previous period costs when requested', async () => {
      const report = await reportingService.generateReport(configId, costData);

      expect(report.previousPeriodCost).toBeDefined();
      expect(report.percentageChange).toBeDefined();
    });

    it('should throw error for non-existent config', async () => {
      await expect(
        reportingService.generateReport('non-existent-id', costData)
      ).rejects.toThrow('Report configuration non-existent-id not found');
    });
  });

  describe('createBudget', () => {
    it('should create a new budget', async () => {
      const budget = await reportingService.createBudget(
        'AWS Monthly Budget',
        'Monthly budget for AWS services',
        'org-123',
        10000,
        'USD',
        'monthly',
        {
          scope: {
            services: ['EC2', 'S3'],
            regions: ['us-east-1']
          },
          alerts: [
            {
              thresholdPercentage: 80,
              thresholdType: 'actual',
              notifications: {
                enabled: true,
                channels: ['email'],
                recipients: ['finance@example.com']
              }
            },
            {
              thresholdPercentage: 100,
              thresholdType: 'actual',
              notifications: {
                enabled: true,
                channels: ['email'],
                recipients: ['finance@example.com', 'management@example.com']
              }
            }
          ],
          createdBy: 'user-123'
        }
      );

      expect(budget).toBeDefined();
      expect(budget.id).toBeDefined();
      expect(budget.name).toBe('AWS Monthly Budget');
      expect(budget.organizationId).toBe('org-123');
      expect(budget.amount).toBe(10000);
      expect(budget.currency).toBe('USD');
      expect(budget.period).toBe('monthly');
      expect(budget.scope.services).toContain('EC2');
      expect(budget.scope.regions).toContain('us-east-1');
      expect(budget.alerts).toHaveLength(2);
      expect(budget.alerts[0].thresholdPercentage).toBe(80);
      expect(budget.alerts[1].thresholdPercentage).toBe(100);
    });

    it('should create a budget with default alerts if none provided', async () => {
      const budget = await reportingService.createBudget(
        'Simple Budget',
        'Budget with default alerts',
        'org-123',
        5000,
        'USD',
        'monthly',
        {
          createdBy: 'user-123'
        }
      );

      expect(budget.alerts).toBeDefined();
      expect(budget.alerts.length).toBeGreaterThan(0);
    });

    it('should create a budget with custom period', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-03-31');

      const budget = await reportingService.createBudget(
        'Q1 Budget',
        'Q1 2023 Budget',
        'org-123',
        30000,
        'USD',
        'custom',
        {
          customPeriod: {
            startDate,
            endDate
          },
          createdBy: 'user-123'
        }
      );

      expect(budget.period).toBe('custom');
      expect(budget.customPeriod).toBeDefined();
      expect(budget.customPeriod!.startDate).toEqual(startDate);
      expect(budget.customPeriod!.endDate).toEqual(endDate);
    });
  });

  describe('updateBudgetStatus', () => {
    let budgetId: string;
    const costData: CostDataPoint[] = [];

    beforeEach(async () => {
      // Create sample cost data for current month
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      for (let i = 1; i <= 15; i++) {
        costData.push({
          id: `cost-${i}`,
          timestamp: new Date(currentYear, currentMonth, i),
          amount: 500, // $500 per day = $7,500 for 15 days
          currency: 'USD',
          resourceId: `org-123/project-1/resource-${i % 5}`,
          resourceType: 'instance',
          serviceType: 'EC2',
          region: 'us-east-1',
          usageType: 'Standard',
          usageQuantity: 24,
          usageUnit: 'hours',
          provider: 'aws',
          accountId: 'account-123',
          tags: { environment: 'production' },
          metadata: {}
        });
      }

      // Create budget for $10,000
      const budget = await reportingService.createBudget(
        'Monthly Budget',
        'Monthly budget for current month',
        'org-123',
        10000,
        'USD',
        'monthly',
        {
          alerts: [
            {
              thresholdPercentage: 75,
              thresholdType: 'actual',
              notifications: {
                enabled: true,
                channels: ['email'],
                recipients: ['finance@example.com']
              }
            }
          ],
          createdBy: 'user-123'
        }
      );
      budgetId = budget.id;
    });

    it('should update budget status based on actual costs', async () => {
      const status = await reportingService.updateBudgetStatus(budgetId, costData);

      expect(status).toBeDefined();
      expect(status.budgetId).toBe(budgetId);
      expect(status.budgetAmount).toBe(10000);
      expect(status.actualCost).toBe(7500); // $500 * 15 days
      expect(status.actualPercentage).toBe(75); // 75% of budget
      expect(status.remainingAmount).toBe(2500);
      expect(status.currency).toBe('USD');
      
      // Should be near limit (75% threshold)
      expect(status.status).toBe('near_limit');
      
      // Alert should be triggered
      expect(status.alertsTriggered).toHaveLength(1);
      expect(status.alertsTriggered[0].thresholdPercentage).toBe(75);
    });

    it('should throw error for non-existent budget', async () => {
      await expect(
        reportingService.updateBudgetStatus('non-existent-id', costData)
      ).rejects.toThrow('Budget non-existent-id not found');
    });
  });

  describe('createForecastConfig', () => {
    it('should create a new forecast configuration', async () => {
      const config = await reportingService.createForecastConfig(
        'Monthly Cost Forecast',
        'Forecast for monthly costs',
        'org-123',
        {
          forecastPeriod: 'month',
          forecastHorizon: 6,
          algorithm: 'linear_regression',
          scope: {
            services: ['EC2', 'RDS']
          },
          confidenceInterval: 95,
          createdBy: 'user-123'
        }
      );

      expect(config).toBeDefined();
      expect(config.id).toBeDefined();
      expect(config.name).toBe('Monthly Cost Forecast');
      expect(config.organizationId).toBe('org-123');
      expect(config.forecastPeriod).toBe('month');
      expect(config.forecastHorizon).toBe(6);
      expect(config.algorithm).toBe('linear_regression');
      expect(config.scope.services).toContain('EC2');
      expect(config.confidenceInterval).toBe(95);
      expect(config.enabled).toBe(true);
    });
  });

  describe('generateForecast', () => {
    let configId: string;
    const costData: CostDataPoint[] = [];

    beforeEach(async () => {
      // Create sample historical cost data (6 months)
      for (let month = 0; month < 6; month++) {
        for (let day = 1; day <= 28; day++) {
          costData.push({
            id: `cost-${month}-${day}`,
            timestamp: new Date(2023, month, day),
            // Increasing trend: $10,000 + $1,000 per month
            amount: (10000 + month * 1000) / 28,
            currency: 'USD',
            resourceId: `org-123/project-1/resource-${day % 5}`,
            resourceType: 'instance',
            serviceType: 'EC2',
            region: 'us-east-1',
            usageType: 'Standard',
            usageQuantity: 24,
            usageUnit: 'hours',
            provider: 'aws',
            accountId: 'account-123',
            tags: { environment: 'production' },
            metadata: {}
          });
        }
      }

      // Create forecast config
      const config = await reportingService.createForecastConfig(
        'Monthly Cost Forecast',
        'Forecast for monthly costs',
        'org-123',
        {
          forecastPeriod: 'month',
          forecastHorizon: 3,
          algorithm: 'auto',
          createdBy: 'user-123'
        }
      );
      configId = config.id;
    });

    it('should generate a forecast based on historical data', async () => {
      const forecast = await reportingService.generateForecast(configId, costData);

      expect(forecast).toBeDefined();
      expect(forecast.configId).toBe(configId);
      expect(forecast.organizationId).toBe('org-123');
      expect(forecast.forecastPeriod).toBe('month');
      expect(forecast.forecastHorizon).toBe(3);
      expect(forecast.periods).toHaveLength(3);
      expect(forecast.totalForecastedCost).toBeGreaterThan(0);
      expect(forecast.currency).toBe('USD');
      expect(forecast.accuracy).toBeGreaterThan(0);
    });

    it('should include confidence intervals in forecast', async () => {
      const forecast = await reportingService.generateForecast(configId, costData);

      forecast.periods.forEach(period => {
        expect(period.forecastedCost).toBeGreaterThan(0);
        expect(period.lowerBound).toBeLessThan(period.forecastedCost);
        expect(period.upperBound).toBeGreaterThan(period.forecastedCost);
      });
    });

    it('should throw error for non-existent config', async () => {
      await expect(
        reportingService.generateForecast('non-existent-id', costData)
      ).rejects.toThrow('Forecast configuration non-existent-id not found');
    });
  });
});