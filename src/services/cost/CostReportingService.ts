/**
 * Cost Reporting Service
 * Generates cost reports and analytics
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';
import {
  CostReportConfig,
  CostReport,
  CostReportFilter,
  CostGrouping,
  CostDataPoint,
  CostForecastConfig,
  CostForecast,
  Budget,
  BudgetStatus,
  BudgetAlert
} from './interfaces';

/**
 * Service for generating cost reports and analytics
 */
export class CostReportingService {
  private reportConfigs: Map<string, CostReportConfig> = new Map();
  private reports: Map<string, CostReport> = new Map();
  private forecastConfigs: Map<string, CostForecastConfig> = new Map();
  private forecasts: Map<string, CostForecast> = new Map();
  private budgets: Map<string, Budget> = new Map();
  private budgetStatuses: Map<string, BudgetStatus> = new Map();

  /**
   * Create a cost report configuration
   */
  async createReportConfig(
    name: string,
    description: string,
    organizationId: string,
    groupBy: ('service' | 'region' | 'account' | 'resourceType' | 'tag' | 'entity')[],
    options: {
      filters?: CostReportFilter[];
      timeRange?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
      customTimeRange?: {
        startDate: Date;
        endDate: Date;
      };
      compareWithPrevious?: boolean;
      includeForecasting?: boolean;
      format?: 'json' | 'csv' | 'pdf' | 'html';
      scheduledDelivery?: {
        enabled: boolean;
        frequency: 'daily' | 'weekly' | 'monthly';
        recipients: string[];
      };
      createdBy: string;
    }
  ): Promise<CostReportConfig> {
    try {
      const configId = uuidv4();
      const now = new Date();

      const config: CostReportConfig = {
        id: configId,
        name,
        description,
        organizationId,
        groupBy,
        filters: options.filters || [],
        timeRange: options.timeRange || 'monthly',
        customTimeRange: options.customTimeRange,
        compareWithPrevious: options.compareWithPrevious !== undefined ? options.compareWithPrevious : true,
        includeForecasting: options.includeForecasting !== undefined ? options.includeForecasting : false,
        format: options.format || 'json',
        scheduledDelivery: options.scheduledDelivery,
        createdAt: now,
        updatedAt: now,
        createdBy: options.createdBy
      };

      this.reportConfigs.set(configId, config);

      logger.info(`Created cost report configuration ${name} (${configId})`, {
        configId,
        organizationId,
        groupBy: groupBy.join(',')
      });

      return config;
    } catch (error) {
      logger.error(`Failed to create cost report configuration ${name}`, { error });
      throw error;
    }
  }

  /**
   * Update a cost report configuration
   */
  async updateReportConfig(
    configId: string,
    updates: {
      name?: string;
      description?: string;
      groupBy?: ('service' | 'region' | 'account' | 'resourceType' | 'tag' | 'entity')[];
      filters?: CostReportFilter[];
      timeRange?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
      customTimeRange?: {
        startDate: Date;
        endDate: Date;
      };
      compareWithPrevious?: boolean;
      includeForecasting?: boolean;
      format?: 'json' | 'csv' | 'pdf' | 'html';
      scheduledDelivery?: {
        enabled: boolean;
        frequency: 'daily' | 'weekly' | 'monthly';
        recipients: string[];
      };
    }
  ): Promise<CostReportConfig> {
    const config = this.reportConfigs.get(configId);
    if (!config) {
      throw new Error(`Report configuration ${configId} not found`);
    }

    // Update fields
    if (updates.name) {
      config.name = updates.name;
    }

    if (updates.description) {
      config.description = updates.description;
    }

    if (updates.groupBy) {
      config.groupBy = updates.groupBy;
    }

    if (updates.filters) {
      config.filters = updates.filters;
    }

    if (updates.timeRange) {
      config.timeRange = updates.timeRange;
    }

    if (updates.customTimeRange) {
      config.customTimeRange = updates.customTimeRange;
    }

    if (updates.compareWithPrevious !== undefined) {
      config.compareWithPrevious = updates.compareWithPrevious;
    }

    if (updates.includeForecasting !== undefined) {
      config.includeForecasting = updates.includeForecasting;
    }

    if (updates.format) {
      config.format = updates.format;
    }

    if (updates.scheduledDelivery) {
      config.scheduledDelivery = updates.scheduledDelivery;
    }

    config.updatedAt = new Date();
    this.reportConfigs.set(configId, config);

    logger.info(`Updated cost report configuration ${configId}`, {
      configId,
      configName: config.name
    });

    return config;
  }

  /**
   * Delete a cost report configuration
   */
  async deleteReportConfig(configId: string): Promise<void> {
    const config = this.reportConfigs.get(configId);
    if (!config) {
      throw new Error(`Report configuration ${configId} not found`);
    }

    this.reportConfigs.delete(configId);

    logger.info(`Deleted cost report configuration ${configId}`, {
      configId,
      configName: config.name
    });
  }

  /**
   * Get all cost report configurations
   */
  async getReportConfigs(organizationId: string): Promise<CostReportConfig[]> {
    return Array.from(this.reportConfigs.values()).filter(
      config => config.organizationId === organizationId
    );
  }

  /**
   * Get a cost report configuration by ID
   */
  async getReportConfig(configId: string): Promise<CostReportConfig | null> {
    return this.reportConfigs.get(configId) || null;
  }

  /**
   * Generate a cost report
   */
  async generateReport(
    configId: string,
    costData: CostDataPoint[]
  ): Promise<CostReport> {
    try {
      const config = this.reportConfigs.get(configId);
      if (!config) {
        throw new Error(`Report configuration ${configId} not found`);
      }

      logger.info(`Generating cost report for configuration ${configId}`, {
        configId,
        configName: config.name,
        costDataPoints: costData.length
      });

      // Determine time range
      const { startDate, endDate, period } = this.getReportTimeRange(config);

      // Filter cost data by time range
      let filteredData = costData.filter(
        point => point.timestamp >= startDate && point.timestamp <= endDate
      );

      // Apply additional filters
      filteredData = this.applyReportFilters(filteredData, config.filters);

      // Calculate total cost
      const totalCost = filteredData.reduce((sum, point) => sum + point.amount, 0);
      const currency = filteredData.length > 0 ? filteredData[0].currency : 'USD';

      // Group costs
      const groupedCosts = this.groupCostData(filteredData, config.groupBy, totalCost);

      // Calculate previous period costs if requested
      let previousPeriodCost: number | undefined;
      let percentageChange: number | undefined;

      if (config.compareWithPrevious) {
        const previousPeriod = this.getPreviousPeriod(startDate, endDate, period);
        const previousData = costData.filter(
          point =>
            point.timestamp >= previousPeriod.startDate &&
            point.timestamp <= previousPeriod.endDate
        );
        previousPeriodCost = previousData.reduce((sum, point) => sum + point.amount, 0);

        if (previousPeriodCost > 0) {
          percentageChange = ((totalCost - previousPeriodCost) / previousPeriodCost) * 100;
        }
      }

      // Generate forecast if requested
      let forecastedCost: number | undefined;
      if (config.includeForecasting) {
        // In a real implementation, this would use a forecasting model
        // For now, we'll use a simple projection based on current data
        forecastedCost = this.generateSimpleForecast(filteredData, startDate, endDate);
      }

      // Create the report
      const reportId = uuidv4();
      const report: CostReport = {
        id: reportId,
        configId,
        name: config.name,
        organizationId: config.organizationId,
        timeRange: {
          startDate,
          endDate,
          period
        },
        totalCost,
        currency,
        previousPeriodCost,
        percentageChange,
        forecastedCost,
        groupedCosts,
        generatedAt: new Date(),
        metadata: {
          filters: config.filters,
          dataPoints: filteredData.length
        }
      };

      this.reports.set(reportId, report);

      logger.info(`Generated cost report ${reportId}`, {
        reportId,
        configId,
        totalCost,
        currency,
        dataPoints: filteredData.length
      });

      return report;
    } catch (error) {
      logger.error(`Failed to generate cost report for configuration ${configId}`, { error });
      throw error;
    }
  }

  /**
   * Get a cost report by ID
   */
  async getReport(reportId: string): Promise<CostReport | null> {
    return this.reports.get(reportId) || null;
  }

  /**
   * Get all cost reports
   */
  async getReports(
    organizationId: string,
    options: {
      configId?: string;
      limit?: number;
    } = {}
  ): Promise<CostReport[]> {
    let reports = Array.from(this.reports.values()).filter(
      report => report.organizationId === organizationId
    );

    // Apply filters
    if (options.configId) {
      reports = reports.filter(report => report.configId === options.configId);
    }

    // Sort by generation date (newest first)
    reports.sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());

    // Apply limit
    if (options.limit && options.limit > 0) {
      reports = reports.slice(0, options.limit);
    }

    return reports;
  }

  /**
   * Create a cost forecast configuration
   */
  async createForecastConfig(
    name: string,
    description: string,
    organizationId: string,
    options: {
      forecastPeriod?: 'month' | 'quarter' | 'year';
      forecastHorizon?: number;
      algorithm?: 'linear_regression' | 'moving_average' | 'exponential_smoothing' | 'auto';
      scope?: {
        entityIds?: string[];
        services?: string[];
        regions?: string[];
        tags?: Record<string, string>;
      };
      includeAnomalies?: boolean;
      confidenceInterval?: number;
      createdBy: string;
      enabled?: boolean;
    }
  ): Promise<CostForecastConfig> {
    try {
      const configId = uuidv4();
      const now = new Date();

      const config: CostForecastConfig = {
        id: configId,
        organizationId,
        name,
        description,
        forecastPeriod: options.forecastPeriod || 'month',
        forecastHorizon: options.forecastHorizon || 3,
        algorithm: options.algorithm || 'auto',
        scope: options.scope || {},
        includeAnomalies: options.includeAnomalies !== undefined ? options.includeAnomalies : true,
        confidenceInterval: options.confidenceInterval || 95,
        createdAt: now,
        updatedAt: now,
        createdBy: options.createdBy,
        enabled: options.enabled !== undefined ? options.enabled : true
      };

      this.forecastConfigs.set(configId, config);

      logger.info(`Created cost forecast configuration ${name} (${configId})`, {
        configId,
        organizationId,
        forecastPeriod: config.forecastPeriod,
        forecastHorizon: config.forecastHorizon
      });

      return config;
    } catch (error) {
      logger.error(`Failed to create cost forecast configuration ${name}`, { error });
      throw error;
    }
  }

  /**
   * Update a cost forecast configuration
   */
  async updateForecastConfig(
    configId: string,
    updates: {
      name?: string;
      description?: string;
      forecastPeriod?: 'month' | 'quarter' | 'year';
      forecastHorizon?: number;
      algorithm?: 'linear_regression' | 'moving_average' | 'exponential_smoothing' | 'auto';
      scope?: {
        entityIds?: string[];
        services?: string[];
        regions?: string[];
        tags?: Record<string, string>;
      };
      includeAnomalies?: boolean;
      confidenceInterval?: number;
      enabled?: boolean;
    }
  ): Promise<CostForecastConfig> {
    const config = this.forecastConfigs.get(configId);
    if (!config) {
      throw new Error(`Forecast configuration ${configId} not found`);
    }

    // Update fields
    if (updates.name) {
      config.name = updates.name;
    }

    if (updates.description) {
      config.description = updates.description;
    }

    if (updates.forecastPeriod) {
      config.forecastPeriod = updates.forecastPeriod;
    }

    if (updates.forecastHorizon !== undefined) {
      config.forecastHorizon = updates.forecastHorizon;
    }

    if (updates.algorithm) {
      config.algorithm = updates.algorithm;
    }

    if (updates.scope) {
      config.scope = updates.scope;
    }

    if (updates.includeAnomalies !== undefined) {
      config.includeAnomalies = updates.includeAnomalies;
    }

    if (updates.confidenceInterval !== undefined) {
      config.confidenceInterval = updates.confidenceInterval;
    }

    if (updates.enabled !== undefined) {
      config.enabled = updates.enabled;
    }

    config.updatedAt = new Date();
    this.forecastConfigs.set(configId, config);

    logger.info(`Updated cost forecast configuration ${configId}`, {
      configId,
      configName: config.name
    });

    return config;
  }

  /**
   * Delete a cost forecast configuration
   */
  async deleteForecastConfig(configId: string): Promise<void> {
    const config = this.forecastConfigs.get(configId);
    if (!config) {
      throw new Error(`Forecast configuration ${configId} not found`);
    }

    this.forecastConfigs.delete(configId);

    logger.info(`Deleted cost forecast configuration ${configId}`, {
      configId,
      configName: config.name
    });
  }

  /**
   * Get all cost forecast configurations
   */
  async getForecastConfigs(
    organizationId: string,
    options: {
      enabled?: boolean;
    } = {}
  ): Promise<CostForecastConfig[]> {
    let configs = Array.from(this.forecastConfigs.values()).filter(
      config => config.organizationId === organizationId
    );

    // Apply filters
    if (options.enabled !== undefined) {
      configs = configs.filter(config => config.enabled === options.enabled);
    }

    return configs;
  }

  /**
   * Generate a cost forecast
   */
  async generateForecast(
    configId: string,
    costData: CostDataPoint[]
  ): Promise<CostForecast> {
    try {
      const config = this.forecastConfigs.get(configId);
      if (!config) {
        throw new Error(`Forecast configuration ${configId} not found`);
      }

      logger.info(`Generating cost forecast for configuration ${configId}`, {
        configId,
        configName: config.name,
        costDataPoints: costData.length
      });

      // Filter cost data based on scope
      let filteredData = costData;
      if (config.scope) {
        filteredData = this.applyScopeFilters(costData, config.scope);
      }

      // Generate forecast periods
      const periods = this.generateForecastPeriods(config.forecastPeriod, config.forecastHorizon);

      // Calculate forecasted costs for each period
      // In a real implementation, this would use a forecasting model based on the selected algorithm
      // For now, we'll use a simple projection
      const forecastResults = this.calculateForecastedCosts(
        filteredData,
        periods,
        config.algorithm,
        config.confidenceInterval
      );

      // Calculate total forecasted cost
      const totalForecastedCost = forecastResults.reduce(
        (sum, period) => sum + period.forecastedCost,
        0
      );

      // Create the forecast
      const forecastId = uuidv4();
      const forecast: CostForecast = {
        id: forecastId,
        configId,
        organizationId: config.organizationId,
        forecastPeriod: config.forecastPeriod,
        forecastHorizon: config.forecastHorizon,
        algorithm: config.algorithm,
        periods: forecastResults,
        totalForecastedCost,
        currency: forecastResults.length > 0 ? forecastResults[0].currency : 'USD',
        accuracy: this.calculateForecastAccuracy(filteredData),
        generatedAt: new Date(),
        metadata: {
          scope: config.scope,
          dataPoints: filteredData.length,
          confidenceInterval: config.confidenceInterval
        }
      };

      this.forecasts.set(forecastId, forecast);

      logger.info(`Generated cost forecast ${forecastId}`, {
        forecastId,
        configId,
        totalForecastedCost,
        periods: forecastResults.length
      });

      return forecast;
    } catch (error) {
      logger.error(`Failed to generate cost forecast for configuration ${configId}`, { error });
      throw error;
    }
  }

  /**
   * Get a cost forecast by ID
   */
  async getForecast(forecastId: string): Promise<CostForecast | null> {
    return this.forecasts.get(forecastId) || null;
  }

  /**
   * Get all cost forecasts
   */
  async getForecasts(
    organizationId: string,
    options: {
      configId?: string;
      limit?: number;
    } = {}
  ): Promise<CostForecast[]> {
    let forecasts = Array.from(this.forecasts.values()).filter(
      forecast => forecast.organizationId === organizationId
    );

    // Apply filters
    if (options.configId) {
      forecasts = forecasts.filter(forecast => forecast.configId === options.configId);
    }

    // Sort by generation date (newest first)
    forecasts.sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());

    // Apply limit
    if (options.limit && options.limit > 0) {
      forecasts = forecasts.slice(0, options.limit);
    }

    return forecasts;
  }

  /**
   * Create a budget
   */
  async createBudget(
    name: string,
    description: string,
    organizationId: string,
    amount: number,
    currency: string,
    period: 'monthly' | 'quarterly' | 'yearly' | 'custom',
    options: {
      customPeriod?: {
        startDate: Date;
        endDate: Date;
      };
      scope?: {
        entityIds?: string[];
        services?: string[];
        regions?: string[];
        tags?: Record<string, string>;
      };
      alerts?: {
        thresholdPercentage: number;
        thresholdType: 'actual' | 'forecasted';
        notifications: {
          enabled: boolean;
          channels: string[];
          recipients: string[];
        };
      }[];
      startDate?: Date;
      endDate?: Date;
      enabled?: boolean;
      createdBy: string;
      metadata?: Record<string, any>;
    }
  ): Promise<Budget> {
    try {
      const budgetId = uuidv4();
      const now = new Date();

      // Create alerts
      const alerts: BudgetAlert[] = (options.alerts || []).map(alert => ({
        id: uuidv4(),
        thresholdPercentage: alert.thresholdPercentage,
        thresholdType: alert.thresholdType,
        notifications: alert.notifications,
        status: 'pending',
        enabled: true
      }));

      // Add default alerts if none provided
      if (alerts.length === 0) {
        alerts.push({
          id: uuidv4(),
          thresholdPercentage: 80,
          thresholdType: 'actual',
          notifications: {
            enabled: true,
            channels: ['email'],
            recipients: []
          },
          status: 'pending',
          enabled: true
        });
        alerts.push({
          id: uuidv4(),
          thresholdPercentage: 100,
          thresholdType: 'actual',
          notifications: {
            enabled: true,
            channels: ['email'],
            recipients: []
          },
          status: 'pending',
          enabled: true
        });
      }

      const budget: Budget = {
        id: budgetId,
        organizationId,
        name,
        description,
        amount,
        currency,
        period,
        customPeriod: options.customPeriod,
        scope: options.scope || {},
        alerts,
        startDate: options.startDate || now,
        endDate: options.endDate,
        enabled: options.enabled !== undefined ? options.enabled : true,
        createdAt: now,
        updatedAt: now,
        createdBy: options.createdBy,
        metadata: options.metadata || {}
      };

      this.budgets.set(budgetId, budget);

      logger.info(`Created budget ${name} (${budgetId})`, {
        budgetId,
        organizationId,
        amount,
        currency,
        period
      });

      return budget;
    } catch (error) {
      logger.error(`Failed to create budget ${name}`, { error });
      throw error;
    }
  }

  /**
   * Update a budget
   */
  async updateBudget(
    budgetId: string,
    updates: {
      name?: string;
      description?: string;
      amount?: number;
      period?: 'monthly' | 'quarterly' | 'yearly' | 'custom';
      customPeriod?: {
        startDate: Date;
        endDate: Date;
      };
      scope?: {
        entityIds?: string[];
        services?: string[];
        regions?: string[];
        tags?: Record<string, string>;
      };
      alerts?: {
        id?: string;
        thresholdPercentage: number;
        thresholdType: 'actual' | 'forecasted';
        notifications: {
          enabled: boolean;
          channels: string[];
          recipients: string[];
        };
        enabled?: boolean;
      }[];
      startDate?: Date;
      endDate?: Date;
      enabled?: boolean;
      metadata?: Record<string, any>;
    }
  ): Promise<Budget> {
    const budget = this.budgets.get(budgetId);
    if (!budget) {
      throw new Error(`Budget ${budgetId} not found`);
    }

    // Update fields
    if (updates.name) {
      budget.name = updates.name;
    }

    if (updates.description) {
      budget.description = updates.description;
    }

    if (updates.amount !== undefined) {
      budget.amount = updates.amount;
    }

    if (updates.period) {
      budget.period = updates.period;
    }

    if (updates.customPeriod) {
      budget.customPeriod = updates.customPeriod;
    }

    if (updates.scope) {
      budget.scope = updates.scope;
    }

    if (updates.alerts) {
      // Update existing alerts or add new ones
      for (const alertUpdate of updates.alerts) {
        if (alertUpdate.id) {
          // Update existing alert
          const existingAlert = budget.alerts.find(a => a.id === alertUpdate.id);
          if (existingAlert) {
            existingAlert.thresholdPercentage = alertUpdate.thresholdPercentage;
            existingAlert.thresholdType = alertUpdate.thresholdType;
            existingAlert.notifications = alertUpdate.notifications;
            if (alertUpdate.enabled !== undefined) {
              existingAlert.enabled = alertUpdate.enabled;
            }
          }
        } else {
          // Add new alert
          budget.alerts.push({
            id: uuidv4(),
            thresholdPercentage: alertUpdate.thresholdPercentage,
            thresholdType: alertUpdate.thresholdType,
            notifications: alertUpdate.notifications,
            status: 'pending',
            enabled: alertUpdate.enabled !== undefined ? alertUpdate.enabled : true
          });
        }
      }
    }

    if (updates.startDate) {
      budget.startDate = updates.startDate;
    }

    if (updates.endDate !== undefined) {
      budget.endDate = updates.endDate;
    }

    if (updates.enabled !== undefined) {
      budget.enabled = updates.enabled;
    }

    if (updates.metadata) {
      budget.metadata = { ...budget.metadata, ...updates.metadata };
    }

    budget.updatedAt = new Date();
    this.budgets.set(budgetId, budget);

    logger.info(`Updated budget ${budgetId}`, {
      budgetId,
      budgetName: budget.name
    });

    return budget;
  }

  /**
   * Delete a budget
   */
  async deleteBudget(budgetId: string): Promise<void> {
    const budget = this.budgets.get(budgetId);
    if (!budget) {
      throw new Error(`Budget ${budgetId} not found`);
    }

    this.budgets.delete(budgetId);

    // Also delete any budget statuses
    for (const [statusId, status] of this.budgetStatuses.entries()) {
      if (status.budgetId === budgetId) {
        this.budgetStatuses.delete(statusId);
      }
    }

    logger.info(`Deleted budget ${budgetId}`, {
      budgetId,
      budgetName: budget.name
    });
  }

  /**
   * Get all budgets
   */
  async getBudgets(
    organizationId: string,
    options: {
      enabled?: boolean;
    } = {}
  ): Promise<Budget[]> {
    let budgets = Array.from(this.budgets.values()).filter(
      budget => budget.organizationId === organizationId
    );

    // Apply filters
    if (options.enabled !== undefined) {
      budgets = budgets.filter(budget => budget.enabled === options.enabled);
    }

    return budgets;
  }

  /**
   * Get a budget by ID
   */
  async getBudget(budgetId: string): Promise<Budget | null> {
    return this.budgets.get(budgetId) || null;
  }

  /**
   * Update budget status
   */
  async updateBudgetStatus(
    budgetId: string,
    costData: CostDataPoint[]
  ): Promise<BudgetStatus> {
    try {
      const budget = this.budgets.get(budgetId);
      if (!budget) {
        throw new Error(`Budget ${budgetId} not found`);
      }

      logger.info(`Updating budget status for ${budgetId}`, {
        budgetId,
        budgetName: budget.name
      });

      // Determine budget period
      const { startDate, endDate } = this.getBudgetPeriod(budget);

      // Filter cost data by time range and scope
      let filteredData = costData.filter(
        point => point.timestamp >= startDate && point.timestamp <= endDate
      );

      if (budget.scope) {
        filteredData = this.applyScopeFilters(filteredData, budget.scope);
      }

      // Calculate actual cost
      const actualCost = filteredData.reduce((sum, point) => sum + point.amount, 0);
      const actualPercentage = (actualCost / budget.amount) * 100;
      const remainingAmount = Math.max(0, budget.amount - actualCost);

      // Generate simple forecast
      const forecastedCost = this.generateSimpleForecast(filteredData, startDate, endDate);
      const forecastedPercentage = (forecastedCost / budget.amount) * 100;

      // Determine status
      let status: 'under_budget' | 'near_limit' | 'over_budget';
      if (actualCost > budget.amount) {
        status = 'over_budget';
      } else if (actualPercentage >= 80) {
        status = 'near_limit';
      } else {
        status = 'under_budget';
      }

      // Check alerts
      const alertsTriggered: { alertId: string; thresholdPercentage: number; triggeredAt: Date }[] = [];
      for (const alert of budget.alerts) {
        if (!alert.enabled) continue;

        const percentage = alert.thresholdType === 'actual' ? actualPercentage : forecastedPercentage;
        
        if (percentage >= alert.thresholdPercentage && alert.status !== 'triggered') {
          // Trigger alert
          alert.status = 'triggered';
          alert.lastTriggeredAt = new Date();
          
          alertsTriggered.push({
            alertId: alert.id,
            thresholdPercentage: alert.thresholdPercentage,
            triggeredAt: alert.lastTriggeredAt
          });

          // In a real implementation, would send notifications here
          if (alert.notifications.enabled) {
            logger.info(`Budget alert triggered for ${budgetId}`, {
              budgetId,
              alertId: alert.id,
              threshold: alert.thresholdPercentage,
              actual: actualPercentage.toFixed(2),
              recipients: alert.notifications.recipients
            });
          }
        } else if (percentage < alert.thresholdPercentage && alert.status === 'triggered') {
          // Reset alert
          alert.status = 'reset';
        }
      }

      // Create or update budget status
      const statusId = `${budgetId}-${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}`;
      const budgetStatus: BudgetStatus = {
        id: statusId,
        budgetId,
        period: {
          startDate,
          endDate
        },
        budgetAmount: budget.amount,
        actualCost,
        forecastedCost,
        actualPercentage,
        forecastedPercentage,
        remainingAmount,
        currency: budget.currency,
        status,
        alertsTriggered,
        lastUpdatedAt: new Date()
      };

      this.budgetStatuses.set(statusId, budgetStatus);

      logger.info(`Updated budget status for ${budgetId}`, {
        budgetId,
        actualCost,
        forecastedCost,
        actualPercentage: actualPercentage.toFixed(2),
        status
      });

      return budgetStatus;
    } catch (error) {
      logger.error(`Failed to update budget status for ${budgetId}`, { error });
      throw error;
    }
  }

  /**
   * Get budget status
   */
  async getBudgetStatus(budgetId: string): Promise<BudgetStatus | null> {
    // Find the most recent status for this budget
    const statuses = Array.from(this.budgetStatuses.values())
      .filter(status => status.budgetId === budgetId)
      .sort((a, b) => b.lastUpdatedAt.getTime() - a.lastUpdatedAt.getTime());

    return statuses.length > 0 ? statuses[0] : null;
  }

  /**
   * Get all budget statuses
   */
  async getBudgetStatuses(
    organizationId: string,
    options: {
      status?: 'under_budget' | 'near_limit' | 'over_budget';
    } = {}
  ): Promise<BudgetStatus[]> {
    // Get all budgets for this organization
    const budgetIds = Array.from(this.budgets.values())
      .filter(budget => budget.organizationId === organizationId)
      .map(budget => budget.id);

    // Get statuses for these budgets
    let statuses = Array.from(this.budgetStatuses.values()).filter(
      status => budgetIds.includes(status.budgetId)
    );

    // Apply filters
    if (options.status) {
      statuses = statuses.filter(status => status.status === options.status);
    }

    // Sort by last updated (newest first)
    statuses.sort((a, b) => b.lastUpdatedAt.getTime() - a.lastUpdatedAt.getTime());

    return statuses;
  }

  /**
   * Get report time range based on configuration
   */
  private getReportTimeRange(
    config: CostReportConfig
  ): { startDate: Date; endDate: Date; period: string } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;
    let period: string;

    if (config.timeRange === 'custom' && config.customTimeRange) {
      startDate = config.customTimeRange.startDate;
      endDate = config.customTimeRange.endDate;
      period = 'custom';
    } else {
      switch (config.timeRange) {
        case 'daily':
          // Last 24 hours
          endDate = new Date(now);
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 1);
          period = 'daily';
          break;
        case 'weekly':
          // Last 7 days
          endDate = new Date(now);
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 7);
          period = 'weekly';
          break;
        case 'monthly':
          // Last 30 days
          endDate = new Date(now);
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 30);
          period = 'monthly';
          break;
        case 'quarterly':
          // Last 90 days
          endDate = new Date(now);
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 90);
          period = 'quarterly';
          break;
        case 'yearly':
          // Last 365 days
          endDate = new Date(now);
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 365);
          period = 'yearly';
          break;
        default:
          // Default to monthly
          endDate = new Date(now);
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 30);
          period = 'monthly';
      }
    }

    return { startDate, endDate, period };
  }

  /**
   * Get previous period for comparison
   */
  private getPreviousPeriod(
    startDate: Date,
    endDate: Date,
    period: string
  ): { startDate: Date; endDate: Date } {
    const durationMs = endDate.getTime() - startDate.getTime();
    const previousEndDate = new Date(startDate.getTime() - 1); // 1ms before start
    const previousStartDate = new Date(previousEndDate.getTime() - durationMs);

    return { startDate: previousStartDate, endDate: previousEndDate };
  }

  /**
   * Apply report filters to cost data
   */
  private applyReportFilters(
    costData: CostDataPoint[],
    filters: CostReportFilter[]
  ): CostDataPoint[] {
    if (!filters || filters.length === 0) {
      return costData;
    }

    return costData.filter(point => {
      // All filters must match
      for (const filter of filters) {
        let value: string | undefined;

        // Get the value to compare based on the field
        switch (filter.field) {
          case 'service':
            value = point.serviceType;
            break;
          case 'region':
            value = point.region;
            break;
          case 'account':
            value = point.accountId;
            break;
          case 'resourceType':
            value = point.resourceType;
            break;
          case 'tag':
            if (filter.tagKey) {
              value = point.tags[filter.tagKey];
            }
            break;
          case 'entity':
            // This would require entity mapping, simplified for now
            value = this.getEntityIdFromResourceId(point.resourceId);
            break;
        }

        // If value is undefined, it doesn't match
        if (value === undefined) {
          return false;
        }

        // Compare based on operator
        switch (filter.operator) {
          case 'equals':
            if (value !== filter.value) {
              return false;
            }
            break;
          case 'contains':
            if (typeof filter.value === 'string' && !value.includes(filter.value)) {
              return false;
            }
            break;
          case 'in':
            if (Array.isArray(filter.value) && !filter.value.includes(value)) {
              return false;
            }
            break;
          case 'notIn':
            if (Array.isArray(filter.value) && filter.value.includes(value)) {
              return false;
            }
            break;
        }
      }

      return true;
    });
  }

  /**
   * Apply scope filters to cost data
   */
  private applyScopeFilters(
    costData: CostDataPoint[],
    scope: {
      entityIds?: string[];
      services?: string[];
      regions?: string[];
      tags?: Record<string, string>;
    }
  ): CostDataPoint[] {
    return costData.filter(point => {
      // Filter by services
      if (scope.services && scope.services.length > 0) {
        if (!scope.services.includes(point.serviceType)) {
          return false;
        }
      }

      // Filter by regions
      if (scope.regions && scope.regions.length > 0) {
        if (!scope.regions.includes(point.region)) {
          return false;
        }
      }

      // Filter by tags
      if (scope.tags) {
        for (const [key, value] of Object.entries(scope.tags)) {
          if (point.tags[key] !== value) {
            return false;
          }
        }
      }

      // Filter by entities
      if (scope.entityIds && scope.entityIds.length > 0) {
        const entityId = this.getEntityIdFromResourceId(point.resourceId);
        if (!scope.entityIds.includes(entityId)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Group cost data by specified dimensions
   */
  private groupCostData(
    costData: CostDataPoint[],
    groupBy: ('service' | 'region' | 'account' | 'resourceType' | 'tag' | 'entity')[],
    totalCost: number
  ): CostGrouping[] {
    if (!groupBy || groupBy.length === 0 || costData.length === 0) {
      return [];
    }

    const result: CostGrouping[] = [];
    const primaryGrouping = groupBy[0];
    const groupMap = new Map<string, CostDataPoint[]>();

    // Group data points by primary dimension
    for (const point of costData) {
      let key: string;
      switch (primaryGrouping) {
        case 'service':
          key = point.serviceType;
          break;
        case 'region':
          key = point.region;
          break;
        case 'account':
          key = point.accountId;
          break;
        case 'resourceType':
          key = point.resourceType;
          break;
        case 'entity':
          key = this.getEntityIdFromResourceId(point.resourceId);
          break;
        case 'tag':
          // For simplicity, we'll use the first tag key
          const tagKeys = Object.keys(point.tags);
          key = tagKeys.length > 0 ? `${tagKeys[0]}:${point.tags[tagKeys[0]]}` : 'untagged';
          break;
        default:
          key = 'unknown';
      }

      if (!groupMap.has(key)) {
        groupMap.set(key, []);
      }
      groupMap.get(key)!.push(point);
    }

    // Calculate costs for each group
    for (const [key, points] of groupMap.entries()) {
      const groupCost = points.reduce((sum, point) => sum + point.amount, 0);
      const percentage = totalCost > 0 ? (groupCost / totalCost) * 100 : 0;

      const grouping: CostGrouping = {
        name: key,
        key,
        type: primaryGrouping,
        cost: groupCost,
        percentage
      };

      // Handle nested grouping if requested
      if (groupBy.length > 1) {
        const nestedGroupBy = groupBy.slice(1);
        grouping.children = this.groupCostData(points, nestedGroupBy, groupCost);
      }

      result.push(grouping);
    }

    // Sort by cost (highest first)
    result.sort((a, b) => b.cost - a.cost);

    return result;
  }

  /**
   * Generate a simple forecast based on historical data
   */
  private generateSimpleForecast(
    costData: CostDataPoint[],
    startDate: Date,
    endDate: Date
  ): number {
    if (costData.length === 0) {
      return 0;
    }

    // Calculate daily average cost
    const totalCost = costData.reduce((sum, point) => sum + point.amount, 0);
    const durationDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const dailyAverage = totalCost / Math.max(1, durationDays);

    // Project to end of month/quarter/year
    const now = new Date();
    const endOfPeriod = new Date(now);

    // Determine end of current period
    if (endDate.getMonth() !== now.getMonth() || endDate.getFullYear() !== now.getFullYear()) {
      // If end date is not in current month, use it as is
      return totalCost;
    }

    // Otherwise, project to end of month
    endOfPeriod.setMonth(endOfPeriod.getMonth() + 1);
    endOfPeriod.setDate(0); // Last day of current month

    const remainingDays = (endOfPeriod.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    const projectedAdditionalCost = dailyAverage * Math.max(0, remainingDays);

    return totalCost + projectedAdditionalCost;
  }

  /**
   * Generate forecast periods
   */
  private generateForecastPeriods(
    forecastPeriod: 'month' | 'quarter' | 'year',
    forecastHorizon: number
  ): { period: string; startDate: Date; endDate: Date }[] {
    const periods: { period: string; startDate: Date; endDate: Date }[] = [];
    const now = new Date();

    for (let i = 0; i < forecastHorizon; i++) {
      let startDate: Date;
      let endDate: Date;
      let periodLabel: string;

      switch (forecastPeriod) {
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + i + 1, 0);
          periodLabel = `${startDate.getFullYear()}-${(startDate.getMonth() + 1).toString().padStart(2, '0')}`;
          break;
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3) + i;
          const year = now.getFullYear() + Math.floor(quarter / 4);
          const quarterMonth = (quarter % 4) * 3;
          startDate = new Date(year, quarterMonth, 1);
          endDate = new Date(year, quarterMonth + 3, 0);
          periodLabel = `${year}-Q${Math.floor(quarterMonth / 3) + 1}`;
          break;
        case 'year':
          startDate = new Date(now.getFullYear() + i, 0, 1);
          endDate = new Date(now.getFullYear() + i + 1, 0, 0);
          periodLabel = `${startDate.getFullYear()}`;
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + i + 1, 0);
          periodLabel = `${startDate.getFullYear()}-${(startDate.getMonth() + 1).toString().padStart(2, '0')}`;
      }

      periods.push({
        period: periodLabel,
        startDate,
        endDate
      });
    }

    return periods;
  }

  /**
   * Calculate forecasted costs for each period
   */
  private calculateForecastedCosts(
    costData: CostDataPoint[],
    periods: { period: string; startDate: Date; endDate: Date }[],
    algorithm: string,
    confidenceInterval: number
  ): {
    period: string;
    startDate: Date;
    endDate: Date;
    forecastedCost: number;
    lowerBound: number;
    upperBound: number;
    currency: string;
  }[] {
    // In a real implementation, this would use a forecasting model based on the selected algorithm
    // For now, we'll use a simple projection based on historical data

    // Group historical data by month
    const historicalMonths = new Map<string, number>();
    for (const point of costData) {
      const date = point.timestamp;
      const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!historicalMonths.has(key)) {
        historicalMonths.set(key, 0);
      }
      historicalMonths.set(key, historicalMonths.get(key)! + point.amount);
    }

    // Calculate average monthly cost
    const monthlyValues = Array.from(historicalMonths.values());
    const avgMonthlyCost = monthlyValues.reduce((sum, cost) => sum + cost, 0) / Math.max(1, monthlyValues.length);

    // Calculate standard deviation for confidence intervals
    const variance = monthlyValues.reduce((sum, cost) => sum + Math.pow(cost - avgMonthlyCost, 2), 0) / Math.max(1, monthlyValues.length);
    const stdDev = Math.sqrt(variance);

    // Z-score for confidence interval (e.g., 1.96 for 95% CI)
    const zScore = this.getZScoreForConfidenceInterval(confidenceInterval);

    // Generate forecasts for each period
    const currency = costData.length > 0 ? costData[0].currency : 'USD';
    const results = periods.map((period, index) => {
      // Apply growth factor based on index (simple linear growth)
      const growthFactor = 1 + (index * 0.02); // 2% growth per period
      const forecastedCost = avgMonthlyCost * growthFactor;
      
      // Calculate confidence interval
      const marginOfError = zScore * stdDev;
      const lowerBound = Math.max(0, forecastedCost - marginOfError);
      const upperBound = forecastedCost + marginOfError;

      return {
        period: period.period,
        startDate: period.startDate,
        endDate: period.endDate,
        forecastedCost,
        lowerBound,
        upperBound,
        currency
      };
    });

    return results;
  }

  /**
   * Calculate forecast accuracy
   */
  private calculateForecastAccuracy(costData: CostDataPoint[]): number {
    // In a real implementation, this would calculate MAPE (Mean Absolute Percentage Error)
    // by comparing previous forecasts with actual costs
    // For now, return a placeholder value
    return 85; // 85% accuracy
  }

  /**
   * Get Z-score for confidence interval
   */
  private getZScoreForConfidenceInterval(confidenceInterval: number): number {
    // Common Z-scores for confidence intervals
    switch (confidenceInterval) {
      case 90:
        return 1.645;
      case 95:
        return 1.96;
      case 99:
        return 2.576;
      default:
        return 1.96; // Default to 95% CI
    }
  }

  /**
   * Get budget period dates
   */
  private getBudgetPeriod(budget: Budget): { startDate: Date; endDate: Date } {
    if (budget.period === 'custom' && budget.customPeriod) {
      return {
        startDate: budget.customPeriod.startDate,
        endDate: budget.customPeriod.endDate
      };
    }

    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (budget.period) {
      case 'monthly':
        // Current month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'quarterly':
        // Current quarter
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
        break;
      case 'yearly':
        // Current year
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        // Default to current month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    return { startDate, endDate };
  }

  /**
   * Extract entity ID from resource ID
   */
  private getEntityIdFromResourceId(resourceId: string): string {
    // Assuming resource IDs are in the format "orgId/projectId/resourceName"
    // and we're using projectId as the entity ID
    const parts = resourceId.split('/');
    return parts.length > 1 ? parts[1] : '';
  }
}