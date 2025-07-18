import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email').notNullable().unique();
    table.string('password_hash').notNullable();
    table.string('name').notNullable();
    table.uuid('organization_id').notNullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamp('last_login_at').nullable();
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('organization_id').references('id').inTable('organizations').onDelete('CASCADE');
    
    // Indexes
    table.index(['email']);
    table.index(['organization_id']);
    table.index(['is_active']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('users');
}