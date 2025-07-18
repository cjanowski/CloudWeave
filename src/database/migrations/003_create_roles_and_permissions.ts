import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create permissions table
  await knex.schema.createTable('permissions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable().unique();
    table.string('resource').notNullable();
    table.string('action').notNullable();
    table.string('description').nullable();
    table.timestamps(true, true);
    
    // Indexes
    table.index(['resource', 'action']);
    table.index(['name']);
  });

  // Create roles table
  await knex.schema.createTable('roles', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.uuid('organization_id').notNullable();
    table.string('description').nullable();
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('organization_id').references('id').inTable('organizations').onDelete('CASCADE');
    
    // Unique constraint for role name within organization
    table.unique(['name', 'organization_id']);
    
    // Indexes
    table.index(['organization_id']);
    table.index(['name']);
  });

  // Create role_permissions junction table
  await knex.schema.createTable('role_permissions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('role_id').notNullable();
    table.uuid('permission_id').notNullable();
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('role_id').references('id').inTable('roles').onDelete('CASCADE');
    table.foreign('permission_id').references('id').inTable('permissions').onDelete('CASCADE');
    
    // Unique constraint to prevent duplicate role-permission assignments
    table.unique(['role_id', 'permission_id']);
    
    // Indexes
    table.index(['role_id']);
    table.index(['permission_id']);
  });

  // Create user_roles junction table
  return knex.schema.createTable('user_roles', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable();
    table.uuid('role_id').notNullable();
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('role_id').references('id').inTable('roles').onDelete('CASCADE');
    
    // Unique constraint to prevent duplicate user-role assignments
    table.unique(['user_id', 'role_id']);
    
    // Indexes
    table.index(['user_id']);
    table.index(['role_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('user_roles');
  await knex.schema.dropTable('role_permissions');
  await knex.schema.dropTable('roles');
  await knex.schema.dropTable('permissions');
}