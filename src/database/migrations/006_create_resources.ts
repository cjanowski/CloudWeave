import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('resources', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.string('type').notNullable();
    table.uuid('environment_id').notNullable();
    table.string('cloud_resource_id').notNullable();
    table.enum('status', ['active', 'inactive', 'error']).defaultTo('active');
    table.jsonb('configuration').defaultTo('{}');
    table.jsonb('cost_data').defaultTo('{}');
    table.jsonb('tags').defaultTo('{}');
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('environment_id').references('id').inTable('environments').onDelete('CASCADE');
    
    // Unique constraint for cloud resource ID
    table.unique(['cloud_resource_id']);
    
    // Indexes
    table.index(['environment_id']);
    table.index(['type']);
    table.index(['status']);
    table.index(['name']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('resources');
}