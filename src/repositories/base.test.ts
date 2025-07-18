import { BaseRepository, BaseEntity } from './base';
import { db } from '../database/connection';

// Test entity interface
interface TestEntity extends BaseEntity {
  name: string;
  description?: string;
}

// Test repository implementation
class TestRepository extends BaseRepository<TestEntity> {
  constructor() {
    super('test_entities');
  }
}

describe('BaseRepository', () => {
  let testRepository: TestRepository;

  beforeAll(async () => {
    testRepository = new TestRepository();
    
    // Create test table
    await db.schema.dropTableIfExists('test_entities');
    await db.schema.createTable('test_entities', (table) => {
      table.uuid('id').primary().defaultTo(db.raw('gen_random_uuid()'));
      table.string('name').notNullable();
      table.string('description').nullable();
      table.timestamps(true, true);
    });
  });

  afterAll(async () => {
    await db.schema.dropTableIfExists('test_entities');
    await db.destroy();
  });

  beforeEach(async () => {
    await db('test_entities').del();
  });

  describe('create', () => {
    it('should create a new entity', async () => {
      const data = { name: 'Test Entity', description: 'Test Description' };
      const result = await testRepository.create(data);

      expect(result).toMatchObject({
        id: expect.any(String),
        name: 'Test Entity',
        description: 'Test Description',
        created_at: expect.any(Date),
        updated_at: expect.any(Date)
      });
    });
  });

  describe('findById', () => {
    it('should find entity by id', async () => {
      const created = await testRepository.create({ name: 'Test Entity' });
      const found = await testRepository.findById(created.id);

      expect(found).toMatchObject({
        id: created.id,
        name: 'Test Entity'
      });
    });

    it('should return null for non-existent id', async () => {
      const found = await testRepository.findById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    beforeEach(async () => {
      await testRepository.create({ name: 'Entity 1', description: 'First' });
      await testRepository.create({ name: 'Entity 2', description: 'Second' });
      await testRepository.create({ name: 'Entity 3', description: 'Third' });
    });

    it('should return paginated results', async () => {
      const result = await testRepository.findAll({ limit: 2, offset: 0 });

      expect(result).toMatchObject({
        data: expect.arrayContaining([
          expect.objectContaining({ name: expect.any(String) })
        ]),
        total: 3,
        page: 1,
        limit: 2,
        totalPages: 2
      });
      expect(result.data).toHaveLength(2);
    });

    it('should apply filters', async () => {
      const result = await testRepository.findAll({
        filters: { name: 'Entity 1' }
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Entity 1');
    });

    it('should apply ordering', async () => {
      const result = await testRepository.findAll({
        orderBy: 'name',
        orderDirection: 'asc'
      });

      expect(result.data[0].name).toBe('Entity 1');
      expect(result.data[1].name).toBe('Entity 2');
      expect(result.data[2].name).toBe('Entity 3');
    });
  });

  describe('update', () => {
    it('should update existing entity', async () => {
      const created = await testRepository.create({ name: 'Original Name' });
      const updated = await testRepository.update(created.id, { name: 'Updated Name' });

      expect(updated).toMatchObject({
        id: created.id,
        name: 'Updated Name'
      });
      expect(updated?.updated_at.getTime()).toBeGreaterThan(created.updated_at.getTime());
    });

    it('should return null for non-existent entity', async () => {
      const result = await testRepository.update('non-existent-id', { name: 'New Name' });
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete existing entity', async () => {
      const created = await testRepository.create({ name: 'To Delete' });
      const deleted = await testRepository.delete(created.id);

      expect(deleted).toBe(true);

      const found = await testRepository.findById(created.id);
      expect(found).toBeNull();
    });

    it('should return false for non-existent entity', async () => {
      const result = await testRepository.delete('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('exists', () => {
    it('should return true for existing entity', async () => {
      const created = await testRepository.create({ name: 'Exists' });
      const exists = await testRepository.exists(created.id);

      expect(exists).toBe(true);
    });

    it('should return false for non-existent entity', async () => {
      const exists = await testRepository.exists('non-existent-id');
      expect(exists).toBe(false);
    });
  });

  describe('count', () => {
    beforeEach(async () => {
      await testRepository.create({ name: 'Entity 1', description: 'First' });
      await testRepository.create({ name: 'Entity 2', description: 'Second' });
      await testRepository.create({ name: 'Entity 3', description: 'First' });
    });

    it('should count all entities', async () => {
      const count = await testRepository.count();
      expect(count).toBe(3);
    });

    it('should count with filters', async () => {
      const count = await testRepository.count({ description: 'First' });
      expect(count).toBe(2);
    });
  });
});