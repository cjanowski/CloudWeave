/**
 * Cost Tracking Service
 * Collects, processes, and stores cost data from cloud providers
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';
import {
  CostDataPoint,
  CostImportJob,
  CostDataSource,
  CostQueryParams,
  CostQueryResult,
  CostGrouping
} from './interfaces';

/**
 * Service for tracking and querying cloud cost data
 */
export class CostTrackingService {
  private costDataPoints: Map<string, CostDataPoint> = new Map();
  private importJobs: Map<string, CostImportJob> = new Map();
  private dataSources: Map<string, CostDataSource> = new Map();

  /**
   * Import cost data from a cloud provider
   */
  async importCostData(
    organizationId: string,
    provider: string,
    accountId: string,
    startDate: Date,
    endDate: Date,
    options: {
      dataSourceId?: string;
      forceRefresh?: boolean;
      userId: string;
    }
  ): Promise<CostImportJob> {
    try {
      logger.info(`Starting cost data import for ${provider}:${accountId}`, {
        organizationId,
        provider,
        accountId,
        startDate,
        endDate
      });

      // Create import job
      const jobId = uuidv4();
      const job: CostImportJob = {
        id: jobId,
        organizationId,
        provider,
        accountId,
        status: 'in_progress',
        startDate,
        endDate,
        recordsProcessed: 0,
        recordsImported: 0,
        errors: [],
        startedAt: new Date(),
        createdBy: options.userId,
        metadata: {}
      };

      this.importJobs.set(jobId, job);

      // Get data source if provided
      let dataSource: CostDataSource | undefined;
      if (options.dataSourceId) {
        dataSource = this.dataSources.get(options.dataSourceId);
        if (!dataSource) {
          throw new Error(`Data source ${options.dataSourceId} not found`);
        }
      } else {
        // Find matching data source
        for (const source of this.dataSources.values()) {
          if (
            source.organizationId === organizationId &&
            source.provider === provider &&
            source.accountId === accountId
          ) {
            dataSource = source;
            break;
          }
        }
      }

      if (!dataSource) {
        throw new Error(`No data source configured for ${provider}:${accountId}`);
      }

      // Fetch cost data from provider
      const costData = await this.fetchCostDataFromProvider(
        dataSource,
        startDate,
        endDate,
        options.forceRefresh
      );

      // Process and store cost data
      let importedCount = 0;
      for (const dataPoint of costData) {
        const id = this.generateCostDataPointId(dataPoint);
        dataPoint.id = id;
        this.costDataPoints.set(id, dataPoint);
        importedCount++;
      }

      // Update job status
      job.status = 'completed';
      job.recordsProcessed = costData.length;
      job.recordsImported = importedCount;
      job.completedAt = new Date();

      // Update data source
      dataSource.lastImportAt = new Date();
      dataSource.status = 'active';
      dataSource.updatedAt = new Date();

      logger.info(`Completed cost data import for ${provider}:${accountId}`, {
        organizationId,
        provider,
        accountId,
        recordsProcessed: job.recordsProcessed,
        recordsImported: job.recordsImported
      });

      return job;
    } catch (error) {
      logger.error(`Failed to import cost data for ${provider}:${accountId}`, {
        organizationId,
        provider,
        accountId,
        error
      });

      // Update job with error
      const job = Array.from(this.importJobs.values()).find(
        j =>
          j.organizationId === organizationId &&
          j.provider === provider &&
          j.accountId === accountId &&
          j.status === 'in_progress'
      );

      if (job) {
        job.status = 'failed';
        job.errors.push(error instanceof Error ? error.message : String(error));
        job.completedAt = new Date();
      }

      throw error;
    }
  }

  /**
   * Register a new cost data source
   */
  async registerDataSource(
    organizationId: string,
    name: string,
    provider: string,
    accountId: string,
    credentials: Record<string, any>,
    options: {
      importFrequency?: 'daily' | 'weekly' | 'monthly';
      userId: string;
      metadata?: Record<string, any>;
    }
  ): Promise<CostDataSource> {
    try {
      // Check if data source already exists
      for (const source of this.dataSources.values()) {
        if (
          source.organizationId === organizationId &&
          source.provider === provider &&
          source.accountId === accountId
        ) {
          throw new Error(`Data source for ${provider}:${accountId} already exists`);
        }
      }

      // Validate credentials
      await this.validateProviderCredentials(provider, credentials);

      // Create data source
      const dataSourceId = uuidv4();
      const dataSource: CostDataSource = {
        id: dataSourceId,
        organizationId,
        name,
        provider,
        accountId,
        credentials,
        importFrequency: options.importFrequency || 'daily',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: options.userId,
        metadata: options.metadata || {}
      };

      this.dataSources.set(dataSourceId, dataSource);

      logger.info(`Registered cost data source for ${provider}:${accountId}`, {
        organizationId,
        provider,
        accountId,
        dataSourceId
      });

      return dataSource;
    } catch (error) {
      logger.error(`Failed to register cost data source for ${provider}:${accountId}`, {
        organizationId,
        provider,
        accountId,
        error
      });
      throw error;
    }
  }

  /**
   * Update a cost data source
   */
  async updateDataSource(
    dataSourceId: string,
    updates: {
      name?: string;
      credentials?: Record<string, any>;
      importFrequency?: 'daily' | 'weekly' | 'monthly';
      status?: 'active' | 'inactive';
      metadata?: Record<string, any>;
    }
  ): Promise<CostDataSource> {
    const dataSource = this.dataSources.get(dataSourceId);
    if (!dataSource) {
      throw new Error(`Data source ${dataSourceId} not found`);
    }

    // Update fields
    if (updates.name) {
      dataSource.name = updates.name;
    }

    if (updates.credentials) {
      // Validate credentials
      await this.validateProviderCredentials(dataSource.provider, updates.credentials);
      dataSource.credentials = updates.credentials;
    }

    if (updates.importFrequency) {
      dataSource.importFrequency = updates.importFrequency;
    }

    if (updates.status) {
      dataSource.status = updates.status;
    }

    if (updates.metadata) {
      dataSource.metadata = { ...dataSource.metadata, ...updates.metadata };
    }

    dataSource.updatedAt = new Date();
    this.dataSources.set(dataSourceId, dataSource);

    logger.info(`Updated cost data source ${dataSourceId}`, {
      dataSourceId,
      provider: dataSource.provider,
      accountId: dataSource.accountId
    });

    return dataSource;
  }

  /**
   * Delete a cost data source
   */
  async deleteDataSource(dataSourceId: string): Promise<void> {
    const dataSource = this.dataSources.get(dataSourceId);
    if (!dataSource) {
      throw new Error(`Data source ${dataSourceId} not found`);
    }

    this.dataSources.delete(dataSourceId);

    logger.info(`Deleted cost data source ${dataSourceId}`, {
      dataSourceId,
      provider: dataSource.provider,
      accountId: dataSource.accountId
    });
  }

  /**
   * Get all data sources for an organization
   */
  async getDataSources(organizationId: string): Promise<CostDataSource[]> {
    return Array.from(this.dataSources.values()).filter(
      source => source.organizationId === organizationId
    );
  }

  /**
   * Get a specific data source
   */
  async getDataSource(dataSourceId: string): Promise<CostDataSource | null> {
    return this.dataSources.get(dataSourceId) || null;
  }

  /**
   * Get import job status
   */
  async getImportJob(jobId: string): Promise<CostImportJob | null> {
    return this.importJobs.get(jobId) || null;
  }

  /**
   * Get import jobs for an organization
   */
  async getImportJobs(
    organizationId: string,
    options: {
      status?: 'pending' | 'in_progress' | 'completed' | 'failed';
      provider?: string;
      accountId?: string;
      limit?: number;
    } = {}
  ): Promise<CostImportJob[]> {
    let jobs = Array.from(this.importJobs.values()).filter(
      job => job.organizationId === organizationId
    );

    // Apply filters
    if (options.status) {
      jobs = jobs.filter(job => job.status === options.status);
    }

    if (options.provider) {
      jobs = jobs.filter(job => job.provider === options.provider);
    }

    if (options.accountId) {
      jobs = jobs.filter(job => job.accountId === options.accountId);
    }

    // Sort by started date (newest first)
    jobs.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());

    // Apply limit
    if (options.limit && options.limit > 0) {
      jobs = jobs.slice(0, options.limit);
    }

    return jobs;
  }

  /**
   * Query cost data
   */
  async queryCosts(
    organizationId: string,
    params: CostQueryParams
  ): Promise<CostQueryResult> {
    try {
      logger.info(`Querying costs for organization ${organizationId}`, {
        organizationId,
        startDate: params.startDate,
        endDate: params.endDate
      });

      // Filter cost data points by organization and date range
      let costData = Array.from(this.costDataPoints.values()).filter(
        point =>
          this.getOrganizationIdFromResourceId(point.resourceId) === organizationId &&
          point.timestamp >= params.startDate &&
          point.timestamp <= params.endDate
      );

      // Apply additional filters
      if (params.filters) {
        if (params.filters.services && params.filters.services.length > 0) {
          costData = costData.filter(point => params.filters!.services!.includes(point.serviceType));
        }

        if (params.filters.regions && params.filters.regions.length > 0) {
          costData = costData.filter(point => params.filters!.regions!.includes(point.region));
        }

        if (params.filters.accounts && params.filters.accounts.length > 0) {
          costData = costData.filter(point => params.filters!.accounts!.includes(point.accountId));
        }

        if (params.filters.resourceTypes && params.filters.resourceTypes.length > 0) {
          costData = costData.filter(point =>
            params.filters!.resourceTypes!.includes(point.resourceType)
          );
        }

        if (params.filters.tags) {
          for (const [key, value] of Object.entries(params.filters.tags)) {
            costData = costData.filter(
              point => point.tags[key] !== undefined && point.tags[key] === value
            );
          }
        }

        if (params.filters.entities && params.filters.entities.length > 0) {
          // This would require entity mapping, simplified for now
          costData = costData.filter(point =>
            params.filters!.entities!.includes(this.getEntityIdFromResourceId(point.resourceId))
          );
        }
      }

      // Calculate total cost
      const totalCost = costData.reduce((sum, point) => sum + point.amount, 0);
      const currency = costData.length > 0 ? costData[0].currency : 'USD';

      // Group costs if requested
      let groupedCosts: CostGrouping[] = [];
      if (params.groupBy && params.groupBy.length > 0) {
        groupedCosts = this.groupCostData(costData, params.groupBy, totalCost);
      }

      // Generate time series if requested
      let timeSeries;
      if (params.granularity) {
        timeSeries = this.generateTimeSeries(costData, params.granularity);
      }

      // Calculate metrics if requested
      let metrics;
      if (params.includeMetrics) {
        metrics = this.calculateCostMetrics(costData);
      }

      // Include resource details if requested
      let resourceDetails;
      if (params.includeResourceDetails) {
        resourceDetails = this.getResourceDetails(costData, totalCost);
      }

      return {
        totalCost,
        currency,
        startDate: params.startDate,
        endDate: params.endDate,
        groupedCosts,
        timeSeries,
        metrics,
        resourceDetails
      };
    } catch (error) {
      logger.error(`Failed to query costs for organization ${organizationId}`, {
        organizationId,
        error
      });
      throw error;
    }
  }

  /**
   * Get cost data for a specific resource
   */
  async getResourceCosts(
    resourceId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CostDataPoint[]> {
    return Array.from(this.costDataPoints.values()).filter(
      point =>
        point.resourceId === resourceId &&
        point.timestamp >= startDate &&
        point.timestamp <= endDate
    );
  }

  /**
   * Get cost data for a specific service
   */
  async getServiceCosts(
    organizationId: string,
    serviceType: string,
    startDate: Date,
    endDate: Date
  ): Promise<CostDataPoint[]> {
    return Array.from(this.costDataPoints.values()).filter(
      point =>
        this.getOrganizationIdFromResourceId(point.resourceId) === organizationId &&
        point.serviceType === serviceType &&
        point.timestamp >= startDate &&
        point.timestamp <= endDate
    );
  }

  /**
   * Get cost data for a specific region
   */
  async getRegionCosts(
    organizationId: string,
    region: string,
    startDate: Date,
    endDate: Date
  ): Promise<CostDataPoint[]> {
    return Array.from(this.costDataPoints.values()).filter(
      point =>
        this.getOrganizationIdFromResourceId(point.resourceId) === organizationId &&
        point.region === region &&
        point.timestamp >= startDate &&
        point.timestamp <= endDate
    );
  }

  /**
   * Fetch cost data from a cloud provider
   * This is a placeholder for the actual implementation that would call cloud provider APIs
   */
  private async fetchCostDataFromProvider(
    dataSource: CostDataSource,
    startDate: Date,
    endDate: Date,
    forceRefresh: boolean = false
  ): Promise<CostDataPoint[]> {
    // In a real implementation, this would call the cloud provider's cost API
    // For now, we'll generate some sample data
    const costData: CostDataPoint[] = [];
    const provider = dataSource.provider;
    const accountId = dataSource.accountId;
    const organizationId = dataSource.organizationId;

    // Sample services and resource types
    const services = {
      aws: ['EC2', 'S3', 'RDS', 'Lambda', 'DynamoDB'],
      azure: ['VirtualMachines', 'Storage', 'SQLDatabase', 'Functions', 'CosmosDB'],
      gcp: ['ComputeEngine', 'CloudStorage', 'CloudSQL', 'CloudFunctions', 'Bigtable']
    };

    const resourceTypes = {
      aws: ['instance', 'bucket', 'database', 'function', 'table'],
      azure: ['vm', 'storageaccount', 'sqlserver', 'function', 'cosmosaccount'],
      gcp: ['instance', 'bucket', 'sqlinstance', 'function', 'bigtableinstance']
    };

    const regions = {
      aws: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'],
      azure: ['eastus', 'westus2', 'westeurope', 'southeastasia'],
      gcp: ['us-east1', 'us-west1', 'europe-west1', 'asia-southeast1']
    };

    // Generate data for each day in the range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      // Generate 10-20 data points per day
      const dataPointsPerDay = Math.floor(Math.random() * 11) + 10;

      for (let i = 0; i < dataPointsPerDay; i++) {
        const serviceIndex = Math.floor(Math.random() * 5);
        const regionIndex = Math.floor(Math.random() * 4);
        const serviceType = services[provider as keyof typeof services][serviceIndex];
        const resourceType = resourceTypes[provider as keyof typeof resourceTypes][serviceIndex];
        const region = regions[provider as keyof typeof regions][regionIndex];

        // Generate a resource ID
        const resourceId = `${organizationId}/project-${Math.floor(Math.random() * 3) + 1}/${resourceType}-${Math.floor(Math.random() * 100) + 1}`;

        // Generate cost amount (between $0.01 and $100)
        const amount = Math.random() * 100 + 0.01;
        const usageQuantity = Math.random() * 1000 + 1;

        const dataPoint: CostDataPoint = {
          id: '', // Will be set by the service
          timestamp: new Date(currentDate),
          amount,
          currency: 'USD',
          resourceId,
          resourceType,
          serviceType,
          region,
          usageType: `${serviceType}:${resourceType}`,
          usageQuantity,
          usageUnit: this.getUsageUnit(resourceType),
          provider,
          accountId,
          tags: this.generateRandomTags(),
          metadata: {
            billingPeriod: `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`
          }
        };

        costData.push(dataPoint);
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return costData;
  }

  /**
   * Validate provider credentials
   * This is a placeholder for the actual implementation
   */
  private async validateProviderCredentials(
    provider: string,
    credentials: Record<string, any>
  ): Promise<boolean> {
    // In a real implementation, this would validate the credentials with the provider
    // For now, we'll just check that required fields are present
    switch (provider) {
      case 'aws':
        if (!credentials.accessKeyId || !credentials.secretAccessKey) {
          throw new Error('AWS credentials must include accessKeyId and secretAccessKey');
        }
        break;
      case 'azure':
        if (!credentials.clientId || !credentials.clientSecret || !credentials.tenantId) {
          throw new Error('Azure credentials must include clientId, clientSecret, and tenantId');
        }
        break;
      case 'gcp':
        if (!credentials.serviceAccountKey) {
          throw new Error('GCP credentials must include serviceAccountKey');
        }
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    return true;
  }

  /**
   * Generate a unique ID for a cost data point
   */
  private generateCostDataPointId(dataPoint: CostDataPoint): string {
    // Create a deterministic ID based on the data point properties
    const idComponents = [
      dataPoint.resourceId,
      dataPoint.serviceType,
      dataPoint.timestamp.toISOString(),
      dataPoint.usageType
    ];
    return uuidv4({ name: idComponents.join('|'), namespace: '1b671a64-40d5-491e-99b0-da01ff1f3341' });
  }

  /**
   * Extract organization ID from resource ID
   */
  private getOrganizationIdFromResourceId(resourceId: string): string {
    // Assuming resource IDs are in the format "orgId/projectId/resourceName"
    return resourceId.split('/')[0];
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

  /**
   * Group cost data by specified dimensions
   */
  private groupCostData(
    costData: CostDataPoint[],
    groupBy: ('service' | 'region' | 'account' | 'resourceType' | 'tag' | 'entity')[],
    totalCost: number
  ): CostGrouping[] {
    const result: CostGrouping[] = [];

    // Handle first level grouping
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
   * Generate time series data
   */
  private generateTimeSeries(
    costData: CostDataPoint[],
    granularity: 'daily' | 'weekly' | 'monthly'
  ): { timestamp: Date; cost: number }[] {
    const result: { timestamp: Date; cost: number }[] = [];
    const timeMap = new Map<string, number>();

    // Group costs by time period
    for (const point of costData) {
      let key: string;
      const date = point.timestamp;

      switch (granularity) {
        case 'daily':
          key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
          break;
        case 'weekly':
          // Get the first day of the week (Sunday)
          const firstDayOfWeek = new Date(date);
          const day = date.getDay();
          firstDayOfWeek.setDate(date.getDate() - day);
          key = `${firstDayOfWeek.getFullYear()}-${(firstDayOfWeek.getMonth() + 1).toString().padStart(2, '0')}-${firstDayOfWeek.getDate().toString().padStart(2, '0')}`;
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          break;
      }

      if (!timeMap.has(key)) {
        timeMap.set(key, 0);
      }
      timeMap.set(key, timeMap.get(key)! + point.amount);
    }

    // Convert map to array
    for (const [key, cost] of timeMap.entries()) {
      const [year, month, day] = key.split('-').map(Number);
      const timestamp = day
        ? new Date(year, month - 1, day)
        : new Date(year, month - 1, 1);
      result.push({ timestamp, cost });
    }

    // Sort by timestamp
    result.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return result;
  }

  /**
   * Calculate cost metrics
   */
  private calculateCostMetrics(costData: CostDataPoint[]): {
    averageDailyCost: number;
    peakDailyCost: number;
    costTrend: number;
  } {
    // Group by day
    const dailyCosts = new Map<string, number>();
    for (const point of costData) {
      const date = point.timestamp;
      const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;

      if (!dailyCosts.has(key)) {
        dailyCosts.set(key, 0);
      }
      dailyCosts.set(key, dailyCosts.get(key)! + point.amount);
    }

    // Calculate metrics
    const dailyValues = Array.from(dailyCosts.values());
    const averageDailyCost = dailyValues.reduce((sum, cost) => sum + cost, 0) / Math.max(1, dailyValues.length);
    const peakDailyCost = Math.max(...dailyValues, 0);

    // Calculate trend (comparing first half to second half)
    let costTrend = 0;
    if (dailyValues.length > 1) {
      const midpoint = Math.floor(dailyValues.length / 2);
      const firstHalf = dailyValues.slice(0, midpoint);
      const secondHalf = dailyValues.slice(midpoint);

      const firstHalfAvg = firstHalf.reduce((sum, cost) => sum + cost, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, cost) => sum + cost, 0) / secondHalf.length;

      if (firstHalfAvg > 0) {
        costTrend = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
      }
    }

    return {
      averageDailyCost,
      peakDailyCost,
      costTrend
    };
  }

  /**
   * Get resource details
   */
  private getResourceDetails(
    costData: CostDataPoint[],
    totalCost: number
  ): { resourceId: string; resourceType: string; cost: number; percentage: number }[] {
    const resourceMap = new Map<string, { resourceType: string; cost: number }>();

    // Group by resource
    for (const point of costData) {
      if (!resourceMap.has(point.resourceId)) {
        resourceMap.set(point.resourceId, { resourceType: point.resourceType, cost: 0 });
      }
      resourceMap.get(point.resourceId)!.cost += point.amount;
    }

    // Convert to array and calculate percentages
    const result = Array.from(resourceMap.entries()).map(([resourceId, data]) => ({
      resourceId,
      resourceType: data.resourceType,
      cost: data.cost,
      percentage: totalCost > 0 ? (data.cost / totalCost) * 100 : 0
    }));

    // Sort by cost (highest first)
    result.sort((a, b) => b.cost - a.cost);

    // Limit to top 100 resources
    return result.slice(0, 100);
  }

  /**
   * Get appropriate usage unit for a resource type
   */
  private getUsageUnit(resourceType: string): string {
    switch (resourceType) {
      case 'instance':
      case 'vm':
        return 'hours';
      case 'bucket':
      case 'storageaccount':
        return 'GB-month';
      case 'database':
      case 'sqlserver':
      case 'sqlinstance':
        return 'instance-hours';
      case 'function':
        return 'invocations';
      case 'table':
      case 'cosmosaccount':
      case 'bigtableinstance':
        return 'read/write units';
      default:
        return 'units';
    }
  }

  /**
   * Generate random tags for sample data
   */
  private generateRandomTags(): Record<string, string> {
    const tags: Record<string, string> = {};
    const tagKeys = ['environment', 'department', 'project', 'owner', 'costCenter'];
    const tagValues = {
      environment: ['production', 'staging', 'development', 'testing'],
      department: ['engineering', 'marketing', 'finance', 'operations', 'sales'],
      project: ['website', 'mobile-app', 'data-warehouse', 'crm', 'erp'],
      owner: ['team-a', 'team-b', 'team-c', 'team-d'],
      costCenter: ['cc-1001', 'cc-1002', 'cc-1003', 'cc-1004', 'cc-1005']
    };

    // Add 2-4 random tags
    const numTags = Math.floor(Math.random() * 3) + 2;
    const selectedKeys = this.shuffleArray([...tagKeys]).slice(0, numTags);

    for (const key of selectedKeys) {
      const values = tagValues[key as keyof typeof tagValues];
      const valueIndex = Math.floor(Math.random() * values.length);
      tags[key] = values[valueIndex];
    }

    return tags;
  }

  /**
   * Shuffle array (Fisher-Yates algorithm)
   */
  private shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}