/**
 * Cost Allocation Service
 * Manages cost allocation rules and distributes costs to entities
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';
import {
  CostAllocationEntity,
  CostAllocationRule,
  CostAllocationCondition,
  CostAllocation,
  CostDataPoint,
  CostCenter,
  CostCenterAllocation
} from './interfaces';

/**
 * Service for allocating costs to entities
 */
export class CostAllocationService {
  private allocationEntities: Map<string, CostAllocationEntity> = new Map();
  private allocationRules: Map<string, CostAllocationRule> = new Map();
  private allocations: Map<string, CostAllocation> = new Map();
  private costCenters: Map<string, CostCenter> = new Map();
  private costCenterAllocations: Map<string, CostCenterAllocation> = new Map();

  /**
   * Create a new allocation entity
   */
  async createAllocationEntity(
    name: string,
    type: 'organization' | 'project' | 'team' | 'environment' | 'custom',
    options: {
      parentId?: string;
      tags?: Record<string, string>;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<CostAllocationEntity> {
    try {
      // Validate parent entity if provided
      if (options.parentId && !this.allocationEntities.has(options.parentId)) {
        throw new Error(`Parent entity ${options.parentId} not found`);
      }

      const entityId = uuidv4();
      const now = new Date();

      const entity: CostAllocationEntity = {
        id: entityId,
        name,
        type,
        parentId: options.parentId,
        tags: options.tags || {},
        metadata: options.metadata || {},
        createdAt: now,
        updatedAt: now
      };

      this.allocationEntities.set(entityId, entity);

      logger.info(`Created allocation entity ${name} (${entityId})`, {
        entityId,
        entityType: type,
        parentId: options.parentId
      });

      return entity;
    } catch (error) {
      logger.error(`Failed to create allocation entity ${name}`, { error });
      throw error;
    }
  }

  /**
   * Update an allocation entity
   */
  async updateAllocationEntity(
    entityId: string,
    updates: {
      name?: string;
      parentId?: string;
      tags?: Record<string, string>;
      metadata?: Record<string, any>;
    }
  ): Promise<CostAllocationEntity> {
    const entity = this.allocationEntities.get(entityId);
    if (!entity) {
      throw new Error(`Allocation entity ${entityId} not found`);
    }

    // Update fields
    if (updates.name) {
      entity.name = updates.name;
    }

    if (updates.parentId !== undefined) {
      if (updates.parentId && !this.allocationEntities.has(updates.parentId)) {
        throw new Error(`Parent entity ${updates.parentId} not found`);
      }
      entity.parentId = updates.parentId;
    }

    if (updates.tags) {
      entity.tags = { ...entity.tags, ...updates.tags };
    }

    if (updates.metadata) {
      entity.metadata = { ...entity.metadata, ...updates.metadata };
    }

    entity.updatedAt = new Date();
    this.allocationEntities.set(entityId, entity);

    logger.info(`Updated allocation entity ${entityId}`, {
      entityId,
      entityName: entity.name
    });

    return entity;
  }

  /**
   * Delete an allocation entity
   */
  async deleteAllocationEntity(entityId: string): Promise<void> {
    const entity = this.allocationEntities.get(entityId);
    if (!entity) {
      throw new Error(`Allocation entity ${entityId} not found`);
    }

    // Check if entity has children
    const hasChildren = Array.from(this.allocationEntities.values()).some(
      e => e.parentId === entityId
    );
    if (hasChildren) {
      throw new Error(`Cannot delete entity ${entityId} because it has child entities`);
    }

    // Check if entity is used in allocation rules
    const isUsedInRules = Array.from(this.allocationRules.values()).some(
      rule => rule.targetEntityId === entityId
    );
    if (isUsedInRules) {
      throw new Error(`Cannot delete entity ${entityId} because it is used in allocation rules`);
    }

    this.allocationEntities.delete(entityId);

    logger.info(`Deleted allocation entity ${entityId}`, {
      entityId,
      entityName: entity.name
    });
  }

  /**
   * Get all allocation entities
   */
  async getAllocationEntities(
    options: {
      type?: 'organization' | 'project' | 'team' | 'environment' | 'custom';
      parentId?: string;
    } = {}
  ): Promise<CostAllocationEntity[]> {
    let entities = Array.from(this.allocationEntities.values());

    // Apply filters
    if (options.type) {
      entities = entities.filter(entity => entity.type === options.type);
    }

    if (options.parentId !== undefined) {
      entities = entities.filter(entity => entity.parentId === options.parentId);
    }

    return entities;
  }

  /**
   * Get an allocation entity by ID
   */
  async getAllocationEntity(entityId: string): Promise<CostAllocationEntity | null> {
    return this.allocationEntities.get(entityId) || null;
  }

  /**
   * Create a new allocation rule
   */
  async createAllocationRule(
    name: string,
    description: string,
    targetEntityId: string,
    conditions: CostAllocationCondition[],
    options: {
      priority?: number;
      percentage?: number;
      enabled?: boolean;
      createdBy: string;
    }
  ): Promise<CostAllocationRule> {
    try {
      // Validate target entity
      if (!this.allocationEntities.has(targetEntityId)) {
        throw new Error(`Target entity ${targetEntityId} not found`);
      }

      // Validate conditions
      if (!conditions || conditions.length === 0) {
        throw new Error('At least one condition is required');
      }

      for (const condition of conditions) {
        if (condition.field === 'tag' && !condition.tagKey) {
          throw new Error('Tag key is required when field is "tag"');
        }
      }

      const ruleId = uuidv4();
      const now = new Date();

      const rule: CostAllocationRule = {
        id: ruleId,
        name,
        description,
        priority: options.priority !== undefined ? options.priority : 100,
        targetEntityId,
        conditions,
        percentage: options.percentage,
        enabled: options.enabled !== undefined ? options.enabled : true,
        createdAt: now,
        updatedAt: now,
        createdBy: options.createdBy
      };

      this.allocationRules.set(ruleId, rule);

      logger.info(`Created allocation rule ${name} (${ruleId})`, {
        ruleId,
        targetEntityId,
        conditions: conditions.length
      });

      return rule;
    } catch (error) {
      logger.error(`Failed to create allocation rule ${name}`, { error });
      throw error;
    }
  }

  /**
   * Update an allocation rule
   */
  async updateAllocationRule(
    ruleId: string,
    updates: {
      name?: string;
      description?: string;
      targetEntityId?: string;
      conditions?: CostAllocationCondition[];
      priority?: number;
      percentage?: number;
      enabled?: boolean;
    }
  ): Promise<CostAllocationRule> {
    const rule = this.allocationRules.get(ruleId);
    if (!rule) {
      throw new Error(`Allocation rule ${ruleId} not found`);
    }

    // Update fields
    if (updates.name) {
      rule.name = updates.name;
    }

    if (updates.description) {
      rule.description = updates.description;
    }

    if (updates.targetEntityId) {
      if (!this.allocationEntities.has(updates.targetEntityId)) {
        throw new Error(`Target entity ${updates.targetEntityId} not found`);
      }
      rule.targetEntityId = updates.targetEntityId;
    }

    if (updates.conditions) {
      // Validate conditions
      if (updates.conditions.length === 0) {
        throw new Error('At least one condition is required');
      }

      for (const condition of updates.conditions) {
        if (condition.field === 'tag' && !condition.tagKey) {
          throw new Error('Tag key is required when field is "tag"');
        }
      }

      rule.conditions = updates.conditions;
    }

    if (updates.priority !== undefined) {
      rule.priority = updates.priority;
    }

    if (updates.percentage !== undefined) {
      rule.percentage = updates.percentage;
    }

    if (updates.enabled !== undefined) {
      rule.enabled = updates.enabled;
    }

    rule.updatedAt = new Date();
    this.allocationRules.set(ruleId, rule);

    logger.info(`Updated allocation rule ${ruleId}`, {
      ruleId,
      ruleName: rule.name
    });

    return rule;
  }

  /**
   * Delete an allocation rule
   */
  async deleteAllocationRule(ruleId: string): Promise<void> {
    const rule = this.allocationRules.get(ruleId);
    if (!rule) {
      throw new Error(`Allocation rule ${ruleId} not found`);
    }

    this.allocationRules.delete(ruleId);

    logger.info(`Deleted allocation rule ${ruleId}`, {
      ruleId,
      ruleName: rule.name
    });
  }

  /**
   * Get all allocation rules
   */
  async getAllocationRules(
    options: {
      targetEntityId?: string;
      enabled?: boolean;
    } = {}
  ): Promise<CostAllocationRule[]> {
    let rules = Array.from(this.allocationRules.values());

    // Apply filters
    if (options.targetEntityId) {
      rules = rules.filter(rule => rule.targetEntityId === options.targetEntityId);
    }

    if (options.enabled !== undefined) {
      rules = rules.filter(rule => rule.enabled === options.enabled);
    }

    // Sort by priority (lower number = higher priority)
    rules.sort((a, b) => a.priority - b.priority);

    return rules;
  }

  /**
   * Get an allocation rule by ID
   */
  async getAllocationRule(ruleId: string): Promise<CostAllocationRule | null> {
    return this.allocationRules.get(ruleId) || null;
  }

  /**
   * Allocate costs to entities
   */
  async allocateCosts(
    costData: CostDataPoint[],
    startDate: Date,
    endDate: Date,
    options: {
      organizationId: string;
      recalculate?: boolean;
    }
  ): Promise<CostAllocation[]> {
    try {
      logger.info(`Allocating costs for organization ${options.organizationId}`, {
        organizationId: options.organizationId,
        costDataPoints: costData.length,
        startDate,
        endDate
      });

      // Get all enabled rules
      const rules = await this.getAllocationRules({ enabled: true });

      // Group rules by target entity for split allocations
      const entityRules = new Map<string, CostAllocationRule[]>();
      for (const rule of rules) {
        if (!entityRules.has(rule.targetEntityId)) {
          entityRules.set(rule.targetEntityId, []);
        }
        entityRules.get(rule.targetEntityId)!.push(rule);
      }

      // Process each cost data point
      const allocations: CostAllocation[] = [];
      const unallocatedCosts: CostDataPoint[] = [];

      for (const costPoint of costData) {
        let allocated = false;

        // Try to match rules
        for (const rule of rules) {
          if (this.matchesRule(costPoint, rule)) {
            const entity = this.allocationEntities.get(rule.targetEntityId)!;
            const allocationId = uuidv4();

            // Calculate allocated amount
            const allocatedAmount = rule.percentage
              ? (costPoint.amount * rule.percentage) / 100
              : costPoint.amount;

            const allocation: CostAllocation = {
              id: allocationId,
              entityId: entity.id,
              entityType: entity.type,
              entityName: entity.name,
              costAmount: allocatedAmount,
              currency: costPoint.currency,
              percentage: rule.percentage || 100,
              startDate,
              endDate,
              ruleId: rule.id,
              metadata: {
                resourceId: costPoint.resourceId,
                resourceType: costPoint.resourceType,
                serviceType: costPoint.serviceType,
                region: costPoint.region,
                provider: costPoint.provider,
                accountId: costPoint.accountId
              }
            };

            allocations.push(allocation);
            this.allocations.set(allocationId, allocation);
            allocated = true;

            // If this is a 100% allocation, break the loop
            if (!rule.percentage || rule.percentage === 100) {
              break;
            }
          }
        }

        // If not allocated, add to unallocated costs
        if (!allocated) {
          unallocatedCosts.push(costPoint);
        }
      }

      // Handle unallocated costs
      if (unallocatedCosts.length > 0) {
        logger.warn(`${unallocatedCosts.length} cost data points were not allocated`, {
          organizationId: options.organizationId,
          unallocatedCount: unallocatedCosts.length,
          totalCount: costData.length
        });

        // Allocate to organization by default
        const orgEntity = Array.from(this.allocationEntities.values()).find(
          entity => entity.type === 'organization' && entity.metadata.id === options.organizationId
        );

        if (orgEntity) {
          for (const costPoint of unallocatedCosts) {
            const allocationId = uuidv4();
            const allocation: CostAllocation = {
              id: allocationId,
              entityId: orgEntity.id,
              entityType: orgEntity.type,
              entityName: orgEntity.name,
              costAmount: costPoint.amount,
              currency: costPoint.currency,
              percentage: 100,
              startDate,
              endDate,
              metadata: {
                resourceId: costPoint.resourceId,
                resourceType: costPoint.resourceType,
                serviceType: costPoint.serviceType,
                region: costPoint.region,
                provider: costPoint.provider,
                accountId: costPoint.accountId,
                unallocated: true
              }
            };

            allocations.push(allocation);
            this.allocations.set(allocationId, allocation);
          }
        }
      }

      logger.info(`Allocated ${allocations.length} cost items for organization ${options.organizationId}`, {
        organizationId: options.organizationId,
        allocatedCount: allocations.length,
        unallocatedCount: unallocatedCosts.length
      });

      return allocations;
    } catch (error) {
      logger.error(`Failed to allocate costs for organization ${options.organizationId}`, {
        organizationId: options.organizationId,
        error
      });
      throw error;
    }
  }

  /**
   * Get allocations for an entity
   */
  async getEntityAllocations(
    entityId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CostAllocation[]> {
    return Array.from(this.allocations.values()).filter(
      allocation =>
        allocation.entityId === entityId &&
        allocation.startDate >= startDate &&
        allocation.endDate <= endDate
    );
  }

  /**
   * Get total allocated costs for an entity
   */
  async getEntityTotalCost(
    entityId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ amount: number; currency: string }> {
    const allocations = await this.getEntityAllocations(entityId, startDate, endDate);
    
    if (allocations.length === 0) {
      return { amount: 0, currency: 'USD' };
    }

    const amount = allocations.reduce((sum, allocation) => sum + allocation.costAmount, 0);
    const currency = allocations[0].currency;

    return { amount, currency };
  }

  /**
   * Create a cost center
   */
  async createCostCenter(
    organizationId: string,
    name: string,
    code: string,
    options: {
      description?: string;
      parentId?: string;
      budgetId?: string;
      manager?: string;
      tags?: Record<string, string>;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<CostCenter> {
    try {
      // Validate parent cost center if provided
      if (options.parentId && !this.costCenters.has(options.parentId)) {
        throw new Error(`Parent cost center ${options.parentId} not found`);
      }

      const costCenterId = uuidv4();
      const now = new Date();

      const costCenter: CostCenter = {
        id: costCenterId,
        organizationId,
        name,
        description: options.description || '',
        code,
        parentId: options.parentId,
        budgetId: options.budgetId,
        manager: options.manager,
        tags: options.tags || {},
        createdAt: now,
        updatedAt: now,
        metadata: options.metadata || {}
      };

      this.costCenters.set(costCenterId, costCenter);

      logger.info(`Created cost center ${name} (${costCenterId})`, {
        costCenterId,
        organizationId,
        code
      });

      return costCenter;
    } catch (error) {
      logger.error(`Failed to create cost center ${name}`, { error });
      throw error;
    }
  }

  /**
   * Update a cost center
   */
  async updateCostCenter(
    costCenterId: string,
    updates: {
      name?: string;
      description?: string;
      code?: string;
      parentId?: string;
      budgetId?: string;
      manager?: string;
      tags?: Record<string, string>;
      metadata?: Record<string, any>;
    }
  ): Promise<CostCenter> {
    const costCenter = this.costCenters.get(costCenterId);
    if (!costCenter) {
      throw new Error(`Cost center ${costCenterId} not found`);
    }

    // Update fields
    if (updates.name) {
      costCenter.name = updates.name;
    }

    if (updates.description !== undefined) {
      costCenter.description = updates.description;
    }

    if (updates.code) {
      costCenter.code = updates.code;
    }

    if (updates.parentId !== undefined) {
      if (updates.parentId && !this.costCenters.has(updates.parentId)) {
        throw new Error(`Parent cost center ${updates.parentId} not found`);
      }
      costCenter.parentId = updates.parentId;
    }

    if (updates.budgetId !== undefined) {
      costCenter.budgetId = updates.budgetId;
    }

    if (updates.manager !== undefined) {
      costCenter.manager = updates.manager;
    }

    if (updates.tags) {
      costCenter.tags = { ...costCenter.tags, ...updates.tags };
    }

    if (updates.metadata) {
      costCenter.metadata = { ...costCenter.metadata, ...updates.metadata };
    }

    costCenter.updatedAt = new Date();
    this.costCenters.set(costCenterId, costCenter);

    logger.info(`Updated cost center ${costCenterId}`, {
      costCenterId,
      costCenterName: costCenter.name
    });

    return costCenter;
  }

  /**
   * Delete a cost center
   */
  async deleteCostCenter(costCenterId: string): Promise<void> {
    const costCenter = this.costCenters.get(costCenterId);
    if (!costCenter) {
      throw new Error(`Cost center ${costCenterId} not found`);
    }

    // Check if cost center has children
    const hasChildren = Array.from(this.costCenters.values()).some(
      cc => cc.parentId === costCenterId
    );
    if (hasChildren) {
      throw new Error(`Cannot delete cost center ${costCenterId} because it has child cost centers`);
    }

    // Check if cost center has allocations
    const hasAllocations = Array.from(this.costCenterAllocations.values()).some(
      allocation => allocation.costCenterId === costCenterId
    );
    if (hasAllocations) {
      throw new Error(`Cannot delete cost center ${costCenterId} because it has allocations`);
    }

    this.costCenters.delete(costCenterId);

    logger.info(`Deleted cost center ${costCenterId}`, {
      costCenterId,
      costCenterName: costCenter.name
    });
  }

  /**
   * Get all cost centers
   */
  async getCostCenters(
    organizationId: string,
    options: {
      parentId?: string;
    } = {}
  ): Promise<CostCenter[]> {
    let costCenters = Array.from(this.costCenters.values()).filter(
      cc => cc.organizationId === organizationId
    );

    // Apply filters
    if (options.parentId !== undefined) {
      costCenters = costCenters.filter(cc => cc.parentId === options.parentId);
    }

    return costCenters;
  }

  /**
   * Get a cost center by ID
   */
  async getCostCenter(costCenterId: string): Promise<CostCenter | null> {
    return this.costCenters.get(costCenterId) || null;
  }

  /**
   * Allocate entity to cost center
   */
  async allocateEntityToCostCenter(
    costCenterId: string,
    entityId: string,
    percentage: number,
    options: {
      startDate?: Date;
      endDate?: Date;
      createdBy: string;
    }
  ): Promise<CostCenterAllocation> {
    try {
      // Validate cost center
      if (!this.costCenters.has(costCenterId)) {
        throw new Error(`Cost center ${costCenterId} not found`);
      }

      // Validate entity
      if (!this.allocationEntities.has(entityId)) {
        throw new Error(`Entity ${entityId} not found`);
      }

      // Validate percentage
      if (percentage <= 0 || percentage > 100) {
        throw new Error('Percentage must be between 0 and 100');
      }

      // Check if total allocation would exceed 100%
      const existingAllocations = Array.from(this.costCenterAllocations.values()).filter(
        allocation =>
          allocation.entityId === entityId &&
          (!options.startDate || !allocation.endDate || allocation.endDate >= options.startDate) &&
          (!options.endDate || !allocation.startDate || allocation.startDate <= options.endDate)
      );

      const totalPercentage = existingAllocations.reduce(
        (sum, allocation) => sum + allocation.percentage,
        0
      );

      if (totalPercentage + percentage > 100) {
        throw new Error(
          `Cannot allocate ${percentage}% to cost center ${costCenterId} because total allocation would exceed 100%`
        );
      }

      const allocationId = uuidv4();
      const now = new Date();
      const entity = this.allocationEntities.get(entityId)!;

      const allocation: CostCenterAllocation = {
        id: allocationId,
        costCenterId,
        entityId,
        entityType: entity.type,
        percentage,
        startDate: options.startDate || now,
        endDate: options.endDate,
        createdAt: now,
        updatedAt: now,
        createdBy: options.createdBy
      };

      this.costCenterAllocations.set(allocationId, allocation);

      logger.info(`Allocated entity ${entityId} to cost center ${costCenterId}`, {
        costCenterId,
        entityId,
        percentage
      });

      return allocation;
    } catch (error) {
      logger.error(`Failed to allocate entity ${entityId} to cost center ${costCenterId}`, {
        error
      });
      throw error;
    }
  }

  /**
   * Update cost center allocation
   */
  async updateCostCenterAllocation(
    allocationId: string,
    updates: {
      percentage?: number;
      endDate?: Date;
    }
  ): Promise<CostCenterAllocation> {
    const allocation = this.costCenterAllocations.get(allocationId);
    if (!allocation) {
      throw new Error(`Cost center allocation ${allocationId} not found`);
    }

    // Update fields
    if (updates.percentage !== undefined) {
      // Validate percentage
      if (updates.percentage <= 0 || updates.percentage > 100) {
        throw new Error('Percentage must be between 0 and 100');
      }

      // Check if total allocation would exceed 100%
      const existingAllocations = Array.from(this.costCenterAllocations.values()).filter(
        a =>
          a.entityId === allocation.entityId &&
          a.id !== allocationId &&
          (!allocation.endDate || !a.startDate || a.startDate <= allocation.endDate) &&
          (!allocation.startDate || !a.endDate || a.endDate >= allocation.startDate)
      );

      const totalPercentage = existingAllocations.reduce(
        (sum, a) => sum + a.percentage,
        0
      );

      if (totalPercentage + updates.percentage > 100) {
        throw new Error(
          `Cannot allocate ${updates.percentage}% because total allocation would exceed 100%`
        );
      }

      allocation.percentage = updates.percentage;
    }

    if (updates.endDate !== undefined) {
      allocation.endDate = updates.endDate;
    }

    allocation.updatedAt = new Date();
    this.costCenterAllocations.set(allocationId, allocation);

    logger.info(`Updated cost center allocation ${allocationId}`, {
      allocationId,
      costCenterId: allocation.costCenterId,
      entityId: allocation.entityId
    });

    return allocation;
  }

  /**
   * Delete cost center allocation
   */
  async deleteCostCenterAllocation(allocationId: string): Promise<void> {
    const allocation = this.costCenterAllocations.get(allocationId);
    if (!allocation) {
      throw new Error(`Cost center allocation ${allocationId} not found`);
    }

    this.costCenterAllocations.delete(allocationId);

    logger.info(`Deleted cost center allocation ${allocationId}`, {
      allocationId,
      costCenterId: allocation.costCenterId,
      entityId: allocation.entityId
    });
  }

  /**
   * Get cost center allocations
   */
  async getCostCenterAllocations(
    options: {
      costCenterId?: string;
      entityId?: string;
      active?: boolean;
    } = {}
  ): Promise<CostCenterAllocation[]> {
    let allocations = Array.from(this.costCenterAllocations.values());

    // Apply filters
    if (options.costCenterId) {
      allocations = allocations.filter(
        allocation => allocation.costCenterId === options.costCenterId
      );
    }

    if (options.entityId) {
      allocations = allocations.filter(
        allocation => allocation.entityId === options.entityId
      );
    }

    if (options.active) {
      const now = new Date();
      allocations = allocations.filter(
        allocation =>
          (!allocation.startDate || allocation.startDate <= now) &&
          (!allocation.endDate || allocation.endDate >= now)
      );
    }

    return allocations;
  }

  /**
   * Check if a cost data point matches an allocation rule
   */
  private matchesRule(costPoint: CostDataPoint, rule: CostAllocationRule): boolean {
    // All conditions must match
    for (const condition of rule.conditions) {
      if (!this.matchesCondition(costPoint, condition)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check if a cost data point matches a condition
   */
  private matchesCondition(costPoint: CostDataPoint, condition: CostAllocationCondition): boolean {
    let matches = false;
    let value: string | undefined;

    // Get the value to compare based on the field
    switch (condition.field) {
      case 'resourceId':
        value = costPoint.resourceId;
        break;
      case 'resourceType':
        value = costPoint.resourceType;
        break;
      case 'serviceType':
        value = costPoint.serviceType;
        break;
      case 'region':
        value = costPoint.region;
        break;
      case 'accountId':
        value = costPoint.accountId;
        break;
      case 'tag':
        if (condition.tagKey) {
          value = costPoint.tags[condition.tagKey];
        }
        break;
    }

    // If value is undefined, it can only match 'exists' operator with negate=true
    if (value === undefined) {
      return condition.operator === 'exists' && condition.negate === true;
    }

    // Compare based on operator
    switch (condition.operator) {
      case 'equals':
        matches = value === condition.value;
        break;
      case 'contains':
        matches = typeof condition.value === 'string' && value.includes(condition.value);
        break;
      case 'startsWith':
        matches = typeof condition.value === 'string' && value.startsWith(condition.value);
        break;
      case 'endsWith':
        matches = typeof condition.value === 'string' && value.endsWith(condition.value);
        break;
      case 'regex':
        if (typeof condition.value === 'string') {
          try {
            const regex = new RegExp(condition.value);
            matches = regex.test(value);
          } catch (error) {
            logger.error(`Invalid regex pattern: ${condition.value}`, { error });
            matches = false;
          }
        }
        break;
      case 'exists':
        matches = value !== undefined;
        break;
    }

    // Apply negation if specified
    if (condition.negate) {
      matches = !matches;
    }

    return matches;
  }
}