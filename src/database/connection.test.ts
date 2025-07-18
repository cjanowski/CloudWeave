import { db, testConnection, closeConnection } from './connection';

describe('Database Connection', () => {
  afterAll(async () => {
    await closeConnection();
  });

  describe('testConnection', () => {
    it('should establish database connection successfully', async () => {
      const result = await testConnection();
      expect(result).toBe(true);
    });

    it('should execute basic queries', async () => {
      const result = await db.raw('SELECT 1 as test');
      expect(result.rows[0].test).toBe(1);
    });
  });

  describe('Database Schema', () => {
    it('should have all required tables after migrations', async () => {
      // Check if all tables exist
      const tables = await db.raw(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);

      const tableNames = tables.rows.map((row: any) => row.table_name);
      
      const expectedTables = [
        'applications',
        'configurations',
        'deployment_logs',
        'deployments',
        'environments',
        'knex_migrations',
        'knex_migrations_lock',
        'organizations',
        'permissions',
        'projects',
        'resources',
        'role_permissions',
        'roles',
        'user_roles',
        'users'
      ];

      expectedTables.forEach(table => {
        expect(tableNames).toContain(table);
      });
    });

    it('should have proper foreign key constraints', async () => {
      // Test foreign key constraints exist
      const constraints = await db.raw(`
        SELECT 
          tc.constraint_name,
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        ORDER BY tc.table_name, tc.constraint_name
      `);

      expect(constraints.rows.length).toBeGreaterThan(0);
      
      // Check some key foreign keys exist
      const fkNames = constraints.rows.map((row: any) => 
        `${row.table_name}.${row.column_name} -> ${row.foreign_table_name}.${row.foreign_column_name}`
      );

      expect(fkNames).toContain('users.organization_id -> organizations.id');
      expect(fkNames).toContain('projects.organization_id -> organizations.id');
      expect(fkNames).toContain('environments.project_id -> projects.id');
    });
  });
});