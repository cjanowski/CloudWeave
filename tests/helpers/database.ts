import { knex } from '../../src/database/connection';
import { execSync } from 'child_process';

export async function setupTestDatabase(): Promise<void> {
  try {
    console.log('Setting up test database...');
    
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/cloudweave_test';
    
    // Run migrations
    await knex.migrate.latest();
    
    // Run seeds
    await knex.seed.run();
    
    console.log('Test database setup complete');
  } catch (error) {
    console.error('Failed to setup test database:', error);
    throw error;
  }
}

export async function cleanupTestDatabase(): Promise<void> {
  try {
    console.log('Cleaning up test database...');
    
    // Rollback all migrations
    await knex.migrate.rollback({}, true);
    
    // Close database connection
    await knex.destroy();
    
    console.log('Test database cleanup complete');
  } catch (error) {
    console.error('Failed to cleanup test database:', error);
    throw error;
  }
}

export async function resetTestDatabase(): Promise<void> {
  try {
    console.log('Resetting test database...');
    
    // Rollback and re-run migrations
    await knex.migrate.rollback({}, true);
    await knex.migrate.latest();
    
    // Re-run seeds
    await knex.seed.run();
    
    console.log('Test database reset complete');
  } catch (error) {
    console.error('Failed to reset test database:', error);
    throw error;
  }
}

export async function truncateAllTables(): Promise<void> {
  try {
    const tables = await knex.raw(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename != 'knex_migrations' 
      AND tablename != 'knex_migrations_lock'
    `);
    
    for (const table of tables.rows) {
      await knex.raw(`TRUNCATE TABLE "${table.tablename}" RESTART IDENTITY CASCADE`);
    }
    
    console.log('All tables truncated');
  } catch (error) {
    console.error('Failed to truncate tables:', error);
    throw error;
  }
}

export async function createTestUser(userData: {
  email: string;
  password: string;
  organizationId: string;
  role?: string;
}): Promise<any> {
  try {
    const user = await knex('users').insert({
      email: userData.email,
      password_hash: userData.password, // In real implementation, this would be hashed
      organization_id: userData.organizationId,
      role: userData.role || 'user',
      created_at: new Date(),
      updated_at: new Date()
    }).returning('*');
    
    return user[0];
  } catch (error) {
    console.error('Failed to create test user:', error);
    throw error;
  }
}

export async function createTestOrganization(orgData: {
  name: string;
  settings?: any;
}): Promise<any> {
  try {
    const organization = await knex('organizations').insert({
      name: orgData.name,
      settings: JSON.stringify(orgData.settings || {}),
      created_at: new Date(),
      updated_at: new Date()
    }).returning('*');
    
    return organization[0];
  } catch (error) {
    console.error('Failed to create test organization:', error);
    throw error;
  }
}

export async function createTestProject(projectData: {
  name: string;
  organizationId: string;
  description?: string;
}): Promise<any> {
  try {
    const project = await knex('projects').insert({
      name: projectData.name,
      organization_id: projectData.organizationId,
      description: projectData.description || '',
      created_at: new Date(),
      updated_at: new Date()
    }).returning('*');
    
    return project[0];
  } catch (error) {
    console.error('Failed to create test project:', error);
    throw error;
  }
}

export async function createTestEnvironment(envData: {
  name: string;
  projectId: string;
  type: string;
  cloudProvider: string;
  region: string;
}): Promise<any> {
  try {
    const environment = await knex('environments').insert({
      name: envData.name,
      project_id: envData.projectId,
      type: envData.type,
      cloud_provider: envData.cloudProvider,
      region: envData.region,
      created_at: new Date(),
      updated_at: new Date()
    }).returning('*');
    
    return environment[0];
  } catch (error) {
    console.error('Failed to create test environment:', error);
    throw error;
  }
}