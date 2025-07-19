/**
 * Tests for CostAllocationService
 */

import { CostAllocationService } from './CostAllocationService';
import { CostAllocationEntity, CostAllocationRule, CostAllocationCondition, CostDataPoint } from './interfaces';
import { jest, describe, beforeEach, it, expect } from '@jest/globals';

describe('CostAllocationService', () => {
  let allocationService: CostAllocationService;

  beforeEach(() => {
    allocationService = new CostAllocationService();
  });

  describe('createAllocationEntity', () => {
    it('should create a new allocation entity', async () => {
      const entity = await allocationService.createAllocationEntity(
        'Engineering Team',
        'team',
        {
          tags: { department: 'engineering' },
          metadata: { costCenter: 'CC-123' }
        }
      );

      expect(entity).toBeDefined();
      expect(entity.id).toBeDefined();
      expect(entity.name).toBe('Engineering Team');
      expect(entity.type).toBe('team');
      expect(entity.tags.department).toBe('engineering');
      expect(entity.metadata.costCenter).toBe('CC-123');
    });

    it('should create an entity with a parent', async () => {
      const parentEntity = await allocationService.createAllocationEntity(
        'Engineering Department',
        'organization'
      );

      const childEntity = await allocationService.createAllocationEntity(
        'Frontend Team',
        'team',
        {
          parentId: parentEntity.id
        }
      );

      expect(childEntity.parentId).toBe(parentEntity.id);
    });

    it('should throw error for non-existent parent', async () => {
      await expect(
        allocationService.createAllocationEntity(
          'Frontend Team',
          'team',
          {
            parentId: 'non-existent-id'
          }
        )
      ).rejects.toThrow('Parent entity non-existent-id not found');
    });
  });

  describe('updateAllocationEntity', () => {
    let entityId: string;

    beforeEach(async () => {
      const entity = await allocationService.createAllocationEntity(
        'Engineering Team',
        'team'
      );
      entityId = entity.id;
    });

    it('should update entity properties', async () => {
      const updatedEntity = await allocationService.updateAllocationEntity(
        entityId,
        {
          name: 'Engineering Team Updated',
          tags: { department: 'engineering', project: 'cloudweave' }
        }
      );

      expect(updatedEntity.name).toBe('Engineering Team Updated');
      expect(updatedEntity.tags.department).toBe('engineering');
      expect(updatedEntity.tags.project).toBe('cloudweave');
    });

    it('should throw error for non-existent entity', async () => {
      await expect(
        allocationService.updateAllocationEntity(
          'non-existent-id',
          { name: 'Updated Name' }
        )
      ).rejects.toThrow('Allocation entity non-existent-id not found');
    });
  });

  describe('createAllocationRule', () => {
    let entityId: string;

    beforeEach(async () => {
      const entity = await allocationService.createAllocationEntity(
        'Engineering Team',
        'team'
      );
      entityId = entity.id;
    });

    it('should create a new allocation rule', async () => {
      const conditions: CostAllocationCondition[] = [
        {
          field: 'resourceType',
          operator: 'equals',
          value: 'instance'
        },
        {
          field: 'tag',
          operator: 'equals',
          value: 'engineering',
          tagKey: 'department'
        }
      ];

      const rule = await allocationService.createAllocationRule(
        'Engineering EC2 Instances',
        'Allocate EC2 instance costs to engineering team',
        entityId,
        conditions,
        {
          priority: 100,
          createdBy: 'user-123'
        }
      );

      expect(rule).toBeDefined();
      expect(rule.id).toBeDefined();
      expect(rule.name).toBe('Engineering EC2 Instances');
      expect(rule.targetEntityId).toBe(entityId);
      expect(rule.conditions).toHaveLength(2);
      expect(rule.priority).toBe(100);
      expect(rule.enabled).toBe(true);
    });

    it('should throw error for non-existent target entity', async () => {
      const conditions: CostAllocationCondition[] = [
        {
          field: 'resourceType',
          operator: 'equals',
          value: 'instance'
        }
      ];

      await expect(
        allocationService.createAllocationRule(
          'Test Rule',
          'Test description',
          'non-existent-id',
          conditions,
          {
            createdBy: 'user-123'
          }
        )
      ).rejects.toThrow('Target entity non-existent-id not found');
    });

    it('should throw error for empty conditions', async () => {
      await expect(
        allocationService.createAllocationRule(
          'Test Rule',
          'Test description',
          entityId,
          [],
          {
            createdBy: 'user-123'
          }
        )
      ).rejects.toThrow('At least one condition is required');
    });

    it('should throw error for tag condition without tag key', async () => {
      const conditions: CostAllocationCondition[] = [
        {
          field: 'tag',
          operator: 'equals',
          value: 'engineering'
          // Missing tagKey
        }
      ];

      await expect(
        allocationService.createAllocationRule(
          'Test Rule',
          'Test description',
          entityId,
          conditions,
          {
            createdBy: 'user-123'
          }
        )
      ).rejects.toThrow('Tag key is required when field is "tag"');
    });
  });

  describe('allocateCosts', () => {
    let organizationEntityId: string;
    let teamEntityId: string;
    let ruleId: string;

    beforeEach(async () => {
      // Create organization entity
      const orgEntity = await allocationService.createAllocationEntity(
        'Test Organization',
        'organization',
        {
          metadata: { id: 'org-123' }
        }
      );
      organizationEntityId = orgEntity.id;

      // Create team entity
      const teamEntity = await allocationService.createAllocationEntity(
        'Engineering Team',
        'team',
        {
          parentId: organizationEntityId
        }
      );
      teamEntityId = teamEntity.id;

      // Create allocation rule
      const conditions: CostAllocationCondition[] = [
        {
          field: 'resourceType',
          operator: 'equals',
          value: 'instance'
        }
      ];

      const rule = await allocationService.createAllocationRule(
        'Engineering Instances',
        'Allocate instance costs to engineering team',
        teamEntityId,
        conditions,
        {
          createdBy: 'user-123'
        }
      );
      ruleId = rule.id;
    });

    it('should allocate costs based on rules', async () => {
      // Create sample cost data
      const costData: CostDataPoint[] = [
        {
          id: 'cost-1',
          timestamp: new Date('2023-01-15'),
          amount: 100,
          currency: 'USD',
          resourceId: 'org-123/project-1/instance-1',
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
          resourceId: 'org-123/project-1/storage-1',
          resourceType: 'storage',
          serviceType: 'S3',
          region: 'us-east-1',
          usageType: 'StorageUsage',
          usageQuantity: 100,
          usageUnit: 'GB-month',
          provider: 'aws',
          accountId: 'account-123',
          tags: { environment: 'production' },
          metadata: {}
        }
      ];

      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');

      const allocations = await allocationService.allocateCosts(
        costData,
        startDate,
        endDate,
        {
          organizationId: 'org-123'
        }
      );

      expect(allocations).toHaveLength(2);

      // First cost should be allocated to the team (matches rule)
      const teamAllocation = allocations.find(a => a.entityId === teamEntityId);
      expect(teamAllocation).toBeDefined();
      expect(teamAllocation!.costAmount).toBe(100);
      expect(teamAllocation!.ruleId).toBe(ruleId);

      // Second cost should be allocated to organization (unallocated)
      const orgAllocation = allocations.find(a => a.entityId === organizationEntityId);
      expect(orgAllocation).toBeDefined();
      expect(orgAllocation!.costAmount).toBe(50);
      expect(orgAllocation!.metadata.unallocated).toBe(true);
    });
  });

  describe('createCostCenter', () => {
    it('should create a new cost center', async () => {
      const costCenter = await allocationService.createCostCenter(
        'org-123',
        'Engineering',
        'CC-ENG',
        {
          description: 'Engineering department cost center',
          manager: 'user-123',
          tags: { department: 'engineering' }
        }
      );

      expect(costCenter).toBeDefined();
      expect(costCenter.id).toBeDefined();
      expect(costCenter.name).toBe('Engineering');
      expect(costCenter.code).toBe('CC-ENG');
      expect(costCenter.description).toBe('Engineering department cost center');
      expect(costCenter.manager).toBe('user-123');
      expect(costCenter.tags.department).toBe('engineering');
    });

    it('should create a cost center with a parent', async () => {
      const parentCostCenter = await allocationService.createCostCenter(
        'org-123',
        'Technology',
        'CC-TECH'
      );

      const childCostCenter = await allocationService.createCostCenter(
        'org-123',
        'Engineering',
        'CC-ENG',
        {
          parentId: parentCostCenter.id
        }
      );

      expect(childCostCenter.parentId).toBe(parentCostCenter.id);
    });

    it('should throw error for non-existent parent', async () => {
      await expect(
        allocationService.createCostCenter(
          'org-123',
          'Engineering',
          'CC-ENG',
          {
            parentId: 'non-existent-id'
          }
        )
      ).rejects.toThrow('Parent cost center non-existent-id not found');
    });
  });

  describe('allocateEntityToCostCenter', () => {
    let costCenterId: string;
    let entityId: string;

    beforeEach(async () => {
      // Create cost center
      const costCenter = await allocationService.createCostCenter(
        'org-123',
        'Engineering',
        'CC-ENG'
      );
      costCenterId = costCenter.id;

      // Create entity
      const entity = await allocationService.createAllocationEntity(
        'Frontend Team',
        'team'
      );
      entityId = entity.id;
    });

    it('should allocate entity to cost center', async () => {
      const allocation = await allocationService.allocateEntityToCostCenter(
        costCenterId,
        entityId,
        100,
        {
          createdBy: 'user-123'
        }
      );

      expect(allocation).toBeDefined();
      expect(allocation.costCenterId).toBe(costCenterId);
      expect(allocation.entityId).toBe(entityId);
      expect(allocation.percentage).toBe(100);
    });

    it('should throw error for invalid percentage', async () => {
      await expect(
        allocationService.allocateEntityToCostCenter(
          costCenterId,
          entityId,
          150, // Over 100%
          {
            createdBy: 'user-123'
          }
        )
      ).rejects.toThrow('Percentage must be between 0 and 100');
    });

    it('should throw error when total allocation exceeds 100%', async () => {
      // First allocation at 70%
      await allocationService.allocateEntityToCostCenter(
        costCenterId,
        entityId,
        70,
        {
          createdBy: 'user-123'
        }
      );

      // Second allocation at 40% (should fail as 70% + 40% > 100%)
      await expect(
        allocationService.allocateEntityToCostCenter(
          costCenterId,
          entityId,
          40,
          {
            createdBy: 'user-123'
          }
        )
      ).rejects.toThrow('Cannot allocate 40% to cost center');
    });
  });
});