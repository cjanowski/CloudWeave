import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('projects', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.text('description').nullable();
    table.uuid('organization_id').notNullable();
    table.string('cost_center').nullable();
    table.jsonb('tags').defaultTo('{}');
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('organization_id').references('id').inTable('organizations').onDelete('CASCADE');
    
    // Unique constraint for project name within organization
    table.unique(['name', 'organization_id']);
    
    // Indexes
    table.index(['organization_id']);
    table.index(['name']);
    table.index(['cost_center']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('projects');
}